mod auth;
mod config;
mod db;
mod errors;
mod models;
mod routes;

use std::sync::Arc;

use axum::{middleware as axum_middleware, routing::post, Router};
use mongodb::Database;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use auth::middleware::jwt_middleware;
use config::Config;

pub struct AppState {
    pub db: Database,
    pub config: Arc<Config>,
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

    let state = Arc::new(AppState {
        db: database,
        config: config.clone(),
    });

    let protected = Router::new()
        .merge(routes::user::router())
        .route_layer(axum_middleware::from_fn_with_state(
            state.clone(),
            jwt_middleware,
        ));

    let app = Router::new()
        .merge(routes::health::router())
        .route("/auth/register", post(auth::handlers::register))
        .route("/auth/login", post(auth::handlers::login))
        .merge(protected)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", config.server_port);
    tracing::info!("Listening on {addr}");
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
