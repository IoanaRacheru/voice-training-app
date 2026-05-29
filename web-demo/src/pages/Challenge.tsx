import { motion } from "framer-motion";
import ChallengeCompletion from "@/components/challenge/ChallengeCompletion";
import ChallengeExerciseSession from "@/components/challenge/ChallengeExerciseSession";
import ChallengeSetup from "@/components/challenge/ChallengeSetup";
import ChallengeStreakCard from "@/components/challenge/ChallengeStreakCard";
import DailyChallengeList from "@/components/challenge/DailyChallengeList";
import HydrationReminder from "@/components/practice/HydrationReminder";
import { useAuth } from "@/lib/AuthContext";
import { useChallengeController } from "@/hooks/useChallengeController";
import { usePracticeSession } from "@/hooks/usePracticeSession";

export default function Challenge() {
  const { user } = useAuth();
  const {
    challenge,
    activeExerciseIndex,
    streak,
    profileSnapshot,
    currentProfileGoal,
    wasGeneratedFromDifferentGoal,
    actions,
  } = useChallengeController(user);
  const practiceSession = usePracticeSession();

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase text-muted-foreground">Daily route</p>
          <h1 className="font-display text-5xl uppercase leading-[0.95] text-foreground md:text-7xl">Challenge</h1>
          <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
            A structured daily voice routine generated from your profile goal, completed one step at a time.
          </p>
        </div>

        <div className="text-sm font-semibold text-muted-foreground md:text-right">
          Goal{" "}
          <span className="font-bold capitalize text-foreground">
            {profileSnapshot?.goal || currentProfileGoal}
          </span>
        </div>
      </motion.header>

      <ChallengeStreakCard streak={streak} />

      <HydrationReminder
        open={practiceSession.reminder?.shouldShow}
        message={practiceSession.reminder?.message}
        onDismiss={practiceSession.dismissReminder}
      />

      {wasGeneratedFromDifferentGoal && (
        <div className="border-l-4 border-primary bg-card px-4 py-3 text-sm font-bold text-muted-foreground shadow-[0_12px_34px_rgba(105,79,93,0.06)]">
          Today&apos;s challenge was generated from your previous profile goal. Tomorrow&apos;s challenge will use the new goal.
        </div>
      )}

      {!challenge ? (
        <ChallengeSetup
          hasProfileGoal={Boolean(user?.voice_goal || user?.target_voice_goal)}
          onGenerate={actions.generate}
        />
      ) : (
        <>
          {challenge.status === "completed" && <ChallengeCompletion challenge={challenge} />}

          {activeExerciseIndex !== null && challenge.status !== "completed" && (
            <ChallengeExerciseSession
              challenge={challenge}
              exerciseIndex={activeExerciseIndex}
              user={user}
              onCompleted={actions.completeExercise}
              onClose={actions.closeExercise}
            />
          )}

          {activeExerciseIndex === null && (
            <DailyChallengeList
              challenge={challenge}
              activeExerciseIndex={activeExerciseIndex}
              onStartChallenge={actions.startChallenge}
              onMoveExercise={actions.moveExercise}
              onStartExercise={actions.startExercise}
            />
          )}
        </>
      )}
    </div>
  );
}
