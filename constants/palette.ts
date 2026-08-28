export const lightPalette = {
  background: "#FFF9F2", surface: "#FFFCF8", surfaceAlt: "#F7EEE6", ink: "#34263A", muted: "#7D6F78",
  primary: "#E7A52C", primarySoft: "#FFF0C7", coral: "#F27C72", lavender: "#9E8BD8", mint: "#72BFA3",
  sky: "#6EA8D9", border: "#EADFD5", white: "#FFFFFF", danger: "#C75757", shadow: "#2D202B",
} as const;

export const darkPalette = {
  background: "#1E1720", surface: "#2A212C", surfaceAlt: "#352A37", ink: "#FFF7EF", muted: "#C5B6C1",
  primary: "#F4BE58", primarySoft: "#4A3B22", coral: "#FF958B", lavender: "#B9A9ED", mint: "#8DD7BD",
  sky: "#8EC3EB", border: "#493B4C", white: "#FFFFFF", danger: "#FF8D8D", shadow: "#000000",
} as const;

export type AppPalette = { [K in keyof typeof lightPalette]: string };
export const moodColors = { sunny: "#F6B84A", peaceful: "#72BFA3", proud: "#9E8BD8", connected: "#F27C72" } as const;
