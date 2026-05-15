pub struct Config {
    pub mongodb_uri: String,
    pub appwrite_endpoint: String,
    pub appwrite_project_id: String,
    pub server_port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            mongodb_uri: std::env::var("MONGODB_URI").expect("MONGODB_URI must be set"),
            appwrite_endpoint: std::env::var("APPWRITE_ENDPOINT")
                .expect("APPWRITE_ENDPOINT must be set"),
            appwrite_project_id: std::env::var("APPWRITE_PROJECT_ID")
                .expect("APPWRITE_PROJECT_ID must be set"),
            server_port: std::env::var("SERVER_PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .expect("SERVER_PORT must be a valid port number"),
        }
    }
}
