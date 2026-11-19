"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Cpu,
  Film,
  Image as ImageIcon,
  MessageSquare,
  RotateCcw,
  Terminal,
  X,
} from "lucide-react";
import { resolveGyraRoute } from "../../lib/landingSimulations";

export interface HeroWorkbenchProps {
  isAuthenticated?: boolean;
  routeBase?: string;
}

type BranchId = "chat" | "image" | "video" | "api";
type ExecutionStatus = "idle" | "active" | "processing" | "completed" | "failed";
type PipelineStageId = "understand" | "orchestrate" | "execute";

interface ConsoleEvent {
  stage: PipelineStageId;
  tag: string;
  message: string;
}

interface BranchArchitecture {
  id: BranchId;
  index: string;
  name: string;
  shortLabel: string;
  role: string;
  summary: string;
  subEngines: string[];
  capabilities: string[];
  routePath: string;
  sectionHref: string;
  sectionLabel: string;
  appHref: string;
  appLabel: string;
  requestSample: string;
  successEvents: ConsoleEvent[];
  successSummary: string;
  failureStage: PipelineStageId;
  failureEvents: ConsoleEvent[];
  failureSummary: string;
  traceClass: string;
}

const PIPELINE_STAGES: { id: PipelineStageId; num: string; label: string; caption: string }[] = [
  { id: "understand", num: "01", label: "Understand", caption: "Parse prompt, files & auth" },
  { id: "orchestrate", num: "02", label: "Orchestrate", caption: "Route engines & guardrails" },
  { id: "execute", num: "03", label: "Execute", caption: "Run models & stream output" },
];

