use async_trait::async_trait;
use serde::{Deserialize, Serialize};

use crate::errors::CoreError;

#[derive(Debug, Clone)]
pub struct LlmContext {
    pub summary: String,
    pub next_focus: Vec<String>,
}

#[async_trait]
pub trait LlmCoach: Send + Sync {
    async fn coach(&self, context: &LlmContext) -> Result<String, CoreError>;
}

#[derive(Default)]
pub struct RuleBasedCoach;

#[async_trait]
impl LlmCoach for RuleBasedCoach {
    async fn coach(&self, context: &LlmContext) -> Result<String, CoreError> {
        let mut response = format!("Session summary: {}.", context.summary);
        if !context.next_focus.is_empty() {
            response.push_str(&format!(
                " Next, focus on: {}.",
                context.next_focus.join(", ")
            ));
        }
        Ok(response)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LlmProvider {
    OpenAiCompatible,
    Groq,
    OpenRouter,
}

#[derive(Debug, Clone)]
pub struct LlmProviderConfig {
    pub provider: LlmProvider,
    pub api_key: String,
    pub model: String,
    pub base_url: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    temperature: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Clone, Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Clone, Deserialize)]
struct Choice {
    message: ChatMessage,
}

pub struct HttpLlmCoach {
    http: reqwest::Client,
    cfg: LlmProviderConfig,
}

impl HttpLlmCoach {
    pub fn new(cfg: LlmProviderConfig) -> Result<Self, CoreError> {
        if cfg.api_key.trim().is_empty() {
            return Err(CoreError::Validation("LLM api key must not be empty".into()));
        }
        if cfg.model.trim().is_empty() {
            return Err(CoreError::Validation("LLM model must not be empty".into()));
        }
        Ok(Self {
            http: reqwest::Client::new(),
            cfg,
        })
    }

    pub fn provider_name(&self) -> &'static str {
        match self.cfg.provider {
            LlmProvider::OpenAiCompatible => "openai-compatible",
            LlmProvider::Groq => "groq",
            LlmProvider::OpenRouter => "openrouter",
        }
    }

    fn chat_url(&self) -> String {
        if let Some(base_url) = &self.cfg.base_url {
            let trimmed = base_url.trim_end_matches('/');
            if trimmed.ends_with("/chat/completions") {
                return trimmed.to_string();
            }
            return format!("{trimmed}/chat/completions");
        }

        match self.cfg.provider {
            LlmProvider::OpenAiCompatible => {
                "https://api.openai.com/v1/chat/completions".to_string()
            }
            LlmProvider::Groq => "https://api.groq.com/openai/v1/chat/completions".to_string(),
            LlmProvider::OpenRouter => "https://openrouter.ai/api/v1/chat/completions".to_string(),
        }
    }
}

#[async_trait]
impl LlmCoach for HttpLlmCoach {
    async fn coach(&self, context: &LlmContext) -> Result<String, CoreError> {
        let request = ChatRequest {
            model: self.cfg.model.clone(),
            messages: vec![
                ChatMessage {
                    role: "system".into(),
                    content: "You are a supportive non-diagnostic voice training coach. Keep feedback concrete and concise.".into(),
                },
                ChatMessage {
                    role: "user".into(),
                    content: format!(
                        "Session summary:\n{}\n\nFocus next on:\n{}",
                        context.summary,
                        context.next_focus.join(", ")
                    ),
                },
            ],
            temperature: 0.2,
        };

        let mut req = self
            .http
            .post(self.chat_url())
            .bearer_auth(&self.cfg.api_key)
            .json(&request);

        if self.cfg.provider == LlmProvider::OpenRouter {
            req = req.header("HTTP-Referer", "https://voice-training-app.local");
        }

        let response: ChatResponse = req
            .send()
            .await
            .map_err(|e| CoreError::Tool(format!("LLM request failed: {e}")))?
            .error_for_status()
            .map_err(|e| CoreError::Tool(format!("LLM response status error: {e}")))?
            .json()
            .await
            .map_err(|e| CoreError::Tool(format!("LLM response parse failed: {e}")))?;

        response
            .choices
            .first()
            .map(|c| c.message.content.clone())
            .ok_or_else(|| CoreError::Tool("LLM returned no choices".into()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_default_urls_per_provider() {
        let openrouter = HttpLlmCoach::new(LlmProviderConfig {
            provider: LlmProvider::OpenRouter,
            api_key: "k".into(),
            model: "m".into(),
            base_url: None,
        })
        .expect("coach");
        assert_eq!(
            openrouter.chat_url(),
            "https://openrouter.ai/api/v1/chat/completions"
        );

        let groq = HttpLlmCoach::new(LlmProviderConfig {
            provider: LlmProvider::Groq,
            api_key: "k".into(),
            model: "m".into(),
            base_url: None,
        })
        .expect("coach");
        assert_eq!(groq.chat_url(), "https://api.groq.com/openai/v1/chat/completions");
    }

    #[test]
    fn appends_chat_path_for_custom_base_url() {
        let coach = HttpLlmCoach::new(LlmProviderConfig {
            provider: LlmProvider::OpenAiCompatible,
            api_key: "k".into(),
            model: "m".into(),
            base_url: Some("http://localhost:1234/v1".into()),
        })
        .expect("coach");
        assert_eq!(coach.chat_url(), "http://localhost:1234/v1/chat/completions");
    }
}
