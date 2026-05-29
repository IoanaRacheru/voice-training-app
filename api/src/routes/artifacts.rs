use std::sync::Arc;

use axum::{
    Extension, Json, Router,
    extract::{Path, Query, State},
    routing::get,
};
use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::{AppState, auth::AppwriteUser, errors::AppError};

/// Register analysis artifact history routes.
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/api/analysis-artifacts", get(list_artifacts))
        .route("/api/analysis-artifacts/:id", get(get_artifact))
}

/// Query params for artifact history list.
#[derive(Debug, Deserialize, ToSchema)]
pub struct ListArtifactsQuery {
    /// Max items per page.
    pub limit: Option<u32>,
    /// Pagination offset.
    pub offset: Option<u64>,
}

/// List item for analysis artifact history.
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ArtifactItem {
    /// Artifact identifier in hex format.
    pub id: String,
    /// Creation timestamp in RFC3339 format.
    pub created_at: String,
    /// Human-readable session summary.
    pub summary: String,
    /// Voice presentation score in `[0,100]`.
    pub voice_presentation_score: f64,
    /// Score confidence in `[0,1]`.
    pub voice_presentation_confidence: f64,
}

/// Response envelope for paginated artifact history.
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct ArtifactListResponse {
    /// Pagination limit used by this response.
    pub limit: u32,
    /// Pagination offset used by this response.
    pub offset: u64,
    /// Artifact history items.
    pub items: Vec<ArtifactItem>,
}

