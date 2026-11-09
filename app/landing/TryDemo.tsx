"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";

type RunState = "idle" | "thinking" | "streaming" | "done" | "cancelled" | "error";

const SUGGESTIONS = [
  "Build a pricing table component in React — three tiers, highlight the middle one.",
  "Write a complete dark-mode landing hero in HTML/CSS with a headline, subtext and two buttons.",
  "Write a TypeScript function that debounces another function. Explain it in one sentence.",
];

function extractBlocks(text: string): { kind: "text" | "code"; content: string; lang: string }[] {
  const blocks: { kind: "text" | "code"; content: string; lang: string }[] = [];
  const re = /```(\w*)\n?([\s\S]*?)(?:```|$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) {
      const t = text.slice(last, m.index).trim();
      if (t) blocks.push({ kind: "text", content: t, lang: "" });
    }
    blocks.push({ kind: "code", content: m[2].replace(/\n$/, ""), lang: m[1] || "" });
    last = m.index + m[0].length;
  }
  const tail = text.slice(last).trim();
  if (tail) blocks.push({ kind: "text", content: tail, lang: "" });
  return blocks;
}

function looksLikeHtml(code: string): boolean {
  return /<!doctype html|<html[\s>]/i.test(code) || (/<div[\s>]/i.test(code) && /<body|class=|style=/i.test(code));
}

