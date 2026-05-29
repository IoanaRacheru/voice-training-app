import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import RecordingControls from "@/components/training/RecordingControls";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { analysisService } from "@/services/analysisService";
import { exerciseSessionService } from "@/services/exerciseSessionService";
import SessionCoreGraphs from "./SessionCoreGraphs";
import ReadingPassageCard from "./ReadingPassageCard";
import { getExerciseSessionConfig } from "./exerciseSessionConfig";
import type { VoiceExercise } from "@/features/exercises/types";

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

type ExerciseTrainingSessionProps = {
  exercise: VoiceExercise;
  targetRange?: number[];
  pitchTargetEnabled: boolean;
  onSessionSaved?: (session: any) => void;
};

export default function ExerciseTrainingSession({
  exercise,
  targetRange,
  pitchTargetEnabled,
  onSessionSaved,
}: ExerciseTrainingSessionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const stopInProgress = useRef(false);
  const sessionConfig = getExerciseSessionConfig(exercise);

  const {
    isRecording,
    isPaused,
    duration,
    currentPitch,
    pitchData,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    reset,
  } = useVoiceRecorder() as any;

  const safePitch = analysisService.isValidPitch(currentPitch) ? currentPitch : 0;
  const targetPitch =
    targetRange?.length === 2 ? Math.round((targetRange[0] + targetRange[1]) / 2) : null;

  const processRecording = async () => {
    if (stopInProgress.current) return;
    stopInProgress.current = true;
    setIsProcessing(true);

    try {
      const audioData = await stopRecording();
      const analysis = analysisService.process(audioData);
      const saveResult = await exerciseSessionService.createSession({
        exercise,
        audioData,
        analysis,
        selectedDurationSeconds: duration,
        targetPitch,
        targetRange,
        recorderState: {
          pitchData,
          currentPitch: safePitch,
        },
      });

      if (!saveResult.ok) {
        setResult(null);
        toast.error(saveResult.error);
        return;
      }

      setResult(saveResult.session);
      onSessionSaved?.(saveResult.session);
      toast.success(`${exercise.name} saved. Score: ${saveResult.session.score}/100`);
    } finally {
      setIsProcessing(false);
      stopInProgress.current = false;
    }
  };

  const handlePrimaryAction = async () => {
    if (isProcessing) return;
    if (isRecording) return pauseRecording();
    if (isPaused) return resumeRecording();

    setResult(null);
    reset();
    const recorderState = await startRecording();
    if (recorderState?.error || error) {
      toast.error(recorderState?.error || error);
    }
  };

  useEffect(() => {
    setResult(null);
    reset();

    return () => {
      reset();
    };
  }, [exercise.id, reset]);

  const showPitchGraph = sessionConfig.graphTypes.includes("pitch");
  const showResonanceGraph = sessionConfig.graphTypes.includes("resonance");
  const showGenderGraph = sessionConfig.graphTypes.includes("gender");

  return (
    <div className="space-y-6">
      {error && <div className="border-l-4 border-destructive bg-card px-4 py-3 text-sm font-bold text-destructive">{error}</div>}

      <div className="border border-border bg-card p-4">
        <p className="font-mono text-[11px] uppercase text-muted-foreground">How to do it</p>
        <h3 className="mt-2 text-lg font-black uppercase text-foreground">{exercise.name}</h3>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-muted-foreground">
          {sessionConfig.shortInstruction}
        </p>
      </div>
      <ReadingPassageCard
        title={exercise.readingPassageTitle}
        lines={exercise.readingPassageLines}
      />

      <div className="space-y-5">
        {(showPitchGraph || showResonanceGraph || showGenderGraph) && (
          <SessionCoreGraphs
            pitchData={pitchData}
            currentPitch={safePitch}
            pitchTargetEnabled={pitchTargetEnabled}
            showPitchGraph={showPitchGraph}
            showResonanceGraph={showResonanceGraph}
            showGenderGraph={showGenderGraph}
          />
        )}
      </div>
      {sessionConfig.requiresRecorder && (
        <>
          <div className="h-24" />
          <div className="sticky bottom-0 z-20 -mx-1 border-t border-border bg-background/95 backdrop-blur md:-mx-2">
            <RecordingControls
              isRecording={isRecording}
              isPaused={isPaused}
              onPrimaryAction={handlePrimaryAction}
              onFinish={processRecording}
              onReset={() => {
                setResult(null);
                reset();
              }}
              duration={duration}
              timeLabel="Elapsed"
              showReset={sessionConfig.showReset}
              layout="bar"
            />
          </div>
        </>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 bg-card px-4 py-3 text-sm font-bold text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Processing audio and saving valid results...
        </div>
      )}

      {result && (
        <div className="space-y-4 bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">Result</p>
              <p className="mt-2 font-display text-4xl leading-none">{result.score}</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">Duration</p>
              <p className="mt-2 text-lg font-black uppercase">{formatTime(result.duration_seconds)}</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">Status</p>
              <p className="mt-2 text-lg font-black uppercase">{result.completed ? "Completed" : "Stopped early"}</p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase text-muted-foreground">Feedback</p>
              <p className="mt-2 text-sm font-semibold leading-5 text-muted-foreground">{result.feedback}</p>
            </div>
          </div>
          {result.backend_analysis && (
            <div className="border border-border bg-background p-3">
              <p className="font-mono text-[11px] uppercase text-muted-foreground">Backend Coach</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {result.backend_analysis.summary || "Analysis completed."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {result.backend_analysis.practice_next || "Keep practicing with short daily repetitions."}
              </p>
              {result.backend_analysis.pronunciation?.score != null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Pronunciation score: {Math.round(result.backend_analysis.pronunciation.score)}
                </p>
              )}
            </div>
          )}
          {!result.backend_analysis && (
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Backend coach feedback unavailable for this session.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
