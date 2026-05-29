import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import PitchEvolutionChart from "@/components/progress/PitchEvolutionChart";
import ScoreChart from "@/components/progress/ScoreChart";
import ExerciseHistory from "@/components/exercises/ExerciseHistory";
import { useProgressController } from "@/hooks/useProgressController";
import { getAnalysisArtifact } from "@/api/authClient";
import { useState } from "react";

export default function Progress() {
  const [selectedArtifact, setSelectedArtifact] = useState<any>(null);
  const [artifactLoading, setArtifactLoading] = useState(false);
  const { exerciseSessions, loading, hasSessions, pitchData, scoreData, artifacts } =
    useProgressController();

  const handleArtifactOpen = async (id: string) => {
    setArtifactLoading(true);
    try {
      const artifact = await getAnalysisArtifact(id);
      setSelectedArtifact(artifact);
    } catch (_error) {
      setSelectedArtifact(null);
    } finally {
      setArtifactLoading(false);
    }
  };

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
          <div className="bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
            <p className="font-mono text-[11px] uppercase text-muted-foreground">Backend analysis artifacts</p>
            {artifacts.length === 0 ? (
              <p className="mt-3 text-sm font-medium text-muted-foreground">No backend artifacts yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {artifacts.slice(0, 5).map((item: any) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleArtifactOpen(item.id)}
                    className="w-full border border-border bg-background p-3 text-left"
                  >
                    <p className="text-xs font-bold uppercase text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{item.summary}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Score: {Math.round(item.voice_presentation_score)} | Confidence:{" "}
                      {Math.round((item.voice_presentation_confidence ?? 0) * 100)}%
                    </p>
                  </button>
                ))}
              </div>
            )}
            {artifactLoading ? (
              <p className="mt-3 text-sm font-medium text-muted-foreground">Loading artifact details...</p>
            ) : selectedArtifact ? (
              <div className="mt-4 border border-border bg-background p-3">
                <p className="text-xs font-bold uppercase text-muted-foreground">Selected artifact</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{selectedArtifact.summary}</p>
                <p className="mt-1 text-sm text-muted-foreground">{selectedArtifact.practice_next}</p>
              </div>
            ) : null}
          </div>
          <ExerciseHistory sessions={exerciseSessions} />
        </>
      )}
    </div>
  );
}