export default function TryDemo() {
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<RunState>("idle");
  const [output, setOutput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [errMsg, setErrMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<RunState>("idle");
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const running = state === "thinking" || state === "streaming";

  useEffect(() => () => abortRef.current?.abort(), []);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  const run = async (p?: string) => {
    const text = (p ?? prompt).trim();
    if (!text || running) return;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setState("thinking");
    setOutput("");
    setErrMsg("");
    setElapsed(0);
    startRef.current = Date.now();
    stopTimer();
    timerRef.current = setInterval(() => setElapsed((Date.now() - startRef.current) / 1000), 200);

    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        let msg = "Demo request failed.";
        try {
          const j = await res.json();
          msg = j?.error ?? msg;
        } catch {}
        setState("error");
        setErrMsg(msg);
        stopTimer();
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const j = JSON.parse(line.slice(5));
            if (j.type === "status") setState(j.status === "streaming" ? "streaming" : "thinking");
            else if (j.type === "content") {
              setState("streaming");
              setOutput((o) => o + j.text);
            } else if (j.type === "done") {
              setState("done");
              setElapsed((Date.now() - startRef.current) / 1000);
              stopTimer();
            } else if (j.type === "cancelled") {
              setState("cancelled");
              stopTimer();
            } else if (j.type === "error") {
              setState("error");
              setErrMsg(j.message || "Model error.");
              stopTimer();
            }
          } catch {}
        }
      }
      if (stateRef.current === "thinking" || stateRef.current === "streaming") {
        setState("done");
        setElapsed((Date.now() - startRef.current) / 1000);
        stopTimer();
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        setState("cancelled");
        stopTimer();
      } else {
        setState("error");
        setErrMsg("Network error — the demo server may be briefly unavailable.");
        stopTimer();
      }
    }
  };

  const blocks = output ? extractBlocks(output) : [];
  const htmlBlock = blocks.find((b) => b.kind === "code" && looksLikeHtml(b.content));

  const statusLabel: Record<RunState, string> = {
    idle: "Ready",
    thinking: "Model thinking…",
    streaming: "Streaming response",
    done: `Done in ${elapsed.toFixed(1)}s`,
    cancelled: "Cancelled",
    error: "Error",
  };

  const statusColor: Record<RunState, string> = {
    idle: "var(--gy-ink-faint)",
    thinking: "var(--gy-cyan)",
    streaming: "var(--gy-cyan)",
    done: "var(--gy-green)",
    cancelled: "var(--gy-ink-muted)",
    error: "#f87171",
  };

  return (
    <section id="try" className="relative py-24 md:py-32">
      <div className="gy-section-glow gy-glow-cyan" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="gy-eyebrow" style={{ color: "var(--gy-cyan)" }}>Live · no sign-up needed</p>
            <h2 className="gy-display mx-auto mt-4 max-w-2xl text-[clamp(1.9rem,3.6vw,2.8rem)] text-[var(--gy-ink-text)]">
              The agent on this page is real. Ask it something.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15.5px] leading-relaxed" style={{ color: "var(--gy-ink-muted)" }}>
              This demo runs a compact coding model on our own servers so it responds
              quickly — the same workflow your workspace uses, with the full model
              stack. If it writes HTML, you will see it rendered.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="gy-glass mt-10 overflow-hidden rounded-2xl">
            {/* status bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-5 py-3" style={{ borderColor: "var(--gy-ink-line-soft)" }}>
              <span className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${running ? "gy-dot" : ""}`}
                  style={{ color: statusColor[state], backgroundColor: running ? "transparent" : statusColor[state] }}
                />
                <span className="font-mono text-[12px]" style={{ color: statusColor[state] }}>
                  {statusLabel[state]}
                </span>
              </span>
              <span className="ml-auto font-mono text-[11px]" style={{ color: "var(--gy-ink-faint)" }}>
                qwen2.5-coder · 3b · local
              </span>
            </div>

            {/* input row */}
            <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center" style={{ borderColor: "var(--gy-ink-line-soft)" }}>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && run()}
                placeholder="Describe what to build…"
                aria-label="Prompt for the demo agent"
                disabled={running}
                className="gy-focus w-full flex-1 rounded-lg border px-4 py-3 text-[14.5px] outline-none placeholder:text-[var(--gy-ink-faint)] disabled:opacity-60"
                style={{
                  backgroundColor: "var(--gy-ink-900)",
                  borderColor: "var(--gy-ink-line)",
                  color: "var(--gy-ink-text)",
                }}
              />
              {running ? (
                <button
                  onClick={cancel}
                  className="gy-focus shrink-0 rounded-lg border px-5 py-3 text-[14px] font-semibold transition-colors"
                  style={{ borderColor: "var(--gy-ink-line)", color: "var(--gy-ink-muted)" }}
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => run()}
                  disabled={!prompt.trim()}
                  className="gy-cta gy-btn-primary gy-focus shrink-0 rounded-lg px-6 py-3 text-[14px] font-semibold disabled:opacity-40"
                >
                  Run agent
                </button>
              )}
            </div>

            {/* suggestions */}
            <div className="flex flex-wrap gap-2 px-5 pt-4">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setPrompt(s);
                    run(s);
                  }}
                  disabled={running}
                  className="gy-focus rounded-full border px-3.5 py-1.5 text-left text-[12px] leading-snug transition-colors disabled:opacity-50"
                  style={{
                    borderColor: "var(--gy-ink-line)",
                    color: "var(--gy-ink-muted)",
                  }}
                >
                  {s.length > 64 ? s.slice(0, 64) + "…" : s}
                </button>
              ))}
            </div>

            {/* output */}
            <div className="gy-scroll max-h-[460px] min-h-[180px] overflow-y-auto p-5">
              {state === "idle" && (
                <p className="text-[13.5px]" style={{ color: "var(--gy-ink-faint)" }}>
                  Nothing yet. Pick a suggestion or type your own — responses stream
                  in from the model, character by character.
                </p>
              )}
              {state === "thinking" && !output && (
                <p className="font-mono text-[12.5px]" style={{ color: "var(--gy-ink-faint)" }}>
                  {elapsed > 6 ? "Model is loading (first run is slower)…" : "Waiting for the first token…"}
                </p>
              )}
              {state === "error" && (
                <p className="text-[13.5px]" style={{ color: "#f87171" }}>{errMsg}</p>
              )}

              <div className="space-y-4">
                {blocks.map((b, i) =>
                  b.kind === "text" ? (
                    <p key={i} className="text-[14px] leading-relaxed" style={{ color: "var(--gy-ink-muted)" }}>
                      {b.content}
                    </p>
                  ) : (
                    <div key={i} className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--gy-ink-line-soft)" }}>
                      <div className="flex items-center gap-2 border-b px-4 py-2" style={{ borderColor: "var(--gy-ink-line-soft)", backgroundColor: "var(--gy-ink-900)" }}>
                        <span className="font-mono text-[11px]" style={{ color: "var(--gy-ink-faint)" }}>
                          {b.lang || "code"}
                        </span>
                        {looksLikeHtml(b.content) && (
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "rgba(52,211,153,0.12)", color: "var(--gy-green)" }}>
                            rendered below
                          </span>
                        )}
                      </div>
                      <pre className="gy-scroll max-h-[280px] overflow-auto bg-transparent p-4 font-mono text-[12px] leading-relaxed" style={{ color: "var(--gy-code-text)" }}>
                        {b.content}
                      </pre>
                    </div>
                  )
                )}
              </div>

              {htmlBlock && (
                <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--gy-ink-line)" }}>
                  <div className="flex items-center gap-2 border-b px-4 py-2" style={{ borderColor: "var(--gy-ink-line-soft)", backgroundColor: "var(--gy-ink-900)" }}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--gy-green)" }} />
                    <span className="font-mono text-[11px]" style={{ color: "var(--gy-ink-faint)" }}>
                      live render · sandboxed
                    </span>
                  </div>
                  <iframe
                    title="Live render of generated HTML"
                    sandbox="allow-scripts"
                    srcDoc={htmlBlock.content}
                    className="h-[320px] w-full bg-white"
                  />
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 text-[12.5px]" style={{ color: "var(--gy-ink-faint)" }}>
            Demo is rate-limited to keep the model responsive for everyone. The
            interactive demo runs on a compact model; your workspace projects use
            the full model stack.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
