"use client";

import { useEffect, useRef, useState } from "react";
import { Gamepad2, Cpu, Sparkles, Play, Pause } from "lucide-react";
import type { LabPalette } from "./labTheme";

type SimTab = "arcade" | "forge" | "relight";

export function FlowSampleAgentArcade({ palette }: { palette: LabPalette }) {
  const [tab, setTab] = useState<SimTab>("arcade");

  // Arcade World-Model State
  const [autoPilot, setAutoPilot] = useState(true);
  const [arcadePaused, setArcadePaused] = useState(false);
  const [score, setScore] = useState(1420);
  const [episode, setEpisode] = useState(48);
  const [accuracy, setAccuracy] = useState(96.4);
  const arcadeCanvasRef = useRef<HTMLCanvasElement>(null);
  const autoPilotRef = useRef(true);
  const pausedRef = useRef(false);

  useEffect(() => {
    autoPilotRef.current = autoPilot;
  }, [autoPilot]);
  useEffect(() => {
    pausedRef.current = arcadePaused;
  }, [arcadePaused]);

  // Forge Live Compiler State
  const [forgePreset, setForgePreset] = useState<"pricing" | "metrics" | "auth">("metrics");
  const [forgeToggle, setForgeToggle] = useState(true);

  // Real-Time Optical Relight State
  const [lightPos, setLightPos] = useState({ x: 58, y: 42 });
  const [kelvin, setKelvin] = useState(2700);

  // Real 60fps Interactive Retro-Cyber Space/Policy Agent Sim (Playable OR Autonomous AI!)
  useEffect(() => {
    if (tab !== "arcade") return;
    const canvas = arcadeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const W = 720;
    const H = 360;
    canvas.width = W;
    canvas.height = H;

    let playerX = W * 0.5;
    let targetX = W * 0.5;
    let fireCooldown = 0;
    let frame = 0;
    let localScore = 1420;
    let hits = 42;
    let shots = 44;

    const bullets: { x: number; y: number }[] = [];
    const enemies: { x: number; y: number; vx: number; row: number; alive: boolean }[] = [];
    const sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    const rewardHistory: number[] = [38, 45, 52, 49, 61, 68, 65, 74, 81, 86, 84, 92, 95];

    const spawnWave = () => {
      enemies.length = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
          enemies.push({
            x: 130 + c * 64,
            y: 48 + r * 34,
            vx: 1.05,
            row: r,
            alive: true,
          });
        }
      }
    };
    spawnWave();

    const keys = { left: false, right: false, fire: false };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
      if (e.key === " ") {
        keys.fire = true;
        if (!autoPilotRef.current) e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
      if (e.key === " ") keys.fire = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (autoPilotRef.current) return;
      const rect = canvas.getBoundingClientRect();
      targetX = Math.max(40, Math.min(W - 40, ((e.clientX - rect.left) / rect.width) * W));
    };
    const onPointerDown = () => {
      if (!autoPilotRef.current && fireCooldown <= 0) {
        bullets.push({ x: playerX, y: H - 52 });
        shots++;
        fireCooldown = 10;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);

    let rafId = 0;
    let inView = true;

    const tick = () => {
      rafId = 0;
      if (document.hidden || !inView) return;
      frame++;

      if (!pausedRef.current && !reducedMotion) {
        // Move enemy formation
        let edgeHit = false;
        const aliveList = enemies.filter((e) => e.alive);
        if (aliveList.length === 0) {
          spawnWave();
          setEpisode((ep) => ep + 1);
          rewardHistory.push(Math.min(99, 86 + Math.round(Math.random() * 13)));
          if (rewardHistory.length > 18) rewardHistory.shift();
        }
        for (const en of aliveList) {
          en.x += en.vx;
          if (en.x < 48 || en.x > W - 48) edgeHit = true;
        }
        if (edgeHit) {
          for (const en of aliveList) {
            en.vx = -en.vx;
            en.y += 10;
            if (en.y > H - 110) en.y = 48;
          }
        }

        // Autonomous Gyra Policy Agent OR Manual Control
        if (autoPilotRef.current && aliveList.length > 0) {
          // Pick lowest / closest target
          const target = aliveList.reduce((best, cur) =>
            cur.y > best.y || (cur.y === best.y && Math.abs(cur.x - playerX) < Math.abs(best.x - playerX))
              ? cur
              : best,
          );
          const leadX = target.x + target.vx * 12;
          playerX += (leadX - playerX) * 0.14;
          if (Math.abs(leadX - playerX) < 16 && fireCooldown <= 0) {
            bullets.push({ x: playerX, y: H - 52 });
            shots++;
            fireCooldown = 14;
          }
        } else {
          if (keys.left) targetX = Math.max(40, targetX - 6);
          if (keys.right) targetX = Math.min(W - 40, targetX + 6);
          playerX += (targetX - playerX) * 0.25;
          if (keys.fire && fireCooldown <= 0) {
            bullets.push({ x: playerX, y: H - 52 });
            shots++;
            fireCooldown = 11;
          }
        }

        if (fireCooldown > 0) fireCooldown--;

        // Update bullets & collisions
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.y -= 8.5;
          if (b.y < 10) {
            bullets.splice(i, 1);
            continue;
          }
          for (const en of aliveList) {
            if (Math.abs(b.x - en.x) < 16 && Math.abs(b.y - en.y) < 12) {
              en.alive = false;
              bullets.splice(i, 1);
              hits++;
              localScore += 60;
              for (let s = 0; s < 8; s++) {
                const a = (s / 8) * Math.PI * 2;
                sparks.push({ x: en.x, y: en.y, vx: Math.cos(a) * 2.4, vy: Math.sin(a) * 2.4, life: 1 });
              }
              if (frame % 4 === 0) {
                setScore(localScore);
                setAccuracy(Math.round((hits / Math.max(1, shots)) * 1000) / 10);
              }
              break;
            }
          }
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
          sparks[i].x += sparks[i].vx;
          sparks[i].y += sparks[i].vy;
          sparks[i].life -= 0.05;
          if (sparks[i].life <= 0) sparks.splice(i, 1);
        }
      }

      // Draw dark arcade cyber grid
      ctx.fillStyle = "#020408";
      ctx.fillRect(0, 0, W, H);

      // Perspective horizon grid at bottom (just like E2B's world-model sim!)
      ctx.strokeStyle = `rgba(${palette.brightRgb}, 0.14)`;
      ctx.lineWidth = 1;
      for (let gy = H - 80; gy <= H; gy += 16) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }
      for (let gx = -240; gx <= W + 240; gx += 60) {
        ctx.beginPath();
        ctx.moveTo(W * 0.5 + (gx - W * 0.5) * 0.35, H - 80);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }

      // Draw enemies (clean geometric pixel invaders)
      for (const en of enemies) {
        if (!en.alive) continue;
        ctx.fillStyle = en.row === 0 ? palette.soft : en.row === 1 ? palette.bright : "#64748B";
        ctx.fillRect(en.x - 10, en.y - 6, 20, 9);
        ctx.fillRect(en.x - 6, en.y - 10, 12, 4);
        ctx.fillRect(en.x - 12, en.y + 3, 5, 4);
        ctx.fillRect(en.x + 7, en.y + 3, 5, 4);
      }

      // Draw policy sightline when Auto-Pilot is active
      if (autoPilotRef.current) {
        ctx.strokeStyle = `rgba(${palette.brightRgb}, 0.25)`;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(playerX, H - 52);
        ctx.lineTo(playerX, 32);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw player interceptor ship
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(playerX, H - 56);
      ctx.lineTo(playerX + 14, H - 36);
      ctx.lineTo(playerX - 14, H - 36);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = palette.bright;
      ctx.fillRect(playerX - 3, H - 44, 6, 8);

      // Draw plasma bolts
      ctx.fillStyle = "#34D399";
      for (const b of bullets) {
        ctx.fillRect(b.x - 1.5, b.y - 8, 3, 12);
      }

      // Draw hit sparks
      for (const sp of sparks) {
        ctx.globalAlpha = Math.max(0, sp.life);
        ctx.fillStyle = palette.soft;
        ctx.fillRect(sp.x, sp.y, 2.5, 2.5);
      }
      ctx.globalAlpha = 1;

      // Mini policy reward curve overlay (top-right HUD)
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(W - 148, 12, 136, 56);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.strokeRect(W - 148, 12, 136, 56);
      ctx.beginPath();
      rewardHistory.forEach((val, idx) => {
        const rx = W - 140 + (idx / Math.max(1, rewardHistory.length - 1)) * 120;
        const ry = 60 - (val / 100) * 38;
        if (idx === 0) ctx.moveTo(rx, ry);
        else ctx.lineTo(rx, ry);
      });
      ctx.strokeStyle = "#34D399";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#94A3B8";
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText("POLICY REWARD", W - 140, 24);

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const io = new IntersectionObserver((entries) => {
      inView = entries.some((e) => e.isIntersecting);
      if (inView && !rafId) rafId = window.requestAnimationFrame(tick);
    });
    io.observe(canvas);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, [tab, palette.bright, palette.brightRgb, palette.soft]);

  return (
    <div>
      {/* Editorial Split-Weight Heading */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p
            className="font-mono-tech text-[11px] tracking-[0.16em] uppercase"
            style={{ color: palette.bright }}
          >
            [ LIVE WORLD-MODEL · FORGE · OPTICAL RELIGHT ]
          </p>
          <h2 className="font-display mt-3 text-[clamp(2.3rem,4.2vw,3.7rem)] leading-[0.95] tracking-[-0.02em] text-white uppercase">
            <span className="font-light text-white/75">Not static mockups.</span>{" "}
            <span className="font-bold text-white">Real live engines.</span>
          </h2>
        </div>

        {/* 3 Interactive Mini-World Switcher Tabs */}
        <div role="tablist" aria-label="Interactive simulation worlds" className="inline-flex border border-white/15 bg-black">
          {(
            [
              { id: "arcade" as const, label: "Agent Arcade Sim", icon: Gamepad2 },
              { id: "forge" as const, label: "Prompt-to-App Forge", icon: Cpu },
              { id: "relight" as const, label: "Real-Time Optical Relight", icon: Sparkles },
            ] as const
          ).map((item, idx) => {
            const Icon = item.icon;
            const act = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={act}
                onClick={() => setTab(item.id)}
                style={{ backgroundColor: act ? palette.solid : "transparent" }}
                className={`font-mono-tech inline-flex min-h-[38px] items-center gap-2 px-3.5 text-[10.5px] tracking-[0.08em] uppercase transition-colors cursor-pointer ${
                  idx > 0 ? "border-l border-white/15" : ""
                } ${act ? "text-white" : "text-[#8EA2B5] hover:text-white"}`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Mini-World Stage */}
      <div className="mt-8 border border-white/12 bg-[#030508]">
        {tab === "arcade" && (
          <div className="grid grid-cols-1 divide-y divide-white/10 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
            <div className="p-4 sm:p-6 lg:col-span-8">
              <canvas
                ref={arcadeCanvasRef}
                aria-label="Playable and autonomous Gyra World-Model Arcade Agent simulation"
                className="aspect-[2/1] w-full border border-white/10 bg-black cursor-crosshair"
              />
            </div>

            <div className="flex flex-col justify-between p-5 sm:p-6 lg:col-span-4">
              <div>
                <p className="font-mono-tech text-[10px] tracking-[0.14em] uppercase" style={{ color: palette.bright }}>
                  World-Model Policy Runner · Interactive
                </p>
                <h3 className="mt-2 text-[22px] font-semibold text-white">
                  Autonomous Arcade Evaluation
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.6] text-[#8E9EAB]">
                  Inspired by E2B&apos;s world-model game sims—except ours runs live in your browser.
                  Watch Gyra&apos;s policy intercept waves automatically, or click{" "}
                  <strong className="text-white">Take Control</strong> to steer &amp; fire yourself.
                </p>

                <dl className="mt-6 divide-y divide-white/10 border-y border-white/10 font-mono-tech text-[12px]">
                  <div className="flex justify-between py-2.5">
                    <dt className="text-[#7E92A4]">Episode</dt>
                    <dd className="text-white">EP-{String(episode).padStart(3, "0")}</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-[#7E92A4]">Score</dt>
                    <dd className="text-[#34D399]">{score.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-[#7E92A4]">Hit Accuracy</dt>
                    <dd className="text-white">{accuracy}%</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAutoPilot((v) => !v)}
                  style={{ backgroundColor: autoPilot ? palette.solid : "transparent" }}
                  className="font-mono-tech flex-1 min-h-[40px] border border-white/20 px-3 text-[11px] tracking-[0.08em] text-white uppercase cursor-pointer"
                >
                  {autoPilot ? "AI Auto-Pilot: ON" : "Manual Play: Click/Move"}
                </button>
                <button
                  type="button"
                  onClick={() => setArcadePaused((v) => !v)}
                  aria-label={arcadePaused ? "Resume arcade simulation" : "Pause arcade simulation"}
                  className="inline-flex h-[40px] w-[40px] items-center justify-center border border-white/15 bg-black text-white hover:border-white cursor-pointer"
                >
                  {arcadePaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "forge" && (
          <div className="grid grid-cols-1 divide-y divide-white/10 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
            <div className="p-5 sm:p-6 lg:col-span-6">
              <div className="flex flex-wrap gap-2 pb-4">
                {(
                  [
                    { id: "metrics" as const, label: "Live Telemetry Widget" },
                    { id: "pricing" as const, label: "Usage Wallet Card" },
                    { id: "auth" as const, label: "Bearer Scope Guard" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setForgePreset(p.id)}
                    style={{
                      borderColor: forgePreset === p.id ? palette.bright : "rgba(255,255,255,0.14)",
                    }}
                    className={`font-mono-tech border px-2.5 py-1 text-[10px] uppercase cursor-pointer ${
                      forgePreset === p.id ? "bg-white/10 text-white" : "text-[#889BAC] hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <pre
                tabIndex={0}
                role="region"
                aria-label="Live Forge generated React code"
                className="overflow-x-auto border border-white/10 bg-black p-4 font-mono-tech text-[11.5px] leading-[1.68] text-[#DCE8F4]"
              >
                <code>
                  {forgePreset === "metrics"
                    ? `// Generated by Gyra Forge · verified in 1.2s
export function EdgeLatencyCard({ live }: Props) {
  return (
    <div className="border border-white/15 p-5">
      <span>LOS-01 · Lagos Core</span>
      <strong>{live ? "14ms · 118 tok/s" : "Paused"}</strong>
    </div>
  );
}`
                    : forgePreset === "pricing"
                      ? `// Generated by Gyra Forge · billing guard verified
export function WalletGuard({ balance }: Props) {
  const ok = balance >= 2.00;
  return <Status ok={ok} label="LTX-Video Queue Ready" />;
}`
                      : `// Generated by Gyra Forge · Sentinel QA pass
export function verifyBearer(scope: string) {
  return scope === "chat:write" ? "ALLOW 200" : "DENY 403";
}`}
                </code>
              </pre>
            </div>

            <div className="flex flex-col justify-between bg-black p-5 sm:p-6 lg:col-span-6">
              <div className="flex items-center justify-between font-mono-tech text-[10px] uppercase text-[#7C90A3]">
                <span>LIVE COMPILED PREVIEW · INTERACTIVE</span>
                <span className="text-[#34D399]">HMR 42ms</span>
              </div>
              <div className="my-6 border border-white/15 bg-[#04080E] p-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tech text-[11px] uppercase" style={{ color: palette.bright }}>
                    {forgePreset === "metrics"
                      ? "LOS-01 · LAGOS EDGE"
                      : forgePreset === "pricing"
                        ? "SUPERGYRA WALLET"
                        : "SENTINEL AUTH PROXY"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setForgeToggle((v) => !v)}
                    style={{ backgroundColor: forgeToggle ? palette.solid : "#1E293B" }}
                    className="font-mono-tech px-3 py-1 text-[10px] text-white uppercase cursor-pointer"
                  >
                    {forgeToggle ? "ACTIVE" : "STANDBY"}
                  </button>
                </div>
                <p className="font-display mt-4 text-[34px] font-bold text-white">
                  {forgePreset === "metrics"
                    ? forgeToggle
                      ? "14ms · 118 tok/s"
                      : "Standby · 0 req/s"
                    : forgePreset === "pricing"
                      ? forgeToggle
                        ? "$24.80 · Queue Ready"
                        : "Auto-Refund Active"
                      : forgeToggle
                        ? "ALLOW · 200 OK"
                        : "BLOCKED · 403"}
                </p>
                <p className="mt-2 font-mono-tech text-[11px] text-[#8FA2B4]">
                  Click the toggle inside this compiled preview—real React state, zero mocked video.
                </p>
              </div>
              <p className="font-mono-tech text-[10px] uppercase text-[#64788A]">
                Gyra Forge · Isolated Linux Sandbox + Live Preview
              </p>
            </div>
          </div>
        )}

        {tab === "relight" && (
          <div className="grid grid-cols-1 divide-y divide-white/10 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
            <div
              onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setLightPos({
                  x: Math.round(((e.clientX - r.left) / r.width) * 100),
                  y: Math.round(((e.clientY - r.top) / r.height) * 100),
                });
              }}
              className="relative min-h-[340px] overflow-hidden bg-black cursor-crosshair lg:col-span-8"
            >
              <img
                src="/showcase/hardware-hd.webp"
                alt="Anodized aluminum monitor relit dynamically by cursor"
                className="h-full w-full object-cover"
              />
              {/* Interactive Dynamic Relight Specular Shader Layer */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 mix-blend-screen transition-opacity"
                style={{
                  background: `radial-gradient(340px circle at ${lightPos.x}% ${lightPos.y}%, ${
                    kelvin < 3800
                      ? "rgba(255, 196, 128, 0.44)"
                      : `rgba(${palette.brightRgb}, 0.46)`
                  }, transparent 72%)`,
                }}
              />
              <div
                aria-hidden="true"
                style={{ left: `${lightPos.x}%`, top: `${lightPos.y}%` }}
                className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70"
              />
              <span className="font-mono-tech pointer-events-none absolute bottom-3 left-3 bg-black/85 px-2.5 py-1 text-[10px] text-white uppercase">
                Move cursor to steer studio key light · {kelvin}K · ({lightPos.x}%, {lightPos.y}%)
              </span>
            </div>

            <div className="flex flex-col justify-between p-5 sm:p-6 lg:col-span-4">
              <div>
                <p className="font-mono-tech text-[10px] tracking-[0.14em] uppercase" style={{ color: palette.bright }}>
                  Gyra Pro Ultra · Real-Time Relight
                </p>
                <h3 className="mt-2 text-[22px] font-semibold text-white">
                  Interactive Studio Light Rig
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.6] text-[#8E9EAB]">
                  Sweep your cursor over the titanium monitor to move the virtual studio light
                  source and shift color temperature from warm 2700K tungsten to crisp 6500K steel.
                </p>

                <div className="mt-6">
                  <div className="flex justify-between font-mono-tech text-[11px] uppercase">
                    <span className="text-[#7E92A4]">Color Temp</span>
                    <span className="text-white">{kelvin}K</span>
                  </div>
                  <input
                    type="range"
                    min={2400}
                    max={6800}
                    step={100}
                    value={kelvin}
                    onChange={(e) => setKelvin(Number(e.target.value))}
                    aria-label="Adjust studio key light color temperature"
                    className="gyra-slider mt-3 w-full cursor-pointer"
                  />
                </div>
              </div>
              <p className="mt-6 font-mono-tech text-[10px] uppercase text-[#667A8C]">
                Geometry Locked · SSIM 0.994 · Pro Ultra I2I
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
