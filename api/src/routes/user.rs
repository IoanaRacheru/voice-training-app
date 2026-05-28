use std::sync::Arc;

use axum::{
    extract::State,
    routing::get,
    Extension, Json, Router,
};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

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
#[utoipa::path(
    get,
    path = "/api/me",
    tag = "User",
    responses(
        (status = 200, description = "Authenticated profile payload", body = MeResponse),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn me(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
) -> Result<Json<MeResponse>, AppError> {
    let profile = state.profile_repo.find_by_user_id(&user.id).await?;

    let (voice_goal, experience_level, target_pitch_range, training_focus) = match profile {
        Some(p) => (p.voice_goal, p.experience_level, p.target_pitch_range, p.training_focus),
        None => (None, None, None, None),
    };

    Ok(Json(MeResponse {
        user_id: user.id,
        email: user.email,
        voice_goal,
        experience_level,
        target_pitch_range,
        training_focus,
    }))
}

/// Response payload for `GET /api/me`.
#[derive(Debug, Serialize, ToSchema)]
pub struct MeResponse {
    /// Authenticated user ID.
    pub user_id: String,
    /// Authenticated user email.
    pub email: String,
    /// Optional selected voice goal.
    pub voice_goal: Option<String>,
    /// Optional experience level.
    pub experience_level: Option<String>,
    /// Optional target pitch range in Hz.
    pub target_pitch_range: Option<Vec<f64>>,
    /// Optional training-focus tags.
    pub training_focus: Option<Vec<String>>,
}

/// Request payload for `PATCH /api/me`.
#[derive(Deserialize)]
#[derive(ToSchema)]
#[serde(deny_unknown_fields)]
pub struct PatchMeRequest {
    /// Optional voice goal.
    pub voice_goal: Option<String>,
    /// Optional experience level.
    pub experience_level: Option<String>,
    /// Optional target pitch range.
    pub target_pitch_range: Option<Vec<f64>>,
    /// Optional training-focus tags.
    pub training_focus: Option<Vec<String>>,
}

/// Upsert profile fields for the authenticated user.
#[utoipa::path(
    patch,
    path = "/api/me",
    tag = "User",
    request_body = PatchMeRequest,
    responses(
        (status = 200, description = "Profile updated", body = PatchMeResponse),
        (status = 400, description = "Invalid request"),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn patch_me(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Json(body): Json<PatchMeRequest>,
) -> Result<Json<PatchMeResponse>, AppError> {
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

    Ok(Json(PatchMeResponse {
        message: "Profile updated".into(),
    }))
}

/// Response payload for `PATCH /api/me`.
#[derive(Debug, Serialize, ToSchema)]
pub struct PatchMeResponse {
    /// Human-readable operation status.
    pub message: String,
}
