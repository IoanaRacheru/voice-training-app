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

    // Unique index on users.email
    let users = db.collection::<mongodb::bson::Document>("users");
    users
        .create_index(
            IndexModel::builder()
                .keys(doc! { "email": 1 })
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

    Ok(db)
}
