"use client";

import { useEffect, useRef, useState } from "react";
import { Globe, Server, Zap } from "lucide-react";
import {
  GYRA_GLOBAL_HUBS,
  GYRA_TELEMETRY_ARCS,
  WORLD_COUNTRY_POLYS,
  WORLD_DOT_MATRIX,
  WORLD_MAP_HEIGHT,
  WORLD_MAP_WIDTH,
  type GyraGlobalHub,
  type HubStatus,
} from "../../lib/worldMapData";
import { GyraLogoMark } from "./GyraLogoMark";

export type MapPlacementMode = "page-bg" | "header-bg" | "inline-module" | "orbital-hero";
export type MapColorTheme = "steel" | "violet";

export interface GlobalIntelligenceMapProps {
  mode: MapPlacementMode;
  theme?: MapColorTheme;
  /** Subtlety level for orbital-hero mode: whisper (photographic minimal) vs balanced */
  subtlety?: "whisper" | "balanced";
  className?: string;
}

interface Palette {
  landFill: string;
  landStroke: string;
  countryBorder: string;
  dotBase: string;
  dotHot: string;
  graticule: string;
  arcBase: string;
  arcActive: string;
  packetCore: string;
  packetGlow: string;
  hubPrimary: string;
  hubSecondary: string;
  hubProcessing: string;
  hubStandby: string;
  spotlight: string;
  frameBorder: string;
  frameGlow: string;
  accentHex: string;
  accentSoft: string;
  accentText: string;
}

const PALETTES: Record<MapColorTheme, Palette> = {
  steel: {
    landFill: "rgba(18, 49, 71, 0.42)",
    landStroke: "rgba(91, 158, 194, 0.52)",
    countryBorder: "rgba(75, 138, 174, 0.24)",
    dotBase: "rgba(116, 178, 214, 0.36)",
    dotHot: "rgba(180, 224, 248, 0.82)",
    graticule: "rgba(42, 84, 114, 0.14)",
    arcBase: "rgba(65, 130, 168, 0.20)",
    arcActive: "rgba(128, 198, 236, 0.85)",
    packetCore: "#FFFFFF",
    packetGlow: "rgba(91, 158, 194, 0.95)",
    hubPrimary: "#9CC4DC",
    hubSecondary: "#5B9EC2",
    hubProcessing: "#38BDF8",
    hubStandby: "#4B6375",
    spotlight: "rgba(91, 158, 194, 0.16)",
    frameBorder: "rgba(91, 158, 194, 0.34)",
    frameGlow: "rgba(31, 91, 124, 0.28)",
    accentHex: "#5B9EC2",
    accentSoft: "#1F5B7C",
    accentText: "#9CC4DC",
  },
  violet: {
    landFill: "rgba(42, 16, 86, 0.46)",
    landStroke: "rgba(154, 102, 255, 0.58)",
    countryBorder: "rgba(130, 82, 224, 0.26)",
    dotBase: "rgba(162, 118, 255, 0.40)",
    dotHot: "rgba(222, 196, 255, 0.88)",
    graticule: "rgba(104, 62, 186, 0.16)",
    arcBase: "rgba(138, 86, 242, 0.22)",
    arcActive: "rgba(196, 158, 255, 0.90)",
    packetCore: "#FFFFFF",
    packetGlow: "rgba(168, 85, 247, 0.98)",
    hubPrimary: "#D8B4FE",
    hubSecondary: "#A855F7",
    hubProcessing: "#818CF8",
    hubStandby: "#5B4A78",
    spotlight: "rgba(168, 85, 247, 0.18)",
    frameBorder: "rgba(168, 85, 247, 0.42)",
    frameGlow: "rgba(126, 34, 206, 0.32)",
    accentHex: "#A855F7",
    accentSoft: "#6D28D9",
    accentText: "#D8B4FE",
  },
};

interface ActivePacket {
  arcIndex: number;
  t: number;
  speed: number;
  direction: 1 | -1;
}

interface ArrivalRipple {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

const HUB_BY_ID = new Map(GYRA_GLOBAL_HUBS.map((h) => [h.id, h]));

const RESOLVED_ARCS = GYRA_TELEMETRY_ARCS.map(([fromId, toId], idx) => {
  const a = HUB_BY_ID.get(fromId)!;
  const b = HUB_BY_ID.get(toId)!;
  const mx = (a.x + b.x) * 0.5;
  const my = (a.y + b.y) * 0.5;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  // Great-circle style upward lift proportional to intercontinental distance
  const lift = Math.min(115, Math.max(18, dist * 0.22));
  const cx = mx;
  const cy = Math.max(16, my - lift);
  return { id: idx, from: a, to: b, cx, cy, dist };
});

function evalQuad(
  ax: number,
  ay: number,
  cx: number,
  cy: number,
  bx: number,
  by: number,
  t: number,
): [number, number] {
  const u = 1 - t;
  return [
    u * u * ax + 2 * u * t * cx + t * t * bx,
    u * u * ay + 2 * u * t * cy + t * t * by,
  ];
}

export function GlobalIntelligenceMap({
  mode,
  theme = "steel",
  subtlety = "whisper",
  className = "",
}: GlobalIntelligenceMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredHub, setHoveredHub] = useState<GyraGlobalHub | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [statusFilter, setStatusFilter] = useState<HubStatus | "all">("all");
  const [scrollDepth, setScrollDepth] = useState(0);

