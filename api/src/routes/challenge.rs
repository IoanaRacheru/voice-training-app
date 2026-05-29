use std::sync::Arc;

use axum::{
    Extension, Json, Router,
    extract::{Query, State},
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use utoipa::ToSchema;

use crate::{AppState, auth::AppwriteUser, errors::AppError};

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/challenge/today", get(get_today))
        .route("/api/challenge/generate", post(generate))
        .route("/api/challenge/start", post(start))
        .route("/api/challenge/complete-exercise", post(complete_exercise))
        .route("/api/challenge/streak", get(get_streak))
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct TodayQuery {
    pub date: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct ChallengeEnvelope {
    pub challenge: serde_json::Value,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct UpsertChallengeRequest {
    pub date: String,
    pub challenge: serde_json::Value,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct StreakResponse {
    pub current_challenge_streak: u32,
    pub longest_challenge_streak: u32,
    pub last_completed_date: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct TodayResponse {
    pub challenge: Option<serde_json::Value>,
}

#[utoipa::path(get, path = "/api/challenge/today", tag = "Challenge", security(("bearer_auth"=[])), responses((status=200, body=TodayResponse)))]
pub async fn get_today(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Query(query): Query<TodayQuery>,
) -> Result<Json<TodayResponse>, AppError> {
    if query.date.trim().is_empty() {
        return Err(AppError::Validation("date must not be empty".into()));
    }
    let found = state
        .challenge_repo
        .get_today(&user.id, &query.date)
        .await?;
    Ok(Json(TodayResponse {
        challenge: found.map(|v| v.challenge),
    }))
}

#[utoipa::path(post, path = "/api/challenge/generate", tag = "Challenge", security(("bearer_auth"=[])), request_body=UpsertChallengeRequest, responses((status=200, body=ChallengeEnvelope)))]
pub async fn generate(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Json(body): Json<UpsertChallengeRequest>,
) -> Result<Json<ChallengeEnvelope>, AppError> {
    upsert_challenge(state, user, body, false).await
}

#[utoipa::path(post, path = "/api/challenge/start", tag = "Challenge", security(("bearer_auth"=[])), request_body=UpsertChallengeRequest, responses((status=200, body=ChallengeEnvelope)))]
pub async fn start(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Json(body): Json<UpsertChallengeRequest>,
) -> Result<Json<ChallengeEnvelope>, AppError> {
    upsert_challenge(state, user, body, false).await
}

#[utoipa::path(post, path = "/api/challenge/complete-exercise", tag = "Challenge", security(("bearer_auth"=[])), request_body=UpsertChallengeRequest, responses((status=200, body=ChallengeEnvelope)))]
pub async fn complete_exercise(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Json(body): Json<UpsertChallengeRequest>,
) -> Result<Json<ChallengeEnvelope>, AppError> {
    upsert_challenge(state, user, body, true).await
}

async fn upsert_challenge(
    state: Arc<AppState>,
    user: AppwriteUser,
    body: UpsertChallengeRequest,
    update_streak: bool,
) -> Result<Json<ChallengeEnvelope>, AppError> {
    if body.date.trim().is_empty() {
        return Err(AppError::Validation("date must not be empty".into()));
    }
    validate_challenge_payload(&body.challenge, &body.date, update_streak)?;

    let record = state
        .challenge_repo
        .upsert_state(&user.id, &body.date, body.challenge)
        .await?;

    if update_streak {
        if let Some(status) = record
            .challenge
            .get("status")
            .and_then(|v| v.as_str())
            .filter(|s| *s == "completed")
        {
            let _ = status;
            let _ = state
                .challenge_repo
                .update_streak_from_completion(&user.id, &record.date)
                .await?;
        }
    }

    Ok(Json(ChallengeEnvelope {
        challenge: record.challenge,
    }))
}

fn validate_challenge_payload(
    challenge: &Value,
    expected_date: &str,
    completion_endpoint: bool,
) -> Result<(), AppError> {
    let date = challenge
        .get("date")
        .and_then(Value::as_str)
        .ok_or_else(|| AppError::Validation("challenge.date is required".into()))?;
    if date != expected_date {
        return Err(AppError::Validation(
            "challenge.date must match request date".into(),
        ));
    }

    let status = challenge
        .get("status")
        .and_then(Value::as_str)
        .ok_or_else(|| AppError::Validation("challenge.status is required".into()))?;
    if !["not_started", "in_progress", "completed"].contains(&status) {
        return Err(AppError::Validation(
            "challenge.status must be one of not_started|in_progress|completed".into(),
        ));
    }

    let current_index = challenge
        .get("currentExerciseIndex")
        .and_then(Value::as_u64)
        .ok_or_else(|| AppError::Validation("challenge.currentExerciseIndex is required".into()))?
        as usize;
    let exercises = challenge
        .get("exercises")
        .and_then(Value::as_array)
        .ok_or_else(|| AppError::Validation("challenge.exercises must be an array".into()))?;
    if exercises.is_empty() {
        return Err(AppError::Validation(
            "challenge.exercises must not be empty".into(),
        ));
    }
    if current_index >= exercises.len() {
        return Err(AppError::Validation(
            "challenge.currentExerciseIndex out of bounds".into(),
        ));
    }

    let mut completed_count = 0usize;
    for (index, exercise) in exercises.iter().enumerate() {
        let order = exercise
            .get("order")
            .and_then(Value::as_u64)
            .ok_or_else(|| AppError::Validation("exercise.order is required".into()))?
            as usize;
        if order != index {
            return Err(AppError::Validation(
                "exercise.order must match array position".into(),
            ));
        }
        let ex_status = exercise
            .get("status")
            .and_then(Value::as_str)
            .ok_or_else(|| AppError::Validation("exercise.status is required".into()))?;
        if !["locked", "available", "completed"].contains(&ex_status) {
            return Err(AppError::Validation(
                "exercise.status must be one of locked|available|completed".into(),
            ));
        }
        if ex_status == "completed" {
            completed_count += 1;
        }
    }

    let available_indices: Vec<usize> = exercises
        .iter()
        .enumerate()
        .filter_map(|(i, e)| {
            e.get("status")
                .and_then(Value::as_str)
                .filter(|s| *s == "available")
                .map(|_| i)
        })
        .collect();
    if status == "not_started" {
        if exercises
            .iter()
            .skip(1)
            .any(|e| e.get("status").and_then(Value::as_str) != Some("locked"))
        {
            return Err(AppError::Validation(
                "not_started challenge must have only first exercise available".into(),
            ));
        }
        if exercises
            .first()
            .and_then(|e| e.get("status"))
            .and_then(Value::as_str)
            != Some("available")
        {
            return Err(AppError::Validation(
                "not_started challenge must start with first exercise available".into(),
            ));
        }
    }
    if status == "in_progress" && available_indices.is_empty() {
        return Err(AppError::Validation(
            "in_progress challenge must have an available exercise".into(),
        ));
    }
    if status == "completed" && completed_count != exercises.len() {
        return Err(AppError::Validation(
            "completed challenge must have all exercises completed".into(),
        ));
    }
    if completion_endpoint && status != "completed" && available_indices.is_empty() {
        return Err(AppError::Validation(
            "completion update must preserve a next available exercise unless fully completed".into(),
        ));
    }

    Ok(())
}

#[utoipa::path(get, path = "/api/challenge/streak", tag = "Challenge", security(("bearer_auth"=[])), responses((status=200, body=StreakResponse)))]
pub async fn get_streak(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
) -> Result<Json<StreakResponse>, AppError> {
    let streak = state.challenge_repo.get_streak(&user.id).await?;
    Ok(Json(StreakResponse {
        current_challenge_streak: streak.current_challenge_streak,
        longest_challenge_streak: streak.longest_challenge_streak,
        last_completed_date: streak.last_completed_date,
    }))
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
    use axum::{Extension, Json, extract::Query, extract::State};
    use mongodb::{Client, bson::DateTime};
    use tokio::sync::RwLock;

    use super::{
        TodayQuery, UpsertChallengeRequest, complete_exercise, generate, get_streak, get_today,
    };
    use crate::{
        AppState,
        auth::AppwriteUser,
        config::Config,
        models::challenge::{ChallengeState, ChallengeStreak},
        repositories::{
            analysis::MongoAnalysisRepository, challenge::ChallengeRepository,
            profile::MongoProfileRepository, session::MongoSessionRepository,
        },
    };

    struct MemoryChallengeRepository {
        state: Mutex<Option<ChallengeState>>,
        streak: Mutex<ChallengeStreak>,
    }

    impl Default for MemoryChallengeRepository {
        fn default() -> Self {
            Self {
                state: Mutex::new(None),
                streak: Mutex::new(ChallengeStreak {
                    id: None,
                    user_id: "u-1".into(),
                    current_challenge_streak: 0,
                    longest_challenge_streak: 0,
                    last_completed_date: None,
                    updated_at: DateTime::now(),
                }),
            }
        }
    }

    #[async_trait]
    impl ChallengeRepository for MemoryChallengeRepository {
        async fn get_today(
            &self,
            user_id: &str,
            date: &str,
        ) -> Result<Option<ChallengeState>, mongodb::error::Error> {
            Ok(self
                .state
                .lock()
                .expect("lock")
                .clone()
                .filter(|s| s.user_id == user_id && s.date == date))
        }

        async fn upsert_state(
            &self,
            user_id: &str,
            date: &str,
            challenge: serde_json::Value,
        ) -> Result<ChallengeState, mongodb::error::Error> {
            let next = ChallengeState {
                id: None,
                user_id: user_id.to_string(),
                date: date.to_string(),
                challenge,
                updated_at: DateTime::now(),
            };
            *self.state.lock().expect("lock") = Some(next.clone());
            Ok(next)
        }

        async fn get_streak(
            &self,
            _user_id: &str,
        ) -> Result<ChallengeStreak, mongodb::error::Error> {
            Ok(self.streak.lock().expect("lock").clone())
        }

        async fn update_streak_from_completion(
            &self,
            _user_id: &str,
            completed_date: &str,
        ) -> Result<ChallengeStreak, mongodb::error::Error> {
            let mut streak = self.streak.lock().expect("lock");
            streak.current_challenge_streak += 1;
            streak.longest_challenge_streak =
                streak.longest_challenge_streak.max(streak.current_challenge_streak);
            streak.last_completed_date = Some(completed_date.to_string());
            streak.updated_at = DateTime::now();
            Ok(streak.clone())
        }
    }

    async fn build_state(challenge_repo: Arc<dyn ChallengeRepository>) -> Arc<AppState> {
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
            analysis_repo: Arc::new(MongoAnalysisRepository::new(client.database("voice_training"))),
            profile_repo: Arc::new(MongoProfileRepository::new(client.database("voice_training"))),
            session_repo: Arc::new(MongoSessionRepository::new(client.database("voice_training"))),
            challenge_repo,
        })
    }

    #[tokio::test]
    async fn generate_rejects_invalid_order() {
        let repo = Arc::new(MemoryChallengeRepository::default());
        let state = build_state(repo).await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };
        let body = UpsertChallengeRequest {
            date: "2026-05-29".into(),
            challenge: serde_json::json!({
                "date": "2026-05-29",
                "status": "not_started",
                "currentExerciseIndex": 0,
                "exercises": [{"id":"a","order":1,"status":"available"}]
            }),
        };
        let result = generate(State(state), Extension(user), Json(body)).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn complete_exercise_updates_streak_for_completed_status() {
        let repo = Arc::new(MemoryChallengeRepository {
            state: Mutex::new(None),
            streak: Mutex::new(ChallengeStreak {
                id: None,
                user_id: "u-1".into(),
                current_challenge_streak: 0,
                longest_challenge_streak: 0,
                last_completed_date: None,
                updated_at: DateTime::now(),
            }),
        });
        let state = build_state(repo.clone()).await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };
        let body = UpsertChallengeRequest {
            date: "2026-05-29".into(),
            challenge: serde_json::json!({
                "date": "2026-05-29",
                "status": "completed",
                "currentExerciseIndex": 0,
                "exercises": [
                    {"id":"a","order":0,"status":"completed"},
                    {"id":"b","order":1,"status":"completed"}
                ]
            }),
        };
        let _ = complete_exercise(State(state.clone()), Extension(user.clone()), Json(body))
            .await
            .expect("should pass");
        let Json(streak) = get_streak(State(state), Extension(user)).await.expect("streak");
        assert_eq!(streak.current_challenge_streak, 1);
    }

    #[tokio::test]
    async fn today_returns_none_when_absent() {
        let repo = Arc::new(MemoryChallengeRepository::default());
        let state = build_state(repo).await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };
        let Json(payload) = get_today(
            State(state),
            Extension(user),
            Query(TodayQuery {
                date: "2026-05-29".into(),
            }),
        )
        .await
        .expect("today");
        assert!(payload.challenge.is_none());
    }
}
