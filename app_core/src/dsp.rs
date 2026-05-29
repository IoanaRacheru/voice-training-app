

use rustfft::{FftPlanner, num_complex::Complex};


pub trait VadDetector: Send + Sync {
    
    fn voiced_mask(
        &self,
        samples: &[f32],
        sample_rate: u32,
        frame_size: usize,
        hop: usize,
        rms_values: &[f64],
    ) -> Vec<bool>;
    
    fn name(&self) -> &'static str;
}

pub struct EnergyVadDetector;

impl VadDetector for EnergyVadDetector {
    fn voiced_mask(
        &self,
        _samples: &[f32],
        _sample_rate: u32,
        _frame_size: usize,
        _hop: usize,
        rms_values: &[f64],
    ) -> Vec<bool> {
        let max_rms = rms_values.iter().copied().fold(0.0f64, f64::max);
        if max_rms <= 0.0 {
            return vec![false; rms_values.len()];
        }
        let threshold = (max_rms * 0.2).max(0.005);
        rms_values.iter().map(|r| *r >= threshold).collect()
    }

    fn name(&self) -> &'static str {
        "energy_vad"
    }
}


pub struct SileroVadDetector;

impl VadDetector for SileroVadDetector {
    fn voiced_mask(
        &self,
        samples: &[f32],
        sample_rate: u32,
        frame_size: usize,
        hop: usize,
        rms_values: &[f64],
    ) -> Vec<bool> {
        silero_voiced_mask(samples, sample_rate, frame_size, hop, rms_values)
    }

    fn name(&self) -> &'static str {
        "silero_vad"
    }
}

#[cfg(feature = "vad_silero")]
fn silero_voiced_mask(
    samples: &[f32],
    sample_rate: u32,
    frame_size: usize,
    hop: usize,
    rms_values: &[f64],
) -> Vec<bool> {
    use silero::{SampleRate, Session, SpeechOptions, detect_speech};

    let sr = match sample_rate {
        8_000 => SampleRate::Rate8k,
        16_000 => SampleRate::Rate16k,
        _ => {
            return EnergyVadDetector.voiced_mask(
                samples,
                sample_rate,
                frame_size,
                hop,
                rms_values,
            );
        }
    };

    let mut session = match Session::bundled() {
        Ok(s) => s,
        Err(_) => {
            return EnergyVadDetector.voiced_mask(
                samples,
                sample_rate,
                frame_size,
                hop,
                rms_values,
            );
        }
    };

    let mut options = SpeechOptions::default();
    options = options.with_sample_rate(sr);
    let segments = match detect_speech(&mut session, samples, options) {
        Ok(s) => s,
        Err(_) => {
            return EnergyVadDetector.voiced_mask(
                samples,
                sample_rate,
                frame_size,
                hop,
                rms_values,
            );
        }
    };

    let mut mask = vec![false; rms_values.len()];
    if segments.is_empty() {
        return mask;
    }

    for (idx, voiced) in mask.iter_mut().enumerate() {
        let start_s = idx as f64 * hop as f64 / sample_rate as f64;
        let end_s = (idx * hop + frame_size) as f64 / sample_rate as f64;
        let frame_voiced = segments.iter().any(|seg| {
            let seg_start = seg.start_seconds();
            let seg_end = seg.end_seconds();
            seg_end > start_s && seg_start < end_s
        });
    }

    mask
}

#[cfg(not(feature = "vad_silero"))]
fn silero_voiced_mask(
    samples: &[f32],
    sample_rate: u32,
    frame_size: usize,
    hop: usize,
    rms_values: &[f64],
) -> Vec<bool> {
    EnergyVadDetector.voiced_mask(samples, sample_rate, frame_size, hop, rms_values)
}

#[derive(Debug, Clone, Default)]
pub struct SignalQualityFlags {
    pub low_energy: bool,
    pub low_voiced_ratio: bool,
    pub insufficient_pitch_frames: bool,
    pub unstable_pitch: bool,
}

#[derive(Debug, Clone)]
pub struct SignalFeatures {
    pub median_pitch_hz: f64,
    pub pitch_stability: f64,
    pub pause_ratio: f64,
    pub spectral_brightness: f64,
    pub confidence: f64,
    pub quality_flags: SignalQualityFlags,
    pub vad_name: &'static str,
}


pub fn extract_signal_features(samples: &[f32], sample_rate: u32) -> Option<SignalFeatures> {
    extract_signal_features_with_vad(samples, sample_rate, &EnergyVadDetector)
}


