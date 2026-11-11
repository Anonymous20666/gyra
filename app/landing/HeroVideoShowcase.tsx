"use client";

import { useEffect, useRef, useState } from "react";
import { formatVideoTimecode } from "./fieldMath";

export interface HeroSceneSpec {
  id: "car" | "code";
  tabLabel: string;
  badge: string;
  prompt: string;
  composerMode: "Video Studio" | "Code Agent";
  cameraSpec: string;
}

export const HERO_SCENES: HeroSceneSpec[] = [
  {
    id: "car",
    tabLabel: "01 · Hypercar — Camera Rig",
    badge: "4K plate · camera rig preview",
    prompt:
      "Track-level 85mm tracking shot of a matte-black hypercar drifting through wet Tokyo neon streets at dusk, 60fps.",
    composerMode: "Video Studio",
    cameraSpec: "85mm Anamorphic · Track Dolly · f/1.8",
  },
  {
    id: "code",
    tabLabel: "02 · Agent Terrain Sim",
    badge: "Real-time canvas sim",
    prompt:
      "Build a real-time 3D WebGL shader terrain flight simulation with procedural ridges, telemetry HUD, and physics in TypeScript.",
    composerMode: "Code Agent",
    cameraSpec: "Canvas terrain sim · procedural ridges · telemetry HUD",
  },
];

const SHADER_GAME_CODE_LINES = [
  "import { useEffect, useRef } from 'react';",
  "import { compileShaderProgram, updateFlightPhysics } from './shaderEngine';",
  "",
  "export function CanyonShaderSim({ velocity = 1.45 }: { velocity?: number }) {",
  "  const canvasRef = useRef<HTMLCanvasElement>(null);",
  "",
  "  useEffect(() => {",
  "    const gl = canvasRef.current?.getContext('webgl2');",
  "    if (!gl) return;",
  "    const prog = compileShaderProgram(gl, VERTEX_GLSL, TERRAIN_FRAG_GLSL);",
  "    let frame = 0;",
  "    const loop = (t: number) => {",
  "      const telemetry = updateFlightPhysics(t * 0.001, velocity);",
  "      gl.uniform1f(prog.uElevation, telemetry.altitudeMeters);",
  "      gl.uniform2f(prog.uBankAngle, telemetry.rollRad, telemetry.pitchRad);",
  "      gl.drawArrays(gl.TRIANGLES, 0, 6);",
  "      frame = requestAnimationFrame(loop);",
  "    };",
  "    frame = requestAnimationFrame(loop);",
  "    return () => cancelAnimationFrame(frame);",
  "  }, [velocity]);",
  "",
  "  return <canvas ref={canvasRef} className='w-full h-full rounded-xl' />;",
  "}",
];

/* Camera path keyframes: the scrubber drives this transform over the still plate. */
function cameraTransform(p: number, scene: "car" | "code") {
  if (scene === "car") {
    // Dolly-in + slow lateral track across the plate over the 6s path
    const scale = 1.06 + p * 0.16;
    const tx = (p - 0.5) * 5.2; // % of plate width, left → right
    const ty = (p - 0.5) * 1.4;
    return { scale, tx, ty };
  }
  const scale = 1.02 + Math.sin(p * Math.PI) * 0.03;
  return { scale, tx: 0, ty: 0 };
}

const PATH_DURATION_S = 6;

interface Props {
  onRemixPrompt?: (prompt: string, mode: "Chat" | "Image Gen" | "Video Studio" | "Code Agent" | "Deep Research") => void;
}

