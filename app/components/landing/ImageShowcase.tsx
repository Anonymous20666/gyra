"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, MoveHorizontal } from "lucide-react";
import {
  IMAGE_EDIT_SHOWCASE,
  IMAGE_PRESETS,
  clampSplitPercent,
  resolveGyraRoute,
  type ImageWorkbenchMode,
} from "../../lib/landingSimulations";

export interface ImageShowcaseProps {
  routeBase?: string;
}

export function ImageShowcase({ routeBase = "" }: ImageShowcaseProps) {
  const [mode, setMode] = useState<ImageWorkbenchMode>("edit");
  const [splitPct, setSplitPct] = useState(52);
  const [selectedId, setSelectedId] = useState(IMAGE_PRESETS[0].id);
  const [isDragging, setIsDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const selectedSpecimen =
    IMAGE_PRESETS.find((item) => item.id === selectedId) ?? IMAGE_PRESETS[0];

  const updateFromClientX = (clientX: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPct(clampSplitPercent(pct, 6, 94));
  };

  return (
    <section id="image" className="border-b border-[#1F1F1F] bg-black py-24 lg:py-32">
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
        {/* Header Row */}
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono-tech text-[12px] tracking-[0.14em] text-[#3B82F6] uppercase">
              [ 02 · Gyra Image ]
            </p>
            <h2 className="font-display mt-3.5 text-[clamp(2.35rem,4.2vw,3.75rem)] font-bold leading-[0.98] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
              Visual synthesis and surgical image-to-image editing.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] leading-[1.65] text-[#9A9A9A]">
              Generate high-resolution visual concepts from natural language or upload scenes,
              interfaces, and photographs for geometry-locked edits powered by Gyra Pro Ultra.
            </p>
            <a
              href={resolveGyraRoute("/dashboard", routeBase)}
              className="font-mono-tech mt-4 inline-flex items-center gap-1.5 text-[12px] tracking-[0.1em] text-white uppercase underline decoration-[#3B82F6] underline-offset-4 transition-colors hover:text-[#3B82F6]"
            >
              Create with Gyra Image
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Pitch-Black Optical Darkroom */}
        <div className="mt-12 border border-[#1F1F1F] bg-black">
          {/* Mode Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1F1F1F] bg-[#050505] px-4 py-3 sm:px-5">
            <div role="tablist" aria-label="Gyra Image modes" className="flex flex-wrap gap-1.5">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "edit"}
                onClick={() => setMode("edit")}
                className={`font-mono-tech min-h-[34px] border px-3.5 text-[11px] tracking-[0.08em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3B82F6] ${
                  mode === "edit"
                    ? "border-[#3B82F6] bg-[#2563EB] font-medium text-white"
                    : "border-[#242424] bg-black text-[#8A8A8A] hover:border-[#444] hover:text-white"
                }`}
              >
                Image-to-Image · Pro Ultra
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "generate"}
                onClick={() => setMode("generate")}
                className={`font-mono-tech min-h-[34px] border px-3.5 text-[11px] tracking-[0.08em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3B82F6] ${
                  mode === "generate"
                    ? "border-[#3B82F6] bg-[#2563EB] font-medium text-white"
                    : "border-[#242424] bg-black text-[#8A8A8A] hover:border-[#444] hover:text-white"
                }`}
              >
                Text-to-Image · Flux
              </button>
            </div>

            <span className="font-mono-tech text-[11px] tracking-[0.06em] text-[#808080] uppercase">
              {mode === "edit"
                ? `${IMAGE_EDIT_SHOWCASE.modelLabel} · ${IMAGE_EDIT_SHOWCASE.resolution}`
                : `${selectedSpecimen.modelLabel} · ${selectedSpecimen.resolution}`}
            </span>
          </div>

          {mode === "edit" ? (
            <div
              role="tabpanel"
              aria-label="Image-to-Image Edit · Pro Ultra"
              className="grid grid-cols-1 divide-y divide-[#1F1F1F] lg:grid-cols-12 lg:divide-x lg:divide-y-0"
            >
              {/* Interactive Pixel-Registered Comparison Stage */}
              <div className="bg-black p-5 sm:p-6 lg:col-span-8">
                <div
                  ref={stageRef}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setIsDragging(true);
                    updateFromClientX(event.clientX);
                  }}
                  onPointerMove={(event) => {
                    if (!isDragging) return;
                    updateFromClientX(event.clientX);
                  }}
                  onPointerUp={() => setIsDragging(false)}
                  onPointerCancel={() => setIsDragging(false)}
                  className="relative aspect-[4/3] w-full cursor-ew-resize select-none overflow-hidden border border-[#242424] bg-black touch-none"
                >
                  <img
                    src={IMAGE_EDIT_SHOWCASE.afterSrc}
                    alt={IMAGE_EDIT_SHOWCASE.afterLabel}
                    draggable={false}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />

                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
                  >
                    <img
                      src={IMAGE_EDIT_SHOWCASE.beforeSrc}
                      alt={IMAGE_EDIT_SHOWCASE.beforeLabel}
                      draggable={false}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Razor Signal Vermilion Split Hairline + Square Hardware Handle */}
                  <div
                    className="pointer-events-none absolute inset-y-0 z-10 w-[2px] bg-[#2563EB]"
                    style={{ left: `${splitPct}%` }}
                    aria-hidden="true"
                  >
                    <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[#3B82F6] bg-black text-white">
                      <MoveHorizontal className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="font-mono-tech pointer-events-none absolute left-3 top-3 border border-[#303030] bg-black/90 px-2.5 py-1 text-[10px] tracking-[0.08em] text-[#D4D4D4] uppercase">
                    {IMAGE_EDIT_SHOWCASE.beforeLabel}
                  </div>
                  <div className="font-mono-tech pointer-events-none absolute right-3 top-3 bg-[#2563EB] px-2.5 py-1 text-[10px] font-medium tracking-[0.08em] text-white uppercase">
                    {IMAGE_EDIT_SHOWCASE.afterLabel}
                  </div>
                </div>

                {/* Accessible Range Control & Sharp Snap Buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <label
                    htmlFor="gyra-compare-slider"
                    className="font-mono-tech text-[11px] tracking-[0.08em] text-[#808080] uppercase"
                  >
                    Split ({Math.round(splitPct)}%)
                  </label>
                  <input
                    id="gyra-compare-slider"
                    type="range"
                    min={6}
                    max={94}
                    value={Math.round(splitPct)}
                    onChange={(event) =>
                      setSplitPct(clampSplitPercent(Number(event.target.value), 6, 94))
                    }
                    aria-label="Before and after image comparison slider"
                    className="gyra-slider min-w-[140px] flex-1 cursor-pointer"
                  />
                  <div className="inline-flex border border-[#242424]">
                    {[
                      { label: "After", value: 12 },
                      { label: "50 / 50", value: 50 },
                      { label: "Original", value: 88 },
                    ].map((preset, idx) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSplitPct(preset.value)}
                        className={`font-mono-tech px-3 py-1.5 text-[10px] tracking-[0.08em] uppercase transition-colors ${
                          idx > 0 ? "border-l border-[#242424]" : ""
                        } ${
                          Math.abs(splitPct - preset.value) < 6
                            ? "bg-white font-medium text-black"
                            : "bg-black text-[#8A8A8A] hover:text-white"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 4 cols: Edit Specification Ledger */}
              <div className="flex flex-col justify-between bg-black p-5 sm:p-6 lg:col-span-4">
                <div>
                  <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#3B82F6] uppercase">
                    Edit Instruction
                  </p>
                  <p className="mt-2.5 text-[15px] leading-[1.65] text-white">
                    “{IMAGE_EDIT_SHOWCASE.prompt}”
                  </p>

                  <dl className="mt-7 divide-y divide-[#1A1A1A] border-y border-[#1A1A1A] text-[13px]">
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-[#808080]">Engine</dt>
                      <dd className="font-mono-tech text-white">Gyra Pro Ultra</dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-[#808080]">Preservation</dt>
                      <dd className="font-mono-tech text-[#D4D4D4]">Geometry Locked</dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-[#808080]">Workflows</dt>
                      <dd className="font-mono-tech text-[#D4D4D4]">UI · Lighting · Scenes</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-8 border-t border-[#1A1A1A] pt-5">
                  <p className="font-mono-tech text-[11px] leading-[1.55] text-[#737373] uppercase">
                    Available inside Gyra Chat for SuperGyra · Dedicated Studio expanding
                  </p>
                  <a
                    href={resolveGyraRoute("/dashboard", routeBase)}
                    className="font-mono-tech mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 bg-white px-4 text-[12px] font-medium tracking-[0.08em] text-black uppercase transition-colors hover:bg-[#E5E5E5]"
                  >
                    Try Image Editing in Gyra
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div
              role="tabpanel"
              aria-label="Text-to-Image · Flux"
              className="grid grid-cols-1 divide-y divide-[#1F1F1F] lg:grid-cols-12 lg:divide-x lg:divide-y-0"
            >
              <div className="bg-black p-5 sm:p-6 lg:col-span-8">
                <div className="relative aspect-[4/3] w-full overflow-hidden border border-[#242424] bg-black">
                  <img
                    src={selectedSpecimen.imageSrc}
                    alt={`${selectedSpecimen.category}: ${selectedSpecimen.title}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-5">
                    <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#3B82F6] uppercase">
                      {selectedSpecimen.category} · {selectedSpecimen.resolution}
                    </p>
                    <p className="font-display mt-1 text-[22px] font-bold text-white uppercase">
                      {selectedSpecimen.title}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between bg-black p-5 sm:p-6 lg:col-span-4">
                <div>
                  <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#737373] uppercase">
                    Select Specimen
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    {IMAGE_PRESETS.map((item) => {
                      const active = item.id === selectedSpecimen.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          aria-pressed={active}
                          className={`group overflow-hidden border text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3B82F6] ${
                            active
                              ? "border-[#3B82F6] bg-[#0B0B0B]"
                              : "border-[#222222] bg-black hover:border-[#444444]"
                          }`}
                        >
                          <div className="aspect-[4/3] w-full overflow-hidden bg-[#050505]">
                            <img
                              src={item.imageSrc}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className={`h-full w-full object-cover transition-transform duration-300 ${
                                active ? "scale-[1.03]" : "opacity-75 group-hover:opacity-100"
                              }`}
                            />
                          </div>
                          <div className="flex items-center justify-between px-2.5 py-2">
                            <p
                              className={`font-mono-tech truncate text-[10px] uppercase ${
                                active ? "text-white" : "text-[#808080]"
                              }`}
                            >
                              {item.category}
                            </p>
                            {active && (
                              <span className="font-mono-tech text-[9px] font-medium text-[#3B82F6] uppercase">
                                Active
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 border border-[#1F1F1F] bg-[#050505] p-3.5">
                    <p className="font-mono-tech text-[10px] tracking-[0.1em] text-[#737373] uppercase">
                      Generation Prompt
                    </p>
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-[#D4D4D4]">
                      {selectedSpecimen.prompt}
                    </p>
                  </div>
                </div>

                <a
                  href={resolveGyraRoute("/dashboard", routeBase)}
                  className="font-mono-tech mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 bg-[#2563EB] px-4 text-[12px] font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#3B82F6]"
                >
                  Generate in Gyra
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
