// @ts-nocheck

import React from "react";
import { Progress } from "@/components/ui/progress";

export default function ProgressSection({ user }) {
  const completion = 42;
  const streak = user?.streak_days || 7;
  const exercises = user?.completed_exercises || 34;

  return (
    <section className="border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase text-foreground">
          Current work
        </h3>
        <span className="font-mono text-xs font-bold text-primary">
          {completion}%
        </span>
      </div>

      <Progress value={completion} className="mt-4 h-2 bg-muted" />

      <div className="mt-6 grid grid-cols-2 gap-5">
        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">
            Day streak
          </p>
          <p className="mt-1 text-3xl font-black text-foreground">{streak}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground">
            Exercises
          </p>
          <p className="mt-1 text-3xl font-black text-foreground">{exercises}</p>
        </div>
      </div>
    </section>
  );
}
