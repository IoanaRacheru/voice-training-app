import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { analysisService } from "@/services/analysisService";

type VoiceInputProps = { user: any; onUpdate?: (updates: any) => void };
const LOCAL_SAMPLE_KEY = "voiceInitialSample";

function readBlobAsDataUrl(blob: Blob): Promise<string | null> {
  if (!blob || typeof FileReader === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => resolve(typeof reader.result === "string" ? reader.result : null),
      { once: true }
    );
    reader.addEventListener("error", () => resolve(null), { once: true });
    reader.readAsDataURL(blob);
  });
}

function toInitialSampleFromUser(user: any) {
  const raw = user?.initial_voice_sample;
  if (!raw) return null;
  const persistedAudioUrl =
    raw.audioUrl || raw.audio_url || raw.audio_data_url || null;
  return {
    ...raw,
    audioUrl: persistedAudioUrl,
  };
}

function readLocalSample() {
  if (typeof localStorage === "undefined") return null;
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_SAMPLE_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (_error) {
    return null;
  }
}

function saveLocalSample(sample: any) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(LOCAL_SAMPLE_KEY, JSON.stringify(sample));
}

function clearLocalSample() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(LOCAL_SAMPLE_KEY);
}

export default function VoiceInput({ user, onUpdate }: VoiceInputProps) {
  const initialSample = toInitialSampleFromUser(user);
  const hydratedInitialSample = initialSample || readLocalSample();
  const [status, setStatus] = useState(hydratedInitialSample ? "uploaded" : "idle");
  const [sample, setSample] = useState<any>(hydratedInitialSample);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lastAveragePitch, setLastAveragePitch] = useState<number | null>(user?.initial_voice_sample?.average_pitch || null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(hydratedInitialSample?.audioUrl || null);
  const { isRecording, currentPitch, error, startRecording, stopRecording, getSessionStats } = useVoiceRecorder() as any;

  useEffect(() => () => {
    if (objectUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const saveSample = (nextSample: any) => {
    onUpdate?.({
      initial_voice_sample: { ...nextSample, saved_at: new Date().toISOString() },
    });
  };

  const replaceSample = (nextSample: any) => {
    if (
      objectUrlRef.current &&
      objectUrlRef.current !== nextSample.audioUrl &&
      objectUrlRef.current.startsWith("blob:")
    ) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = nextSample.audioUrl;
    setSample(nextSample);
    setStatus(nextSample.type === "recording" ? "recorded" : "uploaded");
    saveLocalSample(nextSample);
    saveSample(nextSample);
  };

  const handleRecordingToggle = async () => {
    if (isRecording) {
      const audioData = await stopRecording();
      const analysis = analysisService.process(audioData);
      const { averagePitch } = getSessionStats();
      setLastAveragePitch(averagePitch);
      setStatus(sample ? (sample.type === "upload" ? "uploaded" : "recorded") : "idle");
      if (!audioData?.blob || audioData.blob.size === 0) {
        toast.error("Recording is empty and was not saved");
        return;
      }
      const audioDataUrl = await readBlobAsDataUrl(audioData.blob);
      const audioUrl = audioDataUrl || URL.createObjectURL(audioData.blob);
      const recordingSample = {
        id: crypto.randomUUID(),
        type: "recording",
        name: "Initial voice recording",
        audioUrl,
        audio_data_url: audioUrl,
        mimeType: audioData.blob.type,
        size: audioData.blob.size,
        createdAt: new Date().toISOString(),
        average_pitch: analysis.ok ? analysis.averagePitch : null,
      };
      replaceSample(recordingSample);
      toast.success(recordingSample.average_pitch ? `Initial voice recording saved. Avg pitch: ${recordingSample.average_pitch}Hz` : "Initial voice recording saved");
      return;
    }

    try {
      setLastAveragePitch(null);
      const recorderState = await startRecording();
      if (!recorderState?.isRecording) {
        setStatus(sample ? (sample.type === "recording" ? "recorded" : "uploaded") : "idle");
        toast.error(recorderState?.error || "Microphone access is unavailable");
        return;
      }
      setStatus("recording");
    } catch {
      setStatus(sample ? (sample.type === "recording" ? "recorded" : "uploaded") : "idle");
      toast.error("Microphone access is unavailable");
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const audioDataUrl = await readBlobAsDataUrl(file);
    const audioUrl = audioDataUrl || URL.createObjectURL(file);
    const uploadedSample = {
      id: crypto.randomUUID(),
      type: "upload",
      name: file.name,
      audioUrl,
      audio_data_url: audioUrl,
      mimeType: file.type || "audio",
      size: file.size,
      createdAt: new Date().toISOString(),
    };
    setLastAveragePitch(null);
    replaceSample(uploadedSample);
    toast.success("Initial voice sample uploaded");
  };

  const handleDeleteSample = () => {
    if (objectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSample(null);
    setStatus("idle");
    setLastAveragePitch(null);
    clearLocalSample();
    setDeleteDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onUpdate?.({ initial_voice_sample: null });
    toast.success("Initial voice sample deleted");
  };

  const statusLabel = isRecording ? "Recording in progress" : status === "recorded" ? "Recording saved" : status === "uploaded" ? "Upload saved" : "No initial sample yet";

  return (
    <section className="bg-card p-6 shadow-[0_24px_70px_rgba(105,79,93,0.07)]">
      <div className="border-b border-border pb-5">
        <p className="font-mono text-[11px] uppercase text-muted-foreground">Initial voice sample</p>
        <h2 className="mt-2 text-2xl font-black uppercase text-foreground">Record or upload audio</h2>
      </div>

      <div className="grid gap-3 pt-6">
        <Button type="button" onClick={handleRecordingToggle} aria-label={isRecording ? "Stop recording" : "Record your voice"} variant={isRecording ? "destructive" : "default"} className="h-11 w-full rounded-[2px]">
          {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {isRecording ? "Stop recording" : "Record your voice"}
        </Button>

        <label className="flex h-11 w-full cursor-pointer items-center justify-center gap-3 border border-border bg-background px-3 text-sm font-bold uppercase text-foreground transition-colors hover:border-foreground">
          <Upload className="h-4 w-4 text-primary" />
          Upload sample
          <Input ref={fileInputRef} type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" className="sr-only" aria-label="Upload voice sample" onChange={handleUpload} disabled={isRecording} />
        </label>
      </div>

      <div className="mt-5 grid gap-3 border border-border bg-background p-4 sm:grid-cols-2">
        <div><p className="font-mono text-[11px] uppercase text-muted-foreground">Live pitch</p><p className="mt-1 font-display text-3xl uppercase leading-none text-foreground">{isRecording && currentPitch ? `${currentPitch} Hz` : "--"}</p></div>
        <div><p className="font-mono text-[11px] uppercase text-muted-foreground">Average pitch</p><p className="mt-1 font-display text-3xl uppercase leading-none text-foreground">{lastAveragePitch ? `${lastAveragePitch} Hz` : "--"}</p></div>
      </div>

      {error && <div className="mt-4 border-l-4 border-destructive bg-background px-4 py-3 text-sm font-bold text-destructive">{error}</div>}

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-sm font-bold text-foreground">{statusLabel}</p>
        {sample?.audioUrl ? (
          <div className="mt-4 border border-border bg-background p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="break-all text-sm font-black uppercase text-foreground">{sample.name}</p>
                <p className="mt-1 text-xs font-bold uppercase text-muted-foreground">{sample.type === "recording" ? "Recorded sample" : "Uploaded sample"}</p>
              </div>
              <Button type="button" variant="outline" size="icon" onClick={() => setDeleteDialogOpen(true)} aria-label="Delete initial voice sample" className="shrink-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <audio controls src={sample.audioUrl} className="mt-3 w-full" aria-label={`Play ${sample.name}`} />
          </div>
        ) : (
          <p className="mt-1 text-sm font-medium text-muted-foreground">Record or upload a sample to listen to it here.</p>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete voice sample?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the saved initial voice sample from this session. You can record or upload a new one afterward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSample} className="border-destructive bg-destructive text-destructive-foreground hover:bg-secondary">
              Delete sample
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
