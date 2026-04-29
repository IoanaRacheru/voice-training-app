// @ts-nocheck

import React, { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import WaveformVisualizer from "@/components/training/WaveformVisualizer";
import RecordingControls from "@/components/training/RecordingControls";
import PitchChart from "@/components/training/PitchChart";
import FeedbackCards from "@/components/training/FeedbackCards";
import GoalBadge from "@/components/training/GoalBadge";

import { useAuth } from "@/lib/AuthContext";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

/**
 * Calculate score
 */
function computeScore(pitch, targetRange) {
  if (!pitch || !targetRange) return null;

  const [low, high] = targetRange;
  const center = (low + high) / 2;
  const margin = (high - low) / 2;

  const dist = Math.abs(pitch - center);

  return Math.max(
    0,
    Math.min(100, Math.round(100 - (dist / (margin * 2)) * 100))
  );
}

export default function Training() {
  const { user } = useAuth();
  const [exerciseType] = useState("pitch");

  const goal = user?.voice_goal || "feminize";

  const targetRange =
    user?.target_pitch_range?.length === 2
      ? user.target_pitch_range
      : goal === "feminize"
      ? [180, 240]
      : [100, 150];

  const {
    isRecording,
    duration,
    currentPitch,
    pitchData,
    waveformData,
    error,
    startRecording,
    stopRecording,
    reset,
    getSessionStats,
  } = useVoiceRecorder();

  const safePitch = currentPitch ?? 0;
  const score = computeScore(currentPitch, targetRange) ?? 0;

  const handleToggle = async () => {
    if (isRecording) {
      stopRecording();

      const { averagePitch } = getSessionStats();

      if (duration >= 3 && averagePitch) {
        const sessionScore = computeScore(averagePitch, targetRange) ?? 0;

        const newSession = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          duration_seconds: duration,
          average_pitch: averagePitch,
          score: sessionScore,
          exercise_type: exerciseType,
          goal,
        };

        const existingSessions = JSON.parse(
          localStorage.getItem("voiceSessions") || "[]"
        );

        localStorage.setItem(
          "voiceSessions",
          JSON.stringify([...existingSessions, newSession])
        );

        toast.success(
          `Session saved! Avg pitch: ${averagePitch}Hz · Score: ${sessionScore}/100`
        );
      }
    } else {
      await startRecording();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Voice Training
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Practice and track your vocal progress
          </p>
        </div>

        <GoalBadge goal={goal} />
      </motion.div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* RECORDING INDICATOR */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 text-sm text-destructive font-medium"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
          </span>
          Recording Live
        </motion.div>
      )}

      {/* WAVEFORM */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-card border border-border/50 p-5 glow-purple"
      >
        <WaveformVisualizer
          isRecording={isRecording}
          waveformData={waveformData ? Array.from(waveformData) : []}
        />

        <div className="mt-5">
          <RecordingControls
            isRecording={isRecording}
            onToggle={handleToggle}
            onReset={reset}
            duration={duration}
          />
        </div>
      </motion.div>

      {/* FEEDBACK */}
      <FeedbackCards
        currentPitch={safePitch}
        targetRange={targetRange}
        score={score}
        isRecording={isRecording}
      />

      {/* GRAPH */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-card border border-border/50 p-5"
      >
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">
            Live Pitch Graph
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Target: {targetRange[0]}–{targetRange[1]}Hz
          </p>
        </div>

        {pitchData.length > 0 ? (
          <PitchChart data={pitchData} targetRange={targetRange} />
        ) : (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Start recording to see your pitch in real time
          </div>
        )}
      </motion.div>
    </div>
  );
}