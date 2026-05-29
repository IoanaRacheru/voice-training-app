import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ChallengeExerciseCard from "./ChallengeExerciseCard";

type DailyChallengeListProps = {
  challenge: any;
  activeExerciseIndex: number | null;
  onStartChallenge: () => void;
  onMoveExercise: (index: number, direction: number) => void;
  onStartExercise: (index: number) => void;
};

export default function DailyChallengeList({
  challenge,
  activeExerciseIndex,
  onStartChallenge,
  onMoveExercise,
  onStartExercise,
}: DailyChallengeListProps) {
  const completedCount = challenge.exercises.filter((exercise: any) => exercise.status === "completed").length;
  const progress = Math.round((completedCount / challenge.exercises.length) * 100);
  const canMove = false;

  return (
    <section className="space-y-5">
      <div className="bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">Today&apos;s route</p>
            <h2 className="mt-1 text-2xl font-black uppercase text-foreground">{challenge.selectedExerciseCount} challenge exercises</h2>
            <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
              Complete them in order. The route is fixed, and each next exercise unlocks only after the current one is completed.
            </p>
          </div>

          {challenge.status === "not_started" && (
            <Button type="button" size="lg" onClick={onStartChallenge}>
              Lock order and start
            </Button>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-2 flex justify-between font-mono text-[11px] uppercase text-muted-foreground">
            <span>Progress</span>
            <span>{completedCount}/{challenge.exercises.length}</span>
          </div>
          <Progress value={progress} />
        </div>
      </div>

      <div className="space-y-3">
        {challenge.exercises.map((exercise: any, index: number) => (
          <ChallengeExerciseCard
            key={exercise.challengeId}
            exercise={exercise}
            index={index}
            canMove={canMove}
            isActive={activeExerciseIndex === index}
            onMove={onMoveExercise}
            onStart={onStartExercise}
          />
        ))}
      </div>
    </section>
  );
}
