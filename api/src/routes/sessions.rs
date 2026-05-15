use std::sync::Arc;

use axum::{
    extract::State,
    routing::{get, post},
    Extension, Json, Router,
};
use futures::TryStreamExt;
use mongodb::bson::{doc, DateTime};
use serde::Deserialize;

use crate::{auth::AppwriteUser, errors::AppError, models::session::Session, AppState};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/sessions", post(create))
        .route("/api/sessions", get(list))
}

#[derive(Deserialize)]
pub struct CreateRequest {
    pub duration_seconds: u32,
    pub average_pitch: f64,
    pub score: u32,
    pub exercise_type: String,
    pub goal: String,
}

async fn create(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Json(body): Json<CreateRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let col = state.db.collection::<Session>("sessions");

    let session = Session {
        id: None,
        user_id: user.id.clone(),
        date: DateTime::now(),
        duration_seconds: body.duration_seconds,
        average_pitch: body.average_pitch,
        score: body.score,
        exercise_type: body.exercise_type,
        goal: body.goal,
    };

    let result = col.insert_one(session).await?;
    let id = result.inserted_id.as_object_id().map(|oid| oid.to_hex());

    Ok(Json(serde_json::json!({ "id": id, "message": "Session saved" })))
}

async fn list(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
) -> Result<Json<Vec<serde_json::Value>>, AppError> {
    let col = state.db.collection::<Session>("sessions");

    let sessions: Vec<Session> = col
        .find(doc! { "user_id": &user.id })
        .sort(doc! { "date": -1 })
        .await?
        .try_collect()
        .await?;

    let body = sessions
        .iter()
        .map(|s| {
            let dt = chrono::DateTime::<chrono::Utc>::from(s.date.to_system_time());
            serde_json::json!({
                "id": s.id.map(|id| id.to_hex()),
                "date": dt.to_rfc3339(),
                "duration_seconds": s.duration_seconds,
                "average_pitch": s.average_pitch,
                "score": s.score,
                "exercise_type": s.exercise_type,
                "goal": s.goal,
            })
        })
        .collect();

    Ok(Json(body))
}
