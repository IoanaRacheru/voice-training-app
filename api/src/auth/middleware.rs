use std::sync::Arc;

use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Json, Response},
};
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use serde::Deserialize;
use serde_json::json;

use crate::{auth::AppwriteUser, AppState};

#[derive(Deserialize)]
struct KeycloakClaims {
    sub: String,
    email: Option<String>,
}

fn unauthorized() -> Response {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({ "error": "Unauthorized" })),
    )
        .into_response()
}

pub async fn appwrite_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Response {
    let token = request
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .map(str::to_owned);

    let token = match token {
        Some(t) => t,
        None => return unauthorized(),
    };

    let kid = match decode_header(&token).ok().and_then(|h| h.kid) {
        Some(k) => k,
        None => return unauthorized(),
    };

    let jwk = match state.jwks.iter().find(|k| k.kid == kid) {
        Some(k) => k,
        None => return unauthorized(),
    };

    let (n, e) = match (&jwk.n, &jwk.e) {
        (Some(n), Some(e)) => (n.as_str(), e.as_str()),
        _ => return unauthorized(),
    };

    let decoding_key = match DecodingKey::from_rsa_components(n, e) {
        Ok(k) => k,
        Err(_) => return unauthorized(),
    };

    let mut validation = Validation::new(Algorithm::RS256);
    validation.validate_aud = false;

    match decode::<KeycloakClaims>(&token, &decoding_key, &validation) {
        Ok(data) => {
            request.extensions_mut().insert(AppwriteUser {
                id: data.claims.sub,
                email: data.claims.email.unwrap_or_default(),
            });
            next.run(request).await
        }
        Err(_) => unauthorized(),
    }
}
