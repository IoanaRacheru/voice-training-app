import * as React from "react";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
    theme?: Record<string, string>;
    icon?: React.ComponentType;
  }
>;

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  config: ChartConfig;
  children?: React.ReactNode;
}

export const ChartContainer: React.ForwardRefExoticComponent<
  ChartContainerProps & React.RefAttributes<HTMLDivElement>
>;

export const ChartTooltip: React.ComponentType<any>;
export const ChartLegend: React.ComponentType<any>;

export interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  payload?: any[];
  indicator?: "dot" | "line" | "dashed";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  label?: React.ReactNode;
  labelFormatter?: (...args: any[]) => React.ReactNode;
  labelClassName?: string;
  formatter?: (...args: any[]) => React.ReactNode;
  color?: string;
  nameKey?: string;
  labelKey?: string;
}

export const ChartTooltipContent: React.ForwardRefExoticComponent<
  ChartTooltipContentProps & React.RefAttributes<HTMLDivElement>
>;

export interface ChartLegendContentProps extends React.HTMLAttributes<HTMLDivElement> {
  hideIcon?: boolean;
  payload?: any[];
  verticalAlign?: "top" | "bottom" | "middle";
  nameKey?: string;
}

export const ChartLegendContent: React.ForwardRefExoticComponent<
  ChartLegendContentProps & React.RefAttributes<HTMLDivElement>
>;
