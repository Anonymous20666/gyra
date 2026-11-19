"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Film, ImageIcon, Pause, Play, Volume2, VolumeX } from "lucide-react";
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
  const videoRef = useRef<HTMLVideoElement>(null);

  const preset = VIDEO_TEMPLATES.find((p) => p.id === presetId) ?? VIDEO_TEMPLATES[0];

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = isMuted;
    if (isPlaying) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [preset.videoSrc, isPlaying, isMuted]);

  const selectPreset = (id: string) => {
    const found = VIDEO_TEMPLATES.find((p) => p.id === id);
    setPresetId(id);
    if (found) {
      setInputMode(found.category === "Image-to-Video" ? "image-to-video" : "text-to-video");
    }
  };

  return (
    <section id="video" className="border-b border-[#1F1F1F] bg-black py-24 lg:py-32">
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
        {/* Header Row */}
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono-tech text-[12px] tracking-[0.14em] text-[#FF3D00] uppercase">
              [ 03 · Gyra Video ]
            </p>
            <h2 className="font-display mt-3.5 text-[clamp(2.35rem,4.2vw,3.75rem)] font-bold leading-[0.98] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
              Direct cinematic motion from text or reference frames.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] leading-[1.65] text-[#9A9A9A]">
              Direct 720p, 24 fps clips from text prompts or attached still frames. Switch between
              widescreen 16:9 and vertical 9:16 framing, apply Studio presets, and track async
              renders in your history.
            </p>
            <a
              href={resolveGyraRoute("/studio", routeBase)}
              className="font-mono-tech mt-4 inline-flex items-center gap-1.5 text-[12px] tracking-[0.1em] text-white uppercase underline decoration-[#FF3D00] underline-offset-4 transition-colors hover:text-[#FF3D00]"
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
                  className={`font-mono-tech inline-flex min-h-[34px] items-center gap-1.5 px-3 text-[11px] tracking-[0.06em] uppercase transition-colors ${
                    inputMode === "text-to-video"
                      ? "bg-[#FF3D00] font-medium text-white"
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
                  className={`font-mono-tech inline-flex min-h-[34px] items-center gap-1.5 border-l border-[#242424] px-3 text-[11px] tracking-[0.06em] uppercase transition-colors ${
                    inputMode === "image-to-video"
                      ? "bg-[#FF3D00] font-medium text-white"
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
                    className={`font-mono-tech min-h-[34px] px-3 text-[11px] uppercase transition-colors ${
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
              <button
                type="button"
                onClick={() => setIsPlaying((playing) => !playing)}
                aria-label={isPlaying ? "Pause video showcase" : "Play video showcase"}
                className="font-mono-tech inline-flex min-h-[34px] items-center gap-1.5 border border-[#262626] bg-black px-3 text-[11px] tracking-[0.06em] text-[#D4D4D4] uppercase hover:border-white hover:text-white"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => setIsMuted((muted) => !muted)}
                aria-label={isMuted ? "Unmute video showcase" : "Mute video showcase"}
                className="inline-flex h-[34px] w-[34px] items-center justify-center border border-[#262626] bg-black text-[#D4D4D4] hover:border-white hover:text-white"
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Monitor + Director Rail */}
          <div className="grid grid-cols-1 divide-y divide-[#1F1F1F] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
            {/* Cinema Stage */}
            <div className="flex items-center justify-center bg-[#030303] p-5 sm:p-8 lg:col-span-8">
              <div
                className={`relative overflow-hidden border border-[#262626] bg-black transition-all duration-300 ${
                  aspect === "9:16" ? "aspect-[9/16] w-[260px] sm:w-[290px]" : "aspect-video w-full"
                }`}
              >
                <video
                  ref={videoRef}
                  key={preset.videoSrc}
                  src={preset.videoSrc}
                  poster={preset.posterSrc}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35" />

                <div className="font-mono-tech absolute left-3 top-3 border border-[#FF3D00]/70 bg-black/90 px-2.5 py-1 text-[10px] tracking-[0.08em] text-white uppercase">
                  {aspect} · {inputMode === "image-to-video" ? "Ref Frame Active" : "Prompt Driven"}
                </div>

                <div className="font-mono-tech absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2 text-[10px] tracking-[0.08em] text-[#D4D4D4] uppercase">
                  <span>{preset.specs}</span>
                  <span className="text-[#FF3D00]">{preset.durationLabel}</span>
                </div>
              </div>
            </div>

            {/* Director Rail */}
            <div className="flex flex-col justify-between bg-black p-5 sm:p-6 lg:col-span-4">
              <div>
                {inputMode === "image-to-video" && (
                  <div className="mb-5 border border-[#1F1F1F] bg-[#050505] p-3">
                    <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase">
                      <span className="text-[#FF3D00]">Attached Reference Frame</span>
                      <span className="text-[#737373]">Frame 001</span>
                    </div>
                    <div className="mt-2.5 aspect-[16/9] overflow-hidden border border-[#242424]">
                      <img
                        src={preset.referenceStillSrc}
                        alt={`Reference frame for ${preset.label}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
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
                        className={`flex w-full items-center justify-between px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#FF3D00] ${
                          active
                            ? "bg-[#111111] text-white"
                            : "bg-black text-[#8A8A8A] hover:bg-[#080808] hover:text-white"
                        }`}
                      >
                        <span className="text-[13px] font-medium">{item.label}</span>
                        <span
                          className={`font-mono-tech text-[10px] uppercase ${
                            active ? "text-[#FF3D00]" : "text-[#666666]"
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
                  className="font-mono-tech mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 bg-[#FF3D00] px-4 text-[12px] font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#FF551F]"
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
