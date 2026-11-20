"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "../components/landing/Navbar";
import { LandingFooter } from "../components/landing/EcosystemRoadmap";
import { LAB_PALETTES, type LabAccentId } from "../components/lab/labTheme";
import { FlowSampleWorkbench } from "../components/lab/FlowSampleWorkbench";
import { FlowSampleIsometric3D } from "../components/lab/FlowSampleIsometric3D";
import { FlowSampleAgentArcade } from "../components/lab/FlowSampleAgentArcade";
import { FlowSampleSynapticV3 } from "../components/lab/FlowSampleSynapticV3";
import { FlowSampleGlobalFusion } from "../components/lab/FlowSampleGlobalFusion";
import { VideoReplacementLab } from "../components/lab/VideoReplacementLab";
import { EditorialPolishLab } from "../components/lab/EditorialPolishLab";

type LabSection = "flows" | "videos" | "polish" | "all";
type FlowId = "01" | "02" | "03" | "04" | "05";

const FLOW_SAMPLES: { id: FlowId; label: string; tagline: string }[] = [
  { id: "01", label: "01 · Split-Pane + Bayer Dither", tagline: "E2B-beater 2-col hero workbench, real terminal + ordered-dither shader wipe" },
  { id: "02", label: "02 · Floating 3D Silicon (No Walls)", tagline: "Pure black floating 3D isometric strata with pointer-tilt & hairline ledger" },
  { id: "03", label: "03 · Agent Arcade & Mini-Worlds", tagline: "Playable/AI world-model arcade game + live Forge compiler + real-time relight" },
  { id: "04", label: "04 · Synaptic Neural v3", tagline: "Your Genvia -> Gyra Core upgraded: zero walls, above-the-fold, zero skeletons" },
  { id: "05", label: "05 · Global Mesh + Edge Fusion", tagline: "Real Natural Earth 110m map fused with live regional execution telemetry" },
];

