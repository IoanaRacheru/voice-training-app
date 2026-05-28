import type * as React from "react";

export const Slider: React.ComponentType<{
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  thumbOnlyDrag?: boolean;
}>;

