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

/// Attempt to refresh JWKS cache from Keycloak.
async fn refresh_jwks(state: &Arc<AppState>) -> Option<()> {
    let fetched = state
        .http
        .get(&state.config.keycloak_realm_url)
        .send()
        .await
        .ok()?
        .json::<crate::auth::Jwks>()
        .await
        .ok()?;

    let mut jwks = state.jwks.write().await;
    *jwks = fetched.keys;
    Some(())
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

    let mut jwk = {
        let jwks = state.jwks.read().await;
        jwks.iter().find(|k| k.kid == kid).cloned()
    };
    if jwk.is_none() {
        let _ = refresh_jwks(&state).await;
        jwk = {
            let jwks = state.jwks.read().await;
            jwks.iter().find(|k| k.kid == kid).cloned()
        };
    }
    let jwk = match jwk {
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
    validation.set_issuer(&[state.config.keycloak_expected_issuer.as_str()]);
    let expected_audiences = state
        .config
        .keycloak_expected_audiences
        .iter()
        .map(String::as_str)
        .collect::<Vec<_>>();
    validation.set_audience(&expected_audiences);

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
