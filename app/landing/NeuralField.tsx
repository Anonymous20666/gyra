"use client";

import { useEffect, useRef } from "react";
import {
  evaluateGyraWaveSurface,
  getResponsiveFieldConfig,
  projectPoint3D,
} from "./fieldMath";

/**
 * Shared GPU 3D Wavefield Mathematics (`WAVE_COMMON_GLSL`)
 *
 * Sculpted 3D wave topology:
 * - Converges on the left horizon and sweeps across 3D space in braided upper & lower wave sheets
 * - Forms a natural 3D wave cradle beneath the central hero typography while sweeping upward on the wings
 * - Computes analytical wave slope derivatives (`dw1`, `dw2`) for caustic vertex bunching along wave crests
 * - Integrates a central luminous vertical/axial spine and silky-smooth Gaussian pointer displacement
 */
const WAVE_COMMON_GLSL = `
uniform float uTime;
uniform float uScroll;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPointerStrength;
uniform mat4 uProjView;
uniform float uWaveScale;

struct WaveVertex {
  vec3 worldPos;
  float crest;
  float ridge;
  float spine;
  float envelope;
  float depthFade;
  float textMask;
};

WaveVertex computeGyraWave(vec2 uv, float layerId, float spanX, float spanZ) {
  float u = uv.x * 2.0 - 1.0;
  float v = uv.y * 2.0 - 1.0;

  // Tapered horizon on the left (-u), opening into expansive 3D wave sheets across center & right (+u)
  float funnel = mix(0.20, 1.28, smoothstep(-1.0, 0.88, u));

  float wx = u * (spanX * 0.5);
  float wz = v * (spanZ * 0.5) * funnel;

  // Continuous, non-repeating wave flow
  float flow = uTime * 0.42 + uScroll * 1.45;

  // Flowing S-curve wave axis
  float axisZ = sin(wx * 0.16 - flow * 0.35) * 1.32 + cos(wx * 0.08 + flow * 0.21) * 0.48;
  float localZ = wz - axisZ * 0.42;

  // Octave 1: Primary macro rolling wave
  float p1 = wx * 0.37 - flow * 1.10 + sin(wz * 0.33 + flow * 0.42) * 1.32;
  float w1 = sin(p1);
  float dw1 = cos(p1);

  // Octave 2: Cross-harmonic sculpted ridges and valleys
  float p2 = localZ * 0.60 - flow * 0.76 + cos(wx * 0.26 - flow * 0.30) * 1.22;
  float w2 = cos(p2);
  float dw2 = -sin(p2);

  // Octave 3: Fine interference wavelets
  float p3 = (wx * 0.76 - localZ * 0.70) - flow * 1.48 + layerId * 1.35;
  float w3 = sin(p3) * 0.35;

  // Octave 4: Micro-topographic surface ripple
  float p4 = (wx * 1.32 + localZ * 1.12) - flow * 1.90;
  float w4 = cos(p4) * 0.15;

  // Braided upper & lower 3D wave sheets
  float sheetSign = (layerId > 0.5) ? 1.0 : -1.0;
  float braidWave = sin(wx * 0.23 - flow * 0.50 + layerId * 0.85) * 0.5 + 0.5;
  float sheetSeparation = sheetSign * (0.30 + 0.92 * braidWave) * funnel;

  // Cross-corridor Gaussian envelope
  float normDistZ = abs(localZ) / max(0.55, spanZ * 0.32 * funnel);
  float envelope = exp(-normDistZ * normDistZ * 1.80);

  // Outer wave rails
  float railDist = abs(abs(localZ) - (0.82 + 0.96 * braidWave) * funnel);
  float railBoost = exp(-railDist * railDist * 1.45) * envelope;

  // Central luminous spine
  float spineDist = length(vec2(wx * 0.16, localZ * 0.25));
  float spine = exp(-spineDist * spineDist * 1.30);

  // Restrained, damped pointer wave interaction
  vec2 ptrWorld = vec2(uPointer.x * (spanX * 0.36), uPointer.y * (spanZ * 0.30));
  float ptrDist = length(vec2(wx, wz) - ptrWorld);
  float ptrInfluence = exp(-(ptrDist * ptrDist) / 7.5) * uPointerStrength;
  float ptrWave = cos(ptrDist * 1.5 - uTime * 2.1) * ptrInfluence * 0.40;

  // Sculpted amphitheater cradle beneath central hero typography & Omni-Prompt box
  float centerDepression = exp(-pow(u * 2.1, 2.0)) * exp(-pow((v + 0.15) * 2.2, 2.0)) * 0.88;
  float wingLift = smoothstep(0.15, 0.85, u) * 0.72;

  float compositeWave = (w1 * 0.52 + w2 * 0.30 + w3 * 0.12 + w4 * 0.06);
  float wy = (
    compositeWave * (0.38 + 0.92 * envelope) * 1.45 * funnel +
    sheetSeparation * envelope +
    wingLift * envelope -
    centerDepression +
    ptrWave
  ) * uWaveScale;

  wy += spine * 0.26 * sin(uTime * 0.62 + wx * 0.34);

  // Caustic horizontal compression toward wave crests
  float causticShiftX = -dw1 * 0.19 * envelope * funnel;
  float causticShiftZ = -dw2 * 0.23 * envelope * funnel;

  float crest = clamp((compositeWave + 0.92) / 1.84, 0.0, 1.0);
  float slopeCurvature = clamp(1.0 - abs(dw1 * 0.58 + dw2 * 0.42), 0.0, 1.0);
  float ridge = pow(slopeCurvature, 2.7) * (0.45 + 0.55 * railBoost) * envelope;

  float edgeX = smoothstep(1.0, 0.74, abs(u));
  float edgeZ = smoothstep(1.0, 0.72, abs(v));
  float depthFade = edgeX * edgeZ * (0.12 + 0.88 * envelope);

  crest = clamp(crest * 0.78 + railBoost * 0.36 + ptrInfluence * 0.34 + spine * 0.25, 0.0, 1.0);

  WaveVertex outV;
  outV.worldPos = vec3(wx + causticShiftX, wy - 0.38, wz + causticShiftZ);
  outV.crest = crest;
  outV.ridge = clamp(ridge + railBoost * 0.38, 0.0, 1.0);
  outV.spine = clamp(spine + ptrInfluence * 0.40, 0.0, 1.0);
  outV.envelope = envelope;
  outV.depthFade = depthFade;
  outV.textMask = 1.0;
  return outV;
}

float computeTextReadabilityMask(vec4 clipPos) {
  vec2 ndc = clipPos.xy / max(0.001, clipPos.w);
  vec2 delta = vec2(ndc.x / 0.52, (ndc.y - 0.22) / 0.32);
  float dist = length(delta);
  return mix(0.08, 1.0, smoothstep(0.45, 1.15, dist));
}
`;

