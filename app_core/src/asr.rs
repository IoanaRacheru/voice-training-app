//! ASR and pronunciation feedback abstractions.

use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::errors::CoreError;

/// Recognition result emitted by ASR backends.
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AsrResult {
    /// Best-effort transcript text.
    pub transcript: String,
    /// Confidence estimate in `[0, 1]`.
    pub confidence: f64,
}

/// Pronunciation feedback result for phrase-level coaching.
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PronunciationFeedback {
    /// Expected phrase supplied by the caller.
    pub expected_text: String,
    /// Transcript produced by ASR.
    pub recognized_text: String,
    /// Token-level overlap ratio in `[0, 1]`.
    pub token_match_ratio: f64,
    /// Human-readable coaching note.
    pub feedback: String,
}

/// Speech recognizer abstraction.
pub trait SpeechRecognizer: Send + Sync {
    /// Recognize text from mono PCM samples.
    fn recognize(&self, audio_samples: &[f32], sample_rate: u32) -> Result<AsrResult, CoreError>;
}

/// Pronunciation evaluator abstraction.
pub trait PronunciationEvaluator: Send + Sync {
    /// Evaluate pronunciation quality against expected text.
    fn evaluate(&self, expected_text: &str, asr: &AsrResult) -> PronunciationFeedback;
}

/// Vosk-style ASR adapter stub for MVP scaffolding.
///
/// This intentionally avoids linking native Vosk now; it preserves contract
/// shape so a real Vosk backend can be dropped in without API churn.
#[derive(Default)]
pub struct VoskAsrStub;

impl SpeechRecognizer for VoskAsrStub {
    fn recognize(&self, audio_samples: &[f32], sample_rate: u32) -> Result<AsrResult, CoreError> {
        if sample_rate < 8_000 || audio_samples.len() < 800 {
            return Err(CoreError::Validation(
                "audio too short or sample rate too low for ASR".into(),
            ));
        }

        let rms = (audio_samples
            .iter()
            .map(|s| (*s as f64) * (*s as f64))
            .sum::<f64>()
            / audio_samples.len() as f64)
            .sqrt();
        let confidence = if rms < 0.02 { 0.35 } else { 0.65 };

        Ok(AsrResult {
            transcript: "asr_stub_transcript".into(),
            confidence,
        })
    }
}

/// Simple token-overlap pronunciation evaluator.
#[derive(Default)]
pub struct SimplePronunciationEvaluator;

impl PronunciationEvaluator for SimplePronunciationEvaluator {
    fn evaluate(&self, expected_text: &str, asr: &AsrResult) -> PronunciationFeedback {
        let expected_tokens: Vec<String> = expected_text
            .split_whitespace()
            .map(|t| t.to_lowercase())
            .collect();
        let recognized_tokens: Vec<String> = asr
            .transcript
            .split_whitespace()
            .map(|t| t.to_lowercase())
            .collect();
        let matched = expected_tokens
            .iter()
            .filter(|t| recognized_tokens.contains(t))
            .count();
        let ratio = if expected_tokens.is_empty() {
            0.0
        } else {
            matched as f64 / expected_tokens.len() as f64
        };

        let feedback = if ratio > 0.8 {
            "Pronunciation is close to target; keep pacing steady."
        } else if ratio > 0.4 {
            "Pronunciation partially matches; slow down and articulate consonants."
        } else {
            "Pronunciation differs from target; repeat slowly and focus on syllable clarity."
        };

        PronunciationFeedback {
            expected_text: expected_text.to_string(),
            recognized_text: asr.transcript.clone(),
            token_match_ratio: ratio,
            feedback: feedback.into(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn evaluator_scores_overlap() {
        let eval = SimplePronunciationEvaluator;
        let asr = AsrResult {
            transcript: "hello voice training".into(),
            confidence: 0.7,
        };
        let fb = eval.evaluate("hello training", &asr);
        assert!(fb.token_match_ratio >= 0.5);
    }
}
