import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { getSessions } from "@/api/authClient";
import { exerciseSessionService } from "@/services/exerciseSessionService";

type SessionLike = {
  date: string;
  average_pitch: number;
  score: number;
};

/**
 * Coordinates Progress page data fetching and chart projections.
 */
export function useProgressController() {
  const [sessions, setSessions] = useState<SessionLike[]>([]);
  const [exerciseSessions, setExerciseSessions] = useState(() =>
    exerciseSessionService.getSessions()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessions()
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const sync = () => setExerciseSessions(exerciseSessionService.getSessions());
    window.addEventListener("voiceExerciseSessions:changed", sync);
    return () => window.removeEventListener("voiceExerciseSessions:changed", sync);
  }, []);

  const chronological = useMemo(() => [...sessions].reverse(), [sessions]);
  const pitchData = useMemo(
    () =>
      chronological.map((s) => ({
        date: format(new Date(s.date), "MMM d"),
        pitch: s.average_pitch,
      })),
    [chronological]
  );
  const scoreData = useMemo(
    () =>
      chronological.map((s) => ({
        date: format(new Date(s.date), "MMM d"),
        score: s.score,
      })),
    [chronological]
  );

  return {
    sessions,
    exerciseSessions,
    loading,
    hasSessions: sessions.length > 0,
    pitchData,
    scoreData,
  };
}

