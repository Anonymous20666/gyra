"use client";

import { useEffect, useRef, useState } from "react";
import { Interactive3DKeyboard } from "./Interactive3DKeyboard";
import {
  CORE_RETURN_SPRING,
  SIBLING_RETURN_SPRING,
  clampCoreOffset,
  clampRadialOffset,
  clampReleaseVelocity,
  computeCoupledFollowOffset,
  computeMagneticPull,
  computeStretchTension,
  createSpring2D,
  stepSpring2D,
  type Spring2DState,
} from "../../lib/coreSpringPhysics";

export type LiveModalityId = "chat" | "image" | "video" | "audio";
export type ChatFlowPhase =
  | "typing"
  | "routing"
  | "thinking"
  | "searching"
  | "streaming"
  | "done";

export interface SynapticKeyboardCanopyProps {
  activeModality: LiveModalityId;
  phase: ChatFlowPhase;
  activeChar: string | null;
  activeCharNonce: number;
  enterPulseNonce: number;
  activePromptLabel: string;
  onSelectModality: (modality: LiveModalityId) => void;
  onKeyTap?: (keyId: string) => void;
}

interface BranchSpec {
  id: LiveModalityId;
  code: string;
  name: string;
  sub: string;
  endpoint: string;
  desc: string;
  leaves: { name: string; role: string }[];
}

const BRANCHES: readonly BranchSpec[] = [
  {
    id: "chat",
    code: "01",
    name: "GYRA CHAT",
    sub: "REASONING & GEN UI",
    endpoint: "POST /API/V1/CHAT",
    desc: "Streams deep thinking, live web grounding, and interactive Generative UI artifacts.",
    leaves: [
      { name: "Gyra 1.0", role: "Fast daily reasoning & web search" },
      { name: "SuperGyra 2.0", role: "Deep multi-step thinking & synthesis" },
      { name: "Gen UI Core", role: "Interactive comparison cards & live widgets" },
    ],
  },
  {
    id: "image",
    code: "02",
    name: "GYRA IMAGE",
    sub: "GEOMETRY-LOCKED I2I",
    endpoint: "POST /API/FAL/PROXY",
    desc: "Studio relighting and Flux synthesis delivered directly into Dashboard Imagine cards.",
    leaves: [
      { name: "Flux Dev", role: "High-res dark-studio generation" },
      { name: "Pro Ultra I2I", role: "Geometry-locked 2700K relighting" },
      { name: "Imagine Card", role: "Interactive split compare & download" },
    ],
  },
  {
    id: "video",
    code: "03",
    name: "GYRA VIDEO",
    sub: "720P STUDIO MOTION",
    endpoint: "POST /API/V1/VIDEO",
    desc: "LTX-Video 13B keyframe-anchored 24fps cinema clips with temporal stability.",
    leaves: [
      { name: "LTX-Video 13B", role: "121-frame 720p · 24 fps diffusion" },
      { name: "Frame Anchor", role: "Pixel-exact Frame 001 reference lock" },
      { name: "Studio Queue", role: "Async render status & playback" },
    ],
  },
  {
    id: "audio",
    code: "04",
    name: "GYRA AUDIO",
    sub: "VOICE & WHISPER V3",
    endpoint: "POST /API/V1/VOICE",
    desc: "48kHz neural speech synthesis, real-time voice mode, and Whisper transcription.",
    leaves: [
      { name: "Gyra Voice", role: "Expressive 48kHz neural speech" },
      { name: "Whisper v3", role: "Low-latency multilingual transcription" },
      { name: "Read Aloud", role: "Inline chat voice output & waveform" },
    ],
  },
];

interface OrbNode {
  id: string;
  label: string;
  sub?: string;
  shortCode?: string;
  tier: 0 | 1 | 2 | 3 | 4;
  tierName: string;
  desc: string;
  icon: string;
  x: number;
  y: number;
  r: number;
  branch: LiveModalityId | null;
  stageIdx?: number;
  glow: number;
  hoverScale: number;
  magX: number;
  magY: number;
  dragSpring: Spring2DState;
}

interface OrbEdge {
  from: OrbNode;
  to: OrbNode;
  branch: LiveModalityId | null;
  kind: "trunk" | "core-stage" | "stage-chain" | "stage-product" | "product-leaf";
  stageIdx?: number;
}

interface PulsePacket {
  fromX: number;
  fromY: number;
  cx: number;
  cy: number;
  toX: number;
  toY: number;
  p: number;
  speed: number;
  color: string;
  radius: number;
}

