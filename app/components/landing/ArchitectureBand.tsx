"use client";

import { useEffect, useRef, useState } from "react";
import { Layers, Pause, Play } from "lucide-react";
import { computeRemainingMs } from "../../lib/carouselPhysics";
import { resolveGyraRoute } from "../../lib/landingSimulations";

export interface ArchitectureBandProps {
  routeBase?: string;
}

type CoreModuleId = "core" | "chat" | "image" | "video" | "api" | "genvia";

interface ModuleSpec {
  id: CoreModuleId;
  code: string;
  tabLabel: string;
  kicker: string;
  headline: string;
  summary: string;
  endpoint: string;
  specs: { label: string; value: string }[];
}

const MODULE_SPECS: Record<CoreModuleId, ModuleSpec> = {
  genvia: {
    id: "genvia",
    code: "L0",
    tabLabel: "Genvia",
    kicker: "L0 · Parent AI Company",
    headline: "Genvia AI Company",
    summary:
      "Governs the unified models, safety policies, identity boundaries, and multimodal compute layer powering every Gyra surface.",
    endpoint: "Governance · Policy · Infrastructure",
    specs: [
      { label: "Ownership", value: "Genvia AI Company · Unified Ecosystem" },
      { label: "Surfaces", value: "Web · Android · Telegram (@GyraAi) · API" },
      { label: "Safety", value: "Server-verified auth, moderation & quotas" },
      { label: "Identity", value: "Single account & unified credits ledger" },
    ],
  },
  core: {
    id: "core",
    code: "L1",
    tabLabel: "Core",
    kicker: "L1 · Machined Intelligence Core",
    headline: "One core orchestrating every modality.",
    summary:
      "Every prompt, reference image, video brief, and REST call flows through Understand → Orchestrate → Execute on one shared silicon router.",
    endpoint: "Understand → Orchestrate → Execute",
    specs: [
      { label: "Reasoning", value: "Gyra 1.0 (fast) · SuperGyra 2.0 (deep)" },
      { label: "Agents", value: "Atlas · Orion · Architect · Forge · Sentinel · Mentor" },
      { label: "Image Engine", value: "Flux Dev · Gyra Pro Ultra I2I" },
      { label: "Video Engine", value: "LTX-Video 13B · 720p · 24 fps · 121 frames" },
    ],
  },
  chat: {
    id: "chat",
    code: "01",
    tabLabel: "Chat",
    kicker: "01 · Reasoning & 6-Agent Core",
    headline: "Gyra Chat",
    summary:
      "Fast everyday inference on Gyra 1.0 paired with SuperGyra 2.0 deep reasoning, six-agent engineering pipelines, PDF RAG, vision, and voice.",
    endpoint: "POST /api/v1/chat · /dashboard",
    specs: [
      { label: "Models", value: "Gyra 1.0 · SuperGyra 2.0" },
      { label: "Agents", value: "6-stage verified build & security QA pipeline" },
      { label: "Grounding", value: "Live web search, PDFs, codebases & images" },
      { label: "Delivery", value: "Low-latency SSE token streaming" },
    ],
  },
  image: {
    id: "image",
    code: "02",
    tabLabel: "Image",
    kicker: "02 · Synthesis & Geometry-Locked I2I",
    headline: "Gyra Image",
    summary:
      "High-resolution text-to-image synthesis via Flux Dev and pixel-registered architectural lighting & scene editing via Gyra Pro Ultra I2I.",
    endpoint: "POST /api/fal/proxy · Image Tools",
    specs: [
      { label: "Text-to-Image", value: "Flux Dev high-fidelity synthesis" },
      { label: "Image Edit", value: "Gyra Pro Ultra (geometry-locked I2I)" },
      { label: "Workflows", value: "Lighting relights, product studies & UI edits" },
      { label: "Security", value: "Authenticated server-side proxy boundary" },
    ],
  },
  video: {
    id: "video",
    code: "03",
    tabLabel: "Video",
    kicker: "03 · Cinematic 720p Studio Motion",
    headline: "Gyra Video",
    summary:
      "Direct 720p, 24 fps clips from text or attached Reference Frame 001 with 16:9 and 9:16 framing inside an async Studio render queue.",
    endpoint: "POST /api/v1/video/generate · /studio",
    specs: [
      { label: "Model", value: "LTX-Video 13B · 121 frames (5.0s)" },
      { label: "Inputs", value: "Text-to-Video & Image-to-Video frame anchor" },
      { label: "Framing", value: "Widescreen 16:9 & vertical 9:16 presets" },
      { label: "Queue", value: "Async status polling & automatic refund guard" },
    ],
  },
  api: {
    id: "api",
    code: "04",
    tabLabel: "API",
    kicker: "04 · OpenAI-Compat REST & Media",
    headline: "Gyra API Platform",
    summary:
      "Drop-in OpenAI-compatible chat completions, voice synthesis, Whisper transcription, video queues, and media extraction under scoped keys.",
    endpoint: "https://gyra.ng/api/v1/*",
    specs: [
      { label: "Chat & Voice", value: "/api/v1/chat · /api/v1/voice · /api/v1/transcribe" },
      { label: "Video Queue", value: "/api/v1/video/generate · /status/[id]" },
      { label: "Media API", value: "YouTube transcripts · TikTok · Spotify" },
      { label: "Governance", value: "Category-scoped Bearer keys & usage console" },
    ],
  },
};

