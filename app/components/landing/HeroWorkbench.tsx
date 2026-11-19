"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  Cpu,
  Film,
  Image as ImageIcon,
  MessageSquare,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { resolveGyraRoute } from "../../lib/landingSimulations";

export interface HeroWorkbenchProps {
  isAuthenticated?: boolean;
  routeBase?: string;
}

type BranchId = "chat" | "image" | "video" | "api";

interface FlowStep {
  id: string;
  stage: string;
  detail: string;
  timing: string;
}

interface BranchSpec {
  id: BranchId;
  index: string;
  name: string;
  shortLabel: string;
  engineTag: string;
  summary: string;
  metricTag: string;
  sectionHref: string;
  sectionCta: string;
  appRoute: string;
  appCta: string;
  inputLabel: string;
  inputMeta: string;
  inputBody: string;
  pipelineTitle: string;
  steps: FlowStep[];
  outputLabel: string;
  outputBadge: string;
  traceClass: string;
}

const BRANCHES: BranchSpec[] = [
  {
    id: "chat",
    index: "01",
    name: "Gyra Chat",
    shortLabel: "Chat",
    engineTag: "Gyra 1.0 · SuperGyra 2.0",
    summary: "Conversational reasoning and a 6-agent engineering pipeline.",
    metricTag: "6 AGENTS · LIVE TOOLS",
    sectionHref: "#chat",
    sectionCta: "Jump to Chat Workbench",
    appRoute: "/dashboard",
    appCta: "Open Gyra Chat",
    inputLabel: "USER PROMPT",
    inputMeta: "model: super-2.0",
    inputBody:
      "Build a TypeScript webhook POST handler with HMAC-SHA256 verification and replay protection.",
    pipelineTitle: "6-AGENT REASONING TRACE",
    steps: [
      { id: "c1", stage: "Intent Router", detail: "Complexity high → dispatch SuperGyra 2.0", timing: "0.2s" },
      { id: "c2", stage: "Atlas · Spec", detail: "Checks replay window & timing-attack risks", timing: "0.5s" },
      { id: "c3", stage: "Forge · Code", detail: "Generates strict App Router webhook-handler.ts", timing: "1.1s" },
      { id: "c4", stage: "Sentinel · QA", detail: "Verified timingSafeEqual & 401 guard", timing: "0.5s" },
    ],
    outputLabel: "webhook-handler.ts",
    outputBadge: "SENTINEL VERIFIED",
    traceClass: "gyra-trace-pulse",
  },
  {
    id: "image",
    index: "02",
    name: "Gyra Image",
    shortLabel: "Image",
    engineTag: "Flux Dev · Pro Ultra I2I",
    summary: "Text-to-image synthesis and geometry-locked visual editing.",
    metricTag: "1440×1080 · I2I LOCK",
    sectionHref: "#image",
    sectionCta: "Jump to Image Darkroom",
    appRoute: "/dashboard",
    appCta: "Create with Gyra Image",
    inputLabel: "SOURCE FRAME + EDIT SPEC",
    inputMeta: "engine: pro-ultra",
    inputBody:
      "Shift daylight window to blue-hour dusk and ignite the desk lamp with 2700K tungsten falloff — preserve exact geometry.",
    pipelineTitle: "OPTICAL RELIGHT PIPELINE",
    steps: [
      { id: "i1", stage: "Frame Lock", detail: "Indexed 1440×1080 studio scene geometry", timing: "0.3s" },
      { id: "i2", stage: "Depth & Light", detail: "Mapped concrete shadow planes & lamp emitter", timing: "0.7s" },
      { id: "i3", stage: "Pro Ultra Pass", detail: "Applied blue-hour sky & 2700K tungsten wash", timing: "1.2s" },
      { id: "i4", stage: "Export Check", detail: "100% spatial lock · high-res frame ready", timing: "0.4s" },
    ],
    outputLabel: "PRO ULTRA · BEFORE / AFTER",
    outputBadge: "GEOMETRY LOCKED",
    traceClass: "gyra-trace-pulse-delay-1",
  },
  {
    id: "video",
    index: "03",
    name: "Gyra Video",
    shortLabel: "Video",
    engineTag: "LTX-Video 13B Studio",
    summary: "Direct 720p, 24 fps clips from text or attached stills.",
    metricTag: "720P · 24 FPS · 121F",
    sectionHref: "#video",
    sectionCta: "Jump to Video Studio",
    appRoute: "/studio",
    appCta: "Open Gyra Studio",
    inputLabel: "MOTION BRIEF + REF FRAME",
    inputMeta: "aspect: 16:9 · 5.0s",
    inputBody:
      "Slow cinematic drone glide across a cable-stayed bridge over dark lagoon water at twilight with warm traffic light trails.",
    pipelineTitle: "STUDIO RENDER QUEUE",
    steps: [
      { id: "v1", stage: "Ref Frame 001", detail: "Anchored twilight lagoon keyframe composition", timing: "0.4s" },
      { id: "v2", stage: "Motion Plan", detail: "Computed steady aerial dolly & water shimmer", timing: "0.8s" },
      { id: "v3", stage: "LTX-13B Worker", detail: "Synthesizing 121 frames @ 720p · 24 fps", timing: "2.1s" },
      { id: "v4", stage: "Stream Ready", detail: "Encoded MP4 delivered · $2.00 / render", timing: "0.4s" },
    ],
    outputLabel: "LTX-13B · 16:9 PREVIEW",
    outputBadge: "720P · 24 FPS",
    traceClass: "gyra-trace-pulse-delay-2",
  },
  {
    id: "api",
    index: "04",
    name: "Gyra API",
    shortLabel: "API",
    engineTag: "OpenAI-Compat REST v1",
    summary: "Drop-in chat, voice, video queues, and media extraction.",
    metricTag: "SCOPED KEYS · SSE",
    sectionHref: "#developers",
    sectionCta: "Jump to API Console",
    appRoute: "/api",
    appCta: "Explore API Platform",
    inputLabel: "HTTP REQUEST",
    inputMeta: "POST /api/v1/chat",
    inputBody:
      `POST https://gyra.ng/api/v1/chat\nAuthorization: Bearer $GYRA_API_KEY\n{ "model": "gyra-super2.0", "stream": false }`,
    pipelineTitle: "GATEWAY ROUTING TRACE",
    steps: [
      { id: "a1", stage: "Key Scope Auth", detail: "Verified bearer token & category permissions", timing: "18ms" },
      { id: "a2", stage: "Quota Guard", detail: "Rate limit & transparent credit wallet ok", timing: "24ms" },
      { id: "a3", stage: "Core Dispatch", detail: "Routed payload to gyra-super2.0 cluster", timing: "310ms" },
      { id: "a4", stage: "200 OK JSON", detail: "Returned OpenAI-compatible completion body", timing: "58ms" },
    ],
    outputLabel: "POST /api/v1/chat",
    outputBadge: "200 OK · JSON",
    traceClass: "gyra-trace-pulse-delay-3",
  },
];

