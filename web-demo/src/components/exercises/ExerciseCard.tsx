import React from "react";
import { ArrowUpRight } from "lucide-react";
import type { VoiceExercise } from "@/features/exercises/types";

type ExerciseCardProps = {
  exercise: VoiceExercise;
  isSelected: boolean;
  onSelect: (exercise: VoiceExercise) => void;
};

export default function ExerciseCard({ exercise, isSelected, onSelect }: ExerciseCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(exercise)}
      className={`group flex min-h-[154px] flex-col justify-between border bg-white p-5 text-left shadow-[0_18px_50px_rgba(17,17,17,0.05)] transition-all hover:-translate-y-0.5 hover:border-primary ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">
            {exercise.goalLabel}
          </p>
          <h2 className="mt-2 text-2xl font-black uppercase leading-none text-foreground">
            {exercise.name}
          </h2>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center bg-background text-muted-foreground group-hover:bg-primary group-hover:text-white">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <p className="mt-5 text-sm font-medium leading-6 text-muted-foreground">
        {exercise.explanation}
      </p>
    </button>
  );
}

