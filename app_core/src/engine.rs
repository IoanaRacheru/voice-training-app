use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::{
    asr::{AsrResult, PronunciationEvaluator, PronunciationFeedback, SpeechRecognizer},
    dsp::{extract_signal_features_with_vad, VadDetector},
    errors::CoreError,
    llm::{LlmCoach, LlmContext},
    tools::{ProsodyOutput, ProsodyTool, VoicePresentationOutput, VoicePresentationTool},
};

/// Input contract for a single analysis pass.
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AnalysisInput {
    /// Median pitch estimate in Hz.
    pub median_pitch_hz: f64,
    /// Pitch stability score in `[0, 1]`.
    pub pitch_stability: f64,
    /// Pause ratio in `[0, 1]`.
    pub pause_ratio: f64,
    /// Spectral brightness score in `[0, 1]`.
    pub spectral_brightness: f64,
    /// Optional mono PCM samples in `[-1.0, 1.0]` for signal-derived analysis.
    pub audio_samples: Option<Vec<f32>>,
    /// Sample rate for `audio_samples`.
    pub sample_rate: Option<u32>,
    /// Optional phrase target for pronunciation feedback.
    pub expected_text: Option<String>,
}

/// Output contract for analysis and coaching results.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisOutput {
    /// Prosodic metrics bundle.
    pub prosody: ProsodyOutput,
    /// Voice presentation estimate with confidence metadata.
    pub voice_presentation: VoicePresentationOutput,
    /// Machine-generated concise session summary.
    pub summary: String,
    /// Suggested next practice points.
    pub practice_next: Vec<String>,
    /// Human-readable coach response.
    pub llm_coach_feedback: String,
    /// Signal extraction confidence in `[0, 1]` when audio is provided.
    pub signal_confidence: Option<f64>,
    /// Signal-quality diagnostic flags.
    pub signal_quality: Option<SignalQuality>,
    /// VAD implementation used in extraction.
    pub vad_used: Option<String>,
    /// ASR transcription result if audio is provided.
    pub asr: Option<AsrResult>,
    /// Pronunciation feedback if `expected_text` and ASR result are available.
    pub pronunciation: Option<PronunciationFeedback>,
}

/// Signal quality diagnostics exposed to API consumers.
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SignalQuality {
    /// True if RMS energy is very low.
    pub low_energy: bool,
    /// True if voiced frame ratio is low.
    pub low_voiced_ratio: bool,
    /// True if too few reliable pitch estimates were extracted.
    pub insufficient_pitch_frames: bool,
    /// True if pitch variability indicates unstable voicing.
    pub unstable_pitch: bool,
}

/// Orchestrator that coordinates tools and coach generation.
pub struct Engine {
    prosody_tool: Box<dyn ProsodyTool>,
    voice_tool: Box<dyn VoicePresentationTool>,
    llm_coach: Box<dyn LlmCoach>,
    asr: Box<dyn SpeechRecognizer>,
    pronunciation: Box<dyn PronunciationEvaluator>,
    vad_detector: Box<dyn VadDetector>,
}

impl Engine {
    /// Construct the engine with concrete tool/coach implementations.
    pub fn new(
        prosody_tool: Box<dyn ProsodyTool>,
        voice_tool: Box<dyn VoicePresentationTool>,
        llm_coach: Box<dyn LlmCoach>,
        asr: Box<dyn SpeechRecognizer>,
        pronunciation: Box<dyn PronunciationEvaluator>,
        vad_detector: Box<dyn VadDetector>,
    ) -> Self {
        Self {
            prosody_tool,
            voice_tool,
            llm_coach,
            asr,
            pronunciation,
            vad_detector,
        }
    }

