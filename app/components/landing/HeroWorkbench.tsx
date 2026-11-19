"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { resolveGyraRoute } from "../../lib/landingSimulations";
import { SynapticFlowHero } from "./SynapticFlowHero";

export interface HeroWorkbenchProps {
  isAuthenticated?: boolean;
  routeBase?: string;
}

const CAPABILITY_STRIP = [
  "Gyra 1.0 & SuperGyra 2.0",
  "6-Agent Pipeline",
  "Pro Ultra Image Edit",
  "LTX-Video 720p Studio",
  "OpenAI-Compat v1 API",
  "Web · Android · Telegram",
];

export function HeroWorkbench({
  isAuthenticated = false,
  routeBase = "",
}: HeroWorkbenchProps) {
  const [copiedCmd, setCopiedCmd] = useState(false);

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
      <div className="mx-auto max-w-[1380px] px-5 pb-12 pt-8 sm:px-8 lg:pb-16 lg:pt-10">
        {/* Centered Hero Header & Primary Actions */}
        <div className="mx-auto flex max-w-[820px] flex-col items-center text-center">
          <h1 className="font-display text-[clamp(2.65rem,4.9vw,4.25rem)] font-bold leading-[0.93] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
            One intelligence.
            <br />
            Every medium.
          </h1>

          <p className="mt-3.5 max-w-[58ch] text-[14.5px] leading-[1.55] text-[#A3A3A3] sm:text-[16px]">
            Gyra unites conversational reasoning, precision image generation and editing,
            cinematic video studio workflows, and OpenAI-compatible APIs on one engineered
            platform.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href={resolveGyraRoute("/dashboard", routeBase)}
              className="font-mono-tech inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap bg-[#1F5B7C] px-6 text-[12px] font-medium tracking-[0.1em] text-white uppercase transition-colors duration-150 hover:bg-[#296E93] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              {isAuthenticated ? "Open Dashboard" : "Start with Gyra"}
            </a>
            <a
              href={resolveGyraRoute("/api", routeBase)}
              className="font-mono-tech inline-flex min-h-[42px] shrink-0 items-center justify-center whitespace-nowrap border border-[#3A3A3A] bg-black px-6 text-[12px] font-medium tracking-[0.1em] text-white uppercase transition-colors duration-150 hover:border-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2]"
            >
              Explore API
            </a>
            <button
              type="button"
              onClick={copyQuickCurl}
              className="font-mono-tech inline-flex min-h-[42px] items-center gap-2 border border-[#1F1F1F] bg-[#060606] px-4 text-[11px] tracking-[0.08em] text-[#8E8E8E] uppercase transition-colors hover:border-[#3A3A3A] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2] cursor-pointer"
            >
              {copiedCmd ? (
                <Check className="h-3.5 w-3.5 text-[#5B9EC2]" />
              ) : (
                <Terminal className="h-3.5 w-3.5 text-[#7A7A7A]" />
              )}
              <span>{copiedCmd ? "Copied cURL" : "POST /api/v1/chat"}</span>
              <Copy className="h-3 w-3 opacity-60" />
            </button>
          </div>
        </div>

        {/* Peak Adv 05 Synaptic Neural Canopy + Downward Wired SaaS Result Studio */}
        <SynapticFlowHero routeBase={routeBase} />

        {/* Clean Unboxed Platform Capability Index */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[#181818] pt-5 font-mono-tech text-[11px] tracking-[0.08em] text-[#7D8C99] uppercase">
          {CAPABILITY_STRIP.map((item, idx) => (
            <span key={item} className="inline-flex items-center gap-5 whitespace-nowrap">
              {idx > 0 && (
                <span className="text-[#2B3D4D]" aria-hidden="true">
                  ·
                </span>
              )}
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
