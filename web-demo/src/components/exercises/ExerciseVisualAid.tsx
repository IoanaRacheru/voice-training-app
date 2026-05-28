import { motion } from "framer-motion";
import { AudioLines, CircleDashed, Wind, Waves, Droplets } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SessionVisualAidType } from "@/features/exercises/toolTypes";

const labelByType: Record<SessionVisualAidType, string> = {
  breathing: "Breathing flow",
  resonance: "Resonance placement",
  pitch: "Pitch movement",
  humming: "Humming placement",
  larynx: "Larynx lift",
  general: "Exercise demo",
};

const iconByType: Record<SessionVisualAidType, LucideIcon> = {
  breathing: Wind,
  resonance: Waves,
  pitch: AudioLines,
  humming: CircleDashed,
  larynx: Droplets,
  general: AudioLines,
};

export default function ExerciseVisualAid({ type }: { type: SessionVisualAidType }) {
  const Icon = iconByType[type];
  return (
    <div className="relative overflow-hidden border border-border bg-background p-5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="font-mono text-[11px] uppercase text-muted-foreground">{labelByType[type]}</p>
      </div>
      <div className="relative h-28">
        <motion.div
          className="absolute inset-y-8 left-0 right-0 rounded-full bg-primary/15"
          animate={{ scaleX: [0.65, 1, 0.65] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-y-11 left-0 right-0 rounded-full bg-primary"
          animate={{ scaleX: [0.4, 0.9, 0.4], opacity: [0.45, 0.9, 0.45] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
