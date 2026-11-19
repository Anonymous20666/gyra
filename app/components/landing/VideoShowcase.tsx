"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Film, Image as ImageIcon, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { CORE_PRODUCTS } from "../../lib/gyraCatalog";
import {
  VIDEO_TEMPLATES,
  resolveGyraRoute,
  type VideoAspect,
  type VideoWorkbenchMode,
} from "../../lib/landingSimulations";
import { usePointerBorder } from "./usePointerBorder";

interface VideoShowcaseProps {
  routeBase?: string;
}

export function VideoShowcase({ routeBase = "" }: VideoShowcaseProps) {
  const [templateId, setTemplateId] = useState<string>(VIDEO_TEMPLATES[0].id);
  const [mode, setMode] = useState<VideoWorkbenchMode>("image-to-video");
  const [aspect, setAspect] = useState<VideoAspect>("16:9");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const pointer = usePointerBorder<HTMLDivElement>();

  const product = CORE_PRODUCTS[2];
  const template = VIDEO_TEMPLATES.find((t) => t.id === templateId) ?? VIDEO_TEMPLATES[0];

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      vid.pause();
      setIsPlaying(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && isPlaying) {
          vid.play().catch(() => setIsPlaying(false));
        } else {
          vid.pause();
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [isPlaying, template.videoSrc]);

  const togglePlayback = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (isPlaying) {
      vid.pause();
      setIsPlaying(false);
    } else {
      vid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  return (
    <section
      ref={sectionRef}
      id="video"
      aria-labelledby="video-heading"
      className="bg-[#050608] border-b border-white/[0.08] scroll-mt-16"
    >
      <div className="max-w-[1280px] mx-auto gyra-grid-rail px-5 sm:px-8 py-20 lg:py-24">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#5EEAD4] mb-3">
              03 / Gyra Video
            </p>
            <h2
              id="video-heading"
              className="font-display font-semibold text-[30px] sm:text-[38px] lg:text-[42px] tracking-[-0.03em] leading-[1.08] text-[#F5F7FA] [text-wrap:balance]"
            >
              Direct cinematic motion from text prompts or reference frames.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] text-[#A0A8B8] leading-[1.65] mb-4">
              {product.summary}
            </p>
            <a
              href={resolveGyraRoute(product.route, routeBase)}
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#F5F7FA] hover:text-[#5EEAD4] transition-colors"
            >
              {product.ctaLabel}
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Cinema Workbench Frame */}
        <div
          {...pointer}
          className="gyra-frame gyra-frame-interactive rounded-[6px] overflow-hidden"
        >
          {/* Top Control Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-5 py-3.5 bg-[#0E1117] border-b border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex bg-[#050608] border border-white/[0.1] rounded-[4px] p-0.5"
                role="tablist"
                aria-label="Video input mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "text-to-video"}
                  onClick={() => setMode("text-to-video")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-[12px] font-medium transition-colors ${
                    mode === "text-to-video"
                      ? "bg-[#181D27] text-[#F5F7FA]"
                      : "text-[#8B94A6] hover:text-[#F5F7FA]"
                  }`}
                >
                  <Film className="w-3.5 h-3.5" aria-hidden="true" />
                  Text-to-Video
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "image-to-video"}
                  onClick={() => setMode("image-to-video")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-[12px] font-medium transition-colors ${
                    mode === "image-to-video"
                      ? "bg-[#181D27] text-[#F5F7FA]"
                      : "text-[#8B94A6] hover:text-[#F5F7FA]"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  Image-to-Video
                </button>
              </div>

              <div
                className="inline-flex bg-[#050608] border border-white/[0.1] rounded-[4px] p-0.5"
                role="group"
                aria-label="Aspect ratio"
              >
                {(["16:9", "9:16"] as VideoAspect[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    aria-pressed={aspect === ratio}
                    onClick={() => setAspect(ratio)}
                    className={`px-2.5 py-1 rounded-[3px] font-mono text-[11px] transition-colors ${
                      aspect === ratio
                        ? "bg-[#181D27] text-[#5EEAD4]"
                        : "text-[#8B94A6] hover:text-[#F5F7FA]"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayback}
                aria-label={isPlaying ? "Pause video showcase" : "Play video showcase"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] border border-white/[0.12] bg-[#0B0D11] text-[#F5F7FA] font-mono text-[11px] hover:border-white/[0.24] transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? "Unmute video showcase" : "Mute video showcase"}
                className="inline-flex items-center justify-center w-8 h-8 rounded-[4px] border border-white/[0.12] bg-[#0B0D11] text-[#A0A8B8] hover:text-[#F5F7FA] transition-colors"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Main Cinema Stage + Direction Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
            {/* Video Stage */}
            <div className="lg:col-span-8 p-5 sm:p-6 bg-[#07090D] flex flex-col items-center justify-center">
              <div
                data-testid="video-aspect-frame"
                data-aspect={aspect}
                className={`relative bg-[#050608] border border-white/[0.1] rounded-[4px] overflow-hidden transition-all duration-200 ${
                  aspect === "16:9" ? "w-full aspect-video" : "w-full max-w-[290px] aspect-[9/16]"
                }`}
              >
                <video
                  key={template.videoSrc}
                  ref={videoRef}
                  src={template.videoSrc}
                  poster={template.posterSrc}
                  muted={isMuted}
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-3 left-3 bg-[#050608]/92 border border-white/[0.12] px-2.5 py-1 rounded-[3px] font-mono text-[10px] uppercase tracking-[0.08em] text-[#D0D5DD]">
                  {aspect} · {mode === "image-to-video" ? "Ref Frame Active" : "Prompt Only"}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#050608]/92 border border-white/[0.1] px-3 py-1.5 rounded-[3px] font-mono text-[11px] text-[#C5CBD6]">
                  <span>{template.specs}</span>
                  <span className="text-[#5EEAD4]">{template.durationLabel}</span>
                </div>
              </div>
            </div>

            {/* Right Directing Rail */}
            <div className="lg:col-span-4 p-5 sm:p-6 bg-[#0A0C10] flex flex-col justify-between">
              <div>
                {mode === "image-to-video" && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#5EEAD4]">
                        Attached Reference Frame
                      </span>
                      <span className="font-mono text-[10px] text-[#667085]">Frame 001</span>
                    </div>
                    <div className="aspect-video w-full rounded-[4px] overflow-hidden border border-white/[0.1] bg-[#050608]">
                      <img
                        src={template.referenceStillSrc}
                        alt={`Reference frame for ${template.label}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#667085] mb-1.5">
                  Motion Prompt
                </p>
                <p className="text-[13px] text-[#E5E9F0] leading-[1.6] bg-[#101319] border border-white/[0.08] rounded-[4px] p-3.5 mb-5">
                  {template.prompt}
                </p>

                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#667085] mb-2">
                  Studio Presets
                </p>
                <div className="flex flex-col gap-1.5">
                  {VIDEO_TEMPLATES.map((item) => {
                    const active = item.id === template.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTemplateId(item.id)}
                        aria-pressed={active}
                        className={`w-full text-left px-3 py-2.5 rounded-[4px] border flex items-center justify-between transition-colors ${
                          active
                            ? "bg-[#141821] border-[#5EEAD4]/50 text-[#F5F7FA]"
                            : "bg-[#0D1016] border-white/[0.06] text-[#A0A8B8] hover:border-white/[0.14] hover:text-[#F5F7FA]"
                        }`}
                      >
                        <span className="text-[13px] font-medium">{item.label}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#667085]">
                          {item.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-white/[0.08]">
                <div className="flex items-center justify-between font-mono text-[11px] text-[#667085] mb-4">
                  <span>Queue Cost</span>
                  <span className="text-[#E5E9F0]">$2.00 / render · SuperGyra</span>
                </div>
                <a
                  href={resolveGyraRoute("/studio", routeBase)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#F1F5F9] text-[#050608] hover:bg-white py-2.5 px-4 rounded-[4px] text-[13px] font-medium transition-colors"
                >
                  Open Gyra Studio
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
