use async_trait::async_trait;
use futures::TryStreamExt;
use mongodb::bson::{DateTime, doc};

use crate::models::session::Session;

/// Input payload used to persist a training session.
#[derive(Debug, Clone)]
pub struct CreateSessionInput {
    /// Authenticated user ID.
    pub user_id: String,
    /// Session duration in seconds.
    pub duration_seconds: u32,
    /// Average pitch in Hz.
    pub average_pitch: f64,
    /// Session score in `[0, 100]`.
    pub score: u32,
    /// Exercise type tag.
    pub exercise_type: String,
    /// Goal tag.
    pub goal: String,
}

/// Repository abstraction for training session persistence.
#[async_trait]
pub trait SessionRepository: Send + Sync {
    /// Insert a session record and return inserted ID hex when available.
    async fn insert_session(
        &self,
        input: CreateSessionInput,
    ) -> Result<Option<String>, mongodb::error::Error>;

    /// List sessions for a user ordered by most recent first.
    async fn list_by_user_id(&self, user_id: &str) -> Result<Vec<Session>, mongodb::error::Error>;
}

/// MongoDB-backed implementation of [`SessionRepository`].
pub struct MongoSessionRepository {
    db: mongodb::Database,
}

impl MongoSessionRepository {
    /// Create a session repository bound to a MongoDB database handle.
    pub fn new(db: mongodb::Database) -> Self {
        Self { db }
    }
}

#[async_trait]
impl SessionRepository for MongoSessionRepository {
    async fn insert_session(
        &self,
        input: CreateSessionInput,
    ) -> Result<Option<String>, mongodb::error::Error> {
        let col = self.db.collection::<Session>("sessions");
        let session = build_session_from_input(input, DateTime::now());

        let result = col.insert_one(session).await?;
        Ok(result.inserted_id.as_object_id().map(|oid| oid.to_hex()))
    }

    async fn list_by_user_id(&self, user_id: &str) -> Result<Vec<Session>, mongodb::error::Error> {
        let col = self.db.collection::<Session>("sessions");
        col.find(doc! { "user_id": user_id })
            .sort(doc! { "date": -1 })
            .await?
            .try_collect()
            .await
    }
}

fn build_session_from_input(input: CreateSessionInput, now: DateTime) -> Session {
    Session {
        id: None,
        user_id: input.user_id,
        date: now,
        duration_seconds: input.duration_seconds,
        average_pitch: input.average_pitch,
        score: input.score,
        exercise_type: input.exercise_type,
        goal: input.goal,
    }
}

#[cfg(test)]
mod tests {
    use mongodb::bson::DateTime;

    use super::{CreateSessionInput, build_session_from_input};

    #[test]
    fn maps_create_input_to_session_model() {
        let now = DateTime::now();
        let session = build_session_from_input(
            CreateSessionInput {
                user_id: "u-1".into(),
                duration_seconds: 120,
                average_pitch: 185.0,
                score: 90,
                exercise_type: "pitch".into(),
                goal: "feminine".into(),
            },
            now,
        );
        assert_eq!(session.user_id, "u-1");
        assert_eq!(session.duration_seconds, 120);
        assert_eq!(session.average_pitch, 185.0);
        assert_eq!(session.score, 90);
        assert_eq!(session.exercise_type, "pitch");
        assert_eq!(session.goal, "feminine");
    }
}
