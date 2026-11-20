"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Navbar } from "../components/landing/Navbar";
import { GlobalIntelligenceMap } from "../components/landing/GlobalIntelligenceMap";
import { ArchitectureBand } from "../components/landing/ArchitectureBand";
import { ChatShowcase } from "../components/landing/ChatShowcase";
import { ImageShowcase } from "../components/landing/ImageShowcase";
import { VideoShowcase } from "../components/landing/VideoShowcase";
import { LandingFooter } from "../components/landing/EcosystemRoadmap";
import {
  HERO_COPY_PRESETS,
  MiddleBridgeConnector,
  type BridgeStyleId,
  type HeroCopyId,
  type ModalityTarget,
} from "../components/lab/HeroStudioPrimitives";
import {
  UnboxedFlowSamples,
  type UnboxedFlowId,
} from "../components/lab/UnboxedFlowSamples";

function HeroStudioInner() {
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [heroCopy, setHeroCopy] = useState<HeroCopyId>("executive");
  const [bridge, setBridge] = useState<BridgeStyleId>("telemetry");
  const [flowVariant, setFlowVariant] = useState<UnboxedFlowId>("synaptic-void");
  const [mapSubtlety, setMapSubtlety] = useState<"whisper" | "balanced">("whisper");
  const [activeModality, setActiveModality] = useState<ModalityTarget>("chat");
  const [dispatchedPrompt, setDispatchedPrompt] = useState<string | null>(null);

  useEffect(() => {
    const h = searchParams.get("hero");
    if (h === "executive" || h === "developer" || h === "global") setHeroCopy(h);
    const b = searchParams.get("bridge");
    if (b === "telemetry" || b === "prompt" || b === "anchor") setBridge(b);
    const f = searchParams.get("flow");
    if (f === "synaptic-void" || f === "open-workbench" || f === "floating-3d") setFlowVariant(f);
    const m = searchParams.get("map");
    if (m === "whisper" || m === "balanced") setMapSubtlety(m);
  }, [searchParams]);

  const syncUrl = (
    h = heroCopy,
    b = bridge,
    f = flowVariant,
    m = mapSubtlety,
  ) => {
    const url = new URL(window.location.href);
    url.searchParams.set("hero", h);
    url.searchParams.set("bridge", b);
    url.searchParams.set("flow", f);
    url.searchParams.set("map", m);
    window.history.replaceState({}, "", url.toString());
  };

  const copy = HERO_COPY_PRESETS[heroCopy];

  return (
    <div className="min-h-screen bg-black text-[#F5F5F5] overflow-x-clip selection:bg-[#1F5B7C]/40 selection:text-white">
      {/* Real Gyra Navbar at top (zero intrusive toolbar crowding mobile above-the-fold!) */}
      <Navbar isAuthenticated={false} />

      <main id="main-content">
        {/* 1. PREMIUM HERO WITH SUBTLE PHOTOGRAPHIC ORBITAL NIGHT-EARTH MAP */}
        <section className="relative overflow-hidden bg-black pb-12 pt-14 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-24">
          <GlobalIntelligenceMap mode="orbital-hero" theme="steel" subtlety={mapSubtlety} />

          <div className="relative z-10 mx-auto max-w-[920px] px-5 text-center sm:px-8">
            <p className="font-mono-tech inline-flex items-center gap-2 text-[10px] tracking-[0.2em] text-[#84ACC6] uppercase sm:text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
              <span>{copy.eyebrow}</span>
            </p>

            <h1 className="font-display mt-5 text-[clamp(2.55rem,1.35rem+4.5vw,4.9rem)] leading-[0.92] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
              <span className="font-light text-white/75">{copy.line1}</span>
              <br />
              <span className="font-bold text-white">{copy.line2}</span>
            </h1>

            <p className="mx-auto mt-5 max-w-[46ch] text-[15px] leading-[1.6] text-[#A4B3C0] sm:text-[17px]">
              {copy.description}
            </p>

            {/* Clean 2-CTA Hierarchy (No 3rd button clutter on mobile!) */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/dashboard"
                className="gyra-dither-btn font-mono-tech inline-flex min-h-[44px] min-w-[164px] items-center justify-center bg-[#1F5B7C] px-6 text-[11.5px] font-medium tracking-[0.12em] text-white uppercase transition-colors hover:bg-[#2A7299] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
              >
                {copy.primaryCta}
              </a>
              <a
                href="/api"
                className="font-mono-tech inline-flex min-h-[44px] min-w-[146px] items-center justify-center border border-white/20 bg-black/65 px-6 text-[11.5px] tracking-[0.12em] text-white uppercase backdrop-blur-sm transition-colors hover:border-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2]"
              >
                {copy.secondaryCta}
              </a>
            </div>
          </div>
        </section>

        {/* 2. MIDDLE BRIDGE ZONE — Eliminates the Disconnected Gap in Your Red Circle */}
        <section className="relative bg-black pb-6 pt-0">
          <MiddleBridgeConnector
            styleId={bridge}
            activeModality={activeModality}
            onDispatchPrompt={(mod, txt) => {
              setActiveModality(mod);
              setDispatchedPrompt(txt);
            }}
          />
        </section>

        {/* 3. UNBOXED LIVE INTELLIGENCE FLOW — ZERO Rectangular Container Box! */}
        <section className="border-b border-white/10 bg-black pb-20 pt-2 lg:pb-28">
          <UnboxedFlowSamples
            variant={flowVariant}
            activeModality={activeModality}
            onSelectModality={(m) => {
              setActiveModality(m);
              setDispatchedPrompt(null);
            }}
            dispatchedPrompt={dispatchedPrompt}
          />
        </section>

        {/* Real Gyra Landing Sections Below */}
        <ArchitectureBand />
        <ChatShowcase />
        <ImageShowcase />
        <VideoShowcase />
      </main>

      <LandingFooter />

      {/* Compact Floating Studio Picker (Bottom-Center Pill -> Expands Clean Drawer so Mobile Hero Stays 100% Unobstructed!) */}
      <div className="fixed bottom-4 left-1/2 z-[80] w-[calc(100%-1.5rem)] max-w-[740px] -translate-x-1/2">
        {drawerOpen ? (
          <div className="border border-[#5B9EC2]/45 bg-[#04080E]/96 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-mono-tech text-[10.5px] tracking-[0.14em] text-[#5B9EC2] uppercase">
                Hero + Middle Bridge + Unboxed Flow Studio
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close studio switcher"
                className="inline-flex h-7 w-7 items-center justify-center border border-white/15 text-white hover:border-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3 font-mono-tech text-[10px] uppercase">
              {/* Row 1: Hero Copy */}
              <div>
                <p className="mb-1.5 text-[#7A8E9F]">1. Hero Copy Preset</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["executive", "developer", "global"] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setHeroCopy(id);
                        syncUrl(id, bridge, flowVariant, mapSubtlety);
                      }}
                      className={`border px-2.5 py-1.5 cursor-pointer ${
                        heroCopy === id
                          ? "border-[#78B0CE] bg-[#1F5B7C] text-white"
                          : "border-white/15 text-[#9BB0C2] hover:text-white"
                      }`}
                    >
                      {HERO_COPY_PRESETS[id].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Middle Bridge (Red-Circled Area) */}
              <div>
                <p className="mb-1.5 text-[#7A8E9F]">2. Middle Bridge (Fixes Red-Circled Gap)</p>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: "telemetry" as const, label: "A · Telemetry Rail + Tether" },
                      { id: "prompt" as const, label: "B · Live Prompt Bar" },
                      { id: "anchor" as const, label: "C · Minimal Hairline Anchor" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setBridge(item.id);
                        syncUrl(heroCopy, item.id, flowVariant, mapSubtlety);
                      }}
                      className={`border px-2.5 py-1.5 cursor-pointer ${
                        bridge === item.id
                          ? "border-[#78B0CE] bg-[#1F5B7C] text-white"
                          : "border-white/15 text-[#9BB0C2] hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Unboxed Live Flow */}
              <div>
                <p className="mb-1.5 text-[#7A8E9F]">3. Unboxed Live Flow (Zero Box Walls)</p>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: "synaptic-void" as const, label: "01 · Void Synaptic" },
                      { id: "open-workbench" as const, label: "02 · Open Split Dither" },
                      { id: "floating-3d" as const, label: "03 · Floating 3D Core" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFlowVariant(item.id);
                        syncUrl(heroCopy, bridge, item.id, mapSubtlety);
                      }}
                      className={`border px-2.5 py-1.5 cursor-pointer ${
                        flowVariant === item.id
                          ? "border-[#78B0CE] bg-[#1F5B7C] text-white"
                          : "border-white/15 text-[#9BB0C2] hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 4: Map Subtlety */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#7A8E9F]">Map Realism:</span>
                  {(["whisper", "balanced"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setMapSubtlety(lvl);
                        syncUrl(heroCopy, bridge, flowVariant, lvl);
                      }}
                      className={`border px-2.5 py-1 cursor-pointer ${
                        mapSubtlety === lvl
                          ? "border-[#78B0CE] bg-[#1F5B7C] text-white"
                          : "border-white/15 text-[#9BB0C2] hover:text-white"
                      }`}
                    >
                      {lvl === "whisper" ? "Whisper Subtle" : "Balanced"}
                    </button>
                  ))}
                </div>
                <a href="/gyra-lab" className="text-[#9CC4DC] hover:text-white">
                  Video &amp; Polish Lab →
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="font-mono-tech inline-flex min-h-[40px] items-center gap-2.5 border border-[#5B9EC2]/55 bg-[#04090F]/92 px-4 text-[10.5px] tracking-[0.12em] text-white uppercase shadow-[0_10px_30px_rgba(0,0,0,0.85)] backdrop-blur-md transition-colors hover:border-white cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#5B9EC2]" />
              <span>Customize Samples</span>
              <span className="text-[#7FA4BC]">
                · {bridge.toUpperCase()} · {flowVariant === "synaptic-void" ? "VOID" : flowVariant === "open-workbench" ? "SPLIT" : "3D"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HeroStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <HeroStudioInner />
    </Suspense>
  );
}
