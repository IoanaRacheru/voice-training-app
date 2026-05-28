use std::sync::Arc;

use app_core::AnalysisInput;
use axum::{
    extract::{DefaultBodyLimit, State},
    routing::post,
    Extension, Json, Router,
};
use mongodb::bson::DateTime;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::{
    auth::AppwriteUser,
    errors::AppError,
    repositories::analysis::AnalysisArtifact,
    AppState,
};

/// Register analysis routes with a configurable body-size guard.
pub fn router(max_body_bytes: usize) -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/analyze", post(analyze))
        .layer(DefaultBodyLimit::max(max_body_bytes))
}

/// Request body for on-demand voice analysis.
#[derive(Debug, Deserialize, ToSchema)]
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
    /// Optional mono PCM samples in `[-1.0, 1.0]` for signal-derived analysis.
    pub audio_samples: Option<Vec<f32>>,
    /// Sample rate for `audio_samples`.
    pub sample_rate: Option<u32>,
    /// Optional target phrase used for pronunciation feedback.
    pub expected_text: Option<String>,
}

/// Response body for on-demand voice analysis.
#[derive(Debug, Serialize, ToSchema)]
pub struct AnalyzeResponse {
    /// Session summary synthesized by the engine.
    pub summary: String,
    /// Ordered list of practice suggestions.
    pub practice_next: Vec<String>,
    /// Natural language coach feedback.
    pub llm_coach_feedback: String,
    /// Prosodic analysis output.
    pub prosody: app_core::tools::ProsodyOutput,
    /// Voice presentation estimate and confidence.
    pub voice_presentation: app_core::tools::VoicePresentationOutput,
    /// Signal extraction confidence in `[0, 1]` when audio is supplied.
    pub signal_confidence: Option<f64>,
    /// Signal quality diagnostics.
    pub signal_quality: Option<app_core::engine::SignalQuality>,
    /// Name of the VAD implementation used.
    pub vad_used: Option<String>,
    /// ASR transcript output for provided audio.
    pub asr: Option<app_core::asr::AsrResult>,
    /// Pronunciation feedback against `expected_text`.
    pub pronunciation: Option<app_core::asr::PronunciationFeedback>,
}

