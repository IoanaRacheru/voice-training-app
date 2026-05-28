use std::sync::Arc;

use axum::{Json, Router, routing::get};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::AppState;

/// Health endpoint response payload.
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct HealthResponse {
    /// Service health status.
    pub status: String,
    /// Service name.
    pub service: String,
}

/// Register health routes.
pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/health", get(health))
}

/// Return API health status.
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
