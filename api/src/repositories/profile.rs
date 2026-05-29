use async_trait::async_trait;
use mongodb::bson::{Bson, Document, doc};

use crate::models::profile::{InitialVoiceSample, Profile};


#[derive(Debug, Clone, Default)]
pub struct ProfilePatch {
    
    pub voice_goal: Option<String>,
    
    pub experience_level: Option<String>,
    
    pub target_pitch_range: Option<Vec<f64>>,
    
    pub training_focus: Option<Vec<String>>,
    
    pub initial_voice_sample: Option<Option<InitialVoiceSample>>,
}


#[async_trait]
pub trait ProfileRepository: Send + Sync {
    
    async fn find_by_user_id(
        &self,
        user_id: &str,
    ) -> Result<Option<Profile>, mongodb::error::Error>;

    
    async fn upsert_by_user_id(
        &self,
        user_id: &str,
        email: &str,
        patch: ProfilePatch,
    ) -> Result<(), mongodb::error::Error>;
}


pub struct MongoProfileRepository {
    db: mongodb::Database,
}

impl MongoProfileRepository {
    
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
        let set = build_profile_set_doc(email, patch);

        col.update_one(doc! { "appwrite_user_id": user_id }, doc! { "$set": set })
            .upsert(true)
            .await?;
        Ok(())
    }
}

fn build_profile_set_doc(email: &str, patch: ProfilePatch) -> Document {
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
    if let Some(v) = patch.initial_voice_sample {
        match v {
            Some(sample) => {
                let bson = mongodb::bson::to_bson(&sample)
                    .unwrap_or(Bson::Document(doc! {}));
                set.insert("initial_voice_sample", bson);
            }
            None => {
                set.insert("initial_voice_sample", Bson::Null);
            }
        }
    }
    set
}

#[cfg(test)]
mod tests {
    use super::{ProfilePatch, build_profile_set_doc};

    #[test]
    fn profile_set_doc_includes_only_present_fields() {
        let doc = build_profile_set_doc(
            "u1@example.com",
            ProfilePatch {
                voice_goal: Some("feminine".into()),
                experience_level: None,
                target_pitch_range: Some(vec![160.0, 220.0]),
                training_focus: None,
                initial_voice_sample: None,
            },
        );
        assert!(doc.get("email").is_some());
        assert!(doc.get("voice_goal").is_some());
        assert!(doc.get("target_pitch_range").is_some());
        assert!(doc.get("experience_level").is_none());
        assert!(doc.get("training_focus").is_none());
    }
}