/// Perform voice analysis and persist a compact analysis artifact.
#[utoipa::path(
    post,
    path = "/api/analyze",
    tag = "Analysis",
    request_body = AnalyzeRequest,
    responses(
        (status = 200, description = "Analysis results", body = AnalyzeResponse),
        (status = 400, description = "Invalid input"),
        (status = 500, description = "Internal error")
    )
)]
pub async fn analyze(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Json(body): Json<AnalyzeRequest>,
) -> Result<Json<AnalyzeResponse>, AppError> {
    let output = state
        .engine
        .analyze(AnalysisInput {
            median_pitch_hz: body.median_pitch_hz,
            pitch_stability: body.pitch_stability,
            pause_ratio: body.pause_ratio,
            spectral_brightness: body.spectral_brightness,
            audio_samples: body.audio_samples,
            sample_rate: body.sample_rate,
            expected_text: body.expected_text,
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

    Ok(Json(AnalyzeResponse {
        summary: output.summary,
        practice_next: output.practice_next,
        llm_coach_feedback: output.llm_coach_feedback,
        prosody: output.prosody,
        voice_presentation: output.voice_presentation,
        signal_confidence: output.signal_confidence,
        signal_quality: output.signal_quality,
        vad_used: output.vad_used,
        asr: output.asr,
        pronunciation: output.pronunciation,
    }))
}

#[cfg(test)]
mod tests {
    use std::sync::{Arc, Mutex};

    use super::{analyze, router, AnalyzeRequest};
    use crate::{
        auth::AppwriteUser,
        config::Config,
        repositories::{
            analysis::{AnalysisArtifact, AnalysisRepository},
            profile::MongoProfileRepository,
            session::MongoSessionRepository,
        },
        AppState,
    };
    use app_core::{
        asr::{SimplePronunciationEvaluator, VoskAsrStub},
        llm::RuleBasedCoach,
        tools::{HeuristicProsodyTool, HeuristicVoicePresentationTool},
        Engine,
    };
    use async_trait::async_trait;
    use axum::{
        body::Body,
        extract::State,
        http::{Request, StatusCode},
        Extension, Json,
    };
    use mongodb::{bson::DateTime, Client};
    use reqwest::Client as HttpClient;
    use tokio::sync::RwLock;
    use tower::ServiceExt;

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
            }),
            http: HttpClient::new(),
            jwks: Arc::new(RwLock::new(Vec::new())),
            engine: Arc::new(Engine::new(
                Box::new(HeuristicProsodyTool),
                Box::new(HeuristicVoicePresentationTool),
                Box::new(RuleBasedCoach),
                Box::new(VoskAsrStub),
                Box::new(SimplePronunciationEvaluator),
            )),
            llm_provider: "rule".into(),
            analysis_repo: Arc::new(MemoryAnalysisRepository {
                saved: Arc::clone(&saved),
            }),
            profile_repo: Arc::new(MongoProfileRepository::new(mongo.database("voice_training"))),
            session_repo: Arc::new(MongoSessionRepository::new(mongo.database("voice_training"))),
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
                audio_samples: None,
                sample_rate: None,
                expected_text: None,
            }),
        )
        .await
        .expect("analysis route should succeed");

        let payload = response.0;
        assert!(!payload.summary.is_empty());
        assert!((0.0..=100.0).contains(&payload.voice_presentation.score));
        assert!(payload.signal_confidence.is_none());
        assert!(payload.signal_quality.is_none());
        assert!(payload.asr.is_none());
        assert!(payload.pronunciation.is_none());

        let saved_entries = saved.lock().expect("lock");
        assert_eq!(saved_entries.len(), 1);
        assert_eq!(saved_entries[0].user_id, "u-1");
    }

    #[tokio::test]
    async fn analyze_route_rejects_oversized_payload_with_413() {
        let mongo = Client::with_uri_str("mongodb://127.0.0.1:27017")
            .await
            .expect("mongodb uri should parse");

        let state = Arc::new(AppState {
            db: mongo.database("voice_training"),
            config: Arc::new(Config {
                mongodb_uri: "mongodb://127.0.0.1:27017".into(),
                keycloak_realm_url:
                    "http://localhost:8080/realms/voice-training/protocol/openid-connect/certs"
                        .into(),
                keycloak_expected_issuer: "http://localhost:8080/realms/voice-training".into(),
                keycloak_expected_audiences: vec!["account".into()],
                analyze_max_body_bytes: 1024,
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
            jwks: Arc::new(RwLock::new(Vec::new())),
            engine: Arc::new(Engine::new(
                Box::new(HeuristicProsodyTool),
                Box::new(HeuristicVoicePresentationTool),
                Box::new(RuleBasedCoach),
                Box::new(VoskAsrStub),
                Box::new(SimplePronunciationEvaluator),
            )),
            llm_provider: "rule".into(),
            analysis_repo: Arc::new(MemoryAnalysisRepository {
                saved: Arc::new(Mutex::new(Vec::new())),
            }),
            profile_repo: Arc::new(MongoProfileRepository::new(mongo.database("voice_training"))),
            session_repo: Arc::new(MongoSessionRepository::new(mongo.database("voice_training"))),
        });

        let app = router(1024)
            .layer(Extension(AppwriteUser {
                id: "u-1".into(),
                email: "u1@example.com".into(),
            }))
            .with_state(state);

        let oversized_audio = vec![0.0_f32; 20_000];
        let body = serde_json::json!({
            "median_pitch_hz": 180.0,
            "pitch_stability": 0.7,
            "pause_ratio": 0.2,
            "spectral_brightness": 0.6,
            "audio_samples": oversized_audio,
            "sample_rate": 16000
        })
        .to_string();

        let response = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/analyze")
                    .header("content-type", "application/json")
                    .body(Body::from(body))
                    .expect("request should build"),
            )
            .await
            .expect("request should execute");

        assert_eq!(response.status(), StatusCode::PAYLOAD_TOO_LARGE);
    }
}
