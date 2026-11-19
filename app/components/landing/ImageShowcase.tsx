"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Maximize2, MoveHorizontal } from "lucide-react";
import { ImageLightboxModal } from "./ImageLightboxModal";
import {
  getNearestIndex,
  getWrappedDelta,
  stepCarouselMomentum,
  wrapIndexOffset,
  type CarouselPhysicsState,
} from "../../lib/carouselPhysics";
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

function toHdWebp(src: string): string {
  return src.replace(/\.jpg$/i, ".webp");
}

function toThumbWebp(src: string): string {
  return src.replace(/-hd\.jpg$/i, "-thumb.webp").replace(/\.jpg$/i, ".webp");
}

export function ImageShowcase({ routeBase = "" }: ImageShowcaseProps) {
  // Default to the new Momentum-Spin HD Gallery so visitors immediately feel the peak 1080p imagery & flick-spin wheel,
  // with Pro Ultra Geometry-Locked Before/After right beside it!
  const [mode, setMode] = useState<ImageWorkbenchMode>("generate");
  const [splitPct, setSplitPct] = useState(52);
  const [isSplitDragging, setIsSplitDragging] = useState(false);
  const splitStageRef = useRef<HTMLDivElement>(null);

  // Momentum-Spin Carousel Physics State (drags smoothly, flicks & rolls with inertia, snaps softly to center!)
  const itemCount = IMAGE_PRESETS.length;
  const [renderOffset, setRenderOffset] = useState(0);
  const [isDeckDragging, setIsDeckDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  const physicsRef = useRef<CarouselPhysicsState>({
    offset: 0,
    velocity: 0,
    targetIndex: null,
    settled: true,
  });

  const dragRef = useRef<{
    active: boolean;
    captured: boolean;
    pointerId: number;
    startX: number;
    lastX: number;
    lastTime: number;
    velocitySamples: number[];
    movedPx: number;
  }>({
    active: false,
    captured: false,
    pointerId: -1,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    velocitySamples: [],
    movedPx: 0,
  });

  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  const startPhysicsLoop = () => {
    if (rafRef.current) return;
    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      if (document.hidden || dragRef.current.active) {
        rafRef.current = 0;
        return;
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameRef.current) / 1000));
      lastFrameRef.current = now;

      const next = stepCarouselMomentum(physicsRef.current, dt, itemCount);
      physicsRef.current = next;
      setRenderOffset(next.offset);

      if (next.settled) {
        rafRef.current = 0;
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
  };

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        if (rafRef.current) {
          window.cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
      } else if (!physicsRef.current.settled && !dragRef.current.active) {
        startPhysicsLoop();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spinToIndex = (index: number) => {
    const wrapped = ((index % itemCount) + itemCount) % itemCount;
    physicsRef.current = {
      ...physicsRef.current,
      targetIndex: wrapped,
      settled: false,
    };
    startPhysicsLoop();
  };

  const nudgeDeck = (dir: -1 | 1) => {
    const currentNearest = getNearestIndex(physicsRef.current.offset, itemCount);
    spinToIndex(currentNearest + dir);
  };

  const handleDeckPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Allow buttons inside deck controls to click cleanly without hijacking
    if ((e.target as HTMLElement).closest("button")) return;
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    dragRef.current = {
      active: true,
      captured: false,
      pointerId: e.pointerId,
      startX: e.clientX,
      lastX: e.clientX,
      lastTime: performance.now(),
      velocitySamples: [],
      movedPx: 0,
    };
    physicsRef.current = {
      ...physicsRef.current,
      velocity: 0,
      targetIndex: null,
      settled: false,
    };
  };

  const handleDeckPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const now = performance.now();
    const dx = e.clientX - dragRef.current.lastX;
    const dtSec = Math.max(0.004, (now - dragRef.current.lastTime) / 1000);

    dragRef.current.lastX = e.clientX;
    dragRef.current.lastTime = now;
    dragRef.current.movedPx += Math.abs(dx);

    // Only engage pointer capture and dragging cursor once user moves past click threshold
    if (!dragRef.current.captured && dragRef.current.movedPx > 6) {
      dragRef.current.captured = true;
      setIsDeckDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer already released
      }
    }

    if (!dragRef.current.captured) return;

    const deckWidth = deckRef.current?.clientWidth || 720;
    const cardSpanPx = Math.max(220, Math.min(430, deckWidth * 0.48));
    const deltaItems = -dx / cardSpanPx;

    const instVelocity = deltaItems / dtSec;
    dragRef.current.velocitySamples.push(instVelocity);
    if (dragRef.current.velocitySamples.length > 5) {
      dragRef.current.velocitySamples.shift();
    }

    const nextOffset = wrapIndexOffset(physicsRef.current.offset + deltaItems, itemCount);
    physicsRef.current.offset = nextOffset;
    setRenderOffset(nextOffset);
  };

  const handleDeckPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const wasCaptured = dragRef.current.captured;
    dragRef.current.active = false;
    dragRef.current.captured = false;
    setIsDeckDragging(false);

    if (wasCaptured) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore release errors
      }
    }

    // If this was a clean tap/click without dragging, let card onClick handle opening or centering
    if (!wasCaptured) return;

    const samples = dragRef.current.velocitySamples;
    const avgVelocity =
      samples.length > 0
        ? samples.reduce((acc, v) => acc + v, 0) / samples.length
        : 0;

    // Amplify gentle flicks cleanly up to a silky max spin speed so "slide & leave it" rolls satisfyingly!
    const clampedVelocity = Math.max(-11, Math.min(11, avgVelocity * 1.15));

    if (Math.abs(clampedVelocity) > 0.55) {
      physicsRef.current = {
        offset: physicsRef.current.offset,
        velocity: clampedVelocity,
        targetIndex: null,
        settled: false,
      };
    } else {
      const snap = getNearestIndex(physicsRef.current.offset, itemCount);
      physicsRef.current = {
        offset: physicsRef.current.offset,
        velocity: clampedVelocity,
        targetIndex: snap,
        settled: false,
      };
    }
    startPhysicsLoop();
  };

  const activeIdx = getNearestIndex(renderOffset, itemCount);
  const selectedSpecimen = IMAGE_PRESETS[activeIdx] ?? IMAGE_PRESETS[0];

  const updateSplitFromClientX = (clientX: number) => {
    const stage = splitStageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPct(clampSplitPercent(pct, 6, 94));
  };

  return (
    <section id="image" className="gyra-band-defer border-b border-[#1F1F1F] bg-black py-24 lg:py-32">
      <div className="mx-auto max-w-[1380px] px-5 sm:px-8">
        {/* Header Row */}
        <div className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="font-mono-tech text-[12px] tracking-[0.14em] text-[#5B9EC2] uppercase">
              02 · Gyra Image
            </p>
            <h2 className="font-display mt-3.5 text-[clamp(2.35rem,4.2vw,3.75rem)] font-bold leading-[0.98] tracking-[-0.02em] text-white uppercase [text-wrap:balance]">
              Visual synthesis and surgical image-to-image editing.
            </h2>
          </div>
          <div className="lg:col-span-5 lg:pl-6">
            <p className="text-[15px] leading-[1.65] text-[#9A9A9A]">
              Swipe or flick the momentum gallery to inspect studio-grade Flux renders, or switch
              to Pro Ultra for pixel-registered geometry-locked lighting edits.
            </p>
            <a
              href={resolveGyraRoute("/dashboard", routeBase)}
              className="font-mono-tech mt-4 inline-flex items-center gap-1.5 text-[12px] tracking-[0.1em] text-white uppercase underline decoration-[#5B9EC2] underline-offset-4 transition-colors hover:text-[#5B9EC2]"
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
                id="gyra-image-tab-generate"
                type="button"
                role="tab"
                aria-selected={mode === "generate"}
                aria-controls="gyra-image-panel-generate"
                onClick={() => setMode("generate")}
                className={`font-mono-tech min-h-[34px] border px-3.5 text-[11px] tracking-[0.08em] uppercase transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2] ${
                  mode === "generate"
                    ? "border-[#5B9EC2] bg-[#1F5B7C] font-medium text-white"
                    : "border-[#242424] bg-black text-[#8A8A8A] hover:border-[#444] hover:text-white"
                }`}
              >
                Text-to-Image · Flux Deck
              </button>
              <button
                id="gyra-image-tab-edit"
                type="button"
                role="tab"
                aria-selected={mode === "edit"}
                aria-controls="gyra-image-panel-edit"
                onClick={() => setMode("edit")}
                className={`font-mono-tech min-h-[34px] border px-3.5 text-[11px] tracking-[0.08em] uppercase transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5B9EC2] ${
                  mode === "edit"
                    ? "border-[#5B9EC2] bg-[#1F5B7C] font-medium text-white"
                    : "border-[#242424] bg-black text-[#8A8A8A] hover:border-[#444] hover:text-white"
                }`}
              >
                Image-to-Image · Pro Ultra
              </button>
            </div>

            <span className="font-mono-tech text-[11px] tracking-[0.06em] text-[#808080] uppercase">
              {mode === "edit"
                ? `${IMAGE_EDIT_SHOWCASE.modelLabel} · ${IMAGE_EDIT_SHOWCASE.resolution}`
                : `${selectedSpecimen.modelLabel} · ${selectedSpecimen.resolution} · Drag or Flick to Spin`}
            </span>
          </div>

          {mode === "generate" ? (
            <div
              id="gyra-image-panel-generate"
              role="tabpanel"
              aria-labelledby="gyra-image-tab-generate"
              className="grid grid-cols-1 divide-y divide-[#1F1F1F] lg:grid-cols-12 lg:divide-x lg:divide-y-0"
            >
              {/* Left 8 cols: Interactive 3D Momentum-Spin Specimen Deck */}
              <div className="relative flex flex-col justify-between overflow-hidden bg-[#020508] p-4 sm:p-6 lg:col-span-8">
                {/* 3D Perspective Flick-and-Roll Stage */}
                <div
                  ref={deckRef}
                  data-testid="image-momentum-deck"
                  onPointerDown={handleDeckPointerDown}
                  onPointerMove={handleDeckPointerMove}
                  onPointerUp={handleDeckPointerUp}
                  onPointerCancel={handleDeckPointerUp}
                  style={{ perspective: "1250px" }}
                  className={`relative h-[330px] sm:h-[445px] w-full select-none overflow-hidden touch-pan-y ${
                    isDeckDragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                >
                  {/* Subtle studio horizon glow behind active center image */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse 55% 48% at 50% 50%, rgba(31, 91, 124, 0.22) 0%, transparent 72%)",
                    }}
                  />

                  {IMAGE_PRESETS.map((item, idx) => {
                    const delta = getWrappedDelta(idx, renderOffset, itemCount);
                    const absD = Math.abs(delta);
                    const isCenter = absD < 0.35;

                    // Silky 3D carousel geometry — cards visibly roll smoothly past center & fade cleanly behind horizon
                    const translateXPercent = delta * 76;
                    const translateZ = -Math.min(280, absD * 125);
                    const rotateY = Math.max(-34, Math.min(34, -delta * 20));
                    const scale = Math.max(0.7, 1 - absD * 0.16);
                    const opacity = absD > 2.25 ? 0 : Math.max(0.14, 1 - absD * 0.44);
                    const zIndex = Math.round(50 - absD * 12);

                    return (
                      <div
                        key={item.id}
                        data-active-center={isCenter ? "true" : "false"}
                        onClick={() => {
                          if (dragRef.current.movedPx >= 8) return;
                          if (isCenter) {
                            setLightboxIndex(idx);
                          } else {
                            spinToIndex(idx);
                          }
                        }}
                        style={{
                          transform: `translate3d(-50%, -50%, 0) translate3d(${translateXPercent}%, 0, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                          opacity,
                          zIndex,
                          pointerEvents: absD > 1.75 ? "none" : "auto",
                          willChange: "transform, opacity",
                        }}
                        className={`group absolute left-1/2 top-1/2 w-[78%] sm:w-[68%] aspect-[4/3] overflow-hidden border bg-black ${
                          isCenter
                            ? "border-[#78B0CE] shadow-[0_24px_60px_rgba(0,0,0,0.85)] cursor-pointer"
                            : "border-[#1C2C3A] cursor-pointer"
                        }`}
                      >
                        <picture className="block h-full w-full">
                          <source srcSet={toHdWebp(item.imageSrc)} type="image/webp" />
                          <img
                            src={item.imageSrc}
                            alt={`${item.category}: ${item.title}`}
                            width={1200}
                            height={896}
                            loading="lazy"
                            decoding="async"
                            fetchPriority={isCenter ? "auto" : "low"}
                            draggable={false}
                            referrerPolicy="no-referrer"
                            className={`h-full w-full object-cover transition-transform duration-300 ${
                              isCenter && !isDeckDragging ? "group-hover:scale-[1.025]" : ""
                            }`}
                          />
                        </picture>
                        {isCenter && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightboxIndex(idx);
                            }}
                            aria-label={`Inspect ${item.title} full screen`}
                            className="font-mono-tech absolute right-3 top-3 z-20 inline-flex min-h-[34px] items-center gap-1.5 border border-[#5B9EC2]/80 bg-black/85 px-2.5 text-[10px] tracking-[0.09em] text-[#E6F4FC] uppercase transition-colors hover:border-white hover:bg-[#1F5B7C] hover:text-white cursor-pointer"
                          >
                            <Maximize2 className="h-3 w-3" />
                            <span>Inspect</span>
                          </button>
                        )}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 sm:p-5">
                          <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#78B0CE] uppercase">
                            {String(idx + 1).padStart(2, "0")} · {item.category} · {item.resolution}
                          </p>
                          <p className="font-display mt-0.5 text-[20px] sm:text-[24px] font-bold leading-tight text-white uppercase">
                            {item.title}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Side-Accessible Precision Navigation Arrows */}
                  <button
                    type="button"
                    onClick={() => nudgeDeck(-1)}
                    aria-label="Previous image specimen"
                    className="absolute left-2.5 top-1/2 z-[60] flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#2A4256] bg-black/85 text-white transition-colors hover:border-[#78B0CE] hover:bg-[#0C2538] cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeDeck(1)}
                    aria-label="Next image specimen"
                    className="absolute right-2.5 top-1/2 z-[60] flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[#2A4256] bg-black/85 text-white transition-colors hover:border-[#78B0CE] hover:bg-[#0C2538] cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* Bottom Precision Index Rail */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#14202C] pt-3.5">
                  <div className="flex items-center gap-1.5" role="group" aria-label="Jump to specimen">
                    {IMAGE_PRESETS.map((item, idx) => {
                      const active = idx === activeIdx;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => spinToIndex(idx)}
                          aria-label={`Select ${item.title}`}
                          aria-pressed={active}
                          className={`h-1.5 transition-all duration-200 cursor-pointer ${
                            active
                              ? "w-8 bg-[#5B9EC2]"
                              : "w-3 bg-[#243646] hover:bg-[#496F8C]"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="font-mono-tech text-[10.5px] tracking-[0.09em] text-[#7D93A6] uppercase">
                    Drag to spin · Click active frame to inspect · {String(activeIdx + 1).padStart(2, "0")} /{" "}
                    {String(itemCount).padStart(2, "0")}
                  </span>
                </div>
              </div>

              {/* Right 4 cols: Specimen Inspector & Quick Filmstrip Selector */}
              <div className="flex flex-col justify-between bg-black p-5 sm:p-6 lg:col-span-4">
                <div>
                  <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#5B9EC2] uppercase">
                    Active Specimen · {selectedSpecimen.category}
                  </p>
                  <h3 className="font-display mt-1.5 text-[26px] font-bold leading-tight text-white uppercase">
                    {selectedSpecimen.title}
                  </h3>

                  <div className="mt-4 border border-[#1B2A38] bg-[#04090F] p-3.5">
                    <p className="font-mono-tech text-[10px] tracking-[0.1em] text-[#6E8599] uppercase">
                      Generation Prompt
                    </p>
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-[#D8E5F0]">
                      {selectedSpecimen.prompt}
                    </p>
                  </div>

                  {/* Clean Horizontal Thumbnail Filmstrip */}
                  <div className="mt-5">
                    <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#737373] uppercase">
                      Jump to Frame ({itemCount} Studio Renders)
                    </p>
                    <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                      {IMAGE_PRESETS.map((item, idx) => {
                        const active = idx === activeIdx;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => spinToIndex(idx)}
                            aria-label={`Jump to ${item.title}`}
                            className={`aspect-[4/3] overflow-hidden border transition-all cursor-pointer ${
                              active
                                ? "border-[#78B0CE] opacity-100"
                                : "border-[#1E2B36] opacity-55 hover:opacity-95"
                            }`}
                          >
                            <picture className="block h-full w-full">
                              <source srcSet={toThumbWebp(item.imageSrc)} type="image/webp" />
                              <img
                                src={item.imageSrc}
                                alt={item.title}
                                width={320}
                                height={238}
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover"
                              />
                            </picture>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <dl className="mt-5 divide-y divide-[#1A1A1A] border-y border-[#1A1A1A] text-[12.5px]">
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-[#808080]">Engine</dt>
                      <dd className="font-mono-tech text-white">{selectedSpecimen.modelLabel}</dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-[#808080]">Resolution</dt>
                      <dd className="font-mono-tech text-[#D4D4D4]">{selectedSpecimen.resolution}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-6 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(activeIdx)}
                      className="font-mono-tech inline-flex min-h-[40px] items-center justify-center gap-1.5 border border-[#2D485E] bg-[#061018] px-3 text-[10.5px] tracking-[0.08em] text-[#DCEEFB] uppercase transition-colors hover:border-[#78B0CE] hover:bg-[#0D2436] hover:text-white cursor-pointer whitespace-nowrap"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                      View Full HD
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("edit")}
                      className="font-mono-tech inline-flex min-h-[40px] items-center justify-center gap-1.5 border border-[#263847] bg-[#060C12] px-3 text-[10.5px] tracking-[0.08em] text-[#B8D2E6] uppercase transition-colors hover:border-[#5B9EC2] hover:text-white cursor-pointer whitespace-nowrap"
                    >
                      Pro Ultra I2I →
                    </button>
                  </div>
                  <a
                    href={resolveGyraRoute("/dashboard", routeBase)}
                    className="font-mono-tech inline-flex min-h-[44px] w-full items-center justify-center gap-2 bg-[#1F5B7C] px-4 text-[12px] font-medium tracking-[0.08em] text-white uppercase transition-colors hover:bg-[#296E93]"
                  >
                    Generate in Gyra
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div
              id="gyra-image-panel-edit"
              role="tabpanel"
              aria-labelledby="gyra-image-tab-edit"
              className="grid grid-cols-1 divide-y divide-[#1F1F1F] lg:grid-cols-12 lg:divide-x lg:divide-y-0"
            >
              {/* Interactive Pixel-Registered Comparison Stage */}
              <div className="bg-black p-5 sm:p-6 lg:col-span-8">
                <div
                  ref={splitStageRef}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setIsSplitDragging(true);
                    updateSplitFromClientX(event.clientX);
                  }}
                  onPointerMove={(event) => {
                    if (!isSplitDragging) return;
                    updateSplitFromClientX(event.clientX);
                  }}
                  onPointerUp={() => setIsSplitDragging(false)}
                  onPointerCancel={() => setIsSplitDragging(false)}
                  className="relative aspect-[4/3] w-full cursor-ew-resize select-none overflow-hidden border border-[#242424] bg-black touch-none"
                >
                  <picture className="block h-full w-full">
                    <source srcSet={toHdWebp(IMAGE_EDIT_SHOWCASE.afterSrc)} type="image/webp" />
                    <img
                      src={IMAGE_EDIT_SHOWCASE.afterSrc}
                      alt={IMAGE_EDIT_SHOWCASE.afterLabel}
                      width={1200}
                      height={896}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </picture>

                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
                  >
                    <picture className="block h-full w-full">
                      <source srcSet={toHdWebp(IMAGE_EDIT_SHOWCASE.beforeSrc)} type="image/webp" />
                      <img
                        src={IMAGE_EDIT_SHOWCASE.beforeSrc}
                        alt={IMAGE_EDIT_SHOWCASE.beforeLabel}
                        width={1200}
                        height={896}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </picture>
                  </div>

                  {/* Razor Steel-Blue Split Hairline + Square Hardware Handle */}
                  <div
                    className="pointer-events-none absolute inset-y-0 z-10 w-[2px] bg-[#5B9EC2]"
                    style={{ left: `${splitPct}%` }}
                    aria-hidden="true"
                  >
                    <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[#78B0CE] bg-black text-white">
                      <MoveHorizontal className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="font-mono-tech pointer-events-none absolute left-3 top-3 border border-[#303030] bg-black/90 px-2.5 py-1 text-[10px] tracking-[0.08em] text-[#D4D4D4] uppercase">
                    {IMAGE_EDIT_SHOWCASE.beforeLabel}
                  </div>
                  <div className="font-mono-tech pointer-events-none absolute right-3 top-3 bg-[#1F5B7C] px-2.5 py-1 text-[10px] font-medium tracking-[0.08em] text-white uppercase">
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
                        className={`font-mono-tech px-3 py-1.5 text-[10px] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
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
                  <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#5B9EC2] uppercase">
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
          )}
        </div>
      </div>

      {lightboxIndex !== null && (
        <ImageLightboxModal
          items={IMAGE_PRESETS}
          activeIndex={lightboxIndex}
          onSelectIndex={(nextIdx) => {
            setLightboxIndex(nextIdx);
            spinToIndex(nextIdx);
          }}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}
