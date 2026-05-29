use std::sync::Arc;

use axum::{Extension, Json, Router, extract::State, routing::get};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::{AppState, auth::AppwriteUser, errors::AppError, repositories::profile::ProfilePatch};

/// Register profile routes.
pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/api/me", get(me).patch(patch_me))
}

/// Return the authenticated user's profile envelope.
#[utoipa::path(
    get,
    path = "/api/me",
    tag = "User",
    security(
        ("bearer_auth" = [])
    ),
    responses(
        (status = 200, description = "Authenticated profile payload", body = MeResponse),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn me(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
) -> Result<Json<MeResponse>, AppError> {
    let profile = state.profile_repo.find_by_user_id(&user.id).await?;

    let (voice_goal, experience_level, target_pitch_range, training_focus) = match profile {
        Some(p) => (
            p.voice_goal,
            p.experience_level,
            p.target_pitch_range,
            p.training_focus,
        ),
        None => (None, None, None, None),
    };

    Ok(Json(MeResponse {
        user_id: user.id,
        email: user.email,
        voice_goal,
        experience_level,
        target_pitch_range,
        training_focus,
    }))
}

/// Response payload for `GET /api/me`.
#[derive(Debug, Serialize, ToSchema)]
pub struct MeResponse {
    /// Authenticated user ID.
    pub user_id: String,
    /// Authenticated user email.
    pub email: String,
    /// Optional selected voice goal.
    pub voice_goal: Option<String>,
    /// Optional experience level.
    pub experience_level: Option<String>,
    /// Optional target pitch range in Hz.
    pub target_pitch_range: Option<Vec<f64>>,
    /// Optional training-focus tags.
    pub training_focus: Option<Vec<String>>,
}

/// Request payload for `PATCH /api/me`.
#[derive(Deserialize, ToSchema)]
#[serde(deny_unknown_fields)]
pub struct PatchMeRequest {
    /// Optional voice goal.
    pub voice_goal: Option<String>,
    /// Optional experience level.
    pub experience_level: Option<String>,
    /// Optional target pitch range.
    pub target_pitch_range: Option<Vec<f64>>,
    /// Optional training-focus tags.
    pub training_focus: Option<Vec<String>>,
}

/// Upsert profile fields for the authenticated user.
#[utoipa::path(
    patch,
    path = "/api/me",
    tag = "User",
    security(
        ("bearer_auth" = [])
    ),
    request_body = PatchMeRequest,
    responses(
        (status = 200, description = "Profile updated", body = PatchMeResponse),
        (status = 400, description = "Invalid request"),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn patch_me(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Json(body): Json<PatchMeRequest>,
) -> Result<Json<PatchMeResponse>, AppError> {
    state
        .profile_repo
        .upsert_by_user_id(
            &user.id,
            &user.email,
            ProfilePatch {
                voice_goal: body.voice_goal,
                experience_level: body.experience_level,
                target_pitch_range: body.target_pitch_range,
                training_focus: body.training_focus,
            },
        )
        .await?;

    Ok(Json(PatchMeResponse {
        message: "Profile updated".into(),
    }))
}

/// Response payload for `PATCH /api/me`.
#[derive(Debug, Serialize, ToSchema)]
pub struct PatchMeResponse {
    /// Human-readable operation status.
    pub message: String,
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
    use mongodb::Client;
    use tokio::sync::RwLock;

    use super::{PatchMeRequest, me, patch_me};
    use crate::{
        AppState,
        auth::AppwriteUser,
        config::Config,
        models::profile::Profile,
        repositories::{
            analysis::MongoAnalysisRepository,
            profile::{ProfilePatch, ProfileRepository},
            challenge::MongoChallengeRepository,
            session::MongoSessionRepository,
        },
    };

    struct MemoryProfileRepository {
        profile: Arc<Mutex<Option<Profile>>>,
    }

    #[async_trait]
    impl ProfileRepository for MemoryProfileRepository {
        async fn find_by_user_id(
            &self,
            _user_id: &str,
        ) -> Result<Option<Profile>, mongodb::error::Error> {
            Ok(self.profile.lock().expect("lock").clone())
        }

        async fn upsert_by_user_id(
            &self,
            user_id: &str,
            _email: &str,
            patch: ProfilePatch,
        ) -> Result<(), mongodb::error::Error> {
            let mut guard = self.profile.lock().expect("lock");
            let mut current = guard.clone().unwrap_or(Profile {
                id: None,
                appwrite_user_id: user_id.to_string(),
                voice_goal: None,
                experience_level: None,
                target_pitch_range: None,
                training_focus: None,
            });
            if patch.voice_goal.is_some() {
                current.voice_goal = patch.voice_goal;
            }
            if patch.experience_level.is_some() {
                current.experience_level = patch.experience_level;
            }
            if patch.target_pitch_range.is_some() {
                current.target_pitch_range = patch.target_pitch_range;
            }
            if patch.training_focus.is_some() {
                current.training_focus = patch.training_focus;
            }
            *guard = Some(current);
            Ok(())
        }
    }

    async fn build_state(profile: Option<Profile>) -> Arc<AppState> {
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
            profile_repo: Arc::new(MemoryProfileRepository {
                profile: Arc::new(Mutex::new(profile)),
            }),
            session_repo: Arc::new(MongoSessionRepository::new(
                client.database("voice_training"),
            )),
            challenge_repo: Arc::new(MongoChallengeRepository::new(
                client.database("voice_training"),
            )),
        })
    }

    #[tokio::test]
    async fn me_returns_profile_payload() {
        let state = build_state(Some(Profile {
            id: None,
            appwrite_user_id: "u-1".into(),
            voice_goal: Some("feminine".into()),
            experience_level: Some("beginner".into()),
            target_pitch_range: Some(vec![160.0, 220.0]),
            training_focus: Some(vec!["pitch".into()]),
        }))
        .await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };
        let resp = me(State(state), Extension(user)).await.expect("ok");
        assert_eq!(resp.0.user_id, "u-1");
        assert_eq!(resp.0.voice_goal.as_deref(), Some("feminine"));
    }

    #[tokio::test]
    async fn patch_me_updates_profile() {
        let state = build_state(None).await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };
        let _ = patch_me(
            State(state.clone()),
            Extension(user.clone()),
            Json(PatchMeRequest {
                voice_goal: Some("androgynous".into()),
                experience_level: Some("intermediate".into()),
                target_pitch_range: None,
                training_focus: Some(vec!["resonance".into()]),
            }),
        )
        .await
        .expect("ok");
        let me_resp = me(State(state), Extension(user)).await.expect("ok");
        assert_eq!(me_resp.0.voice_goal.as_deref(), Some("androgynous"));
        assert_eq!(me_resp.0.experience_level.as_deref(), Some("intermediate"));
    }
}
