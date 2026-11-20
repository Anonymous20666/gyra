"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { formatStudioTimecode } from "../../lib/carouselPhysics";
import type { LabPalette } from "./labTheme";

interface CinemaCandidate {
  id: string;
  badge: string;
  label: string;
  category: string;
  videoSrc: string;
  f001Src: string;
  prompt: string;
  specs: string;
  lockedSlot1?: boolean;
}

const CINEMA_CANDIDATES: CinemaCandidate[] = [
  {
    id: "obsidian-headset",
    badge: "SLOT 1 · KEPT & FIXED",
    label: "Obsidian Studio Headset",
    category: "Image-to-Video",
    videoSrc: "/products-hero-bg.mp4",
    f001Src: "/video-samples/headset-f001.webp",
    prompt:
      "Slow macro camera orbit around matte-obsidian studio headphones emerging from pure black darkness, crisp steel-blue rim light tracing the sculpted earcups.",
    specs: "720p · 24 fps · LTX-Video · TRUE F001 MATCH",
    lockedSlot1: true,
  },
  {
    id: "monitor-orbit",
    badge: "CANDIDATE A",
    label: "Titanium Acoustic Monitor",
    category: "Macro Product Orbit",
    videoSrc: "/video-samples/monitor-orbit.mp4",
    f001Src: "/video-samples/monitor-orbit-f001.webp",
    prompt:
      "Precision macro studio dolly across chamfered obsidian anodized aluminum and brushed titanium dial on honed basalt stone, steel-blue & tungsten rim light sweep.",
    specs: "720p · 24 fps · 5.0s Seamless Loop",
  },
  {
    id: "tourbillon-flare",
    badge: "CANDIDATE B",
    label: "Swiss Tourbillon Horology",
    category: "Luxury Macro Motion",
    videoSrc: "/video-samples/tourbillon-flare.mp4",
    f001Src: "/video-samples/tourbillon-flare-f001.webp",
    prompt:
      "Controlled macro camera sweep over an obsidian skeletonized tourbillon movement, sapphire crystal specular reflection rolling smoothly over ticking escapement.",
    specs: "720p · 24 fps · 5.0s Seamless Loop",
  },
  {
    id: "pavilion-relight",
    badge: "CANDIDATE C",
    label: "Brutalist Pavilion Relight",
    category: "Architectural Time-Shift",
    videoSrc: "/video-samples/pavilion-relight.mp4",
    f001Src: "/video-samples/pavilion-relight-f001.webp",
    prompt:
      "Continuous twilight architectural relight transitioning from cool steel-blue dusk into warm 2700K interior bounce with shimmering dark water reflections.",
    specs: "720p · 24 fps · 5.0s Seamless Loop",
  },
  {
    id: "aero-windtunnel",
    badge: "CANDIDATE D",
    label: "Hypersonic Aero Tunnel",
    category: "Volumetric Physics Sim",
    videoSrc: "/video-samples/aero-windtunnel.mp4",
    f001Src: "/video-samples/aero-windtunnel-f001.webp",
    prompt:
      "Dark aerospace wind-tunnel camera glide as volumetric steel-blue laminar airflow streamlines and an optical LIDAR scan plane sweep over matte-carbon bodywork.",
    specs: "720p · 24 fps · 5.0s Seamless Loop",
  },
  {
    id: "optics-aperture",
    badge: "CANDIDATE E",
    label: "Anamorphic Cinema Lens",
    category: "Optical Glass Sweep",
    videoSrc: "/video-samples/optics-aperture.mp4",
    f001Src: "/video-samples/optics-aperture-f001.webp",
    prompt:
      "Precision optical bench motion study around a multi-coated cinema lens, anamorphic steel-blue streak flare gliding across curved glass with breathing aperture ring.",
    specs: "720p · 24 fps · 5.0s Seamless Loop",
  },
];