function drawVectorIcon(
  ctx: CanvasRenderingContext2D,
  icon: string,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.45;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const s = r * 0.44;
  if (icon === "crest") {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
  } else if (icon === "core") {
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.88, 0.28, Math.PI * 1.78);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(s * 0.88, 0);
    ctx.lineTo(s * 0.88, s * 0.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-s * 0.22, -s * 0.16, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (icon === "understand") {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.95, 0);
    ctx.lineTo(-s * 0.35, 0);
    ctx.moveTo(s * 0.35, 0);
    ctx.lineTo(s * 0.95, 0);
    ctx.moveTo(0, -s * 0.95);
    ctx.lineTo(0, -s * 0.35);
    ctx.moveTo(0, s * 0.35);
    ctx.lineTo(0, s * 0.95);
    ctx.stroke();
  } else if (icon === "orchestrate") {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.78);
    ctx.lineTo(s * 0.76, s * 0.62);
    ctx.lineTo(-s * 0.76, s * 0.62);
    ctx.closePath();
    ctx.stroke();
  } else if (icon === "execute") {
    ctx.beginPath();
    ctx.moveTo(s * 0.15, -s * 0.88);
    ctx.lineTo(-s * 0.52, s * 0.08);
    ctx.lineTo(s * 0.08, s * 0.08);
    ctx.lineTo(-s * 0.15, s * 0.88);
    ctx.lineTo(s * 0.55, -s * 0.08);
    ctx.lineTo(-s * 0.06, -s * 0.08);
    ctx.closePath();
    ctx.stroke();
  } else if (icon === "chat") {
    ctx.beginPath();
    ctx.rect(-s * 0.82, -s * 0.64, s * 1.64, s * 1.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, -s * 0.16);
    ctx.lineTo(s * 0.42, -s * 0.16);
    ctx.moveTo(-s * 0.42, s * 0.16);
    ctx.lineTo(s * 0.18, s * 0.16);
    ctx.stroke();
  } else if (icon === "image") {
    ctx.beginPath();
    ctx.rect(-s * 0.82, -s * 0.66, s * 1.64, s * 1.32);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.64, s * 0.44);
    ctx.lineTo(-s * 0.14, -s * 0.08);
    ctx.lineTo(s * 0.2, s * 0.24);
    ctx.lineTo(s * 0.46, -s * 0.02);
    ctx.lineTo(s * 0.68, s * 0.44);
    ctx.stroke();
  } else if (icon === "video") {
    ctx.beginPath();
    ctx.rect(-s * 0.84, -s * 0.62, s * 1.68, s * 1.24);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, -s * 0.3);
    ctx.lineTo(s * 0.36, 0);
    ctx.lineTo(-s * 0.22, s * 0.3);
    ctx.closePath();
    ctx.fill();
  } else if (icon === "audio") {
    // Crisp 5-bar studio audio waveform icon!
    const bars = [
      [-0.72, 0.28],
      [-0.36, 0.68],
      [0, 0.92],
      [0.36, 0.62],
      [0.72, 0.32],
    ];
    ctx.lineWidth = 1.65;
    for (const [bx, bh] of bars) {
      ctx.beginPath();
      ctx.moveTo(bx * s, -bh * s);
      ctx.lineTo(bx * s, bh * s);
      ctx.stroke();
    }
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(2.2, s * 0.42), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

interface RippleRing {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
}

export function SynapticKeyboardCanopy({
  activeModality,
  phase,
  activeChar,
  activeCharNonce,
  enterPulseNonce,
  activePromptLabel,
  onSelectModality,
  onKeyTap,
}: SynapticKeyboardCanopyProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipTimerRef = useRef<number | null>(null);
  const [hoverTip, setHoverTip] = useState<{
    visible: boolean;
    pinned: boolean;
    x: number;
    y: number;
    kicker: string;
    title: string;
    desc: string;
    hint?: string;
  }>({ visible: false, pinned: false, x: 0, y: 0, kicker: "", title: "", desc: "" });

  const stateRef = useRef({
    W: 1120,
    H: 545,
    dpr: 1,
    t: 0,
    coreAngle: 0,
    coreGimbalAngle: 0,
    nodes: [] as OrbNode[],
    edges: [] as OrbEdge[],
    ports: [] as { x: number; y: number; branch: LiveModalityId }[],
    packets: [] as PulsePacket[],
    ripples: [] as RippleRing[],
    hovered: null as OrbNode | null,
    selectedNodeId: null as string | null,
    parallax: { x: 0, y: 0 },
    pointer: { nx: 0, ny: 0 },
    pointerPos: { x: 0, y: 0, inside: false },
    coreSpring: createSpring2D(0, 0),
    coreWasDisplaced: false,
    coreState: "idle" as "idle" | "hover" | "dragging" | "returning",
    lastDatasetKey: "",
    drag: {
      active: false,
      nodeId: null as string | null,
      pointerId: null as number | null,
      startClientX: 0,
      startClientY: 0,
      grabOffsetX: 0,
      grabOffsetY: 0,
      lastX: 0,
      lastY: 0,
      lastTs: 0,
      vx: 0,
      vy: 0,
      moved: false,
    },
    activeModality,
    phase,
    promptLabel: activePromptLabel,
    wirePulse: -1, // 0..1 quiet optical pulse traveling from 3D GYRA keyboard -> GYRA CORE
    branchHeat: { chat: 1, image: 0, video: 0, audio: 0 } as Record<LiveModalityId, number>,
    stageHeat: [0.85, 0.72, 0.6] as [number, number, number],
    kbWireHeat: 0.35,
    inViewport: true,
    pageVisible: true,
    kbAnchor: { x: 300, y: 108 },
    corePos: { x: 560, y: 150 },
  });

  stateRef.current.activeModality = activeModality;
  stateRef.current.phase = phase;
  stateRef.current.promptLabel = activePromptLabel;

  // Emit a quiet, understated optical pulse along the 3D keyboard wire (moderate & non-flashy)
  const keystrokeCountRef = useRef(0);
  useEffect(() => {
    if (!activeChar) return;
    keystrokeCountRef.current += 1;
    if (keystrokeCountRef.current % 3 !== 1) return;
    const s = stateRef.current;
    const { kbAnchor, corePos } = s;
    s.kbWireHeat = Math.min(1, s.kbWireHeat + 0.35);
    s.packets.push({
      fromX: kbAnchor.x,
      fromY: kbAnchor.y,
      cx: (kbAnchor.x + corePos.x) * 0.5,
      cy: Math.min(kbAnchor.y, corePos.y) - 18,
      toX: corePos.x,
      toY: corePos.y,
      p: 0,
      speed: 0.95,
      color: "#8BB3CC",
      radius: 1.5,
    });
  }, [activeChar, activeCharNonce]);

  // Launch a single clean optical transfer dot along the keyboard wire when a modality starts
  useEffect(() => {
    if (!enterPulseNonce) return;
    const s = stateRef.current;
    s.wirePulse = 0;
    s.kbWireHeat = 0.85;
  }, [enterPulseNonce]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = stateRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const buildGraph = () => {
      const W = s.W;
      const H = s.H;
      const compact = W < 780;
      const cx = W * 0.5;
      const nodes: OrbNode[] = [];
      const edges: OrbEdge[] = [];
      const ports: { x: number; y: number; branch: LiveModalityId }[] = [];

      const nGenvia: OrbNode = {
        id: "genvia",
        label: "GENVIA",
        sub: "ROOT · AI COMPANY",
        tier: 0,
        tierName: "ROOT · PARENT AI COMPANY",
        desc: "Genvia is the parent AI company powering Gyra's unified models, safety, and global edge.",
        icon: "crest",
        x: cx,
        y: compact ? 42 : 48,
        r: compact ? 14 : 18,
        branch: null,
        glow: 0,
        hoverScale: 0,
        magX: 0,
        magY: 0,
        dragSpring: createSpring2D(0, 0),
      };

      const nCore: OrbNode = {
        id: "core",
        label: "GYRA CORE",
        sub: "AGENTIC AI ENGINE",
        tier: 1,
        tierName: "GYRA · AGENTIC AI CORE",
        desc: "Gyra's autonomous agentic intelligence — orchestrating Chat, Gen UI, Image, Video & Audio.",
        icon: "core",
        x: cx,
        y: compact ? 132 : 148,
        r: compact ? 21 : 30,
        branch: null,
        glow: 0,
        hoverScale: 0,
        magX: 0,
        magY: 0,
        dragSpring: createSpring2D(0, 0),
      };

      nodes.push(nGenvia, nCore);
      edges.push({ from: nGenvia, to: nCore, branch: null, kind: "trunk" });

      // Anchor point where the physical curved wire leaves the right bezel of the left-side 3D GYRA Keyboard!
      // Always at the LEFT side of GENVIA -> GYRA CORE on Mobile, Tablet, AND Desktop!
      if (W >= 960) {
        s.kbAnchor = { x: Math.min(312, W * 0.285), y: 108 };
      } else if (W >= 640) {
        s.kbAnchor = { x: Math.min(212, W * 0.31), y: 90 };
      } else {
        s.kbAnchor = { x: Math.min(134, W * 0.37), y: 74 };
      }
      s.corePos = { x: nCore.x, y: nCore.y };

      const stageSpread = compact ? Math.min(108, W * 0.3) : Math.min(248, W * 0.22);
      const stageSpecs = [
        {
          id: "stage-understand",
          label: "UNDERSTAND",
          code: "01",
          icon: "understand",
          desc: "Reads the live question, user context, and Think / Search toggles.",
        },
        {
          id: "stage-orchestrate",
          label: "ORCHESTRATE",
          code: "02",
          icon: "orchestrate",
          desc: "Grounds sources, routes SuperGyra 2.0 / Pro Ultra / LTX-13B / Gyra Voice.",
        },
        {
          id: "stage-execute",
          label: "EXECUTE",
          code: "03",
          icon: "execute",
          desc: "Streams live Gen UI cards, Imagine edits, 720p video, or 48kHz audio into chat.",
        },
      ];

      const stageNodes: OrbNode[] = stageSpecs.map((st, idx) => {
        const sn: OrbNode = {
          id: st.id,
          stageIdx: idx,
          label: st.label,
          shortCode: st.code,
          tier: 2,
          tierName: `STAGE ${st.code} · ${st.label}`,
          desc: st.desc,
          icon: st.icon,
          x: cx + (idx - 1) * stageSpread,
          y: compact ? 228 : 264,
          r: compact ? 16 : 20,
          branch: null,
          glow: 0,
        hoverScale: 0,
        magX: 0,
        magY: 0,
        dragSpring: createSpring2D(0, 0),
        };
        nodes.push(sn);
        edges.push({ from: nCore, to: sn, branch: null, kind: "core-stage", stageIdx: idx });
        return sn;
      });

      edges.push({ from: stageNodes[0], to: stageNodes[1], branch: null, kind: "stage-chain", stageIdx: 1 });
      edges.push({ from: stageNodes[1], to: stageNodes[2], branch: null, kind: "stage-chain", stageIdx: 2 });

      const prodSpan = compact ? W * 0.78 : Math.min(W * 0.78, 980);
      const startX = cx - prodSpan * 0.5;
      const stepX = prodSpan / 3;
      const mainPortY = H - 2;

      // Align downward optical ports directly to the 4 column centers of the max-w-[920px] top E2B tab bar!
      const boxW = Math.min(W, 920);
      const boxLeft = cx - boxW * 0.5;

      BRANCHES.forEach((b, bi) => {
        const px = startX + bi * stepX;
        const py = (compact ? 324 : 370) + (bi === 1 || bi === 2 ? (compact ? 8 : 12) : 0);

        const pn: OrbNode = {
          id: b.id,
          label: b.name,
          sub: b.sub,
          tier: 3,
          tierName: `MODALITY ${b.code} · ${b.endpoint}`,
          desc: b.desc,
          icon: b.id,
          x: px,
          y: py,
          r: compact ? 17 : 23,
          branch: b.id,
          glow: 0,
        hoverScale: 0,
        magX: 0,
        magY: 0,
        dragSpring: createSpring2D(0, 0),
        };
        nodes.push(pn);
        stageNodes.forEach((sn, si) => {
          edges.push({ from: sn, to: pn, branch: b.id, kind: "stage-product", stageIdx: si });
        });

        // Exact center of column bi (0..3) in the unified 4-column box header directly below!
        const colPortX = boxLeft + (bi + 0.5) * (boxW / 4);
        ports.push({ x: colPortX, y: mainPortY, branch: b.id });

        // RENDER ALL 12 TIER-4 SUB-ENGINE LEAF ORBS ON BOTH MOBILE AND DESKTOP!
        const leafSpan = compact ? Math.min(68, stepX * 0.76) : Math.min(148, stepX * 0.62);
        b.leaves.forEach((lf, li) => {
          const lx = px + (li - 1) * (leafSpan * 0.52);
          const ly = py + (compact ? (li === 1 ? 66 : 56) : li === 1 ? 82 : 68);
          const ln: OrbNode = {
            id: `${b.id}-leaf-${li}`,
            label: lf.name,
            tier: 4,
            tierName: `${b.name} · SUB-ENGINE`,
            desc: lf.role,
            icon: "leaf",
            x: lx,
            y: ly,
            r: compact ? 6.8 : 10.5,
            branch: b.id,
            glow: 0,
        hoverScale: 0,
        magX: 0,
        magY: 0,
        dragSpring: createSpring2D(0, 0),
          };
          nodes.push(ln);
          edges.push({ from: pn, to: ln, branch: b.id, kind: "product-leaf" });
        });
      });

      s.nodes = nodes;
      s.edges = edges;
      s.ports = ports;
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      s.W = Math.max(320, rect.width);
      s.H = Math.max(380, rect.height);
      s.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(s.W * s.dpr);
      canvas.height = Math.round(s.H * s.dpr);
      canvas.style.width = `${s.W}px`;
      canvas.style.height = `${s.H}px`;
      buildGraph();
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const io = new IntersectionObserver(
      (entries) => {
        s.inViewport = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    io.observe(wrap);

    const onVis = () => {
      s.pageVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    const onTouchMoveGuard = (ev: TouchEvent) => {
      if (s.drag.active) ev.preventDefault();
    };
    canvas.addEventListener("touchmove", onTouchMoveGuard, { passive: false });

    const getQuadPt = (
      x0: number,
      y0: number,
      cx0: number,
      cy0: number,
      x1: number,
      y1: number,
      t: number,
    ) => {
      const inv = 1 - t;
      return {
        x: inv * inv * x0 + 2 * inv * t * cx0 + t * t * x1,
        y: inv * inv * y0 + 2 * inv * t * cy0 + t * t * y1,
      };
    };

    let rafId = 0;
    let lastTs = performance.now();

    const render = (now: number) => {
      rafId = requestAnimationFrame(render);
      if (!s.inViewport || !s.pageVisible) return;

      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const coreNodeEarly = s.nodes.find((n) => n.id === "core");
      const coreDragging = s.drag.active && s.drag.nodeId === "core";
      const coreHoverBoost = coreNodeEarly ? coreNodeEarly.hoverScale : 0;

      if (!reduced) {
        s.t += dt;
        s.coreAngle += dt * (0.14 + coreHoverBoost * 0.42 + (coreDragging ? 0.55 : 0));
        s.coreGimbalAngle -= dt * (0.28 + coreHoverBoost * 0.55 + (coreDragging ? 0.72 : 0));
      }

      // Elastic spring-back physics for GYRA CORE whenever released
      if (!coreDragging) {
        const res = stepSpring2D(s.coreSpring, 0, 0, dt, CORE_RETURN_SPRING);
        s.coreSpring = res.state;
        if (s.coreWasDisplaced && res.settled) {
          s.coreWasDisplaced = false;
          if (coreNodeEarly) {
            s.ripples.push({
              x: coreNodeEarly.x,
              y: coreNodeEarly.y,
              r: coreNodeEarly.r,
              maxR: coreNodeEarly.r + 34,
              alpha: 1,
            });
          }
        }
      }

      // Elastic return + magnetic cursor pull + silky hover scale for all 21 orbs
      const hoverEase = 1 - Math.exp(-dt * 12);
      const magEase = 1 - Math.exp(-dt * 10);
      for (const n of s.nodes) {
        const isDraggedNode = s.drag.active && s.drag.nodeId === n.id;
        if (n.id !== "core" && !isDraggedNode) {
          const sr = stepSpring2D(n.dragSpring, 0, 0, dt, SIBLING_RETURN_SPRING);
          n.dragSpring = sr.state;
        }
        const isFocus = s.hovered?.id === n.id || isDraggedNode;
        n.hoverScale += ((isFocus ? 1 : 0) - n.hoverScale) * hoverEase;

        let targetMagX = 0;
        let targetMagY = 0;
        if (s.pointerPos.inside && !isDraggedNode && !coreDragging) {
          const pull = computeMagneticPull(
            s.pointerPos.x,
            s.pointerPos.y,
            n.x,
            n.y,
            n.id === "core" ? 116 : 74,
            n.id === "core" ? 5.5 : 3.5,
          );
          targetMagX = pull.x;
          targetMagY = pull.y;
        }
        n.magX += (targetMagX - n.magX) * magEase;
        n.magY += (targetMagY - n.magY) * magEase;
      }

      // Update lightweight DOM data attributes for state inspection (zero React re-renders)
      const coreDist = Math.hypot(s.coreSpring.x, s.coreSpring.y);
      const coreSpeed = Math.hypot(s.coreSpring.vx, s.coreSpring.vy);
      const nextCoreState: "idle" | "hover" | "dragging" | "returning" = coreDragging
        ? "dragging"
        : coreDist > 0.35 || coreSpeed > 1.2
          ? "returning"
          : s.hovered?.id === "core"
            ? "hover"
            : "idle";
      s.coreState = nextCoreState;
      const dsKey = `${nextCoreState}|${Math.round(s.coreSpring.x)}|${Math.round(s.coreSpring.y)}|${s.hovered?.id ?? ""}`;
      if (dsKey !== s.lastDatasetKey) {
        s.lastDatasetKey = dsKey;
        wrap.dataset.coreState = nextCoreState;
        wrap.dataset.coreOffsetX = String(Math.round(s.coreSpring.x));
        wrap.dataset.coreOffsetY = String(Math.round(s.coreSpring.y));
        wrap.dataset.hoveredNode = s.hovered?.id ?? "";
      }

      // Smooth exponential heat interpolation so branch transitions glide lazily with ZERO abrupt stop/restart!
      const heatEase = 1 - Math.exp(-dt * 2.2);
      (["chat", "image", "video", "audio"] as const).forEach((b) => {
        const target = b === s.activeModality ? 1 : 0;
        s.branchHeat[b] += (target - s.branchHeat[b]) * heatEase;
      });
      s.kbWireHeat += (0.28 - s.kbWireHeat) * Math.min(1, dt * 1.4);

      // Gentle traveling stage warmth (always softly illuminated, never snapping dark!)
      const stageTarget: [number, number, number] =
        s.phase === "routing" || s.phase === "thinking"
          ? [0.92, 0.58, 0.44]
          : s.phase === "searching"
            ? [0.68, 0.94, 0.56]
            : [0.58, 0.72, 0.96];
      for (let si = 0; si < 3; si++) {
        s.stageHeat[si] += (stageTarget[si] - s.stageHeat[si]) * heatEase;
      }

      s.parallax.x += (s.pointer.nx * 5 - s.parallax.x) * Math.min(1, dt * 5);
      s.parallax.y += (s.pointer.ny * 4 - s.parallax.y) * Math.min(1, dt * 5);

      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);

      // PURE E2B-GRADE #000000 PITCH BLACK CANVAS
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, s.W, s.H);

      const coreNode = s.nodes.find((n) => n.id === "core");
      const activeB = s.activeModality;
      // Single restrained institutional slate-steel accent (no neon green flashes!)
      const activeRgb = "128, 170, 198";
      const coreTension = computeStretchTension(s.coreSpring.x, s.coreSpring.y, 210);

      // Unified node visual position including live free-roam core offset, coupled neighbor flex & magnetic hover pull
      const nPos = (n: OrbNode) => {
        const d = n.tier === 1 ? 0.45 : n.tier === 3 ? 0.65 : 0.3;
        if (n.id === "core") {
          return {
            x: n.x + s.coreSpring.x + s.parallax.x * d + n.magX,
            y: n.y + s.coreSpring.y + s.parallax.y * d + n.magY,
          };
        }
        const followFactor =
          n.tier === 0 || n.tier === 2 ? 0.14 : n.tier === 3 ? 0.05 : 0.02;
        const follow = computeCoupledFollowOffset(s.coreSpring, followFactor);
        return {
          x: n.x + follow.x + n.dragSpring.x + s.parallax.x * d + n.magX,
          y: n.y + follow.y + n.dragSpring.y + s.parallax.y * d + n.magY,
        };
      };

      const coreVisPos = coreNode ? nPos(coreNode) : null;
      if (coreVisPos) {
        s.corePos = { x: coreVisPos.x, y: coreVisPos.y };
      }

      // Ultra-quiet hairline architectural polar rings around GYRA CORE home + gentle drift
      if (coreNode && coreVisPos) {
        const homeX = coreNode.x + s.parallax.x * 0.25;
        const homeY = coreNode.y + s.parallax.y * 0.25;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${(0.032 + coreNode.hoverScale * 0.025 + coreTension * 0.03).toFixed(3)})`;
        ctx.lineWidth = 1;
        [86, 174, 282].forEach((rr, idx) => {
          const shift = idx === 0 ? 0.28 : idx === 1 ? 0.1 : 0;
          ctx.setLineDash(idx === 1 ? [2, 14] : []);
          ctx.beginPath();
          ctx.arc(homeX + s.coreSpring.x * shift, homeY + s.coreSpring.y * shift, rr, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Architectural home-anchor reticle & dashed elastic return vector while GYRA CORE is displaced
        if (coreTension > 0.015) {
          const anchorAlpha = Math.min(0.68, 0.18 + coreTension * 0.65);
          ctx.setLineDash([3, 5]);
          ctx.strokeStyle = `rgba(164, 206, 232, ${anchorAlpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(homeX, homeY, coreNode.r * 0.92, 0, Math.PI * 2);
          ctx.stroke();

          // Crosshair at home origin
          ctx.setLineDash([]);
          ctx.strokeStyle = `rgba(196, 224, 242, ${(anchorAlpha * 0.72).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(homeX - 7, homeY);
          ctx.lineTo(homeX + 7, homeY);
          ctx.moveTo(homeX, homeY - 7);
          ctx.lineTo(homeX, homeY + 7);
          ctx.stroke();

          // Elastic return vector line from home anchor -> dragged core
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = `rgba(164, 206, 232, ${(0.24 + coreTension * 0.42).toFixed(3)})`;
          ctx.lineWidth = 1.05;
          ctx.beginPath();
          ctx.moveTo(homeX, homeY);
          ctx.lineTo(coreVisPos.x, coreVisPos.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 1. PHYSICAL CURVED BRANCH CONNECTING LEFT-SIDE 3D GYRA KEYBOARD -> GYRA CORE
      if (coreNode && coreVisPos) {
        const kx = s.kbAnchor.x;
        const ky = s.kbAnchor.y;
        const tx = coreVisPos.x;
        const ty = coreVisPos.y;
        const isWide = s.W >= 640;
        const ctrlX = (kx + tx) * 0.54;
        const ctrlY = Math.min(ky, ty) - (isWide ? 20 : 12) + s.coreSpring.y * 0.12;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(kx, ky);
        ctx.quadraticCurveTo(ctrlX, ctrlY, tx, ty);
        ctx.strokeStyle = `rgba(${activeRgb}, ${(0.22 + s.kbWireHeat * 0.24 + coreNode.hoverScale * 0.2 + coreTension * 0.32).toFixed(3)})`;
        ctx.lineWidth = 1.15 + coreNode.hoverScale * 0.35 + coreTension * 0.45;
        ctx.stroke();

        // Subtle quiet label along keyboard branch on desktop
        if (s.W >= 820) {
          const mid = getQuadPt(kx, ky, ctrlX, ctrlY, tx, ty, 0.46);
          ctx.font = `500 8px "JetBrains Mono", ui-monospace, monospace`;
          ctx.fillStyle = "rgba(130, 146, 160, 0.62)";
          ctx.textAlign = "center";
          ctx.fillText("GYRA KEYBOARD → CORE", mid.x, mid.y - 9);
        }

        // Restrained keystroke pulses along keyboard wire
        for (let i = s.packets.length - 1; i >= 0; i--) {
          const pk = s.packets[i];
          pk.p += dt * pk.speed;
          if (pk.p >= 1) {
            s.packets.splice(i, 1);
            continue;
          }
          const pt = getQuadPt(kx, ky, ctrlX, ctrlY, tx, ty, pk.p);
          ctx.fillStyle = "rgba(196, 220, 236, 0.72)";
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pk.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Single calm optical dot gliding from Keyboard -> GYRA CORE on modality handoff
        if (s.wirePulse >= 0) {
          s.wirePulse += dt * 0.95;
          if (s.wirePulse <= 1) {
            const pt = getQuadPt(kx, ky, ctrlX, ctrlY, tx, ty, s.wirePulse);
            const g = ctx.createRadialGradient(pt.x, pt.y, 0.5, pt.x, pt.y, 8);
            g.addColorStop(0, "rgba(216, 232, 244, 0.78)");
            g.addColorStop(1, "rgba(128, 170, 198, 0)");
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#E6EFF5";
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            s.wirePulse = -1;
          }
        }
        ctx.restore();
      }

      // 2. DRAW ALL SYNAPTIC EDGES — CONTINUOUS, LAMINAR, HOVER-REACTIVE & ELASTIC FLOW!
      const hovNode = s.hovered;
      const coreHover = coreNode ? coreNode.hoverScale : 0;
      for (let ei = 0; ei < s.edges.length; ei++) {
        const edge = s.edges[ei];
        const a = nPos(edge.from);
        const b = nPos(edge.to);
        const touchesCore = edge.from.id === "core" || edge.to.id === "core";
        const mx = (a.x + b.x) * 0.5 + (touchesCore ? -s.coreSpring.x * 0.08 : 0);
        const my =
          (a.y + b.y) * 0.5 +
          (edge.kind === "stage-product" ? -14 : 0) +
          (touchesCore ? -s.coreSpring.y * 0.08 : 0);

        // Smooth float heat [0..1] for every edge — zero abrupt on/off blinking!
        let heat = 0;
        if (edge.kind === "trunk") {
          heat = 0.75;
        } else if (edge.kind === "core-stage" || edge.kind === "stage-chain") {
          heat = s.stageHeat[edge.stageIdx ?? 0] * 0.72;
        } else if (edge.branch) {
          const bh = s.branchHeat[edge.branch];
          const sh = edge.stageIdx !== undefined ? 0.55 + s.stageHeat[edge.stageIdx] * 0.45 : 1;
          heat = bh * sh;
        }

        // Hover route tracing + elastic stretch illumination
        let hoverBoost = 0;
        if (touchesCore) {
          hoverBoost = Math.max(hoverBoost, coreHover * 0.35 + coreTension * 0.52);
        }
        if (hovNode) {
          if (edge.from.id === hovNode.id || edge.to.id === hovNode.id) {
            hoverBoost = Math.max(hoverBoost, 0.52);
          } else if (hovNode.branch && edge.branch === hovNode.branch) {
            hoverBoost = Math.max(hoverBoost, 0.38);
          } else if (hovNode.branch && (edge.kind === "trunk" || edge.kind === "core-stage")) {
            hoverBoost = Math.max(hoverBoost, 0.24);
          }
        }
        heat = Math.min(1, heat + hoverBoost);

        // Base architectural hairline wire
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(mx, my, b.x, b.y);
        ctx.strokeStyle =
          heat > 0.04
            ? `rgba(${activeRgb}, ${(0.09 + heat * 0.36).toFixed(3)})`
            : "rgba(255, 255, 255, 0.075)";
        ctx.lineWidth = 0.8 + heat * 0.5;
        ctx.stroke();

        // Serene, slow laminar drift along EVERY fine line so it feels quietly alive, never frantic
        if (!reduced) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(mx, my, b.x, b.y);
          ctx.setLineDash(heat > 0.35 ? [8, 30] : [4, 38]);
          ctx.lineDashOffset = -(s.t * (5 + heat * 9) + ei * 13);
          ctx.strokeStyle =
            heat > 0.08
              ? `rgba(${activeRgb}, ${(0.14 + heat * 0.38).toFixed(3)})`
              : "rgba(164, 192, 212, 0.14)";
          ctx.lineWidth = 0.85 + heat * 0.35;
          ctx.stroke();
          ctx.restore();

          // Tiny quiet traveling bead gliding smoothly down each line
          const beadSpeed = 0.14 + heat * 0.16;
          const beadT = (s.t * beadSpeed + ei * 0.21) % 1;
          const pt = getQuadPt(a.x, a.y, mx, my, b.x, b.y, beadT);
          ctx.fillStyle = `rgba(196, 220, 236, ${(0.16 + heat * 0.54).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 0.95 + heat * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. DRAW LIVE CURVED DOWNWARD OPTICAL TETHER WIRES INTO TOP E2B TABS
      const compact = s.W < 780;
      for (let pi = 0; pi < s.ports.length; pi++) {
        const port = s.ports[pi];
        const leaves = s.nodes.filter((n) => n.tier === 4 && n.branch === port.branch);
        const bh = s.branchHeat[port.branch];
        for (let li = 0; li < leaves.length; li++) {
          const lf = leaves[li];
          const lp = nPos(lf);
          const startY = lp.y + lf.r + 2;
          const ctrlX = (lp.x + port.x) * 0.5;
          const ctrlY = (startY + port.y) * 0.55;
          ctx.beginPath();
          ctx.moveTo(lp.x, startY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, port.x, port.y);
          ctx.strokeStyle =
            bh > 0.04
              ? `rgba(${activeRgb}, ${(0.09 + bh * 0.42).toFixed(3)})`
              : "rgba(255, 255, 255, 0.075)";
          ctx.lineWidth = 0.8 + bh * 0.5;
          ctx.stroke();

          if (!reduced) {
            const bt = (s.t * (0.16 + bh * 0.22) + (pi * 3 + li) * 0.19) % 1;
            const pt = getQuadPt(lp.x, startY, ctrlX, ctrlY, port.x, port.y, bt);
            ctx.fillStyle = `rgba(196, 220, 236, ${(0.16 + bh * 0.58).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 0.95 + bh * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 3b. QUIET SINGLE HAIRLINE FOCUS RING ON ORB INTERACTION
      for (let i = s.ripples.length - 1; i >= 0; i--) {
        const rp = s.ripples[i];
        rp.r += dt * (rp.maxR * 1.15);
        rp.alpha = Math.max(0, 1 - rp.r / rp.maxR);
        if (rp.alpha <= 0.01) {
          s.ripples.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.strokeStyle = `rgba(196, 220, 236, ${(rp.alpha * 0.32).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 4. DRAW ALL 21 INTERACTIVE ORBS + CRISP MATURE LABELS (dragged/returning core always floats on top)
      const orderedNodes = [...s.nodes].sort((a, b) => {
        const score = (n: OrbNode) => {
          if (s.drag.active && s.drag.nodeId === n.id) return 3;
          if (n.id === "core" && coreTension > 0.01) return 2;
          if (s.hovered?.id === n.id) return 1;
          return 0;
        };
        return score(a) - score(b);
      });
      for (const node of orderedNodes) {
        const pos = nPos(node);
        node.glow = Math.max(0, node.glow - dt * 1.4);
        const isDraggedNode = s.drag.active && s.drag.nodeId === node.id;
        const isHovered = s.hovered?.id === node.id || s.selectedNodeId === node.id || isDraggedNode;
        const scaleMult = 1 + node.hoverScale * (node.id === "core" ? 0.13 : 0.1);
        const drawR = node.r * scaleMult;

        let heat = 0;
        if (node.tier === 0) heat = 0.45;
        else if (node.tier === 1) heat = 0.85;
        else if (node.tier === 2) heat = s.stageHeat[node.stageIdx ?? 0] * 0.82;
        else if (node.branch) heat = s.branchHeat[node.branch];

        const totalEnergy = Math.min(
          1,
          Math.max(
            heat,
            node.hoverScale * 0.96,
            node.id === "core" ? coreTension * 0.95 : 0,
            node.glow * 0.7,
          ),
        );

        // Subtle, restrained architectural glow only when active, hovered, or displaced
        if (totalEnergy > 0.25) {
          const hr = drawR * (1.65 + node.hoverScale * 0.58 + (node.id === "core" ? coreTension * 0.45 : 0));
          const halo = ctx.createRadialGradient(pos.x, pos.y, drawR * 0.35, pos.x, pos.y, hr);
          halo.addColorStop(
            0,
            `rgba(${activeRgb}, ${(totalEnergy * (0.13 + node.hoverScale * 0.13 + (node.id === "core" ? coreTension * 0.12 : 0))).toFixed(3)})`,
          );
          halo.addColorStop(1, `rgba(${activeRgb}, 0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, hr, 0, Math.PI * 2);
          ctx.fill();
        }

        // Precision dual-ring architectural gimbal around GYRA CORE (expands & counter-rotates on hover/drag)
        if (node.id === "core") {
          const ringFocus = Math.max(node.hoverScale, coreTension);
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(s.coreAngle);
          ctx.setLineDash([3, 9]);
          ctx.strokeStyle = `rgba(255, 255, 255, ${(0.16 + ringFocus * 0.36).toFixed(3)})`;
          ctx.lineWidth = 1 + ringFocus * 0.35;
          ctx.beginPath();
          ctx.arc(0, 0, drawR + 7 + ringFocus * 4.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // Counter-rotating inner precision gimbal + 4 cardinal grab-ticks on hover/drag
          if (ringFocus > 0.02) {
            const outerGimbal = drawR + 14 + ringFocus * 3;
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(s.coreGimbalAngle);
            ctx.strokeStyle = `rgba(164, 206, 232, ${(ringFocus * 0.42).toFixed(3)})`;
            ctx.lineWidth = 0.9;
            ctx.setLineDash([12, 18]);
            ctx.beginPath();
            ctx.arc(0, 0, outerGimbal, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // 4 crisp cardinal grab ticks (N/E/S/W) signaling 360-degree moveability
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.strokeStyle = `rgba(216, 236, 248, ${(ringFocus * 0.65).toFixed(3)})`;
            ctx.lineWidth = 1.1;
            const tickIn = drawR + 5;
            const tickOut = drawR + 10.5;
            for (let ti = 0; ti < 4; ti++) {
              const ang = (ti * Math.PI) / 2;
              ctx.beginPath();
              ctx.moveTo(Math.cos(ang) * tickIn, Math.sin(ang) * tickIn);
              ctx.lineTo(Math.cos(ang) * tickOut, Math.sin(ang) * tickOut);
              ctx.stroke();
            }
            ctx.restore();
          }
        } else if (node.hoverScale > 0.04) {
          // Crisp architectural focus ring for hovered sibling orbs
          ctx.save();
          ctx.strokeStyle = `rgba(196, 224, 242, ${(node.hoverScale * 0.48).toFixed(3)})`;
          ctx.lineWidth = 0.95;
          ctx.setLineDash([3, 6]);
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, drawR + 5.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Orb body (matte obsidian with crisp border)
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, drawR, 0, Math.PI * 2);
        ctx.fillStyle = isDraggedNode ? "#0A1520" : totalEnergy > 0.4 ? "#070C12" : "#030508";
        ctx.fill();
        ctx.strokeStyle = isHovered
          ? "rgba(255, 255, 255, 0.95)"
          : `rgba(${activeRgb}, ${(0.22 + totalEnergy * 0.56).toFixed(3)})`;
        ctx.lineWidth = isHovered ? 1.65 : 1 + totalEnergy * 0.4;
        ctx.stroke();

        // Vector icon inside orb
        drawVectorIcon(
          ctx,
          node.icon,
          pos.x,
          pos.y,
          drawR,
          isHovered
            ? "#FFFFFF"
            : totalEnergy > 0.5
              ? "#D4E4EF"
              : "#677886",
        );

        // Typography labels
        ctx.save();
        ctx.textAlign = "center";
        if (node.tier === 0) {
          ctx.font = `600 ${compact ? 9.5 : 10.5}px "JetBrains Mono", ui-monospace, monospace`;
          ctx.fillStyle = "#D8E1E8";
          ctx.fillText(node.label, pos.x, pos.y - node.r - 12);
          ctx.font = `500 ${compact ? 7 : 8}px "JetBrains Mono", ui-monospace, monospace`;
          ctx.fillStyle = "rgba(130, 146, 160, 0.72)";
          ctx.fillText("ROOT · AI COMPANY", pos.x, pos.y - node.r - 3);
        } else if (node.tier === 1) {
          ctx.font = `600 ${compact ? 10 : 11}px "JetBrains Mono", ui-monospace, monospace`;
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(node.label, pos.x, pos.y + node.r + 15);
          ctx.font = `500 ${compact ? 7 : 8}px "JetBrains Mono", ui-monospace, monospace`;
          ctx.fillStyle = "rgba(132, 168, 192, 0.76)";
          ctx.fillText("AGENTIC AI", pos.x, pos.y + node.r + 25);
        } else if (node.tier === 2) {
          ctx.font = `500 ${compact ? 8.5 : 9.5}px "JetBrains Mono", ui-monospace, monospace`;
          ctx.fillStyle = totalEnergy > 0.65 ? "#DCE6EE" : "#707E8B";
          ctx.fillText(`${node.shortCode} ${node.label}`, pos.x, pos.y + node.r + 15);
        } else if (node.tier === 3) {
          ctx.font = `600 ${compact ? 9.5 : 11}px "JetBrains Mono", ui-monospace, monospace`;
          ctx.fillStyle = totalEnergy > 0.5 ? "#FFFFFF" : "#8F9AA4";
          ctx.fillText(node.label, pos.x, pos.y + node.r + 16);
          if (!compact && node.sub) {
            ctx.font = `500 8px "JetBrains Mono", ui-monospace, monospace`;
            ctx.fillStyle = totalEnergy > 0.5 ? "#80A6BE" : "#515B64";
            ctx.fillText(node.sub, pos.x, pos.y + node.r + 28);
          }
        } else if (node.tier === 4 && !compact) {
          ctx.font = `500 8.5px "JetBrains Mono", ui-monospace, monospace`;
          ctx.fillStyle = totalEnergy > 0.5 ? "#C4D5E2" : "#5D6872";
          ctx.fillText(node.label, pos.x, pos.y + node.r + 12);
        }
        ctx.restore();
      }

      // SMART MOBILE SUB-ENGINE READOUT: displays the active branch's 3 sub-engines cleanly above the table
      if (compact) {
        const activeBranchSpec = BRANCHES.find((b) => b.id === activeB);
        if (activeBranchSpec) {
          const caption = activeBranchSpec.leaves.map((l) => l.name.toUpperCase()).join("  ·  ");
          ctx.save();
          ctx.font = `500 8.5px "JetBrains Mono", ui-monospace, monospace`;
          ctx.textAlign = "center";
          ctx.fillStyle = "rgba(164, 192, 212, 0.85)";
          ctx.fillText(caption, s.W * 0.5, s.H - 14);
          ctx.restore();
        }
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("touchmove", onTouchMoveGuard);
    };
  }, []);

  const getLiveOrbPos = (n: OrbNode) => {
    const s = stateRef.current;
    const d = n.tier === 1 ? 0.45 : n.tier === 3 ? 0.65 : 0.3;
    if (n.id === "core") {
      return {
        x: n.x + s.coreSpring.x + s.parallax.x * d + n.magX,
        y: n.y + s.coreSpring.y + s.parallax.y * d + n.magY,
      };
    }
    const followFactor = n.tier === 0 || n.tier === 2 ? 0.14 : n.tier === 3 ? 0.05 : 0.02;
    const follow = computeCoupledFollowOffset(s.coreSpring, followFactor);
    return {
      x: n.x + follow.x + n.dragSpring.x + s.parallax.x * d + n.magX,
      y: n.y + follow.y + n.dragSpring.y + s.parallax.y * d + n.magY,
    };
  };

  const triggerOrbIntelligenceSurge = (hit: OrbNode, strong: boolean) => {
    const s = stateRef.current;
    const pos = getLiveOrbPos(hit);
    hit.glow = strong ? 0.85 : 0.45;

    // Single quiet architectural hairline focus ring (mature & non-flashy)
    s.ripples.push({
      x: pos.x,
      y: pos.y,
      r: hit.r,
      maxR: hit.r + (strong ? 28 : 18),
      alpha: 1,
    });
  };

  const findHitOrb = (mx: number, my: number): OrbNode | null => {
    const s = stateRef.current;
    let best: OrbNode | null = null;
    let bestDist = Infinity;
    for (const n of s.nodes) {
      const pos = getLiveOrbPos(n);
      const d = Math.hypot(mx - pos.x, my - pos.y);
      const hitPad = n.id === "core" ? 18 : 14;
      if (d <= n.r + hitPad && d < bestDist) {
        best = n;
        bestDist = d;
      }
    }
    return best;
  };

  const activateOrbClick = (hit: OrbNode | null, rect: DOMRect) => {
    const s = stateRef.current;
    if (!hit) {
      s.selectedNodeId = null;
      setHoverTip((prev) => ({ ...prev, visible: false, pinned: false }));
      return;
    }

    s.selectedNodeId = hit.id;
    triggerOrbIntelligenceSurge(hit, true);

    const pos = getLiveOrbPos(hit);
    const tipX = Math.min(Math.max(10, pos.x - 115), Math.max(10, rect.width - 246));
    const tipY = Math.min(Math.max(10, pos.y + hit.r + 14), Math.max(10, rect.height - 122));
    setHoverTip({
      visible: true,
      pinned: true,
      x: tipX,
      y: tipY,
      kicker: hit.tierName,
      title: hit.label,
      desc: hit.desc,
      hint: hit.id === "core" ? "DRAG ANYWHERE · ELASTIC RETURN" : undefined,
    });

    if (tipTimerRef.current) window.clearTimeout(tipTimerRef.current);
    tipTimerRef.current = window.setTimeout(() => {
      stateRef.current.selectedNodeId = null;
      setHoverTip((prev) => (prev.pinned ? { ...prev, visible: false, pinned: false } : prev));
    }, 4200);

    if (hit.branch) {
      onSelectModality(hit.branch);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const s = stateRef.current;
    s.pointerPos = { x: mx, y: my, inside: true };

    const hit = findHitOrb(mx, my);
    if (!hit) {
      activateOrbClick(null, rect);
      return;
    }

    const vis = getLiveOrbPos(hit);
    const now = performance.now();
    s.hovered = hit;
    s.drag = {
      active: true,
      nodeId: hit.id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      grabOffsetX: mx - vis.x,
      grabOffsetY: my - vis.y,
      lastX: mx,
      lastY: my,
      lastTs: now,
      vx: 0,
      vy: 0,
      moved: false,
    };

    if (hit.id === "core") {
      s.coreSpring.vx = 0;
      s.coreSpring.vy = 0;
    } else {
      hit.dragSpring.vx = 0;
      hit.dragSpring.vy = 0;
    }

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic pointer events without active pointerId
    }
    canvas.style.cursor = "grabbing";
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const s = stateRef.current;
    s.pointer.nx = (mx / Math.max(1, rect.width) - 0.5) * 2;
    s.pointer.ny = (my / Math.max(1, rect.height) - 0.5) * 2;
    s.pointerPos = { x: mx, y: my, inside: true };

    if (s.drag.active && s.drag.nodeId) {
      const node = s.nodes.find((n) => n.id === s.drag.nodeId);
      if (node) {
        const travel = Math.hypot(
          e.clientX - s.drag.startClientX,
          e.clientY - s.drag.startClientY,
        );
        if (travel > 5 && !s.drag.moved) {
          s.drag.moved = true;
          setHoverTip((prev) => (prev.visible ? { ...prev, visible: false, pinned: false } : prev));
        }

        const now = performance.now();
        const dtMs = Math.max(4, now - s.drag.lastTs);
        const instVx = ((mx - s.drag.lastX) / dtMs) * 1000;
        const instVy = ((my - s.drag.lastY) / dtMs) * 1000;
        s.drag.vx = s.drag.vx * 0.55 + instVx * 0.45;
        s.drag.vy = s.drag.vy * 0.55 + instVy * 0.45;
        s.drag.lastX = mx;
        s.drag.lastY = my;
        s.drag.lastTs = now;

        const targetCenterX = mx - s.drag.grabOffsetX;
        const targetCenterY = my - s.drag.grabOffsetY;

        if (node.id === "core") {
          const clamped = clampCoreOffset(
            targetCenterX - node.x,
            targetCenterY - node.y,
            {
              baseX: node.x,
              baseY: node.y,
              width: s.W,
              height: s.H,
              padding: node.r + 16,
            },
          );
          s.coreSpring.x = clamped.x;
          s.coreSpring.y = clamped.y;
          s.coreSpring.vx = 0;
          s.coreSpring.vy = 0;
          if (Math.hypot(clamped.x, clamped.y) > 4) {
            s.coreWasDisplaced = true;
          }
        } else {
          const clamped = clampRadialOffset(
            targetCenterX - node.x,
            targetCenterY - node.y,
            28,
          );
          node.dragSpring.x = clamped.x;
          node.dragSpring.y = clamped.y;
          node.dragSpring.vx = 0;
          node.dragSpring.vy = 0;
        }
        canvas.style.cursor = "grabbing";
        return;
      }
    }

    const hit = findHitOrb(mx, my);
    const prevHoverId = s.hovered?.id;
    s.hovered = hit;
    canvas.style.cursor = hit ? (hit.id === "core" ? "grab" : "pointer") : "default";

    if (hit) {
      if (hit.id !== prevHoverId) {
        triggerOrbIntelligenceSurge(hit, false);
      }
      const clearOffset = hit.id === "core" ? 58 : 22;
      const preferRight = mx + clearOffset + 246 <= rect.width - 12;
      const rawTipX = preferRight ? mx + clearOffset : mx - clearOffset - 244;
      const tipX = Math.min(Math.max(12, rawTipX), Math.max(12, rect.width - 256));
      const tipY = Math.min(
        Math.max(12, hit.id === "core" ? my - 46 : my - 18),
        Math.max(12, rect.height - 134),
      );
      setHoverTip({
        visible: true,
        pinned: false,
        x: tipX,
        y: tipY,
        kicker: hit.tierName,
        title: hit.label,
        desc: hit.desc,
        hint: hit.id === "core" ? "DRAG ANYWHERE · ELASTIC RETURN" : undefined,
      });
    } else if (!hoverTip.pinned) {
      setHoverTip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }
  };

  const finishPointerDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = stateRef.current;
    if (!s.drag.active) return;

    const dragNodeId = s.drag.nodeId;
    const wasMoved = s.drag.moved;
    const releaseVel = clampReleaseVelocity(s.drag.vx * 0.36, s.drag.vy * 0.36, 1250);

    if (s.drag.pointerId !== null) {
      try {
        if (canvas.hasPointerCapture(s.drag.pointerId)) {
          canvas.releasePointerCapture(s.drag.pointerId);
        }
      } catch {
        // Ignore if pointer capture already released
      }
    }

    s.drag.active = false;
    s.drag.nodeId = null;
    s.drag.pointerId = null;
    s.drag.moved = false;

    const draggedNode = dragNodeId ? s.nodes.find((n) => n.id === dragNodeId) ?? null : null;

    if (wasMoved && draggedNode) {
      if (draggedNode.id === "core") {
        s.coreSpring.vx = releaseVel.x;
        s.coreSpring.vy = releaseVel.y;
        s.coreWasDisplaced = true;
      } else {
        draggedNode.dragSpring.vx = releaseVel.x * 0.45;
        draggedNode.dragSpring.vy = releaseVel.y * 0.45;
      }
    } else if (draggedNode) {
      activateOrbClick(draggedNode, canvas.getBoundingClientRect());
    }

    const rect = canvas.getBoundingClientRect();
    const hitAfter = findHitOrb(e.clientX - rect.left, e.clientY - rect.top);
    s.hovered = hitAfter;
    canvas.style.cursor = hitAfter ? (hitAfter.id === "core" ? "grab" : "pointer") : "default";
  };

  const handlePointerLeave = () => {
    const s = stateRef.current;
    if (s.drag.active) return;
    s.hovered = null;
    s.pointer = { nx: 0, ny: 0 };
    s.pointerPos.inside = false;
    setHoverTip((prev) => (prev.visible && !prev.pinned ? { ...prev, visible: false } : prev));
  };

  return (
    <div className="relative">
      {/* 21-ORB UNBOXED SYNAPTIC CANOPY + SIDE-MOUNTED 3D GYRA KEYBOARD POCKET (ALWAYS AT LEFT SIDE — NEVER ABOVE GENVIA!) */}
      <div
        ref={wrapRef}
        data-testid="synaptic-keyboard-canopy"
        className="gyra-mask-canopy relative h-[468px] w-full overflow-hidden bg-black sm:h-[535px]"
      >
        <canvas
          ref={canvasRef}
          data-testid="synaptic-keyboard-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointerDrag}
          onPointerCancel={finishPointerDrag}
          onPointerLeave={handlePointerLeave}
          className="block h-full w-full select-none"
          style={{ touchAction: "pan-y" }}
          aria-label="Interactive 21-orb Gyra Synaptic Flow wired from the side-mounted 3D GYRA Keyboard into Chat, Image, Video, and Audio. Hover orbs to trace routes or drag GYRA CORE freely to test elastic return."
        />

        {/* ALWAYS AT LEFT SIDE OF GENVIA -> GYRA CORE (Mobile, Tablet & Desktop!) */}
        <div className="absolute left-0 top-2 z-20 w-[138px] sm:left-1 sm:top-1 sm:w-[214px] lg:w-[292px] xl:w-[316px]">
          <Interactive3DKeyboard
            compactCorner
            activeChar={activeChar}
            activeCharNonce={activeCharNonce}
            enterPulseNonce={enterPulseNonce}
            onKeyTap={onKeyTap}
            statusLabel="GYRA · DRAG TO TURN 3D"
          />
        </div>

        {/* Quiet Floating Hover Inspection Tooltip on all 21 Orbs */}
        <div
          role="status"
          aria-live="polite"
          style={{ left: hoverTip.x, top: hoverTip.y }}
          className={`pointer-events-none absolute z-30 max-w-[244px] border border-white/18 bg-[#050608]/96 px-3 py-2 transition-opacity duration-150 ${
            hoverTip.visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-mono-tech text-[8.5px] tracking-[0.14em] text-[#7DA4BD] uppercase">
            {hoverTip.kicker}
          </p>
          <p className="font-display mt-0.5 text-[14px] font-bold tracking-tight text-white uppercase">
            {hoverTip.title}
          </p>
          <p className="mt-1 text-[11px] leading-[1.4] text-[#9EAAB4]">{hoverTip.desc}</p>
          {hoverTip.hint && (
            <p className="mt-1.5 border-t border-white/10 pt-1.5 font-mono-tech text-[8.5px] tracking-[0.14em] text-[#8BB9D6] uppercase">
              {hoverTip.hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
