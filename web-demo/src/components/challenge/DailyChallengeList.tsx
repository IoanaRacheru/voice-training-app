import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { challengeService } from "@/services/challengeService";
import ChallengeExerciseCard from "./ChallengeExerciseCard";

type DailyChallengeListProps = {
  challenge: any;
  activeExerciseIndex: number | null;
  onStartChallenge: () => void;
  onMoveExercise: (index: number, direction: number) => void;
  onAddExercise: (exerciseId: string) => void;
  onRemoveExercise: (index: number) => void;
  onSetExerciseMinutes: (index: number, minutes: number) => void;
  onStartExercise: (index: number) => void;
};

export default function DailyChallengeList({
  challenge,
  activeExerciseIndex,
  onStartChallenge,
  onMoveExercise,
  onAddExercise,
  onRemoveExercise,
  onSetExerciseMinutes,
  onStartExercise,
}: DailyChallengeListProps) {
  const completedCount = challenge.exercises.filter((exercise: any) => exercise.status === "completed").length;
  const progress = Math.round((completedCount / challenge.exercises.length) * 100);
  const canMove = challenge.status === "not_started" && !challenge.orderLocked;
  const availableToAdd = challengeService
    .getAvailableExercises()
    .filter((exercise: any) => !challenge.exercises.some((existing: any) => existing.id === exercise.id));

  return (
    <section className="space-y-5" data-testid="challenge-route">
      <div className="bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">Today&apos;s route</p>
            <h2 className="mt-1 text-2xl font-black uppercase text-foreground">{challenge.selectedExerciseCount} challenge exercises</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
              {canMove
                ? "Customize your route before start: reorder, remove, add exercises, and tune minutes."
                : "Complete them in order. Each next exercise unlocks only after the current one is completed."}
            </p>
          </div>

          {challenge.status === "not_started" && (
            <Button type="button" size="lg" onClick={onStartChallenge} data-testid="challenge-start-route-button">
              Lock order and start
            </Button>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between font-mono text-[11px] uppercase text-muted-foreground" data-testid="challenge-progress">
            <span>Progress</span>
            <span>{completedCount}/{challenge.exercises.length}</span>
          </div>
          <Progress value={progress} />
        </div>
      </div>

      {canMove && (
        <div className="bg-card p-4 shadow-[0_14px_40px_rgba(105,79,93,0.05)]">
          <label className="font-mono text-[11px] uppercase text-muted-foreground" htmlFor="challenge-add-exercise">
            Add exercise from catalog
          </label>
          <div className="mt-2 flex gap-2">
            <select
              id="challenge-add-exercise"
              className="h-10 min-w-0 flex-1 border border-border bg-background px-3 text-sm"
              defaultValue=""
              onChange={(event) => {
                if (!event.target.value) return;
                onAddExercise(event.target.value);
                event.target.value = "";
              }}
            >
              <option value="">Select exercise</option>
              {availableToAdd.map((exercise: any) => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {challenge.exercises.map((exercise: any, index: number) => (
          <div key={exercise.challengeId} className="space-y-2">
            <ChallengeExerciseCard
              exercise={exercise}
              index={index}
              canMove={canMove}
              isActive={activeExerciseIndex === index}
              onMove={onMoveExercise}
              onStart={onStartExercise}
            />
            {canMove && (
              <div className="flex items-center justify-end gap-2 px-2">
                <Input
                  type="number"
                  min={1}
                  max={60}
                  className="w-28"
                  value={Math.max(1, Math.round((exercise.durationSeconds || 60) / 60))}
                  onChange={(event) => onSetExerciseMinutes(index, Number(event.target.value))}
                />
                <Button type="button" variant="outline" onClick={() => onRemoveExercise(index)}>
                  Remove
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
