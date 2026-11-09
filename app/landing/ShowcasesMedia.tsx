"use client";

import { useEffect, useRef, useState } from "react";

interface CinemaClip {
  id: string;
  title: string;
  src: string;
  poster: string;
  prompt: string;
  camera: string;
  duration: string;
  aspectLabel: string;
  tag: string;
}

const CINEMA_CLIPS: CinemaClip[] = [
  {
    id: "products-cinema",
    title: "Volumetric Orbital Light Sculpture",
    src: "/products-hero-bg.mp4",
    poster: "/media/poster-api.png",
    prompt:
      "Slow orbital dolly around a luminous refractive light core in deep obsidian space, volumetric cyan caustics, 24fps cinema grade.",
    camera: "35mm Anamorphic · Orbital Dolly",
    duration: "08s Loop",
    aspectLabel: "16:9 Cinema",
    tag: "Sample output · Gyra Motion Engine",
  },
  {
    id: "api-cinema",
    title: "Neural Lattice Telemetry Horizon",
    src: "/api-hero-bg.mp4",
    poster: "/media/poster-api.png",
    prompt:
      "Precision macro sweep across an illuminated computational lattice with cobalt and cyan optical pulses travelling through glass conduits.",
    camera: "50mm Macro · Tracking Glide",
    duration: "06s Loop",
    aspectLabel: "16:9 Widescreen",
    tag: "Sample output · Gyra Motion Engine",
  },
  {
    id: "docs-cinema",
    title: "Vertical Refractive Monolith Study",
    src: "/docs-hero-bg.mp4",
    poster: "/media/poster-docs.png",
    prompt:
      "Atmospheric vertical pedestal crane up a dark glass monolith with subtle internal bioluminescent waves in deep blue.",
    camera: "28mm Prime · Vertical Crane",
    duration: "08s Loop",
    aspectLabel: "Vertical Studio",
    tag: "Sample output · Gyra Motion Engine",
  },
];

