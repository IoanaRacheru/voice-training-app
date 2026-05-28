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

function getGenderPercent(currentPitch: number) {
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
  const femininePercent = useMemo(() => getGenderPercent(currentPitch), [currentPitch]);
  const masculinePercent = 100 - femininePercent;

  return (
    <div className="grid gap-5">
      {showPitchGraph && <section className="bg-white p-4 shadow-[0_12px_35px_rgba(17,17,17,0.05)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-foreground">Pitch Graph</h3>
          <span className="text-xs font-bold uppercase text-muted-foreground">
            {pitchTargetEnabled ? "Live pitch with target ranges" : "Live pitch with reference ranges"}
          </span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pitchChartData}>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" />
              <XAxis dataKey="idx" tick={{ fontSize: 10 }} />
              <YAxis domain={[80, 300]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <ReferenceArea y1={MASCULINE_RANGE[0]} y2={MASCULINE_RANGE[1]} fill="#93c5fd" fillOpacity={0.34} ifOverflow="extendDomain" />
              <ReferenceArea y1={FEMININE_RANGE[0]} y2={FEMININE_RANGE[1]} fill="#f9a8d4" fillOpacity={0.34} ifOverflow="extendDomain" />
              <Line type="monotone" dataKey="pitch" name="Current pitch" stroke="#111111" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase text-muted-foreground">
          <span className="border border-border bg-blue-100 px-2 py-1 text-blue-900">Masculine {MASCULINE_RANGE[0]}-{MASCULINE_RANGE[1]} Hz</span>
          <span className="border border-border bg-pink-100 px-2 py-1 text-pink-900">Feminine {FEMININE_RANGE[0]}-{FEMININE_RANGE[1]} Hz</span>
        </div>
      </section>}

      {showResonanceGraph && <section className="bg-white p-4 shadow-[0_12px_35px_rgba(17,17,17,0.05)]">
        <div className="mb-3 flex items-center gap-2">
          <h3 className="text-sm font-black uppercase text-foreground">Resonance Graph (F1/F2/F3)</h3>
          <Popover><PopoverTrigger asChild><button type="button" className="text-xs font-bold text-primary">F1</button></PopoverTrigger><PopoverContent className="w-64 text-xs">Shows how open the mouth is and tongue height.</PopoverContent></Popover>
          <Popover><PopoverTrigger asChild><button type="button" className="text-xs font-bold text-primary">F2</button></PopoverTrigger><PopoverContent className="w-64 text-xs">Shows tongue position, from back to front.</PopoverContent></Popover>
          <Popover><PopoverTrigger asChild><button type="button" className="text-xs font-bold text-primary">F3</button></PopoverTrigger><PopoverContent className="w-64 text-xs">Helps describe resonance quality and vocal tract shape.</PopoverContent></Popover>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" />
              <XAxis type="number" dataKey="idx" name="Sample" tick={{ fontSize: 10 }} />
              <YAxis type="number" dataKey="f1" name="Hz" domain={[150, 3200]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Scatter name="F1" data={resonanceData} fill="#ef4444" />
              <Scatter name="F2" data={resonanceData.map((p) => ({ ...p, f1: p.f2 }))} fill="#22c55e" />
              <Scatter name="F3" data={resonanceData.map((p) => ({ ...p, f1: p.f3 }))} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>}

      {showGenderGraph && <section className="bg-white p-4 shadow-[0_12px_35px_rgba(17,17,17,0.05)]">
        <h3 className="mb-3 text-sm font-black uppercase text-foreground">Gender Graph</h3>
        <div className="space-y-3">
          <div className="h-10 overflow-hidden border border-border bg-blue-500/85">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-400 to-pink-500"
              animate={{ width: `${femininePercent}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
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
