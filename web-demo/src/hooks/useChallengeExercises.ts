import { useEffect, useMemo, useState } from "react";
import { challengeGeneratorService } from "@/services/challengeGeneratorService";
import { challengeService } from "@/services/challengeService";

type UserLike = Record<string, unknown> | null | undefined;

export function useChallengeExercises(count: number, user: UserLike) {
  const goal = challengeGeneratorService.normalizeGoal(user?.voice_goal || user?.target_voice_goal);
  const availableExercises = useMemo(() => challengeService.getAvailableExercises(), []);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>(() =>
    challengeService.getDefaultExerciseIds(count, goal)
  );

  useEffect(() => {
    setSelectedExerciseIds((current) =>
      challengeService.resolveSelectedExercises(current, count, goal)
    );
  }, [count, goal]);

  const toggleExercise = (exerciseId: string) => {
    setSelectedExerciseIds((current) => {
      if (current.includes(exerciseId)) {
        return current.filter((id) => id !== exerciseId);
      }

      if (current.length >= count) {
        return [...current.slice(1), exerciseId];
      }

      return [...current, exerciseId];
    });
  };

  return {
    availableExercises,
    selectedExerciseIds,
    selectedCount: selectedExerciseIds.length,
    toggleExercise,
    isReady: selectedExerciseIds.length === count,
  };
}
