use utoipa::{
    Modify, OpenApi,
    openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme},
};
use utoipa_swagger_ui::SwaggerUi;

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer_auth",
                SecurityScheme::Http(
                    HttpBuilder::new()
                        .scheme(HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .build(),
                ),
            );
        }
    }
}

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
        crate::routes::chat::chat,
        crate::routes::analysis::analyze,
        crate::routes::challenge::get_today,
        crate::routes::challenge::generate,
        crate::routes::challenge::start,
        crate::routes::challenge::complete_exercise,
        crate::routes::challenge::get_streak,
        crate::routes::artifacts::list_artifacts,
        crate::routes::artifacts::get_artifact,
        crate::routes::user::me,
        crate::routes::user::patch_me,
        crate::routes::sessions::create,
        crate::routes::sessions::list
    ),
    components(
        schemas(
            crate::routes::analysis::AnalyzeRequest,
            crate::routes::analysis::AnalyzeResponse,
            crate::routes::artifacts::ListArtifactsQuery,
            crate::routes::artifacts::ArtifactItem,
            crate::routes::artifacts::ArtifactListResponse,
            crate::routes::health::HealthResponse,
            crate::routes::llm::LlmHealthResponse,
            crate::routes::chat::ChatRequest,
            crate::routes::chat::ChatResponse,
            crate::routes::challenge::TodayQuery,
            crate::routes::challenge::UpsertChallengeRequest,
            crate::routes::challenge::TodayResponse,
            crate::routes::challenge::ChallengeEnvelope,
            crate::routes::challenge::StreakResponse,
            crate::routes::user::MeResponse,
            crate::routes::user::PatchMeRequest,
            crate::routes::user::PatchMeResponse,
            crate::routes::sessions::CreateRequest,
            crate::routes::sessions::CreateResponse,
            crate::routes::sessions::SessionItem,
            app_core::engine::SignalQuality,
            app_core::asr::AsrResult,
            app_core::asr::PronunciationFeedback
        )
    ),
    tags(
        (name = "Health"),
        (name = "Analysis"),
        (name = "LLM"),
        (name = "Chat"),
        (name = "Challenge"),
        (name = "User"),
        (name = "Sessions")
    ),
    modifiers(&SecurityAddon)
)]
pub struct ApiDoc;

/// Build Swagger UI route bundle.
pub fn swagger_ui() -> SwaggerUi {
    SwaggerUi::new("/docs").url("/api/openapi.json", ApiDoc::openapi())
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
        assert!(paths.contains_key("/api/chat"));
        assert!(paths.contains_key("/api/challenge/today"));
        assert!(paths.contains_key("/api/analysis-artifacts"));
        assert!(paths.contains_key("/api/analysis-artifacts/{id}"));
        assert!(paths.contains_key("/api/me"));
        assert!(paths.contains_key("/api/sessions"));
    }
}
