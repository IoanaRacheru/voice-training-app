import { palette } from "./colors";

export const chartColors = {
  primary: palette.primary,
  secondary: palette.secondary,
  neutral: palette.neutral,
  dark: palette.dark,
  background: palette.background,
  warm: palette.warmBackground,
  series: [palette.primary, palette.secondary, palette.neutral, palette.dark, palette.warmBackground],
} as const;
