"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { ChatFlowPhase, LiveModalityId } from "./SynapticKeyboardCanopy";

export interface E2BSceneSpec {
  id: LiveModalityId;
  code: string;
  label: string;
  host: string;
  region: string;
  dropLabel: string;
  terminalLines: {
    prefix: string;
    text: string;
    tone: "cmd" | "ok" | "agent" | "accent";
  }[];
}

export const E2B_SCENES: Record<LiveModalityId, E2BSceneSpec> = {
  chat: {
    id: "chat",
    code: "01",
    label: "CHAT",
    host: "g4k9x2p",
    region: "edge-01",
    dropLabel: "Tokyo vs Lisbon",
    terminalLines: [
      { prefix: "$", text: "gyra run --core supergyra-2.0", tone: "cmd" },
      { prefix: "✓", text: "edge-warm g4k9x2p · 14ms TTFT", tone: "ok" },
      { prefix: "agent>", text: "parse: tokyo vs lisbon shoot", tone: "agent" },
      { prefix: "agent>", text: "ground climate + flight index", tone: "agent" },
      { prefix: "✓", text: "6 sources verified — 0.4s", tone: "ok" },
      { prefix: "agent>", text: "compose gen-ui brief", tone: "accent" },
      { prefix: "✓", text: "layout verified — 1.1s", tone: "ok" },
      { prefix: "agent>", text: "stream g4k9x2p.gyra.app", tone: "accent" },
    ],
  },
  image: {
    id: "image",
    code: "02",
    label: "IMAGE",
    host: "i2i-9c1",
    region: "lhr-01",
    dropLabel: "2700K Relight",
    terminalLines: [
      { prefix: "$", text: "gyra image edit --pro-ultra", tone: "cmd" },
      { prefix: "✓", text: "edge-warm i2i-9c1 · proxy locked", tone: "ok" },
      { prefix: "proxy>", text: "lock 16-bit depth normals", tone: "agent" },
      { prefix: "relight>", text: "window 5200K -> blue dusk", tone: "accent" },
      { prefix: "lamp>", text: "warm tungsten bounce 2700K", tone: "accent" },
      { prefix: "✓", text: "ssim 0.994 locked — 1.8s", tone: "ok" },
      { prefix: "output>", text: "publish 1440x1080 frame", tone: "agent" },
    ],
  },
  video: {
    id: "video",
    code: "03",
    label: "VIDEO",
    host: "ltx-13b",
    region: "jfk-01",
    dropLabel: "Studio Headset",
    terminalLines: [
      { prefix: "$", text: "gyra video queue --ltx-13b", tone: "cmd" },
      { prefix: "✓", text: "edge-warm ltx-13b · 720p worker", tone: "ok" },
      { prefix: "anchor>", text: "lock frame-001 obsidian earcup", tone: "agent" },
      { prefix: "motion>", text: "18° macro studio orbit", tone: "accent" },
      { prefix: "✓", text: "121 frames 720p · 24fps", tone: "ok" },
    ],
  },
  audio: {
    id: "audio",
    code: "04",
    label: "AUDIO",
    host: "nova-48k",
    region: "fra-01",
    dropLabel: "48kHz Voice",
    terminalLines: [
      { prefix: "$", text: "gyra voice synth --nova-48k", tone: "cmd" },
      { prefix: "✓", text: "edge-warm nova-48k · 48kHz DSP", tone: "ok" },
      { prefix: "whisper>", text: "align q4 launch brief", tone: "agent" },
      { prefix: "dsp>", text: "master 48kHz · -14 LUFS", tone: "accent" },
      { prefix: "✓", text: "stream ready — 140ms", tone: "ok" },
    ],
  },
};

export const E2B_MODALITY_ORDER: LiveModalityId[] = ["chat", "image", "video", "audio"];

const BAYER_4X4 = [
  [0 / 16, 8 / 16, 2 / 16, 10 / 16],
  [12 / 16, 4 / 16, 14 / 16, 6 / 16],
  [3 / 16, 11 / 16, 1 / 16, 9 / 16],
  [15 / 16, 7 / 16, 13 / 16, 5 / 16],
];

/**
 * E2B-style real-time Bayer-dither halftone pixel curtain!
 * Progress 0 -> 1 smoothly sweeps left-to-right uncovering the underlying visual.
 */