const BG_VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.999, 1.0);
}
`;

const BG_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform float uScroll;
uniform vec2 uPointer;
uniform vec2 uResolution;

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(1.0, uResolution.y);

  // 1. Deep Obsidian environment (#0A0A0C -> #0B0C10)
  vec3 obsidianBase = vec3(0.039, 0.039, 0.047);
  vec3 obsidianElevated = vec3(0.043, 0.047, 0.063);
  vec3 col = mix(obsidianBase, obsidianElevated, exp(-pow((uv.y - 0.46) * 2.4, 2.0)));

  // 2. Restrained Vertical Column / Spine of Light at center (Electric Indigo + Cool Slate)
  float spineX = 0.5 + uPointer.x * 0.025;
  float dx = (uv.x - spineX) * aspect;
  float dy = uv.y - (0.52 - uScroll * 0.05);

  float wideSpine = exp(-pow(dx * 2.5, 2.0)) * exp(-pow(dy * 1.25, 2.0));
  float verticalColumn = exp(-pow(dx * 10.5, 2.0)) * exp(-pow((uv.y - 0.54) * 1.15, 2.0));
  float spineWave = 0.78 + 0.22 * sin(uv.y * 12.0 - uTime * 0.75);
  float spineCore = exp(-pow(dx * 28.0, 2.0)) * smoothstep(0.06, 0.45, uv.y) * smoothstep(0.96, 0.55, uv.y) * spineWave;

  // 3. Flowing Axial Wave Corridor Volumetric Glow
  float waveAxisY = 0.40 + 0.06 * sin((uv.x - 0.42) * 2.9 - uTime * 0.28) - uScroll * 0.04;
  float corridorDist = abs(uv.y - waveAxisY);
  float corridorGlow = exp(-pow(corridorDist * 4.5, 2.0)) * smoothstep(0.0, 0.35, uv.x) * smoothstep(1.0, 0.65, uv.x);

  float breath = 0.94 + 0.06 * sin(uTime * 0.42);

  vec3 electricIndigo = vec3(0.310, 0.431, 0.969); // #4F6EF7
  vec3 coolSapphire = vec3(0.220, 0.360, 0.780);
  vec3 crispIce = vec3(0.720, 0.820, 1.0);

  col += coolSapphire * wideSpine * 0.11 * breath;
  col += electricIndigo * verticalColumn * 0.09 * breath;
  col += crispIce * spineCore * 0.05 * breath;
  col += mix(coolSapphire, electricIndigo, 0.45) * corridorGlow * 0.075 * breath;

  gl_FragColor = vec4(col, 1.0);
}
`;

const MESH_VERTEX_SHADER = `
attribute vec3 aGridCoord;
uniform float uSpanX;
uniform float uSpanZ;

varying float vCrest;
varying float vRidge;
varying float vSpine;
varying float vAlpha;

${WAVE_COMMON_GLSL}

void main() {
  WaveVertex wv = computeGyraWave(aGridCoord.xy, aGridCoord.z, uSpanX, uSpanZ);
  vec4 clipPos = uProjView * vec4(wv.worldPos, 1.0);
  gl_Position = clipPos;

  vCrest = wv.crest;
  vRidge = wv.ridge;
  vSpine = wv.spine;

  float textSafeMask = computeTextReadabilityMask(clipPos);
  float crestGate = smoothstep(0.42, 0.88, wv.crest + wv.ridge * 0.58);
  float layerWeight = (aGridCoord.z > 0.5) ? 0.65 : 1.0;

  float rawAlpha = crestGate * (0.09 + wv.ridge * 0.30 + pow(wv.crest, 2.0) * 0.22 + wv.spine * 0.14);
  vAlpha = clamp(rawAlpha * wv.depthFade * layerWeight * textSafeMask, 0.0, 0.34);
}
`;

