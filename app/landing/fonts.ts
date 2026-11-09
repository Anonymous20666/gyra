import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

// Deliberately art-directed typography system for Gyra:
// - Outfit: Architectural geometric display typeface for primary headlines
// - Plus Jakarta Sans: High-legibility contemporary body typeface
// - JetBrains Mono: Precision monospace for code, citations, and telemetry
export const displayFont = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-gy-display",
  display: "swap",
});

export const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-gy-sans",
  display: "swap",
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-gy-mono",
  display: "swap",
});