const BRANCHES: BranchArchitecture[] = [
  {
    id: "chat",
    index: "01",
    name: "Gyra Chat",
    shortLabel: "Chat",
    role: "Reasoning & Agents",
    summary: "Conversational intelligence with Gyra 1.0, SuperGyra 2.0, and a 6-agent build pipeline.",
    subEngines: [
      "Gyra 1.0 (Fast Inference)",
      "SuperGyra 2.0 (Deep Reasoning)",
      "6-Agent Pipeline (Atlas → Mentor)",
    ],
    capabilities: ["Web Search", "PDF & File RAG", "Vision Analysis", "Voice Mode"],
    routePath: "/dashboard · /api/v1/chat",
    sectionHref: "#chat",
    sectionLabel: "Chat Workbench",
    appHref: "/dashboard",
    appLabel: "Open Gyra Chat",
    requestSample:
      "Build a TypeScript webhook POST handler with HMAC-SHA256 verification and replay protection.",
    successEvents: [
      {
        stage: "understand",
        tag: "UNDERSTAND",
        message: "Classified multi-step engineering prompt; attached strict TypeScript constraint.",
      },
      {
        stage: "orchestrate",
        tag: "ORCHESTRATE",
        message: "Selected SuperGyra 2.0 + 6-agent graph (Atlas → Orion → Architect → Forge → Sentinel → Mentor).",
      },
      {
        stage: "execute",
        tag: "EXECUTE",
        message: "Forge drafted App Router POST handler; Sentinel verified timingSafeEqual & timestamp window.",
      },
    ],
    successSummary: "Verified webhook-handler.ts delivered to workspace stream.",
    failureStage: "orchestrate",
    failureEvents: [
      {
        stage: "understand",
        tag: "UNDERSTAND",
        message: "Parsed incoming prompt payload for /api/v1/chat session.",
      },
      {
        stage: "orchestrate",
        tag: "GUARDRAIL HALT",
        message: "Free-tier thread limit (20 messages/thread) reached — halted cleanly before dispatch.",
      },
    ],
    failureSummary: "HTTP 429 quota guard triggered; retryable after new thread or SuperGyra upgrade.",
    traceClass: "gyra-trace-pulse",
  },
  {
    id: "image",
    index: "02",
    name: "Gyra Image",
    shortLabel: "Image",
    role: "Synthesis & I2I Edit",
    summary: "Text-to-image synthesis via Flux Dev and geometry-locked editing via Gyra Pro Ultra.",
    subEngines: ["Flux Dev (Text-to-Image)", "Gyra Pro Ultra (Image-to-Image)", "Spatial Lock Pass"],
    capabilities: ["Lighting Relight", "UI & Scene Edits", "Geometry Preservation", "High-Res Output"],
    routePath: "/dashboard · Image Tools",
    sectionHref: "#image",
    sectionLabel: "Image Darkroom",
    appHref: "/dashboard",
    appLabel: "Create with Gyra Image",
    requestSample:
      "Relight uploaded studio scene to blue-hour dusk with 2700K tungsten desk lamp falloff — lock geometry.",
    successEvents: [
      {
        stage: "understand",
        tag: "UNDERSTAND",
        message: "Loaded source frame (1440×1080) and extracted relighting instruction constraints.",
      },
      {
        stage: "orchestrate",
        tag: "ORCHESTRATE",
        message: "Routed request to Gyra Pro Ultra I2I pipeline with structural geometry lock enabled.",
      },
      {
        stage: "execute",
        tag: "EXECUTE",
        message: "Completed tungsten dusk relight pass while preserving original architecture & framing.",
      },
    ],
    successSummary: "Geometry-locked Gyra Pro Ultra frame rendered cleanly.",
    failureStage: "understand",
    failureEvents: [
      {
        stage: "understand",
        tag: "VALIDATION HALT",
        message: "Unsupported or corrupted reference image payload rejected at input sanitizer.",
      },
    ],
    failureSummary: "Input validation failed before GPU dispatch; no generation credits deducted.",
    traceClass: "gyra-trace-pulse-delay-1",
  },
  {
    id: "video",
    index: "03",
    name: "Gyra Video",
    shortLabel: "Video",
    role: "Cinematic Motion",
    summary: "Text-to-video and image-to-video 720p, 24 fps clips queued inside Gyra Studio.",
    subEngines: ["LTX-Video 13B", "Reference Frame Encoder", "Async Studio Render Queue"],
    capabilities: ["Text-to-Video", "Image-to-Video", "16:9 & 9:16", "720p · 24 fps · 121f"],
    routePath: "/studio · /api/v1/video/generate",
    sectionHref: "#video",
    sectionLabel: "Video Studio",
    appHref: "/studio",
    appLabel: "Open Gyra Studio",
    requestSample:
      "Slow aerial glide over a twilight lagoon bridge from attached Reference Frame 001 (16:9, 5s).",
    successEvents: [
      {
        stage: "understand",
        tag: "UNDERSTAND",
        message: "Verified motion prompt, Reference Frame 001, and 16:9 aspect ratio configuration.",
      },
      {
        stage: "orchestrate",
        tag: "ORCHESTRATE",
        message: "Verified SuperGyra studio wallet ($2.00/render) and enqueued async LTX-Video 13B job.",
      },
      {
        stage: "execute",
        tag: "EXECUTE",
        message: "Synthesized 121-frame 720p @ 24 fps clip and registered output in Studio History.",
      },
    ],
    successSummary: "Async MP4 job completed and stored in /api/v1/video/history.",
    failureStage: "execute",
    failureEvents: [
      {
        stage: "understand",
        tag: "UNDERSTAND",
        message: "Validated motion brief and 16:9 render parameters.",
      },
      {
        stage: "orchestrate",
        tag: "ORCHESTRATE",
        message: "Dispatched job to async Studio worker via authenticated proxy.",
      },
      {
        stage: "execute",
        tag: "WORKER HALT",
        message: "Upstream render timeout detected — job marked failed and wallet charge rolled back.",
      },
    ],
    failureSummary: "Worker failure isolated safely; job status set to failed with zero charge.",
    traceClass: "gyra-trace-pulse-delay-2",
  },
  {
    id: "api",
    index: "04",
    name: "Gyra API",
    shortLabel: "API",
    role: "Developer Platform",
    summary: "OpenAI-compatible REST chat, async video queues, voice synthesis, and media extraction.",
    subEngines: ["OpenAI-Compat REST Gateway", "Scoped API Key Auth", "Media Extraction Workers"],
    capabilities: ["/api/v1/chat", "/api/v1/video/generate", "/api/v1/transcribe", "YouTube & TikTok API"],
    routePath: "https://gyra.ng/api/v1/*",
    sectionHref: "#developers",
    sectionLabel: "API Console",
    appHref: "/api",
    appLabel: "Explore API Platform",
    requestSample:
      'POST /api/v1/chat · Authorization: Bearer $GYRA_API_KEY · { "model": "gyra-super2.0" }',
    successEvents: [
      {
        stage: "understand",
        tag: "UNDERSTAND",
        message: "Validated JSON schema and Bearer API key header at Gyra API gateway.",
      },
      {
        stage: "orchestrate",
        tag: "ORCHESTRATE",
        message: "Confirmed category scope, rate-limit bucket, and credit wallet balance.",
      },
      {
        stage: "execute",
        tag: "EXECUTE",
        message: "Dispatched completion to gyra-super2.0 and streamed OpenAI-compatible 200 OK JSON.",
      },
    ],
    successSummary: "OpenAI-compatible response returned with usage telemetry headers.",
    failureStage: "orchestrate",
    failureEvents: [
      {
        stage: "understand",
        tag: "UNDERSTAND",
        message: "Received POST /api/v1/chat request at gateway edge.",
      },
      {
        stage: "orchestrate",
        tag: "AUTH HALT",
        message: "HTTP 401 Unauthorized — Bearer key missing required 'chat' category scope.",
      },
    ],
    failureSummary: "Rejected cleanly at auth boundary before model invocation.",
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

function getStatusBadgeStyle(status: ExecutionStatus): string {
  switch (status) {
    case "idle":
      return "border-[#2A2A2A] bg-black text-[#8E8E8E]";
    case "active":
      return "border-[#5B9EC2] bg-[#1F5B7C]/20 text-[#9CC4DC]";
    case "processing":
      return "border-[#5B9EC2] bg-[#1F5B7C]/25 text-white";
    case "completed":
      return "border-[#10B981]/60 bg-[#10B981]/10 text-[#34D399]";
    case "failed":
      return "border-[#EF4444]/60 bg-[#EF4444]/10 text-[#F87171]";
  }
}

function getStatusLabel(status: ExecutionStatus): string {
  switch (status) {
    case "idle":
      return "IDLE";
    case "active":
      return "ACTIVE";
    case "processing":
      return "PROCESSING";
    case "completed":
      return "COMPLETED";
    case "failed":
      return "FAILED";
  }
}

export function HeroWorkbench({
  isAuthenticated = false,
  routeBase = "",
}: HeroWorkbenchProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<BranchId | null>(null);
  const [hoveredBranchId, setHoveredBranchId] = useState<BranchId | null>(null);
  const [status, setStatus] = useState<ExecutionStatus>("idle");
  const [activeStageIdx, setActiveStageIdx] = useState<number>(-1);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [runNonce, setRunNonce] = useState(0);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const selectedBranch = selectedBranchId
    ? BRANCHES.find((b) => b.id === selectedBranchId) ?? null
    : null;

  // Escape key cleanly collapses expanded branch back to Idle
  useEffect(() => {
    if (!selectedBranchId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedBranchId(null);
        setStatus("idle");
        setActiveStageIdx(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedBranchId]);

  // Deterministic progression through Active -> Processing (Understand -> Orchestrate -> Execute) -> Completed / Failed
  useEffect(() => {
    if (!selectedBranch) {
      setStatus("idle");
      setActiveStageIdx(-1);
      return;
    }

    const events = simulateFailure
      ? selectedBranch.failureEvents
      : selectedBranch.successEvents;
    const targetOutcome: ExecutionStatus = simulateFailure ? "failed" : "completed";

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setActiveStageIdx(events.length - 1);
      setStatus(targetOutcome);
      return;
    }

    setStatus("active");
    setActiveStageIdx(0);

    const timers: number[] = [];

    timers.push(
      window.setTimeout(() => {
        setStatus("processing");
      }, 220),
    );

    events.forEach((_, idx) => {
      if (idx === 0) return;
      timers.push(
        window.setTimeout(() => {
          setActiveStageIdx(idx);
        }, 220 + idx * 520),
      );
    });

    timers.push(
      window.setTimeout(() => {
        setStatus(targetOutcome);
      }, 220 + events.length * 520),
    );

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [selectedBranch, simulateFailure, runNonce]);

  const selectBranch = (id: BranchId) => {
    if (selectedBranchId === id) {
      setSelectedBranchId(null);
      setStatus("idle");
      setActiveStageIdx(-1);
      return;
    }
    setSelectedBranchId(id);
    setHoveredBranchId(null);
    setRunNonce((n) => n + 1);
  };

  const resetToIdle = () => {
    setSelectedBranchId(null);
    setHoveredBranchId(null);
    setStatus("idle");
    setActiveStageIdx(-1);
    setSimulateFailure(false);
  };

  const replayTrace = () => {
    if (!selectedBranchId) return;
    setRunNonce((n) => n + 1);
  };

  const toggleFailureSimulation = () => {
    setSimulateFailure((prev) => !prev);
    if (selectedBranchId) {
      setRunNonce((n) => n + 1);
    }
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

  const branchCoords: Record<BranchId, number> = {
    chat: 150,
    image: 450,
    video: 750,
    api: 1050,
  };

  // Compute state for each of the 3 core stages (Understand -> Orchestrate -> Execute)
  const getStageState = (stageIdx: number): ExecutionStatus => {
    if (!selectedBranch || status === "idle") return "idle";
    const events = simulateFailure
      ? selectedBranch.failureEvents
      : selectedBranch.successEvents;
    const lastReachedIdx = Math.min(activeStageIdx, events.length - 1);

    if (status === "failed") {
      if (stageIdx < events.length - 1) return "completed";
      if (stageIdx === events.length - 1) return "failed";
      return "idle";
    }
    if (status === "completed") {
      return "completed";
    }
    if (stageIdx < lastReachedIdx) return "completed";
    if (stageIdx === lastReachedIdx) return status === "active" ? "active" : "processing";
    return "idle";
  };

  // Active connector accent color matches current execution state
  const activeTraceColor =
    status === "completed"
      ? "#10B981"
      : status === "failed"
        ? "#EF4444"
        : "#5B9EC2";

  const activeEvents = selectedBranch
    ? (simulateFailure ? selectedBranch.failureEvents : selectedBranch.successEvents).slice(
        0,
        Math.max(0, activeStageIdx + 1),
      )
    : [];

  const renderBranchDetailsPanel = (branch: BranchArchitecture, compactMobile = false) => {
    const events = simulateFailure ? branch.failureEvents : branch.successEvents;
    const shownEvents = events.slice(0, Math.max(0, activeStageIdx + 1));

    return (
      <div
        ref={!compactMobile ? detailRef : undefined}
        className={`border-t bg-[#030303] ${
          status === "failed"
            ? "border-[#EF4444]/50"
            : status === "completed"
              ? "border-[#10B981]/45"
              : "border-[#5B9EC2]/50"
        }`}
      >
        <div
          className={`grid grid-cols-1 divide-y divide-[#1C1C1C] ${
            compactMobile ? "" : "lg:grid-cols-12 lg:divide-x lg:divide-y-0"
          }`}
        >
          {/* Left: Capabilities, Sub-Engines & Architecture Details */}
          <div className={`p-5 ${compactMobile ? "" : "lg:col-span-6 lg:p-6"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono-tech text-[11px] tracking-[0.14em] text-[#5B9EC2]">
                  {branch.index}
                </span>
                <h3 className="font-display text-[22px] font-bold leading-none text-white uppercase">
                  {branch.name}
                </h3>
                <span
                  className={`font-mono-tech border px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase ${getStatusBadgeStyle(
                    status,
                  )}`}
                >
                  {getStatusLabel(status)}
                </span>
              </div>

              <span className="font-mono-tech text-[10px] tracking-[0.08em] text-[#7A7A7A]">
                {branch.routePath}
              </span>
            </div>

            <p className="mt-2.5 text-[13.5px] leading-[1.55] text-[#A3A3A3]">{branch.summary}</p>

            {/* Sub-Engines */}
            <div className="mt-4">
              <p className="font-mono-tech text-[10px] tracking-[0.14em] text-[#6E6E6E] uppercase">
                Sub-Engines
              </p>
              <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                {branch.subEngines.map((engine) => (
                  <div
                    key={engine}
                    className="border border-[#1F1F1F] bg-black px-2.5 py-2 font-mono-tech text-[11px] leading-[1.35] text-[#D4D4D4]"
                  >
                    {engine}
                  </div>
                ))}
              </div>
            </div>

            {/* Capabilities */}
            <div className="mt-4">
              <p className="font-mono-tech text-[10px] tracking-[0.14em] text-[#6E6E6E] uppercase">
                Capabilities
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {branch.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="font-mono-tech border border-[#242424] bg-[#070707] px-2.5 py-1 text-[10.5px] text-[#B8B8B8]"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>

            {/* Compact Real Artifact Reference for Image & Video */}
            {branch.id === "image" && (
              <div className="mt-4 grid grid-cols-2 gap-2 border border-[#1E1E1E] bg-black p-2">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src="/showcase/edit-before.jpg"
                    alt="Original daylight architectural studio"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <span className="font-mono-tech absolute bottom-1.5 left-1.5 bg-black/85 px-1.5 py-0.5 text-[9px] text-[#D4D4D4] uppercase">
                    Original
                  </span>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src="/showcase/edit-after.jpg"
                    alt="Gyra Pro Ultra tungsten dusk edit"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <span className="font-mono-tech absolute bottom-1.5 left-1.5 bg-[#1F5B7C] px-1.5 py-0.5 text-[9px] text-white uppercase">
                    Pro Ultra
                  </span>
                </div>
              </div>
            )}

            {branch.id === "video" && (
              <div className="relative mt-4 aspect-[21/9] overflow-hidden border border-[#1E1E1E] bg-black">
                <video
                  src="/products-hero-bg.mp4"
                  poster="/products-hero-poster.jpg"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
                <div className="font-mono-tech absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-[#E5E5E5]">
                  <span>LTX-VIDEO 13B · 720P · 24 FPS</span>
                  <span className="text-[#78B0CE]">GYRA STUDIO</span>
                </div>
              </div>
            )}

            {/* Branch Action Links */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#181818] pt-3.5">
              <a
                href={branch.sectionHref}
                className="font-mono-tech inline-flex items-center gap-1.5 text-[11px] tracking-[0.1em] text-[#A3A3A3] uppercase transition-colors hover:text-white"
              >
                <span>Jump to {branch.sectionLabel}</span>
                <ArrowDown className="h-3.5 w-3.5 text-[#5B9EC2]" />
              </a>

              <a
                href={resolveGyraRoute(branch.appHref, routeBase)}
                className="font-mono-tech inline-flex items-center gap-1.5 bg-[#1F5B7C] px-4 py-2 text-[11px] font-medium tracking-[0.1em] text-white uppercase transition-colors hover:bg-[#296E93]"
              >
                <span>{branch.appLabel}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Right: Compact Live Execution Console */}
          <div className={`flex flex-col justify-between bg-black p-5 ${compactMobile ? "" : "lg:col-span-6 lg:p-6"}`}>
            <div>
              {/* Console Header + Interactive Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A1A1A] pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-[#5B9EC2]" />
                  <span className="font-mono-tech text-[11px] font-medium tracking-[0.1em] text-white uppercase">
                    Execution Console
                  </span>
                  <span className="font-mono-tech text-[10px] tracking-[0.06em] text-[#666666] uppercase">
                    · Simulated Trace
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleFailureSimulation}
                    className={`font-mono-tech inline-flex min-h-[28px] items-center gap-1.5 border px-2.5 text-[10px] tracking-[0.08em] uppercase transition-colors ${
                      simulateFailure
                        ? "border-[#EF4444]/70 bg-[#EF4444]/15 text-[#FCA5A5]"
                        : "border-[#262626] bg-[#070707] text-[#9A9A9A] hover:border-[#404040] hover:text-white"
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span>{simulateFailure ? "Failure Path: On" : "Test Failure"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={replayTrace}
                    aria-label="Replay architecture trace"
                    className="font-mono-tech inline-flex min-h-[28px] items-center gap-1 border border-[#262626] bg-[#070707] px-2.5 text-[10px] tracking-[0.08em] text-[#CCCCCC] uppercase transition-colors hover:border-[#5B9EC2] hover:text-white"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Replay</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetToIdle}
                    aria-label="Collapse branch and return to idle"
                    className="inline-flex h-7 w-7 items-center justify-center border border-[#262626] bg-[#070707] text-[#9A9A9A] transition-colors hover:border-white hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Request Payload Preview */}
              <div className="mt-3.5 border border-[#1B1B1B] bg-[#060606] px-3.5 py-2.5">
                <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#6E6E6E] uppercase">
                  Sample Request Input
                </p>
                <p className="mt-1 font-mono-tech text-[11.5px] leading-[1.55] text-[#D4D4D4]">
                  {branch.requestSample}
                </p>
              </div>

              {/* Live Step-by-Step Execution Log */}
              <div className="mt-3.5 space-y-2">
                {shownEvents.map((ev, idx) => {
                  const isLast = idx === shownEvents.length - 1;
                  const isErrorRow = status === "failed" && isLast;
                  const isDoneRow = status === "completed" || (!isLast && status !== "idle");
                  return (
                    <div
                      key={`${branch.id}-${simulateFailure ? "fail" : "ok"}-${idx}`}
                      className={`border px-3.5 py-2.5 transition-colors ${
                        isErrorRow
                          ? "border-[#EF4444]/60 bg-[#140707]"
                          : isLast && (status === "active" || status === "processing")
                            ? "border-[#5B9EC2] bg-[#040D14]"
                            : "border-[#1D1D1D] bg-[#050505]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-mono-tech text-[10px] font-medium tracking-[0.12em] uppercase ${
                            isErrorRow
                              ? "text-[#F87171]"
                              : isDoneRow
                                ? "text-[#34D399]"
                                : "text-[#78B0CE]"
                          }`}
                        >
                          [{ev.tag}]
                        </span>
                        <span className="font-mono-tech text-[10px] text-[#666666]">
                          STAGE 0{idx + 1}
                        </span>
                      </div>
                      <p className="mt-1 font-mono-tech text-[11.5px] leading-[1.5] text-[#C8C8C8]">
                        {ev.message}
                        {isLast && (status === "active" || status === "processing") && (
                          <span className="gyra-cursor ml-1.5" aria-hidden="true" />
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Outcome Footer */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#181818] pt-3 font-mono-tech text-[10.5px]">
              <span
                className={
                  status === "failed"
                    ? "text-[#F87171]"
                    : status === "completed"
                      ? "text-[#34D399]"
                      : "text-[#8E8E8E]"
                }
              >
                {status === "failed"
                  ? branch.failureSummary
                  : status === "completed"
                    ? branch.successSummary
                    : "Tracing request through Gyra Intelligence Core..."}
              </span>
              <span className="text-[#595959] uppercase">Architecture Preview</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="border-b border-[#1F1F1F] bg-black">
      <div className="mx-auto max-w-[1380px] px-5 pb-12 pt-8 sm:px-8 lg:pb-16 lg:pt-10">
        {/* Centered Hero Header & Actions */}
        <div className="mx-auto flex max-w-[820px] flex-col items-center text-center">
          <h1 className="font-display text-[clamp(2.65rem,4.9vw,4.25rem)] font-bold leading-[0.93] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
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
              className="font-mono-tech inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap bg-[#1F5B7C] px-6 text-[12px] font-medium tracking-[0.1em] text-white uppercase transition-colors duration-150 hover:bg-[#296E93] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              {isAuthenticated ? "Open Dashboard" : "Start with Gyra"}
            </a>
            <a
              href={resolveGyraRoute("/api", routeBase)}
              className="font-mono-tech inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap border border-[#3A3A3A] bg-black px-6 text-[12px] font-medium tracking-[0.1em] text-white uppercase transition-colors duration-150 hover:border-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2]"
            >
              Explore API
            </a>
            <button
              type="button"
              onClick={copyQuickCurl}
              className="font-mono-tech inline-flex min-h-[42px] items-center gap-2 border border-[#1F1F1F] bg-[#060606] px-4 text-[11px] tracking-[0.08em] text-[#8E8E8E] uppercase transition-colors hover:border-[#3A3A3A] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2]"
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

        {/* ========================================================================
            GYRA INTELLIGENCE ARCHITECTURE — 5-LEVEL HIERARCHICAL FLOW VISUALIZATION
            1. GENVIA (Parent AI Company — ownership crest, NOT an execution node)
            2. GYRA (AI Platform — platform boundary)
            3. GYRA INTELLIGENCE CORE (Central Engine Hub)
            4. UNDERSTAND -> ORCHESTRATE -> EXECUTE (Live Segmented Pipeline Rail)
            5. GYRA CHAT | GYRA IMAGE | GYRA VIDEO | GYRA API (Selectable Branches)
           ======================================================================== */}
        <div
          aria-label="Gyra Intelligence Architecture"
          className="mt-9 sm:mt-10"
        >
          {/* LEVEL 1: GENVIA — Parent AI Company (Visually Distinct Ownership Crest, NOT an engine card) */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <span className="hidden h-px w-10 bg-[#242424] sm:block" aria-hidden="true" />
              <div className="flex items-center gap-2.5 border-b border-[#262626] pb-1.5">
                <span className="font-display text-[15px] font-bold tracking-[0.22em] text-white uppercase">
                  GENVIA
                </span>
                <span className="text-[#3A3A3A]" aria-hidden="true">
                  /
                </span>
                <span className="font-mono-tech text-[10px] tracking-[0.16em] text-[#7A7A7A] uppercase">
                  Parent AI Company
                </span>
              </div>
              <span className="hidden h-px w-10 bg-[#242424] sm:block" aria-hidden="true" />
            </div>

            {/* Quiet structural ownership connector (NOT an active engine pulse) */}
            <div className="flex flex-col items-center" aria-hidden="true">
              <div className="h-5 w-px border-l border-dashed border-[#333333]" />
              <div className="h-1.5 w-1.5 border border-[#444444] bg-black" />
            </div>
          </div>

          {/* LEVEL 2: GYRA — AI Platform Outer Architectural Frame */}
          <div className="border border-[#222222] bg-[#020202]">
            {/* Platform Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A1A1A] bg-[#050505] px-4 py-2.5 sm:px-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="h-2 w-2 bg-[#1F5B7C]" aria-hidden="true" />
                <span className="font-display text-[17px] font-bold tracking-[0.08em] text-white uppercase">
                  GYRA
                </span>
                <span className="font-mono-tech text-[10px] tracking-[0.14em] text-[#8A8A8A] uppercase">
                  AI Platform
                </span>
                <span className="hidden font-mono-tech text-[10px] tracking-[0.1em] text-[#555555] uppercase md:inline">
                  · Web · Android · Telegram · REST API
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`font-mono-tech border px-2.5 py-0.5 text-[10px] tracking-[0.12em] uppercase ${getStatusBadgeStyle(
                    status,
                  )}`}
                >
                  STATE: {getStatusLabel(status)}
                </span>
                {selectedBranch && (
                  <button
                    type="button"
                    onClick={resetToIdle}
                    className="font-mono-tech border border-[#2A2A2A] bg-black px-2.5 py-0.5 text-[10px] tracking-[0.1em] text-[#A3A3A3] uppercase transition-colors hover:border-white hover:text-white"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Platform Interior */}
            <div className="pt-5 sm:pt-6">
              {/* LEVEL 3 & LEVEL 4: GYRA INTELLIGENCE CORE + UNDERSTAND -> ORCHESTRATE -> EXECUTE */}
              <div className="flex flex-col items-center px-4 sm:px-6">
                {/* Core Processor Chassis */}
                <div
                  className={`relative w-full max-w-[780px] border bg-[#060606] transition-colors duration-200 ${
                    status === "failed"
                      ? "border-[#EF4444]/60"
                      : status === "completed"
                        ? "border-[#10B981]/50"
                        : status === "active" || status === "processing"
                          ? "border-[#5B9EC2]"
                          : "border-[#2D2D2D]"
                  }`}
                >
                  {/* Top Precision Accent Rail */}
                  <div
                    className={`h-[2px] w-full transition-colors duration-200 ${
                      status === "failed"
                        ? "bg-[#EF4444]"
                        : status === "completed"
                          ? "bg-[#10B981]"
                          : "bg-[#1F5B7C]"
                    }`}
                    aria-hidden="true"
                  />

                  {/* Corner hardware ticks */}
                  <span className="pointer-events-none absolute -bottom-px -left-px h-2 w-2 border-b border-l border-[#5B9EC2]" />
                  <span className="pointer-events-none absolute -bottom-px -right-px h-2 w-2 border-b border-r border-[#5B9EC2]" />

                  {/* Level 3 Header: GYRA INTELLIGENCE CORE */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#191919] px-4 py-2.5 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center border border-[#5B9EC2]/45 bg-[#1F5B7C]/18 text-[#78B0CE]">
                        <Cpu className="h-3.5 w-3.5" />
                      </span>
                      <div className="text-left">
                        <p className="font-mono-tech text-[11px] font-medium tracking-[0.14em] text-white uppercase">
                          Gyra Intelligence Core
                        </p>
                        <p className="font-mono-tech text-[10px] tracking-[0.06em] text-[#737373]">
                          {selectedBranch
                            ? `Active Route → ${selectedBranch.name} (${selectedBranch.role})`
                            : "Standby · Select any product branch below to trace a request"}
                        </p>
                      </div>
                    </div>

                    <span className="font-mono-tech text-[10px] tracking-[0.12em] text-[#78B0CE] uppercase">
                      {selectedBranch
                        ? `${activeEvents.length} / ${
                            (simulateFailure
                              ? selectedBranch.failureEvents
                              : selectedBranch.successEvents
                            ).length
                          } STAGES`
                        : "4 PRODUCT BRANCHES"}
                    </span>
                  </div>

                  {/* Level 4: UNDERSTAND -> ORCHESTRATE -> EXECUTE Segmented Flow Rail (NOT 3 cards) */}
                  <div className="bg-black px-4 py-3 sm:px-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                      {PIPELINE_STAGES.map((stage, idx) => {
                        const stageStatus = getStageState(idx);
                        const isLastStage = idx === PIPELINE_STAGES.length - 1;
                        return (
                          <div
                            key={stage.id}
                            className="flex flex-1 items-center"
                          >
                            <div
                              className={`flex flex-1 items-center justify-between gap-2 border-l-2 px-3 py-1.5 transition-colors duration-200 ${
                                stageStatus === "failed"
                                  ? "border-[#EF4444] bg-[#140707]"
                                  : stageStatus === "completed"
                                    ? "border-[#10B981] bg-[#04110C]"
                                    : stageStatus === "processing" || stageStatus === "active"
                                      ? "border-[#5B9EC2] bg-[#05111A]"
                                      : "border-[#262626] bg-[#060606]"
                              }`}
                            >
                              <div className="min-w-0 text-left">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-mono-tech text-[10px] tracking-[0.1em] ${
                                      stageStatus === "failed"
                                        ? "text-[#F87171]"
                                        : stageStatus === "completed"
                                          ? "text-[#34D399]"
                                          : stageStatus === "processing" || stageStatus === "active"
                                            ? "text-[#78B0CE]"
                                            : "text-[#666666]"
                                    }`}
                                  >
                                    {stage.num}
                                  </span>
                                  <span className="font-mono-tech text-[11px] font-medium tracking-[0.12em] text-white uppercase">
                                    {stage.label}
                                  </span>
                                </div>
                                <p className="truncate text-[11px] text-[#808080]">
                                  {stage.caption}
                                </p>
                              </div>

                              <span
                                className={`font-mono-tech shrink-0 text-[10px] uppercase ${
                                  stageStatus === "failed"
                                    ? "text-[#F87171]"
                                    : stageStatus === "completed"
                                      ? "text-[#34D399]"
                                      : stageStatus === "processing" || stageStatus === "active"
                                        ? "text-[#78B0CE]"
                                        : "text-[#4A4A4A]"
                                }`}
                              >
                                {stageStatus === "completed"
                                  ? "✓"
                                  : stageStatus === "failed"
                                    ? "✕"
                                    : stageStatus === "processing" || stageStatus === "active"
                                      ? "●"
                                      : "—"}
                              </span>
                            </div>

                            {!isLastStage && (
                              <div
                                aria-hidden="true"
                                className="hidden shrink-0 items-center px-1.5 sm:flex"
                              >
                                <span
                                  className={`h-px w-4 transition-colors ${
                                    stageStatus === "completed"
                                      ? "bg-[#10B981]"
                                      : stageStatus === "processing"
                                        ? "bg-[#5B9EC2]"
                                        : "bg-[#262626]"
                                  }`}
                                />
                                <ChevronRight
                                  className={`-ml-1 h-3.5 w-3.5 transition-colors ${
                                    stageStatus === "completed"
                                      ? "text-[#10B981]"
                                      : stageStatus === "processing"
                                        ? "text-[#5B9EC2]"
                                        : "text-[#3A3A3A]"
                                  }`}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* ================================================================
                  DESKTOP: LEVEL 5 BRANCHING CONNECTOR PATHS + 4 SELECTABLE NODES
                 ================================================================ */}
              <div className="hidden md:block">
                <div className="relative h-[60px] w-full" aria-hidden="true">
                  <svg
                    viewBox="0 0 1200 60"
                    preserveAspectRatio="none"
                    className="h-full w-full"
                  >
                    {/* Base muted circuit trunk & horizontal manifold */}
                    <path
                      d="M 600 0 L 600 30"
                      fill="none"
                      stroke="#262626"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d="M 150 30 L 1050 30"
                      fill="none"
                      stroke="#262626"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />

                    {BRANCHES.map((branch) => {
                      const x = branchCoords[branch.id];
                      const isSelected = selectedBranchId === branch.id;
                      const isHovered = hoveredBranchId === branch.id;
                      const isHighlighted = isSelected || isHovered;
                      const anyFocus = Boolean(selectedBranchId || hoveredBranchId);
                      const pathD = `M 600 0 L 600 30 L ${x} 30 L ${x} 60`;
                      const strokeColor = isSelected ? activeTraceColor : "#5B9EC2";

                      return (
                        <g key={branch.id}>
                          {/* Base drop trace */}
                          <path
                            d={`M ${x} 30 L ${x} 60`}
                            fill="none"
                            stroke="#262626"
                            strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                          />
                          {/* Illuminated solid route for active/selected or hovered branch */}
                          {isHighlighted && (
                            <path
                              d={pathD}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth={isSelected ? "2.2" : "1.8"}
                              strokeOpacity={isSelected ? "0.95" : "0.75"}
                              vectorEffect="non-scaling-stroke"
                            />
                          )}
                          {/* Subtle animated pulse along idle paths or fast pulse during processing */}
                          {(!selectedBranchId || (isSelected && (status === "active" || status === "processing"))) && (
                            <path
                              d={pathD}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth={isSelected ? "2.5" : "1.6"}
                              strokeOpacity={anyFocus && !isHighlighted ? "0.2" : "0.9"}
                              vectorEffect="non-scaling-stroke"
                              className={
                                isSelected ? "gyra-trace-pulse-fast" : branch.traceClass
                              }
                            />
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Center manifold junction pin */}
                  <span
                    style={{
                      backgroundColor: selectedBranchId ? activeTraceColor : "#5B9EC2",
                    }}
                    className="pointer-events-none absolute left-1/2 top-[27px] h-1.5 w-1.5 -translate-x-1/2"
                  />

                  {/* 4 Exact Branch Terminal Pins */}
                  {[12.5, 37.5, 62.5, 87.5].map((pct, idx) => {
                    const branch = BRANCHES[idx];
                    const isSelected = selectedBranchId === branch.id;
                    const isHovered = hoveredBranchId === branch.id;
                    return (
                      <span
                        key={branch.id}
                        style={{
                          left: `${pct}%`,
                          borderColor: isSelected
                            ? activeTraceColor
                            : isHovered
                              ? "#5B9EC2"
                              : "#2D2D2D",
                          backgroundColor: isSelected ? activeTraceColor : "#000000",
                        }}
                        className="pointer-events-none absolute bottom-[-3px] h-2 w-2 -translate-x-1/2 border transition-colors"
                      />
                    );
                  })}
                </div>

                {/* 4 Selectable & Expandable Desktop Product Branches */}
                <div className="grid grid-cols-4 divide-x divide-[#1F1F1F] border-t border-[#1F1F1F]">
                  {BRANCHES.map((branch) => {
                    const isSelected = selectedBranchId === branch.id;
                    const isHovered = hoveredBranchId === branch.id;
                    const branchStatus: ExecutionStatus = isSelected ? status : "idle";

                    return (
                      <button
                        key={branch.id}
                        type="button"
                        aria-expanded={isSelected}
                        onClick={() => selectBranch(branch.id)}
                        onMouseEnter={() => setHoveredBranchId(branch.id)}
                        onMouseLeave={() => setHoveredBranchId(null)}
                        onFocus={() => setHoveredBranchId(branch.id)}
                        onBlur={() => setHoveredBranchId(null)}
                        className={`group relative flex flex-col justify-between p-5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#5B9EC2] ${
                          isSelected
                            ? "bg-[#040C12]"
                            : isHovered
                              ? "bg-[#080808]"
                              : "bg-black hover:bg-[#070707]"
                        }`}
                      >
                        {/* Active Top Indicator Line */}
                        {isSelected && (
                          <span
                            aria-hidden="true"
                            style={{ backgroundColor: activeTraceColor }}
                            className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                          />
                        )}

                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono-tech text-[11px] tracking-[0.14em] text-[#5B9EC2]">
                                {branch.index}
                              </span>
                              <span className="font-mono-tech text-[10px] tracking-[0.08em] text-[#666666] uppercase">
                                {branch.role}
                              </span>
                            </div>

                            <span
                              className={`flex h-7 w-7 items-center justify-center border transition-colors ${
                                isSelected
                                  ? "border-[#5B9EC2] bg-[#1F5B7C] text-white"
                                  : isHovered
                                    ? "border-[#5B9EC2]/60 bg-[#071520] text-[#78B0CE]"
                                    : "border-[#242424] bg-[#060606] text-[#A3A3A3]"
                              }`}
                            >
                              <BranchIcon id={branch.id} className="h-3.5 w-3.5" />
                            </span>
                          </div>

                          <h2 className="font-display mt-3.5 text-[24px] font-bold leading-none tracking-[-0.01em] text-white uppercase">
                            {branch.name}
                          </h2>

                          <p className="mt-2 text-[12.5px] leading-[1.5] text-[#9A9A9A]">
                            {branch.summary}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-[#181818] pt-3 font-mono-tech text-[10px] tracking-[0.1em] uppercase">
                          <span
                            className={
                              isSelected
                                ? status === "failed"
                                  ? "text-[#F87171]"
                                  : status === "completed"
                                    ? "text-[#34D399]"
                                    : "text-[#78B0CE]"
                                : "text-[#737373] transition-colors group-hover:text-white"
                            }
                          >
                            {isSelected ? getStatusLabel(branchStatus) : "Select Branch"}
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-[#5B9EC2] transition-transform duration-150 ${
                              isSelected ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop Expanded Branch Detail + Compact Live Execution Console (or Idle Footer Bar) */}
                {selectedBranch ? (
                  renderBranchDetailsPanel(selectedBranch, false)
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1A1A1A] bg-[#040404] px-6 py-3 font-mono-tech text-[11px]">
                    <div className="flex items-center gap-2.5 text-[#8A8A8A]">
                      <Terminal className="h-3.5 w-3.5 text-[#5B9EC2]" />
                      <span>
                        EXECUTION CONSOLE: <span className="text-white">IDLE</span> — Select any
                        branch above to trace a request through Understand → Orchestrate → Execute.
                      </span>
                    </div>
                    <span className="text-[10px] tracking-[0.1em] text-[#5E5E5E] uppercase">
                      Interactive Architecture Preview
                    </span>
                  </div>
                )}
              </div>

              {/* ================================================================
                  MOBILE: VERTICAL INTERACTIVE TREE WITH EXPANDABLE NODES (< 768px)
                 ================================================================ */}
              <div className="px-4 pb-5 pt-4 md:hidden">
                <div className="relative pl-6">
                  {/* Continuous vertical digital bus rail */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-5 left-[6px] top-0 w-[2px] overflow-hidden bg-[#242424]"
                  >
                    <div className="gyra-spine-pulse h-20 w-full bg-gradient-to-b from-transparent via-[#5B9EC2] to-transparent" />
                  </div>

                  <div className="space-y-3">
                    {BRANCHES.map((branch) => {
                      const isSelected = selectedBranchId === branch.id;
                      return (
                        <div key={branch.id} className="relative">
                          {/* Horizontal PCB connector arm from vertical spine */}
                          <span
                            aria-hidden="true"
                            style={{
                              backgroundColor: isSelected ? activeTraceColor : "#2A2A2A",
                            }}
                            className="pointer-events-none absolute -left-[18px] top-[28px] h-[2px] w-[18px]"
                          />
                          <span
                            aria-hidden="true"
                            style={{
                              borderColor: isSelected ? activeTraceColor : "#5B9EC2",
                              backgroundColor: isSelected ? activeTraceColor : "#000000",
                            }}
                            className="pointer-events-none absolute -left-[21px] top-[25px] h-2 w-2 border"
                          />

                          <div
                            className={`border transition-colors ${
                              isSelected ? "border-[#5B9EC2]/70 bg-[#040C12]" : "border-[#222222] bg-black"
                            }`}
                          >
                            <button
                              type="button"
                              aria-expanded={isSelected}
                              onClick={() => selectBranch(branch.id)}
                              className="flex w-full items-center justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2]"
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border ${
                                    isSelected
                                      ? "border-[#5B9EC2] bg-[#1F5B7C] text-white"
                                      : "border-[#262626] bg-[#070707] text-[#78B0CE]"
                                  }`}
                                >
                                  <BranchIcon id={branch.id} className="h-4 w-4" />
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono-tech text-[10px] text-[#5B9EC2]">
                                      {branch.index}
                                    </span>
                                    <span className="font-display text-[21px] font-bold leading-none text-white uppercase">
                                      {branch.name}
                                    </span>
                                  </div>
                                  <p className="mt-1 font-mono-tech text-[10px] tracking-[0.06em] text-[#7A7A7A] uppercase">
                                    {branch.role}
                                  </p>
                                  <p className="mt-1 text-[12.5px] leading-[1.45] text-[#A3A3A3]">
                                    {branch.summary}
                                  </p>
                                </div>
                              </div>

                              <ChevronDown
                                className={`h-4 w-4 shrink-0 text-[#5B9EC2] transition-transform ${
                                  isSelected ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            {isSelected && renderBranchDetailsPanel(branch, true)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                <span className="h-1.5 w-1.5 shrink-0 bg-[#5B9EC2]" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
