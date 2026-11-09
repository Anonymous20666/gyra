export interface WavePointSample {
  /** Displaced 3D world Y height */
  y: number;
  /** Normalized crest height in [0, 1] */
  crest: number;
  /** Sharp ridge accent in [0, 1] */
  ridge: number;
  /** Central spine illumination intensity in [0, 1] */
  spineGlow: number;
  /** Combined illumination energy in [0, 1] */
  energy: number;
}

export interface CameraViewportConfig {
  cols: number;
  rows: number;
  spanX: number;
  spanZ: number;
  fovDeg: number;
  cameraY: number;
  cameraZ: number;
  waveScale: number;
}

/**
 * Computes responsive 3D grid density and camera framing for desktop, tablet, and mobile viewports.
 * Mobile viewports are recomposed (not merely cropped) so the central luminous wave structure
 * and flowing ridges fill portrait screens with balanced density.
 */
export function getResponsiveFieldConfig(
  width: number,
  height: number,
  isSoftwareGl = false
): CameraViewportConfig {
  const isMobile = width < 720;
  const isTablet = !isMobile && width < 1100;

  if (isMobile) {
    return {
      cols: isSoftwareGl ? 68 : 88,
      rows: isSoftwareGl ? 38 : 48,
      spanX: 16.5,
      spanZ: 14.0,
      fovDeg: 50,
      cameraY: 3.15,
      cameraZ: 8.8,
      waveScale: 1.08,
    };
  }

  if (isTablet) {
    return {
      cols: isSoftwareGl ? 88 : 112,
      rows: isSoftwareGl ? 44 : 56,
      spanX: 22.0,
      spanZ: 15.5,
      fovDeg: 45,
      cameraY: 3.35,
      cameraZ: 9.4,
      waveScale: 1.04,
    };
  }

  return {
    cols: isSoftwareGl ? 104 : 136,
    rows: isSoftwareGl ? 50 : 64,
    spanX: 27.0,
    spanZ: 16.8,
    fovDeg: 42,
    cameraY: 3.45,
    cameraZ: 9.8,
    waveScale: 1.0,
  };
}

/**
 * Pure mathematical 3D wave displacement matching the GPU GLSL vertex shader.
 * Produces a continuous, non-repeating multi-harmonic wave surface with a central
 * luminous spine and smooth pointer interaction.
 */
export function evaluateGyraWaveSurface(
  wx: number,
  wz: number,
  timeSec: number,
  scrollNorm: number,
  pointerWorldX: number,
  pointerWorldZ: number,
  pointerStrength = 1.0
): WavePointSample {
  const flowPhase = timeSec * 0.58 + scrollNorm * 1.85;

  // Primary sweeping wave ribbon (travels smoothly along X and Z)
  const w1 = Math.sin(wx * 0.34 - flowPhase * 1.15 + Math.cos(wz * 0.28 + flowPhase * 0.45) * 1.35);

  // Secondary cross-harmonic undulation creating sculpted 3D ridges and valleys
  const w2 = Math.cos(wz * 0.52 - flowPhase * 0.72 + Math.sin(wx * 0.22) * 1.2);

  // Tertiary fine interference ripples along the surface
  const w3 = Math.sin((wx * 0.68 + wz * 0.62) - flowPhase * 1.45) * 0.42;

  // Twist / ribbon envelope that focuses energy along a flowing S-curve corridor
  const ribbonCenterZ = Math.sin(wx * 0.19 - flowPhase * 0.35) * 1.65;
  const distFromRibbon = Math.abs(wz - ribbonCenterZ);
  const ribbonEnvelope = Math.exp(-Math.pow(distFromRibbon * 0.22, 2));

  // Central vertical/axial luminous spine (creates the signature Gyra core)
  const spineDist = Math.sqrt(Math.pow(wx * 0.16, 2) + Math.pow((wz - ribbonCenterZ) * 0.26, 2));
  const spineGlow = Math.exp(-spineDist * spineDist * 1.15);

  // Smooth Gaussian pointer ripple
  const dx = wx - pointerWorldX;
  const dz = wz - pointerWorldZ;
  const ptrDistSq = dx * dx + dz * dz;
  const ptrInfluence = Math.exp(-ptrDistSq / 7.5) * Math.max(0, Math.min(1, pointerStrength));
  const ptrWave = Math.cos(Math.sqrt(ptrDistSq) * 1.6 - timeSec * 2.4) * ptrInfluence * 0.38;

  // Combined 3D vertical displacement
  const rawWave = (w1 * 0.54 + w2 * 0.32 + w3 * 0.14) * (0.45 + 0.65 * ribbonEnvelope);
  const y = rawWave * 1.35 + ptrWave + spineGlow * 0.28 * Math.sin(timeSec * 0.7 + wx * 0.4);

  // Normalized crest and sharp ridge factor for lighting
  const crest = Math.max(0, Math.min(1, (rawWave + 1.05) / 2.1));
  const ridge = Math.pow(Math.max(0, Math.min(1, 0.5 + 0.5 * Math.sin(wx * 0.42 - wz * 0.48 - flowPhase * 1.2))), 3.2);

  const energy = Math.max(
    0,
    Math.min(1, crest * 0.52 + ridge * 0.28 + spineGlow * 0.42 + ptrInfluence * 0.35)
  );

  return {
    y,
    crest,
    ridge,
    spineGlow,
    energy,
  };
}

