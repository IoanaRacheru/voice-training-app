// @ts-nocheck

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { Activity, CheckCircle2, History, OctagonAlert, Target } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatSessionDate(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return format(parsedDate, "MMM d, HH:mm");
}

export default function ExerciseHistory({ sessions = [] }) {
  const [selectedExerciseId, setSelectedExerciseId] = useState("all");
  const safeSessions = useMemo(
    () =>
      sessions
        .filter((session) => session && typeof session === "object")
        .map((session) => ({
          ...session,
          score: Number.isFinite(Number(session.score)) ? Number(session.score) : 0,
          duration_seconds: Number.isFinite(Number(session.duration_seconds))
            ? Number(session.duration_seconds)
            : 0,
        })),
    [sessions]
  );
  const exerciseOptions = useMemo(() => {
    const optionsById = safeSessions.reduce((options, session) => {
      const id = session.exercise_id || session.exercise_name;
      if (!id || options[id]) {
        return options;
      }

      options[id] = {
        id,
        name: session.exercise_name || "Unknown exercise",
      };
      return options;
    }, {});

    return Object.values(optionsById).sort((a, b) => a.name.localeCompare(b.name));
  }, [safeSessions]);
  const visibleSessions =
    selectedExerciseId === "all"
      ? safeSessions
      : safeSessions.filter(
          (session) =>
            (session.exercise_id || session.exercise_name) === selectedExerciseId
        );
  const orderedSessions = [...visibleSessions].reverse();
  const chronologicalSessions = [...visibleSessions];
  const completedSessions = visibleSessions.filter((session) => session.completed);
  const stoppedEarlySessions = visibleSessions.filter((session) => !session.completed);
  const averageScore = visibleSessions.length
    ? Math.round(visibleSessions.reduce((total, session) => total + session.score, 0) / visibleSessions.length)
    : 0;
  const latestSession = orderedSessions[0];
  const scoreTrend = chronologicalSessions.map((session, index) => ({
    name: `${index + 1}`,
    score: session.score,
    exercise: session.exercise_name,
  }));
  const goalSummary = Object.values(
    visibleSessions.reduce((summary, session) => {
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
    {
      label: "Average score",
      value: averageScore || "--",
      detail: visibleSessions.length ? `${visibleSessions.length} sessions` : "No sessions",
      icon: Activity,
    },
    {
      label: "Completed",
      value: completedSessions.length,
      detail: `${stoppedEarlySessions.length} stopped early`,
      icon: CheckCircle2,
    },
    {
      label: "Latest status",
      value: latestSession?.completed ? "Done" : latestSession ? "Early" : "--",
      detail: latestSession?.exercise_name || "No latest session",
      icon: OctagonAlert,
    },
    {
      label: "Pitch target",
      value:
        latestSession?.pitch_target_hit_rate === null ||
        latestSession?.pitch_target_hit_rate === undefined
          ? "--"
          : `${latestSession.pitch_target_hit_rate}%`,
      detail: "latest in green zone",
      icon: Target,
    },
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">
            Exercise archive
          </p>
          <h2 className="mt-1 text-2xl font-black uppercase text-foreground">
            Exercise history
          </h2>
        </div>

        <div className="w-full md:w-72">
          <p className="mb-2 font-mono text-[11px] uppercase text-muted-foreground">
            Filter exercise
          </p>
          <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
            <SelectTrigger className="h-11 rounded-[2px] border-border bg-white font-bold">
              <SelectValue placeholder="All exercises" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All exercises</SelectItem>
              {exerciseOptions.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {safeSessions.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 bg-white px-5 text-center shadow-[0_18px_50px_rgba(17,17,17,0.05)]">
          <div className="grid h-12 w-12 place-items-center bg-background">
            <History className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xl font-black uppercase text-foreground">
              No exercise sessions yet
            </p>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Pick an exercise and complete a valid recording to start tracking progress.
            </p>
          </div>
        </div>
      ) : orderedSessions.length === 0 ? (
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 bg-white px-5 text-center shadow-[0_18px_50px_rgba(17,17,17,0.05)]">
          <p className="text-xl font-black uppercase text-foreground">
            No sessions for this exercise
          </p>
          <p className="text-sm font-medium text-muted-foreground">
            Choose another exercise filter or complete a new session.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardCards.map(({ label, value, detail, icon: Icon }) => (
              <div
                key={label}
                className="min-h-[138px] bg-white p-4 shadow-[0_18px_50px_rgba(17,17,17,0.05)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-[11px] uppercase text-muted-foreground">
                    {label}
                  </p>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-5 font-display text-4xl uppercase leading-none text-foreground">
                  {value}
                </p>
                <p className="mt-3 text-xs font-bold uppercase leading-5 text-muted-foreground">
                  {detail}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.05)]">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] uppercase text-muted-foreground">
                    Result trend
                  </p>
                  <h3 className="mt-1 text-xl font-black uppercase text-foreground">
                    Score progress
                  </h3>
                </div>
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  0-100
                </span>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreTrend} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 2, borderColor: "hsl(var(--border))" }}
                      formatter={(value) => [`${value}/100`, "Score"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--foreground))"
                      strokeWidth={3}
                      dot={{ r: 3, fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.05)]">
              <p className="font-mono text-[11px] uppercase text-muted-foreground">
                By goal
              </p>
              <h3 className="mt-1 text-xl font-black uppercase text-foreground">
                Average result
              </h3>

              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goalSummary} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="goal"
                      tick={false}
                      axisLine={{ stroke: "hsl(var(--foreground))" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 700 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: 2, borderColor: "hsl(var(--border))" }}
                      formatter={(value, name) => [
                        name === "average" ? `${value}/100` : value,
                        name === "average" ? "Average" : "Sessions",
                      ]}
                    />
                    <Bar dataKey="average" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="overflow-hidden bg-white shadow-[0_18px_50px_rgba(17,17,17,0.05)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-border bg-background">
                  <tr className="font-mono text-[11px] uppercase text-muted-foreground">
                    <th className="px-4 py-3">Exercise</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Goal</th>
                    <th className="px-4 py-3">Pitch target</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Feedback</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedSessions.map((session) => (
                    <tr key={session.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-4 font-bold text-foreground">
                        {session.exercise_name}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                      {formatSessionDate(session.date)}
                      </td>
                      <td className="px-4 py-4 font-mono">
                        {formatDuration(session.duration_seconds)}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {session.goal}
                      </td>
                      <td className="px-4 py-4 font-mono">
                        {session.pitch_target_hit_rate === null ||
                        session.pitch_target_hit_rate === undefined
                          ? "--"
                          : `${session.pitch_target_hit_rate}%`}
                      </td>
                      <td className="px-4 py-4 font-display text-2xl leading-none">
                        {session.score}
                      </td>
                      <td className="max-w-[260px] px-4 py-4 text-muted-foreground">
                        {session.feedback}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2 py-1 font-mono text-[11px] uppercase ${
                            session.completed
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {session.completed ? "Completed" : "Stopped early"}
                        </span>
                      </td>
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
