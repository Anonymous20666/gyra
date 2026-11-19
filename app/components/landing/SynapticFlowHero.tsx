"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUpRight,
  Check,
  Copy,
  Pause,
  Play,
  Send,
} from "lucide-react";
import { computeRemainingMs } from "../../lib/carouselPhysics";
import { resolveGyraRoute } from "../../lib/landingSimulations";

export type SynapticBranchId = "chat" | "image" | "video" | "api";
type CoreFocusId = "genvia" | "core" | "stage-understand" | "stage-orchestrate" | "stage-execute";
type FlowPhase =
  | "idle"
  | "drop"
  | "trunk"
  | "understand"
  | "orchestrate"
  | "execute"
  | "product"
  | "generator"
  | "wiring"
  | "done"
  | "failed";

interface StageNarrative {
  stage: string;
  headline: string;
  detail: string;
}

interface ProductStory {
  id: SynapticBranchId;
  code: string;
  name: string;
  shortName: string;
  category: string;
  endpoint: string;
  sectionHref: string;
  sectionLabel: string;
  appHref: string;
  appLabel: string;
  inputPrompt: string;
  dropLabel: string;
  stageNarratives: [StageNarrative, StageNarrative, StageNarrative];
  failNarrative: { headline: string; detail: string };
  outputLabel: string;
  subEngines: { name: string; role: string }[];
}

const PRODUCTS: readonly ProductStory[] = [
  {
    id: "chat",
    code: "01",
    name: "Gyra Chat",
    shortName: "Chat",
    category: "Reasoning & 6-Agent Core",
    endpoint: "POST /api/v1/chat",
    sectionHref: "#chat",
    sectionLabel: "Chat Workbench",
    appHref: "/dashboard",
    appLabel: "Open Gyra Chat",
    inputPrompt:
      "Write a Next.js App Router POST webhook handler with constant-time HMAC verification and per-IP rate limiting.",
    dropLabel: "HMAC webhook + rate limiter",
    stageNarratives: [
      {
        stage: "01 · Understand",
        headline: "Parsed engineering build intent and security constraints",
        detail: "Detected replay-protection requirement, checked workspace context, and verified user session.",
      },
      {
        stage: "02 · Orchestrate",
        headline: "Escalated to SuperGyra 2.0 and 6-Agent Pipeline",
        detail: "Scheduled Atlas → Orion → Architect → Forge → Sentinel → Mentor with strict TypeScript verification.",
      },
      {
        stage: "03 · Execute",
        headline: "Streamed verified TypeScript handler over live SSE",
        detail: "Delivered constant-time timingSafeEqual check, 5-minute replay window guard, and 429 Retry-After headers.",
      },
    ],
    failNarrative: {
      headline: "Upstream inference timeout intercepted (504)",
      detail: "Orchestrator caught stalled reasoning stream cleanly, preserved prompt context, and surfaced safe retry.",
    },
    outputLabel: "Verified Handler · SuperGyra 2.0 + Sentinel QA",
    subEngines: [
      { name: "Gyra 1.0", role: "Fast everyday reasoning & search" },
      { name: "SuperGyra 2.0", role: "Deep multi-step architecture & code" },
      { name: "6-Agent Pipeline", role: "Atlas through Mentor QA handoff" },
    ],
  },
  {
    id: "image",
    code: "02",
    name: "Gyra Image",
    shortName: "Image",
    category: "Synthesis & Geometry-Locked I2I",
    endpoint: "POST /api/fal/proxy",
    sectionHref: "#image",
    sectionLabel: "Image Darkroom",
    appHref: "/dashboard",
    appLabel: "Open Gyra Image",
    inputPrompt:
      "Shift exterior window light to blue-hour dusk and switch on the desk lamp at 2700K — preserve every object and angle.",
    dropLabel: "Relight studio to 2700K dusk",
    stageNarratives: [
      {
        stage: "01 · Understand",
        headline: "Encoded reference frame and spatial preservation constraints",
        detail: "Authenticated through hardened /api/fal/proxy and extracted geometry map from original 1440×1080 still.",
      },
      {
        stage: "02 · Orchestrate",
        headline: "Routed to Gyra Pro Ultra I2I with geometry lock active",
        detail: "Selected image-to-image relighting graph over text-only Flux to guarantee exact structural preservation.",
      },
      {
        stage: "03 · Execute",
        headline: "Rendered tungsten dusk lighting pass cleanly",
        detail: "Synthesized warm desk-lamp specular falloff while locking every architectural surface in place.",
      },
    ],
    failNarrative: {
      headline: "Proxy input validation guard triggered (422)",
      detail: "Hardened /api/fal/proxy rejected malformed image payload before GPU dispatch, preserving user credits.",
    },
    outputLabel: "Geometry-Locked Frame · Gyra Pro Ultra I2I",
    subEngines: [
      { name: "Flux Dev", role: "High-res text-to-image synthesis" },
      { name: "Gyra Pro Ultra I2I", role: "Geometry-locked lighting & edits" },
      { name: "Hardened Proxy", role: "Authenticated server-side delivery" },
    ],
  },
  {
    id: "video",
    code: "03",
    name: "Gyra Video",
    shortName: "Video",
    category: "Cinematic 720p Studio Motion",
    endpoint: "POST /api/v1/video/generate",
    sectionHref: "#video",
    sectionLabel: "Video Studio",
    appHref: "/studio",
    appLabel: "Open Gyra Studio",
    inputPrompt:
      "Reference Frame 001 + Slow cinematic drone glide across cable-stayed bridge over dark lagoon at twilight · 16:9.",
    dropLabel: "Lagos twilight aerial · 16:9",
    stageNarratives: [
      {
        stage: "01 · Understand",
        headline: "Validated attached keyframe and 16:9 widescreen preset",
        detail: "Checked Studio render balance, anchored Frame 001, and parsed smooth dolly-forward motion trajectory.",
      },
      {
        stage: "02 · Orchestrate",
        headline: "Queued asynchronous render job on LTX-Video 13B worker",
        detail: "Issued trackable job ID for /api/v1/video/status/[id] polling and reserved motion synthesis slot.",
      },
      {
        stage: "03 · Execute",
        headline: "Synthesized 121 coherent frames at 720p · 24 fps",
        detail: "Encoded twilight lagoon reflections and moving bridge traffic trails into Gyra Studio history.",
      },
    ],
    failNarrative: {
      headline: "Async render worker interruption isolated",
      detail: "Status poller marked job interrupted and automatically refunded the held render credit back to wallet.",
    },
    outputLabel: "Studio Render · LTX-Video 13B · 720p 24fps",
    subEngines: [
      { name: "LTX-Video 13B", role: "720p · 24 fps · 121-frame synthesis" },
      { name: "I2V Frame Anchor", role: "Reference keyframe motion lock" },
      { name: "Async Studio Queue", role: "Job polling & render history" },
    ],
  },
  {
    id: "api",
    code: "04",
    name: "Gyra API",
    shortName: "API",
    category: "OpenAI-Compat REST & Media",
    endpoint: "POST /api/v1/chat",
    sectionHref: "#developers",
    sectionLabel: "API Console",
    appHref: "/api",
    appLabel: "Explore API Platform",
    inputPrompt:
      'POST /api/v1/chat · Authorization: Bearer $GYRA_KEY · { "model": "gyra-super2.0", "stream": true }',
    dropLabel: "POST /api/v1/chat · SuperGyra",
    stageNarratives: [
      {
        stage: "01 · Understand",
        headline: "Verified category-scoped Bearer key and JSON schema",
        detail: "Validated key permissions, checked wallet credits, and normalized OpenAI-compatible messages array.",
      },
      {
        stage: "02 · Orchestrate",
        headline: "Applied per-key rate guardrails and v1 route dispatch",
        detail: "Enforced quota policy and routed request cleanly across Chat, Voice/Whisper, Video, or Media workers.",
      },
      {
        stage: "03 · Execute",
        headline: "Returned 200 OK chat.completion JSON and logged telemetry",
        detail: "Streamed standard OpenAI-compatible payload and recorded usage entry in Developer Console.",
      },
    ],
    failNarrative: {
      headline: "Rate-limit guardrail enforced cleanly (429)",
      detail: "Gateway protected downstream inference pool and returned structured JSON error with Retry-After header.",
    },
    outputLabel: "REST Response · 200 OK OpenAI-Compat JSON",
    subEngines: [
      { name: "OpenAI-Compat v1", role: "Drop-in /api/v1/chat completions" },
      { name: "Voice & Whisper", role: "/api/v1/voice & /api/v1/transcribe" },
      { name: "Gyra Media API", role: "YouTube transcripts, TikTok & Spotify" },
    ],
  },
] as const;

const CORE_BRIEFS: Record<
  CoreFocusId,
  { kicker: string; title: string; summary: string; tags: string[] }
> = {
  genvia: {
    kicker: "TIER 0 · GOVERNANCE & FOUNDATION",
    title: "Genvia AI Company",
    summary:
      "Parent AI research and engineering company governing model routing, safety policies, unified authentication, and shared multimodal infrastructure across Gyra.",
    tags: ["Model Governance", "Safety Policies", "Unified Auth", "Shared Compute"],
  },
  core: {
    kicker: "TIER 1 · CENTRAL INTELLIGENCE ENGINE",
    title: "Gyra Intelligence Core",
    summary:
      "Single unified orchestration core powering Web Workspace, Android, Telegram (@Gyra_AiBot), and REST API v1 through Understand → Orchestrate → Execute.",
    tags: ["Intent Router", "Context Grounding", "Guardrail Boundary", "Multi-Modal Bus"],
  },
  "stage-understand": {
    kicker: "STAGE 01 · INGEST & CONTEXT",
    title: "01 · Understand",
    summary:
      "Parses inbound prompts, uploaded PDFs/images, attached reference frames, and category-scoped credentials before committing compute.",
    tags: ["Prompt Parser", "File & Frame Ingest", "Auth Verification"],
  },
  "stage-orchestrate": {
    kicker: "STAGE 02 · ROUTING & GUARDRAILS",
    title: "02 · Orchestrate",
    summary:
      "Selects Gyra 1.0, SuperGyra 2.0, the 6-Agent Pipeline, Flux Pro Ultra, or LTX-Video 13B while enforcing quota, rate-limit, and credit safety policies.",
    tags: ["Model Selector", "6-Agent Graph", "Quota & Fault Guard"],
  },
  "stage-execute": {
    kicker: "STAGE 03 · SYNTHESIS & STREAMING",
    title: "03 · Execute",
    summary:
      "Runs inference and streams verified SSE tokens, geometry-locked images, 720p 24fps Studio clips, or OpenAI-compatible JSON directly to the user.",
    tags: ["SSE Token Stream", "GPU Render Queue", "Deterministic Delivery"],
  },
};

