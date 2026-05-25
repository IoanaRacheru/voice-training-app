// @ts-nocheck

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ExerciseCard from "@/components/exercises/ExerciseCard";
import ExerciseDetailModal from "@/components/exercises/ExerciseDetailModal";
import ExerciseHistory from "@/components/exercises/ExerciseHistory";
import { exercises } from "@/data/exercises";
import { useAuth } from "@/lib/AuthContext";
import { exerciseSessionService } from "@/services/exerciseSessionService";

function getTargetRange(user) {
  const goal = user?.voice_goal || "feminine";
  const normalizedGoal =
    goal === "feminize" ? "feminine" : goal === "masculinize" ? "masculine" : goal;

  if (user?.target_pitch_range?.length === 2) {
    return user.target_pitch_range;
  }

  if (normalizedGoal === "feminine") {
    return [180, 240];
  }

  if (normalizedGoal === "androgynous") {
    return [145, 185];
  }

  if (normalizedGoal === "custom") {
    return [120, 220];
  }

  return [100, 150];
}

export default function Exercises() {
  const { user } = useAuth();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [history, setHistory] = useState(() => exerciseSessionService.getSessions());
  const targetRange = getTargetRange(user);

  useEffect(() => {
    const handleHistoryChange = () => {
      setHistory(exerciseSessionService.getSessions());
    };

    window.addEventListener("voiceExerciseSessions:changed", handleHistoryChange);
    return () => {
      window.removeEventListener("voiceExerciseSessions:changed", handleHistoryChange);
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase text-muted-foreground">
            Practice library
          </p>
          <h1 className="font-display text-5xl uppercase leading-[0.95] text-foreground md:text-7xl">
            Exercises
          </h1>
          <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
            Choose a focused voice drill, set a timer, record inside the exercise, and compare the result to that goal.
          </p>
        </div>

        <div className="text-sm font-semibold text-muted-foreground md:text-right">
          Target{" "}
          <span className="font-bold text-foreground">
            {targetRange[0]}-{targetRange[1]} Hz
          </span>
        </div>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isSelected={selectedExercise?.id === exercise.id}
            onSelect={setSelectedExercise}
          />
        ))}
      </motion.section>

      <ExerciseHistory sessions={history} />

      <ExerciseDetailModal
        exercise={selectedExercise}
        open={Boolean(selectedExercise)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedExercise(null);
          }
        }}
        targetRange={targetRange}
        onSessionSaved={() => setHistory(exerciseSessionService.getSessions())}
      />
    </div>
  );
}
