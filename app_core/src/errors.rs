use thiserror::Error;

/// Error type returned by core orchestration and tools.
#[derive(Debug, Error)]
pub enum CoreError {
    /// Generic tool or provider failure.
    #[error("tool error: {0}")]
    Tool(String),
    /// Validation error for unsupported input values.
    #[error("invalid input: {0}")]
    Validation(String),
}