const CAPABILITY_STRIP = [
  "GYRA 1.0 & SUPER 2.0",
  "6-AGENT PIPELINE",
  "PRO ULTRA IMAGE EDIT",
  "LTX-VIDEO 720P STUDIO",
  "OPENAI-COMPAT V1 API",
  "WEB · MOBILE · TELEGRAM",
];

function BranchIcon({ id, className }: { id: BranchId; className?: string }) {
  switch (id) {
    case "chat":
      return <MessageSquare className={className} />;
    case "image":
      return <ImageIcon className={className} />;
    case "video":
      return <Film className={className} />;
    case "api":
      return <Terminal className={className} />;
  }
}

export function HeroWorkbench({
  isAuthenticated = false,
  routeBase = "",
}: HeroWorkbenchProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<BranchId | null>(null);
  const [hoveredBranchId, setHoveredBranchId] = useState<BranchId | null>(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [runNonce, setRunNonce] = useState(0);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const selectedBranch = selectedBranchId
    ? BRANCHES.find((b) => b.id === selectedBranchId) ?? null
    : null;

  // Allow Escape key to cleanly return from any inspected branch back to the full tree
  useEffect(() => {
    if (!selectedBranchId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedBranchId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedBranchId]);

  // Step through the selected branch's live execution flow cleanly once, then hold in COMPLETED state (never auto-skipping)
  useEffect(() => {
    if (!selectedBranch) {
      setCompletedSteps(0);
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setCompletedSteps(selectedBranch.steps.length);
      return;
    }

    setCompletedSteps(1);
    let current = 1;
    const timer = window.setInterval(() => {
      current += 1;
      if (current <= selectedBranch.steps.length) {
        setCompletedSteps(current);
      } else {
        window.clearInterval(timer);
      }
    }, 420);

    return () => window.clearInterval(timer);
  }, [selectedBranch, runNonce]);

  const ensureStageVisible = () => {
    if (!stageRef.current || typeof window === "undefined") return;
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.top < 76 || rect.top > window.innerHeight * 0.55) {
      stageRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const openBranch = (id: BranchId) => {
    setSelectedBranchId(id);
    setHoveredBranchId(null);
    setRunNonce((n) => n + 1);
    window.requestAnimationFrame(ensureStageVisible);
  };

  const backToTree = () => {
    setSelectedBranchId(null);
    setHoveredBranchId(null);
    window.requestAnimationFrame(ensureStageVisible);
  };

  const replayFlow = () => {
    setRunNonce((n) => n + 1);
  };

  const copyQuickCurl = async () => {
    const cmd = `curl -X POST https://gyra.ng/api/v1/chat -H "Authorization: Bearer $GYRA_API_KEY" -H "Content-Type: application/json" -d '{"model":"gyra-super2.0","messages":[{"role":"user","content":"Hello Gyra"}]}'`;
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      // Clipboard fallback ignored in restricted frames
    }
    setCopiedCmd(true);
    window.setTimeout(() => setCopiedCmd(false), 1800);
  };

  // Exact SVG X centers for the 4 equal border-collapsed columns (12.5%, 37.5%, 62.5%, 87.5% of 1200)
  const branchCoords: Record<BranchId, number> = {
    chat: 150,
    image: 450,
    video: 750,
    api: 1050,
  };

  const isFlowComplete = selectedBranch
    ? completedSteps >= selectedBranch.steps.length
    : false;

  return (
    <section className="border-b border-[#1F1F1F] bg-black">
      <div className="mx-auto max-w-[1380px] px-5 pb-10 pt-8 sm:px-8 lg:pb-12 lg:pt-9">
        {/* 1. Centered Hero Header & Primary Start / Explore Actions */}
        <div className="mx-auto flex max-w-[820px] flex-col items-center text-center">
          <h1 className="font-display text-[clamp(2.65rem,4.9vw,4.15rem)] font-bold leading-[0.93] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
            One intelligence.
            <br />
            Every medium.
          </h1>

          <p className="mt-3.5 max-w-[58ch] text-[14.5px] leading-[1.55] text-[#A3A3A3] sm:text-[16px]">
            Gyra unites conversational reasoning, precision image generation and editing,
            cinematic video studio workflows, and OpenAI-compatible APIs on one engineered
            platform.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href={resolveGyraRoute("/dashboard", routeBase)}
              className="font-mono-tech inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap bg-[#FF3D00] px-6 text-[12px] font-medium tracking-[0.1em] text-white uppercase transition-colors duration-150 hover:bg-[#FF551F] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              {isAuthenticated ? "Open Dashboard" : "Start with Gyra"}
            </a>
            <a
              href={resolveGyraRoute("/api", routeBase)}
              className="font-mono-tech inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap border border-[#3A3A3A] bg-black px-6 text-[12px] font-medium tracking-[0.1em] text-white uppercase transition-colors duration-150 hover:border-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00]"
            >
              Explore API
            </a>
            <button
              type="button"
              onClick={copyQuickCurl}
              className="font-mono-tech inline-flex min-h-[42px] items-center gap-2 border border-[#1F1F1F] bg-[#060606] px-4 text-[11px] tracking-[0.08em] text-[#8E8E8E] uppercase transition-colors hover:border-[#3A3A3A] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00]"
            >
              {copiedCmd ? (
                <Check className="h-3.5 w-3.5 text-[#FF3D00]" />
              ) : (
                <Terminal className="h-3.5 w-3.5 text-[#7A7A7A]" />
              )}
              <span>{copiedCmd ? "Copied cURL" : "POST /api/v1/chat"}</span>
              <Copy className="h-3 w-3 opacity-60" />
            </button>
          </div>
        </div>

        {/* 2. Centerpiece Digital Intelligence Flow Tree (Genvia AI -> Gyra Core -> 4 Separate Interactive Branches) */}
        <div
          ref={stageRef}
          className="mt-7 scroll-mt-20 border border-[#1F1F1F] bg-[#020202] sm:mt-8"
        >
          {selectedBranch === null ? (
            /* ==================== STATE A: LIVE INTERACTIVE TREE OVERVIEW ==================== */
            <div className="relative pt-5 sm:pt-6">
              {/* Top Telemetry Corner Labels */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3.5 sm:px-7">
                <span className="font-mono-tech text-[10px] tracking-[0.14em] text-[#737373] uppercase">
                  [ LIVE INTELLIGENCE ARCHITECTURE ]
                </span>
                <span className="font-mono-tech text-[10px] tracking-[0.12em] text-[#A3A3A3] uppercase">
                  CLICK ANY BRANCH TO INSPECT LIVE FLOW
                </span>
              </div>

              {/* Root Node: Genvia AI Company (Centered) */}
              <div className="flex flex-col items-center px-5">
                <div className="relative flex items-center gap-2.5 border border-[#2C2C2C] bg-black px-4 py-1.5">
                  <span className="h-1.5 w-1.5 bg-[#FF3D00]" aria-hidden="true" />
                  <span className="font-mono-tech text-[11px] font-medium tracking-[0.18em] text-white uppercase">
                    Genvia AI Company
                  </span>
                  <span className="hidden font-mono-tech text-[10px] tracking-[0.12em] text-[#666666] uppercase sm:inline">
                    · ECOSYSTEM ROOT
                  </span>
                  <span className="pointer-events-none absolute -left-px -top-px h-2 w-2 border-l border-t border-[#FF3D00]" />
                  <span className="pointer-events-none absolute -bottom-px -right-px h-2 w-2 border-b border-r border-[#FF3D00]" />
                </div>

                {/* Animated Digital Trunk Stem (Genvia AI -> Gyra Core) */}
                <div className="relative h-6 w-6" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-full w-full overflow-visible">
                    <line x1="12" y1="0" x2="12" y2="24" stroke="#262626" strokeWidth="1.5" />
                    <line
                      x1="12"
                      y1="0"
                      x2="12"
                      y2="24"
                      stroke="#FF3D00"
                      strokeWidth="1.75"
                      className="gyra-trace-pulse"
                    />
                    <rect x="9.5" y="21" width="5" height="5" fill="#FF3D00" />
                  </svg>
                </div>

                {/* Central Hub: GYRA Intelligence Core */}
                <div className="relative w-full max-w-[680px] border border-[#303030] bg-[#060606]">
                  <div className="h-[2px] w-full bg-[#FF3D00]" aria-hidden="true" />

                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center border border-[#FF3D00]/50 bg-[#FF3D00]/10 text-[#FF3D00]">
                        <Cpu className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex flex-wrap items-baseline gap-2 text-left">
                        <span className="font-display text-[20px] font-bold leading-none tracking-[0.04em] text-white uppercase">
                          GYRA
                        </span>
                        <span className="font-mono-tech text-[10px] tracking-[0.14em] text-[#8E8E8E] uppercase">
                          INTELLIGENCE CORE
                        </span>
                      </div>
                    </div>

                    <span className="font-mono-tech border border-[#262626] bg-black px-2 py-0.5 text-[10px] tracking-[0.12em] text-[#FF3D00] uppercase">
                      4 SEPARATE ENGINES
                    </span>
                  </div>

                  {/* Internal 3-Chamber Intelligent Flow Strip */}
                  <div className="grid grid-cols-1 divide-y divide-[#181818] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <div className="px-3.5 py-2 text-left">
                      <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#FF3D00] uppercase">
                        01 · Understand
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-[#A3A3A3]">
                        Prompts, files, frames & payloads
                      </p>
                    </div>
                    <div className="px-3.5 py-2 text-left">
                      <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#FF3D00] uppercase">
                        02 · Plan & Route
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-[#A3A3A3]">
                        Selects agent, model, or media queue
                      </p>
                    </div>
                    <div className="px-3.5 py-2 text-left">
                      <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#FF3D00] uppercase">
                        03 · Execute
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-[#A3A3A3]">
                        Streams verified code, media, or JSON
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DESKTOP: Orthogonal 4-Branch Digital Circuit Tree SVG */}
              <div className="hidden md:block">
                <div className="relative h-[56px] w-full" aria-hidden="true">
                  <svg
                    viewBox="0 0 1200 56"
                    preserveAspectRatio="none"
                    className="h-full w-full"
                  >
                    {/* Base dark circuit bus lines */}
                    <path
                      d="M 600 0 L 600 28"
                      fill="none"
                      stroke="#2B2B2B"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d="M 150 28 L 1050 28"
                      fill="none"
                      stroke="#2B2B2B"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                    {BRANCHES.map((branch) => {
                      const x = branchCoords[branch.id];
                      const isHovered = hoveredBranchId === branch.id;
                      const pathD = `M 600 0 L 600 28 L ${x} 28 L ${x} 56`;
                      return (
                        <g key={branch.id}>
                          <path
                            d={`M ${x} 28 L ${x} 56`}
                            fill="none"
                            stroke="#2B2B2B"
                            strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                          />
                          {isHovered && (
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#FF3D00"
                              strokeWidth="2"
                              vectorEffect="non-scaling-stroke"
                            />
                          )}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#FF3D00"
                            strokeWidth={isHovered ? "2.4" : "1.75"}
                            strokeOpacity={hoveredBranchId && !isHovered ? "0.25" : "0.95"}
                            vectorEffect="non-scaling-stroke"
                            className={branch.traceClass}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Crisp non-stretched junction squares at exact percentages */}
                  <span
                    className="pointer-events-none absolute left-1/2 top-[25px] h-1.5 w-1.5 -translate-x-1/2 bg-[#FF3D00]"
                  />
                  {[12.5, 37.5, 62.5, 87.5].map((pct, idx) => {
                    const branch = BRANCHES[idx];
                    const isHovered = hoveredBranchId === branch.id;
                    return (
                      <span
                        key={branch.id}
                        style={{ left: `${pct}%` }}
                        className={`pointer-events-none absolute bottom-[-3px] h-2 w-2 -translate-x-1/2 border transition-colors ${
                          isHovered
                            ? "border-[#FF3D00] bg-[#FF3D00]"
                            : "border-[#FF3D00]/80 bg-black"
                        }`}
                      />
                    );
                  })}
                </div>

                {/* 4 Separate Desktop Interactive Branch Modules (Border-Collapsed Industrial Grid) */}
                <div className="grid grid-cols-4 divide-x divide-[#1F1F1F] border-t border-[#1F1F1F]">
                  {BRANCHES.map((branch) => {
                    const isHovered = hoveredBranchId === branch.id;
                    return (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => openBranch(branch.id)}
                        onMouseEnter={() => setHoveredBranchId(branch.id)}
                        onMouseLeave={() => setHoveredBranchId(null)}
                        onFocus={() => setHoveredBranchId(branch.id)}
                        onBlur={() => setHoveredBranchId(null)}
                        className={`group flex flex-col justify-between p-5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#FF3D00] ${
                          isHovered ? "bg-[#090909]" : "bg-black hover:bg-[#080808]"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono-tech text-[11px] tracking-[0.14em] text-[#FF3D00]">
                              {branch.index}
                            </span>
                            <span
                              className={`flex h-7 w-7 items-center justify-center border transition-colors ${
                                isHovered
                                  ? "border-[#FF3D00] bg-[#FF3D00] text-white"
                                  : "border-[#262626] bg-[#060606] text-[#B3B3B3]"
                              }`}
                            >
                              <BranchIcon id={branch.id} className="h-3.5 w-3.5" />
                            </span>
                          </div>

                          <h2 className="font-display mt-3.5 text-[25px] font-bold leading-none tracking-[-0.01em] text-white uppercase">
                            {branch.name}
                          </h2>

                          <p className="mt-1 font-mono-tech text-[10.5px] tracking-[0.06em] text-[#8E8E8E]">
                            {branch.engineTag}
                          </p>

                          <p className="mt-2.5 text-[13px] leading-[1.5] text-[#A3A3A3]">
                            {branch.summary}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-[#181818] pt-3 font-mono-tech text-[10.5px] tracking-[0.1em] uppercase">
                          <span className="text-[#737373] transition-colors group-hover:text-white">
                            Inspect Flow
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-[#FF3D00] transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MOBILE: Native Vertical Digital Spine & Branching Cards (< 768px) */}
              <div className="px-5 pb-6 pt-5 md:hidden">
                <div className="relative pl-7">
                  {/* Continuous vertical digital bus spine */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-6 left-[7px] top-0 w-[2px] overflow-hidden bg-[#262626]"
                  >
                    <div className="gyra-spine-pulse h-20 w-full bg-gradient-to-b from-transparent via-[#FF3D00] to-transparent" />
                  </div>

                  <div className="space-y-3">
                    {BRANCHES.map((branch) => (
                      <div key={branch.id} className="relative">
                        {/* Horizontal PCB tap from spine to card */}
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -left-[21px] top-1/2 h-[2px] w-[21px] -translate-y-1/2 bg-[#2B2B2B]"
                        />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute -left-[24px] top-1/2 h-2 w-2 -translate-y-1/2 border border-[#FF3D00] bg-black"
                        />

                        <button
                          type="button"
                          onClick={() => openBranch(branch.id)}
                          className="group flex w-full items-center justify-between gap-3 border border-[#242424] bg-black p-4 text-left transition-colors active:bg-[#0D0D0D] hover:border-[#FF3D00]/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00]"
                        >
                          <div className="flex items-start gap-3.5">
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-[#2A2A2A] bg-[#070707] text-[#FF3D00]">
                              <BranchIcon id={branch.id} className="h-4 w-4" />
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono-tech text-[10px] tracking-[0.12em] text-[#FF3D00]">
                                  {branch.index}
                                </span>
                                <span className="font-display text-[22px] font-bold leading-none text-white uppercase">
                                  {branch.name}
                                </span>
                              </div>
                              <p className="mt-1 font-mono-tech text-[10px] tracking-[0.06em] text-[#8A8A8A]">
                                {branch.engineTag}
                              </p>
                              <p className="mt-1.5 text-[13px] leading-[1.45] text-[#A3A3A3]">
                                {branch.summary}
                              </p>
                            </div>
                          </div>

                          <ChevronRight className="h-4 w-4 shrink-0 text-[#FF3D00]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ==================== STATE B: FOCUSED BRANCH LIVE FLOW (WITH BACK TO TREE) ==================== */
            <div className="bg-black">
              {/* Top Interactive Navigation & Breadcrumb Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F1F1F] bg-[#050505] px-4 py-3.5 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={backToTree}
                    className="font-mono-tech inline-flex min-h-[36px] items-center gap-2 border border-[#333333] bg-black px-3.5 text-[11px] font-medium tracking-[0.1em] text-white uppercase transition-colors hover:border-[#FF3D00] hover:text-[#FF3D00] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Tree</span>
                  </button>

                  <div className="hidden items-center gap-2 font-mono-tech text-[11px] tracking-[0.1em] uppercase sm:flex">
                    <span className="text-[#6E6E6E]">Genvia AI</span>
                    <ChevronRight className="h-3 w-3 text-[#444444]" />
                    <span className="text-[#999999]">Gyra Core</span>
                    <ChevronRight className="h-3 w-3 text-[#444444]" />
                    <span className="text-[#FF3D00]">{selectedBranch.name}</span>
                  </div>
                </div>

                {/* Sibling Branch Switcher + Replay */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <div
                    role="tablist"
                    aria-label="Switch Gyra branch"
                    className="flex items-center border border-[#222222] bg-black p-0.5"
                  >
                    {BRANCHES.map((branch) => {
                      const active = branch.id === selectedBranch.id;
                      return (
                        <button
                          key={branch.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => openBranch(branch.id)}
                          className={`font-mono-tech px-2.5 py-1.5 text-[10px] tracking-[0.1em] uppercase transition-colors ${
                            active
                              ? "bg-[#FF3D00] text-white"
                              : "text-[#808080] hover:text-white"
                          }`}
                        >
                          {branch.shortLabel}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={replayFlow}
                    aria-label="Replay execution flow"
                    className="font-mono-tech inline-flex min-h-[32px] items-center gap-1.5 border border-[#262626] bg-black px-3 text-[10px] tracking-[0.1em] text-[#CCCCCC] uppercase transition-colors hover:border-[#FF3D00] hover:text-white"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span className="hidden sm:inline">Replay</span>
                  </button>
                </div>
              </div>

              {/* 3-Stage Live Flow Body: Input -> Gyra Core Processing -> Live Output */}
              <div className="grid grid-cols-1 divide-y divide-[#1F1F1F] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
                {/* Stage 01: Input Request (3 cols) */}
                <div className="flex flex-col justify-between bg-[#030303] p-5 sm:p-6 lg:col-span-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tech text-[10px] tracking-[0.14em] text-[#FF3D00] uppercase">
                        01 · {selectedBranch.inputLabel}
                      </span>
                    </div>

                    <div className="mt-4 border border-[#242424] bg-black p-4">
                      <div className="flex items-center justify-between border-b border-[#181818] pb-2 font-mono-tech text-[10px] text-[#7A7A7A]">
                        <span>{selectedBranch.name}</span>
                        <span className="text-[#CCCCCC]">{selectedBranch.inputMeta}</span>
                      </div>
                      <p className="mt-3 whitespace-pre-line font-mono-tech text-[12px] leading-[1.65] text-[#D4D4D4]">
                        {selectedBranch.inputBody}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-[#181818] pt-4">
                    <p className="font-mono-tech text-[10px] tracking-[0.1em] text-[#6E6E6E] uppercase">
                      ENGINE TARGET
                    </p>
                    <p className="mt-1 font-mono-tech text-[12px] text-white">
                      {selectedBranch.engineTag}
                    </p>
                  </div>
                </div>

                {/* Stage 02: Gyra Core Execution Trace (4 cols) */}
                <div className="flex flex-col justify-between bg-black p-5 sm:p-6 lg:col-span-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tech text-[10px] tracking-[0.14em] text-[#FF3D00] uppercase">
                        02 · {selectedBranch.pipelineTitle}
                      </span>
                      <span className="font-mono-tech text-[10px] tracking-[0.1em] text-[#8A8A8A] uppercase">
                        {isFlowComplete ? "COMPLETED" : "ROUTING..."}
                      </span>
                    </div>

                    <ol className="mt-4 space-y-2.5">
                      {selectedBranch.steps.map((step, idx) => {
                        const reached = idx < completedSteps;
                        const isActiveStep = idx === completedSteps - 1 && !isFlowComplete;
                        return (
                          <li
                            key={step.id}
                            className={`border p-3 transition-colors duration-200 ${
                              reached
                                ? isActiveStep
                                  ? "border-[#FF3D00] bg-[#0B0605]"
                                  : "border-[#262626] bg-[#060606]"
                                : "border-[#151515] bg-black opacity-45"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-mono-tech text-[11px] ${
                                    reached ? "text-[#FF3D00]" : "text-[#555555]"
                                  }`}
                                >
                                  {reached ? "✓" : `0${idx + 1}`}
                                </span>
                                <span className="font-mono-tech text-[11px] font-medium tracking-[0.06em] text-white uppercase">
                                  {step.stage}
                                </span>
                              </div>
                              <span className="font-mono-tech text-[10px] text-[#7A7A7A]">
                                {step.timing}
                              </span>
                            </div>
                            <p className="mt-1.5 pl-5 text-[12.5px] leading-[1.45] text-[#A3A3A3]">
                              {step.detail}
                              {isActiveStep && (
                                <span className="gyra-cursor ml-1.5" aria-hidden="true" />
                              )}
                            </p>
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[#181818] pt-3.5 font-mono-tech text-[10px] tracking-[0.1em] uppercase">
                    <span className="text-[#737373]">FLOW STATUS</span>
                    <span className="text-[#FF3D00]">
                      {isFlowComplete ? "VERIFIED OUTPUT READY" : "EXECUTING STAGE"}
                    </span>
                  </div>
                </div>

                {/* Stage 03: Live Artifact Output (5 cols) */}
                <div className="flex flex-col justify-between bg-[#030303] p-5 sm:p-6 lg:col-span-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tech text-[10px] tracking-[0.14em] text-[#FF3D00] uppercase">
                        03 · LIVE OUTPUT
                      </span>
                      <span className="font-mono-tech border border-[#262626] bg-black px-2 py-0.5 text-[10px] tracking-[0.1em] text-white uppercase">
                        {selectedBranch.outputBadge}
                      </span>
                    </div>

                    <div className="mt-4">
                      {selectedBranch.id === "chat" && (
                        <div className="relative border border-[#262626] bg-black">
                          <div className="flex items-center justify-between border-b border-[#1A1A1A] px-3.5 py-2 font-mono-tech text-[10px]">
                            <span className="text-[#D4D4D4]">{selectedBranch.outputLabel}</span>
                            <span className="text-[#FF3D00]">TYPESCRIPT · STRICT</span>
                          </div>
                          <pre className="overflow-x-auto px-4 py-3.5 font-mono-tech text-[11px] leading-[1.6] text-[#C8C8C8]">
                            <code>{`export async function POST(req: Request) {
  const sig = req.headers.get("x-hmac-256");
  const raw = await req.text();
  const mac = createHmac("sha256", SECRET)
    .update(raw).digest();
  if (!timingSafeEqual(buf(sig), mac)) {
    return Response.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }
  return Response.json({ ok: true });
}`}</code>
                          </pre>
                          <div
                            aria-hidden="true"
                            className="gyra-dither-sweep gyra-scan-motion pointer-events-none absolute inset-y-0 w-20"
                          />
                        </div>
                      )}

                      {selectedBranch.id === "image" && (
                        <div className="relative aspect-[4/3] w-full overflow-hidden border border-[#262626] bg-black">
                          <img
                            src="/showcase/edit-after.jpg"
                            alt="Gyra Pro Ultra tungsten dusk studio edit"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                          <div
                            className="absolute inset-0 overflow-hidden"
                            style={{ clipPath: "inset(0 52% 0 0)" }}
                          >
                            <img
                              src="/showcase/edit-before.jpg"
                              alt="Original overcast daylight studio"
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-[48%] w-[2px] bg-[#FF3D00]"
                          />
                          <div
                            aria-hidden="true"
                            className="gyra-dither-sweep pointer-events-none absolute inset-y-0 left-[48%] w-16 opacity-80"
                          />
                          <span className="font-mono-tech absolute bottom-2.5 left-2.5 bg-black/90 px-2 py-0.5 text-[10px] text-[#CCCCCC] uppercase">
                            Original
                          </span>
                          <span className="font-mono-tech absolute bottom-2.5 right-2.5 bg-[#FF3D00] px-2 py-0.5 text-[10px] font-medium text-white uppercase">
                            Pro Ultra
                          </span>
                        </div>
                      )}

                      {selectedBranch.id === "video" && (
                        <div className="relative aspect-[16/10] w-full overflow-hidden border border-[#262626] bg-black">
                          <video
                            src="/products-hero-bg.mp4"
                            poster="/products-hero-poster.jpg"
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="h-full w-full object-cover"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />
                          <span className="font-mono-tech absolute left-2.5 top-2.5 border border-[#FF3D00]/70 bg-black/85 px-2 py-0.5 text-[10px] text-white uppercase">
                            {selectedBranch.outputLabel}
                          </span>
                          <div className="font-mono-tech absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-[#D4D4D4]">
                            <span>720P · 24 FPS · 121 FRAMES</span>
                            <span className="text-[#FF3D00]">GYRA STUDIO</span>
                          </div>
                        </div>
                      )}

                      {selectedBranch.id === "api" && (
                        <div className="relative border border-[#262626] bg-black">
                          <div className="flex items-center justify-between border-b border-[#1A1A1A] px-3.5 py-2 font-mono-tech text-[10px]">
                            <span className="text-white">{selectedBranch.outputLabel}</span>
                            <span className="text-[#FF3D00]">410MS · 200 OK</span>
                          </div>
                          <pre className="overflow-x-auto px-4 py-3.5 font-mono-tech text-[11px] leading-[1.6] text-[#C8C8C8]">
                            <code>{`{
  "id": "chatcmpl-gyra-9041",
  "object": "chat.completion",
  "model": "gyra-super2.0",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Idempotency key verified..."
    },
    "finish_reason": "stop"
  }]
}`}</code>
                          </pre>
                          <div
                            aria-hidden="true"
                            className="gyra-dither-sweep gyra-scan-motion pointer-events-none absolute inset-y-0 w-20"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Direct Branch Actions */}
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#181818] pt-4">
                    <a
                      href={selectedBranch.sectionHref}
                      className="font-mono-tech inline-flex items-center gap-1.5 text-[11px] tracking-[0.1em] text-[#A3A3A3] uppercase transition-colors hover:text-white"
                    >
                      <span>{selectedBranch.sectionCta}</span>
                      <ArrowDown className="h-3.5 w-3.5 text-[#FF3D00]" />
                    </a>

                    <a
                      href={resolveGyraRoute(selectedBranch.appRoute, routeBase)}
                      className="font-mono-tech inline-flex items-center gap-1.5 border border-[#FF3D00] bg-[#FF3D00] px-4 py-2 text-[11px] font-medium tracking-[0.1em] text-white uppercase transition-colors hover:bg-[#FF551F]"
                    >
                      <span>{selectedBranch.appCta}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Width Architectural Capability Ledger Strip */}
      <div className="border-t border-[#1F1F1F] bg-black">
        <div className="mx-auto max-w-[1380px] px-5 py-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            {CAPABILITY_STRIP.map((item) => (
              <div
                key={item}
                className="font-mono-tech flex shrink-0 items-center gap-2 whitespace-nowrap text-[11px] tracking-[0.09em] text-[#8E8E8E]"
              >
                <span className="h-1.5 w-1.5 shrink-0 bg-[#FF3D00]" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
