// @ts-nocheck

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * @param {{
 *  isRecording: boolean,
 *  onToggle: () => void,
 *  onReset: () => void,
 *  duration: number
 * }} props
 */
export default function RecordingControls({
  isRecording,
  onToggle,
  onReset,
  duration
}) {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-6">

        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          className="w-12 h-12 rounded-full text-muted-foreground hover:text-foreground"
          disabled={isRecording}
        >
          <RotateCcw className="w-5 h-5" />
        </Button>

        {/* RECORD BUTTON */}
        <motion.button
          onClick={onToggle}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
            isRecording
              ? 'bg-destructive/20 glow-recording'
              : 'bg-primary/20 glow-purple hover:bg-primary/30'
          }`}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          {/* Outer ring */}
          <div
            className={`absolute inset-0 rounded-full border-2 ${
              isRecording
                ? 'border-destructive/50'
                : 'border-primary/50'
            }`}
          />

          {/* Pulsing */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-destructive/30"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </AnimatePresence>

          {/* INNER */}
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isRecording
                ? 'bg-destructive'
                : 'bg-gradient-to-br from-primary to-primary/80'
            }`}
          >
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div key="stop">
                  <Square className="w-5 h-5 text-white fill-white" />
                </motion.div>
              ) : (
                <motion.div key="record">
                  <Mic className="w-6 h-6 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>

        <div className="w-12 h-12" />
      </div>

      {/* TIMER */}
      <div className="flex items-center gap-2">
        {isRecording && (
          <motion.div
            className="w-2 h-2 rounded-full bg-destructive"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        <span
          className={`text-lg font-mono font-semibold tracking-wider ${
            isRecording
              ? 'text-foreground'
              : 'text-muted-foreground'
          }`}
        >
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}