"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

export interface Interactive3DKeyboardProps {
  /** Current character being typed by the live show (triggers realistic physical key press + LED pulse) */
  activeChar?: string | null;
  /** Incrementing nonce so repeating characters re-trigger mechanical key travel */
  activeCharNonce?: number;
  /** Pulses the glowing ENTER key when a prompt drops into the live show */
  enterPulseNonce?: number;
  /** Optional callback when the user clicks/taps a key directly on the 3D keyboard */
  onKeyTap?: (key: string) => void;
  /** Compact height preset for tight docks or hero columns */
  size?: "sm" | "md";
  /** Clean floating side-pocket mode beside GENVIA -> GYRA CORE */
  compactCorner?: boolean;
  /** Optional status caption shown in the bottom-left micro-hint */
  statusLabel?: string;
}

interface KeyDef {
  id: string;
  label: string;
  row: number;
  col: number;
  w: number;
  accent?: "esc" | "enter" | "mod" | "space";
  matchChars: string[];
}

// Sculpted minimalist 45% Gyra CNC Mechanical Deck (11.5 generous key units × 4 rows)
// Chunky, clean keycaps with real spacing — looks crisp and photorealistic on BOTH mobile & desktop!
const KEY_ROWS: { row: number; keys: Omit<KeyDef, "row" | "col">[] }[] = [
  {
    row: 0,
    keys: [
      { id: "ESC", label: "G", w: 1.15, accent: "esc", matchChars: ["~", "`", "1", "2", "3", "4", "5"] },
      { id: "Q", label: "Q", w: 1, matchChars: ["q", "Q", "6"] },
      { id: "W", label: "W", w: 1, matchChars: ["w", "W", "7"] },
      { id: "E", label: "E", w: 1, matchChars: ["e", "E", "8"] },
      { id: "R", label: "R", w: 1, matchChars: ["r", "R", "9"] },
      { id: "T", label: "T", w: 1, matchChars: ["t", "T", "0"] },
      { id: "Y", label: "Y", w: 1, matchChars: ["y", "Y"] },
      { id: "U", label: "U", w: 1, matchChars: ["u", "U"] },
      { id: "I", label: "I", w: 1, matchChars: ["i", "I"] },
      { id: "O", label: "O", w: 1, matchChars: ["o", "O"] },
      { id: "P", label: "P", w: 1.35, matchChars: ["p", "P", "-", "_"] },
    ],
  },
  {
    row: 1,
    keys: [
      { id: "AI", label: "AI", w: 1.4, accent: "mod", matchChars: ["\t"] },
      { id: "A", label: "A", w: 1, matchChars: ["a", "A"] },
      { id: "S", label: "S", w: 1, matchChars: ["s", "S"] },
      { id: "D", label: "D", w: 1, matchChars: ["d", "D"] },
      { id: "F", label: "F", w: 1, matchChars: ["f", "F"] },
      { id: "G", label: "G", w: 1, matchChars: ["g", "G"] },
      { id: "H", label: "H", w: 1, matchChars: ["h", "H"] },
      { id: "J", label: "J", w: 1, matchChars: ["j", "J"] },
      { id: "K", label: "K", w: 1, matchChars: ["k", "K"] },
      { id: "L", label: "L", w: 1, matchChars: ["l", "L", ":", ";"] },
      { id: "ENTER", label: "↵", w: 1.1, accent: "enter", matchChars: ["\n", "ENTER"] },
    ],
  },
  {
    row: 2,
    keys: [
      { id: "LSHIFT", label: "⇧", w: 1.75, accent: "mod", matchChars: [] },
      { id: "Z", label: "Z", w: 1, matchChars: ["z", "Z"] },
      { id: "X", label: "X", w: 1, matchChars: ["x", "X"] },
      { id: "C", label: "C", w: 1, matchChars: ["c", "C"] },
      { id: "V", label: "V", w: 1, matchChars: ["v", "V"] },
      { id: "B", label: "B", w: 1, matchChars: ["b", "B"] },
      { id: "N", label: "N", w: 1, matchChars: ["n", "N"] },
      { id: "M", label: "M", w: 1, matchChars: ["m", "M"] },
      { id: ".", label: "·", w: 1, matchChars: [".", ",", "?", "!", "&", "/"] },
      { id: "BKSP", label: "⌫", w: 1.75, accent: "mod", matchChars: ["\b"] },
    ],
  },
  {
    row: 3,
    keys: [
      { id: "CMD", label: "⌘", w: 1.5, accent: "mod", matchChars: [] },
      { id: "OPT", label: "⌥", w: 1.25, accent: "mod", matchChars: [] },
      { id: "SPACE", label: "GYRA", w: 6.0, accent: "space", matchChars: [" "] },
      { id: "FN", label: "FN", w: 1.25, accent: "mod", matchChars: [] },
      { id: "RUN", label: "✦", w: 1.5, accent: "enter", matchChars: [] },
    ],
  },
];

