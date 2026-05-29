use async_trait::async_trait;
use chrono::NaiveDate;
use mongodb::bson::{DateTime, doc};

use crate::models::challenge::{ChallengeState, ChallengeStreak};

/// Repository abstraction for challenge state and streak persistence.
#[async_trait]
pub trait ChallengeRepository: Send + Sync {
    async fn get_today(
        &self,
        user_id: &str,
        date: &str,
    ) -> Result<Option<ChallengeState>, mongodb::error::Error>;

    async fn upsert_state(
        &self,
        user_id: &str,
        date: &str,
        challenge: serde_json::Value,
    ) -> Result<ChallengeState, mongodb::error::Error>;

    async fn get_streak(&self, user_id: &str) -> Result<ChallengeStreak, mongodb::error::Error>;

    async fn update_streak_from_completion(
        &self,
        user_id: &str,
        completed_date: &str,
    ) -> Result<ChallengeStreak, mongodb::error::Error>;
}

pub struct MongoChallengeRepository {
    db: mongodb::Database,
}

impl MongoChallengeRepository {
    pub fn new(db: mongodb::Database) -> Self {
        Self { db }
    }
}

fn compute_next_streak(
    current_streak: u32,
    last_completed_date: Option<&str>,
    completed_date: &str,
) -> u32 {
    if last_completed_date == Some(completed_date) {
        return current_streak;
    }

    let maybe_today = NaiveDate::parse_from_str(completed_date, "%Y-%m-%d").ok();
    let maybe_last = last_completed_date.and_then(|d| NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());

    match (maybe_last, maybe_today) {
        (Some(last), Some(today)) => {
            let gap = (today - last).num_days();
            if gap == 1 {
                current_streak.saturating_add(1)
            } else if gap > 1 {
                1
            } else {
                current_streak
            }
        }
        _ => {
            if current_streak == 0 {
                1
            } else {
                current_streak.saturating_add(1)
            }
        }
    }
}

#[async_trait]
impl ChallengeRepository for MongoChallengeRepository {
    async fn get_today(
        &self,
        user_id: &str,
        date: &str,
    ) -> Result<Option<ChallengeState>, mongodb::error::Error> {
        let col = self.db.collection::<ChallengeState>("challenge_states");
        col.find_one(doc! {"user_id": user_id, "date": date}).await
    }

    async fn upsert_state(
        &self,
        user_id: &str,
        date: &str,
        challenge: serde_json::Value,
    ) -> Result<ChallengeState, mongodb::error::Error> {
        let col = self.db.collection::<ChallengeState>("challenge_states");
        let now = DateTime::now();
        col.update_one(
            doc! {"user_id": user_id, "date": date},
            doc! {
                "$set": {
                    "challenge": mongodb::bson::to_bson(&challenge).unwrap_or(mongodb::bson::Bson::Null),
                    "updated_at": now,
                },
                "$setOnInsert": {
                    "user_id": user_id,
                    "date": date,
                }
            },
        )
        .upsert(true)
        .await?;

        Ok(col
            .find_one(doc! {"user_id": user_id, "date": date})
            .await?
            .expect("challenge state should exist after upsert"))
    }

    async fn get_streak(&self, user_id: &str) -> Result<ChallengeStreak, mongodb::error::Error> {
        let col = self.db.collection::<ChallengeStreak>("challenge_streaks");
        if let Some(found) = col.find_one(doc! {"user_id": user_id}).await? {
            return Ok(found);
        }
        let now = DateTime::now();
        let seed = ChallengeStreak {
            id: None,
            user_id: user_id.to_string(),
            current_challenge_streak: 0,
            longest_challenge_streak: 0,
            last_completed_date: None,
            updated_at: now,
        };
        let _ = col.insert_one(seed.clone()).await?;
        Ok(seed)
    }

    async fn update_streak_from_completion(
        &self,
        user_id: &str,
        completed_date: &str,
    ) -> Result<ChallengeStreak, mongodb::error::Error> {
        let col = self.db.collection::<ChallengeStreak>("challenge_streaks");
        let current = self.get_streak(user_id).await?;

        let mut next = current.clone();
        if current.last_completed_date.as_deref() != Some(completed_date) {
            next.current_challenge_streak = compute_next_streak(
                current.current_challenge_streak,
                current.last_completed_date.as_deref(),
                completed_date,
            );
            next.longest_challenge_streak =
                next.longest_challenge_streak.max(next.current_challenge_streak);
            next.last_completed_date = Some(completed_date.to_string());
            next.updated_at = DateTime::now();
        }

        col.update_one(
            doc! {"user_id": user_id},
            doc! {
                "$set": {
                    "current_challenge_streak": next.current_challenge_streak as i64,
                    "longest_challenge_streak": next.longest_challenge_streak as i64,
                    "last_completed_date": next.last_completed_date.clone(),
                    "updated_at": next.updated_at,
                },
                "$setOnInsert": {"user_id": user_id}
            },
        )
        .upsert(true)
        .await?;

        self.get_streak(user_id).await
    }
}

#[cfg(test)]
mod tests {
    use super::compute_next_streak;

    #[test]
    fn streak_increments_for_next_day() {
        assert_eq!(compute_next_streak(3, Some("2026-05-27"), "2026-05-28"), 4);
    }

    #[test]
    fn streak_resets_after_gap() {
        assert_eq!(compute_next_streak(5, Some("2026-05-25"), "2026-05-28"), 1);
    }

    #[test]
    fn streak_deduplicates_same_day() {
        assert_eq!(compute_next_streak(5, Some("2026-05-28"), "2026-05-28"), 5);
    }
}
