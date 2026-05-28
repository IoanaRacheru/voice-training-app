export const PITCH_LIMITS = {
  minHz: 50,
  maxHz: 600,
};

export function isValidPitch(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= PITCH_LIMITS.minHz &&
    value <= PITCH_LIMITS.maxHz
  );
}

export function sanitizePitch(value) {
  if (!isValidPitch(value)) {
    return null;
  }

  return Math.round(value);
}

export function sanitizePitchSeries(pitches = []) {
  if (!Array.isArray(pitches)) {
    return [];
  }

  return pitches.map(sanitizePitch).filter((pitch) => pitch !== null);
}

function getRms(buffer) {
  let sum = 0;

  for (let index = 0; index < buffer.length; index += 1) {
    const sample = buffer[index];
    if (!Number.isFinite(sample)) {
      return null;
    }
    sum += sample * sample;
  }

  return Math.sqrt(sum / buffer.length);
}

export function detectPitch(buffer, sampleRate) {
  if (!buffer || !Number.isFinite(sampleRate) || sampleRate <= 0) {
    return null;
  }

  const size = buffer.length;
  const rms = getRms(buffer);

  if (!Number.isFinite(rms) || rms < 0.0035) {
    return null;
  }

  let mean = 0;
  for (let index = 0; index < size; index += 1) {
    mean += buffer[index];
  }
  mean /= size;

  const minOffset = Math.max(2, Math.floor(sampleRate / PITCH_LIMITS.maxHz));
  const maxOffset = Math.min(
    size - 2,
    Math.ceil(sampleRate / PITCH_LIMITS.minHz)
  );
  let bestOffset = -1;
  let bestCorrelation = -1;
  const correlations = new Float32Array(maxOffset + 1);

  for (let offset = minOffset; offset <= maxOffset; offset += 1) {
    let correlation = 0;
    let energyA = 0;
    let energyB = 0;
    const compareLength = size - offset;

    for (let index = 0; index < compareLength; index += 1) {
      const sampleA = buffer[index] - mean;
      const sampleB = buffer[index + offset] - mean;
      correlation += sampleA * sampleB;
      energyA += sampleA * sampleA;
      energyB += sampleB * sampleB;
    }

    const normalized =
      energyA > 0 && energyB > 0
        ? correlation / Math.sqrt(energyA * energyB)
        : 0;
    correlations[offset] = normalized;

    if (normalized > bestCorrelation) {
      bestCorrelation = normalized;
      bestOffset = offset;
    }
  }

  for (let offset = minOffset + 1; offset < maxOffset - 1; offset += 1) {
    const current = correlations[offset];
    if (
      current > 0.42 &&
      current >= correlations[offset - 1] &&
      current >= correlations[offset + 1]
    ) {
      bestOffset = offset;
      bestCorrelation = current;
      break;
    }
  }

  if (bestCorrelation < 0.34 || bestOffset <= 0) {
    return null;
  }

  const previous = correlations[bestOffset - 1] || bestCorrelation;
  const next = correlations[bestOffset + 1] || bestCorrelation;
  const divisor = previous - 2 * bestCorrelation + next;
  const adjustment = divisor ? (previous - next) / (2 * divisor) : 0;
  const refinedOffset = bestOffset + Math.max(-0.5, Math.min(0.5, adjustment));

  return sanitizePitch(sampleRate / refinedOffset);
}

export function estimateVoicePresentation({ pitch, resonanceCentroid }) {
  if (!isValidPitch(pitch)) {
    return {
      label: "No pitch yet",
      score: 0,
      confidence: "low",
      detail: "Speak a little longer so the app can estimate pitch.",
    };
  }

  let score = 0;
  if (pitch >= 180) {
    score += 2;
  } else if (pitch >= 145) {
    score += 1;
  } else {
    score -= 1;
  }

  if (Number.isFinite(resonanceCentroid)) {
    if (resonanceCentroid >= 1900) {
      score += 1;
    } else if (resonanceCentroid < 1300) {
      score -= 1;
    }
  }

  if (score >= 2) {
    return {
      label: "Feminine-coded",
      score,
      confidence: Number.isFinite(resonanceCentroid) ? "medium" : "low",
      detail: "The current pitch and brightness lean toward a feminine-coded sound.",
    };
  }

  if (score <= -1) {
    return {
      label: "Masculine-coded",
      score,
      confidence: Number.isFinite(resonanceCentroid) ? "medium" : "low",
      detail: "The current pitch and brightness lean toward a masculine-coded sound.",
    };
  }

  return {
    label: "Androgynous / mixed",
    score,
    confidence: Number.isFinite(resonanceCentroid) ? "medium" : "low",
    detail: "The current voice features sit between common masculine-coded and feminine-coded ranges.",
  };
}

export const analysisService = {
  detectPitch,
  estimateVoicePresentation,
  isValidPitch,
  sanitizePitch,
  sanitizePitchSeries,

  process(audioData) {
    const cleanPitches = sanitizePitchSeries(audioData?.pitches);

    if (!audioData || audioData.failedAnalysis) {
      return {
        ok: false,
        error: audioData?.analysisError || "Audio analysis failed.",
        pitches: [],
        averagePitch: null,
      };
    }

    if (cleanPitches.length === 0) {
      return {
        ok: false,
        error: "No valid pitch data was detected.",
        pitches: [],
        averagePitch: null,
      };
    }

    const averagePitch = Math.round(
      cleanPitches.reduce((total, pitch) => total + pitch, 0) / cleanPitches.length
    );

    return {
      ok: true,
      error: null,
      pitches: cleanPitches,
      averagePitch,
    };
  },
};
