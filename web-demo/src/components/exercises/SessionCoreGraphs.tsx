import { useMemo } from "react";
import {
  CartesianGrid,
  LineChart,
  Legend,
  Line,
  ResponsiveContainer,
  ReferenceArea,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { analysisService } from "@/services/analysisService";

const FEMININE_RANGE: [number, number] = [180, 255];
const MASCULINE_RANGE: [number, number] = [85, 145];

type PitchEntry = { pitch: number };

function getResonancePoints(pitchData: PitchEntry[] = []) {
  return pitchData.map((entry, index) => {
    const pitch = Number(entry.pitch) || 0;
    const f1 = Math.max(200, Math.round(250 + pitch * 0.45));
    const f2 = Math.max(800, Math.round(1100 + pitch * 0.9));
    const f3 = Math.max(1800, Math.round(2200 + pitch * 1.1));
    return { idx: index + 1, f1, f2, f3 };
  });
}

function getVoicePresentationPercent(currentPitch: number) {
  if (!analysisService.isValidPitch(currentPitch)) {
    return 50;
  }
  return Math.round(Math.max(0, Math.min(1, (Number(currentPitch) - 120) / 100)) * 100);
}

type SessionCoreGraphsProps = {
  pitchData?: PitchEntry[];
  currentPitch: number;
  pitchTargetEnabled?: boolean;
  showPitchGraph?: boolean;
  showResonanceGraph?: boolean;
  showGenderGraph?: boolean;
};

export default function SessionCoreGraphs({
  pitchData = [],
  currentPitch,
  pitchTargetEnabled,
  showPitchGraph = true,
  showResonanceGraph = true,
  showGenderGraph = true,
}: SessionCoreGraphsProps) {
  const pitchChartData = useMemo(
    () =>
      (pitchData || []).map((entry, index) => ({
        idx: index + 1,
        pitch: Number(entry.pitch) || 0,
      })),
    [pitchData]
  );
  const resonanceData = useMemo(() => getResonancePoints(pitchData), [pitchData]);
  const resonanceDomain = useMemo<[number, number]>(() => {
    if (!resonanceData.length) {
      return [150, 3200];
    }
    const values = resonanceData.flatMap((point) => [point.f1, point.f2, point.f3]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const span = Math.max(220, maxValue - minValue);
    const padding = Math.max(40, Math.round(span * 0.14));
    const lower = Math.max(100, minValue - padding);
    const upper = Math.min(3600, maxValue + padding);
    return [lower, Math.max(lower + 180, upper)];
  }, [resonanceData]);
  const femininePercent = useMemo(() => getVoicePresentationPercent(currentPitch), [currentPitch]);
  const masculinePercent = 100 - femininePercent;

  return (
    <div className="grid gap-5">
      {showPitchGraph && <section className="bg-card p-4 shadow-[0_12px_35px_rgba(105,79,93,0.07)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-foreground">Pitch graph</h3>
          <span className="text-xs font-bold uppercase text-muted-foreground">
            {pitchTargetEnabled ? "Live pitch in Hz with target range" : "Live pitch in Hz with reference ranges"}
          </span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pitchChartData}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" />
              <XAxis dataKey="idx" tick={{ fontSize: 10 }} />
              <YAxis domain={[80, 300]} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: number) => [`${Number(value).toFixed(0)} Hz`, "Pitch"]} />
              <Legend />
              <ReferenceArea y1={MASCULINE_RANGE[0]} y2={MASCULINE_RANGE[1]} fill="#BFD3C1" fillOpacity={0.42} ifOverflow="extendDomain" />
              <ReferenceArea y1={FEMININE_RANGE[0]} y2={FEMININE_RANGE[1]} fill="#EFC7C2" fillOpacity={0.42} ifOverflow="extendDomain" />
              <Line type="monotone" dataKey="pitch" name="Current pitch" stroke="#694F5D" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase text-muted-foreground">
          <span className="border border-border bg-muted px-2 py-1 text-foreground">Masculine {MASCULINE_RANGE[0]}-{MASCULINE_RANGE[1]} Hz</span>
          <span className="border border-border bg-secondary px-2 py-1 text-foreground">Feminine {FEMININE_RANGE[0]}-{FEMININE_RANGE[1]} Hz</span>
        </div>
      </section>}

      {showResonanceGraph && <section className="bg-card p-4 shadow-[0_12px_35px_rgba(105,79,93,0.07)]">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-black uppercase text-foreground">Resonance proxy (F1/F2/F3, Hz)</h3>
          <Popover><PopoverTrigger asChild><button type="button" className="text-xs font-bold text-primary">F1</button></PopoverTrigger><PopoverContent className="w-64 text-xs">Shows how open the mouth is and tongue height.</PopoverContent></Popover>
          <Popover><PopoverTrigger asChild><button type="button" className="text-xs font-bold text-primary">F2</button></PopoverTrigger><PopoverContent className="w-64 text-xs">Shows tongue position, from back to front.</PopoverContent></Popover>
          <Popover><PopoverTrigger asChild><button type="button" className="text-xs font-bold text-primary">F3</button></PopoverTrigger><PopoverContent className="w-64 text-xs">Helps describe resonance quality and vocal tract shape.</PopoverContent></Popover>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" />
              <XAxis type="number" dataKey="idx" name="Sample" tick={{ fontSize: 10 }} />
              <YAxis type="number" dataKey="f1" name="Hz" domain={resonanceDomain} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value: number) => [`${Number(value).toFixed(0)} Hz`, "Formant proxy"]} />
              <Legend />
              <Scatter name="F1" data={resonanceData} fill="#68A691" />
              <Scatter name="F2" data={resonanceData.map((p) => ({ ...p, f1: p.f2 }))} fill="#EFC7C2" />
              <Scatter name="F3" data={resonanceData.map((p) => ({ ...p, f1: p.f3 }))} fill="#694F5D" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>}

      {showGenderGraph && <section className="bg-card p-4 shadow-[0_12px_35px_rgba(105,79,93,0.07)]">
        <h3 className="mb-1 text-sm font-black uppercase text-foreground">Voice presentation (legacy pitch proxy)</h3>
        <p className="mb-3 text-[11px] font-bold uppercase text-muted-foreground">0-39 masculine-leaning, 40-60 androgynous-leaning, 61-100 feminine-leaning</p>
        <div className="space-y-3">
          <div className="relative h-16 overflow-hidden rounded-full border border-border bg-gradient-to-r from-[#BFD3C1] via-[#FFE5D4] to-[#EFC7C2]">
            <motion.div
              className="absolute inset-y-0 left-0 w-full opacity-70"
              style={{
                background:
                  "radial-gradient(80px 28px at 18% 50%, rgba(255,229,212,0.65), transparent 70%), radial-gradient(120px 36px at 70% 50%, rgba(239,199,194,0.36), transparent 72%)",
              }}
              animate={{ x: ["-8%", "6%", "-8%"] }}
              transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
            />
            <motion.div
              className="absolute top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border-4 border-background bg-primary shadow-[0_10px_30px_rgba(105,79,93,0.09)]"
              animate={{ left: `calc(${femininePercent}% - 20px)` }}
              transition={{ duration: 0.65, ease: "easeInOut" }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
            <span>Masculine {masculinePercent}%</span>
            <span>Feminine {femininePercent}%</span>
          </div>
        </div>
      </section>}
    </div>
  );
}
