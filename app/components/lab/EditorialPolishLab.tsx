"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { LabPalette } from "./labTheme";

const GYRA_STACK_TILES = [
  { name: "SuperGyra 2.0", tag: "Deep Reasoning", cmd: 'curl -X POST https://gyra.ng/api/v1/chat -d \'{"model":"gyra-super2.0"}\'' },
  { name: "Gyra 1.0", tag: "Fast Everyday", cmd: 'curl -X POST https://gyra.ng/api/v1/chat -d \'{"model":"gyra-1.0"}\'' },
  { name: "6-Agent Core", tag: "Atlas -> Mentor", cmd: "gyra agent run --pipeline 6-stage --verify" },
  { name: "Pro Ultra I2I", tag: "Geometry Lock", cmd: "gyra image edit --engine pro-ultra --lock-geometry" },
  { name: "Flux Dev HD", tag: "Text-to-Image", cmd: "gyra image generate --model flux-dev --res 1920x1440" },
  { name: "LTX-Video 13B", tag: "720p · 24fps", cmd: 'curl -X POST https://gyra.ng/api/v1/video/generate -d \'{"aspect":"16:9"}\'' },
  { name: "Forge Sandbox", tag: "Isolated Linux", cmd: "gyra forge run --sandbox linux --preview" },
  { name: "Projects RAG", tag: "PDF & Code", cmd: "gyra projects index ./architecture-spec.pdf" },
  { name: "Telegram @GyraAi", tag: "Live SSE Bot", cmd: "open https://t.me/GyraAi" },
  { name: "Media Extract", tag: "YT / Whisper", cmd: "curl https://gyra.ng/api/v1/media/youtube/transcript?v=ID" },
];

