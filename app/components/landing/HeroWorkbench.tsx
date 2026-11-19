"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Pause, Play, RotateCcw, Terminal } from "lucide-react";
import { resolveGyraRoute } from "../../lib/landingSimulations";

export interface HeroWorkbenchProps {
  isAuthenticated?: boolean;
  routeBase?: string;
}

type HeroSceneId = "chat" | "image" | "video" | "api";

interface HeroScene {
  id: HeroSceneId;
  tabLabel: string;
  sessionTitle: string;
  hostTag: string;
  runtimeLabel: string;
  footerLeft: string;
  lines: {
    prefix: string;
    text: string;
    accent?: "vermilion" | "white" | "muted";
  }[];
}

const HERO_SCENES: HeroScene[] = [
  {
    id: "chat",
    tabLabel: "Chat",
    sessionTitle: "gyra-chat",
    hostTag: "@ super-2.0",
    runtimeLabel: "super-2.0",
    footerLeft: "6-AGENT BUILD PIPELINE",
    lines: [
      { prefix: "$", text: "gyra chat --model super-2.0", accent: "vermilion" },
      { prefix: "✓", text: "atlas · spec & threat check", accent: "white" },
      { prefix: "agent>", text: "architect: webhook route + limiter", accent: "muted" },
      { prefix: "agent>", text: "forge: write webhook.ts +86", accent: "white" },
      { prefix: "agent>", text: "sentinel: verify timingSafeEqual", accent: "muted" },
      { prefix: "✓", text: "hmac + replay guard passed — 3.4s", accent: "vermilion" },
    ],
  },
  {
    id: "image",
    tabLabel: "Image",
    sessionTitle: "gyra-image",
    hostTag: "@ pro-ultra",
    runtimeLabel: "pro-ultra",
    footerLeft: "GEOMETRY-LOCKED I2I EDIT",
    lines: [
      { prefix: "$", text: "gyra image edit --pro-ultra", accent: "vermilion" },
      { prefix: "✓", text: "source frame loaded · 1440×1080", accent: "white" },
      { prefix: "edit>", text: "shift sky → blue-hour dusk", accent: "muted" },
      { prefix: "edit>", text: "lamp emitter → 2700K tungsten", accent: "white" },
      { prefix: "edit>", text: "geometry preservation · 100%", accent: "muted" },
      { prefix: "✓", text: "render complete — 2.6s", accent: "vermilion" },
    ],
  },
  {
    id: "video",
    tabLabel: "Video",
    sessionTitle: "gyra-studio",
    hostTag: "@ ltx-13b",
    runtimeLabel: "720p · 24fps",
    footerLeft: "TEXT & IMAGE-TO-VIDEO STUDIO",
    lines: [
      { prefix: "$", text: "gyra video render --aspect 16:9", accent: "vermilion" },
      { prefix: "✓", text: "reference frame attached (001)", accent: "white" },
      { prefix: "motion>", text: "slow aerial glide · lagos bridge", accent: "muted" },
      { prefix: "motion>", text: "synthesizing 121 frames @ 24fps", accent: "white" },
      { prefix: "queue>", text: "async worker · $2.00 / render", accent: "muted" },
      { prefix: "✓", text: "mp4 stream ready", accent: "vermilion" },
    ],
  },
  {
    id: "api",
    tabLabel: "API",
    sessionTitle: "gyra-api",
    hostTag: "@ v1/rest",
    runtimeLabel: "openai-compat",
    footerLeft: "OPENAI-COMPATIBLE ENDPOINTS",
    lines: [
      { prefix: "$", text: "POST https://gyra.ng/api/v1/chat", accent: "vermilion" },
      { prefix: "✓", text: "auth: scoped bearer key ok", accent: "white" },
      { prefix: "route>", text: "model: gyra-super2.0", accent: "muted" },
      { prefix: "route>", text: "stream: sse · rate limit ok", accent: "white" },
      { prefix: "200>", text: "choices[0].finish_reason: stop", accent: "muted" },
      { prefix: "✓", text: "response delivered — 410ms", accent: "vermilion" },
    ],
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

function formatClock(seconds: number): string {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

export function HeroWorkbench({
  isAuthenticated = false,
  routeBase = "",
}: HeroWorkbenchProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState(HERO_SCENES[0].lines.length);
  const [isPaused, setIsPaused] = useState(false);
  const [uptimeSec, setUptimeSec] = useState(147);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const activeScene = HERO_SCENES[sceneIndex];

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || isPaused) return;

    const tick = window.setInterval(() => {
      setUptimeSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(tick);
  }, [isPaused]);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setVisibleLines(activeScene.lines.length);
      return;
    }

    if (isPaused) return;

    setVisibleLines(1);
    let current = 1;
    const lineTimer = window.setInterval(() => {
      current += 1;
      if (current <= activeScene.lines.length) {
        setVisibleLines(current);
      } else {
        window.clearInterval(lineTimer);
      }
    }, 460);

    const cycleTimer = window.setTimeout(() => {
      setSceneIndex((prev) => (prev + 1) % HERO_SCENES.length);
    }, 6400);

    return () => {
      window.clearInterval(lineTimer);
      window.clearTimeout(cycleTimer);
    };
  }, [sceneIndex, isPaused, activeScene.lines.length]);

  const selectScene = (idx: number) => {
    setSceneIndex(idx);
    setVisibleLines(HERO_SCENES[idx].lines.length);
    setIsPaused(true);
  };

  const replayScene = () => {
    setIsPaused(false);
    setVisibleLines(1);
    setSceneIndex((prev) => prev);
    // Force step restart even on same index
    let current = 1;
    const timer = window.setInterval(() => {
      current += 1;
      if (current <= activeScene.lines.length) {
        setVisibleLines(current);
      } else {
        window.clearInterval(timer);
      }
    }, 320);
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

  return (
    <section className="border-b border-[#1F1F1F] bg-black">
      <div className="mx-auto max-w-[1380px] px-5 pb-16 pt-12 sm:px-8 lg:pb-24 lg:pt-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left 5 cols — Bold Industrial Typography & Crisp 0px CTAs */}
          <div className="flex flex-col lg:col-span-5">
            <p className="font-mono-tech text-[12px] tracking-[0.14em] text-[#8A8A8A] uppercase">
              [ Genvia AI Company ]
            </p>

            <h1 className="font-display mt-5 text-[clamp(3.15rem,5.4vw,4.85rem)] font-bold leading-[0.94] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
              One intelligence.
              <br />
              Every medium.
            </h1>

            <p className="mt-6 max-w-[46ch] text-[16px] leading-[1.6] text-[#A3A3A3] sm:text-[17px]">
              Gyra unites conversational reasoning, precision image generation and editing,
              cinematic video studio workflows, and OpenAI-compatible APIs on one engineered
              platform.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={resolveGyraRoute("/dashboard", routeBase)}
                className="font-mono-tech inline-flex min-h-[46px] shrink-0 items-center justify-center whitespace-nowrap bg-[#FF3D00] px-6 text-[13px] font-medium tracking-[0.1em] text-white uppercase transition-colors duration-150 hover:bg-[#FF551F] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
              >
                {isAuthenticated ? "Open Dashboard" : "Start with Gyra"}
              </a>
              <a
                href={resolveGyraRoute("/api", routeBase)}
                className="font-mono-tech inline-flex min-h-[46px] shrink-0 items-center justify-center whitespace-nowrap border border-[#3A3A3A] bg-black px-6 text-[13px] font-medium tracking-[0.1em] text-white uppercase transition-colors duration-150 hover:border-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00]"
              >
                Explore API
              </a>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={copyQuickCurl}
                className="font-mono-tech inline-flex items-center gap-2.5 text-[12px] tracking-[0.1em] text-[#7A7A7A] uppercase transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00]"
              >
                {copiedCmd ? (
                  <Check className="h-3.5 w-3.5 text-[#FF3D00]" />
                ) : (
                  <Terminal className="h-3.5 w-3.5 text-[#7A7A7A]" />
                )}
                <span>
                  {copiedCmd ? "Copied /api/v1/chat cURL snippet" : "Copy quickstart API command"}
                </span>
                <Copy className="h-3 w-3 opacity-60" />
              </button>
            </div>
          </div>

          {/* Right 7 cols — Live Dual-Pane Industrial Execution Machine */}
          <div className="lg:col-span-7">
            <figure
              aria-label="Live interactive preview of Gyra Chat, Gyra Image, Gyra Video, and Gyra API"
              className="border border-[#262626] bg-black"
            >
              {/* Hardware Console Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F1F1F] bg-[#050505] px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-5 border-y border-[#4A4A4A]" aria-hidden="true" />
                  <span className="font-mono-tech text-[12px] text-white">
                    {activeScene.sessionTitle}
                  </span>
                  <span className="font-mono-tech text-[12px] text-[#6E6E6E]">
                    {activeScene.hostTag}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPaused((p) => !p)}
                    aria-label={isPaused ? "Resume live demo" : "Pause live demo"}
                    className="inline-flex h-7 w-7 items-center justify-center border border-[#262626] bg-black text-[#A3A3A3] transition-colors hover:border-[#4A4A4A] hover:text-white"
                  >
                    {isPaused ? (
                      <Play className="h-3 w-3" />
                    ) : (
                      <Pause className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={replayScene}
                    aria-label="Replay current modality trace"
                    className="inline-flex h-7 w-7 items-center justify-center border border-[#262626] bg-black text-[#A3A3A3] transition-colors hover:border-[#4A4A4A] hover:text-white"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                  <span className="font-mono-tech border border-[#2A2A2A] bg-black px-2.5 py-1 text-[11px] text-[#CCCCCC]">
                    {activeScene.runtimeLabel}
                  </span>
                </div>
              </div>

              {/* Dual-Pane Live Execution Stage */}
              <div className="grid min-h-[310px] grid-cols-1 divide-y divide-[#1F1F1F] sm:grid-cols-12 sm:divide-x sm:divide-y-0">
                {/* Left 5 cols: Live Streaming Terminal */}
                <div className="flex flex-col justify-between bg-black p-5 sm:col-span-5">
                  <div className="space-y-2.5 font-mono-tech text-[12px] leading-[1.65]">
                    {activeScene.lines.slice(0, visibleLines).map((line, index) => {
                      const isLast = index === visibleLines - 1;
                      return (
                        <div key={`${activeScene.id}-${index}`} className="flex gap-2">
                          <span
                            className={`shrink-0 ${
                              line.accent === "vermilion"
                                ? "text-[#FF3D00]"
                                : line.accent === "white"
                                  ? "text-white"
                                  : "text-[#666666]"
                            }`}
                          >
                            {line.prefix}
                          </span>
                          <span
                            className={
                              line.accent === "vermilion"
                                ? "text-[#F5F5F5]"
                                : line.accent === "white"
                                  ? "text-[#D4D4D4]"
                                  : "text-[#7A7A7A]"
                            }
                          >
                            {line.text}
                            {isLast && <span className="gyra-cursor ml-1.5" aria-hidden="true" />}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-[#161616] pt-3 font-mono-tech text-[11px] text-[#666666]">
                    <span>PIPELINE STATE</span>
                    <span className="text-[#FF3D00]">
                      {visibleLines >= activeScene.lines.length ? "READY" : "EXECUTING"}
                    </span>
                  </div>
                </div>

                {/* Right 7 cols: Live Modality Output Viewport + Vermilion Halftone Dither Reveal */}
                <div className="relative flex items-center justify-center overflow-hidden bg-[#030303] p-5 sm:col-span-7">
                  {activeScene.id === "chat" && (
                    <div className="relative w-full border border-[#242424] bg-black">
                      <div className="flex items-center justify-between border-b border-[#1A1A1A] px-3 py-2 font-mono-tech text-[10px] text-[#808080]">
                        <span className="text-[#CCCCCC]">webhook-handler.ts</span>
                        <span className="text-[#FF3D00]">SENTINEL VERIFIED</span>
                      </div>
                      <pre className="overflow-hidden px-3.5 py-3 font-mono-tech text-[11px] leading-[1.6] text-[#C8C8C8]">
                        <code>{`export async function POST(req: Request) {
  const sig = req.headers.get("x-hmac-256");
  const raw = await req.text();
  const mac = createHmac("sha256", SECRET)
    .update(raw).digest();
  if (!timingSafeEqual(buf(sig), mac)) {
    return Response.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }
  return Response.json({ ok: true });
}`}</code>
                      </pre>
                      {!isPaused && (
                        <div
                          aria-hidden="true"
                          className="gyra-dither-sweep gyra-scan-motion pointer-events-none absolute inset-y-0 w-24"
                        />
                      )}
                    </div>
                  )}

                  {activeScene.id === "image" && (
                    <div className="relative aspect-[4/3] w-full overflow-hidden border border-[#242424] bg-black">
                      <img
                        src="/showcase/edit-after.jpg"
                        alt="Gyra Pro Ultra tungsten dusk studio transformation"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: "inset(0 54% 0 0)" }}
                      >
                        <img
                          src="/showcase/edit-before.jpg"
                          alt="Original daylight studio interior"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-0 left-[46%] w-[2px] bg-[#FF3D00]"
                      />
                      <div
                        aria-hidden="true"
                        className="gyra-dither-sweep pointer-events-none absolute inset-y-0 left-[46%] w-16 opacity-85"
                      />
                      <div className="font-mono-tech absolute bottom-2 left-2 bg-black/90 px-2 py-0.5 text-[10px] text-[#CCCCCC] uppercase">
                        Original
                      </div>
                      <div className="font-mono-tech absolute bottom-2 right-2 bg-[#FF3D00] px-2 py-0.5 text-[10px] font-medium text-white uppercase">
                        Pro Ultra
                      </div>
                    </div>
                  )}

                  {activeScene.id === "video" && (
                    <div className="relative aspect-[16/10] w-full overflow-hidden border border-[#242424] bg-black">
                      <video
                        src="/products-hero-bg.mp4"
                        poster="/products-hero-poster.jpg"
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="h-full w-full object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />
                      <div className="font-mono-tech absolute left-2.5 top-2.5 border border-[#FF3D00]/70 bg-black/85 px-2 py-0.5 text-[10px] text-white uppercase">
                        LTX-13B · 16:9
                      </div>
                      <div className="font-mono-tech absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-[#D4D4D4]">
                        <span>720P · 24 FPS · 121 FRAMES</span>
                        <span className="text-[#FF3D00]">GYRA STUDIO</span>
                      </div>
                    </div>
                  )}

                  {activeScene.id === "api" && (
                    <div className="relative w-full border border-[#242424] bg-black">
                      <div className="flex items-center justify-between border-b border-[#1A1A1A] px-3 py-2 font-mono-tech text-[10px] text-[#808080]">
                        <span className="text-white">POST /api/v1/chat</span>
                        <span className="text-[#FF3D00]">200 OK</span>
                      </div>
                      <pre className="overflow-hidden px-3.5 py-3 font-mono-tech text-[11px] leading-[1.6] text-[#C8C8C8]">
                        <code>{`{
  "id": "chatcmpl-gyra-9041",
  "object": "chat.completion",
  "model": "gyra-super2.0",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Idempotency key verified..."
    },
    "finish_reason": "stop"
  }]
}`}</code>
                      </pre>
                      {!isPaused && (
                        <div
                          aria-hidden="true"
                          className="gyra-dither-sweep gyra-scan-motion pointer-events-none absolute inset-y-0 w-24"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Console Telemetry Sub-Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1F1F1F] bg-[#040404] px-4 py-2.5 font-mono-tech text-[11px] tracking-[0.08em] uppercase">
                <span className="text-[#D4D4D4]">{activeScene.footerLeft}</span>
                <span className="text-[#808080]">
                  SESSION <span className="text-white">{formatClock(uptimeSec)}</span>
                </span>
              </div>

              {/* Bottom 4-Tab Modality Selector (E2B Industrial Bar) */}
              <div
                role="tablist"
                aria-label="Hero modality scenes"
                className="grid grid-cols-4 border-t border-[#1F1F1F] bg-black p-1.5"
              >
                {HERO_SCENES.map((scene, idx) => {
                  const active = idx === sceneIndex;
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => selectScene(idx)}
                      className={`font-mono-tech min-h-[38px] px-2 text-[11px] tracking-[0.12em] uppercase transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00] ${
                        active
                          ? "bg-[#1A1A1A] text-white ring-1 ring-inset ring-[#FF3D00]/60"
                          : "bg-black text-[#737373] hover:text-[#D4D4D4]"
                      }`}
                    >
                      {scene.tabLabel}
                    </button>
                  );
                })}
              </div>
            </figure>
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
                <span className="h-1.5 w-1.5 shrink-0 bg-[#FF3D00]" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
