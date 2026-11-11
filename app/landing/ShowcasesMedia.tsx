"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Spark icon (matches the chat thread language across the landing)   */
/* ------------------------------------------------------------------ */

function GyraSparkIcon() {
  return (
    <span className="gy-spark-avatar" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="gy-spark-svg">
        <path
          d="M12 2.5L14.4 9.6L21.5 12L14.4 14.4L12 21.5L9.6 14.4L2.5 12L9.6 9.6L12 2.5Z"
          fill="#4F6EF7"
        />
        <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Voice Showcase — recorded signature line + REAL on-demand synth    */
/* ------------------------------------------------------------------ */

const VOICE_SIGNATURE = {
  id: "signature",
  label: "Gyra Signature Voice",
  profile: "Deep · Confident · Natural Cadence",
  transcript:
    "I am Gyra. Bring me a rough question, a research brief, or a product idea—and we will turn it into finished work.",
};

export function VoiceShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const signatureBufRef = useRef<AudioBuffer | null>(null);

  const [playing, setPlaying] = useState(false);
  const [playingCustom, setPlayingCustom] = useState(false);
  const [customText, setCustomText] = useState("");
  const [synthesizing, setSynthesizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Signature line is a recorded take · Speak Live synthesizes any sentence on demand"
  );

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;

    (async () => {
      try {
        const res = await fetch("/media/voice-signature.wav");
        if (!res.ok) throw new Error("Audio asset unavailable");
        const arr = await res.arrayBuffer();
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx: AudioContext = new Ctx();
        audioCtxRef.current = ctx;
        const decoded = await ctx.decodeAudioData(arr);
        if (cancelled) return;
        signatureBufRef.current = decoded;
      } catch {
        if (!cancelled) {
          setStatusMessage("Signature audio unavailable in this browser · Speak Live still works");
        }
      }
    })();

    const renderVisualizer = (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth || 640;
      const h = canvas.clientHeight || 168;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx2d.save();
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, w, h);

      const midY = h * 0.5;
      const t = now * 0.001;
      const bars = 72;

      let timeData: Uint8Array<ArrayBuffer> | null = null;
      if (analyserRef.current && playing) {
        timeData = new Uint8Array(new ArrayBuffer(analyserRef.current.frequencyBinCount));
        analyserRef.current.getByteTimeDomainData(timeData);
      }

      for (let i = 0; i < bars; i++) {
        const norm = i / (bars - 1);
        const centerWeight = Math.sin(norm * Math.PI);

        let amp = 0;
        if (timeData && playing) {
          const sampleIdx = Math.min(
            timeData.length - 1,
            Math.floor(norm * timeData.length)
          );
          const v = Math.abs((timeData[sampleIdx] - 128) / 128);
          amp = Math.max(0.08, Math.min(1, v * 2.4 * centerWeight + 0.08));
        } else {
          const w1 = Math.sin(norm * 8.5 - t * 2.1) * 0.5 + 0.5;
          const w2 = Math.cos(norm * 15.0 + t * 1.4) * 0.5 + 0.5;
          amp = (0.1 + (w1 * 0.55 + w2 * 0.45) * 0.42) * centerWeight;
        }

        const barHeight = Math.max(4, amp * (h * 0.78));
        const x = norm * (w - 16) + 8;
        const barWidth = Math.max(2, (w - 24) / bars - 2.5);

        const grad = ctx2d.createLinearGradient(0, midY - barHeight / 2, 0, midY + barHeight / 2);
        if (playing) {
          // Accent palette: violet → indigo → violet (matches #4F6EF7 identity)
          grad.addColorStop(0, "rgba(124, 146, 255, 0.95)");
          grad.addColorStop(0.5, "rgba(79, 110, 247, 0.95)");
          grad.addColorStop(1, "rgba(124, 146, 255, 0.95)");
        } else {
          grad.addColorStop(0, "rgba(124, 146, 255, 0.42)");
          grad.addColorStop(0.5, "rgba(79, 110, 247, 0.6)");
          grad.addColorStop(1, "rgba(124, 146, 255, 0.42)");
        }

        ctx2d.fillStyle = grad;
        ctx2d.beginPath();
        ctx2d.roundRect(x, midY - barHeight / 2, barWidth, barHeight, 2);
        ctx2d.fill();
      }

      ctx2d.restore();
      rafId = requestAnimationFrame(renderVisualizer);
    };

    rafId = requestAnimationFrame(renderVisualizer);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      try {
        sourceRef.current?.stop();
      } catch {}
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [playing]);

  const playBuffer = async (buf: AudioBuffer, label: string, isCustom = false) => {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new Ctx();
    }
    const ctx = audioCtxRef.current!;
    await ctx.resume();

    try {
      sourceRef.current?.stop();
    } catch {}

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;
    sourceRef.current = src;

    setPlaying(true);
    setPlayingCustom(isCustom);
    setStatusMessage(`Playing · ${label}`);

    src.onended = () => {
      setPlaying(false);
      setStatusMessage(
        isCustom
          ? "Custom sentence finished · Speak Live again anytime"
          : "Signature line complete · Play again or try Speak Live"
      );
    };

    src.start();
  };

  const stopPlayback = () => {
    try {
      sourceRef.current?.stop();
    } catch {}
    setPlaying(false);
    setStatusMessage("Paused · Play again or try Speak Live");
  };

  const toggleSignatureAudio = async () => {
    if (playing) {
      stopPlayback();
      return;
    }

    if (signatureBufRef.current) {
      await playBuffer(signatureBufRef.current, "Recorded signature line");
      return;
    }

    try {
      setStatusMessage("Loading signature voice sample…");
      const res = await fetch("/media/voice-signature.wav");
      if (!res.ok) throw new Error("Could not load voice sample");
      const arr = await res.arrayBuffer();
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const buf = await audioCtxRef.current!.decodeAudioData(arr);
      signatureBufRef.current = buf;
      await playBuffer(buf, "Recorded signature line");
    } catch {
      setStatusMessage("Unable to decode audio in this browser environment.");
    }
  };

  /* REAL on-demand synthesis: POST the typed text to /api/demo/voice,
     decode the returned WAV, and play the actual synthesis. */
  const synthesizeCustomSpeech = async () => {
    const text = customText.trim();
    if (!text || synthesizing) return;
    setSynthesizing(true);
    setStatusMessage("Synthesizing your sentence…");
    try {
      const res = await fetch("/api/demo/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`Synthesis request failed (${res.status})`);
      const arr = await res.arrayBuffer();
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const buf = await audioCtxRef.current!.decodeAudioData(arr);
      await playBuffer(buf, "Your sentence — synthesized live", true);
    } catch {
      // Honest fallback: never pretend — say what's actually happening
      if (signatureBufRef.current) {
        await playBuffer(signatureBufRef.current, "recorded sample (live synthesis unavailable)", true);
        setStatusMessage(
          "Live synthesis is unavailable right now — you heard the recorded sample instead."
        );
      } else {
        setStatusMessage("Live synthesis is unavailable in this browser environment.");
      }
    }
    setSynthesizing(false);
  };

  return (
    <section id="voice" className="gy-section gy-showcase-section">
      <div className="gy-container">
        <div className="gy-voice-layout">
          <div className="gy-voice-header">
            <p className="gy-cap-kicker">
              <span className="gy-cap-kicker-num">05</span>
              <span>NEURAL VOICE INTELLIGENCE</span>
            </p>
            <h2 className="gy-h2">A distinctive, confident voice.</h2>
            <p className="gy-body-lead gy-mx-auto">
              Gyra speaks with deep, measured clarity. Play the recorded
              signature line, or type any sentence below and Speak Live will
              synthesize it on demand.
            </p>
          </div>

          <div className="gy-voice-studio">
            <div className="gy-voice-profile-row">
              <span className="gy-vp-name">{VOICE_SIGNATURE.label}</span>
              <span className="gy-vp-meta">{VOICE_SIGNATURE.profile}</span>
            </div>

            <div className="gy-voice-stage">
              <div className="gy-voice-canvas-wrap">
                <canvas
                  ref={canvasRef}
                  className="gy-voice-canvas"
                  aria-label="Voice waveform visualizer — driven by real playback"
                />
              </div>

              <div className="gy-voice-controls-row">
                <button
                  type="button"
                  className={`gy-voice-unmute-btn ${playing ? "is-playing" : ""}`}
                  onClick={toggleSignatureAudio}
                  aria-label={playing ? "Pause voice playback" : "Play the recorded signature line"}
                >
                  {playing ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <rect x="6" y="5" width="4" height="14" rx="1" />
                        <rect x="14" y="5" width="4" height="14" rx="1" />
                      </svg>
                      <span>Pause Audio</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      <span>Play Signature Line</span>
                    </>
                  )}
                </button>

                <div className="gy-voice-Readout">
                  <p className="gy-voice-quote">
                    “{playingCustom ? "Your custom sentence (see the input below)" : VOICE_SIGNATURE.transcript}”
                  </p>
                  <p className="gy-voice-status" role="status">
                    {statusMessage}
                  </p>
                </div>
              </div>
            </div>

            <form
              className="gy-voice-synth-bar"
              onSubmit={(e) => {
                e.preventDefault();
                synthesizeCustomSpeech();
              }}
            >
              <input
                type="text"
                className="gy-voice-input"
                placeholder="Type any sentence for Gyra to speak aloud (max 280 chars)…"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                disabled={synthesizing}
                aria-label="Custom text for live voice synthesis"
              />
              <button
                type="submit"
                className="gy-btn-primary gy-btn-sm"
                disabled={synthesizing || !customText.trim()}
              >
                {synthesizing ? "Synthesizing…" : "Speak Live"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Build Showcase — agent workbench with recorded real run            */
/* ------------------------------------------------------------------ */

interface AgentFile {
  name: string;
  lang: string;
  diff: string;
  role: string;
  code: string;
}

const AGENT_FILES: AgentFile[] = [
  {
    name: "src/OrbitalTelemetry.tsx",
    lang: "TypeScript React",
    diff: "+142 −0",
    role: "Frontend Agent",
    code: `import { useState } from "react";
import { computePassWindow } from "./orbitalMath";

export interface SatelliteNode {
  id: string;
  name: string;
  inclinationDeg: number;
  altitudeKm: number;
  signalDbm: number;
  status: "nominal" | "recalibrating";
}

export function OrbitalTelemetry({ nodes }: { nodes: SatelliteNode[] }) {
  const [selected, setSelected] = useState(nodes[0]);
  const pass = computePassWindow(selected.altitudeKm, selected.inclinationDeg);

  return (
    <section className="grid grid-cols-12 gap-4 p-5 bg-[#080D15] text-[#F5F7FA]">
      <header className="col-span-12 flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-sm font-semibold tracking-tight">{selected.name}</h2>
        <span className="font-mono text-xs text-[#7C92FF]">
          Next Zenith Pass: {pass.minutesToAos}m · {selected.altitudeKm} km LEO
        </span>
      </header>
    </section>
  );
}`,
  },
  {
    name: "src/orbitalMath.ts",
    lang: "TypeScript",
    diff: "+68 −0",
    role: "Architect Agent",
    code: `const EARTH_RADIUS_KM = 6371;
const MU_EARTH = 398600.4418; // km^3 / s^2

export function computeOrbitalPeriodMinutes(altitudeKm: number): number {
  const semiMajorAxis = EARTH_RADIUS_KM + altitudeKm;
  const periodSeconds = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / MU_EARTH);
  return Number((periodSeconds / 60).toFixed(2));
}

export function computePassWindow(altitudeKm: number, inclinationDeg: number) {
  const periodMin = computeOrbitalPeriodMinutes(altitudeKm);
  const velocityKmS = Number(
    Math.sqrt(MU_EARTH / (EARTH_RADIUS_KM + altitudeKm)).toFixed(2)
  );
  const minutesToAos = Math.max(4, Math.round((inclinationDeg % 19) + 6));
  return { periodMin, velocityKmS, minutesToAos };
}`,
  },
  {
    name: "src/api/telemetryRoute.ts",
    lang: "TypeScript API",
    diff: "+84 −0",
    role: "Backend Agent",
    code: `import { NextResponse } from "next/server";
import { computeOrbitalPeriodMinutes } from "../orbitalMath";

export async function GET() {
  const constellation = [
    { id: "GY-01", name: "Gyra-Sentinel-1", altitudeKm: 540, inclinationDeg: 53.2, signalDbm: -64 },
    { id: "GY-02", name: "Gyra-Polar-2", altitudeKm: 615, inclinationDeg: 97.6, signalDbm: -68 },
    { id: "GY-03", name: "Gyra-Equatorial-3", altitudeKm: 495, inclinationDeg: 28.5, signalDbm: -61 },
  ].map((sat) => ({
    ...sat,
    orbitalPeriodMin: computeOrbitalPeriodMinutes(sat.altitudeKm),
  }));

  return NextResponse.json({ status: "ok", constellation });
}`,
  },
];

const DEMO_SATELLITES = [
  { id: "GY-01", name: "Gyra-Sentinel-1", alt: 540, inc: "53.2°", vel: "7.59 km/s", period: "95.4 min", snr: "98.4%" },
  { id: "GY-02", name: "Gyra-Polar-2", alt: 615, inc: "97.6°", vel: "7.55 km/s", period: "97.0 min", snr: "96.1%" },
  { id: "GY-03", name: "Gyra-Equatorial-3", alt: 495, inc: "28.5°", vel: "7.62 km/s", period: "94.5 min", snr: "99.2%" },
];

export function BuildShowcase() {
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [selectedSatIdx, setSelectedSatIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"split" | "code" | "preview" | "recorded">("split");

  const activeFile = AGENT_FILES[activeFileIdx];
  const activeSat = DEMO_SATELLITES[selectedSatIdx];

  return (
    <section id="build" className="gy-section gy-showcase-section">
      <div className="gy-container">
        <div className="gy-section-header-split">
          <div>
            <p className="gy-cap-kicker">
              <span className="gy-cap-kicker-num">06</span>
              <span>AGENTIC SOFTWARE ENGINEERING</span>
            </p>
            <h2 className="gy-h2">Build real software with an agent team.</h2>
          </div>
          <p className="gy-body-lead">
            Coding is one of Gyra&apos;s core capabilities—coordinated agents
            plan architecture, write modular frontend and backend code, verify
            builds, and render live interactive previews.
          </p>
        </div>

        <div className="gy-workbench">
          <div className="gy-wb-head">
            {/* Captured build thread (real conversation language) */}
            <div className="gy-wb-thread" aria-label="Captured build thread">
              <div className="gy-turn-user">
                <div className="gy-thread-user-bubble">
                  <p className="gy-thread-user-text">
                    Build an orbital satellite telemetry dashboard with live
                    LEO orbital math, a constellation selector, and signal
                    telemetry.
                  </p>
                </div>
                <span className="gy-turn-time">10:14</span>
              </div>

              <div className="gy-turn-gyra">
                <GyraSparkIcon />
                <div className="gy-thread-gyra-body">
                  <div className="gy-gyra-meta-line">
                    <span className="gy-gyra-name">Gyra</span>
                    <span className="gy-gyra-chip">Omni 4.0 · code agent</span>
                  </div>
                  <p className="gy-gyra-prose">
                    Planned it as three agents — Architect (orbital math + API
                    schema), Frontend (telemetry UI), Backend (typed route).
                    The interactive demo below is an illustration of that run;
                    the <strong>Recorded Run</strong> tab plays an unedited
                    take from the real product.
                  </p>
                </div>
              </div>
            </div>

            <div className="gy-wb-view-switch" role="tablist" aria-label="Workbench layout view">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "split"}
                className={activeTab === "split" ? "on" : ""}
                onClick={() => setActiveTab("split")}
              >
                Split View
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "code"}
                className={activeTab === "code" ? "on" : ""}
                onClick={() => setActiveTab("code")}
              >
                Code Editor
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "preview"}
                className={activeTab === "preview" ? "on" : ""}
                onClick={() => setActiveTab("preview")}
              >
                Live App Preview
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "recorded"}
                className={activeTab === "recorded" ? "on" : ""}
                onClick={() => setActiveTab("recorded")}
                data-testid="workbench-recorded-tab"
              >
                Recorded Run
              </button>
            </div>
          </div>

          <div className="gy-wb-agents">
            <div className="gy-wb-agent-step done">
              <span className="gy-wb-check">✓</span>
              <div>
                <strong>01 · Architect Agent</strong>
                <span>Orbital mechanics &amp; API schema</span>
              </div>
            </div>
            <div className="gy-wb-agent-step done">
              <span className="gy-wb-check">✓</span>
              <div>
                <strong>02 · Frontend Agent</strong>
                <span>Telemetry UI &amp; interactive state</span>
              </div>
            </div>
            <div className="gy-wb-agent-step done">
              <span className="gy-wb-check">✓</span>
              <div>
                <strong>03 · Backend Agent</strong>
                <span>Typed route handler &amp; metrics</span>
              </div>
            </div>
            <div className="gy-wb-agent-step done">
              <span className="gy-wb-check">✓</span>
              <div>
                <strong>04 · QA &amp; Build</strong>
                <span>Demo build verified</span>
              </div>
            </div>
          </div>

          <div className={`gy-wb-body gy-wb-mode-${activeTab}`}>
            {activeTab === "split" && (
              <div className="gy-wb-code-pane">
                <div className="gy-wb-file-tabs" role="tablist" aria-label="Generated project files">
                  {AGENT_FILES.map((file, idx) => (
                    <button
                      key={file.name}
                      type="button"
                      role="tab"
                      aria-selected={idx === activeFileIdx}
                      className={`gy-wb-file-tab ${idx === activeFileIdx ? "on" : ""}`}
                      onClick={() => setActiveFileIdx(idx)}
                    >
                      <span className="gy-wb-fname" title={file.name}>
                        {file.name.split("/").pop()}
                      </span>
                      <span className="gy-wb-fdiff">{file.diff}</span>
                    </button>
                  ))}
                </div>

                <pre className="gy-wb-pre">
                  <code>{activeFile.code}</code>
                </pre>

                <div className="gy-wb-terminal">
                  <span>$ npm run build &amp;&amp; npm test</span>
                  <span className="gy-wb-term-ok">✓ 3 modules compiled · 4 unit assertions passed (180ms)</span>
                </div>
              </div>
            )}

            {(activeTab === "split" || activeTab === "preview") && (
              <div className="gy-wb-preview-pane">
                <div className="gy-wb-preview-bar">
                  <div className="gy-window-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="gy-wb-preview-url">
                    preview://orbital-telemetry.gyra.app
                  </span>
                  <span className="gy-sample-tag">Interactive Demo Result</span>
                </div>

                <div className="gy-wb-preview-canvas">
                  <div className="gy-orb-header">
                    <div>
                      <span className="gy-orb-kicker">LEO CONSTELLATION MONITOR</span>
                      <h4 className="gy-orb-title">{activeSat.name}</h4>
                    </div>
                    <span className="gy-orb-badge">TELEMETRY LOCK · {activeSat.snr}</span>
                  </div>

                  <div className="gy-orb-selector" role="tablist" aria-label="Select satellite node">
                    {DEMO_SATELLITES.map((sat, idx) => (
                      <button
                        key={sat.id}
                        type="button"
                        role="tab"
                        aria-selected={idx === selectedSatIdx}
                        className={`gy-orb-sat-btn ${idx === selectedSatIdx ? "on" : ""}`}
                        onClick={() => setSelectedSatIdx(idx)}
                      >
                        <span>{sat.id}</span>
                        <strong>{sat.name}</strong>
                      </button>
                    ))}
                  </div>

                  <div className="gy-orb-viz">
                    <svg viewBox="0 0 420 130" className="gy-orb-svg" aria-hidden="true">
                      <defs>
                        <linearGradient id="gyOrbLineLocal" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="rgba(79,110,247,0.15)" />
                          <stop offset="50%" stopColor="rgba(124,146,255,0.9)" />
                          <stop offset="100%" stopColor="rgba(124,146,255,0.2)" />
                        </linearGradient>
                      </defs>
                      <ellipse
                        cx="210"
                        cy="65"
                        rx="180"
                        ry="42"
                        fill="none"
                        stroke="rgba(160,180,210,0.14)"
                        strokeDasharray="4 4"
                      />
                      <path
                        d={
                          selectedSatIdx === 0
                            ? "M 20 95 Q 210 -15 400 95"
                            : selectedSatIdx === 1
                            ? "M 20 35 Q 210 135 400 35"
                            : "M 20 65 Q 210 15 400 65"
                        }
                        fill="none"
                        stroke="url(#gyOrbLineLocal)"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx={selectedSatIdx === 0 ? 210 : selectedSatIdx === 1 ? 165 : 255}
                        cy={selectedSatIdx === 0 ? 40 : selectedSatIdx === 1 ? 84 : 42}
                        r="6"
                        fill="#4F6EF7"
                      />
                    </svg>
                  </div>

                  <div className="gy-orb-metrics">
                    <div className="gy-orb-metric">
                      <span>Altitude</span>
                      <strong>{activeSat.alt} km</strong>
                    </div>
                    <div className="gy-orb-metric">
                      <span>Inclination</span>
                      <strong>{activeSat.inc}</strong>
                    </div>
                    <div className="gy-orb-metric">
                      <span>Orbital Velocity</span>
                      <strong>{activeSat.vel}</strong>
                    </div>
                    <div className="gy-orb-metric">
                      <span>Orbital Period</span>
                      <strong>{activeSat.period}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "recorded" && (
              <div className="gy-wb-recorded-pane">
                <div className="gy-wb-recorded-frame">
                  <video
                    src="/media/live-b.webm"
                    poster="/media/poster-live-b.jpg"
                    muted
                    loop
                    playsInline
                    controls
                    preload="metadata"
                    className="gy-wb-recorded-video"
                    aria-label="Recorded unedited run: Gyra building a countdown timer component in the real product"
                  />
                </div>
                <div className="gy-wb-recorded-meta">
                  <span className="gy-sample-tag">Recorded run · unedited · 0:56</span>
                  <p>
                    A straight take from the real product — Gyra planning, then
                    the agent team building a countdown-timer React component.
                    No cuts, no staging.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="gy-wb-footer">
            <span>Multi-file project generation, terminal execution &amp; live preview inside Gyra Projects</span>
            <a href="https://gyra-tester.duckdns.org/projects" className="gy-btn-primary gy-btn-sm">
              Open Gyra Projects →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
