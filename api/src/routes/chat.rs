use std::sync::Arc;

use app_core::llm::{
    HttpLlmCoach, LlmCoach, LlmContext, LlmProvider, LlmProviderConfig,
};
use axum::{Extension, Json, Router, extract::State, routing::post};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::{AppState, auth::AppwriteUser, errors::AppError};

pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/api/chat", post(chat))
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct ChatRequest {
    pub message: String,
    pub context: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ChatResponse {
    pub reply: String,
}

fn build_rule_reply(message: &str, has_context: bool) -> String {
    let compact = message.to_ascii_lowercase();
    if ["hi", "hello", "hey", "yo", "salut"].contains(&compact.trim()) {
        return if has_context {
            "Hi. Tell me what felt unstable in your last exercise, and I will suggest one drill."
                .into()
        } else {
            "Hi. Tell me your voice goal and what felt hardest today.".into()
        };
    }

    if compact.contains("pitch") && compact.contains("steady") {
        return "Use 20-second gentle hums. Stop immediately if throat tension appears, reset with one breath, then continue softer.".into();
    }
    if compact.contains("tension") || compact.contains("tight") {
        return "Reduce loudness by one level and shorten each repetition. Prioritize comfort, then rebuild duration gradually.".into();
    }

    if has_context {
        "Give me one concrete symptom from the last attempt (pitch jump, breath loss, or throat tension), and I will give one targeted drill.".into()
    } else {
        "Describe one current voice difficulty and I will give a short focused drill.".into()
    }
}

#[utoipa::path(post, path = "/api/chat", tag = "Chat", security(("bearer_auth"=[])), request_body=ChatRequest, responses((status=200, body=ChatResponse)))]
pub async fn chat(
    State(state): State<Arc<AppState>>,
    Extension(_user): Extension<AppwriteUser>,
    Json(body): Json<ChatRequest>,
) -> Result<Json<ChatResponse>, AppError> {
    let message = body.message.trim();
    if message.is_empty() {
        return Err(AppError::Validation("message must not be empty".into()));
    }

    let compact_context = body
        .context
        .as_deref()
        .map(str::trim)
        .filter(|c| !c.is_empty());
    if state.config.llm_provider == "rule" {
        return Ok(Json(ChatResponse {
            reply: build_rule_reply(message, compact_context.is_some()),
        }));
    }

    let coach: Box<dyn LlmCoach> = match state.config.llm_provider.as_str() {
        "openrouter" => state
            .config
            .openrouter_api_key
            .as_ref()
            .ok_or_else(|| AppError::Validation("OPENROUTER_API_KEY is not configured".into()))
            .and_then(|key| {
                HttpLlmCoach::new(LlmProviderConfig {
                    provider: LlmProvider::OpenRouter,
                    api_key: key.clone(),
                    model: state.config.openrouter_model.clone(),
                    base_url: None,
                })
                .map_err(|err| AppError::Validation(format!("openrouter config invalid: {err}")))
            })
            .map(|c| Box::new(c) as Box<dyn LlmCoach>)?,
        "groq" => state
            .config
            .groq_api_key
            .as_ref()
            .ok_or_else(|| AppError::Validation("GROQ_API_KEY is not configured".into()))
            .and_then(|key| {
                HttpLlmCoach::new(LlmProviderConfig {
                    provider: LlmProvider::Groq,
                    api_key: key.clone(),
                    model: state.config.groq_model.clone(),
                    base_url: None,
                })
                .map_err(|err| AppError::Validation(format!("groq config invalid: {err}")))
            })
            .map(|c| Box::new(c) as Box<dyn LlmCoach>)?,
        "openai" => state
            .config
            .llm_api_key
            .as_ref()
            .ok_or_else(|| AppError::Validation("LLM_API_KEY is not configured".into()))
            .and_then(|key| {
                HttpLlmCoach::new(LlmProviderConfig {
                    provider: LlmProvider::OpenAiCompatible,
                    api_key: key.clone(),
                    model: state.config.llm_model.clone(),
                    base_url: state.config.llm_base_url.clone(),
                })
                .map_err(|err| AppError::Validation(format!("openai config invalid: {err}")))
            })
            .map(|c| Box::new(c) as Box<dyn LlmCoach>)?,
        other => {
            return Err(AppError::Validation(format!(
                "Unsupported LLM_PROVIDER '{other}'. Expected one of: rule|openai|openrouter|groq"
            )));
        }
    };

    let prompt = match compact_context {
        Some(context) => {
            format!("User message: {}\n\nRecent context:\n{}", message, context)
        }
        _ => message.to_string(),
    };

    let reply = coach
        .coach(&LlmContext {
            summary: prompt,
            next_focus: vec![
                "steady breath support".into(),
                "consistent resonance placement".into(),
            ],
        })
        .await
        .map_err(|e| AppError::Validation(format!("chat generation failed: {e}")))?;

    Ok(Json(ChatResponse { reply }))
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use app_core::{
        Engine,
        asr::{SimplePronunciationEvaluator, VoskAsrStub},
        dsp::EnergyVadDetector,
        llm::RuleBasedCoach,
        tools::{DeterministicDspProsodyTool, DeterministicDspVoicePresentationTool},
    };
    use axum::{Extension, Json, extract::State};
    use mongodb::Client;
    use tokio::sync::RwLock;

    use super::{ChatRequest, chat};
    use crate::{
        AppState,
        auth::AppwriteUser,
        config::Config,
        repositories::{
            analysis::MongoAnalysisRepository, challenge::MongoChallengeRepository,
            profile::MongoProfileRepository, session::MongoSessionRepository,
        },
    };

    async fn build_state() -> Arc<AppState> {
        let client = Client::with_uri_str("mongodb://127.0.0.1:27017")
            .await
            .expect("mongodb uri should parse");
        Arc::new(AppState {
            db: client.database("voice_training"),
            config: Arc::new(Config {
                mongodb_uri: "mongodb://127.0.0.1:27017".into(),
                keycloak_realm_url:
                    "http://localhost:8080/realms/voice-training/protocol/openid-connect/certs"
                        .into(),
                keycloak_expected_issuer: "http://localhost:8080/realms/voice-training".into(),
                keycloak_expected_audiences: vec!["account".into()],
                analyze_max_body_bytes: 1024 * 1024,
                server_port: 3000,
                llm_provider: "rule".into(),
                llm_api_key: None,
                llm_model: "openai/gpt-4o-mini".into(),
                llm_base_url: None,
                openrouter_api_key: None,
                openrouter_model: "meta-llama/llama-3.3-70b-instruct".into(),
                groq_api_key: None,
                groq_model: "llama-3.3-70b-versatile".into(),
                vad_provider: "energy".into(),
                asr_provider: "stub".into(),
                vosk_server_url: None,
                provider_strict: false,
            }),
            http: reqwest::Client::new(),
            jwks: Arc::new(RwLock::new(Vec::new())),
            engine: Arc::new(Engine::new(
                Box::new(DeterministicDspProsodyTool),
                Box::new(DeterministicDspVoicePresentationTool),
                Box::new(RuleBasedCoach),
                Box::new(VoskAsrStub),
                Box::new(SimplePronunciationEvaluator),
                Box::new(EnergyVadDetector),
            )),
            llm_provider: "rule".into(),
            analysis_repo: Arc::new(MongoAnalysisRepository::new(
                client.database("voice_training"),
            )),
            profile_repo: Arc::new(MongoProfileRepository::new(
                client.database("voice_training"),
            )),
            session_repo: Arc::new(MongoSessionRepository::new(
                client.database("voice_training"),
            )),
            challenge_repo: Arc::new(MongoChallengeRepository::new(
                client.database("voice_training"),
            )),
        })
    }

    #[tokio::test]
    async fn chat_rejects_empty_message() {
        let state = build_state().await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };
        let err = chat(
            State(state),
            Extension(user),
            Json(ChatRequest {
                message: "   ".into(),
                context: None,
            }),
        )
        .await
        .expect_err("must reject empty");
        assert!(err.to_string().contains("message"));
    }

    #[tokio::test]
    async fn chat_returns_reply_for_valid_message() {
        let state = build_state().await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };
        let Json(payload) = chat(
            State(state),
            Extension(user),
            Json(ChatRequest {
                message: "I need help with steady pitch".into(),
                context: Some("last score 72".into()),
            }),
        )
        .await
        .expect("chat ok");
        assert!(!payload.reply.trim().is_empty());
    }
}
