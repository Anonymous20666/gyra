"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

function streamSSE(url: string, body: unknown, onEvent: (j: any) => void, signal: AbortSignal) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) {
      let msg = "Something went wrong.";
      try {
        const j = await res.json();
        msg = j?.error || msg;
      } catch {}
      onEvent({ type: "error", message: msg });
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split("\n");
      buf = parts.pop() ?? "";
      for (const part of parts) {
        if (!part.trim() || !part.startsWith("data:")) continue;
        try {
          onEvent(JSON.parse(part.slice(5).trim()));
        } catch {}
      }
    }
  });
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="gy-stage-badge">{children}</span>;
}

/* ------------------------------------------------------------------ */
/* CHAT — real streaming conversation (local model)                    */
/* ------------------------------------------------------------------ */

type Msg = { role: "user" | "gyra"; text: string; status?: "thinking" | "streaming" | "error"; ms?: number };

function ChatTab() {
  const reduced = usePrefersReducedMotion();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scriptedRan = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const push = useCallback((m: Partial<Msg> & { role: Msg["role"] }) => {
    setMsgs((prev) => [...prev, { status: undefined, ...m, text: m.text ?? "" } as Msg]);
  }, []);

  const updateLast = useCallback((patch: Partial<Msg>) => {
    setMsgs((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      next[next.length - 1] = { ...next[next.length - 1], ...patch };
      return next;
    });
  }, []);

  // scripted opening exchange, streamed like the real thing (deterministic)
  useEffect(() => {
    if (scriptedRan.current) return;
    scriptedRan.current = true;
    const lines: { role: Msg["role"]; text: string }[] = [
      { role: "user", text: "What can you actually do for me today?" },
      {
        role: "gyra",
        text: "A lot, honestly. Ask me anything and I'll answer plainly. Point me at a question and I'll research the live web and show you my sources. I can write — emails, essays, code — and build real, runnable software. On SuperGyra I also generate images and video, and I can speak. What should we start with?",
      },
    ];
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reduced) {
      setMsgs(lines.map((l) => ({ role: l.role, text: l.text })));
      return;
    }
    const typeOut = (role: Msg["role"], text: string, delay: number) => {
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          if (role === "user") {
            push({ role, text });
            return;
          }
          push({ role, status: "thinking" });
          timers.push(
            setTimeout(() => {
              if (cancelled) return;
              updateLast({ status: "streaming", text: "" });
              let i = 0;
              const step = Math.max(2, Math.round(text.length / 110));
              const iv = setInterval(() => {
                if (cancelled) {
                  clearInterval(iv);
                  return;
                }
                i += step;
                updateLast({ text: text.slice(0, i) });
                if (i >= text.length) {
                  clearInterval(iv);
                  updateLast({ status: undefined, text });
                }
              }, 16);
            }, 500)
          );
        }, delay)
      );
    };
    typeOut(lines[0].role, lines[0].text, 350);
    typeOut(lines[1].role, lines[1].text, 900);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduced, push, updateLast]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    push({ role: "user", text });
    push({ role: "gyra", status: "thinking" });
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    let started = false;
    await streamSSE(
      "/api/demo/chat",
      { prompt: text },
      (j) => {
        if (j.type === "content") {
          if (!started) {
            started = true;
            updateLast({ status: "streaming", text: "" });
          }
          setMsgs((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last.role !== "gyra") return prev;
            next[next.length - 1] = { ...last, text: (last.text || "") + (j.text || ""), status: "streaming" };
            return next;
          });
        } else if (j.type === "done") {
          updateLast({ status: undefined, ms: j.ms });
          setBusy(false);
        } else if (j.type === "error" || j.type === "cancelled") {
          updateLast({ status: "error", text: j.message || "The demo model is busy. Try again." });
          setBusy(false);
        }
      },
      ac.signal
    );
  };

  return (
    <div className="gy-chat">
      <div className="gy-chat-log" ref={scrollRef}>
        {msgs.map((m, i) => (
          <div key={i} className={`gy-msg gy-msg-${m.role}`}>
            <span className="gy-msg-who">{m.role === "gyra" ? "Gyra" : "You"}</span>
            <div className="gy-msg-bubble">
              {m.status === "thinking" ? (
                <span className="gy-dots" aria-label="Thinking">
                  <i /><i /><i />
                </span>
              ) : (
                <>{m.text}{m.status === "streaming" && <span className="gy-caret" aria-hidden="true" />}</>
              )}
              {m.status === "error" && <span className="gy-msg-err">{m.text}</span>}
            </div>
            {typeof m.ms === "number" && m.role === "gyra" && (
              <span className="gy-msg-meta">{(m.ms / 1000).toFixed(1)}s · demo model</span>
            )}
          </div>
        ))}
      </div>
      <div className="gy-chat-inputrow">
        <input
          className="gy-chat-input"
          placeholder="Ask anything — this is the live demo model"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
          aria-label="Ask the demo model"
        />
        <button className="gy-chat-send" onClick={send} disabled={busy || !input.trim()} aria-label="Send">
          ↑
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RESEARCH — live web research with real sources                      */
/* ------------------------------------------------------------------ */

function ResearchTab() {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"idle" | "searching" | "sources" | "synthesizing" | "done" | "error">("idle");
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [answer, setAnswer] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const ranRef = useRef(false);

  const run = useCallback(
    async (q: string) => {
      const queryText = q.trim();
      if (!queryText || running) return;
      setRunning(true);
      setErrMsg("");
      setSources([]);
      setAnswer("");
      setPhase("searching");
      try {
        const res = await fetch("/api/demo/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: queryText }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Research failed.");
        if (j.sourceCount > 0) {
          setPhase("sources");
          setSources(j.sources);
          setTimeout(() => setPhase("synthesizing"), 700);
        }
        setAnswer(j.answer || "");
        setPhase("done");
      } catch (e: any) {
        setPhase("error");
        setErrMsg(e?.message || "Research failed.");
      } finally {
        setRunning(false);
      }
    },
    [running]
  );

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    run("When did solid-state batteries enter electric vehicle production?");
  }, [run]);

  return (
    <div className="gy-research">
      <div className="gy-research-form">
        <input
          className="gy-chat-input"
          placeholder="What should Gyra research?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run(query)}
          aria-label="Research question"
        />
        <button className="gy-stage-btn" onClick={() => run(query)} disabled={running}>
          {running ? "Researching…" : "Research"}
        </button>
      </div>

      {phase === "searching" && (
        <div className="gy-res-phase">
          <span className="gy-dots" aria-hidden="true"><i /><i /><i /></span>
          Searching the live web…
        </div>
      )}

      {sources.length > 0 && (
        <div className="gy-res-sources">
          <p className="gy-res-label">Sources found — real, from this search</p>
          <ul>
            {sources.map((s, i) => (
              <li key={i}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  [{i + 1}] {s.title || s.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {phase === "synthesizing" && (
        <div className="gy-res-phase">
          <span className="gy-dots" aria-hidden="true"><i /><i /><i /></span>
          Reading {sources.length} sources and synthesising…
        </div>
      )}

      {phase === "done" && answer && (
        <div className="gy-res-answer">
          <p className="gy-res-label">Gyra's synthesis</p>
          <p className="gy-res-text">{answer}</p>
        </div>
      )}

      {phase === "done" && !answer && (
        <div className="gy-res-phase">Live search returned no usable sources for that question — try a different one.</div>
      )}

      {phase === "error" && <div className="gy-res-phase gy-res-err">{errMsg}</div>}

      {phase === "idle" && <div className="gy-res-phase">Type a question — or run the example above.</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* IMAGE — real workspace UI, honest SuperGyra state                   */
/* ------------------------------------------------------------------ */

function ImageTab() {
  const [prompt, setPrompt] = useState("A lighthouse in a storm, cinematic, 35mm film");
  const [size, setSize] = useState("square");
  const [asked, setAsked] = useState(false);

  return (
    <div className="gy-media-tab">
      <div className="gy-media-form">
        <textarea
          className="gy-media-prompt"
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          aria-label="Image prompt"
        />
        <div className="gy-media-row">
          <div className="gy-seg" role="group" aria-label="Image size">
            {[
              { id: "square", label: "1:1" },
              { id: "portrait", label: "3:4" },
              { id: "landscape", label: "16:9" },
            ].map((s) => (
              <button key={s.id} className={size === s.id ? "on" : ""} onClick={() => setSize(s.id)}>{s.label}</button>
            ))}
          </div>
          <button className="gy-stage-btn" onClick={() => setAsked(true)} disabled={!prompt.trim()}>
            Generate
          </button>
        </div>
      </div>

      {asked ? (
        <div className="gy-gate-card">
          <div className="gy-gate-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h4>Your image would be generated here</h4>
          <p>
            Image generation runs on Gyra's FLUX engine — text to image, and
            image-to-image when you attach a photo. It's included with
            <strong> SuperGyra</strong>, where your generations appear in this
            exact workspace.
          </p>
          <Link className="gy-stage-btn gy-stage-btn-solid" href="/upgrade">
            Unlock image generation
          </Link>
        </div>
      ) : (
        <div className="gy-media-idle">
          <p>Describe the image. Gyra generates it in the workspace — this preview shows the real interface, without a generated result.</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* VIDEO — real Studio UI, honest SuperGyra state                      */
/* ------------------------------------------------------------------ */

const VIDEO_TEMPLATES = ["Reimagine", "Loop", "Space Scene"];

function VideoTab() {
  const [prompt, setPrompt] = useState("A drone rising over a coastline at golden hour");
  const [template, setTemplate] = useState(VIDEO_TEMPLATES[0]);
  const [asked, setAsked] = useState(false);

  return (
    <div className="gy-media-tab">
      <div className="gy-media-form">
        <textarea
          className="gy-media-prompt"
          rows={2}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          aria-label="Video prompt"
        />
        <div className="gy-video-templates">
          {VIDEO_TEMPLATES.map((t) => (
            <button key={t} className={template === t ? "on" : ""} onClick={() => setTemplate(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="gy-media-row">
          <span className="gy-media-cost">30–90s render · $2.00 credit · LTX engine</span>
          <button className="gy-stage-btn" onClick={() => setAsked(true)} disabled={!prompt.trim()}>
            Generate
          </button>
        </div>
      </div>

      {asked ? (
        <div className="gy-gate-card">
          <div className="gy-gate-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M16 10l6-3v10l-6-3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>
          <h4>Your video would render here</h4>
          <p>
            Video generation is built on the LTX engine — text to video, plus
            image-to-video when you attach a still. Each clip costs a{" "}
            <strong>$2.00 credit</strong> and renders in 30–90 seconds, right
            in Gyra's Studio. Included with <strong>SuperGyra</strong>.
          </p>
          <Link className="gy-stage-btn gy-stage-btn-solid" href="/upgrade">
            Unlock video generation
          </Link>
        </div>
      ) : (
        <div className="gy-media-idle">
          <p>Describe the shot. This is the real Studio interface — no rendered clip is shown until you've generated one.</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* VOICE — real Piper TTS, real waveform                               */
/* ------------------------------------------------------------------ */

function VoiceTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [custom, setCustom] = useState("");
  const [customBusy, setCustomBusy] = useState(false);

  // draw the REAL waveform of the signature recording
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/media/voice-signature.wav");
        if (!res.ok) throw new Error("missing");
        const arr = await res.arrayBuffer();
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        const buf = await ctx.decodeAudioData(arr);
        if (cancelled) return;
        setReady(true);
        drawPeaks(ctx, buf, canvasRef.current);
        ctx.resume().catch(() => {});
      } catch {
        if (!cancelled) setLoadErr("The voice sample couldn't be loaded.");
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      sourceRef.current?.stop?.();
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  const drawPeaks = (ctx: AudioContext, buf: AudioBuffer, canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || 640;
    const h = canvas.clientHeight || 96;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const c = canvas.getContext("2d")!;
    c.scale(dpr, dpr);
    c.clearRect(0, 0, w, h);
    const data = buf.getChannelData(0);
    const bars = 96;
    const step = Math.floor(data.length / bars);
    const mid = h / 2;
    for (let i = 0; i < bars; i++) {
      let max = 0;
      for (let j = 0; j < step; j += 32) {
        const v = Math.abs(data[i * step + j] || 0);
        if (v > max) max = v;
      }
      const bh = Math.max(2, max * (h * 0.9));
      const x = (i / bars) * w + 1;
      const bw = w / bars - 2;
      c.fillStyle = "rgba(120, 200, 255, 0.55)";
      c.beginPath();
      c.roundRect(x, mid - bh / 2, bw, bh, 2);
      c.fill();
    }
  };

  const playWave = async (buf: AudioBuffer, onDone?: () => void) => {
    const ctx = audioCtxRef.current!;
    await ctx.resume();
    sourceRef.current?.stop?.();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;
    src.start();
    setPlaying(true);
    src.onended = () => {
      setPlaying(false);
      cancelAnimationFrame(rafRef.current);
      onDone?.();
    };
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas || !analyserRef.current) return;
      const c = canvas.getContext("2d")!;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, canvas.width, canvas.height);
      c.scale(dpr, dpr);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const time = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteTimeDomainData(time);
      c.lineWidth = 2;
      c.strokeStyle = "rgba(140, 215, 255, 0.95)";
      c.beginPath();
      const mid = h / 2;
      for (let i = 0; i < time.length; i++) {
        const x = (i / time.length) * w;
        const v = (time[i] - 128) / 128;
        const y = mid + v * mid * 0.9;
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.stroke();
      c.restore();
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
  };

  const playSignature = async () => {
    if (playing || !ready || !audioCtxRef.current) return;
    const res = await fetch("/media/voice-signature.wav");
    const arr = await res.arrayBuffer();
    const buf = await audioCtxRef.current.decodeAudioData(arr);
    playWave(buf);
  };

  const sayThis = async () => {
    const text = custom.trim();
    if (!text || customBusy || playing) return;
    setCustomBusy(true);
    try {
      // The demo endpoint synthesises with the Piper engine and returns
      // raw WAV bytes — exactly what the product stores.
      const res = await fetch("/api/demo/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 300) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Voice unavailable right now.");
      }
      const arr = await res.arrayBuffer();
      const buf = await audioCtxRef.current!.decodeAudioData(arr);
      playWave(buf, () => setCustomBusy(false));
    } catch (e: any) {
      setCustomBusy(false);
      alert(e?.message || "Voice demo unavailable right now.");
    }
  };

  return (
    <div className="gy-voice">
      <div className="gy-voice-wave-row">
        <canvas ref={canvasRef} className="gy-voice-wave" aria-label="Voice waveform" />
        <button
          className={`gy-voice-play ${playing ? "playing" : ""}`}
          onClick={playSignature}
          disabled={!ready || playing}
          aria-label={playing ? "Playing" : "Hear Gyra speak"}
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
      </div>
      <p className="gy-voice-status">
        {playing ? "Playing — Gyra's voice, generated by the Piper engine" : ready ? "Real recording · one tap to unmute" : loadErr || "Loading the real waveform…"}
      </p>

      <div className="gy-voice-custom">
        <input
          className="gy-chat-input"
          placeholder="Or make Gyra say something (max 300 chars)"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sayThis()}
          disabled={customBusy || playing}
          aria-label="Text to speak"
        />
        <button className="gy-stage-btn" onClick={sayThis} disabled={customBusy || playing || !custom.trim()}>
          {customBusy ? "Speaking…" : "Say it"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AGENT — condensed real build run (deterministic script)             */
/* ------------------------------------------------------------------ */

const AGENT_STEPS = [
  { agent: "Atlas", role: "Research", lines: ["Scanning requirements", "Found: React 18, Vite, zero UI libs"] },
  { agent: "Orion", role: "Analysis", lines: ["Breakdown: 3 components, 1 state loop", "Risk: interval cleanup on unmount"] },
  { agent: "Architect", role: "Design", lines: ["App.tsx → state owner", "CountdownTimer + ProgressRing presentational"] },
  { agent: "Forge", role: "Implementation", lines: ["Writing src/App.tsx", "Writing CountdownTimer, ProgressRing", "Wiring global.css"] },
  { agent: "Sentinel", role: "Security & Testing", lines: ["No secrets in client code", "Interval cleanup verified"] },
  { agent: "Mentor", role: "Delivery", lines: ["npm install && npm run dev", "Open localhost:3000"] },
];

const AGENT_CODE = `const App = () => {
  const [time, setTime] = useState(60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(
      () => setTime((t) => Math.max(0, t - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [running]);

  return (
    <main>
      <h1>{fmt(time)}</h1>
      <button onClick={() => setRunning(true)}>Start</button>
      <button onClick={() => setRunning(false)}>Pause</button>
      <button onClick={() => setTime(60)}>Reset</button>
    </main>
  );
};`;

function AgentTab() {
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState(-1); // index into steps; -1 = not started
  const [line, setLine] = useState(-1);
  const [codeAt, setCodeAt] = useState(0);
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (!started) return;
    if (reduced) {
      setStep(AGENT_STEPS.length - 1);
      setLine(AGENT_STEPS.length - 1);
      setCodeAt(AGENT_CODE.length);
      setDone(true);
      return;
    }
    let t = 300;
    const push = (fn: () => void, ms: number) => {
      t += ms;
      timers.current.push(setTimeout(fn, t));
    };
    AGENT_STEPS.forEach((s, si) => {
      push(() => {
        setStep(si);
        setLine(0);
      }, 250);
      s.lines.forEach((_, li) => {
        if (li > 0) push(() => setLine(li), 520);
      });
      if (s.agent === "Forge") {
        const chunks = 22;
        for (let k = 1; k <= chunks; k++) {
          push(() => setCodeAt(Math.round((k / chunks) * AGENT_CODE.length)), 90);
        }
      }
    });
    push(() => setDone(true), 500);
  }, [started, reduced]);

  return (
    <div className="gy-agent">
      {!started && (
        <div className="gy-agent-start">
          <p>
            The build agent plans, writes, reviews, and delivers runnable code.
            Watch a condensed version of a real run.
          </p>
          <button
            className="gy-stage-btn gy-stage-btn-solid"
            onClick={() => {
              setStarted(true);
              setDone(false);
              setStep(-1);
              setCodeAt(0);
            }}
          >
            Run the demo
          </button>
        </div>
      )}

      {started && (
        <div className="gy-agent-body">
          <div className="gy-agent-timeline">
            {AGENT_STEPS.map((s, si) => (
              <div
                key={s.agent}
                className={`gy-agent-step ${si < step ? "done" : ""} ${si === step ? "active" : ""} ${si > step ? "pending" : ""}`}
              >
                <span className="gy-agent-dot" aria-hidden="true" />
                <div className="gy-agent-step-head">
                  <strong>{s.agent}</strong>
                  <span>{s.role}</span>
                  {si < step && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="gy-agent-check"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  {si === step && <span className="gy-dots" aria-label="Working"><i /><i /><i /></span>}
                </div>
                {si <= step &&
                  s.lines.slice(0, (si === step ? line + 1 : s.lines.length)).map((l, li) => (
                    <p key={li} className="gy-agent-line">{l}</p>
                  ))}
              </div>
            ))}
            {done && (
              <div className="gy-agent-done">
                ✓ Delivered — 6 files, ready to run
                <Link href="/dashboard" className="gy-agent-done-link">Build your own →</Link>
              </div>
            )}
          </div>

          <div className="gy-agent-code">
            <div className="gy-agent-code-bar">
              <span className="gy-agent-code-dot" /> <span className="gy-agent-code-dot" /> <span className="gy-agent-code-dot" />
              <span className="gy-agent-code-file">src/App.tsx</span>
            </div>
            <pre className="gy-agent-pre">
              <code>
                {AGENT_CODE.slice(0, codeAt)}
                {step >= 3 && !done && <span className="gy-caret" aria-hidden="true" />}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* STAGE — the unified capability showcase                             */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: "chat", label: "Chat", desc: "Talk to Gyra — live demo model" },
  { id: "research", label: "Research", desc: "Live web search, real sources" },
  { id: "image", label: "Image", desc: "Generation workspace (SuperGyra)" },
  { id: "video", label: "Video", desc: "LTX studio (SuperGyra)" },
  { id: "voice", label: "Voice", desc: "Real Piper TTS" },
  { id: "agent", label: "Build", desc: "The 6-agent coding run" },
];

export default function CapabilityStage() {
  const [tab, setTab] = useState("chat");
  const sectionRef = useRef<HTMLElement>(null);

  // deep-link from hero capability links (#stage + data-cap-tab)
  useEffect(() => {
    const check = () => {
      document.querySelectorAll<HTMLElement>("[data-cap-tab]").forEach((el) => {
        el.addEventListener("click", () => {
          setTab(el.dataset.capTab || "chat");
        });
      });
    };
    check();
  }, []);

  return (
    <section className="gy-stage" id="stage" ref={sectionRef}>
      <div className="gy-section-head">
        <p className="gy-eyebrow-static">The platform</p>
        <h2 className="gy-h2">See it think.</h2>
        <p className="gy-h2-sub">
          One workspace, six ways to use intelligence. Switch between them —
          chat and research run live, voice is real audio, and the build agent
          runs a condensed version of a genuine pipeline.
        </p>
      </div>

      <div className="gy-stage-frame">
        <div className="gy-stage-chrome" aria-hidden="true">
          <span /><span /><span />
          <span className="gy-stage-title">Gyra — {TABS.find((t) => t.id === tab)?.label}</span>
        </div>

        <div className="gy-stage-tabs" role="tablist" aria-label="Capabilities">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? "on" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="gy-stage-body" role="tabpanel">
          {tab === "chat" && (
            <div className="gy-stage-panel">
              <ChatTab />
              <p className="gy-stage-note">Live · answered by Gyra's local demo model — responses are short by design.</p>
            </div>
          )}
          {tab === "research" && (
            <div className="gy-stage-panel">
              <ResearchTab />
              <p className="gy-stage-note">Live · sources are scraped from the web as you watch — they're real, current links.</p>
            </div>
          )}
          {tab === "image" && (
            <div className="gy-stage-panel">
              <ImageTab />
              <p className="gy-stage-note">Workspace preview · the real interface, shown without a generated result.</p>
            </div>
          )}
          {tab === "video" && (
            <div className="gy-stage-panel">
              <VideoTab />
              <p className="gy-stage-note">Workspace preview · real Studio interface, no rendered clip shown.</p>
            </div>
          )}
          {tab === "voice" && (
            <div className="gy-stage-panel">
              <VoiceTab />
              <p className="gy-stage-note">Live · "Say it" generates new audio on the server, then plays it back.</p>
            </div>
          )}
          {tab === "agent" && (
            <div className="gy-stage-panel">
              <AgentTab />
              <p className="gy-stage-note">Product demo · a condensed, deterministic replay of the real 6-agent pipeline.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
