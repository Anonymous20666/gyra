"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Send, Terminal } from "lucide-react";
import type { LabPalette } from "./labTheme";

type WorkbenchMode = "chat" | "image" | "video" | "api";

interface ModeScript {
  id: WorkbenchMode;
  tab: string;
  host: string;
  region: string;
  statusNote: string;
  lines: { prefix: string; text: string; tone?: "dim" | "ok" | "accent" | "code" }[];
}

const MODE_SCRIPTS: Record<WorkbenchMode, ModeScript> = {
  chat: {
    id: "chat",
    tab: "CHAT · 6-AGENT",
    host: "gyra-core-7f2a",
    region: "los-01",
    statusNote: "SUPERGYRA 2.0 · 6-AGENT VERIFIED",
    lines: [
      { prefix: "$", text: "gyra run --model supergyra-2.0 --agents 6", tone: "dim" },
      { prefix: "✓", text: "atlas: analyzed HMAC timingSafeEqual & 300s skew guard", tone: "ok" },
      { prefix: "✓", text: "architect: designed raw-buffer verifier + token bucket", tone: "ok" },
      { prefix: "forge>", text: "write app/api/webhook/route.ts +84 lines", tone: "accent" },
      { prefix: "sentinel>", text: "audit: constant-time compare PASS · replay check PASS", tone: "ok" },
      { prefix: "mentor>", text: "POST /api/webhook -> 200 OK (14ms) · ready to deploy", tone: "code" },
    ],
  },
  image: {
    id: "image",
    tab: "IMAGE · PRO ULTRA",
    host: "gyra-i2i-9c1e",
    region: "lhr-01",
    statusNote: "GEOMETRY-LOCKED I2I · 1440×1080",
    lines: [
      { prefix: "$", text: "gyra image edit --engine pro-ultra --lock-geometry", tone: "dim" },
      { prefix: "✓", text: "proxy: authenticated via hardened /api/fal/proxy", tone: "ok" },
      { prefix: "depth>", text: "extracted 16-bit surface normals & camera frustum", tone: "accent" },
      { prefix: "relight>", text: "shifting window sky -> blue-hour dusk (5200K -> 2700K)", tone: "accent" },
      { prefix: "specular>", text: "synthesizing warm desk-lamp bounce on architectural trim", tone: "code" },
      { prefix: "✓", text: "SSIM structural fidelity 0.994 · render complete (2.1s)", tone: "ok" },
    ],
  },
  video: {
    id: "video",
    tab: "VIDEO · LTX-13B",
    host: "gyra-studio-4d8b",
    region: "jfk-01",
    statusNote: "LTX-VIDEO 13B · 720P · 24 FPS",
    lines: [
      { prefix: "$", text: "gyra video queue --model ltx-13b --aspect 16:9 --frames 121", tone: "dim" },
      { prefix: "✓", text: "anchor: locked Frame 001 obsidian headset rim-light", tone: "ok" },
      { prefix: "motion>", text: "trajectory: slow 18° macro dolly with steel-blue rim", tone: "accent" },
      { prefix: "diffuse>", text: "temporal consistency pass · 24 fps · 0 flicker spikes", tone: "code" },
      { prefix: "encode>", text: "H.264 high profile · faststart moov atom finalized", tone: "code" },
      { prefix: "✓", text: "stream ready -> /studio/renders/obs-headset-720p.mp4", tone: "ok" },
    ],
  },
  api: {
    id: "api",
    tab: "API · V1 MESH",
    host: "api.gyra.ng/v1",
    region: "global-anycast",
    statusNote: "OPENAI-COMPATIBLE · SCOPED BEARER",
    lines: [
      { prefix: "$", text: "curl -X POST https://gyra.ng/api/v1/chat -H 'Bearer $GYRA_KEY'", tone: "dim" },
      { prefix: "✓", text: "auth: category scope [chat, video, media] verified", tone: "ok" },
      { prefix: "router>", text: "anycast edge LOS-01 -> 14ms TTFT · SSE open", tone: "accent" },
      { prefix: "wallet>", text: "credit ledger pre-check ok · zero double-spend lock", tone: "code" },
      { prefix: "stream>", text: "data: {\"model\":\"gyra-super2.0\",\"delta\":{\"content\":\"...\"}}", tone: "code" },
      { prefix: "✓", text: "HTTP/2 200 OK · 118 tok/s · finish_reason: stop", tone: "ok" },
    ],
  },
};

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function FlowSampleWorkbench({ palette }: { palette: LabPalette }) {
  const [mode, setMode] = useState<WorkbenchMode>("chat");
  const [paused, setPaused] = useState(false);
  const [visibleLineCount, setVisibleLineCount] = useState(6);
  const [uptimeSec, setUptimeSec] = useState(16634); // 04:37:14 style live clock
  const [customPrompt, setCustomPrompt] = useState("");
  const [customBanner, setCustomBanner] = useState<string | null>(null);
  const [wipePct, setWipePct] = useState(100);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const script = MODE_SCRIPTS[mode];

  // Live uptime ticker
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setUptimeSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [paused]);

  // Step through terminal lines cleanly on mode switch or replay (never empty skeleton!)
  useEffect(() => {
    if (paused) return;
    if (visibleLineCount >= script.lines.length) return;
    const t = window.setTimeout(() => {
      setVisibleLineCount((n) => Math.min(script.lines.length, n + 1));
    }, 340);
    return () => window.clearTimeout(t);
  }, [visibleLineCount, script.lines.length, paused]);

  // Real-time Bayer 4x4 Ordered-Dither Pixel Wipe Canvas (like E2B hero right pane, tailored to Gyra!)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
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
      if (!paused && !reducedMotion) {
        phase = (phase + dt * 0.28) % 1;
      }

      const rect = container.getBoundingClientRect();
      const w = Math.max(260, Math.round(rect.width));
      const h = Math.max(220, Math.round(rect.height));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      // Smooth ping-pong dither wave frontier across the visual stage
      const sweep = reducedMotion ? 0.68 : 0.14 + 0.78 * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2));
      setWipePct(Math.round(sweep * 100));

      const cell = 5;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      const bandWidth = 0.24;

      ctx.fillStyle = `rgba(${palette.brightRgb}, 0.85)`;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const nx = c / cols;
          const dist = nx - sweep;
          // Ordered Bayer dither strictly in the transition wave band
          if (dist > -bandWidth * 0.45 && dist < bandWidth) {
            const norm = 1 - Math.abs(dist - bandWidth * 0.22) / (bandWidth * 0.78);
            const threshold = (BAYER_4X4[r & 3][c & 3] + 0.5) / 16;
            if (norm > threshold * 1.12) {
              const size = norm > 0.7 ? 2.6 : 1.8;
              ctx.globalAlpha = Math.min(0.92, norm * 0.95);
              ctx.fillRect(c * cell, r * cell, size, size);
            }
          }
        }
      }
      ctx.globalAlpha = 1;

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(draw);
      }
    };

    const io = new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting);
      if (inView && !rafId) {
        last = performance.now();
        rafId = window.requestAnimationFrame(draw);
      }
    });
    io.observe(container);
    rafId = window.requestAnimationFrame(draw);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      io.disconnect();
    };
  }, [paused, palette.brightRgb, mode]);

  const switchMode = (next: WorkbenchMode) => {
    setMode(next);
    setVisibleLineCount(2);
    setCustomBanner(null);
  };

  const handleInject = (e: React.FormEvent) => {
    e.preventDefault();
    const val = customPrompt.trim();
    if (!val) return;
    const lower = val.toLowerCase();
    const routed: WorkbenchMode =
      lower.includes("video") || lower.includes("motion") || lower.includes("720p")
        ? "video"
        : lower.includes("image") || lower.includes("photo") || lower.includes("relight")
          ? "image"
          : lower.includes("api") || lower.includes("curl") || lower.includes("endpoint")
            ? "api"
            : "chat";
    setMode(routed);
    setVisibleLineCount(1);
    setCustomBanner(`Injected prompt -> routed to ${MODE_SCRIPTS[routed].tab}: "${val}"`);
    setCustomPrompt("");
  };

  const hrs = String(Math.floor(uptimeSec / 3600) % 24).padStart(2, "0");
  const mins = String(Math.floor((uptimeSec % 3600) / 60)).padStart(2, "0");
  const secs = String(uptimeSec % 60).padStart(2, "0");

  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
      {/* Left 5 cols: E2B-caliber Split-Weight Editorial Hero Copy */}
      <div className="lg:col-span-5">
        <p
          className="font-mono-tech text-[11px] tracking-[0.16em] uppercase"
          style={{ color: palette.bright }}
        >
          [ THE UNIFIED AI CLOUD ]
        </p>
        <h2 className="font-display mt-4 text-[clamp(2.85rem,4.8vw,4.5rem)] leading-[0.92] tracking-[-0.02em] text-white uppercase">
          <span className="font-light text-white/75">One intelligence.</span>
          <br />
          <span className="font-bold text-white">Every medium.</span>
        </h2>
        <p className="mt-5 max-w-[44ch] text-[15.5px] leading-[1.6] text-[#9AA6B2]">
          Gyra runs your reasoning agents, geometry-locked image edits, 720p video renders, and
          OpenAI-compatible APIs on one engineered core.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <a
            href="/dashboard"
            style={{ backgroundColor: palette.solid }}
            className="gyra-dither-btn font-mono-tech inline-flex min-h-[44px] items-center justify-center px-6 text-[12px] font-medium tracking-[0.1em] text-white uppercase transition-colors hover:brightness-115"
          >
            Start Building
          </a>
          <a
            href="/api"
            className="font-mono-tech inline-flex min-h-[44px] items-center justify-center border border-white/20 bg-black px-6 text-[12px] tracking-[0.1em] text-white uppercase transition-colors hover:border-white"
          >
            Explore API
          </a>
        </div>

        {/* Live Custom Prompt Injector */}
        <form onSubmit={handleInject} className="mt-6 flex items-center border-b border-white/15 pb-2 focus-within:border-white/50">
          <Terminal className="mr-2.5 h-3.5 w-3.5 shrink-0 text-[#6F8293]" />
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Try: 'relight scene', 'queue 720p video', 'build webhook'..."
            aria-label="Inject custom prompt into live workbench"
            className="w-full bg-transparent font-mono-tech text-[11.5px] text-white placeholder:text-[#5C6E7E] focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Run prompt"
            className="ml-2 inline-flex items-center gap-1 font-mono-tech text-[10.5px] tracking-[0.08em] uppercase text-[#9CC4DC] hover:text-white cursor-pointer"
          >
            <span>Run</span>
            <Send className="h-3 w-3" />
          </button>
        </form>
      </div>

      {/* Right 7 cols: Live Split-Pane Execution Window (Zero Skeleton Bars, Real Bayer Dither Wipe!) */}
      <div className="lg:col-span-7">
        <div className="border border-white/14 bg-[#030508]">
          {/* Window Chrome */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5 font-mono-tech text-[11px]">
            <div className="flex items-center gap-2 text-[#8EA2B4]">
              <span className="h-2 w-2 rounded-full bg-[#34D399]" />
              <span className="text-white">{script.host}</span>
              <span className="text-[#556677]">@ {script.region}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-pressed={paused}
                aria-label={paused ? "Resume live workbench" : "Pause live workbench"}
                className="inline-flex h-7 items-center gap-1.5 border border-white/12 px-2.5 text-[10px] tracking-[0.08em] text-[#B8C7D4] uppercase hover:border-white/40 hover:text-white cursor-pointer"
              >
                {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                <span>{paused ? "Resume" : "Pause"}</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibleLineCount(1)}
                aria-label="Replay execution trace"
                className="inline-flex h-7 items-center gap-1 border border-white/12 px-2 text-[10px] text-[#9BB0C2] hover:border-white/40 hover:text-white cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
              <span className="border border-white/12 bg-black px-2 py-0.5 text-[10px] text-[#9BB0C2] uppercase">
                {script.region}
              </span>
            </div>
          </div>

          {customBanner && (
            <div
              className="border-b border-white/10 px-4 py-1.5 font-mono-tech text-[10.5px]"
              style={{ backgroundColor: `rgba(${palette.rgb}, 0.22)`, color: palette.soft }}
            >
              {customBanner}
            </div>
          )}

          {/* Split Body: Left Live Terminal + Right Live Visual/Bayer-Dither Output */}
          <div className="grid grid-cols-1 divide-y divide-white/10 md:grid-cols-12 md:divide-x md:divide-y-0">
            {/* Left 6 cols: Live Agent Terminal */}
            <div className="flex min-h-[270px] flex-col justify-between p-4 font-mono-tech text-[11.5px] leading-[1.7] md:col-span-6">
              <div className="space-y-1.5">
                {script.lines.slice(0, visibleLineCount).map((line, i) => (
                  <div key={`${script.id}-${i}`} className="flex gap-2">
                    <span
                      className="shrink-0 select-none"
                      style={{
                        color:
                          line.tone === "ok"
                            ? "#34D399"
                            : line.tone === "accent"
                              ? palette.bright
                              : "#64748B",
                      }}
                    >
                      {line.prefix}
                    </span>
                    <span
                      className={
                        line.tone === "dim"
                          ? "text-[#8A99A8]"
                          : line.tone === "code"
                            ? "text-white"
                            : "text-[#D4E2EE]"
                      }
                    >
                      {line.text}
                    </span>
                  </div>
                ))}
                {!paused && (
                  <div className="pt-1 text-[#6C8093]">
                    <span className="gyra-cursor" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-2.5 text-[10px] text-[#6B7E8F]">
                <span>DITHER PASS {wipePct}%</span>
                <span style={{ color: palette.soft }}>6/6 CHECKS GREEN</span>
              </div>
            </div>

            {/* Right 6 cols: Real Visual Output + Live Bayer Ordered-Dither Overlay */}
            <div
              ref={containerRef}
              className="relative min-h-[270px] overflow-hidden bg-black md:col-span-6"
            >
              {mode === "chat" && (
                <div className="flex h-full flex-col justify-between p-4 font-mono-tech">
                  <div className="border border-white/10 bg-[#05080D] p-3">
                    <div className="flex items-center justify-between text-[10px] uppercase">
                      <span style={{ color: palette.bright }}>VERIFIED HANDLER</span>
                      <span className="text-[#34D399]">200 OK · 14ms</span>
                    </div>
                    <pre className="mt-2 overflow-x-auto text-[10.5px] leading-[1.6] text-[#DCE8F3]">
                      <code>{`const valid = timingSafeEqual(sig, exp);
if (!valid || skew > 300_000) {
  return Response.json({ err: 401 });
}
return Response.json({ ok: true });`}</code>
                    </pre>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="border border-white/10 py-2">
                      <p className="text-[#788A9B]">SECURITY</p>
                      <p className="mt-0.5 text-[#34D399]">A+ PASS</p>
                    </div>
                    <div className="border border-white/10 py-2">
                      <p className="text-[#788A9B]">LATENCY</p>
                      <p className="mt-0.5 text-white">14.2ms</p>
                    </div>
                    <div className="border border-white/10 py-2">
                      <p className="text-[#788A9B]">TOKENS</p>
                      <p className="mt-0.5 text-white">118 / s</p>
                    </div>
                  </div>
                </div>
              )}

              {mode === "image" && (
                <div className="relative h-full min-h-[270px] w-full">
                  <img
                    src="/showcase/edit-before.webp"
                    alt="Original daylight interior"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - wipePct}% 0 0)` }}
                  >
                    <img
                      src="/showcase/edit-after.webp"
                      alt="Gyra Pro Ultra 2700K dusk relight"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="font-mono-tech absolute bottom-3 left-3 bg-black/85 px-2 py-0.5 text-[9.5px] text-white uppercase">
                    Pro Ultra 2700K Relight · Live Scan
                  </span>
                </div>
              )}

              {mode === "video" && (
                <div className="relative h-full min-h-[270px] w-full">
                  <video
                    src="/products-hero-bg.mp4"
                    poster="/video-samples/headset-f001.webp"
                    autoPlay={!paused}
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <span className="font-mono-tech absolute bottom-3 left-3 bg-black/85 px-2 py-0.5 text-[9.5px] text-[#34D399] uppercase">
                    Obsidian Headset · 720p · 24 FPS
                  </span>
                </div>
              )}

              {mode === "api" && (
                <div className="flex h-full flex-col justify-between p-4 font-mono-tech">
                  <div className="flex items-center justify-between text-[10px] uppercase">
                    <span className="text-[#8DA2B5]">GLOBAL SSE EDGE</span>
                    <span className="text-[#34D399]">99.98% SLA</span>
                  </div>
                  <svg viewBox="0 0 280 110" className="my-2 h-[110px] w-full">
                    <polyline
                      fill="none"
                      stroke={palette.bright}
                      strokeWidth="1.8"
                      points="0,92 28,74 56,80 84,48 112,62 140,34 168,52 196,24 224,40 252,20 280,26"
                    />
                    <circle cx="196" cy="24" r="3.5" fill="#000" stroke="#34D399" strokeWidth="2" />
                  </svg>
                  <div className="space-y-1 border-t border-white/10 pt-2.5 text-[10px] text-[#9BB0C2]">
                    <div className="flex justify-between">
                      <span>LOS-01 Lagos</span>
                      <span className="text-white">14ms · 148k/m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>LHR-01 London</span>
                      <span className="text-white">11ms · 214k/m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>JFK-01 New York</span>
                      <span className="text-white">12ms · 268k/m</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Bayer 4x4 Ordered-Dither Pixel Frontier Overlay */}
              <canvas
                ref={canvasRef}
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen"
              />
            </div>
          </div>

          {/* Bottom Status Strip + 4 Mode Tabs (E2B Architectural Rhythm) */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black px-4 py-2 font-mono-tech text-[10px] tracking-[0.08em] uppercase">
            <span className="text-[#8DA2B5]">{script.statusNote}</span>
            <span className="flex items-center gap-1.5 text-white">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: palette.bright }} />
              UPTIME {hrs}:{mins}:{secs}
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Live workbench modes"
            className="grid grid-cols-2 border-t border-white/10 bg-[#05070B] sm:grid-cols-4"
          >
            {(["chat", "image", "video", "api"] as const).map((m) => {
              const active = m === mode;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchMode(m)}
                  className={`font-mono-tech min-h-[40px] border-r border-white/10 px-2 text-[10.5px] tracking-[0.08em] uppercase transition-colors last:border-r-0 cursor-pointer ${
                    active
                      ? "bg-white/12 font-medium text-white"
                      : "text-[#7A8C9C] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  {MODE_SCRIPTS[m].tab}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
