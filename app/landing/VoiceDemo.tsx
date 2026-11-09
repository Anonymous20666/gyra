"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

/**
 * VoiceDemo v3 — a voice that is alive the moment you scroll to it.
 *
 *  - when the section enters the viewport, the real signature sample starts
 *    automatically, MUTED (browsers allow muted autoplay)
 *  - the waveform is the actual audio: the WAV is parsed and a real amplitude
 *    envelope is drawn, advanced by the audio element's own clock — no
 *    decorative fake bars, and it works without a user gesture
 *  - one obvious UNMUTE action makes the visitor hear the real voice; when the
 *    line ends it falls back to the muted loop (no repeated loud playback)
 *  - if the browser still refuses autoplay, a clear "tap to start" fallback
 *    appears — the UI never claims audio is playing when it is not
 *  - "hear it say your own line" keeps the genuine server-side Piper TTS
 *    (POST /api/demo/voice, rate-limited) — generation plays through the same
 *    element after the user's explicit click
 */

type State = "ready" | "preview" | "unmuted" | "blocked" | "generating" | "gen-playing" | "error";

const BINS = 110;

function decodeWav(buf: ArrayBuffer): { env: number[]; duration: number } {
  const dv = new DataView(buf);
  let offset = 12;
  let dataOffset = -1;
  let dataLen = 0;
  let rate = 22050;
  let channels = 1;
  let bits = 16;
  while (offset + 8 <= dv.byteLength) {
    const id = String.fromCharCode(dv.getUint8(offset), dv.getUint8(offset + 1), dv.getUint8(offset + 2), dv.getUint8(offset + 3));
    const size = dv.getUint32(offset + 4, true);
    if (id === "fmt ") {
      // fmt chunk data: audioFormat(+8) channels(+10) sampleRate(+12) byteRate(+16) blockAlign(+20) bitsPerSample(+22)
      channels = dv.getUint16(offset + 10, true);
      rate = dv.getUint32(offset + 12, true);
      bits = dv.getUint16(offset + 22, true);
    } else if (id === "data") {
      dataOffset = offset + 8;
      dataLen = Math.min(size, dv.byteLength - dataOffset);
      break;
    }
    offset += 8 + size + (size % 2);
  }
  if (dataOffset < 0) throw new Error("no data chunk");
  const n = Math.floor(dataLen / (bits / 8));
  const per = channels;
  const frames = Math.floor(n / per);
  // downmix + normalize to -1..1
  const mix = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < per; c++) {
      sum += dv.getInt16(dataOffset + (i * per + c) * 2, true) / 32768;
    }
    mix[i] = sum / per;
  }
  // amplitude envelope
  const env: number[] = new Array(BINS).fill(0);
  const binLen = Math.floor(frames / BINS);
  let max = 0;
  for (let b = 0; b < BINS; b++) {
    let sum = 0;
    const start = b * binLen;
    for (let i = start; i < start + binLen; i++) {
      const s = mix[i] || 0;
      sum += s * s;
    }
    const rms = Math.sqrt(sum / binLen);
    env[b] = rms;
    if (rms > max) max = rms;
  }
  for (let b = 0; b < BINS; b++) env[b] = max > 0 ? env[b] / max : 0;
  return { env, duration: frames / rate };
}

const STATUS: Record<State, string> = {
  ready: "Ready",
  preview: "Previewing · muted",
  unmuted: "Playing",
  blocked: "Tap to start preview",
  generating: "Generating",
  "gen-playing": "Playing your line",
  error: "Voice unavailable",
};