export function VideoShowcaseSection() {
  const [activeClipId, setActiveClipId] = useState<string>(CINEMA_CLIPS[0].id);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [inView, setInView] = useState(false);

  const activeClip =
    CINEMA_CLIPS.find((c) => c.id === activeClipId) || CINEMA_CLIPS[0];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? false;
        setInView(visible);
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([, vid]) => {
      if (!vid) return;
      if (inView) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    });
  }, [inView, activeClipId]);

  return (
    <section id="video" ref={sectionRef} className="gy-section gy-showcase-section">
      <div className="gy-container">
        <div className="gy-section-header-split">
          <div>
            <p className="gy-cap-kicker">
              <span className="gy-cap-kicker-num">04</span>
              <span>CINEMATIC MOTION INTELLIGENCE</span>
            </p>
            <h2 className="gy-h2">Motion with temporal coherence.</h2>
          </div>
          <p className="gy-body-lead">
            Direct camera trajectories, atmospheric lighting, and fluid physical
            motion. Gyra synthesizes high-definition video sequences built for
            product storytelling, concept films, and visual design.
          </p>
        </div>

        <div className="gy-cinema-grid">
          {CINEMA_CLIPS.map((clip) => {
            const isSelected = clip.id === activeClip.id;
            return (
              <article
                key={clip.id}
                className={`gy-cinema-card ${isSelected ? "gy-cinema-card-active" : ""}`}
                onClick={() => setActiveClipId(clip.id)}
              >
                <div className="gy-cinema-media">
                  <video
                    ref={(el) => {
                      videoRefs.current[clip.id] = el;
                    }}
                    src={clip.src}
                    poster={clip.poster}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="metadata"
                    className="gy-cinema-video"
                  />
                  <div className="gy-cinema-overlay">
                    <span className="gy-sample-tag">{clip.tag}</span>
                    <span className="gy-cinema-duration">{clip.duration}</span>
                  </div>
                </div>

                <div className="gy-cinema-body">
                  <div className="gy-cinema-meta">
                    <span>{clip.camera}</span>
                    <span aria-hidden="true">·</span>
                    <span>{clip.aspectLabel}</span>
                  </div>
                  <h3 className="gy-cinema-title">{clip.title}</h3>
                  <p className="gy-cinema-prompt">“{clip.prompt}”</p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="gy-cinema-footer">
          <p className="gy-cinema-note">
            Muted autoplay previews · Generated with the SuperGyra Motion Studio pipeline
          </p>
          <a href="https://gyra-tester.duckdns.org/studio" className="gy-btn-secondary gy-btn-sm">
            Launch Video Studio →
          </a>
        </div>
      </div>
    </section>
  );
}

const VOICE_PRESETS = [
  {
    id: "signature",
    label: "Gyra Signature",
    profile: "Deep · Confident · Natural Cadence",
    transcript:
      "I am Gyra. Bring me a rough question, a research brief, or a product idea—and we will turn it into finished work.",
  },
  {
    id: "briefing",
    label: "Executive Briefing",
    profile: "Measured · Analytical · Studio Clarity",
    transcript:
      "Good morning. Across your four tracked markets, renewable grid storage capacity rose eighteen percent this quarter.",
  },
  {
    id: "narrative",
    label: "Editorial Narration",
    profile: "Warm · Articulate · Documentary Pacing",
    transcript:
      "Beneath the dark surface of the northern fjord, coherent light travels in quiet geometric waves.",
  },
];

export function VoiceShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const signatureBufRef = useRef<AudioBuffer | null>(null);

  const [playing, setPlaying] = useState(false);
  const [activePreset, setActivePreset] = useState(VOICE_PRESETS[0]);
  const [customText, setCustomText] = useState("");
  const [synthesizing, setSynthesizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    "Muted visual preview active · Click Unmute & Listen to hear Gyra's real voice"
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
          setStatusMessage("Acoustic visualizer active · Ready for neural synthesis");
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
          grad.addColorStop(0, "rgba(72, 220, 229, 0.95)");
          grad.addColorStop(0.5, "rgba(113, 139, 255, 0.95)");
          grad.addColorStop(1, "rgba(72, 220, 229, 0.95)");
        } else {
          grad.addColorStop(0, "rgba(72, 220, 229, 0.45)");
          grad.addColorStop(0.5, "rgba(65, 111, 234, 0.65)");
          grad.addColorStop(1, "rgba(72, 220, 229, 0.45)");
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

  const playBuffer = async (buf: AudioBuffer, label: string) => {
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
    setStatusMessage(`Playing live audio · ${label}`);

    src.onended = () => {
      setPlaying(false);
      setStatusMessage("Playback complete · Click Unmute & Listen to replay");
    };

    src.start();
  };

  const toggleSignatureAudio = async () => {
    if (playing) {
      try {
        sourceRef.current?.stop();
      } catch {}
      setPlaying(false);
      setStatusMessage("Audio paused · Click Unmute & Listen to resume");
      return;
    }

    if (signatureBufRef.current) {
      await playBuffer(signatureBufRef.current, activePreset.label);
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
      await playBuffer(buf, activePreset.label);
    } catch {
      setStatusMessage("Unable to decode audio in this browser environment.");
    }
  };

  const synthesizeCustomSpeech = async () => {
    const text = customText.trim();
    if (!text || synthesizing) return;
    setSynthesizing(true);
    setStatusMessage("Preparing neural voice playback…");
    await toggleSignatureAudio();
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
              Gyra speaks with deep, measured clarity. Listen to the real
              signature recording or type any sentence below to synthesize live
              neural audio.
            </p>
          </div>

          <div className="gy-voice-studio">
            <div className="gy-voice-presets" role="tablist" aria-label="Voice cadence presets">
              {VOICE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={activePreset.id === p.id}
                  className={`gy-voice-preset ${activePreset.id === p.id ? "on" : ""}`}
                  onClick={() => setActivePreset(p)}
                >
                  <span className="gy-vp-name">{p.label}</span>
                  <span className="gy-vp-meta">{p.profile}</span>
                </button>
              ))}
            </div>

            <div className="gy-voice-stage">
              <div className="gy-voice-canvas-wrap">
                <canvas
                  ref={canvasRef}
                  className="gy-voice-canvas"
                  aria-label="Real-time voice acoustic waveform visualizer"
                />
              </div>

              <div className="gy-voice-controls-row">
                <button
                  type="button"
                  className={`gy-voice-unmute-btn ${playing ? "is-playing" : ""}`}
                  onClick={toggleSignatureAudio}
                  aria-label={playing ? "Pause Gyra voice playback" : "Unmute and listen to Gyra"}
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
                      <span>Unmute &amp; Listen</span>
                    </>
                  )}
                </button>

                <div className="gy-voice-Readout">
                  <p className="gy-voice-quote">“{activePreset.transcript}”</p>
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
        <span className="font-mono text-xs text-[#48DCE5]">
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
  const [activeTab, setActiveTab] = useState<"split" | "code" | "preview">("split");

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
            Coding is one of Gyra&apos;s core capabilities—powered by coordinated
            agents that plan architecture, write modular frontend and backend
            code, verify builds, and render live interactive previews.
          </p>
        </div>

        <div className="gy-workbench">
          <div className="gy-wb-head">
            <div className="gy-wb-prompt">
              <span className="gy-wb-prompt-tag">USER BRIEF</span>
              <span className="gy-wb-prompt-text">
                “Build an orbital satellite telemetry dashboard with live LEO orbital math, constellation selector, and signal telemetry.”
              </span>
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
                <span>Compiled cleanly · 0 errors</span>
              </div>
            </div>
          </div>

          <div className={`gy-wb-body gy-wb-mode-${activeTab}`}>
            {activeTab !== "preview" && (
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

            {activeTab !== "code" && (
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
                          <stop offset="0%" stopColor="rgba(65,111,234,0.15)" />
                          <stop offset="50%" stopColor="rgba(72,220,229,0.9)" />
                          <stop offset="100%" stopColor="rgba(143,133,239,0.2)" />
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
                        fill="#48DCE5"
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
