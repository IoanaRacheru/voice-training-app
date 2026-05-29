const FEMININE_SET = new Set(["feminine", "feminize"]);
const MASCULINE_SET = new Set(["masculine", "masculinize"]);

function toNormalizedToken(value) {
  if (!value || typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}


export function mapExerciseTypeForBackend(exerciseId, exerciseName = "") {
  const token = `${toNormalizedToken(exerciseId)} ${toNormalizedToken(exerciseName)}`;

  if (/(^|_|\s)(pitch|mimic|larynx)(_|$|\s)/.test(token)) return "pitch";
  if (/(^|_|\s)(resonance|bubble)(_|$|\s)/.test(token)) return "resonance";
  if (/(^|_|\s)(breath|breathing|lung|volume)(_|$|\s)/.test(token)) return "breath_control";
  if (/(^|_|\s)(pronunciation|diction|intonation)(_|$|\s)/.test(token)) return "intonation";

  return "pitch";
}


export function mapGoalForBackend(goalType, goalLabel = "") {
  const primary = toNormalizedToken(goalType);
  const fallback = toNormalizedToken(goalLabel);
  const token = primary || fallback;

  if (FEMININE_SET.has(token)) return "feminize";
  if (MASCULINE_SET.has(token)) return "masculinize";
  if (token === "androgynous") return "androgynous";
  if (token === "feminine_voice" || token === "feminize_voice") return "feminize";
  if (token === "masculine_voice" || token === "masculinize_voice") return "masculinize";

  return "custom";
}
