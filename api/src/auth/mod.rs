pub mod middleware;

#[derive(Debug, Clone)]
pub struct AppwriteUser {
    pub id: String,
    pub email: String,
}
