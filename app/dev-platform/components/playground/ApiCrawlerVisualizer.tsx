"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Network,
  FileCode2,
  BarChart3,
  Bug,
  Hand,
  ZoomIn,
  ZoomOut,
  ArrowUpRight,
} from "lucide-react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type CrawlerStage = "route" | "crawl" | "report";

export interface LiveExecutionSnapshot {
  statusCode: number | null;
  latencyMs: number | null;
  ttftMs: number | null;
  tokenCount: number | null;
  requestId: string | null;
  payloadSizeLabel: string | null;
  streaming?: boolean;
}

export interface CrawlerQueueItem {
  id: string;
  method: "POST" | "GET";
  path: string;
  boxCode: string;
  subCode: string;
  shortLabel: string;
  model: string;
  cluster: ClusterId;
  targetNodeId: string;
  status: number;
  latencyMs: number;
  ttftMs: number;
  tokens: number;
  costLabel: string;
  costNote: string;
  payloadSize: string;
  timestamp: string;
  systemPrompt: string;
  userMessage: string;
  stream: boolean;
}

export interface ApiCrawlerVisualizerProps {
  endpointPath: string;
  method: "POST" | "GET";
  model: string;
  systemPrompt: string;
  userMessage: string;
  stream: boolean;
  includeVoice?: boolean;
  runSignal?: number;
  isProcessing?: boolean;
  liveExecution?: LiveExecutionSnapshot | null;
  onSelectQueueItem?: (item: CrawlerQueueItem) => void;
}

type ClusterId = "gateway" | "chat" | "reasoning" | "media_gen" | "media_intel" | "ledger";

/**
 * Gyra Precision Telemetry Palette
 * Merges Option 03 Precision Radar observability geometry with Telemetry Core's
 * high-contrast colors harmonized to Gyra Playground (#000000 / #09090B / #1F5B7C / #7DD3FC).
 */
const GYRA_TELEMETRY_THEME = {
  bg: "#03060A",
  vignette: "rgba(31, 91, 124, 0.16)",
  radarRing: "rgba(91, 158, 194, 0.14)",
  radarSweep: "rgba(56, 189, 248, 0.065)",
  spiderPrimary: "#FACC15",
  spiderSecondary: "#38BDF8",
  spiderLeg: "#E4E4E7",
  spiderLegGlow: "#7DD3FC",
  reportHeaderBg: "#1F5B7C",
  reportHeaderText: "#F8FAFC",
  accentGold: "#FACC15",
  clusterColors: {
    gateway: "#FACC15",
    chat: "#38BDF8",
    reasoning: "#A78BFA",
    media_gen: "#FB7185",
    media_intel: "#34D399",
    ledger: "#7DD3FC",
  } as Record<ClusterId, string>,
};

export const SAMPLE_QUEUE: CrawlerQueueItem[] = [
  {
    id: "req_chat_live",
    method: "POST",
    path: "/api/v1/chat",
    boxCode: "CHAT 1.0",
    subCode: "POST · SSE",
    shortLabel: "POST /v1/chat",
    model: "gyra-1.0",
    cluster: "chat",
    targetNodeId: "hub-gyra-1.0",
    status: 200,
    latencyMs: 184,
    ttftMs: 58,
    tokens: 342,
    costLabel: "$0.0000",
    costNote: "Free tier quota",
    payloadSize: "1.4 KB",
    timestamp: "16:45:12",
    systemPrompt: "You are Gyra, a concise AI infrastructure assistant.",
    userMessage:
      "Design a TypeScript webhook signature verifier using HMAC-SHA256 with replay protection.",
    stream: true,
  },
  {
    id: "req_chat_super",
    method: "POST",
    path: "/api/v1/chat",
    boxCode: "SUPER 2.0",
    subCode: "POST · 32K",
    shortLabel: "POST /v1/chat · 2.0",
    model: "gyra-super2.0",
    cluster: "reasoning",
    targetNodeId: "hub-super-2.0",
    status: 200,
    latencyMs: 412,
    ttftMs: 118,
    tokens: 786,
    costLabel: "$0.0031",
    costNote: "Deep reasoning",
    payloadSize: "3.1 KB",
    timestamp: "16:44:51",
    systemPrompt: "You are SuperGyra 2.0, an expert distributed systems architect.",
    userMessage:
      "Compare token bucket vs sliding window rate limiters in Redis for multi-region API gateways.",
    stream: true,
  },
  {
    id: "req_video_ltx",
    method: "POST",
    path: "/api/v1/video/generate",
    boxCode: "VIDEO LTX",
    subCode: "POST · 720P",
    shortLabel: "POST /v1/video",
    model: "gyra-video-1.0",
    cluster: "media_gen",
    targetNodeId: "hub-ltx-video",
    status: 202,
    latencyMs: 268,
    ttftMs: 92,
    tokens: 124,
    costLabel: "$2.0000",
    costNote: "Async 720p render",
    payloadSize: "0.9 KB",
    timestamp: "16:43:19",
    systemPrompt: "Render studio macro shot with controlled cinematic lighting.",
    userMessage: "Slow orbital pass over matte anodized titanium watch tourbillon.",
    stream: false,
  },
  {
    id: "req_media_whisper",
    method: "POST",
    path: "/api/v1/media/transcribe",
    boxCode: "WHISPER",
    subCode: "POST · ASR",
    shortLabel: "POST /v1/transcribe",
    model: "whisper-large-v3",
    cluster: "media_intel",
    targetNodeId: "hub-whisper-v3",
    status: 200,
    latencyMs: 326,
    ttftMs: 104,
    tokens: 518,
    costLabel: "$0.0060",
    costNote: "Audio -> JSON",
    payloadSize: "2.2 KB",
    timestamp: "16:41:08",
    systemPrompt: "Transcribe audio stream with word-level timestamps.",
    userMessage: "https://cdn.gyra.ng/samples/earnings-clip.mp3",
    stream: false,
  },
  {
    id: "req_voice_tts",
    method: "POST",
    path: "/api/v1/voice",
    boxCode: "VOICE HD",
    subCode: "POST · PCM",
    shortLabel: "POST /v1/voice",
    model: "gyra-voice-hd",
    cluster: "media_gen",
    targetNodeId: "hub-voice-hd",
    status: 200,
    latencyMs: 149,
    ttftMs: 44,
    tokens: 96,
    costLabel: "$0.0015",
    costNote: "24kHz PCM stream",
    payloadSize: "0.8 KB",
    timestamp: "16:39:42",
    systemPrompt: "Warm studio voice cadence at 1.0x speed.",
    userMessage: "All systems operational across Lagos and Frankfurt edge nodes.",
    stream: true,
  },
  {
    id: "req_media_yt",
    method: "GET",
    path: "/api/v1/media/youtube/metadata",
    boxCode: "YT META",
    subCode: "GET · JSON",
    shortLabel: "GET /v1/media/yt",
    model: "gyra-extract-v2",
    cluster: "media_intel",
    targetNodeId: "hub-yt-extract",
    status: 200,
    latencyMs: 118,
    ttftMs: 39,
    tokens: 210,
    costLabel: "$0.0004",
    costNote: "Caption index",
    payloadSize: "1.9 KB",
    timestamp: "16:38:04",
    systemPrompt: "Extract structured video chapters and metadata.",
    userMessage: "https://youtube.com/watch?v=gyra-architecture-demo",
    stream: false,
  },
  {
    id: "req_credits",
    method: "GET",
    path: "/api/v1/credits",
    boxCode: "CREDITS",
    subCode: "GET · LEDGER",
    shortLabel: "GET /v1/credits",
    model: "ledger-core",
    cluster: "ledger",
    targetNodeId: "hub-ledger",
    status: 200,
    latencyMs: 42,
    ttftMs: 18,
    tokens: 24,
    costLabel: "$0.0000",
    costNote: "Wallet check",
    payloadSize: "0.3 KB",
    timestamp: "16:36:50",
    systemPrompt: "Read workspace credit balance and rate quotas.",
    userMessage: "workspace_balance_snapshot",
    stream: false,
  },
];

interface ClusterDef {
  id: ClusterId;
  code: string;
  label: string;
  cx: number;
  cy: number;
  spreadX: number;
  spreadY: number;
  count: number;
}

const CLUSTER_DEFS: ClusterDef[] = [
  { id: "gateway", code: "EDGE", label: "GATEWAY & AUTH", cx: 0.2, cy: 0.25, spreadX: 0.11, spreadY: 0.13, count: 16 },
  { id: "chat", code: "CHAT", label: "GYRA 1.0 INFERENCE", cx: 0.64, cy: 0.2, spreadX: 0.15, spreadY: 0.12, count: 22 },
  { id: "reasoning", code: "SUPR", label: "SUPERGYRA 2.0", cx: 0.83, cy: 0.44, spreadX: 0.13, spreadY: 0.14, count: 20 },
  { id: "media_gen", code: "GEN", label: "VIDEO & VOICE GPU", cx: 0.28, cy: 0.74, spreadX: 0.14, spreadY: 0.14, count: 18 },
  { id: "media_intel", code: "MED", label: "MEDIA INTELLIGENCE", cx: 0.74, cy: 0.77, spreadX: 0.15, spreadY: 0.13, count: 19 },
  { id: "ledger", code: "LDGR", label: "USAGE & BILLING", cx: 0.5, cy: 0.52, spreadX: 0.1, spreadY: 0.1, count: 13 },
];

interface ConstellationNode {
  id: string;
  label?: string;
  role?: string;
  cluster: ClusterId;
  nx: number;
  ny: number;
  r: number;
  isHub?: boolean;
}

