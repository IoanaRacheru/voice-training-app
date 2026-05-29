import { AnimatePresence, motion } from "framer-motion";
import { Mic, Pause, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

type RecordingControlsProps = {
  isRecording: boolean;
  isPaused?: boolean;
  onPrimaryAction: () => void | Promise<void>;
  onFinish?: () => void | Promise<void>;
  onReset: () => void;
  duration: number;
  timeLabel?: string;
  timerCompleted?: boolean;
  showReset?: boolean;
  layout?: "panel" | "bar";
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

export default function RecordingControls({
  isRecording,
  isPaused = false,
  onPrimaryAction,
  onFinish,
  onReset,
  duration,
  timeLabel = "Elapsed",
  timerCompleted = false,
  showReset = true,
  layout = "panel",
}: RecordingControlsProps) {
  const isBar = layout === "bar";

  if (isBar) {
    return (
      <div className="bg-primary px-3 py-3 text-primary-foreground md:px-5">
        <div className="grid grid-cols-2 items-center gap-3">
          <div className="flex items-center gap-2">
            {showReset && (
              <Button
                variant="outline"
                onClick={onReset}
                disabled={isRecording}
                className="h-10 border-primary-foreground/45 bg-transparent px-3 text-xs font-bold uppercase text-primary-foreground hover:bg-background hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            )}
            {onFinish && (
              <Button
                variant="outline"
                onClick={onFinish}
                className="h-10 border-primary-foreground/45 bg-card px-3 text-xs font-bold uppercase text-foreground hover:bg-background/85"
              >
                <Square className="h-4 w-4" />
                Save
              </Button>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <motion.button
              type="button"
              onClick={onPrimaryAction}
              className={`grid h-12 w-12 place-items-center border border-primary-foreground/60 ${isRecording ? "bg-secondary text-foreground" : "bg-card text-foreground"}`}
              whileTap={{ scale: 0.97 }}
              aria-label={isRecording ? "Pause recording" : isPaused ? "Resume recording" : "Start recording"}
            >
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.span key="pause" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="grid place-items-center">
                    <Pause className="h-5 w-5 fill-current" />
                  </motion.span>
                ) : isPaused ? (
                  <motion.span key="resume" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="grid place-items-center">
                    <Play className="h-5 w-5 fill-current" />
                  </motion.span>
                ) : (
                  <motion.span key="record" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="grid place-items-center">
                    <Mic className="h-5 w-5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <div className="flex items-center gap-2 font-mono text-xs uppercase text-primary-foreground/80">
              <span>Timer</span>
              <span className="text-sm font-black text-primary-foreground">{formatTime(duration)}</span>
              <span className={`h-2 w-2 ${isRecording ? "animate-pulse-glow bg-secondary" : "bg-card/55"}`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        "flex min-h-[300px] flex-col justify-between bg-card p-5 text-foreground"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Recorder</p>
          <p className="mt-1 text-2xl font-black uppercase leading-none">
            {isRecording ? "Recording" : isPaused ? "Paused" : "Ready"}
          </p>
        </div>
        <span className={`h-2.5 w-2.5 ${isRecording ? "animate-pulse-glow bg-primary" : "bg-muted"}`} />
      </div>

      <motion.button
        type="button"
        onClick={onPrimaryAction}
        className={`mx-auto grid h-32 w-32 place-items-center border border-border ${isRecording ? "bg-primary text-primary-foreground" : "bg-background text-foreground"}`}
        whileTap={{ scale: 0.97 }}
        aria-label={isRecording ? "Pause recording" : isPaused ? "Resume recording" : "Start recording"}
      >
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.span key="pause" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="grid place-items-center">
              <Pause className="h-12 w-12 fill-current" />
            </motion.span>
          ) : isPaused ? (
            <motion.span key="resume" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="grid place-items-center">
              <Play className="h-12 w-12 fill-current" />
            </motion.span>
          ) : (
            <motion.span key="record" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="grid place-items-center">
              <Mic className="h-12 w-12" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="grid gap-2">
        <div className="flex items-center justify-between border-t border-border pt-3 font-mono text-xs uppercase text-muted-foreground">
          <span>{timeLabel}</span>
          <span className="text-foreground">{formatTime(duration)}</span>
        </div>
        {timerCompleted && <p className="text-[10px] font-bold uppercase text-primary">Selected time reached. Keep recording or finish.</p>}
        <div className="grid gap-2">
        {showReset && (
          <Button variant="outline" onClick={onReset} disabled={isRecording} className="w-full border-border bg-transparent text-foreground hover:bg-background hover:text-foreground">
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}
        {onFinish && (
          <Button variant="outline" onClick={onFinish} className="w-full border-border bg-background text-foreground hover:bg-muted">
            <Square className="h-4 w-4" />
            Finish and save
          </Button>
        )}
        </div>
      </div>
    </div>
  );
}
