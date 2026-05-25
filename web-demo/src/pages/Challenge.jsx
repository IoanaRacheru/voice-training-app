// @ts-nocheck

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import ChallengeCompletion from "@/components/challenge/ChallengeCompletion";
import ChallengeExerciseSession from "@/components/challenge/ChallengeExerciseSession";
import ChallengeSetup from "@/components/challenge/ChallengeSetup";
import ChallengeStreakCard from "@/components/challenge/ChallengeStreakCard";
import DailyChallengeList from "@/components/challenge/DailyChallengeList";
import { useAuth } from "@/lib/AuthContext";
import { challengeGeneratorService } from "@/services/challengeGeneratorService";
import { challengeSessionService } from "@/services/challengeSessionService";
import { challengeStreakService } from "@/services/challengeStreakService";

export default function Challenge() {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(() =>
    challengeSessionService.getTodayChallenge(user)
  );
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(null);
  const [streak, setStreak] = useState(() => challengeStreakService.getState());
  const profileSnapshot = challenge?.profileGoalSnapshot;
  const currentProfileGoal = challengeGeneratorService.normalizeGoal(
    user?.voice_goal || user?.target_voice_goal
  );
  const wasGeneratedFromDifferentGoal =
    challenge &&
    profileSnapshot?.goal &&
    currentProfileGoal !== profileSnapshot.goal;

  const syncTodayChallenge = () => {
    setChallenge(challengeSessionService.getTodayChallenge(user));
    setActiveExerciseIndex(null);
    setStreak(challengeStreakService.getState());
  };

  useEffect(() => {
    const handleChallengeChange = (event) => setChallenge(event.detail);
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
  }, [user]);

  const handleGenerate = (count) => {
    const nextChallenge = challengeSessionService.generateChallenge(user, count);
    setChallenge(nextChallenge);
    setActiveExerciseIndex(null);
    toast.success("Daily challenge generated.");
  };

  const handleStartChallenge = () => {
    const nextChallenge = challengeSessionService.startChallenge(challenge);
    setChallenge(nextChallenge);
    setActiveExerciseIndex(nextChallenge.currentExerciseIndex || 0);
  };

  const handleMoveExercise = (index, direction) => {
    setChallenge(challengeSessionService.reorderExercise(challenge, index, direction));
  };

  const handleStartExercise = (index) => {
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
  };

  const handleExerciseCompleted = (nextChallenge) => {
    setChallenge(nextChallenge);
    setStreak(challengeStreakService.getState());

    if (nextChallenge.status === "completed") {
      setActiveExerciseIndex(null);
      return;
    }

    setActiveExerciseIndex(nextChallenge.currentExerciseIndex);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase text-muted-foreground">
            Daily route
          </p>
          <h1 className="font-display text-5xl uppercase leading-[0.95] text-foreground md:text-7xl">
            Challenge
          </h1>
          <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
            A structured daily voice routine generated from your profile goal, completed one step at a time.
          </p>
        </div>

        <div className="text-sm font-semibold text-muted-foreground md:text-right">
          Goal{" "}
          <span className="font-bold capitalize text-foreground">
            {profileSnapshot?.goal || currentProfileGoal}
          </span>
        </div>
      </motion.header>

      <ChallengeStreakCard streak={streak} />

      {wasGeneratedFromDifferentGoal && (
        <div className="border-l-4 border-primary bg-white px-4 py-3 text-sm font-bold text-muted-foreground shadow-[0_12px_34px_rgba(17,17,17,0.06)]">
          Today&apos;s challenge was generated from your previous profile goal. Tomorrow&apos;s challenge will use the new goal.
        </div>
      )}

      {!challenge ? (
        <ChallengeSetup
          hasProfileGoal={Boolean(user?.voice_goal || user?.target_voice_goal)}
          onGenerate={handleGenerate}
        />
      ) : (
        <>
          {challenge.status === "completed" && (
            <ChallengeCompletion challenge={challenge} />
          )}

          {activeExerciseIndex !== null && challenge.status !== "completed" && (
            <ChallengeExerciseSession
              challenge={challenge}
              exerciseIndex={activeExerciseIndex}
              user={user}
              onCompleted={handleExerciseCompleted}
              onClose={() => setActiveExerciseIndex(null)}
            />
          )}

          <DailyChallengeList
            challenge={challenge}
            activeExerciseIndex={activeExerciseIndex}
            onStartChallenge={handleStartChallenge}
            onMoveExercise={handleMoveExercise}
            onStartExercise={handleStartExercise}
          />
        </>
      )}
    </div>
  );
}
