import { Droplets, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type HydrationReminderProps = {
  open?: boolean;
  message?: string;
  onDismiss?: () => void;
};

export default function HydrationReminder({
  open,
  message = "Great work! Take a small break, drink some water, and let your voice rest before continuing.",
  onDismiss,
}: HydrationReminderProps) {
  if (!open) return null;

  return (
    <section className="flex flex-col gap-3 border-l-4 border-primary bg-card p-4 shadow-[0_12px_34px_rgba(105,79,93,0.06)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center bg-background text-primary">
          <Droplets className="h-5 w-5" />
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase text-muted-foreground">Hydration / voice rest</p>
          <p className="mt-1 text-sm font-bold leading-6 text-foreground">{message}</p>
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss hydration reminder">
        <X className="h-4 w-4" />
      </Button>
    </section>
  );
}
