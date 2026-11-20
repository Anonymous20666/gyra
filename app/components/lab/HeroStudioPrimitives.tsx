"use client";

import { useState } from "react";
import { ArrowRight, Check, Copy, Send, Terminal } from "lucide-react";

export type HeroCopyId = "executive" | "developer" | "global";
export type BridgeStyleId = "telemetry" | "prompt" | "anchor";
export type ModalityTarget = "chat" | "image" | "video" | "api";

export const HERO_COPY_PRESETS: Record<
  HeroCopyId,
  {
    id: HeroCopyId;
    label: string;
    eyebrow: string;
    line1: string;
    line2: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
  }
> = {
  executive: {
    id: "executive",
    label: "01 · Executive Minimal",
    eyebrow: "GENVIA AI · UNIFIED INTELLIGENCE",
    line1: "One intelligence.",
    line2: "Every medium.",
    description:
      "Reason, design, direct video, and ship production APIs from a single engineered core.",
    primaryCta: "Start with Gyra",
    secondaryCta: "Explore API",
  },
  developer: {
    id: "developer",
    label: "02 · Developer Cloud",
    eyebrow: "THE MULTIMODAL AI PLATFORM",
    line1: "Intelligence,",
    line2: "simplified.",
    description:
      "Six-agent engineering, geometry-locked image editing, 720p video studio, and drop-in v1 endpoints.",
    primaryCta: "Start Building",
    secondaryCta: "Read Docs",
  },
  global: {
    id: "global",
    label: "03 · Global Edge Scale",
    eyebrow: "GLOBAL EDGE · 195+ COUNTRIES",
    line1: "Think once.",
    line2: "Create anything.",
    description:
      "Autonomous reasoning paired with studio-grade image and video synthesis at edge latency.",
    primaryCta: "Open Gyra",
    secondaryCta: "API Platform",
  },
};

export interface MiddleBridgeProps {
  styleId: BridgeStyleId;
  activeModality: ModalityTarget;
  onDispatchPrompt: (modality: ModalityTarget, promptText: string) => void;
}

const TELEMETRY_ITEMS = [
  { label: "Reasoning", value: "6-Agent Pipeline" },
  { label: "Global Edge", value: "195+ Countries" },
  { label: "Latency", value: "14ms TTFT" },
  { label: "Standard", value: "OpenAI-Compat v1" },
] as const;

const QUICK_CHIPS: { label: string; modality: ModalityTarget; prompt: string }[] = [
  {
    label: "Build Webhook",
    modality: "chat",
    prompt: "Write a constant-time HMAC Next.js webhook handler with per-IP rate limiting.",
  },
  {
    label: "2700K Relight",
    modality: "image",
    prompt: "Relight interior studio scene to blue-hour dusk with warm 2700K lamp bounce.",
  },
  {
    label: "720p Video",
    modality: "video",
    prompt: "Direct 16:9 macro rim-light orbit around obsidian studio headphones at 24 fps.",
  },
  {
    label: "cURL v1",
    modality: "api",
    prompt: "POST /api/v1/chat -> gyra-super2.0 SSE stream with scoped Bearer auth.",
  },
];

