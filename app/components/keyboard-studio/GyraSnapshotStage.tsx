"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pause, Play, RotateCcw, Sparkles, Sun, Terminal } from "lucide-react";

export type SnapshotSceneId = "genui" | "image" | "video" | "fleet";

export interface GyraSnapshotStageProps {
  /** Controlled active scene */
  scene: SnapshotSceneId;
  onSceneChange: (scene: SnapshotSceneId) => void;
  /** Emitted every time the live prompt typer types a character (drives 3D keyboard keys!) */
  onTypeChar?: (ch: string) => void;
  /** Emitted when typing finishes and prompt fires into the stage (pulses 3D ENTER key!) */
  onEnterDrop?: () => void;
  /** Increment to force a clean replay/dither wipe from external trigger (e.g. clicking 3D ENTER) */
  externalDropNonce?: number;
  /** Optional custom typed prompt injected by user */
  customPrompt?: string | null;
  /** Whether auto-cycle is enabled */
  autoCycle?: boolean;
}

interface SceneMeta {
  id: SnapshotSceneId;
  mobileTab: string;
  desktopTab: string;
  host: string;
  region: string;
  prompt: string;
  bootBadge: string;
}

export const SNAPSHOT_SCENES: SceneMeta[] = [
  {
    id: "genui",
    mobileTab: "GEN UI",
    desktopTab: "CHAT · GEN UI",
    host: "gyra-core-2.0",
    region: "edge-01",
    prompt: "Compare Tokyo vs Lisbon for a 5-day product shoot: weather, cost & golden hour",
    bootBadge: "HOT SNAPSHOT · GYRA GEN UI",
  },
  {
    id: "image",
    mobileTab: "IMAGE",
    desktopTab: "IMAGE · RELIGHT",
    host: "pro-ultra-i2i",
    region: "lhr-01",
    prompt: "Relight concrete loft to warm 2700K dusk — lock every architectural edge",
    bootBadge: "HOT SNAPSHOT · PRO ULTRA I2I",
  },
  {
    id: "video",
    mobileTab: "VIDEO",
    desktopTab: "VIDEO · 720P",
    host: "ltx-studio-13b",
    region: "jfk-01",
    prompt: "Macro 18° rim-light orbit around obsidian studio headset at 24 fps",
    bootBadge: "HOT SNAPSHOT · LTX-VIDEO 13B",
  },
  {
    id: "fleet",
    mobileTab: "FLEET",
    desktopTab: "ASYNC FLEET",
    host: "fleet-6x",
    region: "global",
    prompt: "Run Gen UI research, 2700K relight, 720p render & @GyraAi sync in parallel",
    bootBadge: "HOT SNAPSHOT · 6 PARALLEL WORKERS",
  },
];

// 4x4 Bayer threshold matrix normalized 0..1 for crisp E2B-style hardware dither wipes
const BAYER_4X4 = [
  [0 / 16, 8 / 16, 2 / 16, 10 / 16],
  [12 / 16, 4 / 16, 14 / 16, 6 / 16],
  [3 / 16, 11 / 16, 1 / 16, 9 / 16],
  [15 / 16, 7 / 16, 13 / 16, 5 / 16],
];

