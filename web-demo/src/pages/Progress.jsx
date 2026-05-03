// @ts-nocheck


import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import PitchEvolutionChart from "@/components/progress/PitchEvolutionChart";
import ScoreChart from "@/components/progress/ScoreChart";
import SessionHistory from "@/components/progress/SessionHistory";
import { Activity } from "lucide-react";
import { safeJsonParse } from "@/lib/utils";


export default function Progress() {
  const sessions = safeJsonParse(
    localStorage.getItem("voiceSessions"),
    [],
    (val) => Array.isArray(val)
  );

  const hasSessions = sessions.length > 0;

  const pitchData = sessions
    .slice()
    .reverse()
    .map((session) => ({
      date: format(new Date(session.date), "MMM d"),
      pitch: session.average_pitch,
    }));

  const scoreData = sessions
    .slice()
    .reverse()
    .map((session) => ({
      date: format(new Date(session.date), "MMM d"),
      score: session.score,
    }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Progress & History
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your vocal transformation over time
        </p>
      </motion.div>

      {!hasSessions ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] bg-card border border-border/70 flex flex-col items-center justify-center py-24 gap-4 shadow-[0_14px_28px_rgba(47,42,38,0.08)]"
        >
          <div className="w-16 h-16 rounded-[24px] bg-primary/40 flex items-center justify-center">
            <Activity className="w-8 h-8 text-foreground" />
          </div>

          <div className="text-center">
            <p className="text-base font-semibold text-foreground">
              No sessions yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete your first recording to see progress here.
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PitchEvolutionChart data={pitchData} />
            <ScoreChart data={scoreData} />
          </div>

          <SessionHistory sessions={sessions.slice().reverse()} />
        </>
      )}
    </div>
  );
}
