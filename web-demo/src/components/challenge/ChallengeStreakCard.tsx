import { Flame, Trophy } from "lucide-react";

function getMilestone(streakDays = 0) {
  if (streakDays >= 100) {
    return { label: "Century streak", cardClass: "bg-[#111111] text-white ring-4 ring-primary/35", numberClass: "text-7xl text-primary", badgeClass: "border-primary bg-primary text-white" };
  }
  if (streakDays >= 90) {
    return { label: "90 day master", cardClass: "bg-[#18130f] text-white ring-2 ring-amber-400/45", numberClass: "text-7xl text-amber-300", badgeClass: "border-amber-300 bg-amber-300 text-foreground" };
  }
  if (streakDays >= 60) {
    return { label: "60 day rhythm", cardClass: "bg-[#101820] text-white ring-2 ring-cyan-300/40", numberClass: "text-7xl text-cyan-200", badgeClass: "border-cyan-200 bg-cyan-200 text-foreground" };
  }
  if (streakDays >= 30) {
    return { label: "30 day badge", cardClass: "bg-[#151515] text-white ring-2 ring-emerald-300/40", numberClass: "text-7xl text-emerald-200", badgeClass: "border-emerald-200 bg-emerald-200 text-foreground" };
  }
  return { label: "Building streak", cardClass: "bg-foreground text-white", numberClass: "text-5xl", badgeClass: "border-white/20 bg-white/10 text-white/70" };
}

type ChallengeStreakCardProps = { streak: any };

export default function ChallengeStreakCard({ streak }: ChallengeStreakCardProps) {
  const currentStreak = streak.currentChallengeStreak || 0;
  const milestone = getMilestone(currentStreak);

  return (
    <section className={`grid gap-4 p-5 shadow-[0_18px_50px_rgba(17,17,17,0.08)] sm:grid-cols-2 ${milestone.cardClass}`}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          <p className="font-mono text-[11px] uppercase text-white/55">Challenge streak</p>
          <span className={`border px-2 py-1 font-mono text-[10px] uppercase ${milestone.badgeClass}`}>{milestone.label}</span>
        </div>
        <p className={`mt-4 font-display uppercase leading-none ${milestone.numberClass}`}>{currentStreak}</p>
        <p className="mt-2 text-xs font-bold uppercase text-white/55">current days</p>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <p className="font-mono text-[11px] uppercase text-white/55">Best streak</p>
        </div>
        <p className="mt-4 font-display text-5xl uppercase leading-none">{streak.longestChallengeStreak || 0}</p>
        <p className="mt-2 text-xs font-bold uppercase text-white/55">longest run</p>
      </div>
    </section>
  );
}

