use std::sync::Arc;

use app_core::AnalysisInput;
use axum::{
    extract::State,
    routing::post,
    Extension, Json, Router,
};
use mongodb::bson::DateTime;
use serde::Deserialize;

use crate::{
    auth::AppwriteUser,
    errors::AppError,
    repositories::analysis::AnalysisArtifact,
    AppState,
};

/// Register analysis routes.
pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/api/analyze", post(analyze))
}

/// Request body for on-demand voice analysis.
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AnalyzeRequest {
    /// Median pitch estimate in Hz.
    pub median_pitch_hz: f64,
    /// Pitch stability score in `[0, 1]`.
    pub pitch_stability: f64,
    /// Pause ratio in `[0, 1]`.
    pub pause_ratio: f64,
    /// Spectral brightness score in `[0, 1]`.
    pub spectral_brightness: f64,
}

async fn analyze(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Json(body): Json<AnalyzeRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let output = state
        .engine
        .analyze(AnalysisInput {
            median_pitch_hz: body.median_pitch_hz,
            pitch_stability: body.pitch_stability,
            pause_ratio: body.pause_ratio,
            spectral_brightness: body.spectral_brightness,
        })
        .await
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let artifact = AnalysisArtifact {
        user_id: user.id,
        created_at: DateTime::now(),
        summary: output.summary.clone(),
        voice_presentation_score: output.voice_presentation.score,
        voice_presentation_confidence: output.voice_presentation.confidence,
    };
    state.analysis_repo.insert_analysis(&artifact).await?;

    Ok(Json(serde_json::json!({
        "summary": output.summary,
        "practice_next": output.practice_next,
        "llm_coach_feedback": output.llm_coach_feedback,
        "prosody": output.prosody,
        "voice_presentation": output.voice_presentation,
    })))
}

#[cfg(test)]
mod tests {
    use std::sync::{Arc, Mutex};

    use super::{analyze, AnalyzeRequest};
    use crate::{
        auth::AppwriteUser,
        config::Config,
        repositories::analysis::{AnalysisArtifact, AnalysisRepository},
        AppState,
    };
    use app_core::{
        llm::RuleBasedCoach,
        tools::{HeuristicProsodyTool, HeuristicVoicePresentationTool},
        Engine,
    };
    use async_trait::async_trait;
    use axum::{extract::State, Extension, Json};
    use mongodb::{bson::DateTime, Client};
    use reqwest::Client as HttpClient;

    struct MemoryAnalysisRepository {
        saved: Arc<Mutex<Vec<AnalysisArtifact>>>,
    }

    #[async_trait]
    impl AnalysisRepository for MemoryAnalysisRepository {
        async fn insert_analysis(
            &self,
            artifact: &AnalysisArtifact,
        ) -> Result<(), mongodb::error::Error> {
            self.saved.lock().expect("lock").push(AnalysisArtifact {
                user_id: artifact.user_id.clone(),
                created_at: DateTime::now(),
                summary: artifact.summary.clone(),
                voice_presentation_score: artifact.voice_presentation_score,
                voice_presentation_confidence: artifact.voice_presentation_confidence,
            });
            Ok(())
        }
    }

    #[test]
    fn parse_valid_payload() {
        let payload = r#"{
            "median_pitch_hz": 180.0,
            "pitch_stability": 0.72,
            "pause_ratio": 0.2,
            "spectral_brightness": 0.62
        }"#;
        let parsed: AnalyzeRequest = serde_json::from_str(payload).expect("valid payload");
        assert_eq!(parsed.median_pitch_hz, 180.0);
    }

    #[test]
    fn reject_unknown_fields() {
        let payload = r#"{
            "median_pitch_hz": 180.0,
            "pitch_stability": 0.72,
            "pause_ratio": 0.2,
            "spectral_brightness": 0.62,
            "extra": 1
        }"#;
        let err = serde_json::from_str::<AnalyzeRequest>(payload).expect_err("must fail");
        assert!(err.to_string().contains("unknown field"));
    }

    #[tokio::test]
    async fn analyze_persists_artifact_and_returns_payload() {
        let mongo = Client::with_uri_str("mongodb://127.0.0.1:27017")
            .await
            .expect("mongodb uri should parse");

        let saved = Arc::new(Mutex::new(Vec::new()));
        let state = Arc::new(AppState {
            db: mongo.database("voice_training"),
            config: Arc::new(Config {
                mongodb_uri: "mongodb://127.0.0.1:27017".into(),
                keycloak_realm_url:
                    "http://localhost:8080/realms/voice-training/protocol/openid-connect/certs"
                        .into(),
                server_port: 3000,
                llm_provider: "rule".into(),
                llm_api_key: None,
                llm_model: "openai/gpt-4o-mini".into(),
                llm_base_url: None,
                openrouter_api_key: None,
                openrouter_model: "meta-llama/llama-3.3-70b-instruct".into(),
                groq_api_key: None,
                groq_model: "llama-3.3-70b-versatile".into(),
            }),
            http: HttpClient::new(),
            jwks: Vec::new(),
            engine: Arc::new(Engine::new(
                Box::new(HeuristicProsodyTool),
                Box::new(HeuristicVoicePresentationTool),
                Box::new(RuleBasedCoach),
            )),
            llm_provider: "rule".into(),
            analysis_repo: Arc::new(MemoryAnalysisRepository {
                saved: Arc::clone(&saved),
            }),
        });

        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };

        let response = analyze(
            State(state),
            Extension(user),
            Json(AnalyzeRequest {
                median_pitch_hz: 190.0,
                pitch_stability: 0.71,
                pause_ratio: 0.2,
                spectral_brightness: 0.62,
            }),
        )
        .await
        .expect("analysis route should succeed");

        let payload = response.0;
        assert!(payload["summary"].is_string());
        assert!(payload["voice_presentation"]["score"].is_number());

        let saved_entries = saved.lock().expect("lock");
        assert_eq!(saved_entries.len(), 1);
        assert_eq!(saved_entries[0].user_id, "u-1");
    }
}