function BayerCurtainCanvas({ progress }: { progress: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.clearRect(0, 0, w, h);

    if (progress >= 0.99) return;

    const cell = 4;
    const cols = Math.ceil(w / cell);
    const rows = Math.ceil(h / cell);
    // Frontier position moves from left (0.02) -> right (1.15)
    const frontier = progress * 1.18;
    const band = 0.34;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = c / cols;
        // Already revealed to the left of the dither band
        if (nx < frontier - band * 0.55) continue;

        // Solid dark mask to the far right before the wave arrives
        if (nx > frontier + band * 0.55) {
          const thr = BAYER_4X4[r & 3][c & 3];
          ctx.fillStyle = "#000000";
          ctx.fillRect(c * cell, r * cell, cell, cell);
          if (thr < 0.14) {
            ctx.fillStyle = "rgba(136, 174, 198, 0.14)";
            ctx.fillRect(c * cell + 1, r * cell + 1, 2, 2);
          }
          continue;
        }

        // Inside the calm, understated institutional Bayer-dither frontier
        const local = (nx - (frontier - band * 0.55)) / (band * 1.1); // 0..1
        const thr = BAYER_4X4[r & 3][c & 3];
        if (local > thr) {
          ctx.fillStyle = "#000000";
          ctx.fillRect(c * cell, r * cell, cell, cell);
          const hot = Math.abs(local - 0.5) < 0.28;
          ctx.fillStyle = hot ? "rgba(138, 176, 200, 0.54)" : "rgba(44, 86, 112, 0.44)";
          ctx.fillRect(c * cell + 0.5, r * cell + 0.5, cell - 1.5, cell - 1.5);
        }
      }
    }
  }, [progress]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
    />
  );
}

/**
 * E2B FINANCIAL-style animated step-function curve filled with glowing Bayer-dither dots!
 * Used for 04 AUDIO live 48kHz studio frequency & voice energy monitor.
 */
