use std::sync::Arc;

use axum::{extract::State, routing::get, Json, Router};

use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/api/llm/health", get(health))
}

async fn health(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "configured_provider": state.config.llm_provider,
        "effective_provider": state.llm_provider,
        "openrouter_configured": state.config.openrouter_api_key.is_some(),
        "groq_configured": state.config.groq_api_key.is_some(),
        "openai_configured": state.config.llm_api_key.is_some(),
        "openrouter_model": state.config.openrouter_model,
        "groq_model": state.config.groq_model,
        "openai_model": state.config.llm_model,
    }))
}
