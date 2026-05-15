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
import { createSession } from "@/api/authClient";

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

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

export default function Training() {
  const { user, getToken } = useAuth();
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
  const targetCenter = Math.round((targetRange[0] + targetRange[1]) / 2);

  const handleToggle = async () => {
    if (isRecording) {
      stopRecording();

      const { averagePitch } = getSessionStats();

      if (duration >= 3 && averagePitch) {
        const sessionScore = computeScore(averagePitch, targetRange) ?? 0;

        try {
          await createSession(getToken(), {
            duration_seconds: duration,
            average_pitch: averagePitch,
            score: sessionScore,
            exercise_type: exerciseType,
            goal,
          });
          toast.success(
            `Session saved. Avg pitch: ${averagePitch}Hz — Score: ${sessionScore}/100`
          );
        } catch (err) {
          console.error("Session save failed:", err);
          toast.error("Failed to save session. Please try again.");
        }
      }
    } else {
      await startRecording();
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] uppercase text-muted-foreground">
              Module 03
            </span>
            <GoalBadge goal={goal} />
          </div>

          <h1 className="font-display text-5xl uppercase leading-[0.95] text-foreground md:text-7xl">
            Training session
          </h1>
          <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
            Focus on one sustained tone. Record, monitor the essentials, then review the take.
          </p>
        </div>

        <div className="text-sm font-semibold text-muted-foreground md:text-right">
          Target <span className="font-bold text-foreground">{targetRange[0]}-{targetRange[1]} Hz</span>
        </div>
      </motion.header>

      {error && (
        <div className="border-l-4 border-destructive bg-white px-4 py-3 text-sm font-bold text-destructive shadow-[0_12px_34px_rgba(17,17,17,0.06)]">
          {error}
        </div>
      )}

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white shadow-[0_24px_70px_rgba(17,17,17,0.08)]"
      >
        <div className="grid gap-8 p-5 md:p-8 lg:grid-cols-[minmax(0,1fr)_270px]">
          <div className="space-y-7">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
              <div>
                <p className="font-mono text-[11px] uppercase text-muted-foreground">
                  Recording deck
                </p>
                <h2 className="mt-1 text-2xl font-black uppercase text-foreground">
                  Live take
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 ${isRecording ? "animate-pulse-glow bg-primary" : "bg-muted"}`}
                />
                <span className="font-mono text-xs font-bold uppercase text-muted-foreground">
                  {isRecording ? "Recording" : "Ready"}
                </span>
              </div>
            </div>

            <WaveformVisualizer
              isRecording={isRecording}
              waveformData={waveformData ? Array.from(waveformData) : []}
            />

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase text-muted-foreground">
                  Pitch
                </p>
                <p className="mt-2 font-display text-4xl uppercase leading-none">
                  {isRecording ? `${safePitch} Hz` : "-- Hz"}
                </p>
              </div>

              <div>
                <p className="font-mono text-[11px] uppercase text-muted-foreground">
                  Time
                </p>
                <p className="mt-2 font-display text-4xl uppercase leading-none">
                  {formatTime(duration)}
                </p>
              </div>

              <div>
                <p className="font-mono text-[11px] uppercase text-muted-foreground">
                  Score
                </p>
                <p className="mt-2 font-display text-4xl uppercase leading-none">
                  {isRecording ? score : "--"}
                </p>
              </div>
            </div>
          </div>

          <RecordingControls
            isRecording={isRecording}
            onToggle={handleToggle}
            onReset={reset}
            duration={duration}
          />
        </div>
      </motion.section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.06)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">
                Secondary monitor
              </p>
              <h3 className="mt-1 text-xl font-black uppercase text-foreground">
                Pitch graph
              </h3>
            </div>
            <span className="text-xs font-bold uppercase text-muted-foreground">
              Center {targetCenter} Hz
            </span>
          </div>

          {pitchData.length > 0 ? (
            <PitchChart data={pitchData} targetRange={targetRange} />
          ) : (
            <div className="flex h-48 items-center justify-center bg-background p-4 text-center text-sm font-medium text-muted-foreground">
              Start recording to see pitch in real time.
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-black uppercase text-foreground">
              Exercise notes
            </h3>
            <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
              Maintain a steady tone. Avoid throat pressure. Review peaks before changing the target.
            </p>
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-black uppercase text-foreground">
              Specs
            </h3>
            <dl className="mt-3 grid grid-cols-[84px_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-right font-semibold">Sustained pitch</dd>
              <dt className="text-muted-foreground">Mode</dt>
              <dd className="text-right font-semibold capitalize">{goal}</dd>
              <dt className="text-muted-foreground">Target</dt>
              <dd className="text-right font-semibold">{targetRange[0]}-{targetRange[1]} Hz</dd>
            </dl>
          </div>
        </aside>
      </section>

      <FeedbackCards
        currentPitch={safePitch}
        targetRange={targetRange}
        score={score}
        isRecording={isRecording}
      />
    </div>
  );
}