function DitherAudioSpectrumCanvas({
  progress,
  playing,
}: {
  progress: number;
  playing: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const steps = [0.16, 0.34, 0.28, 0.58, 0.48, 0.72, 0.64, 0.84, 0.78, 0.91];
    const baseline = [0.08, 0.14, 0.12, 0.21, 0.19, 0.25, 0.23, 0.31, 0.29, 0.33];

    const render = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(200, Math.round(rect.width));
      const h = Math.max(180, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      const padL = 36;
      const padR = 18;
      const padT = 26;
      const padB = 28;
      const cw = w - padL - padR;
      const ch = h - padT - padB;

      // Subtle E2B horizontal axis hairlines + Y labels
      const yTicks = ["0dB", "-6", "-12", "-24"];
      ctx.font = `500 9px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      yTicks.forEach((lbl, i) => {
        const y = padT + (i / 3) * ch;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
        ctx.fillStyle = "#666666";
        ctx.fillText(lbl, padL - 7, y);
      });

      // X frequency labels
      const xTicks = ["60HZ", "250HZ", "1KHZ", "4KHZ", "12KHZ"];
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      xTicks.forEach((lbl, i) => {
        const x = padL + (i / (xTicks.length - 1)) * cw;
        ctx.fillStyle = "#666666";
        ctx.fillText(lbl, x, h - padB + 9);
      });

      const t = reduced ? 0 : now * 0.0024;
      const drawnCount = Math.max(1, Math.round(progress * steps.length));
      const stepW = cw / steps.length;

      // Subtle reference baseline step line (like E2B's S&P grey line!)
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      for (let i = 0; i < drawnCount; i++) {
        const x0 = padL + i * stepW;
        const x1 = x0 + stepW;
        const y = padT + ch * (1 - baseline[i]);
        if (i === 0) ctx.moveTo(x0, y);
        else ctx.lineTo(x0, y);
        ctx.lineTo(x1, y);
      }
      ctx.stroke();

      // Compute dynamic live heights per step
      const liveVals = steps.map((v, i) => {
        const jitter = playing && !reduced ? Math.sin(t * 2.6 + i * 1.1) * 0.06 : Math.sin(t * 0.9 + i * 0.7) * 0.018;
        return Math.max(0.08, Math.min(0.96, v + jitter));
      });

      // Bayer-dither dot fill underneath the active step curve (restrained institutional slate-steel)
      const dotGap = 6;
      for (let i = 0; i < drawnCount; i++) {
        const x0 = padL + i * stepW;
        const x1 = x0 + stepW;
        const yTop = padT + ch * (1 - liveVals[i]);
        const yBot = padT + ch;
        for (let dy = yTop + 3; dy < yBot - 2; dy += dotGap) {
          const depthRatio = 1 - (dy - yTop) / Math.max(1, yBot - yTop);
          for (let dx = x0 + 3; dx < x1 - 1; dx += dotGap) {
            ctx.fillStyle = `rgba(128, 170, 198, ${(0.14 + depthRatio * 0.42).toFixed(2)})`;
            ctx.fillRect(dx, dy, 2, 2);
          }
        }
      }

      // Crisp 1.5px step-function top line
      ctx.beginPath();
      ctx.strokeStyle = "#7BAAC6";
      ctx.lineWidth = 1.5;
      let lastX = padL;
      let lastY = padT + ch;
      for (let i = 0; i < drawnCount; i++) {
        const x0 = padL + i * stepW;
        const x1 = x0 + stepW;
        const y = padT + ch * (1 - liveVals[i]);
        if (i === 0) ctx.moveTo(x0, y);
        else ctx.lineTo(x0, y);
        ctx.lineTo(x1, y);
        lastX = x1;
        lastY = y;
      }
      ctx.stroke();

      // Active cursor dot + crisp floating peak badge
      ctx.fillStyle = "#D4E4EF";
      ctx.fillRect(lastX - 2, lastY - 2, 4, 4);

      if (drawnCount >= 6) {
        const bx = Math.min(w - padR - 54, lastX - 36);
        const by = Math.max(8, lastY - 26);
        ctx.fillStyle = "#05070A";
        ctx.strokeStyle = "rgba(128, 170, 198, 0.55)";
        ctx.lineWidth = 1;
        ctx.fillRect(bx, by, 52, 18);
        ctx.strokeRect(bx, by, 52, 18);
        ctx.fillStyle = "#A4BED0";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("48KHZ", bx + 26, by + 9.5);
      }

      if (!reduced) raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [progress, playing]);

  return <canvas ref={ref} className="block h-full w-full" aria-label="Live 48kHz audio frequency spectrum" />;
}

export interface GyraE2BStageBoxProps {
  activeModality: LiveModalityId;
  phase: ChatFlowPhase;
  runNonce?: number;
  autoFlow: boolean;
  customPrompt?: string | null;
  onSelectModality: (m: LiveModalityId) => void;
  onToggleAutoFlow: () => void;
  onReplay: () => void;
  onTypeChar?: (ch: string) => void;
}

export function GyraE2BStageBox({
  activeModality,
  phase,
  runNonce = 0,
  autoFlow,
  customPrompt = null,
  onSelectModality,
  onToggleAutoFlow,
  onReplay,
}: GyraE2BStageBoxProps) {
  const scene = E2B_SCENES[activeModality];
  const [uptimeSec, setUptimeSec] = useState(16634); // 04:37:14 live ticking clock
  const [revealProgress, setRevealProgress] = useState(0.24);
  const [visibleLineCount, setVisibleLineCount] = useState(2);
  const [lockedCity, setLockedCity] = useState<"lisbon" | "tokyo">("lisbon");
  const [splitPct, setSplitPct] = useState(50);
  const [videoFrame, setVideoFrame] = useState(1);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const wheelLockUntilRef = useRef(0);

  // Ticking live uptime clock
  useEffect(() => {
    const id = window.setInterval(() => setUptimeSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Video frame ticker
  useEffect(() => {
    if (activeModality !== "video") return;
    const id = window.setInterval(() => {
      setVideoFrame((f) => (f >= 121 ? 1 : f + 3));
    }, 125);
    return () => window.clearInterval(id);
  }, [activeModality]);

  // Single continuous, lazy cubic-out Bayer unveil + unhurried staggered terminal reveal (zero stop-restart plateaus!)
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = scene.terminalLines.length;
    setAudioPlaying(false);

    if (reduced) {
      setRevealProgress(1);
      setVisibleLineCount(total);
      return;
    }

    setRevealProgress(0.2);
    setVisibleLineCount(Math.min(2, total));

    let raf = 0;
    const startTs = performance.now();
    const durationMs = 2500;

    const tick = (now: number) => {
      const raw = Math.min(1, (now - startTs) / durationMs);
      // Smooth cubic-out glide: starts gently, finishes effortlessly with zero snap
      const eased = 1 - Math.pow(1 - raw, 3);
      setRevealProgress(0.2 + eased * 0.8);
      if (raw < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);

    const lineTimers: number[] = [];
    for (let i = 3; i <= total; i++) {
      const id = window.setTimeout(() => {
        setVisibleLineCount(i);
      }, (i - 2) * 310);
      lineTimers.push(id);
    }

    return () => {
      cancelAnimationFrame(raf);
      lineTimers.forEach((id) => window.clearTimeout(id));
    };
  }, [activeModality, runNonce, scene.terminalLines.length]);

  // Soft wheel glide across modalities inside the locked stage without shifting page layout
  const handleStageWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const now = performance.now();
    if (now < wheelLockUntilRef.current || Math.abs(e.deltaY) < 28) return;
    wheelLockUntilRef.current = now + 700;
    const idx = E2B_MODALITY_ORDER.indexOf(activeModality);
    const nextIdx =
      e.deltaY > 0
        ? (idx + 1) % E2B_MODALITY_ORDER.length
        : (idx - 1 + E2B_MODALITY_ORDER.length) % E2B_MODALITY_ORDER.length;
    onSelectModality(E2B_MODALITY_ORDER[nextIdx]);
  };

  const handleToggleAudio = () => {
    const next = !audioPlaying;
    setAudioPlaying(next);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      if (next) {
        const u = new SpeechSynthesisUtterance(
          "Gyra Nova 48 kilohertz neural voice online across 195 countries.",
        );
        u.rate = 1.04;
        u.onend = () => setAudioPlaying(false);
        window.speechSynthesis.speak(u);
      }
    }
  };

  const formatUptime = (sec: number) => {
    const hh = String(Math.floor(sec / 3600)).padStart(2, "0");
    const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const linesToRender = scene.terminalLines.slice(0, visibleLineCount).map((ln, idx) => {
    if (customPrompt && idx === 2) {
      return { ...ln, text: `ask: ${customPrompt.slice(0, 26)}` };
    }
    return ln;
  });

  return (
    /* EXACT E2B HARDWARE BOX — Pure #000000, strictly fixed height, zero reshaping, tabs UP for Live Flow! */
    <div
      data-testid="gyra-e2b-stage-box"
      data-phase={phase}
      onWheel={handleStageWheel}
      className="mx-auto flex h-[548px] w-full max-w-[920px] flex-col overflow-hidden rounded-[6px] border border-white/14 bg-black text-white sm:h-[472px]"
    >
      {/* 1. TOP 4-TAB BAR (Connected directly beneath the 4 downward Live Intelligence wires — E2B Bayer-dither active tab!) */}
      <div
        role="tablist"
        aria-label="Live Flow Modalities"
        className="grid shrink-0 grid-cols-4 gap-1 border-b border-white/12 bg-black p-1.5"
      >
        {E2B_MODALITY_ORDER.map((id) => {
          const item = E2B_SCENES[id];
          const active = id === activeModality;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectModality(id)}
              className={`relative flex min-h-[38px] items-center justify-center gap-1.5 overflow-hidden rounded-[4px] px-2 font-mono-tech text-[10px] tracking-[0.11em] uppercase transition-colors cursor-pointer sm:text-[11px] ${
                active
                  ? "border border-white/20 bg-[#14171C] text-white"
                  : "border border-transparent bg-transparent text-[#737373] hover:bg-white/[0.03] hover:text-white"
              }`}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-28"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(164, 194, 214, 0.55) 1px, transparent 1px), radial-gradient(rgba(46, 86, 112, 0.65) 1px, transparent 1px)",
                    backgroundSize: "5px 5px, 5px 5px",
                    backgroundPosition: "0 0, 2.5px 2.5px",
                    maskImage:
                      "linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.85))",
                    WebkitMaskImage:
                      "linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.85))",
                  }}
                />
              )}
              <span className="relative z-10 text-[#6F9AB5]">{item.code}</span>
              <span className="relative z-10 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. E2B MINIMAL CHROME HEADER BAR (= · host @ region · Pause · Replay · [region]) */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black px-3.5 py-2 sm:px-4">
        {/* E2B minimalist twin-line hardware mark */}
        <span aria-hidden="true" className="flex flex-col gap-[3px] opacity-60">
          <span className="block h-[1.5px] w-3.5 bg-white" />
          <span className="block h-[1.5px] w-3.5 bg-white" />
        </span>

        <span className="font-mono-tech truncate text-[11px] tracking-[0.03em] text-white">
          {scene.host}
          <span className="text-[#666666]"> @ {scene.region}</span>
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleAutoFlow}
            aria-label={autoFlow ? "Pause live show" : "Resume live show"}
            className="inline-flex h-[24px] w-[24px] items-center justify-center text-[#777777] transition-colors hover:text-white cursor-pointer"
          >
            {autoFlow ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={onReplay}
            aria-label="Replay active scene"
            className="inline-flex h-[24px] w-[24px] items-center justify-center text-[#777777] transition-colors hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <span className="font-mono-tech rounded-[3px] border border-white/15 bg-black px-2 py-0.5 text-[10px] text-[#D4D4D4]">
            {scene.region}
          </span>
        </div>
      </div>

      {/* 3. LOCKED PURE-BLACK LIVE VISUAL STAGE (4 Distinct E2B Engines — Smooth Glide Cross-Fade, Zero Box Reshaping!) */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
        {/* SCENE 01 · CHAT: Split-Pane Live Terminal + Bayer-Dither Gen UI App Reveal */}
        {activeModality === "chat" && (
          <div key="scene-chat" className="gyra-scene-glide grid h-full grid-cols-1 divide-y divide-white/10 sm:grid-cols-12 sm:divide-x sm:divide-y-0">
            {/* Left 5 cols: Crisp E2B-style live streaming monospace terminal */}
            <div className="flex flex-col justify-start overflow-hidden bg-black px-3.5 py-2.5 font-mono-tech text-[10px] leading-[1.52] sm:col-span-5 sm:px-4 sm:py-4 sm:text-[11.5px] sm:leading-[1.72]">
              {linesToRender.map((ln, i) => (
                <div key={i} className="flex items-start gap-2 truncate gyra-lazy-in">
                  <span
                    className={
                      ln.tone === "cmd"
                        ? "text-[#7DA4BD]"
                        : ln.tone === "ok"
                          ? "text-[#A2B6C4]"
                          : "text-[#5E656C]"
                    }
                  >
                    {ln.prefix}
                  </span>
                  <span
                    className={
                      ln.tone === "cmd"
                        ? "text-white"
                        : ln.tone === "ok"
                          ? "text-[#A3A8AE]"
                          : ln.tone === "accent"
                            ? "text-[#9AB7CA]"
                            : "text-[#7E858C]"
                    }
                  >
                    {ln.text}
                    {i === linesToRender.length - 1 && phase !== "done" && (
                      <span className="ml-1 inline-block h-3 w-[1.5px] bg-white/75 align-middle" />
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Right 7 cols: Mini gyra.app Gen UI window uncovered by animated Bayer-dither wave */}
            <div className="relative flex items-center justify-center bg-black p-3.5 sm:col-span-7 sm:p-5">
              <div className="relative flex h-full max-h-[268px] w-full flex-col overflow-hidden rounded-[6px] border border-white/12 bg-[#050608]">
                {/* Mini Browser Top Bar */}
                <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#333333]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#333333]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#333333]" />
                  </div>
                  <span className="font-mono-tech rounded bg-white/[0.04] px-2 py-0.5 text-[9px] text-[#8A8A8A]">
                    g4k9x2p.gyra.app
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7BAAC6]/80" />
                </div>

                {/* Minimalist Dark Gen UI Artifact */}
                <div className="flex flex-1 flex-col justify-between p-3">
                  <div className="flex items-center justify-between font-mono-tech text-[9px] tracking-[0.12em] text-[#737373] uppercase">
                    <span>SHOOT BRIEF · GEN UI</span>
                    <span className="text-[#8EB2C9]">VERIFIED</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLockedCity("lisbon")}
                      className={`rounded-[4px] border p-2 text-left transition-colors cursor-pointer ${
                        lockedCity === "lisbon"
                          ? "border-[#5B9EC2]/55 bg-[#0A131A]"
                          : "border-white/10 bg-black hover:border-white/25"
                      }`}
                    >
                      <div className="font-mono-tech text-[10px] font-semibold text-white">LISBON</div>
                      <div className="mt-1 font-mono-tech text-[9.5px] text-[#737373]">22°C · 18:42</div>
                      <div className="mt-1 font-mono-tech text-[11px] text-[#B8D0DF]">$2,680</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLockedCity("tokyo")}
                      className={`rounded-[4px] border p-2 text-left transition-colors cursor-pointer ${
                        lockedCity === "tokyo"
                          ? "border-[#5B9EC2]/55 bg-[#0A131A]"
                          : "border-white/10 bg-black hover:border-white/25"
                      }`}
                    >
                      <div className="font-mono-tech text-[10px] font-semibold text-white">TOKYO</div>
                      <div className="mt-1 font-mono-tech text-[9.5px] text-[#737373]">19°C · 17:28</div>
                      <div className="mt-1 font-mono-tech text-[11px] text-white">$3,420</div>
                    </button>
                  </div>

                  <div className="space-y-1.5 font-mono-tech text-[9.5px]">
                    <div className="flex items-center justify-between text-[#8A8A8A]">
                      <span>{lockedCity === "lisbon" ? "Total · Saves $740" : "Total · Neon Permit"}</span>
                      <span className="text-white">{lockedCity === "lisbon" ? "$2,680" : "$3,420"}</span>
                    </div>
                    <div className="h-1 w-full bg-white/10">
                      <div
                        className="h-full bg-[#6F9AB5] transition-all duration-300"
                        style={{ width: lockedCity === "lisbon" ? "64%" : "86%" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Live E2B Bayer-Dither Pixel Curtain sweeping across right pane! */}
                <BayerCurtainCanvas progress={revealProgress} />
              </div>
            </div>
          </div>
        )}

        {/* SCENE 02 · IMAGE: Split-Pane Terminal + Live Bayer-Dither 2700K Relight Sweep */}
        {activeModality === "image" && (
          <div key="scene-image" className="gyra-scene-glide grid h-full grid-cols-1 divide-y divide-white/10 sm:grid-cols-12 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col justify-start overflow-hidden bg-black px-3.5 py-3 font-mono-tech text-[11px] leading-[1.72] sm:col-span-5 sm:px-4 sm:py-4 sm:text-[11.5px]">
              {linesToRender.map((ln, i) => (
                <div key={i} className="flex items-start gap-2 truncate gyra-lazy-in">
                  <span
                    className={
                      ln.tone === "cmd"
                        ? "text-[#7DA4BD]"
                        : ln.tone === "ok"
                          ? "text-[#A2B6C4]"
                          : "text-[#5E656C]"
                    }
                  >
                    {ln.prefix}
                  </span>
                  <span
                    className={
                      ln.tone === "cmd"
                        ? "text-white"
                        : ln.tone === "accent"
                          ? "text-[#9AB7CA]"
                          : "text-[#8A8A8A]"
                    }
                  >
                    {ln.text}
                  </span>
                </div>
              ))}
            </div>

            <div className="relative flex flex-col justify-center gap-2.5 bg-black p-3.5 sm:col-span-7 sm:p-5">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[4px] border border-white/12 bg-black">
                <picture className="block h-full w-full">
                  <source srcSet="/showcase/edit-after.webp" type="image/webp" />
                  <img src="/showcase/edit-after.jpg" alt="2700K Dusk" className="h-full w-full object-cover" />
                </picture>
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
                >
                  <picture className="block h-full w-full">
                    <source srcSet="/showcase/edit-before.webp" type="image/webp" />
                    <img src="/showcase/edit-before.jpg" alt="Daylight" className="h-full w-full object-cover" />
                  </picture>
                </div>
                <div
                  className="pointer-events-none absolute inset-y-0 w-[1.5px] bg-[#6F9AB5]"
                  style={{ left: `${splitPct}%` }}
                />
                <span className="font-mono-tech absolute bottom-1.5 left-1.5 bg-black/85 px-1.5 py-0.5 text-[8.5px] text-[#D4D4D4] uppercase">
                  5200K
                </span>
                <span className="font-mono-tech absolute bottom-1.5 right-1.5 bg-[#1F5B7C] px-1.5 py-0.5 text-[8.5px] text-white uppercase">
                  2700K
                </span>
                <BayerCurtainCanvas progress={revealProgress} />
              </div>

              <div className="flex items-center justify-between gap-3 font-mono-tech text-[9.5px] text-[#737373]">
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={splitPct}
                  onChange={(e) => setSplitPct(Number(e.target.value))}
                  aria-label="Compare daylight and 2700K relight"
                  className="gyra-slider flex-1"
                />
                <span className="text-[#9AB7CA]">SSIM 0.994</span>
              </div>
            </div>
          </div>
        )}

        {/* SCENE 03 · VIDEO: Pure-Black Cinema Monitor + E2B Vertical Metrics Ledger */}
        {activeModality === "video" && (
          <div key="scene-video" className="gyra-scene-glide grid h-full grid-cols-1 divide-y divide-white/10 sm:grid-cols-12 sm:divide-x sm:divide-y-0">
            <div className="relative flex items-center justify-center bg-black p-3.5 sm:col-span-8 sm:p-5">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[4px] border border-white/12 bg-black">
                <video
                  src="/products-hero-bg.mp4"
                  poster="/video-samples/headset-f001.webp"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/25" />
                <div className="font-mono-tech absolute left-2.5 right-2.5 top-2 flex items-center justify-between text-[9px] text-[#C5DFEE]">
                  <span>LTX-VIDEO 13B</span>
                  <span>F{String(videoFrame).padStart(3, "0")} / 121</span>
                </div>
                <BayerCurtainCanvas progress={revealProgress} />
              </div>
            </div>

            <div className="flex flex-col justify-between bg-black px-4 py-3.5 font-mono-tech text-[10.5px] sm:col-span-4 sm:py-5">
              <div className="border-b border-white/10 pb-2 text-[9.5px] tracking-[0.12em] text-[#737373] uppercase">
                RENDER · TELEMETRY
              </div>
              <div className="space-y-2.5 py-2">
                {[
                  ["ENGINE", "LTX-13B"],
                  ["RESOLUTION", "720P"],
                  ["FRAME RATE", "24 FPS"],
                  ["FRAMES", "121"],
                  ["ANCHOR", "LOCKED"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-[#666666]">{k}</span>
                    <span className={v === "LOCKED" ? "text-[#5B9EC2]" : "text-white"}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="border border-[#5B9EC2]/70 py-1.5 text-center text-[9.5px] tracking-[0.14em] text-[#9CC4DC] uppercase">
                RENDER · VERIFIED
              </div>
            </div>
          </div>
        )}

        {/* SCENE 04 · AUDIO: Exact E2B FINANCIAL Dither-Dot Step Curve + Voice Telemetry Ledger */}
        {activeModality === "audio" && (
          <div key="scene-audio" className="gyra-scene-glide grid h-full grid-cols-1 divide-y divide-white/10 sm:grid-cols-12 sm:divide-x sm:divide-y-0">
            <div className="relative h-[200px] bg-black p-2 sm:col-span-8 sm:h-full sm:p-3">
              <DitherAudioSpectrumCanvas progress={revealProgress} playing={audioPlaying} />
            </div>

            <div className="flex flex-col justify-between bg-black px-4 py-3 font-mono-tech text-[10.5px] sm:col-span-4 sm:py-5">
              <div className="border-b border-white/10 pb-2 text-[9.5px] tracking-[0.12em] text-[#737373] uppercase">
                VOICE · RESULTS
              </div>
              <div className="space-y-2 py-2">
                {[
                  ["MODEL", "NOVA"],
                  ["SAMPLE", "48KHZ"],
                  ["ALIGN", "WHISPER"],
                  ["LATENCY", "140MS"],
                  ["SIGNAL", "-14 LUFS"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-[#666666]">{k}</span>
                    <span className={k === "SIGNAL" ? "text-[#5B9EC2]" : "text-white"}>{v}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleToggleAudio}
                className="w-full border border-[#5B9EC2]/75 bg-black py-1.5 text-center text-[9.5px] tracking-[0.14em] text-[#9CC4DC] uppercase transition-colors hover:bg-[#0B2233] hover:text-white cursor-pointer"
              >
                {audioPlaying ? "■ STOP · 48KHZ" : "▶ PLAY · VERIFIED"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. EXACT E2B BOTTOM STATUS TELEMETRY BAR (BOOTED FROM SNAPSHOT · • UPTIME 04:37:xx) */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/12 bg-black px-3.5 py-2.5 font-mono-tech text-[10px] tracking-[0.1em] uppercase sm:px-4">
        <span className="text-[#CCCCCC]">GYRA CORE · EDGE MESH ACTIVE</span>
        <span className="inline-flex shrink-0 items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5B9EC2]" />
          <span className="text-[#666666]">SESSION TRACE</span>
          <span className="text-white">{formatUptime(uptimeSec)}</span>
        </span>
      </div>
    </div>
  );
}
