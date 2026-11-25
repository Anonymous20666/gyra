"use client";

import { useState } from "react";
import { Cpu, Film, Globe, Wrench } from "lucide-react";
import type { ApiCategoryId } from "../../lib/gyraCatalog";

const LOGO_SOURCES = [
  "/gyra-logo-standard.webp",
  "/gyra-mark.png",
  "/icon.png",
] as const;

export function GyraMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const [srcIndex, setSrcIndex] = useState(0);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden select-none rounded-md bg-black ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={LOGO_SOURCES[srcIndex]}
        alt="Gyra"
        width={size}
        height={size}
        decoding="async"
        draggable={false}
        onError={() => {
          setSrcIndex((prev) =>
            prev < LOGO_SOURCES.length - 1 ? prev + 1 : prev
          );
        }}
        className="h-full w-full object-contain mix-blend-lighten contrast-[1.12] brightness-[1.14] pointer-events-none"
      />
    </span>
  );
}

export function CategoryIcon({
  category,
  className = "w-4 h-4",
}: {
  category: ApiCategoryId;
  className?: string;
}) {
  switch (category) {
    case "ai":
      return <Cpu className={className} strokeWidth={1.75} />;
    case "media":
      return <Film className={className} strokeWidth={1.75} />;
    case "network":
      return <Globe className={className} strokeWidth={1.75} />;
    case "utilities":
      return <Wrench className={className} strokeWidth={1.75} />;
  }
}
