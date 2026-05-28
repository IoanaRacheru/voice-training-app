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

/// Vosk-based ASR adapter (feature-gated).
///
/// Enable with Cargo feature `asr_vosk` and provide a local Vosk model path.
#[cfg(feature = "asr_vosk")]
pub struct VoskAsr {
    /// Filesystem path to the unpacked Vosk model directory.
    pub model_path: String,
}

#[cfg(feature = "asr_vosk")]
impl SpeechRecognizer for VoskAsr {
    fn recognize(&self, audio_samples: &[f32], sample_rate: u32) -> Result<AsrResult, CoreError> {
        use vosk::{CompleteResult, Model, Recognizer};

        if sample_rate < 8_000 || audio_samples.len() < 800 {
            return Err(CoreError::Validation(
                "audio too short or sample rate too low for ASR".into(),
            ));
        }
        let model = Model::new(self.model_path.clone())
            .ok_or_else(|| CoreError::Tool("failed to load Vosk model".into()))?;
        let mut recognizer = Recognizer::new(&model, sample_rate as f32)
            .ok_or_else(|| CoreError::Tool("failed to construct Vosk recognizer".into()))?;
        let pcm: Vec<i16> = audio_samples
            .iter()
            .map(|s| ((*s).clamp(-1.0, 1.0) * i16::MAX as f32) as i16)
            .collect();
        let _ = recognizer.accept_waveform(&pcm);
        let result = recognizer.final_result();
        let transcript = match result {
            CompleteResult::Single(single) => single.text.to_string(),
            CompleteResult::Multiple(multi) => multi
                .alternatives
                .first()
                .map(|a| a.text.to_string())
                .unwrap_or_default(),
        };
        let confidence = if transcript.is_empty() { 0.2 } else { 0.75 };
        Ok(AsrResult {
            transcript,
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

    #[cfg(feature = "asr_vosk")]
    #[test]
    fn vosk_runtime_smoke() {
        let model_path = std::env::var("VOSK_MODEL_PATH")
            .expect("VOSK_MODEL_PATH must be set for vosk runtime smoke test");
        let asr = VoskAsr { model_path };
        let sr = 16_000u32;
        let samples: Vec<f32> = (0..sr as usize)
            .map(|i| {
                let t = i as f32 / sr as f32;
                (2.0 * std::f32::consts::PI * 180.0 * t).sin() * 0.2
            })
            .collect();
        let out = asr
            .recognize(&samples, sr)
            .expect("vosk recognition should execute");
        assert!((0.0..=1.0).contains(&out.confidence));
    }
}
