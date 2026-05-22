use std::sync::Arc;

use axum::{routing::get, Json, Router};
use serde_json::json;

use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/health", get(health))
}

async fn health() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok", "service": "voice-training-api" }))
}
