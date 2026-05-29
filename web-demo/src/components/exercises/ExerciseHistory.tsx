import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Activity, CheckCircle2, History, OctagonAlert, PlayCircle, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatSessionDate(date: string) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "--";
  return format(parsedDate, "MMM d, HH:mm");
}

function resolveVoicePresentation(session: any) {
  const backendScore = Number(session?.backend_analysis?.voice_presentation?.score);
  const backendConfidence = Number(session?.backend_analysis?.voice_presentation?.confidence);
  if (Number.isFinite(backendScore)) {
    return {
      value: backendScore,
      source: "backend",
      confidence: Number.isFinite(backendConfidence) ? Math.round(backendConfidence * 100) : null,
      label: session?.backend_analysis?.voice_presentation?.label || null,
    };
  }

  const legacy = Number(session?.gender_average);
  if (Number.isFinite(legacy)) {
    return {
      value: legacy,
      source: "legacy_pitch_proxy",
      confidence: null,
      label: null,
    };
  }

  return { value: null, source: "none", confidence: null, label: null };
}

export default function ExerciseHistory({ sessions = [] }: { sessions?: any[] }) {
  const [selectedExerciseId, setSelectedExerciseId] = useState("all");
  const safeSessions = useMemo(
    () =>
      sessions
        .filter((session) => session && typeof session === "object")
        .map((session) => ({
          ...session,
          score: Number.isFinite(Number(session.score)) ? Number(session.score) : 0,
          duration_seconds: Number.isFinite(Number(session.duration_seconds)) ? Number(session.duration_seconds) : 0,
          voice_presentation_meta: resolveVoicePresentation(session),
        })),
    [sessions]
  );

  const exerciseOptions = useMemo<Array<{ id: string; name: string }>>(() => {
    const optionsById = safeSessions.reduce((options: Record<string, { id: string; name: string }>, session) => {
      const id = session.exercise_id || session.exercise_name;
      if (!id || options[id]) return options;
      options[id] = { id, name: session.exercise_name || "Unknown exercise" };
      return options;
    }, {});
    return (Object.values(optionsById) as Array<{ id: string; name: string }>).sort((a, b) => a.name.localeCompare(b.name));
  }, [safeSessions]);

  const visibleSessions = selectedExerciseId === "all" ? safeSessions : safeSessions.filter((session) => (session.exercise_id || session.exercise_name) === selectedExerciseId);
  const orderedSessions = [...visibleSessions].reverse();
  const chronologicalSessions = [...visibleSessions];
  const completedSessions = visibleSessions.filter((session) => session.completed);
  const stoppedEarlySessions = visibleSessions.filter((session) => !session.completed);
  const averageScore = visibleSessions.length ? Math.round(visibleSessions.reduce((total, session) => total + session.score, 0) / visibleSessions.length) : 0;
  const latestSession = orderedSessions[0];
  const scoreTrend = chronologicalSessions.map((session, index) => ({
    name: `${index + 1}`,
    score: session.score,
    pitch: Number(session.average_pitch) || null,
    resonance: Number(session.resonance_average) || null,
    voicePresentation:
      session.voice_presentation_meta?.value === null ||
      session.voice_presentation_meta?.value === undefined
        ? null
        : Number(session.voice_presentation_meta.value),
    exercise: session.exercise_name,
  }));
  const hasPitch = visibleSessions.some((session) => Number.isFinite(Number(session.average_pitch)));
  const hasResonance = visibleSessions.some((session) => Number.isFinite(Number(session.resonance_average)));
  const hasGender = visibleSessions.some((session) => Number.isFinite(Number(session.voice_presentation_meta?.value)));
  const hasToolData = visibleSessions.some((session) => session.tool_chart_data);
  const goalSummary: Array<{ goal: string; sessions: number; average: number; total: number }> = Object.values(
    visibleSessions.reduce((summary: Record<string, any>, session) => {
      const key = session.goal || "Unknown";
      const current = summary[key] || { goal: key, sessions: 0, average: 0, total: 0 };
      current.sessions += 1;
      current.total += session.score;
      current.average = Math.round(current.total / current.sessions);
      summary[key] = current;
      return summary;
    }, {})
  );

  const dashboardCards = [
    { label: "Average score", value: averageScore || "--", detail: visibleSessions.length ? `${visibleSessions.length} sessions` : "No sessions", icon: Activity },
    { label: "Completed", value: completedSessions.length, detail: `${stoppedEarlySessions.length} stopped early`, icon: CheckCircle2 },
    { label: "Latest status", value: latestSession?.completed ? "Done" : latestSession ? "Early" : "--", detail: latestSession?.exercise_name || "No latest session", icon: OctagonAlert },
    {
      label: "Pitch target",
      value: latestSession?.pitch_target_hit_rate === null || latestSession?.pitch_target_hit_rate === undefined ? "--" : `${latestSession.pitch_target_hit_rate}%`,
      detail: "latest in green zone",
      icon: Target,
    },
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Exercise archive</p>
          <h2 className="mt-1 text-2xl font-black uppercase text-foreground">Exercise history</h2>
        </div>
        <div className="w-full md:w-72">
          <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">Filter exercise</p>
          <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
            <SelectTrigger className="h-11 rounded-[2px] border-border bg-card font-bold"><SelectValue placeholder="All exercises" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All exercises</SelectItem>
              {exerciseOptions.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>{exercise.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {safeSessions.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 bg-card px-5 text-center shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
          <div className="grid h-12 w-12 place-items-center bg-background"><History className="h-6 w-6 text-primary" /></div>
          <div>
            <p className="text-xl font-black uppercase text-foreground">No exercise sessions yet</p>
            <p className="mt-2 text-sm font-medium text-muted-foreground">Pick an exercise and complete a valid recording to start tracking progress.</p>
          </div>
        </div>
      ) : orderedSessions.length === 0 ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 bg-card px-5 text-center shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
          <p className="text-xl font-black uppercase text-foreground">No sessions for this exercise</p>
          <p className="text-sm font-medium text-muted-foreground">Choose another exercise filter or complete a new session.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardCards.map(({ label, value, detail, icon: Icon }) => (
              <div key={label} className="min-h-[138px] bg-card p-4 shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
                <div className="flex items-start justify-between gap-3"><p className="font-mono text-[11px] uppercase text-muted-foreground">{label}</p><Icon className="h-4 w-4 text-primary" /></div>
                <p className="mt-5 font-display text-4xl uppercase leading-none text-foreground">{value}</p>
                <p className="mt-3 text-xs font-bold uppercase leading-5 text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div><p className="font-mono text-[11px] uppercase text-muted-foreground">Result trend</p><h3 className="mt-1 text-xl font-black uppercase text-foreground">Score progress</h3></div>
                <span className="text-xs font-bold uppercase text-muted-foreground">0-100</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreTrend} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 2, borderColor: "hsl(var(--border))" }} formatter={(value) => [`${value}/100`, "Score"]} />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--foreground))" strokeWidth={3} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
              <p className="font-mono text-[11px] uppercase text-muted-foreground">By goal</p>
              <h3 className="mt-1 text-xl font-black uppercase text-foreground">Average result</h3>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goalSummary} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="goal" tick={false} axisLine={{ stroke: "hsl(var(--foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 2, borderColor: "hsl(var(--border))" }} formatter={(value, name) => [name === "average" ? `${value}/100` : value, name === "average" ? "Average" : "Sessions"]} />
                    <Bar dataKey="average" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {(hasPitch || hasResonance || hasGender || hasToolData) && (
            <div className="bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase text-muted-foreground">Measured results</p>
                  <h3 className="mt-1 text-xl font-black uppercase text-foreground">Exercise evolution</h3>
                </div>
                <span className="text-xs font-bold uppercase text-muted-foreground">{selectedExerciseId === "all" ? "Filtered by all exercises" : "Filtered exercise"}</span>
              </div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Units are separated: pitch/resonance proxy in Hz, voice presentation as a 0-100 score.
              </p>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">Acoustic trend (Hz)</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scoreTrend} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }} tickLine={false} />
                        <YAxis
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }}
                          tickLine={false}
                          axisLine={false}
                          label={{ value: "Hz", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: 2, borderColor: "hsl(var(--border))" }}
                          formatter={(value, name) => [`${Number(value).toFixed(0)} Hz`, name]}
                        />
                        {hasPitch && <Line type="monotone" dataKey="pitch" name="Pitch average" stroke="#694F5D" strokeWidth={2.5} dot={false} connectNulls />}
                        {hasResonance && <Line type="monotone" dataKey="resonance" name="Resonance proxy average" stroke="#68A691" strokeWidth={2.5} dot={false} connectNulls />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">Voice presentation (0-100)</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scoreTrend} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }} tickLine={false} />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }}
                          tickLine={false}
                          axisLine={false}
                          label={{ value: "Score", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: 2, borderColor: "hsl(var(--border))" }}
                          formatter={(value) => [`${Number(value).toFixed(0)}/100`, "Voice presentation"]}
                        />
                        {hasGender && <Line type="monotone" dataKey="voicePresentation" name="Voice presentation score" stroke="#EFC7C2" strokeWidth={2.5} dot={false} connectNulls />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Voice presentation uses backend model score when available; older sessions fall back to legacy pitch-only proxy.
              </p>
              {hasToolData && (
                <p className="mt-3 text-xs font-bold uppercase text-muted-foreground">
                  Tool-specific chart snapshots are saved per session and listed below.
                </p>
              )}
            </div>
          )}

          <div className="overflow-hidden bg-card shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-border bg-background">
                  <tr className="font-mono text-[11px] uppercase text-muted-foreground">
                    <th className="px-4 py-3">Exercise</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3">Pitch avg (Hz)</th><th className="px-4 py-3">Resonance proxy (Hz)</th><th className="px-4 py-3">Voice presentation (0-100)</th><th className="px-4 py-3">Audio</th><th className="px-4 py-3">Tool data</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedSessions.map((session) => (
                    <tr key={session.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-4 font-bold text-foreground">{session.exercise_name}</td>
                      <td className="px-4 py-4 text-muted-foreground">{formatSessionDate(session.date)}</td>
                      <td className="px-4 py-4 font-mono">{formatDuration(session.duration_seconds)}</td>
                      <td className="px-4 py-4 font-mono">{session.average_pitch ? `${session.average_pitch} Hz` : "--"}</td>
                      <td className="px-4 py-4 font-mono">{session.resonance_average ? `${session.resonance_average} Hz` : "--"}</td>
                      <td className="px-4 py-4 font-mono">
                        {session.voice_presentation_meta?.value === null || session.voice_presentation_meta?.value === undefined
                          ? "--"
                          : `${Math.round(session.voice_presentation_meta.value)}/100`}
                        {session.voice_presentation_meta?.confidence != null ? ` (${session.voice_presentation_meta.confidence}% conf)` : ""}
                        {session.voice_presentation_meta?.source === "legacy_pitch_proxy" ? " (legacy)" : ""}
                      </td>
                      <td className="px-4 py-4">
                        {session.audio_url ? (
                          <audio controls src={session.audio_url} className="h-9 w-56" aria-label={`${session.exercise_name} recording`} />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground"><PlayCircle className="h-3 w-3" /> --</span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono">{session.tool_chart_data ? "Saved" : "--"}</td>
                      <td className="px-4 py-4 font-display text-2xl leading-none">{session.score}</td>
                      <td className="px-4 py-4"><span className={`inline-flex px-2 py-1 font-mono text-[11px] uppercase ${session.completed ? "bg-primary/20 text-foreground" : "bg-secondary text-foreground"}`}>{session.completed ? "Completed" : "Stopped early"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
