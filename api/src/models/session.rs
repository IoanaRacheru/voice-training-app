use mongodb::bson::{oid::ObjectId, DateTime};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Session {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub user_id: String,
    pub date: DateTime,
    pub duration_seconds: u32,
    pub average_pitch: f64,
    pub score: u32,
    pub exercise_type: String,
    pub goal: String,
}
