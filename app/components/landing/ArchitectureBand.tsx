"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { GYRA_COMPANY } from "../../lib/gyraCatalog";
import { ARCHITECTURE_LAYERS, resolveGyraRoute } from "../../lib/landingSimulations";

interface ArchitectureBandProps {
  routeBase?: string;
}

export function ArchitectureBand({ routeBase = "" }: ArchitectureBandProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string>(ARCHITECTURE_LAYERS[1].id);
  const activeLayer =
    ARCHITECTURE_LAYERS.find((l) => l.id === selectedLayerId) ?? ARCHITECTURE_LAYERS[0];

  return (
    <section
      id="architecture"
      aria-labelledby="architecture-heading"
      className="bg-[#F4F5F7] text-[#0A0D12] border-b border-[#D8DCE3] scroll-mt-16"
    >
      <div className="max-w-[1280px] mx-auto gyra-grid-rail-light px-5 sm:px-8 py-20 lg:py-24">
        {/* Editorial Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-14">
          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#525B6B] mb-3">
              04 / Unified Architecture
            </p>
            <h2
              id="architecture-heading"
              className="font-display font-semibold text-[30px] sm:text-[38px] lg:text-[44px] tracking-[-0.035em] leading-[1.06] text-[#0A0D12] [text-wrap:balance]"
            >
              One intelligence layer, engineered as a coherent company platform.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] text-[#3F4756] leading-[1.65] mb-4">
              Built by {GYRA_COMPANY.parentCompany}, Gyra is designed from the ground up as a
              multi-product AI ecosystem — sharing authentication, reasoning models, media queues,
              and developer billing across every surface.
            </p>
            <a
              href={resolveGyraRoute("/about", routeBase)}
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0A0D12] hover:text-[#3F4756] transition-colors"
            >
              Read about {GYRA_COMPANY.parentCompany}
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Interactive 3-Layer System Schematic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#D4D9E2] bg-white rounded-[6px] overflow-hidden">
          {/* Left Layer Selector Stack */}
          <div
            className="lg:col-span-5 divide-y divide-[#E2E6EE] border-b lg:border-b-0 lg:border-r border-[#D4D9E2]"
            role="tablist"
            aria-label="Gyra platform architecture layers"
          >
            {ARCHITECTURE_LAYERS.map((layer) => {
              const active = layer.id === activeLayer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`w-full text-left p-6 transition-colors ${
                    active ? "bg-[#0A0D12] text-[#F5F7FA]" : "bg-white text-[#0A0D12] hover:bg-[#F7F8FA]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-mono text-[11px] uppercase tracking-[0.12em] ${
                        active ? "text-[#67E8F9]" : "text-[#667085]"
                      }`}
                    >
                      Layer {layer.index}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.08em] ${
                        active ? "text-[#A0A8B8]" : "text-[#667085]"
                      }`}
                    >
                      {layer.nodes.length} modules
                    </span>
                  </div>
                  <h3 className="font-display text-[19px] font-semibold tracking-[-0.02em]">
                    {layer.title}
                  </h3>
                  <p
                    className={`text-[13px] mt-1 leading-[1.5] ${
                      active ? "text-[#A0A8B8]" : "text-[#525B6B]"
                    }`}
                  >
                    {layer.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Layer Inspection Diagram */}
          <div className="lg:col-span-7 p-6 sm:p-8 bg-[#FAFBFD] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#E2E6EE]">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#525B6B]">
                    Inspecting Layer {activeLayer.index}
                  </span>
                  <h3 className="font-display text-[24px] font-semibold tracking-[-0.02em] text-[#0A0D12] mt-1">
                    {activeLayer.title}
                  </h3>
                </div>
                <span className="font-mono text-[11px] px-2.5 py-1 rounded-[3px] border border-[#D4D9E2] bg-white text-[#3F4756]">
                  GYRA CORE
                </span>
              </div>

              <p className="text-[15px] text-[#3F4756] leading-[1.65] mb-8 max-w-[58ch]">
                {activeLayer.description}
              </p>

              {/* Architectural Module Nodes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeLayer.nodes.map((node, i) => (
                  <div
                    key={node.label}
                    className="bg-white border border-[#D4D9E2] rounded-[4px] p-4"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#667085]">
                        {activeLayer.index}.{i + 1}
                      </span>
                      <span className="w-1.5 h-1.5 bg-[#0A0D12]" aria-hidden="true" />
                    </div>
                    <p className="font-display text-[15px] font-semibold text-[#0A0D12]">
                      {node.label}
                    </p>
                    <p className="font-mono text-[12px] text-[#525B6B] mt-1 leading-[1.45]">
                      {node.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Architectural Continuity Bar */}
            <div className="mt-8 pt-5 border-t border-[#E2E6EE] flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-[#525B6B]">
              <span>Single Account · Supabase Auth</span>
              <span>OpenAI-Compatible REST Contract</span>
              <span>Unified Credits & Rate Limits</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
