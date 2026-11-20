"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy, Play, RotateCcw, Send } from "lucide-react";
import { computeRemainingMs } from "../../lib/carouselPhysics";
import {
  CHAT_SCENARIOS,
  getNextAgentIndex,
  getTotalPipelineDuration,
  resolveGyraRoute,
  type ChatModelId,
} from "../../lib/landingSimulations";

export interface ChatShowcaseProps {
  routeBase?: string;
}

type TraceStage = "idle" | "dropping" | "agents" | "streaming" | "complete";

export function ChatShowcase({ routeBase = "" }: ChatShowcaseProps) {
  const [scenarioId, setScenarioId] = useState(CHAT_SCENARIOS[0].id);
  const [modelTier, setModelTier] = useState<ChatModelId>("gyra-super2.0");
  const [activeAgentIdx, setActiveAgentIdx] = useState(CHAT_SCENARIOS[0].agents.length - 1);
  const [traceStage, setTraceStage] = useState<TraceStage>("complete");
  const [visibleLines, setVisibleLines] = useState<number>(999);
  const [copied, setCopied] = useState(false);
  const [dropNonce, setDropNonce] = useState(0);

  const scenario = CHAT_SCENARIOS.find((s) => s.id === scenarioId) ?? CHAT_SCENARIOS[0];
  const response = scenario.responseByModel[modelTier];
  const outputLines = response.output.split("\n");
  const agents = scenario.agents;
  const totalDuration = getTotalPipelineDuration(agents);
  const safeAgentIdx = Math.min(activeAgentIdx, Math.max(agents.length - 1, 0));

  const timerMetaRef = useRef<{
    id: number | null;
    startedAt: number;
    duration: number;
    remaining: number;
  }>({ id: null, startedAt: 0, duration: 0, remaining: 0 });

  // Visibility-safe sequenced animation: Prompt Drop -> 6-Agent Handoff -> Line-by-line Code Stream
  useEffect(() => {
    if (traceStage === "complete" || traceStage === "idle") return;

    const clearT = () => {
      if (timerMetaRef.current.id !== null) {
        window.clearTimeout(timerMetaRef.current.id);
        timerMetaRef.current.id = null;
      }
    };

    const runStep = (delay: number, fn: () => void) => {
      clearT();
      timerMetaRef.current.startedAt = performance.now();
      timerMetaRef.current.duration = delay;
      timerMetaRef.current.remaining = delay;
      if (document.hidden) return;
      timerMetaRef.current.id = window.setTimeout(fn, delay);
    };

    const advance = () => {
      if (traceStage === "dropping") {
        setTraceStage("agents");
        setActiveAgentIdx(0);
      } else if (traceStage === "agents") {
        if (activeAgentIdx >= agents.length - 1) {
          setTraceStage("streaming");
          setVisibleLines(1);
        } else {
          const next = getNextAgentIndex(activeAgentIdx, agents.length);
          setActiveAgentIdx(next === -1 ? agents.length - 1 : next);
        }
      } else if (traceStage === "streaming") {
        if (visibleLines >= outputLines.length) {
          setTraceStage("complete");
        } else {
          setVisibleLines((n) => Math.min(outputLines.length, n + 2));
        }
      }
    };

    const delayMs =
      traceStage === "dropping" ? 420 : traceStage === "agents" ? 360 : 58;

    runStep(delayMs, advance);

    const onVis = () => {
      if (document.hidden) {
        if (timerMetaRef.current.id !== null) {
          timerMetaRef.current.remaining = computeRemainingMs(
            timerMetaRef.current.startedAt,
            timerMetaRef.current.duration,
            performance.now(),
          );
          clearT();
        }
      } else if (timerMetaRef.current.id === null) {
        runStep(Math.max(40, timerMetaRef.current.remaining), advance);
      }
    };

    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clearT();
    };
  }, [traceStage, activeAgentIdx, visibleLines, agents.length, outputLines.length]);

  const startLiveRun = (nextScenarioId = scenarioId, nextModel = modelTier) => {
    setScenarioId(nextScenarioId);
    setModelTier(nextModel);
    setActiveAgentIdx(0);
    setVisibleLines(0);
    setDropNonce((n) => n + 1);
    setTraceStage("dropping");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.output);
    } catch {
      // Clipboard fallback ignored in restricted frames
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const isRunning = traceStage !== "complete" && traceStage !== "idle";
  const displayedOutput =
    traceStage === "complete"
      ? response.output
      : traceStage === "streaming"
        ? outputLines.slice(0, visibleLines).join("\n")
        : "";

  const progressPct =
    traceStage === "complete"
      ? 100
      : traceStage === "dropping"
        ? 8
        : traceStage === "agents"
          ? Math.round(14 + ((safeAgentIdx + 1) / agents.length) * 56)
          : Math.round(70 + (visibleLines / Math.max(1, outputLines.length)) * 30);

  return (
    <section id="chat" className="gyra-band-defer border-b border-[#DCE4EC] bg-white py-24 transition-colors duration-200 lg:py-32 dark:border-[#1F1F1F] dark:bg-black">
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
        {/* Header Row */}
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono-tech text-[12px] tracking-[0.14em] text-[#164E6D] uppercase dark:text-[#78B0CE]">
              [ 01 · Gyra Chat ]
            </p>
            <h2 className="font-display mt-3.5 text-[clamp(2.35rem,4.2vw,3.75rem)] leading-[0.96] tracking-[-0.02em] uppercase [text-wrap:balance]">
              <span className="font-light text-[#4A5C6E] dark:text-white/75">Conversational reasoning</span>{" "}
              <span className="font-bold text-[#0B1218] dark:text-white">built for real engineering.</span>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] leading-[1.65] text-[#4A5B6B] dark:text-[#9A9A9A]">
              Fast everyday answers on Gyra 1.0 and deep multi-step reasoning on SuperGyra 2.0.
              Drop any build prompt to watch the six-agent pipeline verify and stream output live.
            </p>
            <a
              href={resolveGyraRoute("/dashboard", routeBase)}
              className="font-mono-tech mt-4 inline-flex items-center gap-1.5 text-[12px] tracking-[0.1em] text-[#0B1218] uppercase underline decoration-[#1B587A] underline-offset-4 transition-colors hover:text-[#1B587A] dark:text-white dark:decoration-[#5B9EC2] dark:hover:text-[#5B9EC2]"
            >
              Open Gyra Chat
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Pitch-Black Razor-Bordered Interactive Workbench */}
        <div className="mt-12 border border-[#D4DFE9] bg-white shadow-[0_22px_60px_-34px_rgba(11,18,24,0.18)] dark:border-[#1F1F1F] dark:bg-black dark:shadow-none">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE4EC] bg-[#F7FAFC] px-4 py-3 sm:px-5 dark:border-[#1F1F1F] dark:bg-[#050505]">
            <div role="tablist" aria-label="Gyra Chat scenarios" className="flex flex-wrap gap-1.5">
              {CHAT_SCENARIOS.map((item) => {
                const selected = item.id === scenario.id;
                return (
                  <button
                    key={item.id}
                    id={`gyra-chat-tab-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="gyra-chat-tabpanel"
                    onClick={() => startLiveRun(item.id, modelTier)}
                    className={`font-mono-tech min-h-[34px] border px-3 text-[11px] tracking-[0.06em] uppercase transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2] ${
                      selected
                        ? "border-[#1B587A] bg-[#1B587A] text-white dark:border-[#5B9EC2] dark:bg-[#1F5B7C]/20 dark:text-white"
                        : "border-[#D4DFE9] bg-white text-[#4A5C6E] hover:border-[#1B587A] hover:text-[#0B1218] dark:border-[#242424] dark:bg-black dark:text-[#8A8A8A] dark:hover:border-[#444] dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div
                role="group"
                aria-label="Select Gyra Chat model"
                className="inline-flex border border-[#D4DFE9] bg-white dark:border-[#242424] dark:bg-black"
              >
                <button
                  type="button"
                  onClick={() => startLiveRun(scenarioId, "gyra-1.0")}
                  aria-pressed={modelTier === "gyra-1.0"}
                  className={`font-mono-tech min-h-[32px] px-3 text-[11px] tracking-[0.06em] uppercase transition-colors cursor-pointer ${
                    modelTier === "gyra-1.0"
                      ? "bg-[#0B1218] font-medium text-white dark:bg-white dark:text-black"
                      : "text-[#526475] hover:text-[#0B1218] dark:text-[#8A8A8A] dark:hover:text-white"
                  }`}
                >
                  Gyra 1.0
                </button>
                <button
                  type="button"
                  onClick={() => startLiveRun(scenarioId, "gyra-super2.0")}
                  aria-pressed={modelTier === "gyra-super2.0"}
                  className={`font-mono-tech min-h-[32px] border-l border-[#242424] px-3 text-[11px] tracking-[0.06em] uppercase transition-colors cursor-pointer ${
                    modelTier === "gyra-super2.0"
                      ? "bg-[#0B1218] font-medium text-white dark:bg-white dark:text-black"
                      : "text-[#526475] hover:text-[#0B1218] dark:text-[#8A8A8A] dark:hover:text-white"
                  }`}
                >
                  SuperGyra 2.0
                </button>
              </div>

              <button
                type="button"
                onClick={() => startLiveRun(scenarioId, modelTier)}
                className="font-mono-tech inline-flex min-h-[34px] items-center gap-1.5 bg-[#1F5B7C] px-3.5 text-[11px] font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#296E93] cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
              >
                {isRunning ? (
                  <>
                    <RotateCcw className="h-3 w-3 animate-spin" />
                    Tracing
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current" />
                    Run Trace
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Slim Live Pipeline Progress Rail */}
          <div className="h-[2px] w-full bg-[#111922] overflow-hidden">
            <div
              className="h-full transition-all duration-300 ease-out"
              style={{
                width: `${progressPct}%`,
                backgroundColor: traceStage === "complete" ? "#4A9A80" : "#5B9EC2",
              }}
            />
          </div>

          {/* Two-Column Execution Body */}
          <div
            id="gyra-chat-tabpanel"
            role="tabpanel"
            aria-labelledby={`gyra-chat-tab-${scenario.id}`}
            className="grid grid-cols-1 divide-y divide-[#DCE4EC] lg:grid-cols-12 lg:divide-x lg:divide-y-0 dark:divide-[#1F1F1F]"
          >
            {/* Left 4 cols: 6-Agent Pipeline Rail */}
            <div className="flex flex-col justify-between bg-black p-5 sm:p-6 lg:col-span-4">
              <div>
                <div className="flex items-center justify-between font-mono-tech text-[11px] tracking-[0.1em] uppercase">
                  <span className="text-[#8A8A8A]">{agents.length}-Agent Pipeline</span>
                  <span className={traceStage === "complete" ? "text-[#4A9A80]" : "text-[#5B9EC2]"}>
                    {traceStage === "dropping"
                      ? "Ingesting Prompt"
                      : traceStage === "agents"
                        ? `Handoff ${safeAgentIdx + 1}/${agents.length}`
                        : traceStage === "streaming"
                          ? "Streaming Output"
                          : `${totalDuration}s verified`}
                  </span>
                </div>

                <div className="mt-4 divide-y divide-[#181818] border border-[#1F1F1F]">
                  {agents.map((agent, idx) => {
                    const isCurrent = idx === safeAgentIdx && traceStage !== "dropping";
                    const isPassed =
                      traceStage === "complete" ||
                      traceStage === "streaming" ||
                      (traceStage === "agents" && idx < safeAgentIdx);
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => {
                          setTraceStage("complete");
                          setVisibleLines(outputLines.length);
                          setActiveAgentIdx(idx);
                        }}
                        className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#5B9EC2] ${
                          isCurrent && traceStage === "agents"
                            ? "bg-[#081A28] text-white"
                            : isCurrent
                              ? "bg-[#111111] text-white"
                              : "bg-black text-[#8A8A8A] hover:bg-[#080808] hover:text-[#D4D4D4]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`font-mono-tech text-[10px] ${
                              isCurrent && traceStage === "agents"
                                ? "text-[#9CC4DC]"
                                : isPassed
                                  ? "text-[#4A9A80]"
                                  : "text-[#555555]"
                            }`}
                          >
                            {isPassed && traceStage !== "agents" ? "✓" : agent.order}
                          </span>
                          <span className="text-[13px] font-medium">{agent.name}</span>
                          <span className="font-mono-tech text-[10px] text-[#666666] uppercase">
                            {agent.role}
                          </span>
                        </div>
                        <span className="font-mono-tech text-[11px] text-[#737373]">
                          {agent.durationSec.toFixed(1)}s
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 border border-[#1F1F1F] bg-[#050505] p-3.5">
                <p className="font-mono-tech text-[10px] tracking-[0.1em] text-[#5B9EC2] uppercase">
                  Step {agents[safeAgentIdx].order} · {agents[safeAgentIdx].name}
                </p>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-[#C8C8C8]">
                  {agents[safeAgentIdx].summary}
                </p>
              </div>
            </div>

            {/* Right 8 cols: Prompt Drop Capsule, Reasoner Note & Live Streamed Output */}
            <div className="flex flex-col justify-between bg-black p-5 sm:p-6 lg:col-span-8">
              <div>
                {/* Inbound Prompt Card with crisp drop-in settle animation */}
                <div
                  key={`${scenario.id}-${dropNonce}`}
                  className="gyra-prompt-drop border border-[#1E3244] bg-[#05090F] px-4 py-3.5"
                >
                  <div className="flex items-center justify-between gap-2 font-mono-tech text-[10px] tracking-[0.12em] uppercase">
                    <span className="inline-flex items-center gap-1.5 text-[#78B0CE]">
                      <Send className="h-3 w-3" />
                      User Prompt · Dropped into Gyra Core
                    </span>
                    <span className="text-[#6E8599]">
                      {traceStage === "dropping" ? "Dispatching..." : "Routed"}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[15px] leading-[1.55] text-white">{scenario.prompt}</p>
                </div>

                {response.reasoningNote && (
                  <div className="mt-4 border border-[#242424] bg-[#060606] px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[10px] tracking-[0.1em] uppercase">
                      <span className="text-[#5B9EC2]">
                        {modelTier === "gyra-super2.0"
                          ? "SuperGyra 2.0 · Deep Reasoning"
                          : "Gyra 1.0 · Fast Path"}
                      </span>
                      <span className="text-[#808080]">{response.latencyLabel}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-[#B8B8B8]">
                      {response.reasoningNote}
                    </p>
                  </div>
                )}

                <div className="mt-4 border border-[#1F1F1F] bg-[#030303]">
                  <div className="flex items-center justify-between border-b border-[#1A1A1A] px-4 py-2.5">
                    <span className="font-mono-tech text-[11px] text-[#8A8A8A]">
                      {traceStage === "dropping"
                        ? "Routing prompt into Gyra Core..."
                        : traceStage === "agents"
                          ? `Executing ${agents[safeAgentIdx].name} (${agents[safeAgentIdx].role})...`
                          : traceStage === "streaming"
                            ? `Streaming verified output (${visibleLines}/${outputLines.length} lines)...`
                            : response.latencyLabel}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="font-mono-tech inline-flex items-center gap-1.5 border border-[#262626] bg-black px-2.5 py-1 text-[10px] tracking-[0.08em] text-[#D4D4D4] uppercase transition-colors hover:border-white hover:text-white cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-[#4A9A80]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre
                    role="region"
                    aria-label={`Gyra Chat output for ${scenario.label}`}
                    tabIndex={0}
                    className="min-h-[210px] max-h-[300px] overflow-x-auto overflow-y-auto p-4 font-mono-tech text-[12px] leading-[1.65] text-[#E0E0E0] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#5B9EC2]"
                  >
                    {displayedOutput ? (
                      <code>
                        {displayedOutput}
                        {traceStage === "streaming" && <span className="gyra-cursor ml-1" aria-hidden="true" />}
                      </code>
                    ) : (
                      <code className="text-[#6F889C]">
                        {traceStage === "dropping"
                          ? "> Prompt received by Gyra Core. Classifying constraints..."
                          : `> [${agents[safeAgentIdx].order} ${agents[safeAgentIdx].name}] ${agents[safeAgentIdx].summary}`}
                        <span className="gyra-cursor ml-1.5" aria-hidden="true" />
                      </code>
                    )}
                  </pre>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#1A1A1A] pt-4 font-mono-tech text-[11px]">
                <span className="text-[#737373]">
                  FREE UP TO 20 MESSAGES / THREAD · UNLIMITED ON SUPERGYRA
                </span>
                <a
                  href={resolveGyraRoute("/dashboard", routeBase)}
                  className="inline-flex items-center gap-1 text-white uppercase hover:text-[#5B9EC2]"
                >
                  Open workspace
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
