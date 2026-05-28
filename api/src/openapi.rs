use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

/// OpenAPI document for the Voice Training API.
#[derive(OpenApi)]
#[openapi(
    info(
        title = "Voice Training API",
        description = "Backend API for profile/session management and voice analysis.",
        version = "0.1.0"
    ),
    paths(
        crate::routes::health::health,
        crate::routes::llm::health,
        crate::routes::analysis::analyze
    ),
    components(
        schemas(
            crate::routes::analysis::AnalyzeRequest,
            crate::routes::analysis::AnalyzeResponse,
            crate::routes::health::HealthResponse,
            crate::routes::llm::LlmHealthResponse,
            app_core::engine::SignalQuality
        )
    ),
    tags(
        (name = "Health"),
        (name = "Analysis"),
        (name = "LLM")
    )
)]
pub struct ApiDoc;

/// Build Swagger UI route bundle.
pub fn swagger_ui() -> SwaggerUi {
    SwaggerUi::new("/docs").url("/api/openapi.json", ApiDoc::openapi())
}

/// Serve generated OpenAPI JSON.
pub async fn openapi_json() -> axum::Json<utoipa::openapi::OpenApi> {
    axum::Json(ApiDoc::openapi())
}

#[cfg(test)]
mod tests {
    use super::ApiDoc;
    use utoipa::OpenApi;

    #[test]
    fn openapi_contains_core_paths() {
        let doc = ApiDoc::openapi();
        let paths = doc.paths.paths;
        assert!(paths.contains_key("/health"));
        assert!(paths.contains_key("/api/llm/health"));
        assert!(paths.contains_key("/api/analyze"));
    }
}
