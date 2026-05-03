import React from "react";
import { Target } from "lucide-react";
/**
 * @param {{
 *   goal: "feminize" | "masculinize" | "androgynous"
 * }} props
 */
export default function GoalBadge({ goal }) {
  const isFem = goal !== "masculinize";

  return (
    <div className="inline-flex items-center gap-2 border border-border bg-white px-3 py-1.5 text-xs font-bold uppercase text-foreground">
      <Target className="h-3.5 w-3.5 text-primary" />
      {isFem ? "Feminize voice" : goal === "masculinize" ? "Masculinize voice" : "Androgynous voice"}
    </div>
  );
}
