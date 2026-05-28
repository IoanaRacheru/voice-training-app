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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::Config;
    use app_core::{
        llm::RuleBasedCoach,
        tools::{HeuristicProsodyTool, HeuristicVoicePresentationTool},
        Engine,
    };
    use mongodb::Client;
    use crate::repositories::analysis::MongoAnalysisRepository;

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
                server_port: 3000,
                llm_provider: "openrouter".into(),
                llm_api_key: None,
                llm_model: "openai/gpt-4o-mini".into(),
                llm_base_url: None,
                openrouter_api_key: Some("test-key".into()),
                openrouter_model: "meta-llama/llama-3.3-70b-instruct".into(),
                groq_api_key: None,
                groq_model: "llama-3.3-70b-versatile".into(),
            }),
            http: reqwest::Client::new(),
            jwks: Vec::new(),
            engine: Arc::new(Engine::new(
                Box::new(HeuristicProsodyTool),
                Box::new(HeuristicVoicePresentationTool),
                Box::new(RuleBasedCoach),
            )),
            llm_provider: "openrouter".into(),
            analysis_repo: Arc::new(MongoAnalysisRepository::new(client.database("voice_training"))),
        });

        let Json(payload) = health(State(state)).await;
        assert_eq!(payload["effective_provider"], "openrouter");
        assert_eq!(payload["openrouter_configured"], true);
        assert_eq!(payload["groq_configured"], false);
    }
}
