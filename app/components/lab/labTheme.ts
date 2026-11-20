export type LabAccentId = "steel" | "ice" | "violet";

export interface LabPalette {
  id: LabAccentId;
  label: string;
  solid: string;
  solidHover: string;
  bright: string;
  soft: string;
  rgb: string;
  brightRgb: string;
  border: string;
  glow: string;
}

export const LAB_PALETTES: Record<LabAccentId, LabPalette> = {
  steel: {
    id: "steel",
    label: "Gyra Steel Blue",
    solid: "#1F5B7C",
    solidHover: "#2A7299",
    bright: "#5B9EC2",
    soft: "#9CC4DC",
    rgb: "31, 91, 124",
    brightRgb: "91, 158, 194",
    border: "rgba(91, 158, 194, 0.34)",
    glow: "rgba(31, 91, 124, 0.30)",
  },
  ice: {
    id: "ice",
    label: "Arctic Silver",
    solid: "#334155",
    solidHover: "#475569",
    bright: "#CBD5E1",
    soft: "#F1F5F9",
    rgb: "148, 163, 184",
    brightRgb: "203, 213, 225",
    border: "rgba(203, 213, 225, 0.30)",
    glow: "rgba(148, 163, 184, 0.22)",
  },
  violet: {
    id: "violet",
    label: "Deep Violet",
    solid: "#6D28D9",
    solidHover: "#7C3AED",
    bright: "#A855F7",
    soft: "#D8B4FE",
    rgb: "109, 40, 217",
    brightRgb: "168, 85, 247",
    border: "rgba(168, 85, 247, 0.38)",
    glow: "rgba(109, 40, 217, 0.30)",
  },
};
