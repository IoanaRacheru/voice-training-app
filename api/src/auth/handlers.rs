use std::sync::Arc;

use axum::{extract::State, http::StatusCode, Json};
use mongodb::bson::{doc, DateTime};
use serde::{Deserialize, Serialize};

use crate::{
    auth::{generate_jwt, hash_password, verify_password},
    errors::AppError,
    models::user::User,
    AppState,
};

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub email: String,
}

pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<serde_json::Value>), AppError> {
    let collection = state.db.collection::<User>("users");

    if collection
        .find_one(doc! { "email": &payload.email })
        .await?
        .is_some()
    {
        return Err(AppError::EmailAlreadyExists);
    }

    let user = User {
        id: None,
        email: payload.email,
        password_hash: hash_password(&payload.password)?,
        created_at: DateTime::now(),
    };

    collection.insert_one(user).await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({ "message": "User created successfully" })),
    ))
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, AppError> {
    let collection = state.db.collection::<User>("users");

    let user = collection
        .find_one(doc! { "email": &payload.email })
        .await?
        .ok_or(AppError::InvalidCredentials)?;

    if !verify_password(&payload.password, &user.password_hash)? {
        return Err(AppError::InvalidCredentials);
    }

    let user_id = user
        .id
        .map(|id| id.to_hex())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    let token = generate_jwt(
        &user_id,
        &user.email,
        &state.config.jwt_secret,
        state.config.jwt_expiry_hours,
    )?;

    Ok(Json(LoginResponse {
        token,
        email: user.email,
    }))
}
