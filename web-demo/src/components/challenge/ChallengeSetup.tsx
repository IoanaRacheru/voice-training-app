import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { challengeService } from "@/services/challengeService";

const COUNT_OPTIONS = [
  { value: 3, label: "3 exercises" },
  { value: 5, label: "5 exercises" },
  { value: 7, label: "7 exercises" },
  { value: "custom", label: "Custom number" },
] as const;

type ChallengeSetupProps = {
  hasProfileGoal: boolean;
  onGenerate: (count: number, selectedExerciseIds: string[]) => void;
};

export default function ChallengeSetup({ hasProfileGoal, onGenerate }: ChallengeSetupProps) {
  const [countValue, setCountValue] = useState<number | "custom">(5);
  const [customCount, setCustomCount] = useState(4);
  const maxAvailable = challengeService.getAvailableExercises().length;
  const selectedCount = Math.max(1, Math.min(maxAvailable, countValue === "custom" ? customCount : countValue));

  return (
    <section className="bg-card p-5 shadow-[0_24px_70px_rgba(105,79,93,0.07)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Daily setup</p>
          <h2 className="mt-1 text-2xl font-black uppercase text-foreground">Choose today&apos;s size</h2>
          {!hasProfileGoal && (
            <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-muted-foreground">
              Set a profile goal later for sharper personalization. Today uses a general voice training challenge.
            </p>
          )}
        </div>

        <Button onClick={() => onGenerate(selectedCount, [])} size="lg">
          Generate challenge
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {COUNT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setCountValue(option.value)}
            className={`min-h-12 border px-3 text-xs font-black uppercase transition-colors ${
              countValue === option.value
                ? "border-primary bg-primary text-background"
                : "border-border bg-background text-foreground hover:border-primary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {countValue === "custom" && (
        <div className="mt-4 max-w-xs">
          <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">Exercise count</p>
          <Input type="number" min="1" max={maxAvailable} value={customCount} onChange={(event) => setCustomCount(Number(event.target.value))} />
        </div>
      )}

      <div className="mt-6 border-t border-border pt-5">
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Automatic route</p>
          <h3 className="mt-1 text-xl font-black uppercase text-foreground">Random mixed exercises</h3>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-muted-foreground">
            The challenge will automatically generate {selectedCount} exercises from the current Exercises page catalog. Removed or renamed exercises update here automatically.
          </p>
        </div>
      </div>
    </section>
  );
}
