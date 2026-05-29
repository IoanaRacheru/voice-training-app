use async_trait::async_trait;
use futures::TryStreamExt;
use mongodb::bson::{DateTime, Document, doc, oid::ObjectId};
use serde::{Deserialize, Serialize};


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisArtifact {
    
    pub id: Option<ObjectId>,
    
    pub user_id: String,
    
    pub created_at: DateTime,
    
    pub summary: String,
    
    pub voice_presentation_score: f64,
    
    pub voice_presentation_confidence: f64,
}


#[async_trait]
pub trait AnalysisRepository: Send + Sync {
    
    async fn insert_analysis(
        &self,
        artifact: &AnalysisArtifact,
    ) -> Result<(), mongodb::error::Error>;

    
    async fn list_by_user_id(
        &self,
        user_id: &str,
        limit: u32,
        offset: u64,
    ) -> Result<Vec<AnalysisArtifact>, mongodb::error::Error>;

    
    async fn find_by_id_for_user(
        &self,
        user_id: &str,
        id: ObjectId,
    ) -> Result<Option<AnalysisArtifact>, mongodb::error::Error>;
}


pub struct MongoAnalysisRepository {
    db: mongodb::Database,
}

impl MongoAnalysisRepository {
    
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

    async fn list_by_user_id(
        &self,
        user_id: &str,
        limit: u32,
        offset: u64,
    ) -> Result<Vec<AnalysisArtifact>, mongodb::error::Error> {
        let col = self.db.collection::<AnalysisArtifact>("analysis_artifacts");
        col.find(doc! { "user_id": user_id })
            .sort(doc! { "created_at": -1 })
            .skip(offset)
            .limit(limit as i64)
            .await?
            .try_collect()
            .await
    }

    async fn find_by_id_for_user(
        &self,
        user_id: &str,
        id: ObjectId,
    ) -> Result<Option<AnalysisArtifact>, mongodb::error::Error> {
        let col = self.db.collection::<AnalysisArtifact>("analysis_artifacts");
        col.find_one(doc! { "_id": id, "user_id": user_id }).await
    }
}