const MESH_FRAGMENT_SHADER = `
precision mediump float;
varying float vCrest;
varying float vRidge;
varying float vSpine;
varying float vAlpha;

void main() {
  if (vAlpha < 0.01) discard;

  vec3 slateIndigo = vec3(0.20, 0.30, 0.68);
  vec3 electricIndigo = vec3(0.310, 0.431, 0.969);
  vec3 ridgeHighlight = vec3(0.76, 0.85, 1.0);

  float t = clamp(vCrest * 0.72 + vRidge * 0.60 + vSpine * 0.30, 0.0, 1.0);
  vec3 col = mix(slateIndigo, electricIndigo, t);
  col = mix(col, ridgeHighlight, pow(clamp(vRidge, 0.0, 1.0), 2.2) * 0.52);

  gl_FragColor = vec4(col, vAlpha);
}
`;

const POINT_VERTEX_SHADER = `
attribute vec3 aGridCoord;
uniform float uSpanX;
uniform float uSpanZ;
uniform float uDpr;

varying float vCrest;
varying float vRidge;
varying float vSpine;
varying float vAlpha;

${WAVE_COMMON_GLSL}

void main() {
  WaveVertex wv = computeGyraWave(aGridCoord.xy, aGridCoord.z, uSpanX, uSpanZ);
  vec4 clipPos = uProjView * vec4(wv.worldPos, 1.0);
  gl_Position = clipPos;

  vCrest = wv.crest;
  vRidge = wv.ridge;
  vSpine = wv.spine;

  float textSafeMask = computeTextReadabilityMask(clipPos);
  float layerWeight = (aGridCoord.z > 0.5) ? 0.76 : 1.0;

  float lum = 0.04 + pow(wv.crest, 1.75) * 0.62 + wv.ridge * 0.58 + wv.spine * 0.34;
  vAlpha = clamp(lum * wv.depthFade * layerWeight * textSafeMask, 0.0, 0.88);

  float dist = max(2.4, clipPos.w);
  float sizeFactor = 1.2 + pow(wv.crest, 1.5) * 2.25 + wv.ridge * 1.80 + wv.spine * 1.05;
  gl_PointSize = clamp((sizeFactor * 8.2 / dist) * uDpr, 1.0 * uDpr, 5.2 * uDpr);
}
`;

const POINT_FRAGMENT_SHADER = `
precision mediump float;
varying float vCrest;
varying float vRidge;
varying float vSpine;
varying float vAlpha;

void main() {
  if (vAlpha < 0.015) discard;

  vec2 cxy = 2.0 * gl_PointCoord - 1.0;
  float r2 = dot(cxy, cxy);
  if (r2 > 1.0) discard;

  float core = exp(-r2 * 4.6);
  float halo = exp(-r2 * 1.75) * 0.38;
  float shape = clamp(core + halo, 0.0, 1.0);

  vec3 valleySlate = vec3(0.20, 0.28, 0.58);
  vec3 electricIndigo = vec3(0.310, 0.431, 0.969);
  vec3 crestPeak = vec3(0.88, 0.93, 1.0);

  vec3 col = mix(valleySlate, electricIndigo, clamp(vCrest * 0.82 + vSpine * 0.35, 0.0, 1.0));
  col = mix(col, crestPeak, core * clamp(vRidge + pow(vCrest, 2.0) * 0.6, 0.0, 1.0) * 0.80);

  gl_FragColor = vec4(col, vAlpha * shape);
}
`;

const BAR_VERTEX_SHADER = `
attribute vec4 aBarAttr;
attribute float aBarSeed;
uniform float uSpanX;
uniform float uSpanZ;

varying vec2 vBarUv;
varying float vAlpha;

${WAVE_COMMON_GLSL}

void main() {
  float uBase = aBarAttr.x;
  float vBase = aBarAttr.y;
  float along = aBarAttr.z;
  float side = aBarAttr.w;
  float seed = aBarSeed;

  float speed = 0.050 + fract(seed * 7.13) * 0.068;
  float travelU = fract(uBase + uTime * speed + seed + uScroll * 0.14);

  float barLen = 0.026 + fract(seed * 13.7) * 0.048;
  float stepShift = (along > 0.48 && fract(seed * 23.1) > 0.55) ? 0.012 : 0.0;

  vec2 uv = vec2(
    clamp(travelU + along * barLen, 0.02, 0.98),
    clamp(vBase + stepShift, 0.15, 0.85)
  );

  float layerId = (fract(seed * 5.3) > 0.45) ? 1.0 : 0.0;
  WaveVertex wv = computeGyraWave(uv, layerId, uSpanX, uSpanZ);

  vec3 pos = wv.worldPos * vec3(1.0, 0.72, 1.0);
  vec4 clipPos = uProjView * vec4(pos, 1.0);

  float thicknessPx = 2.0 + fract(seed * 19.7) * 2.2;
  clipPos.y += side * (thicknessPx / max(300.0, uResolution.y)) * clipPos.w;

  gl_Position = clipPos;

  float textSafeMask = computeTextReadabilityMask(clipPos);
  float travelEnvelope = sin(travelU * 3.14159265);

  vBarUv = vec2(along, side);
  vAlpha = clamp(travelEnvelope * wv.envelope * wv.depthFade * (0.26 + wv.crest * 0.48 + wv.spine * 0.30) * textSafeMask, 0.0, 0.76);
}
`;

