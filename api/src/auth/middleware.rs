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

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use app_core::{
        asr::{SimplePronunciationEvaluator, VoskAsrStub},
        llm::RuleBasedCoach,
        tools::{HeuristicProsodyTool, HeuristicVoicePresentationTool},
        Engine,
    };
    use axum::{
        body::Body,
        extract::State,
        http::{Request, StatusCode},
        middleware as axum_middleware,
        response::IntoResponse,
        routing::get,
        Router,
    };
    use jsonwebtoken::{Algorithm, EncodingKey, Header};
    use mongodb::Client;
    use serde::Serialize;
    use tokio::sync::RwLock;
    use tower::ServiceExt;

    use crate::{
        auth::{middleware::appwrite_middleware, JwkKey},
        config::Config,
        repositories::{
            analysis::MongoAnalysisRepository,
            profile::MongoProfileRepository,
            session::MongoSessionRepository,
        },
        AppState,
    };

    const TEST_PRIVATE_KEY_PEM: &str = r#"-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCC8ZExcj+GmggY
xTGCXPDe9XwkPu8KK6Q96Ozr9XPkULaHQdX4cY1zjxx5oBgxeJaHECjNDFFqdNBC
johmqmC7EplGJOhdHnMUPqRQG39fo7LtM+s5QzP3DzavpAM4/oB5++g6+uobNJ/z
3/I5hiuhIZhWVjigibW8myAwBdYHyPvtxhkZXpO6fFFo4Ks+YtLso2HAJ+75g0V1
X4ZNuMw1jozJjBvlgPWHXrsP7+3u29zwswb/n6GzvLGJAjbKoB93K5H3oIBYGZkP
l8UrmV3WRGZSldK/W5YqOAOYQvimcOdqH6aYQgEdpsIOE38ObtS4WliXpMfFiy/e
ClgRBs3BAgMBAAECggEANaL343Y1+U/M80CLGCgz7lBGCp7Q0aywuT9ZFQpU73f0
XJEmMX9p/qTneBaQ8mq/1hFTdTKPgvjYefriepNdziM/L5FcsRAQ+YDzU3EACtAG
Mc2rk6goeBH+R5H6U/VD8TOzm709+ejjgEUCdne0FWuqd+sXhQMDs38jfyhU1Jj0
QnTg1Z3/oUZE+9MRwEJ3YbiJzma2cWOduk9qCEukXe8JVoPbVf6869mfgcavtudb
C9HKidW/mi6K8Kh3RBsLiYETlLKxnxurvtkH0NvBMoVrJRFpwBFsaWGgxd83n5t2
2w5ub+9cNBFwpvtBGXhIj23pG3twBJmis/ObyY/zBQKBgQC3ZBxz5CToRC6ZFnyq
BErWPfVoeFR9TJPJcgYhbO24DXzgp1Eqw5+cJAIT/vSZ/pxssp55sSnBawHqLln5
KPl0BMXqH1cGkk3cTya1v2RWMlDlqhwKXHoEYSIBJ/r94i8NsXQL3+7yP7pC4g2R
+2sKKAxWb08taFptiXzZpbCXYwKBgQC2yZBJJmXlfMoII5/eI9f22Cm19wVDRXKi
kZmIDOul7msvtZUINh/+UjN4xhA1IX4BkDoVSX+2nIhXKJQeuocxrG3AR2Gln0HV
2JvLl7JJo1XB6131MUDBaUjf0TxvnZ2YFo0+8JvzoJmIxVtmA+zC0EAK0n5dltv9
GyHSoc9piwKBgFQ8mNEmz0kc4GaTLKoPlKx6Azp8Yxq2zP9v75704PB0yZKLaD4D
Y1IePBIhPwtpJ0LKfP6awPpGA7gkmFFZX9PJyXrz8E5lb3wtozNCeX0aWYxUqdKc
jbNrRmpPifuKJGDezNYTgzckzJKiMOeIG6+rm5csQ6swzrCXwZBbihTPAoGBAJaw
HK7xZNeHxNZo6Aat7gClu90zQ7dtrU+wUK4EWNB2eQ7f13jphf6Xra9HOV1Tuxl2
2StraEoXSZ7w6QtcItAkomX9ctajMBcnd2ikKmriqHQxoUfdztCkB1vclsI9Ygpb
rR3SJf72yxwh93NmkO0Z2XISjfKBx+IlWADZPLB5AoGBAJFHR7N6blsrnSAvNp8Q
xDcBwamKcKejhkO6y4v4yfFcp7clWuANXQ3TGMRdin2qDmObIr52U3QjWE9C9E+U
4/HIJ7iQDAW35yNEBrjB+AD62pX/U7XuGfShGav+btsyQoCcvocJEpL2SyRajZQn
+yJ/Go0ZuO+R29j+BFnIMbvK
-----END PRIVATE KEY-----"#;

    #[derive(Serialize)]
    struct TestClaims<'a> {
        sub: &'a str,
        email: &'a str,
        iss: &'a str,
        aud: &'a str,
        exp: usize,
    }

    async fn build_state() -> Arc<AppState> {
        let client = Client::with_uri_str("mongodb://127.0.0.1:27017")
            .await
            .expect("mongodb uri should parse");
        Arc::new(AppState {
            db: client.database("voice_training"),
            config: Arc::new(Config {
                mongodb_uri: "mongodb://127.0.0.1:27017".into(),
                keycloak_realm_url:
                    "http://localhost:8080/realms/voice-training/protocol/openid-connect/certs"
                        .into(),
                keycloak_expected_issuer: "https://issuer.example/realms/voice-training".into(),
                keycloak_expected_audiences: vec!["voice-training-api".into()],
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
            }),
            http: reqwest::Client::new(),
            jwks: Arc::new(RwLock::new(vec![JwkKey {
                kid: "test-kid".into(),
                n: Some("gvGRMXI_hpoIGMUxglzw3vV8JD7vCiukPejs6_Vz5FC2h0HV-HGNc48ceaAYMXiWhxAozQxRanTQQo6IZqpguxKZRiToXR5zFD6kUBt_X6Oy7TPrOUMz9w82r6QDOP6AefvoOvrqGzSf89_yOYYroSGYVlY4oIm1vJsgMAXWB8j77cYZGV6TunxRaOCrPmLS7KNhwCfu-YNFdV-GTbjMNY6MyYwb5YD1h167D-_t7tvc8LMG_5-hs7yxiQI2yqAfdyuR96CAWBmZD5fFK5ld1kRmUpXSv1uWKjgDmEL4pnDnah-mmEIBHabCDhN_Dm7UuFpYl6THxYsv3gpYEQbNwQ".into()),
                e: Some("AQAB".into()),
            }])),
            engine: Arc::new(Engine::new(
                Box::new(HeuristicProsodyTool),
                Box::new(HeuristicVoicePresentationTool),
                Box::new(RuleBasedCoach),
                Box::new(VoskAsrStub),
                Box::new(SimplePronunciationEvaluator),
            )),
            llm_provider: "rule".into(),
            analysis_repo: Arc::new(MongoAnalysisRepository::new(client.database("voice_training"))),
            profile_repo: Arc::new(MongoProfileRepository::new(client.database("voice_training"))),
            session_repo: Arc::new(MongoSessionRepository::new(client.database("voice_training"))),
        })
    }

    async fn ok_handler(State(_state): State<Arc<AppState>>) -> impl IntoResponse {
        StatusCode::OK
    }

    fn build_token(iss: &str, aud: &str) -> String {
        let mut header = Header::new(Algorithm::RS256);
        header.kid = Some("test-kid".into());
        let claims = TestClaims {
            sub: "u-1",
            email: "u1@example.com",
            iss,
            aud,
            exp: 4_000_000_000,
        };
        jsonwebtoken::encode(
            &header,
            &claims,
            &EncodingKey::from_rsa_pem(TEST_PRIVATE_KEY_PEM.as_bytes()).expect("valid test key"),
        )
        .expect("token should encode")
    }

    #[tokio::test]
    async fn middleware_rejects_token_with_invalid_issuer() {
        let state = build_state().await;
        let app = Router::new()
            .route("/protected", get(ok_handler))
            .route_layer(axum_middleware::from_fn_with_state(
                state.clone(),
                appwrite_middleware,
            ))
            .with_state(state);

        let token = build_token("https://wrong-issuer.example/realm", "voice-training-api");
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/protected")
                    .header("Authorization", format!("Bearer {token}"))
                    .body(Body::empty())
                    .expect("request should build"),
            )
            .await
            .expect("request should succeed");

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn middleware_rejects_token_with_invalid_audience() {
        let state = build_state().await;
        let app = Router::new()
            .route("/protected", get(ok_handler))
            .route_layer(axum_middleware::from_fn_with_state(
                state.clone(),
                appwrite_middleware,
            ))
            .with_state(state);

        let token = build_token(
            "https://issuer.example/realms/voice-training",
            "wrong-audience",
        );
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/protected")
                    .header("Authorization", format!("Bearer {token}"))
                    .body(Body::empty())
                    .expect("request should build"),
            )
            .await
            .expect("request should succeed");

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn middleware_accepts_token_with_valid_claims() {
        let state = build_state().await;
        let app = Router::new()
            .route("/protected", get(ok_handler))
            .route_layer(axum_middleware::from_fn_with_state(
                state.clone(),
                appwrite_middleware,
            ))
            .with_state(state);

        let token = build_token(
            "https://issuer.example/realms/voice-training",
            "voice-training-api",
        );
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/protected")
                    .header("Authorization", format!("Bearer {token}"))
                    .body(Body::empty())
                    .expect("request should build"),
            )
            .await
            .expect("request should succeed");

        assert_eq!(response.status(), StatusCode::OK);
    }
}
