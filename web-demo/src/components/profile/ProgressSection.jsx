// @ts-nocheck

import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { challengeStreakService } from "@/services/challengeStreakService";

export default function ProgressSection({ user }) {
  const [challengeStreak, setChallengeStreak] = useState(() =>
    challengeStreakService.getState()
  );
  const completion = 42;
  const streak = user?.streak_days || 7;
  const exercises = user?.completed_exercises || 34;
  const challengeMilestone =
    challengeStreak.currentChallengeStreak >= 100
      ? "Century"
      : challengeStreak.currentChallengeStreak >= 90
        ? "90 day"
        : challengeStreak.currentChallengeStreak >= 60
          ? "60 day"
          : challengeStreak.currentChallengeStreak >= 30
            ? "30 day"
            : null;

  useEffect(() => {
    const handleStreakChange = () => {
      setChallengeStreak(challengeStreakService.getState());
    };

    window.addEventListener("voiceChallengeStreak:changed", handleStreakChange);
    return () => {
      window.removeEventListener("voiceChallengeStreak:changed", handleStreakChange);
    };
  }, []);

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

      <div className="mt-5 border-t border-border pt-5">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">
          Challenge streak
        </p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p
            className={`font-display leading-none ${
              challengeMilestone
                ? "text-5xl text-primary"
                : "text-3xl font-black text-foreground"
            }`}
          >
            {challengeStreak.currentChallengeStreak || 0}
          </p>
          <p className="pb-1 text-xs font-bold uppercase text-muted-foreground">
            {challengeMilestone ? `${challengeMilestone} / ` : ""}best{" "}
            {challengeStreak.longestChallengeStreak || 0}
          </p>
        </div>
      </div>
    </section>
  );
}
