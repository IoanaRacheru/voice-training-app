use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::{
    asr::{AsrResult, PronunciationEvaluator, PronunciationFeedback, SpeechRecognizer},
    dsp::{VadDetector, extract_signal_features_with_vad},
    errors::CoreError,
    llm::{LlmCoach, LlmContext},
    tools::{ProsodyOutput, ProsodyTool, VoicePresentationOutput, VoicePresentationTool},
};


#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct AnalysisInput {
    
    pub median_pitch_hz: f64,
    
    pub pitch_stability: f64,
    
    pub pause_ratio: f64,
    
    pub spectral_brightness: f64,
    
    pub audio_samples: Option<Vec<f32>>,
    
    pub sample_rate: Option<u32>,
    
    pub expected_text: Option<String>,
}


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisOutput {
    
    pub prosody: ProsodyOutput,
    
    pub voice_presentation: VoicePresentationOutput,
    
    pub summary: String,
    
    pub practice_next: Vec<String>,
    
    pub llm_coach_feedback: String,
    
    pub signal_confidence: Option<f64>,
    
    pub signal_quality: Option<SignalQuality>,
    
    pub vad_used: Option<String>,
    
    pub asr: Option<AsrResult>,
    
    pub pronunciation: Option<PronunciationFeedback>,
}


#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SignalQuality {
    
    pub low_energy: bool,
    
    pub low_voiced_ratio: bool,
    
    pub insufficient_pitch_frames: bool,
    
    pub unstable_pitch: bool,
}


pub struct Engine {
    prosody_tool: Box<dyn ProsodyTool>,
    voice_tool: Box<dyn VoicePresentationTool>,
    llm_coach: Box<dyn LlmCoach>,
    asr: Box<dyn SpeechRecognizer>,
    pronunciation: Box<dyn PronunciationEvaluator>,
    vad_detector: Box<dyn VadDetector>,
    strict_provider_errors: bool,
}

impl Engine {
    
    pub fn new(
        prosody_tool: Box<dyn ProsodyTool>,
        voice_tool: Box<dyn VoicePresentationTool>,
        llm_coach: Box<dyn LlmCoach>,
        asr: Box<dyn SpeechRecognizer>,
        pronunciation: Box<dyn PronunciationEvaluator>,
        vad_detector: Box<dyn VadDetector>,
    ) -> Self {
        Self::new_with_policy(
            prosody_tool,
            voice_tool,
            llm_coach,
            asr,
            pronunciation,
            vad_detector,
            false,
        )
    }

    
    pub fn new_with_policy(
        prosody_tool: Box<dyn ProsodyTool>,
        voice_tool: Box<dyn VoicePresentationTool>,
        llm_coach: Box<dyn LlmCoach>,
        asr: Box<dyn SpeechRecognizer>,
        pronunciation: Box<dyn PronunciationEvaluator>,
        vad_detector: Box<dyn VadDetector>,
        strict_provider_errors: bool,
    ) -> Self {
        Self {
            prosody_tool,
            voice_tool,
            llm_coach,
            asr,
            pronunciation,
            vad_detector,
            strict_provider_errors,
        }
    }

    
    pub async fn analyze(&self, input: AnalysisInput) -> Result<AnalysisOutput, CoreError> {
        let (
            median_pitch_hz,
            pitch_stability,
            pause_ratio,
            spectral_brightness,
            signal_confidence,
            signal_quality,
            vad_used,
        ) = if let (Some(samples), Some(sample_rate)) =
            (input.audio_samples.as_deref(), input.sample_rate)
        {
            match extract_signal_features_with_vad(samples, sample_rate, self.vad_detector.as_ref())
            {
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

        let prosody = self.prosody_tool.analyze(pitch_stability, pause_ratio)?;
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
            match self.asr.recognize(samples, sample_rate) {
                Ok(result) => Some(result),
                Err(err) if self.strict_provider_errors => {
                    return Err(CoreError::Tool(format!("ASR provider failed: {err}")));
                }
                Err(_) => None,
            }
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
        asr::{AsrResult, SimplePronunciationEvaluator, SpeechRecognizer, VoskAsrStub},
        dsp::EnergyVadDetector,
        llm::RuleBasedCoach,
        tools::{DeterministicDspProsodyTool, DeterministicDspVoicePresentationTool},
    };

    struct FailingAsr;

    impl SpeechRecognizer for FailingAsr {
        fn recognize(
            &self,
            _audio_samples: &[f32],
            _sample_rate: u32,
        ) -> Result<AsrResult, CoreError> {
            Err(CoreError::Tool("simulated asr failure".into()))
        }
    }

    #[tokio::test]
    async fn analyze_returns_estimate_with_uncertainty() {
        let engine = Engine::new(
            Box::new(DeterministicDspProsodyTool),
            Box::new(DeterministicDspVoicePresentationTool),
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
        assert!(
            result
                .voice_presentation
                .uncertainty_note
                .contains("not a definitive label")
        );
        assert!(result.signal_confidence.is_none());
        assert!(result.asr.is_none());
    }

    #[tokio::test]
    async fn analyze_can_use_signal_features_when_audio_is_present() {
        let engine = Engine::new(
            Box::new(DeterministicDspProsodyTool),
            Box::new(DeterministicDspVoicePresentationTool),
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

    #[tokio::test]
    async fn analyze_returns_error_when_strict_asr_fails() {
        let engine = Engine::new_with_policy(
            Box::new(DeterministicDspProsodyTool),
            Box::new(DeterministicDspVoicePresentationTool),
            Box::new(RuleBasedCoach),
            Box::new(FailingAsr),
            Box::new(SimplePronunciationEvaluator),
            Box::new(EnergyVadDetector),
            true,
        );
        let sr = 16_000u32;
        let samples: Vec<f32> = (0..sr as usize)
            .map(|i| {
                let t = i as f32 / sr as f32;
                (2.0 * std::f32::consts::PI * 190.0 * t).sin() * 0.4
            })
            .collect();
        let err = engine
            .analyze(AnalysisInput {
                median_pitch_hz: 180.0,
                pitch_stability: 0.7,
                pause_ratio: 0.2,
                spectral_brightness: 0.6,
                audio_samples: Some(samples),
                sample_rate: Some(sr),
                expected_text: Some("hello".into()),
            })
            .await
            .expect_err("strict mode must fail");
        assert!(err.to_string().contains("ASR provider failed"));
    }
}
