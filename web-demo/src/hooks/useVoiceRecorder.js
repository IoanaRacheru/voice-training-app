import { useCallback, useEffect, useState } from "react";
import { analysisService } from "@/services/analysisService";
import { recordingService } from "@/services/recordingService";

export function useVoiceRecorder() {
  const [recorderState, setRecorderState] = useState(recordingService.getState());

  useEffect(() => recordingService.subscribe(setRecorderState), []);

  useEffect(() => {
    return () => {
      recordingService.stop();
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      await recordingService.start();
    } catch (_error) {
      return null;
    }

    return recordingService.getState();
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      return await recordingService.stop();
    } catch (_error) {
      return recordingService.getAudioData();
    }
  }, []);

  const pauseRecording = useCallback(() => {
    return recordingService.pause();
  }, []);

  const resumeRecording = useCallback(() => {
    return recordingService.resume();
  }, []);

  const reset = useCallback(() => {
    recordingService.reset();
  }, []);

  const getSessionStats = useCallback(() => {
    const result = analysisService.process(recordingService.getAudioData());
    return {
      averagePitch: result.ok ? result.averagePitch : null,
      error: result.error,
    };
  }, []);

  return {
    ...recorderState,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    reset,
    getSessionStats,
    getAudioData: recordingService.getAudioData.bind(recordingService),
  };
}