  const statusFilterRef = useRef<HubStatus | "all">("all");
  useEffect(() => {
    statusFilterRef.current = statusFilter;
  }, [statusFilter]);

  const themeRef = useRef<MapColorTheme>(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const bgCanvas = document.createElement("canvas");
    const bgCtx = bgCanvas.getContext("2d");
    if (!bgCtx) return;

    let width = 1000;
    let height = 500;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rafId = 0;
    let lastTs = performance.now();
    let elapsed = 0;
    let isVisible = true;
    let isSkipped = false;
    let scrollProgress = 0;
    let smoothScroll = 0;

    // Pointer in canvas CSS coordinates
    const pointer = { x: -9999, y: -9999, active: false };
    let currentHoverId: string | null = null;

    // Viewport transform (map 1000x500 cleanly into container)
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    const computeTransform = (scrollP: number) => {
      const coverScale = Math.max(width / WORLD_MAP_WIDTH, height / WORLD_MAP_HEIGHT);
      const containScale = Math.min(width / WORLD_MAP_WIDTH, height / WORLD_MAP_HEIGHT);
      if (mode === "page-bg") {
        // Gentle zoom & vertical drift on scroll for Sample 1
        const zoom = reducedMotion ? 1.02 : 1.02 + scrollP * 0.14;
        scale = coverScale * 0.96 * zoom;
        offsetX = (width - WORLD_MAP_WIDTH * scale) * 0.5 + (reducedMotion ? 0 : (scrollP - 0.5) * -36);
        offsetY = (height - WORLD_MAP_HEIGHT * scale) * 0.46 + (reducedMotion ? 0 : -scrollP * 58);
      } else if (mode === "header-bg" || mode === "orbital-hero") {
        scale = Math.max(containScale * 1.06, coverScale * 0.90);
        offsetX = (width - WORLD_MAP_WIDTH * scale) * 0.5;
        offsetY = (height - WORLD_MAP_HEIGHT * scale) * (mode === "orbital-hero" ? 0.52 : 0.48);
      } else {
        // inline-module: full clean map framed nicely with HUD breathing room
        scale = containScale * 0.94;
        offsetX = (width - WORLD_MAP_WIDTH * scale) * 0.5;
        offsetY = (height - WORLD_MAP_HEIGHT * scale) * 0.46;
      }
    };

    // Pre-bake high-detail Natural Earth geography + country filigree + land density dots
    const bakeStaticMap = () => {
      const pal = PALETTES[themeRef.current];
      const isOrbital = mode === "orbital-hero";
      const bakeW = Math.round(WORLD_MAP_WIDTH * 1.8);
      const bakeH = Math.round(WORLD_MAP_HEIGHT * 1.8);
      bgCanvas.width = bakeW;
      bgCanvas.height = bakeH;
      bgCtx.setTransform(bakeW / WORLD_MAP_WIDTH, 0, 0, bakeH / WORLD_MAP_HEIGHT, 0, 0);
      bgCtx.clearRect(0, 0, WORLD_MAP_WIDTH, WORLD_MAP_HEIGHT);

      // 1. Subtle latitude/longitude graticule (curved orbital arcs in orbital-hero mode)
      if (isOrbital) {
        bgCtx.strokeStyle = "rgba(91, 158, 194, 0.06)";
        bgCtx.lineWidth = 0.55;
        for (let i = -3; i <= 3; i++) {
          const cx = WORLD_MAP_WIDTH * 0.5 + i * 135;
          bgCtx.beginPath();
          bgCtx.moveTo(cx, 12);
          bgCtx.quadraticCurveTo(
            WORLD_MAP_WIDTH * 0.5 + i * 175,
            WORLD_MAP_HEIGHT * 0.5,
            cx,
            WORLD_MAP_HEIGHT - 12,
          );
          bgCtx.stroke();
        }
        for (let gy = 90; gy < WORLD_MAP_HEIGHT; gy += 100) {
          bgCtx.beginPath();
          bgCtx.moveTo(16, gy);
          bgCtx.quadraticCurveTo(
            WORLD_MAP_WIDTH * 0.5,
            gy + (gy < 250 ? -16 : 16),
            WORLD_MAP_WIDTH - 16,
            gy,
          );
          bgCtx.stroke();
        }
      } else {
        bgCtx.strokeStyle = pal.graticule;
        bgCtx.lineWidth = 0.65;
        for (let gx = 100; gx < WORLD_MAP_WIDTH; gx += 100) {
          bgCtx.beginPath();
          bgCtx.moveTo(gx, 16);
          bgCtx.lineTo(gx, WORLD_MAP_HEIGHT - 16);
          bgCtx.stroke();
        }
        for (let gy = 80; gy < WORLD_MAP_HEIGHT; gy += 80) {
          bgCtx.beginPath();
          bgCtx.moveTo(16, gy);
          bgCtx.lineTo(WORLD_MAP_WIDTH - 16, gy);
          bgCtx.stroke();
        }
      }

      // 2. Real Natural Earth 110m country polygons (photographic obsidian in orbital-hero)
      bgCtx.fillStyle = isOrbital ? "rgba(10, 22, 35, 0.38)" : pal.landFill;
      bgCtx.strokeStyle = isOrbital ? "rgba(91, 158, 194, 0.14)" : pal.countryBorder;
      bgCtx.lineWidth = isOrbital ? 0.45 : 0.65;
      bgCtx.lineJoin = "round";

      for (const ring of WORLD_COUNTRY_POLYS) {
        if (ring.length < 6) continue;
        bgCtx.beginPath();
        bgCtx.moveTo(ring[0], ring[1]);
        for (let i = 2; i < ring.length; i += 2) {
          bgCtx.lineTo(ring[i], ring[i + 1]);
        }
        bgCtx.closePath();
        bgCtx.fill();
        bgCtx.stroke();
      }

      // 3. Outer coastal filigree pass (whisper-subtle without neon halo in orbital-hero)
      bgCtx.save();
      bgCtx.strokeStyle = isOrbital ? "rgba(128, 182, 214, 0.20)" : pal.landStroke;
      bgCtx.lineWidth = isOrbital ? 0.55 : 0.9;
      if (!isOrbital) {
        bgCtx.shadowColor = pal.accentHex;
        bgCtx.shadowBlur = 6;
      }
      for (const ring of WORLD_COUNTRY_POLYS) {
        if (ring.length < 6) continue;
        bgCtx.beginPath();
        bgCtx.moveTo(ring[0], ring[1]);
        for (let i = 2; i < ring.length; i += 2) {
          bgCtx.lineTo(ring[i], ring[i + 1]);
        }
        bgCtx.closePath();
        bgCtx.stroke();
      }
      bgCtx.restore();

      // 4. Organic Night-Earth satellite city lights (orbital-hero) OR structured matrix dots
      if (isOrbital) {
        const hash = (n: number) => {
          const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
          return v - Math.floor(v);
        };
        // Organic coastal & urban night-light scatter constrained strictly inside real landmasses
        for (let i = 0; i < WORLD_DOT_MATRIX.length; i += 2) {
          const dx = WORLD_DOT_MATRIX[i];
          const dy = WORLD_DOT_MATRIX[i + 1];
          let proximity = 0;
          for (const h of GYRA_GLOBAL_HUBS) {
            const d2 = (dx - h.x) * (dx - h.x) + (dy - h.y) * (dy - h.y);
            if (d2 < 2600) {
              proximity = Math.max(proximity, 1 - d2 / 2600);
            }
          }
          // Skip sparse interior desert/tundra dots to look like real NASA Black-Marble imagery
          const keepProb = 0.16 + proximity * 0.84;
          if (hash(i * 1.37) > keepProb) continue;

          // Organic jitter so lights never look like a mechanical grid
          const jx = dx + (hash(i + 17) - 0.5) * 6.2;
          const jy = dy + (hash(i + 53) - 0.5) * 6.2;
          const warm = hash(i + 91) > 0.72 && proximity > 0.45;
          const alpha = 0.09 + proximity * 0.48;
          bgCtx.fillStyle = warm
            ? `rgba(226, 212, 186, ${alpha.toFixed(2)})`
            : `rgba(148, 198, 228, ${alpha.toFixed(2)})`;
          const r = 0.45 + proximity * 0.65;
          bgCtx.beginPath();
          bgCtx.arc(jx, jy, r, 0, Math.PI * 2);
          bgCtx.fill();
        }

        // Ultra-fine satellite urban cluster specks around the 22 real global cities
        for (let hIdx = 0; hIdx < GYRA_GLOBAL_HUBS.length; hIdx++) {
          const h = GYRA_GLOBAL_HUBS[hIdx];
          const count = h.tier === "primary" ? 18 : 9;
          for (let c = 0; c < count; c++) {
            const ang = hash(hIdx * 100 + c * 7) * Math.PI * 2;
            const dist = Math.pow(hash(hIdx * 100 + c * 13), 1.6) * (h.tier === "primary" ? 18 : 11);
            const sx = h.x + Math.cos(ang) * dist;
            const sy = h.y + Math.sin(ang) * dist * 0.75;
            bgCtx.fillStyle = c % 4 === 0 ? "rgba(255, 240, 214, 0.52)" : "rgba(180, 224, 248, 0.44)";
            bgCtx.beginPath();
            bgCtx.arc(sx, sy, 0.5 + hash(c * 19) * 0.55, 0, Math.PI * 2);
            bgCtx.fill();
          }
        }
      } else {
        for (let i = 0; i < WORLD_DOT_MATRIX.length; i += 2) {
          const dx = WORLD_DOT_MATRIX[i];
          const dy = WORLD_DOT_MATRIX[i + 1];
          let nearBoost = 0;
          for (const h of GYRA_GLOBAL_HUBS) {
            const d2 = (dx - h.x) * (dx - h.x) + (dy - h.y) * (dy - h.y);
            if (d2 < 1800) {
              nearBoost = Math.max(nearBoost, 1 - d2 / 1800);
            }
          }
          bgCtx.fillStyle = nearBoost > 0.35 ? pal.dotHot : pal.dotBase;
          const r = nearBoost > 0.35 ? 1.15 + nearBoost * 0.55 : 0.85;
          bgCtx.beginPath();
          bgCtx.arc(dx, dy, r, 0, Math.PI * 2);
          bgCtx.fill();
        }
      }

      // 5. Base fiber backbone arcs (whisper-thin in orbital-hero)
      bgCtx.strokeStyle = isOrbital ? "rgba(91, 158, 194, 0.08)" : pal.arcBase;
      bgCtx.lineWidth = isOrbital ? 0.55 : 0.75;
      const arcStep = isOrbital ? 3 : 1;
      for (let i = 0; i < RESOLVED_ARCS.length; i += arcStep) {
        const arc = RESOLVED_ARCS[i];
        bgCtx.beginPath();
        bgCtx.moveTo(arc.from.x, arc.from.y);
        bgCtx.quadraticCurveTo(arc.cx, arc.cy, arc.to.x, arc.to.y);
        bgCtx.stroke();
      }
    };

    // Initialize live traveling telemetry packets across the 35 intercontinental routes
    const packets: ActivePacket[] = RESOLVED_ARCS.map((_, idx) => ({
      arcIndex: idx,
      t: (idx * 0.173) % 1,
      speed: 0.16 + (idx % 5) * 0.045,
      direction: idx % 2 === 0 ? 1 : -1,
    }));

    const ripples: ArrivalRipple[] = [];

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      width = Math.max(320, Math.round(rect.width));
      height = Math.max(220, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      computeTransform(smoothScroll);
    };

    const drawFrame = (dt: number) => {
      const pal = PALETTES[themeRef.current];
      const filter = statusFilterRef.current;

      // Smoothly interpolate scroll progress for page-bg parallax
      smoothScroll += (scrollProgress - smoothScroll) * Math.min(1, dt * 6);
      computeTransform(smoothScroll);

      // Subtle pointer parallax shift in world space
      const ptrShiftX =
        pointer.active && !reducedMotion ? ((pointer.x / width) - 0.5) * -10 : 0;
      const ptrShiftY =
        pointer.active && !reducedMotion ? ((pointer.y / height) - 0.5) * -7 : 0;

      const ox = offsetX + ptrShiftX;
      const oy = offsetY + ptrShiftY;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Ambient deep-space radial atmospheric bloom behind continents
      const ambGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.48,
        width * 0.04,
        width * 0.5,
        height * 0.5,
        width * 0.62,
      );
      ambGrad.addColorStop(0, pal.frameGlow);
      ambGrad.addColorStop(0.55, "rgba(4, 10, 18, 0.16)");
      ambGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = ambGrad;
      ctx.fillRect(0, 0, width, height);

      // Blit pre-baked Natural Earth high-detail map
      ctx.drawImage(
        bgCanvas,
        0,
        0,
        bgCanvas.width,
        bgCanvas.height,
        ox,
        oy,
        WORLD_MAP_WIDTH * scale,
        WORLD_MAP_HEIGHT * scale,
      );

      // Interactive pointer spotlight glow over geography
      if (pointer.active) {
        const spot = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          mode === "page-bg" ? 240 : 170,
        );
        spot.addColorStop(0, pal.spotlight);
        spot.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, width, height);
      }

      // Hit-test closest hub to pointer
      let nearestHub: GyraGlobalHub | null = null;
      let nearestDist = mode === "page-bg" ? 42 : 28;
      if (pointer.active) {
        for (const h of GYRA_GLOBAL_HUBS) {
          const sx = ox + h.x * scale;
          const sy = oy + h.y * scale;
          const d = Math.hypot(pointer.x - sx, pointer.y - sy);
          if (d < nearestDist) {
            nearestDist = d;
            nearestHub = h;
          }
        }
      }

      const nextHoverId = nearestHub ? nearestHub.id : null;
      if (nextHoverId !== currentHoverId) {
        currentHoverId = nextHoverId;
        setHoveredHub(nearestHub);
      }
      if (nearestHub) {
        setHoverPos({
          x: ox + nearestHub.x * scale,
          y: oy + nearestHub.y * scale,
        });
      }

      // Draw highlighted arcs for hovered hub OR active live packets
      for (const arc of RESOLVED_ARCS) {
        const isConnectedToHover =
          currentHoverId !== null &&
          (arc.from.id === currentHoverId || arc.to.id === currentHoverId);

        if (isConnectedToHover) {
          ctx.save();
          ctx.strokeStyle = pal.arcActive;
          ctx.lineWidth = 1.6;
          ctx.shadowColor = pal.accentHex;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(ox + arc.from.x * scale, oy + arc.from.y * scale);
          ctx.quadraticCurveTo(
            ox + arc.cx * scale,
            oy + arc.cy * scale,
            ox + arc.to.x * scale,
            oy + arc.to.y * scale,
          );
          ctx.stroke();
          ctx.restore();
        }
      }

      // Advance & render glowing telemetry packets along curved great-circle arcs
      const isOrbital = mode === "orbital-hero";
      const speedMultiplier = mode === "page-bg" ? 1 + smoothScroll * 0.55 : isOrbital ? 0.58 : 1;
      for (let pIdx = 0; pIdx < packets.length; pIdx++) {
        // In orbital-hero mode, keep only 9 calm slow intercontinental filaments so hero text breathes
        if (isOrbital && pIdx % 4 !== 0) continue;
        const p = packets[pIdx];
        const arc = RESOLVED_ARCS[p.arcIndex];
        if (!reducedMotion) {
          p.t += p.speed * speedMultiplier * dt * p.direction;
          if (p.t >= 1) {
            p.t = 0;
            if (!isOrbital) ripples.push({ x: arc.to.x, y: arc.to.y, age: 0, maxAge: 1.1 });
          } else if (p.t <= 0) {
            p.t = 1;
            if (!isOrbital) ripples.push({ x: arc.from.x, y: arc.from.y, age: 0, maxAge: 1.1 });
          }
        }

        const isHoveredArc =
          currentHoverId !== null &&
          (arc.from.id === currentHoverId || arc.to.id === currentHoverId);

        // Luminous trailing tail
        const steps = isOrbital ? 5 : 7;
        const tailLen = isOrbital ? 0.11 : 0.14;
        for (let s = 0; s < steps; s++) {
          const frac = s / steps;
          const ptT = Math.max(0, Math.min(1, p.t - p.direction * frac * tailLen));
          const [wx, wy] = evalQuad(
            arc.from.x,
            arc.from.y,
            arc.cx,
            arc.cy,
            arc.to.x,
            arc.to.y,
            ptT,
          );
          const sx = ox + wx * scale;
          const sy = oy + wy * scale;
          ctx.fillStyle = pal.packetGlow;
          ctx.globalAlpha = (1 - frac) * (isOrbital ? 0.36 : isHoveredArc ? 0.9 : 0.55);
          ctx.beginPath();
          ctx.arc(sx, sy, (1 - frac) * (isOrbital ? 1.35 : isHoveredArc ? 2.6 : 1.9), 0, Math.PI * 2);
          ctx.fill();
        }

        // Crisp packet head
        const [hx, hy] = evalQuad(
          arc.from.x,
          arc.from.y,
          arc.cx,
          arc.cy,
          arc.to.x,
          arc.to.y,
          p.t,
        );
        ctx.globalAlpha = isOrbital ? 0.58 : isHoveredArc ? 1 : 0.9;
        ctx.fillStyle = pal.packetCore;
        ctx.beginPath();
        ctx.arc(ox + hx * scale, oy + hy * scale, isOrbital ? 1.3 : isHoveredArc ? 2.6 : 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Render arrival shockwave ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.age += dt;
        if (rp.age >= rp.maxAge) {
          ripples.splice(i, 1);
          continue;
        }
        const prog = rp.age / rp.maxAge;
        const sx = ox + rp.x * scale;
        const sy = oy + rp.y * scale;
        ctx.strokeStyle = pal.accentHex;
        ctx.globalAlpha = (1 - prog) * 0.45;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(sx, sy, 3 + prog * 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Render all 22 Global Intelligence Hubs with radiant layered blooms
      for (let i = 0; i < GYRA_GLOBAL_HUBS.length; i++) {
        const h = GYRA_GLOBAL_HUBS[i];
        const sx = ox + h.x * scale;
        const sy = oy + h.y * scale;
        const dimmed = filter !== "all" && h.status !== filter;
        const isHovered = h.id === currentHoverId;
        const pulse = reducedMotion ? 0.5 : 0.5 + 0.5 * Math.sin(elapsed * 2.2 + i * 0.9);

        const baseColor =
          h.status === "processing"
            ? pal.hubProcessing
            : h.status === "standby"
              ? pal.hubStandby
              : h.tier === "primary"
                ? pal.hubPrimary
                : pal.hubSecondary;

        const bloomRadius =
          (isOrbital ? (h.tier === "primary" ? 11 : 6) : h.tier === "primary" ? 18 : 10) *
          (isHovered ? 1.55 : 0.92 + pulse * 0.22);

        // Outer soft radiance
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, bloomRadius);
        glow.addColorStop(0, baseColor);
        glow.addColorStop(0.35, pal.packetGlow);
        glow.addColorStop(1, "rgba(0,0,0,0)");

        ctx.globalAlpha = dimmed
          ? 0.12
          : isHovered
            ? 0.92
            : isOrbital
              ? h.tier === "primary"
                ? 0.34
                : 0.2
              : h.tier === "primary"
                ? 0.65
                : 0.42;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, bloomRadius, 0, Math.PI * 2);
        ctx.fill();

        // Crisp center star core
        ctx.globalAlpha = dimmed ? 0.22 : isOrbital && !isHovered ? 0.65 : 1;
        ctx.fillStyle = isHovered ? "#FFFFFF" : h.tier === "primary" ? "#FFFFFF" : baseColor;
        ctx.beginPath();
        ctx.arc(
          sx,
          sy,
          isHovered ? 3.8 : isOrbital ? (h.tier === "primary" ? 1.8 : 1.2) : h.tier === "primary" ? 3.1 : 2.0,
          0,
          Math.PI * 2,
        );
        ctx.fill();

        // Subtle ring on primary hubs & hovered hub
        if ((h.tier === "primary" || isHovered) && !dimmed) {
          ctx.strokeStyle = isHovered ? "#FFFFFF" : baseColor;
          ctx.globalAlpha = isHovered ? 0.95 : 0.42;
          ctx.lineWidth = isHovered ? 1.4 : 0.9;
          ctx.beginPath();
          ctx.arc(sx, sy, isHovered ? 9.5 : 6.2 + pulse * 2.2, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    };

    const tick = (now: number) => {
      rafId = 0;
      if (document.hidden || !isVisible || isSkipped) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      elapsed += dt;
      drawFrame(dt);
      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const startLoop = () => {
      if (rafId || document.hidden || !isVisible || isSkipped) return;
      lastTs = performance.now();
      if (reducedMotion) {
        drawFrame(0.016);
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const stopLoop = () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    bakeStaticMap();
    resize();
    startLoop();

    // Pointer tracking: passive window listener for page-bg so foreground buttons stay 100% clickable
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        pointer.x = x;
        pointer.y = y;
        pointer.active = true;
        if (reducedMotion) drawFrame(0.016);
      } else if (pointer.active) {
        pointer.active = false;
        currentHoverId = null;
        setHoveredHub(null);
        if (reducedMotion) drawFrame(0.016);
      }
    };

    const onPointerLeave = () => {
      pointer.active = false;
      currentHoverId = null;
      setHoveredHub(null);
      if (reducedMotion) drawFrame(0.016);
    };

    const onScroll = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      scrollProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      if (mode === "page-bg") {
        setScrollDepth(Math.round(scrollProgress * 100));
      }
      if (reducedMotion) drawFrame(0.016);
    };

    if (mode === "page-bg") {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    } else {
      canvas.addEventListener("pointermove", onPointerMove, { passive: true });
      canvas.addEventListener("pointerleave", onPointerLeave);
    }

    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Modern Web Guidance: contentvisibilityautostatechange + IntersectionObserver fallback
    const onContentVisibility = (event: Event) => {
      const cvEvent = event as Event & { skipped?: boolean };
      isSkipped = Boolean(cvEvent.skipped);
      if (isSkipped) stopLoop();
      else startLoop();
    };
    wrapper.addEventListener("contentvisibilityautostatechange", onContentVisibility);

    const io = new IntersectionObserver(
      (entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) startLoop();
        else stopLoop();
      },
      { rootMargin: "160px" },
    );
    if (mode !== "page-bg") {
      io.observe(wrapper);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reducedMotion) drawFrame(0.016);
    });
    ro.observe(wrapper);

    return () => {
      stopLoop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      wrapper.removeEventListener("contentvisibilityautostatechange", onContentVisibility);
      if (mode === "page-bg") {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("scroll", onScroll);
      } else {
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerLeave);
      }
    };
  }, [mode, theme]);

  const pal = PALETTES[theme];

  // Mode 1: Fixed full-viewport live main background with scroll-driven drift + passive hover telemetry
  if (mode === "page-bg") {
    return (
      <div
        ref={wrapperRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black ${className}`}
      >
        <canvas ref={canvasRef} className="block h-full w-full opacity-[0.72]" />

        {/* Subtle edge vignette keeping foreground text crisp across all sections */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 72% 64% at 50% 42%, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.74) 72%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        {/* Floating passive hub telemetry pill when hovering over any global node */}
        {hoveredHub && (
          <div
            style={{
              left: Math.min(Math.max(hoverPos.x + 14, 16), (typeof window !== "undefined" ? window.innerWidth : 1200) - 240),
              top: Math.max(hoverPos.y - 62, 76),
              borderColor: pal.frameBorder,
            }}
            className="fixed z-30 border bg-black/90 px-3 py-2 backdrop-blur-md"
          >
            <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor:
                    hoveredHub.status === "online"
                      ? "#34D399"
                      : hoveredHub.status === "processing"
                        ? pal.accentHex
                        : "#64748B",
                }}
              />
              <span className="text-white font-medium">{hoveredHub.city}</span>
              <span style={{ color: pal.accentText }}>{hoveredHub.code}</span>
            </div>
            <p className="mt-0.5 font-mono-tech text-[10px] text-[#94A3B8]">
              {hoveredHub.latencyMs}ms · {hoveredHub.rps} · {hoveredHub.activeModel}
            </p>
          </div>
        )}

        {/* Quiet corner scroll-depth & network badge */}
        <div
          style={{ borderColor: pal.frameBorder }}
          className="fixed bottom-4 right-4 z-20 hidden items-center gap-3 border bg-black/80 px-3 py-1.5 font-mono-tech text-[10px] tracking-[0.1em] text-[#A3B8C8] uppercase backdrop-blur-md sm:flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
          <span>Global Mesh · 22 Hubs</span>
          <span style={{ color: pal.accentText }}>Scroll {scrollDepth}%</span>
        </div>
      </div>
    );
  }

  // Mode 2b: Photographic Subtle Orbital Night-Earth Hero Background (whisper-quiet center, luxury realism)
  if (mode === "orbital-hero") {
    const canvasOpacity = subtlety === "whisper" ? "opacity-[0.26] dark:opacity-[0.50]" : "opacity-[0.42] dark:opacity-[0.72]";
    return (
      <div
        ref={wrapperRef}
        className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
      >
        <div className="gyra-mask-orbital h-full w-full">
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={`block h-full w-full transition-opacity duration-500 ${canvasOpacity}`}
          />
        </div>
        {/* Center-quiet velvet scrim (in oklab) so Hero headline & description have effortless AAA contrast */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: "var(--gl-orbital-scrim)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
          style={{
            background: "var(--gl-orbital-fade)",
          }}
        />
      </div>
    );
  }

  // Mode 2: Header-only live background with crisp typography scrim & interactive hub hover
  if (mode === "header-bg") {
    return (
      <div
        ref={wrapperRef}
        className={`absolute inset-0 z-0 overflow-hidden ${className}`}
      >
        <canvas
          ref={canvasRef}
          aria-label="Live global Gyra intelligence network map behind hero header"
          className="block h-full w-full opacity-[0.88]"
        />
        {/* Soft center & bottom fade so headline stays razor-legible and transitions cleanly to pitch black */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 56% 52% at 50% 42%, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.18) 58%, rgba(0,0,0,0.88) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/80 to-transparent"
        />

        {hoveredHub && (
          <div
            style={{
              left: Math.max(12, hoverPos.x + 14),
              top: Math.max(12, hoverPos.y - 54),
              borderColor: pal.frameBorder,
            }}
            className="pointer-events-none absolute z-20 border bg-black/92 px-3 py-2 backdrop-blur-md"
          >
            <div className="flex items-center gap-2 font-mono-tech text-[10px] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
              <span className="text-white">{hoveredHub.city}</span>
              <span style={{ color: pal.accentText }}>{hoveredHub.code}</span>
            </div>
            <p className="mt-0.5 font-mono-tech text-[10px] text-[#94A3B8]">
              {hoveredHub.region} · {hoveredHub.latencyMs}ms · {hoveredHub.rps}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Mode 3: Compact executive Global Intelligence Map Band between Hero Header and Live Synaptic Flow
  return (
    <div
      style={{
        borderColor: pal.frameBorder,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 24px 68px -28px ${pal.frameGlow}`,
      }}
      className={`relative mx-auto mt-9 w-full max-w-[1160px] overflow-hidden border bg-[#03060B]/95 backdrop-blur-md ${className}`}
    >
      {/* Top HUD Bar — mirrors attached reference structure cleanly */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-black/55 px-4 py-2.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <GyraLogoMark size={26} />
          <div className="leading-none">
            <p className="font-display text-[15px] font-bold tracking-[0.06em] text-white uppercase">
              Gyra{" "}
              <span className="font-mono-tech text-[10px] font-normal tracking-[0.14em]" style={{ color: pal.accentText }}>
                · Global Intelligence Mesh
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div
            style={{ borderColor: pal.frameBorder }}
            className="inline-flex items-center gap-2 border bg-black/75 px-3 py-1 font-mono-tech text-[10px] tracking-[0.1em] text-white uppercase"
          >
            <span className="h-2 w-2 rounded-full bg-[#34D399] shadow-[0_0_8px_#34D399]" />
            <span>Live Intelligence</span>
            <svg
              viewBox="0 0 28 12"
              width="24"
              height="10"
              aria-hidden="true"
              className="ml-1"
            >
              <polyline
                fill="none"
                stroke={pal.accentHex}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,6 5,6 8,2 11,10 14,4 17,8 20,6 28,6"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Interactive High-Detail Natural Earth Live Canvas (compact, proportional height) */}
      <div
        ref={wrapperRef}
        className="relative h-[280px] sm:h-[360px] lg:h-[400px] w-full overflow-hidden bg-[#02050A]"
      >
        <canvas
          ref={canvasRef}
          aria-label="Interactive Gyra Global Intelligence Network across 22 global edge hubs and 195+ countries"
          className="block h-full w-full cursor-crosshair"
        />

        {/* Floating Left Status Filter Legend (Online / Processing / Standby) */}
        <div
          role="group"
          aria-label="Filter global hubs by status"
          className="absolute bottom-3 left-3 z-10 hidden flex-col gap-1 border border-white/10 bg-black/78 p-2 backdrop-blur-md sm:flex"
        >
          {(
            [
              { id: "online" as const, label: "Online", dot: "#34D399" },
              { id: "processing" as const, label: "Processing", dot: pal.accentHex },
              { id: "standby" as const, label: "Standby", dot: "#64748B" },
            ] as const
          ).map((st) => {
            const active = statusFilter === st.id;
            return (
              <button
                key={st.id}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter((cur) => (cur === st.id ? "all" : st.id))}
                className={`flex items-center gap-2 px-2 py-0.5 text-left font-mono-tech text-[10px] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                  active
                    ? "bg-white/12 text-white"
                    : "text-[#9AB0C1] hover:text-white"
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: st.dot,
                    boxShadow: active ? `0 0 8px ${st.dot}` : "none",
                  }}
                />
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Hub Inspection Callout */}
        {hoveredHub && (
          <div
            style={{
              left: Math.min(Math.max(hoverPos.x + 14, 14), 860),
              top: Math.max(hoverPos.y - 68, 12),
              borderColor: pal.frameBorder,
            }}
            className="pointer-events-none absolute z-20 w-[228px] border bg-black/92 px-3 py-2.5 backdrop-blur-md"
          >
            <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase">
              <span className="font-medium text-white">
                {hoveredHub.city} · {hoveredHub.code}
              </span>
              <span className="text-[#34D399]">{hoveredHub.latencyMs}ms</span>
            </div>
            <p className="mt-1 font-mono-tech text-[9.5px] uppercase" style={{ color: pal.accentText }}>
              {hoveredHub.region}
            </p>
            <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-1.5 font-mono-tech text-[9.5px] text-[#B8CAD8]">
              <span>{hoveredHub.activeModel}</span>
              <span>{hoveredHub.rps}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Telemetry Ledger — mirrors attached reference metrics cleanly */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] bg-black/70 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-5 sm:gap-7">
          <div className="flex items-center gap-2.5">
            <Globe className="h-4 w-4 shrink-0" style={{ color: pal.accentHex }} />
            <div>
              <p className="font-mono-tech text-[14px] font-semibold leading-none text-white">
                195+
              </p>
              <p className="mt-0.5 font-mono-tech text-[9.5px] tracking-[0.08em] text-[#7D93A5] uppercase">
                Countries
              </p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-white/10" aria-hidden="true" />

          <div className="flex items-center gap-2.5">
            <Server className="h-4 w-4 shrink-0" style={{ color: pal.accentHex }} />
            <div>
              <p className="font-mono-tech text-[14px] font-semibold leading-none text-white">
                1.2M+
              </p>
              <p className="mt-0.5 font-mono-tech text-[9.5px] tracking-[0.08em] text-[#7D93A5] uppercase">
                Requests
              </p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-white/10" aria-hidden="true" />

          <div className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 shrink-0" style={{ color: pal.accentHex }} />
            <div>
              <p className="font-mono-tech text-[14px] font-semibold leading-none text-white">
                99.9%
              </p>
              <p className="mt-0.5 font-mono-tech text-[9.5px] tracking-[0.08em] text-[#7D93A5] uppercase">
                Uptime
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <p className="font-mono-tech text-[10px] tracking-[0.18em] text-[#9CB2C4] uppercase">
            Global <span style={{ color: pal.accentHex }}>·</span> Connected{" "}
            <span style={{ color: pal.accentHex }}>·</span> Intelligent
          </p>
          <div className="h-[2px] w-44 overflow-hidden bg-white/10">
            <div
              className="h-full w-2/3"
              style={{
                background: `linear-gradient(90deg, transparent, ${pal.accentHex}, #FFFFFF)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