const BAR_FRAGMENT_SHADER = `
precision mediump float;
varying vec2 vBarUv;
varying float vAlpha;

void main() {
  if (vAlpha < 0.015) discard;

  float endFade = smoothstep(0.0, 0.18, vBarUv.x) * smoothstep(1.0, 0.82, vBarUv.x);
  float crossCore = exp(-pow(vBarUv.y * 2.4, 2.0));
  float crossHalo = exp(-pow(vBarUv.y * 1.15, 2.0)) * 0.42;
  float profile = clamp(crossCore + crossHalo, 0.0, 1.0) * endFade;

  vec3 tailSlate = vec3(0.22, 0.34, 0.75);
  vec3 leadIndigo = vec3(0.310, 0.431, 0.969);
  vec3 hotCore = vec3(0.84, 0.91, 1.0);

  vec3 col = mix(tailSlate, leadIndigo, vBarUv.x);
  col = mix(col, hotCore, crossCore * vBarUv.x * 0.72);

  gl_FragColor = vec4(col, vAlpha * profile);
}
`;

function buildProjViewMatrix(
  fovDeg: number,
  aspect: number,
  near: number,
  far: number,
  eye: [number, number, number],
  target: [number, number, number],
  up: [number, number, number],
  out: Float32Array
) {
  const f = 1.0 / Math.tan((fovDeg * Math.PI) / 360.0);
  const nf = 1.0 / (near - far);

  const p00 = f / Math.max(0.2, aspect);
  const p11 = f;
  const p22 = (far + near) * nf;
  const p23 = -1.0;
  const p32 = 2.0 * far * near * nf;

  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len;
  zy /= len;
  zz /= len;

  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len;
  xy /= len;
  xz /= len;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  const tx = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  const ty = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  const tz = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);

  out[0] = p00 * xx;
  out[1] = p11 * yx;
  out[2] = p22 * zx;
  out[3] = p23 * zx;

  out[4] = p00 * xy;
  out[5] = p11 * yy;
  out[6] = p22 * zy;
  out[7] = p23 * zy;

  out[8] = p00 * xz;
  out[9] = p11 * yz;
  out[10] = p22 * zz;
  out[11] = p23 * zz;

  out[12] = p00 * tx;
  out[13] = p11 * ty;
  out[14] = p22 * tz + p32;
  out[15] = p23 * tz;
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

interface GlResources {
  bgProgram: WebGLProgram;
  meshProgram: WebGLProgram;
  pointProgram: WebGLProgram;
  barProgram: WebGLProgram;
  bgQuadBuffer: WebGLBuffer | null;
  gridVertexBuffer: WebGLBuffer | null;
  gridIndexBuffer: WebGLBuffer | null;
  barBuffer: WebGLBuffer | null;
  bgLoc: {
    aPos: number;
    uTime: WebGLUniformLocation | null;
    uScroll: WebGLUniformLocation | null;
    uPointer: WebGLUniformLocation | null;
    uResolution: WebGLUniformLocation | null;
  };
  meshLoc: {
    aGridCoord: number;
    uTime: WebGLUniformLocation | null;
    uScroll: WebGLUniformLocation | null;
    uResolution: WebGLUniformLocation | null;
    uPointer: WebGLUniformLocation | null;
    uPointerStrength: WebGLUniformLocation | null;
    uProjView: WebGLUniformLocation | null;
    uSpanX: WebGLUniformLocation | null;
    uSpanZ: WebGLUniformLocation | null;
    uWaveScale: WebGLUniformLocation | null;
  };
  pointLoc: {
    aGridCoord: number;
    uTime: WebGLUniformLocation | null;
    uScroll: WebGLUniformLocation | null;
    uResolution: WebGLUniformLocation | null;
    uPointer: WebGLUniformLocation | null;
    uPointerStrength: WebGLUniformLocation | null;
    uProjView: WebGLUniformLocation | null;
    uSpanX: WebGLUniformLocation | null;
    uSpanZ: WebGLUniformLocation | null;
    uWaveScale: WebGLUniformLocation | null;
    uDpr: WebGLUniformLocation | null;
  };
  barLoc: {
    aBarAttr: number;
    aBarSeed: number;
    uTime: WebGLUniformLocation | null;
    uScroll: WebGLUniformLocation | null;
    uResolution: WebGLUniformLocation | null;
    uPointer: WebGLUniformLocation | null;
    uPointerStrength: WebGLUniformLocation | null;
    uProjView: WebGLUniformLocation | null;
    uSpanX: WebGLUniformLocation | null;
    uSpanZ: WebGLUniformLocation | null;
    uWaveScale: WebGLUniformLocation | null;
  };
}

