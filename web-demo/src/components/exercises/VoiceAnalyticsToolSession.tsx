import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import RecordingControls from "@/components/training/RecordingControls";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { analysisService } from "@/services/analysisService";
import { exerciseSessionService } from "@/services/exerciseSessionService";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const stopInProgress = useRef(false);
  const {
    isRecording,
    isPaused,
    duration,
    currentPitch,
    pitchData,
    analyticsData,
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

  const processRecording = async () => {
    if (stopInProgress.current) return;
    stopInProgress.current = true;
    setIsProcessing(true);

    try {
      const audioData = await stopRecording();
      const analysis = analysisService.process(audioData);
      const saveResult = await exerciseSessionService.createToolSession({
        tool,
        audioData,
        analysis,
        selectedDurationSeconds: duration,
        recorderState: {
          currentPitch: safePitch,
          pitchData,
          analyticsData,
        },
        toolChartData: analyticsData,
      });

      if (!saveResult.ok) {
        setResult(null);
        toast.error(saveResult.error);
        return;
      }

      setResult(saveResult.session);
      toast.success(`${tool.name} analytics saved. Score: ${saveResult.session.score}/100`);
    } finally {
      setIsProcessing(false);
      stopInProgress.current = false;
    }
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
      {error && <div className="border-l-4 border-destructive bg-card px-4 py-3 text-sm font-bold text-destructive">{error}</div>}

      <div className="border border-border bg-card p-4">
        <p className="font-mono text-[11px] uppercase text-muted-foreground">How to use it</p>
        <h3 className="mt-2 text-lg font-black uppercase text-foreground">{tool.name}</h3>
        <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-muted-foreground">
          {tool.shortInstruction}
        </p>
      </div>

      <div className="bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
        <p className="mb-4 font-mono text-[11px] uppercase text-muted-foreground">Live analytics output</p>
        <ToolChart data={analyticsData} pitchData={pitchData} currentPitch={safePitch} isRecording={isRecording} />
      </div>

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
          showReset={tool.showReset}
          layout="bar"
        />
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2 bg-card px-4 py-3 text-sm font-bold text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Processing analytics and saving valid results...
        </div>
      )}

      {result && (
        <div className="bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Saved session</p>
          <p className="mt-2 text-lg font-black uppercase text-foreground">{result.score}/100</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">{result.feedback}</p>
        </div>
      )}

      <p className="text-sm font-medium text-muted-foreground">Take {takeCount || 1}: {formatTime(duration)}</p>
    </div>
  );
}
