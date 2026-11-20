"use client";

import { useState } from "react";
import { GlobalIntelligenceMap } from "../landing/GlobalIntelligenceMap";
import type { LabPalette } from "./labTheme";

const REGIONS = [
  {
    code: "LOS-01",
    city: "Lagos · West Africa Core",
    latency: "14ms",
    throughput: "148k req/m",
    workload: "SuperGyra 2.0 · 6-Agent Pipeline + @GyraAi Telegram SSE",
    sample: "POST /api/v1/chat -> 200 OK · 118 tok/s",
  },
  {
    code: "LHR-01",
    city: "London · EU-West Edge",
    latency: "11ms",
    throughput: "214k req/m",
    workload: "Gyra Pro Ultra I2I · Geometry-Locked Relighting Proxy",
    sample: "POST /api/fal/proxy -> SSIM 0.994 · 2.1s",
  },
  {
    code: "JFK-01",
    city: "New York · US-East Core",
    latency: "12ms",
    throughput: "268k req/m",
    workload: "LTX-Video 13B Studio Queue · 720p 24fps Async Renders",
    sample: "POST /api/v1/video/generate -> job_8f2a queued",
  },
  {
    code: "NRT-01",
    city: "Tokyo · APAC-East Core",
    latency: "15ms",
    throughput: "164k req/m",
    workload: "Gyra Forge Sandboxes · Media Transcripts & Voice Synthesis",
    sample: "GET /api/v1/media/youtube/transcript -> 200 OK",
  },
] as const;

export function FlowSampleGlobalFusion({ palette }: { palette: LabPalette }) {
  const [selected, setSelected] = useState(0);
  const region = REGIONS[selected];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono-tech text-[11px] tracking-[0.16em] uppercase" style={{ color: palette.bright }}>
            [ GLOBAL INTELLIGENCE MESH + LIVE REGIONAL EXECUTION ]
          </p>
          <h2 className="font-display mt-2.5 text-[clamp(2.2rem,4vw,3.6rem)] leading-[0.95] tracking-[-0.02em] text-white uppercase">
            <span className="font-light text-white/75">Built in Africa.</span>{" "}
            <span className="font-bold text-white">Executed everywhere.</span>
          </h2>
        </div>
        <p className="max-w-[44ch] text-[14px] leading-[1.6] text-[#8E9EAB]">
          Real Natural Earth 110m global routing paired with live regional inference cards—so
          visitors feel planetary scale before diving into the workbench.
        </p>
      </div>

      {/* Live Natural Earth Map Module */}
      <GlobalIntelligenceMap
        mode="inline-module"
        theme={palette.id === "violet" ? "violet" : "steel"}
        className="mt-8"
      />

      {/* Hairline Regional Inference Strip Directly Below (Zero Nested Walls!) */}
      <div className="mt-6 grid grid-cols-1 divide-y divide-white/10 border-y border-white/10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {REGIONS.map((r, idx) => {
          const act = idx === selected;
          return (
            <button
              key={r.code}
              type="button"
              onMouseEnter={() => setSelected(idx)}
              onClick={() => setSelected(idx)}
              style={{ backgroundColor: act ? `rgba(${palette.rgb}, 0.16)` : "transparent" }}
              className="flex flex-col justify-between p-4 text-left transition-colors hover:bg-white/[0.03] cursor-pointer"
            >
              <div className="flex items-center justify-between font-mono-tech text-[10.5px] uppercase">
                <span style={{ color: act ? palette.soft : "#8FA2B4" }}>{r.code}</span>
                <span className="text-[#34D399]">{r.latency}</span>
              </div>
              <p className="mt-2 text-[14px] font-medium text-white">{r.city}</p>
              <p className="mt-1 font-mono-tech text-[10.5px] text-[#7D92A4]">{r.throughput}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[11px] text-[#9EB2C3]">
        <span>
          <strong className="text-white">{region.code}</strong> · {region.workload}
        </span>
        <span style={{ color: palette.bright }}>{region.sample}</span>
      </div>
    </div>
  );
}
