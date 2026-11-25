"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Copy, FastForward, Radio } from "lucide-react";
import {
  advanceSmoothTyping,
  splitStreamingMarkdown,
  type StreamMetrics,
} from "../../lib/streaming";

interface LiveStreamVisualizerProps {
  text: string;
  streaming: boolean;
  model?: string;
  metrics?: StreamMetrics;
  isSamplePreview?: boolean;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[#F4F4F5]">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith("`") && tok.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-[#121215] border border-[#27272A] font-mono text-[12px] text-[#7DD3FC]"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{tok}</span>;
  });
}

function VelocityCadenceBars({
  history,
  active,
}: {
  history: number[];
  active: boolean;
}) {
  const slots = 18;
  const padded = useMemo(() => {
    const slice = history.slice(-slots);
    if (slice.length >= slots) return slice;
    return [...new Array<number>(slots - slice.length).fill(0), ...slice];
  }, [history]);

  const maxV = Math.max(20, ...padded);

  return (
    <svg
      width="74"
      height="18"
      viewBox="0 0 74 18"
      aria-label="Live token throughput cadence"
      className="shrink-0"
    >
      {padded.map((v, idx) => {
        const h = v > 0 ? Math.max(2.5, (v / maxV) * 16) : 1.5;
        const x = idx * 4.1;
        const y = 17 - h;
        const isLatest = idx === slots - 1;
        const fill =
          v === 0
            ? "#18181B"
            : active && isLatest
              ? "#7DD3FC"
              : active
                ? "#5B9EC2"
                : "#3F6D88";
        return (
          <rect
            key={idx}
            x={x.toFixed(1)}
            y={y.toFixed(1)}
            width="2.6"
            height={h.toFixed(1)}
            rx="0.75"
            fill={fill}
          />
        );
      })}
    </svg>
  );
}

