"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Terminal } from "lucide-react";
import { resolveGyraRoute } from "../../lib/landingSimulations";
import { GlobalIntelligenceMap } from "../landing/GlobalIntelligenceMap";
import {
  SynapticKeyboardCanopy,
  type ChatFlowPhase,
  type LiveModalityId,
} from "./SynapticKeyboardCanopy";
import {
  E2B_MODALITY_ORDER,
  E2B_SCENES,
  GyraE2BStageBox,
} from "./GyraE2BStageBox";

const INSTITUTIONAL_SIGNAL_ITEMS = [
  "GENVIA GLOBAL EDGE · 195+ REGIONS",
  "SUPERGYRA 2.0 · 6-AGENT VERIFIED REASONING",
  "PRO ULTRA I2I · GEOMETRY-LOCKED RELIGHTING",
  "LTX-VIDEO 13B · 720P 24FPS KEYFRAME ANCHOR",
  "NOVA VOICE · 48KHZ NEURAL AUDIO & WHISPER V3",
  "OPENAI-COMPATIBLE V1 REST & SSE STREAMING",
  "WEB · ANDROID · TELEGRAM @GYRAAI",
] as const;

interface InteractiveTelemetryItem {
  id: "reasoning" | "edge" | "latency" | "standard";
  label: string;
  value: string;
  sublabel: string;
  breakdown: readonly { label: string; value: string; pct: number }[];
}

const INTERACTIVE_TELEMETRY_STATS: readonly InteractiveTelemetryItem[] = [
  {
    id: "reasoning",
    label: "Reasoning",
    value: "6-Agent Pipeline",
    sublabel: "Atlas -> Mentor QA",
    breakdown: [
      { label: "Atlas & Orion", value: "Spec + Grounding", pct: 92 },
      { label: "Architect", value: "System Graph", pct: 86 },
      { label: "Forge", value: "Code + Synthesis", pct: 95 },
      { label: "Sentinel QA", value: "Security Gate", pct: 98 },
    ],
  },
  {
    id: "edge",
    label: "Global Edge",
    value: "195+ Countries",
    sublabel: "Multi-region mesh",
    breakdown: [
      { label: "Lagos · LOS", value: "12 ms", pct: 94 },
      { label: "London · LHR", value: "14 ms", pct: 91 },
      { label: "New York · IAD", value: "16 ms", pct: 88 },
      { label: "Singapore · SIN", value: "19 ms", pct: 84 },
    ],
  },
  {
    id: "latency",
    label: "Latency",
    value: "14ms TTFT",
    sublabel: "Streaming SSE edge",
    breakdown: [
      { label: "Gyra 1.0 Fast", value: "14 ms TTFT", pct: 96 },
      { label: "SuperGyra 2.0", value: "26 ms TTFT", pct: 89 },
      { label: "Pro Ultra I2I", value: "1.8 s Render", pct: 86 },
      { label: "LTX-Video 13B", value: "24 fps Queue", pct: 82 },
    ],
  },
  {
    id: "standard",
    label: "Standard",
    value: "OpenAI-Compat v1",
    sublabel: "99.98% Gateway SLA",
    breakdown: [
      { label: "POST /v1/chat", value: "Drop-in SDK", pct: 99 },
      { label: "POST /v1/video", value: "Async Poll", pct: 96 },
      { label: "POST /v1/voice", value: "48kHz DSP", pct: 95 },
      { label: "Scoped Keys", value: "Rate Guarded", pct: 100 },
    ],
  },
];

const HERO_QUICK_ROUTES: readonly { label: string; prompt: string }[] = [
  { label: "Build webhook", prompt: "Build a Next.js HMAC webhook handler with per-IP rate limiting" },
  { label: "Relight studio", prompt: "Relight architectural studio window to blue-hour dusk at 2700K" },
  { label: "Orbit monitor", prompt: "720p video macro studio orbit around aluminum acoustic monitor" },
  { label: "Voice brief", prompt: "Synthesize 48kHz audio voiceover for Q4 product launch brief" },
];

export interface UnifiedKeyboardDashboardFlowProps {
  isAuthenticated?: boolean;
  routeBase?: string;
  compactHero?: boolean;
}

