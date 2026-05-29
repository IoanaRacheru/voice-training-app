export type TutorialSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type TutorialItem = {
  id: string;
  title: string;
  subtitle: string;
  readTime: string;
  level: "Beginner" | "Intermediate";
  sections: TutorialSection[];
};

export const tutorials: TutorialItem[] = [
  {
    id: "voice-goals-and-safety",
    title: "Voice Goals and Safety",
    subtitle: "Set a realistic path and protect vocal health from day one.",
    readTime: "6 min read",
    level: "Beginner",
    sections: [
      {
        title: "Start with a training goal, not a label",
        paragraphs: [
          "A useful goal is specific and practical: easier pitch stability, brighter resonance, clearer articulation, or smoother intonation.",
          "A single session should target one main skill. Multiple competing goals in the same drill usually reduce quality and increase tension.",
        ],
      },
      {
        title: "Core safety rules",
        paragraphs: [
          "Gender voice training should feel effortful but not painful. Pain, persistent hoarseness, or throat burning means stop and rest.",
          "Hydration, warm-up, and recovery are mandatory, not optional. Progress is built over consistency, not force.",
        ],
        bullets: [
          "Stop immediately if pain appears.",
          "Use short blocks (10-20 minutes) with breaks.",
          "End sessions early if quality collapses.",
        ],
      },
      {
        title: "How to track progress safely",
        paragraphs: [
          "Track trend over weeks, not single-day numbers. Daily variation is normal.",
          "Use recordings and short notes: what felt stable, what strained, and what improved.",
        ],
      },
    ],
  },
  {
    id: "pitch-basics",
    title: "Pitch Fundamentals",
    subtitle: "Understand fundamental frequency without over-focusing on numbers.",
    readTime: "8 min read",
    level: "Beginner",
    sections: [
      {
        title: "What pitch can and cannot do",
        paragraphs: [
          "Pitch (F0) is one cue among many. Raising or lowering pitch alone will not produce a complete voice change.",
          "Stable pitch control matters more than chasing extreme values. Consistency beats spikes.",
        ],
      },
      {
        title: "Useful beginner drills",
        paragraphs: [
          "Sustain vowels at comfortable loudness, then read short phrases while keeping smooth pitch motion.",
          "Practice stepping between two nearby notes before trying wide glides.",
        ],
        bullets: [
          "Sustained 'ee' for stability.",
          "Short sentence repeats for transfer.",
          "Light glides without strain.",
        ],
      },
      {
        title: "Common mistakes",
        paragraphs: [
          "Pushing larynx too high too fast often creates tightness and instability.",
          "Ignoring breath support causes pitch wobble and fatigue.",
        ],
      },
    ],
  },
  {
    id: "resonance-and-formants",
    title: "Resonance and Formants",
    subtitle: "Shape vocal color using tract tuning, not force.",
    readTime: "9 min read",
    level: "Intermediate",
    sections: [
      {
        title: "Why resonance matters",
        paragraphs: [
          "Resonance strongly affects perceived vocal presentation. It is often the difference between sounding forced and sounding natural.",
          "Forward, balanced resonance can be trained through sensation and consistency, even before advanced acoustic analysis.",
        ],
      },
      {
        title: "Practical resonance cues",
        paragraphs: [
          "Use gentle humming and straw/bubble-style warm-ups to find efficient vibration with low throat pressure.",
          "Aim for clear tone quality with relaxed jaw and tongue.",
        ],
        bullets: [
          "Feel vibration near lips/nose on hums.",
          "Avoid neck/strap muscle recruitment.",
          "Prioritize comfort over loudness.",
        ],
      },
      {
        title: "Interpreting formant estimates",
        paragraphs: [
          "Formant values in consumer tools are approximate. Treat them as trends, not absolute truth.",
          "If sound quality improves and effort decreases, that is a meaningful success signal even if numbers fluctuate.",
        ],
      },
    ],
  },
  {
    id: "prosody-and-intonation",
    title: "Prosody and Intonation",
    subtitle: "Build natural speech melody, rhythm, and phrasing.",
    readTime: "7 min read",
    level: "Intermediate",
    sections: [
      {
        title: "Beyond single notes",
        paragraphs: [
          "Real speech relies on movement: phrase accents, rises/falls, pacing, and pause control.",
          "Prosody training helps voice changes transfer into conversation better than isolated sustained tones alone.",
        ],
      },
      {
        title: "Rhythm and pause work",
        paragraphs: [
          "Read short paragraphs with intentional pause points. Keep breath resets silent and efficient.",
          "Practice emphasizing meaning words instead of pushing volume globally.",
        ],
      },
      {
        title: "Carryover into daily speech",
        paragraphs: [
          "Use short scripts you actually say in daily life. Repeat them with target melody patterns.",
          "Record, review, and adjust one variable at a time: pace, pause, or intonation arc.",
        ],
      },
    ],
  },
];

export function getTutorialById(id: string) {
  return tutorials.find((tutorial) => tutorial.id === id) || null;
}
