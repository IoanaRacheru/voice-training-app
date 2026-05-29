import { palette } from "./colors";

export const tokens = {
  color: {
    background: palette.background,
    surface: palette.warmBackground,
    surfaceAlt: palette.neutral,
    primary: palette.primary,
    secondary: palette.secondary,
    border: palette.neutral,
    text: palette.dark,
  },
  shadow: {
    soft: "0 18px 50px rgba(105, 79, 93, 0.07)",
    raised: "0 24px 70px rgba(105, 79, 93, 0.09)",
  },
  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
  },
} as const;