export function EditorialPolishLab({ palette }: { palette: LabPalette }) {
  const [noWalls, setNoWalls] = useState(true);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const copyCmd = async (name: string, cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
    } catch {
      // ignore
    }
    setCopiedName(name);
    window.setTimeout(() => setCopiedName(null), 1600);
  };

  return (
    <div className="space-y-24">
      {/* 1. Interactive "No Walls" + Split-Weight Typography Before/After Comparison */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono-tech text-[11px] tracking-[0.16em] uppercase" style={{ color: palette.bright }}>
              [ 01 · TYPOGRAPHY &amp; NO-WALLS ARCHITECTURE ]
            </p>
            <h2 className="font-display mt-3 text-[clamp(2.3rem,4.4vw,3.8rem)] leading-[0.95] tracking-[-0.02em] text-white uppercase">
              <span className="font-light text-white/70">Drop the nested boxes.</span>
              <br />
              <span className="font-bold text-white">Let hairlines &amp; type breathe.</span>
            </h2>
          </div>

          <div className="inline-flex border border-white/15 bg-black">
            <button
              type="button"
              onClick={() => setNoWalls(false)}
              className={`font-mono-tech px-3.5 py-2 text-[10.5px] uppercase cursor-pointer ${
                !noWalls ? "bg-white font-medium text-black" : "text-[#8DA2B5] hover:text-white"
              }`}
            >
              Old · Boxed Walls
            </button>
            <button
              type="button"
              onClick={() => setNoWalls(true)}
              style={{ backgroundColor: noWalls ? palette.solid : "transparent" }}
              className={`font-mono-tech border-l border-white/15 px-3.5 py-2 text-[10.5px] uppercase cursor-pointer ${
                noWalls ? "font-medium text-white" : "text-[#8DA2B5] hover:text-white"
              }`}
            >
              Pro · No Walls + Split Weight
            </button>
          </div>
        </div>

        <div
          className={`mt-10 transition-all duration-300 ${
            noWalls
              ? "border-t border-white/12 pt-10"
              : "border-2 border-[#1F3447] bg-[#04090F] p-6"
          }`}
        >
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className={noWalls ? "lg:col-span-5" : "border border-[#243B50] bg-black p-5 lg:col-span-5"}>
              <p className="font-mono-tech text-[10.5px] tracking-[0.14em] uppercase" style={{ color: palette.bright }}>
                {noWalls ? "[ SPLIT-WEIGHT 300 / 700 ]" : "ALL-BOLD 700 · BOXED"}
              </p>
              <h3 className="font-display mt-3 text-[clamp(2rem,3.4vw,3.1rem)] leading-[0.96] uppercase text-white">
                {noWalls ? (
                  <>
                    <span className="font-light text-white/70">Full multimodal power.</span>
                    <br />
                    <span className="font-bold text-white">One razor API.</span>
                  </>
                ) : (
                  <span className="font-bold">FULL MULTIMODAL POWER. ONE RAZOR API.</span>
                )}
              </h3>
              <p className="mt-4 max-w-[44ch] text-[15px] leading-[1.65] text-[#96A5B3]">
                Compare how removing double-nested card walls and pairing Barlow Light 300 with Bold
                700 instantly shifts the page from &ldquo;dense template&rdquo; to E2B-tier industrial luxury.
              </p>
            </div>

            <dl
              className={
                noWalls
                  ? "divide-y divide-white/10 border-t border-white/10 lg:col-span-7"
                  : "space-y-3 lg:col-span-7"
              }
            >
              {[
                { k: "Heading Contrast", v: "Barlow Semi Condensed 300 (Lead) + 700 (Anchor)" },
                { k: "Surface Separation", v: "Pure #000000 void + single 1px rgba(255,255,255,0.10) rules" },
                { k: "Vertical Pacing", v: "Generous 128px–160px section voids (no crowded walls)" },
                { k: "Scroll Choreography", v: "CSS animation-timeline: view() dither-in reveals" },
              ].map((row) => (
                <div
                  key={row.k}
                  className={
                    noWalls
                      ? "grid grid-cols-12 items-baseline gap-4 py-4"
                      : "grid grid-cols-12 items-baseline gap-4 border border-[#1E3346] bg-[#060C12] p-4"
                  }
                >
                  <dt className="col-span-4 text-[13.5px] font-medium text-white">{row.k}</dt>
                  <dd className="col-span-8 font-mono-tech text-[12px] text-[#9BB0C2]">{row.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* 2. Monumental E2B-Class Typographic Scale Break + Kinetic Marquee */}
      <div className="gyra-scroll-reveal overflow-hidden border-y border-white/10 py-16">
        <div className="gyra-marquee-track flex whitespace-nowrap font-display text-[clamp(3.8rem,9vw,7.5rem)] font-bold leading-none tracking-[-0.025em] text-white/95 uppercase select-none">
          <span className="mr-12">
            ONE INTELLIGENCE <span style={{ color: palette.bright }}>·</span> EVERY MEDIUM{" "}
            <span style={{ color: palette.bright }}>·</span> GYRA CORE{" "}
            <span style={{ color: palette.bright }}>·</span>
          </span>
          <span aria-hidden="true" className="mr-12">
            ONE INTELLIGENCE <span style={{ color: palette.bright }}>·</span> EVERY MEDIUM{" "}
            <span style={{ color: palette.bright }}>·</span> GYRA CORE{" "}
            <span style={{ color: palette.bright }}>·</span>
          </span>
        </div>
      </div>

      {/* 3. E2B-Style 1-Click Copy Command Grid (Hairline Matrix + Accent Hover Border + Instant Copy) */}
      <div className="gyra-scroll-reveal">
        <div className="text-center">
          <h2 className="font-display text-[clamp(3rem,7.2vw,6.4rem)] font-bold leading-[0.9] tracking-[-0.025em] text-white uppercase">
            <span className="font-light text-white/70">Works with</span>
            <br />
            every Gyra surface.
          </h2>
          <p className="mx-auto mt-4 max-w-[50ch] text-[15px] text-[#8E9EAB]">
            Hover any capability tile below and click to copy its exact CLI / API command—zero
            decorative fluff, every touch is functional.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 border-l border-t border-white/12 sm:grid-cols-3 lg:grid-cols-5">
          {GYRA_STACK_TILES.map((tile) => {
            const copied = copiedName === tile.name;
            return (
              <button
                key={tile.name}
                type="button"
                onClick={() => copyCmd(tile.name, tile.cmd)}
                className="group relative flex min-h-[136px] flex-col items-center justify-center border-b border-r border-white/12 bg-black p-5 text-center transition-colors duration-150 hover:bg-[#05090F] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#5B9EC2]"
              >
                {/* Hover top accent line (precision micro-detail) */}
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: palette.bright }}
                  className="pointer-events-none absolute inset-x-0 top-0 h-[2px] scale-x-0 transition-transform duration-200 group-hover:scale-x-100"
                />
                <span className="absolute right-3 top-3 text-[#5E7284] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-[#34D399]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-white" />
                  )}
                </span>

                <span className="font-display text-[20px] font-bold tracking-[0.02em] text-white uppercase">
                  {tile.name}
                </span>
                <span className="mt-1 font-mono-tech text-[10px] tracking-[0.1em] text-[#7A8E9F] uppercase">
                  {copied ? "Copied command!" : tile.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
