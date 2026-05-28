use mongodb::bson::{doc, DateTime, Document};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisArtifact {
    pub user_id: String,
    pub created_at: DateTime,
    pub summary: String,
    pub voice_presentation_score: f64,
    pub voice_presentation_confidence: f64,
}

pub async fn insert_analysis(
    db: &mongodb::Database,
    artifact: &AnalysisArtifact,
) -> Result<(), mongodb::error::Error> {
    let col = db.collection::<Document>("analysis_artifacts");
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
