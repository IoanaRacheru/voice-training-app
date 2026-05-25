// @ts-nocheck

import { analysisService } from "./analysisService.js";

const BAR_COUNT = 56;
const EMPTY_WAVEFORM = new Float32Array(BAR_COUNT);

function getUserMediaErrorMessage(error) {
  if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
    return "Microphone access was denied. Allow microphone access and try again.";
  }

  if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") {
    return "No microphone was found. Connect a microphone and try again.";
  }

  if (error?.name === "NotReadableError" || error?.name === "AbortError") {
    return "Microphone is unavailable or was interrupted.";
  }

  return "Could not start microphone recording.";
}

class RecordingService extends EventTarget {
  constructor() {
    super();
    this.state = {
      status: "idle",
      isRecording: false,
      duration: 0,
      currentPitch: null,
      currentVolume: 0,
      resonanceCentroid: null,
      voicePresentation: null,
      pitchData: [],
      waveformData: EMPTY_WAVEFORM,
      error: null,
    };
    this.audioData = null;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.mediaRecorder = null;
    this.chunks = [];
    this.animationFrame = null;
    this.timer = null;
    this.startTime = null;
    this.lastPitchTime = 0;
    this.pitches = [];
    this.stopPromise = null;
    this.startPromise = null;
    this.stopRequested = false;
    this.trackEndHandlers = new Map();
  }

  subscribe(listener) {
    const handler = () => listener(this.getState());
    this.addEventListener("statechange", handler);
    listener(this.getState());
    return () => this.removeEventListener("statechange", handler);
  }

  getState() {
    return {
      ...this.state,
      pitchData: [...this.state.pitchData],
      waveformData: new Float32Array(this.state.waveformData),
    };
  }

  emitState(nextState) {
    this.state = { ...this.state, ...nextState };
    this.dispatchEvent(new Event("statechange"));
  }

  async start() {
    if (this.startPromise) {
      return this.startPromise;
    }

    if (
      this.state.isRecording ||
      this.state.status === "recording" ||
      this.state.status === "stopping"
    ) {
      return this.getState();
    }

    this.startPromise = this.startInternal().finally(() => {
      this.startPromise = null;
    });

    return this.startPromise;
  }

  async startInternal() {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      const error = "Microphone recording is not supported in this browser.";
      this.emitState({ status: "error", isRecording: false, error });
      throw new Error(error);
    }

    this.cleanup();
    this.stopRequested = false;
    this.audioData = null;
    this.chunks = [];
    this.pitches = [];
    this.lastPitchTime = 0;
    this.emitState({
      status: "starting",
      isRecording: false,
      duration: 0,
      currentPitch: null,
      currentVolume: 0,
      resonanceCentroid: null,
      voicePresentation: null,
      pitchData: [],
      waveformData: EMPTY_WAVEFORM,
      error: null,
    });

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      if (this.stopRequested || this.state.status !== "starting") {
        this.cleanup();
        this.emitState({ status: "idle", isRecording: false });
        return this.getState();
      }

      this.attachTrackListeners();
      this.createAudioGraph();
      this.createMediaRecorder();
      if (!this.mediaRecorder) {
        throw new Error("Audio recording is not supported in this browser.");
      }

      this.startTime = Date.now();
      this.mediaRecorder?.start?.(250);
      this.emitState({ status: "recording", isRecording: true, error: null });
      this.startTimer();
      this.startAnalysisLoop();

