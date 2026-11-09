"use client";

import { useEffect, useRef, useState } from "react";
import { formatVideoTimecode } from "./fieldMath";

export interface HeroSceneSpec {
  id: "car" | "headset" | "code";
  tabLabel: string;
  badge: string;
  prompt: string;
  composerMode: "Video Studio" | "Image Gen" | "Code Agent";
  cameraSpec: string;
}

export const HERO_SCENES: HeroSceneSpec[] = [
  {
    id: "car",
    tabLabel: "01 · Sports Car Drift",
    badge: "4K • 60 FPS • Gyra-Video",
    prompt:
      "Track-level 85mm tracking shot of a matte-black hypercar drifting through wet Tokyo neon streets at dusk, 60fps.",
    composerMode: "Video Studio",
    cameraSpec: "85mm Anamorphic · Track Dolly · f/1.8",
  },
  {
    id: "headset",
    tabLabel: "02 · Spatial XR Headset",
    badge: "4K • 60 FPS • Gyra-Video",
    prompt:
      "Macro studio shot of a translucent carbon-fiber XR headset with holographic UI reflections.",
    composerMode: "Video Studio",
    cameraSpec: "100mm Macro Prime · Studio Rim · 60fps",
  },
  {
    id: "code",
    tabLabel: "03 · Live Agent Code Execution",
    badge: "RT-60 FPS • Gyra-Code-Agent",
    prompt:
      "Build a real-time 3D WebGL shader terrain flight simulation with procedural ridges, telemetry HUD, and physics in TypeScript.",
    composerMode: "Code Agent",
    cameraSpec: "Split-Screen AST Synthesis · WebGL2 Runtime",
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

interface Props {
  onRemixPrompt?: (prompt: string, mode: "Chat" | "Image Gen" | "Video Studio" | "Code Agent" | "Deep Research") => void;
}

export default function HeroVideoShowcase({ onRemixPrompt }: Props) {
  const [activeSceneId, setActiveSceneId] = useState<"car" | "headset" | "code">("car");
  // Scene 1 toggles: Raw Clay Render vs Gyra Photoreal Output, and Daylight vs Cyberpunk Rain
  const [carRenderPass, setCarRenderPass] = useState<"photoreal" | "clay">("photoreal");
  const [carAtmosphere, setCarAtmosphere] = useState<"rain" | "daylight">("rain");
  // Scene 2 toggles: Photoreal Macro vs Holographic Telemetry Pass
  const [headsetPass, setHeadsetPass] = useState<"macro" | "wireframe">("macro");
  // Scene 3 toggles: Split-screen vs Fullscreen 3D Preview
  const [codeLayout, setCodeLayout] = useState<"split" | "preview">("split");

  const [playing, setPlaying] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [progress, setProgress] = useState(0.28);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const activeScene = HERO_SCENES.find((s) => s.id === activeSceneId) || HERO_SCENES[0];
  const displayedProgress = hoverProgress !== null ? hoverProgress : progress;
  const timeInfo = formatVideoTimecode(displayedProgress, 8, 60);

  // Advance playhead smoothly at 60fps when playing and not hover-scrubbing
  useEffect(() => {
    if (!playing || isScrubbing || hoverProgress !== null) return;
    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      setProgress((prev) => {
        const next = prev + dt / 8.0;
        return next > 1 ? next - 1 : next;
      });
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, isScrubbing, hoverProgress]);

  // Render live 60fps kinetic canvas overlay (rain/reflections on car, holographic HUD on headset, 3D shader terrain on code scene)
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

    const t = displayedProgress * 8.0;

    if (activeSceneId === "car") {
      // Subtle atmospheric motion particles & tracking speed lines synced to playhead t
      const isRain = carAtmosphere === "rain";
      const isClay = carRenderPass === "clay";

      // Speed tracking vectors along the asphalt
      const streakCount = isClay ? 22 : isRain ? 58 : 26;
      for (let i = 0; i < streakCount; i++) {
        const seed = Math.sin(i * 19.31 + 0.7) * 43758.5453;
        const frac = seed - Math.floor(seed);
        const seed2 = Math.cos(i * 41.17 + 1.9) * 23421.631;
        const frac2 = seed2 - Math.floor(seed2);

        const x = ((frac + t * (0.28 + frac2 * 0.22)) % 1.15 - 0.08) * w;
        const y = ((frac2 + (isRain ? t * 0.42 : 0)) % 1.0) * h;

        ctx.beginPath();
        if (isClay) {
          // Wireframe topology measurement ticks
          ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
          ctx.lineWidth = 1;
          ctx.moveTo(x, y);
          ctx.lineTo(x + 18, y + 2);
        } else if (isRain) {
          // Diagonal rain & neon reflection streaks
          ctx.strokeStyle =
            i % 5 === 0
              ? "rgba(79, 110, 247, 0.34)"
              : "rgba(226, 236, 255, 0.22)";
          ctx.lineWidth = i % 4 === 0 ? 1.4 : 0.9;
          ctx.moveTo(x, y);
          ctx.lineTo(x - 16, y + 26);
        } else {
          // Daylight optical dust motes & asphalt heat shimmer
          ctx.strokeStyle = "rgba(255, 248, 231, 0.20)";
          ctx.lineWidth = 1.1;
          ctx.moveTo(x, y);
          ctx.lineTo(x - 22, y + 2);
        }
        ctx.stroke();
      }

      // Subtle camera tracking reticle & telemetry in top-left corner of frame
      ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
      ctx.lineWidth = 1;
      const rx = w * (0.48 + Math.sin(t * 1.4) * 0.03);
      const ry = h * (0.54 + Math.cos(t * 2.1) * 0.015);
      ctx.strokeRect(rx - 36, ry - 22, 72, 44);
      ctx.fillStyle = "rgba(255, 255, 255, 0.68)";
      ctx.font = "500 10px 'JetBrains Mono', monospace";
      ctx.fillText(
        isClay ? "MESH: 1.42M TRIS • CLAY PASS" : `TRACKING LOCK • ${(118 + Math.sin(t * 2) * 14).toFixed(0)} KM/H`,
        rx - 36,
        ry - 28
      );
    } else if (activeSceneId === "headset") {
      // Spatial XR Headset holographic lens reflections & depth rings
      const cx = w * 0.62;
      const cy = h * 0.50;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);

      for (let r = 1; r <= 3; r++) {
        const radius = 34 * r + Math.sin(t * 1.8 + r) * 6;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, -0.6 + t * 0.35, 1.4 + t * 0.35);
        ctx.strokeStyle =
          headsetPass === "wireframe"
            ? `rgba(79, 110, 247, ${0.48 - r * 0.1})`
            : `rgba(195, 218, 255, ${0.26 - r * 0.05})`;
        ctx.lineWidth = headsetPass === "wireframe" ? 1.5 : 1.1;
        ctx.stroke();
      }

      if (headsetPass === "wireframe") {
        // Draw LiDAR depth matrix overlay across visor
        ctx.strokeStyle = "rgba(79, 110, 247, 0.22)";
        ctx.lineWidth = 0.8;
        const step = 28;
        for (let gx = w * 0.32; gx < w * 0.86; gx += step) {
          for (let gy = h * 0.22; gy < h * 0.78; gy += step) {
            const dx = gx - cx;
            const dy = gy - cy;
            const dist = Math.hypot(dx, dy);
            if (dist < 190) {
              const shift = Math.sin(dist * 0.05 - t * 3.0) * 4;
              ctx.fillStyle = "rgba(130, 160, 255, 0.55)";
              ctx.fillRect(gx + shift, gy, 2, 2);
            }
          }
        }
      }

      ctx.fillStyle = "rgba(235, 242, 255, 0.75)";
      ctx.font = "500 10px 'JetBrains Mono', monospace";
      ctx.fillText(
        `FOVEATED OPTICS • ${(12.4 + pulse * 1.6).toFixed(1)} PPD • 60Hz`,
        cx - 64,
        cy + 132
      );
    } else if (activeSceneId === "code") {
      // Scene 3: Real-time 3D Shader Terrain Flight Simulation rendered in the right pane (or full pane)
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

      // Sun / Core energy orb on horizon
      const sunX = startX + paneW * 0.5 + Math.sin(t * 0.8) * 28;
      const sunGrad = ctx.createRadialGradient(sunX, horizonY, 4, sunX, horizonY, 130);
      sunGrad.addColorStop(0, "rgba(79, 110, 247, 0.55)");
      sunGrad.addColorStop(0.5, "rgba(79, 110, 247, 0.14)");
      sunGrad.addColorStop(1, "rgba(79, 110, 247, 0)");
      ctx.fillStyle = sunGrad;
      ctx.fillRect(startX, 0, paneW, h);

      // 3D Perspective Procedural Terrain Grid
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
          // Canyon ridge elevation
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

      // HUD Telemetry overlay inside 3D shader viewport
      ctx.fillStyle = "rgba(245, 247, 250, 0.86)";
      ctx.font = "600 11px 'JetBrains Mono', monospace";
      ctx.fillText(
        `WEBGL2 SHADER ACTIVE • ALT ${(420 + Math.sin(t * 1.7) * 38).toFixed(0)}M • 60.0 FPS`,
        startX + 20,
        32
      );
    }

    ctx.restore();
  }, [activeSceneId, carRenderPass, carAtmosphere, headsetPass, codeLayout, displayedProgress]);

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

  return (
    <div className="gy-video-stage-wrap" id="video-studio" data-testid="hero-video-showcase">
      {/* Scene Switcher Header Bar */}
      <div className="gy-video-stage-header">
        <div className="gy-scene-tabs" role="tablist" aria-label="Interactive hero video scenes">
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

      {/* 16:9 Cinema Viewport (border-radius: 20px) */}
      <div ref={stageRef} className="gy-video-viewport">
        {/* Scene 1: Sports Car Drift */}
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
            alt="Track-level 85mm tracking shot of a matte-black hypercar drifting through wet Tokyo streets"
            referrerPolicy="no-referrer"
            className="gy-scene-img"
            style={{
              transform: `scale(${(1.03 + Math.sin(displayedProgress * Math.PI * 2) * 0.025).toFixed(4)}) translateX(${(
                Math.cos(displayedProgress * Math.PI * 2) * -10
              ).toFixed(1)}px)`,
              filter:
                carRenderPass === "clay"
                  ? "contrast(1.06) brightness(0.96)"
                  : carAtmosphere === "daylight"
                  ? "brightness(1.14) saturate(0.88) contrast(1.04) hue-rotate(-12deg)"
                  : "contrast(1.05) saturate(1.08)",
            }}
          />
        </div>

        {/* Scene 2: Spatial XR Headset */}
        <div
          className={`gy-scene-layer ${activeSceneId === "headset" ? "is-visible" : ""}`}
          aria-hidden={activeSceneId !== "headset"}
        >
          <img
            src="/media/showcase/xr-headset-macro.jpg"
            alt="Macro studio shot of a translucent carbon-fiber XR headset with holographic UI reflections"
            referrerPolicy="no-referrer"
            className="gy-scene-img"
            style={{
              transform: `scale(${(1.02 + Math.sin(displayedProgress * Math.PI * 2) * 0.02).toFixed(4)})`,
              filter:
                headsetPass === "wireframe"
                  ? "contrast(1.18) brightness(0.84) saturate(1.2)"
                  : "contrast(1.04)",
            }}
          />
        </div>

        {/* Scene 3: Live Agent Code Execution Split-Screen */}
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
                  AST Streaming · Line {visibleCodeLines}/{SHADER_GAME_CODE_LINES.length}
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

        {/* Shared 60fps Interactive Kinetic & Shader Overlay Canvas */}
        <canvas
          ref={overlayCanvasRef}
          className="gy-scene-canvas-overlay"
          aria-hidden="true"
        />

        {/* Top-Right Scene-Specific Interactive Render Toggles */}
        <div className="gy-viewport-top-controls">
          {activeSceneId === "car" && (
            <>
              <div
                className="gy-pass-segmented"
                role="group"
                aria-label="Hypercar render pass toggle"
              >
                <button
                  type="button"
                  className={`gy-pass-btn ${carRenderPass === "clay" ? "on" : ""}`}
                  onClick={() => setCarRenderPass("clay")}
                >
                  Raw Clay Render
                </button>
                <button
                  type="button"
                  className={`gy-pass-btn ${carRenderPass === "photoreal" ? "on" : ""}`}
                  onClick={() => setCarRenderPass("photoreal")}
                >
                  Gyra Photoreal Output
                </button>
              </div>

              <div
                className="gy-pass-segmented"
                role="group"
                aria-label="Hypercar lighting environment toggle"
              >
                <button
                  type="button"
                  className={`gy-pass-btn ${carAtmosphere === "daylight" ? "on" : ""}`}
                  onClick={() => setCarAtmosphere("daylight")}
                >
                  Daylight
                </button>
                <button
                  type="button"
                  className={`gy-pass-btn ${carAtmosphere === "rain" ? "on" : ""}`}
                  onClick={() => setCarAtmosphere("rain")}
                >
                  Cyberpunk Rain
                </button>
              </div>
            </>
          )}

          {activeSceneId === "headset" && (
            <div
              className="gy-pass-segmented"
              role="group"
              aria-label="XR headset optical pass toggle"
            >
              <button
                type="button"
                className={`gy-pass-btn ${headsetPass === "macro" ? "on" : ""}`}
                onClick={() => setHeadsetPass("macro")}
              >
                Photoreal Macro Optics
              </button>
              <button
                type="button"
                className={`gy-pass-btn ${headsetPass === "wireframe" ? "on" : ""}`}
                onClick={() => setHeadsetPass("wireframe")}
              >
                LiDAR Depth &amp; UI Pass
              </button>
            </div>
          )}

          {activeSceneId === "code" && (
            <div
              className="gy-pass-segmented"
              role="group"
              aria-label="Code execution layout toggle"
            >
              <button
                type="button"
                className={`gy-pass-btn ${codeLayout === "split" ? "on" : ""}`}
                onClick={() => setCodeLayout("split")}
              >
                Split-Screen Agent Run
              </button>
              <button
                type="button"
                className={`gy-pass-btn ${codeLayout === "preview" ? "on" : ""}`}
                onClick={() => setCodeLayout("preview")}
              >
                Fullscreen 3D Shader Game
              </button>
            </div>
          )}
        </div>

        {/* Floating Glassmorphic Prompt Bar & Hover-to-Scrub Timeline at the Bottom */}
        <div className="gy-viewport-glass-bar">
          <div className="gy-viewport-prompt-row">
            <div className="gy-viewport-prompt-copy">
              <span className="gy-viewport-prompt-kicker">
                LIVE PROMPT · {activeScene.cameraSpec}
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

          {/* Hover-to-Scrub Timeline Controls */}
          <div className="gy-scrubber-row">
            <button
              type="button"
              className="gy-scrubber-play"
              aria-label={playing ? "Pause scene playback" : "Play scene playback"}
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
              aria-label="Hover or drag to scrub 60fps scene timeline"
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
                  ? `Scrubbing Frame ${timeInfo.currentFrame}/${timeInfo.totalFrames}`
                  : "Hover timeline to scrub 60fps keyframes"}
              </span>
            </div>

            <span className="gy-scrubber-timecode" data-testid="hero-video-timecode">
              {timeInfo.timecode}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
