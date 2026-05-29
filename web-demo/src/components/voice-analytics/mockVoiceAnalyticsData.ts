export type TimeSeriesPoint = {
  timestamp: string;
  value: number;
};

export type HarmonicPoint = {
  label: string;
  fundamental: number;
  overtone: number;
};

export type FrequencyBand = {
  frequency: string;
  amplitude: number;
};

export type SpectrogramCell = {
  time: string;
  frequency: string;
  intensity: number;
};

export const vocalWeightData: TimeSeriesPoint[] = [
  { timestamp: "0s", value: 38 },
  { timestamp: "5s", value: 44 },
  { timestamp: "10s", value: 51 },
  { timestamp: "15s", value: 58 },
  { timestamp: "20s", value: 54 },
  { timestamp: "25s", value: 63 },
  { timestamp: "30s", value: 67 },
  { timestamp: "35s", value: 61 },
  { timestamp: "40s", value: 72 },
];

export const harmonicsData: HarmonicPoint[] = [
  { label: "H1", fundamental: 72, overtone: 30 },
  { label: "H2", fundamental: 58, overtone: 46 },
  { label: "H3", fundamental: 44, overtone: 54 },
  { label: "H4", fundamental: 31, overtone: 39 },
  { label: "H5", fundamental: 22, overtone: 28 },
  { label: "H6", fundamental: 14, overtone: 19 },
];

export const volumeData: TimeSeriesPoint[] = [
  { timestamp: "0s", value: 28 },
  { timestamp: "5s", value: 35 },
  { timestamp: "10s", value: 47 },
  { timestamp: "15s", value: 43 },
  { timestamp: "20s", value: 56 },
  { timestamp: "25s", value: 52 },
  { timestamp: "30s", value: 61 },
  { timestamp: "35s", value: 48 },
  { timestamp: "40s", value: 42 },
];

export const frequencySpectrumData: FrequencyBand[] = [
  { frequency: "80Hz", amplitude: 16 },
  { frequency: "160Hz", amplitude: 42 },
  { frequency: "320Hz", amplitude: 68 },
  { frequency: "640Hz", amplitude: 54 },
  { frequency: "1.2k", amplitude: 39 },
  { frequency: "2.5k", amplitude: 29 },
  { frequency: "5k", amplitude: 18 },
  { frequency: "8k", amplitude: 10 },
];

const spectrogramTimes = ["0s", "4s", "8s", "12s", "16s", "20s", "24s", "28s"];
const spectrogramFrequencies = ["4k", "2k", "1k", "500", "250", "125"];

export const spectrogramData: SpectrogramCell[] = spectrogramFrequencies.flatMap(
  (frequency, frequencyIndex) =>
    spectrogramTimes.map((time, timeIndex) => ({
      time,
      frequency,
      intensity: Math.max(
        8,
        Math.round(
          72 -
            frequencyIndex * 8 +
            Math.sin(timeIndex * 0.9 + frequencyIndex * 0.45) * 18
        )
      ),
    }))
);

