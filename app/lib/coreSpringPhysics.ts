export interface Vec2 {
  x: number;
  y: number;
}

export interface Spring2DState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Spring2DConfig {
  stiffness: number;
  damping: number;
  settleEpsilon?: number;
}

export interface CanvasBounds {
  baseX: number;
  baseY: number;
  width: number;
  height: number;
  padding: number;
}

export const CORE_RETURN_SPRING: Spring2DConfig = {
  stiffness: 185,
  damping: 14.5,
  settleEpsilon: 0.25,
};

export const SIBLING_RETURN_SPRING: Spring2DConfig = {
  stiffness: 240,
  damping: 18,
  settleEpsilon: 0.2,
};

export const WAFER_RETURN_SPRING: Spring2DConfig = {
  stiffness: 175,
  damping: 15,
  settleEpsilon: 0.25,
};

export function createSpring2D(x = 0, y = 0): Spring2DState {
  return { x, y, vx: 0, vy: 0 };
}

/**
 * Clamps a displacement offset (dx, dy) from (baseX, baseY) so the dragged
 * core can roam freely anywhere inside the visible canvas while never
 * disappearing past the padded stage edges.
 */
export function clampCoreOffset(dx: number, dy: number, bounds: CanvasBounds): Vec2 {
  const minX = bounds.padding - bounds.baseX;
  const maxX = bounds.width - bounds.padding - bounds.baseX;
  const minY = bounds.padding - bounds.baseY;
  const maxY = bounds.height - bounds.padding - bounds.baseY;

  const loX = Math.min(minX, maxX);
  const hiX = Math.max(minX, maxX);
  const loY = Math.min(minY, maxY);
  const hiY = Math.max(minY, maxY);

  return {
    x: Math.min(hiX, Math.max(loX, dx)),
    y: Math.min(hiY, Math.max(loY, dy)),
  };
}

/**
 * Soft rubber-band radial clamp for bounded drag (e.g. sibling orbs or isometric wafer).
 */
export function clampRadialOffset(dx: number, dy: number, maxRadius: number): Vec2 {
  if (maxRadius <= 0) return { x: 0, y: 0 };
  const dist = Math.hypot(dx, dy);
  if (dist <= maxRadius || dist === 0) return { x: dx, y: dy };
  // Subtle rubber-band resistance beyond 82% of maxRadius, hard cap at maxRadius
  const scale = maxRadius / dist;
  return { x: dx * scale, y: dy * scale };
}

/**
 * Deterministic sub-stepped 2D damped harmonic spring integrator.
 * Unconditionally stable across 30Hz, 60Hz, 120Hz, or throttled frames.
 */
export function stepSpring2D(
  state: Spring2DState,
  targetX: number,
  targetY: number,
  dtSeconds: number,
  config: Spring2DConfig = CORE_RETURN_SPRING,
): { state: Spring2DState; settled: boolean } {
  const clampedDt = Math.min(0.08, Math.max(0, dtSeconds));
  const maxSubStep = 1 / 120;
  const steps = Math.max(1, Math.ceil(clampedDt / maxSubStep));
  const h = clampedDt / steps;

  let { x, y, vx, vy } = state;
  const { stiffness, damping } = config;
  const eps = config.settleEpsilon ?? 0.25;

  for (let i = 0; i < steps; i++) {
    const ax = -stiffness * (x - targetX) - damping * vx;
    const ay = -stiffness * (y - targetY) - damping * vy;
    vx += ax * h;
    vy += ay * h;
    x += vx * h;
    y += vy * h;
  }

  const dist = Math.hypot(x - targetX, y - targetY);
  const speed = Math.hypot(vx, vy);
  if (dist <= eps && speed <= eps * 2.5) {
    return {
      state: { x: targetX, y: targetY, vx: 0, vy: 0 },
      settled: true,
    };
  }

  return {
    state: { x, y, vx, vy },
    settled: false,
  };
}

/**
 * Subtle magnetic cursor lean when hovering on or near an interactive orb.
 */
export function computeMagneticPull(
  pointerX: number,
  pointerY: number,
  nodeX: number,
  nodeY: number,
  influenceRadius: number,
  maxPull: number,
): Vec2 {
  const dx = pointerX - nodeX;
  const dy = pointerY - nodeY;
  const dist = Math.hypot(dx, dy);
  if (dist === 0 || dist >= influenceRadius || influenceRadius <= 0) {
    return { x: 0, y: 0 };
  }
  const falloff = 1 - dist / influenceRadius;
  const strength = falloff * falloff * maxPull;
  return {
    x: (dx / dist) * strength,
    y: (dy / dist) * strength,
  };
}

/**
 * Sympathetic elastic follow offset for coupled neighbor nodes when the core moves.
 */
export function computeCoupledFollowOffset(coreOffset: Vec2, factor: number): Vec2 {
  return {
    x: coreOffset.x * factor,
    y: coreOffset.y * factor,
  };
}

/**
 * Normalized 0..1 tension level based on displacement magnitude.
 */
export function computeStretchTension(offsetX: number, offsetY: number, referenceSpan = 220): number {
  if (referenceSpan <= 0) return 0;
  return Math.min(1, Math.hypot(offsetX, offsetY) / referenceSpan);
}

/**
 * Clamps release velocity so fast flicks feel weighted and never explode off-screen.
 */
export function clampReleaseVelocity(vx: number, vy: number, maxSpeed = 1400): Vec2 {
  const speed = Math.hypot(vx, vy);
  if (speed <= maxSpeed || speed === 0) return { x: vx, y: vy };
  const s = maxSpeed / speed;
  return { x: vx * s, y: vy * s };
}
