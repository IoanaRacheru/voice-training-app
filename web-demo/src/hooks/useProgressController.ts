import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { exerciseSessionService } from "@/services/exerciseSessionService";
import { listAnalysisArtifacts } from "@/api/authClient";

/**
 * Coordinates Progress page data fetching and chart projections.
 */
export function useProgressController() {
  const [exerciseSessions, setExerciseSessions] = useState<any[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [artifactsApiAvailable, setArtifactsApiAvailable] = useState(true);
  const [backendStatus, setBackendStatus] = useState(
    exerciseSessionService.getBackendStatus()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      const sessions = await exerciseSessionService.getSessions();
      if (alive) {
        setExerciseSessions(Array.isArray(sessions) ? sessions : []);
        setBackendStatus(exerciseSessionService.getBackendStatus());
      }
    };
    const loadArtifacts = async () => {
      try {
        const payload = await listAnalysisArtifacts({ limit: 20, offset: 0 });
        if (alive) {
          setArtifacts(Array.isArray(payload?.items) ? payload.items : []);
          setArtifactsApiAvailable(true);
        }
      } catch (_error) {
        if (alive) {
          setArtifacts([]);
          setArtifactsApiAvailable(false);
        }
      }
    };
    const load = async () => {
      setLoading(true);
      await Promise.all([sync(), loadArtifacts()]);
      if (alive) setLoading(false);
    };
    load();
    window.addEventListener("voiceExerciseSessions:changed", sync);
    return () => {
      alive = false;
      window.removeEventListener("voiceExerciseSessions:changed", sync);
    };
  }, []);

  const chronological = useMemo(() => [...exerciseSessions], [exerciseSessions]);
  const pitchData = useMemo(
    () =>
      chronological.filter((s: any) => Number.isFinite(Number(s.average_pitch))).map((s: any) => ({
        date: format(new Date(s.date), "MMM d"),
        pitch: Number(s.average_pitch),
      })),
    [chronological]
  );
  const scoreData = useMemo(
    () =>
      chronological.map((s: any) => ({
        date: format(new Date(s.date), "MMM d"),
        score: Number(s.score) || 0,
      })),
    [chronological]
  );

  return {
    sessions: exerciseSessions,
    exerciseSessions,
    loading,
    hasSessions: exerciseSessions.length > 0,
    pitchData,
    scoreData,
    artifacts,
    backendStatus,
    artifactsApiAvailable,
  };
}