export default function HeroVideoShowcase({ onRemixPrompt }: Props) {
  const [activeSceneId, setActiveSceneId] = useState<"car" | "code">("car");
  // Scene 1: real plate swap — the clay plate and photoreal plate are separate files
  const [carRenderPass, setCarRenderPass] = useState<"photoreal" | "clay">("photoreal");
  // Scene 2 (sim): split-screen vs fullscreen canvas
  const [codeLayout, setCodeLayout] = useState<"split" | "preview">("split");

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const [playing, setPlaying] = useState(!prefersReducedMotion);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [progress, setProgress] = useState(0.28);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const activeScene = HERO_SCENES.find((s) => s.id === activeSceneId) || HERO_SCENES[0];
  const displayedProgress = hoverProgress !== null ? hoverProgress : progress;
  const timeInfo = formatVideoTimecode(displayedProgress, PATH_DURATION_S, 60);

  // Advance the camera path smoothly when playing and not scrubbing
  useEffect(() => {
    if (!playing || isScrubbing || hoverProgress !== null) return;
    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      setProgress((prev) => {
        const next = prev + dt / PATH_DURATION_S;
        return next > 1 ? next - 1 : next;
      });
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, isScrubbing, hoverProgress]);

  // Live canvas: camera-path HUD on the car plate; real-time terrain sim on the code scene
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || 960;
    const h = canvas.clientHeight || 540;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const t = displayedProgress * PATH_DURATION_S;

    if (activeSceneId === "car") {
      /* Camera-path preview HUD: the actual planned rig path over the still plate */
      const isClay = carRenderPass === "clay";

      // Dotted camera path (gentle track across the lower third of the frame)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const u = i / 40;
        const px = w * (0.12 + u * 0.76);
        const py = h * (0.66 - Math.sin(u * Math.PI) * 0.10);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // End-of-path marker
      const ex = w * 0.88;
      const ey = h * 0.66;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.strokeRect(ex - 5, ey - 5, 10, 10);

      // Current camera position on the path
      const cu = displayedProgress;
      const camX = w * (0.12 + cu * 0.76);
      const camY = h * (0.66 - Math.sin(cu * Math.PI) * 0.10);
      ctx.fillStyle = "#4F6EF7";
      ctx.beginPath();
      ctx.arc(camX, camY, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(79, 110, 247, 0.4)";
      ctx.beginPath();
      ctx.arc(camX, camY, 9, 0, Math.PI * 2);
      ctx.stroke();

      // Corner readout — honest labels only
      ctx.fillStyle = "rgba(245, 247, 250, 0.72)";
      ctx.font = "500 10px 'JetBrains Mono', monospace";
      ctx.fillText(
        isClay
          ? `CLAY PLATE · CAM PATH t=${t.toFixed(1)}s / ${PATH_DURATION_S}.0s`
          : `CAMERA RIG PREVIEW · t=${t.toFixed(1)}s / ${PATH_DURATION_S}.0s`,
        18,
        28
      );
    } else if (activeSceneId === "code") {
      /* Real-time lightweight terrain sim (2D canvas, procedural) */
      const startX = codeLayout === "split" ? w * 0.46 : 0;
      const paneW = w - startX;
      const horizonY = h * 0.42;

      // Sky & deep obsidian atmosphere
      const skyGrad = ctx.createLinearGradient(startX, 0, startX, h);
      skyGrad.addColorStop(0, "#090B10");
      skyGrad.addColorStop(0.45, "#101522");
      skyGrad.addColorStop(1, "#0B0C10");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(startX, 0, paneW, h);

      // Core energy orb on horizon
      const sunX = startX + paneW * 0.5 + Math.sin(t * 0.8) * 28;
      const sunGrad = ctx.createRadialGradient(sunX, horizonY, 4, sunX, horizonY, 130);
      sunGrad.addColorStop(0, "rgba(79, 110, 247, 0.55)");
      sunGrad.addColorStop(0.5, "rgba(79, 110, 247, 0.14)");
      sunGrad.addColorStop(1, "rgba(79, 110, 247, 0)");
      ctx.fillStyle = sunGrad;
      ctx.fillRect(startX, 0, paneW, h);

      // Procedural terrain grid
      const rows = 24;
      const cols = 28;
      ctx.lineWidth = 1.15;

      for (let r = 1; r < rows; r++) {
        const zNorm = r / rows;
        const persp = Math.pow(zNorm, 1.85);
        const py = horizonY + persp * (h - horizonY);

        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
          const xNorm = (c / cols) * 2 - 1;
          const px = startX + paneW * 0.5 + xNorm * paneW * (0.18 + persp * 0.75);
          const canyonWall = Math.pow(Math.abs(xNorm), 1.7) * 68 * persp;
          const wave =
            Math.sin(xNorm * 4.5 + (t * 3.2 - r * 0.38)) * 14 * persp +
            Math.cos(xNorm * 8.0 - t * 2.4 + r * 0.5) * 6 * persp;
          const y = py - canyonWall - wave;

          if (c === 0) ctx.moveTo(px, y);
          else ctx.lineTo(px, y);
        }
        const alpha = Math.min(0.85, 0.12 + persp * 0.72);
        ctx.strokeStyle =
          r % 3 === 0
            ? `rgba(79, 110, 247, ${alpha.toFixed(2)})`
            : `rgba(175, 196, 245, ${(alpha * 0.55).toFixed(2)})`;
        ctx.stroke();
      }

      // HUD — labels the sim honestly
      ctx.fillStyle = "rgba(245, 247, 250, 0.86)";
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.fillText(
        `CANVAS SIM · ALT ${(420 + Math.sin(t * 1.7) * 38).toFixed(0)}M · t=${t.toFixed(1)}s`,
        startX + 20,
        32
      );
    }

    ctx.restore();
  }, [activeSceneId, carRenderPass, codeLayout, displayedProgress]);

  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const norm = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    setHoverProgress(norm);
    if (isScrubbing) {
      setProgress(norm);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const norm = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
    setProgress(norm);
    setHoverProgress(norm);
  };

  const visibleCodeLines = Math.max(
    8,
    Math.min(
      SHADER_GAME_CODE_LINES.length,
      Math.floor(8 + displayedProgress * (SHADER_GAME_CODE_LINES.length - 6))
    )
  );

  const carCam = cameraTransform(displayedProgress, "car");

  return (
    <div className="gy-video-stage-wrap" id="video-studio" data-testid="hero-video-showcase">
      {/* Scene Switcher Header Bar */}
      <div className="gy-video-stage-header">
        <div className="gy-scene-tabs" role="tablist" aria-label="Interactive hero showcase scenes">
          {HERO_SCENES.map((scene) => {
            const isActive = scene.id === activeSceneId;
            return (
              <button
                key={scene.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`gy-scene-tab ${isActive ? "on" : ""}`}
                onClick={() => setActiveSceneId(scene.id)}
              >
                <span>{scene.tabLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="gy-video-stage-badges">
          <span className="gy-fps-badge" data-testid="hero-video-fps-badge">
            {activeScene.badge}
          </span>
        </div>
      </div>

      {/* 16:9 Viewport */}
      <div ref={stageRef} className="gy-video-viewport">
        {/* Scene 1: Sports Car — camera rig preview over the still plate */}
        <div
          className={`gy-scene-layer ${activeSceneId === "car" ? "is-visible" : ""}`}
          aria-hidden={activeSceneId !== "car"}
        >
          <img
            src={
              carRenderPass === "clay"
                ? "/media/showcase/hypercar-clay-render.jpg"
                : "/media/showcase/hypercar-tokyo-photoreal.jpg"
            }
            alt="Still plate: matte-black hypercar on a wet Tokyo street at night — camera rig preview"
            referrerPolicy="no-referrer"
            className="gy-scene-img"
            style={{
              transform: `scale(${carCam.scale.toFixed(4)}) translateX(${carCam.tx.toFixed(2)}%) translateY(${carCam.ty.toFixed(2)}%)`,
              filter: "contrast(1.05) saturate(1.04)",
            }}
          />
        </div>

        {/* Scene 2: Live Agent Terrain Sim */}
        <div
          className={`gy-scene-layer gy-scene-code-layer ${
            activeSceneId === "code" ? "is-visible" : ""
          }`}
          aria-hidden={activeSceneId !== "code"}
        >
          {codeLayout === "split" && (
            <div className="gy-code-live-pane">
              <div className="gy-code-live-head">
                <span className="gy-code-live-file">src/CanyonShaderSim.tsx</span>
                <span className="gy-code-live-status">
                  Sim preview · Line {visibleCodeLines}/{SHADER_GAME_CODE_LINES.length}
                </span>
              </div>
              <pre className="gy-code-live-pre">
                <code>
                  {SHADER_GAME_CODE_LINES.slice(0, visibleCodeLines).join("\n")}
                </code>
              </pre>
            </div>
          )}
        </div>

        {/* Shared Live Canvas: camera-path HUD / terrain sim */}
        <canvas
          ref={overlayCanvasRef}
          className="gy-scene-canvas-overlay"
          aria-hidden="true"
        />

        {/* Top-Right Scene-Specific Controls (real plate swaps & layouts only) */}
        <div className="gy-viewport-top-controls">
          {activeSceneId === "car" && (
            <div
              className="gy-pass-segmented"
              role="group"
              aria-label="Hypercar plate toggle"
            >
              <button
                type="button"
                className={`gy-pass-btn ${carRenderPass === "clay" ? "on" : ""}`}
                onClick={() => setCarRenderPass("clay")}
              >
                Clay Plate
              </button>
              <button
                type="button"
                className={`gy-pass-btn ${carRenderPass === "photoreal" ? "on" : ""}`}
                onClick={() => setCarRenderPass("photoreal")}
              >
                Photoreal Plate
              </button>
            </div>
          )}

          {activeSceneId === "code" && (
            <div
              className="gy-pass-segmented"
              role="group"
              aria-label="Terrain sim layout toggle"
            >
              <button
                type="button"
                className={`gy-pass-btn ${codeLayout === "split" ? "on" : ""}`}
                onClick={() => setCodeLayout("split")}
              >
                Code + Sim
              </button>
              <button
                type="button"
                className={`gy-pass-btn ${codeLayout === "preview" ? "on" : ""}`}
                onClick={() => setCodeLayout("preview")}
              >
                Fullscreen Sim
              </button>
            </div>
          )}
        </div>

        {/* Floating Glassmorphic Prompt Bar & Camera-Path Timeline */}
        <div className="gy-viewport-glass-bar">
          <div className="gy-viewport-prompt-row">
            <div className="gy-viewport-prompt-copy">
              <span className="gy-viewport-prompt-kicker">
                BRIEF · {activeScene.cameraSpec}
              </span>
              <p className="gy-viewport-prompt-text" data-testid="hero-video-live-prompt">
                “{activeScene.prompt}”
              </p>
            </div>

            <button
              type="button"
              className="gy-remix-prompt-btn"
              onClick={() =>
                onRemixPrompt?.(activeScene.prompt, activeScene.composerMode)
              }
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3v3m0 12v3M3 12h3m12 0h3m-2.6-6.4l-2.1 2.1M7.7 16.3l-2.1 2.1m0-12.8l2.1 2.1m8.6 8.6l2.1 2.1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <span>Remix this Prompt</span>
            </button>
          </div>

          {/* Camera-Path Timeline (drives the plate camera transform) */}
          <div className="gy-scrubber-row">
            <button
              type="button"
              className="gy-scrubber-play"
              aria-label={playing ? "Pause camera path preview" : "Play camera path preview"}
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <div
              className="gy-scrubber-track-wrap"
              onMouseMove={handleTimelineMouseMove}
              onMouseLeave={() => {
                setHoverProgress(null);
                setIsScrubbing(false);
              }}
              onMouseDown={() => setIsScrubbing(true)}
              onMouseUp={() => setIsScrubbing(false)}
              onClick={handleTimelineClick}
              role="slider"
              tabIndex={0}
              aria-label="Scrub the camera path over the plate"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(displayedProgress * 100)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                  setProgress((p) => Math.min(1, p + 0.05));
                } else if (e.key === "ArrowLeft") {
                  setProgress((p) => Math.max(0, p - 0.05));
                }
              }}
            >
              <div className="gy-scrubber-track">
                <div
                  className="gy-scrubber-fill"
                  style={{ width: `${(displayedProgress * 100).toFixed(1)}%` }}
                />
                <div
                  className="gy-scrubber-thumb"
                  style={{ left: `${(displayedProgress * 100).toFixed(1)}%` }}
                />
              </div>
              <span className="gy-scrubber-hint">
                {hoverProgress !== null
                  ? `Scrubbing · path frame ${timeInfo.currentFrame}/${timeInfo.totalFrames}`
                  : "Scrub the camera path · drag or hover"}
              </span>
            </div>

            <span className="gy-scrubber-timecode" data-testid="hero-video-timecode">
              {timeInfo.timecode}
            </span>
          </div>
        </div>
      </div>

      <p className="gy-video-caption">
        Camera-move preview over the still plate — full renders run in Studio.
      </p>
    </div>
  );
}
