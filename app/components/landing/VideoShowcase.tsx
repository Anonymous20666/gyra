"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Film, ImageIcon, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { formatStudioTimecode } from "../../lib/carouselPhysics";
import {
  VIDEO_TEMPLATES,
  resolveGyraRoute,
  type VideoAspect,
  type VideoWorkbenchMode,
} from "../../lib/landingSimulations";

export interface VideoShowcaseProps {
  routeBase?: string;
}

export function VideoShowcase({ routeBase = "" }: VideoShowcaseProps) {
  const [presetId, setPresetId] = useState(VIDEO_TEMPLATES[0].id);
  const [inputMode, setInputMode] = useState<VideoWorkbenchMode>("image-to-video");
  const [aspect, setAspect] = useState<VideoAspect>("16:9");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(5.0);
  const [isInView, setIsInView] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const preset = VIDEO_TEMPLATES.find((p) => p.id === presetId) ?? VIDEO_TEMPLATES[0];

  // Respect prefers-reduced-motion so video does not autoplay unexpectedly
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsPlaying(false);
    }
  }, []);

  // Smart IntersectionObserver + visibilitychange so video only consumes GPU/CPU when actually visible
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        setIsInView(entries.some((entry) => entry.isIntersecting));
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = isMuted;

    const syncPlay = () => {
      if (isPlaying && isInView && !document.hidden) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    };

    syncPlay();
    document.addEventListener("visibilitychange", syncPlay);
    return () => document.removeEventListener("visibilitychange", syncPlay);
  }, [preset.videoSrc, isPlaying, isMuted, isInView]);

  const selectPreset = (id: string) => {
    const found = VIDEO_TEMPLATES.find((p) => p.id === id);
    setPresetId(id);
    setCurrentTime(0);
    if (found) {
      setInputMode(found.category === "Image-to-Video" ? "image-to-video" : "text-to-video");
    }
  };

  const handleScrub = (nextPct: number) => {
    const vid = videoRef.current;
    if (!vid || !Number.isFinite(duration) || duration <= 0) return;
    const targetTime = (nextPct / 100) * duration;
    vid.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const totalFrames = Math.max(120, Math.round(duration * 24));
  const activeFrameNum = Math.min(totalFrames, Math.max(1, Math.round(currentTime * 24) + 1));

  return (
    <section
      ref={sectionRef}
      id="video"
      className="gyra-band-defer border-b border-[#1F1F1F] bg-black py-24 lg:py-32"
    >
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
        {/* Header Row */}
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono-tech text-[12px] tracking-[0.14em] text-[#5B9EC2] uppercase">
              03 · Gyra Video
            </p>
            <h2 className="font-display mt-3.5 text-[clamp(2.35rem,4.2vw,3.75rem)] font-bold leading-[0.98] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
              Direct cinematic motion from text or reference frames.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] leading-[1.65] text-[#9A9A9A]">
              Direct 720p, 24 fps clips from text prompts or attached still frames. Scrub
              real-time frames, morph between 16:9 and 9:16, and queue renders in Studio.
            </p>
            <a
              href={resolveGyraRoute("/studio", routeBase)}
              className="font-mono-tech mt-4 inline-flex items-center gap-1.5 text-[12px] tracking-[0.1em] text-white uppercase underline decoration-[#5B9EC2] underline-offset-4 transition-colors hover:text-[#5B9EC2]"
            >
              Open Gyra Studio
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Pitch-Black Cinema Deck */}
        <div className="mt-12 border border-[#1F1F1F] bg-black">
          {/* Control Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1F1F1F] bg-[#050505] px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="tablist"
                aria-label="Video input mode"
                className="inline-flex border border-[#242424]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={inputMode === "text-to-video"}
                  onClick={() => setInputMode("text-to-video")}
                  className={`font-mono-tech inline-flex min-h-[34px] items-center gap-1.5 px-3 text-[11px] tracking-[0.06em] uppercase transition-colors cursor-pointer ${
                    inputMode === "text-to-video"
                      ? "bg-[#1F5B7C] font-medium text-white"
                      : "bg-black text-[#8A8A8A] hover:text-white"
                  }`}
                >
                  <Film className="h-3.5 w-3.5" />
                  Text-to-Video
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={inputMode === "image-to-video"}
                  onClick={() => setInputMode("image-to-video")}
                  className={`font-mono-tech inline-flex min-h-[34px] items-center gap-1.5 border-l border-[#242424] px-3 text-[11px] tracking-[0.06em] uppercase transition-colors cursor-pointer ${
                    inputMode === "image-to-video"
                      ? "bg-[#1F5B7C] font-medium text-white"
                      : "bg-black text-[#8A8A8A] hover:text-white"
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Image-to-Video
                </button>
              </div>

              <div role="group" aria-label="Aspect ratio" className="inline-flex border border-[#242424]">
                {(["16:9", "9:16"] as const).map((ratio, idx) => (
                  <button
                    key={ratio}
                    type="button"
                    aria-pressed={aspect === ratio}
                    onClick={() => setAspect(ratio)}
                    className={`font-mono-tech min-h-[34px] px-3 text-[11px] uppercase transition-colors cursor-pointer ${
                      idx > 0 ? "border-l border-[#242424]" : ""
                    } ${
                      aspect === ratio
                        ? "bg-white font-medium text-black"
                        : "bg-black text-[#8A8A8A] hover:text-white"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden font-mono-tech text-[11px] text-[#7D94A8] sm:inline">
                F{String(activeFrameNum).padStart(3, "0")} / {totalFrames}
              </span>
              <button
                type="button"
                onClick={() => setIsPlaying((playing) => !playing)}
                aria-label={isPlaying ? "Pause video showcase" : "Play video showcase"}
                className="font-mono-tech inline-flex min-h-[34px] items-center gap-1.5 border border-[#262626] bg-black px-3 text-[11px] tracking-[0.06em] text-[#D4D4D4] uppercase hover:border-white hover:text-white cursor-pointer"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => setIsMuted((muted) => !muted)}
                aria-label={isMuted ? "Unmute video showcase" : "Mute video showcase"}
                className="inline-flex h-[34px] w-[34px] items-center justify-center border border-[#262626] bg-black text-[#D4D4D4] hover:border-white hover:text-white cursor-pointer"
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Monitor + Director Rail */}
          <div className="grid grid-cols-1 divide-y divide-[#1F1F1F] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
            {/* Cinema Stage + Interactive Frame Scrubber */}
            <div className="flex flex-col justify-between bg-[#030303] p-5 sm:p-7 lg:col-span-8">
              <div className="flex flex-1 items-center justify-center">
                <div
                  className={`relative overflow-hidden border border-[#263848] bg-black transition-all duration-300 ${
                    aspect === "9:16"
                      ? "aspect-[9/16] w-[250px] sm:w-[285px]"
                      : "aspect-video w-full"
                  }`}
                >
                  <video
                    ref={videoRef}
                    key={preset.videoSrc}
                    src={preset.videoSrc}
                    poster={preset.posterSrc}
                    width={1280}
                    height={720}
                    preload="none"
                    loop
                    muted={isMuted}
                    playsInline
                    aria-label={`${preset.label} — ${preset.prompt}`}
                    onLoadedMetadata={(e) => {
                      const d = e.currentTarget.duration;
                      if (Number.isFinite(d) && d > 0) {
                        setDuration(d);
                        if (d > 10 && e.currentTarget.currentTime < 1.2) {
                          e.currentTarget.currentTime = 4.0;
                          setCurrentTime(4.0);
                        }
                      }
                    }}
                    onTimeUpdate={(e) => {
                      setCurrentTime(e.currentTarget.currentTime);
                    }}
                    className="h-full w-full object-cover gyra-video-fade"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Crisp Cinema Viewfinder Corner Reticles */}
                  <span className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 border-l border-t border-[#78B0CE]/80" />
                  <span className="pointer-events-none absolute right-2.5 top-2.5 h-3 w-3 border-r border-t border-[#78B0CE]/80" />
                  <span className="pointer-events-none absolute bottom-2.5 left-2.5 h-3 w-3 border-b border-l border-[#78B0CE]/80" />
                  <span className="pointer-events-none absolute bottom-2.5 right-2.5 h-3 w-3 border-b border-r border-[#78B0CE]/80" />

                  <div className="font-mono-tech absolute left-4 top-4 border border-[#5B9EC2]/70 bg-black/85 px-2.5 py-1 text-[10px] tracking-[0.08em] text-white uppercase">
                    {aspect} ·{" "}
                    {inputMode === "image-to-video" ? "Frame 001 Motion Lock" : "Text Motion Synthesis"}
                  </div>

                  <div className="font-mono-tech absolute inset-x-4 bottom-4 flex flex-wrap items-center justify-between gap-2 text-[10px] tracking-[0.08em] text-[#D4D4D4] uppercase">
                    <span>{preset.specs}</span>
                    <span className="text-[#78B0CE]">
                      {formatStudioTimecode(currentTime)} / {formatStudioTimecode(duration)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Timeline Frame Scrubber */}
              <div className="mt-5 border-t border-[#15202B] pt-4">
                <div className="flex items-center justify-between font-mono-tech text-[10px] tracking-[0.09em] text-[#7A90A3] uppercase">
                  <span>Timeline Scrubber · 24 FPS</span>
                  <span className="text-[#9CC4DC]">
                    {formatStudioTimecode(currentTime)} · Frame {String(activeFrameNum).padStart(3, "0")}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.5}
                  value={progressPct}
                  onChange={(e) => handleScrub(Number(e.target.value))}
                  aria-label="Scrub video playback timeline"
                  className="gyra-slider mt-2.5 w-full cursor-pointer"
                />
                <div className="mt-1.5 flex justify-between font-mono-tech text-[9px] text-[#556B7D]">
                  <span>00:00.0</span>
                  <span>{formatStudioTimecode(duration * 0.25)}</span>
                  <span>{formatStudioTimecode(duration * 0.5)}</span>
                  <span>{formatStudioTimecode(duration * 0.75)}</span>
                  <span>{formatStudioTimecode(duration)}</span>
                </div>
              </div>
            </div>

            {/* Director Rail */}
            <div className="flex flex-col justify-between bg-black p-5 sm:p-6 lg:col-span-4">
              <div>
                {inputMode === "image-to-video" && (
                  <div className="mb-5 border border-[#1E3346] bg-[#040A10] p-3">
                    <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase">
                      <span className="text-[#78B0CE]">Attached Reference Frame</span>
                      <span className="text-[#34D399]">Locked · F001</span>
                    </div>
                    <div className="mt-2.5 aspect-[16/9] overflow-hidden border border-[#24384A]">
                      <picture className="block h-full w-full">
                        {preset.referenceStillSrc.endsWith("video-ref-lagos.jpg") && (
                          <source
                            srcSet={preset.referenceStillSrc.replace(/\.jpg$/i, ".webp")}
                            type="image/webp"
                          />
                        )}
                        <img
                          src={preset.referenceStillSrc}
                          alt={`Reference frame for ${preset.label}`}
                          width={1376}
                          height={768}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </picture>
                    </div>
                  </div>
                )}

                <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#737373] uppercase">
                  Motion Prompt
                </p>
                <p className="mt-2 text-[14px] leading-[1.6] text-white">{preset.prompt}</p>

                <p className="font-mono-tech mt-6 text-[10px] tracking-[0.12em] text-[#737373] uppercase">
                  Studio Presets
                </p>
                <div className="mt-2.5 divide-y divide-[#1A1A1A] border border-[#1F1F1F]">
                  {VIDEO_TEMPLATES.map((item) => {
                    const active = item.id === preset.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectPreset(item.id)}
                        aria-pressed={active}
                        className={`flex w-full items-center justify-between px-3.5 py-3 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#5B9EC2] ${
                          active
                            ? "bg-[#0C2131] text-white"
                            : "bg-black text-[#8A8A8A] hover:bg-[#080808] hover:text-white"
                        }`}
                      >
                        <span className="text-[13px] font-medium">{item.label}</span>
                        <span
                          className={`font-mono-tech text-[10px] uppercase ${
                            active ? "text-[#78B0CE]" : "text-[#666666]"
                          }`}
                        >
                          {item.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 border-t border-[#1A1A1A] pt-5">
                <div className="flex items-center justify-between font-mono-tech text-[11px]">
                  <span className="text-[#737373] uppercase">Queue Cost</span>
                  <span className="text-white">$2.00 / render · SuperGyra</span>
                </div>
                <a
                  href={resolveGyraRoute("/studio", routeBase)}
                  className="font-mono-tech mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 bg-[#1F5B7C] px-4 text-[12px] font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#296E93]"
                >
                  Open Gyra Studio
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
