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
    repositories::analysis::{insert_analysis, AnalysisArtifact},
    AppState,
};

pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/api/analyze", post(analyze))
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AnalyzeRequest {
    pub median_pitch_hz: f64,
    pub pitch_stability: f64,
    pub pause_ratio: f64,
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
    insert_analysis(&state.db, &artifact).await?;

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
    use super::AnalyzeRequest;

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
}
