// @ts-nocheck

import React, { useState } from "react";
import { BookOpen, Check } from "lucide-react";

const exercises = [
  {
    id: "rainbow-passage",
    title: "Rainbow Passage",
    pace: "Balanced",
    text:
      "When sunlight passes through falling rain, it can appear as a rainbow across the sky. The colors arrive in a smooth arc, each one blending softly into the next. Read this passage with a calm breath and let each phrase stay connected. Keep the voice easy, clear, and steady from beginning to end.",
    focusCues: ["Steady pace", "Open vowels", "Relaxed jaw", "Connected phrases"],
  },
  {
    id: "resonance-scan",
    title: "Resonance Scan",
    pace: "Slow",
    text:
      "Start with a gentle hum and notice where the sound vibrates. Let the voice move forward without pushing from the throat. Speak the next sentence lightly and listen for a clear, easy ring. If tension appears, pause and return to a comfortable breath.",
    focusCues: ["Forward resonance", "Low effort", "Gentle onset", "Easy breath"],
  },
  {
    id: "daily-phrase",
    title: "Daily Phrase",
    pace: "Natural",
    text:
      "I am practicing a voice that feels useful, expressive, and comfortable in everyday conversation. Today I can take one small step toward clearer speech. I do not need perfection to make progress. I only need attention, patience, and a repeatable practice rhythm.",
    focusCues: ["Conversational tone", "Natural melody", "Clear endings", "Confident finish"],
  },
  {
    id: "breath-control-passage",
    title: "Breath Control Passage",
    pace: "Balanced",
    text:
      "Take a quiet breath before the sentence begins. Let the air support the voice instead of forcing the sound forward. Read each line in one smooth phrase when possible, then pause naturally. Notice how the voice feels when the breath stays calm and organized.",
    focusCues: ["Quiet inhale", "Even airflow", "Natural pauses", "No throat push"],
  },
  {
    id: "articulation-warm-up",
    title: "Articulation Warm-up",
    pace: "Fast",
    text:
      "Bright birds bring brisk breezes before breakfast. Clear consonants carry the sentence without making the mouth tight. Repeat the line once slowly, then once with more energy. Keep the tongue flexible and the lips active while the voice stays relaxed.",
    focusCues: ["Crisp consonants", "Flexible tongue", "Active lips", "Relaxed face"],
  },
  {
    id: "emotional-tone-reading",
    title: "Emotional Tone Reading",
    pace: "Natural",
    text:
      "I was surprised by how warm the room felt when I stepped inside. The words came out softer than I expected, but they still carried meaning. Try the passage once with curiosity, once with reassurance, and once with quiet excitement. Keep the emotion present without losing clarity.",
    focusCues: ["Expressive melody", "Clear intention", "Soft volume", "Varied emphasis"],
  },
  {
    id: "neutral-conversation-practice",
    title: "Neutral Conversation Practice",
    pace: "Natural",
    text:
      "Hi, I wanted to check in about the plan for later today. I can be ready around three, but I am flexible if another time works better. Let me know what you prefer, and I will adjust. Practice this as a simple everyday exchange, not a performance.",
    focusCues: ["Everyday rhythm", "Easy starts", "Clear questions", "Friendly cadence"],
  },
];

export default function ReadingExercises() {
  const [selectedId, setSelectedId] = useState(exercises[0].id);
  const [completedCues, setCompletedCues] = useState([]);

  const selectedExercise =
    exercises.find((exercise) => exercise.id === selectedId) || exercises[0];

  const handleSelect = (id) => {
    setSelectedId(id);
    setCompletedCues([]);
  };

  const toggleCue = (cue) => {
    setCompletedCues((current) =>
      current.includes(cue)
        ? current.filter((item) => item !== cue)
        : [...current, cue]
    );
  };

  return (
    <section className="bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.06)] md:p-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">
            Guided practice
          </p>
          <h2 className="mt-1 text-2xl font-black uppercase text-foreground">
            Reading exercises
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <BookOpen className="h-4 w-4 text-primary" />
          {selectedExercise.pace} pace
        </div>
      </div>

      <div className="grid gap-6 pt-6 lg:grid-cols-[280px_1fr]">
        <div className="grid gap-2" role="listbox" aria-label="Reading exercises">
          {exercises.map((exercise) => {
            const selected = exercise.id === selectedExercise.id;

            return (
              <button
                key={exercise.id}
                type="button"
                aria-selected={selected}
                onClick={() => handleSelect(exercise.id)}
                className={`border px-4 py-3 text-left transition-colors ${
                  selected
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-white text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                <span className="block text-sm font-black uppercase">
                  {exercise.title}
                </span>
                <span className="mt-1 block text-xs font-bold uppercase">
                  {exercise.pace}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-5">
          <article className="border border-border bg-background p-5 md:p-6">
            <h3 className="text-xl font-black uppercase text-foreground">
              {selectedExercise.title}
            </h3>
            <p className="mt-4 text-base font-semibold leading-8 text-foreground md:text-lg">
              {selectedExercise.text}
            </p>
          </article>

          <div>
            <h3 className="text-sm font-black uppercase text-foreground">
              Focus cues
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {selectedExercise.focusCues.map((cue) => {
                const completed = completedCues.includes(cue);

                return (
                  <button
                    key={cue}
                    type="button"
                    aria-pressed={completed}
                    onClick={() => toggleCue(cue)}
                    className={`flex min-h-12 items-center justify-between gap-3 border px-3 py-2 text-left text-sm font-bold transition-colors ${
                      completed
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-white text-muted-foreground hover:border-foreground hover:text-foreground"
                    }`}
                  >
                    {cue}
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center border ${
                        completed
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white"
                      }`}
                    >
                      {completed && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
