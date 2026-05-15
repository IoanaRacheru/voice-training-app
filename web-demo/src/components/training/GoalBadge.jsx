import React from "react";
import { Target } from "lucide-react";
/**
 * @param {{
 *   goal: "feminize" | "masculinize" | "feminine" | "masculine" | "androgynous" | "custom"
 * }} props
 */
export default function GoalBadge({ goal }) {
  const labels = {
    feminize: "Feminine voice",
    feminine: "Feminine voice",
    masculinize: "Masculine voice",
    masculine: "Masculine voice",
    androgynous: "Androgynous voice",
    custom: "Custom voice",
  };

  return (
    <div className="inline-flex items-center gap-2 border border-border bg-white px-3 py-1.5 text-xs font-bold uppercase text-foreground">
      <Target className="h-3.5 w-3.5 text-primary" />
      {labels[goal] || "Feminine voice"}
    </div>
  );
}
