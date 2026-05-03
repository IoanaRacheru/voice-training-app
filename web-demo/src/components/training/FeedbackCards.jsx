// @ts-nocheck

import React from "react";
import { motion } from "framer-motion";
import { Activity, Target, Zap, TrendingUp } from "lucide-react";

const cards = [
  {
    key: "pitch",
    label: "Current Pitch",
    icon: Activity,
    color: "bg-primary/35",
    iconColor: "text-primary",
    border: "border-primary/40",
  },
  {
    key: "target",
    label: "Target Range",
    icon: Target,
    color: "bg-secondary",
    iconColor: "text-chart-5",
    border: "border-border/70",
  },
  {
    key: "score",
    label: "Score",
    icon: Zap,
    color: "bg-accent/20",
    iconColor: "text-accent",
    border: "border-accent/35",
  },
  {
    key: "trend",
    label: "Trend",
    icon: TrendingUp,
    color: "bg-chart-2/20",
    iconColor: "text-chart-5",
    border: "border-chart-5/30",
  },
];

/**
 * @param {{
 *  currentPitch: number,
 *  targetRange: number[],
 *  score: number,
 *  isRecording: boolean
 * }} props
 */
export default function FeedbackCards({
  currentPitch,
  targetRange,
  score,
  isRecording,
}) {
  const values = {
    pitch: isRecording ? `${currentPitch}Hz` : "—",
    target: targetRange
      ? `${targetRange[0]}–${targetRange[1]}Hz`
      : "—",
    score: isRecording ? `${score}/100` : "—",
    trend: isRecording ? "+2.3Hz" : "—",
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ key, label, icon: Icon, color, iconColor, border }, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`rounded-[24px] ${color} border ${border} p-4 shadow-[0_10px_20px_rgba(47,42,38,0.07)] transition-all hover:scale-[1.02]`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <span className="text-xs font-medium text-muted-foreground">
              {label}
            </span>
          </div>

          <p className="text-xl font-bold text-foreground">
            {values[key]}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
