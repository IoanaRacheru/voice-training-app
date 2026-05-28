use async_trait::async_trait;
use mongodb::bson::{doc, Document};

use crate::models::profile::Profile;

/// Mutable subset of profile fields accepted by `PATCH /api/me`.
#[derive(Debug, Clone, Default)]
pub struct ProfilePatch {
    /// Optional voice-goal value.
    pub voice_goal: Option<String>,
    /// Optional experience-level value.
    pub experience_level: Option<String>,
    /// Optional target pitch range.
    pub target_pitch_range: Option<Vec<f64>>,
    /// Optional training focus list.
    pub training_focus: Option<Vec<String>>,
}

/// Repository abstraction for user profile persistence.
#[async_trait]
pub trait ProfileRepository: Send + Sync {
    /// Fetch a profile by authenticated user ID.
    async fn find_by_user_id(
        &self,
        user_id: &str,
    ) -> Result<Option<Profile>, mongodb::error::Error>;

    /// Upsert profile fields for a user.
    async fn upsert_by_user_id(
        &self,
        user_id: &str,
        email: &str,
        patch: ProfilePatch,
    ) -> Result<(), mongodb::error::Error>;
}

/// MongoDB-backed implementation of [`ProfileRepository`].
pub struct MongoProfileRepository {
    db: mongodb::Database,
}

impl MongoProfileRepository {
    /// Create a profile repository bound to a MongoDB database handle.
    pub fn new(db: mongodb::Database) -> Self {
        Self { db }
    }
}

#[async_trait]
impl ProfileRepository for MongoProfileRepository {
    async fn find_by_user_id(
        &self,
        user_id: &str,
    ) -> Result<Option<Profile>, mongodb::error::Error> {
        let col = self.db.collection::<Profile>("profiles");
        col.find_one(doc! { "appwrite_user_id": user_id }).await
    }

    async fn upsert_by_user_id(
        &self,
        user_id: &str,
        email: &str,
        patch: ProfilePatch,
    ) -> Result<(), mongodb::error::Error> {
        let col = self.db.collection::<Document>("profiles");
        let mut set = doc! { "email": email };
        if let Some(v) = patch.voice_goal {
            set.insert("voice_goal", v);
        }
        if let Some(v) = patch.experience_level {
            set.insert("experience_level", v);
        }
        if let Some(v) = patch.target_pitch_range {
            set.insert("target_pitch_range", v);
        }
        if let Some(v) = patch.training_focus {
            set.insert("training_focus", v);
        }

        col.update_one(
            doc! { "appwrite_user_id": user_id },
            doc! { "$set": set },
        )
        .upsert(true)
        .await?;
        Ok(())
    }
}
