"use client";

import { useState } from "react";
import type { LabPalette } from "./labTheme";

type StratumId = "genvia" | "core" | "modalities";

const STRATA: Record<
  StratumId,
  {
    kicker: string;
    title: string;
    subtitle: string;
    rows: { key: string; value: string }[];
  }
> = {
  genvia: {
    kicker: "[ L0 · GENVIA GOVERNANCE ]",
    title: "Unified identity & compute boundary.",
    subtitle: "One account, scoped keys, and transparent credit wallets across Web, Android, and @GyraAi.",
    rows: [
      { key: "Identity", value: "Single auth session · zero friction" },
      { key: "Security", value: "Server-verified Bearer scopes & proxy" },
      { key: "Billing", value: "Pre-checked credits + auto refund guard" },
      { key: "Channels", value: "Web · Android · @GyraAi · REST v1" },
    ],
  },
  core: {
    kicker: "[ L1 · GYRA CORE SILICON ]",
    title: "One intelligence core per session.",
    subtitle: "Understand -> Orchestrate -> Execute on one unified routing plane.",
    rows: [
      { key: "Reasoning", value: "gyra.chat({ model: 'gyra-super2.0' })" },
      { key: "6-Agent QA", value: "Atlas -> Orion -> Architect -> Forge -> Sentinel -> Mentor" },
      { key: "Image Edit", value: "gyra.image.relight({ lockGeometry: true })" },
      { key: "Video Queue", value: "gyra.video.generate({ model: 'ltx-13b', fps: 24 })" },
      { key: "RAG Storage", value: "gyra.projects.index('spec.pdf')" },
    ],
  },
  modalities: {
    kicker: "[ L2 · MODALITY RUNNERS ]",
    title: "Every medium executes natively.",
    subtitle: "Low-latency SSE token streams, HD Flux renders, 720p video queues, and Forge sandboxes.",
    rows: [
      { key: "Gyra Chat", value: "POST /api/v1/chat · 118 tok/s SSE" },
      { key: "Gyra Image", value: "Flux Dev HD + Pro Ultra I2I" },
      { key: "Gyra Video", value: "LTX-Video 13B · 16:9 & 9:16" },
      { key: "Media API", value: "YouTube transcripts · Whisper · Voice" },
    ],
  },
};

