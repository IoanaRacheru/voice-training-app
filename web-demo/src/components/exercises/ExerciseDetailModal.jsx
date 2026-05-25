// @ts-nocheck

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExerciseTrainingSession from "./ExerciseTrainingSession";

export default function ExerciseDetailModal({
  exercise,
  open,
  onOpenChange,
  targetRange,
  onSessionSaved,
}) {
  if (!exercise) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto rounded-[2px] border-border bg-background p-0">
        <div className="grid gap-0 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="bg-foreground p-6 text-white">
            <DialogHeader>
              <p className="font-mono text-[11px] uppercase text-white/55">
                {exercise.goalLabel}
              </p>
              <DialogTitle className="mt-2 font-display text-4xl uppercase leading-none text-white">
                {exercise.name}
              </DialogTitle>
              <DialogDescription className="pt-3 text-sm font-medium leading-6 text-white/70">
                {exercise.explanation}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 space-y-6">
              <section>
                <h3 className="text-sm font-black uppercase text-white">
                  How to do it
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-white/70">
                  {exercise.howTo}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-black uppercase text-white">
                  What it trains
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-white/70">
                  {exercise.trains}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-black uppercase text-white">
                  Examples
                </h3>
                <ul className="mt-3 space-y-2">
                  {exercise.examples.map((example) => (
                    <li
                      key={example}
                      className="border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white/85"
                    >
                      {example}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="text-sm font-black uppercase text-white">
                  Suggested goal
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-white/70">
                  {exercise.goal}
                </p>
              </section>
            </div>
          </aside>

          <main className="min-w-0 p-5 md:p-6">
            <ExerciseTrainingSession
              exercise={exercise}
              targetRange={targetRange}
              onSessionSaved={onSessionSaved}
            />
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
