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

    // Unique index on users.email — idempotent, safe to run on every startup
    let users = db.collection::<mongodb::bson::Document>("users");
    let index = IndexModel::builder()
        .keys(doc! { "email": 1 })
        .options(IndexOptions::builder().unique(true).build())
        .build();
    users.create_index(index).await?;

    Ok(db)
}