pub fn extract_signal_features_with_vad(
    samples: &[f32],
    sample_rate: u32,
    vad: &dyn VadDetector,
) -> Option<SignalFeatures> {
    if sample_rate < 8_000 || samples.len() < 1024 {
        return None;
    }

    let frame_size = 1024usize;
    let hop = 512usize;
    let frames = frame_slices(samples, frame_size, hop);
    if frames.is_empty() {
        return None;
    }

    let rms_values: Vec<f64> = frames.iter().map(|f| rms(f)).collect();
    let max_rms = rms_values.iter().copied().fold(0.0f64, f64::max);
    let voiced_mask = vad.voiced_mask(samples, sample_rate, frame_size, hop, &rms_values);

    let voiced_frames = voiced_mask.iter().filter(|v| **v).count() as f64;
    let total_frames = voiced_mask.len() as f64;
    if total_frames == 0.0 {
        return None;
    }
    let pause_ratio = (1.0 - voiced_frames / total_frames).clamp(0.0, 1.0);

    let mut pitches = Vec::new();
    let mut brightness = Vec::new();
    for (frame, voiced) in frames.iter().zip(voiced_mask.iter()) {
        if *voiced {
            if let Some(p) = estimate_pitch_autocorr(frame, sample_rate) {
                pitches.push(p);
            }
            brightness.push(spectral_brightness(frame));
        }
    }
    if pitches.is_empty() {
        return None;
    }

    pitches.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let median_pitch_hz = pitches[pitches.len() / 2];
    let mean_pitch = pitches.iter().sum::<f64>() / pitches.len() as f64;
    let variance = pitches
        .iter()
        .map(|p| {
            let d = *p - mean_pitch;
            d * d
        })
        .sum::<f64>()
        / pitches.len() as f64;
    let std_dev = variance.sqrt();
    let pitch_stability = (1.0 - (std_dev / mean_pitch).min(1.0)).clamp(0.0, 1.0);

    let spectral_brightness = if brightness.is_empty() {
        0.5
    } else {
        (brightness.iter().sum::<f64>() / brightness.len() as f64).clamp(0.0, 1.0)
    };

    let voiced_ratio = voiced_frames / total_frames;
    let quality_flags = SignalQualityFlags {
        low_energy: max_rms < 0.015,
        low_voiced_ratio: voiced_ratio < 0.25,
        insufficient_pitch_frames: pitches.len() < 8,
        unstable_pitch: pitch_stability < 0.45,
    };
    let mut confidence = 1.0f64;
    if quality_flags.low_energy {
        confidence -= 0.25;
    }
    if quality_flags.low_voiced_ratio {
        confidence -= 0.25;
    }
    if quality_flags.insufficient_pitch_frames {
        confidence -= 0.25;
    }
    if quality_flags.unstable_pitch {
        confidence -= 0.15;
    }
    confidence = confidence.clamp(0.05, 1.0);

    Some(SignalFeatures {
        median_pitch_hz,
        pitch_stability,
        pause_ratio,
        spectral_brightness,
        confidence,
        quality_flags,
        vad_name: vad.name(),
    })
}

fn frame_slices(samples: &[f32], frame_size: usize, hop: usize) -> Vec<&[f32]> {
    let mut frames = Vec::new();
    let mut i = 0usize;
    while i + frame_size <= samples.len() {
        frames.push(&samples[i..i + frame_size]);
        i += hop;
    }
    frames
}

fn rms(frame: &[f32]) -> f64 {
    let sum = frame.iter().map(|s| (*s as f64) * (*s as f64)).sum::<f64>();
    (sum / frame.len() as f64).sqrt()
}

fn estimate_pitch_autocorr(frame: &[f32], sample_rate: u32) -> Option<f64> {
    let min_hz = 70.0;
    let max_hz = 350.0;
    let min_lag = (sample_rate as f64 / max_hz) as usize;
    let max_lag = (sample_rate as f64 / min_hz) as usize;
    if max_lag >= frame.len() || min_lag == 0 || min_lag >= max_lag {
        return None;
    }

    let mut best_lag = 0usize;
    let mut best = 0.0f64;
    for lag in min_lag..=max_lag {
        let mut corr = 0.0;
        for i in 0..(frame.len() - lag) {
            corr += frame[i] as f64 * frame[i + lag] as f64;
        }
        if corr > best {
            best = corr;
            best_lag = lag;
        }
    }
    if best_lag == 0 {
        return None;
    }
    Some(sample_rate as f64 / best_lag as f64)
}

