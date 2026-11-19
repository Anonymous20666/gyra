"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Copy, Play, RotateCcw } from "lucide-react";
import { CORE_PRODUCTS } from "../../lib/gyraCatalog";
import {
  CHAT_MODELS,
  CHAT_SCENARIOS,
  getNextAgentIndex,
  getTotalPipelineDuration,
  resolveGyraRoute,
  type ChatModelId,
} from "../../lib/landingSimulations";
import { usePointerBorder } from "./usePointerBorder";

interface ChatShowcaseProps {
  routeBase?: string;
}

export function ChatShowcase({ routeBase = "" }: ChatShowcaseProps) {
  const [scenarioId, setScenarioId] = useState<string>(CHAT_SCENARIOS[0].id);
  const [model, setModel] = useState<ChatModelId>("gyra-super2.0");
  const [activeAgentIdx, setActiveAgentIdx] = useState<number>(CHAT_SCENARIOS[0].agents.length - 1);
  const [selectedStepIdx, setSelectedStepIdx] = useState<number>(3);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const pointer = usePointerBorder<HTMLDivElement>();

  const product = CORE_PRODUCTS[0];
  const scenario = CHAT_SCENARIOS.find((s) => s.id === scenarioId) ?? CHAT_SCENARIOS[0];
  const response = scenario.responseByModel[model];
  const totalSec = getTotalPipelineDuration(scenario.agents);
  const inspectedAgent = scenario.agents[Math.min(selectedStepIdx, scenario.agents.length - 1)];

  useEffect(() => {
    if (!isRunning) return;
    if (activeAgentIdx >= scenario.agents.length - 1) {
      setIsRunning(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setActiveAgentIdx((curr) => {
        const next = getNextAgentIndex(curr, scenario.agents.length);
        setSelectedStepIdx(next);
        return next;
      });
    }, 340);
    return () => window.clearTimeout(timer);
  }, [isRunning, activeAgentIdx, scenario.agents.length]);

  const handleSelectScenario = (id: string) => {
    const nextScenario = CHAT_SCENARIOS.find((s) => s.id === id) ?? CHAT_SCENARIOS[0];
    setScenarioId(id);
    setIsRunning(false);
    setActiveAgentIdx(nextScenario.agents.length - 1);
    setSelectedStepIdx(Math.min(nextScenario.agents.length - 1, 1));
  };

  const handleRunTrace = () => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setActiveAgentIdx(scenario.agents.length - 1);
      setSelectedStepIdx(scenario.agents.length - 1);
      setIsRunning(false);
      return;
    }
    setActiveAgentIdx(0);
    setSelectedStepIdx(0);
    setIsRunning(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      id="chat"
      aria-labelledby="chat-heading"
      className="bg-[#050608] border-b border-white/[0.08] scroll-mt-16"
    >
      <div className="max-w-[1280px] mx-auto gyra-grid-rail px-5 sm:px-8 py-20 lg:py-24">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#67E8F9] mb-3">
              01 / Gyra Chat
            </p>
            <h2
              id="chat-heading"
              className="font-display font-semibold text-[30px] sm:text-[38px] lg:text-[42px] tracking-[-0.03em] leading-[1.08] text-[#F5F7FA] [text-wrap:balance]"
            >
              Conversational reasoning built for real engineering and daily work.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] text-[#A0A8B8] leading-[1.65] mb-4">
              {product.summary}
            </p>
            <a
              href={resolveGyraRoute(product.route, routeBase)}
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#F5F7FA] hover:text-[#67E8F9] transition-colors"
            >
              {product.ctaLabel}
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Interactive Workbench */}
        <div
          {...pointer}
          className="gyra-frame gyra-frame-interactive rounded-[6px] overflow-hidden"
        >
          {/* Workbench Control Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-5 py-3.5 bg-[#0E1117] border-b border-white/[0.08]">
            <div
              className="flex flex-wrap items-center gap-1.5"
              role="tablist"
              aria-label="Gyra Chat scenarios"
            >
              {CHAT_SCENARIOS.map((item) => {
                const active = item.id === scenario.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleSelectScenario(item.id)}
                    className={`px-3 py-1.5 rounded-[4px] text-[12px] font-medium transition-colors ${
                      active
                        ? "bg-[#181D27] text-[#F5F7FA] border border-white/[0.14]"
                        : "text-[#8B94A6] hover:text-[#F5F7FA] border border-transparent"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5">
              <div
                className="inline-flex bg-[#050608] border border-white/[0.1] rounded-[4px] p-0.5"
                role="group"
                aria-label="Select Gyra Chat model"
              >
                {(Object.keys(CHAT_MODELS) as ChatModelId[]).map((id) => {
                  const active = model === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setModel(id)}
                      className={`px-2.5 py-1 rounded-[3px] font-mono text-[11px] transition-colors ${
                        active
                          ? "bg-[#181D27] text-[#67E8F9]"
                          : "text-[#8B94A6] hover:text-[#F5F7FA]"
                      }`}
                    >
                      {CHAT_MODELS[id].name}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleRunTrace}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#F1F5F9] text-[#050608] hover:bg-white font-mono text-[11px] font-medium transition-colors"
              >
                {isRunning ? (
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <Play className="w-3 h-3" aria-hidden="true" />
                )}
                {isRunning ? "Running" : "Run Trace"}
              </button>
            </div>
          </div>

          {/* Main Split Pane */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
            {/* Left Rail: Pipeline Execution */}
            <div className="lg:col-span-4 bg-[#090B0F] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#667085]">
                    {scenario.usesPipeline ? "6-Agent Pipeline" : "Document Pipeline"}
                  </span>
                  <span className="font-mono text-[11px] text-[#8B94A6]">
                    {totalSec.toFixed(1)}s trace
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {scenario.agents.map((agent, idx) => {
                    const completed = idx <= activeAgentIdx;
                    const activeNow = isRunning && idx === activeAgentIdx;
                    const selected = idx === selectedStepIdx;
                    return (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => setSelectedStepIdx(idx)}
                        className={`w-full text-left px-3 py-2.5 rounded-[4px] border transition-colors ${
                          selected
                            ? "bg-[#141821] border-white/[0.16]"
                            : "bg-[#0D1016] border-white/[0.06] hover:border-white/[0.12]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="font-mono text-[11px]"
                              style={{ color: completed ? "#67E8F9" : "#4E5666" }}
                            >
                              {agent.order}
                            </span>
                            <span
                              className={`text-[13px] font-medium ${
                                completed ? "text-[#F5F7FA]" : "text-[#667085]"
                              }`}
                            >
                              {agent.name}
                            </span>
                            <span className="text-[11px] text-[#667085]">· {agent.role}</span>
                          </div>
                          <span className="font-mono text-[11px] text-[#667085]">
                            {activeNow ? "active" : completed ? `${agent.durationSec}s` : "queued"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {inspectedAgent && (
                <div className="mt-5 pt-4 border-t border-white/[0.08]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#67E8F9] mb-1.5">
                    Step {inspectedAgent.order} · {inspectedAgent.name} Log
                  </p>
                  <p className="text-[12px] text-[#A0A8B8] leading-[1.55]">
                    {inspectedAgent.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Right Pane: Prompt + Live Output */}
            <div className="lg:col-span-8 bg-[#0B0D11] p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="mb-4 pb-4 border-b border-white/[0.07]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#667085] mb-1.5">
                    User Prompt
                  </p>
                  <p className="text-[14px] sm:text-[15px] text-[#F5F7FA] leading-[1.55]">
                    {scenario.prompt}
                  </p>
                </div>

                <div
                  aria-live="polite"
                  className="bg-[#101319] border border-white/[0.07] rounded-[4px] px-4 py-3 mb-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[11px] text-[#67E8F9]">
                      {CHAT_MODELS[model].name} · {CHAT_MODELS[model].tier}
                    </span>
                    <span className="font-mono text-[11px] text-[#667085]">
                      {isRunning
                        ? `Executing ${scenario.agents[activeAgentIdx]?.name}...`
                        : response.latencyLabel}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#A0A8B8] leading-[1.55]">
                    {response.reasoningNote}
                  </p>
                </div>

                <div className="bg-[#050608] border border-white/[0.08] rounded-[4px] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
                    <span className="font-mono text-[11px] text-[#8B94A6]">
                      Response Output
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#8B94A6] hover:text-[#F5F7FA] transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#5EEAD4]" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-[12px] sm:text-[13px] font-mono text-[#DCE2EC] leading-[1.65] overflow-x-auto max-h-[300px] gyra-scroll">
                    <code>{response.output}</code>
                  </pre>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="font-mono text-[11px] text-[#667085]">
                  {product.availabilityNote}
                </p>
                <a
                  href={resolveGyraRoute("/dashboard", routeBase)}
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#F5F7FA] hover:text-[#67E8F9] transition-colors shrink-0"
                >
                  Open full workspace
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Hairline Architectural Spec Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] border-x border-b border-white/[0.08] bg-[#07090C]">
          <div className="p-6">
            <h3 className="font-display text-[15px] font-semibold text-[#F5F7FA] mb-2">
              Dual-Tier Model Routing
            </h3>
            <p className="text-[13px] text-[#8B94A6] leading-[1.6]">
              Switch seamlessly between fast Gyra 1.0 responses for everyday writing and SuperGyra 2.0
              deep reasoning when tasks demand multi-step rigor.
            </p>
          </div>
          <div className="p-6">
            <h3 className="font-display text-[15px] font-semibold text-[#F5F7FA] mb-2">
              Automated Six-Agent Engineering
            </h3>
            <p className="text-[13px] text-[#8B94A6] leading-[1.6]">
              Build prompts automatically coordinate research, requirement analysis, system design,
              code generation, Sentinel QA review, and implementation guidance.
            </p>
          </div>
          <div className="p-6">
            <h3 className="font-display text-[15px] font-semibold text-[#F5F7FA] mb-2">
              Files, Vision, Search & Voice
            </h3>
            <p className="text-[13px] text-[#8B94A6] leading-[1.6]">
              Attach images, PDFs, spreadsheets, or code directly into the thread, ground answers in
              live web research, or converse hands-free in Voice Mode.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