function GyraLabInner() {
  const searchParams = useSearchParams();
  const [section, setSection] = useState<LabSection>("all");
  const [flowId, setFlowId] = useState<FlowId>("01");
  const [accent, setAccent] = useState<LabAccentId>("steel");

  useEffect(() => {
    const s = searchParams.get("tab");
    if (s === "flows" || s === "videos" || s === "polish" || s === "all") setSection(s);
    const f = searchParams.get("flow");
    if (f === "01" || f === "02" || f === "03" || f === "04" || f === "05") setFlowId(f);
    const a = searchParams.get("accent");
    if (a === "steel" || a === "ice" || a === "violet") setAccent(a);
  }, [searchParams]);

  const palette = LAB_PALETTES[accent];

  const syncUrl = (nextSec: LabSection, nextFlow: FlowId, nextAcc: LabAccentId) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", nextSec);
    url.searchParams.set("flow", nextFlow);
    url.searchParams.set("accent", nextAcc);
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <div className="min-h-screen bg-black text-[#F5F5F5] overflow-x-clip selection:bg-[#1F5B7C]/40 selection:text-white">
      {/* Top Interactive Samples Studio Control Bar */}
      <div className="sticky top-0 z-[70] border-b border-white/12 bg-[#03060B]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-tech text-[10px] tracking-[0.16em] uppercase" style={{ color: palette.bright }}>
              GYRA PRO SAMPLES LAB
            </span>
            <div role="tablist" aria-label="Samples Lab tracks" className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "all" as const, label: "All Samples (Full Tour)" },
                  { id: "flows" as const, label: "5 Live Flows" },
                  { id: "videos" as const, label: "5 Cinema Videos + Headset" },
                  { id: "polish" as const, label: "No-Walls & Typography" },
                ] as const
              ).map((t) => {
                const act = section === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={act}
                    onClick={() => {
                      setSection(t.id);
                      syncUrl(t.id, flowId, accent);
                    }}
                    style={{
                      backgroundColor: act ? palette.solid : "transparent",
                      borderColor: act ? palette.bright : "rgba(255,255,255,0.14)",
                    }}
                    className={`font-mono-tech min-h-[30px] border px-2.5 text-[10.5px] tracking-[0.07em] uppercase transition-colors cursor-pointer ${
                      act ? "font-medium text-white" : "text-[#8DA2B5] hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div role="group" aria-label="Accent palette" className="inline-flex border border-white/14 bg-black">
              {(["steel", "ice", "violet"] as const).map((a, idx) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={accent === a}
                  onClick={() => {
                    setAccent(a);
                    syncUrl(section, flowId, a);
                  }}
                  style={{ backgroundColor: accent === a ? LAB_PALETTES[a].solid : "transparent" }}
                  className={`font-mono-tech px-2.5 py-1 text-[10px] uppercase cursor-pointer ${
                    idx > 0 ? "border-l border-white/14" : ""
                  } ${accent === a ? "text-white" : "text-[#8498AA] hover:text-white"}`}
                >
                  {a === "steel" ? "Steel" : a === "ice" ? "Silver" : "Violet"}
                </button>
              ))}
            </div>
            <a
              href="/map-samples"
              className="font-mono-tech hidden border border-white/15 px-2.5 py-1 text-[10px] text-[#9BB0C2] uppercase hover:border-white hover:text-white sm:inline-block"
            >
              Map Samples
            </a>
            <a
              href="/"
              className="font-mono-tech hidden border border-white/15 px-2.5 py-1 text-[10px] text-[#9BB0C2] uppercase hover:border-white hover:text-white sm:inline-block"
            >
              Live / →
            </a>
          </div>
        </div>
      </div>

      {/* Real Gyra Navbar */}
      <Navbar isAuthenticated={false} />

      <main id="main-content">
        {/* TRACK 1: 5 LIVE INTELLIGENCE FLOW SAMPLES */}
        {(section === "all" || section === "flows") && (
          <section className="border-b border-white/10 bg-black py-16 lg:py-24">
            <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
              {/* Sample Picker Strip */}
              <div className="mb-12 border-b border-white/10 pb-6">
                <p className="font-mono-tech text-[10.5px] tracking-[0.16em] text-[#7D92A4] uppercase">
                  Track 01 · Choose Any Live Intelligence Flow Sample to Inspect (5 Real Engines — Zero Skeletons)
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FLOW_SAMPLES.map((f) => {
                    const act = flowId === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setFlowId(f.id);
                          syncUrl(section, f.id, accent);
                        }}
                        style={{
                          borderColor: act ? palette.bright : "rgba(255,255,255,0.14)",
                          backgroundColor: act ? `rgba(${palette.rgb}, 0.24)` : "transparent",
                        }}
                        className={`font-mono-tech border px-3.5 py-2 text-[11px] tracking-[0.06em] uppercase transition-colors cursor-pointer ${
                          act ? "font-medium text-white" : "text-[#8DA2B5] hover:border-white/40 hover:text-white"
                        }`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2.5 font-mono-tech text-[11px] text-[#7D92A4]">
                  {FLOW_SAMPLES.find((f) => f.id === flowId)?.tagline}
                </p>
              </div>

              {flowId === "01" && <FlowSampleWorkbench palette={palette} />}
              {flowId === "02" && <FlowSampleIsometric3D palette={palette} />}
              {flowId === "03" && <FlowSampleAgentArcade palette={palette} />}
              {flowId === "04" && <FlowSampleSynapticV3 palette={palette} />}
              {flowId === "05" && <FlowSampleGlobalFusion palette={palette} />}
            </div>
          </section>
        )}

        {/* TRACK 2: CINEMA VIDEO REPLACEMENT SAMPLES (HEADSET FIXED + 5 CANDIDATES) */}
        {(section === "all" || section === "videos") && (
          <section className="border-b border-white/10 bg-black py-24 lg:py-32">
            <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
              <VideoReplacementLab palette={palette} />
            </div>
          </section>
        )}

        {/* TRACK 3: E2B-BEATING EDITORIAL POLISH ("NO WALLS", SPLIT WEIGHT, 1-CLICK COPY GRID) */}
        {(section === "all" || section === "polish") && (
          <section className="border-b border-white/10 bg-black py-24 lg:py-32">
            <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
              <EditorialPolishLab palette={palette} />
            </div>
          </section>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}

export default function GyraLabPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <GyraLabInner />
    </Suspense>
  );
}