fn spectral_brightness(frame: &[f32]) -> f64 {
    let n = frame.len();
    let mut planner = FftPlanner::<f64>::new();
    let fft = planner.plan_fft_forward(n);
    let mut buffer: Vec<Complex<f64>> = frame
        .iter()
        .enumerate()
        .map(|(i, s)| {
            let w = 0.5
                - 0.5
                    * (2.0 * std::f64::consts::PI * i as f64 / (n as f64 - 1.0)).cos();
            Complex::new(*s as f64 * w, 0.0)
        })
        .collect();
    fft.process(&mut buffer);

    let half = n / 2;
    let mut num = 0.0;
    let mut den = 0.0;
    for (k, c) in buffer.iter().take(half).enumerate() {
        let mag = c.norm();
        let f = k as f64 / half as f64;
        num += f * mag;
        den += mag;
    }
    if den == 0.0 {
        0.0
    } else {
        (num / den).clamp(0.0, 1.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extract_features_from_sine_wave() {
        let sr = 16_000u32;
        let freq = 200.0f32;
        let len = sr as usize;
        let samples: Vec<f32> = (0..len)
            .map(|i| {
                let t = i as f32 / sr as f32;
                (2.0 * std::f32::consts::PI * freq * t).sin() * 0.6
            })
            .collect();

        let f = extract_signal_features(&samples, sr).expect("features");
        assert!((150.0..=260.0).contains(&f.median_pitch_hz));
        assert!((0.0..=1.0).contains(&f.pitch_stability));
        assert!((0.0..=1.0).contains(&f.pause_ratio));
        assert!((0.0..=1.0).contains(&f.spectral_brightness));
        assert!((0.0..=1.0).contains(&f.confidence));
        assert_eq!(f.vad_name, "energy_vad");
    }

    #[test]
    fn low_energy_signal_flags_quality() {
        let sr = 16_000u32;
        let samples: Vec<f32> = (0..sr as usize)
            .map(|i| {
                let t = i as f32 / sr as f32;
                (2.0 * std::f32::consts::PI * 180.0 * t).sin() * 0.01
            })
            .collect();
        let f = extract_signal_features(&samples, sr).expect("features");
        assert!(f.quality_flags.low_energy);
        assert!(f.confidence < 1.0);
    }

    #[test]
    fn silero_detector_is_callable() {
        let sr = 12_000u32;
        let samples: Vec<f32> = (0..sr as usize)
            .map(|i| {
                let t = i as f32 / sr as f32;
                (2.0 * std::f32::consts::PI * 220.0 * t).sin() * 0.5
            })
            .collect();
        let f =
            extract_signal_features_with_vad(&samples, sr, &SileroVadDetector).expect("features");
        assert_eq!(f.vad_name, "silero_vad");
    }

    #[cfg(feature = "vad_silero")]
    #[test]
    fn silero_detector_processes_supported_rate() {
        let sr = 16_000u32;
        let frame_size = 1024usize;
        let hop = 512usize;
        let samples: Vec<f32> = (0..sr as usize)
            .map(|i| {
                let t = i as f32 / sr as f32;
                (2.0 * std::f32::consts::PI * 180.0 * t).sin() * 0.5
            })
            .collect();

        let frames = frame_slices(&samples, frame_size, hop);
        let rms_values: Vec<f64> = frames.iter().map(|f| rms(f)).collect();
        let mask = SileroVadDetector.voiced_mask(&samples, sr, frame_size, hop, &rms_values);
        assert_eq!(mask.len(), rms_values.len());
    }

    #[test]
    fn bursty_signal_confidence_degrades() {
        let sr = 16_000u32;
        let len = sr as usize;
        let samples: Vec<f32> = (0..len)
            .map(|i| {
                
                let phase = i % (sr as usize / 2);
                if phase < (sr as usize * 4 / 100) {
                    let t = i as f32 / sr as f32;
                    (2.0 * std::f32::consts::PI * 200.0 * t).sin() * 0.25
                } else {
                    0.0
                }
            })
            .collect();
        let f = extract_signal_features(&samples, sr).expect("features");
        assert!(f.quality_flags.low_voiced_ratio);
        assert!(f.confidence < 1.0);
        let any_flag = f.quality_flags.low_energy
            || f.quality_flags.low_voiced_ratio
            || f.quality_flags.insufficient_pitch_frames
            || f.quality_flags.unstable_pitch;
        assert!(any_flag);
    }
}