const PRODUCT_IDS: ("chat" | "image" | "video" | "api")[] = ["chat", "image", "video", "api"];

const CONDUIT_PATHS: Record<"chat" | "image" | "video" | "api", string> = {
  chat: "M 332 326 C 266 368, 210 388, 172 448",
  image: "M 380 340 C 356 386, 340 426, 326 496",
  video: "M 440 340 C 464 386, 480 426, 494 496",
  api: "M 488 326 C 554 368, 610 388, 648 448",
};

export function ArchitectureBand({ routeBase = "" }: ArchitectureBandProps) {
  const [activeId, setActiveId] = useState<CoreModuleId>("chat");
  const [exploded, setExploded] = useState(false);
  const [autoCascade, setAutoCascade] = useState(true);
  const [activeDie, setActiveDie] = useState(2);

  const timerRef = useRef<{
    id: number | null;
    startedAt: number;
    duration: number;
    remaining: number;
  }>({ id: null, startedAt: 0, duration: 3600, remaining: 3600 });

  // Respect prefers-reduced-motion on initial mount
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setAutoCascade(false);
    }
  }, []);

  // Visibility-safe gentle cascade cycling through Chat -> Image -> Video -> API
  useEffect(() => {
    if (!autoCascade) {
      if (timerRef.current.id !== null) {
        window.clearTimeout(timerRef.current.id);
        timerRef.current.id = null;
      }
      return;
    }

    const scheduleNext = (delay: number) => {
      if (timerRef.current.id !== null) window.clearTimeout(timerRef.current.id);
      timerRef.current.startedAt = performance.now();
      timerRef.current.duration = delay;
      timerRef.current.remaining = delay;
      if (document.hidden) return;
      timerRef.current.id = window.setTimeout(() => {
        setActiveId((prev) => {
          const idx = PRODUCT_IDS.indexOf(prev as "chat" | "image" | "video" | "api");
          return PRODUCT_IDS[(idx + 1) % PRODUCT_IDS.length];
        });
      }, delay);
    };

    scheduleNext(3800);

    const onVis = () => {
      if (document.hidden) {
        if (timerRef.current.id !== null) {
          timerRef.current.remaining = computeRemainingMs(
            timerRef.current.startedAt,
            timerRef.current.duration,
            performance.now(),
          );
          window.clearTimeout(timerRef.current.id);
          timerRef.current.id = null;
        }
      } else if (autoCascade && timerRef.current.id === null) {
        scheduleNext(Math.max(500, timerRef.current.remaining));
      }
    };

    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (timerRef.current.id !== null) {
        window.clearTimeout(timerRef.current.id);
        timerRef.current.id = null;
      }
    };
  }, [autoCascade, activeId]);

  // Animate internal silicon die progression whenever activeId changes
  useEffect(() => {
    setActiveDie(0);
    const t1 = window.setTimeout(() => setActiveDie(1), 320);
    const t2 = window.setTimeout(() => setActiveDie(2), 680);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [activeId]);

  const active = MODULE_SPECS[activeId];
  const isProductActive = PRODUCT_IDS.includes(activeId as "chat" | "image" | "video" | "api");

  const selectModule = (id: CoreModuleId) => {
    setAutoCascade(false);
    setActiveId(id);
  };

  return (
    <section
      id="architecture"
      className="gyra-band-defer border-b border-[#DCE4EC] bg-[#F6F8FA] py-24 transition-colors duration-200 lg:py-32 dark:border-[#1F1F1F] dark:bg-black"
    >
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
        {/* Section Heading */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="font-mono-tech text-[12px] tracking-[0.14em] text-[#164E6D] uppercase dark:text-[#78B0CE]">
              [ System Architecture · Unified Core ]
            </p>
            <h2 className="font-display mt-3.5 text-[clamp(2.5rem,4.4vw,4rem)] leading-[0.95] tracking-[-0.02em] uppercase [text-wrap:balance]">
              <span className="font-light text-[#4A5C6E] dark:text-white/75">One intelligence core.</span>
              <br />
              <span className="font-bold text-[#0B1218] dark:text-white">Every product runs on it.</span>
            </h2>
            <p className="mt-4 max-w-[58ch] text-[15.5px] leading-[1.6] text-[#4A5B6B] dark:text-[#9A9A9A]">
              Built by Genvia AI Company as a unified ecosystem — click any 3D stratum or product
              plinth to inspect how requests travel through one engineered core.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setExploded((v) => !v)}
              aria-pressed={exploded}
              className={`font-mono-tech inline-flex min-h-[38px] items-center gap-2 border px-3.5 text-[11px] tracking-[0.09em] uppercase transition-colors cursor-pointer ${
                exploded
                  ? "border-[#78B0CE] bg-[#0D273B] text-white"
                  : "border-[#CBD7E3] bg-white text-[#354656] hover:border-[#1B587A] hover:text-[#0B1218] dark:border-[#223546] dark:bg-[#050A10] dark:text-[#B8CBD9] dark:hover:border-[#5B9EC2] dark:hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{exploded ? "Stack Compact" : "Exploded 3D View"}</span>
            </button>
            <button
              type="button"
              onClick={() => setAutoCascade((v) => !v)}
              aria-pressed={autoCascade}
              className={`font-mono-tech inline-flex min-h-[38px] items-center gap-2 border px-3.5 text-[11px] tracking-[0.09em] uppercase transition-colors cursor-pointer ${
                autoCascade
                  ? "border-[#5B9EC2] bg-[#1F5B7C] text-white"
                  : "border-[#CBD7E3] bg-white text-[#354656] hover:border-[#1B587A] hover:text-[#0B1218] dark:border-[#223546] dark:bg-[#050A10] dark:text-[#B8CBD9] dark:hover:border-[#5B9EC2] dark:hover:text-white"
              }`}
            >
              {autoCascade ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{autoCascade ? "Live Cascade" : "Manual"}</span>
            </button>
          </div>
        </div>

        {/* Living 3D Machined Isometric Core + Editorial Spec Inspector */}
        <div className="mt-12 grid grid-cols-1 border border-[#D4DFE9] bg-white shadow-[0_22px_60px_-34px_rgba(11,18,24,0.18)] lg:grid-cols-12 dark:border-[#192836] dark:bg-black dark:shadow-none">
          {/* Left 7 cols: Living 3D Isometric Machined Silicon Strata (Adv 04) */}
          <div
            className="relative flex items-center justify-center overflow-hidden border-b border-[#192836] px-4 py-8 sm:px-6 lg:col-span-7 lg:border-b-0 lg:border-r"
            style={{
              background:
                "radial-gradient(ellipse 68% 58% at 50% 46%, rgba(31, 91, 124, 0.22) 0%, #02060B 62%, #000000 100%)",
            }}
          >
            <svg
              viewBox="0 0 840 650"
              className="h-auto w-full max-w-[760px] select-none overflow-visible"
              role="group"
              aria-labelledby="gyra-arch-svg-title"
            >
              <title id="gyra-arch-svg-title">
                Living 3D isometric machined silicon architecture of Gyra: Genvia parent crest
                above, Gyra Intelligence Core silicon wafer in middle, and four elevated product
                plinths below.
              </title>
              <defs>
                <linearGradient id="gyraWaferTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#296E93" />
                  <stop offset="52%" stopColor="#1B4F6D" />
                  <stop offset="100%" stopColor="#0E2E42" />
                </linearGradient>
                <linearGradient id="gyraWaferSideL" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#153E56" />
                  <stop offset="100%" stopColor="#0B2230" />
                </linearGradient>
                <linearGradient id="gyraWaferSideR" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0C2636" />
                  <stop offset="100%" stopColor="#06141E" />
                </linearGradient>
                <linearGradient id="gyraCrestTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1A3245" />
                  <stop offset="100%" stopColor="#08121B" />
                </linearGradient>
                <linearGradient id="gyraModTop" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#153247" />
                  <stop offset="100%" stopColor="#08131D" />
                </linearGradient>
                <linearGradient id="gyraModTopActive" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#286E94" />
                  <stop offset="100%" stopColor="#11374D" />
                </linearGradient>
                <linearGradient id="gyraShaftBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9CC4DC" stopOpacity="0.48" />
                  <stop offset="100%" stopColor="#1F5B7C" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="gyraShaftOk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4A9A80" stopOpacity="0.48" />
                  <stop offset="100%" stopColor="#4A9A80" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Baseplate Engineering Floor Grid */}
              <g
                style={{
                  transform: exploded ? "translateY(18px)" : "translateY(0px)",
                  transition: "transform 480ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <polygon
                  points="410,418 776,538 410,632 44,538"
                  fill="#03070B"
                  stroke="#162838"
                  strokeWidth="1.2"
                />
                <line x1="136" y1="508" x2="502" y2="608" stroke="#0E1B26" strokeWidth="1" />
                <line x1="227" y1="478" x2="593" y2="585" stroke="#0E1B26" strokeWidth="1" />
                <line x1="318" y1="448" x2="684" y2="562" stroke="#0E1B26" strokeWidth="1" />
                <line x1="684" y1="508" x2="318" y2="608" stroke="#0E1B26" strokeWidth="1" />
                <line x1="593" y1="478" x2="227" y2="585" stroke="#0E1B26" strokeWidth="1" />
                <line x1="502" y1="448" x2="136" y2="562" stroke="#0E1B26" strokeWidth="1" />
                <text
                  x="410"
                  y="614"
                  textAnchor="middle"
                  fill="#507189"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9"
                  letterSpacing="2"
                >
                  GYRA UNIFIED RUNTIME FABRIC · WEB · ANDROID · TELEGRAM · REST API V1
                </text>
              </g>

              {/* Exploded-View Layer Callouts */}
              <g
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="#78B0CE"
                letterSpacing="1.3"
                style={{ opacity: exploded ? 1 : 0, transition: "opacity 320ms ease" }}
              >
                <line x1="556" y1="64" x2="668" y2="64" stroke="#366B8B" strokeDasharray="3 3" />
                <text x="674" y="67">L0 · GENVIA PARENT</text>

                <line x1="668" y1="255" x2="710" y2="255" stroke="#366B8B" strokeDasharray="3 3" />
                <text x="716" y="258">L1 · CORE WAFER</text>

                <line x1="744" y1="454" x2="760" y2="454" stroke="#366B8B" strokeDasharray="3 3" />
                <text x="678" y="422">L2 · PRODUCT PLINTHS</text>
              </g>

              {/* Optical Conduits & Light Shafts */}
              <g>
                {/* Inbound Surface Stream */}
                <path
                  d="M 86 168 C 150 185, 224 205, 314 236"
                  fill="none"
                  stroke="#2B5672"
                  strokeWidth="1.5"
                />
                <path
                  d="M 86 168 C 150 185, 224 205, 314 236"
                  fill="none"
                  stroke="#9CC4DC"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="gyra-trace-pulse"
                />
                <text x="76" y="152" fill="#8EC2DF" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="1.4">
                  INBOUND REQUEST
                </text>
                <text x="76" y="164" fill="#5D7D94" fontFamily="JetBrains Mono, monospace" fontSize="8.5">
                  WEB · ANDROID · API
                </text>

                {/* Genvia -> Core Governance Tether */}
                <polygon points="392,126 428,126 436,192 384,192" fill="url(#gyraShaftBlue)" opacity="0.34" />
                <line x1="410" y1="126" x2="410" y2="196" stroke="#2D5A76" strokeWidth="1.5" />
                <line
                  x1="410"
                  y1="126"
                  x2="410"
                  y2="196"
                  stroke="#D4ECF9"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="gyra-trace-pulse-fast"
                />

                {/* 4 Optical Light Shafts & Fiber Conduits */}
                {(
                  [
                    { id: "chat" as const, shaft: "318,322 346,331 196,458 148,442", delayCls: "gyra-trace-pulse" },
                    { id: "image" as const, shaft: "366,336 394,344 352,506 300,490", delayCls: "gyra-trace-pulse-delay-1" },
                    { id: "video" as const, shaft: "426,344 454,336 520,490 468,506", delayCls: "gyra-trace-pulse-delay-2" },
                    { id: "api" as const, shaft: "474,331 502,322 672,442 624,458", delayCls: "gyra-trace-pulse-delay-3" },
                  ]
                ).map((item) => {
                  const isAct = activeId === item.id;
                  return (
                    <g key={item.id}>
                      <polygon
                        points={item.shaft}
                        fill={isAct && activeDie === 2 ? "url(#gyraShaftOk)" : "url(#gyraShaftBlue)"}
                        opacity={isAct ? 0.72 : isProductActive ? 0.06 : 0.18}
                        style={{ transition: "opacity 280ms ease" }}
                      />
                      <path
                        d={CONDUIT_PATHS[item.id]}
                        fill="none"
                        stroke={
                          isAct
                            ? activeDie === 2
                              ? "#4A9A80"
                              : "#78B0CE"
                            : isProductActive
                              ? "#152B3B"
                              : "#244860"
                        }
                        strokeWidth={isAct ? 2.6 : 1.5}
                        style={{ transition: "stroke 260ms ease, stroke-width 260ms ease" }}
                      />
                      <path
                        d={CONDUIT_PATHS[item.id]}
                        fill="none"
                        stroke={isAct ? "#FFFFFF" : "#6EB1D4"}
                        strokeWidth={isAct ? 3.0 : 1.8}
                        strokeLinecap="round"
                        className={isAct ? "gyra-trace-pulse-fast" : item.delayCls}
                      />
                    </g>
                  );
                })}
              </g>

              {/* STRATUM 0: GENVIA PARENT CREST */}
              <g
                onClick={() => selectModule("genvia")}
                role="button"
                tabIndex={0}
                aria-label="Inspect Genvia Parent AI Company"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectModule("genvia");
                  }
                }}
                className="cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-[#5B9EC2]"
                style={{
                  transform: exploded ? "translateY(-18px)" : "translateY(0px)",
                  transition: "transform 480ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <polygon
                  points="410,36 554,83 410,130 266,83"
                  fill="url(#gyraCrestTop)"
                  stroke={activeId === "genvia" ? "#FFFFFF" : "#68A8CB"}
                  strokeWidth={activeId === "genvia" ? 2 : 1.4}
                />
                <polyline points="268,83 410,37 552,83" fill="none" stroke="#A7D1E8" strokeWidth="1" opacity="0.7" />
                <polygon points="266,83 410,130 410,145 266,98" fill="#0B1924" stroke="#224358" strokeWidth="1" />
                <polygon points="554,83 410,130 410,145 554,98" fill="#061018" stroke="#183244" strokeWidth="1" />
                <polygon points="410,48 524,83 410,118 296,83" fill="none" stroke="#2F6280" strokeWidth="0.9" strokeDasharray="3 3" />
                <text x="410" y="80" textAnchor="middle" fill="#FFFFFF" fontFamily="Barlow Semi Condensed, sans-serif" fontWeight="700" fontSize="20" letterSpacing="3.4">
                  GENVIA
                </text>
                <text x="410" y="98" textAnchor="middle" fill="#8EC2DF" fontFamily="JetBrains Mono, monospace" fontSize="9.5" letterSpacing="1.8">
                  PARENT AI COMPANY
                </text>
              </g>

              {/* STRATUM 1: GYRA INTELLIGENCE CORE MACHINED WAFER */}
              <g
                onClick={() => selectModule("core")}
                role="button"
                tabIndex={0}
                aria-label="Inspect Gyra Intelligence Core Wafer"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectModule("core");
                  }
                }}
                className="cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-[#5B9EC2]"
                style={{
                  transform: exploded ? "translateY(-4px)" : "translateY(0px)",
                  transition: "transform 480ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <polygon points="410,204 662,286 410,368 158,286" fill="#000000" opacity="0.52" />
                <polygon
                  points="410,174 668,258 410,342 152,258"
                  fill="url(#gyraWaferTop)"
                  stroke={activeId === "core" ? "#FFFFFF" : "#8EC2DF"}
                  strokeWidth={activeId === "core" ? 2.2 : 1.7}
                />
                <polyline points="154,258 410,175 666,258" fill="none" stroke="#D2ECFA" strokeWidth="1.1" opacity="0.85" />
                <polygon points="152,258 410,342 410,372 152,288" fill="url(#gyraWaferSideL)" stroke="#387699" strokeWidth="1.1" />
                <polygon points="668,258 410,342 410,372 668,288" fill="url(#gyraWaferSideR)" stroke="#234F69" strokeWidth="1.1" />
                <polygon points="410,188 634,258 410,328 186,258" fill="none" stroke="#4D8FB3" strokeWidth="0.9" opacity="0.55" />

                {/* Micro-via bus pins */}
                <g stroke="#78B0CE" strokeWidth="1.6" strokeLinecap="round" opacity="0.74">
                  {[210, 234, 258, 282, 306, 330, 354, 378].map((x, idx) => (
                    <line key={`pl-${x}`} x1={x} y1={292 + idx * 8} x2={x} y2={300 + idx * 8} />
                  ))}
                  {[442, 466, 490, 514, 538, 562, 586, 610].map((x, idx) => (
                    <line key={`pr-${x}`} x1={x} y1={348 - idx * 8} x2={x} y2={356 - idx * 8} />
                  ))}
                </g>

                {/* Recessed Silicon Stage Dies: 01 Understand -> 02 Orchestrate -> 03 Execute */}
                {[
                  { idx: 0, pts: "326,216 392,238 326,260 260,238", cx: 326, cy: 241, ledY: 226, label: "01 UNDERSTAND" },
                  { idx: 1, pts: "410,242 478,264 410,286 342,264", cx: 410, cy: 267, ledY: 252, label: "02 ORCHESTRATE" },
                  { idx: 2, pts: "494,268 560,290 494,312 428,290", cx: 494, cy: 293, ledY: 278, label: "03 EXECUTE" },
                ].map((die) => {
                  const isLit = die.idx <= activeDie;
                  const isCurr = die.idx === activeDie;
                  return (
                    <g key={die.label}>
                      <polygon
                        points={die.pts}
                        fill={isCurr ? "#1F5B7C" : isLit ? "#0A2D25" : "#061623"}
                        stroke={isCurr ? "#FFFFFF" : isLit ? "#4A9A80" : "#78B0CE"}
                        strokeWidth="1.3"
                        style={{ transition: "fill 260ms ease, stroke 260ms ease" }}
                      />
                      <circle cx={die.cx} cy={die.ledY} r="2.8" fill={isCurr ? "#FFFFFF" : isLit ? "#4A9A80" : "#5B9EC2"} />
                      <text x={die.cx} y={die.cy} textAnchor="middle" fill="#FFFFFF" fontFamily="JetBrains Mono, monospace" fontSize="9.2" fontWeight="600">
                        {die.label}
                      </text>
                    </g>
                  );
                })}

                <path
                  d="M 326 238 L 410 264 L 494 290"
                  fill="none"
                  stroke="#9CC4DC"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  className="gyra-trace-pulse-fast"
                />

                <text x="530" y="232" textAnchor="middle" fill="#D4ECF9" fontFamily="Barlow Semi Condensed, sans-serif" fontWeight="700" fontSize="14" letterSpacing="2.2">
                  GYRA CORE
                </text>
                <text x="530" y="245" textAnchor="middle" fill="#8EC2DF" fontFamily="JetBrains Mono, monospace" fontSize="8.5" letterSpacing="1.4">
                  SILICON ROUTER
                </text>
              </g>

              {/* STRATUM 2: 4 ELEVATED 3D PRODUCT PLINTH MODULES */}
              <g
                style={{
                  transform: exploded ? "translateY(14px)" : "translateY(0px)",
                  transition: "transform 480ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {[
                  { id: "chat" as const, cx: 172, cy: 450, title: "GYRA CHAT", sub: "6-AGENT CORE" },
                  { id: "image" as const, cx: 326, cy: 506, title: "GYRA IMAGE", sub: "PRO ULTRA I2I" },
                  { id: "video" as const, cx: 494, cy: 506, title: "GYRA VIDEO", sub: "LTX-VIDEO 720P" },
                  { id: "api" as const, cx: 648, cy: 450, title: "GYRA API", sub: "OPENAI V1 + MEDIA" },
                ].map((m) => {
                  const isAct = activeId === m.id;
                  const topPts = `${m.cx},${m.cy - 32} ${m.cx + 96},${m.cy} ${m.cx},${m.cy + 32} ${m.cx - 96},${m.cy}`;
                  const leftPts = `${m.cx - 96},${m.cy} ${m.cx},${m.cy + 32} ${m.cx},${m.cy + 54} ${m.cx - 96},${m.cy + 22}`;
                  const rightPts = `${m.cx + 96},${m.cy} ${m.cx},${m.cy + 32} ${m.cx},${m.cy + 54} ${m.cx + 96},${m.cy + 22}`;
                  return (
                    <g
                      key={m.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Inspect ${m.title}`}
                      onClick={() => selectModule(m.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectModule(m.id);
                        }
                      }}
                      className="cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-[#5B9EC2]"
                      style={{
                        transform: isAct ? "translateY(-10px)" : "translateY(0px)",
                        opacity: isProductActive && !isAct ? 0.56 : 1,
                        transition: "transform 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 260ms ease",
                      }}
                    >
                      <polygon
                        points={topPts}
                        fill={isAct ? "url(#gyraModTopActive)" : "url(#gyraModTop)"}
                        stroke={isAct ? (activeDie === 2 ? "#4A9A80" : "#FFFFFF") : "#5B9EC2"}
                        strokeWidth={isAct ? 1.9 : 1.4}
                      />
                      <polyline
                        points={`${m.cx - 94},${m.cy} ${m.cx},${m.cy - 31} ${m.cx + 94},${m.cy}`}
                        fill="none"
                        stroke="#A7D1E8"
                        strokeWidth="0.9"
                        opacity="0.72"
                      />
                      <polygon points={leftPts} fill="#0B1C29" stroke="#244B63" strokeWidth="1" />
                      <polygon points={rightPts} fill="#06121B" stroke="#183447" strokeWidth="1" />
                      <text x={m.cx} y={m.cy - 2} textAnchor="middle" fill="#FFFFFF" fontFamily="Barlow Semi Condensed, sans-serif" fontWeight="700" fontSize="16" letterSpacing="0.8">
                        {m.title}
                      </text>
                      <text x={m.cx} y={m.cy + 14} textAnchor="middle" fill="#8EC2DF" fontFamily="JetBrains Mono, monospace" fontSize="9">
                        {m.sub}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Right 5 cols: Interactive Module Selector + Razor Hairline Spec Table */}
          <div className="flex flex-col justify-between bg-white p-6 sm:p-7 lg:col-span-5 dark:bg-[#03070C]">
            <div>
              {/* Clean 6-item Architectural Layer/Module Tab Strip */}
              <div
                role="tablist"
                aria-label="Gyra 3D architecture modules"
                className="grid grid-cols-3 border border-[#D4DFE9] bg-[#F4F7FA] sm:grid-cols-6 dark:border-[#192836] dark:bg-[#04090F]"
              >
                {(["genvia", "core", "chat", "image", "video", "api"] as const).map((id) => {
                  const mod = MODULE_SPECS[id];
                  const selected = id === activeId;
                  return (
                    <button
                      key={id}
                      id={`gyra-arch-tab-${id}`}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls="gyra-arch-tabpanel"
                      onClick={() => selectModule(id)}
                      className={`font-mono-tech border-b border-r border-[#D4DFE9] px-2 py-2.5 dark:border-[#192836] text-[10.5px] tracking-[0.06em] uppercase transition-colors cursor-pointer sm:border-b-0 last:border-r-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#5B9EC2] ${
                        selected
                          ? "bg-[#1F5B7C] font-medium text-white"
                          : "text-[#4D6072] hover:bg-[#E7EFF6] hover:text-[#0B1218] dark:text-[#8398AB] dark:hover:bg-[#081521] dark:hover:text-white"
                      }`}
                    >
                      {mod.tabLabel}
                    </button>
                  );
                })}
              </div>

              <div
                id="gyra-arch-tabpanel"
                role="tabpanel"
                aria-labelledby={`gyra-arch-tab-${activeId}`}
                className="mt-7"
              >
                <p className="font-mono-tech text-[11px] tracking-[0.13em] text-[#164E6D] uppercase dark:text-[#5B9EC2]">
                  {active.kicker}
                </p>
                <h3 className="font-display mt-2.5 text-[30px] font-bold leading-[1.05] tracking-[-0.015em] text-[#0B1218] uppercase dark:text-white">
                  {active.headline}
                </h3>
                <p className="mt-3 text-[14.5px] leading-[1.6] text-[#4A5B6B] dark:text-[#9EB0BF]">{active.summary}</p>
              </div>

              <dl className="mt-7 divide-y divide-[#E2EAF2] border-y border-[#E2EAF2] dark:divide-[#152433] dark:border-[#152433]">
                {active.specs.map((spec) => (
                  <div key={spec.label} className="grid grid-cols-12 items-baseline gap-4 py-3.5">
                    <dt className="col-span-4 text-[13.5px] font-medium text-[#0B1218] dark:text-white">
                      {spec.label}
                    </dt>
                    <dd className="font-mono-tech col-span-8 text-[12px] leading-[1.55] text-[#47596A] dark:text-[#9BB0C2]">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-2">
              <span className="font-mono-tech text-[10.5px] text-[#6B8296] uppercase">
                {active.endpoint}
              </span>
              <a
                href={resolveGyraRoute("/about", routeBase)}
                className="font-mono-tech inline-flex items-center gap-2 text-[11.5px] tracking-[0.1em] text-[#0B1218] uppercase underline decoration-[#1B587A] underline-offset-4 transition-colors hover:text-[#1B587A] dark:text-white dark:decoration-[#5B9EC2] dark:hover:text-[#5B9EC2]"
              >
                About Genvia AI Company →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
