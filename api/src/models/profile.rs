use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub appwrite_user_id: String,
    pub voice_goal: Option<String>,
    pub experience_level: Option<String>,
    pub target_pitch_range: Option<Vec<f64>>,
    pub training_focus: Option<Vec<String>>,
}
