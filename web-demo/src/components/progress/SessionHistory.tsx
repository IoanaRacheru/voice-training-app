import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const exerciseLabels: Record<string, string> = {
  pitch: "Pitch",
  resonance: "Resonance",
  intonation: "Intonation",
  breath_control: "Breath",
  free_practice: "Free",
};

export default function SessionHistory({ sessions }: { sessions: any[] }) {
  return (
    <section className="bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.06)]">
      <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Ledger</p>
          <h3 className="mt-1 text-xl font-black uppercase text-foreground">Past sessions</h3>
        </div>
        <span className="text-xs font-bold uppercase text-muted-foreground">{sessions.length} total</span>
      </div>

      <div className="divide-y divide-border">
        {sessions.map((session, index) => (
          <div key={session.id || index} className="grid gap-4 py-4 transition-colors hover:bg-background md:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold uppercase text-foreground">{exerciseLabels[session.exercise_type] || session.exercise_type} exercise</p>
                <Badge className="border-border bg-background text-muted-foreground">{session.goal}</Badge>
              </div>
              <p className="mt-1 text-xs font-medium uppercase text-muted-foreground">
                {format(new Date(session.date), "MMM d, yyyy")} / {Math.round((session.duration_seconds || 0) / 60)} min
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-lg font-black uppercase text-foreground">{session.average_pitch || "--"} Hz</p>
              <p className="mt-1 text-xs font-bold uppercase text-primary">{session.score || "--"}/100</p>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">No sessions yet. Start training.</p>
          </div>
        )}
      </div>
    </section>
  );
}

