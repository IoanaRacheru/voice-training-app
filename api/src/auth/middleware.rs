use std::sync::Arc;

use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Json, Response},
};
use serde::Deserialize;
use serde_json::json;

use crate::{auth::AppwriteUser, AppState};

#[derive(Deserialize)]
struct AppwriteAccountResponse {
    #[serde(rename = "$id")]
    id: String,
    email: String,
}

pub async fn appwrite_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Response {
    let token = request
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .map(str::to_owned);

    let token = match token {
        Some(t) => t,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "Unauthorized" })),
            )
                .into_response();
        }
    };

    let url = format!("{}/account", state.config.appwrite_endpoint);
    let result = state
        .http
        .get(&url)
        .header("X-Appwrite-JWT", &token)
        .header("X-Appwrite-Project", &state.config.appwrite_project_id)
        .send()
        .await;

    match result {
        Ok(resp) if resp.status().is_success() => {
            match resp.json::<AppwriteAccountResponse>().await {
                Ok(account) => {
                    request.extensions_mut().insert(AppwriteUser {
                        id: account.id,
                        email: account.email,
                    });
                    next.run(request).await
                }
                Err(_) => (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({ "error": "Unauthorized" })),
                )
                    .into_response(),
            }
        }
        _ => (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Unauthorized" })),
        )
            .into_response(),
    }
}
