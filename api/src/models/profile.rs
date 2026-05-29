use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct InitialVoiceSample {
    pub name: Option<String>,
    #[serde(rename = "type")]
    pub sample_type: Option<String>,
    pub size: Option<i64>,
    pub source: Option<String>,
    pub saved_at: Option<String>,
    #[serde(flatten)]
    pub extra: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub appwrite_user_id: String,
    pub voice_goal: Option<String>,
    pub experience_level: Option<String>,
    pub target_pitch_range: Option<Vec<f64>>,
    pub training_focus: Option<Vec<String>>,
    pub initial_voice_sample: Option<InitialVoiceSample>,
}
