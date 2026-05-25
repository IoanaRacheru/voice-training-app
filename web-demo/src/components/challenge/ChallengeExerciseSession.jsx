// @ts-nocheck

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, Volume2 } from "lucide-react";

import RecordingControls from "@/components/training/RecordingControls";
import PitchChart from "@/components/training/PitchChart";
import VoiceMetricsPanel from "@/components/training/VoiceMetricsPanel";
import WaveformVisualizer from "@/components/training/WaveformVisualizer";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { analysisService } from "@/services/analysisService";
import { challengeSessionService } from "@/services/challengeSessionService";

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function getVolumeLabel(waveformData = []) {
  const samples = Array.from(waveformData);
  if (!samples.length) {
    return "Ready";
  }

  const average = samples.reduce((total, sample) => total + Math.abs(sample), 0) / samples.length;
  if (average > 0.08) {
    return "Strong";
  }

  if (average > 0.025) {
    return "Steady";
  }

  return "Soft";
}

function getVolumeStats(waveformData = []) {
  const samples = Array.from(waveformData);
  if (!samples.length) {
    return { label: "Ready", level: 0, peak: 0 };
  }

  const average =
    samples.reduce((total, sample) => total + Math.abs(sample), 0) / samples.length;
  const peak = samples.reduce(
    (max, sample) => Math.max(max, Math.abs(sample)),
    0
  );
  const level = Math.max(0, Math.min(100, Math.round(average * 900)));

  return {
    label: getVolumeLabel(waveformData),
    level,
    peak: Math.max(0, Math.min(100, Math.round(peak * 240))),
  };
}

function getPitchProfile(pitch, resonanceCentroid) {
  const presentation = analysisService.estimateVoicePresentation({
    pitch,
    resonanceCentroid,
  });
  const tone =
    presentation.label === "Feminine-coded"
      ? "text-emerald-700"
      : presentation.label === "Masculine-coded"
        ? "text-amber-700"
        : presentation.label === "Androgynous / mixed"
          ? "text-cyan-700"
          : "text-muted-foreground";

  return {
    ...presentation,
    tone,
  };
}

function getTargetStatus(pitch, targetRange) {
  if (!analysisService.isValidPitch(pitch)) {
    return "Waiting for pitch";
  }

  if (pitch < targetRange[0]) {
    return "Below target";
  }

  if (pitch > targetRange[1]) {
    return "Above target";
  }

  return "Inside target";
}

