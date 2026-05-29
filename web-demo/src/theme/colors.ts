export const palette = {
  primary: "#68A691",
  secondary: "#EFC7C2",
  background: "#FFF8F5",
  warmBackground: "#FFE5D4",
  neutral: "#BFD3C1",
  dark: "#694F5D",
} as const;

export type PaletteColor = keyof typeof palette;
