import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { exerciseSessionService } from "@/services/exerciseSessionService";
import { challengeStreakService } from "@/services/challengeStreakService";
import { normalizeVoiceGoal } from "@/lib/profilePreferences";
import { useUserProfileDisplay } from "@/hooks/useUserProfileDisplay";

type ProfileCardProps = { user: any };

export default function ProfileCard({ user }: ProfileCardProps) {
  const [exerciseCount, setExerciseCount] = useState(0);
  const [streak, setStreak] = useState(() => challengeStreakService.getState().currentChallengeStreak || 0);
  const { displayName, email } = useUserProfileDisplay(user);
  const goal = normalizeVoiceGoal(user?.voice_goal) === "masculine" ? "Masculine" : "Feminine";

  useEffect(() => {
    const updateStats = async () => {
      const sessions = await exerciseSessionService.getSessions();
      const completedExercises = (Array.isArray(sessions) ? sessions : []).filter(
        (session: any) => session?.completed
      ).length;
      setExerciseCount(completedExercises);
      setStreak(challengeStreakService.getState().currentChallengeStreak || 0);
    };
    updateStats();
    window.addEventListener("voiceExerciseSessions:changed", updateStats);
    window.addEventListener("voiceChallengeStreak:changed", updateStats);
    window.addEventListener("storage", updateStats);
    return () => {
      window.removeEventListener("voiceExerciseSessions:changed", updateStats);
      window.removeEventListener("voiceChallengeStreak:changed", updateStats);
      window.removeEventListener("storage", updateStats);
    };
  }, []);

  return (
    <section className="bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.06)]">
      <p className="font-mono text-[11px] uppercase text-muted-foreground">Identification</p>
      <div className="mt-5 min-w-0">
        <h2 className="break-words text-2xl font-black uppercase leading-tight text-foreground">{displayName}</h2>
        <p className="mt-2 break-all text-sm font-medium text-muted-foreground">{email}</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Badge className="border-border bg-background text-foreground">{goal}</Badge>
      </div>
      <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-border pt-5 text-center">
        <div><dt className="text-[10px] font-bold uppercase text-muted-foreground">Streak</dt><dd className="mt-1 text-2xl font-black">{streak}</dd></div>
        <div><dt className="text-[10px] font-bold uppercase text-muted-foreground">Exercises</dt><dd className="mt-1 text-2xl font-black">{exerciseCount}</dd></div>
      </dl>
    </section>
  );
}
