use async_trait::async_trait;
use mongodb::bson::{doc, DateTime, Document};
use serde::{Deserialize, Serialize};

/// Persisted analytics artifact produced by `/api/analyze`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisArtifact {
    /// Authenticated user ID owning this artifact.
    pub user_id: String,
    /// Creation timestamp (UTC).
    pub created_at: DateTime,
    /// Human-readable summary from the analysis engine.
    pub summary: String,
    /// Estimated voice presentation score in `[0, 100]`.
    pub voice_presentation_score: f64,
    /// Confidence estimate in `[0, 1]`.
    pub voice_presentation_confidence: f64,
}

/// Repository abstraction for analysis artifact persistence.
#[async_trait]
pub trait AnalysisRepository: Send + Sync {
    /// Save an analysis artifact to the backing data store.
    async fn insert_analysis(
        &self,
        artifact: &AnalysisArtifact,
    ) -> Result<(), mongodb::error::Error>;
}

/// MongoDB-backed implementation of [`AnalysisRepository`].
pub struct MongoAnalysisRepository {
    db: mongodb::Database,
}

impl MongoAnalysisRepository {
    /// Create a new repository bound to a MongoDB database handle.
    pub fn new(db: mongodb::Database) -> Self {
        Self { db }
    }
}

#[async_trait]
impl AnalysisRepository for MongoAnalysisRepository {
    async fn insert_analysis(
        &self,
        artifact: &AnalysisArtifact,
    ) -> Result<(), mongodb::error::Error> {
        let col = self.db.collection::<Document>("analysis_artifacts");
        col.insert_one(doc! {
            "user_id": &artifact.user_id,
            "created_at": artifact.created_at,
            "summary": &artifact.summary,
            "voice_presentation_score": artifact.voice_presentation_score,
            "voice_presentation_confidence": artifact.voice_presentation_confidence,
        })
        .await?;
        Ok(())
    }
}
