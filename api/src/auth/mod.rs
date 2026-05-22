pub mod middleware;

use serde::Deserialize;

#[derive(Debug, Clone)]
pub struct AppwriteUser {
    pub id: String,
    pub email: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JwkKey {
    pub kid: String,
    pub n: Option<String>,
    pub e: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Jwks {
    pub keys: Vec<JwkKey>,
}
