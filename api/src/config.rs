pub struct Config {
    pub mongodb_uri: String,
    pub keycloak_realm_url: String,
    pub server_port: u16,
    pub llm_provider: String,
    pub llm_api_key: Option<String>,
    pub llm_model: String,
    pub llm_base_url: Option<String>,
    pub openrouter_api_key: Option<String>,
    pub openrouter_model: String,
    pub groq_api_key: Option<String>,
    pub groq_model: String,
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
            llm_provider: std::env::var("LLM_PROVIDER").unwrap_or_else(|_| "rule".to_string()),
            llm_api_key: std::env::var("LLM_API_KEY").ok(),
            llm_model: std::env::var("LLM_MODEL")
                .unwrap_or_else(|_| "openai/gpt-4o-mini".to_string()),
            llm_base_url: std::env::var("LLM_BASE_URL").ok(),
            openrouter_api_key: std::env::var("OPENROUTER_API_KEY").ok(),
            openrouter_model: std::env::var("OPENROUTER_MODEL")
                .unwrap_or_else(|_| "meta-llama/llama-3.3-70b-instruct".to_string()),
            groq_api_key: std::env::var("GROQ_API_KEY").ok(),
            groq_model: std::env::var("GROQ_MODEL")
                .unwrap_or_else(|_| "llama-3.3-70b-versatile".to_string()),
        }
    }
}
