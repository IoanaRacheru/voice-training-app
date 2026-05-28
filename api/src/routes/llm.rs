use std::sync::Arc;

use axum::{extract::State, routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::AppState;

/// LLM configuration and readiness metadata.
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct LlmHealthResponse {
    /// Configured provider from environment.
    pub configured_provider: String,
    /// Effective provider selected at runtime.
    pub effective_provider: String,
    /// Whether OpenRouter credentials are configured.
    pub openrouter_configured: bool,
    /// Whether Groq credentials are configured.
    pub groq_configured: bool,
    /// Whether generic OpenAI-compatible credentials are configured.
    pub openai_configured: bool,
    /// OpenRouter model identifier.
    pub openrouter_model: String,
    /// Groq model identifier.
    pub groq_model: String,
    /// OpenAI-compatible model identifier.
    pub openai_model: String,
}

/// Register LLM routes.
pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/api/llm/health", get(health))
}

/// Return runtime LLM health and configuration metadata.
#[utoipa::path(
    get,
    path = "/api/llm/health",
    tag = "LLM",
    responses((status = 200, description = "LLM health", body = LlmHealthResponse))
)]
pub async fn health(State(state): State<Arc<AppState>>) -> Json<LlmHealthResponse> {
    Json(LlmHealthResponse {
        configured_provider: state.config.llm_provider.clone(),
        effective_provider: state.llm_provider.clone(),
        openrouter_configured: state.config.openrouter_api_key.is_some(),
        groq_configured: state.config.groq_api_key.is_some(),
        openai_configured: state.config.llm_api_key.is_some(),
        openrouter_model: state.config.openrouter_model.clone(),
        groq_model: state.config.groq_model.clone(),
        openai_model: state.config.llm_model.clone(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::Config;
    use app_core::{
        asr::{SimplePronunciationEvaluator, VoskAsrStub},
        dsp::EnergyVadDetector,
        llm::RuleBasedCoach,
        tools::{HeuristicProsodyTool, HeuristicVoicePresentationTool},
        Engine,
    };
use mongodb::Client;
    use tokio::sync::RwLock;
    use crate::repositories::{
        analysis::MongoAnalysisRepository,
        profile::MongoProfileRepository,
        session::MongoSessionRepository,
    };

    #[tokio::test]
    async fn llm_health_reports_provider_configuration() {
        let client = Client::with_uri_str("mongodb://127.0.0.1:27017")
            .await
            .expect("mongodb uri should parse");
        let state = Arc::new(AppState {
            db: client.database("voice_training"),
            config: Arc::new(Config {
                mongodb_uri: "mongodb://127.0.0.1:27017".into(),
                keycloak_realm_url: "http://localhost:8080/realms/voice-training/protocol/openid-connect/certs".into(),
                keycloak_expected_issuer: "http://localhost:8080/realms/voice-training".into(),
                keycloak_expected_audiences: vec!["account".into()],
                analyze_max_body_bytes: 1024 * 1024,
                server_port: 3000,
                llm_provider: "openrouter".into(),
                llm_api_key: None,
                llm_model: "openai/gpt-4o-mini".into(),
                llm_base_url: None,
                openrouter_api_key: Some("test-key".into()),
                openrouter_model: "meta-llama/llama-3.3-70b-instruct".into(),
                groq_api_key: None,
                groq_model: "llama-3.3-70b-versatile".into(),
                vad_provider: "energy".into(),
                asr_provider: "stub".into(),
                vosk_model_path: None,
            }),
            http: reqwest::Client::new(),
            jwks: Arc::new(RwLock::new(Vec::new())),
            engine: Arc::new(Engine::new(
                Box::new(HeuristicProsodyTool),
                Box::new(HeuristicVoicePresentationTool),
                Box::new(RuleBasedCoach),
                Box::new(VoskAsrStub),
                Box::new(SimplePronunciationEvaluator),
                Box::new(EnergyVadDetector),
            )),
            llm_provider: "openrouter".into(),
            analysis_repo: Arc::new(MongoAnalysisRepository::new(client.database("voice_training"))),
            profile_repo: Arc::new(MongoProfileRepository::new(client.database("voice_training"))),
            session_repo: Arc::new(MongoSessionRepository::new(client.database("voice_training"))),
        });

        let Json(payload) = health(State(state)).await;
        assert_eq!(payload.effective_provider, "openrouter");
        assert!(payload.openrouter_configured);
        assert!(!payload.groq_configured);
    }
}