function seededRand(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildDenseConstellation(): {
  nodes: ConstellationNode[];
  edges: Array<[number, number]>;
  hubIndexById: Map<string, number>;
} {
  const rand = seededRand(424821);
  const nodes: ConstellationNode[] = [];
  const hubIndexById = new Map<string, number>();

  const namedHubs: ConstellationNode[] = [
    {
      id: "hub-edge-tls",
      label: "NGINX EDGE TLS",
      role: "Terminates HTTP/2 & keeps SSE stream unbuffered",
      cluster: "gateway",
      nx: 0.14,
      ny: 0.22,
      r: 4.5,
      isHub: true,
    },
    {
      id: "hub-auth-sha",
      label: "SHA-256 KEY AUTH",
      role: "Verifies gyra_ API key hash & enforces 100 req/min limit",
      cluster: "gateway",
      nx: 0.26,
      ny: 0.19,
      r: 4.2,
      isHub: true,
    },
    {
      id: "hub-guardrails",
      label: "JAILBREAK GUARD",
      role: "Scans user prompt payload for injection patterns",
      cluster: "gateway",
      nx: 0.23,
      ny: 0.34,
      r: 3.8,
      isHub: true,
    },
    {
      id: "hub-gyra-1.0",
      label: "GYRA 1.0 CORE",
      role: "Low-latency inference engine · 58ms TTFT streaming",
      cluster: "chat",
      nx: 0.63,
      ny: 0.19,
      r: 5.2,
      isHub: true,
    },
    {
      id: "hub-sse-pipe",
      label: "SSE TOKEN PIPE",
      role: "Emits live delta chunks straight to Playground client",
      cluster: "chat",
      nx: 0.72,
      ny: 0.27,
      r: 4,
      isHub: true,
    },
    {
      id: "hub-super-2.0",
      label: "SUPERGYRA 2.0",
      role: "32k deep-reasoning cluster for architecture & code",
      cluster: "reasoning",
      nx: 0.84,
      ny: 0.43,
      r: 5.2,
      isHub: true,
    },
    {
      id: "hub-kv-cache",
      label: "KV CONTEXT MEM",
      role: "Caches system prompt embeddings for repeat requests",
      cluster: "reasoning",
      nx: 0.76,
      ny: 0.51,
      r: 3.8,
      isHub: true,
    },
    {
      id: "hub-ltx-video",
      label: "LTX-VIDEO 720P",
      role: "Async GPU video generation queue via Fal proxy",
      cluster: "media_gen",
      nx: 0.24,
      ny: 0.72,
      r: 4.8,
      isHub: true,
    },
    {
      id: "hub-voice-hd",
      label: "GYRA VOICE 24K",
      role: "Real-time neural speech synthesis worker",
      cluster: "media_gen",
      nx: 0.36,
      ny: 0.81,
      r: 4.4,
      isHub: true,
    },
    {
      id: "hub-whisper-v3",
      label: "WHISPER LARGE V3",
      role: "High-accuracy audio transcription with word timestamps",
      cluster: "media_intel",
      nx: 0.71,
      ny: 0.75,
      r: 4.8,
      isHub: true,
    },
    {
      id: "hub-yt-extract",
      label: "YT · TIKTOK IDX",
      role: "Structured transcript & social metadata extractor",
      cluster: "media_intel",
      nx: 0.84,
      ny: 0.81,
      r: 4.2,
      isHub: true,
    },
    {
      id: "hub-ledger",
      label: "USAGE & CREDITS",
      role: "Logs token counts, latency & billing to Supabase",
      cluster: "ledger",
      nx: 0.5,
      ny: 0.52,
      r: 4.8,
      isHub: true,
    },
  ];

  namedHubs.forEach((h) => {
    hubIndexById.set(h.id, nodes.length);
    nodes.push(h);
  });

  for (const c of CLUSTER_DEFS) {
    for (let i = 0; i < c.count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = Math.pow(rand(), 0.62);
      const nx = Math.max(0.05, Math.min(0.95, c.cx + Math.cos(angle) * c.spreadX * dist));
      const ny = Math.max(0.06, Math.min(0.94, c.cy + Math.sin(angle) * c.spreadY * dist));
      nodes.push({
        id: `${c.id}-${i}`,
        cluster: c.id,
        nx,
        ny,
        r: 1.5 + rand() * 1.9,
      });
    }
  }

  const edges: Array<[number, number]> = [];
  const edgeSet = new Set<string>();
  const addEdge = (a: number, b: number) => {
    if (a === b) return;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edges.push([a, b]);
    }
  };

  for (let i = 0; i < nodes.length; i++) {
    const ni = nodes[i];
    const sameCluster: Array<{ idx: number; d: number }> = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j || nodes[j].cluster !== ni.cluster) continue;
      const d = Math.hypot(nodes[i].nx - nodes[j].nx, nodes[i].ny - nodes[j].ny);
      sameCluster.push({ idx: j, d });
    }
    sameCluster.sort((a, b) => a.d - b.d);
    const linkCount = ni.isHub ? 5 : 2 + (i % 2);
    for (let k = 0; k < Math.min(linkCount, sameCluster.length); k++) {
      addEdge(i, sameCluster[k].idx);
    }
  }

  const highways: Array<[string, string]> = [
    ["hub-edge-tls", "hub-auth-sha"],
    ["hub-edge-tls", "hub-guardrails"],
    ["hub-auth-sha", "hub-gyra-1.0"],
    ["hub-auth-sha", "hub-ledger"],
    ["hub-guardrails", "hub-ledger"],
    ["hub-ledger", "hub-gyra-1.0"],
    ["hub-ledger", "hub-super-2.0"],
    ["hub-ledger", "hub-ltx-video"],
    ["hub-ledger", "hub-voice-hd"],
    ["hub-ledger", "hub-whisper-v3"],
    ["hub-gyra-1.0", "hub-sse-pipe"],
    ["hub-sse-pipe", "hub-super-2.0"],
    ["hub-super-2.0", "hub-kv-cache"],
    ["hub-kv-cache", "hub-whisper-v3"],
    ["hub-ltx-video", "hub-voice-hd"],
    ["hub-voice-hd", "hub-whisper-v3"],
    ["hub-whisper-v3", "hub-yt-extract"],
  ];

  for (const [aId, bId] of highways) {
    const ai = hubIndexById.get(aId);
    const bi = hubIndexById.get(bId);
    if (ai !== undefined && bi !== undefined) addEdge(ai, bi);
  }

  return { nodes, edges, hubIndexById };
}

const CONSTELLATION = buildDenseConstellation();

interface CodeLineItem {
  num: number;
  tag: "HDR" | "REQ" | "SSE" | "RES";
  prefix: string;
  highlightToken?: string;
  suffix?: string;
  metricId?: string;
  accent?: string;
  explanation: string;
}

interface ExtractedMetric {
  id: string;
  label: string;
  value: string;
  sublabel: string;
  lineNum: number;
  accent: string;
}

interface BioLeg {
  side: -1 | 1;
  index: number;
  footX: number;
  footY: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  stepProgress: number;
}

interface DataSpark {
  fromX: number;
  fromY: number;
  p: number;
  color: string;
}

interface FootRipple {
  x: number;
  y: number;
  age: number;
  color: string;
}

class PrecisionBrainCrawler {
  x: number;
  y: number;
  angle: number;
  scale: number;
  legs: BioLeg[];
  sparks: DataSpark[];
  ripples: FootRipple[];
  probePoint: { x: number; y: number } | null = null;

  constructor(x: number, y: number, scale = 1) {
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 6;
    this.scale = scale;
    this.legs = [];
    this.sparks = [];
    this.ripples = [];
    this.reset(x, y, scale);
  }