    /// Execute the end-to-end analysis and coaching pipeline.
    pub async fn analyze(&self, input: AnalysisInput) -> Result<AnalysisOutput, CoreError> {
        let (median_pitch_hz, pitch_stability, pause_ratio, spectral_brightness, signal_confidence, signal_quality, vad_used) =
            if let (Some(samples), Some(sample_rate)) =
                (input.audio_samples.as_deref(), input.sample_rate)
            {
                match extract_signal_features_with_vad(
                    samples,
                    sample_rate,
                    self.vad_detector.as_ref(),
                ) {
                    Some(f) => (
                        f.median_pitch_hz,
                        f.pitch_stability,
                        f.pause_ratio,
                        f.spectral_brightness,
                        Some(f.confidence),
                        Some(SignalQuality {
                            low_energy: f.quality_flags.low_energy,
                            low_voiced_ratio: f.quality_flags.low_voiced_ratio,
                            insufficient_pitch_frames: f.quality_flags.insufficient_pitch_frames,
                            unstable_pitch: f.quality_flags.unstable_pitch,
                        }),
                        Some(f.vad_name.to_string()),
                    ),
                    None => (
                        input.median_pitch_hz,
                        input.pitch_stability,
                        input.pause_ratio,
                        input.spectral_brightness,
                        None,
                        None,
                        None,
                    ),
                }
            } else {
                (
                    input.median_pitch_hz,
                    input.pitch_stability,
                    input.pause_ratio,
                    input.spectral_brightness,
                    None,
                    None,
                    None,
                )
            };

        let prosody = self
            .prosody_tool
            .analyze(pitch_stability, pause_ratio)?;
        let voice_presentation =
            self.voice_tool
                .estimate(median_pitch_hz, spectral_brightness, &prosody)?;

        let summary = format!(
            "Pitch median {:.1} Hz, stability {:.2}, pause ratio {:.2}",
            median_pitch_hz, prosody.stability, prosody.pause_ratio
        );
        let practice_next = build_practice_focus(&prosody, &voice_presentation);
        let llm_coach_feedback = self
            .llm_coach
            .coach(&LlmContext {
                summary: summary.clone(),
                next_focus: practice_next.clone(),
            })
            .await?;

        let asr = if let (Some(samples), Some(sample_rate)) =
            (input.audio_samples.as_deref(), input.sample_rate)
        {
            self.asr.recognize(samples, sample_rate).ok()
        } else {
            None
        };

        let pronunciation = match (&input.expected_text, &asr) {
            (Some(expected), Some(asr_result)) => {
                Some(self.pronunciation.evaluate(expected, asr_result))
            }
            _ => None,
        };

        Ok(AnalysisOutput {
            prosody,
            voice_presentation,
            summary,
            practice_next,
            llm_coach_feedback,
            signal_confidence,
            signal_quality,
            vad_used,
            asr,
            pronunciation,
        })
    }
}

fn build_practice_focus(
    prosody: &ProsodyOutput,
    voice_presentation: &VoicePresentationOutput,
) -> Vec<String> {
    let mut focus = Vec::new();

    if prosody.stability < 0.55 {
        focus.push("sustained vowels with relaxed airflow".into());
    }
    if prosody.pause_ratio > 0.35 {
        focus.push("shorter pauses between phrases".into());
    }
    if voice_presentation.score < 45.0 {
        focus.push("gentle upward glides without throat tension".into());
    }
    if focus.is_empty() {
        focus.push("keep current routine and gradually increase duration".into());
    }

    focus
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        asr::{SimplePronunciationEvaluator, VoskAsrStub},
        dsp::EnergyVadDetector,
        llm::RuleBasedCoach,
        tools::{HeuristicProsodyTool, HeuristicVoicePresentationTool},
    };

    #[tokio::test]
    async fn analyze_returns_estimate_with_uncertainty() {
        let engine = Engine::new(
            Box::new(HeuristicProsodyTool),
            Box::new(HeuristicVoicePresentationTool),
            Box::new(RuleBasedCoach),
            Box::new(VoskAsrStub),
            Box::new(SimplePronunciationEvaluator),
            Box::new(EnergyVadDetector),
        );
        let result = engine
            .analyze(AnalysisInput {
                median_pitch_hz: 190.0,
                pitch_stability: 0.72,
                pause_ratio: 0.22,
                spectral_brightness: 0.64,
                audio_samples: None,
                sample_rate: None,
                expected_text: None,
            })
            .await
            .expect("analysis should succeed");

        assert!((0.0..=100.0).contains(&result.voice_presentation.score));
        assert!((0.0..=1.0).contains(&result.voice_presentation.confidence));
        assert!(result
            .voice_presentation
            .uncertainty_note
            .contains("not a definitive label"));
        assert!(result.signal_confidence.is_none());
        assert!(result.asr.is_none());
    }

    #[tokio::test]
    async fn analyze_can_use_signal_features_when_audio_is_present() {
        let engine = Engine::new(
            Box::new(HeuristicProsodyTool),
            Box::new(HeuristicVoicePresentationTool),
            Box::new(RuleBasedCoach),
            Box::new(VoskAsrStub),
            Box::new(SimplePronunciationEvaluator),
            Box::new(EnergyVadDetector),
        );
        let sr = 16_000u32;
        let samples: Vec<f32> = (0..sr as usize)
            .map(|i| {
                let t = i as f32 / sr as f32;
                (2.0 * std::f32::consts::PI * 210.0 * t).sin() * 0.5
            })
            .collect();
        let result = engine
            .analyze(AnalysisInput {
                median_pitch_hz: 120.0,
                pitch_stability: 0.2,
                pause_ratio: 0.7,
                spectral_brightness: 0.1,
                audio_samples: Some(samples),
                sample_rate: Some(sr),
                expected_text: Some("hello voice".into()),
            })
            .await
            .expect("analysis should succeed");
        assert!(result.summary.contains("Pitch median"));
        assert!(result.signal_confidence.is_some());
        assert_eq!(result.vad_used.as_deref(), Some("energy_vad"));
        assert!(result.asr.is_some());
        assert!(result.pronunciation.is_some());
    }
}
