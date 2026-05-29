import { ArrowDown, ArrowUp, CheckCircle2, Lock, Play, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type ChallengeExerciseCardProps = {
  exercise: any;
  index: number;
  canMove: boolean;
  isActive: boolean;
  onMove: (index: number, direction: number) => void;
  onStart: (index: number) => void;
};

export default function ChallengeExerciseCard({
  exercise,
  index,
  canMove,
  isActive,
  onMove,
  onStart,
}: ChallengeExerciseCardProps) {
  const isLocked = exercise.status === "locked";
  const isCompleted = exercise.status === "completed";

  return (
    <article
      className={`border bg-card p-4 shadow-[0_14px_40px_rgba(105,79,93,0.05)] ${
        isActive ? "border-primary ring-2 ring-primary/20" : "border-border"
      } ${isLocked ? "opacity-65" : ""}`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase text-muted-foreground">Step {index + 1}</span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 font-mono text-[10px] uppercase ${
                isCompleted
                  ? "bg-primary/20 text-foreground"
                  : isLocked
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary/10 text-primary"
              }`}
            >
              {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : isLocked ? <Lock className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {exercise.status}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase text-muted-foreground">
              <Timer className="h-3 w-3" />
              {Math.round(exercise.durationSeconds / 60)} min
            </span>
          </div>

          <h3 className="mt-3 text-xl font-black uppercase leading-none text-foreground">{exercise.title}</h3>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-muted-foreground">{exercise.instructions}</p>
          <p className="mt-3 text-xs font-black uppercase text-muted-foreground">Target skill: {exercise.category.replace("_", " ")}</p>
          <Progress value={exercise.progress || 0} className="mt-4 h-2" />
        </div>

        <div className="flex shrink-0 flex-row gap-2 md:flex-col">
          {canMove && (
            <>
              <Button type="button" variant="outline" size="icon" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label="Move exercise up">
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={() => onMove(index, 1)} aria-label="Move exercise down">
                <ArrowDown className="h-4 w-4" />
              </Button>
            </>
          )}

          <Button type="button" onClick={() => onStart(index)} disabled={isLocked || isCompleted} variant={isLocked ? "secondary" : "default"}>
            <Play className="h-4 w-4" />
            Start
          </Button>
        </div>
      </div>
    </article>
  );
}
