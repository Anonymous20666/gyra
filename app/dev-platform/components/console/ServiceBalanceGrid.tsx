"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  computeCategorySparklineSeries,
  formatCompactNumber,
  formatCurrency,
  formatLatency,
  type ActivityRecord,
  type SparklinePoint,
  type WalletBalances,
} from "../../lib/analytics";
import { GYRA_CATEGORIES, type ApiCategoryId } from "../../lib/gyraCatalog";
import { CategoryIcon } from "../shell/GyraMark";

interface ServiceBalanceGridProps {
  wallets: WalletBalances;
  activity: ActivityRecord[];
  onOpenCategoryInPlayground: (category: ApiCategoryId) => void;
  onOpenBilling: () => void;
}

function buildSmoothSparkPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

interface LiveServiceSparklineProps {
  categoryId: ApiCategoryId;
  series: SparklinePoint[];
  active: boolean;
  totalCategoryRequests: number;
}

function LiveServiceSparkline({
  categoryId,
  series,
  active,
  totalCategoryRequests,
}: LiveServiceSparklineProps) {
  const gradId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [inspectIdx, setInspectIdx] = useState<number | null>(null);
  const [phase, setPhase] = useState(0);

  // Smooth continuous live telemetry motion when operational & not paused by user inspection
  useEffect(() => {
    if (!active || inspectIdx !== null) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let rafId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPhase((prev) => (prev + dt * 1.35) % (Math.PI * 200));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [active, inspectIdx]);

  const width = 260;
  const height = 56;
  const padX = 4;
  const padTop = 8;
  const padBottom = 6;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const { coords, linePath, areaPath, maxVal, latestIdx } = useMemo(() => {
    const rawValues = series.map((pt) => pt.requests);
    const maxV = Math.max(1, ...rawValues);
    const stepX = series.length > 1 ? innerW / (series.length - 1) : innerW;

    const pts = series.map((pt, i) => {
      // Subtle organic live waveform ripple strictly proportional to active traffic
      // Pauses cleanly when inspecting so exact coordinates match bucket values
      const waveOffset =
        active && inspectIdx === null && pt.requests > 0
          ? Math.sin(phase * 1.4 - i * 0.55) * 0.065 * maxV
          : 0;
      const effectiveVal = Math.max(0, pt.requests + waveOffset);
      const ratio = Math.min(1, effectiveVal / (maxV * 1.08));
      const x = padX + i * stepX;
      const y = padTop + innerH - ratio * innerH;
      return { x, y };
    });

    const lPath = buildSmoothSparkPath(pts);
    const baselineY = padTop + innerH;
    const aPath =
      pts.length > 1
        ? `${lPath} L ${pts[pts.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)} L ${pts[0].x.toFixed(2)} ${baselineY.toFixed(2)} Z`
        : "";

    return {
      coords: pts,
      linePath: lPath,
      areaPath: aPath,
      maxVal: maxV,
      latestIdx: Math.max(0, pts.length - 1),
    };
  }, [series, active, inspectIdx, phase, innerW, innerH]);

  const selectFromClientX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || series.length === 0) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0) return;
    const rel = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const idx = Math.round(rel * (series.length - 1));
    setInspectIdx(idx);
  };

  const inspected = inspectIdx !== null ? series[inspectIdx] : null;
  const inspectedCoord = inspectIdx !== null ? coords[inspectIdx] : null;
  const tipCoord = coords[latestIdx];
  const latestPoint = series[latestIdx];

  const strokeColor = active ? "#5B9EC2" : "#3F3F46";
  const accentFill = active ? "#5B9EC2" : "#3F3F46";

  // Position tooltip left or right of crosshair so it never clips outside card
  const tooltipAlignRight =
    inspectedCoord !== null && inspectedCoord.x > width * 0.56;

  return (
    <div className="space-y-1.5">
      {/* Live telemetry readout header above the mini-chart */}
      <div className="flex items-center justify-between gap-2 min-h-[18px] text-[11px] font-mono tabular-nums">
        {inspected ? (
          <>
            <span className="text-[#D4D4D8] font-medium truncate">
              {inspected.label} ·{" "}
              <span className="text-[#7DD3FC]">
                {formatCompactNumber(inspected.requests)} req
              </span>
            </span>
            <span className="text-[#A1A1AA] shrink-0">
              {inspected.avgLatencyMs > 0 ? formatLatency(inspected.avgLatencyMs) : "—"}
              {inspected.errorCount > 0 && (
                <span className="text-red-400 ml-1.5">{inspected.errorCount} err</span>
              )}
            </span>
          </>
        ) : active ? (
          <>
            <span className="text-[#A1A1AA] flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-[#5B9EC2]"
                aria-hidden="true"
              />
              <span>Live · 24H</span>
            </span>
            <span className="text-[#A1A1AA]">
              {latestPoint
                ? `${formatCompactNumber(latestPoint.requests)} req/bin`
                : `${formatCompactNumber(totalCategoryRequests)} req`}
            </span>
          </>
        ) : (
          <>
            <span className="text-[#71717A]">24H telemetry</span>
            <span className="text-[#52525B]">0 req</span>
          </>
        )}
      </div>

      {/* Interactive hover & touch scrubbable chart canvas */}
      <div className="relative rounded-md bg-[#000000]/70 border border-[#18181B] px-1.5 py-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${categoryId.toUpperCase()} API live request activity chart. Hover or touch to inspect exact bucket requests.`}
          className={`w-full h-[56px] block select-none touch-none ${
            active ? "cursor-crosshair" : "cursor-default"
          }`}
          onPointerMove={(e) => selectFromClientX(e.clientX)}
          onPointerDown={(e) => {
            if (e.currentTarget.setPointerCapture) {
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // ignore synthetic pointer capture errors
              }
            }
            selectFromClientX(e.clientX);
          }}
          onPointerLeave={() => setInspectIdx(null)}
          onPointerCancel={() => setInspectIdx(null)}
          onTouchStart={(e) => {
            if (e.touches[0]) selectFromClientX(e.touches[0].clientX);
          }}
          onTouchMove={(e) => {
            if (e.touches[0]) selectFromClientX(e.touches[0].clientX);
          }}
          onTouchEnd={() => setInspectIdx(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentFill} stopOpacity={active ? "0.26" : "0.08"} />
              <stop offset="100%" stopColor={accentFill} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Subtle horizontal guide */}
          <line
            x1={padX}
            y1={padTop + innerH * 0.5}
            x2={width - padX}
            y2={padTop + innerH * 0.5}
            stroke="#18181B"
            strokeWidth="1"
            strokeDasharray="2 3"
          />

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

          {/* Smooth live line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth={active ? "1.75" : "1.25"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Subtle moving scan highlight when live & idle */}
          {active && inspectIdx === null && coords.length > 2 && (
            (() => {
              const scanPos = ((phase * 0.42) % 1) * innerW + padX;
              return (
                <line
                  x1={scanPos}
                  y1={padTop}
                  x2={scanPos}
                  y2={padTop + innerH}
                  stroke="#5B9EC2"
                  strokeOpacity="0.16"
                  strokeWidth="1"
                />
              );
            })()
          )}

          {/* Leading live telemetry dot */}
          {active && inspectIdx === null && tipCoord && maxVal > 0 && (
            <g>
              <circle
                cx={tipCoord.x}
                cy={tipCoord.y}
                r="5"
                fill="#5B9EC2"
                fillOpacity="0.18"
              />
              <circle
                cx={tipCoord.x}
                cy={tipCoord.y}
                r="2.4"
                fill="#7DD3FC"
                stroke="#000000"
                strokeWidth="1"
              />
            </g>
          )}

          {/* Active touch/hover crosshair & snapped node */}
          {inspectedCoord && inspected && (
            <g>
              <line
                x1={inspectedCoord.x}
                y1={padTop - 2}
                x2={inspectedCoord.x}
                y2={padTop + innerH + 2}
                stroke="#5B9EC2"
                strokeOpacity="0.6"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={inspectedCoord.x}
                cy={inspectedCoord.y}
                r="5.5"
                fill="#5B9EC2"
                fillOpacity="0.22"
              />
              <circle
                cx={inspectedCoord.x}
                cy={inspectedCoord.y}
                r="3"
                fill="#F4F4F5"
                stroke="#5B9EC2"
                strokeWidth="1.75"
              />
            </g>
          )}
        </svg>

        {/* Compact floating callout badge anchored near the touched point */}
        {inspected && inspectedCoord && (
          <div
            className="pointer-events-none absolute top-1.5 z-10 px-2 py-0.5 rounded bg-[#000000]/95 border border-[#27272A] font-mono text-[10.5px] text-[#F4F4F5] tabular-nums shadow-sm"
            style={{
              left: tooltipAlignRight ? "auto" : "6px",
              right: tooltipAlignRight ? "6px" : "auto",
            }}
          >
            {formatCompactNumber(inspected.requests)} req · {inspected.label}
          </div>
        )}
      </div>
    </div>
  );
}