export default function NeuralField() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReduced = reducedMotionQuery.matches;

    const glContext =
      (canvas.getContext("webgl2", {
        alpha: false,
        antialias: true,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }) as WebGL2RenderingContext | null) ||
      (canvas.getContext("webgl", {
        alpha: false,
        antialias: true,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      }) as WebGLRenderingContext | null);

    let isSoftwareGl = false;
    if (glContext) {
      const dbg = glContext.getExtension("WEBGL_debug_renderer_info");
      const rendererParam = dbg ? dbg.UNMASKED_RENDERER_WEBGL : glContext.RENDERER;
      const rendererStr = String(glContext.getParameter(rendererParam) || "");
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
    }

    const pointer = {
      tx: 0,
      ty: 0,
      x: 0,
      y: 0,
      targetStrength: 0.16,
      strength: 0.16,
    };

    let scrollNorm = 0;
    let smoothScroll = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = isSoftwareGl ? 1 : Math.min(2, window.devicePixelRatio || 1);
    let frameId = 0;
    let timerId = 0;
    let running = false;
    let contextLost = false;
    let heroVisible = true;
    let lastNow = performance.now();
    let elapsedSec = 4.2;

    if (!glContext) {
      const ctx2d = canvas.getContext("2d", { alpha: false });
      if (!ctx2d) return;

      const drawFallback = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        ctx2d.fillStyle = "#0A0A0C";
        ctx2d.fillRect(0, 0, width, height);

        const cols = width < 720 ? 52 : 84;
        const rows = width < 720 ? 28 : 42;
        const spanX = width < 720 ? 920 : 1480;
        const spanZ = 820;

        for (let r = 0; r < rows; r++) {
          const wz = -180 + (r / (rows - 1)) * spanZ;
          for (let c = 0; c < cols; c++) {
            const wx = (c / (cols - 1) - 0.5) * spanX;
            const w = evaluateGyraWaveSurface(wx * 0.016, wz * 0.016, elapsedSec, smoothScroll, 0, 0, 0.2);
            const p = projectPoint3D(wx, w.y * 42 - 44, wz, width, height, 0.36, 620);
            if (p.visible && w.energy * p.depthAlpha > 0.06) {
              const alpha = Math.min(0.85, w.energy * p.depthAlpha * 0.75);
              ctx2d.fillStyle = `rgba(79, 110, 247, ${alpha.toFixed(3)})`;
              ctx2d.beginPath();
              ctx2d.arc(p.sx, p.sy, Math.max(1, 1.8 * p.scale), 0, Math.PI * 2);
              ctx2d.fill();
            }
          }
        }
      };

      drawFallback();
      window.addEventListener("resize", drawFallback, { passive: true });
      return () => window.removeEventListener("resize", drawFallback);
    }

    const gl = glContext;
    const barCount = isSoftwareGl ? 90 : 140;
    const barVertexTotal = barCount * 6;
    const projViewMatrix = new Float32Array(16);
    let camConfig = getResponsiveFieldConfig(width, height, isSoftwareGl);
    let currentGridKey = "";
    let meshIndexCount = 0;
    let pointVertexCount = 0;
    let res: GlResources | null = null;

    function initGlResources(): GlResources | null {
      const bgProgram = createProgram(gl, BG_VERTEX_SHADER, BG_FRAGMENT_SHADER);
      const meshProgram = createProgram(gl, MESH_VERTEX_SHADER, MESH_FRAGMENT_SHADER);
      const pointProgram = createProgram(gl, POINT_VERTEX_SHADER, POINT_FRAGMENT_SHADER);
      const barProgram = createProgram(gl, BAR_VERTEX_SHADER, BAR_FRAGMENT_SHADER);

      if (!bgProgram || !meshProgram || !pointProgram || !barProgram) {
        return null;
      }

      const bgQuadBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, bgQuadBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
      );

      const gridVertexBuffer = gl.createBuffer();
      const gridIndexBuffer = gl.createBuffer();

      const barBuffer = gl.createBuffer();
      const barData = new Float32Array(barVertexTotal * 5);
      let bPtr = 0;
      const quadCorners: [number, number][] = [
        [0.0, -1.0],
        [1.0, -1.0],
        [0.0, 1.0],
        [0.0, 1.0],
        [1.0, -1.0],
        [1.0, 1.0],
      ];
      for (let i = 0; i < barCount; i++) {
        const h1 = Math.sin(i * 12.9898 + 1.23) * 43758.5453;
        const uBase = h1 - Math.floor(h1);
        const h2 = Math.sin(i * 78.233 + 4.56) * 43758.5453;
        const vNorm = h2 - Math.floor(h2);
        const vBase = 0.5 + (vNorm - 0.5) * 0.48;
        const h3 = Math.sin(i * 37.719 + 9.12) * 43758.5453;
        const seed = h3 - Math.floor(h3);

        for (let c = 0; c < 6; c++) {
          barData[bPtr++] = uBase;
          barData[bPtr++] = vBase;
          barData[bPtr++] = quadCorners[c][0];
          barData[bPtr++] = quadCorners[c][1];
          barData[bPtr++] = seed;
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, barBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, barData, gl.STATIC_DRAW);

      return {
        bgProgram,
        meshProgram,
        pointProgram,
        barProgram,
        bgQuadBuffer,
        gridVertexBuffer,
        gridIndexBuffer,
        barBuffer,
        bgLoc: {
          aPos: gl.getAttribLocation(bgProgram, "aPos"),
          uTime: gl.getUniformLocation(bgProgram, "uTime"),
          uScroll: gl.getUniformLocation(bgProgram, "uScroll"),
          uPointer: gl.getUniformLocation(bgProgram, "uPointer"),
          uResolution: gl.getUniformLocation(bgProgram, "uResolution"),
        },
        meshLoc: {
          aGridCoord: gl.getAttribLocation(meshProgram, "aGridCoord"),
          uTime: gl.getUniformLocation(meshProgram, "uTime"),
          uScroll: gl.getUniformLocation(meshProgram, "uScroll"),
          uResolution: gl.getUniformLocation(meshProgram, "uResolution"),
          uPointer: gl.getUniformLocation(meshProgram, "uPointer"),
          uPointerStrength: gl.getUniformLocation(meshProgram, "uPointerStrength"),
          uProjView: gl.getUniformLocation(meshProgram, "uProjView"),
          uSpanX: gl.getUniformLocation(meshProgram, "uSpanX"),
          uSpanZ: gl.getUniformLocation(meshProgram, "uSpanZ"),
          uWaveScale: gl.getUniformLocation(meshProgram, "uWaveScale"),
        },
        pointLoc: {
          aGridCoord: gl.getAttribLocation(pointProgram, "aGridCoord"),
          uTime: gl.getUniformLocation(pointProgram, "uTime"),
          uScroll: gl.getUniformLocation(pointProgram, "uScroll"),
          uResolution: gl.getUniformLocation(pointProgram, "uResolution"),
          uPointer: gl.getUniformLocation(pointProgram, "uPointer"),
          uPointerStrength: gl.getUniformLocation(pointProgram, "uPointerStrength"),
          uProjView: gl.getUniformLocation(pointProgram, "uProjView"),
          uSpanX: gl.getUniformLocation(pointProgram, "uSpanX"),
          uSpanZ: gl.getUniformLocation(pointProgram, "uSpanZ"),
          uWaveScale: gl.getUniformLocation(pointProgram, "uWaveScale"),
          uDpr: gl.getUniformLocation(pointProgram, "uDpr"),
        },
        barLoc: {
          aBarAttr: gl.getAttribLocation(barProgram, "aBarAttr"),
          aBarSeed: gl.getAttribLocation(barProgram, "aBarSeed"),
          uTime: gl.getUniformLocation(barProgram, "uTime"),
          uScroll: gl.getUniformLocation(barProgram, "uScroll"),
          uResolution: gl.getUniformLocation(barProgram, "uResolution"),
          uPointer: gl.getUniformLocation(barProgram, "uPointer"),
          uPointerStrength: gl.getUniformLocation(barProgram, "uPointerStrength"),
          uProjView: gl.getUniformLocation(barProgram, "uProjView"),
          uSpanX: gl.getUniformLocation(barProgram, "uSpanX"),
          uSpanZ: gl.getUniformLocation(barProgram, "uSpanZ"),
          uWaveScale: gl.getUniformLocation(barProgram, "uWaveScale"),
        },
      };
    }

    function disposeGlResources(r: GlResources | null) {
      if (!r) return;
      try {
        if (r.bgQuadBuffer) gl.deleteBuffer(r.bgQuadBuffer);
        if (r.gridVertexBuffer) gl.deleteBuffer(r.gridVertexBuffer);
        if (r.gridIndexBuffer) gl.deleteBuffer(r.gridIndexBuffer);
        if (r.barBuffer) gl.deleteBuffer(r.barBuffer);
        gl.deleteProgram(r.bgProgram);
        gl.deleteProgram(r.meshProgram);
        gl.deleteProgram(r.pointProgram);
        gl.deleteProgram(r.barProgram);
      } catch {}
    }

    function rebuildGridBuffers(baseCols: number, baseRows: number, force = false) {
      if (!res || contextLost) return;
      const cols = Math.min(180, Math.round(baseCols * 1.28));
      const rows = Math.min(84, Math.round(baseRows * 1.25));
      const key = `${cols}x${rows}`;
      if (!force && key === currentGridKey) return;
      currentGridKey = key;

      const rowsLayer1 = Math.max(20, Math.floor(rows * 0.58));
      const colsLayer1 = Math.max(40, Math.floor(cols * 0.72));

      const count0 = cols * rows;
      const count1 = colsLayer1 * rowsLayer1;
      pointVertexCount = count0 + count1;

      const vertices = new Float32Array(pointVertexCount * 3);
      let vPtr = 0;

      for (let r = 0; r < rows; r++) {
        const v = r / Math.max(1, rows - 1);
        for (let c = 0; c < cols; c++) {
          const u = c / Math.max(1, cols - 1);
          vertices[vPtr++] = u;
          vertices[vPtr++] = v;
          vertices[vPtr++] = 0.0;
        }
      }

      for (let r = 0; r < rowsLayer1; r++) {
        const v = r / Math.max(1, rowsLayer1 - 1);
        for (let c = 0; c < colsLayer1; c++) {
          const u = c / Math.max(1, colsLayer1 - 1);
          vertices[vPtr++] = u;
          vertices[vPtr++] = v;
          vertices[vPtr++] = 1.0;
        }
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, res.gridVertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const indicesList: number[] = [];

      for (let r = 0; r < rows; r += 2) {
        const rowOffset = r * cols;
        for (let c = 0; c < cols; c += 2) {
          const idx = rowOffset + c;
          if (c + 2 < cols) {
            indicesList.push(idx, idx + 2);
          }
          if (r + 2 < rows) {
            indicesList.push(idx, idx + cols * 2);
          }
          if (c + 2 < cols && r + 2 < rows) {
            indicesList.push(idx, idx + cols * 2 + 2);
          }
        }
      }

      const base1 = count0;
      for (let r = 0; r < rowsLayer1; r += 2) {
        const rowOffset = base1 + r * colsLayer1;
        for (let c = 0; c < colsLayer1; c += 2) {
          const idx = rowOffset + c;
          if (c + 2 < colsLayer1) {
            indicesList.push(idx, idx + 2);
          }
          if (c + 2 < colsLayer1 && r + 2 < rowsLayer1) {
            indicesList.push(idx, idx + colsLayer1 * 2 + 2);
          }
        }
      }

      const indices = new Uint16Array(indicesList);
      meshIndexCount = indices.length;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, res.gridIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }

    function updateViewport(forceRebuild = false) {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = isSoftwareGl ? 1 : Math.min(2, window.devicePixelRatio || 1);

      canvas!.width = Math.max(1, Math.round(width * dpr));
      canvas!.height = Math.max(1, Math.round(height * dpr));
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;

      if (!contextLost) {
        gl.viewport(0, 0, canvas!.width, canvas!.height);
        camConfig = getResponsiveFieldConfig(width, height, isSoftwareGl);
        rebuildGridBuffers(camConfig.cols, camConfig.rows, forceRebuild);
      }
    }

    function renderScene(now: number) {
      if (contextLost || !res) return;

      const dt = Math.min(0.05, Math.max(0.001, (now - lastNow) * 0.001));
      lastNow = now;

      if (!prefersReduced) {
        elapsedSec += dt;
      }

      const damp = 1.0 - Math.exp(-3.6 * dt);
      pointer.x += (pointer.tx - pointer.x) * damp;
      pointer.y += (pointer.ty - pointer.y) * damp;
      pointer.strength += (pointer.targetStrength - pointer.strength) * damp;
      pointer.targetStrength = Math.max(0.15, pointer.targetStrength - dt * 0.22);

      smoothScroll += (scrollNorm - smoothScroll) * (1.0 - Math.exp(-4.2 * dt));

      const aspect = width / Math.max(1, height);
      const eyeX = -0.50 + pointer.x * 0.50;
      const eyeY = camConfig.cameraY * 0.66 + smoothScroll * 0.45 - pointer.y * 0.25;
      const eyeZ = camConfig.cameraZ * 0.96 - smoothScroll * 0.35;
      const targetX = 0.30 + pointer.x * 0.16;
      const targetY = -0.32 - smoothScroll * 0.20;
      const targetZ = -0.8;

      buildProjViewMatrix(
        camConfig.fovDeg,
        aspect,
        0.1,
        60.0,
        [eyeX, eyeY, eyeZ],
        [targetX, targetY, targetZ],
        [0, 1, 0],
        projViewMatrix
      );

      // PASS 1: Deep obsidian environment & central vertical light spine
      gl.disable(gl.BLEND);
      gl.useProgram(res.bgProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, res.bgQuadBuffer);
      gl.enableVertexAttribArray(res.bgLoc.aPos);
      gl.vertexAttribPointer(res.bgLoc.aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(res.bgLoc.uTime, elapsedSec);
      gl.uniform1f(res.bgLoc.uScroll, smoothScroll);
      gl.uniform2f(res.bgLoc.uPointer, pointer.x, pointer.y);
      gl.uniform2f(res.bgLoc.uResolution, width, height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

      // PASS 2: Selective Geodesic Wave Crest Lattice (GL_LINES)
      gl.useProgram(res.meshProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, res.gridVertexBuffer);
      gl.enableVertexAttribArray(res.meshLoc.aGridCoord);
      gl.vertexAttribPointer(res.meshLoc.aGridCoord, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, res.gridIndexBuffer);

      gl.uniform1f(res.meshLoc.uTime, elapsedSec);
      gl.uniform1f(res.meshLoc.uScroll, smoothScroll);
      gl.uniform2f(res.meshLoc.uResolution, width, height);
      gl.uniform2f(res.meshLoc.uPointer, pointer.x, pointer.y);
      gl.uniform1f(res.meshLoc.uPointerStrength, pointer.strength);
      gl.uniformMatrix4fv(res.meshLoc.uProjView, false, projViewMatrix);
      gl.uniform1f(res.meshLoc.uSpanX, camConfig.spanX);
      gl.uniform1f(res.meshLoc.uSpanZ, camConfig.spanZ);
      gl.uniform1f(res.meshLoc.uWaveScale, camConfig.waveScale);

      gl.drawElements(gl.LINES, meshIndexCount, gl.UNSIGNED_SHORT, 0);

      // PASS 3: Volumetric Optical Light Bars & Circuit Conduits (GL_TRIANGLES)
      gl.useProgram(res.barProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, res.barBuffer);
      gl.enableVertexAttribArray(res.barLoc.aBarAttr);
      gl.vertexAttribPointer(res.barLoc.aBarAttr, 4, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(res.barLoc.aBarSeed);
      gl.vertexAttribPointer(res.barLoc.aBarSeed, 1, gl.FLOAT, false, 20, 16);

      gl.uniform1f(res.barLoc.uTime, elapsedSec);
      gl.uniform1f(res.barLoc.uScroll, smoothScroll);
      gl.uniform2f(res.barLoc.uResolution, width, height);
      gl.uniform2f(res.barLoc.uPointer, pointer.x, pointer.y);
      gl.uniform1f(res.barLoc.uPointerStrength, pointer.strength);
      gl.uniformMatrix4fv(res.barLoc.uProjView, false, projViewMatrix);
      gl.uniform1f(res.barLoc.uSpanX, camConfig.spanX);
      gl.uniform1f(res.barLoc.uSpanZ, camConfig.spanZ);
      gl.uniform1f(res.barLoc.uWaveScale, camConfig.waveScale);

      gl.drawArrays(gl.TRIANGLES, 0, barVertexTotal);

      // PASS 4: High-Density Structured 3D Surface Nodes (GL_POINTS)
      gl.useProgram(res.pointProgram);
      gl.bindBuffer(gl.ARRAY_BUFFER, res.gridVertexBuffer);
      gl.enableVertexAttribArray(res.pointLoc.aGridCoord);
      gl.vertexAttribPointer(res.pointLoc.aGridCoord, 3, gl.FLOAT, false, 0, 0);

      gl.uniform1f(res.pointLoc.uTime, elapsedSec);
      gl.uniform1f(res.pointLoc.uScroll, smoothScroll);
      gl.uniform2f(res.pointLoc.uResolution, width, height);
      gl.uniform2f(res.pointLoc.uPointer, pointer.x, pointer.y);
      gl.uniform1f(res.pointLoc.uPointerStrength, pointer.strength);
      gl.uniformMatrix4fv(res.pointLoc.uProjView, false, projViewMatrix);
      gl.uniform1f(res.pointLoc.uSpanX, camConfig.spanX);
      gl.uniform1f(res.pointLoc.uSpanZ, camConfig.spanZ);
      gl.uniform1f(res.pointLoc.uWaveScale, camConfig.waveScale);
      gl.uniform1f(res.pointLoc.uDpr, dpr);

      gl.drawArrays(gl.POINTS, 0, pointVertexCount);
    }

    function afterDraw(cb: () => void) {
      const gl2 = gl as WebGL2RenderingContext;
      if (typeof gl2.fenceSync === "function") {
        const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl2.flush();
        const poll = () => {
          if (!running) return;
          const state = sync && gl2.getSyncParameter(sync, gl2.SYNC_STATUS);
          if (state === gl2.UNSIGNALED) {
            timerId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl2.deleteSync(sync);
            timerId = window.setTimeout(cb, 80);
          }
        };
        timerId = window.setTimeout(poll, 5);
      } else {
        gl.flush();
        timerId = window.setTimeout(cb, 80);
      }
    }

    function tick(now: number) {
      frameId = 0;
      if (!running || contextLost) return;
      renderScene(now);
      if (prefersReduced) return;

      if (isSoftwareGl) {
        afterDraw(() => {
          if (running && !contextLost) frameId = requestAnimationFrame(tick);
        });
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    function start() {
      if (contextLost) return;
      if (prefersReduced) {
        lastNow = performance.now();
        renderScene(lastNow);
        canvas?.setAttribute("data-field-state", "reduced-motion");
        return;
      }
      if (running) return;
      running = true;
      canvas?.setAttribute("data-field-state", "active");
      lastNow = performance.now();
      frameId = requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      if (!contextLost) {
        canvas?.setAttribute("data-field-state", "paused");
      }
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
      if (timerId) {
        clearTimeout(timerId);
        timerId = 0;
      }
    }

    function syncLifecycle() {
      if (contextLost) {
        stop();
        return;
      }
      if (document.hidden || !heroVisible) {
        stop();
      } else {
        start();
      }
    }

    // PART 1: WebGL Context Loss & Restoration Recovery
    function handleContextLost(e: Event) {
      e.preventDefault();
      contextLost = true;
      stop();
      canvas?.setAttribute("data-field-state", "context-lost");
    }

    function handleContextRestored() {
      contextLost = false;
      currentGridKey = "";
      res = initGlResources();
      if (res) {
        updateViewport(true);
        renderScene(performance.now());
        canvas?.setAttribute("data-field-state", "active");
        syncLifecycle();
      }
    }

    function handleResize() {
      updateViewport();
      renderScene(performance.now());
    }

    function handlePointerMove(e: MouseEvent) {
      if (width <= 0 || height <= 0) return;
      pointer.tx = (e.clientX / width - 0.5) * 2.0;
      pointer.ty = (e.clientY / height - 0.5) * 2.0;
      pointer.targetStrength = 0.85;
    }

    function handleTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch || width <= 0 || height <= 0) return;
      pointer.tx = (touch.clientX / width - 0.5) * 2.0;
      pointer.ty = (touch.clientY / height - 0.5) * 2.0;
      pointer.targetStrength = 0.75;
    }

    function handleScroll() {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollNorm = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      if (prefersReduced && !contextLost) {
        renderScene(performance.now());
      }
    }

    function handleVisibility() {
      syncLifecycle();
    }

    const onReducedMotionChange = (e: MediaQueryListEvent) => {
      prefersReduced = e.matches;
      if (prefersReduced) {
        stop();
        renderScene(performance.now());
      } else {
        syncLifecycle();
      }
    };

    // Initialize shaders and buffers
    res = initGlResources();
    if (!res) return;

    // PART 1: IntersectionObserver lifecycle optimization — pause rAF loop when user scrolls past hero
    let heroObserver: IntersectionObserver | null = null;
    const heroTarget = document.getElementById("top") || wrapRef.current;
    if (typeof IntersectionObserver !== "undefined" && heroTarget) {
      heroObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) {
            heroVisible = entry.isIntersecting;
            syncLifecycle();
          }
        },
        { rootMargin: "0px", threshold: 0 }
      );
      heroObserver.observe(heroTarget);
    }

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    canvas.addEventListener("webglcontextrestored", handleContextRestored, false);
    reducedMotionQuery.addEventListener("change", onReducedMotionChange);
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);

    updateViewport(true);
    handleScroll();
    syncLifecycle();

    return () => {
      stop();
      heroObserver?.disconnect();
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
      disposeGlResources(res);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      data-testid="gyra-living-field-wrap"
      className="gy-living-field-wrap"
      style={{ backgroundColor: "#0A0A0C" }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        data-testid="gyra-living-field"
        data-field-state="active"
        data-engine="webgl-luminous-wavefield"
        className="gy-living-field"
        style={{ backgroundColor: "#0A0A0C" }}
      />
    </div>
  );
}