interface CanvasNode {
  id: string;
  label: string;
  sub?: string;
  shortCode?: string;
  tier: number;
  tierName: string;
  desc: string;
  icon: string;
  x: number;
  y: number;
  r: number;
  branch: SynapticBranchId | null;
  stageIdx?: number;
  leafName?: string;
  glow: number;
  energy: number;
  pulseBoost: number;
}

interface CanvasEdge {
  from: { x: number; y: number; id: string; branch: SynapticBranchId | null };
  to: { x: number; y: number; id: string; branch: SynapticBranchId | null };
  branch: SynapticBranchId | null;
  kind: "trunk" | "core-stage" | "stage-chain" | "stage-product" | "product-leaf" | "generator-port";
  stageIdx?: number;
}

interface FluidRibbon {
  edge: CanvasEdge;
  rawP: number;
  speed: number;
  tailLen: number;
  color: string;
  head: string;
  width: number;
  onArrive?: () => void;
  arrived: boolean;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
  color: string;
  lineWidth: number;
  speed: number;
}

interface PromptDropState {
  active: boolean;
  progress: number;
  label: string;
  targetX: number;
  targetY: number;
  onAbsorb?: () => void;
}

interface AmbientMote {
  edgeIdx: number;
  u: number;
  speed: number;
  r: number;
  alpha: number;
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutExpo(x: number): number {
  return x >= 1 ? 1 : 1 - Math.pow(2, -8 * x);
}

function curvePoint(e: CanvasEdge, u: number): { x: number; y: number } {
  const { from, to } = e;
  if (e.kind === "stage-chain") {
    const mx = (from.x + to.x) * 0.5;
    const my = from.y - 22;
    const m = 1 - u;
    return {
      x: m * m * from.x + 2 * m * u * mx + u * u * to.x,
      y: m * m * from.y + 2 * m * u * my + u * u * to.y,
    };
  }
  if (e.kind === "generator-port") {
    const cp1y = from.y + (to.y - from.y) * 0.58;
    const cp2y = from.y + (to.y - from.y) * 0.42;
    const m = 1 - u;
    return {
      x: m * m * m * from.x + 3 * m * m * u * from.x + 3 * m * u * u * to.x + u * u * u * to.x,
      y: m * m * m * from.y + 3 * m * m * u * cp1y + 3 * m * u * u * cp2y + u * u * u * to.y,
    };
  }
  const midY = from.y + (to.y - from.y) * 0.52;
  const m = 1 - u;
  return {
    x: m * m * m * from.x + 3 * m * m * u * from.x + 3 * m * u * u * to.x + u * u * u * to.x,
    y: m * m * m * from.y + 3 * m * m * u * midY + 3 * m * u * u * midY + u * u * u * to.y,
  };
}

function traceEdgePath(ctx: CanvasRenderingContext2D, e: CanvasEdge) {
  const { from, to } = e;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  if (e.kind === "stage-chain") {
    ctx.quadraticCurveTo((from.x + to.x) * 0.5, from.y - 22, to.x, to.y);
  } else if (e.kind === "generator-port") {
    const cp1y = from.y + (to.y - from.y) * 0.58;
    const cp2y = from.y + (to.y - from.y) * 0.42;
    ctx.bezierCurveTo(from.x, cp1y, to.x, cp2y, to.x, to.y);
  } else {
    const midY = from.y + (to.y - from.y) * 0.52;
    ctx.bezierCurveTo(from.x, midY, to.x, midY, to.x, to.y);
  }
}

function drawOrbIcon(ctx: CanvasRenderingContext2D, n: CanvasNode, col: string, scale: number) {
  ctx.save();
  ctx.translate(n.x, n.y);
  ctx.strokeStyle = col;
  ctx.fillStyle = col;
  ctx.lineWidth = 1.45;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const s = scale;

  if (n.icon === "crest") {
    ctx.beginPath();
    ctx.moveTo(0, -7.5 * s);
    ctx.lineTo(7.5 * s, 0);
    ctx.lineTo(0, 7.5 * s);
    ctx.lineTo(-7.5 * s, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (n.icon === "core") {
    // Refined Gyra neural-G mark inside the central intelligence core
    ctx.beginPath();
    ctx.arc(0, 0, 11.5 * s, Math.PI * 0.14, Math.PI * 1.82);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(1.5 * s, 0.5 * s);
    ctx.lineTo(11.4 * s, 0.5 * s);
    ctx.lineTo(11.4 * s, 5.2 * s);
    ctx.stroke();

    // Inner attaching constellation nodes inside the G cavity (clearer visibility)
    const innerPts: [number, number][] = [
      [-5.2 * s, -4.4 * s],
      [-1.0 * s, -5.8 * s],
      [-6.2 * s, 1.4 * s],
      [-2.2 * s, 5.4 * s],
      [2.6 * s, 4.8 * s],
    ];
    ctx.save();
    ctx.globalAlpha = 0.84;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(innerPts[0][0], innerPts[0][1]);
    ctx.lineTo(innerPts[1][0], innerPts[1][1]);
    ctx.lineTo(innerPts[2][0], innerPts[2][1]);
    ctx.lineTo(innerPts[3][0], innerPts[3][1]);
    ctx.lineTo(innerPts[4][0], innerPts[4][1]);
    ctx.moveTo(innerPts[0][0], innerPts[0][1]);
    ctx.lineTo(innerPts[2][0], innerPts[2][1]);
    ctx.moveTo(innerPts[1][0], innerPts[1][1]);
    ctx.lineTo(innerPts[3][0], innerPts[3][1]);
    ctx.stroke();
    ctx.restore();

    innerPts.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(px, py, 1.65 * s, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (n.icon === "understand") {
    ctx.beginPath();
    ctx.arc(0, 0, 5.2 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8.5 * s, 0);
    ctx.lineTo(-6 * s, 0);
    ctx.moveTo(6 * s, 0);
    ctx.lineTo(8.5 * s, 0);
    ctx.moveTo(0, -8.5 * s);
    ctx.lineTo(0, -6 * s);
    ctx.moveTo(0, 6 * s);
    ctx.lineTo(0, 8.5 * s);
    ctx.stroke();
  } else if (n.icon === "orchestrate") {
    const pts: [number, number][] = [
      [0, -6 * s],
      [-6 * s, 5 * s],
      [6 * s, 5 * s],
    ];
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineTo(pts[2][0], pts[2][1]);
    ctx.closePath();
    ctx.stroke();
    pts.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 1.9 * s, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (n.icon === "execute") {
    ctx.beginPath();
    ctx.moveTo(1.5 * s, -8 * s);
    ctx.lineTo(-5 * s, 1 * s);
    ctx.lineTo(0.5 * s, 1 * s);
    ctx.lineTo(-1.5 * s, 8 * s);
    ctx.lineTo(5 * s, -1 * s);
    ctx.lineTo(-0.5 * s, -1 * s);
    ctx.closePath();
    ctx.stroke();
  } else if (n.icon === "chat") {
    ctx.beginPath();
    ctx.moveTo(-7.5 * s, -5 * s);
    ctx.lineTo(7.5 * s, -5 * s);
    ctx.lineTo(7.5 * s, 4.2 * s);
    ctx.lineTo(1 * s, 4.2 * s);
    ctx.lineTo(-3.8 * s, 8 * s);
    ctx.lineTo(-3.8 * s, 4.2 * s);
    ctx.lineTo(-7.5 * s, 4.2 * s);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4 * s, -1.2 * s);
    ctx.lineTo(4 * s, -1.2 * s);
    ctx.moveTo(-4 * s, 1.4 * s);
    ctx.lineTo(2 * s, 1.4 * s);
    ctx.stroke();
  } else if (n.icon === "image") {
    ctx.strokeRect(-7.5 * s, -6 * s, 15 * s, 12 * s);
    ctx.beginPath();
    ctx.moveTo(-7.5 * s, 3.6 * s);
    ctx.lineTo(-2 * s, -1 * s);
    ctx.lineTo(2.4 * s, 2.2 * s);
    ctx.lineTo(5 * s, 0);
    ctx.lineTo(7.5 * s, 2.8 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-3.2 * s, -2.8 * s, 1.4 * s, 0, Math.PI * 2);
    ctx.fill();
  } else if (n.icon === "video") {
    ctx.strokeRect(-8 * s, -5.6 * s, 16 * s, 11.2 * s);
    ctx.beginPath();
    ctx.moveTo(-2 * s, -2.8 * s);
    ctx.lineTo(3.8 * s, 0);
    ctx.lineTo(-2 * s, 2.8 * s);
    ctx.closePath();
    ctx.fill();
  } else if (n.icon === "api") {
    ctx.beginPath();
    ctx.moveTo(-4.2 * s, -4.8 * s);
    ctx.lineTo(-8.5 * s, 0);
    ctx.lineTo(-4.2 * s, 4.8 * s);
    ctx.moveTo(4.2 * s, -4.8 * s);
    ctx.lineTo(8.5 * s, 0);
    ctx.lineTo(4.2 * s, 4.8 * s);
    ctx.moveTo(1.6 * s, -5.6 * s);
    ctx.lineTo(-1.6 * s, 5.6 * s);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 5.2 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -2.8 * s);
    ctx.lineTo(2.8 * s, 0);
    ctx.lineTo(0, 2.8 * s);
    ctx.lineTo(-2.8 * s, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export interface SynapticFlowHeroProps {
  routeBase?: string;
}

export function SynapticFlowHero({ routeBase = "" }: SynapticFlowHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // React UI state synchronized smoothly with the physics-driven canvas flow
  const [autoMode, setAutoMode] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [faultMode, setFaultMode] = useState(false);
  const [activeBranchId, setActiveBranchId] = useState<SynapticBranchId | null>("chat");
  const [activeLeafName, setActiveLeafName] = useState<string | null>(null);
  const [coreFocus, setCoreFocus] = useState<CoreFocusId | null>(null);
  const [flowPhase, setFlowPhase] = useState<FlowPhase>("drop");
  const [activePromptText, setActivePromptText] = useState<string>(PRODUCTS[0].inputPrompt);
  const [customInput, setCustomInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [portSweepKey, setPortSweepKey] = useState(0);
  const [hoverTip, setHoverTip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    kicker: string;
    title: string;
    desc: string;
  }>({ visible: false, x: 0, y: 0, kicker: "", title: "", desc: "" });

  // Mutable animation engine refs (never re-trigger React renders at 60fps!)
  const engineRef = useRef({
    W: 1280,
    H: 580,
    dpr: 1,
    t: 0,
    lastTime: 0,
    coreSpinBoost: 0,
    inViewport: true,
    pageVisible: true,
    rafId: 0 as number,
    bgCanvas: null as HTMLCanvasElement | null,
    nodes: [] as CanvasNode[],
    edges: [] as CanvasEdge[],
    ports: [] as { id: string; x: number; y: number; branch: SynapticBranchId }[],
    ribbons: [] as FluidRibbon[],
    ripples: [] as Ripple[],
    motes: [] as AmbientMote[],
    hoveredNode: null as CanvasNode | null,
    pointer: { nx: 0, ny: 0 },
    parallax: { x: 0, y: 0 },
    promptDrop: { active: false, progress: 0, label: "", targetX: 0, targetY: 0 } as PromptDropState,
    flow: {
      phase: "idle" as FlowPhase,
      branchId: null as SynapticBranchId | null,
      runId: 0,
      portGlow: 0,
    },
    autoMode: true,
    faultMode: false,
    autoIndex: 0,
    autoTimerId: null as number | null,
    autoStartedAt: 0,
    autoDurationMs: 0,
    autoRemainingMs: 0,
  });

  // Respect prefers-reduced-motion on mount without changing visual design for standard users
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setPrefersReducedMotion(true);
      setAutoMode(false);
      engineRef.current.autoMode = false;
    }
  }, []);

  // Sync toggles cleanly into engineRef
  useEffect(() => {
    engineRef.current.autoMode = autoMode;
  }, [autoMode]);

  useEffect(() => {
    engineRef.current.faultMode = faultMode;
  }, [faultMode]);

  // Ref for triggering a smooth flow from React controls without recreating listeners
  const dispatchFlowRef = useRef<
    (branchId: SynapticBranchId, leafName: string | null, customPrompt?: string) => void
  >(() => {});

  const triggerCoreHarmonicRef = useRef<(focusId: CoreFocusId, node: CanvasNode) => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const eng = engineRef.current;
    if (!eng.bgCanvas) {
      eng.bgCanvas = document.createElement("canvas");
    }

    const stars = Array.from({ length: 58 }, (_, i) => ({
      rx: ((i * 83) % 997) / 997,
      ry: ((i * 197) % 991) / 991,
      r: 0.55 + ((i * 31) % 8) * 0.1,
      depth: 0.25 + ((i * 19) % 9) * 0.05,
    }));

    const clearAutoTimer = () => {
      if (eng.autoTimerId !== null) {
        window.clearTimeout(eng.autoTimerId);
        eng.autoTimerId = null;
      }
    };

    const scheduleAutoNext = (delayMs: number) => {
      clearAutoTimer();
      if (!eng.autoMode) return;
      eng.autoDurationMs = delayMs;
      eng.autoStartedAt = performance.now();
      eng.autoRemainingMs = delayMs;
      if (!eng.pageVisible) return;
      eng.autoTimerId = window.setTimeout(() => {
        eng.autoTimerId = null;
        if (!eng.autoMode || !eng.pageVisible) return;
        const order: SynapticBranchId[] = ["chat", "image", "video", "api"];
        eng.autoIndex = (eng.autoIndex + 1) % order.length;
        dispatchFlowRef.current(order[eng.autoIndex], null);
      }, delayMs);
    };

    const rebuildBackdrop = () => {
      const bg = eng.bgCanvas;
      if (!bg) return;
      bg.width = Math.max(1, Math.round(eng.W));
      bg.height = Math.max(1, Math.round(eng.H));
      const bctx = bg.getContext("2d");
      if (!bctx) return;

      bctx.fillStyle = "#000000";
      bctx.fillRect(0, 0, eng.W, eng.H);

      const cx = eng.W * 0.5;
      const cy = eng.W < 780 ? 156 : 168;
      const rad = Math.max(eng.W, eng.H) * 0.52;
      const g = bctx.createRadialGradient(cx, cy, 18, cx, cy, rad);
      g.addColorStop(0, "rgba(31, 91, 124, 0.085)");
      g.addColorStop(0.46, "rgba(18, 53, 74, 0.032)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      bctx.fillStyle = g;
      bctx.fillRect(0, 0, eng.W, eng.H);

      // Quiet architectural hairline polar reference guides (no flashy starfield)
      bctx.save();
      bctx.strokeStyle = "rgba(91, 158, 194, 0.045)";
      bctx.lineWidth = 1;
      [96, 196, 320].forEach((r, idx) => {
        bctx.setLineDash(idx === 1 ? [2, 10] : []);
        bctx.beginPath();
        bctx.arc(cx, cy, r, 0, Math.PI * 2);
        bctx.stroke();
      });
      bctx.restore();
    };

    const buildGraph = () => {
      const W = eng.W;
      const H = eng.H;
      const compact = W < 780;
      const cx = W * 0.5;

      const nodes: CanvasNode[] = [];
      const edges: CanvasEdge[] = [];
      const ports: { id: string; x: number; y: number; branch: SynapticBranchId }[] = [];

      const nGenvia: CanvasNode = {
        id: "genvia",
        label: "GENVIA",
        sub: "PARENT AI COMPANY",
        tier: 0,
        tierName: "GOVERNANCE · PARENT AI COMPANY",
        desc: "Unified models, safety policies, and multimodal infrastructure behind Gyra.",
        icon: "crest",
        x: cx,
        y: compact ? 44 : 50,
        r: compact ? 16 : 19,
        branch: null,
        glow: 0,
        energy: 0,
        pulseBoost: 0,
      };

      const nCore: CanvasNode = {
        id: "core",
        label: "GYRA CORE",
        sub: "UNIFIED INTELLIGENCE ENGINE",
        tier: 1,
        tierName: "PLATFORM CORE · UNIFIED ROUTER",
        desc: "Click to inspect Gyra Intelligence Core — orchestrating Chat, Image, Video & API.",
        icon: "core",
        x: cx,
        y: compact ? 136 : 154,
        r: compact ? 24 : 31,
        branch: null,
        glow: 0,
        energy: 0,
        pulseBoost: 0,
      };

      nodes.push(nGenvia, nCore);
      edges.push({ from: nGenvia, to: nCore, branch: null, kind: "trunk" });

      const stageSpread = compact ? Math.min(114, W * 0.31) : Math.min(256, W * 0.215);
      const stageSpecs = [
        {
          id: "stage-understand",
          label: "UNDERSTAND",
          code: "01",
          icon: "understand",
          desc: "Parses prompts, uploaded PDFs, reference frames & auth.",
        },
        {
          id: "stage-orchestrate",
          label: "ORCHESTRATE",
          code: "02",
          icon: "orchestrate",
          desc: "Routes models, 6-agent handoffs & safety guardrails.",
        },
        {
          id: "stage-execute",
          label: "EXECUTE",
          code: "03",
          icon: "execute",
          desc: "Streams SSE tokens, Pro Ultra stills, 720p video & JSON.",
        },
      ];

      const stageNodes: CanvasNode[] = stageSpecs.map((st, idx) => {
        const sn: CanvasNode = {
          id: st.id,
          stageIdx: idx,
          label: st.label,
          shortCode: st.code,
          tier: 2,
          tierName: `STAGE ${st.code} · ${st.label}`,
          desc: st.desc,
          icon: st.icon,
          x: cx + (idx - 1) * stageSpread,
          y: compact ? 236 : 272,
          r: compact ? 17 : 21,
          branch: null,
          glow: 0,
          energy: 0,
          pulseBoost: 0,
        };
        nodes.push(sn);
        edges.push({ from: nCore, to: sn, branch: null, kind: "core-stage", stageIdx: idx });
        return sn;
      });

      edges.push({ from: stageNodes[0], to: stageNodes[1], branch: null, kind: "stage-chain", stageIdx: 1 });
      edges.push({ from: stageNodes[1], to: stageNodes[2], branch: null, kind: "stage-chain", stageIdx: 2 });

      const prodSpan = compact ? W * 0.78 : Math.min(W * 0.78, 1060);
      const startX = cx - prodSpan * 0.5;
      const stepX = prodSpan / 3;
      const mainPortY = H - 2;

      PRODUCTS.forEach((p, bi) => {
        const px = startX + bi * stepX;
        const py = (compact ? 350 : 386) + (bi === 1 || bi === 2 ? (compact ? 10 : 12) : 0);

        const pn: CanvasNode = {
          id: p.id,
          label: p.name.toUpperCase(),
          sub: p.category.toUpperCase(),
          tier: 3,
          tierName: `PRODUCT ${p.code} · ${p.endpoint}`,
          desc: p.inputPrompt,
          icon: p.id,
          x: px,
          y: py,
          r: compact ? 19 : 24,
          branch: p.id,
          glow: 0,
          energy: 0,
          pulseBoost: 0,
        };
        nodes.push(pn);

        stageNodes.forEach((sn, sIdx) => {
          edges.push({ from: sn, to: pn, branch: p.id, kind: "stage-product", stageIdx: sIdx });
        });

        const portSpread = compact ? W * 0.44 : Math.min(W * 0.48, 560);
        const portX = cx + ((bi - 1.5) / 1.5) * (portSpread * 0.5);
        const portNode = { id: `port-${p.id}`, x: portX, y: mainPortY, branch: p.id };
        ports.push(portNode);

        if (!compact) {
          const leafSpread = Math.min(82, stepX * 0.285);
          p.subEngines.forEach((se, li) => {
            const lx = px + (li - 1) * leafSpread;
            const ly = py + 92 + (li === 1 ? 14 : 0);
            const ln: CanvasNode = {
              id: `${p.id}-leaf-${li}`,
              label: se.name,
              tier: 4,
              tierName: `${p.name.toUpperCase()} GENERATOR`,
              desc: se.role,
              icon: "leaf",
              x: lx,
              y: ly,
              r: 12.8,
              branch: p.id,
              leafName: se.name,
              glow: 0,
              energy: 0,
              pulseBoost: 0,
            };
            nodes.push(ln);
            edges.push({ from: pn, to: ln, branch: p.id, kind: "product-leaf" });
            edges.push({ from: ln, to: portNode, branch: p.id, kind: "generator-port" });
          });
        } else {
          edges.push({ from: pn, to: portNode, branch: p.id, kind: "generator-port" });
        }
      });

      eng.nodes = nodes;
      eng.edges = edges;
      eng.ports = ports;
      eng.motes = Array.from({ length: Math.min(22, edges.length) }, (_, i) => ({
        edgeIdx: (i * 5) % Math.max(1, edges.length),
        u: (i * 0.27) % 1,
        speed: 0.046 + (i % 4) * 0.012,
        r: 1.2 + (i % 2) * 0.35,
        alpha: 0.26 + (i % 3) * 0.07,
      }));
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      eng.W = Math.max(320, Math.round(rect.width));
      eng.H = eng.W < 720 ? 465 : 575;
      eng.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(eng.W * eng.dpr);
      canvas.height = Math.round(eng.H * eng.dpr);
      ctx.setTransform(eng.dpr, 0, 0, eng.dpr, 0, 0);
      rebuildBackdrop();
      buildGraph();
    };

    const spawnRipple = (
      x: number,
      y: number,
      color: string,
      maxR = 46,
      lineWidth = 1.15,
      speed = 1.05,
    ) => {
      eng.ripples.push({ x, y, r: 10, maxR, alpha: 0.42, color, lineWidth, speed });
    };

    const spawnHarmonicBurst = (node: CanvasNode, color = "#78B0CE") => {
      node.energy = 0.85;
      node.pulseBoost = 0.65;
      eng.coreSpinBoost = Math.min(1.4, eng.coreSpinBoost + 0.7);
      // Calm, measured dual precision rings (understated executive response)
      eng.ripples.push(
        { x: node.x, y: node.y, r: node.r * 0.85, maxR: node.r + 36, alpha: 0.48, color: "#B8D6E8", lineWidth: 1.25, speed: 1.15 },
        { x: node.x, y: node.y, r: node.r * 0.65, maxR: node.r + 64, alpha: 0.28, color, lineWidth: 0.95, speed: 0.85 },
      );
    };

    const spawnRibbon = (
      edge: CanvasEdge | undefined,
      opts: { speed?: number; tailLen?: number; color?: string; head?: string; width?: number; onArrive?: () => void } = {},
    ) => {
      if (!edge) return;
      eng.ribbons.push({
        edge,
        rawP: 0,
        speed: (opts.speed ?? 0.85) * 0.86,
        tailLen: opts.tailLen ?? 0.34,
        color: opts.color ?? "#4A89AC",
        head: opts.head ?? "#CBE2F0",
        width: Math.min(2.0, (opts.width ?? 2.0) * 0.76),
        onArrive: opts.onArrive,
        arrived: false,
      });
    };

    // Mature Core / Genvia / Stage click reaction — measured precision rings + inspection without blanking
    triggerCoreHarmonicRef.current = (focusId: CoreFocusId, node: CanvasNode) => {
      setCoreFocus(focusId);
      spawnHarmonicBurst(node, "#78B0CE");

      const relatedEdges = eng.edges.filter((e) => e.from.id === node.id || e.to.id === node.id);
      relatedEdges.slice(0, 6).forEach((e) => {
        spawnRibbon(e, {
          speed: 1.05,
          tailLen: 0.28,
          color: "#4A89AC",
          head: "#CBE2F0",
          width: 1.75,
        });
      });
    };

    // Main silky physics-driven fluid flow with Prompt Drop-In -> Gyra Core -> Stages -> Product -> Generators -> Wired Box!
    dispatchFlowRef.current = (
      branchId: SynapticBranchId,
      leafName: string | null,
      customPrompt?: string,
    ) => {
      const product = PRODUCTS.find((p) => p.id === branchId);
      if (!product) return;

      clearAutoTimer();
      eng.ribbons = [];
      eng.flow.runId += 1;
      const runId = eng.flow.runId;
      eng.flow.branchId = branchId;
      eng.flow.phase = "drop";
      eng.flow.portGlow = 0;

      const orderIdx = PRODUCTS.findIndex((p) => p.id === branchId);
      if (orderIdx >= 0) eng.autoIndex = orderIdx;

      const promptText = customPrompt?.trim() || product.inputPrompt;
      const capsuleLabel = customPrompt?.trim()
        ? customPrompt.trim().slice(0, 34) + (customPrompt.trim().length > 34 ? "…" : "")
        : product.dropLabel;

      setCoreFocus(null);
      setActiveBranchId(branchId);
      setActiveLeafName(leafName);
      setActivePromptText(promptText);
      setFlowPhase("drop");

      const findEdge = (kind: CanvasEdge["kind"], fromId?: string, toId?: string) =>
        eng.edges.find(
          (e) =>
            e.kind === kind &&
            (!fromId || e.from.id === fromId) &&
            (!toId || e.to.id === toId),
        );

      const nGenvia = eng.nodes.find((n) => n.id === "genvia");
      const nCore = eng.nodes.find((n) => n.id === "core");
      const s0 = eng.nodes.find((n) => n.id === "stage-understand");
      const s1 = eng.nodes.find((n) => n.id === "stage-orchestrate");
      const s2 = eng.nodes.find((n) => n.id === "stage-execute");
      const prodNode = eng.nodes.find((n) => n.id === branchId);

      if (!nCore) return;

      // Step 0: Sleek Chat/Prompt Capsule drops cleanly into Gyra Core!
      eng.promptDrop = {
        active: true,
        progress: 0,
        label: capsuleLabel,
        targetX: nCore.x,
        targetY: nCore.y,
        onAbsorb: () => {
          if (eng.flow.runId !== runId) return;
          eng.flow.phase = "trunk";
          setFlowPhase("trunk");
          spawnHarmonicBurst(nCore, "#78B0CE");

          // Subtle governance acknowledgment from Genvia -> Core
          if (nGenvia) {
            nGenvia.energy = 0.9;
            spawnRibbon(findEdge("trunk"), {
              speed: 1.4,
              tailLen: 0.38,
              color: "#5B9EC2",
              head: "#FFFFFF",
              width: 2.3,
            });
          }

          // Step 1: Core -> 01 Understand
          eng.flow.phase = "understand";
          setFlowPhase("understand");
          spawnRibbon(findEdge("core-stage", "core", "stage-understand"), {
            speed: 1.05,
            tailLen: 0.36,
            color: "#5B9EC2",
            head: "#FFFFFF",
            width: 2.7,
            onArrive: () => {
              if (eng.flow.runId !== runId) return;
              if (s0) {
                s0.energy = 1.1;
                spawnRipple(s0.x, s0.y, "#78B0CE", 48);
              }
              eng.flow.phase = "orchestrate";
              setFlowPhase("orchestrate");

              // Step 2: 01 Understand -> 02 Orchestrate
              const isFault = eng.faultMode;
              spawnRibbon(findEdge("stage-chain", "stage-understand", "stage-orchestrate"), {
                speed: 0.96,
                tailLen: 0.38,
                color: isFault ? "#F87171" : "#5B9EC2",
                head: isFault ? "#FECACA" : "#FFFFFF",
                width: 2.7,
                onArrive: () => {
                  if (eng.flow.runId !== runId) return;
                  if (isFault) {
                    if (s1) {
                      s1.energy = 1.3;
                      spawnRipple(s1.x, s1.y, "#F87171", 72, 2.0, 1.2);
                    }
                    eng.flow.phase = "failed";
                    setFlowPhase("failed");
                    setPortSweepKey((k) => k + 1);
                    if (eng.autoMode) scheduleAutoNext(4200);
                    return;
                  }

                  if (s1) {
                    s1.energy = 1.1;
                    spawnRipple(s1.x, s1.y, "#78B0CE", 48);
                  }
                  eng.flow.phase = "execute";
                  setFlowPhase("execute");

                  // Step 3: 02 Orchestrate -> 03 Execute
                  spawnRibbon(findEdge("stage-chain", "stage-orchestrate", "stage-execute"), {
                    speed: 0.96,
                    tailLen: 0.38,
                    color: "#5B9EC2",
                    head: "#FFFFFF",
                    width: 2.7,
                    onArrive: () => {
                      if (eng.flow.runId !== runId) return;
                      if (s2) {
                        s2.energy = 1.15;
                        spawnRipple(s2.x, s2.y, "#78B0CE", 48);
                      }
                      eng.flow.phase = "product";
                      setFlowPhase("product");

                      // Step 4: Stages -> Product Orb
                      const spEdges = eng.edges.filter(
                        (e) => e.kind === "stage-product" && e.branch === branchId,
                      );
                      spEdges.forEach((edge, idx) => {
                        spawnRibbon(edge, {
                          speed: 0.88,
                          tailLen: 0.38,
                          color: "#5B9EC2",
                          head: "#FFFFFF",
                          width: idx === 2 ? 3.0 : 1.7,
                          onArrive:
                            idx === 2
                              ? () => {
                                  if (eng.flow.runId !== runId) return;
                                  if (prodNode) {
                                    prodNode.energy = 1.3;
                                    spawnRipple(prodNode.x, prodNode.y, "#9CC4DC", 66);
                                  }
                                  eng.flow.phase = "generator";
                                  setFlowPhase("generator");

                                  const leafEdges = eng.edges.filter(
                                    (e) => e.kind === "product-leaf" && e.branch === branchId,
                                  );
                                  const portEdges = eng.edges.filter(
                                    (e) => e.kind === "generator-port" && e.branch === branchId,
                                  );

                                  const runPortDelivery = () => {
                                    if (eng.flow.runId !== runId) return;
                                    eng.flow.phase = "wiring";
                                    setFlowPhase("wiring");
                                    portEdges.forEach((pe, pi) => {
                                      spawnRibbon(pe, {
                                        speed: 0.84,
                                        tailLen: 0.44,
                                        color: "#34D399",
                                        head: "#D1FAE5",
                                        width: 2.6,
                                        onArrive:
                                          pi === 0
                                            ? () => {
                                                if (eng.flow.runId !== runId) return;
                                                eng.flow.phase = "done";
                                                eng.flow.portGlow = 1;
                                                setFlowPhase("done");
                                                setPortSweepKey((k) => k + 1);
                                                const port = eng.ports.find(
                                                  (pt) => pt.branch === branchId,
                                                );
                                                if (port) {
                                                  spawnRipple(port.x, port.y, "#34D399", 56);
                                                }
                                                if (eng.autoMode) scheduleAutoNext(4400);
                                              }
                                            : undefined,
                                      });
                                    });
                                  };

                                  if (leafEdges.length > 0) {
                                    leafEdges.forEach((le, li) => {
                                      spawnRibbon(le, {
                                        speed: 0.96,
                                        tailLen: 0.42,
                                        color: "#5B9EC2",
                                        head: "#E6F4FC",
                                        width: 2.3,
                                        onArrive: () => {
                                          const targetLeaf = eng.nodes.find((n) => n.id === le.to.id);
                                          if (targetLeaf) {
                                            targetLeaf.energy = 1.25;
                                            spawnRipple(targetLeaf.x, targetLeaf.y, "#34D399", 34);
                                          }
                                          if (li === 1) runPortDelivery();
                                        },
                                      });
                                    });
                                  } else {
                                    runPortDelivery();
                                  }
                                }
                              : undefined,
                        });
                      });
                    },
                  });
                },
              });
            },
          });
        },
      };
    };

    const drawFluidRibbon = (
      edge: CanvasEdge,
      uStart: number,
      uEnd: number,
      color: string,
      headColor: string,
      width: number,
    ) => {
      const steps = 18;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= steps; i++) {
        const u = uStart + (uEnd - uStart) * (i / steps);
        if (u >= 0 && u <= 1) pts.push(curvePoint(edge, u));
      }
      if (pts.length < 2) return;

      const p0 = pts[0];
      const p1 = pts[pts.length - 1];
      const grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(0.65, color);
      grad.addColorStop(1, headColor);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(p1.x, p1.y, width * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = headColor;
      ctx.globalAlpha = 0.94;
      ctx.fill();
      ctx.restore();
    };

    const drawPromptDropCapsule = () => {
      const drop = eng.promptDrop;
      if (!drop.active) return;

      const eased = easeInOutCubic(Math.min(1, drop.progress));
      const startX = Math.max(130, eng.W * 0.22);
      const startY = 30;
      const ctrlX = startX + (drop.targetX - startX) * 0.65;
      const ctrlY = startY + 12;
      const m = 1 - eased;
      const x = m * m * startX + 2 * m * eased * ctrlX + eased * eased * drop.targetX;
      const y = m * m * startY + 2 * m * eased * ctrlY + eased * eased * drop.targetY;

      // Soft curved inbound stream trail behind the prompt capsule
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, drop.targetX, drop.targetY);
      ctx.strokeStyle = "rgba(91, 158, 194, 0.22)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Fade & compress smoothly as the capsule merges right into Gyra Core
      const scale = eased > 0.78 ? Math.max(0.2, 1 - (eased - 0.78) * 3.6) : 1;
      const alpha = eased < 0.12 ? eased / 0.12 : eased > 0.84 ? Math.max(0, (1 - eased) / 0.16) : 1;

      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      ctx.font = '500 10.5px "JetBrains Mono", monospace';
      const txt = `PROMPT → ${drop.label}`;
      const tw = ctx.measureText(txt).width;
      const padX = 12;
      const boxW = tw + padX * 2;
      const boxH = 26;

      ctx.fillStyle = "#040E18";
      ctx.strokeStyle = "#78B0CE";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-boxW * 0.5, -boxH * 0.5, boxW, boxH, 13);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#E6F4FC";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, 0, 0.5);
      ctx.restore();
    };

    const drawFrame = (now: number) => {
      if (!eng.inViewport || !eng.pageVisible) {
        eng.rafId = 0;
        return;
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - eng.lastTime) / 1000));
      eng.lastTime = now;
      eng.t += dt;
      eng.coreSpinBoost = Math.max(0, eng.coreSpinBoost - dt * 1.45);
      eng.flow.portGlow = Math.max(0, eng.flow.portGlow - dt * 0.35);

      eng.parallax.x += (eng.pointer.nx * 7 - eng.parallax.x) * Math.min(1, dt * 4);
      eng.parallax.y += (eng.pointer.ny * 4 - eng.parallax.y) * Math.min(1, dt * 4);

      // Advance Prompt Drop-In capsule smoothly
      if (eng.promptDrop.active) {
        eng.promptDrop.progress += dt * 1.38;
        if (eng.promptDrop.progress >= 1) {
          eng.promptDrop.active = false;
          const cb = eng.promptDrop.onAbsorb;
          eng.promptDrop.onAbsorb = undefined;
          if (cb) cb();
        }
      }

      // Blit cached backdrop in O(1)
      if (eng.bgCanvas) {
        ctx.drawImage(eng.bgCanvas, 0, 0, eng.W, eng.H);
      } else {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, eng.W, eng.H);
      }

      ctx.save();
      ctx.translate(eng.parallax.x * 0.4, eng.parallax.y * 0.4);

      const branch = eng.flow.branchId;
      const phase = eng.flow.phase;
      const isFailed = phase === "failed";
      const isDone = phase === "done";

      // 1. Structural & Downward Tether Edges (higher visibility for tiny sub-branches)
      for (const e of eng.edges) {
        const isBranch = branch && e.branch === branch;
        const isShared =
          branch && (e.kind === "trunk" || e.kind === "core-stage" || e.kind === "stage-chain");
        const isLit = Boolean(isBranch || isShared);
        const isTinyBranch = e.kind === "product-leaf" || e.kind === "generator-port";

        // Subtle steel-blue under-sheath so tiny branches read crisply against #000000
        if (isTinyBranch || isLit) {
          traceEdgePath(ctx, e);
          ctx.strokeStyle = isLit
            ? isFailed
              ? "rgba(248, 113, 113, 0.16)"
              : isDone
                ? "rgba(75, 155, 130, 0.18)"
                : "rgba(91, 158, 194, 0.20)"
            : "rgba(91, 158, 194, 0.10)";
          ctx.lineWidth = isLit ? 3.8 : 2.6;
          ctx.stroke();
        }

        traceEdgePath(ctx, e);
        if (e.kind === "generator-port" || e.kind === "product-leaf") {
          ctx.strokeStyle = isBranch
            ? isDone
              ? "rgba(75, 155, 130, 0.88)"
              : isFailed
                ? "rgba(248, 113, 113, 0.72)"
                : "rgba(135, 192, 224, 0.85)"
            : branch
              ? "rgba(91, 158, 194, 0.38)"
              : "rgba(120, 176, 206, 0.45)";
          ctx.lineWidth = isBranch ? 2.0 : 1.35;
        } else if (isLit) {
          ctx.strokeStyle = isFailed
            ? "rgba(248, 113, 113, 0.68)"
            : isDone
              ? "rgba(75, 155, 130, 0.76)"
              : "rgba(120, 176, 206, 0.74)";
          ctx.lineWidth = e.kind === "trunk" ? 2.3 : 1.75;
        } else {
          ctx.strokeStyle = branch ? "rgba(91, 158, 194, 0.30)" : "rgba(120, 176, 206, 0.38)";
          ctx.lineWidth = e.kind === "trunk" ? 1.6 : 1.25;
        }
        ctx.stroke();
      }

      // 2. Gentle Ambient Motes
      for (const m of eng.motes) {
        m.u += m.speed * dt;
        if (m.u > 1) {
          m.u = 0;
          m.edgeIdx = (m.edgeIdx + 3) % Math.max(1, eng.edges.length);
        }
        const edge = eng.edges[m.edgeIdx];
        if (!edge) continue;
        const pt = curvePoint(edge, m.u);
        ctx.fillStyle = `rgba(142, 196, 224, ${branch ? m.alpha * 0.72 : m.alpha})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Fluid Luminous Ribbons
      for (let i = eng.ribbons.length - 1; i >= 0; i--) {
        const rb = eng.ribbons[i];
        rb.rawP += rb.speed * dt;
        const headU = easeInOutCubic(Math.min(1, rb.rawP));
        const tailU = Math.max(0, headU - rb.tailLen * (1 - Math.max(0, rb.rawP - 1) * 2.2));
        drawFluidRibbon(rb.edge, tailU, headU, rb.color, rb.head, rb.width);

        if (rb.rawP >= 1 && !rb.arrived) {
          rb.arrived = true;
          if (rb.onArrive) rb.onArrive();
        }
        if (rb.rawP >= 1.38) {
          eng.ribbons.splice(i, 1);
        }
      }

      // 4. Harmonic Precision Ripples
      for (let i = eng.ripples.length - 1; i >= 0; i--) {
        const rp = eng.ripples[i];
        const step = (rp.maxR - rp.r) * Math.min(1, dt * 3.1 * rp.speed) + dt * 16;
        rp.r += step;
        rp.alpha -= dt * 0.72 * rp.speed;
        if (rp.alpha <= 0.015 || rp.r >= rp.maxR) {
          eng.ripples.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.strokeStyle = rp.color;
        ctx.globalAlpha = Math.max(0, rp.alpha);
        ctx.lineWidth = rp.lineWidth;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Bottom Optical Intake Ports (landing directly on the Wired Studio below)
      for (const port of eng.ports) {
        const isAct = branch === port.branch;
        const col = isAct
          ? isDone
            ? "#34D399"
            : isFailed
              ? "#F87171"
              : "#9CC4DC"
          : "#2B536D";
        ctx.save();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(port.x, port.y - 2, isAct ? 4.4 : 2.8, 0, Math.PI * 2);
        ctx.fill();
        if (isAct) {
          ctx.fillStyle = isDone ? "rgba(52, 211, 153, 0.24)" : "rgba(91, 158, 194, 0.25)";
          ctx.beginPath();
          ctx.arc(port.x, port.y - 2, 11 + eng.flow.portGlow * 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 6. Floating Circular Orbs (ZERO rectangular boxes!)
      const compact = eng.W < 780;
      for (const n of eng.nodes) {
        const isHover = eng.hoveredNode === n;
        const isTargetBranch = Boolean(branch && n.branch === branch);
        const isShared = Boolean(branch && n.tier <= 2);

        const stagePassed =
          n.tier === 2 &&
          ((n.stageIdx === 0 &&
            ["understand", "orchestrate", "execute", "product", "generator", "wiring", "done", "failed"].includes(
              phase,
            )) ||
            (n.stageIdx === 1 &&
              ["orchestrate", "execute", "product", "generator", "wiring", "done"].includes(phase)) ||
            (n.stageIdx === 2 &&
              ["execute", "product", "generator", "wiring", "done"].includes(phase)));

        const isStageFail = isFailed && n.tier === 2 && n.stageIdx === 1;
        const isStageActive =
          n.tier === 2 &&
          ((n.stageIdx === 0 && phase === "understand") ||
            (n.stageIdx === 1 && phase === "orchestrate") ||
            (n.stageIdx === 2 && phase === "execute"));

        const targetGlow =
          isHover || isTargetBranch || isStageActive || stagePassed || n.pulseBoost > 0.1
            ? 1
            : isShared
              ? 0.55
              : 0.22;
        n.glow += (targetGlow - n.glow) * Math.min(1, dt * 6);
        n.energy = Math.max(0, n.energy - dt * 1.15);
        n.pulseBoost = Math.max(0, n.pulseBoost - dt * 1.5);

        const breath = 1 + Math.sin(eng.t * 1.75 + n.x * 0.01) * 0.025 + easeOutExpo(n.pulseBoost) * 0.09;
        const rr = n.r * breath;

        // Understated matte ambient ring (executive restraint, zero neon bloom)
        const auraColor = isStageFail
          ? "rgba(217, 102, 102, 0.11)"
          : isDone && (isTargetBranch || stagePassed)
            ? "rgba(75, 155, 130, 0.095)"
            : "rgba(91, 158, 194, 0.085)";
        ctx.fillStyle = auraColor;
        ctx.beginPath();
        ctx.arc(n.x, n.y, rr * (1.36 + n.energy * 0.2), 0, Math.PI * 2);
        ctx.fill();

        // Single quiet precision calibration ring around Gyra Core
        if (n.id === "core") {
          ctx.save();
          ctx.translate(n.x, n.y);
          ctx.rotate(eng.t * (0.18 + eng.coreSpinBoost * 0.45));
          ctx.strokeStyle = "rgba(120, 176, 206, 0.28)";
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 11]);
          ctx.beginPath();
          ctx.arc(0, 0, rr + 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Crisp dark-obsidian matte orb disc
        ctx.fillStyle = isStageFail
          ? "#1B090C"
          : isDone && (isTargetBranch || stagePassed)
            ? "#071814"
            : isTargetBranch || isStageActive || isHover || n.id === "core"
              ? "#0B2132"
              : n.tier === 4
                ? "#081520"
                : "#060D14";
        ctx.strokeStyle = isStageFail
          ? "#D97575"
          : isDone && (isTargetBranch || stagePassed)
            ? "#4B9B82"
            : isTargetBranch || isStageActive || isHover
              ? "#9CC4DC"
              : n.id === "core"
                ? "#6BAAD0"
                : n.tier === 4
                  ? "#3D7394"
                  : "#2B526B";
        ctx.lineWidth = isTargetBranch || isStageActive || isHover || n.id === "core" ? 1.7 : n.tier === 4 ? 1.35 : 1.2;

        ctx.beginPath();
        ctx.arc(n.x, n.y, rr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Subtle metallic top rim
        ctx.strokeStyle = "rgba(195, 224, 240, 0.22)";
        ctx.lineWidth = 0.95;
        ctx.beginPath();
        ctx.arc(n.x, n.y, rr - 1.8, Math.PI * 1.18, Math.PI * 1.82);
        ctx.stroke();

        const iconColor = isStageFail
          ? "#E9A5A5"
          : isDone && (isTargetBranch || stagePassed)
            ? "#8BC8B4"
            : isTargetBranch || isStageActive || isHover || n.id === "core"
              ? "#EDF6FC"
              : n.tier === 4
                ? "#9CC4DC"
                : "#7FAECF";
        drawOrbIcon(ctx, n, iconColor, n.tier === 4 ? 0.96 : compact ? 0.85 : 1.0);

        // Crisp Floating Labels with subtle dark knockout halo so crossing fibers never obscure legibility
        const drawCrispLabel = (
          text: string,
          lx: number,
          ly: number,
          fill: string,
          font: string,
          withMatteBacking = false,
        ) => {
          ctx.font = font;
          ctx.textAlign = "center";
          ctx.lineJoin = "round";
          if (withMatteBacking) {
            const tw = ctx.measureText(text).width;
            ctx.fillStyle = "rgba(2, 8, 14, 0.92)";
            ctx.fillRect(lx - tw * 0.5 - 5, ly - 9.5, tw + 10, 13);
          }
          ctx.strokeStyle = "rgba(0, 0, 0, 0.94)";
          ctx.lineWidth = 4;
          ctx.strokeText(text, lx, ly);
          ctx.fillStyle = fill;
          ctx.fillText(text, lx, ly);
        };

        if (n.tier === 0) {
          drawCrispLabel(n.label, n.x, n.y - rr - 8, "#FFFFFF", '700 11.5px "Barlow Semi Condensed", sans-serif');
        } else if (n.tier === 1) {
          drawCrispLabel(n.label, n.x, n.y + rr + 22, "#FFFFFF", '700 13px "Barlow Semi Condensed", sans-serif');
        } else if (n.tier === 2) {
          const stageFill = isStageFail
            ? "#FCA5A5"
            : isDone && stagePassed
              ? "#A7F3D0"
              : isStageActive || isHover
                ? "#FFFFFF"
                : "#9CC4DC";
          drawCrispLabel(`${n.shortCode} ${n.label}`, n.x, n.y + rr + 16, stageFill, '600 9.5px "JetBrains Mono", monospace');
        } else if (n.tier === 3) {
          drawCrispLabel(
            n.label,
            n.x,
            n.y + rr + 17,
            isTargetBranch || isHover ? "#FFFFFF" : "#D2E2EE",
            '700 13px "Barlow Semi Condensed", sans-serif',
          );
          if (!compact && n.sub) {
            drawCrispLabel(
              n.sub,
              n.x,
              n.y + rr + 29,
              isTargetBranch ? "#9CC4DC" : "#7E99AD",
              '500 8.5px "JetBrains Mono", monospace',
            );
          }
        } else if (n.tier === 4) {
          drawCrispLabel(
            n.label,
            n.x,
            n.y + rr + 14,
            isTargetBranch || isHover ? "#FFFFFF" : "#A6C5DA",
            '500 9.5px "JetBrains Mono", monospace',
            true,
          );
        }
      }

      // 7. Render Active Prompt Drop Capsule gliding smoothly into Gyra Core
      drawPromptDropCapsule();

      ctx.restore();
      eng.rafId = window.requestAnimationFrame(drawFrame);
    };

    const startLoop = () => {
      if (eng.rafId || !eng.inViewport || !eng.pageVisible) return;
      eng.lastTime = performance.now();
      eng.rafId = window.requestAnimationFrame(drawFrame);
    };

    const stopLoop = () => {
      if (eng.rafId) {
        window.cancelAnimationFrame(eng.rafId);
        eng.rafId = 0;
      }
    };

    // Hit test floating orbs with generous touch radius
    const hitNode = (clientX: number, clientY: number): CanvasNode | null => {
      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left - eng.parallax.x * 0.4;
      const my = clientY - rect.top - eng.parallax.y * 0.4;
      for (let i = eng.nodes.length - 1; i >= 0; i--) {
        const n = eng.nodes[i];
        const dx = mx - n.x;
        const dy = my - n.y;
        const hitR = n.r + (n.tier === 4 ? 10 : 12);
        if (dx * dx + dy * dy <= hitR * hitR) return n;
      }
      return null;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      eng.pointer.nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      eng.pointer.ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
      const hit = hitNode(e.clientX, e.clientY);
      eng.hoveredNode = hit;
      canvas.style.cursor = hit ? "pointer" : "default";
      if (hit) {
        const tipX = Math.min(rect.width - 252, Math.max(12, e.clientX - rect.left + 16));
        const tipY = Math.min(rect.height - 96, Math.max(12, e.clientY - rect.top - 12));
        setHoverTip({
          visible: true,
          x: tipX,
          y: tipY,
          kicker: hit.tierName,
          title: hit.label,
          desc: hit.desc,
        });
      } else {
        setHoverTip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    const onMouseLeave = () => {
      eng.hoveredNode = null;
      canvas.style.cursor = "default";
      setHoverTip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    // FIX BLANK-CLICK REGRESSION: Clicking empty background space does LITERALLY NOTHING!
    const onCanvasClick = (e: MouseEvent) => {
      const hit = hitNode(e.clientX, e.clientY);
      if (!hit) return;

      if (hit.branch) {
        dispatchFlowRef.current(hit.branch, hit.leafName ?? null);
      } else if (
        hit.id === "genvia" ||
        hit.id === "core" ||
        hit.id === "stage-understand" ||
        hit.id === "stage-orchestrate" ||
        hit.id === "stage-execute"
      ) {
        triggerCoreHarmonicRef.current(hit.id as CoreFocusId, hit);
      }
    };

    // TAB VISIBILITY PRESERVATION: Freeze exact frame & timer on tab hide, resume cleanly with zero burst!
    const onVisibilityChange = () => {
      if (document.hidden) {
        eng.pageVisible = false;
        stopLoop();
        if (eng.autoTimerId !== null) {
          eng.autoRemainingMs = computeRemainingMs(
            eng.autoStartedAt,
            eng.autoDurationMs,
            performance.now(),
          );
          clearAutoTimer();
        }
      } else {
        eng.pageVisible = true;
        eng.lastTime = performance.now();
        startLoop();
        if (eng.autoMode && eng.autoRemainingMs > 0 && eng.autoTimerId === null) {
          scheduleAutoNext(Math.max(450, eng.autoRemainingMs));
        }
      }
    };

    // INTERSECTION OBSERVER: Pause canvas rAF when scrolled off-screen to keep entire page silky 60fps
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        eng.inViewport = visible;
        if (visible && eng.pageVisible) {
          startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0.04 },
    );
    io.observe(container);

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("click", onCanvasClick);
    document.addEventListener("visibilitychange", onVisibilityChange);

    resize();
    startLoop();

    // Default Auto-Flow starts smoothly on mount
    const bootTimer = window.setTimeout(() => {
      if (eng.pageVisible) {
        dispatchFlowRef.current("chat", null);
      }
    }, 260);

    return () => {
      window.clearTimeout(bootTimer);
      clearAutoTimer();
      stopLoop();
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("click", onCanvasClick);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const handleProductTab = (id: SynapticBranchId) => {
    dispatchFlowRef.current(id, null);
  };

  const handleToggleAuto = () => {
    setAutoMode((prev) => {
      const next = !prev;
      const eng = engineRef.current;
      eng.autoMode = next;
      if (!next) {
        // Cleanly enter Calm Idle
        if (eng.autoTimerId !== null) {
          window.clearTimeout(eng.autoTimerId);
          eng.autoTimerId = null;
        }
        eng.autoRemainingMs = 0;
        eng.ribbons = [];
        eng.promptDrop.active = false;
        eng.flow.runId += 1;
        eng.flow.phase = "idle";
        eng.flow.branchId = null;
        setFlowPhase("idle");
        setActiveBranchId(null);
        setActiveLeafName(null);
        setCoreFocus(null);
      } else {
        dispatchFlowRef.current(activeBranchId ?? "chat", null);
      }
      return next;
    });
  };

  const handleToggleFault = () => {
    setFaultMode((prev) => {
      const next = !prev;
      engineRef.current.faultMode = next;
      dispatchFlowRef.current(activeBranchId ?? "chat", null);
      return next;
    });
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = customInput.trim();
    if (!text) return;
    // Smartly classify which Gyra product handles the user's prompt
    const lower = text.toLowerCase();
    let target: SynapticBranchId = activeBranchId ?? "chat";
    if (/(image|relight|photo|edit|design|poster|flux|dusk)/.test(lower)) target = "image";
    else if (/(video|drone|aerial|clip|cinema|motion|720p|frame)/.test(lower)) target = "video";
    else if (/(api|curl|endpoint|json|bearer|v1|transcript|whisper)/.test(lower)) target = "api";
    else target = "chat";

    setCustomInput("");
    dispatchFlowRef.current(target, null, text);
  };

  const handleCopyCode = async () => {
    const snippet = `export async function POST(req: Request) {
  const valid = timingSafeEqual(sigBuf, expectedBuf);
  if (!valid || Math.abs(now - ts) > 300_000) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json({ ok: true, verifiedBy: "SuperGyra 2.0" });
}`;
    try {
      await navigator.clipboard.writeText(snippet);
    } catch {
      // Ignore clipboard restriction
    }
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1800);
  };

  const activeProduct = PRODUCTS.find((p) => p.id === activeBranchId) ?? null;
  const activeBrief = coreFocus ? CORE_BRIEFS[coreFocus] : null;
  const isDone = flowPhase === "done";
  const isFailed = flowPhase === "failed";
  const isRunning =
    flowPhase !== "idle" && flowPhase !== "done" && flowPhase !== "failed";

  const statusText = isFailed
    ? `FAULT GUARD · ${activeProduct?.name.toUpperCase() ?? "GUARD"}`
    : isDone
      ? `VERIFIED · ${activeProduct?.name.toUpperCase() ?? "DELIVERED"}`
      : flowPhase === "drop"
        ? "INBOUND PROMPT → GYRA CORE"
        : isRunning
          ? `ROUTING · ${activeProduct?.name.toUpperCase() ?? "FLOW"}`
          : "IDLE · STANDBY";

  const getStageRowState = (idx: number): "pending" | "active" | "done" | "failed" => {
    if (!activeProduct || flowPhase === "idle") return "pending";
    if (isFailed) {
      if (idx === 0) return "done";
      if (idx === 1) return "failed";
      return "pending";
    }
    if (isDone) return "done";
    if (idx === 0) {
      if (flowPhase === "drop" || flowPhase === "trunk") return "pending";
      return flowPhase === "understand" ? "active" : "done";
    }
    if (idx === 1) {
      if (["drop", "trunk", "understand"].includes(flowPhase)) return "pending";
      return flowPhase === "orchestrate" ? "active" : "done";
    }
    if (["drop", "trunk", "understand", "orchestrate"].includes(flowPhase)) return "pending";
    return flowPhase === "execute" ? "active" : "done";
  };

  return (
    <div className="mt-9 sm:mt-10" aria-label="Gyra Synaptic Neural Flow and Wired Execution Studio">
      {/* 1. UNOBSTRUCTED 21-ORB FLOATING NEURAL CANOPY + DOWNWARD TETHER WIRES */}
      <div
        ref={containerRef}
        data-testid="synaptic-canopy-frame"
        data-phase={flowPhase}
        className="relative h-[465px] sm:h-[575px] w-full overflow-hidden border border-[#172838] border-b-0 bg-black"
      >
        <canvas
          ref={canvasRef}
          data-testid="synaptic-canvas"
          className="block h-full w-full"
          aria-label="Interactive Gyra Intelligence Tree wired downward into Execution Studio"
        />

        {/* Quiet Floating Hover Tooltip (only visible when hovering an orb — zero permanent overlays) */}
        <div
          role="status"
          aria-live="polite"
          style={{ left: hoverTip.x, top: hoverTip.y }}
          className={`pointer-events-none absolute z-10 max-w-[248px] border border-[#2E6485] bg-[#040910] px-3 py-2 transition-opacity duration-150 ${
            hoverTip.visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-mono-tech text-[9px] tracking-[0.14em] text-[#5B9EC2] uppercase">
            {hoverTip.kicker}
          </p>
          <p className="font-display mt-0.5 text-[14px] font-bold tracking-tight text-white uppercase">
            {hoverTip.title}
          </p>
          <p className="mt-1 text-[11.5px] leading-[1.4] text-[#A9BDCD]">{hoverTip.desc}</p>
        </div>
      </div>

      {/* 2. DEDICATED WIRED SAAS EXECUTION & RESULT STUDIO (PHYSICALLY CONNECTED BELOW) */}
      <div
        className={`relative overflow-hidden border bg-[#04080D] transition-colors duration-300 ${
          isFailed
            ? "border-[#F87171]/55"
            : isDone
              ? "border-[#34D399]/45"
              : isRunning
                ? "border-[#2B5E7D]"
                : "border-[#172838]"
        }`}
      >
        {/* Top Optical Intake Sweep Bar where the 4 downward port anchors connect */}
        <div className="relative h-[2px] w-full overflow-hidden bg-[#101E2B]">
          <div
            key={portSweepKey}
            className={`absolute inset-0 ${
              portSweepKey > 0 ? "gyra-port-sweep" : "opacity-0"
            }`}
            style={{
              background: isFailed
                ? "linear-gradient(90deg, transparent 0%, #F87171 40%, #FECACA 50%, #F87171 60%, transparent 100%)"
                : isDone
                  ? "linear-gradient(90deg, transparent 0%, #34D399 40%, #A7F3D0 50%, #34D399 60%, transparent 100%)"
                  : "linear-gradient(90deg, transparent 0%, #5B9EC2 35%, #9CC4DC 50%, #5B9EC2 65%, transparent 100%)",
            }}
          />
        </div>

        {/* Wired Studio Control Header: Status + Product Tabs + Auto/Idle & Fault Guard */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#12202D] bg-[#03060B] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`font-mono-tech inline-flex items-center gap-2 border px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase ${
                isFailed
                  ? "border-[#F87171]/55 bg-[#1C0A0D] text-[#FECACA]"
                  : isDone
                    ? "border-[#34D399]/50 bg-[#041614] text-[#A7F3D0]"
                    : isRunning
                      ? "border-[#5B9EC2] bg-[#06131E] text-white"
                      : "border-[#1A2F42] bg-[#060D15] text-[#9CC4DC]"
              }`}
            >
              {statusText}
            </span>

            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleAuto}
                aria-pressed={autoMode}
                className={`font-mono-tech inline-flex min-h-[30px] items-center gap-1.5 border px-2.5 text-[10px] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                  autoMode
                    ? "border-[#5B9EC2] bg-[#1F5B7C] text-white"
                    : "border-[#203344] bg-[#060D14] text-[#9BB0C2] hover:border-[#5B9EC2] hover:text-white"
                }`}
              >
                {autoMode ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                <span>{autoMode ? "Auto-Flow" : "Idle"}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleFault}
                aria-pressed={faultMode}
                className={`font-mono-tech inline-flex min-h-[30px] items-center gap-1.5 border px-2.5 text-[10px] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                  faultMode
                    ? "border-[#F87171] bg-[#2C1014] text-white"
                    : "border-[#2A2224] bg-[#070A0E] text-[#CFA5AA] hover:border-[#F87171]/60 hover:text-white"
                }`}
              >
                <AlertTriangle className="h-3 w-3" />
                <span>{faultMode ? "Fault: On" : "Fault Guard"}</span>
              </button>
            </div>
          </div>

          {/* 4 Product Dispatch Tabs */}
          <div
            role="tablist"
            aria-label="Dispatch Gyra Product Flow"
            className="flex flex-wrap items-center gap-1 border border-[#162636] bg-[#050B11] p-1"
          >
            {PRODUCTS.map((p) => {
              const selected = activeBranchId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => handleProductTab(p.id)}
                  className={`font-mono-tech min-h-[30px] px-3 text-[10.5px] tracking-[0.09em] uppercase transition-colors cursor-pointer whitespace-nowrap ${
                    selected
                      ? isFailed
                        ? "border border-[#F87171]/60 bg-[#1E0B0E] text-[#FECACA]"
                        : isDone
                          ? "border border-[#34D399]/50 bg-[#061A17] text-white"
                          : "border border-[#5B9EC2] bg-[#0D273B] text-white"
                      : "border border-transparent text-[#8DA2B5] hover:bg-[#091724] hover:text-white"
                  }`}
                >
                  {p.code} {p.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main 2-Column SaaS Execution & Result Grid */}
        <div className="grid grid-cols-1 divide-y divide-[#12202D] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Left 6 cols: Interactive Prompt Drop Composer + 3-Stage Live Execution Trace */}
          <div className="flex flex-col justify-between gap-4 p-5 sm:p-6 lg:col-span-6">
            <div>
              {/* Interactive Prompt Drop Bar — send a custom prompt and watch it drop into Gyra Core! */}
              <form
                onSubmit={handlePromptSubmit}
                className="flex items-center gap-2 border border-[#192D3F] bg-[#050C13] px-3 py-2 focus-within:border-[#5B9EC2]"
              >
                <span className="font-mono-tech shrink-0 text-[10px] tracking-[0.12em] text-[#5B9EC2] uppercase">
                  Prompt
                </span>
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Type a prompt to drop into Gyra Core (e.g. relight studio, webhook API)..."
                  aria-label="Send a prompt into Gyra Core flow"
                  className="min-w-0 flex-1 bg-transparent text-[12.5px] text-white placeholder-[#5B7285] focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Drop prompt into Gyra Core"
                  className="font-mono-tech inline-flex min-h-[30px] shrink-0 items-center gap-1.5 bg-[#1F5B7C] px-3 text-[10px] font-medium tracking-[0.1em] text-white uppercase transition-colors hover:bg-[#296E93] cursor-pointer"
                >
                  <Send className="h-3 w-3" />
                  <span>Drop</span>
                </button>
              </form>

              {/* Active Prompt / Core Architecture Inspection Brief */}
              {activeBrief ? (
                <div className="mt-3.5 border border-[#27516D] bg-[#06121C] p-3.5">
                  <div className="flex items-center justify-between gap-2 font-mono-tech text-[9.5px] tracking-[0.13em] text-[#78B0CE] uppercase">
                    <span>{activeBrief.kicker}</span>
                    <span>CORE INSPECTOR</span>
                  </div>
                  <p className="font-display mt-1 text-[20px] font-bold tracking-tight text-white uppercase">
                    {activeBrief.title}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-[1.55] text-[#C4D6E4]">
                    {activeBrief.summary}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2 font-mono-tech text-[10px] text-[#8EC2DF]">
                    {activeBrief.tags.map((tag, i) => (
                      <span key={tag}>
                        {i > 0 && <span className="mr-2 text-[#2E546D]">·</span>}
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3.5 border border-[#162737] bg-[#050B11] px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-2 font-mono-tech text-[9.5px] tracking-[0.13em] text-[#5B9EC2] uppercase">
                    <span>{activeProduct ? `${activeProduct.name} Input` : "Architecture Standby"}</span>
                    <span className="text-[#7E96AA]">{activeProduct?.endpoint ?? "GENVIA → GYRA CORE"}</span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-[1.48] text-[#E6F0F8]">
                    {activeProduct
                      ? activePromptText
                      : "Flow paused in calm idle. Click any floating orb above, press Auto-Flow, or drop a prompt to watch it flow through Gyra Core."}
                  </p>
                </div>
              )}

              {/* 3-Stage Live Execution Rows */}
              <div className="mt-3.5 space-y-2">
                {(activeProduct
                  ? activeProduct.stageNarratives
                  : [
                      {
                        stage: "01 · Understand",
                        headline: "Intent, context, files & scoped auth",
                        detail: "Ready for inbound chat, image frame, video prompt, or API payload.",
                      },
                      {
                        stage: "02 · Orchestrate",
                        headline: "Model routing, 6-agent graph & guardrails",
                        detail: "Selects Gyra 1.0, SuperGyra 2.0, Pro Ultra I2I, or LTX-Video 13B.",
                      },
                      {
                        stage: "03 · Execute",
                        headline: "Verified output delivery down optical tethers",
                        detail: "Streams code, edited stills, 720p clips, or REST JSON cleanly.",
                      },
                    ]
                ).map((item, idx) => {
                  const rowState = getStageRowState(idx);
                  const isFaultRow = rowState === "failed" && activeProduct;
                  return (
                    <div
                      key={item.stage}
                      className={`grid grid-cols-[18px_1fr_auto] items-start gap-3 border px-3 py-2.5 transition-colors duration-300 ${
                        rowState === "failed"
                          ? "border-[#F87171]/55 bg-[#1A0A0D]"
                          : rowState === "done"
                            ? "border-[#34D399]/35 bg-[#041311]"
                            : rowState === "active"
                              ? "border-[#5B9EC2] bg-[#081A28]"
                              : "border-[#101D29] bg-[#050A10] opacity-75"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border font-mono-tech text-[9px] ${
                          rowState === "failed"
                            ? "border-[#F87171] bg-[#F87171]/15 text-[#F87171]"
                            : rowState === "done"
                              ? "border-[#34D399] bg-[#34D399]/15 text-[#34D399]"
                              : rowState === "active"
                                ? "border-[#9CC4DC] text-[#9CC4DC]"
                                : "border-[#2A4C63] text-transparent"
                        }`}
                      >
                        {rowState === "done" ? "✓" : rowState === "failed" ? "!" : rowState === "active" ? "•" : ""}
                      </span>

                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium leading-[1.3] text-white">
                          {isFaultRow ? activeProduct.failNarrative.headline : item.headline}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-[1.42] text-[#8CA1B3]">
                          {isFaultRow ? activeProduct.failNarrative.detail : item.detail}
                        </p>
                      </div>

                      <span
                        className={`font-mono-tech shrink-0 pt-0.5 text-[9.5px] tracking-[0.12em] uppercase ${
                          rowState === "failed"
                            ? "text-[#F87171]"
                            : rowState === "done"
                              ? "text-[#34D399]"
                              : rowState === "active"
                                ? "text-[#9CC4DC]"
                                : "text-[#5D7183]"
                        }`}
                      >
                        {rowState === "done"
                          ? "Verified"
                          : rowState === "failed"
                            ? "Halted"
                            : rowState === "active"
                              ? "Active"
                              : "Queued"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 6 cols: Tailored Visual Result Artifact Studio */}
          <div className="flex flex-col justify-between gap-4 bg-[#020509] p-5 sm:p-6 lg:col-span-6">
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono-tech text-[10px] tracking-[0.14em] text-[#5B9EC2] uppercase">
                  {activeProduct
                    ? isFailed
                      ? `Fault Guard · ${activeProduct.endpoint}`
                      : activeProduct.outputLabel
                    : "Output Artifact Studio"}
                </span>
                <span
                  className={`font-mono-tech text-[10px] tracking-[0.12em] uppercase ${
                    isFailed
                      ? "text-[#F87171]"
                      : isDone
                        ? "text-[#34D399]"
                        : isRunning
                          ? "text-[#9CC4DC]"
                          : "text-[#6D8396]"
                  }`}
                >
                  {isFailed
                    ? "Intercepted Safely"
                    : isDone
                      ? "Delivered"
                      : isRunning
                        ? "Synthesizing"
                        : "Standby"}
                </span>
              </div>

              {/* Dynamic Visual Result Viewport */}
              <div className="mt-3 flex flex-1 flex-col justify-center border border-[#132230] bg-[#04090F] p-4">
                {!activeProduct ? (
                  <div className="space-y-2">
                    <p className="font-mono-tech text-[11px] text-[#8EC2DF]">
                      12 GENERATOR CHANNELS WIRED · STANDBY
                    </p>
                    <p className="text-[12.5px] leading-[1.55] text-[#8EA2B4]">
                      Click any floating orb in the tree above, switch to Auto-Flow, or drop a prompt on the left to watch fluid execution deliver verified code, relit imagery, 720p video, or REST JSON here.
                    </p>
                  </div>
                ) : isRunning ? (
                  <div className="space-y-3">
                    <p className="font-mono-tech text-[11px] text-[#9CC4DC]">
                      {flowPhase === "drop"
                        ? `Dropping prompt into Gyra Intelligence Core...`
                        : `Streaming signal through ${activeProduct.name} generators → optical intake...`}
                    </p>
                    <div className="h-2.5 w-[90%] bg-[#0D2132] animate-pulse" />
                    <div className="h-2.5 w-[74%] bg-[#0B1C2B] animate-pulse" />
                    <div className="h-2.5 w-[58%] bg-[#091724] animate-pulse" />
                  </div>
                ) : isFailed ? (
                  <div className="space-y-2.5">
                    <p className="font-display text-[19px] font-bold tracking-tight text-[#FECACA] uppercase">
                      {activeProduct.failNarrative.headline}
                    </p>
                    <p className="text-[12.5px] leading-[1.55] text-[#D6B4B8]">
                      {activeProduct.failNarrative.detail}
                    </p>
                    <p className="border-t border-[#2D1418] pt-2.5 font-mono-tech text-[10.5px] text-[#FCA5A5]">
                      Zero corrupted output written · User session and credits preserved cleanly.
                    </p>
                  </div>
                ) : activeProduct.id === "chat" ? (
                  <div>
                    <div className="mb-2 flex items-center justify-between font-mono-tech text-[10px] text-[#6D8599]">
                      <span>webhook-handler.ts · SuperGyra 2.0</span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-1 text-[#9CC4DC] hover:text-white cursor-pointer"
                      >
                        {copiedCode ? <Check className="h-3 w-3 text-[#34D399]" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedCode ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <pre
                      role="region"
                      aria-label="Gyra Chat verified TypeScript output"
                      tabIndex={0}
                      className="overflow-x-auto font-mono-tech text-[11px] leading-[1.62] text-[#D4E4F0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2]"
                    >
                      <code>{`export async function POST(req: Request) {
  const valid = timingSafeEqual(sigBuf, expectedBuf);
  if (!valid || Math.abs(now - ts) > 300_000) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json({ ok: true, verifiedBy: "Sentinel QA" });
}`}</code>
                    </pre>
                  </div>
                ) : activeProduct.id === "image" ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="relative aspect-[16/10] overflow-hidden border border-[#1C3346] bg-black">
                      <picture className="block h-full w-full">
                        <source srcSet="/showcase/edit-before.webp" type="image/webp" />
                        <img
                          src="/showcase/edit-before.jpg"
                          alt="Original overcast architectural interior"
                          width={1200}
                          height={896}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </picture>
                      <span className="font-mono-tech absolute bottom-1.5 left-1.5 bg-black/85 px-1.5 py-0.5 text-[9px] text-[#D4E4F0] uppercase">
                        Original · Daylight
                      </span>
                    </div>
                    <div className="relative aspect-[16/10] overflow-hidden border border-[#34D399]/50 bg-black">
                      <picture className="block h-full w-full">
                        <source srcSet="/showcase/edit-after.webp" type="image/webp" />
                        <img
                          src="/showcase/edit-after.jpg"
                          alt="Gyra Pro Ultra tungsten dusk edit"
                          width={1200}
                          height={896}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </picture>
                      <span className="font-mono-tech absolute bottom-1.5 left-1.5 bg-[#1F5B7C] px-1.5 py-0.5 text-[9px] text-white uppercase">
                        Pro Ultra · 2700K Dusk
                      </span>
                    </div>
                  </div>
                ) : activeProduct.id === "video" ? (
                  <div className="space-y-2.5">
                    <div className="relative aspect-[21/9] overflow-hidden border border-[#1E3A50] bg-black">
                      <video
                        src="/products-hero-bg.mp4"
                        poster="/showcase/video-ref-lagos.jpg"
                        width={720}
                        height={1280}
                        preload="metadata"
                        autoPlay={!prefersReducedMotion}
                        muted
                        loop
                        playsInline
                        aria-hidden="true"
                        className="h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="font-mono-tech absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[9.5px] text-[#DCE9F3]">
                        <span>LTX-VIDEO 13B · 121 FRAMES</span>
                        <span className="text-[#34D399]">720P · 24 FPS</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 font-mono-tech text-[9px] text-[#8DB6CE]">
                      {["F001 · Anchor", "F040 · Glide", "F080 · Reflections", "F121 · Locked"].map(
                        (frame, i) => (
                          <div
                            key={frame}
                            className={`border px-2 py-1 text-center ${
                              i === 3
                                ? "border-[#34D399]/50 bg-[#051B16] text-[#A7F3D0]"
                                : "border-[#16293A] bg-[#06111B]"
                            }`}
                          >
                            {frame}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ) : (
                  <pre
                    role="region"
                    aria-label="Gyra OpenAI-compatible API JSON response"
                    tabIndex={0}
                    className="overflow-x-auto font-mono-tech text-[11px] leading-[1.62] text-[#D4E4F0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2]"
                  >
                    <code>{`{
  "id": "chatcmpl-gyra-v1",
  "object": "chat.completion",
  "model": "gyra-super2.0",
  "status": "200 OK · OpenAI-compatible",
  "choices": [{ "finish_reason": "stop" }]
}`}</code>
                  </pre>
                )}
              </div>
            </div>

            {/* Bottom Sub-Engine Metadata + Direct Section & Product Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#12202D] pt-3">
              <div className="flex flex-wrap items-center gap-2 font-mono-tech text-[10px] text-[#8DA2B5]">
                {(activeProduct?.subEngines ?? []).map((se, idx) => (
                  <span
                    key={se.name}
                    className={
                      activeLeafName && se.name === activeLeafName ? "text-white font-medium" : ""
                    }
                  >
                    {idx > 0 && <span className="mr-2 text-[#264156]">·</span>}
                    {se.name}
                  </span>
                ))}
              </div>

              {activeProduct && (
                <div className="flex items-center gap-3">
                  <a
                    href={activeProduct.sectionHref}
                    className="font-mono-tech inline-flex items-center gap-1 text-[10.5px] tracking-[0.09em] text-[#9BB0C2] uppercase transition-colors hover:text-white"
                  >
                    <span>{activeProduct.sectionLabel}</span>
                    <ArrowDown className="h-3 w-3 text-[#5B9EC2]" />
                  </a>
                  <a
                    href={resolveGyraRoute(activeProduct.appHref, routeBase)}
                    className="font-mono-tech inline-flex items-center gap-1 bg-[#1F5B7C] px-3 py-1.5 text-[10.5px] font-medium tracking-[0.09em] text-white uppercase transition-colors hover:bg-[#296E93]"
                  >
                    <span>{activeProduct.appLabel}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
