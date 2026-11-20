"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import type { ModalityTarget } from "./HeroStudioPrimitives";

export type UnboxedFlowId = "synaptic-void" | "open-workbench" | "floating-3d";

interface ModalityData {
  id: ModalityTarget;
  label: string;
  sub: string;
  route: string;
  metric: string;
  prompt: string;
  trace: string[];
  code: string;
}

const MODALITIES: Record<ModalityTarget, ModalityData> = {
  chat: {
    id: "chat",
    label: "Gyra Chat",
    sub: "6-Agent Core",
    route: "POST /api/v1/chat",
    metric: "14ms TTFT · 118 tok/s",
    prompt: "Write a constant-time HMAC Next.js webhook handler with per-IP rate limiting.",
    trace: [
      "01 Understand · Classified HMAC timingSafeEqual & 300s skew check",
      "02 Orchestrate · Scheduled Atlas -> Forge -> Sentinel QA pipeline",
      "03 Execute · Streamed verified TypeScript route over HTTP/2 SSE",
    ],
    code: `const ok = timingSafeEqual(sigBuf, expBuf);
if (!ok || skew > 300_000) return Response.json({ err: 401 }, { status: 401 });
return Response.json({ verified: true, engine: "SuperGyra 2.0" });`,
  },
  image: {
    id: "image",
    label: "Gyra Image",
    sub: "Pro Ultra I2I",
    route: "POST /api/fal/proxy",
    metric: "SSIM 0.994 · 2.1s",
    prompt: "Relight interior studio scene to blue-hour dusk with warm 2700K lamp bounce.",
    trace: [
      "01 Understand · Extracted 16-bit surface geometry & camera frustum",
      "02 Orchestrate · Locked structural layout via Pro Ultra I2I graph",
      "03 Execute · Synthesized 2700K tungsten bounce on architectural trim",
    ],
    code: "",
  },
  video: {
    id: "video",
    label: "Gyra Video",
    sub: "LTX-Video 13B",
    route: "POST /api/v1/video/generate",
    metric: "720p · 24 fps · 121f",
    prompt: "Direct 16:9 macro rim-light orbit around obsidian studio headphones at 24 fps.",
    trace: [
      "01 Understand · Anchored Frame 001 obsidian rim-lit studio headset",
      "02 Orchestrate · Queued 121-frame smooth dolly trajectory on LTX-13B",
      "03 Execute · Finalized H.264 stream with zero temporal flicker",
    ],
    code: "",
  },
  api: {
    id: "api",
    label: "Gyra API",
    sub: "OpenAI-Compat v1",
    route: "https://gyra.ng/api/v1/*",
    metric: "11ms Edge · 99.9% SLA",
    prompt: "POST /api/v1/chat -> gyra-super2.0 SSE stream with scoped Bearer auth.",
    trace: [
      "01 Understand · Verified category-scoped Bearer token & wallet balance",
      "02 Orchestrate · Routed via anycast edge hub (LOS-01 / LHR-01)",
      "03 Execute · Opened live SSE token stream + @GyraAi delivery",
    ],
    code: `{
  "id": "chatcmpl-gyra-9a2f",
  "model": "gyra-super2.0",
  "edge": "LOS-01",
  "status": "200 OK · OpenAI-compatible"
}`,
  },
};

