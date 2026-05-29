import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DataPoint = { date: string; pitch: number };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="border border-border bg-card px-3 py-2 shadow-[0_12px_32px_rgba(105,79,93,0.09)]">
      <p className="font-mono text-[11px] uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-primary">{payload[0].value} Hz avg</p>
    </div>
  );
};

export default function PitchEvolutionChart({ data }: { data: DataPoint[] }) {
  return (
    <section className="bg-card p-5 shadow-[0_18px_50px_rgba(105,79,93,0.06)]">
      <p className="font-mono text-[11px] uppercase text-muted-foreground">Pitch</p>
      <h3 className="mt-1 text-xl font-black uppercase text-foreground">Evolution</h3>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit: Hz</p>
      <div className="mt-5 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 6" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}Hz`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="pitch" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
