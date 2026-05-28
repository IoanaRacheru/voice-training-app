import type * as React from "react";

export const Popover: React.ComponentType<{ children?: React.ReactNode }>;
export const PopoverTrigger: React.ComponentType<{ asChild?: boolean; children?: React.ReactNode }>;
export const PopoverContent: React.ComponentType<
  React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>;