function DitherMatrixOverlay({ sweepNonce }: { sweepNonce: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let rafId = 0;
    const start = performance.now();
    const duration = 560; // snappy zero-lag wipe!

    const draw = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.clearRect(0, 0, w, h);

      if (p >= 1) return;

      // Sweeping vertical band of Bayer-dither steel-blue pixels moving left -> right
      const cell = 5;
      const cols = Math.ceil(w / cell);
      const rows = Math.ceil(h / cell);
      const waveCenter = p * 1.35 - 0.15;
      const bandWidth = 0.34;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const nx = c / cols;
          const dist = Math.abs(nx - waveCenter);
          if (dist > bandWidth) continue;
          const intensity = (1 - dist / bandWidth) * (1 - p * 0.45);
          const threshold = BAYER_4X4[r & 3][c & 3];
          if (intensity > threshold) {
            const hot = dist < bandWidth * 0.28;
            ctx.fillStyle = hot ? "rgba(156, 196, 220, 0.85)" : "rgba(31, 91, 124, 0.72)";
            ctx.fillRect(c * cell, r * cell, cell - 1.5, cell - 1.5);
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [sweepNonce]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    />
  );
}

/** Small live animated Bayer dither boot block for the 6th Fleet tile */
function MiniDitherProvisionCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const render = (now: number) => {
      const t = reduced ? 1.2 : now * 0.0022;
      const w = 132;
      const h = 58;
      if (c.width !== w) c.width = w;
      if (c.height !== h) c.height = h;
      ctx.clearRect(0, 0, w, h);

      const step = 6;
      for (let y = 3; y < h - 2; y += step) {
        for (let x = 3; x < w - 2; x += step) {
          const wave = Math.sin(x * 0.07 - t * 2.1) * Math.cos(y * 0.09 + t * 1.4);
          const alpha = 0.16 + Math.max(0, wave) * 0.78;
          ctx.fillStyle = alpha > 0.62 ? `rgba(156, 196, 220, ${alpha.toFixed(2)})` : `rgba(31, 91, 124, ${alpha.toFixed(2)})`;
          ctx.fillRect(x, y, 2.5, 2.5);
        }
      }
      if (!reduced) raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="h-[58px] w-full" />;
}

export function GyraSnapshotStage({
  scene,
  onSceneChange,
  onTypeChar,
  onEnterDrop,
  externalDropNonce = 0,
  customPrompt = null,
  autoCycle = true,
}: GyraSnapshotStageProps) {
  const activeMeta = SNAPSHOT_SCENES.find((s) => s.id === scene) ?? SNAPSHOT_SCENES[0];
  const targetPrompt = customPrompt || activeMeta.prompt;

  const [paused, setPaused] = useState(false);
  const [typedText, setTypedText] = useState(targetPrompt);
  const [isTyping, setIsTyping] = useState(false);
  const [sweepNonce, setSweepNonce] = useState(1);
  const [uptimeSec, setUptimeSec] = useState(16634); // 04:37:14 live clock!
  const [selectedCity, setSelectedCity] = useState<"lisbon" | "tokyo">("lisbon");
  const [planLocked, setPlanLocked] = useState(false);
  const [splitPct, setSplitPct] = useState(52);
  const [videoFrame, setVideoFrame] = useState(42);
  const [replayNonce, setReplayNonce] = useState(0);

  const onTypeCharRef = useRef(onTypeChar);
  const onEnterDropRef = useRef(onEnterDrop);
  onTypeCharRef.current = onTypeChar;
  onEnterDropRef.current = onEnterDrop;

  // Ticking live uptime clock + video frame counter
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setUptimeSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (paused || scene !== "video") return;
    const id = window.setInterval(() => {
      setVideoFrame((f) => (f >= 121 ? 1 : f + 3));
    }, 125);
    return () => window.clearInterval(id);
  }, [paused, scene]);

  // Synchronized live prompt typer: drives 3D keyboard key presses, then triggers ENTER + instant Bayer wipe!
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setTypedText(targetPrompt);
      setIsTyping(false);
      return;
    }

    let idx = 0;
    let timer: number | null = null;
    let nextSceneTimer: number | null = null;
    let cancelled = false;

    setTypedText("");
    setIsTyping(true);
    setPlanLocked(false);

    const step = () => {
      if (cancelled) return;
      if (paused) {
        timer = window.setTimeout(step, 180);
        return;
      }
      if (idx < targetPrompt.length) {
        const ch = targetPrompt[idx];
        idx += 1;
        setTypedText(targetPrompt.slice(0, idx));
        onTypeCharRef.current?.(ch);
        // Fast human-cadence typing (~34ms average) so it feels snappy & alive, never sluggish!
        const delay = ch === " " ? 42 : 28 + (idx % 3) * 8;
        timer = window.setTimeout(step, delay);
      } else {
        setIsTyping(false);
        onEnterDropRef.current?.();
        setSweepNonce((n) => n + 1);

        if (autoCycle && !paused) {
          nextSceneTimer = window.setTimeout(() => {
            if (cancelled || paused) return;
            const order: SnapshotSceneId[] = ["genui", "image", "video", "fleet"];
            const next = order[(order.indexOf(scene) + 1) % order.length];
            onSceneChange(next);
          }, 5600);
        }
      }
    };

    timer = window.setTimeout(step, 220);

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
      if (nextSceneTimer !== null) window.clearTimeout(nextSceneTimer);
    };
  }, [scene, targetPrompt, replayNonce, externalDropNonce, paused, autoCycle, onSceneChange]);

  const formatUptime = (sec: number) => {
    const hh = String(Math.floor(sec / 3600)).padStart(2, "0");
    const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <div
      className="relative flex w-full flex-col overflow-hidden rounded-[6px] border border-white/15 bg-black text-white shadow-[0_24px_70px_rgba(0,0,0,0.85)]"
      aria-label="Gyra Live Intelligence Snapshot Stage"
    >
      {/* 1. COMPACT HARDWARE TOP BAR (E2B-inspired discipline: Host, Pause, Replay, Region) */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#05080D] px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Terminal className="h-3.5 w-3.5 shrink-0 text-[#5B9EC2]" aria-hidden="true" />
          <span className="font-mono-tech truncate text-[10.5px] tracking-[0.04em] text-white sm:text-[11px]">
            {activeMeta.host}
            <span className="text-[#6B8296]"> @ {activeMeta.region}</span>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Resume live show" : "Pause live show"}
            className="inline-flex h-[26px] w-[26px] items-center justify-center border border-white/10 bg-black text-[#8FA7BC] transition-colors hover:border-[#5B9EC2] hover:text-white cursor-pointer"
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={() => setReplayNonce((n) => n + 1)}
            aria-label="Replay current prompt drop"
            className="inline-flex h-[26px] w-[26px] items-center justify-center border border-white/10 bg-black text-[#8FA7BC] transition-colors hover:border-[#5B9EC2] hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <span className="font-mono-tech border border-white/12 bg-white/[0.03] px-2 py-0.5 text-[10px] text-[#C8D9E6]">
            {activeMeta.region}
          </span>
        </div>
      </div>

      {/* 2. LIVE TYPING PROMPT STRIP (Synced character-by-character with the 3D keyboard!) */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#03060A] px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 font-mono-tech text-[11px] sm:text-[11.5px]">
          <span className="shrink-0 text-[#5B9EC2]">❯</span>
          <span className="truncate text-[#E7F1F8]">
            {typedText || activeMeta.prompt}
            {isTyping && <span className="gyra-cursor ml-1 inline-block align-middle" />}
          </span>
        </div>
        <span
          className={`font-mono-tech shrink-0 px-1.5 py-0.5 text-[9px] tracking-[0.12em] uppercase ${
            isTyping
              ? "border border-[#5B9EC2]/45 bg-[#1F5B7C]/20 text-[#9CC4DC]"
              : "border border-[#34D399]/40 bg-[#051C16] text-[#6EE7B7]"
          }`}
        >
          {isTyping ? "Typing" : "Live"}
        </span>
      </div>

      {/* 3. ZERO-LAG LIVE RESULT STAGE (Always populated — Bayer dither wipes cleanly on drop!) */}
      <div className="relative min-h-[300px] sm:min-h-[322px] bg-black p-3.5 sm:p-4">
        <DitherMatrixOverlay sweepNonce={sweepNonce} />

        {/* SCENE 1: CHAT WITH GENERATIVE UI (Real Question -> Interactive Gen UI, ZERO raw code!) */}
        {scene === "genui" && (
          <div className="flex h-full flex-col justify-between gap-3">
            {/* Instant Verified Tool Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 font-mono-tech text-[9.5px] uppercase">
                <span className="inline-flex items-center gap-1 border border-[#34D399]/35 bg-[#041713] px-2 py-0.5 text-[#6EE7B7]">
                  <Check className="h-2.5 w-2.5" /> Weather API
                </span>
                <span className="inline-flex items-center gap-1 border border-[#34D399]/35 bg-[#041713] px-2 py-0.5 text-[#6EE7B7]">
                  <Check className="h-2.5 w-2.5" /> Flight Index
                </span>
                <span className="inline-flex items-center gap-1 border border-[#5B9EC2]/40 bg-[#081A27] px-2 py-0.5 text-[#9CC4DC]">
                  <Sun className="h-2.5 w-2.5" /> Golden Hour · 160ms
                </span>
              </div>
              <span className="font-mono-tech inline-flex items-center gap-1 text-[9.5px] tracking-[0.1em] text-[#7D95AA] uppercase">
                <Sparkles className="h-3 w-3 text-[#5B9EC2]" /> Gen UI Card
              </span>
            </div>

            {/* Interactive City Comparison Gen UI Cards */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {/* Lisbon Card (Recommended) */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCity("lisbon");
                  setPlanLocked(false);
                }}
                className={`text-left border p-3 transition-colors cursor-pointer ${
                  selectedCity === "lisbon"
                    ? "border-[#5B9EC2] bg-[#071622]"
                    : "border-white/10 bg-[#05090F] hover:border-white/25"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-[17px] font-bold tracking-tight text-white uppercase">
                    Lisbon, PT
                  </span>
                  <span className="font-mono-tech bg-[#1F5B7C] px-1.5 py-0.5 text-[8.5px] tracking-[0.1em] text-white uppercase">
                    Best Value
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5 font-mono-tech text-[10px]">
                  <div className="border border-white/10 bg-black/70 px-2 py-1">
                    <div className="text-[8.5px] text-[#6F869B]">WEATHER</div>
                    <div className="text-white">22°C Sun</div>
                  </div>
                  <div className="border border-white/10 bg-black/70 px-2 py-1">
                    <div className="text-[8.5px] text-[#6F869B]">GOLDEN HR</div>
                    <div className="text-[#9CC4DC]">18:42</div>
                  </div>
                  <div className="border border-white/10 bg-black/70 px-2 py-1">
                    <div className="text-[8.5px] text-[#6F869B]">5-DAY EST</div>
                    <div className="text-[#34D399]">$2,680</div>
                  </div>
                </div>
              </button>

              {/* Tokyo Card */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCity("tokyo");
                  setPlanLocked(false);
                }}
                className={`text-left border p-3 transition-colors cursor-pointer ${
                  selectedCity === "tokyo"
                    ? "border-[#5B9EC2] bg-[#071622]"
                    : "border-white/10 bg-[#05090F] hover:border-white/25"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-[17px] font-bold tracking-tight text-white uppercase">
                    Tokyo, JP
                  </span>
                  <span className="font-mono-tech border border-white/15 px-1.5 py-0.5 text-[8.5px] tracking-[0.1em] text-[#9CB2C5] uppercase">
                    Neon Night
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5 font-mono-tech text-[10px]">
                  <div className="border border-white/10 bg-black/70 px-2 py-1">
                    <div className="text-[8.5px] text-[#6F869B]">WEATHER</div>
                    <div className="text-white">19°C Clr</div>
                  </div>
                  <div className="border border-white/10 bg-black/70 px-2 py-1">
                    <div className="text-[8.5px] text-[#6F869B]">GOLDEN HR</div>
                    <div className="text-[#9CC4DC]">17:28</div>
                  </div>
                  <div className="border border-white/10 bg-black/70 px-2 py-1">
                    <div className="text-[8.5px] text-[#6F869B]">5-DAY EST</div>
                    <div className="text-white">$3,420</div>
                  </div>
                </div>
              </button>
            </div>

            {/* Live Gen UI Cost Breakdown Visual Bars + Interactive Action */}
            <div className="border border-white/10 bg-[#04080E] p-3">
              <div className="flex items-center justify-between font-mono-tech text-[9.5px] uppercase">
                <span className="text-[#8CA4B8]">
                  {selectedCity === "lisbon" ? "Lisbon 5-Day Shoot Budget" : "Tokyo 5-Day Shoot Budget"}
                </span>
                <span className="text-[#34D399]">
                  {selectedCity === "lisbon" ? "Saves $740 vs Tokyo" : "+24% Night Neon Permits"}
                </span>
              </div>
              <div className="mt-2.5 space-y-1.5 font-mono-tech text-[10px]">
                {(selectedCity === "lisbon"
                  ? [
                      { label: "Flights & Rail", val: "$940", pct: "56%" },
                      { label: "Concrete Loft", val: "$1,120", pct: "68%" },
                      { label: "Crew & Grip", val: "$620", pct: "38%" },
                    ]
                  : [
                      { label: "Flights & Rail", val: "$1,480", pct: "84%" },
                      { label: "Shibuya Studio", val: "$1,260", pct: "74%" },
                      { label: "Crew & Permits", val: "$680", pct: "42%" },
                    ]
                ).map((row) => (
                  <div key={row.label} className="grid grid-cols-[96px_1fr_48px] items-center gap-2">
                    <span className="truncate text-[#8FA4B6]">{row.label}</span>
                    <div className="h-1.5 w-full bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-[#1F5B7C] to-[#5B9EC2] transition-all duration-300"
                        style={{ width: row.pct }}
                      />
                    </div>
                    <span className="text-right text-white">{row.val}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                <span className="text-[11.5px] text-[#9FB3C4]">
                  {planLocked
                    ? `✓ ${selectedCity === "lisbon" ? "Lisbon" : "Tokyo"} itinerary saved to Gyra Workspace`
                    : "Click a city above or lock this live Gen UI brief."}
                </span>
                <button
                  type="button"
                  onClick={() => setPlanLocked((v) => !v)}
                  className={`font-mono-tech min-h-[26px] px-2.5 text-[9.5px] tracking-[0.1em] uppercase transition-colors cursor-pointer ${
                    planLocked
                      ? "border border-[#34D399]/60 bg-[#06241C] text-[#6EE7B7]"
                      : "bg-[#1F5B7C] text-white hover:bg-[#2A7299]"
                  }`}
                >
                  {planLocked ? "Locked ✓" : `Lock ${selectedCity}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 2: INTERACTIVE GEOMETRY-LOCKED 2700K RELIGHT */}
        {scene === "image" && (
          <div className="flex h-full flex-col justify-between gap-3">
            <div className="relative aspect-[16/9] w-full overflow-hidden border border-white/15 bg-black">
              <picture className="block h-full w-full">
                <source srcSet="/showcase/edit-after.webp" type="image/webp" />
                <img
                  src="/showcase/edit-after.jpg"
                  alt="Gyra Pro Ultra 2700K dusk relight"
                  className="h-full w-full object-cover"
                />
              </picture>
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
              >
                <picture className="block h-full w-full">
                  <source srcSet="/showcase/edit-before.webp" type="image/webp" />
                  <img
                    src="/showcase/edit-before.jpg"
                    alt="Original daylight interior"
                    className="h-full w-full object-cover"
                  />
                </picture>
              </div>
              <div
                className="pointer-events-none absolute inset-y-0 w-[2px] bg-[#5B9EC2]"
                style={{ left: `${splitPct}%` }}
              >
                <span className="absolute left-1/2 top-1/2 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[#5B9EC2] bg-black font-mono-tech text-[9px] text-white">
                  ↔
                </span>
              </div>
              <span className="font-mono-tech absolute bottom-2 left-2 bg-black/85 px-2 py-0.5 text-[9px] text-[#D4E4F0] uppercase">
                Original · 5200K
              </span>
              <span className="font-mono-tech absolute bottom-2 right-2 bg-[#1F5B7C] px-2 py-0.5 text-[9px] text-white uppercase">
                Pro Ultra · 2700K
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 font-mono-tech text-[10px]">
              <label className="flex flex-1 items-center gap-2.5 text-[#8DA4B8]">
                <span className="shrink-0 uppercase">Compare</span>
                <input
                  type="range"
                  min={8}
                  max={92}
                  value={splitPct}
                  onChange={(e) => setSplitPct(Number(e.target.value))}
                  aria-label="Compare daylight and 2700K relight"
                  className="gyra-slider flex-1"
                />
              </label>
              <span className="text-[#34D399]">SSIM 0.994 · 1.8S</span>
            </div>
          </div>
        )}

        {/* SCENE 3: OBSIDIAN RIM-LIT HEADSET 720P STUDIO VIEWFINDER */}
        {scene === "video" && (
          <div className="flex h-full flex-col justify-between gap-3">
            <div className="relative aspect-[16/9] w-full overflow-hidden border border-white/15 bg-black">
              <video
                src="/products-hero-bg.mp4"
                poster="/video-samples/headset-f001.webp"
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35" />
              <div className="font-mono-tech absolute left-2.5 right-2.5 top-2 flex items-center justify-between text-[9.5px] text-[#B9D4E6]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                  <span>REC · LTX-VIDEO 13B</span>
                </span>
                <span>85MM F/1.4 · 24 FPS</span>
              </div>
              <div className="font-mono-tech absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[9.5px] text-white">
                <span>FRAME {String(videoFrame).padStart(3, "0")} / 121</span>
                <span className="text-[#34D399]">TEMPORAL LOCK · 720P</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 font-mono-tech text-[9px] text-[#8EB4CC]">
              {["F001 Anchor", "F040 Orbit", "F080 Specular", "F121 Locked"].map((f, idx) => (
                <div
                  key={f}
                  className={`border px-1.5 py-1 text-center ${
                    Math.floor((videoFrame - 1) / 31) === idx
                      ? "border-[#5B9EC2] bg-[#0B2335] text-white"
                      : "border-white/10 bg-[#050A10]"
                  }`}
                >
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCENE 4: PARALLEL MULTI-AGENT FLEET (Inspired directly by E2B's ASYNC 4x2 grid!) */}
        {scene === "fleet" && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {/* Worker 1: Gen UI */}
            <div className="flex flex-col justify-between border border-white/12 bg-[#04080E] p-2.5">
              <div className="flex items-center justify-between font-mono-tech text-[8.5px]">
                <span className="text-[#6F869B]">GEN-01</span>
                <span className="text-[#9CC4DC]">RUNNING · 1.2S</span>
              </div>
              <div className="my-2.5 space-y-1">
                <div className="h-1.5 w-4/5 bg-[#5B9EC2]/70" />
                <div className="h-1.5 w-3/5 bg-[#1F5B7C]" />
                <div className="flex gap-1 pt-1">
                  <span className="h-3.5 w-1/2 border border-[#5B9EC2]/40 bg-[#0A2030]" />
                  <span className="h-3.5 w-1/2 border border-white/10 bg-black" />
                </div>
              </div>
              <span className="font-mono-tech text-[8.5px] text-[#9EB5C8] uppercase">GEN UI · BUDGET</span>
            </div>

            {/* Worker 2: Relight */}
            <div className="flex flex-col justify-between border border-white/12 bg-[#04080E] p-2.5">
              <div className="flex items-center justify-between font-mono-tech text-[8.5px]">
                <span className="text-[#6F869B]">IMG-02</span>
                <span className="text-[#34D399]">DONE · 1.8S</span>
              </div>
              <div className="relative my-2 h-[46px] overflow-hidden border border-white/10">
                <picture className="block h-full w-full">
                  <source srcSet="/showcase/edit-after.webp" type="image/webp" />
                  <img src="/showcase/edit-after.jpg" alt="" className="h-full w-full object-cover" />
                </picture>
              </div>
              <span className="font-mono-tech text-[8.5px] text-[#9EB5C8] uppercase">RELIGHT · 2700K</span>
            </div>

            {/* Worker 3: Video */}
            <div className="flex flex-col justify-between border border-white/12 bg-[#04080E] p-2.5">
              <div className="flex items-center justify-between font-mono-tech text-[8.5px]">
                <span className="text-[#6F869B]">VID-03</span>
                <span className="text-[#9CC4DC]">24 FPS</span>
              </div>
              <div className="relative my-2 h-[46px] overflow-hidden border border-white/10">
                <img
                  src="/video-samples/headset-f001.webp"
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span className="font-mono-tech absolute bottom-1 right-1 bg-black/80 px-1 text-[8px] text-[#34D399]">
                  720P
                </span>
              </div>
              <span className="font-mono-tech text-[8.5px] text-[#9EB5C8] uppercase">STUDIO · ORBIT</span>
            </div>

            {/* Worker 4: Knowledge RAG */}
            <div className="flex flex-col justify-between border border-white/12 bg-[#04080E] p-2.5">
              <div className="flex items-center justify-between font-mono-tech text-[8.5px]">
                <span className="text-[#6F869B]">RAG-04</span>
                <span className="text-[#34D399]">DONE · 0.4S</span>
              </div>
              <div className="my-2 font-mono-tech text-[9.5px] leading-[1.45] text-[#B9D0E2]">
                <div>14 PDFs indexed</div>
                <div className="text-[#5B9EC2]">2,840 vectors ✓</div>
              </div>
              <span className="font-mono-tech text-[8.5px] text-[#9EB5C8] uppercase">PROJECT · RAG</span>
            </div>

            {/* Worker 5: Telegram @GyraAi */}
            <div className="flex flex-col justify-between border border-white/12 bg-[#04080E] p-2.5">
              <div className="flex items-center justify-between font-mono-tech text-[8.5px]">
                <span className="text-[#6F869B]">BOT-05</span>
                <span className="text-[#34D399]">SYNCED</span>
              </div>
              <div className="my-2 font-mono-tech text-[9.5px] leading-[1.45] text-[#B9D0E2]">
                <div>@GyraAi mobile</div>
                <div className="text-[#6EE7B7]">Brief pushed ✓</div>
              </div>
              <span className="font-mono-tech text-[8.5px] text-[#9EB5C8] uppercase">TELEGRAM · SYNC</span>
            </div>

            {/* Worker 6: Animated Bayer-Dither Provisioning */}
            <div className="flex flex-col justify-between border border-[#5B9EC2]/35 bg-[#04080E] p-2.5">
              <div className="flex items-center justify-between font-mono-tech text-[8.5px]">
                <span className="text-[#9CC4DC]">GPU-06</span>
                <span className="text-[#5B9EC2]">BOOT</span>
              </div>
              <div className="my-1 overflow-hidden">
                <MiniDitherProvisionCanvas />
              </div>
              <span className="font-mono-tech text-[8.5px] text-[#9CC4DC] uppercase">PROVISIONING…</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. BOTTOM STATUS TELEMETRY BAR (E2B's signature "BOOTED FROM SNAPSHOT" + live UPTIME) */}
      <div className="flex items-center justify-between gap-2 border-t border-white/10 bg-[#04070C] px-3 py-2 font-mono-tech text-[9.5px] tracking-[0.1em] uppercase sm:px-4">
        <span className="truncate text-[#C3D5E4]">{activeMeta.bootBadge}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[#C3D5E4]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
          <span className="text-[#7890A4]">UPTIME</span>
          <span className="text-white">{formatUptime(uptimeSec)}</span>
        </span>
      </div>

      {/* 5. 4-TAB SCENE SWITCHER (Active button gets animated Bayer-dither halftone shimmer!) */}
      <div
        role="tablist"
        aria-label="Gyra live snapshot scenes"
        className="grid grid-cols-4 gap-1 border-t border-white/10 bg-black p-1.5"
      >
        {SNAPSHOT_SCENES.map((item) => {
          const active = item.id === scene;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                onSceneChange(item.id);
                setSweepNonce((n) => n + 1);
              }}
              className={`relative min-h-[36px] overflow-hidden rounded-[3px] px-1.5 font-mono-tech text-[9.5px] tracking-[0.08em] uppercase transition-colors cursor-pointer sm:text-[10.5px] ${
                active
                  ? "border border-[#5B9EC2]/55 bg-[#0A1A26] text-white"
                  : "border border-transparent bg-transparent text-[#7D94A8] hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-45"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(156, 196, 220, 0.7) 1px, transparent 1px), radial-gradient(rgba(31, 91, 124, 0.85) 1px, transparent 1px)",
                    backgroundSize: "6px 6px, 6px 6px",
                    backgroundPosition: "0 0, 3px 3px",
                    maskImage: "linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.85))",
                    WebkitMaskImage:
                      "linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.85))",
                  }}
                />
              )}
              <span className="relative z-10 sm:hidden">{item.mobileTab}</span>
              <span className="relative z-10 hidden sm:inline">{item.desktopTab}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
