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
