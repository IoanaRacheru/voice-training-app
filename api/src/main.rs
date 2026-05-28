mod auth;
mod config;
mod db;
mod errors;
mod models;
mod openapi;
mod repositories;
mod routes;

use std::sync::Arc;

use axum::{middleware as axum_middleware, Router};
use app_core::{
    asr::{SimplePronunciationEvaluator, VoskAsrStub},
    llm::{HttpLlmCoach, LlmCoach, LlmProvider, LlmProviderConfig, RuleBasedCoach},
    tools::{HeuristicProsodyTool, HeuristicVoicePresentationTool},
    Engine,
};
use mongodb::Database;
use repositories::analysis::{AnalysisRepository, MongoAnalysisRepository};
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

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
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

    let state = Arc::new(AppState {
        db: database.clone(),
        config: config.clone(),
        http,
        jwks: Arc::new(RwLock::new(jwks.keys)),
        engine: Arc::new(Engine::new(
            Box::new(HeuristicProsodyTool),
            Box::new(HeuristicVoicePresentationTool),
            build_llm_coach(&config),
            Box::new(VoskAsrStub),
            Box::new(SimplePronunciationEvaluator),
        )),
        llm_provider: config.llm_provider.clone(),
        analysis_repo: Arc::new(MongoAnalysisRepository::new(database)),
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
        .route("/api/openapi.json", axum::routing::get(openapi::openapi_json))
        .merge(protected)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.server_port);
    tracing::info!("Listening on {addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
