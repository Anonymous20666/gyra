"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ACTIVE_LOGO_VARIANT,
  getGyraLogoSrc,
  getLogoConstellation,
  resolveActiveLogoVariant,
  type GyraLogoVariant,
} from "../../lib/brandConfig";

export interface GyraLogoMarkProps {
  /** Pixel dimension of the square emblem container */
  size?: number;
  /** Optional explicit variant override; defaults to ACTIVE_LOGO_VARIANT (or ?logo= query param) */
  variant?: GyraLogoVariant;
  /** Render the calm animated inner synaptic mesh attaching node-to-node inside the G */
  animated?: boolean;
  /** Accessible alt text; defaults to empty string when paired with adjacent "Gyra" wordmark */
  alt?: string;
  className?: string;
}

export function GyraLogoMark({
  size = 44,
  variant,
  animated = true,
  alt = "",
  className = "",
}: GyraLogoMarkProps) {
  const [resolvedVariant, setResolvedVariant] = useState<GyraLogoVariant>(
    variant ?? ACTIVE_LOGO_VARIANT,
  );

  useEffect(() => {
    if (variant) {
      setResolvedVariant(variant);
      return;
    }
    setResolvedVariant(resolveActiveLogoVariant(window.location.search));
  }, [variant]);

  const src = getGyraLogoSrc(resolvedVariant);
  const webpSrc = src.replace(/\.jpg$/i, ".webp");
  const constellation = getLogoConstellation(resolvedVariant);
  const nodeLookup = useMemo(
    () => new Map(constellation.nodes.map((node) => [node.id, node])),
    [constellation],
  );

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden select-none bg-[#05080D] dark:bg-transparent border border-[#CBD6E2] dark:border-transparent p-[2px] dark:p-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <picture className="block h-full w-full">
        <source srcSet={webpSrc} type="image/webp" />
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          decoding="async"
          draggable={false}
          className="h-full w-full object-contain mix-blend-lighten contrast-[1.14] brightness-[1.16]"
        />
      </picture>

      {animated && (
        <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {/* Quiet structural threads + calm attaching filaments linking node-to-node inside the G */}
          {constellation.links.map((link) => {
            const a = nodeLookup.get(link.from);
            const b = nodeLookup.get(link.to);
            if (!a || !b) return null;
            return (
              <g key={link.id}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#6BAAD0"
                  strokeOpacity="0.34"
                  strokeWidth="0.9"
                />
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#B8DFF2"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                  pathLength={100}
                  className="gyra-logo-synapse"
                  style={{
                    animationDuration: `${link.durationSec}s`,
                    animationDelay: `${link.delaySec}s`,
                  }}
                />
              </g>
            );
          })}

          {/* Subtle breathing neural nodes inside the G cavity */}
          {constellation.nodes.map((node) => (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={node.r * 1.15}
              fill="#D4ECF9"
              className="gyra-logo-node"
              style={{
                animationDelay: `${node.delaySec}s`,
              }}
            />
          ))}
        </svg>
      )}
    </span>
  );
}
