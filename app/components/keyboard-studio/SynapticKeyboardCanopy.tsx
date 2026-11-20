"use client";

import { useEffect, useRef, useState } from "react";
import { Interactive3DKeyboard } from "./Interactive3DKeyboard";

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
  }>({ visible: false, pinned: false, x: 0, y: 0, kicker: "", title: "", desc: "" });

  const stateRef = useRef({
    W: 1120,
    H: 545,
    dpr: 1,
    t: 0,
    coreAngle: 0,
    nodes: [] as OrbNode[],
    edges: [] as OrbEdge[],
    ports: [] as { x: number; y: number; branch: LiveModalityId }[],
    packets: [] as PulsePacket[],
    ripples: [] as RippleRing[],
    hovered: null as OrbNode | null,
    selectedNodeId: null as string | null,
    parallax: { x: 0, y: 0 },
    pointer: { nx: 0, ny: 0 },
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
      if (!reduced) {
        s.t += dt;
        s.coreAngle += dt * 0.14;
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

      // Ultra-quiet hairline architectural polar rings around GYRA CORE
      if (coreNode) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.032)";
        ctx.lineWidth = 1;
        [86, 174, 282].forEach((rr, idx) => {
          ctx.setLineDash(idx === 1 ? [2, 14] : []);
          ctx.beginPath();
          ctx.arc(coreNode.x + s.parallax.x * 0.25, coreNode.y + s.parallax.y * 0.25, rr, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.restore();
      }

      // 1. PHYSICAL CURVED BRANCH CONNECTING LEFT-SIDE 3D GYRA KEYBOARD -> GYRA CORE
      if (coreNode) {
        const kx = s.kbAnchor.x;
        const ky = s.kbAnchor.y;
        const tx = coreNode.x + s.parallax.x * 0.4;
        const ty = coreNode.y + s.parallax.y * 0.4;
        const isWide = s.W >= 640;
        const ctrlX = (kx + tx) * 0.54;
        const ctrlY = Math.min(ky, ty) - (isWide ? 20 : 12);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(kx, ky);
        ctx.quadraticCurveTo(ctrlX, ctrlY, tx, ty);
        ctx.strokeStyle = `rgba(${activeRgb}, ${(0.22 + s.kbWireHeat * 0.24).toFixed(3)})`;
        ctx.lineWidth = 1.15;
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

      // Helper for node screen position with subtle parallax
      const nPos = (n: OrbNode) => {
        const d = n.tier === 1 ? 0.45 : n.tier === 3 ? 0.65 : 0.3;
        return { x: n.x + s.parallax.x * d, y: n.y + s.parallax.y * d };
      };

      // 2. DRAW ALL SYNAPTIC EDGES — CONTINUOUS, LAMINAR, SMOOTHLY INTERPOLATED FLOW!
      for (let ei = 0; ei < s.edges.length; ei++) {
        const edge = s.edges[ei];
        const a = nPos(edge.from);
        const b = nPos(edge.to);
        const mx = (a.x + b.x) * 0.5;
        const my = (a.y + b.y) * 0.5 + (edge.kind === "stage-product" ? -14 : 0);

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

      // 4. DRAW ALL 21 INTERACTIVE ORBS + CRISP MATURE LABELS
      for (const node of s.nodes) {
        const pos = nPos(node);
        node.glow = Math.max(0, node.glow - dt * 1.4);
        const isHovered = s.hovered?.id === node.id || s.selectedNodeId === node.id;

        let heat = 0;
        if (node.tier === 0) heat = 0.45;
        else if (node.tier === 1) heat = 0.85;
        else if (node.tier === 2) heat = s.stageHeat[node.stageIdx ?? 0] * 0.82;
        else if (node.branch) heat = s.branchHeat[node.branch];

        const totalEnergy = Math.min(1, Math.max(heat, isHovered ? 0.95 : 0, node.glow * 0.7));

        // Subtle, restrained architectural glow only when active or hovered
        if (totalEnergy > 0.25) {
          const hr = node.r * (isHovered ? 2.1 : 1.65);
          const halo = ctx.createRadialGradient(pos.x, pos.y, node.r * 0.35, pos.x, pos.y, hr);
          halo.addColorStop(0, `rgba(${activeRgb}, ${(totalEnergy * (isHovered ? 0.22 : 0.13)).toFixed(3)})`);
          halo.addColorStop(1, `rgba(${activeRgb}, 0)`);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, hr, 0, Math.PI * 2);
          ctx.fill();
        }

        // Single calm rotating architectural hairline ring around GYRA CORE
        if (node.id === "core") {
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(s.coreAngle);
          ctx.setLineDash([3, 9]);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, node.r + 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Orb body (matte obsidian with crisp border)
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = totalEnergy > 0.4 ? "#070C12" : "#030508";
        ctx.fill();
        ctx.strokeStyle = isHovered
          ? "rgba(255, 255, 255, 0.92)"
          : `rgba(${activeRgb}, ${(0.22 + totalEnergy * 0.56).toFixed(3)})`;
        ctx.lineWidth = isHovered ? 1.5 : 1 + totalEnergy * 0.4;
        ctx.stroke();

        // Vector icon inside orb
        drawVectorIcon(
          ctx,
          node.icon,
          pos.x,
          pos.y,
          node.r,
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
    };
  }, []);

  const triggerOrbIntelligenceSurge = (hit: OrbNode, strong: boolean) => {
    const s = stateRef.current;
    hit.glow = strong ? 0.85 : 0.45;

    // Single quiet architectural hairline focus ring (mature & non-flashy)
    s.ripples.push({
      x: hit.x,
      y: hit.y,
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
      const d = Math.hypot(mx - n.x, my - n.y);
      if (d <= n.r + 14 && d < bestDist) {
        best = n;
        bestDist = d;
      }
    }
    return best;
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const s = stateRef.current;
    s.pointer.nx = ((mx / Math.max(1, rect.width)) - 0.5) * 2;
    s.pointer.ny = ((my / Math.max(1, rect.height)) - 0.5) * 2;

    const hit = findHitOrb(mx, my);
    const prevHoverId = s.hovered?.id;
    s.hovered = hit;
    canvas.style.cursor = hit ? "pointer" : "default";

    if (hit) {
      if (hit.id !== prevHoverId) {
        triggerOrbIntelligenceSurge(hit, false);
      }
      const tipX = Math.min(Math.max(12, mx + 16), Math.max(12, rect.width - 252));
      const tipY = Math.min(Math.max(12, my - 14), Math.max(12, rect.height - 108));
      setHoverTip({
        visible: true,
        pinned: false,
        x: tipX,
        y: tipY,
        kicker: hit.tierName,
        title: hit.label,
        desc: hit.desc,
      });
    } else if (!hoverTip.pinned) {
      setHoverTip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    }
  };

  const handleCanvasLeave = () => {
    stateRef.current.hovered = null;
    stateRef.current.pointer = { nx: 0, ny: 0 };
    setHoverTip((prev) => (prev.visible && !prev.pinned ? { ...prev, visible: false } : prev));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = findHitOrb(mx, my);
    const s = stateRef.current;

    if (!hit) {
      s.selectedNodeId = null;
      setHoverTip((prev) => ({ ...prev, visible: false, pinned: false }));
      return;
    }

    // Fire full electric harmonic surge + cascading neural sparks on ANY clicked orb (GENVIA, GYRA CORE, 01..03, or Modalities!)
    s.selectedNodeId = hit.id;
    triggerOrbIntelligenceSurge(hit, true);

    const tipX = Math.min(Math.max(10, hit.x - 115), Math.max(10, rect.width - 246));
    const tipY = Math.min(Math.max(10, hit.y + hit.r + 14), Math.max(10, rect.height - 110));
    setHoverTip({
      visible: true,
      pinned: true,
      x: tipX,
      y: tipY,
      kicker: hit.tierName,
      title: hit.label,
      desc: hit.desc,
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
          onMouseMove={handleCanvasMove}
          onMouseLeave={handleCanvasLeave}
          onClick={handleCanvasClick}
          className="block h-full w-full"
          aria-label="Interactive 21-orb Gyra Synaptic Flow wired from the side-mounted 3D GYRA Keyboard into Chat, Image, Video, and Audio"
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
        </div>
      </div>
    </div>
  );
}
