import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Prompt Samples — Gyra",
  description:
    "Explore thoughtfully crafted prompts for writing, coding, research, business, learning, and creative work. Personalize any template and open it directly in Gyra Chat.",
  openGraph: {
    title: "Prompt Samples — Gyra",
    description:
      "Explore thoughtfully crafted prompts for writing, coding, research, business, learning, and creative work.",
    url: "https://gyra.ng/library",
    siteName: "Gyra",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Samples — Gyra",
    description:
      "Explore thoughtfully crafted prompts for writing, coding, research, business, learning, and creative work.",
  },
};

export default function PromptSamplesLayout({ children }: { children: ReactNode }) {
  return children;
}
