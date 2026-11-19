"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ImagePreset } from "../../lib/landingSimulations";

export interface ImageLightboxModalProps {
  items: readonly ImagePreset[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  onClose: () => void;
}

export function ImageLightboxModal({
  items,
  activeIndex,
  onSelectIndex,
  onClose,
}: ImageLightboxModalProps) {
  const [zoomed, setZoomed] = useState(false);
  const [copied, setCopied] = useState(false);

  const count = items.length;
  const safeIndex = ((activeIndex % count) + count) % count;
  const specimen = items[safeIndex] ?? items[0];

  const step = (delta: -1 | 1) => {
    setZoomed(false);
    setCopied(false);
    onSelectIndex((safeIndex + delta + count) % count);
  };

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setZoomed(false);
        setCopied(false);
        onSelectIndex((safeIndex - 1 + count) % count);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setZoomed(false);
        setCopied(false);
        onSelectIndex((safeIndex + 1) % count);
      } else if (e.key === "z" || e.key === "Z") {
        setZoomed((z) => !z);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [safeIndex, count, onClose, onSelectIndex]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(specimen.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable in restricted contexts
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Full resolution view: ${specimen.title}`}
      data-testid="image-lightbox-modal"
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95 p-3 sm:p-6 gyra-lightbox-enter"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-[1280px] flex-col overflow-hidden border border-[#24394B] bg-[#03060A]"
      >
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#182735] bg-[#04090F] px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-mono-tech text-[11px] tracking-[0.12em] text-[#5B9EC2] uppercase whitespace-nowrap">
              {String(safeIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            <span aria-hidden="true" className="text-[#2D4354]">
              ·
            </span>
            <span className="font-mono-tech text-[11px] tracking-[0.08em] text-[#8DA5B8] uppercase whitespace-nowrap">
              {specimen.category}
            </span>
            <span aria-hidden="true" className="hidden text-[#2D4354] sm:inline">
              ·
            </span>
            <h3 className="font-display truncate text-[17px] font-bold tracking-[0.02em] text-white uppercase sm:text-[19px]">
              {specimen.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              aria-pressed={zoomed}
              aria-label={zoomed ? "Reset image zoom to 1x" : "Zoom image to 2x"}
              className={`font-mono-tech inline-flex min-h-[36px] items-center gap-1.5 border px-3 text-[11px] tracking-[0.08em] uppercase transition-colors cursor-pointer whitespace-nowrap ${
                zoomed
                  ? "border-[#5B9EC2] bg-[#1F5B7C] text-white"
                  : "border-[#233748] bg-black text-[#B8D2E6] hover:border-[#5B9EC2] hover:text-white"
              }`}
            >
              {zoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
              {zoomed ? "1x Fit" : "2x Zoom"}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close full resolution image viewer"
              className="inline-flex h-[36px] w-[36px] items-center justify-center border border-[#233748] bg-black text-[#D4E3EE] transition-colors hover:border-white hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Viewer Area */}
        <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-[#182735] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Image Canvas */}
          <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-black p-3 sm:min-h-[480px] sm:p-5 lg:col-span-8">
            <div
              onClick={() => setZoomed((z) => !z)}
              className={`relative flex max-h-[64vh] w-full items-center justify-center overflow-hidden ${
                zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
            >
              <img
                key={specimen.id}
                src={specimen.imageSrc}
                alt={`${specimen.category}: ${specimen.title}`}
                referrerPolicy="no-referrer"
                className={`max-h-[62vh] w-auto max-w-full border border-[#1E3142] object-contain transition-transform duration-300 ease-out ${
                  zoomed ? "scale-[1.75]" : "scale-100"
                }`}
              />
            </div>

            {/* Side Prev / Next Controls */}
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image in viewer"
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-[#2A4256] bg-black/85 text-white transition-colors hover:border-[#78B0CE] hover:bg-[#0D273B] cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image in viewer"
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-[#2A4256] bg-black/85 text-white transition-colors hover:border-[#78B0CE] hover:bg-[#0D273B] cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Right Inspector Details + Filmstrip */}
          <div className="flex flex-col justify-between overflow-y-auto bg-[#03060A] p-4 sm:p-5 lg:col-span-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono-tech text-[10px] tracking-[0.12em] text-[#5B9EC2] uppercase">
                  Prompt Blueprint
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="font-mono-tech inline-flex items-center gap-1.5 text-[10.5px] tracking-[0.08em] text-[#9BC1DA] uppercase transition-colors hover:text-white cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-[#34D399]" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy Prompt
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2.5 border border-[#192836] bg-black p-3.5 text-[13px] leading-[1.65] text-[#DCE9F4]">
                {specimen.prompt}
              </p>

              <dl className="mt-4 divide-y divide-[#15222E] border-y border-[#15222E] text-[12.5px]">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[#7E94A8]">Engine</dt>
                  <dd className="font-mono-tech text-white">{specimen.modelLabel}</dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[#7E94A8]">Resolution</dt>
                  <dd className="font-mono-tech text-[#DCE9F4]">{specimen.resolution}</dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[#7E94A8]">Aspect Ratio</dt>
                  <dd className="font-mono-tech text-[#DCE9F4]">{specimen.aspect}</dd>
                </div>
              </dl>

              {/* All-Frames Filmstrip */}
              <div className="mt-5">
                <p className="font-mono-tech text-[10px] tracking-[0.12em] text-[#7A90A3] uppercase">
                  Studio Gallery · {count} Renders
                </p>
                <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                  {items.map((item, idx) => {
                    const active = idx === safeIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setZoomed(false);
                          setCopied(false);
                          onSelectIndex(idx);
                        }}
                        aria-label={`View ${item.title}`}
                        aria-pressed={active}
                        className={`aspect-[4/3] overflow-hidden border transition-all cursor-pointer ${
                          active
                            ? "border-[#78B0CE] opacity-100"
                            : "border-[#1A2A37] opacity-55 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={item.imageSrc}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <p className="mt-5 font-mono-tech text-[10px] tracking-[0.08em] text-[#5D7488] uppercase">
              Click image or press Z to zoom · ← / → to browse · Esc to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
