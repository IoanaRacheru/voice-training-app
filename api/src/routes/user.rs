use std::sync::Arc;

use axum::{
    extract::State,
    routing::get,
    Extension, Json, Router,
};
use mongodb::bson::doc;
use serde::Deserialize;

use crate::{auth::AppwriteUser, errors::AppError, models::profile::Profile, AppState};

pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/api/me", get(me).patch(patch_me))
}

async fn me(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
) -> Result<Json<serde_json::Value>, AppError> {
    let col = state.db.collection::<Profile>("profiles");

    let profile = col
        .find_one(doc! { "appwrite_user_id": &user.id })
        .await?;

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
pub struct PatchMeRequest {
    pub voice_goal: Option<String>,
    pub experience_level: Option<String>,
    pub target_pitch_range: Option<Vec<f64>>,
    pub training_focus: Option<Vec<String>>,
}

async fn patch_me(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Json(body): Json<PatchMeRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let col = state.db.collection::<Profile>("profiles");

    let mut set = doc! { "email": &user.email };
    if let Some(v) = body.voice_goal {
        set.insert("voice_goal", v);
    }
    if let Some(v) = body.experience_level {
        set.insert("experience_level", v);
    }
    if let Some(v) = &body.target_pitch_range {
        set.insert(
            "target_pitch_range",
            mongodb::bson::to_bson(v).map_err(|e| AppError::Internal(e.to_string()))?,
        );
    }
    if let Some(v) = &body.training_focus {
        set.insert(
            "training_focus",
            mongodb::bson::to_bson(v).map_err(|e| AppError::Internal(e.to_string()))?,
        );
    }

    col.update_one(
        doc! { "appwrite_user_id": &user.id },
        doc! { "$set": set },
    )
    .upsert(true)
    .await?;

    Ok(Json(serde_json::json!({ "message": "Profile updated" })))
}
