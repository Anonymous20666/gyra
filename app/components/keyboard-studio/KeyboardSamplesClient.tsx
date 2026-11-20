"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Terminal } from "lucide-react";
import { GlobalIntelligenceMap } from "../landing/GlobalIntelligenceMap";
import { Interactive3DKeyboard } from "./Interactive3DKeyboard";
import { GyraSnapshotStage, type SnapshotSceneId } from "./GyraSnapshotStage";
import { UnifiedKeyboardDashboardFlow } from "./UnifiedKeyboardDashboardFlow";

type LayoutSampleId = "unified-dashboard" | "desk" | "split-hero";

const SAMPLE_META: {
  id: LayoutSampleId;
  code: string;
  label: string;
  mobileLabel: string;
  maxW: string;
  summary: string;
}[] = [
  {
    id: "unified-dashboard",
    code: "01",
    label: "21-Orb + GYRA 3D Keyboard + E2B Hardware Box",
    mobileLabel: "01 Live Flow",
    maxW: "Pure Obsidian E2B",
    summary:
      "Pure #000000 E2B aesthetic: Prompt Bar → Telemetry Rail → 21-orb live neural wires + calm side 3D GYRA keyboard → locked top-tabbed E2B hardware stage (01 Chat Gen UI · 02 Image Relight · 03 Video 720p · 04 Audio 48kHz).",
  },
  {
    id: "desk",
    code: "02",
    label: "Desk Hardware Pair",
    mobileLabel: "02 Desk Pair",
    maxW: "1020px max",
    summary:
      "Compact hardware workstation: rotatable 3D GYRA keyboard + prompt bar on the left, synced directly into the Snapshot Show Box beside it.",
  },
  {
    id: "split-hero",
    code: "03",
    label: "Split Hero (E2B Fold)",
    mobileLabel: "03 Split Hero",
    maxW: "1140px max",
    summary:
      "E2B-grade above-the-fold authority: Think once. Create anything. + small rotatable 3D GYRA keyboard on the left, paired directly beside the live Gen UI Snapshot Box.",
  },
];

const QUICK_QUESTIONS: { label: string; scene: SnapshotSceneId; prompt: string }[] = [
  {
    label: "Tokyo vs Lisbon",
    scene: "genui",
    prompt: "Compare Tokyo vs Lisbon for a 5-day product shoot: weather, cost & golden hour",
  },
  {
    label: "2700K Relight",
    scene: "image",
    prompt: "Relight concrete loft to warm 2700K dusk — lock every architectural edge",
  },
  {
    label: "Headset 720p",
    scene: "video",
    prompt: "Macro 18° rim-light orbit around obsidian studio headset at 24 fps",
  },
  {
    label: "6x Parallel",
    scene: "fleet",
    prompt: "Run Gen UI research, 2700K relight, 720p render & @GyraAi sync in parallel",
  },
];

