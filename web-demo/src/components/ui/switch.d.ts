import type * as React from "react";

export const Switch: React.ComponentType<{
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  "aria-label"?: string;
  className?: string;
}>;

