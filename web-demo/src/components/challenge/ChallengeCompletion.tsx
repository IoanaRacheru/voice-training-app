import { Award, Sparkles } from "lucide-react";

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

type ChallengeCompletionProps = { challenge: any };

export default function ChallengeCompletion({ challenge }: ChallengeCompletionProps) {
  const totalTime = challenge.results.reduce((total: number, result: any) => total + (result.durationSeconds || 0), 0);
  const averageScore = challenge.results.length
    ? Math.round(challenge.results.reduce((total: number, result: any) => total + result.score, 0) / challenge.results.length)
    : 0;

  return (
    <section className="relative overflow-hidden bg-card p-6 text-foreground shadow-[0_24px_70px_rgba(105,79,93,0.08)]">
      <div className="absolute right-6 top-6 grid h-16 w-16 place-items-center border border-primary/20 bg-primary/10">
        <Award className="h-8 w-8 text-primary" />
      </div>

      <div className="max-w-2xl">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Daily challenge complete</p>
        </div>
        <h2 className="mt-3 font-display text-5xl uppercase leading-none">Badge earned</h2>
        <p className="mt-4 text-sm font-medium leading-6 text-muted-foreground">{challenge.completionFeedback}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="bg-background p-4"><p className="font-mono text-[11px] uppercase text-muted-foreground">Total trained</p><p className="mt-2 font-display text-4xl leading-none">{formatTime(totalTime)}</p></div>
        <div className="bg-background p-4"><p className="font-mono text-[11px] uppercase text-muted-foreground">Average score</p><p className="mt-2 font-display text-4xl leading-none">{averageScore}</p></div>
        <div className="bg-background p-4"><p className="font-mono text-[11px] uppercase text-muted-foreground">Exercises</p><p className="mt-2 font-display text-4xl leading-none">{challenge.results.length}</p></div>
      </div>

      <div className="mt-6 grid gap-2">
        {challenge.results.map((result: any) => (
          <div key={result.challengeExerciseId} className="flex flex-wrap items-center justify-between gap-3 border border-border bg-background px-3 py-2">
            <span className="text-sm font-bold uppercase">{result.title}</span>
            <span className="font-mono text-xs uppercase text-muted-foreground">{result.score}/100</span>
          </div>
        ))}
      </div>
      <p className="mt-6 max-w-xl text-sm font-bold uppercase leading-6 text-muted-foreground">
        Challenge finalized. Come back tomorrow to choose a fresh daily set.
      </p>
    </section>
  );
}
