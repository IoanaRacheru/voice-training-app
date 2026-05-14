use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Email already exists")]
    EmailAlreadyExists,

    #[error("Invalid email or password")]
    InvalidCredentials,

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Database error")]
    Database(#[from] mongodb::error::Error),

    #[error("Internal server error")]
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match &self {
            AppError::EmailAlreadyExists => (StatusCode::CONFLICT, "Email already exists"),
            AppError::InvalidCredentials => (StatusCode::UNAUTHORIZED, "Invalid email or password"),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized"),
            AppError::Database(_) | AppError::Internal(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error")
            }
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}
