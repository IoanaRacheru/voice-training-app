mod auth;
mod config;
mod db;
mod errors;
mod models;
mod routes;

use std::sync::Arc;

use axum::{middleware as axum_middleware, Router};
use mongodb::Database;
use reqwest::Client;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use auth::middleware::appwrite_middleware;
use auth::{JwkKey, Jwks};
use config::Config;

pub struct AppState {
    pub db: Database,
    pub config: Arc<Config>,
    pub http: Client,
    pub jwks: Vec<JwkKey>,
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
        db: database,
        config: config.clone(),
        http,
        jwks: jwks.keys,
    });

    let protected = Router::new()
        .merge(routes::user::router())
        .merge(routes::sessions::router())
        .route_layer(axum_middleware::from_fn_with_state(
            state.clone(),
            appwrite_middleware,
        ));

    let app = Router::new()
        .merge(routes::health::router())
        .merge(protected)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.server_port);
    tracing::info!("Listening on {addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
