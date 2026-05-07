// @ts-nocheck

import React, { useState } from "react";
import { Mic, Square, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

export default function VoiceInput({ user, onUpdate }) {
  const [status, setStatus] = useState(user?.initial_voice_sample ? "uploaded" : "idle");
  const [fileName, setFileName] = useState(user?.initial_voice_sample?.name || "");
  const [lastAveragePitch, setLastAveragePitch] = useState(
    user?.initial_voice_sample?.average_pitch || null
  );
  const {
    isRecording,
    currentPitch,
    error,
    startRecording,
    stopRecording,
    getSessionStats,
  } = useVoiceRecorder();

  const saveSample = (sample) => {
    onUpdate?.({
      ...user,
      initial_voice_sample: {
        ...sample,
        saved_at: new Date().toISOString(),
      },
    });
  };

  const handleRecordingToggle = async () => {
    if (isRecording) {
      const { averagePitch } = getSessionStats();
      stopRecording();

      const recordingName = "Initial voice recording";
      setStatus("recorded");
      setFileName(recordingName);
      setLastAveragePitch(averagePitch);
      saveSample({
        name: recordingName,
        type: "audio/webm",
        source: "recording",
        average_pitch: averagePitch,
      });
      toast.success(
        averagePitch
          ? `Initial voice recording saved. Avg pitch: ${averagePitch}Hz`
          : "Initial voice recording saved"
      );
      return;
    }

    setStatus("recording");
    setLastAveragePitch(null);
    await startRecording();
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("uploaded");
    setFileName(file.name);
    setLastAveragePitch(null);
    saveSample({
      name: file.name,
      type: file.type || "audio",
      size: file.size,
      source: "upload",
    });
    toast.success("Initial voice sample uploaded");
  };

  const statusLabel =
    isRecording
      ? "Recording in progress"
      : status === "recorded"
        ? "Recording saved"
        : status === "uploaded"
          ? "Upload saved"
          : "No initial sample yet";

  return (
    <section className="bg-white p-6 shadow-[0_24px_70px_rgba(17,17,17,0.07)]">
      <div className="border-b border-border pb-5">
        <p className="font-mono text-[11px] uppercase text-muted-foreground">
          Initial voice sample
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase text-foreground">
          Record or upload audio
        </h2>
      </div>

      <div className="grid gap-4 pt-6 md:grid-cols-[220px_1fr]">
        <Button
          type="button"
          onClick={handleRecordingToggle}
          aria-label={isRecording ? "Stop recording" : "Record your voice"}
          variant={isRecording ? "destructive" : "default"}
          className="h-11 rounded-[2px]"
        >
          {isRecording ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {isRecording ? "Stop recording" : "Record your voice"}
        </Button>

        <label className="flex h-11 cursor-pointer items-center gap-3 border border-border bg-background px-3 text-sm font-bold text-foreground transition-colors hover:border-foreground">
          <Upload className="h-4 w-4 text-primary" />
          Upload sample
          <Input
            type="file"
            accept=".mp3,.wav,audio/mpeg,audio/wav"
            className="sr-only"
            aria-label="Upload voice sample"
            onChange={handleUpload}
          />
        </label>
      </div>

      <div className="mt-5 grid gap-3 border border-border bg-background p-4 sm:grid-cols-2">
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">
            Live pitch
          </p>
          <p className="mt-1 font-display text-3xl uppercase leading-none text-foreground">
            {isRecording && currentPitch ? `${currentPitch} Hz` : "--"}
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">
            Average pitch
          </p>
          <p className="mt-1 font-display text-3xl uppercase leading-none text-foreground">
            {lastAveragePitch ? `${lastAveragePitch} Hz` : "--"}
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 border-l-4 border-destructive bg-background px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </div>
      )}

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-sm font-bold text-foreground">{statusLabel}</p>
        {fileName && (
          <p className="mt-1 break-all text-sm font-medium text-muted-foreground">
            {fileName}
          </p>
        )}
      </div>
    </section>
  );
}
