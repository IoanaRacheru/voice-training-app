import type * as React from "react";

export const Button: React.ComponentType<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: string;
    size?: string;
    asChild?: boolean;
    className?: string;
    children?: React.ReactNode;
  }
>;

export function buttonVariants(props?: { variant?: string; size?: string; className?: string }): string;