export interface UnboxedFlowProps {
  variant: UnboxedFlowId;
  activeModality: ModalityTarget;
  onSelectModality: (m: ModalityTarget) => void;
  dispatchedPrompt: string | null;
}

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function UnboxedFlowSamples({
  variant,
  activeModality,
  onSelectModality,
  dispatchedPrompt,
}: UnboxedFlowProps) {
  const [autoCycle, setAutoCycle] = useState(true);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [ditherSweep, setDitherSweep] = useState(66);

  const synapticCanvasRef = useRef<HTMLCanvasElement>(null);
  const ditherCanvasRef = useRef<HTMLCanvasElement>(null);
  const ditherWrapRef = useRef<HTMLDivElement>(null);

  const activeRef = useRef<ModalityTarget>(activeModality);
  useEffect(() => {
    activeRef.current = activeModality;
  }, [activeModality]);

  // Pause auto-cycle if user dispatches a custom prompt
  useEffect(() => {
    if (dispatchedPrompt) setAutoCycle(false);
  }, [dispatchedPrompt]);

  // Gentle auto-cycle across the 4 modalities
  useEffect(() => {
    if (!autoCycle || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const order: ModalityTarget[] = ["chat", "image", "video", "api"];
    const id = window.setInterval(() => {
      if (document.hidden) return;
      onSelectModality(order[(order.indexOf(activeRef.current) + 1) % order.length]);
    }, 4600);
    return () => window.clearInterval(id);
  }, [autoCycle, onSelectModality]);

  // VARIANT 1 CANVAS: Pure-Void Floating Synaptic Canopy (ZERO Box Borders, Responsive Mobile + Desktop)
  useEffect(() => {
    if (variant !== "synaptic-void") return;
    const canvas = synapticCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const W = 900;
    const H = 340;
    canvas.width = W;
    canvas.height = H;

    const stages = [
      { x: 260, y: 175, label: "01 UNDERSTAND" },
      { x: 450, y: 175, label: "02 ORCHESTRATE" },
      { x: 640, y: 175, label: "03 EXECUTE" },
    ];
    const runners: { id: ModalityTarget; x: number; y: number; label: string }[] = [
      { id: "chat", x: 155, y: 286, label: "GYRA CHAT" },
      { id: "image", x: 350, y: 286, label: "GYRA IMAGE" },
      { id: "video", x: 550, y: 286, label: "GYRA VIDEO" },
      { id: "api", x: 745, y: 286, label: "GYRA API" },
    ];

    let rafId = 0;
    let t = 0;
    let inView = true;

    const draw = () => {
      rafId = 0;
      if (document.hidden || !inView) return;
      if (!reducedMotion) t += 0.016;
      ctx.clearRect(0, 0, W, H);

      const cx = W * 0.5;
      const genviaY = 26;
      const coreY = 98;
      const cur = activeRef.current;

      // Subtle radial core aura melting into pure #000000
      const aura = ctx.createRadialGradient(cx, coreY + 25, 10, cx, coreY + 25, 290);
      aura.addColorStop(0, "rgba(31, 91, 124, 0.22)");
      aura.addColorStop(0.55, "rgba(12, 32, 48, 0.08)");
      aura.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, W, H);

      // Tether from top Genvia -> Gyra Core
      ctx.strokeStyle = "rgba(91, 158, 194, 0.45)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, genviaY + 12);
      ctx.lineTo(cx, coreY - 26);
      ctx.stroke();

      // Core -> 3 Stages curves
      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        ctx.strokeStyle = "rgba(91, 158, 194, 0.34)";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(cx, coreY + 26);
        ctx.quadraticCurveTo((cx + s.x) * 0.5, coreY + 52, s.x, s.y - 16);
        ctx.stroke();
      }

      // Stages -> 4 Runners organic neural conduits
      for (const r of runners) {
        const isAct = r.id === cur;
        for (const s of stages) {
          ctx.strokeStyle = isAct ? "rgba(91, 158, 194, 0.48)" : "rgba(255, 255, 255, 0.07)";
          ctx.lineWidth = isAct ? 1.5 : 0.85;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y + 16);
          ctx.quadraticCurveTo((s.x + r.x) * 0.5, s.y + 58, r.x, r.y - 22);
          ctx.stroke();
        }

        // Animated plasma pulse on active runner's primary path
        if (isAct && !reducedMotion) {
          const p = (t * 0.72) % 1;
          const s = stages[1];
          const midX = (s.x + r.x) * 0.5;
          const midY = s.y + 58;
          const u = 1 - p;
          const px = u * u * s.x + 2 * u * p * midX + p * p * r.x;
          const py = u * u * (s.y + 16) + 2 * u * p * midY + p * p * (r.y - 22);
          const pg = ctx.createRadialGradient(px, py, 0, px, py, 13);
          pg.addColorStop(0, "#FFFFFF");
          pg.addColorStop(0.45, "#5B9EC2");
          pg.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.arc(px, py, 13, 0, Math.PI * 2);
          ctx.fill();
        }

        // Runner node orb (floating naked on black!)
        ctx.fillStyle = isAct ? "#1F5B7C" : "#05080D";
        ctx.strokeStyle = isAct ? "#9CC4DC" : "rgba(255,255,255,0.18)";
        ctx.lineWidth = isAct ? 1.8 : 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, isAct ? 22 : 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isAct ? "#FFFFFF" : "#7C90A3";
        ctx.font = '600 9.5px "JetBrains Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(r.label, r.x, r.y + 36);
      }

      // Draw 3 Stage Nodes
      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        const pulse = reducedMotion ? 0.6 : 0.5 + 0.5 * Math.sin(t * 2.5 - i * 1.1);
        ctx.fillStyle = "#04080E";
        ctx.strokeStyle = `rgba(120, 180, 214, ${(0.35 + pulse * 0.45).toFixed(2)})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#9CC4DC";
        ctx.font = '500 9px "JetBrains Mono", monospace';
        ctx.textAlign = "center";
        ctx.fillText(s.label, s.x, s.y + 29);
      }

      // Central Gyra Core Orb
      ctx.fillStyle = "#040A12";
      ctx.strokeStyle = "#78B0CE";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, coreY, 27, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText("GYRA", cx, coreY + 4);

      // Top Genvia Crest
      ctx.fillStyle = "#7E94A8";
      ctx.font = '500 9.5px "JetBrains Mono", monospace';
      ctx.fillText("GENVIA", cx, genviaY);

      if (!reducedMotion) rafId = window.requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting);
      if (inView && !rafId) rafId = window.requestAnimationFrame(draw);
    });
    io.observe(canvas);
    rafId = window.requestAnimationFrame(draw);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      io.disconnect();
    };
  }, [variant]);

  // VARIANT 2 CANVAS: Open-Canvas Bayer Dither Frontier (Zero Outer Box!)
  useEffect(() => {
    if (variant !== "open-workbench") return;
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
      if (!reducedMotion && autoCycle) phase = (phase + dt * 0.25) % 1;

      const r = wrap.getBoundingClientRect();
      const w = Math.max(240, Math.round(r.width));
      const h = Math.max(200, Math.round(r.height));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);
      const sweep = reducedMotion ? 0.65 : 0.16 + 0.72 * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2));
      setDitherSweep(Math.round(sweep * 100));

      const cell = 5;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      ctx.fillStyle = "rgba(91, 158, 194, 0.85)";
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const dist = col / cols - sweep;
          if (dist > -0.1 && dist < 0.22) {
            const norm = 1 - Math.abs(dist - 0.05) / 0.18;
            const threshold = (BAYER_4X4[row & 3][col & 3] + 0.5) / 16;
            if (norm > threshold * 1.12) {
              ctx.globalAlpha = Math.min(0.9, norm);
              ctx.fillRect(col * cell, row * cell, 2.2, 2.2);
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
  }, [variant, autoCycle, activeModality]);

  const data = MODALITIES[activeModality];
  const shownPrompt = dispatchedPrompt ?? data.prompt;

  // Shared wall-free Modality Selector Pills + Pause control
  const ModalityRail = (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
      <div role="tablist" aria-label="Select Gyra modality" className="flex flex-wrap gap-1.5 sm:gap-2">
        {(["chat", "image", "video", "api"] as const).map((m) => {
          const act = m === activeModality;
          return (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={act}
              onClick={() => {
                setAutoCycle(false);
                onSelectModality(m);
              }}
              className={`font-mono-tech min-h-[32px] px-3 text-[10.5px] tracking-[0.1em] uppercase transition-colors cursor-pointer ${
                act
                  ? "border-b-2 border-[#5B9EC2] font-medium text-white"
                  : "text-[#7A8E9F] hover:text-white"
              }`}
            >
              {MODALITIES[m].label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setAutoCycle((v) => !v)}
        className="font-mono-tech inline-flex items-center gap-1.5 text-[10px] tracking-[0.1em] text-[#8EA2B5] uppercase hover:text-white cursor-pointer"
      >
        {autoCycle ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        <span>{autoCycle ? "Live Auto" : "Paused"}</span>
      </button>
    </div>
  );

  // Shared live output renderer (ZERO grey skeleton bars!)
  const LiveResultView = (
    <div>
      {activeModality === "image" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src="/showcase/edit-before.webp"
              alt="Before daylight"
              className="h-full w-full object-cover"
            />
            <span className="font-mono-tech absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 text-[9px] text-white uppercase">
              Original · Daylight
            </span>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden">
            <img
              src="/showcase/edit-after.webp"
              alt="After Pro Ultra 2700K dusk relight"
              className="h-full w-full object-cover"
            />
            <span className="font-mono-tech absolute bottom-2 left-2 bg-[#1F5B7C] px-2 py-0.5 text-[9px] text-white uppercase">
              Pro Ultra · 2700K
            </span>
          </div>
        </div>
      ) : activeModality === "video" ? (
        <div className="relative aspect-video overflow-hidden">
          <video
            src="/products-hero-bg.mp4"
            poster="/video-samples/headset-f001.webp"
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
          <span className="font-mono-tech absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 text-[9.5px] text-[#34D399] uppercase">
            Obsidian Headset · 720p 24fps
          </span>
        </div>
      ) : (
        <pre
          tabIndex={0}
          role="region"
          aria-label={`${data.label} live output`}
          className="overflow-x-auto bg-white/[0.025] p-4 font-mono-tech text-[11.5px] leading-[1.68] text-[#DCE8F4]"
        >
          <code>{data.code}</code>
        </pre>
      )}
    </div>
  );

  // UNBOXED 01: Pure-Void Floating Synaptic Canopy (ZERO Rectangular Box Borders + Soft-Edge Fade)
  if (variant === "synaptic-void") {
    return (
      <div className="mx-auto max-w-[1160px] px-5 pt-2 sm:px-8">
        {/* Naked Floating Canvas — ZERO Box Border + Soft Top/Bottom Dissolve */}
        <div className="gyra-mask-void relative w-full overflow-hidden">
          <canvas
            ref={synapticCanvasRef}
            aria-label="Unboxed Gyra Synaptic Neural Flow floating directly on pitch black"
            className="mx-auto block w-full max-w-[900px]"
          />
        </div>

        {/* Open Hairline Execution Ledger Below — ZERO Outer Card Wall */}
        <div className="mt-4 pt-2">
          {ModalityRail}

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase">
                <span className="text-[#5B9EC2]">{data.route}</span>
                <span className="text-[#34D399]">{data.metric}</span>
              </div>
              <p className="mt-2.5 text-[14.5px] leading-[1.55] text-white">&ldquo;{shownPrompt}&rdquo;</p>
              <ul className="mt-4 space-y-2 border-t border-white/10 pt-3.5 font-mono-tech text-[11px] text-[#8DA2B5]">
                {data.trace.map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <span className="text-[#34D399]">✓</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-7">{LiveResultView}</div>
          </div>
        </div>
      </div>
    );
  }

  // UNBOXED 02: Open-Canvas Split Workbench (Single 1px Divider, ZERO Outer Box!)
  if (variant === "open-workbench") {
    return (
      <div className="mx-auto max-w-[1160px] px-5 pt-4 sm:px-8">
        {ModalityRail}

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-0 lg:divide-x lg:divide-white/10">
          {/* Left: Naked Live Streaming Engineering Trace */}
          <div className="lg:col-span-6 lg:pr-8">
            <div className="flex items-center justify-between font-mono-tech text-[10.5px] uppercase">
              <span className="text-white">{data.route}</span>
              <span className="text-[#34D399]">{data.metric}</span>
            </div>
            <p className="mt-3 text-[15px] leading-[1.55] text-white/90">&ldquo;{shownPrompt}&rdquo;</p>

            <div className="mt-5 space-y-2.5 font-mono-tech text-[11.5px] leading-[1.65]">
              {data.trace.map((line) => (
                <div key={line} className="flex items-start gap-2 text-[#B8C9D8]">
                  <span className="text-[#5B9EC2]">&gt;</span>
                  <span>{line}</span>
                </div>
              ))}
              <div className="pt-1 text-[#6C8093]">
                <span className="gyra-cursor" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-3 font-mono-tech text-[10px] text-[#788D9F] uppercase">
              <span>BAYER DITHER PASS {ditherSweep}%</span>
              <a href="/dashboard" className="inline-flex items-center gap-1 text-white hover:text-[#5B9EC2]">
                Open Workspace <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Right: Unboxed Live Output + Ordered Dither Frontier */}
          <div ref={ditherWrapRef} className="relative overflow-hidden lg:col-span-6 lg:pl-8">
            {LiveResultView}
            <canvas
              ref={ditherCanvasRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen"
            />
          </div>
        </div>
      </div>
    );
  }

  // UNBOXED 03: Floating 3D Isometric Silicon Core (ZERO Box Walls!)
  return (
    <div className="mx-auto max-w-[1160px] px-5 pt-4 sm:px-8">
      {ModalityRail}

      <div className="mt-8 grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
        <div
          onPointerMove={(e) => {
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
            const r = e.currentTarget.getBoundingClientRect();
            setTilt({
              rx: -((e.clientY - r.top) / r.height - 0.5) * 9,
              ry: ((e.clientX - r.left) / r.width - 0.5) * 11,
            });
          }}
          onPointerLeave={() => setTilt({ rx: 0, ry: 0 })}
          style={{ perspective: "1100px" }}
          className="flex justify-center lg:col-span-6"
        >
          <div
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transition: "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="w-full max-w-[520px]"
          >
            <svg viewBox="0 0 640 420" className="h-auto w-full select-none overflow-visible" aria-hidden="true">
              {/* Bottom Runner Plane */}
              <polygon points="320,210 560,305 320,400 80,305" fill="#05080D" stroke="rgba(255,255,255,0.18)" strokeWidth="1.1" />
              <text x="320" y="310" textAnchor="middle" fill="#8FA3B5" fontFamily="JetBrains Mono, monospace" fontSize="10.5" letterSpacing="2">
                {data.label.toUpperCase()} · {data.sub.toUpperCase()}
              </text>

              {/* Middle Luminous Steel-Blue Core Wafer */}
              <polygon points="320,122 560,217 320,312 80,217" fill="#1F5B7C" stroke="#9CC4DC" strokeWidth="1.6" />
              <polygon points="80,217 320,312 320,330 80,235" fill="#133A50" stroke="#5B9EC2" strokeOpacity="0.6" />
              <polygon points="560,217 320,312 320,330 560,235" fill="#0B2331" stroke="#5B9EC2" strokeOpacity="0.4" />
              <text x="320" y="214" textAnchor="middle" fill="#FFFFFF" fontFamily="Barlow Semi Condensed, sans-serif" fontWeight="700" fontSize="18" letterSpacing="3">
                GYRA CORE
              </text>
              <text x="320" y="232" textAnchor="middle" fill="#DCEEFB" fontFamily="JetBrains Mono, monospace" fontSize="9.5" letterSpacing="1.8">
                UNDERSTAND · ORCHESTRATE · EXECUTE
              </text>

              {/* Top Genvia Plane */}
              <polygon points="320,34 560,129 320,224 80,129" fill="rgba(5,9,14,0.84)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.1" />
              <text x="320" y="133" textAnchor="middle" fill="#FFFFFF" fontFamily="JetBrains Mono, monospace" fontSize="11" letterSpacing="2.4">
                GENVIA AI · GOVERNANCE
              </text>
            </svg>
          </div>
        </div>

        <div className="lg:col-span-6">
          <p className="font-mono-tech text-[10.5px] tracking-[0.14em] text-[#5B9EC2] uppercase">
            {data.route} · {data.metric}
          </p>
          <p className="mt-2.5 text-[15px] leading-[1.55] text-white">&ldquo;{shownPrompt}&rdquo;</p>
          <div className="mt-5">{LiveResultView}</div>
        </div>
      </div>
    </div>
  );
}