export function FlowSampleIsometric3D({ palette }: { palette: LabPalette }) {
  const [active, setActive] = useState<StratumId>("core");
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [exploded, setExploded] = useState(true);

  const spec = STRATA[active];

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -ny * 10, ry: nx * 12 });
  };

  const layerShift = (id: StratumId) => {
    if (!exploded) return 0;
    if (id === "genvia") return -22;
    if (id === "modalities") return 22;
    return 0;
  };

  return (
    <div>
      {/* Open Editorial Header — Split Light 300 + Bold 700, ZERO Box Walls */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p
            className="font-mono-tech text-[11px] tracking-[0.16em] uppercase"
            style={{ color: palette.bright }}
          >
            [ WHERE GYRA FITS · ZERO-WALLS 3D STRATA ]
          </p>
          <h2 className="font-display mt-3 text-[clamp(2.4rem,4.4vw,3.9rem)] leading-[0.95] tracking-[-0.02em] text-white uppercase">
            <span className="font-light text-white/75">Your prompt is the product.</span>
            <br />
            <span className="font-bold text-white">Gyra is where it runs.</span>
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setExploded((v) => !v)}
          aria-pressed={exploded}
          className="font-mono-tech min-h-[38px] border border-white/15 bg-black px-4 text-[11px] tracking-[0.1em] text-[#B8CAD8] uppercase transition-colors hover:border-white hover:text-white cursor-pointer"
        >
          {exploded ? "Compact Stack" : "Explode 3D Strata"}
        </button>
      </div>

      {/* ZERO-WALL Floating 2-Column Composition Directly on Pure #000000 */}
      <div className="mt-14 grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        {/* Left 7 cols: Pure Floating 3D Isometric Silicon Stack (No Enclosing Border!) */}
        <div
          onPointerMove={handleMove}
          onPointerLeave={() => setTilt({ rx: 0, ry: 0 })}
          style={{ perspective: "1200px" }}
          className="flex items-center justify-center py-4 lg:col-span-7"
        >
          <div
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transition: "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="w-full max-w-[660px]"
          >
            <svg
              viewBox="0 0 700 490"
              className="h-auto w-full select-none overflow-visible"
              role="group"
              aria-labelledby="gyra-iso3d-title"
            >
              <title id="gyra-iso3d-title">
                Floating 3D isometric strata: Genvia Governance, Gyra Core Silicon, and Modality Runners
              </title>

              {/* Layer 2 (Bottom): Modality Runners Base Wafer */}
              <g
                role="button"
                tabIndex={0}
                aria-label="Inspect L2 Modality Runners"
                onClick={() => setActive("modalities")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive("modalities");
                  }
                }}
                className="cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-[#5B9EC2]"
                style={{
                  transform: `translateY(${layerShift("modalities")}px)`,
                  transition: "transform 420ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <polygon
                  points="350,235 615,342 350,450 85,342"
                  fill={active === "modalities" ? palette.solid : "#05070A"}
                  stroke={active === "modalities" ? "#FFFFFF" : "rgba(255,255,255,0.22)"}
                  strokeWidth={active === "modalities" ? 1.8 : 1.1}
                />
                <polygon
                  points="85,342 350,450 350,468 85,360"
                  fill={active === "modalities" ? "#0E2D40" : "#030406"}
                  stroke="rgba(255,255,255,0.16)"
                />
                <polygon
                  points="615,342 350,450 350,468 615,360"
                  fill={active === "modalities" ? "#081C28" : "#020304"}
                  stroke="rgba(255,255,255,0.12)"
                />
                <text
                  x="350"
                  y="350"
                  textAnchor="middle"
                  fill={active === "modalities" ? "#FFFFFF" : "#8FA3B5"}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="11"
                  letterSpacing="2.4"
                >
                  CHAT · IMAGE · VIDEO · API RUNNERS
                </text>
              </g>

              {/* Layer 1 (Middle — Signature Luminous Accent Slab like E2B's center slab!) */}
              <g
                role="button"
                tabIndex={0}
                aria-label="Inspect L1 Gyra Core Silicon"
                onClick={() => setActive("core")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive("core");
                  }
                }}
                className="cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-white"
                style={{
                  transform: `translateY(${layerShift("core")}px)`,
                  transition: "transform 420ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <polygon
                  points="350,145 615,252 350,360 85,252"
                  fill={active === "core" ? palette.solid : "#0B1520"}
                  stroke={active === "core" ? "#FFFFFF" : palette.bright}
                  strokeWidth={active === "core" ? 2 : 1.3}
                />
                <polygon
                  points="85,252 350,360 350,382 85,274"
                  fill={active === "core" ? palette.bright : "#08121B"}
                  fillOpacity={active === "core" ? 0.55 : 1}
                  stroke={palette.bright}
                  strokeOpacity="0.6"
                />
                <polygon
                  points="615,252 350,360 350,382 615,274"
                  fill={active === "core" ? "#0D2B3D" : "#040A10"}
                  stroke={palette.bright}
                  strokeOpacity="0.45"
                />
                {/* Etched Architectural Quadrant Dividers (E2B Precision Hardware Craft) */}
                <line x1="217" y1="199" x2="483" y2="306" stroke="#000000" strokeOpacity="0.42" strokeWidth="1.2" />
                <line x1="284" y1="172" x2="549" y2="279" stroke="#000000" strokeOpacity="0.42" strokeWidth="1.2" />
                <line x1="151" y1="226" x2="416" y2="333" stroke="#000000" strokeOpacity="0.42" strokeWidth="1.2" />

                <text
                  x="248"
                  y="244"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontFamily="Barlow Semi Condensed, sans-serif"
                  fontWeight="700"
                  fontSize="16"
                  letterSpacing="2"
                >
                  GYRA CORE
                </text>
                <text
                  x="350"
                  y="264"
                  textAnchor="middle"
                  fill={active === "core" ? "#E8F6FF" : palette.soft}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="10"
                  letterSpacing="1.8"
                >
                  UNDERSTAND · ORCHESTRATE · EXECUTE
                </text>
                <text
                  x="468"
                  y="296"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fillOpacity="0.82"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.5"
                  letterSpacing="1.5"
                >
                  6-AGENT + MULTIMODAL
                </text>
              </g>

              {/* Layer 0 (Top): Genvia Parent Governance Mesh */}
              <g
                role="button"
                tabIndex={0}
                aria-label="Inspect L0 Genvia Governance"
                onClick={() => setActive("genvia")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive("genvia");
                  }
                }}
                className="cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-[#5B9EC2]"
                style={{
                  transform: `translateY(${layerShift("genvia")}px)`,
                  transition: "transform 420ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <polygon
                  points="350,55 615,162 350,270 85,162"
                  fill={active === "genvia" ? palette.solid : "rgba(6, 9, 13, 0.86)"}
                  stroke={active === "genvia" ? "#FFFFFF" : "rgba(255,255,255,0.24)"}
                  strokeWidth={active === "genvia" ? 1.8 : 1.1}
                />
                {/* Fine architectural grid etched onto top governance plane */}
                {[-2, -1, 0, 1, 2].map((i) => (
                  <line
                    key={`g1-${i}`}
                    x1={350 + i * 44 - 130}
                    y1={162 + i * 18 + 52}
                    x2={350 + i * 44 + 130}
                    y2={162 + i * 18 - 52}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="0.8"
                  />
                ))}
                <text
                  x="350"
                  y="158"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontFamily="Barlow Semi Condensed, sans-serif"
                  fontWeight="700"
                  fontSize="18"
                  letterSpacing="3"
                >
                  GENVIA AI
                </text>
                <text
                  x="350"
                  y="176"
                  textAnchor="middle"
                  fill={palette.soft}
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9.5"
                  letterSpacing="2"
                >
                  IDENTITY · SAFETY · WALLETS · GLOBAL MESH
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Right 5 cols: Floating Hairline Spec Ledger (ZERO Outer Box Walls!) */}
        <div className="lg:col-span-5">
          <div className="flex gap-2 pb-6">
            {(["genvia", "core", "modalities"] as const).map((id) => {
              const isAct = active === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActive(id)}
                  style={{
                    borderColor: isAct ? palette.bright : "rgba(255,255,255,0.14)",
                    color: isAct ? "#FFFFFF" : "#8094A6",
                    backgroundColor: isAct ? `rgba(${palette.rgb}, 0.22)` : "transparent",
                  }}
                  className="font-mono-tech border px-3 py-1.5 text-[10.5px] tracking-[0.1em] uppercase transition-colors cursor-pointer"
                >
                  {id === "genvia" ? "L0 Genvia" : id === "core" ? "L1 Core" : "L2 Runners"}
                </button>
              );
            })}
          </div>

          <p
            className="font-mono-tech text-[11px] tracking-[0.14em] uppercase"
            style={{ color: palette.bright }}
          >
            {spec.kicker}
          </p>
          <h3 className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
            {spec.title}
          </h3>
          <p className="mt-2.5 text-[14.5px] leading-[1.6] text-[#8E9EAB]">{spec.subtitle}</p>

          <dl className="mt-8 divide-y divide-white/10 border-t border-white/10">
            {spec.rows.map((row) => (
              <div key={row.key} className="grid grid-cols-12 items-baseline gap-4 py-3.5">
                <dt className="col-span-4 text-[13.5px] font-medium text-white">{row.key}</dt>
                <dd className="col-span-8 font-mono-tech text-[12px] text-[#9EB2C3]">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
