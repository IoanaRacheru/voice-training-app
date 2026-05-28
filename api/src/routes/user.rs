use std::sync::Arc;

use axum::{
    extract::State,
    routing::get,
    Extension, Json, Router,
};
use serde::Deserialize;

use crate::{
    auth::AppwriteUser,
    errors::AppError,
    repositories::profile::ProfilePatch,
    AppState,
};

/// Register profile routes.
pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/api/me", get(me).patch(patch_me))
}

/// Return the authenticated user's profile envelope.
async fn me(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
) -> Result<Json<serde_json::Value>, AppError> {
    let profile = state.profile_repo.find_by_user_id(&user.id).await?;

    let (voice_goal, experience_level, target_pitch_range, training_focus) = match profile {
        Some(p) => (p.voice_goal, p.experience_level, p.target_pitch_range, p.training_focus),
        None => (None, None, None, None),
    };

    Ok(Json(serde_json::json!({
        "user_id": user.id,
        "email": user.email,
        "voice_goal": voice_goal,
        "experience_level": experience_level,
        "target_pitch_range": target_pitch_range,
        "training_focus": training_focus,
    })))
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PatchMeRequest {
    pub voice_goal: Option<String>,
    pub experience_level: Option<String>,
    pub target_pitch_range: Option<Vec<f64>>,
    pub training_focus: Option<Vec<String>>,
}

/// Upsert profile fields for the authenticated user.
async fn patch_me(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Json(body): Json<PatchMeRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    state
        .profile_repo
        .upsert_by_user_id(
            &user.id,
            &user.email,
            ProfilePatch {
                voice_goal: body.voice_goal,
                experience_level: body.experience_level,
                target_pitch_range: body.target_pitch_range,
                training_focus: body.training_focus,
            },
        )
        .await?;

    Ok(Json(serde_json::json!({ "message": "Profile updated" })))
}
