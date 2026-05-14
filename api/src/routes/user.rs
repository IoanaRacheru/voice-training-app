use std::sync::Arc;

use axum::{routing::get, Extension, Json, Router};
use serde_json::json;

use crate::{auth::Claims, AppState};

pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/api/me", get(me))
}

async fn me(Extension(claims): Extension<Claims>) -> Json<serde_json::Value> {
    Json(json!({
        "user_id": claims.sub,
        "email": claims.email,
    }))
}
