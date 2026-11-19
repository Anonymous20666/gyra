"use client";

import { useState } from "react";
import { resolveGyraRoute } from "../../lib/landingSimulations";

export interface ArchitectureBandProps {
  routeBase?: string;
}

interface StackLayerSpec {
  id: "surfaces" | "core" | "boundary" | "platform";
  tabNum: string;
  tabLabel: string;
  tag: string;
  headline: string;
  summary: string;
  specs: { label: string; value: string }[];
}

const STACK_LAYERS: StackLayerSpec[] = [
  {
    id: "surfaces",
    tabNum: "01",
    tabLabel: "Surfaces",
    tag: "[ PRODUCT SURFACES ]",
    headline: "Every workspace on one account.",
    summary:
      "Web chat, visual editing, cinematic video studio, Projects RAG, Journal, Forge Coding preview, and Telegram share one identity.",
    specs: [
      { label: "Flagship", value: "Gyra Chat · Gyra Image · Gyra Video" },
      { label: "Workspaces", value: "Projects RAG · Journal · Forge (Preview)" },
      { label: "Mobile", value: "Web · Android Capacitor · @Gyra_AiBot" },
      { label: "Identity", value: "Single Supabase Auth session" },
    ],
  },
  {
    id: "core",
    tabNum: "02",
    tabLabel: "Gyra Core",
    tag: "[ GYRA · THE INTELLIGENCE LAYER ]",
    headline: "One core orchestrating every modality.",
    summary:
      "Requests route dynamically across fast everyday inference, deep reasoning, six-agent engineering pipelines, and media synthesis.",
    specs: [
      { label: "Reasoning", value: "Gyra 1.0 (fast) · SuperGyra 2.0 (deep)" },
      { label: "Agents", value: "Atlas · Orion · Architect · Forge · Sentinel · Mentor" },
      { label: "Image Engine", value: "Flux Dev · Gyra Pro Ultra I2I" },
      { label: "Video Engine", value: "LTX-Video 13B · 720p · 24 fps · 121 frames" },
    ],
  },
  {
    id: "boundary",
    tabNum: "03",
    tabLabel: "I/O Boundary",
    tag: "[ THROUGH THE BOUNDARY ]",
    headline: "Your files, prompts, and keys under policy.",
    summary:
      "Documents, reference frames, voice streams, and scoped API keys pass through server-verified boundaries with rate limiting.",
    specs: [
      { label: "Inputs", value: "Text · Images · PDFs · Source files · Voice" },
      { label: "Outputs", value: "SSE streams · Edited stills · MP4 · JSON" },
      { label: "Auth", value: "Category-scoped Bearer API keys" },
      { label: "Proxy Policy", value: "Strict endpoint allowlist & auth guard" },
    ],
  },
  {
    id: "platform",
    tabNum: "04",
    tabLabel: "Platform",
    tag: "[ THE DEVELOPER PLATFORM ]",
    headline: "Same intelligence, programmable over REST.",
    summary:
      "Build directly on OpenAI-compatible chat endpoints, async video queues, voice synthesis, and media extraction APIs.",
    specs: [
      { label: "AI API", value: "/api/v1/chat · /api/v1/voice · /api/v1/transcribe" },
      { label: "Video API", value: "/api/v1/video/generate · /status/[id]" },
      { label: "Media API", value: "YouTube transcripts · TikTok · Spotify" },
      { label: "Billing", value: "Unified wallets & category credits" },
    ],
  },
];

