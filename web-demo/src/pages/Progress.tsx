import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import PitchEvolutionChart from "@/components/progress/PitchEvolutionChart";
import ScoreChart from "@/components/progress/ScoreChart";
import ExerciseHistory from "@/components/exercises/ExerciseHistory";
import { useProgressController } from "@/hooks/useProgressController";

export default function Progress() {
  const { exerciseSessions, loading, hasSessions, pitchData, scoreData } =
    useProgressController();

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="mb-3 font-mono text-[11px] uppercase text-muted-foreground">Session archive</p>
        <h1 className="font-display text-5xl uppercase leading-[0.95] text-foreground md:text-7xl">Progress</h1>
        <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
          Recorded sessions, pitch movement, and score history.
        </p>
      </motion.header>

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">Loading sessions...</div>
      ) : !hasSessions ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center gap-4 bg-card py-24 text-center shadow-[0_24px_70px_rgba(105,79,93,0.07)]"
        >
          <div className="grid h-14 w-14 place-items-center bg-background">
            <Activity className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-black uppercase text-foreground">No sessions yet</p>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Complete your first recording to see progress here.
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <PitchEvolutionChart data={pitchData} />
            <ScoreChart data={scoreData} />
          </div>
          <ExerciseHistory sessions={exerciseSessions} />
        </>
      )}
    </div>
  );
}
