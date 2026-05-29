type ReadingPassageCardProps = {
  title?: string;
  lines?: string[];
};

export default function ReadingPassageCard({
  title = "Reading text",
  lines = [],
}: ReadingPassageCardProps) {
  if (!Array.isArray(lines) || lines.length === 0) {
    return null;
  }

  return (
    <section className="border border-border bg-card p-4">
      <p className="font-mono text-[11px] uppercase text-muted-foreground">Reading passage</p>
      <h3 className="mt-2 text-lg font-black uppercase text-foreground">{title}</h3>
      <div className="mt-3 space-y-2 text-sm font-medium leading-6 text-foreground/90">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </section>
  );
}
