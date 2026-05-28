import type * as React from "react";

export const Progress: React.ComponentType<{
  value?: number;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>>;

