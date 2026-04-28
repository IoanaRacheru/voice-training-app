// @ts-nocheck

import React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, Zap } from "lucide-react";

const exerciseLabels = {
  pitch: "Pitch",
  resonance: "Resonance",
  intonation: "Intonation",
  breath_control: "Breath",
  free_practice: "Free",
};

/**
 * @param {{ sessions: any[] }} props
 */
export default function SessionHistory({ sessions }) {
  return (
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden">
      <div className="p-5 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">
          Past Sessions
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your recent training history
        </p>
      </div>

      <div className="divide-y divide-border/30">
        {sessions.map((session, i) => (
          <div
            key={session.id || i}
            className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
          >
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-primary" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {exerciseLabels[session.exercise_type] ||
                    session.exercise_type}{" "}
                  Exercise
                </p>

                <Badge className="text-[10px] px-2 py-0 h-5 bg-muted text-muted-foreground capitalize">
                  {session.goal}
                </Badge>
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>
                  {format(new Date(session.date), "MMM d, yyyy")}
                </span>

                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {Math.round((session.duration_seconds || 0) / 60)}min
                </span>
              </div>
            </div>

            {/* Pitch & Score */}
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-foreground">
                {session.average_pitch || "—"}Hz
              </p>

              <div className="flex items-center gap-1 justify-end mt-0.5">
                <Zap className="w-3 h-3 text-accent" />
                <span className="text-xs font-medium text-accent">
                  {session.score || "—"}/100
                </span>
              </div>
            </div>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No sessions yet. Start training!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}