/// List analysis artifacts for authenticated user.
#[utoipa::path(
    get,
    path = "/api/analysis-artifacts",
    tag = "Analysis",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("limit" = Option<u32>, Query, description = "Page size, default 20, max 100"),
        ("offset" = Option<u64>, Query, description = "Offset, default 0")
    ),
    responses(
        (status = 200, description = "Artifact history", body = ArtifactListResponse),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn list_artifacts(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Query(query): Query<ListArtifactsQuery>,
) -> Result<Json<ArtifactListResponse>, AppError> {
    let limit = query.limit.unwrap_or(20).clamp(1, 100);
    let offset = query.offset.unwrap_or(0);
    let artifacts = state
        .analysis_repo
        .list_by_user_id(&user.id, limit, offset)
        .await?;
    let items = artifacts
        .into_iter()
        .filter_map(|a| {
            let id = a.id?.to_hex();
            let dt = chrono::DateTime::<chrono::Utc>::from(a.created_at.to_system_time());
            Some(ArtifactItem {
                id,
                created_at: dt.to_rfc3339(),
                summary: a.summary,
                voice_presentation_score: a.voice_presentation_score,
                voice_presentation_confidence: a.voice_presentation_confidence,
            })
        })
        .collect();

    Ok(Json(ArtifactListResponse {
        limit,
        offset,
        items,
    }))
}

/// Get one analysis artifact for authenticated user.
#[utoipa::path(
    get,
    path = "/api/analysis-artifacts/{id}",
    tag = "Analysis",
    security(
        ("bearer_auth" = [])
    ),
    params(
        ("id" = String, Path, description = "Artifact id")
    ),
    responses(
        (status = 200, description = "Artifact detail", body = ArtifactItem),
        (status = 400, description = "Invalid id"),
        (status = 404, description = "Artifact not found"),
        (status = 401, description = "Unauthorized")
    )
)]
pub async fn get_artifact(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<AppwriteUser>,
    Path(id): Path<String>,
) -> Result<Json<ArtifactItem>, AppError> {
    let object_id =
        ObjectId::parse_str(&id).map_err(|_| AppError::Validation("invalid artifact id".into()))?;
    let artifact = state
        .analysis_repo
        .find_by_id_for_user(&user.id, object_id)
        .await?
        .ok_or_else(|| AppError::NotFound("artifact not found".into()))?;

    let dt = chrono::DateTime::<chrono::Utc>::from(artifact.created_at.to_system_time());
    let item = ArtifactItem {
        id: artifact.id.map(|v| v.to_hex()).unwrap_or(id),
        created_at: dt.to_rfc3339(),
        summary: artifact.summary,
        voice_presentation_score: artifact.voice_presentation_score,
        voice_presentation_confidence: artifact.voice_presentation_confidence,
    };
    Ok(Json(item))
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use app_core::{
        Engine,
        asr::{SimplePronunciationEvaluator, VoskAsrStub},
        dsp::EnergyVadDetector,
        llm::RuleBasedCoach,
        tools::{DeterministicDspProsodyTool, DeterministicDspVoicePresentationTool},
    };
    use async_trait::async_trait;
    use axum::{Extension, Json, extract::State};
    use mongodb::{
        Client,
        bson::{DateTime, oid::ObjectId},
    };
    use tokio::sync::RwLock;

    use super::{ListArtifactsQuery, get_artifact, list_artifacts};
    use crate::{
        AppState,
        auth::AppwriteUser,
        config::Config,
        repositories::{
            analysis::{AnalysisArtifact, AnalysisRepository},
            profile::MongoProfileRepository,
            challenge::MongoChallengeRepository,
            session::MongoSessionRepository,
        },
    };

    struct MemoryAnalysisRepository {
        artifacts: Vec<AnalysisArtifact>,
    }

    #[async_trait]
    impl AnalysisRepository for MemoryAnalysisRepository {
        async fn insert_analysis(
            &self,
            _artifact: &AnalysisArtifact,
        ) -> Result<(), mongodb::error::Error> {
            Ok(())
        }

        async fn list_by_user_id(
            &self,
            user_id: &str,
            limit: u32,
            offset: u64,
        ) -> Result<Vec<AnalysisArtifact>, mongodb::error::Error> {
            let mut filtered: Vec<AnalysisArtifact> = self
                .artifacts
                .iter()
                .filter(|a| a.user_id == user_id)
                .cloned()
                .collect();
            filtered.sort_by_key(|a| a.created_at);
            filtered.reverse();
            Ok(filtered
                .into_iter()
                .skip(offset as usize)
                .take(limit as usize)
                .collect())
        }

        async fn find_by_id_for_user(
            &self,
            user_id: &str,
            id: ObjectId,
        ) -> Result<Option<AnalysisArtifact>, mongodb::error::Error> {
            Ok(self
                .artifacts
                .iter()
                .find(|a| a.user_id == user_id && a.id == Some(id))
                .cloned())
        }
    }

    async fn build_state(artifacts: Vec<AnalysisArtifact>) -> Arc<AppState> {
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
                provider_strict: true,
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
            analysis_repo: Arc::new(MemoryAnalysisRepository { artifacts }),
            profile_repo: Arc::new(MongoProfileRepository::new(
                client.database("voice_training"),
            )),
            session_repo: Arc::new(MongoSessionRepository::new(
                client.database("voice_training"),
            )),
            challenge_repo: Arc::new(MongoChallengeRepository::new(
                client.database("voice_training"),
            )),
        })
    }

    fn artifact(user_id: &str, summary: &str, score: f64, conf: f64) -> AnalysisArtifact {
        AnalysisArtifact {
            id: Some(ObjectId::new()),
            user_id: user_id.to_string(),
            created_at: DateTime::now(),
            summary: summary.to_string(),
            voice_presentation_score: score,
            voice_presentation_confidence: conf,
        }
    }

    #[tokio::test]
    async fn list_artifacts_uses_defaults_and_filters_by_user() {
        let a1 = artifact("u-1", "first", 55.0, 0.7);
        let a2 = artifact("u-2", "other", 48.0, 0.6);
        let state = build_state(vec![a1.clone(), a2]).await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };
        let Json(payload) = list_artifacts(
            State(state),
            Extension(user),
            axum::extract::Query(ListArtifactsQuery {
                limit: None,
                offset: None,
            }),
        )
        .await
        .expect("list should succeed");

        assert_eq!(payload.limit, 20);
        assert_eq!(payload.offset, 0);
        assert_eq!(payload.items.len(), 1);
        assert_eq!(payload.items[0].summary, a1.summary);
    }

    #[tokio::test]
    async fn list_artifacts_clamps_limit_and_applies_offset() {
        let a1 = artifact("u-1", "one", 50.0, 0.6);
        let a2 = artifact("u-1", "two", 51.0, 0.7);
        let a3 = artifact("u-1", "three", 52.0, 0.8);
        let state = build_state(vec![a1, a2, a3]).await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };
        let Json(payload) = list_artifacts(
            State(state),
            Extension(user),
            axum::extract::Query(ListArtifactsQuery {
                limit: Some(999),
                offset: Some(1),
            }),
        )
        .await
        .expect("list should succeed");

        assert_eq!(payload.limit, 100);
        assert_eq!(payload.offset, 1);
        assert_eq!(payload.items.len(), 2);
    }

    #[tokio::test]
    async fn get_artifact_returns_item_for_owner() {
        let a = artifact("u-1", "owned", 62.0, 0.85);
        let id = a.id.expect("id").to_hex();
        let state = build_state(vec![a.clone()]).await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };

        let Json(item) = get_artifact(State(state), Extension(user), axum::extract::Path(id))
            .await
            .expect("detail should succeed");
        assert_eq!(item.summary, "owned");
    }

    #[tokio::test]
    async fn get_artifact_rejects_invalid_id() {
        let state = build_state(Vec::new()).await;
        let user = AppwriteUser {
            id: "u-1".into(),
            email: "u1@example.com".into(),
        };
        let err = get_artifact(
            State(state),
            Extension(user),
            axum::extract::Path("bad-id".into()),
        )
        .await
        .expect_err("invalid id should fail");
        assert!(err.to_string().contains("invalid artifact id"));
    }

    #[tokio::test]
    async fn get_artifact_returns_not_found_for_other_user() {
        let a = artifact("u-1", "owned", 62.0, 0.85);
        let id = a.id.expect("id").to_hex();
        let state = build_state(vec![a]).await;
        let user = AppwriteUser {
            id: "u-2".into(),
            email: "u2@example.com".into(),
        };
        let err = get_artifact(State(state), Extension(user), axum::extract::Path(id))
            .await
            .expect_err("other user must not access");
        assert!(err.to_string().contains("artifact not found"));
    }
}
