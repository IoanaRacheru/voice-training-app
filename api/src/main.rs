mod auth;
mod config;
mod db;
mod errors;
mod models;
mod openapi;
mod repositories;
mod routes;

use std::sync::Arc;

use app_core::{
    Engine,
    asr::{SimplePronunciationEvaluator, SpeechRecognizer, VoskAsrStub},
    dsp::{EnergyVadDetector, VadDetector},
    llm::{HttpLlmCoach, LlmCoach, LlmProvider, LlmProviderConfig, RuleBasedCoach},
    tools::{DeterministicDspProsodyTool, DeterministicDspVoicePresentationTool},
};
#[cfg(feature = "vad_silero")]
use app_core::dsp::SileroVadDetector;
use axum::{Router, middleware as axum_middleware};
use mongodb::Database;
use repositories::{
    analysis::{AnalysisRepository, MongoAnalysisRepository},
    profile::{MongoProfileRepository, ProfileRepository},
    session::{MongoSessionRepository, SessionRepository},
};
use reqwest::Client;
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use auth::middleware::appwrite_middleware;
use auth::{JwkKey, Jwks};
use config::Config;

/// Shared HTTP application state.
pub struct AppState {
    /// Database handle used by persistence adapters.
    pub db: Database,
    /// Runtime configuration.
    pub config: Arc<Config>,
    /// Shared HTTP client for upstream calls.
    pub http: Client,
    /// Cached Keycloak JWK set used by auth middleware.
    pub jwks: Arc<RwLock<Vec<JwkKey>>>,
    /// Core analysis/coaching engine.
    pub engine: Arc<Engine>,
    /// Effective LLM provider in use.
    pub llm_provider: String,
    /// Analysis artifact repository abstraction.
    pub analysis_repo: Arc<dyn AnalysisRepository>,
    /// User profile repository abstraction.
    pub profile_repo: Arc<dyn ProfileRepository>,
    /// Session repository abstraction.
    pub session_repo: Arc<dyn SessionRepository>,
}

/// Build a coach implementation from runtime configuration.
fn build_llm_coach(config: &Config) -> Box<dyn LlmCoach> {
    match config.llm_provider.as_str() {
        "openrouter" => match &config.openrouter_api_key {
            Some(key) => HttpLlmCoach::new(LlmProviderConfig {
                provider: LlmProvider::OpenRouter,
                api_key: key.clone(),
                model: config.openrouter_model.clone(),
                base_url: None,
            })
            .map(|c| Box::new(c) as Box<dyn LlmCoach>)
            .unwrap_or_else(|_| Box::new(RuleBasedCoach)),
            None => Box::new(RuleBasedCoach),
        },
        "groq" => match &config.groq_api_key {
            Some(key) => HttpLlmCoach::new(LlmProviderConfig {
                provider: LlmProvider::Groq,
                api_key: key.clone(),
                model: config.groq_model.clone(),
                base_url: None,
            })
            .map(|c| Box::new(c) as Box<dyn LlmCoach>)
            .unwrap_or_else(|_| Box::new(RuleBasedCoach)),
            None => Box::new(RuleBasedCoach),
        },
        "openai" => match &config.llm_api_key {
            Some(key) => HttpLlmCoach::new(LlmProviderConfig {
                provider: LlmProvider::OpenAiCompatible,
                api_key: key.clone(),
                model: config.llm_model.clone(),
                base_url: config.llm_base_url.clone(),
            })
            .map(|c| Box::new(c) as Box<dyn LlmCoach>)
            .unwrap_or_else(|_| Box::new(RuleBasedCoach)),
            None => Box::new(RuleBasedCoach),
        },
        _ => Box::new(RuleBasedCoach),
    }
}

/// Build an ASR backend from runtime configuration.
fn build_asr(config: &Config) -> Result<Box<dyn SpeechRecognizer>, String> {
    if config.asr_provider == "vosk_remote" {
        if let Some(server_url) = &config.vosk_server_url {
            return Ok(Box::new(app_core::asr::VoskAsr {
                server_url: server_url.clone(),
            }));
        }
        return Err("ASR_PROVIDER=vosk_remote requires VOSK_SERVER_URL".into());
    }
    Ok(Box::new(VoskAsrStub))
}

/// Build a VAD backend from runtime configuration.
fn build_vad(config: &Config) -> Result<Box<dyn VadDetector>, String> {
    match config.vad_provider.as_str() {
        "silero" => {
            #[cfg(feature = "vad_silero")]
            {
                Ok(Box::new(SileroVadDetector))
            }
            #[cfg(not(feature = "vad_silero"))]
            {
                Err("VAD_PROVIDER=silero requires api feature `vad_silero`".into())
            }
        }
        _ => Ok(Box::new(EnergyVadDetector)),
    }
}

