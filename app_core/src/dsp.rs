//! Basic DSP utilities used by the core engine.

use rustfft::{num_complex::Complex, FftPlanner};

/// Result of signal-derived feature extraction.
#[derive(Debug, Clone)]
pub struct SignalFeatures {
    /// Estimated median pitch in Hz.
    pub median_pitch_hz: f64,
    /// Pitch stability score in `[0, 1]`.
    pub pitch_stability: f64,
    /// Speech pause ratio in `[0, 1]`.
    pub pause_ratio: f64,
    /// Spectral brightness score in `[0, 1]`.
    pub spectral_brightness: f64,
}

/// Extract signal features from mono PCM samples.
pub fn extract_signal_features(samples: &[f32], sample_rate: u32) -> Option<SignalFeatures> {
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
    if max_rms <= 0.0 {
        return None;
    }
    let vad_threshold = (max_rms * 0.2).max(0.005);
    let voiced_mask: Vec<bool> = rms_values.iter().map(|r| *r >= vad_threshold).collect();

    let voiced_frames = voiced_mask.iter().filter(|v| **v).count() as f64;
    let total_frames = voiced_mask.len() as f64;
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

    Some(SignalFeatures {
        median_pitch_hz,
        pitch_stability,
        pause_ratio,
        spectral_brightness,
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
            let w =
                0.5 - 0.5 * (2.0 * std::f64::consts::PI * i as f64 / (n.saturating_sub(1) as f64)).cos();
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
    }
}
