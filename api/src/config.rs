pub struct Config {
    pub mongodb_uri: String,
    pub keycloak_realm_url: String,
    pub server_port: u16,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            mongodb_uri: std::env::var("MONGODB_URI").expect("MONGODB_URI must be set"),
            keycloak_realm_url: std::env::var("KEYCLOAK_REALM_URL")
                .expect("KEYCLOAK_REALM_URL must be set"),
            server_port: std::env::var("SERVER_PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .expect("SERVER_PORT must be a valid port number"),
        }
    }
}