#[cfg(test)]
mod tests {
    use super::{build_asr, build_vad};
    use crate::config::Config;

    fn base_config() -> Config {
        Config {
            mongodb_uri: "mongodb://127.0.0.1:27017".into(),
            keycloak_realm_url:
                "http://localhost:8080/realms/voice-training/protocol/openid-connect/certs".into(),
            keycloak_expected_issuer: "http://localhost:8080/realms/voice-training".into(),
            keycloak_expected_audiences: vec!["account".into()],
            analyze_max_body_bytes: 1024 * 1024,
            server_port: 3000,
            llm_provider: "rule".into(),
            llm_api_key: None,
            llm_model: "openai/gpt-4o-mini".into(),
            llm_base_url: None,
            openrouter_api_key: None,
            openrouter_model: "meta-llama/llama-3.3-70b-instruct".into(),
            groq_api_key: None,
            groq_model: "llama-3.3-70b-versatile".into(),
            vad_provider: "energy".into(),
            asr_provider: "stub".into(),
            vosk_server_url: None,
            provider_strict: true,
        }
    }

    #[test]
    fn build_asr_rejects_vosk_without_url() {
        let mut cfg = base_config();
        cfg.asr_provider = "vosk_remote".into();
        cfg.vosk_server_url = None;
        match build_asr(&cfg) {
            Ok(_) => panic!("must fail without URL"),
            Err(err) => assert!(err.contains("VOSK_SERVER_URL")),
        }
    }

    #[test]
    fn build_asr_accepts_vosk_with_url() {
        let mut cfg = base_config();
        cfg.asr_provider = "vosk_remote".into();
        cfg.vosk_server_url = Some("ws://localhost:2700".into());
        build_asr(&cfg).expect("vosk config should build");
    }

    #[test]
    fn build_vad_rejects_silero_without_feature() {
        let mut cfg = base_config();
        cfg.vad_provider = "silero".into();
        #[cfg(not(feature = "vad_silero"))]
        {
            match build_vad(&cfg) {
                Ok(_) => panic!("must fail without feature"),
                Err(err) => assert!(err.contains("vad_silero")),
            }
        }
        #[cfg(feature = "vad_silero")]
        {
            build_vad(&cfg).expect("silero should build when feature enabled");
        }
    }
}

/// Start the API service with a Tokio multi-thread runtime.
#[tokio::main(flavor = "multi_thread")]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config = Arc::new(Config::from_env());

    let database = db::init(&config.mongodb_uri)
        .await
        .expect("Failed to connect to MongoDB and create indexes");

    let http = Client::new();

    let jwks: Jwks = http
        .get(&config.keycloak_realm_url)
        .send()
        .await
        .expect("Failed to fetch JWKS from Keycloak")
        .json()
        .await
        .expect("Failed to parse JWKS response");

    let asr = match build_asr(&config) {
        Ok(asr) => asr,
        Err(err) if config.provider_strict => panic!("{err}"),
        Err(err) => {
            tracing::warn!("{err}; falling back to stub ASR");
            Box::new(VoskAsrStub)
        }
    };
    let vad = match build_vad(&config) {
        Ok(vad) => vad,
        Err(err) if config.provider_strict => panic!("{err}"),
        Err(err) => {
            tracing::warn!("{err}; falling back to energy VAD");
            Box::new(EnergyVadDetector)
        }
    };

    let state = Arc::new(AppState {
        db: database.clone(),
        config: config.clone(),
        http,
        jwks: Arc::new(RwLock::new(jwks.keys)),
        engine: Arc::new(Engine::new_with_policy(
            Box::new(DeterministicDspProsodyTool),
            Box::new(DeterministicDspVoicePresentationTool),
            build_llm_coach(&config),
            asr,
            Box::new(SimplePronunciationEvaluator),
            vad,
            config.provider_strict,
        )),
        llm_provider: config.llm_provider.clone(),
        analysis_repo: Arc::new(MongoAnalysisRepository::new(database.clone())),
        profile_repo: Arc::new(MongoProfileRepository::new(database.clone())),
        session_repo: Arc::new(MongoSessionRepository::new(database.clone())),
    });

    let protected = Router::new()
        .merge(routes::user::router())
        .merge(routes::sessions::router())
        .merge(routes::analysis::router(config.analyze_max_body_bytes))
        .route_layer(axum_middleware::from_fn_with_state(
            state.clone(),
            appwrite_middleware,
        ));

    let app = Router::new()
        .merge(routes::health::router())
        .merge(routes::llm::router())
        .merge(openapi::swagger_ui())
        .route(
            "/api/openapi.json",
            axum::routing::get(openapi::openapi_json),
        )
        .merge(protected)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.server_port);
    tracing::info!("Listening on {addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
