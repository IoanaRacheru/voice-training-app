import type * as React from "react";

export const AlertDialog: React.ComponentType<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}>;

export const AlertDialogTrigger: React.ComponentType<{
  asChild?: boolean;
  children?: React.ReactNode;
}>;

export const AlertDialogPortal: React.ComponentType<{ children?: React.ReactNode }>;

export const AlertDialogOverlay: React.ComponentType<
  React.HTMLAttributes<HTMLDivElement>
>;

export const AlertDialogContent: React.ComponentType<
  React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>;

export const AlertDialogHeader: React.ComponentType<
  React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>;

export const AlertDialogFooter: React.ComponentType<
  React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }
>;

export const AlertDialogTitle: React.ComponentType<
  React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode }
>;

export const AlertDialogDescription: React.ComponentType<
  React.HTMLAttributes<HTMLParagraphElement> & { children?: React.ReactNode }
>;

export const AlertDialogAction: React.ComponentType<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }
>;

export const AlertDialogCancel: React.ComponentType<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }
>;

