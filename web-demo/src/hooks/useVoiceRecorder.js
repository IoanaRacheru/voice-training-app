// @ts-nocheck

import { useState, useEffect, useRef, useCallback } from 'react';

// Autocorrelation-based pitch detection
function detectPitch(buffer, sampleRate) {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null; // too quiet

  let lastCorrelation = 1;
  for (let offset = 1; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;
    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / MAX_SAMPLES;

    if (correlation > 0.9 && correlation > lastCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
    lastCorrelation = correlation;
  }

  if (bestCorrelation > 0.01 && bestOffset > 0) {
    // Interpolate for better accuracy
    const val = sampleRate / bestOffset;
    if (val > 50 && val < 600) return Math.round(val);
  }
  return null;
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentPitch, setCurrentPitch] = useState(null);
  const [pitchData, setPitchData] = useState([]);
  const [waveformData, setWaveformData] = useState(new Float32Array(48));
  const [error, setError] = useState(null);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pitchBufferRef = useRef([]);

  const stopRecording = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setPitchData([]);
    setDuration(0);
    pitchBufferRef.current = [];

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
      setError('Microphone access denied. Please allow microphone access and try again.');
      return;
    }

    streamRef.current = stream;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    analyserRef.current = analyser;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    setIsRecording(true);
    startTimeRef.current = Date.now();

    // Timer
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);

    // Analysis loop
    const timeBuffer = new Float32Array(analyser.fftSize);
    const waveBuffer = new Float32Array(48);

    let lastPitchTime = 0;

    const analyze = () => {
      analyser.getFloatTimeDomainData(timeBuffer);

      // Waveform for visualizer (downsample to 48 bars)
      const step = Math.floor(timeBuffer.length / 48);
      for (let i = 0; i < 48; i++) {
        let max = 0;
        for (let j = 0; j < step; j++) {
          max = Math.max(max, Math.abs(timeBuffer[i * step + j] || 0));
        }
        waveBuffer[i] = max;
      }
      setWaveformData(new Float32Array(waveBuffer));

      // Pitch detection at ~10Hz
      const now = Date.now();
      if (now - lastPitchTime > 100) {
        lastPitchTime = now;
        const pitch = detectPitch(timeBuffer, ctx.sampleRate);
        if (pitch !== null) {
          setCurrentPitch(pitch);
          pitchBufferRef.current.push(pitch);
          const elapsed = Math.floor((now - startTimeRef.current) / 1000);
          setPitchData(prev => {
            const next = [...prev, { time: `${elapsed}s`, pitch }];
            return next.slice(-60);
          });
        }
      }

      animFrameRef.current = requestAnimationFrame(analyze);
    };

    analyze();
  }, []);

  const reset = useCallback(() => {
    stopRecording();
    setPitchData([]);
    setDuration(0);
    setCurrentPitch(null);
    setWaveformData(new Float32Array(48));
    pitchBufferRef.current = [];
  }, [stopRecording]);

  // Cleanup on unmount
  useEffect(() => () => stopRecording(), [stopRecording]);

  // Compute average pitch and score from recorded session
  const getSessionStats = useCallback(() => {
    const pitches = pitchBufferRef.current.filter(p => p > 50 && p < 600);
    if (pitches.length === 0) return { averagePitch: null, score: null };
    const avg = Math.round(pitches.reduce((a, b) => a + b, 0) / pitches.length);
    return { averagePitch: avg };
  }, []);

  return {
    isRecording,
    duration,
    currentPitch,
    pitchData,
    waveformData,
    error,
    startRecording,
    stopRecording,
    reset,
    getSessionStats,
  };
}