export function UnifiedKeyboardDashboardFlow({
  isAuthenticated = false,
  routeBase = "",
  compactHero = false,
}: UnifiedKeyboardDashboardFlowProps) {
  const [activeModality, setActiveModality] = useState<LiveModalityId>("chat");
  const [phase, setPhase] = useState<ChatFlowPhase>("routing");
  const [autoFlow, setAutoFlow] = useState(true);
  const [runNonce, setRunNonce] = useState(0);

  const [topPromptInput, setTopPromptInput] = useState("");
  const [activeTelemetryId, setActiveTelemetryId] = useState<InteractiveTelemetryItem["id"]>("edge");
  const activeTelemetry = INTERACTIVE_TELEMETRY_STATS.find((t) => t.id === activeTelemetryId) ?? INTERACTIVE_TELEMETRY_STATS[1];
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);

  const [activeChar, setActiveChar] = useState<string | null>(null);
  const [activeCharNonce, setActiveCharNonce] = useState(0);
  const [enterPulseNonce, setEnterPulseNonce] = useState(0);

  const autoFlowRef = useRef(autoFlow);
  autoFlowRef.current = autoFlow;

  // Continuous, unhurried E2E lazy cycle — glides smoothly from one modality into the next with zero stop/restart jolt
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = E2B_SCENES[activeModality];
    const typingLine = scene.terminalLines[0].text;

    if (reduced) {
      setPhase("done");
      return;
    }

    const timers: number[] = [];
    let cancelled = false;
    const schedule = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(id);
    };

    // Immediately enter calm routing as the new branch illuminates softly (never drops dark!)
    setPhase("routing");
    setEnterPulseNonce((n) => n + 1);

    // Moderate, unhurried 7-keystroke gesture on the left-side 3D GYRA keyboard overlapping the glide-in
    let idx = 0;
    const maxChars = Math.min(7, typingLine.length);
    const tapStep = () => {
      if (cancelled) return;
      if (idx < maxChars) {
        setActiveChar(typingLine[idx]);
        setActiveCharNonce((n) => n + 1);
        idx += 1;
        schedule(tapStep, 88);
      } else {
        setActiveChar(null);
      }
    };
    schedule(tapStep, 140);

    // Smooth, unhurried stage wave: routing -> thinking -> searching -> streaming -> done -> lazy handoff
    schedule(() => setPhase("thinking"), 650);
    schedule(() => setPhase("searching"), 1550);
    schedule(() => setPhase("streaming"), 2450);
    schedule(() => {
      setPhase("done");
      if (autoFlowRef.current) {
        schedule(() => {
          if (!autoFlowRef.current) return;
          setCustomPrompt(null);
          const nextIdx =
            (E2B_MODALITY_ORDER.indexOf(activeModality) + 1) % E2B_MODALITY_ORDER.length;
          setActiveModality(E2B_MODALITY_ORDER[nextIdx]);
          setRunNonce((n) => n + 1);
        }, 3900);
      }
    }, 3350);

    return () => {
      cancelled = true;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [activeModality, runNonce]);

  const handleSelectModality = useCallback((m: LiveModalityId) => {
    setCustomPrompt(null);
    setActiveModality(m);
    setRunNonce((n) => n + 1);
  }, []);

  const handleReplay = useCallback(() => {
    setCustomPrompt(null);
    setRunNonce((n) => n + 1);
  }, []);

  const dispatchTopPrompt = useCallback(
    (raw: string) => {
      const clean = raw.trim();
      if (!clean) {
        handleReplay();
        return;
      }
      const lower = clean.toLowerCase();
      const routed: LiveModalityId =
        lower.includes("video") || lower.includes("720p") || lower.includes("headset") || lower.includes("orbit")
          ? "video"
          : lower.includes("image") || lower.includes("relight") || lower.includes("photo") || lower.includes("2700k")
            ? "image"
            : lower.includes("audio") || lower.includes("voice") || lower.includes("speak") || lower.includes("48khz")
              ? "audio"
              : "chat";
      setCustomPrompt(clean);
      setActiveModality(routed);
      setRunNonce((n) => n + 1);
      setTopPromptInput("");
    },
    [handleReplay],
  );

  const handleTopInputChange = (val: string) => {
    if (val.length > topPromptInput.length) {
      setActiveChar(val[val.length - 1]);
      setActiveCharNonce((n) => n + 1);
    }
    setTopPromptInput(val);
  };

  const handleKeyTap = useCallback(
    (keyId: string) => {
      if (keyId === "ENTER") {
        if (topPromptInput.trim()) dispatchTopPrompt(topPromptInput);
        else handleReplay();
        return;
      }
      if (keyId === "BKSP") setTopPromptInput((p) => p.slice(0, -1));
      else if (keyId === "SPACE") setTopPromptInput((p) => `${p} `);
      else if (keyId.length === 1) setTopPromptInput((p) => `${p}${keyId.toLowerCase()}`);
    },
    [topPromptInput, dispatchTopPrompt, handleReplay],
  );

  return (
    <section className="border-b border-[#DCE4EC] bg-[#F6F8FA] transition-colors duration-200 dark:border-white/10 dark:bg-black">
      {/* 1. INSTITUTIONAL E2B-GRADE HERO + WHISPER ORBITAL NIGHT-EARTH MAP */}
      <div
        className={`relative overflow-hidden ${
          compactHero ? "pb-8 pt-10 sm:pb-10 sm:pt-14" : "pb-12 pt-16 sm:pb-16 sm:pt-24"
        }`}
      >
        <GlobalIntelligenceMap mode="orbital-hero" theme="steel" subtlety="balanced" />

        <div className="relative z-10 mx-auto max-w-[900px] px-5 text-center sm:px-8">
          <p className="font-mono-tech inline-flex items-center gap-2 text-[10px] tracking-[0.2em] text-[#164E6D] uppercase sm:text-[11px] dark:text-[#7E8D9A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1B587A] dark:bg-[#7BAAC6]/80" />
            <span>Global Edge · 195+ Countries</span>
          </p>

          <h1 className="font-display mt-5 text-[clamp(2.5rem,1.35rem+4.3vw,4.85rem)] leading-[0.92] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
            <span className="font-light text-[#4B5E70] dark:text-white/75">Think once.</span>
            <br />
            <span className="font-bold text-[#0B1218] dark:text-white">Create anything.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-[46ch] text-[14.5px] leading-[1.62] text-[#4A5B6B] sm:text-[16.5px] dark:text-[#8E969E]">
            Autonomous reasoning paired with studio-grade image, video, and voice synthesis at edge
            latency.
          </p>

          <div className="mx-auto mt-8 grid max-w-[352px] grid-cols-2 gap-3 sm:inline-flex sm:max-w-none sm:items-center sm:justify-center">
            <a
              href={resolveGyraRoute("/dashboard", routeBase)}
              className="gyra-dither-btn font-mono-tech inline-flex min-h-[44px] items-center justify-center whitespace-nowrap bg-[#1F5B7C] px-5 text-[11px] font-medium tracking-[0.12em] text-white uppercase transition-colors hover:bg-[#276D94] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white sm:min-w-[164px]"
            >
              {isAuthenticated ? "Dashboard" : "Open Gyra"}
            </a>
            <a
              href={resolveGyraRoute("/api", routeBase)}
              className="font-mono-tech inline-flex min-h-[44px] items-center justify-center whitespace-nowrap border border-[#C6D3DF] bg-white px-5 text-[11px] tracking-[0.12em] text-[#0B1218] uppercase transition-colors hover:border-[#1B587A] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1B587A] sm:min-w-[152px] dark:border-white/16 dark:bg-black dark:text-white dark:hover:border-white/45 dark:focus-visible:ring-[#5B9EC2]"
            >
              API Platform
            </a>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE LIVE PROMPT BAR (Pure Obsidian, Calm Architectural Framing) */}
      <div className="relative z-10 mx-auto max-w-[780px] px-4 sm:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            dispatchTopPrompt(topPromptInput);
          }}
          className="flex min-h-[48px] items-center gap-2.5 border border-[#C6D3DF] bg-white px-3.5 py-2 shadow-[0_8px_28px_-16px_rgba(11,18,24,0.16)] transition-colors focus-within:border-[#1B587A] dark:border-white/14 dark:bg-black dark:shadow-none dark:focus-within:border-white/35"
        >
          <Terminal className="h-4 w-4 shrink-0 text-[#1B587A] dark:text-[#6F9AB5]" aria-hidden="true" />
          <input
            type="text"
            value={topPromptInput}
            onChange={(e) => handleTopInputChange(e.target.value)}
            placeholder="Ask Gyra, relight, video, or audio..."
            aria-label="Send a live prompt through the 3D GYRA Keyboard into Gyra Core"
            className="min-w-0 flex-1 bg-transparent font-mono-tech text-[11.5px] text-[#0B1218] placeholder:text-[#788A9A] focus:outline-none sm:text-[13px] dark:text-white dark:placeholder:text-[#5B636C]"
          />
          <button
            type="submit"
            className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 bg-[#1F5B7C] px-3.5 font-mono-tech text-[10px] font-medium tracking-[0.1em] text-white uppercase transition-colors hover:bg-[#276D94] cursor-pointer"
          >
            <span>Route</span>
            <Send className="h-3 w-3" />
          </button>
        </form>
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-mono-tech text-[10px] tracking-[0.08em] text-[#5B6D7E] uppercase dark:text-[#6E8090]">
          <span>Quick route:</span>
          {HERO_QUICK_ROUTES.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => dispatchTopPrompt(item.prompt)}
              className="text-[#164E6D] underline decoration-[#B8CBD9] underline-offset-4 transition-colors hover:text-[#0B1218] hover:decoration-[#1B587A] cursor-pointer dark:text-[#99B2C4] dark:decoration-[#263F52] dark:hover:text-white dark:hover:decoration-[#5B9EC2]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. GENEROUS EXECUTIVE SPACING -> 4-CELL ARCHITECTURAL TELEMETRY RAIL -> QUIET SIGNAL TETHER */}
      <div className="relative z-10 mx-auto mt-10 max-w-[1160px] px-4 sm:mt-14 sm:px-8">
        <div className="border border-[#D5DFE8] bg-white shadow-[0_14px_38px_-24px_rgba(11,18,24,0.16)] dark:border-white/10 dark:bg-[#03060A]/92 dark:shadow-none">
          <div
            role="tablist"
            aria-label="Gyra live infrastructure telemetry"
            className="grid grid-cols-2 divide-y divide-[#E2E9F0] sm:grid-cols-4 sm:divide-x sm:divide-y-0 dark:divide-white/10"
          >
            {INTERACTIVE_TELEMETRY_STATS.map((item, idx) => {
              const selected = item.id === activeTelemetry.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveTelemetryId(item.id)}
                  onMouseEnter={() => setActiveTelemetryId(item.id)}
                  className={`group relative flex flex-col items-start px-4 py-4 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#5B9EC2] sm:px-5 ${
                    idx % 2 === 1 ? "border-l border-[#E2E9F0] sm:border-l-0 dark:border-white/10" : ""
                  } ${selected ? "bg-[#EEF4F9] dark:bg-[#07131E]" : "bg-white hover:bg-[#F7FAFC] dark:bg-black/80 dark:hover:bg-[#050C14]"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-[2px] transition-colors ${
                      selected ? "bg-[#1B587A] dark:bg-[#5B9EC2]" : "bg-transparent group-hover:bg-[#BFD3E2] dark:group-hover:bg-[#234358]"
                    }`}
                  />
                  <span className="font-mono-tech text-[9.5px] tracking-[0.14em] text-[#5D7082] uppercase dark:text-[#6E8496]">
                    {item.label}
                  </span>
                  <span className="mt-1 font-mono-tech text-[13px] font-medium tracking-[0.02em] text-[#0B1218] sm:text-[14px] dark:text-white">
                    {item.value}
                  </span>
                  <span className="mt-0.5 text-[11px] text-[#5B6D7E] dark:text-[#7D8C99]">{item.sublabel}</span>
                </button>
              );
            })}
          </div>
          <div
            role="tabpanel"
            aria-label={`${activeTelemetry.label} telemetry breakdown`}
            className="grid grid-cols-2 gap-3 border-t border-[#E2E9F0] bg-[#F8FAFC] px-4 py-3 sm:grid-cols-4 sm:px-5 dark:border-white/10 dark:bg-[#020508]"
          >
            {activeTelemetry.breakdown.map((row) => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 font-mono-tech text-[10px]">
                  <span className="truncate text-[#4D6072] dark:text-[#95A8B8]">{row.label}</span>
                  <span className="shrink-0 font-medium text-[#0B1218] dark:text-white">{row.value}</span>
                </div>
                <div className="h-[2px] w-full bg-[#D8E2EC] dark:bg-[#101C26]">
                  <div
                    className="h-full bg-[#1B587A] transition-all duration-300 ease-out dark:bg-[#5B9EC2]"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative h-10 w-[1px] overflow-hidden bg-gradient-to-b from-[#1B587A]/45 via-[#1B587A]/18 to-transparent sm:h-12 dark:from-white/20 dark:via-white/10">
            <span
              aria-hidden="true"
              className="gyra-tether-pulse absolute inset-x-0 top-0 h-5 w-full bg-gradient-to-b from-transparent via-[#7BAAC6]/70 to-white/80"
            />
          </div>
          <p className="font-mono-tech text-[9.5px] tracking-[0.18em] text-[#4E6173] uppercase dark:text-[#7A8C9B]">
            Live Intelligence Architecture
          </p>
        </div>
      </div>

      {/* 4. PURE-BLACK 21-ORB CANOPY (SMOOTH CONTINUOUS FLOW + SIDE 3D GYRA KEYBOARD) + EXACT E2B STAGE BOX */}
      <div className="mx-auto mt-3 max-w-[1260px] px-4 pb-12 sm:mt-4 sm:px-6 lg:px-8 lg:pb-16">
        <div className="border border-[#C5D3DF] bg-[#04070B] p-2.5 shadow-[0_28px_72px_-32px_rgba(11,18,24,0.34)] sm:p-4 dark:border-transparent dark:bg-transparent dark:p-0 dark:shadow-none">
          <SynapticKeyboardCanopy
            activeModality={activeModality}
            phase={phase}
            activeChar={activeChar}
            activeCharNonce={activeCharNonce}
            enterPulseNonce={enterPulseNonce}
            activePromptLabel={E2B_SCENES[activeModality].dropLabel}
            onSelectModality={handleSelectModality}
            onKeyTap={handleKeyTap}
          />

          <GyraE2BStageBox
            activeModality={activeModality}
            phase={phase}
            runNonce={runNonce}
            autoFlow={autoFlow}
            customPrompt={customPrompt}
            onSelectModality={handleSelectModality}
            onToggleAutoFlow={() => setAutoFlow((v) => !v)}
            onReplay={handleReplay}
          />
        </div>

        {/* 5. WHISPER-QUIET MONOCHROME INSTITUTIONAL SIGNAL RIBBON (Soft Edge-Faded, Ultra-Slow 68s Glide, Pauses on Hover) */}
        <div
          aria-label="Genvia and Gyra platform infrastructure capabilities"
          className="gyra-mask-edge-x mx-auto mt-10 max-w-[1160px] overflow-hidden border-y border-[#DCE4EC] py-3 sm:mt-14 dark:border-white/[0.07]"
        >
          <div className="gyra-ticker-slow flex w-max items-center">
            {[0, 1].map((dup) => (
              <div
                key={dup}
                aria-hidden={dup === 1}
                className="flex shrink-0 items-center font-mono-tech text-[10px] tracking-[0.16em] text-[#5B6D7E] uppercase dark:text-[#666F78]"
              >
                {INSTITUTIONAL_SIGNAL_ITEMS.map((item) => (
                  <span key={`${dup}-${item}`} className="inline-flex items-center whitespace-nowrap">
                    <span className="px-6">{item}</span>
                    <span className="text-[#BDCAD6] dark:text-white/20" aria-hidden="true">
                      /
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
