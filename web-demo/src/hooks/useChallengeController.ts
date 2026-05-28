import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { challengeGeneratorService } from "@/services/challengeGeneratorService";
import { challengeSessionService } from "@/services/challengeSessionService";
import { challengeStreakService } from "@/services/challengeStreakService";

type UnknownUser = Record<string, unknown> | null | undefined;

/**
 * Encapsulates Challenge page orchestration (state, synchronization, actions).
 * Keeps page components focused on rendering.
 */
export function useChallengeController(user: UnknownUser) {
  const [challenge, setChallenge] = useState(() =>
    challengeSessionService.getTodayChallenge(user)
  );
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);
  const [streak, setStreak] = useState(() => challengeStreakService.getState());

  const profileSnapshot = challenge?.profileGoalSnapshot;
  const currentProfileGoal = challengeGeneratorService.normalizeGoal(
    user?.voice_goal || user?.target_voice_goal
  );
  const wasGeneratedFromDifferentGoal = Boolean(
    challenge &&
      profileSnapshot?.goal &&
      currentProfileGoal !== profileSnapshot.goal
  );

  const syncTodayChallenge = useCallback(() => {
    setChallenge(challengeSessionService.getTodayChallenge(user));
    setActiveExerciseIndex(null);
    setStreak(challengeStreakService.getState());
  }, [user]);

  useEffect(() => {
    const handleChallengeChange = (event: Event) =>
      setChallenge((event as CustomEvent).detail);
    const handleStreakChange = () => setStreak(challengeStreakService.getState());

    window.addEventListener("voiceDailyChallenge:changed", handleChallengeChange);
    window.addEventListener("voiceChallengeStreak:changed", handleStreakChange);

    return () => {
      window.removeEventListener("voiceDailyChallenge:changed", handleChallengeChange);
      window.removeEventListener("voiceChallengeStreak:changed", handleStreakChange);
    };
  }, []);

  useEffect(() => {
    syncTodayChallenge();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncTodayChallenge();
      }
    };
    const handleFocus = () => syncTodayChallenge();
    const handlePageShow = () => syncTodayChallenge();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);

    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      1
    );
    const timeout = window.setTimeout(() => {
      syncTodayChallenge();
    }, nextMidnight.getTime() - now.getTime());

    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [syncTodayChallenge, user]);

  const actions = useMemo(
    () => ({
      generate(count: number) {
        const nextChallenge = challengeSessionService.generateChallenge(user, count);
        setChallenge(nextChallenge);
        setActiveExerciseIndex(null);
        toast.success("Daily challenge generated.");
      },

      startChallenge() {
        if (!challenge) return;
        const nextChallenge = challengeSessionService.startChallenge(challenge);
        setChallenge(nextChallenge);
        setActiveExerciseIndex(nextChallenge.currentExerciseIndex || 0);
      },

      moveExercise(index: number, direction: number) {
        if (!challenge) return;
        setChallenge(challengeSessionService.reorderExercise(challenge, index, direction));
      },

      startExercise(index: number) {
        if (!challenge) return;
        const exercise = challenge.exercises[index];

        if (exercise.status === "locked") {
          toast.error("Complete the previous exercise first.");
          return;
        }

        if (challenge.status === "not_started") {
          const nextChallenge = challengeSessionService.startChallenge(challenge);
          setChallenge(nextChallenge);
        }

        setActiveExerciseIndex(index);
      },

      completeExercise(nextChallenge: any) {
        setChallenge(nextChallenge);
        setStreak(challengeStreakService.getState());

        if (nextChallenge.status === "completed") {
          setActiveExerciseIndex(null);
          return;
        }

        setActiveExerciseIndex(nextChallenge.currentExerciseIndex);
      },

      closeExercise() {
        setActiveExerciseIndex(null);
      },
    }),
    [challenge, user]
  );

  return {
    challenge,
    activeExerciseIndex,
    streak,
    profileSnapshot,
    currentProfileGoal,
    wasGeneratedFromDifferentGoal,
    actions,
  };
}

