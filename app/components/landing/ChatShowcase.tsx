"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Copy, Play, RotateCcw } from "lucide-react";
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

export function ChatShowcase({ routeBase = "" }: ChatShowcaseProps) {
  const [scenarioId, setScenarioId] = useState(CHAT_SCENARIOS[0].id);
  const [modelTier, setModelTier] = useState<ChatModelId>("gyra-super2.0");
  const [activeAgentIdx, setActiveAgentIdx] = useState(3);
  const [isTracing, setIsTracing] = useState(false);
  const [copied, setCopied] = useState(false);

  const scenario = CHAT_SCENARIOS.find((s) => s.id === scenarioId) ?? CHAT_SCENARIOS[0];
  const response = scenario.responseByModel[modelTier];
  const agents = scenario.agents;
  const totalDuration = getTotalPipelineDuration(agents);
  const safeAgentIdx = Math.min(activeAgentIdx, Math.max(agents.length - 1, 0));

  useEffect(() => {
    if (!isTracing) return;
    const timer = window.setTimeout(() => {
      const next = getNextAgentIndex(activeAgentIdx, agents.length);
      if (next === -1) {
        setIsTracing(false);
      } else {
        setActiveAgentIdx(next);
      }
    }, 480);
    return () => window.clearTimeout(timer);
  }, [isTracing, activeAgentIdx, agents.length]);

  const handleRunTrace = () => {
    setActiveAgentIdx(0);
    setIsTracing(true);
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

  return (
    <section id="chat" className="border-b border-[#1F1F1F] bg-black py-24 lg:py-32">
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
        {/* Header Row */}
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono-tech text-[12px] tracking-[0.14em] text-[#FF3D00] uppercase">
              [ 01 · Gyra Chat ]
            </p>
            <h2 className="font-display mt-3.5 text-[clamp(2.35rem,4.2vw,3.75rem)] font-bold leading-[0.98] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
              Conversational reasoning built for real engineering.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] leading-[1.65] text-[#9A9A9A]">
              Fast everyday answers on Gyra 1.0 and deep multi-step reasoning on SuperGyra 2.0.
              Complex build prompts coordinate a six-agent pipeline with live search, files, vision,
              and voice.
            </p>
            <a
              href={resolveGyraRoute("/dashboard", routeBase)}
              className="font-mono-tech mt-4 inline-flex items-center gap-1.5 text-[12px] tracking-[0.1em] text-white uppercase underline decoration-[#FF3D00] underline-offset-4 transition-colors hover:text-[#FF3D00]"
            >
              Open Gyra Chat
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Pitch-Black Razor-Bordered Interactive Workbench */}
        <div className="mt-12 border border-[#1F1F1F] bg-black">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1F1F1F] bg-[#050505] px-4 py-3 sm:px-5">
            <div role="tablist" aria-label="Gyra Chat scenarios" className="flex flex-wrap gap-1.5">
              {CHAT_SCENARIOS.map((item) => {
                const selected = item.id === scenario.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      setScenarioId(item.id);
                      setActiveAgentIdx(Math.min(3, item.agents.length - 1));
                      setIsTracing(false);
                    }}
                    className={`font-mono-tech min-h-[34px] border px-3 text-[11px] tracking-[0.06em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FF3D00] ${
                      selected
                        ? "border-[#FF3D00] bg-[#FF3D00]/12 text-white"
                        : "border-[#242424] bg-black text-[#8A8A8A] hover:border-[#444] hover:text-white"
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
                className="inline-flex border border-[#242424] bg-black"
              >
                <button
                  type="button"
                  onClick={() => setModelTier("gyra-1.0")}
                  aria-pressed={modelTier === "gyra-1.0"}
                  className={`font-mono-tech min-h-[32px] px-3 text-[11px] tracking-[0.06em] uppercase transition-colors ${
                    modelTier === "gyra-1.0"
                      ? "bg-white font-medium text-black"
                      : "text-[#8A8A8A] hover:text-white"
                  }`}
                >
                  Gyra 1.0
                </button>
                <button
                  type="button"
                  onClick={() => setModelTier("gyra-super2.0")}
                  aria-pressed={modelTier === "gyra-super2.0"}
                  className={`font-mono-tech min-h-[32px] border-l border-[#242424] px-3 text-[11px] tracking-[0.06em] uppercase transition-colors ${
                    modelTier === "gyra-super2.0"
                      ? "bg-white font-medium text-black"
                      : "text-[#8A8A8A] hover:text-white"
                  }`}
                >
                  SuperGyra 2.0
                </button>
              </div>

              <button
                type="button"
                onClick={handleRunTrace}
                className="font-mono-tech inline-flex min-h-[34px] items-center gap-1.5 bg-[#FF3D00] px-3.5 text-[11px] font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#FF551F] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
              >
                {isTracing ? (
                  <>
                    <RotateCcw className="h-3 w-3 animate-spin" />
                    Running
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

          {/* Two-Column Execution Body */}
          <div className="grid grid-cols-1 divide-y divide-[#1F1F1F] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
            {/* Left 4 cols: 6-Agent Pipeline Rail */}
            <div className="flex flex-col justify-between bg-black p-5 sm:p-6 lg:col-span-4">
              <div>
                <div className="flex items-center justify-between font-mono-tech text-[11px] tracking-[0.1em] uppercase">
                  <span className="text-[#8A8A8A]">{agents.length}-Agent Pipeline</span>
                  <span className="text-[#FF3D00]">{totalDuration}s trace</span>
                </div>

                <div className="mt-4 divide-y divide-[#181818] border border-[#1F1F1F]">
                  {agents.map((agent, idx) => {
                    const isCurrent = idx === safeAgentIdx;
                    const isPassed = idx < safeAgentIdx;
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => {
                          setIsTracing(false);
                          setActiveAgentIdx(idx);
                        }}
                        className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#FF3D00] ${
                          isCurrent
                            ? "bg-[#111111] text-white"
                            : "bg-black text-[#8A8A8A] hover:bg-[#080808] hover:text-[#D4D4D4]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`font-mono-tech text-[10px] ${
                              isCurrent
                                ? "text-[#FF3D00]"
                                : isPassed
                                  ? "text-white"
                                  : "text-[#555555]"
                            }`}
                          >
                            {agent.order}
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
                <p className="font-mono-tech text-[10px] tracking-[0.1em] text-[#FF3D00] uppercase">
                  Step {agents[safeAgentIdx].order} · {agents[safeAgentIdx].name}
                </p>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-[#C8C8C8]">
                  {agents[safeAgentIdx].summary}
                </p>
              </div>
            </div>

            {/* Right 8 cols: Prompt, Reasoner Note & Code Output */}
            <div className="flex flex-col justify-between bg-black p-5 sm:p-6 lg:col-span-8">
              <div>
                <div className="border-b border-[#1A1A1A] pb-4">
                  <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#737373] uppercase">
                    User Prompt
                  </p>
                  <p className="mt-1.5 text-[15px] leading-[1.55] text-white">{scenario.prompt}</p>
                </div>

                {response.reasoningNote && (
                  <div className="mt-4 border border-[#242424] bg-[#060606] px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tech text-[10px] tracking-[0.1em] uppercase">
                      <span className="text-[#FF3D00]">
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
                      {response.latencyLabel}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="font-mono-tech inline-flex items-center gap-1.5 border border-[#262626] bg-black px-2.5 py-1 text-[10px] tracking-[0.08em] text-[#D4D4D4] uppercase transition-colors hover:border-white hover:text-white"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-[#FF3D00]" />
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
                  <pre className="max-h-[300px] overflow-x-auto overflow-y-auto p-4 font-mono-tech text-[12px] leading-[1.65] text-[#E0E0E0]">
                    <code>{response.output}</code>
                  </pre>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#1A1A1A] pt-4 font-mono-tech text-[11px]">
                <span className="text-[#737373]">
                  FREE UP TO 20 MESSAGES / THREAD · UNLIMITED ON SUPERGYRA
                </span>
                <a
                  href={resolveGyraRoute("/dashboard", routeBase)}
                  className="inline-flex items-center gap-1 text-white uppercase hover:text-[#FF3D00]"
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
