use thiserror::Error;

#[derive(Debug, Error)]
pub enum CoreError {
    #[error("tool error: {0}")]
    Tool(String),
    #[error("invalid input: {0}")]
    Validation(String),
}
