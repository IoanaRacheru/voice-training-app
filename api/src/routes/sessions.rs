use std::sync::Arc;

use axum::{
    Extension, Json, Router,
    extract::State,
    routing::{get, post},
};
use serde::{Deserialize, Deserializer, Serialize};
use utoipa::ToSchema;

use crate::{
    AppState, auth::AppwriteUser, errors::AppError, repositories::session::CreateSessionInput,
};

const MAX_DURATION_SECONDS: u32 = 86_400;
const MIN_AVERAGE_PITCH: f64 = 50.0;
const MAX_AVERAGE_PITCH: f64 = 2_000.0;
const MAX_ENUM_LIKE_LEN: usize = 64;
const MAX_AUDIO_DATA_URL_LEN: usize = 8 * 1024 * 1024;


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

    if trimmed.chars().all(|c| c.is_ascii_lowercase() || c == '_') {
        Ok(trimmed.to_string())
    } else {
        Err(serde::de::Error::custom(
            "value must use lowercase letters and underscores only",
        ))
    }
}

#[derive(Deserialize, ToSchema)]
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
    pub audio_data_url: Option<String>,
}

const VALID_EXERCISE_TYPES: &[&str] = &["pitch", "resonance", "intonation", "breath_control"];
const VALID_GOALS: &[&str] = &[
    "feminize",
    "masculinize",
    "feminine",
    "masculine",
    "androgynous",
    "custom",
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
        return Err(AppError::Validation(
            "score must be between 0 and 100".into(),
        ));
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
    if let Some(audio_data_url) = &body.audio_data_url {
        if audio_data_url.len() > MAX_AUDIO_DATA_URL_LEN {
            return Err(AppError::Validation(format!(
                "audio_data_url must be <= {MAX_AUDIO_DATA_URL_LEN} bytes"
            )));
        }
        if !audio_data_url.starts_with("data:audio/") {
            return Err(AppError::Validation(
                "audio_data_url must be an audio data URL".into(),
            ));
        }
    }
    Ok(())
}


#[utoipa::path(
    post,
    path = "/api/sessions",
    tag = "Sessions",
    security(
        ("bearer_auth" = [])
    ),
    request_body = CreateRequest,
    responses(
        (status = 200, description = "Session persisted", body = CreateResponse),
        (status = 400, description = "Invalid request"),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn create(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Json(body): Json<CreateRequest>,
) -> Result<Json<CreateResponse>, AppError> {
    validate_create(&body)?;
    let id = state
        .session_repo
        .insert_session(CreateSessionInput {
            user_id: user.id.clone(),
            duration_seconds: body.duration_seconds,
            average_pitch: body.average_pitch,
            score: body.score,
            exercise_type: body.exercise_type,
            goal: body.goal,
            audio_data_url: body.audio_data_url,
        })
        .await?;

    Ok(Json(CreateResponse {
        id,
        message: "Session saved".into(),
    }))
}


#[utoipa::path(
    get,
    path = "/api/sessions",
    tag = "Sessions",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "Session list", body = [SessionItem]),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn list(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
) -> Result<Json<Vec<SessionItem>>, AppError> {
    let sessions = state.session_repo.list_by_user_id(&user.id).await?;

    let body: Vec<SessionItem> = sessions
        .iter()
        .map(|s| {
            let dt = chrono::DateTime::<chrono::Utc>::from(s.date.to_system_time());
            SessionItem {
                id: s.id.map(|id| id.to_hex()),
                date: dt.to_rfc3339(),
                duration_seconds: s.duration_seconds,
                average_pitch: s.average_pitch,
                score: s.score,
                exercise_type: s.exercise_type.clone(),
                goal: s.goal.clone(),
                audio_url: s.audio_data_url.clone(),
            }
        })
        .collect();

    Ok(Json(body))
}


#[derive(Debug, Serialize, ToSchema)]
pub struct CreateResponse {
    
    pub id: Option<String>,
    
    pub message: String,
}


#[derive(Debug, Serialize, ToSchema)]
pub struct SessionItem {
    
    pub id: Option<String>,
    
    pub date: String,
    
    pub duration_seconds: u32,
    
    pub average_pitch: f64,
    
    pub score: u32,
    
    pub exercise_type: String,
    
    pub goal: String,
    
    pub audio_url: Option<String>,
}

#[cfg(test)]
mod tests {
    use std::sync::{Arc, Mutex};

    use app_core::{
        Engine,
        asr::{SimplePronunciationEvaluator, VoskAsrStub},
        dsp::EnergyVadDetector,
        llm::RuleBasedCoach,
        tools::{DeterministicDspProsodyTool, DeterministicDspVoicePresentationTool},
    };
    use async_trait::async_trait;
    use axum::{Extension, Json, extract::State};
    use mongodb::{Client, bson::DateTime};
    use tokio::sync::RwLock;

