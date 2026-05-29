import { FrequencySpectrumChart } from "./FrequencySpectrumChart";
import { HarmonicsChart } from "./HarmonicsChart";
import { SpectrogramChart } from "./SpectrogramChart";
import { VocalWeightChart } from "./VocalWeightChart";
import { VolumeChart } from "./VolumeChart";

export function VoiceAnalyticsDashboard() {
  return (
    <section className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <VocalWeightChart />
        <VolumeChart />
        <HarmonicsChart />
        <FrequencySpectrumChart />
      </div>
      <SpectrogramChart />
    </section>
  );
}

