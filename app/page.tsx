import type { Metadata } from "next";
import { displayFont, sansFont, monoFont } from "./landing/fonts";
import NeuralField from "./landing/NeuralField";
import Nav from "./landing/Nav";
import Hero from "./landing/Hero";
import EditorialShowcaseGrid from "./landing/EditorialShowcaseGrid";
import {
  VoiceShowcase,
  BuildShowcase,
} from "./landing/ShowcasesMedia";
import {
  Ecosystem,
  Developers,
  Pricing,
  Faq,
  FinalCta,
  Footer,
} from "./landing/Sections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Gyra — Intelligence, engineered to ship · Built by Genvia AI Company",
  description:
    "Multimodal Chat & Autonomous Agent platform. Generate photorealistic studio imagery, 4K 60fps cinema video, production TypeScript applications, and autonomous multi-step workflows inside one tactile command center.",
  openGraph: {
    title: "Gyra — Intelligence, engineered to ship",
    description:
      "Multimodal Chat & Autonomous Agent platform by Genvia AI Company.",
    type: "website",
    url: "https://gyra-tester.duckdns.org",
  },
};

export default function LandingPage() {
  return (
    <main
      className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable} gy-page antialiased`}
    >
      <NeuralField />

      <div className="gy-content">
        <Nav />
        <Hero />
        <EditorialShowcaseGrid />
        <VoiceShowcase />
        <BuildShowcase />
        <Ecosystem />
        <Developers />
        <Pricing />
        <Faq />
        <FinalCta />
        <Footer />
      </div>
    </main>
  );
}
