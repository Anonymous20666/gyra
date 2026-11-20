"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, Terminal } from "lucide-react";
import { Navbar } from "../components/landing/Navbar";
import { SynapticFlowHero } from "../components/landing/SynapticFlowHero";
import { ArchitectureBand } from "../components/landing/ArchitectureBand";
import { ChatShowcase } from "../components/landing/ChatShowcase";
import { ImageShowcase } from "../components/landing/ImageShowcase";
import { VideoShowcase } from "../components/landing/VideoShowcase";
import { CapabilityMatrix } from "../components/landing/CapabilityMatrix";
import { DeveloperQuickstart } from "../components/landing/DeveloperQuickstart";
import { EcosystemRoadmap, LandingFooter } from "../components/landing/EcosystemRoadmap";
import {
  GlobalIntelligenceMap,
  type MapColorTheme,
} from "../components/landing/GlobalIntelligenceMap";

type SampleId = "1" | "2" | "3";

const SAMPLES: { id: SampleId; label: string; shortDesc: string }[] = [
  {
    id: "1",
    label: "01 · Main Background Live",
    shortDesc: "Full-page live map behind all sections · scroll parallax + hover hubs",
  },
  {
    id: "2",
    label: "02 · Header-Only Live BG",
    shortDesc: "High-detail live map behind hero headline & CTAs only · dissolves cleanly to black",
  },
  {
    id: "3",
    label: "03 · Map Before Live Flow",
    shortDesc: "Compact live map module after header + subtext, before Synaptic Intelligence Flow",
  },
];

const CAPABILITY_STRIP = [
  "Gyra 1.0 & SuperGyra 2.0",
  "6-Agent Pipeline",
  "Pro Ultra Image Edit",
  "LTX-Video 720p Studio",
  "OpenAI-Compat v1 API",
  "Web · Android · Telegram",
];

