use mongodb::bson::{DateTime, oid::ObjectId};
use serde::{Deserialize, Serialize};


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChallengeState {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub user_id: String,
    pub date: String,
    pub challenge: serde_json::Value,
    pub updated_at: DateTime,
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChallengeStreak {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    pub user_id: String,
    pub current_challenge_streak: u32,
    pub longest_challenge_streak: u32,
    pub last_completed_date: Option<String>,
    pub updated_at: DateTime,
}
