import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DataPoint = { date: string; score: number };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-border bg-white px-3 py-2 shadow-[0_12px_32px_rgba(17,17,17,0.09)]">
      <p className="font-mono text-[11px] uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-primary">{payload[0].value}/100</p>
    </div>
  );
};

export default function ScoreChart({ data }: { data: DataPoint[] }) {
  return (
    <section className="bg-white p-5 shadow-[0_18px_50px_rgba(17,17,17,0.06)]">
      <p className="font-mono text-[11px] uppercase text-muted-foreground">Score</p>
      <h3 className="mt-1 text-xl font-black uppercase text-foreground">Improvement</h3>
      <div className="mt-5 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" fill="hsl(var(--primary))" maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