function MapSamplesInner() {
  const searchParams = useSearchParams();
  const [sample, setSample] = useState<SampleId>("3");
  const [theme, setTheme] = useState<MapColorTheme>("steel");
  const [copiedCmd, setCopiedCmd] = useState(false);

  useEffect(() => {
    const s = searchParams.get("sample");
    if (s === "1" || s === "2" || s === "3") setSample(s);
    const t = searchParams.get("theme");
    if (t === "steel" || t === "violet") setTheme(t);
  }, [searchParams]);

  const selectSample = (next: SampleId) => {
    setSample(next);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    const url = new URL(window.location.href);
    url.searchParams.set("sample", next);
    url.searchParams.set("theme", theme);
    window.history.replaceState({}, "", url.toString());
  };

  const selectTheme = (next: MapColorTheme) => {
    setTheme(next);
    const url = new URL(window.location.href);
    url.searchParams.set("sample", sample);
    url.searchParams.set("theme", next);
    window.history.replaceState({}, "", url.toString());
  };

  const copyQuickCurl = async () => {
    const cmd = `curl -X POST https://gyra.ng/api/v1/chat -H "Authorization: Bearer $GYRA_API_KEY" -H "Content-Type: application/json" -d '{"model":"gyra-super2.0","messages":[{"role":"user","content":"Hello Gyra"}]}'`;
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      // Ignore restricted clipboard errors
    }
    setCopiedCmd(true);
    window.setTimeout(() => setCopiedCmd(false), 1800);
  };

  const activeMeta = SAMPLES.find((item) => item.id === sample) ?? SAMPLES[2];
  const isPageBg = sample === "1";

  return (
    <div
      className={`relative min-h-screen text-[#F5F5F5] overflow-x-clip selection:bg-[#1F5B7C]/35 selection:text-white ${
        isPageBg ? "bg-transparent" : "bg-black"
      }`}
    >
      {/* SAMPLE 1: Live Full-Page Background World Map with Scroll Parallax & Passive Hub Hover */}
      {isPageBg && <GlobalIntelligenceMap mode="page-bg" theme={theme} />}

      {/* Compact Sample Comparison Switcher Bar */}
      <div className="sticky top-0 z-[70] border-b border-[#1E3142] bg-[#04080E]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-tech text-[10px] tracking-[0.14em] text-[#5B9EC2] uppercase">
              Map Placement Samples
            </span>
            <div
              role="tablist"
              aria-label="Choose world map placement sample"
              className="flex flex-wrap gap-1.5"
            >
              {SAMPLES.map((item) => {
                const active = sample === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectSample(item.id)}
                    className={`font-mono-tech min-h-[30px] border px-2.5 text-[10.5px] tracking-[0.07em] uppercase transition-colors cursor-pointer ${
                      active
                        ? "border-[#78B0CE] bg-[#1F5B7C] font-medium text-white"
                        : "border-[#203243] bg-black/80 text-[#96AABB] hover:border-[#5B9EC2] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Map accent palette"
              className="inline-flex border border-[#203243] bg-black"
            >
              <button
                type="button"
                aria-pressed={theme === "steel"}
                onClick={() => selectTheme("steel")}
                className={`font-mono-tech px-2.5 py-1 text-[10px] tracking-[0.07em] uppercase transition-colors cursor-pointer ${
                  theme === "steel"
                    ? "bg-[#1F5B7C] text-white"
                    : "text-[#8DA2B5] hover:text-white"
                }`}
              >
                Steel Blue
              </button>
              <button
                type="button"
                aria-pressed={theme === "violet"}
                onClick={() => selectTheme("violet")}
                className={`font-mono-tech border-l border-[#203243] px-2.5 py-1 text-[10px] tracking-[0.07em] uppercase transition-colors cursor-pointer ${
                  theme === "violet"
                    ? "bg-[#6D28D9] text-white"
                    : "text-[#8DA2B5] hover:text-white"
                }`}
              >
                Ref Violet
              </button>
            </div>
            <a
              href="/"
              className="font-mono-tech hidden border border-[#243647] px-2.5 py-1 text-[10px] tracking-[0.08em] text-[#9BB0C2] uppercase hover:border-white hover:text-white sm:inline-block"
            >
              Live Site →
            </a>
          </div>
        </div>
        <div className="border-t border-white/[0.05] bg-black/60 px-4 py-1 text-center font-mono-tech text-[10px] tracking-[0.06em] text-[#8DA5B8] sm:px-8">
          Active: <span className="text-white">{activeMeta.label}</span> — {activeMeta.shortDesc}
        </div>
      </div>

      {/* Real Gyra Navbar */}
      <div className="relative z-40">
        <Navbar isAuthenticated={false} />
      </div>

      {/* Real Gyra Landing Page Main Content */}
      <main id="main-content" className="relative z-10">
        <section
          className={`border-b border-[#1F1F1F] ${
            isPageBg ? "bg-black/45" : "bg-black"
          }`}
        >
          {/* HERO HEADER BLOCK (Sample 2 mounts the live high-detail map exclusively behind this block) */}
          <div
            className={`relative overflow-hidden ${
              sample === "2" ? "pb-14 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20" : "pt-8 lg:pt-10"
            }`}
          >
            {sample === "2" && <GlobalIntelligenceMap mode="header-bg" theme={theme} />}

            <div className="relative z-10 mx-auto max-w-[1380px] px-5 sm:px-8">
              <div className="mx-auto flex max-w-[820px] flex-col items-center text-center">
                {sample === "2" && (
                  <p className="font-mono-tech mb-4 inline-flex items-center gap-2 border border-white/15 bg-black/70 px-3 py-1 text-[10px] tracking-[0.14em] text-[#9CC4DC] uppercase backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                    Global Intelligence Mesh · 195+ Countries · 99.9% Uptime
                  </p>
                )}

                <h1 className="font-display text-[clamp(2.65rem,4.9vw,4.25rem)] font-bold leading-[0.93] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
                  One intelligence.
                  <br />
                  Every medium.
                </h1>

                <p className="mt-3.5 max-w-[58ch] text-[14.5px] leading-[1.55] text-[#B8C4CE] sm:text-[16px]">
                  Gyra unites conversational reasoning, precision image generation and editing,
                  cinematic video studio workflows, and OpenAI-compatible APIs on one engineered
                  platform.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href="/dashboard"
                    className="font-mono-tech inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap bg-[#1F5B7C] px-6 text-[12px] font-medium tracking-[0.1em] text-white uppercase transition-colors duration-150 hover:bg-[#296E93] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                  >
                    Start with Gyra
                  </a>
                  <a
                    href="/api"
                    className="font-mono-tech inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap border border-[#3A3A3A] bg-black/80 px-6 text-[12px] font-medium tracking-[0.1em] text-white uppercase transition-colors duration-150 hover:border-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2]"
                  >
                    Explore API
                  </a>
                  <button
                    type="button"
                    onClick={copyQuickCurl}
                    className="font-mono-tech inline-flex min-h-[42px] items-center gap-2 border border-[#1F1F1F] bg-[#060606]/90 px-4 text-[11px] tracking-[0.08em] text-[#8E8E8E] uppercase transition-colors hover:border-[#3A3A3A] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2] cursor-pointer"
                  >
                    {copiedCmd ? (
                      <Check className="h-3.5 w-3.5 text-[#5B9EC2]" />
                    ) : (
                      <Terminal className="h-3.5 w-3.5 text-[#7A7A7A]" />
                    )}
                    <span>{copiedCmd ? "Copied cURL" : "POST /api/v1/chat"}</span>
                    <Copy className="h-3 w-3 opacity-60" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SAMPLE 3: Compact Executive Live Global Intelligence Map placed AFTER Header+Subtext and BEFORE Live Synaptic Flow */}
          <div className="mx-auto max-w-[1380px] px-5 pb-12 sm:px-8 lg:pb-16">
            {sample === "3" && (
              <>
                <GlobalIntelligenceMap mode="inline-module" theme={theme} />

                {/* Clean editorial bridge introducing the Live Synaptic Flow intentionally */}
                <div className="mx-auto mt-14 flex max-w-[820px] flex-col items-center border-t border-[#18222C] pt-10 text-center">
                  <p className="font-mono-tech text-[11px] tracking-[0.14em] text-[#5B9EC2] uppercase">
                    Live Execution Telemetry · Interactive Architecture
                  </p>
                  <h2 className="font-display mt-2 text-[clamp(1.65rem,2.8vw,2.4rem)] font-bold leading-[1.02] tracking-[-0.015em] text-white uppercase">
                    Watch Gyra route a live prompt across every modality
                  </h2>
                  <p className="mt-2 max-w-[56ch] text-[14px] leading-[1.55] text-[#8E9EAB]">
                    Hover any node or drop a custom prompt below to inspect how Genvia Core
                    orchestrates Chat, Image, Video, and API execution in real time.
                  </p>
                </div>
              </>
            )}

            {/* Real Gyra Synaptic Live Intelligence Flow */}
            <SynapticFlowHero />

            {/* Clean Unboxed Platform Capability Index */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[#181818] pt-5 font-mono-tech text-[11px] tracking-[0.08em] text-[#7D8C99] uppercase">
              {CAPABILITY_STRIP.map((item, idx) => (
                <span key={item} className="inline-flex items-center gap-5 whitespace-nowrap">
                  {idx > 0 && (
                    <span className="text-[#2B3D4D]" aria-hidden="true">
                      ·
                    </span>
                  )}
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Remaining Real Gyra Sections — subtly translucent in Sample 1 so the scrolling live world map shines through */}
        <div
          className={
            isPageBg
              ? "[&>section]:!bg-black/72 [&>section]:backdrop-blur-[2px]"
              : ""
          }
        >
          <ArchitectureBand />
          <ChatShowcase />
          <ImageShowcase />
          <VideoShowcase />
          <CapabilityMatrix />
          <DeveloperQuickstart />
          <EcosystemRoadmap includeFooter={false} />
        </div>
      </main>

      <div className={`relative z-10 ${isPageBg ? "[&>footer]:!bg-black/85" : ""}`}>
        <LandingFooter />
      </div>
    </div>
  );
}

export default function MapSamplesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <MapSamplesInner />
    </Suspense>
  );
}