export function VideoReplacementLab({ palette }: { palette: LabPalette }) {
  const [activeId, setActiveId] = useState<string>("aero-windtunnel");
  const [aspect, setAspect] = useState<"16:9" | "9:16">("16:9");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(5.0);
  const [shortlist, setShortlist] = useState<string[]>(["aero-windtunnel", "pavilion-relight"]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const active = CINEMA_CANDIDATES.find((c) => c.id === activeId) ?? CINEMA_CANDIDATES[0];

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = isMuted;
    if (isPlaying) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [active.videoSrc, isPlaying, isMuted]);

  const toggleShortlist = (id: string) => {
    if (id === "obsidian-headset") return;
    setShortlist((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono-tech text-[11px] tracking-[0.16em] uppercase" style={{ color: palette.bright }}>
            [ VIDEO REPLACEMENT STUDIO · REPLACING CAR &amp; CONVEYOR · KEEPING HEADSET ]
          </p>
          <h2 className="font-display mt-3 text-[clamp(2.3rem,4.2vw,3.7rem)] leading-[0.95] tracking-[-0.02em] text-white uppercase">
            <span className="font-light text-white/75">Keep your Obsidian Headset.</span>
            <br />
            <span className="font-bold text-white">Pick 2 new cinema loops.</span>
          </h2>
        </div>

        <div className="border border-white/12 bg-[#04080E] px-4 py-3 font-mono-tech text-[11px]">
          <p className="text-[#7C90A3] uppercase">Your Shortlist (Replacing Slots 2 &amp; 3)</p>
          <p className="mt-1 text-white">
            1. Obsidian Headset (Locked) · 2.{" "}
            <span style={{ color: palette.soft }}>
              {CINEMA_CANDIDATES.find((c) => c.id === shortlist[0])?.label ?? "Pick one"}
            </span>{" "}
            · 3.{" "}
            <span style={{ color: palette.soft }}>
              {CINEMA_CANDIDATES.find((c) => c.id === shortlist[1])?.label ?? "Pick one"}
            </span>
          </p>
        </div>
      </div>

      {/* Main Cinema Player + Pixel-Matched F001 Inspector */}
      <div className="mt-10 border border-white/14 bg-black">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#04060A] px-4 py-2.5">
          <div className="flex items-center gap-2 font-mono-tech text-[11px] uppercase">
            <span
              className="px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: active.lockedSlot1 ? "#047857" : palette.solid }}
            >
              {active.badge}
            </span>
            <span className="text-white">{active.label}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex border border-white/15">
              {(["16:9", "9:16"] as const).map((r, i) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setAspect(r)}
                  className={`font-mono-tech px-3 py-1 text-[10.5px] uppercase cursor-pointer ${
                    i > 0 ? "border-l border-white/15" : ""
                  } ${aspect === r ? "bg-white font-medium text-black" : "text-[#8EA2B5] hover:text-white"}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? "Pause video" : "Play video"}
              className="inline-flex h-8 items-center gap-1.5 border border-white/15 px-3 font-mono-tech text-[10.5px] text-white uppercase hover:border-white cursor-pointer"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              aria-label={isMuted ? "Unmute video" : "Mute video"}
              className="inline-flex h-8 w-8 items-center justify-center border border-white/15 text-white hover:border-white cursor-pointer"
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-white/10 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          <div className="flex flex-col justify-between bg-[#020407] p-5 sm:p-7 lg:col-span-8">
            <div className="flex flex-1 items-center justify-center">
              <div
                className={`relative overflow-hidden border border-white/15 bg-black transition-all duration-300 ${
                  aspect === "9:16" ? "aspect-[9/16] w-[250px]" : "aspect-video w-full"
                }`}
              >
                <video
                  ref={videoRef}
                  key={active.videoSrc}
                  src={active.videoSrc}
                  poster={active.f001Src}
                  width={1280}
                  height={720}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  onLoadedMetadata={(e) => {
                    const d = e.currentTarget.duration;
                    if (Number.isFinite(d) && d > 0) setDuration(d);
                  }}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  className="h-full w-full object-cover gyra-video-fade"
                />
                <div className="font-mono-tech pointer-events-none absolute inset-x-4 bottom-3 flex justify-between text-[10px] text-[#DCE8F3] uppercase">
                  <span>{active.specs}</span>
                  <span style={{ color: palette.soft }}>
                    {formatStudioTimecode(currentTime)} / {formatStudioTimecode(duration)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <input
                type="range"
                min={0}
                max={100}
                step={0.5}
                value={progressPct}
                onChange={(e) => {
                  const vid = videoRef.current;
                  if (!vid || !Number.isFinite(duration)) return;
                  const target = (Number(e.target.value) / 100) * duration;
                  vid.currentTime = target;
                  setCurrentTime(target);
                }}
                aria-label="Scrub cinema sample video"
                className="gyra-slider w-full cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between p-5 sm:p-6 lg:col-span-4">
            <div>
              <div className="border border-white/12 bg-[#04080E] p-3">
                <div className="flex justify-between font-mono-tech text-[10px] uppercase">
                  <span style={{ color: palette.soft }}>Pixel-Matched Reference Frame</span>
                  <span className="text-[#34D399]">LOCKED · F001</span>
                </div>
                <div className="mt-2 aspect-video overflow-hidden border border-white/10">
                  <img
                    src={active.f001Src}
                    alt={`True Frame 001 still for ${active.label}`}
                    width={960}
                    height={540}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <p className="mt-5 font-mono-tech text-[10px] tracking-[0.12em] text-[#7A8D9E] uppercase">
                Accurate Motion Prompt
              </p>
              <p className="mt-2 text-[13.5px] leading-[1.6] text-white">{active.prompt}</p>
            </div>

            {!active.lockedSlot1 && (
              <button
                type="button"
                onClick={() => toggleShortlist(active.id)}
                style={{
                  backgroundColor: shortlist.includes(active.id) ? palette.solid : "transparent",
                }}
                className="font-mono-tech mt-6 inline-flex min-h-[42px] w-full items-center justify-center gap-2 border border-white/20 px-4 text-[11px] tracking-[0.08em] text-white uppercase transition-colors hover:border-white cursor-pointer"
              >
                {shortlist.includes(active.id) && <Check className="h-3.5 w-3.5" />}
                <span>
                  {shortlist.includes(active.id)
                    ? "Shortlisted for Landing Page"
                    : "Shortlist This Candidate"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6-Card Visual Cinema Filmstrip Picker (Headset + 5 Dark-Studio Candidates) */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {CINEMA_CANDIDATES.map((c) => {
          const isAct = c.id === activeId;
          const isPick = shortlist.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              style={{
                borderColor: isAct ? palette.bright : isPick ? "#34D399" : "rgba(255,255,255,0.12)",
              }}
              className="group overflow-hidden border bg-[#04070B] text-left transition-colors hover:border-white cursor-pointer"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-black">
                <img
                  src={c.f001Src}
                  alt={c.label}
                  width={320}
                  height={180}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {(c.lockedSlot1 || isPick) && (
                  <span
                    className="font-mono-tech absolute right-1.5 top-1.5 px-1.5 py-0.5 text-[8.5px] font-medium text-white uppercase"
                    style={{ backgroundColor: c.lockedSlot1 ? "#047857" : palette.solid }}
                  >
                    {c.lockedSlot1 ? "SLOT 1" : "PICK"}
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p className="font-mono-tech text-[9px] text-[#7D92A4] uppercase">{c.badge}</p>
                <p className="mt-0.5 truncate text-[12px] font-medium text-white">{c.label}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
