//! Core voice-analysis orchestration library.

/// Engine orchestration and input/output contracts.
pub mod engine;
/// ASR and pronunciation abstractions and baseline adapters.
pub mod asr;
/// DSP feature extraction helpers used by the engine.
pub mod dsp;
/// Shared error types.
pub mod errors;
/// LLM coach abstractions and adapters.
pub mod llm;
/// Pluggable analysis tool traits and baseline implementations.
pub mod tools;

/// Re-export analysis request contract and engine facade.
pub use engine::{AnalysisInput, AnalysisOutput, Engine};
/// Re-export core error type used across modules.
pub use errors::CoreError;
