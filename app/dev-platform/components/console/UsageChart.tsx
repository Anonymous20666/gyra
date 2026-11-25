"use client";

import React, { useMemo, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BarChart3, Terminal } from "lucide-react";
import {
  aggregateActivitySeries,
  formatCompactNumber,
  formatCurrency,
  formatLatency,
  type ActivityRecord,
  type ChartMetricKey,
  type TimeRangeKey,
} from "../../lib/analytics";

interface UsageChartProps {
  records: ActivityRecord[];
  range: TimeRangeKey;
  onChangeRange: (range: TimeRangeKey) => void;
  isDemoMode: boolean;
  onOpenPlayground: () => void;
}

const RANGES: TimeRangeKey[] = ["1H", "24H", "7D", "30D"];

const METRICS: Array<{ id: ChartMetricKey; label: string }> = [
  { id: "requests", label: "Requests" },
  { id: "credits", label: "Credits ($)" },
  { id: "latency", label: "Latency (ms)" },
  { id: "tokens", label: "Tokens" },
];

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Monotone-clamped Catmull-Rom tension so curves never overshoot below zero axis
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    const clampedCp1y = Math.max(minY, Math.min(maxY, cp1y));
    const clampedCp2y = Math.max(minY, Math.min(maxY, cp2y));

    d += ` C ${cp1x.toFixed(2)} ${clampedCp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${clampedCp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function UsageChart({
  records,
  range,
  onChangeRange,
  isDemoMode,
  onOpenPlayground,
}: UsageChartProps) {
  const [metric, setMetric] = useState<ChartMetricKey>("requests");
  const [showErrors, setShowErrors] = useState(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { buckets, summary } = useMemo(
    () => aggregateActivitySeries(records, range),
    [records, range]
  );

  const values = useMemo(
    () =>
      buckets.map((b) => {
        switch (metric) {
          case "requests":
            return b.requests;
          case "credits":
            return b.credits;
          case "latency":
            return b.avgLatencyMs;
          case "tokens":
            return b.tokens;
        }
      }),
    [buckets, metric]
  );

  const maxVal = useMemo(() => {
    const rawMax = Math.max(0, ...values);
    if (rawMax === 0) return 10;
    if (metric === "credits") return Number((rawMax * 1.18).toFixed(2));
    return Math.ceil(rawMax * 1.15);
  }, [values, metric]);

  const maxError = useMemo(
    () => Math.max(1, ...buckets.map((b) => b.errorCount)),
    [buckets]
  );

  const width = 920;
  const height = 270;
  const padTop = 18;
  const padBottom = 30;
  const padLeft = 10;
  const padRight = 62;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const points = useMemo(() => {
    return values.map((v, i) => {
      const x =
        buckets.length > 1
          ? padLeft + (i / (buckets.length - 1)) * plotW
          : padLeft + plotW / 2;
      const y = padTop + plotH - (v / maxVal) * plotH;
      return { x, y };
    });
  }, [values, buckets.length, plotW, plotH, maxVal]);

  const linePath = useMemo(() => buildSmoothPath(points), [points]);
  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const baseline = padTop + plotH;
    return `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${baseline} L ${points[0].x.toFixed(2)} ${baseline} Z`;
  }, [linePath, points, plotH]);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const val = maxVal * ratio;
    const y = padTop + plotH - ratio * plotH;
    let formatted = "";
    if (metric === "credits") formatted = `$${val.toFixed(2)}`;
    else if (metric === "latency") formatted = `${Math.round(val)}ms`;
    else formatted = formatCompactNumber(Math.round(val));
    return { y, formatted };
  });

  const xTickIndices = useMemo(() => {
    const count = buckets.length;
    if (count <= 6) return buckets.map((_, i) => i);
    const step = Math.floor((count - 1) / 5);
    const idxs: number[] = [];
    for (let i = 0; i < count; i += step) idxs.push(i);
    if (idxs[idxs.length - 1] !== count - 1) idxs.push(count - 1);
    return idxs;
  }, [buckets]);

  const handlePointerMove = (clientX: number) => {
    if (!svgRef.current || buckets.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * width;
    const clamped = Math.max(padLeft, Math.min(padLeft + plotW, relX));
    const ratio = (clamped - padLeft) / plotW;
    const idx = Math.round(ratio * (buckets.length - 1));
    setHoverIdx(Math.max(0, Math.min(buckets.length - 1, idx)));
  };

  const activeBucket = hoverIdx !== null ? buckets[hoverIdx] : null;
  const activePoint = hoverIdx !== null ? points[hoverIdx] : null;

  const formatMetricPrimary = () => {
    switch (metric) {
      case "requests":
        return summary.totalRequests.toLocaleString();
      case "credits":
        return formatCurrency(summary.totalCredits);
      case "latency":
        return formatLatency(summary.avgLatencyMs);
      case "tokens":
        return formatCompactNumber(summary.totalTokens);
    }
  };

  const hasData = summary.totalRequests > 0;

  return (
    <section
      aria-label="API Usage Analytics"
      className="bg-[#09090B] border border-[#1F1F23] rounded-lg overflow-hidden"
    >
      {/* Top Analytical Header */}
      <div className="px-5 py-4 border-b border-[#1F1F23] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-[15px] font-semibold text-[#F4F4F5]">
              API Traffic &amp; Telemetry
            </h2>
            {isDemoMode && (
              <span className="text-[11.5px] text-[#71717A] font-mono">
                · Demo dataset
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="font-mono text-[26px] font-semibold tracking-tight text-[#F4F4F5] tabular-nums leading-none">
              {formatMetricPrimary()}
            </span>
            {summary.deltaPercent !== null && metric === "requests" && (
              <span
                className={`inline-flex items-center gap-0.5 text-[12.5px] font-mono tabular-nums ${
                  summary.deltaPercent >= 0 ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {summary.deltaPercent >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {Math.abs(summary.deltaPercent)}% vs prior {range}
              </span>
            )}
            <span className="text-[12.5px] text-[#71717A] font-mono tabular-nums">
              Success {summary.successRate}% · P95 {formatLatency(summary.p95LatencyMs)} · Errors{" "}
              {summary.errorCount}
            </span>
          </div>
        </div>

        {/* Range & Metric Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            className="inline-flex items-center p-0.5 rounded-md bg-[#000000] border border-[#1F1F23]"
            role="tablist"
            aria-label="Chart metric"
          >
            {METRICS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={metric === m.id}
                onClick={() => setMetric(m.id)}
                className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors whitespace-nowrap ${
                  metric === m.id
                    ? "bg-[#121215] text-[#F4F4F5]"
                    : "text-[#71717A] hover:text-[#D4D4D8]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div
            className="inline-flex items-center p-0.5 rounded-md bg-[#000000] border border-[#1F1F23]"
            role="tablist"
            aria-label="Time range"
          >
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={range === r}
                onClick={() => onChangeRange(r)}
                className={`px-2.5 py-1 text-[12px] font-mono font-medium rounded transition-colors whitespace-nowrap ${
                  range === r
                    ? "bg-[#1F5B7C] text-[#F4F4F5]"
                    : "text-[#71717A] hover:text-[#D4D4D8]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas or Empty State */}
      {!hasData ? (
        <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-lg bg-[#121215] border border-[#1F1F23] flex items-center justify-center mb-3.5 text-[#71717A]">
            <BarChart3 className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h3 className="font-display text-[15px] font-semibold text-[#F4F4F5]">
            No API requests recorded in the last {range}
          </h3>
          <p className="mt-1.5 text-[13.5px] text-[#A1A1AA] max-w-md">
            Execute a request in the AI Playground or send traffic with your scoped API key to see
            real-time throughput, latency, and credit analytics here.
          </p>
          <button
            type="button"
            onClick={onOpenPlayground}
            className="mt-5 px-4 py-2 text-[13px] font-medium bg-[#1F5B7C] hover:bg-[#286F96] text-[#F4F4F5] rounded-md transition-colors inline-flex items-center gap-2"
          >
            <Terminal className="w-4 h-4" />
            <span>Send first request in Playground</span>
          </button>
        </div>
      ) : (
        <div className="px-4 pt-3 pb-4 relative">
          {/* Interactive Sub-toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1 text-[12px] text-[#71717A]">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-[#D4D4D8]">
                <span className="w-2.5 h-0.5 bg-[#5B9EC2] inline-block" aria-hidden="true" />
                {METRICS.find((m) => m.id === metric)?.label}
              </span>
              {metric === "requests" && (
                <button
                  type="button"
                  onClick={() => setShowErrors((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 transition-colors ${
                    showErrors ? "text-[#D4D4D8]" : "text-[#52525B] line-through"
                  }`}
                >
                  <span className="w-2 h-2 rounded-[2px] bg-red-500/70 inline-block" aria-hidden="true" />
                  Failed requests overlay
                </button>
              )}
            </div>
            <span className="font-mono tabular-nums text-[11.5px]">
              {activeBucket
                ? `${activeBucket.fullLabel} · ${activeBucket.requests} req · ${formatLatency(activeBucket.avgLatencyMs)} · ${formatCurrency(activeBucket.credits)}`
                : "Hover or scrub chart to inspect exact intervals"}
            </span>
          </div>

          <div className="relative w-full select-none">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-[230px] sm:h-[260px] overflow-visible touch-none"
              role="img"
              aria-label={`API ${metric} chart over the last ${range}`}
              onMouseMove={(e) => handlePointerMove(e.clientX)}
              onMouseLeave={() => setHoverIdx(null)}
              onTouchMove={(e) => {
                if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
              }}
              onTouchEnd={() => setHoverIdx(null)}
            >
              <defs>
                <linearGradient id="gyraChartArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B9EC2" stopOpacity="0.22" />
                  <stop offset="85%" stopColor="#5B9EC2" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#5B9EC2" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal Financial Gridlines + Right Y-Axis */}
              {yTicks.map((tick, idx) => (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    x2={padLeft + plotW}
                    y1={tick.y}
                    y2={tick.y}
                    stroke="#18181B"
                    strokeWidth="1"
                    strokeDasharray={idx === 0 ? undefined : "3 3"}
                  />
                  <text
                    x={padLeft + plotW + 10}
                    y={tick.y + 4}
                    fill="#71717A"
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {tick.formatted}
                  </text>
                </g>
              ))}

              {/* Error Overlay Bars (subtle bottom volume bars like trading charts) */}
              {metric === "requests" &&
                showErrors &&
                buckets.map((b, i) => {
                  if (b.errorCount <= 0) return null;
                  const barH = Math.max(4, (b.errorCount / maxError) * (plotH * 0.24));
                  const x = points[i]?.x ?? padLeft;
                  return (
                    <rect
                      key={`err-${i}`}
                      x={x - 4}
                      y={padTop + plotH - barH}
                      width={8}
                      height={barH}
                      rx={1.5}
                      fill="#EF4444"
                      fillOpacity={hoverIdx === i ? 0.85 : 0.42}
                    />
                  );
                })}

              {/* Area Fill */}
              <path d={areaPath} fill="url(#gyraChartArea)" />

              {/* Primary Smooth Series Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#5B9EC2"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* X-Axis Timestamps */}
              {xTickIndices.map((idx) => {
                const pt = points[idx];
                const b = buckets[idx];
                if (!pt || !b) return null;
                return (
                  <text
                    key={`x-${idx}`}
                    x={pt.x}
                    y={height - 6}
                    textAnchor={
                      idx === 0 ? "start" : idx === buckets.length - 1 ? "end" : "middle"
                    }
                    fill="#71717A"
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {b.label}
                  </text>
                );
              })}

              {/* Active Crosshair & Point Marker */}
              {activePoint && activeBucket && (
                <g pointerEvents="none">
                  <line
                    x1={activePoint.x}
                    x2={activePoint.x}
                    y1={padTop}
                    y2={padTop + plotH}
                    stroke="#52525B"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <line
                    x1={padLeft}
                    x2={padLeft + plotW}
                    y1={activePoint.y}
                    y2={activePoint.y}
                    stroke="#3F3F46"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r={6.5}
                    fill="#5B9EC2"
                    fillOpacity="0.22"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r={3.5}
                    fill="#F4F4F5"
                    stroke="#5B9EC2"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>

            {/* Precision Floating Tooltip */}
            {activeBucket && activePoint && (
              <div
                className="pointer-events-none absolute top-2 z-10 bg-[#000000] border border-[#2E2E34] rounded-md px-3 py-2.5 shadow-xl text-[12px] min-w-[196px]"
                style={{
                  left:
                    activePoint.x > width * 0.62
                      ? `calc(${(activePoint.x / width) * 100}% - 210px)`
                      : `calc(${(activePoint.x / width) * 100}% + 14px)`,
                }}
              >
                <p className="font-mono text-[11px] text-[#A1A1AA] pb-1.5 mb-1.5 border-b border-[#1F1F23]">
                  {activeBucket.fullLabel}
                </p>
                <div className="space-y-1 font-mono tabular-nums">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#71717A]">Requests</span>
                    <span className="text-[#F4F4F5] font-medium">
                      {activeBucket.requests}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#71717A]">2xx / Errors</span>
                    <span>
                      <span className="text-emerald-400">{activeBucket.successCount}</span>
                      <span className="text-[#52525B]"> / </span>
                      <span className={activeBucket.errorCount > 0 ? "text-red-400" : "text-[#71717A]"}>
                        {activeBucket.errorCount}
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#71717A]">Avg latency</span>
                    <span className="text-[#D4D4D8]">
                      {formatLatency(activeBucket.avgLatencyMs)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#71717A]">Credits</span>
                    <span className="text-[#D4D4D8]">
                      {formatCurrency(activeBucket.credits)}
                    </span>
                  </div>
                  {activeBucket.tokens > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-[#71717A]">Tokens</span>
                      <span className="text-[#D4D4D8]">
                        {activeBucket.tokens.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
