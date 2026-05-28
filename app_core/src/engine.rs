use serde::{Deserialize, Serialize};

use crate::{
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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisOutput {
    pub prosody: ProsodyOutput,
    pub voice_presentation: VoicePresentationOutput,
    pub summary: String,
    pub practice_next: Vec<String>,
    pub llm_coach_feedback: String,
}

pub struct Engine {
    prosody_tool: Box<dyn ProsodyTool>,
    voice_tool: Box<dyn VoicePresentationTool>,
    llm_coach: Box<dyn LlmCoach>,
}

impl Engine {
    pub fn new(
        prosody_tool: Box<dyn ProsodyTool>,
        voice_tool: Box<dyn VoicePresentationTool>,
        llm_coach: Box<dyn LlmCoach>,
    ) -> Self {
        Self {
            prosody_tool,
            voice_tool,
            llm_coach,
        }
    }

    pub async fn analyze(&self, input: AnalysisInput) -> Result<AnalysisOutput, CoreError> {
        let prosody = self
            .prosody_tool
            .analyze(input.pitch_stability, input.pause_ratio)?;
        let voice_presentation = self.voice_tool.estimate(
            input.median_pitch_hz,
            input.spectral_brightness,
            &prosody,
        )?;

        let summary = format!(
            "Pitch median {:.1} Hz, stability {:.2}, pause ratio {:.2}",
            input.median_pitch_hz, prosody.stability, prosody.pause_ratio
        );
        let practice_next = build_practice_focus(&prosody, &voice_presentation);
        let llm_coach_feedback = self
            .llm_coach
            .coach(&LlmContext {
                summary: summary.clone(),
                next_focus: practice_next.clone(),
            })
            .await?;

        Ok(AnalysisOutput {
            prosody,
            voice_presentation,
            summary,
            practice_next,
            llm_coach_feedback,
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
        llm::RuleBasedCoach,
        tools::{HeuristicProsodyTool, HeuristicVoicePresentationTool},
    };

    #[tokio::test]
    async fn analyze_returns_estimate_with_uncertainty() {
        let engine = Engine::new(
            Box::new(HeuristicProsodyTool),
            Box::new(HeuristicVoicePresentationTool),
            Box::new(RuleBasedCoach),
        );
        let result = engine
            .analyze(AnalysisInput {
                median_pitch_hz: 190.0,
                pitch_stability: 0.72,
                pause_ratio: 0.22,
                spectral_brightness: 0.64,
            })
            .await
            .expect("analysis should succeed");

        assert!((0.0..=100.0).contains(&result.voice_presentation.score));
        assert!((0.0..=1.0).contains(&result.voice_presentation.confidence));
        assert!(result
            .voice_presentation
            .uncertainty_note
            .contains("not a definitive label"));
    }
}
