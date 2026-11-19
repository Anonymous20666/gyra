"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Pause, Play } from "lucide-react";
import { CORE_PRODUCTS } from "../../lib/gyraCatalog";
import {
  CHAT_SCENARIOS,
  IMAGE_EDIT_SHOWCASE,
  VIDEO_TEMPLATES,
  clampSplitPercent,
  resolveGyraRoute,
  type ChatModelId,
  type HeroModality,
} from "../../lib/landingSimulations";
import { usePointerBorder } from "./usePointerBorder";

interface HeroWorkbenchProps {
  routeBase?: string;
}

export function HeroWorkbench({ routeBase = "" }: HeroWorkbenchProps) {
  const [modality, setModality] = useState<HeroModality>("chat");
  const [heroModel, setHeroModel] = useState<ChatModelId>("gyra-super2.0");
  const [heroSplit, setHeroSplit] = useState<number>(52);
  const [videoPlaying, setVideoPlaying] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const framePointer = usePointerBorder<HTMLDivElement>();

  const activeProduct = CORE_PRODUCTS.find((p) => p.id === modality) ?? CORE_PRODUCTS[0];
  const heroChat = CHAT_SCENARIOS[0];
  const heroVideo = VIDEO_TEMPLATES[0];

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      vid.pause();
      setVideoPlaying(false);
      return;
    }
    if (modality === "video" && videoPlaying) {
      vid.play().catch(() => setVideoPlaying(false));
    } else {
      vid.pause();
    }
  }, [modality, videoPlaying]);

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative bg-[#050608] border-b border-white/[0.08]"
    >
      <div className="max-w-[1280px] mx-auto gyra-grid-rail px-5 sm:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 items-start">
          {/* Left Editorial Column */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#667085] mb-5">
                Genvia AI Company · Intelligence Systems
              </p>

              <h1
                id="hero-heading"
                className="font-display font-semibold text-[#F5F7FA] tracking-[-0.035em] leading-[1.03] text-[38px] sm:text-[48px] lg:text-[56px] mb-5 [text-wrap:balance]"
              >
                Intelligence built across every medium.
              </h1>

              <p className="text-[15px] sm:text-[16px] text-[#A0A8B8] leading-[1.65] max-w-[44ch] mb-8">
                Gyra brings conversational reasoning, precision image generation and editing,
                cinematic video, and OpenAI-compatible developer APIs into one unified platform.
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-10">
                <a
                  href={resolveGyraRoute("/dashboard", routeBase)}
                  className="inline-flex items-center justify-center gap-2 bg-[#F1F5F9] text-[#050608] hover:bg-white px-5 py-2.5 rounded-[4px] text-[14px] font-medium transition-colors"
                >
                  Launch Gyra
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
                <a
                  href={resolveGyraRoute("/api", routeBase)}
                  className="inline-flex items-center justify-center gap-2 bg-[#0B0D11] text-[#F5F7FA] border border-white/[0.12] hover:border-white/[0.24] hover:bg-[#101319] px-5 py-2.5 rounded-[4px] text-[14px] font-medium transition-colors"
                >
                  Explore Developer API
                  <ArrowRight className="w-4 h-4 text-[#A0A8B8]" aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Synchronized 3-Product Modality Ledger */}
            <div
              className="border border-white/[0.08] rounded-[4px] divide-y divide-white/[0.08] bg-[#07090D] overflow-hidden"
              role="tablist"
              aria-label="Core Gyra Products"
            >
              {CORE_PRODUCTS.map((product) => {
                const isSelected = modality === product.id;
                return (
                  <button
                    key={product.id}
                    type="button"
                    role="tab"
                    id={`hero-tab-${product.id}`}
                    aria-selected={isSelected}
                    aria-controls={`hero-panel-${product.id}`}
                    onClick={() => setModality(product.id)}
                    style={{
                      borderLeftColor: isSelected ? product.accentHex : "transparent",
                    }}
                    className={`w-full text-left px-4 py-3.5 border-l-2 flex items-start justify-between gap-4 transition-colors group ${
                      isSelected ? "bg-[#0F131A]" : "hover:bg-[#0B0E14]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="font-mono text-[11px] pt-0.5 transition-colors"
                        style={{ color: isSelected ? product.accentHex : "#667085" }}
                      >
                        {product.index}
                      </span>
                      <div>
                        <span
                          className={`font-display text-[15px] font-semibold tracking-[-0.01em] block ${
                            isSelected ? "text-[#F5F7FA]" : "text-[#C5CBD6] group-hover:text-[#F5F7FA]"
                          }`}
                        >
                          {product.name}
                        </span>
                        <p className="text-[13px] text-[#8B94A6] leading-[1.45] mt-0.5">
                          {product.tagline}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.1em] pt-1 shrink-0 ${
                        isSelected ? "text-[#F5F7FA]" : "text-[#667085]"
                      }`}
                    >
                      {isSelected ? "Active" : "Inspect"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Live Interactive Workbench */}
          <div className="lg:col-span-7">
            <div
              {...framePointer}
              className="gyra-frame gyra-frame-interactive rounded-[6px] overflow-hidden"
            >
              {/* Console Top Bar */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#0E1117] border-b border-white/[0.08]">
                <div className="flex items-center gap-1" role="tablist" aria-label="Workbench mode">
                  {CORE_PRODUCTS.map((product) => {
                    const active = modality === product.id;
                    return (
                      <button
                        key={product.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setModality(product.id)}
                        className={`px-3 py-1.5 rounded-[3px] font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
                          active
                            ? "bg-[#181D27] text-[#F5F7FA] border border-white/[0.12]"
                            : "text-[#8B94A6] hover:text-[#F5F7FA] border border-transparent"
                        }`}
                      >
                        {product.shortLabel}
                      </button>
                    );
                  })}
                </div>

                <a
                  href={`#${activeProduct.id}`}
                  className="font-mono text-[11px] text-[#8B94A6] hover:text-[#F5F7FA] inline-flex items-center gap-1 transition-colors"
                >
                  Full {activeProduct.shortLabel} Showcase
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </a>
              </div>

              {/* Panel: CHAT */}
              {modality === "chat" && (
                <div
                  id="hero-panel-chat"
                  role="tabpanel"
                  aria-labelledby="hero-tab-chat"
                  className="p-5 sm:p-6 bg-[#0B0D11]"
                >
                  <div className="pb-4 mb-4 border-b border-white/[0.07]">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#667085]">
                        Prompt · Multi-Agent Route
                      </p>
                      <div className="inline-flex border border-white/[0.1] rounded-[4px] bg-[#050608] p-0.5 shrink-0">
                        {(["gyra-1.0", "gyra-super2.0"] as ChatModelId[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setHeroModel(m)}
                            className={`px-2.5 py-0.5 rounded-[3px] font-mono text-[11px] transition-colors ${
                              heroModel === m
                                ? "bg-[#181D27] text-[#67E8F9]"
                                : "text-[#8B94A6] hover:text-[#F5F7FA]"
                            }`}
                          >
                            {m === "gyra-1.0" ? "Gyra 1.0" : "SuperGyra 2.0"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[14px] text-[#F5F7FA] font-medium leading-[1.5]">
                      {heroChat.prompt}
                    </p>
                  </div>

                  {/* Compact 6-Agent Pipeline Bar */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-4">
                    {heroChat.agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="bg-[#101319] border border-white/[0.07] rounded-[3px] px-2.5 py-2"
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] text-[#667085]">
                          <span>{agent.order}</span>
                          <span>{agent.durationSec}s</span>
                        </div>
                        <p className="text-[12px] font-medium text-[#E5E9F0] mt-0.5">{agent.name}</p>
                        <p className="text-[10px] text-[#667085] truncate">{agent.role}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reasoning Note */}
                  <div className="bg-[#101319] border-l-2 border-[#67E8F9] px-3.5 py-2.5 mb-4 text-[12px] text-[#A0A8B8] leading-[1.5]">
                    <span className="font-mono text-[11px] text-[#67E8F9] mr-2">
                      {heroModel === "gyra-super2.0" ? "REASONER" : "STANDARD"}
                    </span>
                    {heroChat.responseByModel[heroModel].reasoningNote}
                  </div>

                  {/* Output Code Window */}
                  <div className="bg-[#050608] border border-white/[0.08] rounded-[4px] overflow-hidden">
                    <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.06] font-mono text-[11px] text-[#667085]">
                      <span>webhook-handler.ts</span>
                      <span>{heroChat.responseByModel[heroModel].latencyLabel}</span>
                    </div>
                    <pre className="p-4 text-[12px] leading-[1.6] font-mono text-[#D6DCE6] overflow-x-auto max-h-[225px] gyra-scroll">
                      <code>{heroChat.responseByModel[heroModel].output}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Panel: IMAGE */}
              {modality === "image" && (
                <div
                  id="hero-panel-image"
                  role="tabpanel"
                  aria-labelledby="hero-tab-image"
                  className="p-5 sm:p-6 bg-[#0B0D11]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-white/[0.07]">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#E5B975]">
                        Gyra Pro Ultra · Image-to-Image Edit
                      </p>
                      <p className="text-[13px] text-[#C5CBD6] mt-1">
                        Preserve exact architectural geometry while transforming scene lighting to warm tungsten dusk.
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-[#8B94A6]">
                      Split {heroSplit}%
                    </span>
                  </div>

                  <div className="relative aspect-[4/3] w-full bg-[#050608] border border-white/[0.08] rounded-[4px] overflow-hidden select-none">
                    <img
                      src={IMAGE_EDIT_SHOWCASE.afterSrc}
                      alt={IMAGE_EDIT_SHOWCASE.afterLabel}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - heroSplit}% 0 0)` }}
                    >
                      <img
                        src={IMAGE_EDIT_SHOWCASE.beforeSrc}
                        alt={IMAGE_EDIT_SHOWCASE.beforeLabel}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div
                      className="absolute top-0 bottom-0 w-px bg-[#F5F7FA] pointer-events-none"
                      style={{ left: `${heroSplit}%` }}
                    />
                    <div className="absolute top-3 left-3 bg-[#050608]/90 border border-white/[0.12] px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.08em] text-[#D0D5DD]">
                      Original
                    </div>
                    <div className="absolute top-3 right-3 bg-[#050608]/90 border border-[#E5B975]/40 px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.08em] text-[#E5B975]">
                      Gyra Pro Ultra
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <label
                      htmlFor="hero-image-split"
                      className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8B94A6] shrink-0"
                    >
                      Compare
                    </label>
                    <input
                      id="hero-image-split"
                      type="range"
                      min={0}
                      max={100}
                      value={heroSplit}
                      onChange={(e) => setHeroSplit(clampSplitPercent(Number(e.target.value)))}
                      aria-label="Hero before and after image comparison"
                      className="w-full accent-[#E5B975] cursor-pointer"
                    />
                    <a
                      href="#image"
                      className="font-mono text-[11px] text-[#F5F7FA] hover:text-[#E5B975] shrink-0 transition-colors"
                    >
                      Full Studio →
                    </a>
                  </div>
                </div>
              )}

              {/* Panel: VIDEO */}
              {modality === "video" && (
                <div
                  id="hero-panel-video"
                  role="tabpanel"
                  aria-labelledby="hero-tab-video"
                  className="p-5 sm:p-6 bg-[#0B0D11]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-white/[0.07]">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#5EEAD4]">
                        Gyra Studio · {heroVideo.specs}
                      </p>
                      <p className="text-[13px] text-[#C5CBD6] mt-1">{heroVideo.prompt}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoPlaying((p) => !p)}
                      aria-label={videoPlaying ? "Pause video preview" : "Play video preview"}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-white/[0.12] bg-[#101319] text-[#F5F7FA] font-mono text-[11px] hover:border-white/[0.24] transition-colors shrink-0"
                    >
                      {videoPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      {videoPlaying ? "Pause" : "Play"}
                    </button>
                  </div>

                  <div className="relative aspect-video w-full bg-[#050608] border border-white/[0.08] rounded-[4px] overflow-hidden">
                    <video
                      ref={videoRef}
                      src={heroVideo.videoSrc}
                      poster={heroVideo.posterSrc}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#050608]/90 border border-white/[0.1] px-3 py-1.5 rounded-[3px] font-mono text-[11px] text-[#C5CBD6]">
                      <span>16:9 · {heroVideo.durationLabel}</span>
                      <span className="text-[#5EEAD4]">Text & Image-to-Video</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Console Footer Spec Strip */}
              <div className="grid grid-cols-3 divide-x divide-white/[0.08] border-t border-white/[0.08] bg-[#090B0F]">
                {activeProduct.specs.map((spec) => (
                  <div key={spec.label} className="px-4 py-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#667085]">
                      {spec.label}
                    </p>
                    <p className="text-[12px] font-medium text-[#E5E9F0] mt-0.5 truncate">
                      {spec.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
