"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Pause, Play } from "lucide-react";
import { resolveGyraRoute } from "../../lib/landingSimulations";

export type FlowModalityId = "chat" | "image" | "video" | "api";

interface ModalitySpec {
  id: FlowModalityId;
  shortLabel: string;
  label: string;
  sub: string;
  route: string;
  metric: string;
  appHref: string;
  appLabel: string;
  sectionHref: string;
  defaultPrompt: string;
  trace: string[];
  code: string;
}

export const FLOW_MODALITIES: Record<FlowModalityId, ModalitySpec> = {
  chat: {
    id: "chat",
    shortLabel: "Chat",
    label: "Gyra Chat",
    sub: "6-Agent Core",
    route: "POST /api/v1/chat",
    metric: "14ms TTFT · 118 tok/s",
    appHref: "/dashboard",
    appLabel: "Open Gyra Chat",
    sectionHref: "#chat",
    defaultPrompt:
      "Write a constant-time HMAC Next.js webhook handler with per-IP rate limiting.",
    trace: [
      "01 Understand · Classified HMAC timingSafeEqual & 300s replay guard",
      "02 Orchestrate · Scheduled Atlas -> Architect -> Forge -> Sentinel QA",
      "03 Execute · Streamed verified TypeScript route over HTTP/2 SSE",
    ],
    code: `export async function POST(req: Request) {
  const valid = timingSafeEqual(sigBuf, expectedBuf);
  if (!valid || Math.abs(now - ts) > 300_000) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json({ ok: true, verifiedBy: "Sentinel QA" });
}`,
  },
  image: {
    id: "image",
    shortLabel: "Image",
    label: "Gyra Image",
    sub: "Pro Ultra I2I",
    route: "POST /api/fal/proxy",
    metric: "SSIM 0.994 · 2.1s",
    appHref: "/dashboard",
    appLabel: "Open Gyra Image",
    sectionHref: "#image",
    defaultPrompt:
      "Relight interior studio scene to blue-hour dusk with warm 2700K lamp bounce.",
    trace: [
      "01 Understand · Encoded 16-bit surface geometry & camera frustum",
      "02 Orchestrate · Locked spatial layout via Pro Ultra I2I graph",
      "03 Execute · Synthesized 2700K tungsten reflections with 0 drift",
    ],
    code: "",
  },
  video: {
    id: "video",
    shortLabel: "Video",
    label: "Gyra Video",
    sub: "LTX-Video 13B",
    route: "POST /api/v1/video/generate",
    metric: "720p · 24 fps · 121f",
    appHref: "/studio",
    appLabel: "Open Gyra Studio",
    sectionHref: "#video",
    defaultPrompt:
      "Direct 16:9 macro rim-light orbit around obsidian studio headphones at 24 fps.",
    trace: [
      "01 Understand · Anchored Frame 001 obsidian rim-lit studio headset",
      "02 Orchestrate · Queued 121-frame smooth macro dolly on LTX-13B",
      "03 Execute · Finalized H.264 stream with zero temporal flicker",
    ],
    code: "",
  },
  api: {
    id: "api",
    shortLabel: "API",
    label: "Gyra API",
    sub: "OpenAI-Compat v1",
    route: "https://gyra.ng/api/v1/*",
    metric: "11ms Edge · 99.9% SLA",
    appHref: "/api",
    appLabel: "Explore API",
    sectionHref: "#developers",
    defaultPrompt:
      "POST /api/v1/chat -> gyra-super2.0 SSE stream with scoped Bearer auth.",
    trace: [
      "01 Understand · Validated category-scoped Bearer key & wallet balance",
      "02 Orchestrate · Routed via anycast edge hub (LOS-01 / LHR-01)",
      "03 Execute · Opened live SSE stream across Web, Android & @GyraAi",
    ],
    code: `{
  "id": "chatcmpl-gyra-9a2f",
  "object": "chat.completion",
  "model": "gyra-super2.0",
  "edge": "LOS-01",
  "status": "200 OK · OpenAI-compatible"
}`,
  },
};

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export interface UnboxedIntelligenceFlowProps {
  activeModality: FlowModalityId;
  onSelectModality: (m: FlowModalityId) => void;
  dispatchedPrompt: string | null;
  dispatchNonce: number;
  routeBase?: string;
}

