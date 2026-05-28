use async_trait::async_trait;

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
