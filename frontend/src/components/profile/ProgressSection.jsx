// @ts-nocheck

import React from "react";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Target } from "lucide-react";

/**
 * @param {{ user: any }} props
 */
export default function ProgressSection({ user }) {
  const completion = user?.goal_completion || 42;
  const streak = user?.streak_days || 7;
  const exercises = user?.completed_exercises || 34;

  return (
    <div className="rounded-2xl bg-card border border-border/50 p-6 space-y-6">
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
            className="absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Keep going! You&apos;re making great progress.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 p-4">
          <Flame className="w-5 h-5 text-primary mb-2" />
          <p className="text-2xl font-bold text-foreground">{streak}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Day Streak</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/10 p-4">
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