use std::sync::Arc;

use axum::{
    extract::State,
    routing::{get, post},
    Extension, Json, Router,
};
use futures::TryStreamExt;
use mongodb::bson::{doc, DateTime};
use serde::{Deserialize, Deserializer};

use crate::{auth::AppwriteUser, errors::AppError, models::session::Session, AppState};

const MAX_DURATION_SECONDS: u32 = 86_400;
const MIN_AVERAGE_PITCH: f64 = 50.0;
const MAX_AVERAGE_PITCH: f64 = 2_000.0;
const MAX_ENUM_LIKE_LEN: usize = 64;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/sessions", post(create))
        .route("/api/sessions", get(list))
}

fn deserialize_duration_seconds<'de, D>(deserializer: D) -> Result<u32, D::Error>
where
    D: Deserializer<'de>,
{
    let value = u32::deserialize(deserializer)?;
    if (1..=MAX_DURATION_SECONDS).contains(&value) {
        Ok(value)
    } else {
        Err(serde::de::Error::custom(format!(
            "duration_seconds must be between 1 and {MAX_DURATION_SECONDS}"
        )))
    }
}

fn deserialize_average_pitch<'de, D>(deserializer: D) -> Result<f64, D::Error>
where
    D: Deserializer<'de>,
{
    let value = f64::deserialize(deserializer)?;
    if value.is_finite() && (MIN_AVERAGE_PITCH..=MAX_AVERAGE_PITCH).contains(&value) {
        Ok(value)
    } else {
        Err(serde::de::Error::custom(format!(
            "average_pitch must be finite and between {MIN_AVERAGE_PITCH} and {MAX_AVERAGE_PITCH}"
        )))
    }
}

fn deserialize_score<'de, D>(deserializer: D) -> Result<u32, D::Error>
where
    D: Deserializer<'de>,
{
    let value = u32::deserialize(deserializer)?;
    if value <= 100 {
        Ok(value)
    } else {
        Err(serde::de::Error::custom("score must be between 0 and 100"))
    }
}

fn deserialize_enum_like_string<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let value = String::deserialize(deserializer)?;
    let trimmed = value.trim();

    if trimmed.is_empty() || trimmed.len() > MAX_ENUM_LIKE_LEN {
        return Err(serde::de::Error::custom(format!(
            "value must be between 1 and {MAX_ENUM_LIKE_LEN} characters"
        )));
    }

    if trimmed
        .chars()
        .all(|c| c.is_ascii_lowercase() || c == '_')
    {
        Ok(trimmed.to_string())
    } else {
        Err(serde::de::Error::custom(
            "value must use lowercase letters and underscores only",
        ))
    }
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CreateRequest {
    #[serde(deserialize_with = "deserialize_duration_seconds")]
    pub duration_seconds: u32,
    #[serde(deserialize_with = "deserialize_average_pitch")]
    pub average_pitch: f64,
    #[serde(deserialize_with = "deserialize_score")]
    pub score: u32,
    #[serde(deserialize_with = "deserialize_enum_like_string")]
    pub exercise_type: String,
    #[serde(deserialize_with = "deserialize_enum_like_string")]
    pub goal: String,
}

const VALID_EXERCISE_TYPES: &[&str] = &["pitch", "resonance", "intonation", "breath_control"];
const VALID_GOALS: &[&str] = &[
    "feminize", "masculinize", "feminine", "masculine", "androgynous", "custom",
];

fn validate_create(body: &CreateRequest) -> Result<(), AppError> {
    if body.duration_seconds == 0 || body.duration_seconds > 7200 {
        return Err(AppError::Validation(
            "duration_seconds must be between 1 and 7200".into(),
        ));
    }
    if !(50.0..=500.0).contains(&body.average_pitch) {
        return Err(AppError::Validation(
            "average_pitch must be between 50 and 500 Hz".into(),
        ));
    }
    if body.score > 100 {
        return Err(AppError::Validation("score must be between 0 and 100".into()));
    }
    if !VALID_EXERCISE_TYPES.contains(&body.exercise_type.as_str()) {
        return Err(AppError::Validation(format!(
            "exercise_type must be one of: {}",
            VALID_EXERCISE_TYPES.join(", ")
        )));
    }
    if !VALID_GOALS.contains(&body.goal.as_str()) {
        return Err(AppError::Validation(format!(
            "goal must be one of: {}",
            VALID_GOALS.join(", ")
        )));
    }
    Ok(())
}

async fn create(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Json(body): Json<CreateRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    validate_create(&body)?;

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
