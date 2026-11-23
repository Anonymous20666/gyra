"use client";
// app/coding/components/TerminalPane.tsx
// The sandbox terminal: tab strip, output, prompt. Everything runs inside E2B
// through /api/coding/terminal. Failures (including a 501 with no PTY) render
// as text — this pane never throws.

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useWorkspace } from "../../lib/coding/store";

interface TerminalPayload {
  output?: unknown;
  stdout?: unknown;
  stderr?: unknown;
  error?: unknown;
  message?: unknown;
}

function stripAnsi(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/\u001b\[[0-9;?]*[A-Za-z]/g, "");
}

function readOutput(data: TerminalPayload, status: number, ok: boolean): string {
  const candidates = [data.output, data.stdout, data.stderr, data.error, data.message];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) return stripAnsi(candidate);
  }
  if (ok) return "(no output)";
  return status === 501
    ? "Interactive terminals are unavailable in this sandbox. Commands still run one at a time."
    : `terminal unavailable (${status})`;
}

export default function TerminalPane() {
  const terminals = useWorkspace((state) => state.terminals);
  const activeTerminalId = useWorkspace((state) => state.activeTerminalId);
  const addTerminal = useWorkspace((state) => state.addTerminal);
  const closeTerminal = useWorkspace((state) => state.closeTerminal);
  const setActiveTerminal = useWorkspace((state) => state.setActiveTerminal);
  const sandboxId = useWorkspace((state) => state.sandboxId);
  const pushActivity = useWorkspace((state) => state.pushActivity);

  const [collapsed, setCollapsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [entries, setEntries] = useState<{ id: number; text: string; kind: "cmd" | "out" | "err" }[]>([
    { id: 0, text: "gyra terminal — every command runs inside the E2B sandbox", kind: "out" },
  ]);

  const scroller = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [entries, collapsed]);

  function append(text: string, kind: "cmd" | "out" | "err") {
    const chunks = text.split("\n");
    setEntries((current) => [
      ...current,
      ...chunks.map((chunk) => ({ id: nextId.current++, text: chunk, kind })),
    ].slice(-500));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const command = value.trim();
    if (!command || busy) return;

    setValue("");
    setHistory((current) => [...current, command]);
    append(`$ ${command}`, "cmd");
    setBusy(true);

    try {
      const response = await fetch("/api/coding/terminal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          command,
          cmd: command,
          sandboxId,
          sessionId: activeTerminalId,
          terminalId: activeTerminalId,
        }),
      });

      let data: TerminalPayload = {};
      try {
        data = (await response.json()) as TerminalPayload;
      } catch {
        data = {};
      }

      const text = readOutput(data, response.status, response.ok);
      append(text, response.ok ? "out" : "err");

      if (!response.ok) {
        pushActivity("warning", "Terminal", `${command} → ${response.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "terminal error";
      append(message, "err");
      pushActivity("error", "Terminal", message);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp" && history.length > 0) {
      event.preventDefault();
      setValue(history[history.length - 1]);
    }
  }

  return (
    <section className="flex shrink-0 flex-col border-t border-white/10 bg-[#070a10]">
      {/* tab strip */}
      <div className="flex h-8 items-center gap-1 px-2">
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand terminal" : "Collapse terminal"}
          className="rounded px-1.5 py-0.5 font-mono text-[10px] text-white/35 hover:text-white/80"
        >
          {collapsed ? "▸" : "▾"}
        </button>

        <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          {terminals.map((terminal) => {
            const isActive = terminal.id === activeTerminalId;
            return (
              <div
                key={terminal.id}
                className={`group flex shrink-0 items-center gap-1 border-b-2 px-2 py-1 font-mono text-[10px] ${
                  isActive
                    ? "border-cyan-400 bg-white/[0.04] text-white/85"
                    : "border-transparent text-white/35 hover:text-white/70"
                }`}
              >
                <button type="button" onClick={() => setActiveTerminal(terminal.id)}>
                  {terminal.title}
                </button>
                {terminals.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => closeTerminal(terminal.id)}
                    aria-label={`Close ${terminal.title}`}
                    className="text-white/20 opacity-0 transition group-hover:opacity-100 hover:text-rose-300"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addTerminal}
          aria-label="New terminal"
          className="rounded px-1.5 py-0.5 font-mono text-[11px] text-white/35 hover:text-white/80"
        >
          +
        </button>

        <button
          type="button"
          onClick={() => setEntries([])}
          className="ml-1 rounded px-1.5 py-0.5 font-mono text-[9.5px] text-white/25 hover:text-white/70"
        >
          clear
        </button>

        <span className="ml-auto shrink-0 font-mono text-[9.5px] text-white/25">
          {sandboxId ? `sandbox ${sandboxId.slice(0, 10)}` : "no sandbox"}
          {busy ? " · running" : ""}
        </span>
      </div>

      {collapsed ? null : (
        <div className="border-t border-white/5">
          <div
            ref={scroller}
            role="log"
            aria-live="polite"
            className="h-44 overflow-auto bg-[#05070c] px-3 py-2 font-mono text-[11px] leading-relaxed"
          >
            {entries.length === 0 ? (
              <p className="text-white/20">Terminal cleared.</p>
            ) : (
              entries.map((entry) => (
                <p
                  key={entry.id}
                  className={
                    entry.kind === "cmd"
                      ? "text-cyan-300"
                      : entry.kind === "err"
                        ? "whitespace-pre-wrap break-words text-rose-300"
                        : "whitespace-pre-wrap break-words text-white/70"
                  }
                >
                  {entry.text || " "}
                </p>
              ))
            )}
          </div>

          <form
            onSubmit={submit}
            className="flex items-center gap-2 border-t border-white/5 px-3 py-1.5"
          >
            <span className="font-mono text-[11px] text-emerald-300">$</span>
            <input
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="ls, npm test, git status…"
              spellCheck={false}
              autoComplete="off"
              className="w-full bg-transparent font-mono text-[11px] text-white/85 outline-none placeholder:text-white/20"
            />
            <button
              type="submit"
              disabled={busy || !value.trim()}
              className="rounded border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/50 hover:text-white/90 disabled:opacity-30"
            >
              {busy ? "run…" : "run"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}