
pub struct Config {
    
    pub mongodb_uri: String,
    
    pub keycloak_realm_url: String,
    
    pub keycloak_expected_issuer: String,
    
    pub keycloak_expected_audiences: Vec<String>,
    
    pub analyze_max_body_bytes: usize,
    
    pub server_port: u16,
    
    pub llm_provider: String,
    
    pub llm_api_key: Option<String>,
    
    pub llm_model: String,
    
    pub llm_base_url: Option<String>,
    
    pub openrouter_api_key: Option<String>,
    
    pub openrouter_model: String,
    
    pub groq_api_key: Option<String>,
    
    pub groq_model: String,
    
    pub vad_provider: String,
    
    pub asr_provider: String,
    
    pub vosk_server_url: Option<String>,
    
    pub provider_strict: bool,
}

impl Config {
    
    pub fn from_env() -> Self {
        let keycloak_realm_url =
            std::env::var("KEYCLOAK_REALM_URL").expect("KEYCLOAK_REALM_URL must be set");
        let derived_issuer = keycloak_realm_url
            .strip_suffix("/protocol/openid-connect/certs")
            .unwrap_or(&keycloak_realm_url)
            .to_string();
        let expected_audiences = std::env::var("KEYCLOAK_EXPECTED_AUDIENCES")
            .unwrap_or_else(|_| "account".to_string())
            .split(',')
            .map(str::trim)
            .filter(|v| !v.is_empty())
            .map(str::to_string)
            .collect::<Vec<_>>();
        Self {
            mongodb_uri: std::env::var("MONGODB_URI").expect("MONGODB_URI must be set"),
            keycloak_realm_url,
            keycloak_expected_issuer: std::env::var("KEYCLOAK_EXPECTED_ISSUER")
                .unwrap_or(derived_issuer),
            keycloak_expected_audiences: expected_audiences,
            analyze_max_body_bytes: std::env::var("ANALYZE_MAX_BODY_BYTES")
                .unwrap_or_else(|_| "1048576".to_string())
                .parse()
                .expect("ANALYZE_MAX_BODY_BYTES must be a valid integer"),
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
            vad_provider: std::env::var("VAD_PROVIDER").unwrap_or_else(|_| {
                if cfg!(feature = "vad_silero") {
                    "silero".to_string()
                } else {
                    "energy".to_string()
                }
            }),
            asr_provider: std::env::var("ASR_PROVIDER").unwrap_or_else(|_| "stub".to_string()),
            vosk_server_url: std::env::var("VOSK_SERVER_URL").ok(),
            provider_strict: std::env::var("PROVIDER_STRICT")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .expect("PROVIDER_STRICT must be true or false"),
        }
    }
}