export default function VoiceDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const envRef = useRef<number[] | null>(null);
  const sigDurationRef = useRef(5.4);
  const stateRef = useRef<State>("ready");
  const startedRef = useRef(false); // has the preview ever started
  const reducedRef = useRef(false); // prefers-reduced-motion
  const kickRef = useRef<(() => void) | null>(null); // restarts the waveform loop on demand
  const [state, setState] = useState<State>("ready");
  const [genElapsed, setGenElapsed] = useState(0);
  const [errMsg, setErrMsg] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const setS = useCallback((s: State) => {
    stateRef.current = s;
    setState(s);
  }, []);

  // ---- reduced motion: no automatic preview; waveform goes static when idle ----
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reducedRef.current = mq.matches;
      if (mq.matches && !startedRef.current) {
        // reduced motion turned on mid-session: stop the automatic preview
        // (a user-started preview keeps playing — the user asked for it)
        const a = audioRef.current;
        if (a && stateRef.current === "preview") {
          a.pause();
          setS("ready");
        }
      }
      kickRef.current?.();
    };
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, [setS]);

  // ---- load + parse the real signature sample (drives the true waveform) ----
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const res = await fetch("/media/voice-signature.wav");
        if (!res.ok) throw new Error(String(res.status));
        const buf = await res.arrayBuffer();
        const { env, duration } = decodeWav(buf);
        if (dead) return;
        envRef.current = env;
        sigDurationRef.current = duration;
      } catch {
        if (!dead) envRef.current = null; // waveform degrades to a flat line, still honest
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  // ---- preview lifecycle: auto-start muted when visible ----
  const startPreview = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    startedRef.current = true;
    a.muted = true;
    a.loop = true;
    kickRef.current?.();
    a.play()
      .then(() => setS("preview"))
      .catch(() => setS("blocked"));
  }, [setS]);

  const stopPreview = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    if (stateRef.current === "unmuted" || stateRef.current === "preview") setS(startedRef.current ? "preview" : "ready");
    // keep startedRef so re-entering the viewport resumes the preview
  }, [setS]);

  useEffect(() => {
    const sec = sectionRef.current;
    if (!sec) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            const s = stateRef.current;
            if (s === "ready") {
              if (reducedRef.current) {
                /* reduced motion: no automatic preview — the tap-to-start button is shown */
              } else startPreview();
            } else if (s === "blocked" && startedRef.current) {
              /* stay blocked until the user taps */
            }
            // if we left mid-preview while in preview/unmuted state, resume muted
            else if ((s === "preview" || s === "unmuted") && audioRef.current?.paused) startPreview();
          } else {
            const s = stateRef.current;
            if (s === "preview" || s === "unmuted") stopPreview();
          }
        }),
      { threshold: 0.45 }
    );
    io.observe(sec);
    return () => io.disconnect();
  }, [startPreview, stopPreview]);

  const genUrlRef = useRef<string | null>(null);

  // single source of truth for clip-end behaviour (unmute one-shot + generated line)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnded = () => {
      const s = stateRef.current;
      if (s === "unmuted") {
        // one loud pass finished → fall back to the muted ambient loop
        a.muted = true;
        a.loop = true;
        kickRef.current?.();
        a.play().catch(() => setS("blocked"));
        setS("preview");
      } else if (s === "gen-playing") {
        if (genUrlRef.current) {
          URL.revokeObjectURL(genUrlRef.current);
          genUrlRef.current = null;
        }
        a.src = "/media/voice-signature.wav";
        a.muted = true;
        a.loop = true;
        kickRef.current?.();
        a.play().catch(() => setS("blocked"));
        setS("preview");
      }
    };
    a.addEventListener("ended", onEnded);
    return () => a.removeEventListener("ended", onEnded);
  }, [setS]);

  // ---- one obvious action: unmute (or tap-to-start when blocked) ----
  const onUnmute = () => {
    const a = audioRef.current;
    if (!a) return;
    if (stateRef.current === "blocked" || stateRef.current === "ready") {
      startPreview();
      return;
    }
    if (stateRef.current === "preview") {
      a.muted = false;
      a.loop = false; // play the line once at volume, then fall back to muted loop
      kickRef.current?.();
      a.play().catch(() => setS("blocked"));
      setS("unmuted");
    } else if (stateRef.current === "unmuted") {
      a.muted = true;
      a.loop = true;
      kickRef.current?.();
      setS("preview");
    }
  };

  // ---- waveform: real envelope, advanced by the element's clock ----
  // Under prefers-reduced-motion the rAF loop stops when idle (one static
  // frame) and only animates while audio is explicitly playing.
  useEffect(() => {
    let raf = 0;
    let visible = false;
    let staticDrawn = false;
    const sec = sectionRef.current;

    const roundRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
    };

    const draw = () => {
      const cv = canvasRef.current;
      if (!cv || !visible) return;
      const a = audioRef.current;
      const playing = !!a && !a.paused;
      if (reducedRef.current && !playing) {
        if (staticDrawn) return; // idle + reduced motion: static frame, loop paused
        staticDrawn = true;
      } else {
        staticDrawn = false;
        raf = requestAnimationFrame(draw);
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const env = envRef.current;
      const dur = stateRef.current === "gen-playing" ? a?.duration || 1 : sigDurationRef.current;
      const pos = playing && a ? (a.currentTime % dur) / dur : 0;

      const n = BINS;
      const gap = 2.5;
      const bw = (w - gap * (n - 1)) / n;
      const mid = h / 2;

      for (let i = 0; i < n; i++) {
        const amp = env ? env[i] : 0.25;
        const barH = Math.max(2.5, amp * (h * 0.82));
        const x = i * (bw + gap);
        const played = i / n <= pos;
        if (playing) {
          const g = ctx.createLinearGradient(0, mid - barH / 2, 0, mid + barH / 2);
          if (played) {
            g.addColorStop(0, "rgba(72,220,229,0.95)");
            g.addColorStop(1, "rgba(72,220,229,0.55)");
          } else {
            g.addColorStop(0, "rgba(165,178,195,0.42)");
            g.addColorStop(1, "rgba(165,178,195,0.2)");
          }
          ctx.fillStyle = g;
        } else {
          ctx.fillStyle = "rgba(165,178,195,0.22)";
        }
        const r = Math.min(bw / 2, 2.5);
        roundRect(ctx, x, mid - barH / 2, bw, barH, r);
      }
      // progress marker
      if (playing) {
        const mx = pos * w;
        ctx.fillStyle = "rgba(72,220,229,0.9)";
        ctx.fillRect(mx - 1, mid - h * 0.42, 2, h * 0.84);
      }
    };

    const kick = () => {
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(draw);
    };
    kickRef.current = kick;

    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => (visible = e.isIntersecting));
        kick();
      },
      { threshold: 0.1 }
    );
    if (sec) io.observe(sec);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      kickRef.current = null;
    };
  }, []);

  // ---- generation (real Piper TTS on our servers) ----
  const generate = async () => {
    const a = audioRef.current;
    const t = text.trim();
    if (!a || busy || t.length < 3) return;
    setBusy(true);
    setS("generating");
    setErrMsg("");
    setGenElapsed(0);
    const t0 = Date.now();
    const tick = window.setInterval(() => setGenElapsed((Date.now() - t0) / 1000), 100);
    // pause the preview while we work
    const wasPreview = stateRef.current === "preview" || stateRef.current === "unmuted";
    if (wasPreview) a.pause();
    try {
      const res = await fetch("/api/demo/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t.slice(0, 300) }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      if (genUrlRef.current) URL.revokeObjectURL(genUrlRef.current);
      const url = URL.createObjectURL(blob);
      genUrlRef.current = url;
      a.src = url;
      a.muted = false;
      a.loop = false;
      kickRef.current?.();
      await a.play();
      setS("gen-playing");
      // the shared "ended" listener (above) restores the muted preview
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Something went wrong");
      setS("error");
    } finally {
      window.clearInterval(tick);
      setBusy(false);
    }
  };

  const statusMeta = (() => {
    switch (state) {
      case "generating":
        return `from your text · ${genElapsed.toFixed(1)}s`;
      case "gen-playing":
        return "your text · spoken now";
      case "error":
        return errMsg || "try again";
      default:
        return `signature sample · ${sigDurationRef.current.toFixed(1)}s`;
    }
  })();

  const showUnmute = state === "preview" || state === "unmuted";
  const showTapStart = state === "blocked" || state === "ready";

  return (
    <section id="voice" ref={sectionRef} className="gy-section">
      <div className="gy-section-glow gy-glow-violet" aria-hidden />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <div className="gy-section-head">
            <p className="gy-eyebrow" style={{ color: "var(--gy-violet)" }}>
              The voice
            </p>
            <h2>A voice that sounds like it belongs.</h2>
            <p>
              The signature Gyra voice is deep, cinematic and confident —
              synthesized in real time on our servers. It previews muted;
              one tap unmutes it and you hear the actual voice.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
        <div className="gy-glass mx-auto mt-14 max-w-3xl px-6 py-8 md:px-10">
          {/* status line */}
          <div className="flex flex-wrap items-center gap-3" aria-live="polite">
            <span
              className="gy-dot h-2 w-2 rounded-full"
              style={{ color: state === "error" ? "var(--gy-cyan)" : state === "unmuted" || state === "gen-playing" ? "var(--gy-green)" : "var(--gy-cyan)" }}
              aria-hidden
            />
            <span className="text-[13.5px] font-semibold" style={{ color: "var(--gy-ink-text)" }}>
              {STATUS[state]}
            </span>
            <span className="gy-eyebrow ml-auto" style={{ color: "var(--gy-ink-faint)" }}>
              {statusMeta}
            </span>
          </div>

          {/* real waveform */}
          <canvas ref={canvasRef} className="gy-viz mt-5" aria-hidden />

          {/* the one obvious action */}
          <div className="mt-5 flex justify-center">
            {showUnmute && (
              <button
                type="button"
                className="gy-unmute gy-focus"
                data-live={state === "unmuted" ? "true" : undefined}
                onClick={onUnmute}
                aria-pressed={state === "unmuted"}
              >
                {state === "unmuted" ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M2 6v4h2.5L8 12.5v-9L4.5 6H2z" fill="currentColor" />
                      <path d="M10.5 6l3 4M13.5 6l-3 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    Mute preview
                  </>
                ) : (
                  <>
                    <span className="gy-eq" aria-hidden>
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                    Unmute preview
                  </>
                )}
              </button>
            )}
            {showTapStart && (
              <button type="button" className="gy-unmute gy-focus" onClick={onUnmute}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M5 3.5v9l7-4.5-7-4.5z" fill="currentColor" />
                </svg>
                Tap to start preview
              </button>
            )}
            {(state === "generating" || state === "gen-playing") && (
              <span className="gy-pill" data-live="true" style={{ padding: "10px 18px", fontSize: "13px" }}>
                {state === "generating" ? "Speaking your line soon…" : "Speaking your line…"}
              </span>
            )}
            {state === "error" && (
              <span className="gy-pill" style={{ color: "var(--gy-ink-muted)" }}>
                {errMsg || "Generation failed"} — tap to retry
              </span>
            )}
          </div>

          {/* real generation — same engine, your words */}
          <div className="mt-8 border-t pt-6" style={{ borderColor: "var(--gy-ink-line-soft)" }}>
            <p className="text-center text-[13px]" style={{ color: "var(--gy-ink-muted)" }}>
              Or hear it say your own line — synthesized live by our voice engine.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                maxLength={300}
                placeholder="Type up to 300 characters…"
                aria-label="Text for the voice to speak"
                disabled={busy || state === "gen-playing"}
                className="gy-voice-input gy-focus flex-1"
              />
              <button
                type="button"
                onClick={generate}
                disabled={busy || state === "gen-playing" || text.trim().length < 3}
                className="gy-cta gy-btn-primary gy-focus rounded-lg px-5 py-3 text-[13.5px] font-semibold disabled:opacity-40"
              >
                {state === "generating" ? "Generating…" : "Generate voice"}
              </button>
            </div>
          </div>
        </div>
        </Reveal>
      </div>

      <audio ref={audioRef} src="/media/voice-signature.wav" preload="auto" playsInline />
    </section>
  );
}