export function LiveStreamVisualizer({
  text,
  streaming,
  model,
  metrics,
  isSamplePreview = false,
}: LiveStreamVisualizerProps) {
  const [displayedLen, setDisplayedLen] = useState<number>(() =>
    streaming ? 0 : text.length
  );
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const prevTextRef = useRef<string>(text);
  const targetLenRef = useRef<number>(text.length);
  const streamingRef = useRef<boolean>(streaming);
  targetLenRef.current = text.length;
  streamingRef.current = streaming;

  // Reset display cursor when a brand-new response stream starts
  useEffect(() => {
    const prev = prevTextRef.current;
    if (text.length < prev.length || (prev.length > 0 && !text.startsWith(prev.slice(0, 12)))) {
      setDisplayedLen(streaming ? 0 : text.length);
    } else if (!streaming && !metrics) {
      setDisplayedLen(text.length);
    }
    prevTextRef.current = text;
  }, [text, streaming, metrics]);

  // Continuous 60fps adaptive smooth typing animation loop (respects prefers-reduced-motion)
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplayedLen(targetLenRef.current);
      return;
    }

    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      const targetLen = targetLenRef.current;
      let shouldContinue = false;

      setDisplayedLen((curr) => {
        if (curr >= targetLen) {
          shouldContinue = streamingRef.current;
          return curr;
        }
        const next = advanceSmoothTyping(targetLen, curr, dt, streamingRef.current);
        shouldContinue = next < targetLen || streamingRef.current;
        return next;
      });

      if (shouldContinue || streamingRef.current) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [text.length > 0, streaming]);

  const isTypingActive = streaming || displayedLen < text.length;
  const visibleText = text.slice(0, displayedLen);
  const segments = useMemo(() => splitStreamingMarkdown(visibleText), [visibleText]);

  const copyCode = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  const statusLabel =
    metrics?.status === "cancelled"
      ? "Stream stopped"
      : isTypingActive
        ? isSamplePreview
          ? "Simulated stream"
          : "Streaming live"
        : "Stream complete";

  const statusDotClass =
    metrics?.status === "cancelled"
      ? "bg-amber-400"
      : isTypingActive
        ? "bg-[#5B9EC2]"
        : "bg-emerald-400";

  const caret = isTypingActive ? (
    <span
      className="inline-block w-[7px] h-[15px] bg-[#7DD3FC] align-middle ml-0.5 rounded-[1px] animate-pulse"
      aria-label="Generating tokens"
    />
  ) : null;

  return (
    <div className="space-y-3.5">
      {/* Live Stream Telemetry Header */}
      <div className="rounded-md bg-[#09090B] border border-[#1F1F23] px-3 py-2 flex flex-wrap items-center justify-between gap-2.5 text-[11.5px] font-mono tabular-nums">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0">
            {isTypingActive && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#5B9EC2]/45 animate-ping" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusDotClass}`} />
          </span>
          <span className="text-[#E4E4E7] font-medium whitespace-nowrap">{statusLabel}</span>
          {model && (
            <>
              <span className="text-[#3F3F46]">·</span>
              <span className="text-[#A1A1AA] truncate">{model}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {metrics && (
            <>
              {metrics.ttftMs !== null && (
                <span className="text-[#A1A1AA]" title="Time to first token">
                  TTFT <strong className="text-[#D4D4D8] font-medium">{metrics.ttftMs}ms</strong>
                </span>
              )}
              {metrics.tokensPerSec > 0 && (
                <span className="text-[#A1A1AA]" title="Live token generation velocity">
                  <strong className="text-[#7DD3FC] font-medium">
                    {metrics.tokensPerSec.toFixed(1)}
                  </strong>{" "}
                  tok/s
                </span>
              )}
              {metrics.tokenCount > 0 && (
                <span className="text-[#71717A]">{metrics.tokenCount} tok</span>
              )}
              <VelocityCadenceBars
                history={metrics.velocityHistory}
                active={isTypingActive}
              />
            </>
          )}

          {displayedLen < text.length && !streaming && (
            <button
              type="button"
              onClick={() => setDisplayedLen(text.length)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#121215] hover:bg-[#18181B] border border-[#27272A] text-[#D4D4D8] text-[11px] transition-colors"
              title="Finish rendering immediately"
            >
              <FastForward className="w-3 h-3" />
              <span>Instant</span>
            </button>
          )}
        </div>
      </div>

      {/* Waiting for first token state */}
      {visibleText.length === 0 && streaming ? (
        <div className="py-6 px-3 rounded-md bg-[#000000]/60 border border-[#18181B] flex items-center gap-2.5 text-[12.5px] font-mono text-[#A1A1AA]">
          <Radio className="w-4 h-4 text-[#5B9EC2] animate-pulse shrink-0" />
          <span>Connected to stream — awaiting first token...</span>
        </div>
      ) : (
        /* Smooth Typing Markdown Output Canvas */
        <div
          className="space-y-3 text-[13.5px] leading-[1.68] text-[#E4E4E7]"
          aria-live="polite"
        >
          {segments.map((seg, idx) => {
            const isLastSegment = idx === segments.length - 1;

            if (seg.type === "code") {
              return (
                <div
                  key={idx}
                  className="rounded-md bg-[#000000] border border-[#1F1F23] overflow-hidden"
                >
                  <div className="px-3 py-1.5 border-b border-[#18181B] flex items-center justify-between text-[11px] font-mono text-[#71717A]">
                    <span className="flex items-center gap-2">
                      <span>{seg.lang || "code"}</span>
                      {!seg.closed && isTypingActive && (
                        <span className="text-[#5B9EC2]">writing...</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyCode(seg.content, idx)}
                      className="inline-flex items-center gap-1 text-[#A1A1AA] hover:text-[#F4F4F5]"
                    >
                      {copiedIdx === idx ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedIdx === idx ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                  <pre className="p-3 overflow-x-auto font-mono text-[12px] leading-[1.6] text-[#D4D4D8]">
                    <code>
                      {seg.content}
                      {isLastSegment && caret}
                    </code>
                  </pre>
                </div>
              );
            }

            const paragraphs = seg.content
              .split("\n\n")
              .filter((p) => p.trim().length > 0);

            return (
              <div key={idx} className="space-y-2.5">
                {paragraphs.map((para, pIdx) => {
                  const isLastPara = isLastSegment && pIdx === paragraphs.length - 1;
                  const lines = para.split("\n").map((l) => l.trimEnd());

                  if (lines[0]?.startsWith("### ")) {
                    return (
                      <h4
                        key={pIdx}
                        className="font-display text-[15px] font-semibold text-[#F4F4F5] pt-1"
                      >
                        {lines[0].slice(4)}
                        {isLastPara && caret}
                      </h4>
                    );
                  }

                  const bulletLines = lines.filter((l) => l.trimStart().startsWith("- "));
                  if (bulletLines.length > 0 && bulletLines.length >= lines.length - 1) {
                    const headingLine = !lines[0].trimStart().startsWith("- ")
                      ? lines[0]
                      : null;
                    return (
                      <div key={pIdx} className="space-y-1.5">
                        {headingLine && (
                          <p className="text-[#E4E4E7]">{renderInlineMarkdown(headingLine)}</p>
                        )}
                        <ul className="space-y-1.5 pl-4 list-disc marker:text-[#5B9EC2]">
                          {bulletLines.map((b, bIdx) => {
                            const isLastBullet =
                              isLastPara && bIdx === bulletLines.length - 1;
                            return (
                              <li key={bIdx} className="text-[#D4D4D8]">
                                {renderInlineMarkdown(b.trimStart().slice(2))}
                                {isLastBullet && caret}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  }

                  return (
                    <p key={pIdx} className="whitespace-pre-wrap break-words text-[#D4D4D8]">
                      {renderInlineMarkdown(para)}
                      {isLastPara && caret}
                    </p>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
