import React from "react";
import { Timer, Droplets, Wind, Waves, Sparkles } from "lucide-react";
import type { ExerciseExperience } from "@/features/exercises/types";

const ICON_BY_TYPE = {
  timer: Timer,
  hydration: Droplets,
  breath: Wind,
  resonance: Waves,
  larynx: Sparkles,
} as const;

/**
 * Renders a compact, reusable guidance block for each exercise session.
 * Keeps exercise-specific UX separate from recording and chart logic.
 */
export function ExerciseExperiencePanel({
  experience,
}: {
  experience?: ExerciseExperience;
}) {
  if (!experience) return null;

  const Icon = ICON_BY_TYPE[experience.icon];

  return (
    <section className="border border-border bg-white p-4 shadow-[0_12px_35px_rgba(17,17,17,0.05)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center border border-border bg-background">
          <Icon className="h-4 w-4 text-foreground" />
        </span>
        <h3 className="text-sm font-black uppercase text-foreground">{experience.focus}</h3>
      </div>

      <ol className="space-y-2 text-sm font-medium leading-6 text-muted-foreground">
        {experience.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      {experience.safetyNotes?.length ? (
        <ul className="mt-4 space-y-2 border-t border-border pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {experience.safetyNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      {experience.extraTip ? (
        <p className="mt-3 border-l-4 border-primary bg-primary/5 px-3 py-2 text-xs font-semibold text-foreground">
          {experience.extraTip}
        </p>
      ) : null}
    </section>
  );
}