    use super::{CreateRequest, create, list};
    use crate::{
        AppState,
        auth::AppwriteUser,
        config::Config,
        models::session::Session,
        repositories::{
            analysis::MongoAnalysisRepository,
            challenge::MongoChallengeRepository,
            profile::MongoProfileRepository,
            session::{CreateSessionInput, SessionRepository},
        },
    };

    struct MemorySessionRepository {
        sessions: Arc<Mutex<Vec<Session>>>,
    }

    #[async_trait]
    impl SessionRepository for MemorySessionRepository {
        async fn insert_session(
            &self,
            input: CreateSessionInput,
        ) -> Result<Option<String>, mongodb::error::Error> {
            self.sessions.lock().expect("lock").push(Session {
                id: None,
                user_id: input.user_id,
                date: DateTime::now(),
                duration_seconds: input.duration_seconds,
                average_pitch: input.average_pitch,
                score: input.score,
                exercise_type: input.exercise_type,
                goal: input.goal,
                audio_data_url: input.audio_data_url,
            });
            Ok(Some("fake-id".into()))
        }

        async fn list_by_user_id(
            &self,
            user_id: &str,
        ) -> Result<Vec<Session>, mongodb::error::Error> {
            let out = self
                .sessions
                .lock()
                .expect("lock")
                .iter()
                .filter(|s| s.user_id == user_id)
                .cloned()
                .collect();
            Ok(out)
        }
    }

    async fn build_state() -> Arc<AppState> {
        let client = Client::with_uri_str("mongodb://127.0.0.1:27017")
            .await
            .expect("mongodb uri should parse");
        Arc::new(AppState {
            db: client.database("voice_training"),
            config: Arc::new(Config {
                mongodb_uri: "mongodb://127.0.0.1:27017".into(),
                keycloak_realm_url:
                    "http://localhost:8080/realms/voice-training/protocol/openid-connect/certs"
                        .into(),
                keycloak_expected_issuer: "http://localhost:8080/realms/voice-training".into(),
                keycloak_expected_audiences: vec!["account".into()],
                analyze_max_body_bytes: 1024 * 1024,
                server_port: 3000,
                llm_provider: "rule".into(),
                llm_api_key: None,
                llm_model: "openai/gpt-4o-mini".into(),
                llm_base_url: None,
                openrouter_api_key: None,
                openrouter_model: "meta-llama/llama-3.3-70b-instruct".into(),
                groq_api_key: None,
                groq_model: "llama-3.3-70b-versatile".into(),
                vad_provider: "energy".into(),
                asr_provider: "stub".into(),
                vosk_server_url: None,
                provider_strict: false,
            }),
            http: reqwest::Client::new(),
            jwks: Arc::new(RwLock::new(Vec::new())),
            engine: Arc::new(Engine::new(
                Box::new(DeterministicDspProsodyTool),
                Box::new(DeterministicDspVoicePresentationTool),
                Box::new(RuleBasedCoach),
                Box::new(VoskAsrStub),
                Box::new(SimplePronunciationEvaluator),
                Box::new(EnergyVadDetector),
            )),
            llm_provider: "rule".into(),
            analysis_repo: Arc::new(MongoAnalysisRepository::new(
                client.database("voice_training"),
            )),
            profile_repo: Arc::new(MongoProfileRepository::new(
                client.database("voice_training"),
            )),
            session_repo: Arc::new(MemorySessionRepository {
                sessions: Arc::new(Mutex::new(Vec::new())),
            }),
            challenge_repo: Arc::new(MongoChallengeRepository::new(
                client.database("voice_training"),
            )),
        })
    }

    #[tokio::test]
    async fn create_and_list_session_work() {
        let state = build_state().await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };
        let create_resp = create(
            State(state.clone()),
            Extension(user.clone()),
            Json(CreateRequest {
                duration_seconds: 120,
                average_pitch: 180.0,
                score: 88,
                exercise_type: "pitch".into(),
                goal: "feminine".into(),
                audio_data_url: Some("data:audio/webm;base64,AAAA".into()),
            }),
        )
        .await
        .expect("create should succeed");
        assert_eq!(create_resp.0.id.as_deref(), Some("fake-id"));
        let list_resp = list(State(state), Extension(user)).await.expect("list ok");
        assert_eq!(list_resp.0.len(), 1);
        assert_eq!(list_resp.0[0].exercise_type, "pitch");
        assert!(list_resp.0[0].audio_url.is_some());
    }

    #[tokio::test]
    async fn create_rejects_invalid_pitch() {
        let state = build_state().await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };
        let err = create(
            State(state),
            Extension(user),
            Json(CreateRequest {
                duration_seconds: 120,
                average_pitch: 40.0,
                score: 88,
                exercise_type: "pitch".into(),
                goal: "feminine".into(),
                audio_data_url: None,
            }),
        )
        .await
        .expect_err("should fail");
        assert!(err.to_string().contains("average_pitch"));
    }
}