export function MiddleBridgeConnector({
  styleId,
  activeModality,
  onDispatchPrompt,
}: MiddleBridgeProps) {
  const [inputVal, setInputVal] = useState("");
  const [copiedCurl, setCopiedCurl] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    const mod: ModalityTarget =
      lower.includes("video") || lower.includes("720p") || lower.includes("headset")
        ? "video"
        : lower.includes("image") || lower.includes("relight") || lower.includes("photo")
          ? "image"
          : lower.includes("api") || lower.includes("curl") || lower.includes("endpoint")
            ? "api"
            : "chat";
    onDispatchPrompt(mod, trimmed);
    setInputVal("");
  };

  const handleCopyCurl = async () => {
    try {
      await navigator.clipboard.writeText(
        `curl -X POST https://gyra.ng/api/v1/chat -H "Authorization: Bearer $GYRA_API_KEY" -d '{"model":"gyra-super2.0"}'`,
      );
    } catch {
      // ignore
    }
    setCopiedCurl(true);
    window.setTimeout(() => setCopiedCurl(false), 1600);
  };

  // BRIDGE A: Architectural Telemetry Proof Rail + Vertical Signal Tether (physically connects Hero -> Flow!)
  if (styleId === "telemetry") {
    return (
      <div className="relative z-10 mx-auto max-w-[1160px] px-5 sm:px-8">
        <div className="grid grid-cols-2 border-y border-white/10 bg-black/75 backdrop-blur-sm sm:grid-cols-4 sm:divide-x sm:divide-white/10">
          {TELEMETRY_ITEMS.map((item, idx) => (
            <div
              key={item.label}
              className={`px-4 py-3.5 text-center sm:px-5 sm:py-4 ${
                idx < 2 ? "border-b border-white/10 sm:border-b-0" : ""
              } ${idx % 2 === 1 ? "border-l border-white/10 sm:border-l-0" : ""}`}
            >
              <p className="font-mono-tech text-[9.5px] tracking-[0.14em] text-[#6D8193] uppercase">
                {item.label}
              </p>
              <p className="mt-1 font-mono-tech text-[12px] font-medium tracking-[0.04em] text-white sm:text-[13px]">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Luminous Vertical Signal Tether descending straight into the Unboxed Live Flow */}
        <div className="flex flex-col items-center">
          <div className="relative h-12 w-[1px] overflow-hidden bg-gradient-to-b from-[#5B9EC2]/50 via-[#5B9EC2]/25 to-transparent sm:h-14">
            <span
              aria-hidden="true"
              className="gyra-tether-pulse absolute inset-x-0 top-0 h-5 w-full bg-gradient-to-b from-transparent via-[#9CC4DC] to-white"
            />
          </div>
          <p className="font-mono-tech text-[9.5px] tracking-[0.18em] text-[#5B9EC2] uppercase">
            Live Intelligence Architecture
          </p>
        </div>
      </div>
    );
  }

  // BRIDGE B: Interactive Single-Line Command / Prompt Bar firing directly into the Unboxed Flow
  if (styleId === "prompt") {
    return (
      <div className="relative z-10 mx-auto max-w-[820px] px-5 sm:px-8">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-y border-white/15 bg-[#04070C]/90 px-3.5 py-2.5 backdrop-blur-md transition-colors focus-within:border-[#5B9EC2]"
        >
          <Terminal className="h-4 w-4 shrink-0 text-[#5B9EC2]" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Drop a live prompt into Gyra Core..."
            aria-label="Send a prompt into the live intelligence flow below"
            className="min-w-0 flex-1 bg-transparent font-mono-tech text-[12px] text-white placeholder:text-[#66798A] focus:outline-none sm:text-[12.5px]"
          />
          <button
            type="submit"
            className="inline-flex min-h-[32px] shrink-0 items-center gap-1.5 bg-[#1F5B7C] px-3 font-mono-tech text-[10px] font-medium tracking-[0.1em] text-white uppercase transition-colors hover:bg-[#2A7299] cursor-pointer"
          >
            <span>Route</span>
            <Send className="h-3 w-3" />
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {QUICK_CHIPS.map((chip) => {
            const act = activeModality === chip.modality;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => onDispatchPrompt(chip.modality, chip.prompt)}
                className={`font-mono-tech border px-2.5 py-1 text-[10px] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                  act
                    ? "border-[#5B9EC2] bg-[#1F5B7C]/25 text-white"
                    : "border-white/10 bg-black/70 text-[#889BAC] hover:border-white/30 hover:text-white"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Short downward signal hairline linking prompt bar -> unboxed flow */}
        <div className="mt-4 flex justify-center">
          <div className="relative h-9 w-[1px] overflow-hidden bg-gradient-to-b from-[#5B9EC2]/50 to-transparent">
            <span
              aria-hidden="true"
              className="gyra-tether-pulse absolute inset-x-0 top-0 h-4 w-full bg-gradient-to-b from-transparent via-[#9CC4DC] to-white"
            />
          </div>
        </div>
      </div>
    );
  }

  // BRIDGE C: Ultra-Minimal Editorial Hairline Anchor + Live Status + Copy Endpoint Utility
  return (
    <div className="relative z-10 mx-auto max-w-[1160px] px-5 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono-tech text-[10px] tracking-[0.14em] uppercase">
        <span className="text-[#8DA2B5]">[ 00 · LIVE INTELLIGENCE CORE ]</span>

        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-[#34D399]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
            SUPERGYRA 2.0 ONLINE
          </span>
          <button
            type="button"
            onClick={handleCopyCurl}
            className="hidden items-center gap-1.5 text-[#7D92A4] transition-colors hover:text-white cursor-pointer sm:inline-flex"
          >
            <span>{copiedCurl ? "COPIED CURL" : "POST /API/V1/CHAT"}</span>
            {copiedCurl ? (
              <Check className="h-3 w-3 text-[#34D399]" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center text-center">
        <p className="max-w-[52ch] text-[13.5px] leading-[1.55] text-[#8496A6]">
          Every prompt flows through one unified core—routing seamlessly across reasoning, image
          editing, 720p video, and REST APIs.
        </p>
        <div className="mt-4 flex items-center gap-2 font-mono-tech text-[10px] tracking-[0.14em] text-[#5B9EC2] uppercase">
          <span>Interactive Flow Below</span>
          <ArrowRight className="h-3 w-3 rotate-90" />
        </div>
      </div>
    </div>
  );
}