  reset(x: number, y: number, scale = this.scale) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.legs = [];
    for (const side of [-1, 1] as const) {
      for (let i = 0; i < 4; i++) {
        const pt = this.idealFoot(side, i);
        this.legs.push({
          side,
          index: i,
          footX: pt.x,
          footY: pt.y,
          startX: pt.x,
          startY: pt.y,
          targetX: pt.x,
          targetY: pt.y,
          stepProgress: 1,
        });
      }
    }
  }

  private idealFoot(side: -1 | 1, index: number) {
    const offsets = [-0.62, -0.18, 0.24, 0.72];
    const reaches = [62, 56, 58, 64];
    const ang = this.angle + side * (Math.PI / 2 + offsets[index]);
    const r = reaches[index] * this.scale;
    return {
      x: this.x + Math.cos(ang) * r,
      y: this.y + Math.sin(ang) * r,
    };
  }

  update(
    goalX: number,
    goalY: number,
    dt: number,
    t: number,
    accent: string,
    speed = 0.11
  ) {
    const dx = goalX - this.x;
    const dy = goalY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1.5) {
      const desired = Math.atan2(dy, dx);
      let dAng = desired - this.angle;
      while (dAng > Math.PI) dAng -= Math.PI * 2;
      while (dAng < -Math.PI) dAng += Math.PI * 2;
      this.angle += dAng * Math.min(1, dt * 7.2);

      const move = 1 - Math.exp(-speed * 60 * dt);
      this.x += dx * move;
      this.y += dy * move;
    } else {
      this.x += Math.sin(t * 2.4) * 0.14;
      this.y += Math.cos(t * 1.9) * 0.14;
    }

    const groupAMoving = this.legs.some(
      (l) => (l.index + (l.side === 1 ? 1 : 0)) % 2 === 0 && l.stepProgress < 0.7
    );
    const groupBMoving = this.legs.some(
      (l) => (l.index + (l.side === 1 ? 1 : 0)) % 2 === 1 && l.stepProgress < 0.7
    );

    const stepDist = 20 * this.scale;

    for (const leg of this.legs) {
      if (leg.stepProgress < 1) {
        leg.stepProgress = Math.min(1, leg.stepProgress + dt * 8.2);
        const p = leg.stepProgress;
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        leg.footX = leg.startX + (leg.targetX - leg.startX) * ease;
        leg.footY = leg.startY + (leg.targetY - leg.startY) * ease;
        if (leg.stepProgress >= 1) {
          this.ripples.push({ x: leg.footX, y: leg.footY, age: 0, color: accent });
          if (this.ripples.length > 18) this.ripples.shift();
        }
      } else {
        const ideal = this.idealFoot(leg.side, leg.index);
        let wantX = ideal.x;
        let wantY = ideal.y;

        if (leg.index === 0 && this.probePoint && dist < 38) {
          const pdx = this.probePoint.x - ideal.x;
          const pdy = this.probePoint.y - ideal.y;
          if (Math.hypot(pdx, pdy) < 95 * this.scale) {
            wantX = ideal.x + pdx * 0.62 + Math.sin(t * 4.2 + leg.side) * 3;
            wantY = ideal.y + pdy * 0.62 + Math.cos(t * 3.7 + leg.side) * 3;
          }
        }

        const err = Math.hypot(wantX - leg.footX, wantY - leg.footY);
        const isGroupA = (leg.index + (leg.side === 1 ? 1 : 0)) % 2 === 0;
        const canStep = isGroupA ? !groupBMoving : !groupAMoving;

        if (err > stepDist && canStep) {
          leg.startX = leg.footX;
          leg.startY = leg.footY;
          const lead = Math.min(20 * this.scale, dist * 0.32);
          const lx = dist > 2 ? (dx / dist) * lead : 0;
          const ly = dist > 2 ? (dy / dist) * lead : 0;
          leg.targetX = wantX + lx;
          leg.targetY = wantY + ly;
          leg.stepProgress = 0;
        }
      }
    }

    if (Math.random() < dt * 11) {
      const leg = this.legs[Math.floor(Math.random() * this.legs.length)];
      if (leg) {
        this.sparks.push({ fromX: leg.footX, fromY: leg.footY, p: 0, color: accent });
        if (this.sparks.length > 18) this.sparks.shift();
      }
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      this.sparks[i].p += dt * 2.2;
      if (this.sparks[i].p >= 1) this.sparks.splice(i, 1);
    }

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      this.ripples[i].age += dt * 1.8;
      if (this.ripples[i].age >= 1) this.ripples.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D, t: number, badge?: string, isProcessing = false) {
    const breatheMul = isProcessing
      ? 1 + Math.sin(t * 9.0) * 0.085
      : 1 + Math.sin(t * 2.8) * 0.032;
    const s = this.scale * breatheMul;
    const breath = isProcessing
      ? 0.65 + 0.35 * Math.sin(t * 9.5)
      : 0.5 + 0.5 * Math.sin(t * 3.4);
    const theme = GYRA_TELEMETRY_THEME;

    ctx.save();

    // Expanding pulse waves around spider during active API request processing
    if (isProcessing) {
      for (let wIdx = 0; wIdx < 2; wIdx++) {
        const phase = (t * 1.35 + wIdx * 0.5) % 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, (16 + phase * 38) * this.scale, 0, Math.PI * 2);
        ctx.strokeStyle = wIdx === 0 ? theme.spiderPrimary : theme.spiderSecondary;
        ctx.globalAlpha = (1 - phase) * 0.52;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    for (const r of this.ripples) {
      ctx.beginPath();
      ctx.arc(r.x, r.y, (2 + r.age * 13) * s, 0, Math.PI * 2);
      ctx.strokeStyle = r.color;
      ctx.globalAlpha = (1 - r.age) * 0.42;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (this.probePoint) {
      const d = Math.hypot(this.probePoint.x - this.x, this.probePoint.y - this.y);
      if (d < 105 * s) {
        const mx = (this.x + this.probePoint.x) / 2 + Math.sin(t * 7) * 6;
        const my = (this.y + this.probePoint.y) / 2 + Math.cos(t * 6) * 6;
        ctx.beginPath();
        ctx.moveTo(this.probePoint.x, this.probePoint.y);
        ctx.quadraticCurveTo(mx, my, this.x, this.y);
        ctx.strokeStyle = theme.spiderSecondary;
        ctx.globalAlpha = 0.45 + breath * 0.4;
        ctx.lineWidth = 1.35;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    for (const leg of this.legs) {
      const hipAng = this.angle + leg.side * (Math.PI / 2) + (leg.index - 1.5) * 0.24;
      const hipX =
        this.x +
        Math.cos(hipAng) * (7 * s) +
        Math.cos(this.angle) * (3.2 - leg.index * 2.1) * s;
      const hipY =
        this.y +
        Math.sin(hipAng) * (7 * s) +
        Math.sin(this.angle) * (3.2 - leg.index * 2.1) * s;

      const dx = leg.footX - hipX;
      const dy = leg.footY - hipY;
      const dist = Math.max(10, Math.hypot(dx, dy));
      const dir = Math.atan2(dy, dx);

      const stepLift =
        leg.stepProgress < 1 ? Math.sin(leg.stepProgress * Math.PI) * 11 * s : 0;
      const archDir = (leg.index < 2 ? -leg.side : leg.side) * 0.44;

      const k1x = hipX + Math.cos(dir + archDir) * Math.min(28 * s, dist * 0.48);
      const k1y =
        hipY + Math.sin(dir + archDir) * Math.min(28 * s, dist * 0.48) - (10 * s + stepLift);

      const k2x = k1x + (leg.footX - k1x) * 0.56 + Math.cos(dir + archDir * 0.3) * (4 * s);
      const k2y = k1y + (leg.footY - k1y) * 0.56 - (3 * s + stepLift * 0.3);

      const isFront = leg.index === 0;

      if (isFront) {
        ctx.beginPath();
        ctx.moveTo(hipX, hipY);
        ctx.lineTo(k1x, k1y);
        ctx.lineTo(k2x, k2y);
        ctx.lineTo(leg.footX, leg.footY);
        ctx.strokeStyle = theme.spiderLegGlow;
        ctx.globalAlpha = 0.24 + breath * 0.18;
        ctx.lineWidth = 4.6 * s;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(k1x, k1y);
      ctx.strokeStyle = isFront ? theme.spiderPrimary : theme.spiderLeg;
      ctx.lineWidth = 2.1 * s;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(k1x, k1y);
      ctx.lineTo(k2x, k2y);
      ctx.strokeStyle = isFront ? theme.spiderLegGlow : "rgba(228, 228, 231, 0.78)";
      ctx.lineWidth = 1.45 * s;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(k2x, k2y);
      ctx.lineTo(leg.footX, leg.footY);
      ctx.strokeStyle = isFront ? "#FFFFFF" : theme.spiderLeg;
      ctx.lineWidth = 0.95 * s;
      ctx.stroke();

      ctx.fillStyle = isFront ? theme.spiderPrimary : "#F4F4F5";
      ctx.beginPath();
      ctx.arc(k1x, k1y, 1.8 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = theme.spiderSecondary;
      ctx.beginPath();
      ctx.arc(k2x, k2y, 1.3 * s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isFront ? theme.spiderPrimary : theme.spiderLegGlow;
      ctx.beginPath();
      ctx.arc(leg.footX, leg.footY, (isFront ? 2.5 : 1.7) * s, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const sp of this.sparks) {
      const sx = sp.fromX + (this.x - sp.fromX) * sp.p;
      const sy = sp.fromY + (this.y - sp.fromY) * sp.p;
      ctx.beginPath();
      ctx.arc(sx, sy, (2 - sp.p * 0.7) * s, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = sp.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const aura = ctx.createRadialGradient(-4 * s, 0, 2 * s, -4 * s, 0, 32 * s);
    aura.addColorStop(0, "rgba(56, 189, 248, 0.36)");
    aura.addColorStop(0.55, "rgba(250, 204, 21, 0.14)");
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(-4 * s, 0, 32 * s, 0, Math.PI * 2);
    ctx.fill();

    const palpSwing = Math.sin(t * 5.8) * 1.8 * s;
    for (const side of [-1, 1] as const) {
      ctx.beginPath();
      ctx.moveTo(8 * s, side * 2.5 * s);
      ctx.quadraticCurveTo(15 * s, side * 6.5 * s + palpSwing * side, 19 * s, side * 2.5 * s);
      ctx.strokeStyle = theme.spiderLeg;
      ctx.lineWidth = 1.3 * s;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(19 * s, side * 2.5 * s, 1.4 * s, 0, Math.PI * 2);
      ctx.fillStyle = theme.spiderPrimary;
      ctx.fill();
    }

    ctx.beginPath();
    ctx.ellipse(-11 * s, 0, 11 * s, 8 * s, 0, 0, Math.PI * 2);
    const bodyGrad = ctx.createRadialGradient(-9 * s, -2 * s, 1 * s, -11 * s, 0, 12 * s);
    bodyGrad.addColorStop(0, "rgba(56, 189, 248, 0.56)");
    bodyGrad.addColorStop(0.55, "#0B1522");
    bodyGrad.addColorStop(1, "#03060A");
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = theme.spiderSecondary;
    ctx.lineWidth = 1.35 * s;
    ctx.stroke();

    ctx.save();
    ctx.strokeStyle = "#E0F2FE";
    ctx.globalAlpha = 0.55 + breath * 0.42;
    ctx.lineWidth = 0.95 * s;
    for (const side of [-1, 1] as const) {
      ctx.beginPath();
      ctx.moveTo(-18 * s, side * 1.5 * s);
      ctx.bezierCurveTo(-15 * s, side * 5.8 * s, -8 * s, side * 5.5 * s, -5 * s, side * 1.4 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-15.5 * s, side * 3.2 * s);
      ctx.quadraticCurveTo(-11 * s, side * 0.9 * s, -7.2 * s, side * 2.9 * s);
      ctx.stroke();
    }
    const firingDots = [
      [-15.5, -2.5],
      [-15.5, 2.5],
      [-11, -3.8],
      [-11, 3.8],
      [-7, 0],
    ];
    for (let i = 0; i < firingDots.length; i++) {
      const [fx, fy] = firingDots[i];
      ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 4.5 + i * 1.3));
      ctx.fillStyle = i % 2 === 0 ? "#FFFFFF" : theme.spiderPrimary;
      ctx.beginPath();
      ctx.arc(fx * s, fy * s, 1.3 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.beginPath();
    ctx.ellipse(4.8 * s, 0, 6.2 * s, 4.9 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#090E16";
    ctx.fill();
    ctx.strokeStyle = theme.spiderLeg;
    ctx.lineWidth = 1.25 * s;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(4.2 * s, 0, (2.2 + breath * 0.5) * s, 0, Math.PI * 2);
    ctx.fillStyle = theme.spiderPrimary;
    ctx.shadowColor = theme.spiderPrimary;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#FFFFFF";
    const eyes = [
      [9.5, -1.8, 1.35],
      [9.5, 1.8, 1.35],
      [8.4, -3.5, 0.9],
      [8.4, 3.5, 0.9],
      [10.4, -0.5, 0.8],
      [10.4, 0.5, 0.8],
    ];
    for (const [ex, ey, er] of eyes) {
      ctx.beginPath();
      ctx.arc(ex * s, ey * s, er * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    if (badge) {
      ctx.save();
      ctx.font = "700 9.5px 'JetBrains Mono', monospace";
      const tw = ctx.measureText(badge).width;
      const bx = this.x - tw / 2 - 6;
      const by = this.y - 38 * s;
      ctx.fillStyle = "rgba(3, 6, 10, 0.94)";
      ctx.strokeStyle = theme.spiderPrimary;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.roundRect(bx, by, tw + 12, 16, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = theme.spiderPrimary;
      ctx.textBaseline = "middle";
      ctx.fillText(badge, bx + 6, by + 8.3);
      ctx.restore();
    }

    ctx.restore();
  }
}

function truncateText(str: string, max: number): string {
  const clean = str.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

export function ApiCrawlerVisualizer({
  endpointPath,
  method,
  model,
  systemPrompt,
  userMessage,
  stream,
  includeVoice = false,
  runSignal = 0,
  isProcessing = false,
  liveExecution = null,
  onSelectQueueItem,
}: ApiCrawlerVisualizerProps) {
  const theme = GYRA_TELEMETRY_THEME;

  const [stage, setStage] = useState<CrawlerStage>("route");
  const [selectedQueueId, setSelectedQueueId] = useState<string>(SAMPLE_QUEUE[0].id);
  const [focusedCluster, setFocusedCluster] = useState<ClusterId | null>(null);
  const [activeHubId, setActiveHubId] = useState<string>("hub-gyra-1.0");
  const [activeCodeLine, setActiveCodeLine] = useState<number>(5);
  const [taggedLines, setTaggedLines] = useState<number[]>([5, 11, 15, 18, 21, 22]);
  const [steerMode, setSteerMode] = useState<boolean>(false);
  const [activeReportMetricId, setActiveReportMetricId] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [pulseBurst, setPulseBurst] = useState<boolean>(false);

  const activelyProcessing = Boolean(isProcessing || liveExecution?.streaming || pulseBurst);
  const isProcessingRef = useRef<boolean>(activelyProcessing);
  isProcessingRef.current = activelyProcessing;

  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const graphWrapRef = useRef<HTMLDivElement | null>(null);
  const codeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const codeWrapRef = useRef<HTMLDivElement | null>(null);

  const graphSpiderRef = useRef<PrecisionBrainCrawler | null>(null);
  const codeSpiderRef = useRef<PrecisionBrainCrawler | null>(null);
  const activeHubIdRef = useRef<string>(activeHubId);
  const activeCodeLineRef = useRef<number>(activeCodeLine);
  activeHubIdRef.current = activeHubId;
  activeCodeLineRef.current = activeCodeLine;
  const userGraphTargetRef = useRef<{ x: number; y: number; until: number } | null>(null);
  const userCodeTargetRef = useRef<{ x: number; y: number; until: number } | null>(null);
  const pointerDownRef = useRef<boolean>(false);
  const cameraRef = useRef<{ zoom: number; cx: number; cy: number }>({ zoom: 1, cx: 0.5, cy: 0.5 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Sync selected API box highlight whenever Playground endpoint or model changes externally
  useEffect(() => {
    const matched = SAMPLE_QUEUE.find(
      (q) =>
        (q.path === endpointPath && (endpointPath !== "/api/v1/chat" || q.model === model)) ||
        (endpointPath.includes("youtube") && q.id === "req_media_yt") ||
        (endpointPath.includes("transcribe") && q.id === "req_media_whisper") ||
        (endpointPath.includes("video") && q.id === "req_video_ltx") ||
        (endpointPath.includes("voice") && q.id === "req_voice_tts") ||
        (endpointPath.includes("credits") && q.id === "req_credits")
    );
    if (matched) setSelectedQueueId(matched.id);
  }, [endpointPath, model]);

  // Combine Playground inputs + real live execution result when available
  const activeTrace = useMemo(() => {
    const matched = SAMPLE_QUEUE.find((q) => q.id === selectedQueueId) ?? SAMPLE_QUEUE[0];
    const isSuper = model.toLowerCase().includes("super");
    const isVideo = endpointPath.includes("video");
    const isMedia = endpointPath.includes("media");
    const isVoice = endpointPath.includes("voice");
    const isCredits = endpointPath.includes("credits");

    const cluster: ClusterId = isCredits
      ? "ledger"
      : isVideo || isVoice
        ? "media_gen"
        : isMedia
          ? "media_intel"
          : isSuper
            ? "reasoning"
            : "chat";

    const targetNodeId = isCredits
      ? "hub-ledger"
      : isVideo
        ? "hub-ltx-video"
        : isVoice
          ? "hub-voice-hd"
          : isMedia
            ? endpointPath.includes("youtube")
              ? "hub-yt-extract"
              : "hub-whisper-v3"
            : isSuper
              ? "hub-super-2.0"
              : "hub-gyra-1.0";

    const chars = (systemPrompt?.length ?? 0) + (userMessage?.length ?? 0);
    const estTokens = Math.max(76, Math.round(chars * 0.44) + (isSuper ? 520 : 240));
    const estLatencyMs = isCredits ? 42 : isSuper ? 412 : isVideo ? 268 : isMedia ? 326 : 184;
    const estTtftMs = isCredits ? 18 : isSuper ? 118 : isVideo ? 92 : isMedia ? 104 : 58;
    const costLabel = isVideo
      ? "$2.0000"
      : isSuper
        ? "$0.0031"
        : isMedia
          ? "$0.0060"
          : "$0.0000";
    const costNote = isVideo
      ? "Async 720p render"
      : isSuper
        ? "SuperGyra 2.0 tier"
        : isMedia
          ? "Media extraction"
          : "Free tier quota";

    const payloadBytes = new Blob([
      JSON.stringify({ model, systemPrompt, userMessage, stream, includeVoice }),
    ]).size;
    const estPayloadSize = `${Math.max(0.5, (payloadBytes + estTokens * 3.1) / 1024).toFixed(1)} KB`;

    const status = liveExecution?.statusCode ?? matched.status;
    const latencyMs = liveExecution?.latencyMs && liveExecution.latencyMs > 0
      ? liveExecution.latencyMs
      : estLatencyMs;
    const ttftMs = liveExecution?.ttftMs && liveExecution.ttftMs > 0
      ? liveExecution.ttftMs
      : estTtftMs;
    const tokens = liveExecution?.tokenCount && liveExecution.tokenCount > 0
      ? liveExecution.tokenCount
      : estTokens;
    const payloadSize = liveExecution?.payloadSizeLabel ?? estPayloadSize;
    const requestId =
      liveExecution?.requestId ??
      `req_gyra_${(chars + tokens).toString(16).padStart(4, "0")}9f`;

    return {
      ...matched,
      method,
      path: endpointPath,
      model,
      cluster,
      targetNodeId,
      status,
      latencyMs,
      ttftMs,
      tokens,
      costLabel,
      costNote,
      payloadSize,
      systemPrompt,
      userMessage,
      stream,
      requestId,
      isLiveExecution: Boolean(liveExecution?.statusCode),
    };
  }, [
    selectedQueueId,
    endpointPath,
    method,
    model,
    systemPrompt,
    userMessage,
    stream,
    includeVoice,
    liveExecution,
  ]);

  useEffect(() => {
    setActiveHubId(activeTrace.targetNodeId);
    activeHubIdRef.current = activeTrace.targetNodeId;
    if (runSignal > 0) {
      setFocusedCluster(activeTrace.cluster);
      userGraphTargetRef.current = null;
      setPulseBurst(true);
      const timer = window.setTimeout(() => setPulseBurst(false), 2600);
      return () => window.clearTimeout(timer);
    }
  }, [activeTrace.targetNodeId, activeTrace.cluster, runSignal]);

  const codeLines = useMemo<CodeLineItem[]>(() => {
    const sysPreview = truncateText(
      activeTrace.systemPrompt || "You are Gyra, a concise AI infrastructure assistant.",
      34
    );
    const userPreview = truncateText(
      activeTrace.userMessage || "Design a TypeScript HMAC-SHA256 webhook verifier.",
      36
    );

    return [
      {
        num: 1,
        tag: "HDR",
        prefix: `${activeTrace.method} `,
        highlightToken: `${activeTrace.path} HTTP/2`,
        accent: theme.clusterColors.gateway,
        explanation: `TLS 1.3 edge connection hits Nginx proxy with proxy_buffering=off for real-time streaming.`,
      },
      {
        num: 2,
        tag: "HDR",
        prefix: `Authorization: Bearer `,
        highlightToken: `gyra_••••9f42`,
        accent: theme.clusterColors.gateway,
        explanation: `Key hashed via SHA-256 in 4ms; workspace quota & rate bucket verified.`,
      },
      {
        num: 3,
        tag: "HDR",
        prefix: `X-Request-Id: `,
        highlightToken: activeTrace.requestId,
        accent: theme.spiderSecondary,
        explanation: `Deterministic trace ID attached across gateway, model worker, and billing ledger.`,
      },
      {
        num: 4,
        tag: "REQ",
        prefix: `{`,
        explanation: `JSON request body enters Gyra schema validator.`,
      },
      {
        num: 5,
        tag: "REQ",
        prefix: `  "model": `,
        highlightToken: `"${activeTrace.model}"`,
        suffix: `,`,
        metricId: "model",
        accent: theme.clusterColors.chat,
        explanation: `AI brain routes request directly into the ${activeTrace.model} compute pool.`,
      },
      {
        num: 6,
        tag: "REQ",
        prefix: `  "stream": `,
        highlightToken: activeTrace.stream ? `true` : `false`,
        suffix: `,  "voice": ${includeVoice ? "true" : "false"},`,
        accent: theme.spiderSecondary,
        explanation: activeTrace.stream
          ? `Server-Sent Events enabled — tokens flush as soon as generated.`
          : `Single JSON payload response mode selected.`,
      },
      {
        num: 7,
        tag: "REQ",
        prefix: `  "system": "${sysPreview}",`,
        explanation: `System directive pinned at context slot 0 and cached in KV memory.`,
      },
      {
        num: 8,
        tag: "REQ",
        prefix: `  "user":   "${userPreview}"`,
        explanation: `User prompt cleared by jailbreak detector and tokenized for inference.`,
      },
      {
        num: 9,
        tag: "REQ",
        prefix: `}`,
        explanation: `Payload sealed and forwarded over internal mesh to target cluster.`,
      },
      {
        num: 10,
        tag: "SSE",
        prefix: `event: chunk_001  delta: `,
        highlightToken: `"import crypto from 'crypto';"`,
        accent: theme.clusterColors.reasoning,
        explanation: `First token emitted at ${activeTrace.ttftMs}ms TTFT — streaming begins.`,
      },
      {
        num: 11,
        tag: "SSE",
        prefix: `event: status     code:  `,
        highlightToken: `${activeTrace.status} OK`,
        metricId: "status",
        accent: "#34D399",
        explanation: `HTTP ${activeTrace.status} confirmed from upstream inference engine.`,
      },
      {
        num: 12,
        tag: "SSE",
        prefix: `event: chunk_018  delta: "timingSafeEqual(sig, expected)"`,
        explanation: `Streaming cryptographic verification logic chunk by chunk.`,
      },
      {
        num: 13,
        tag: "SSE",
        prefix: `event: chunk_042  delta: "if (Math.abs(now - ts) > 300) throw"`,
        explanation: `Replay-attack timestamp window appended to response stream.`,
      },
      {
        num: 14,
        tag: "RES",
        prefix: `// TELEMETRY FILED INTO GYRA BRAIN`,
        explanation: `Stream closed with [DONE]; spider consolidates exact execution telemetry.`,
      },
      {
        num: 15,
        tag: "RES",
        prefix: `  "ttft_ms": `,
        highlightToken: `${activeTrace.ttftMs}ms`,
        suffix: `,`,
        metricId: "ttft",
        accent: "#FACC15",
        explanation: `Measured edge time-to-first-token: ${activeTrace.ttftMs}ms.`,
      },
      {
        num: 16,
        tag: "RES",
        prefix: `  "gateway_overhead_ms": 11,`,
        explanation: `Total TLS + SHA-256 auth + guardrail latency overhead.`,
      },
      {
        num: 17,
        tag: "RES",
        prefix: `  "finish_reason": "stop",`,
        explanation: `Generation terminated naturally with zero truncation.`,
      },
      {
        num: 18,
        tag: "RES",
        prefix: `  "total_latency_ms": `,
        highlightToken: `${activeTrace.latencyMs}ms`,
        suffix: `,`,
        metricId: "latency",
        accent: theme.clusterColors.chat,
        explanation: `End-to-end round-trip latency recorded at ${activeTrace.latencyMs}ms.`,
      },
      {
        num: 19,
        tag: "RES",
        prefix: `  "prompt_tokens": ${Math.round(activeTrace.tokens * 0.22)},`,
        explanation: `Input prompt tokenized and metered.`,
      },
      {
        num: 20,
        tag: "RES",
        prefix: `  "completion_tokens": ${Math.round(activeTrace.tokens * 0.78)},`,
        explanation: `Output tokens streamed across ${Math.max(12, Math.round(activeTrace.tokens / 8))} SSE frames.`,
      },
      {
        num: 21,
        tag: "RES",
        prefix: `  "total_tokens": `,
        highlightToken: `${activeTrace.tokens} tok`,
        suffix: `,`,
        metricId: "tokens",
        accent: theme.clusterColors.reasoning,
        explanation: `${activeTrace.tokens} combined tokens synced to Usage & Analytics.`,
      },
      {
        num: 22,
        tag: "RES",
        prefix: `  "cost_usd": `,
        highlightToken: `${activeTrace.costLabel}`,
        suffix: `  // ${activeTrace.costNote}`,
        metricId: "cost",
        accent: theme.clusterColors.media_gen,
        explanation: `Request billed at ${activeTrace.costLabel} (${activeTrace.costNote}).`,
      },
    ];
  }, [activeTrace, includeVoice, theme]);

  const extractedMetrics = useMemo<ExtractedMetric[]>(
    () => [
      {
        id: "model",
        label: "MODEL ROUTE",
        value: activeTrace.model,
        sublabel: activeTrace.stream ? "SSE live stream" : "JSON response",
        lineNum: 5,
        accent: theme.clusterColors.chat,
      },
      {
        id: "status",
        label: "HTTP STATUS",
        value: `${activeTrace.status} OK`,
        sublabel: activeTrace.requestId,
        lineNum: 11,
        accent: "#34D399",
      },
      {
        id: "ttft",
        label: "FIRST TOKEN",
        value: `${activeTrace.ttftMs}ms`,
        sublabel: "Edge TTFT",
        lineNum: 15,
        accent: "#FACC15",
      },
      {
        id: "latency",
        label: "TOTAL LATENCY",
        value: `${activeTrace.latencyMs}ms`,
        sublabel: "End-to-end trace",
        lineNum: 18,
        accent: theme.clusterColors.chat,
      },
      {
        id: "tokens",
        label: "TOKENS READ",
        value: `${activeTrace.tokens}`,
        sublabel: "Prompt + output",
        lineNum: 21,
        accent: theme.clusterColors.reasoning,
      },
      {
        id: "cost",
        label: "EST. COST",
        value: activeTrace.costLabel,
        sublabel: activeTrace.costNote,
        lineNum: 22,
        accent: theme.clusterColors.media_gen,
      },
    ],
    [activeTrace, theme]
  );

  const activeHubNode = useMemo(
    () => CONSTELLATION.nodes.find((n) => n.id === activeHubId) ?? CONSTELLATION.nodes[3],
    [activeHubId]
  );

  const activeCodeLineObj = useMemo(
    () => codeLines.find((l) => l.num === activeCodeLine) ?? codeLines[4],
    [codeLines, activeCodeLine]
  );

  const getApiBoxes = (w: number, h: number) => {
    const compact = w < 440;
    const boxW = compact ? 74 : 112;
    const boxH = compact ? 28 : 31;
    const leftPad = compact ? 6 : 10;
    const topPad = 14;
    const bottomPad = 16;
    const availH = Math.max(210, h - topPad - bottomPad);
    const step = (availH - boxH) / Math.max(1, SAMPLE_QUEUE.length - 1);

    return SAMPLE_QUEUE.map((item, idx) => {
      const y = topPad + idx * step;
      return {
        item,
        x: leftPad,
        y,
        w: boxW,
        h: boxH,
        portX: leftPad + boxW,
        portY: y + boxH / 2,
      };
    });
  };

  // =========================================================================
  // TAB 1: PRECISION RADAR + MATCHED TELEMETRY CONSTELLATION + ACTIVE SPIDER
  // =========================================================================
  useIsomorphicLayoutEffect(() => {
    if (stage !== "route") return;
    const canvas = graphCanvasRef.current;
    const wrap = graphWrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    const epoch = lastTime;

    const patrolHubIds = [
      "hub-edge-tls",
      "hub-auth-sha",
      "hub-ledger",
      activeTrace.targetNodeId,
      "hub-sse-pipe",
      "hub-super-2.0",
      "hub-whisper-v3",
      "hub-ltx-video",
    ];
    let patrolIdx = 0;
    let patrolTimer = 0;

    const drawFrame = (now: number, syncFirst = false) => {
      const dt = syncFirst ? 0.016 : Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      const t = (now - epoch) / 1000;

      const w = Math.max(300, Math.round(wrap.clientWidth || 360));
      const h = Math.max(340, Math.round(wrap.clientHeight || 370));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, w, h);

      const bgPulse = 0.78 + 0.22 * Math.sin(t * 1.5);
      const rad = ctx.createRadialGradient(w * 0.62, h * 0.48, 12, w * 0.62, h * 0.48, w * 0.64);
      rad.addColorStop(0, theme.vignette);
      rad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = bgPulse;
      ctx.fillStyle = rad;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      const boxes = getApiBoxes(w, h);
      const compact = w < 440;
      const fieldLeft = boxes[0].portX + (compact ? 22 : 34);
      const fieldRight = w - (compact ? 10 : 18);
      const fieldTop = 16;
      const fieldBottom = h - 18;
      const fieldW = Math.max(150, fieldRight - fieldLeft);
      const fieldH = Math.max(220, fieldBottom - fieldTop);

      const focusedDef = focusedCluster
        ? CLUSTER_DEFS.find((c) => c.id === focusedCluster)
        : null;
      const desiredZoom = focusedDef ? 1.72 : 1.0;
      const desiredCx = focusedDef ? focusedDef.cx : 0.5;
      const desiredCy = focusedDef ? focusedDef.cy : 0.5;
      const camLerp = syncFirst ? 1 : Math.min(1, dt * 4.5);
      cameraRef.current.zoom += (desiredZoom - cameraRef.current.zoom) * camLerp;
      cameraRef.current.cx += (desiredCx - cameraRef.current.cx) * camLerp;
      cameraRef.current.cy += (desiredCy - cameraRef.current.cy) * camLerp;

      const { zoom, cx, cy } = cameraRef.current;

      const project = (nx: number, ny: number, idx: number) => {
        const driftX = reducedMotion ? 0 : Math.sin(t * 0.9 + idx * 1.37) * 0.004;
        const driftY = reducedMotion ? 0 : Math.cos(t * 0.8 + idx * 1.73) * 0.004;
        const sx = (nx + driftX - cx) * zoom + 0.5;
        const sy = (ny + driftY - cy) * zoom + 0.5;
        return {
          x: fieldLeft + sx * fieldW,
          y: fieldTop + sy * fieldH,
        };
      };

      const pts = CONSTELLATION.nodes.map((n, idx) => project(n.nx, n.ny, idx));

      // Precision Radar Rings + Crosshair + Subtle Optical Sweep Beam
      ctx.save();
      ctx.beginPath();
      ctx.rect(fieldLeft - 14, 0, w - fieldLeft + 14, h);
      ctx.clip();

      const rcx = fieldLeft + fieldW * 0.5;
      const rcy = fieldTop + fieldH * 0.5;
      const maxR = Math.min(fieldW, fieldH) * 0.48;
      ctx.strokeStyle = theme.radarRing;
      ctx.lineWidth = 0.85;
      for (const mult of [0.34, 0.66, 0.98]) {
        ctx.beginPath();
        ctx.arc(rcx, rcy, maxR * mult, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Subtle axis hairlines
      ctx.strokeStyle = "rgba(91, 158, 194, 0.07)";
      ctx.beginPath();
      ctx.moveTo(fieldLeft, rcy);
      ctx.lineTo(fieldRight, rcy);
      ctx.moveTo(rcx, fieldTop);
      ctx.lineTo(rcx, fieldBottom);
      ctx.stroke();

      if (!reducedMotion) {
        const sweepA = t * 0.65;
        ctx.beginPath();
        ctx.moveTo(rcx, rcy);
        ctx.arc(rcx, rcy, maxR * 1.06, sweepA, sweepA + 0.38);
        ctx.closePath();
        ctx.fillStyle = theme.radarSweep;
        ctx.fill();
      }
      ctx.restore();

      // 1. Silky Breathing Fiber-Optic Wires from EVERY Rectangular API Box -> Constellation Hubs
      boxes.forEach((b, idx) => {
        const targetIdx = CONSTELLATION.hubIndexById.get(b.item.targetNodeId) ?? 3;
        const edgeIdx = CONSTELLATION.hubIndexById.get("hub-edge-tls") ?? 0;
        const dest = b.item.id === selectedQueueId ? pts[targetIdx] : pts[edgeIdx];
        if (!dest) return;

        const isActive = b.item.id === selectedQueueId;
        const col = theme.clusterColors[b.item.cluster];
        const wave = 0.55 + 0.45 * Math.sin(t * 2.5 + idx * 0.85);

        const cp1x = b.portX + (dest.x - b.portX) * 0.44;
        const cp1y = b.portY;
        const cp2x = b.portX + (dest.x - b.portX) * 0.56;
        const cp2y = dest.y;

        ctx.beginPath();
        ctx.moveTo(b.portX, b.portY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, dest.x, dest.y);
        ctx.strokeStyle = col;
        ctx.globalAlpha = isActive ? 0.3 + wave * 0.25 : focusedCluster ? 0.05 : 0.1 + wave * 0.08;
        ctx.lineWidth = isActive ? 5 : 2.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(b.portX, b.portY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, dest.x, dest.y);
        ctx.strokeStyle = isActive ? theme.spiderPrimary : col;
        ctx.globalAlpha = isActive ? 0.9 : focusedCluster ? 0.14 : 0.36 + wave * 0.22;
        ctx.lineWidth = isActive ? 1.9 : 0.9;
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (!reducedMotion) {
          const boost = isProcessingRef.current && isActive ? 1.65 : 1;
          const speedMul = (isActive ? 0.72 : 0.32) * boost;
          const packetCount = isActive ? (isProcessingRef.current ? 3 : 2) : 1;
          for (let pk = 0; pk < packetCount; pk++) {
            const p = (t * speedMul + idx * 0.17 + pk * 0.5) % 1;
            const inv = 1 - p;
            const px =
              inv * inv * inv * b.portX +
              3 * inv * inv * p * cp1x +
              3 * inv * p * p * cp2x +
              p * p * p * dest.x;
            const py =
              inv * inv * inv * b.portY +
              3 * inv * inv * p * cp1y +
              3 * inv * p * p * cp2y +
              p * p * p * dest.y;

            ctx.beginPath();
            ctx.arc(px, py, isActive ? 3.1 : 1.7, 0, Math.PI * 2);
            ctx.fillStyle = isActive ? "#FFFFFF" : col;
            ctx.shadowColor = col;
            ctx.shadowBlur = isActive ? 10 : 5;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      });

      // 2. Dense Constellation Mesh Edges
      ctx.save();
      ctx.beginPath();
      ctx.rect(fieldLeft - 14, 0, w - fieldLeft + 14, h);
      ctx.clip();

      CONSTELLATION.edges.forEach(([ai, bi], eIdx) => {
        const na = CONSTELLATION.nodes[ai];
        const nb = CONSTELLATION.nodes[bi];
        const pa = pts[ai];
        const pb = pts[bi];
        const same = na.cluster === nb.cluster;
        const inFocus =
          !focusedCluster || na.cluster === focusedCluster || nb.cluster === focusedCluster;
        const col = theme.clusterColors[na.cluster];
        const pulse = 0.55 + 0.45 * Math.sin(t * 2.2 + eIdx * 0.43);

        ctx.beginPath();
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
        ctx.strokeStyle = col;
        ctx.globalAlpha = inFocus
          ? same
            ? 0.18 + pulse * 0.24
            : 0.12 + pulse * 0.14
          : 0.04;
        ctx.lineWidth = same ? 0.85 : 0.7;
        ctx.stroke();

        if (!reducedMotion && inFocus && eIdx % 9 === 0) {
          const p = (t * 0.45 + eIdx * 0.29) % 1;
          const sx = pa.x + (pb.x - pa.x) * p;
          const sy = pa.y + (pb.y - pa.y) * p;
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      // 3. Draw 118+ Glowing Constellation Stars + Precision Reticles
      const liveHubId = activeHubIdRef.current;
      CONSTELLATION.nodes.forEach((node, idx) => {
        const p = pts[idx];
        const col = theme.clusterColors[node.cluster];
        const inFocus = !focusedCluster || node.cluster === focusedCluster;
        const isCurrentHub = node.id === liveHubId;
        const shimmer = 0.65 + 0.35 * Math.sin(t * 3.1 + idx * 0.9);

        if (node.isHub || isCurrentHub) {
          const haloR = isCurrentHub ? 22 : 12;
          const halo = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, haloR);
          halo.addColorStop(0, `${col}${inFocus ? "88" : "22"}`);
          halo.addColorStop(1, `${col}00`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(p.x, p.y, haloR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, isCurrentHub ? node.r + 1.5 : node.r, 0, Math.PI * 2);
        ctx.fillStyle = isCurrentHub ? "#FFFFFF" : col;
        ctx.globalAlpha = inFocus ? (node.isHub ? 0.98 : 0.5 + shimmer * 0.48) : 0.14;
        ctx.fill();
        ctx.globalAlpha = 1;

        if (isCurrentHub) {
          const r = 13 + Math.sin(t * 5) * 1.8;
          const b = 4.5;
          ctx.strokeStyle = theme.spiderPrimary;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x - r, p.y - r + b);
          ctx.lineTo(p.x - r, p.y - r);
          ctx.lineTo(p.x - r + b, p.y - r);
          ctx.moveTo(p.x + r - b, p.y - r);
          ctx.lineTo(p.x + r, p.y - r);
          ctx.lineTo(p.x + r, p.y - r + b);
          ctx.moveTo(p.x - r, p.y + r - b);
          ctx.lineTo(p.x - r, p.y + r);
          ctx.lineTo(p.x - r + b, p.y + r);
          ctx.moveTo(p.x + r - b, p.y + r);
          ctx.lineTo(p.x + r, p.y + r);
          ctx.lineTo(p.x + r, p.y + r - b);
          ctx.stroke();
        }

        if (node.isHub && node.label && (inFocus || isCurrentHub)) {
          ctx.font = isCurrentHub
            ? "700 9px 'JetBrains Mono', monospace"
            : "500 7.5px 'JetBrains Mono', monospace";
          const tw = ctx.measureText(node.label).width;
          const lx = Math.max(fieldLeft + 2, Math.min(w - tw - 8, p.x - tw / 2));
          const ly = p.y + (isCurrentHub ? 20 : 12);
          ctx.fillStyle = "rgba(3, 6, 10, 0.88)";
          ctx.fillRect(lx - 3, ly - 5.5, tw + 6, 11);
          ctx.fillStyle = isCurrentHub ? "#FFFFFF" : "#D4D4D8";
          ctx.textBaseline = "middle";
          ctx.fillText(node.label, lx, ly);
        }
      });

      // 4. Cluster Header Labels
      ctx.font = compact
        ? "700 7.5px 'JetBrains Mono', monospace"
        : "700 8.5px 'JetBrains Mono', monospace";
      CLUSTER_DEFS.forEach((c, idx) => {
        const inFocus = !focusedCluster || focusedCluster === c.id;
        if (!inFocus) return;
        const cp = project(c.cx, c.cy - c.spreadY * 1.16, idx);
        const text = `${c.code} · ${c.label}`;
        const tw = ctx.measureText(text).width;
        const bx = Math.max(fieldLeft + 6, Math.min(w - tw - 16, cp.x - tw / 2));
        const by = Math.max(11, Math.min(h - 24, cp.y));
        const col = theme.clusterColors[c.id];

        ctx.fillStyle = "rgba(3, 6, 10, 0.92)";
        ctx.strokeStyle = `${col}88`;
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.roundRect(bx - 5, by - 7.5, tw + 10, 15, 2.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = col;
        ctx.textBaseline = "middle";
        ctx.fillText(text, bx, by);
      });

      // 5. Active Autonomous Roaming Spider + Instant User Steering
      const spiderScale = compact ? 0.7 : 0.86;
      if (!graphSpiderRef.current) {
        const startIdx = CONSTELLATION.hubIndexById.get(activeHubIdRef.current) ?? 3;
        const sp = pts[startIdx];
        graphSpiderRef.current = new PrecisionBrainCrawler(sp.x, sp.y, spiderScale);
      } else {
        graphSpiderRef.current.scale = spiderScale;
      }

      const spider = graphSpiderRef.current;
      const userOverride =
        userGraphTargetRef.current && now < userGraphTargetRef.current.until
          ? userGraphTargetRef.current
          : null;

      let goalX: number;
      let goalY: number;

      if (userOverride) {
        goalX = userOverride.x;
        goalY = userOverride.y;
      } else {
        patrolTimer += dt;
        const candidateHubs = focusedCluster
          ? CONSTELLATION.nodes.filter((n) => n.isHub && n.cluster === focusedCluster).map((n) => n.id)
          : patrolHubIds;
        const hopList = candidateHubs.length > 0 ? candidateHubs : patrolHubIds;

        if (patrolTimer > 2.4) {
          patrolTimer = 0;
          patrolIdx = (patrolIdx + 1) % hopList.length;
          const nextId = hopList[patrolIdx];
          if (nextId) {
            activeHubIdRef.current = nextId;
            setActiveHubId(nextId);
          }
        }

        const currentTargetId = hopList[patrolIdx % hopList.length] ?? activeHubIdRef.current;
        const targetNodeIndex = CONSTELLATION.hubIndexById.get(currentTargetId) ?? 3;
        const targetPt = pts[targetNodeIndex];
        goalX = targetPt.x + Math.sin(t * 1.4) * 14;
        goalY = targetPt.y + Math.cos(t * 1.2) * 10;
      }

      let nearestHubPt: { x: number; y: number } | null = null;
      let minHubDist = Infinity;
      for (let i = 0; i < CONSTELLATION.nodes.length; i++) {
        if (!CONSTELLATION.nodes[i].isHub) continue;
        const d = Math.hypot(pts[i].x - spider.x, pts[i].y - spider.y);
        if (d < minHubDist) {
          minHubDist = d;
          nearestHubPt = pts[i];
        }
      }
      spider.probePoint = minHubDist < 95 ? nearestHubPt : null;
      spider.update(
        goalX,
        goalY,
        dt,
        t,
        theme.spiderPrimary,
        userOverride ? 0.22 : isProcessingRef.current ? 0.14 : 0.085
      );
      spider.draw(
        ctx,
        t,
        isProcessingRef.current ? "PROCESSING" : "CRAWLER",
        isProcessingRef.current
      );

      ctx.restore();

      // 6. Crisp Rectangular API Module Boxes + Hardware Connector Pins on Left
      boxes.forEach((b, idx) => {
        const isActive = b.item.id === selectedQueueId;
        const col = theme.clusterColors[b.item.cluster];
        const pulse = 0.55 + 0.45 * Math.sin(t * 3 + idx);

        ctx.save();
        ctx.fillStyle = isActive ? "rgba(18, 30, 44, 0.96)" : "rgba(7, 10, 16, 0.94)";
        ctx.strokeStyle = isActive ? col : "rgba(56, 72, 92, 0.65)";
        ctx.lineWidth = isActive ? 1.5 : 0.9;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 3.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = col;
        ctx.globalAlpha = isActive ? 1 : 0.42 + pulse * 0.35;
        ctx.fillRect(b.x + 3, b.y + 5, 2.2, b.h - 10);
        ctx.globalAlpha = 1;

        ctx.font = compact
          ? "700 8px 'JetBrains Mono', monospace"
          : "700 9px 'JetBrains Mono', monospace";
        ctx.fillStyle = isActive ? "#FFFFFF" : "#E4E4E7";
        ctx.textBaseline = "top";
        ctx.fillText(b.item.boxCode, b.x + 8.5, b.y + 5);

        ctx.font = compact
          ? "500 7px 'JetBrains Mono', monospace"
          : "500 7.5px 'JetBrains Mono', monospace";
        ctx.fillStyle = isActive ? col : "#71717A";
        ctx.fillText(compact ? `${b.item.latencyMs}ms` : b.item.subCode, b.x + 8.5, b.y + (compact ? 16 : 18));

        ctx.fillStyle = isActive ? "#FFFFFF" : col;
        ctx.beginPath();
        ctx.roundRect(b.portX - 2, b.portY - 3.5, 4.5, 7, 1.5);
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();
    };

    drawFrame(performance.now(), true);

    const ro = new ResizeObserver(() => drawFrame(performance.now(), true));
    ro.observe(wrap);

    if (!reducedMotion) {
      const loop = (now: number) => {
        drawFrame(now, false);
        rafId = window.requestAnimationFrame(loop);
      };
      rafId = window.requestAnimationFrame(loop);
    }

    return () => {
      ro.disconnect();
      window.cancelAnimationFrame(rafId);
    };
  }, [stage, theme, selectedQueueId, focusedCluster, activeTrace.targetNodeId, reducedMotion]);

  const handleGraphPointer = (
    e: React.PointerEvent<HTMLCanvasElement>,
    isDown: boolean,
    isMove: boolean
  ) => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = Math.max(300, Math.round(rect.width));
    const h = Math.max(340, Math.round(rect.height));

    if (isDown) {
      const boxes = getApiBoxes(w, h);
      for (const b of boxes) {
        if (x >= b.x - 4 && x <= b.x + b.w + 8 && y >= b.y - 3 && y <= b.y + b.h + 3) {
          setSelectedQueueId(b.item.id);
          setActiveHubId(b.item.targetNodeId);
          activeHubIdRef.current = b.item.targetNodeId;
          setFocusedCluster(b.item.cluster);
          userGraphTargetRef.current = null;
          onSelectQueueItem?.(b.item);
          return;
        }
      }
    }

    if (isDown) {
      pointerDownRef.current = true;
      userGraphTargetRef.current = { x, y, until: performance.now() + 5500 };
    } else if (isMove && (pointerDownRef.current || steerMode)) {
      userGraphTargetRef.current = { x, y, until: performance.now() + 4500 };
    }

    const boxes = getApiBoxes(w, h);
    const compact = w < 440;
    const fieldLeft = boxes[0].portX + (compact ? 22 : 34);
    const fieldRight = w - (compact ? 10 : 18);
    const fieldTop = 16;
    const fieldBottom = h - 18;
    const fieldW = Math.max(150, fieldRight - fieldLeft);
    const fieldH = Math.max(220, fieldBottom - fieldTop);
    const { zoom, cx, cy } = cameraRef.current;

    let bestId = activeHubIdRef.current;
    let bestD = Infinity;
    for (const node of CONSTELLATION.nodes) {
      if (!node.isHub) continue;
      const sx = fieldLeft + ((node.nx - cx) * zoom + 0.5) * fieldW;
      const sy = fieldTop + ((node.ny - cy) * zoom + 0.5) * fieldH;
      const d = Math.hypot(x - sx, y - sy);
      if (d < bestD) {
        bestD = d;
        bestId = node.id;
      }
    }
    if (bestD < 64) {
      activeHubIdRef.current = bestId;
      setActiveHubId(bestId);
    }
  };

  // =========================================================================
  // TAB 2: LARGE ARTICULATED SPIDER ACTIVELY WALKING ON LIVE HTTP/JSON/SSE CODE
  // =========================================================================
  useIsomorphicLayoutEffect(() => {
    if (stage !== "crawl") return;
    const canvas = codeCanvasRef.current;
    const wrap = codeWrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();
    const epoch = lastTime;

    const keyLineNums = [1, 2, 5, 6, 10, 11, 15, 18, 21, 22];
    let roamIdx = 2;
    let roamTimer = 0;

    const drawCode = (now: number, syncFirst = false) => {
      const dt = syncFirst ? 0.016 : Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      const t = (now - epoch) / 1000;

      const w = Math.max(280, Math.round(wrap.clientWidth || 350));
      const h = Math.max(300, Math.round(wrap.clientHeight || 440));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const lineH = h / codeLines.length;
      const spiderScale = w < 420 ? 0.8 : 0.96;

      const userOverride =
        userCodeTargetRef.current && now < userCodeTargetRef.current.until
          ? userCodeTargetRef.current
          : null;

      if (!userOverride && !reducedMotion) {
        roamTimer += dt;
        if (roamTimer > 1.85) {
          roamTimer = 0;
          roamIdx = (roamIdx + 1) % keyLineNums.length;
          const nextNum = keyLineNums[roamIdx];
          activeCodeLineRef.current = nextNum;
          setActiveCodeLine(nextNum);
          setTaggedLines((prev) => (prev.includes(nextNum) ? prev : [...prev, nextNum]));
        }
      }

      const liveLineNum = activeCodeLineRef.current;
      const lineY = Math.max(20, Math.min(h - 20, (liveLineNum - 0.5) * lineH));
      const targetX = userOverride
        ? userOverride.x
        : Math.min(w - 64, Math.max(92, w * 0.58 + Math.sin(t * 1.5) * 34));
      const targetY = userOverride ? userOverride.y : lineY;

      if (!codeSpiderRef.current) {
        codeSpiderRef.current = new PrecisionBrainCrawler(targetX, targetY, spiderScale);
      } else {
        codeSpiderRef.current.scale = spiderScale;
      }

      const curLine = codeLines.find((l) => l.num === liveLineNum);
      const beamCol = curLine?.accent ?? theme.spiderSecondary;

      const grad = ctx.createLinearGradient(0, lineY - lineH, w, lineY + lineH);
      grad.addColorStop(0, `${beamCol}05`);
      grad.addColorStop(0.45, `${beamCol}26`);
      grad.addColorStop(1, `${beamCol}05`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, lineY - lineH * 0.55, w, lineH * 1.1);

      codeSpiderRef.current.probePoint = { x: Math.max(54, targetX - 44), y: lineY };
      codeSpiderRef.current.update(
        targetX,
        targetY,
        dt,
        t,
        beamCol,
        userOverride ? 0.22 : 0.11
      );
      codeSpiderRef.current.draw(ctx, t, undefined, isProcessingRef.current);

      ctx.restore();
    };

    drawCode(performance.now(), true);

    const ro = new ResizeObserver(() => drawCode(performance.now(), true));
    ro.observe(wrap);

    if (!reducedMotion) {
      const loop = (now: number) => {
        drawCode(now, false);
        rafId = window.requestAnimationFrame(loop);
      };
      rafId = window.requestAnimationFrame(loop);
    }

    return () => {
      ro.disconnect();
      window.cancelAnimationFrame(rafId);
    };
  }, [stage, theme, codeLines, reducedMotion]);

  const jumpSpiderToCodeLine = (lineNum: number) => {
    activeCodeLineRef.current = lineNum;
    setActiveCodeLine(lineNum);
    setTaggedLines((prev) => (prev.includes(lineNum) ? prev : [...prev, lineNum]));
    const wrap = codeWrapRef.current;
    if (wrap) {
      const h = wrap.clientHeight || 420;
      const w = wrap.clientWidth || 340;
      const y = ((lineNum - 0.5) / codeLines.length) * h;
      userCodeTargetRef.current = { x: w * 0.6, y, until: performance.now() + 4500 };
    }
  };

  const handleCodePointer = (e: React.PointerEvent<HTMLDivElement>, isDown: boolean) => {
    if (!isDown && !pointerDownRef.current && !steerMode) return;
    const wrap = codeWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = Math.max(24, Math.min(rect.width - 24, e.clientX - rect.left));
    const y = Math.max(12, Math.min(rect.height - 12, e.clientY - rect.top));
    if (isDown) pointerDownRef.current = true;
    userCodeTargetRef.current = { x, y, until: performance.now() + 4500 };
    const lineNum = Math.max(
      1,
      Math.min(codeLines.length, Math.ceil((y / rect.height) * codeLines.length))
    );
    if (lineNum !== activeCodeLineRef.current) {
      activeCodeLineRef.current = lineNum;
      setActiveCodeLine(lineNum);
      setTaggedLines((prev) => (prev.includes(lineNum) ? prev : [...prev, lineNum]));
    }
  };

  const stageTabs: Array<{
    id: CrawlerStage;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "route", label: "Route Graph", icon: Network },
    { id: "crawl", label: "Code Crawl", icon: FileCode2 },
    { id: "report", label: "Trace Report", icon: BarChart3 },
  ];

  return (
    <section
      aria-label="Gyra Precision Telemetry Crawler"
      className="flex-1 min-h-[460px] lg:min-h-[520px] rounded-lg border border-[#1F1F23] bg-[#03060A] overflow-hidden flex flex-col"
    >
      {/* Unified Gyra Precision Telemetry Header + Animated Spider Icon + Manual Controls */}
      <div className="px-3 py-2 border-b border-[#18181B] bg-[#07090D] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="relative w-6 h-6 rounded border border-[#1F3A4D] bg-[#060E16] flex items-center justify-center shrink-0"
            aria-label={activelyProcessing ? "Spider crawler processing API request" : "Spider crawler monitoring telemetry"}
          >
            {activelyProcessing && (
              <span
                aria-hidden="true"
                className="gyra-spider-ring absolute inset-0 rounded border border-[#38BDF8]/80 pointer-events-none"
              />
            )}
            <Bug
              className={`w-3.5 h-3.5 transition-colors ${
                activelyProcessing
                  ? "gyra-spider-pulse text-[#FACC15]"
                  : "gyra-spider-breathe text-[#7DD3FC]"
              }`}
              aria-hidden="true"
            />
          </div>
          <span className="font-mono text-[11px] font-bold tracking-wider text-[#F4F4F5] uppercase whitespace-nowrap">
            Gyra Telemetry Crawler
          </span>
          <span className="text-[#3F3F46]" aria-hidden="true">
            ·
          </span>
          <span className="font-mono text-[11px] text-[#7DD3FC] truncate">
            {activeTrace.method} {activeTrace.path}
          </span>
          {activelyProcessing ? (
            <span className="font-mono text-[10px] font-bold text-[#FACC15] shrink-0">
              · PROCESSING
            </span>
          ) : activeTrace.isLiveExecution ? (
            <span className="font-mono text-[10px] font-semibold text-[#34D399] shrink-0">
              · LIVE
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {stage === "route" && (
            <button
              type="button"
              onClick={() =>
                setFocusedCluster((prev) => (prev ? null : activeTrace.cluster))
              }
              className="min-h-[34px] sm:min-h-[28px] px-2.5 py-1 rounded border border-[#27272A] bg-[#0F1218] hover:border-[#3F3F46] text-[10.5px] font-mono text-[#E4E4E7] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              {focusedCluster ? (
                <>
                  <ZoomOut className="w-3.5 h-3.5 text-[#7DD3FC]" />
                  <span>Full Mesh</span>
                </>
              ) : (
                <>
                  <ZoomIn className="w-3.5 h-3.5 text-[#7DD3FC]" />
                  <span>Zoom Cluster</span>
                </>
              )}
            </button>
          )}
          {stage !== "report" && (
            <button
              type="button"
              onClick={() => setSteerMode((s) => !s)}
              className={`min-h-[34px] sm:min-h-[28px] px-2.5 py-1 rounded border text-[10.5px] font-mono inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                steerMode
                  ? "border-[#FACC15] bg-[#241E08] text-[#FEF08A]"
                  : "border-[#27272A] bg-[#0F1218] text-[#D4D4D8] hover:border-[#3F3F46]"
              }`}
            >
              <Hand className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>{steerMode ? "Drag: ON" : "Move Spider"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Manual Stage Selector Bar (Zero Auto-Play) */}
      <div className="px-3 py-1.5 border-b border-[#18181B] bg-[#05070B] flex items-center justify-between gap-2 shrink-0">
        <div
          className="grid grid-cols-3 gap-1 w-full sm:w-auto p-0.5 rounded-md bg-[#0B0E14] border border-[#1F1F23]"
          role="tablist"
          aria-label="Select crawler view"
        >
          {stageTabs.map(({ id, label, icon: Icon }) => {
            const active = stage === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStage(id)}
                className={`min-h-[38px] sm:min-h-[30px] px-2 sm:px-3 py-1 rounded text-[11.5px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                  active
                    ? "bg-[#1F5B7C] text-[#F8FAFC] font-semibold"
                    : "text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#121620]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        <span className="hidden sm:inline font-mono text-[10.5px] text-[#71717A] tabular-nums whitespace-nowrap">
          {activeTrace.model} · {activeTrace.latencyMs}ms · {activeTrace.tokens} tok
        </span>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: PRECISION RADAR + DENSE TELEMETRY CONSTELLATION + API BOXES  */}
      {/* =================================================================== */}
      {stage === "route" && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div
            ref={graphWrapRef}
            className="relative w-full flex-1 min-h-[370px] sm:min-h-[420px] lg:min-h-[450px]"
            style={{ backgroundColor: theme.bg }}
          >
            <canvas
              ref={graphCanvasRef}
              onPointerDown={(e) => {
                if (steerMode) e.currentTarget.setPointerCapture(e.pointerId);
                handleGraphPointer(e, true, false);
              }}
              onPointerMove={(e) => handleGraphPointer(e, false, true)}
              onPointerUp={() => {
                pointerDownRef.current = false;
              }}
              onPointerLeave={() => {
                pointerDownRef.current = false;
              }}
              style={{ touchAction: steerMode ? "none" : "pan-y" }}
              className="w-full h-full block cursor-crosshair select-none"
              aria-label="Precision radar API constellation with rectangular API endpoint boxes, breathing fiber conduits, and active AI-brain spider"
            />

            <div className="absolute top-2 right-2.5 pointer-events-none">
              <span className="font-mono text-[9.5px] text-[#A1A1AA] bg-[#03060A]/88 border border-[#1F1F23] px-2 py-0.5 rounded">
                {steerMode ? "Drag to guide spider" : "Tap API box or cluster"}
              </span>
            </div>
          </div>

          <div className="px-3.5 py-2.5 border-t border-[#18181B] bg-[#06090F] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span
                  className="font-bold uppercase"
                  style={{ color: theme.clusterColors[activeHubNode.cluster] }}
                >
                  {activeHubNode.label ?? "GYRA MESH"}
                </span>
                <span className="text-[#3F3F46]">·</span>
                <span className="text-[#F4F4F5] truncate">
                  {activeTrace.method} {activeTrace.path}
                </span>
              </div>
              <p className="text-[12px] text-[#A1A1AA] mt-0.5 leading-snug">
                {activeHubNode.role ?? "Routing live payload across Gyra inference clusters."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStage("crawl")}
              className="self-start sm:self-center px-3 py-1.5 rounded border border-[#27272A] bg-[#0E131B] hover:border-[#5B9EC2] font-mono text-[11px] font-semibold text-[#F4F4F5] inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <span>Inspect Code</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#FACC15]" />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: LARGE ARTICULATED SPIDER WALKING ON LIVE HTTP/JSON/SSE CODE  */}
      {/* =================================================================== */}
      {stage === "crawl" && (
        <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 gap-3" style={{ backgroundColor: theme.bg }}>
          <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-[#18181B]">
            <div className="min-w-0">
              <div className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#FACC15]">
                Crawler · Reading Live Wire &amp; Code
              </div>
              <div className="font-mono text-[20px] sm:text-[22px] font-bold tracking-tight text-[#FFFFFF] leading-tight mt-0.5">
                {activeTrace.model}
              </div>
              <p className="text-[11.5px] text-[#A1A1AA] mt-0.5 leading-snug">
                <span className="font-mono text-[#7DD3FC] mr-1.5">
                  L.{String(activeCodeLineObj.num).padStart(2, "0")}
                </span>
                {activeCodeLineObj.explanation}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10.5px] font-mono tabular-nums shrink-0">
              <span className="text-[#71717A]">LINES</span>
              <span className="text-[#F4F4F5] text-right">{codeLines.length}</span>
              <span className="text-[#71717A]">TTFT</span>
              <span className="text-[#FACC15] text-right">{activeTrace.ttftMs}ms</span>
              <span className="text-[#71717A]">SIZE</span>
              <span className="text-[#7DD3FC] text-right">{activeTrace.payloadSize}</span>
            </div>
          </div>

          <div
            ref={codeWrapRef}
            onPointerDown={(e) => handleCodePointer(e, true)}
            onPointerMove={(e) => handleCodePointer(e, false)}
            onPointerUp={() => {
              pointerDownRef.current = false;
            }}
            onPointerLeave={() => {
              pointerDownRef.current = false;
            }}
            style={{ touchAction: steerMode ? "none" : "pan-y" }}
            className="relative rounded-md border border-[#1F1F23] bg-[#04070C] overflow-hidden"
          >
            <div className="p-2 sm:p-3 font-mono text-[10px] sm:text-[11px] leading-[1.62] overflow-x-auto">
              {codeLines.map((line) => {
                const isActive = line.num === activeCodeLine;
                const isTagged = taggedLines.includes(line.num) && Boolean(line.highlightToken);
                return (
                  <button
                    key={line.num}
                    type="button"
                    onClick={() => jumpSpiderToCodeLine(line.num)}
                    className={`w-full text-left flex items-center gap-2 px-1 py-[1px] rounded-sm transition-colors ${
                      isActive
                        ? "bg-[#38BDF8]/[0.1] text-[#FFFFFF]"
                        : "text-[#A1A1AA] hover:bg-[#FFFFFF]/[0.03]"
                    }`}
                  >
                    <span className="w-4 shrink-0 text-right text-[#52525B] select-none tabular-nums">
                      {String(line.num).padStart(2, "0")}
                    </span>
                    <span
                      className="w-7 shrink-0 text-[9px] font-bold tracking-wider"
                      style={{
                        color:
                          line.tag === "HDR"
                            ? theme.clusterColors.gateway
                            : line.tag === "REQ"
                              ? theme.clusterColors.chat
                              : line.tag === "SSE"
                                ? theme.clusterColors.reasoning
                                : "#34D399",
                      }}
                    >
                      {line.tag}
                    </span>
                    <span className="whitespace-pre">
                      {line.prefix}
                      {line.highlightToken && (
                        <span
                          className="px-1 rounded-[2px] font-semibold transition-all"
                          style={
                            isActive || isTagged
                              ? {
                                  border: `1px solid ${line.accent ?? theme.spiderSecondary}`,
                                  backgroundColor: `${line.accent ?? theme.spiderSecondary}24`,
                                  color: "#FFFFFF",
                                }
                              : { color: line.accent ?? theme.spiderSecondary }
                          }
                        >
                          {line.highlightToken}
                        </span>
                      )}
                      {line.suffix ?? ""}
                    </span>
                  </button>
                );
              })}
            </div>

            <canvas
              ref={codeCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden="true"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-[#FACC15]">
                Tagged in this read
              </span>
              <span className="font-mono text-[10px] text-[#71717A]">
                Tap card or line to direct spider
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {extractedMetrics.map((m) => {
                const isCurrent = activeCodeLine === m.lineNum;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => jumpSpiderToCodeLine(m.lineNum)}
                    className={`text-left rounded border px-2.5 py-2 transition-colors ${
                      isCurrent
                        ? "bg-[#0E1824] border-[#5B9EC2]"
                        : "bg-[#070A10] border-[#1A1F29] hover:border-[#2E3848]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[9.5px] font-mono text-[#71717A]">
                      <span className="truncate">{m.label}</span>
                      <span className="font-bold tabular-nums" style={{ color: m.accent }}>
                        L.{String(m.lineNum).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="font-mono text-[15px] font-bold text-[#FFFFFF] tabular-nums mt-0.5 truncate">
                      {m.value}
                    </div>
                    <div className="text-[10px] text-[#71717A] truncate">{m.sublabel}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: PRECISION TELEMETRY REPORT + SWEEPING LINEAGE FAN            */}
      {/* =================================================================== */}
      {stage === "report" && (
        <div className="flex-1 flex flex-col" style={{ backgroundColor: theme.bg }}>
          <div className="px-3.5 py-2 bg-[#1F5B7C] text-[#F8FAFC] flex items-center justify-between gap-2 text-[10.5px] font-mono font-bold tracking-wider uppercase shrink-0">
            <span>Gyra Platform · Telemetry Report</span>
            <span className="tabular-nums text-[#FACC15]">
              {codeLines.length} Lines · 6 Verified
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-between p-3.5 sm:p-4 gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="font-mono text-[24px] sm:text-[28px] font-bold tracking-tight text-[#FFFFFF] leading-none">
                  {activeTrace.model}
                </h3>
                <p className="font-mono text-[11px] text-[#7DD3FC] mt-1">
                  {activeTrace.method} {activeTrace.path} · {activeTrace.requestId}
                </p>
              </div>
              <span className="font-mono text-[11px] font-semibold text-[#34D399] tabular-nums">
                {activeTrace.status} OK · {activeTrace.payloadSize}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {extractedMetrics.map((m) => {
                const selected = activeReportMetricId === m.id;
                const dimmed = activeReportMetricId !== null && !selected;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setActiveReportMetricId((prev) => (prev === m.id ? null : m.id))
                    }
                    className={`text-left rounded border px-3 py-2.5 transition-all min-h-[78px] ${
                      selected
                        ? "border-[#7DD3FC] bg-[#0F1B29]"
                        : dimmed
                          ? "border-[#151A22] bg-[#05080D] opacity-35 hover:opacity-80"
                          : "border-[#1C2330] bg-[#080C12] hover:border-[#364459]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-[#71717A]">
                      <span className="truncate">{m.label}</span>
                      <span className="font-bold tabular-nums" style={{ color: m.accent }}>
                        L.{String(m.lineNum).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="font-mono text-[18px] sm:text-[20px] font-bold text-[#FFFFFF] tabular-nums mt-1 truncate">
                      {m.value}
                    </div>
                    <div className="text-[10.5px] text-[#8E96A4] truncate mt-0.5">
                      {m.sublabel}
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <svg
                viewBox="0 0 600 96"
                className="w-full h-[88px] block overflow-visible"
                role="img"
                aria-label="Sweeping Bezier lineage curves mapping extracted telemetry metrics back to exact source lines"
              >
                {extractedMetrics.map((m, idx) => {
                  const startX = 50 + idx * 100;
                  const endX =
                    20 + ((m.lineNum - 1) / Math.max(1, codeLines.length - 1)) * 560;
                  const lit = activeReportMetricId === null || activeReportMetricId === m.id;
                  return (
                    <g key={m.id} opacity={lit ? 1 : 0.14}>
                      <path
                        d={`M ${startX} 2 C ${startX} 54, ${endX} 42, ${endX} 82`}
                        fill="none"
                        stroke={m.accent}
                        strokeWidth={activeReportMetricId === m.id ? 2.4 : 1.35}
                      />
                      <circle cx={startX} cy={3} r={2.8} fill={m.accent} />
                      <circle cx={endX} cy={82} r={3.4} fill={m.accent} />
                    </g>
                  );
                })}

                {codeLines.map((line) => {
                  const tx =
                    20 + ((line.num - 1) / Math.max(1, codeLines.length - 1)) * 560;
                  const tagged = extractedMetrics.some((m) => m.lineNum === line.num);
                  return (
                    <line
                      key={line.num}
                      x1={tx}
                      y1={tagged ? 78 : 83}
                      x2={tx}
                      y2={92}
                      stroke={tagged ? "#FFFFFF" : "#272F3D"}
                      strokeWidth={tagged ? 1.6 : 1}
                    />
                  );
                })}
              </svg>

              <div className="flex items-center justify-between text-[10px] font-mono text-[#71717A] tabular-nums px-1">
                <span>LINE 01</span>
                <span className="text-[#A1A1AA] text-center truncate px-2">
                  Every value tagged to the exact line it came from
                </span>
                <span>LINE {String(codeLines.length).padStart(2, "0")}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Live Crawler Log Strip */}
      <div className="px-3 py-2 border-t border-[#18181B] bg-[#05080D] flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-1.5 py-0.5 rounded-[2px] bg-[#1F5B7C] text-[#F8FAFC] font-bold shrink-0">
            CRAWLER LOG
          </span>
          <span className="text-[#A1A1AA] truncate">
            {activeTrace.timestamp} · {activeTrace.method} {activeTrace.path} ·{" "}
            <span className="text-[#34D399]">{activeTrace.status}</span> · {activeTrace.latencyMs}ms ·{" "}
            {activeTrace.tokens} tok
          </span>
        </div>
        <span className="text-[#52525B] shrink-0 hidden sm:inline">
          120 NODES · 6 CLUSTERS
        </span>
      </div>
    </section>
  );
}
