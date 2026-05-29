import { Flame, Trophy } from "lucide-react";

function getMilestone(streakDays = 0) {
  if (streakDays >= 100) {
    return { label: "Century streak", cardClass: "bg-primary/20 text-foreground ring-4 ring-primary/25", numberClass: "text-7xl text-foreground", badgeClass: "border-primary bg-secondary text-foreground" };
  }
  if (streakDays >= 90) {
    return { label: "90 day master", cardClass: "bg-secondary/70 text-foreground ring-2 ring-primary/25", numberClass: "text-7xl text-foreground", badgeClass: "border-primary bg-primary text-primary-foreground" };
  }
  if (streakDays >= 60) {
    return { label: "60 day rhythm", cardClass: "bg-muted text-foreground ring-2 ring-primary/25", numberClass: "text-7xl text-foreground", badgeClass: "border-primary bg-primary text-primary-foreground" };
  }
  if (streakDays >= 30) {
    return { label: "30 day badge", cardClass: "bg-muted text-foreground ring-2 ring-primary/25", numberClass: "text-7xl text-foreground", badgeClass: "border-primary bg-secondary text-foreground" };
  }
  return { label: "Building streak", cardClass: "bg-card text-foreground", numberClass: "text-5xl", badgeClass: "border-primary/35 bg-primary/10 text-foreground" };
}

type ChallengeStreakCardProps = { streak: any };

export default function ChallengeStreakCard({ streak }: ChallengeStreakCardProps) {
  const currentStreak = streak.currentChallengeStreak || 0;
  const milestone = getMilestone(currentStreak);

  return (
    <section className={`grid gap-4 p-5 shadow-[0_18px_50px_rgba(105,79,93,0.08)] sm:grid-cols-2 ${milestone.cardClass}`}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          <p className="font-mono text-[11px] uppercase opacity-70">Challenge streak</p>
          <span className={`border px-2 py-1 font-mono text-[10px] uppercase ${milestone.badgeClass}`}>{milestone.label}</span>
        </div>
        <p className={`mt-4 font-display uppercase leading-none ${milestone.numberClass}`}>{currentStreak}</p>
        <p className="mt-2 text-xs font-bold uppercase opacity-70">current days</p>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <p className="font-mono text-[11px] uppercase opacity-70">Best streak</p>
        </div>
        <p className="mt-4 font-display text-5xl uppercase leading-none">{streak.longestChallengeStreak || 0}</p>
        <p className="mt-2 text-xs font-bold uppercase opacity-70">longest run</p>
      </div>
    </section>
  );
}
