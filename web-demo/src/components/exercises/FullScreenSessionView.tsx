import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

type FullScreenSessionViewProps = {
  title: string;
  subtitle: string;
  description: string;
  onBack: () => void;
  children: ReactNode;
};

export default function FullScreenSessionView({
  title,
  subtitle,
  description,
  onBack,
  children,
}: FullScreenSessionViewProps) {
  return (
    <div className="h-[calc(100vh-92px)] w-full">
      <div className="mb-4 flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 w-10 items-center justify-center border border-border bg-white text-foreground hover:border-primary"
          aria-label="Back to exercises and tools"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Exercises and Tools</p>
          <h2 className="text-2xl font-black uppercase text-foreground">{title}</h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{subtitle}</p>
          <p className="mt-2 max-w-3xl text-sm font-medium text-muted-foreground">{description}</p>
        </div>
      </div>

      <main className="h-[calc(100%-56px)] overflow-y-auto p-1 md:p-2">{children}</main>
    </div>
  );
}