      return this.getState();
    } catch (error) {
      const message = getUserMediaErrorMessage(error);
      this.cleanup();
      this.emitState({ status: "error", isRecording: false, error: message });
      throw new Error(message);
    }
  }

  async stop() {
    if (this.stopPromise) {
      return this.stopPromise;
    }

    if (this.state.status === "starting") {
      this.stopRequested = true;
      this.cleanup();
      this.emitState({ status: "idle", isRecording: false });
      return this.getAudioData();
    }

    if (!this.state.isRecording && this.state.status !== "starting") {
      this.cleanup();
      this.emitState({ status: "idle", isRecording: false });
      return this.getAudioData();
    }

    this.stopPromise = this.stopInternal().finally(() => {
      this.stopPromise = null;
    });

    return this.stopPromise;
  }

  async stopInternal(errorMessage = null) {
    this.emitState({
      status: "stopping",
      isRecording: false,
      error: errorMessage || this.state.error,
    });

    this.stopTimer();
    this.stopAnalysisLoop();

    const durationSeconds = this.startTime
      ? (Date.now() - this.startTime) / 1000
      : this.state.duration;

    const blob = await this.stopMediaRecorder();
    const audioData = {
      blob,
      durationSeconds,
      pitches: [...this.pitches],
      failedAnalysis: Boolean(errorMessage),
      analysisError: errorMessage,
    };

    this.audioData = audioData;
    this.cleanup();
    this.emitState({
      status: errorMessage ? "error" : "idle",
      isRecording: false,
      duration: Math.floor(durationSeconds),
      currentVolume: 0,
      waveformData: EMPTY_WAVEFORM,
      error: errorMessage,
    });

    return audioData;
  }

  getAudioData() {
    return this.audioData;
  }

  reset() {
    this.cleanup();
    this.audioData = null;
    this.chunks = [];
    this.pitches = [];
    this.stopRequested = false;
    this.emitState({
      status: "idle",
      isRecording: false,
      duration: 0,
      currentPitch: null,
      currentVolume: 0,
      resonanceCentroid: null,
      voicePresentation: null,
      pitchData: [],
      waveformData: EMPTY_WAVEFORM,
      error: null,
    });
  }

  createAudioGraph() {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextConstructor();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0.18;
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);
  }

  createMediaRecorder() {
    if (!window.MediaRecorder) {
      return;
    }

    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.addEventListener("dataavailable", (event) => {
      if (event.data?.size > 0) {
        this.chunks.push(event.data);
      }
    });
    this.mediaRecorder.addEventListener("error", () => {
      this.handleRecordingError("Recording stopped because of a microphone error.");
    });
  }

  attachTrackListeners() {
    this.stream.getTracks().forEach((track) => {
      const onEnded = () => {
        if (this.state.isRecording || this.state.status === "starting") {
          this.handleRecordingError("Microphone permission was revoked or the stream ended.");
        }
      };

      track.addEventListener?.("ended", onEnded);
      this.trackEndHandlers.set(track, onEnded);
    });
  }

  handleRecordingError(message) {
    if (this.state.status === "stopping" || this.state.status === "idle") {
      return;
    }

    this.stopInternal(message).catch(() => {
      this.cleanup();
      this.emitState({ status: "error", isRecording: false, error: message });
    });
  }

  startTimer() {
    this.stopTimer();
    this.timer = window.setInterval(() => {
      if (!this.startTime || !this.state.isRecording) {
        return;
      }

      this.emitState({
        duration: Math.floor((Date.now() - this.startTime) / 1000),
      });
    }, 250);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  startAnalysisLoop() {
    const timeBuffer = new Float32Array(this.analyser.fftSize);
    const frequencyBuffer = new Uint8Array(this.analyser.frequencyBinCount);
    const waveBuffer = new Float32Array(BAR_COUNT);

    const analyze = () => {
      if (!this.analyser || !this.state.isRecording) {
        return;
      }

      this.analyser.getFloatTimeDomainData(timeBuffer);
      this.analyser.getByteFrequencyData(frequencyBuffer);
      this.updateWaveform(timeBuffer, waveBuffer);
      this.updateSpectralFeatures(frequencyBuffer);
      this.updatePitch(timeBuffer);
      this.animationFrame = requestAnimationFrame(analyze);
    };

    analyze();
  }

  stopAnalysisLoop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  updateWaveform(timeBuffer, waveBuffer) {
    const step = Math.max(1, Math.floor(timeBuffer.length / BAR_COUNT));

    for (let i = 0; i < BAR_COUNT; i += 1) {
      let max = 0;

      for (let j = 0; j < step; j += 1) {
        max = Math.max(max, Math.abs(timeBuffer[i * step + j] || 0));
      }

      waveBuffer[i] = Number.isFinite(max) ? max : 0;
    }

    this.emitState({ waveformData: new Float32Array(waveBuffer) });
  }

  updateSpectralFeatures(frequencyBuffer) {
    if (!this.audioContext || !frequencyBuffer?.length) {
      return;
    }

    const nyquist = this.audioContext.sampleRate / 2;
    const binHz = nyquist / frequencyBuffer.length;
    let weightedFrequency = 0;
    let totalMagnitude = 0;
    let totalVolume = 0;

    for (let index = 0; index < frequencyBuffer.length; index += 1) {
      const frequency = index * binHz;
      const magnitude = frequencyBuffer[index] || 0;
      totalVolume += magnitude;

      if (frequency >= 80 && frequency <= 5000) {
        weightedFrequency += frequency * magnitude;
        totalMagnitude += magnitude;
      }
    }

    const currentVolume = Math.round(
      Math.max(0, Math.min(100, (totalVolume / frequencyBuffer.length / 255) * 100))
    );
    const resonanceCentroid =
      totalMagnitude > 0 ? Math.round(weightedFrequency / totalMagnitude) : null;
    const voicePresentation = analysisService.estimateVoicePresentation({
      pitch: this.state.currentPitch,
      resonanceCentroid,
    });

    this.emitState({
      currentVolume,
      resonanceCentroid,
      voicePresentation,
    });
  }

  updatePitch(timeBuffer) {
    const now = Date.now();
    if (now - this.lastPitchTime <= 100) {
      return;
    }

    this.lastPitchTime = now;
    const pitch = analysisService.detectPitch(timeBuffer, this.audioContext.sampleRate);
    if (!analysisService.isValidPitch(pitch)) {
      return;
    }

    this.pitches.push(pitch);
    const elapsed = Math.floor((now - this.startTime) / 1000);
    const voicePresentation = analysisService.estimateVoicePresentation({
      pitch,
      resonanceCentroid: this.state.resonanceCentroid,
    });
    this.emitState({
      currentPitch: pitch,
      voicePresentation,
      pitchData: [
        ...this.state.pitchData,
        { time: `${elapsed}s`, pitch },
      ].slice(-60),
    });
  }

  stopMediaRecorder() {
    if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
      return Promise.resolve(new Blob(this.chunks, { type: "audio/webm" }));
    }

    return new Promise((resolve) => {
      const recorder = this.mediaRecorder;
      const finish = () => {
        resolve(new Blob(this.chunks, { type: recorder.mimeType || "audio/webm" }));
      };

      recorder.addEventListener("stop", finish, { once: true });
      try {
        recorder.stop();
      } catch (_error) {
        finish();
      }
    });
  }

  cleanup() {
    this.stopTimer();
    this.stopAnalysisLoop();

    if (this.source) {
      this.source.disconnect();
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        const handler = this.trackEndHandlers.get(track);
        if (handler) {
          track.removeEventListener?.("ended", handler);
        }
        track.stop();
      });
    }

    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
    }

    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.mediaRecorder = null;
    this.startTime = null;
    this.trackEndHandlers.clear();
  }
}

export const recordingService = new RecordingService();
