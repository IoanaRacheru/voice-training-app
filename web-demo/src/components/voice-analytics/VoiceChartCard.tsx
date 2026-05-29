import { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type VoiceChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function VoiceChartCard({ title, description, children }: VoiceChartCardProps) {
  return (
    <Card className="h-full border-border/70 bg-card shadow-[0_18px_50px_rgba(105,79,93,0.05)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-xs leading-5">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