export default function ChallengeExerciseSession({
  challenge,
  exerciseIndex,
  user,
  onCompleted,
  onClose,
}) {
  const exercise = challenge.exercises[exerciseIndex];
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const stopInProgress = useRef(false);
  const targetRange = challengeSessionService.getTargetRange(
    user,
    challenge.profileGoalSnapshot
  );

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

  const safePitch = analysisService.isValidPitch(currentPitch) ? currentPitch : 0;
  const remainingSeconds = Math.max(0, exercise.durationSeconds - duration);
  const volumeStats = getVolumeStats(waveformData);
  const pitchProfile = getPitchProfile(currentPitch, resonanceCentroid);
  const targetStatus = getTargetStatus(currentPitch, targetRange);

  const finishRecording = async (autoStopped = false) => {
    if (stopInProgress.current) {
      return;
    }

    stopInProgress.current = true;
    setIsProcessing(true);

    try {
      const audioData = await stopRecording();
      const result = challengeSessionService.completeExercise({
        challenge,
        exerciseIndex,
        audioData,
        user,
      });

      if (!result.ok) {
        setLastResult(null);
        toast.error(result.error);
        return;
      }

      setLastResult(result.result);
      toast.success(
        `${exercise.title} completed. Score: ${result.result.score}/100${
          autoStopped ? " - timer complete" : ""
        }`
      );
      onCompleted(result.challenge, result.result);
    } finally {
      stopInProgress.current = false;
      setIsProcessing(false);
    }
  };

  const handleToggle = async () => {
    if (isProcessing) {
      return;
    }

    if (isRecording) {
      await finishRecording(false);
      return;
    }

    setLastResult(null);
    reset();
    const recorderState = await startRecording();
    if (recorderState?.error || error) {
      toast.error(recorderState?.error || error);
    }
  };

  useEffect(() => {
    if (!isRecording || duration < exercise.durationSeconds) {
      return;
    }

    finishRecording(true);
  }, [duration, exercise.durationSeconds, isRecording]);

  if (!exercise) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Active challenge step
            </p>
            <h2 className="mt-1 text-3xl font-black uppercase leading-none text-foreground">
              {exercise.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-6 text-muted-foreground">
              {exercise.instructions}
            </p>
          </div>

          <Button variant="outline" onClick={onClose} disabled={isRecording || isProcessing}>
            Back to list
          </Button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="bg-background p-4">
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Timer
            </p>
            <p className="mt-2 font-display text-5xl leading-none text-primary">
              {formatTime(remainingSeconds)}
            </p>
          </div>
          <div className="bg-background p-4">
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Example
            </p>
            <p className="mt-2 text-lg font-black leading-6 text-foreground">
              {exercise.examplePrompts[0]}
            </p>
          </div>
          <div className="bg-background p-4">
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Success
            </p>
            <p className="mt-2 text-sm font-bold leading-5 text-muted-foreground">
              {exercise.successCriteria}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-l-4 border-destructive bg-white px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-5 bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.05)]">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">
                Live recorder
              </p>
              <h3 className="mt-1 text-xl font-black uppercase text-foreground">
                {isRecording ? "Recording" : isProcessing ? "Processing" : "Ready"}
              </h3>
            </div>
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
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

          {exercise.requiresVolume && (
            <div className="space-y-4 bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-black uppercase text-foreground">
                    Volume feedback
                  </p>
                </div>
                <span className="font-mono text-xs font-bold uppercase text-muted-foreground">
                  {volumeStats.label}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="border border-border bg-white p-3">
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    Intensity
                  </p>
                  <p className="mt-2 font-display text-3xl leading-none text-foreground">
                    {volumeStats.level}
                  </p>
                </div>
                <div className="border border-border bg-white p-3">
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    Peak
                  </p>
                  <p className="mt-2 font-display text-3xl leading-none text-foreground">
                    {volumeStats.peak}
                  </p>
                </div>
                <div className="border border-border bg-white p-3">
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    Pitch read
                  </p>
                  <p className={`mt-2 text-sm font-black uppercase leading-5 ${pitchProfile.tone}`}>
                    {pitchProfile.label}
                  </p>
                </div>
                <div className="border border-border bg-white p-3">
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    Goal zone
                  </p>
                  <p className="mt-2 text-sm font-black uppercase leading-5 text-foreground">
                    {targetStatus}
                  </p>
                </div>
              </div>

              <p className="text-xs font-semibold leading-5 text-muted-foreground">
                {pitchProfile.detail} Resonance brightness:{" "}
                {Number.isFinite(resonanceCentroid) ? `${resonanceCentroid} Hz` : "waiting"}.
                Target from profile: {targetRange[0]}-{targetRange[1]} Hz.
              </p>
            </div>
          )}

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="font-mono text-[11px] uppercase text-muted-foreground">
                Pitch target
              </p>
              <span className="text-xs font-bold uppercase text-muted-foreground">
                Green zone {targetRange[0]}-{targetRange[1]} Hz
              </span>
            </div>
            {pitchData.length ? (
              <PitchChart data={pitchData} targetRange={targetRange} />
            ) : (
              <div className="flex h-48 items-center justify-center bg-background p-4 text-center text-sm font-medium text-muted-foreground">
                Start recording to see pitch movement against your profile goal.
              </div>
            )}
          </div>
        </div>

        <RecordingControls
          isRecording={isRecording}
          onToggle={handleToggle}
          onReset={() => {
            setLastResult(null);
            reset();
          }}
          duration={remainingSeconds}
          timeLabel="Remaining"
        />
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 bg-white px-4 py-3 text-sm font-bold text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Checking the recording and challenge result...
        </div>
      )}

      {lastResult && (
        <div className="grid gap-4 bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.05)] sm:grid-cols-3">
          <div>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Score
            </p>
            <p className="mt-2 font-display text-4xl leading-none">
              {lastResult.score}
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Duration
            </p>
            <p className="mt-2 text-lg font-black uppercase">
              {formatTime(lastResult.durationSeconds)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">
              Feedback
            </p>
            <p className="mt-2 text-sm font-semibold leading-5 text-muted-foreground">
              {lastResult.feedback}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
