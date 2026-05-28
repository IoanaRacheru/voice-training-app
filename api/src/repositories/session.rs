use async_trait::async_trait;
use futures::TryStreamExt;
use mongodb::bson::{doc, DateTime};

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
        let session = Session {
            id: None,
            user_id: input.user_id,
            date: DateTime::now(),
            duration_seconds: input.duration_seconds,
            average_pitch: input.average_pitch,
            score: input.score,
            exercise_type: input.exercise_type,
            goal: input.goal,
        };

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
