"use client";
// app/coding/components/AgentCockpit.tsx
// The right rail: conversation, mode, streaming agent run.

import { useEffect, useRef, useState } from "react";
import { AGENT_MODES, useWorkspace } from "../../lib/coding/store";

function parsePayload(raw: string): unknown {
  if (!raw) return "";
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

export default function AgentCockpit() {
  const messages = useWorkspace((state) => state.messages);
  const pushMessage = useWorkspace((state) => state.pushMessage);
  const appendText = useWorkspace((state) => state.appendText);
  const appendReasoning = useWorkspace((state) => state.appendReasoning);
  const patchMessage = useWorkspace((state) => state.patchMessage);
  const clearMessages = useWorkspace((state) => state.clearMessages);
  const streaming = useWorkspace((state) => state.streaming);
  const setStreaming = useWorkspace((state) => state.setStreaming);
  const running = useWorkspace((state) => state.running);
  const setRunning = useWorkspace((state) => state.setRunning);
  const mode = useWorkspace((state) => state.mode);
  const setMode = useWorkspace((state) => state.setMode);
  const sandboxId = useWorkspace((state) => state.sandboxId);
  const pushActivity = useWorkspace((state) => state.pushActivity);

  const [value, setValue] = useState("");
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, streaming]);

  useEffect(() => () => abort.current?.abort(), []);

  async function send() {
    const prompt = value.trim();
    if (!prompt || running) return;
    setValue("");
    pushMessage({ role: "user", content: prompt });
    const agentId = pushMessage({ role: "agent", content: "" });

    setRunning(true);
    setStreaming(true);
    const controller = new AbortController();
    abort.current = controller;

    try {
      const history = [...messages, { role: "user" as const, content: prompt }].map((message) => ({
        role: message.role === "agent" ? "assistant" : message.role === "system" ? "system" : "user",
        content: message.content,
      }));

      const response = await fetch("/api/coding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history, mode, sandboxId }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        patchMessage(agentId, {
          content: `Request failed with ${response.status}. ${await response.text().catch(() => "")}`.slice(0, 400),
          error: true,
        });
        pushActivity("error", "Agent request failed", String(response.status));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const raw of lines) {
          const line = raw.trim();
          if (!line) continue;
          const colon = line.indexOf(":");
          if (colon < 0) continue;
          const tag = line.slice(0, colon);
          const payload = parsePayload(line.slice(colon + 1).trim());

          if (tag === "0" && typeof payload === "string") {
            appendText(agentId, payload);
          } else if (tag === "g" && typeof payload === "string") {
            appendReasoning(agentId, payload);
          } else if (tag === "9") {
            const record = (payload ?? {}) as Record<string, unknown>;
            const name =
              typeof record.toolName === "string"
                ? record.toolName
                : typeof record.name === "string"
                  ? record.name
                  : "tool";
            patchMessage(agentId, { tool: name });
            pushActivity("tool", `tool · ${name}`);
          } else if (tag === "a") {
            const text = typeof payload === "string" ? payload : JSON.stringify(payload);
            pushActivity("result", text.slice(0, 160));
          } else if (tag === "3") {
            const text = typeof payload === "string" ? payload : "Agent error";
            appendText(agentId, text);
            patchMessage(agentId, { error: true });
            pushActivity("error", "Agent error", text.slice(0, 200));
          }
        }
      }
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) {
        const text = caught instanceof Error ? caught.message : "agent error";
        patchMessage(agentId, { content: text, error: true });
        pushActivity("error", "Agent error", text);
      }
    } finally {
      setRunning(false);
      setStreaming(false);
      abort.current = null;
    }
  }

  function stop() {
    abort.current?.abort();
    setRunning(false);
    setStreaming(false);
  }

  const activeMode = AGENT_MODES.find((entry) => entry.id === mode) ?? AGENT_MODES[0];

  return (
    <section className="hidden w-[330px] shrink-0 flex-col border-l border-white/10 bg-[#070a10] xl:flex">
      <div className="flex h-9 items-center gap-2 border-b border-white/10 px-3">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/30">agent</span>
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as typeof mode)}
          aria-label="Agent mode"
          className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-white/70 outline-none"
        >
          {AGENT_MODES.map((entry) => (
            <option key={entry.id} value={entry.id} className="bg-[#0b0f16]">
              {entry.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={clearMessages}
          className="ml-auto font-mono text-[9.5px] text-white/25 hover:text-white/70"
        >
          clear
        </button>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
        {messages.length === 0 ? (
          <p className="font-mono text-[10.5px] leading-relaxed text-white/25">
            {activeMode.hint}. Describe what you want built — every file write is tracked and can be
            reverted.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border px-2.5 py-2 ${
                message.role === "user"
                  ? "border-white/10 bg-white/[0.04]"
                  : message.error
                    ? "border-rose-400/30 bg-rose-400/5"
                    : "border-white/5 bg-white/[0.015]"
              }`}
            >
              <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/25">
                {message.role === "agent" ? "forge" : message.role}
                {message.tool ? ` · ${message.tool}` : ""}
              </p>
              {message.reasoning ? (
                <p className="mb-1 whitespace-pre-wrap border-l border-white/10 pl-2 font-mono text-[10px] text-white/30">
                  {message.reasoning}
                </p>
              ) : null}
              <p
                className={`whitespace-pre-wrap break-words text-[11.5px] leading-relaxed ${
                  message.error ? "text-rose-200" : "text-white/75"
                }`}
              >
                {message.content || (streaming && message.role === "agent" ? "…" : "")}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-white/10 p-2">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          rows={3}
          placeholder="Describe the change. Shift+Enter for a new line."
          className="w-full resize-none rounded-md border border-white/10 bg-[#05070c] px-2 py-1.5 font-mono text-[11px] leading-relaxed text-white/85 outline-none placeholder:text-white/20 focus:border-indigo-400/40"
        />
        <div className="mt-1.5 flex items-center gap-2">
          <span className="font-mono text-[9.5px] text-white/25">
            {sandboxId ? "sandbox attached" : "starting sandbox…"}
          </span>
          {running ? (
            <button
              type="button"
              onClick={stop}
              className="ml-auto rounded border border-rose-400/40 bg-rose-400/10 px-2.5 py-1 font-mono text-[10px] text-rose-200"
            >
              stop
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void send()}
              disabled={!value.trim() || !sandboxId}
              className="ml-auto rounded border border-indigo-400/40 bg-indigo-400/10 px-2.5 py-1 font-mono text-[10px] text-indigo-200 disabled:opacity-40"
            >
              send
            </button>
          )}
        </div>
      </div>
    </section>
  );
}