const TOTAL_UNITS = 11.5;
const HALF_W = TOTAL_UNITS * 0.5; // 5.75
const HALF_D = 2.0; // 4 rows -> -2.0 .. +2.0

const ALL_KEYS: KeyDef[] = KEY_ROWS.flatMap(({ row, keys }) => {
  let col = 0;
  return keys.map((k) => {
    const def: KeyDef = { ...k, row, col };
    col += k.w;
    return def;
  });
});

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface ProjectedPt {
  sx: number;
  sy: number;
  depth: number;
  persp: number;
}

interface KeyScreenHit {
  id: string;
  cx: number;
  cy: number;
  radius: number;
}

const DEFAULT_YAW = -0.32;
const DEFAULT_PITCH = 0.66;

export function Interactive3DKeyboard({
  activeChar = null,
  activeCharNonce = 0,
  enterPulseNonce = 0,
  onKeyTap,
  size = "md",
  compactCorner = false,
  statusLabel = "GYRA · DRAG TO TURN 3D",
}: Interactive3DKeyboardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<"iso" | "top" | "low">("iso");
  const [lastTapped, setLastTapped] = useState<string | null>(null);

  const stateRef = useRef({
    yaw: DEFAULT_YAW,
    pitch: DEFAULT_PITCH,
    targetYaw: DEFAULT_YAW,
    targetPitch: DEFAULT_PITCH,
    dragging: false,
    movedDuringDrag: false,
    lastPointerX: 0,
    lastPointerY: 0,
    keyPress: new Map<string, number>(),
    keyGlow: new Map<string, number>(),
    hits: [] as KeyScreenHit[],
    inViewport: true,
    pageVisible: true,
    reducedMotion: false,
    t: 0,
    enterRipple: 0,
    knobAngle: 0.5,
  });

  // Trigger real key travel whenever the live show types a character
  useEffect(() => {
    if (!activeChar) return;
    const s = stateRef.current;
    const match = ALL_KEYS.find((k) => k.matchChars.includes(activeChar));
    if (match) {
      s.keyPress.set(match.id, 1);
      s.keyGlow.set(match.id, 1);
      if (activeChar >= "A" && activeChar <= "Z") {
        s.keyPress.set("LSHIFT", 0.65);
        s.keyGlow.set("LSHIFT", 0.55);
      }
      s.knobAngle += 0.16;
    }
  }, [activeChar, activeCharNonce]);

  // Trigger ENTER + RUN key shockwave when prompt drops
  useEffect(() => {
    if (!enterPulseNonce) return;
    const s = stateRef.current;
    s.keyPress.set("ENTER", 1);
    s.keyGlow.set("ENTER", 1.35);
    s.keyPress.set("RUN", 0.85);
    s.keyGlow.set("RUN", 1.2);
    s.enterRipple = 1;
  }, [enterPulseNonce]);

  const applyCameraPreset = (preset: "iso" | "top" | "low") => {
    setViewMode(preset);
    const s = stateRef.current;
    if (preset === "iso") {
      s.targetYaw = DEFAULT_YAW;
      s.targetPitch = DEFAULT_PITCH;
    } else if (preset === "top") {
      s.targetYaw = 0;
      s.targetPitch = 1.16;
    } else {
      s.targetYaw = 0.42;
      s.targetPitch = 0.36;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const s = stateRef.current;
    s.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 300;
    let H = 180;
    let dpr = 1;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      W = Math.max(120, rect.width);
      H = Math.max(92, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const io = new IntersectionObserver(
      (entries) => {
        s.inViewport = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    io.observe(wrap);

    const onVis = () => {
      s.pageVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    const project = (p: Vec3, yaw: number, pitch: number, scale: number, cx: number, cy: number): ProjectedPt => {
      // Ergonomic 6.5° anodized wedge tilt
      const tilt = 0.112;
      const yTilt = p.y * Math.cos(tilt) - p.z * Math.sin(tilt);
      const zTilt = p.y * Math.sin(tilt) + p.z * Math.cos(tilt);

      const cyaw = Math.cos(yaw);
      const syaw = Math.sin(yaw);
      const x1 = p.x * cyaw - zTilt * syaw;
      const z1 = p.x * syaw + zTilt * cyaw;

      const cp = Math.cos(pitch);
      const sp = Math.sin(pitch);
      const y2 = yTilt * cp - z1 * sp;
      const z2 = yTilt * sp + z1 * cp;

      const camDist = 21.5;
      const persp = camDist / Math.max(6, camDist - z2);
      return {
        sx: cx + x1 * scale * persp,
        sy: cy - y2 * scale * persp,
        depth: z2,
        persp,
      };
    };

    const fillPoly = (
      pts: ProjectedPt[],
      fill: string | CanvasGradient,
      stroke?: string,
      lineWidth = 0.75,
    ) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].sx, pts[0].sy);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = "round";
        ctx.stroke();
      }
    };

    /**
     * Draw a photorealistic 3D beveled frustum with studio directional gradient shading!
     */
    const drawStudioPrism = (
      x0: number,
      x1: number,
      z0: number,
      z1: number,
      yBase: number,
      yTop: number,
      taper: number,
      yaw: number,
      pitch: number,
      scale: number,
      cx: number,
      cy: number,
      mat: {
        topLight: string;
        topDark: string;
        frontLight: string;
        frontDark: string;
        back: string;
        left: string;
        right: string;
        edge?: string;
        topRim?: string;
        concaveDish?: boolean;
      },
    ) => {
      const tx0 = x0 + taper;
      const tx1 = x1 - taper;
      const tz0 = z0 + taper;
      const tz1 = z1 - taper;

      const b0 = project({ x: x0, y: yBase, z: z0 }, yaw, pitch, scale, cx, cy);
      const b1 = project({ x: x1, y: yBase, z: z0 }, yaw, pitch, scale, cx, cy);
      const b2 = project({ x: x1, y: yBase, z: z1 }, yaw, pitch, scale, cx, cy);
      const b3 = project({ x: x0, y: yBase, z: z1 }, yaw, pitch, scale, cx, cy);

      const t0 = project({ x: tx0, y: yTop, z: tz0 }, yaw, pitch, scale, cx, cy);
      const t1 = project({ x: tx1, y: yTop, z: tz0 }, yaw, pitch, scale, cx, cy);
      const t2 = project({ x: tx1, y: yTop, z: tz1 }, yaw, pitch, scale, cx, cy);
      const t3 = project({ x: tx0, y: yTop, z: tz1 }, yaw, pitch, scale, cx, cy);

      const frontGrad = ctx.createLinearGradient(t3.sx, t3.sy, b2.sx, b2.sy);
      frontGrad.addColorStop(0, mat.frontLight);
      frontGrad.addColorStop(1, mat.frontDark);

      const topGrad = ctx.createLinearGradient(t0.sx, t0.sy, t2.sx, t2.sy);
      topGrad.addColorStop(0, mat.topLight);
      topGrad.addColorStop(1, mat.topDark);

      const faces: { pts: ProjectedPt[]; depth: number; fill: string | CanvasGradient; stroke?: string; lw?: number }[] = [
        { pts: [b3, b2, t2, t3], depth: (b3.depth + b2.depth + t2.depth + t3.depth) * 0.25, fill: frontGrad, stroke: mat.edge, lw: 0.6 },
        { pts: [b0, b1, t1, t0], depth: (b0.depth + b1.depth + t1.depth + t0.depth) * 0.25, fill: mat.back, stroke: mat.edge, lw: 0.6 },
        { pts: [b0, b3, t3, t0], depth: (b0.depth + b3.depth + t3.depth + t0.depth) * 0.25, fill: mat.left, stroke: mat.edge, lw: 0.6 },
        { pts: [b1, b2, t2, t1], depth: (b1.depth + b2.depth + t2.depth + t1.depth) * 0.25, fill: mat.right, stroke: mat.edge, lw: 0.6 },
        { pts: [t0, t1, t2, t3], depth: (t0.depth + t1.depth + t2.depth + t3.depth) * 0.25 + 0.12, fill: topGrad, stroke: mat.topRim ?? mat.edge, lw: 0.75 },
      ];

      faces.sort((a, b) => a.depth - b.depth);
      for (const f of faces) {
        fillPoly(f.pts, f.fill, f.stroke, f.lw);
      }

      // Subtle sculpted PBT keycap concave finger dish on top face!
      if (mat.concaveDish && scale > 10) {
        const cxTop = (t0.sx + t1.sx + t2.sx + t3.sx) * 0.25;
        const cyTop = (t0.sy + t1.sy + t2.sy + t3.sy) * 0.25;
        const rx = Math.hypot(t1.sx - t0.sx, t1.sy - t0.sy) * 0.34;
        const ry = Math.hypot(t3.sx - t0.sx, t3.sy - t0.sy) * 0.34;
        if (rx > 2 && ry > 1.5) {
          const dish = ctx.createRadialGradient(cxTop, cyTop, 0.2, cxTop, cyTop, Math.max(rx, ry));
          dish.addColorStop(0, "rgba(0, 0, 0, 0.24)");
          dish.addColorStop(0.75, "rgba(0, 0, 0, 0.06)");
          dish.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(t0.sx, t0.sy);
          ctx.lineTo(t1.sx, t1.sy);
          ctx.lineTo(t2.sx, t2.sy);
          ctx.lineTo(t3.sx, t3.sy);
          ctx.closePath();
          ctx.clip();
          ctx.fillStyle = dish;
          ctx.fillRect(cxTop - rx * 1.6, cyTop - ry * 1.6, rx * 3.2, ry * 3.2);
          ctx.restore();
        }
      }

      return { t0, t1, t2, t3 };
    };

    /**
     * Draw crisp key legend physically affine-mapped onto the angled 3D keycap face!
     * Automatically tilts, skews, and foreshortens in true 3D as you rotate the keyboard!
     */
    const draw3DKeyLegend = (
      label: string,
      t0: ProjectedPt,
      t1: ProjectedPt,
      t3: ProjectedPt,
      color: string,
      wUnits: number,
    ) => {
      // Basis vectors across the top keycap quad in screen pixels
      const ux = t1.sx - t0.sx;
      const uy = t1.sy - t0.sy;
      const vx = t3.sx - t0.sx;
      const vy = t3.sy - t0.sy;

      const uLen = Math.hypot(ux, uy);
      const vLen = Math.hypot(vx, vy);
      if (uLen < 4 || vLen < 3) return;

      // Map normalized keycap plane [-0.5..+0.5] x [-0.5..+0.5] -> actual 3D screen quad
      const cxTop = t0.sx + (ux + vx) * 0.5;
      const cyTop = t0.sy + (uy + vy) * 0.5;

      // Scale local coordinate system cleanly so text aspect ratio matches physical key dimensions
      const localW = Math.max(1, wUnits);
      const a = ux / localW;
      const b = uy / localW;
      const c = vx;
      const d = vy;

      ctx.save();
      ctx.transform(a, b, c, d, cxTop, cyTop);
      // Draw crisp legend in key-unit coordinates (1 key unit = 1.0)
      const isWord = label.length > 2;
      ctx.font = `700 ${isWord ? 0.54 : 0.58}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 0, 0.02);
      ctx.restore();
    };

    let rafId = 0;
    let lastTs = performance.now();

    const frame = (now: number) => {
      rafId = requestAnimationFrame(frame);
      if (!s.inViewport || !s.pageVisible) return;

      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      s.t += dt;

      // Calm, steady hardware stance (no idle wobble — only turns smoothly when user drags in 3D!)
      const ease = 1 - Math.exp(-dt * 9.5);
      s.yaw += (s.targetYaw - s.yaw) * ease;
      s.pitch += (s.targetPitch - s.pitch) * ease;

      for (const [id, val] of s.keyPress.entries()) {
        const next = val - dt * 5.8;
        if (next <= 0.01) s.keyPress.delete(id);
        else s.keyPress.set(id, next);
      }
      for (const [id, val] of s.keyGlow.entries()) {
        const next = val - dt * 2.8;
        if (next <= 0.01) s.keyGlow.delete(id);
        else s.keyGlow.set(id, next);
      }
      if (s.enterRipple > 0) {
        s.enterRipple = Math.max(0, s.enterRipple - dt * 1.8);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const scale = Math.min(W / 15.6, H / 8.2);
      const cx = W * 0.5;
      const cy = H * 0.51;
      const stealthSmall = scale < 11.5;

      // 1. Subtle neutral ground contact shadow (pure dark E2B aesthetic — zero loud colored glow!)
      const shPts = [
        project({ x: -6.45, y: -0.68, z: -2.65 }, s.yaw, s.pitch, scale, cx, cy),
        project({ x: 6.75, y: -0.68, z: -2.65 }, s.yaw, s.pitch, scale, cx, cy),
        project({ x: 6.75, y: -0.68, z: 2.65 }, s.yaw, s.pitch, scale, cx, cy),
        project({ x: -6.45, y: -0.68, z: 2.65 }, s.yaw, s.pitch, scale, cx, cy),
      ];
      ctx.save();
      ctx.filter = "blur(6px)";
      fillPoly(shPts, "rgba(0, 0, 0, 0.85)");
      ctx.restore();

      // 2. Restrained Lower Chassis Trim (quiet gunmetal with subtle hairline steel edge)
      drawStudioPrism(
        -6.18,
        6.45,
        -2.42,
        2.44,
        -0.54,
        -0.4,
        0.04,
        s.yaw,
        s.pitch,
        scale,
        cx,
        cy,
        {
          topLight: "#0E1115",
          topDark: "#08090C",
          frontLight: `rgba(91, 158, 194, ${(0.16 + s.enterRipple * 0.22).toFixed(2)})`,
          frontDark: "rgba(31, 91, 124, 0.12)",
          back: "#07080B",
          left: "rgba(91, 158, 194, 0.14)",
          right: "rgba(91, 158, 194, 0.14)",
          edge: "rgba(255, 255, 255, 0.08)",
        },
      );

      // 3. Main CNC Matte-Black Anodized Aluminum Unibody Chassis
      drawStudioPrism(
        -6.3,
        6.58,
        -2.54,
        2.56,
        -0.4,
        0.16,
        0.09,
        s.yaw,
        s.pitch,
        scale,
        cx,
        cy,
        {
          topLight: "#191C22",
          topDark: "#0B0D11",
          frontLight: "#1B1F26",
          frontDark: "#0D0F13",
          back: "#090A0D",
          left: "#15181E",
          right: "#0C0E12",
          edge: "rgba(255, 255, 255, 0.08)",
          topRim: "rgba(255, 255, 255, 0.18)",
        },
      );

      // 4. Recessed Matte-Black Switch Plate Well
      const wellPts = [
        project({ x: -5.88, y: 0.17, z: -2.12 }, s.yaw, s.pitch, scale, cx, cy),
        project({ x: 5.88, y: 0.17, z: -2.12 }, s.yaw, s.pitch, scale, cx, cy),
        project({ x: 5.88, y: 0.17, z: 2.12 }, s.yaw, s.pitch, scale, cx, cy),
        project({ x: -5.88, y: 0.17, z: 2.12 }, s.yaw, s.pitch, scale, cx, cy),
      ];
      fillPoly(wellPts, "#030406", "rgba(255, 255, 255, 0.09)", 0.75);

      // 5. Minimal Status Indicator Line & Clean Right-Edge Signal Pin (moderate, no loud halo blob!)
      const ledA = project({ x: -5.78, y: 0.18, z: -2.32 }, s.yaw, s.pitch, scale, cx, cy);
      const ledB = project({ x: -4.7, y: 0.18, z: -2.32 }, s.yaw, s.pitch, scale, cx, cy);
      ctx.beginPath();
      ctx.moveTo(ledA.sx, ledA.sy);
      ctx.lineTo(ledB.sx, ledB.sy);
      ctx.strokeStyle = s.enterRipple > 0.15 ? "#5B9EC2" : "rgba(91, 158, 194, 0.55)";
      ctx.lineWidth = Math.max(1.2, scale * 0.09);
      ctx.lineCap = "round";
      ctx.stroke();

      const portPos = project({ x: 6.56, y: -0.05, z: 0.08 }, s.yaw, s.pitch, scale, cx, cy);
      ctx.fillStyle = s.enterRipple > 0.15 ? "#9CC4DC" : "rgba(91, 158, 194, 0.7)";
      ctx.beginPath();
      ctx.arc(portPos.sx, portPos.sy, Math.max(1.4, scale * 0.09), 0, Math.PI * 2);
      ctx.fill();

      // 7. Painter's Algorithm Depth-Sorted Sculpted 3D Keycaps
      const sortedKeys = ALL_KEYS.map((k) => {
        const kx0 = -HALF_W + k.col + 0.075;
        const kx1 = -HALF_W + k.col + k.w - 0.075;
        const kz0 = -HALF_D + k.row + 0.08;
        const kz1 = -HALF_D + k.row + 1 - 0.08;
        const mid = project(
          { x: (kx0 + kx1) * 0.5, y: 0.36, z: (kz0 + kz1) * 0.5 },
          s.yaw,
          s.pitch,
          scale,
          cx,
          cy,
        );
        return { k, kx0, kx1, kz0, kz1, depth: mid.depth };
      }).sort((a, b) => a.depth - b.depth);

      const nextHits: KeyScreenHit[] = [];

      for (const item of sortedKeys) {
        const { k, kx0, kx1, kz0, kz1 } = item;
        const press = s.keyPress.get(k.id) ?? 0;
        const glow = Math.min(1, s.keyGlow.get(k.id) ?? 0);

        const travel = press * 0.2;
        const yBase = 0.18 - travel * 0.25;
        const yTop = 0.64 - travel;

        // Restrained obsidian PBT keycap materials (moderate, tasteful highlight when pressed!)
        let topLight = "#1D2128";
        let topDark = "#12151A";
        let frontLight = "#12151B";
        let frontDark = "#090B0E";
        let sideCol = "#0B0D11";
        let topRim = "rgba(255, 255, 255, 0.12)";
        let legendColor = "rgba(210, 220, 230, 0.78)";

        if (k.accent === "enter") {
          topLight = glow > 0.15 ? "#357FA8" : "#1F5B7C";
          topDark = glow > 0.15 ? "#1D5675" : "#153F57";
          frontLight = "#143D54";
          frontDark = "#0B2433";
          sideCol = "#0D293A";
          topRim = "rgba(156, 196, 220, 0.45)";
          legendColor = "#FFFFFF";
        } else if (k.accent === "esc") {
          topLight = "#1A2934";
          topDark = "#101B23";
          frontLight = "#0E1820";
          frontDark = "#080E14";
          sideCol = "#091016";
          topRim = "rgba(91, 158, 194, 0.35)";
          legendColor = "#9CC4DC";
        } else if (k.accent === "mod") {
          topLight = "#15181E";
          topDark = "#0D0F14";
          frontLight = "#0D0F14";
          frontDark = "#07080B";
          sideCol = "#090B0E";
          topRim = "rgba(255, 255, 255, 0.08)";
          legendColor = "rgba(150, 160, 172, 0.62)";
        } else if (k.accent === "space") {
          topLight = "#1A1E25";
          topDark = "#101318";
          frontLight = "#101318";
          frontDark = "#080A0D";
          topRim = "rgba(255, 255, 255, 0.16)";
          legendColor = "rgba(205, 220, 232, 0.85)";
        }

        if (glow > 0.08 && k.accent !== "enter") {
          topLight = `rgb(${Math.round(29 + glow * 16)}, ${Math.round(33 + glow * 32)}, ${Math.round(40 + glow * 46)})`;
          topDark = `rgb(${Math.round(18 + glow * 10)}, ${Math.round(21 + glow * 22)}, ${Math.round(26 + glow * 32)})`;
          topRim = `rgba(148, 184, 206, ${(0.18 + glow * 0.28).toFixed(2)})`;
          legendColor = "#E6EFF5";
        }

        const { t0, t1, t2, t3 } = drawStudioPrism(
          kx0,
          kx1,
          kz0,
          kz1,
          yBase,
          yTop,
          0.11,
          s.yaw,
          s.pitch,
          scale,
          cx,
          cy,
          {
            topLight,
            topDark,
            frontLight,
            frontDark,
            back: "#0B1016",
            left: sideCol,
            right: sideCol,
            edge: "rgba(0, 0, 0, 0.55)",
            topRim,
            concaveDish: k.accent !== "space",
          },
        );

        // True 3D perspective-skewed keycap legends!
        // On ultra-compact mobile pockets (stealthSmall), only show iconic GYRA / ↵ / G legends so zero text ever crowds!
        const showLegend =
          !stealthSmall ||
          k.accent === "space" ||
          k.accent === "enter" ||
          k.accent === "esc" ||
          glow > 0.25;
        if (showLegend) {
          draw3DKeyLegend(k.label, t0, t1, t3, legendColor, k.w);
        }

        const cxHit = (t0.sx + t1.sx + t2.sx + t3.sx) * 0.25;
        const cyHit = (t0.sy + t1.sy + t2.sy + t3.sy) * 0.25;
        nextHits.push({
          id: k.id,
          cx: cxHit,
          cy: cyHit,
          radius: scale * (k.w > 2 ? 0.95 : 0.48),
        });
      }

      // 8. Dedicated Brushed Metallic Rotary Dial on Right Aluminum Lip (Zero overlap with keys!)
      const kx = 6.18;
      const kz = -1.65;
      const knobBase = project({ x: kx, y: 0.17, z: kz }, s.yaw, s.pitch, scale, cx, cy);
      const knobTop = project({ x: kx, y: 0.48, z: kz }, s.yaw, s.pitch, scale, cx, cy);
      const kr = Math.max(3.6, scale * 0.28);
      ctx.save();
      ctx.fillStyle = "#101720";
      ctx.beginPath();
      ctx.ellipse(knobBase.sx, knobBase.sy, kr, kr * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(knobTop.sx - kr, knobTop.sy, kr * 2, Math.max(1, knobBase.sy - knobTop.sy));
      const knobGrad = ctx.createLinearGradient(knobTop.sx - kr, knobTop.sy - kr, knobTop.sx + kr, knobTop.sy + kr);
      knobGrad.addColorStop(0, "#35475B");
      knobGrad.addColorStop(1, "#141D28");
      ctx.fillStyle = knobGrad;
      ctx.strokeStyle = "rgba(186, 224, 245, 0.42)";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.ellipse(knobTop.sx, knobTop.sy, kr, kr * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#5B9EC2";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(knobTop.sx, knobTop.sy);
      ctx.lineTo(
        knobTop.sx + Math.cos(s.knobAngle) * kr * 0.65,
        knobTop.sy + Math.sin(s.knobAngle) * kr * 0.4,
      );
      ctx.stroke();
      ctx.restore();

      s.hits = nextHits;
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    s.dragging = true;
    s.movedDuringDrag = false;
    s.lastPointerX = e.clientX;
    s.lastPointerY = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const dx = e.clientX - s.lastPointerX;
    const dy = e.clientY - s.lastPointerY;
    if (Math.abs(dx) + Math.abs(dy) > 3) {
      s.movedDuringDrag = true;
    }
    s.lastPointerX = e.clientX;
    s.lastPointerY = e.clientY;
    s.targetYaw = Math.max(-1.25, Math.min(1.25, s.targetYaw + dx * 0.0085));
    s.targetPitch = Math.max(0.22, Math.min(1.28, s.targetPitch + dy * 0.0075));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    const wasTap = !s.movedDuringDrag;
    s.dragging = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (wasTap && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      let best: KeyScreenHit | null = null;
      let bestDist = Infinity;
      for (const h of s.hits) {
        const d = Math.hypot(px - h.cx, py - h.cy);
        if (d <= h.radius * 1.15 && d < bestDist) {
          best = h;
          bestDist = d;
        }
      }
      if (best) {
        s.keyPress.set(best.id, 1);
        s.keyGlow.set(best.id, 1.25);
        const mapped = best.id === "RUN" ? "ENTER" : best.id;
        if (mapped === "ENTER") s.enterRipple = 1;
        setLastTapped(mapped);
        onKeyTap?.(mapped);
      }
    }
  };

  const heightClass = compactCorner
    ? "h-[112px] sm:h-[154px] lg:h-[188px]"
    : size === "sm"
      ? "h-[196px] sm:h-[212px]"
      : "h-[224px] sm:h-[252px]";

  return (
    <div className="relative select-none">
      <div
        ref={wrapRef}
        className={`relative w-full ${heightClass} cursor-grab active:cursor-grabbing`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: "none" }}
          aria-label="Interactive 3D GYRA Mechanical Keyboard — drag to rotate in 3D or tap keys"
          className="block h-full w-full"
        />

        {/* Quiet Camera Presets (whisper-minimal reset on mobile, crisp pills on tablet/desktop) */}
        <div className={`absolute ${compactCorner ? "right-1 top-1" : "right-2 top-2"} flex items-center gap-1`}>
          {(compactCorner
            ? ([
                { id: "iso", label: "3/4" },
                { id: "top", label: "TOP" },
              ] as const)
            : ([
                { id: "iso", label: "3/4" },
                { id: "top", label: "TOP" },
                { id: "low", label: "LOW" },
              ] as const)
          ).map((cam) => (
            <button
              key={cam.id}
              type="button"
              onClick={() => applyCameraPreset(cam.id)}
              className={`${compactCorner ? "hidden sm:inline-flex" : "inline-flex"} items-center justify-center rounded-[3px] font-mono-tech min-h-[20px] border px-1.5 text-[8.5px] tracking-[0.1em] uppercase transition-colors cursor-pointer ${
                viewMode === cam.id
                  ? "border-[#5B9EC2]/60 bg-[#1F5B7C]/25 text-white"
                  : "border-white/10 bg-black/70 text-[#7F95A8] hover:border-white/30 hover:text-white"
              }`}
            >
              {cam.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => applyCameraPreset("iso")}
            title="Reset 3D angle"
            aria-label="Reset 3D keyboard angle"
            className={`inline-flex items-center justify-center rounded-full text-[#7F95A8] transition-colors hover:text-white cursor-pointer ${
              compactCorner
                ? "h-[18px] w-[18px] bg-white/[0.04] sm:h-[20px] sm:w-[20px] sm:rounded-[3px] sm:border sm:border-white/10 sm:bg-black/70"
                : "h-[22px] w-[22px] border border-white/10 bg-black/75"
            }`}
          >
            <RotateCcw className="h-2.5 w-2.5" />
          </button>
        </div>

        {/* Bottom Micro-Telemetry Bar */}
        <div className="pointer-events-none absolute inset-x-1.5 bottom-0.5 sm:inset-x-2 sm:bottom-1 flex items-center justify-between font-mono-tech text-[7.5px] sm:text-[8.5px] tracking-[0.1em] text-[#7D95AA] uppercase">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5B9EC2]" />
            <span className="sm:hidden">GYRA · 3D</span>
            <span className="hidden sm:inline">{statusLabel}</span>
          </span>
          <span className="hidden sm:inline text-[#9CC4DC]">
            {lastTapped
              ? `KEY · ${lastTapped}`
              : activeChar
                ? `TYPING · ${activeChar === " " ? "SPACE" : activeChar.toUpperCase()}`
                : "GYRA 45% CNC"}
          </span>
        </div>
      </div>
    </div>
  );
}