export function ServiceBalanceGrid({
  wallets,
  activity,
  onOpenCategoryInPlayground,
  onOpenBilling,
}: ServiceBalanceGridProps) {
  const sparklinesByCategory = useMemo(() => {
    const now = Date.now();
    return {
      ai: computeCategorySparklineSeries(activity, "ai", 16, now),
      media: computeCategorySparklineSeries(activity, "media", 16, now),
      network: computeCategorySparklineSeries(activity, "network", 16, now),
      utilities: computeCategorySparklineSeries(activity, "utilities", 16, now),
    };
  }, [activity]);

  return (
    <section aria-label="Service Balances">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display text-[14px] font-semibold text-[#F4F4F5]">
            Service Wallets &amp; Live Telemetry
          </h2>
          <p className="text-[12px] text-[#71717A]">
            Touch or hover any service waveform to inspect per-interval request volume and latency
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenBilling}
          className="text-[12.5px] font-medium text-[#5B9EC2] hover:text-[#7DD3FC] transition-colors shrink-0"
        >
          Manage credits
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {GYRA_CATEGORIES.map((cat) => {
          const balance = wallets[cat.id] ?? 0;
          const catRequests = activity.filter((a) => a.category === cat.id);
          const series = sparklinesByCategory[cat.id];
          const isLive = cat.availability === "live";

          return (
            <div
              key={cat.id}
              className="bg-[#09090B] border border-[#1F1F23] rounded-lg p-4 flex flex-col justify-between gap-3.5 hover:border-[#2E2E34] transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-md border flex items-center justify-center shrink-0 ${
                      isLive
                        ? "bg-[#121215] border-[#27272A] text-[#5B9EC2]"
                        : "bg-[#000000] border-[#18181B] text-[#71717A]"
                    }`}
                  >
                    <CategoryIcon category={cat.id} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium text-[#F4F4F5] truncate">
                      {cat.name}
                    </p>
                    <p className="text-[11.5px] text-[#71717A]">
                      {isLive ? (
                        <span className="text-emerald-400">Operational</span>
                      ) : (
                        <span>Unavailable · Planned</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11.5px] text-[#A1A1AA] tabular-nums shrink-0 pt-0.5">
                  {formatCompactNumber(catRequests.length)} req
                </span>
              </div>

              {/* Balance */}
              <div>
                <p className="text-[11px] text-[#71717A]">Available balance</p>
                <p className="mt-0.5 font-mono text-[22px] font-semibold tracking-tight text-[#F4F4F5] tabular-nums">
                  {formatCurrency(balance)}
                </p>
              </div>

              {/* Live Moving & Touch/Hover Interactive Mini-Chart */}
              <LiveServiceSparkline
                categoryId={cat.id}
                series={series}
                active={isLive && catRequests.length > 0}
                totalCategoryRequests={catRequests.length}
              />

              {/* Footer */}
              <div className="pt-2.5 border-t border-[#18181B] flex items-center justify-between gap-2 text-[12px]">
                <span className="text-[#71717A] truncate">{cat.pricingSummary}</span>
                {isLive ? (
                  <button
                    type="button"
                    onClick={() => onOpenCategoryInPlayground(cat.id)}
                    className="inline-flex items-center gap-1 font-medium text-[#5B9EC2] hover:text-[#7DD3FC] whitespace-nowrap shrink-0"
                  >
                    <span>Test</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[#52525B] font-mono text-[11px] whitespace-nowrap shrink-0">
                    Soon
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
