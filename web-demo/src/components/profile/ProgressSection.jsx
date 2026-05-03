// @ts-nocheck

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Target } from "lucide-react";

/**
 * @param {{ user: any }} props
 */
export default function ProgressSection({ user }) {
  const completion = 42;
  const streak = 7;
  const exercises = 34;

  return (
    <div className="rounded-[28px] bg-card border border-border/70 p-6 space-y-6 shadow-[0_14px_28px_rgba(47,42,38,0.08)]">
      <h3 className="text-lg font-semibold text-foreground">Your Progress</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Goal Completion
            </span>
          </div>

          <span className="text-sm font-bold text-primary">
            {completion}%
          </span>
        </div>

        <div className="relative">
          <Progress value={completion} className="h-3 bg-muted rounded-full" />

          <div
            className="absolute top-0 left-0 h-3 rounded-full bg-chart-5 transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Keep going! You&apos;re making great progress.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[22px] bg-primary/30 border border-primary/40 p-4">
          <Flame className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{streak}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Day Streak</p>
        </div>

        <div className="rounded-[22px] bg-secondary border border-border/70 p-4">
          <Trophy className="w-5 h-5 text-accent mb-2" />
          <p className="text-2xl font-bold text-foreground">{exercises}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Exercises Done
          </p>
        </div>
      </div>
    </div>
  );
}
