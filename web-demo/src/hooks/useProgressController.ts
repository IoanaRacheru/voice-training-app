import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { exerciseSessionService } from "@/services/exerciseSessionService";

/**
 * Coordinates Progress page data fetching and chart projections.
 */
export function useProgressController() {
  const [exerciseSessions, setExerciseSessions] = useState(() =>
    exerciseSessionService.getSessions()
  );
  const [loading] = useState(false);

  useEffect(() => {
    const sync = () => setExerciseSessions(exerciseSessionService.getSessions());
    window.addEventListener("voiceExerciseSessions:changed", sync);
    return () => window.removeEventListener("voiceExerciseSessions:changed", sync);
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
  };
}
