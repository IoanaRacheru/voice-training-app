use std::sync::Arc;

use axum::{
    extract::State,
    routing::{get, patch},
    Extension, Json, Router,
};
use mongodb::bson::{doc, oid::ObjectId};
use serde::Deserialize;

use crate::{auth::Claims, errors::AppError, models::user::User, AppState};

pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/api/me", get(me).patch(patch_me))
}

async fn me(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<serde_json::Value>, AppError> {
    let col = state.db.collection::<User>("users");
    let oid = ObjectId::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;

    let user = col
        .find_one(doc! { "_id": oid })
        .await?
        .ok_or(AppError::Unauthorized)?;

    Ok(Json(serde_json::json!({
        "user_id": claims.sub,
        "email": user.email,
        "voice_goal": user.voice_goal,
        "experience_level": user.experience_level,
        "target_pitch_range": user.target_pitch_range,
        "training_focus": user.training_focus,
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
    Extension(claims): Extension<Claims>,
    Json(body): Json<PatchMeRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let col = state.db.collection::<User>("users");
    let oid = ObjectId::parse_str(&claims.sub).map_err(|_| AppError::Unauthorized)?;

    let mut set = doc! {};
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

    if !set.is_empty() {
        col.update_one(doc! { "_id": oid }, doc! { "$set": set })
            .await?;
    }

    Ok(Json(serde_json::json!({ "message": "Profile updated" })))
}
