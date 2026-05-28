use mongodb::{
    bson::doc,
    options::{ClientOptions, IndexOptions},
    Client, Database, IndexModel,
};

pub async fn init(mongodb_uri: &str) -> Result<Database, mongodb::error::Error> {
    let options = ClientOptions::parse(mongodb_uri).await?;
    let client = Client::with_options(options)?;

    let db = client
        .default_database()
        .unwrap_or_else(|| client.database("voice_training"));

    // Unique index on profiles.appwrite_user_id
    let profiles = db.collection::<mongodb::bson::Document>("profiles");
    profiles
        .create_index(
            IndexModel::builder()
                .keys(doc! { "appwrite_user_id": 1 })
                .options(IndexOptions::builder().unique(true).build())
                .build(),
        )
        .await?;

    // Compound index on sessions for efficient per-user queries sorted by date
    let sessions = db.collection::<mongodb::bson::Document>("sessions");
    sessions
        .create_index(
            IndexModel::builder()
                .keys(doc! { "user_id": 1, "date": -1 })
                .build(),
        )
        .await?;

    let artifacts = db.collection::<mongodb::bson::Document>("analysis_artifacts");
    artifacts
        .create_index(
            IndexModel::builder()
                .keys(doc! { "user_id": 1, "created_at": -1 })
                .build(),
        )
        .await?;

    Ok(db)
}
