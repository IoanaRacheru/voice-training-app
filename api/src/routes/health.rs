use std::sync::Arc;

use axum::{Json, Router, routing::get};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::AppState;


#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct HealthResponse {
    
    pub status: String,
    
    pub service: String,
}


pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/health", get(health))
}


#[utoipa::path(
    get,
    path = "/health",
    tag = "Health",
    responses((status = 200, description = "Service health", body = HealthResponse))
)]
pub async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok".into(),
        service: "voice-training-api".into(),
    })
}