export function UnboxedIntelligenceFlow({
  activeModality,
  onSelectModality,
  dispatchedPrompt,
  dispatchNonce,
  routeBase = "",
}: UnboxedIntelligenceFlowProps) {
  const [autoCycle, setAutoCycle] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [ditherPct, setDitherPct] = useState(72);

  const canopyWrapRef = useRef<HTMLDivElement>(null);
  const canopyCanvasRef = useRef<HTMLCanvasElement>(null);
  const ditherWrapRef = useRef<HTMLDivElement>(null);
  const ditherCanvasRef = useRef<HTMLCanvasElement>(null);

  const activeRef = useRef<FlowModalityId>(activeModality);
  const burstRef = useRef(0);

  useEffect(() => {
    activeRef.current = activeModality;
  }, [activeModality]);

  // Trigger a visible downward energy surge through the synaptic canopy whenever a prompt is dispatched
  useEffect(() => {
    if (dispatchNonce > 0) {
      setAutoCycle(false);
      burstRef.current = 1.0;
    }
  }, [dispatchNonce]);

  // Gentle auto-cycle across the 4 live modalities (respects reduced motion & background tabs)
  useEffect(() => {
    if (!autoCycle || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const order: FlowModalityId[] = ["chat", "image", "video", "api"];
    const id = window.setInterval(() => {
      if (document.hidden) return;
      onSelectModality(order[(order.indexOf(activeRef.current) + 1) % order.length]);
    }, 5200);
    return () => window.clearInterval(id);
  }, [autoCycle, onSelectModality]);

  // 1. HiDPI Wall-Free Floating Synaptic Neural Canopy Canvas (Crisp on 390px Mobile & 1440px Desktop!)
  useEffect(() => {
    const wrap = canopyWrapRef.current;
    const canvas = canopyCanvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rafId = 0;
    let t = 0;
    let inView = true;
    let isSkipped = false;
    let cssW = 920;
    let cssH = 310;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      cssW = Math.max(320, Math.round(rect.width));
      cssH = cssW < 560 ? 250 : 300;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.height = `${cssH}px`;
    };

    const draw = () => {
      rafId = 0;
      if (document.hidden || !inView || isSkipped) return;
      if (!reducedMotion) {
        t += 0.016;
        burstRef.current = Math.max(0, burstRef.current - 0.018);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const isCompact = cssW < 560;
      const cx = cssW * 0.5;
      const genviaY = isCompact ? 18 : 22;
      const coreY = isCompact ? 76 : 92;
      const stageY = isCompact ? 142 : 168;
      const runnerY = isCompact ? 212 : 254;
      const spreadX = Math.min(cssW * 0.42, 340);
      const stageSpread = Math.min(cssW * 0.30, 210);
      const cur = activeRef.current;
      const burst = burstRef.current;

      const stages = [
        { x: cx - stageSpread, y: stageY, label: isCompact ? "01 PARSE" : "01 UNDERSTAND" },
        { x: cx, y: stageY, label: isCompact ? "02 ROUTE" : "02 ORCHESTRATE" },
        { x: cx + stageSpread, y: stageY, label: isCompact ? "03 RUN" : "03 EXECUTE" },
      ];
      const runners: { id: FlowModalityId; x: number; y: number; label: string }[] = [
        { id: "chat", x: cx - spreadX, y: runnerY, label: isCompact ? "CHAT" : "GYRA CHAT" },
        { id: "image", x: cx - spreadX * 0.34, y: runnerY, label: isCompact ? "IMAGE" : "GYRA IMAGE" },
        { id: "video", x: cx + spreadX * 0.34, y: runnerY, label: isCompact ? "VIDEO" : "GYRA VIDEO" },
        { id: "api", x: cx + spreadX, y: runnerY, label: isCompact ? "API" : "GYRA API" },
      ];

      // Soft ambient core aura dissolving into pure #000000 (ZERO rectangular edge!)
      const aura = ctx.createRadialGradient(
        cx,
        coreY + 24,
        6,
        cx,
        coreY + 24,
        isCompact ? 175 : 285,
      );
      aura.addColorStop(0, `rgba(31, 91, 124, ${(0.22 + burst * 0.16).toFixed(2)})`);
      aura.addColorStop(0.55, "rgba(12, 32, 48, 0.08)");
      aura.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, cssW, cssH);

      // Top incoming tether connecting downward from the Live Prompt Bar -> Genvia -> Gyra Core
      ctx.strokeStyle = `rgba(91, 158, 194, ${(0.42 + burst * 0.4).toFixed(2)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, genviaY + 10);
      ctx.lineTo(cx, coreY - (isCompact ? 20 : 25));
      ctx.stroke();

      // Core -> 3 Stage curves
      for (const s of stages) {
        ctx.strokeStyle = `rgba(91, 158, 194, ${(0.3 + burst * 0.3).toFixed(2)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, coreY + (isCompact ? 20 : 25));
        ctx.quadraticCurveTo((cx + s.x) * 0.5, coreY + (isCompact ? 42 : 50), s.x, s.y - 13);
        ctx.stroke();
      }

      // Stages -> 4 Runners neural mesh
      for (const r of runners) {
        const isAct = r.id === cur;
        for (const s of stages) {
          ctx.strokeStyle = isAct
            ? `rgba(91, 158, 194, ${(0.46 + burst * 0.35).toFixed(2)})`
            : "rgba(255, 255, 255, 0.07)";
          ctx.lineWidth = isAct ? 1.45 : 0.8;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y + 13);
          ctx.quadraticCurveTo((s.x + r.x) * 0.5, s.y + (isCompact ? 40 : 52), r.x, r.y - 18);
          ctx.stroke();
        }

        // Luminous traveling signal along active branch
        if (isAct && !reducedMotion) {
          for (let k = 0; k < 2; k++) {
            const p = (t * 0.68 + k * 0.5) % 1;
            const s = stages[1];
            const midX = (s.x + r.x) * 0.5;
            const midY = s.y + (isCompact ? 40 : 52);
            const u = 1 - p;
            const px = u * u * s.x + 2 * u * p * midX + p * p * r.x;
            const py = u * u * (s.y + 13) + 2 * u * p * midY + p * p * (r.y - 18);
            const pg = ctx.createRadialGradient(px, py, 0, px, py, 11);
            pg.addColorStop(0, "#FFFFFF");
            pg.addColorStop(0.45, "#5B9EC2");
            pg.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = pg;
            ctx.beginPath();
            ctx.arc(px, py, 11, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Runner orb
        const rRad = isAct ? (isCompact ? 17 : 20) : isCompact ? 13 : 16;
        ctx.fillStyle = isAct ? "#1F5B7C" : "#05080D";
        ctx.strokeStyle = isAct ? "#9CC4DC" : "rgba(255,255,255,0.18)";
        ctx.lineWidth = isAct ? 1.8 : 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, rRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isAct ? "#FFFFFF" : "#7D91A3";
        ctx.font = `600 ${isCompact ? 8.5 : 9.5}px "JetBrains Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(r.label, r.x, r.y + rRad + 14);
      }

      // 3 Stage Nodes
      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        const pulse = reducedMotion ? 0.6 : 0.5 + 0.5 * Math.sin(t * 2.4 - i * 1.1);
        ctx.fillStyle = "#04080E";
        ctx.strokeStyle = `rgba(120, 180, 214, ${(0.32 + pulse * 0.42 + burst * 0.2).toFixed(2)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, isCompact ? 11 : 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#9CC4DC";
        ctx.font = `500 ${isCompact ? 8 : 9}px "JetBrains Mono", monospace`;
        ctx.textAlign = "center";
        ctx.fillText(s.label, s.x, s.y + (isCompact ? 22 : 25));
      }

      // Central Gyra Core Orb
      const coreR = isCompact ? 21 : 26;
      ctx.fillStyle = "#040A12";
      ctx.strokeStyle = burst > 0.2 ? "#FFFFFF" : "#78B0CE";
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.arc(cx, coreY, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${isCompact ? 9.5 : 11}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText("GYRA", cx, coreY + 3.5);

      // Top Genvia Crest label
      ctx.fillStyle = "#7D93A6";
      ctx.font = `500 ${isCompact ? 8.5 : 9.5}px "JetBrains Mono", monospace`;
      ctx.fillText("GENVIA", cx, genviaY);

      if (!reducedMotion) rafId = window.requestAnimationFrame(draw);
    };

    const start = () => {
      if (rafId || document.hidden || !inView || isSkipped) return;
      rafId = window.requestAnimationFrame(draw);
    };
    const stop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    resize();
    start();

    const ro = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw();
    });
    ro.observe(wrap);

    const io = new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting);
      if (inView) start();
      else stop();
    });
    io.observe(wrap);

    const onVis = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVis);

    const onCv = (event: Event) => {
      isSkipped = Boolean((event as Event & { skipped?: boolean }).skipped);
      if (isSkipped) stop();
      else start();
    };
    wrap.addEventListener("contentvisibilityautostatechange", onCv);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("contentvisibilityautostatechange", onCv);
    };
  }, []);

  // 2. Live Bayer 4x4 Ordered-Dither Pixel Frontier on the Open Result Output
  useEffect(() => {
    const canvas = ditherCanvasRef.current;
    const wrap = ditherWrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rafId = 0;
    let phase = 0;
    let last = performance.now();
    let inView = true;

    const draw = (now: number) => {
      rafId = 0;
      if (document.hidden || !inView) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reducedMotion && autoCycle) phase = (phase + dt * 0.24) % 1;

      const r = wrap.getBoundingClientRect();
      const w = Math.max(220, Math.round(r.width));
      const h = Math.max(180, Math.round(r.height));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);
      const sweep = reducedMotion ? 0.72 : 0.16 + 0.72 * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2));
      setDitherPct(Math.round(sweep * 100));

      const cell = 5;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      ctx.fillStyle = "rgba(91, 158, 194, 0.80)";
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const dist = col / cols - sweep;
          if (dist > -0.08 && dist < 0.20) {
            const norm = 1 - Math.abs(dist - 0.05) / 0.16;
            const threshold = (BAYER_4X4[row & 3][col & 3] + 0.5) / 16;
            if (norm > threshold * 1.15) {
              ctx.globalAlpha = Math.min(0.85, norm);
              ctx.fillRect(col * cell, row * cell, 2.0, 2.0);
            }
          }
        }
      }
      ctx.globalAlpha = 1;

      if (!reducedMotion) rafId = window.requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting);
      if (inView && !rafId) {
        last = performance.now();
        rafId = window.requestAnimationFrame(draw);
      }
    });
    io.observe(wrap);
    rafId = window.requestAnimationFrame(draw);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      io.disconnect();
    };
  }, [autoCycle, activeModality]);

  const spec = FLOW_MODALITIES[activeModality];
  const shownPrompt = dispatchedPrompt ?? spec.defaultPrompt;

  const handleCopyCode = async () => {
    if (!spec.code) return;
    try {
      await navigator.clipboard.writeText(spec.code);
    } catch {
      // ignore
    }
    setCopiedCode(true);
    window.setTimeout(() => setCopiedCode(false), 1600);
  };

  return (
    <div className="mx-auto max-w-[1160px] px-5 sm:px-8">
      {/* 1. UNBOXED FLOATING SYNAPTIC CANOPY (ZERO RECTANGULAR BOX WALLS + SOFT-EDGE DISSOLVE) */}
      <div
        ref={canopyWrapRef}
        className="gyra-mask-void relative mx-auto w-full max-w-[940px] overflow-hidden"
      >
        <canvas
          ref={canopyCanvasRef}
          aria-label="Live unboxed Gyra Synaptic Intelligence Flow routing prompts across Chat, Image, Video, and API"
          className="block w-full"
        />
      </div>

      {/* 2. WALL-FREE HAIRLINE MODALITY TAB BAR (Clean 4-Col Single Row on Mobile & Desktop!) */}
      <div className="mt-3 flex flex-col gap-3 border-b border-white/10 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Inspect Gyra live modality"
          className="grid grid-cols-4 gap-1 sm:flex sm:items-center sm:gap-2"
        >
          {(["chat", "image", "video", "api"] as const).map((m) => {
            const act = m === activeModality;
            return (
              <button
                key={m}
                id={`gyra-flow-tab-${m}`}
                type="button"
                role="tab"
                aria-selected={act}
                aria-controls="gyra-flow-tabpanel"
                onClick={() => {
                  setAutoCycle(false);
                  onSelectModality(m);
                }}
                className={`font-mono-tech min-h-[36px] px-2 text-center text-[10.5px] tracking-[0.1em] uppercase transition-colors cursor-pointer sm:px-3.5 sm:text-[11px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2] ${
                  act
                    ? "border-b-2 border-[#5B9EC2] font-medium text-white"
                    : "text-[#7A8E9F] hover:text-white"
                }`}
              >
                <span className="sm:hidden">{FLOW_MODALITIES[m].shortLabel}</span>
                <span className="hidden sm:inline">{FLOW_MODALITIES[m].label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span className="font-mono-tech text-[10px] tracking-[0.1em] text-[#34D399] uppercase">
            {spec.metric}
          </span>
          <button
            type="button"
            onClick={() => setAutoCycle((v) => !v)}
            aria-pressed={autoCycle}
            className="font-mono-tech inline-flex min-h-[30px] items-center gap-1.5 text-[10px] tracking-[0.1em] text-[#8EA2B5] uppercase hover:text-white cursor-pointer"
          >
            {autoCycle ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            <span>{autoCycle ? "Live Auto" : "Paused"}</span>
          </button>
        </div>
      </div>

      {/* 3. OPEN-CANVAS 2-COLUMN LIVE EXECUTION OUTPUT (Single 1px Divider — Zero Outer Box, Zero Skeletons!) */}
      <div
        id="gyra-flow-tabpanel"
        role="tabpanel"
        aria-labelledby={`gyra-flow-tab-${activeModality}`}
        className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-0 lg:divide-x lg:divide-white/10"
      >
        {/* Left 5 cols: Prompt + 3-Stage Verified Execution Trace */}
        <div className="flex flex-col justify-between lg:col-span-5 lg:pr-8">
          <div>
            <div className="flex items-center justify-between font-mono-tech text-[10px] tracking-[0.12em] uppercase">
              <span className="text-[#5B9EC2]">{spec.route}</span>
              <span className="text-[#6F8395]">DITHER {ditherPct}%</span>
            </div>
            <p className="mt-2.5 text-[15px] leading-[1.55] text-white">&ldquo;{shownPrompt}&rdquo;</p>

            <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-4 font-mono-tech text-[11px] leading-[1.55] text-[#9BB0C2]">
              {spec.trace.map((step) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="text-[#34D399]" aria-hidden="true">
                    ✓
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-3.5 font-mono-tech text-[10.5px] uppercase">
            <a href={spec.sectionHref} className="text-[#8DA2B5] transition-colors hover:text-white">
              Deep Dive ↓
            </a>
            <a
              href={resolveGyraRoute(spec.appHref, routeBase)}
              className="inline-flex items-center gap-1 text-white transition-colors hover:text-[#5B9EC2]"
            >
              <span>{spec.appLabel}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Right 7 cols: Instant Live Visual / Code / Video Output + Subtle Bayer Dither Frontier */}
        <div className="flex flex-col justify-center lg:col-span-7 lg:pl-8">
          <div ref={ditherWrapRef} className="relative overflow-hidden">
          {activeModality === "image" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="relative aspect-[16/10] overflow-hidden">
                <picture className="block h-full w-full">
                  <source srcSet="/showcase/edit-before.webp" type="image/webp" />
                  <img
                    src="/showcase/edit-before.jpg"
                    alt="Original daylight architectural studio"
                    width={1200}
                    height={896}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </picture>
                <span className="font-mono-tech absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 text-[9px] text-white uppercase">
                  Original · Daylight
                </span>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden">
                <picture className="block h-full w-full">
                  <source srcSet="/showcase/edit-after.webp" type="image/webp" />
                  <img
                    src="/showcase/edit-after.jpg"
                    alt="Gyra Pro Ultra 2700K tungsten dusk edit"
                    width={1200}
                    height={896}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </picture>
                <span className="font-mono-tech absolute bottom-2 left-2 bg-[#1F5B7C] px-2 py-0.5 text-[9px] text-white uppercase">
                  Pro Ultra · 2700K Dusk
                </span>
              </div>
            </div>
          ) : activeModality === "video" ? (
            <div className="relative aspect-video overflow-hidden bg-black">
              <video
                src="/products-hero-bg.mp4"
                poster="/video-samples/headset-f001.webp"
                width={1280}
                height={720}
                preload="metadata"
                autoPlay
                muted
                loop
                playsInline
                aria-label="Obsidian studio headphones 720p LTX-Video render"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <div className="font-mono-tech absolute inset-x-3 bottom-2.5 flex items-center justify-between text-[9.5px] uppercase">
                <span className="text-white">Obsidian Headset · F001 Locked</span>
                <span className="text-[#34D399]">720P · 24 FPS</span>
              </div>
            </div>
          ) : (
            <div className="relative bg-white/[0.025] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between font-mono-tech text-[10px] uppercase">
                <span className="text-[#8DA2B5]">
                  {activeModality === "chat"
                    ? "Verified Output · SuperGyra 2.0"
                    : "Response Payload · 200 OK"}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 text-[#9CC4DC] hover:text-white cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-3 w-3 text-[#34D399]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre
                tabIndex={0}
                role="region"
                aria-label={`${spec.label} live code output`}
                className="overflow-x-auto font-mono-tech text-[11.5px] leading-[1.7] text-[#DCE8F4] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2]"
              >
                <code>{spec.code}</code>
              </pre>
            </div>
          )}

          {/* Subtle Live Bayer Ordered-Dither Pixel Frontier Overlay */}
          <canvas
            ref={ditherCanvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen"
          />
          </div>
        </div>
      </div>
    </div>
  );
}
