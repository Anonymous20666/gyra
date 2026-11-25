"use client";

import { useState } from "react";
import { Check, ChevronDown, Cpu, Search } from "lucide-react";
import { GYRA_MODELS, type GyraModelSpec } from "../../lib/gyraCatalog";

interface ModelExplorerProps {
  category: "chat" | "video" | "transcription";
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export function ModelExplorer({
  category,
  selectedModelId,
  onSelectModel,
}: ModelExplorerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const matchingModels = GYRA_MODELS.filter((m) => m.category === category);
  const activeModel: GyraModelSpec =
    matchingModels.find((m) => m.id === selectedModelId) ?? matchingModels[0];

  if (!activeModel) return null;

  const filtered = matchingModels.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-[#09090B] hover:bg-[#121215] border border-[#1F1F23] hover:border-[#2E2E34] rounded-md text-left transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Cpu className="w-4 h-4 text-[#5B9EC2] shrink-0" strokeWidth={1.75} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-[#F4F4F5] truncate">
                {activeModel.name}
              </span>
              <code className="text-[11px] text-[#71717A] truncate hidden sm:inline">
                {activeModel.id}
              </code>
            </div>
            <p className="text-[11.5px] text-[#71717A] truncate">
              {activeModel.providerBacking} · {activeModel.pricingNote}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#71717A] shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-1.5 z-30 bg-[#000000] border border-[#2E2E34] rounded-lg shadow-2xl overflow-hidden">
            {matchingModels.length > 2 && (
              <div className="p-2 border-b border-[#1F1F23] relative">
                <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search models..."
                  className="w-full bg-[#09090B] border border-[#1F1F23] rounded px-7 py-1.5 text-[12px] text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-[#5B9EC2]"
                />
              </div>
            )}

            <div className="divide-y divide-[#18181B] max-h-80 overflow-y-auto">
              {filtered.map((m) => {
                const isSelected = m.id === activeModel.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(m.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left p-3.5 transition-colors ${
                      isSelected ? "bg-[#121215]" : "hover:bg-[#09090B]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#F4F4F5]">
                            {m.name}
                          </span>
                          <code className="text-[11px] text-[#5B9EC2]">{m.id}</code>
                        </div>
                        <p className="mt-1 text-[12px] text-[#A1A1AA] leading-relaxed">
                          {m.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#5B9EC2] shrink-0 mt-0.5" />
                      )}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#71717A] font-mono">
                      <span>In: {m.inputs.join(", ")}</span>
                      <span aria-hidden="true">·</span>
                      <span>Out: {m.outputs.join(", ")}</span>
                      <span aria-hidden="true">·</span>
                      <span>{m.supportsStreaming ? "SSE Streaming" : "Standard JSON"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