/**
 * Legacy compatibility wrapper used by existing unit tests and 2D fallback.
 */
export function computeWaveDisplacement(
  wx: number,
  wz: number,
  timeSec: number,
  scrollNorm: number,
  pointerX: number,
  pointerZ: number
) {
  const sample = evaluateGyraWaveSurface(
    wx * 0.018,
    wz * 0.018,
    timeSec,
    scrollNorm,
    pointerX * 0.018,
    pointerZ * 0.018,
    1.0
  );
  return {
    y: sample.y * 42,
    crest: sample.crest,
    ridge: sample.ridge,
    energy: sample.energy,
  };
}

export function projectPoint3D(
  wx: number,
  wy: number,
  wz: number,
  width: number,
  height: number,
  cameraPitchRad: number,
  fov: number
) {
  const cosP = Math.cos(cameraPitchRad);
  const sinP = Math.sin(cameraPitchRad);
  const ry = wy * cosP - wz * sinP;
  const rz = wy * sinP + wz * cosP + 520;

  if (rz <= 40) {
    return { sx: 0, sy: 0, scale: 0, depthAlpha: 0, visible: false };
  }

  const scale = fov / rz;
  const sx = width * 0.5 + wx * scale;
  const sy = height * 0.54 - ry * scale;

  const visible = sx >= -80 && sx <= width + 80 && sy >= -80 && sy <= height + 80;
  const depthNorm = Math.max(0, Math.min(1, (1150 - rz) / 920));
  const edgeFadeX = Math.max(0, Math.min(1, 1 - Math.pow((sx / width - 0.5) * 1.85, 4)));
  const depthAlpha = Math.pow(depthNorm, 1.35) * edgeFadeX;

  return { sx, sy, scale, depthAlpha, visible };
}

export function validatePromptInput(
  raw: string,
  maxLength = 2000
): { valid: boolean; cleaned: string; error?: string } {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return { valid: false, cleaned: "", error: "Please enter a prompt or question." };
  }
  if (cleaned.length > maxLength) {
    return {
      valid: false,
      cleaned: cleaned.slice(0, maxLength),
      error: `Prompt exceeds maximum length of ${maxLength} characters.`,
    };
  }
  return { valid: true, cleaned };
}

/**
 * Formats normalized scrubber progress [0, 1] into a 60fps cinema timecode and frame counter.
 */
export function formatVideoTimecode(
  progressNorm: number,
  durationSec = 8,
  fps = 60
): {
  clampedProgress: number;
  currentFrame: number;
  totalFrames: number;
  timecode: string;
} {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progressNorm) ? progressNorm : 0));
  const totalFrames = Math.max(1, Math.round(durationSec * fps));
  const currentFrame = Math.min(totalFrames, Math.round(clamped * totalFrames));
  const elapsedSec = Math.floor(currentFrame / fps);
  const frameRem = currentFrame % fps;

  const secStr = String(elapsedSec).padStart(2, "0");
  const frmStr = String(frameRem).padStart(2, "0");

  return {
    clampedProgress: clamped,
    currentFrame,
    totalFrames,
    timecode: `00:${secStr}:${frmStr}`,
  };
}

/**
 * Computes SaaS revenue forecast metrics and 12-month ARR progression for Card 4's Live UI Artifact.
 */
export function calculateSaasForecast(
  activeCustomers: number,
  monthlyArpu: number,
  netRetentionPct: number
): {
  currentMrr: number;
  projectedArr: number;
  expansionGainArr: number;
  monthlySeries: number[];
} {
  const safeCustomers = Math.max(1, Math.round(activeCustomers));
  const safeArpu = Math.max(1, monthlyArpu);
  const safeNrr = Math.max(50, Math.min(200, netRetentionPct));

  const currentMrr = safeCustomers * safeArpu;
  const monthlyGrowthFactor = Math.pow(safeNrr / 100, 1 / 12);

  const monthlySeries: number[] = [];
  let runningMrr = currentMrr;
  for (let m = 0; m < 12; m++) {
    if (m > 0) {
      runningMrr = runningMrr * monthlyGrowthFactor;
    }
    monthlySeries.push(Math.round(runningMrr));
  }

  const month12Mrr = monthlySeries[11] ?? currentMrr;
  const projectedArr = Math.round(month12Mrr * 12);
  const baselineArr = currentMrr * 12;
  const expansionGainArr = projectedArr - baselineArr;

  return {
    currentMrr,
    projectedArr,
    expansionGainArr,
    monthlySeries,
  };
}

export function clampComparisonSlider(percent: number): number {
  if (!Number.isFinite(percent)) return 50;
  return Math.max(4, Math.min(96, Math.round(percent)));
}

export function calculateInteriorBundle(
  selectedPrices: number[],
  budgetLimit = 1200
): {
  total: number;
  remaining: number;
  withinBudget: boolean;
} {
  const total = selectedPrices.reduce((acc, p) => acc + (Number.isFinite(p) ? p : 0), 0);
  const remaining = budgetLimit - total;
  return {
    total,
    remaining,
    withinBudget: total <= budgetLimit,
  };
}
