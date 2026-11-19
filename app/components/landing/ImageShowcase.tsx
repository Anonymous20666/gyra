"use client";

import { useRef, useState } from "react";
import type React from "react";
import { ArrowUpRight, MoveHorizontal } from "lucide-react";
import { CORE_PRODUCTS } from "../../lib/gyraCatalog";
import {
  IMAGE_EDIT_SHOWCASE,
  IMAGE_PRESETS,
  clampSplitPercent,
  resolveGyraRoute,
  type ImageWorkbenchMode,
} from "../../lib/landingSimulations";
import { usePointerBorder } from "./usePointerBorder";

interface ImageShowcaseProps {
  routeBase?: string;
}

export function ImageShowcase({ routeBase = "" }: ImageShowcaseProps) {
  const [mode, setMode] = useState<ImageWorkbenchMode>("edit");
  const [split, setSplit] = useState<number>(52);
  const [dragging, setDragging] = useState<boolean>(false);
  const [presetId, setPresetId] = useState<string>(IMAGE_PRESETS[0].id);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pointer = usePointerBorder<HTMLDivElement>();

  const product = CORE_PRODUCTS[1];
  const activePreset = IMAGE_PRESETS.find((p) => p.id === presetId) ?? IMAGE_PRESETS[0];

  const updateSplitFromClientX = (clientX: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplit(clampSplitPercent(pct));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    updateSplitFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateSplitFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(false);
  };

  return (
    <section
      id="image"
      aria-labelledby="image-heading"
      className="bg-[#0B0D11] border-b border-white/[0.08] scroll-mt-16"
    >
      <div className="max-w-[1280px] mx-auto gyra-grid-rail px-5 sm:px-8 py-20 lg:py-24">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#E5B975] mb-3">
              02 / Gyra Image
            </p>
            <h2
              id="image-heading"
              className="font-display font-semibold text-[30px] sm:text-[38px] lg:text-[42px] tracking-[-0.03em] leading-[1.08] text-[#F5F7FA] [text-wrap:balance]"
            >
              Visual synthesis and precision image-to-image editing.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] text-[#A0A8B8] leading-[1.65] mb-4">
              {product.summary}
            </p>
            <a
              href={resolveGyraRoute(product.route, routeBase)}
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#F5F7FA] hover:text-[#E5B975] transition-colors"
            >
              {product.ctaLabel}
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Darkroom Workbench Frame */}
        <div
          {...pointer}
          className="gyra-frame gyra-frame-interactive rounded-[6px] overflow-hidden bg-[#07090D]"
        >
          {/* Mode Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-[#0E1117] border-b border-white/[0.08]">
            <div className="inline-flex items-center gap-1.5" role="tablist" aria-label="Gyra Image modes">
              <button
                type="button"
                role="tab"
                id="image-tab-edit"
                aria-selected={mode === "edit"}
                aria-controls="image-panel-edit"
                onClick={() => setMode("edit")}
                className={`px-3.5 py-1.5 rounded-[4px] text-[12px] font-medium transition-colors ${
                  mode === "edit"
                    ? "bg-[#181D27] text-[#F5F7FA] border border-white/[0.14]"
                    : "text-[#8B94A6] hover:text-[#F5F7FA] border border-transparent"
                }`}
              >
                Image-to-Image Edit · Pro Ultra
              </button>
              <button
                type="button"
                role="tab"
                id="image-tab-generate"
                aria-selected={mode === "generate"}
                aria-controls="image-panel-generate"
                onClick={() => setMode("generate")}
                className={`px-3.5 py-1.5 rounded-[4px] text-[12px] font-medium transition-colors ${
                  mode === "generate"
                    ? "bg-[#181D27] text-[#F5F7FA] border border-white/[0.14]"
                    : "text-[#8B94A6] hover:text-[#F5F7FA] border border-transparent"
                }`}
              >
                Text-to-Image · Flux
              </button>
            </div>

            <div className="font-mono text-[11px] text-[#8B94A6]">
              {mode === "edit"
                ? `${IMAGE_EDIT_SHOWCASE.modelLabel} · ${IMAGE_EDIT_SHOWCASE.resolution}`
                : `${activePreset.modelLabel} · ${activePreset.resolution}`}
            </div>
          </div>

          {/* EDIT MODE: Pixel-Aligned Before / After Comparison Scrubber */}
          {mode === "edit" && (
            <div
              id="image-panel-edit"
              role="tabpanel"
              aria-labelledby="image-tab-edit"
              className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]"
            >
              <div className="lg:col-span-8 p-5 sm:p-6 bg-[#07090D]">
                <div
                  ref={stageRef}
                  data-testid="image-compare-stage"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="relative aspect-[4/3] w-full bg-[#050608] border border-white/[0.08] rounded-[4px] overflow-hidden select-none touch-none cursor-ew-resize"
                >
                  {/* Edited After Layer */}
                  <img
                    src={IMAGE_EDIT_SHOWCASE.afterSrc}
                    alt={IMAGE_EDIT_SHOWCASE.afterLabel}
                    draggable={false}
                    className="w-full h-full object-cover"
                  />

                  {/* Original Before Layer clipped cleanly */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                  >
                    <img
                      src={IMAGE_EDIT_SHOWCASE.beforeSrc}
                      alt={IMAGE_EDIT_SHOWCASE.beforeLabel}
                      draggable={false}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Razor Split Handle */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-[#F5F7FA] pointer-events-none"
                    style={{ left: `${split}%` }}
                  >
                    <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-[4px] bg-[#050608] border border-[#F5F7FA] flex items-center justify-center text-[#F5F7FA]">
                      <MoveHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Corner Photographic Plates */}
                  <div className="absolute top-3 left-3 bg-[#050608]/92 border border-white/[0.12] px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.08em] text-[#D0D5DD] pointer-events-none">
                    {IMAGE_EDIT_SHOWCASE.beforeLabel}
                  </div>
                  <div className="absolute top-3 right-3 bg-[#050608]/92 border border-[#E5B975]/40 px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.08em] text-[#E5B975] pointer-events-none">
                    {IMAGE_EDIT_SHOWCASE.afterLabel}
                  </div>
                </div>

                {/* Accessible Slider + Snap Positions */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <label
                    htmlFor="gyra-image-scrubber"
                    className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8B94A6] shrink-0"
                  >
                    Comparison ({split}%)
                  </label>
                  <input
                    id="gyra-image-scrubber"
                    type="range"
                    min={0}
                    max={100}
                    value={split}
                    onChange={(e) => setSplit(clampSplitPercent(Number(e.target.value)))}
                    aria-label="Before and after image comparison slider"
                    className="flex-1 min-w-[160px] accent-[#E5B975] cursor-pointer"
                  />
                  <div className="inline-flex border border-white/[0.1] rounded-[4px] overflow-hidden bg-[#0B0D11]">
                    {[
                      { label: "After", val: 0 },
                      { label: "50 / 50", val: 50 },
                      { label: "Original", val: 100 },
                    ].map((snap) => (
                      <button
                        key={snap.label}
                        type="button"
                        onClick={() => setSplit(snap.val)}
                        className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.06em] transition-colors ${
                          split === snap.val
                            ? "bg-[#181D27] text-[#E5B975]"
                            : "text-[#8B94A6] hover:text-[#F5F7FA]"
                        }`}
                      >
                        {snap.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Inspection Panel */}
              <div className="lg:col-span-4 p-5 sm:p-6 bg-[#0A0C10] flex flex-col justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#E5B975] mb-3">
                    Edit Instruction
                  </p>
                  <p className="text-[14px] text-[#E5E9F0] leading-[1.65] bg-[#101319] border border-white/[0.08] rounded-[4px] p-4 mb-6">
                    &ldquo;{IMAGE_EDIT_SHOWCASE.prompt}&rdquo;
                  </p>

                  <div className="border-t border-white/[0.08] divide-y divide-white/[0.08]">
                    <div className="py-3 flex items-center justify-between text-[12px]">
                      <span className="font-mono text-[#667085] uppercase tracking-[0.08em]">Engine</span>
                      <span className="font-mono text-[#E5E9F0]">Gyra Pro Ultra</span>
                    </div>
                    <div className="py-3 flex items-center justify-between text-[12px]">
                      <span className="font-mono text-[#667085] uppercase tracking-[0.08em]">Preservation</span>
                      <span className="font-mono text-[#E5E9F0]">Geometry & Layout Locked</span>
                    </div>
                    <div className="py-3 flex items-center justify-between text-[12px]">
                      <span className="font-mono text-[#667085] uppercase tracking-[0.08em]">Use Cases</span>
                      <span className="font-mono text-[#E5E9F0]">UI Edits · Lighting · Scenes</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/[0.08]">
                  <p className="font-mono text-[11px] text-[#667085] leading-[1.55] mb-4">
                    {product.availabilityNote}
                  </p>
                  <a
                    href={resolveGyraRoute("/dashboard", routeBase)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#F1F5F9] text-[#050608] hover:bg-white py-2.5 px-4 rounded-[4px] text-[13px] font-medium transition-colors"
                  >
                    Try Image Editing in Gyra
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* GENERATE MODE: 4-Specimen Curated Darkroom */}
          {mode === "generate" && (
            <div
              id="image-panel-generate"
              role="tabpanel"
              aria-labelledby="image-tab-generate"
              className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]"
            >
              <div className="lg:col-span-7 p-5 sm:p-6 bg-[#07090D]">
                <div className="relative aspect-square max-h-[500px] mx-auto bg-[#050608] border border-white/[0.08] rounded-[4px] overflow-hidden">
                  <img
                    src={activePreset.imageSrc}
                    alt={activePreset.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#050608]/92 border border-white/[0.1] px-3 py-1.5 rounded-[3px] font-mono text-[11px] text-[#D0D5DD]">
                    <span>{activePreset.title}</span>
                    <span className="text-[#E5B975]">{activePreset.resolution}</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 p-5 sm:p-6 bg-[#0A0C10] flex flex-col justify-between">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#E5B975] mb-3">
                    Curated Output Specimens
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 mb-6">
                    {IMAGE_PRESETS.map((preset) => {
                      const active = preset.id === activePreset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setPresetId(preset.id)}
                          aria-pressed={active}
                          className={`group text-left rounded-[4px] overflow-hidden border ${
                            active
                              ? "border-[#E5B975] ring-1 ring-[#E5B975]/40 bg-[#141821]"
                              : "border-white/[0.08] bg-[#0D1016] hover:border-white/[0.2]"
                          }`}
                        >
                          <div className="aspect-[16/10] w-full overflow-hidden bg-[#050608]">
                            <img
                              src={preset.imageSrc}
                              alt={preset.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="px-2.5 py-2">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#667085]">
                                {preset.category}
                              </p>
                              {active && (
                                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#E5B975]">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-[12px] font-medium text-[#E5E9F0] truncate mt-0.5">
                              {preset.title}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#667085] mb-1.5">
                    Prompt Specification
                  </p>
                  <p className="text-[13px] text-[#C5CBD6] leading-[1.6] bg-[#101319] border border-white/[0.08] rounded-[4px] p-3.5">
                    {activePreset.prompt}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] text-[#667085]">
                    {activePreset.modelLabel} · {activePreset.aspect}
                  </span>
                  <a
                    href={resolveGyraRoute("/dashboard", routeBase)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#F5F7FA] hover:text-[#E5B975] transition-colors"
                  >
                    Generate in Gyra
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
