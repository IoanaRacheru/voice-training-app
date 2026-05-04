// @ts-nocheck

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RecordingControls({
  isRecording,
  onToggle,
  onReset,
  duration,
}) {
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${secs}`;
  };

  return (
    <div className="flex min-h-[300px] flex-col justify-between bg-foreground p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase text-white/55">
            Recorder
          </p>
          <p className="mt-1 text-2xl font-black uppercase leading-none">
            {isRecording ? "Recording" : "Ready"}
          </p>
        </div>
        <span className={`h-2.5 w-2.5 ${isRecording ? "animate-pulse-glow bg-primary" : "bg-white/35"}`} />
      </div>

      <motion.button
        type="button"
        onClick={onToggle}
        className={`mx-auto grid h-32 w-32 place-items-center border border-white ${
          isRecording ? "bg-primary text-white" : "bg-white text-foreground"
        }`}
        whileTap={{ scale: 0.97 }}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.span
              key="stop"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="grid place-items-center"
            >
              <Square className="h-10 w-10 fill-current" />
            </motion.span>
          ) : (
            <motion.span
              key="record"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="grid place-items-center"
            >
              <Mic className="h-12 w-12" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <div className="grid gap-3">
        <div className="flex items-center justify-between border-t border-white/20 pt-3 font-mono text-xs uppercase text-white/65">
          <span>Elapsed</span>
          <span className="text-white">{formatTime(duration)}</span>
        </div>

        <Button
          variant="outline"
          onClick={onReset}
          disabled={isRecording}
          className="w-full border-white/35 bg-transparent text-white hover:bg-white hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}