export function KeyboardSamplesClient() {
  const [layout, setLayout] = useState<LayoutSampleId>("unified-dashboard");
  const [scene, setScene] = useState<SnapshotSceneId>("genui");
  const [activeChar, setActiveChar] = useState<string | null>(null);
  const [activeCharNonce, setActiveCharNonce] = useState(0);
  const [enterPulseNonce, setEnterPulseNonce] = useState(0);
  const [externalDropNonce, setExternalDropNonce] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);

  const handleTypeChar = useCallback((ch: string) => {
    setActiveChar(ch);
    setActiveCharNonce((n) => n + 1);
  }, []);

  const handleEnterDrop = useCallback(() => {
    setEnterPulseNonce((n) => n + 1);
  }, []);

  const handleSceneSelect = useCallback((next: SnapshotSceneId) => {
    setCustomPrompt(null);
    setScene(next);
  }, []);

  const triggerPromptText = (text: string, forcedScene?: SnapshotSceneId) => {
    const clean = text.trim();
    if (!clean) return;
    const lower = clean.toLowerCase();
    const routed: SnapshotSceneId =
      forcedScene ??
      (lower.includes("video") || lower.includes("headset") || lower.includes("720p")
        ? "video"
        : lower.includes("relight") || lower.includes("image") || lower.includes("2700k")
          ? "image"
          : lower.includes("parallel") || lower.includes("fleet") || lower.includes("sync")
            ? "fleet"
            : "genui");
    setCustomPrompt(clean);
    setScene(routed);
    setEnterPulseNonce((n) => n + 1);
    setExternalDropNonce((n) => n + 1);
    setUserInput("");
  };

  const handleKeyTap = (keyId: string) => {
    if (keyId === "ENTER") {
      if (userInput.trim()) {
        triggerPromptText(userInput);
      } else {
        setEnterPulseNonce((n) => n + 1);
        setExternalDropNonce((n) => n + 1);
      }
      return;
    }
    if (keyId === "BKSP") {
      setUserInput((s) => s.slice(0, -1));
      return;
    }
    if (keyId === "SPACE") {
      setUserInput((s) => `${s} `);
      return;
    }
    if (keyId.length === 1) {
      setUserInput((s) => `${s}${keyId.toLowerCase()}`);
    }
  };

  const activeMeta = SAMPLE_META.find((m) => m.id === layout) ?? SAMPLE_META[0];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sticky Top Sample Switcher Toolbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1220px] flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="font-mono-tech inline-flex items-center gap-1.5 text-[10.5px] tracking-[0.12em] text-[#8DA4B8] uppercase transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Live Home</span>
            </Link>
            <span className="font-mono-tech text-[10px] tracking-[0.16em] text-[#5B9EC2] uppercase">
              3D Keyboard + Gen UI Samples
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Choose 3D keyboard live show layout sample"
            className="grid grid-cols-3 gap-1 border border-white/12 bg-[#05090F] p-1 sm:inline-flex"
          >
            {SAMPLE_META.map((s) => {
              const active = s.id === layout;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setLayout(s.id)}
                  className={`font-mono-tech min-h-[32px] px-2 sm:px-3 text-[9.5px] sm:text-[10.5px] tracking-[0.08em] uppercase transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? "border border-[#5B9EC2] bg-[#1F5B7C]/35 text-white"
                      : "border border-transparent text-[#879DB1] hover:text-white"
                  }`}
                >
                  <span className="sm:hidden">{s.mobileLabel}</span>
                  <span className="hidden sm:inline">
                    {s.code} · {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Concise Active Sample Descriptor */}
        <div className="border-t border-white/5 bg-[#03060A] px-4 py-2 sm:px-6">
          <div className="mx-auto flex max-w-[1220px] flex-wrap items-center justify-between gap-2 text-[11.5px] text-[#97ABBD]">
            <span>
              <strong className="font-mono-tech mr-2 text-[10px] tracking-[0.1em] text-[#5B9EC2] uppercase">
                Sample {activeMeta.code} ({activeMeta.maxW}):
              </strong>
              {activeMeta.summary}
            </span>
          </div>
        </div>
      </header>

      <main>
        {/* ===================================================================
            SAMPLE 01: UNIFIED 21-ORB CANOPY + UPPER-LEFT 3D GYRA KEYBOARD + AUTHENTIC DASHBOARD CHAT
           =================================================================== */}
        {layout === "unified-dashboard" && <UnifiedKeyboardDashboardFlow compactHero />}

        {/* ===================================================================
            SAMPLE 02: DESK HARDWARE PAIR (Max 1020px — Keyboard Left, Show Right)
           =================================================================== */}
        {layout === "desk" && (
          <section className="relative overflow-hidden pb-16">
            <div className="relative pb-8 pt-10 sm:pb-10 sm:pt-14">
              <GlobalIntelligenceMap mode="orbital-hero" theme="steel" subtlety="balanced" />
              <div className="relative z-10 mx-auto max-w-[820px] px-5 text-center sm:px-8">
                <p className="font-mono-tech inline-flex items-center gap-2 text-[10px] tracking-[0.2em] text-[#84ACC6] uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                  <span>Global Edge · 195+ Countries</span>
                </p>
                <h1 className="font-display mt-4 text-[clamp(2.35rem,1.25rem+4vw,4.35rem)] leading-[0.92] tracking-[-0.02em] text-white uppercase">
                  <span className="font-light text-white/75">Think once.</span>
                  <br />
                  <span className="font-bold text-white">Create anything.</span>
                </h1>
                <p className="mx-auto mt-4 max-w-[44ch] text-[14.5px] leading-[1.6] text-[#A4B3C0] sm:text-[16px]">
                  Ask naturally. Watch Gyra render live Generative UI, relight studio frames, and
                  direct 720p video in real time.
                </p>
              </div>
            </div>

            <div className="relative z-10 mx-auto max-w-[1020px] px-4 sm:px-6">
              <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-12 lg:gap-6">
                {/* Left 5 cols: Interactive 3D Keyboard + Prompt Controls */}
                <div className="flex flex-col gap-3 lg:col-span-5">
                  <div className="border border-white/12 bg-[#04070C]/90 p-2.5">
                    <div className="mb-1 flex items-center justify-between font-mono-tech text-[9.5px] tracking-[0.12em] text-[#7D95AA] uppercase">
                      <span>GYRA INPUT DECK</span>
                      <span className="text-[#5B9EC2]">360° TILT · CLICKABLE</span>
                    </div>
                    <Interactive3DKeyboard
                      size="md"
                      activeChar={activeChar}
                      activeCharNonce={activeCharNonce}
                      enterPulseNonce={enterPulseNonce}
                      onKeyTap={handleKeyTap}
                      statusLabel="LIVE SYNC · DRAG TO TURN"
                    />
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      triggerPromptText(userInput);
                    }}
                    className="flex min-h-[44px] items-center gap-2 border border-white/15 bg-[#04080E] px-3 py-1.5 focus-within:border-[#5B9EC2]"
                  >
                    <Terminal className="h-3.5 w-3.5 shrink-0 text-[#5B9EC2]" aria-hidden="true" />
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next.length > userInput.length) handleTypeChar(next[next.length - 1]);
                        setUserInput(next);
                      }}
                      placeholder="Ask a question or press 3D RUN ↵..."
                      className="min-w-0 flex-1 bg-transparent font-mono-tech text-[11px] text-white placeholder:text-[#667D90] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="font-mono-tech inline-flex min-h-[30px] shrink-0 items-center gap-1 bg-[#1F5B7C] px-2.5 text-[9.5px] font-medium tracking-[0.1em] text-white uppercase hover:bg-[#2A7299] cursor-pointer"
                    >
                      <span>Run</span>
                      <Send className="h-3 w-3" />
                    </button>
                  </form>

                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_QUESTIONS.map((q) => (
                      <button
                        key={q.label}
                        type="button"
                        onClick={() => triggerPromptText(q.prompt, q.scene)}
                        className={`font-mono-tech min-h-[32px] border px-2 text-[9.5px] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                          scene === q.scene
                            ? "border-[#5B9EC2] bg-[#1F5B7C]/25 text-white"
                            : "border-white/10 bg-black text-[#869CB0] hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right 7 cols: Compact Snapshot Live Show Box */}
                <div className="lg:col-span-7">
                  <GyraSnapshotStage
                    scene={scene}
                    onSceneChange={handleSceneSelect}
                    onTypeChar={handleTypeChar}
                    onEnterDrop={handleEnterDrop}
                    externalDropNonce={externalDropNonce}
                    customPrompt={customPrompt}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            SAMPLE 03: E2B-GRADE SPLIT HERO (Max 1140px — Above-the-Fold Power)
           =================================================================== */}
        {layout === "split-hero" && (
          <section className="relative overflow-hidden py-10 sm:py-14 lg:py-16">
            <GlobalIntelligenceMap mode="orbital-hero" theme="steel" subtlety="balanced" />

            <div className="relative z-10 mx-auto max-w-[1140px] px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
                {/* Left 5 cols: Editorial Hero + CTAs + Small Interactive 3D Keyboard */}
                <div className="flex flex-col lg:col-span-5">
                  <p className="font-mono-tech inline-flex items-center gap-2 text-[10px] tracking-[0.2em] text-[#84ACC6] uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                    <span>Global Edge · 195+ Countries</span>
                  </p>

                  <h1 className="font-display mt-4 text-[clamp(2.45rem,1.4rem+3.4vw,4.15rem)] leading-[0.92] tracking-[-0.02em] text-white uppercase">
                    <span className="font-light text-white/75">Think once.</span>
                    <br />
                    <span className="font-bold text-white">Create anything.</span>
                  </h1>

                  <p className="mt-4 max-w-[40ch] text-[14.5px] leading-[1.6] text-[#A4B3C0] sm:text-[15.5px]">
                    Autonomous Gen UI reasoning paired with studio-grade image and video synthesis
                    at edge latency.
                  </p>

                  <div className="mt-6 grid max-w-[340px] grid-cols-2 gap-2.5">
                    <Link
                      href="/dashboard"
                      className="gyra-dither-btn font-mono-tech inline-flex min-h-[42px] items-center justify-center bg-[#1F5B7C] px-4 text-[11px] font-medium tracking-[0.12em] text-white uppercase transition-colors hover:bg-[#2A7299]"
                    >
                      Open Gyra
                    </Link>
                    <Link
                      href="/api"
                      className="font-mono-tech inline-flex min-h-[42px] items-center justify-center border border-white/20 bg-black/75 px-4 text-[11px] tracking-[0.12em] text-white uppercase transition-colors hover:border-white"
                    >
                      API Platform
                    </Link>
                  </div>

                  {/* Compact Rotatable 3D Mechanical Keyboard Live Typing Directly Below CTAs */}
                  <div className="mt-6 border-t border-white/10 pt-3">
                    <Interactive3DKeyboard
                      size="sm"
                      activeChar={activeChar}
                      activeCharNonce={activeCharNonce}
                      enterPulseNonce={enterPulseNonce}
                      onKeyTap={handleKeyTap}
                      statusLabel="LIVE TYPING INTO STAGE → · DRAG TO TURN"
                    />
                  </div>
                </div>

                {/* Right 7 cols: Compact E2B-Style Snapshot Box Immediately Visible Above the Fold */}
                <div className="lg:col-span-7">
                  <GyraSnapshotStage
                    scene={scene}
                    onSceneChange={handleSceneSelect}
                    onTypeChar={handleTypeChar}
                    onEnterDrop={handleEnterDrop}
                    externalDropNonce={externalDropNonce}
                    customPrompt={customPrompt}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
