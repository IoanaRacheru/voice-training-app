// @ts-nocheck

import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Timer } from "lucide-react";

import WaveformVisualizer from "@/components/training/WaveformVisualizer";
import RecordingControls from "@/components/training/RecordingControls";
import PitchChart from "@/components/training/PitchChart";
import VoiceMetricsPanel from "@/components/training/VoiceMetricsPanel";
import { Input } from "@/components/ui/input";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { analysisService } from "@/services/analysisService";
import { exerciseSessionService } from "@/services/exerciseSessionService";

const TIMER_OPTIONS = [
  { value: "60", label: "1 minute" },
  { value: "180", label: "3 minutes" },
  { value: "300", label: "5 minutes" },
  { value: "600", label: "10 minutes" },
  { value: "custom", label: "Custom duration" },
];

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

export default function ExerciseTrainingSession({
  exercise,
  targetRange,
  onSessionSaved,
}) {
  const [timerValue, setTimerValue] = useState("60");
  const [customMinutes, setCustomMinutes] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const stopInProgress = useRef(false);

  const {
    isRecording,
    duration,
    currentPitch,
    currentVolume,
    resonanceCentroid,
    voicePresentation,
    pitchData,
    waveformData,
    error,
    startRecording,
    stopRecording,
    reset,
  } = useVoiceRecorder();

  const selectedDurationSeconds = useMemo(() => {
    if (timerValue === "custom") {
      return Math.max(10, Math.round(Number(customMinutes || 1) * 60));
    }

    return Number(timerValue);
  }, [customMinutes, timerValue]);

  const safePitch = analysisService.isValidPitch(currentPitch) ? currentPitch : 0;
  const remainingSeconds = Math.max(0, selectedDurationSeconds - duration);
  const targetPitch = targetRange?.length === 2
    ? Math.round((targetRange[0] + targetRange[1]) / 2)
    : null;

  const processRecording = async (wasAutoStopped = false) => {
    if (stopInProgress.current) {
      return;
    }

    stopInProgress.current = true;
    setIsProcessing(true);

    try {
      const audioData = await stopRecording();
      const analysis = analysisService.process(audioData);
      const saveResult = exerciseSessionService.createSession({
        exercise,
        audioData,
        analysis,
        selectedDurationSeconds,
        targetPitch,
        targetRange,
      });

      if (!saveResult.ok) {
        setResult(null);
        toast.error(saveResult.error);
        return;
      }

      setResult(saveResult.session);
      onSessionSaved?.(saveResult.session);
      toast.success(
        `${exercise.name} saved. Score: ${saveResult.session.score}/100${
          wasAutoStopped ? " - timer complete" : ""
        }`
      );
    } finally {
      setIsProcessing(false);
      stopInProgress.current = false;
    }
  };

  const handleToggle = async () => {
    if (isProcessing) {
      return;
    }

    if (isRecording) {
      await processRecording(false);
      return;
    }

    setResult(null);
    reset();
    const recorderState = await startRecording();
    if (recorderState?.error || error) {
      toast.error(recorderState?.error || error);
    }
  };

  useEffect(() => {
    if (!isRecording || duration < selectedDurationSeconds) {
      return;
    }

    processRecording(true);
  }, [duration, isRecording, selectedDurationSeconds]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="border-l-4 border-destructive bg-white px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">
            Timer
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {TIMER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTimerValue(option.value)}
                disabled={isRecording || isProcessing}
                className={`min-h-11 border px-3 text-xs font-black uppercase transition-colors ${
                  timerValue === option.value
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-foreground hover:border-primary"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {timerValue === "custom" && (
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">
              Minutes
            </p>
            <Input
              type="number"
              min="0.25"
              step="0.25"
              value={customMinutes}
              disabled={isRecording || isProcessing}
              onChange={(event) => setCustomMinutes(event.target.value)}
            />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-5 bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">
                Training deck
              </p>
              <h3 className="mt-1 text-xl font-black uppercase text-foreground">
                {exercise.name}
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-muted-foreground">
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <span
                  className={`h-2.5 w-2.5 ${isRecording ? "animate-pulse-glow bg-primary" : "bg-muted"}`}
                />
              )}
              {isProcessing ? "Processing" : isRecording ? "Recording" : "Ready"}
            </div>
          </div>

          <WaveformVisualizer
            isRecording={isRecording}
            waveformData={waveformData ? Array.from(waveformData) : []}
          />

          <VoiceMetricsPanel
            isRecording={isRecording}
            currentPitch={safePitch}
            currentVolume={currentVolume}
            resonanceCentroid={resonanceCentroid}
            voicePresentation={voicePresentation}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">
                Timer
              </p>
              <p className="mt-2 font-display text-4xl uppercase leading-none text-primary">
                {formatTime(remainingSeconds)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">
                Elapsed
              </p>
              <p className="mt-2 font-display text-3xl uppercase leading-none">
                {formatTime(duration)}
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">
                Goal
              </p>
              <p className="mt-2 text-sm font-black uppercase leading-5">
                {exercise.goalLabel}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="font-mono text-[11px] uppercase text-muted-foreground">
                Pitch graph
              </p>
              {targetPitch && (
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  Center {targetPitch} Hz
                </span>
              )}
            </div>
            {pitchData.length > 0 ? (
              <PitchChart data={pitchData} targetRange={targetRange} />
            ) : (
              <div className="flex h-48 items-center justify-center bg-background p-4 text-center text-sm font-medium text-muted-foreground">
                Start this exercise to see pitch in real time.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <RecordingControls
            isRecording={isRecording}
            onToggle={handleToggle}
            onReset={() => {
              setResult(null);
              reset();
            }}
            duration={remainingSeconds}
            timeLabel="Remaining"
          />

          <div className="bg-white p-4 shadow-[0_18px_50px_rgba(17,17,17,0.05)]">
            <div className="mb-3 flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <p className="text-sm font-black uppercase text-foreground">
                Selected timer
              </p>
            </div>
            <p className="font-display text-4xl uppercase leading-none">
              {formatTime(selectedDurationSeconds)}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase leading-5 text-muted-foreground">
              Recording stops automatically when the timer reaches zero.
            </p>
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 bg-white px-4 py-3 text-sm font-bold text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Processing audio and saving valid results...
        </div>
      )}

      {result && (
        <div className="grid gap-4 bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.05)] sm:grid-cols-4">
          <div>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Result
            </p>
            <p className="mt-2 font-display text-4xl leading-none">
              {result.score}
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Duration
            </p>
            <p className="mt-2 text-lg font-black uppercase">
              {formatTime(result.duration_seconds)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Status
            </p>
            <p className="mt-2 text-lg font-black uppercase">
              {result.completed ? "Completed" : "Stopped early"}
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Feedback
            </p>
            <p className="mt-2 text-sm font-semibold leading-5 text-muted-foreground">
              {result.feedback}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
