use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::errors::CoreError;

/// Prosodic metrics derived from pitch and pause behavior.
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ProsodyOutput {
    /// Pitch stability score in `[0, 1]`.
    pub stability: f64,
    /// Pause ratio in `[0, 1]`.
    pub pause_ratio: f64,
    /// Rhythm quality proxy in `[0, 1]`.
    pub rhythm_score: f64,
}

/// Voice presentation estimate with confidence metadata.
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct VoicePresentationOutput {
    /// Estimated score in `[0, 100]`.
    pub score: f64,
    /// Confidence estimate in `[0, 1]`.
    pub confidence: f64,
    /// Leaning label for the estimate.
    pub label: String,
    /// Explicit uncertainty disclaimer.
    pub uncertainty_note: String,
}

/// Prosody analysis tool contract.
pub trait ProsodyTool: Send + Sync {
    /// Analyze prosody from precomputed stability and pause metrics.
    fn analyze(&self, pitch_stability: f64, pause_ratio: f64) -> Result<ProsodyOutput, CoreError>;
}

/// Voice presentation estimation tool contract.
pub trait VoicePresentationTool: Send + Sync {
    /// Estimate voice presentation from acoustic/prosodic features.
    fn estimate(
        &self,
        median_pitch_hz: f64,
        spectral_brightness: f64,
        prosody: &ProsodyOutput,
    ) -> Result<VoicePresentationOutput, CoreError>;
}

/// Baseline deterministic prosody tool used for MVP/testing.
#[derive(Default)]
pub struct HeuristicProsodyTool;

impl ProsodyTool for HeuristicProsodyTool {
    fn analyze(&self, pitch_stability: f64, pause_ratio: f64) -> Result<ProsodyOutput, CoreError> {
        if !(0.0..=1.0).contains(&pitch_stability) {
            return Err(CoreError::Validation(
                "pitch_stability must be between 0 and 1".into(),
            ));
        }
        if !(0.0..=1.0).contains(&pause_ratio) {
            return Err(CoreError::Validation(
                "pause_ratio must be between 0 and 1".into(),
            ));
        }

        let pause_continuity = gaussian_peak(pause_ratio, 0.18, 0.12);
        let pause_penalty = if pause_ratio > 0.45 {
            ((pause_ratio - 0.45) / 0.55).clamp(0.0, 1.0)
        } else {
            0.0
        };
        let rhythm_score =
            (pause_continuity * 0.7 + pitch_stability * 0.3 - pause_penalty * 0.35).clamp(0.0, 1.0);
        Ok(ProsodyOutput {
            stability: pitch_stability,
            pause_ratio,
            rhythm_score,
        })
    }
}

/// Baseline deterministic voice presentation estimator used for MVP/testing.
#[derive(Default)]
pub struct HeuristicVoicePresentationTool;

impl VoicePresentationTool for HeuristicVoicePresentationTool {
    fn estimate(
        &self,
        median_pitch_hz: f64,
        spectral_brightness: f64,
        prosody: &ProsodyOutput,
    ) -> Result<VoicePresentationOutput, CoreError> {
        if !median_pitch_hz.is_finite() || !(50.0..=500.0).contains(&median_pitch_hz) {
            return Err(CoreError::Validation(
                "median_pitch_hz must be finite and between 50 and 500".into(),
            ));
        }
        if !(0.0..=1.0).contains(&spectral_brightness) {
            return Err(CoreError::Validation(
                "spectral_brightness must be between 0 and 1".into(),
            ));
        }

        let normalized_pitch = ((median_pitch_hz - 80.0) / (300.0 - 80.0)).clamp(0.0, 1.0);
        let pitch_score = smoothstep(normalized_pitch);
        let brightness_score = smoothstep(spectral_brightness.clamp(0.0, 1.0));
        let rhythm_component = (prosody.rhythm_score * 0.7 + (1.0 - prosody.pause_ratio) * 0.3)
            .clamp(0.0, 1.0);
        let score = (pitch_score * 0.45
            + brightness_score * 0.2
            + prosody.stability * 0.2
            + rhythm_component * 0.15)
            * 100.0;

        let stability_guard = if prosody.stability < 0.35 { 0.12 } else { 0.0 };
        let pause_guard = if prosody.pause_ratio > 0.45 { 0.15 } else { 0.0 };
        let confidence = (0.48
            + prosody.stability * 0.24
            + prosody.rhythm_score * 0.2
            + brightness_score * 0.12
            - stability_guard
            - pause_guard)
            .clamp(0.2, 0.95);
        let label = if score < 40.0 {
            "masculine-leaning"
        } else if score > 60.0 {
            "feminine-leaning"
        } else {
            "androgynous-leaning"
        };

        Ok(VoicePresentationOutput {
            score: (score * 10.0).round() / 10.0,
            confidence: (confidence * 1000.0).round() / 1000.0,
            label: label.into(),
            uncertainty_note: "Estimated from acoustic features; this is not a definitive label."
                .into(),
        })
    }
}

fn smoothstep(x: f64) -> f64 {
    let x = x.clamp(0.0, 1.0);
    x * x * (3.0 - 2.0 * x)
}

fn gaussian_peak(x: f64, mean: f64, sigma: f64) -> f64 {
    if sigma <= f64::EPSILON {
        return 0.0;
    }
    let z = (x - mean) / sigma;
    (-0.5 * z * z).exp().clamp(0.0, 1.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prosody_rejects_invalid_pause_ratio() {
        let tool = HeuristicProsodyTool;
        let err = tool
            .analyze(0.4, 1.2)
            .expect_err("expected validation error");
        assert!(err.to_string().contains("pause_ratio"));
    }

    #[test]
    fn voice_presentation_returns_confidence_range() {
        let prosody = ProsodyOutput {
            stability: 0.7,
            pause_ratio: 0.2,
            rhythm_score: 0.8,
        };
        let tool = HeuristicVoicePresentationTool;
        let result = tool
            .estimate(180.0, 0.5, &prosody)
            .expect("estimate should succeed");
        assert!((0.0..=100.0).contains(&result.score));
        assert!((0.0..=1.0).contains(&result.confidence));
    }

    #[test]
    fn rhythm_score_penalizes_large_pause_ratio() {
        let tool = HeuristicProsodyTool;
        let stable_low_pause = tool.analyze(0.8, 0.2).expect("valid");
        let stable_high_pause = tool.analyze(0.8, 0.7).expect("valid");
        assert!(stable_low_pause.rhythm_score > stable_high_pause.rhythm_score);
    }

    #[test]
    fn confidence_drops_for_unstable_voice() {
        let tool = HeuristicVoicePresentationTool;
        let good = ProsodyOutput {
            stability: 0.85,
            pause_ratio: 0.18,
            rhythm_score: 0.8,
        };
        let unstable = ProsodyOutput {
            stability: 0.2,
            pause_ratio: 0.55,
            rhythm_score: 0.25,
        };
        let high = tool.estimate(190.0, 0.6, &good).expect("estimate");
        let low = tool.estimate(190.0, 0.6, &unstable).expect("estimate");
        assert!(high.confidence > low.confidence);
    }
}
