import type * as React from "react";

export const Select: React.ComponentType<{
  value?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
}>;
export const SelectTrigger: React.ComponentType<any>;
export const SelectValue: React.ComponentType<any>;
export const SelectContent: React.ComponentType<any>;
export const SelectItem: React.ComponentType<{ value: string; children?: React.ReactNode }>;