export function ArchitectureBand({ routeBase = "" }: ArchitectureBandProps) {
  const [activeId, setActiveId] = useState<StackLayerSpec["id"]>("core");
  const active = STACK_LAYERS.find((l) => l.id === activeId) ?? STACK_LAYERS[1];

  const topOffset = activeId === "surfaces" ? -16 : activeId === "boundary" ? -10 : 0;
  const midOffset = activeId === "core" ? 0 : activeId === "surfaces" ? 8 : 4;
  const botOffset = activeId === "platform" ? 16 : activeId === "boundary" ? 10 : 0;

  return (
    <section id="architecture" className="border-b border-[#1F1F1F] bg-black py-24 lg:py-32">
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
        {/* Section Heading — E2B Architectural Monumental Scale */}
        <div className="max-w-3xl">
          <p className="font-mono-tech text-[12px] tracking-[0.14em] text-[#8A8A8A] uppercase">
            [ Where Gyra Fits ]
          </p>
          <h2 className="font-display mt-4 text-[clamp(2.5rem,4.4vw,4rem)] font-bold leading-[0.96] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
            One intelligence core.
            <br />
            Every product runs on it.
          </h2>
          <p className="mt-5 max-w-[58ch] text-[16px] leading-[1.6] text-[#9A9A9A]">
            Built by Genvia AI Company as a unified AI ecosystem — sharing reasoning models,
            multi-agent execution, media synthesis queues, and developer APIs across every surface.
          </p>
        </div>

        {/* Interactive Isometric Hardware Stack + Hairline Spec Inspector */}
        <div className="mt-14 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left 7 cols: Hand-Crafted 3-Layer Exploded Isometric SVG Architecture */}
          <div className="lg:col-span-7">
            <div className="relative mx-auto w-full max-w-[660px]">
              <svg
                viewBox="0 0 700 460"
                className="h-auto w-full select-none"
                role="img"
                aria-label="Three-layer isometric architecture of Gyra: Product Surfaces on top, Gyra Core Intelligence in cobalt middle slab, and Developer Platform baseplate below."
              >
                {/* Orbital Boundary Ring (highlights on I/O Boundary) */}
                <ellipse
                  cx="350"
                  cy="236"
                  rx="282"
                  ry="148"
                  fill="none"
                  stroke={activeId === "boundary" ? "#3B82F6" : "#262626"}
                  strokeWidth={activeId === "boundary" ? "1.4" : "1"}
                  strokeDasharray="3 5"
                  style={{ transition: "stroke 250ms ease" }}
                />

                {/* Orbital Satellite Nodes */}
                {[
                  { x: 24, y: 174, label: "PROMPTS · IN", active: activeId === "boundary" },
                  { x: 544, y: 140, label: "FILES & PDFS · IN", active: activeId === "boundary" },
                  { x: 46, y: 322, label: "MEDIA · OUT", active: activeId === "boundary" },
                  { x: 532, y: 344, label: "REST API · OUT", active: activeId === "boundary" },
                ].map((node) => (
                  <g
                    key={node.label}
                    opacity={activeId === "boundary" ? 1 : 0.55}
                    style={{ transition: "opacity 220ms ease" }}
                  >
                    <polygon
                      points={`${node.x + 26},${node.y} ${node.x + 64},${node.y + 16} ${node.x + 38},${node.y + 30} ${node.x},${node.y + 14}`}
                      fill="#0A0A0A"
                      stroke={node.active ? "#3B82F6" : "#3A3A3A"}
                      strokeWidth="1.2"
                    />
                    <text
                      x={node.x}
                      y={node.y + 46}
                      fill={node.active ? "#FFFFFF" : "#7A7A7A"}
                      fontSize="9.5"
                      fontFamily="JetBrains Mono, monospace"
                      letterSpacing="0.08em"
                    >
                      {node.label}
                    </text>
                  </g>
                ))}

                {/* LAYER 3 (BOTTOM): Developer Platform Baseplate */}
                <g
                  transform={`translate(10, ${botOffset})`}
                  style={{ transition: "transform 360ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                  onClick={() => setActiveId("platform")}
                  className="cursor-pointer"
                >
                  {/* Base extrusion thickness */}
                  <polygon
                    points="130,300 340,400 550,300 550,312 340,412 130,312"
                    fill="#080808"
                    stroke={activeId === "platform" ? "#3B82F6" : "#282828"}
                    strokeWidth="1.2"
                  />
                  {/* Base top face */}
                  <polygon
                    points="340,200 550,300 340,400 130,300"
                    fill={activeId === "platform" ? "#111111" : "#050505"}
                    stroke={activeId === "platform" ? "#3B82F6" : "#2D2D2D"}
                    strokeWidth="1.2"
                  />
                  {/* Platform etched grid lines */}
                  <line x1="235" y1="250" x2="445" y2="350" stroke="#1E1E1E" strokeWidth="1" />
                  <line x1="445" y1="250" x2="235" y2="350" stroke="#1E1E1E" strokeWidth="1" />
                  <text
                    x="340"
                    y="366"
                    textAnchor="middle"
                    fill={activeId === "platform" ? "#FFFFFF" : "#666666"}
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.14em"
                  >
                    PLATFORM · REST API · CREDITS
                  </text>
                </g>

                {/* LAYER 2 (MIDDLE — SIGNATURE SOLID VERMILION GYRA CORE SLAB) */}
                <g
                  transform={`translate(10, ${midOffset})`}
                  style={{ transition: "transform 360ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                  onClick={() => setActiveId("core")}
                  className="cursor-pointer"
                >
                  {/* Left bevel thickness */}
                  <polygon
                    points="130,225 340,325 340,341 130,241"
                    fill="#1E40AF"
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  {/* Right bevel thickness */}
                  <polygon
                    points="340,325 550,225 550,241 340,341"
                    fill="#172554"
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  {/* Top glowing matte vermilion hardware slab */}
                  <polygon
                    points="340,125 550,225 340,325 130,225"
                    fill={activeId === "core" ? "#2563EB" : "#1D4ED8"}
                    stroke="#000000"
                    strokeWidth="1.4"
                  />

                  {/* Etched architectural bay dividers across the vermilion slab */}
                  <line x1="182" y1="200" x2="392" y2="300" stroke="#93C5FD" strokeWidth="1" opacity="0.45" />
                  <line x1="235" y1="175" x2="445" y2="275" stroke="#93C5FD" strokeWidth="1" opacity="0.45" />
                  <line x1="288" y1="150" x2="498" y2="250" stroke="#93C5FD" strokeWidth="1" opacity="0.45" />

                  {/* Etched Bay Labels aligned cleanly inside each isometric channel */}
                  <text
                    x="208"
                    y="236"
                    transform="rotate(25.5 208 236)"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.12em"
                  >
                    GYRA
                  </text>
                  <text
                    x="264"
                    y="262"
                    transform="rotate(25.5 264 262)"
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="600"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.1em"
                  >
                    CHAT
                  </text>
                  <text
                    x="318"
                    y="288"
                    transform="rotate(25.5 318 288)"
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="600"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.1em"
                  >
                    IMAGE
                  </text>
                  <text
                    x="412"
                    y="258"
                    transform="rotate(25.5 412 258)"
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="600"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.1em"
                  >
                    VIDEO
                  </text>
                  <text
                    x="456"
                    y="232"
                    transform="rotate(25.5 456 232)"
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="600"
                    fontFamily="JetBrains Mono, monospace"
                    letterSpacing="0.1em"
                  >
                    AGENTS
                  </text>
                </g>

                {/* LAYER 1 (TOP): Matte Black Matrix Grid (Product Surfaces) */}
                <g
                  transform={`translate(10, ${topOffset})`}
                  style={{ transition: "transform 360ms cubic-bezier(0.16, 1, 0.3, 1)" }}
                  onClick={() => setActiveId("surfaces")}
                  className="cursor-pointer"
                >
                  {/* Top slab edge thickness */}
                  <polygon
                    points="130,148 340,248 550,148 550,158 340,258 130,158"
                    fill="#0A0A0A"
                    stroke={activeId === "surfaces" ? "#3B82F6" : "#262626"}
                    strokeWidth="1.2"
                  />
                  {/* Top slab main plane */}
                  <polygon
                    points="340,48 550,148 340,248 130,148"
                    fill="#070707"
                    stroke={activeId === "surfaces" ? "#3B82F6" : "#303030"}
                    strokeWidth="1.3"
                  />
                  {/* Precision 4x4 isometric surface matrix */}
                  {[1, 2, 3].map((step) => {
                    const t = step / 4;
                    const x1 = 340 + (550 - 340) * t;
                    const y1 = 48 + (148 - 48) * t;
                    const x2 = 130 + (340 - 130) * t;
                    const y2 = 148 + (248 - 148) * t;

                    const bx1 = 340 - (340 - 130) * t;
                    const by1 = 48 + (148 - 48) * t;
                    const bx2 = 550 - (550 - 340) * t;
                    const by2 = 148 + (248 - 148) * t;
                    return (
                      <g key={step}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1F1F1F" strokeWidth="1" />
                        <line x1={bx1} y1={by1} x2={bx2} y2={by2} stroke="#1F1F1F" strokeWidth="1" />
                      </g>
                    );
                  })}

                  {/* Active illuminated micro-cells on top surface */}
                  {[
                    { cx: 340, cy: 112, accent: true },
                    { cx: 288, cy: 148, accent: false },
                    { cx: 392, cy: 148, accent: true },
                    { cx: 340, cy: 184, accent: false },
                  ].map((pt, idx) => (
                    <rect
                      key={idx}
                      x={pt.cx - 3}
                      y={pt.cy - 3}
                      width="6"
                      height="6"
                      fill={
                        pt.accent && activeId === "surfaces"
                          ? "#3B82F6"
                          : pt.accent
                            ? "#FFFFFF"
                            : "#4A4A4A"
                      }
                    />
                  ))}
                </g>
              </svg>
            </div>
          </div>

          {/* Right 5 cols: Interactive Layer Switcher + Razor Hairline Key-Value Spec Table */}
          <div className="lg:col-span-5">
            {/* Sharp 0px Layer Selector Tabs */}
            <div
              role="tablist"
              aria-label="Gyra architecture layers"
              className="grid grid-cols-4 border border-[#1F1F1F] bg-black"
            >
              {STACK_LAYERS.map((layer) => {
                const selected = layer.id === activeId;
                return (
                  <button
                    key={layer.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveId(layer.id)}
                    className={`font-mono-tech border-r border-[#1F1F1F] px-2 py-2.5 text-[11px] tracking-[0.06em] uppercase transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3B82F6] ${
                      selected
                        ? "bg-[#2563EB] font-medium text-white"
                        : "bg-black text-[#808080] hover:bg-[#0A0A0A] hover:text-white"
                    }`}
                  >
                    {layer.tabNum}
                  </button>
                );
              })}
            </div>

            <div className="mt-7">
              <p className="font-mono-tech text-[12px] tracking-[0.12em] text-[#3B82F6] uppercase">
                {active.tag}
              </p>
              <h3 className="font-display mt-3 text-[30px] font-bold leading-[1.06] tracking-[-0.015em] text-white">
                {active.headline}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-[#9A9A9A]">{active.summary}</p>
            </div>

            {/* E2B-style Hairline Specification Rows */}
            <dl className="mt-7 divide-y divide-[#1F1F1F] border-y border-[#1F1F1F]">
              {active.specs.map((spec) => (
                <div
                  key={spec.label}
                  className="grid grid-cols-12 items-baseline gap-4 py-3.5"
                >
                  <dt className="col-span-4 text-[14px] font-medium text-white">
                    {spec.label}
                  </dt>
                  <dd className="font-mono-tech col-span-8 text-[12px] leading-[1.55] text-[#9A9A9A]">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6">
              <a
                href={resolveGyraRoute("/about", routeBase)}
                className="font-mono-tech inline-flex items-center gap-2 text-[12px] tracking-[0.1em] text-white uppercase underline decoration-[#3B82F6] underline-offset-4 transition-colors hover:text-[#3B82F6]"
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
