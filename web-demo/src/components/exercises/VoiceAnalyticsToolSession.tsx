import { useEffect, useState } from "react";
import RecordingControls from "@/components/training/RecordingControls";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { analysisService } from "@/services/analysisService";
import SessionCoreGraphs from "./SessionCoreGraphs";
import ExerciseVisualAid from "./ExerciseVisualAid";
import type { VoiceAnalyticsTool } from "@/features/exercises/toolTypes";

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

type VoiceAnalyticsToolSessionProps = {
  tool: VoiceAnalyticsTool;
  targetRange?: number[];
  pitchTargetEnabled: boolean;
};

export default function VoiceAnalyticsToolSession({ tool, pitchTargetEnabled }: VoiceAnalyticsToolSessionProps) {
  const [takeCount, setTakeCount] = useState(0);
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
  const ToolChart = tool.Component;

  const handlePrimaryAction = async () => {
    if (isRecording) return pauseRecording();
    if (isPaused) return resumeRecording();
    reset();
    setTakeCount((count) => count + 1);
    await startRecording();
  };

  useEffect(() => {
    setTakeCount(0);
    reset();

    return () => {
      reset();
    };
  }, [tool.id, reset]);

  return (
    <div className="space-y-6">
      {error && <div className="border-l-4 border-destructive bg-white px-4 py-3 text-sm font-bold text-destructive">{error}</div>}

      <div className="grid gap-4 border border-border bg-white p-4 md:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">How to use it</p>
          <h3 className="mt-2 text-lg font-black uppercase text-foreground">{tool.name}</h3>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-muted-foreground">
            {tool.shortInstruction}
          </p>
        </div>
        <ExerciseVisualAid type={tool.visualAid} />
      </div>

      <div className="space-y-5">
        <SessionCoreGraphs
          pitchData={pitchData}
          currentPitch={safePitch}
          pitchTargetEnabled={pitchTargetEnabled}
          showPitchGraph={tool.requiresPitchGraph}
          showResonanceGraph={tool.requiresResonanceGraph}
          showGenderGraph={tool.requiresGenderGraph}
        />
      </div>
      <div className="h-24" />
      <div className="sticky bottom-0 z-20 -mx-1 border-t border-border bg-background/95 backdrop-blur md:-mx-2">
        <RecordingControls
          isRecording={isRecording}
          isPaused={isPaused}
          onPrimaryAction={handlePrimaryAction}
          onFinish={stopRecording}
          onReset={reset}
          duration={duration}
          timeLabel="Elapsed"
          showReset={tool.showReset}
          layout="bar"
        />
      </div>

      <div className="bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.05)]">
        <p className="mb-4 font-mono text-[11px] uppercase text-muted-foreground">Analytics output</p>
        <ToolChart />
      </div>

      <p className="text-sm font-medium text-muted-foreground">Take {takeCount || 1}: {formatTime(duration)}</p>
    </div>
  );
}
