import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import RecordingControls from "@/components/training/RecordingControls";
import SessionCoreGraphs from "@/components/exercises/SessionCoreGraphs";
import { getExerciseSessionConfig } from "@/components/exercises/exerciseSessionConfig";
import { exercises } from "@/data/exercises";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { analysisService } from "@/services/analysisService";
import { challengeSessionService } from "@/services/challengeSessionService";

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

type ChallengeExerciseSessionProps = {
  challenge: any;
  exerciseIndex: number;
  user: any;
  onCompleted: (challenge: any, result?: any) => void;
  onClose: () => void;
};

export default function ChallengeExerciseSession({
  challenge,
  exerciseIndex,
  user,
  onCompleted,
}: ChallengeExerciseSessionProps) {
  const exercise = challenge.exercises[exerciseIndex];
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const stopInProgress = useRef(false);
  const targetRange = challengeSessionService.getTargetRange(user, challenge.profileGoalSnapshot);
  const sourceExercise = exercises.find((item) => item.id === exercise.id);
  const exerciseGraphConfig = sourceExercise ? getExerciseSessionConfig(sourceExercise as any) : null;
  const graphTypes = exerciseGraphConfig?.graphTypes || (exercise.requiresPitch ? ["pitch"] : []);
  const showPitchGraph = graphTypes.includes("pitch");
  const showResonanceGraph = graphTypes.includes("resonance");
  const showGenderGraph = graphTypes.includes("gender");
  const hasExerciseGraph = showPitchGraph || showResonanceGraph || showGenderGraph;

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
  const remainingSeconds = Math.max(0, exercise.durationSeconds - duration);
  const description = exerciseGraphConfig?.shortInstruction || exercise.instructions;

  const finishRecording = async (autoStopped = false) => {
    if (stopInProgress.current) return;
    stopInProgress.current = true;
    setIsProcessing(true);
    try {
      const audioData = await stopRecording();
      const result = challengeSessionService.completeExercise({ challenge, exerciseIndex, audioData, user });
      if (!result.ok) {
        setLastResult(null);
        toast.error(result.error);
        return;
      }
      setLastResult(result.result);
      toast.success(`${exercise.title} completed. Score: ${result.result.score}/100${autoStopped ? " - timer complete" : ""}`);
      onCompleted(result.challenge, result.result);
    } finally {
      stopInProgress.current = false;
      setIsProcessing(false);
    }
  };

  const handlePrimaryAction = async () => {
    if (isProcessing) return;
    if (isRecording) return pauseRecording();
    if (isPaused) return resumeRecording();
    setLastResult(null);
    reset();
    const recorderState = await startRecording();
    if (recorderState?.error || error) toast.error(recorderState?.error || error);
  };

  useEffect(() => {
    if (!isRecording || duration < exercise.durationSeconds) return;
    finishRecording(true);
  }, [duration, exercise.durationSeconds, isRecording]);

  if (!exercise) return null;

  return (
    <section className="space-y-5">
      <div className="border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">How to do it</p>
            <h2 className="mt-2 text-lg font-black uppercase text-foreground">{exercise.title}</h2>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      {error && <div className="border-l-4 border-destructive bg-card px-4 py-3 text-sm font-bold text-destructive">{error}</div>}

      {hasExerciseGraph && (
        <SessionCoreGraphs
          pitchData={pitchData}
          currentPitch={safePitch}
          pitchTargetEnabled={Array.isArray(targetRange)}
          showPitchGraph={showPitchGraph}
          showResonanceGraph={showResonanceGraph}
          showGenderGraph={showGenderGraph}
        />
      )}

      {!hasExerciseGraph && (
        <div className="flex h-40 items-center justify-center bg-card p-4 text-center text-sm font-medium text-muted-foreground shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
          This exercise uses the recorder and timer without a live chart.
        </div>
      )}

      <div className="h-28" />
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur md:left-64">
        <RecordingControls
          isRecording={isRecording}
          isPaused={isPaused}
          onPrimaryAction={handlePrimaryAction}
          onFinish={() => finishRecording(false)}
          onReset={() => {
            setLastResult(null);
            reset();
          }}
          duration={remainingSeconds}
          timeLabel="Remaining"
          layout="bar"
        />
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 bg-card px-4 py-3 text-sm font-bold text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Checking the recording and challenge result...
        </div>
      )}

      {lastResult && (
        <div className="grid gap-4 bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.05)] sm:grid-cols-3">
          <div><p className="font-mono text-[11px] uppercase text-muted-foreground">Score</p><p className="mt-2 font-display text-4xl leading-none">{lastResult.score}</p></div>
          <div><p className="font-mono text-[11px] uppercase text-muted-foreground">Duration</p><p className="mt-2 text-lg font-black uppercase">{formatTime(lastResult.durationSeconds)}</p></div>
          <div><p className="font-mono text-[11px] uppercase text-muted-foreground">Feedback</p><p className="mt-2 text-sm font-semibold leading-5 text-muted-foreground">{lastResult.feedback}</p></div>
        </div>
      )}
    </section>
  );
}
