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
    /// Optional recognized words with timing/confidence metadata when provided by backend.
    pub words: Option<Vec<AsrWord>>,
}

/// Word-level recognition output when available from ASR backend.
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AsrWord {
    /// Recognized token.
    pub word: String,
    /// Token start time in seconds.
    pub start_seconds: f64,
    /// Token end time in seconds.
    pub end_seconds: f64,
    /// Token confidence estimate in `[0, 1]`.
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
    /// Relative token order match ratio in `[0, 1]`.
    pub word_order_ratio: f64,
    /// Timing smoothness proxy in `[0, 1]` when ASR word timestamps are available.
    pub timing_alignment_ratio: Option<f64>,
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
            words: None,
        })
    }
}

/// Vosk-server ASR adapter.
///
/// Expects a running Vosk websocket endpoint (for example
/// `ws://vosk:2700` in Docker Compose).
pub struct VoskAsr {
    /// Vosk websocket endpoint URL.
    pub server_url: String,
}

impl SpeechRecognizer for VoskAsr {
    fn recognize(&self, audio_samples: &[f32], sample_rate: u32) -> Result<AsrResult, CoreError> {
        use tungstenite::{Message, connect};

        if sample_rate < 8_000 || audio_samples.len() < 800 {
            return Err(CoreError::Validation(
                "audio too short or sample rate too low for ASR".into(),
            ));
        }

        let (mut socket, _) = connect(self.server_url.as_str())
            .map_err(|e| CoreError::Tool(format!("failed to connect to vosk server: {e}")))?;

        let cfg = serde_json::json!({ "config": { "sample_rate": sample_rate } }).to_string();
        socket
            .send(Message::Text(cfg))
            .map_err(|e| CoreError::Tool(format!("failed to send vosk config: {e}")))?;

        let pcm: Vec<i16> = audio_samples
            .iter()
            .map(|s| ((*s).clamp(-1.0, 1.0) * i16::MAX as f32) as i16)
            .collect();
        let mut bytes = Vec::with_capacity(pcm.len() * 2);
        for sample in pcm {
            bytes.extend_from_slice(&sample.to_le_bytes());
        }
        socket
            .send(Message::Binary(bytes))
            .map_err(|e| CoreError::Tool(format!("failed to send vosk audio: {e}")))?;
        socket
            .send(Message::Text("{\"eof\":1}".into()))
            .map_err(|e| CoreError::Tool(format!("failed to finalize vosk stream: {e}")))?;

        let mut transcript = String::new();
        let mut words: Vec<AsrWord> = Vec::new();
        while let Ok(msg) = socket.read() {
            let text = match msg {
                Message::Text(t) => t,
                _ => continue,
            };
            let parsed: serde_json::Value = serde_json::from_str(&text)
                .map_err(|e| CoreError::Tool(format!("invalid vosk response: {e}")))?;
            if let Some(result) = parsed.get("result").and_then(|v| v.as_array()) {
                words = parse_vosk_words(result);
            }
            if let Some(final_text) = parsed.get("text").and_then(|v| v.as_str()) {
                transcript = final_text.trim().to_string();
                break;
            }
        }

        if transcript.is_empty() && !words.is_empty() {
            transcript = words
                .iter()
                .map(|w| w.word.as_str())
                .collect::<Vec<_>>()
                .join(" ");
        }
        let confidence = if transcript.is_empty() { 0.2 } else { 0.75 };
        Ok(AsrResult {
            transcript,
            confidence,
            words: if words.is_empty() { None } else { Some(words) },
        })
    }
}

/// Simple token-overlap pronunciation evaluator.
#[derive(Default)]
pub struct SimplePronunciationEvaluator;

impl PronunciationEvaluator for SimplePronunciationEvaluator {
    fn evaluate(&self, expected_text: &str, asr: &AsrResult) -> PronunciationFeedback {
        let expected_tokens = tokenize(expected_text);
        let recognized_tokens = tokenize(&asr.transcript);
        let matched = expected_tokens
            .iter()
            .filter(|t| recognized_tokens.contains(t))
            .count();
        let ratio = if expected_tokens.is_empty() {
            0.0
        } else {
            matched as f64 / expected_tokens.len() as f64
        };
        let order_ratio = token_order_ratio(&expected_tokens, &recognized_tokens);
        let timing_ratio = asr.words.as_ref().map(|words| timing_alignment_ratio(words));

        let aggregate = ratio * 0.55 + order_ratio * 0.45;
        let feedback = if aggregate > 0.85 {
            "Pronunciation is close to target; keep pacing steady."
        } else if aggregate > 0.55 {
            "Pronunciation partially matches; slow down and keep syllable order steady."
        } else {
            "Pronunciation differs from target; repeat slowly and focus on syllable clarity."
        };

        PronunciationFeedback {
            expected_text: expected_text.to_string(),
            recognized_text: asr.transcript.clone(),
            token_match_ratio: ratio,
            word_order_ratio: order_ratio,
            timing_alignment_ratio: timing_ratio,
            feedback: feedback.into(),
        }
    }
}

fn tokenize(text: &str) -> Vec<String> {
    text.split_whitespace().map(|t| t.to_lowercase()).collect()
}

fn token_order_ratio(expected: &[String], recognized: &[String]) -> f64 {
    if expected.is_empty() || recognized.is_empty() {
        return 0.0;
    }

    let mut i = 0usize;
    let mut matched = 0usize;
    for token in expected {
        while i < recognized.len() {
            if recognized[i] == *token {
                matched += 1;
                i += 1;
                break;
            }
            i += 1;
        }
    }
    matched as f64 / expected.len() as f64
}

fn timing_alignment_ratio(words: &[AsrWord]) -> f64 {
    if words.len() < 2 {
        return 1.0;
    }

    let durations: Vec<f64> = words
        .iter()
        .map(|w| (w.end_seconds - w.start_seconds).max(0.0))
        .collect();
    let mean = durations.iter().sum::<f64>() / durations.len() as f64;
    if mean <= f64::EPSILON {
        return 0.0;
    }
    let variance = durations
        .iter()
        .map(|d| {
            let delta = *d - mean;
            delta * delta
        })
        .sum::<f64>()
        / durations.len() as f64;
    let std_dev = variance.sqrt();
    (1.0 - (std_dev / mean).min(1.0)).clamp(0.0, 1.0)
}

fn parse_vosk_words(values: &[serde_json::Value]) -> Vec<AsrWord> {
    values
        .iter()
        .filter_map(|v| {
            Some(AsrWord {
                word: v.get("word")?.as_str()?.to_string(),
                start_seconds: v.get("start")?.as_f64()?,
                end_seconds: v.get("end")?.as_f64()?,
                confidence: v.get("conf").and_then(|c| c.as_f64()).unwrap_or(0.0),
            })
        })
        .collect()
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
            words: None,
        };
        let fb = eval.evaluate("hello training", &asr);
        assert!(fb.token_match_ratio >= 0.5);
        assert!(fb.word_order_ratio >= 0.5);
    }

    #[test]
    fn vosk_runtime_smoke() {
        let Ok(server_url) = std::env::var("VOSK_SERVER_URL") else {
            return;
        };
        let asr = VoskAsr { server_url };
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
