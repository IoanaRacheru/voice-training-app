// @ts-nocheck

import React from "react";
import { motion } from "framer-motion";

const cards = [
  { key: "target", label: "Target range" },
  { key: "score", label: "Current score" },
  { key: "trend", label: "Session trend" },
];

export default function FeedbackCards({
  currentPitch,
  targetRange,
  score,
  isRecording,
}) {
  const values = {
    target: targetRange ? `${targetRange[0]}-${targetRange[1]} Hz` : "--",
    score: isRecording ? `${score}/100` : "--",
    trend: isRecording && currentPitch ? "+2.3 Hz" : "--",
  };

  return (
    <section className="border-t border-border pt-7">
      <h3 className="mb-4 text-sm font-black uppercase text-foreground">
        Session feedback
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map(({ key, label }, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="bg-white p-4 shadow-[0_14px_38px_rgba(17,17,17,0.05)]"
          >
            <p className="text-xs font-bold uppercase text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-black uppercase leading-none text-foreground">
              {values[key]}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
