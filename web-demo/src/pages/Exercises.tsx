import { useState } from "react";
import { motion } from "framer-motion";
import ExerciseCard from "@/components/exercises/ExerciseCard";
import ExerciseTrainingSession from "@/components/exercises/ExerciseTrainingSession";
import VoiceAnalyticsToolSession from "@/components/exercises/VoiceAnalyticsToolSession";
import FullScreenSessionView from "@/components/exercises/FullScreenSessionView";
import { voiceAnalyticsTools } from "@/components/exercises/voiceAnalyticsTools";
import { exercises } from "@/data/exercises";
import { useProfilePreferences } from "@/hooks/useProfilePreferences";
import type { VoiceExercise } from "@/features/exercises/types";
import type { VoiceAnalyticsTool } from "@/features/exercises/toolTypes";

export default function Exercises() {
  const { preferences } = useProfilePreferences();
  const [selectedExercise, setSelectedExercise] = useState<VoiceExercise | null>(null);
  const [selectedAnalyticsTool, setSelectedAnalyticsTool] = useState<VoiceAnalyticsTool | null>(null);
  const targetRange = preferences.target_pitch_range;
  const pitchTargetEnabled = preferences.pitch_target_enabled;

  if (selectedExercise) {
    const exercise = selectedExercise;

    return (
      <FullScreenSessionView
        title={exercise.name}
        subtitle={exercise.goalLabel}
        description={exercise.explanation}
        onBack={() => setSelectedExercise(null)}
      >
        <ExerciseTrainingSession
          exercise={exercise}
          targetRange={pitchTargetEnabled ? targetRange : undefined}
          pitchTargetEnabled={pitchTargetEnabled}
          onSessionSaved={() => {}}
        />
      </FullScreenSessionView>
    );
  }

  if (selectedAnalyticsTool) {
    const tool = selectedAnalyticsTool;
    return (
      <FullScreenSessionView
        title={tool.name}
        subtitle="Voice Analytics"
        description={tool.description}
        onBack={() => setSelectedAnalyticsTool(null)}
      >
        <VoiceAnalyticsToolSession
          tool={tool}
          targetRange={targetRange}
          pitchTargetEnabled={pitchTargetEnabled}
        />
      </FullScreenSessionView>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase text-muted-foreground">Practice library</p>
          <h1 className="font-display text-5xl uppercase leading-[0.95] text-foreground md:text-7xl">
            Exercises and Tools
          </h1>
          <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
            Pick one focused drill or tool and practice as long as you need, with clean visual feedback where it helps.
          </p>
        </div>

        <div className="text-sm font-semibold text-muted-foreground md:text-right">
          Pitch target{" "}
          <span className="font-bold text-foreground">
            {pitchTargetEnabled ? `${targetRange[0]}-${targetRange[1]} Hz` : "Off"}
          </span>
        </div>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise as VoiceExercise}
            isSelected={selectedExercise?.id === exercise.id}
            onSelect={setSelectedExercise}
          />
        ))}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="space-y-5"
      >
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase text-muted-foreground">Tools</p>
          <h2 className="text-3xl font-black uppercase text-foreground">Voice Analytics</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {voiceAnalyticsTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setSelectedAnalyticsTool(tool)}
              className="border border-border bg-white p-5 text-left transition-colors hover:border-primary"
            >
              <p className="font-mono text-[11px] uppercase text-muted-foreground">Voice analytics</p>
              <h3 className="mt-2 text-lg font-black uppercase text-foreground">{tool.name}</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">{tool.description}</p>
            </button>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
