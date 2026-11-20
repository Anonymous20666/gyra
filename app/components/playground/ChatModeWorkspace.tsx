"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BookmarkPlus,
  Check,
  ChevronDown,
  Copy,
  CornerDownLeft,
  RotateCcw,
  Square,
  Trash2,
} from "lucide-react";
import { validatePromptInput, type GyraModelSpec } from "../../lib/modelCatalog";
import type { ChatTurn } from "../../lib/playgroundStore";
import { streamGyraChat } from "./streamGyraChat";

export interface ChatModeWorkspaceProps {
  model: GyraModelSpec;
  params: Record<string, string | number | boolean>;
  systemPrompt: string;
  onChangeSystemPrompt: (val: string) => void;
  turns: ChatTurn[];
  onChangeTurns: (next: ChatTurn[]) => void;
  draftPrompt: string;
  onChangeDraftPrompt: (val: string) => void;
  onSavePrompt: (prompt: string, systemPrompt: string) => void;
  onRunMeta: (meta: { latencyMs: number; ttftMs: number | null; status: string }) => void;
  accessToken: string | null;
}

export function ChatModeWorkspace({
  model,
  params,
  systemPrompt,
  onChangeSystemPrompt,
  turns,
  onChangeTurns,
  draftPrompt,
  onChangeDraftPrompt,
  onSavePrompt,
  onRunMeta,
  accessToken,
}: ChatModeWorkspaceProps) {
  const [systemOpen, setSystemOpen] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, streaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const executeTurns = async (historyTurns: ChatTurn[]) => {
    setErrorMsg(null);
    setNeedsUpgrade(false);
    setStreaming(true);
    setStatusLine(`Connecting to ${model.name}...`);

    const assistantId = `ast-${Date.now().toString(36)}`;
    const placeholder: ChatTurn = {
      id: assistantId,
      role: "assistant",
      content: "",
      reasoning: "",
      modelId: model.id,
      createdAt: new Date().toISOString(),
    };

    let working = [...historyTurns, placeholder];
    onChangeTurns(working);

    const controller = new AbortController();
    abortRef.current = controller;

    const apiMessages: { role: "system" | "user" | "assistant"; content: string }[] = [];
    if (systemPrompt.trim()) {
      apiMessages.push({ role: "system", content: systemPrompt.trim() });
    }
    for (const t of historyTurns) {
      apiMessages.push({ role: t.role, content: t.content });
    }

    try {
      const res = await streamGyraChat({
        messages: apiMessages,
        model: model.id,
        think: Boolean(params.think),
        search: Boolean(params.search),
        accessToken,
        signal: controller.signal,
        onStatus: (agent, st) => setStatusLine(`${agent}: ${st}`),
        onReasoning: (chunk) => {
          working = working.map((t) =>
            t.id === assistantId
              ? { ...t, reasoning: (t.reasoning ? `${t.reasoning}\n` : "") + chunk }
              : t,
          );
          onChangeTurns(working);
        },
        onContent: (chunk) => {
          working = working.map((t) =>
            t.id === assistantId ? { ...t, content: t.content + chunk } : t,
          );
          onChangeTurns(working);
        },
        onImage: (url) => {
          working = working.map((t) =>
            t.id === assistantId ? { ...t, imageUrl: url } : t,
          );
          onChangeTurns(working);
        },
      });

      working = working.map((t) =>
        t.id === assistantId
          ? {
              ...t,
              content: res.content || t.content || "(Empty response returned by provider.)",
              reasoning: res.reasoning || t.reasoning,
              imageUrl: res.imageUrl || t.imageUrl,
              latencyMs: res.totalMs,
            }
          : t,
      );
      onChangeTurns(working);
      onRunMeta({ latencyMs: res.totalMs, ttftMs: res.ttftMs, status: "200 OK" });
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      if (e.name === "AbortError") {
        setStatusLine("Generation stopped by user.");
        onRunMeta({ latencyMs: 0, ttftMs: null, status: "Aborted" });
      } else {
        if (e.status === 402 || e.status === 403) setNeedsUpgrade(true);
        setErrorMsg(e.message || "Chat request failed.");
        working = working.filter((t) => !(t.id === assistantId && !t.content));
        onChangeTurns(working);
        onRunMeta({
          latencyMs: 0,
          ttftMs: null,
          status: e.status ? `HTTP ${e.status}` : "Error",
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      window.setTimeout(() => setStatusLine(null), 1600);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (streaming) return;
    const check = validatePromptInput("chat", draftPrompt);
    if (!check.ok) {
      setErrorMsg(check.error);
      return;
    }

    const userTurn: ChatTurn = {
      id: `usr-${Date.now().toString(36)}`,
      role: "user",
      content: check.clean,
      createdAt: new Date().toISOString(),
    };
    onChangeDraftPrompt("");
    await executeTurns([...turns, userTurn]);
  };

  const handleRegenerate = async () => {
    if (streaming || turns.length === 0) return;
    const lastUserIdx = [...turns].reverse().findIndex((t) => t.role === "user");
    if (lastUserIdx === -1) return;
    const cutIndex = turns.length - lastUserIdx;
    await executeTurns(turns.slice(0, cutIndex));
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  const STARTER_PROMPTS = [
    "Design an idempotent webhook processor in TypeScript with replay protection.",
    "Compare server-sent events vs WebSockets for streaming LLM tokens at edge latency.",
    "Write a concise architectural checklist before shipping an authenticated fal.ai proxy.",
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Collapsible System Instructions */}
      <div className="border-b border-[#DCE4EC] bg-white dark:border-white/10 dark:bg-[#04080D]">
        <button
          type="button"
          onClick={() => setSystemOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-[#F3F7FA] dark:hover:bg-white/[0.03]"
        >
          <span className="font-mono-tech text-[10.5px] font-medium tracking-[0.12em] text-[#516578] uppercase dark:text-[#869BAC]">
            System Instructions
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#64788B] transition-transform ${
              systemOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>
        {systemOpen && (
          <div className="px-4 pb-3">
            <textarea
              value={systemPrompt}
              onChange={(e) => onChangeSystemPrompt(e.target.value)}
              rows={2}
              aria-label="System instructions"
              placeholder="Define assistant persona, constraints, or response format..."
              className="w-full resize-y border border-[#D4DFE9] bg-[#F8FAFC] px-3 py-2 text-[13px] text-[#0B1218] placeholder-[#7C8F9F] focus:border-[#1F5B7C] focus:outline-none dark:border-white/12 dark:bg-[#070D14] dark:text-[#EDF4FA] dark:placeholder-[#5D7182] dark:focus:border-[#5B9EC2]"
            />
          </div>
        )}
      </div>

      {/* Conversation Transcript */}
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {turns.length === 0 ? (
          <div className="mx-auto max-w-[680px] py-10">
            <p className="font-mono-tech text-[11px] tracking-[0.12em] text-[#5B7083] uppercase dark:text-[#7E96AA]">
              Chat Playground · {model.name}
            </p>
            <h2 className="font-display mt-2 text-[24px] font-bold text-[#0B1218] dark:text-white">
              Start a streaming session
            </h2>
            <p className="mt-1.5 text-[14px] leading-[1.6] text-[#576B7D] dark:text-[#8FA2B3]">
              Requests execute directly against <code className="font-mono-tech text-[12.5px]">/api/chat</code> with live SSE streaming, optional step-by-step Deep Think, and Atlas internal web search.
            </p>
            <div className="mt-5 grid gap-2">
              {STARTER_PROMPTS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => onChangeDraftPrompt(sp)}
                  className="border border-[#DCE4EC] bg-white px-3.5 py-2.5 text-left text-[13px] text-[#283B4C] transition-colors hover:border-[#1B587A] hover:text-[#0B1218] dark:border-white/10 dark:bg-[#060B11] dark:text-[#C5D5E2] dark:hover:border-[#5B9EC2] dark:hover:text-white"
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[780px] space-y-5">
            {turns.map((turn, idx) => {
              const isUser = turn.role === "user";
              const isLast = idx === turns.length - 1;
              return (
                <article
                  key={turn.id}
                  className={`border p-4 ${
                    isUser
                      ? "border-[#D4DFE9] bg-[#F2F6FA] dark:border-white/10 dark:bg-[#081018]"
                      : "border-[#DCE4EC] bg-white dark:border-white/12 dark:bg-[#04080D]"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-mono-tech text-[10.5px] tracking-[0.08em] uppercase">
                      <span className="font-semibold text-[#0B1218] dark:text-white">
                        {isUser ? "User" : turn.modelId || model.id}
                      </span>
                      {turn.latencyMs !== undefined && turn.latencyMs > 0 && (
                        <>
                          <span className="text-[#9AAAB8] dark:text-[#4D6070]">·</span>
                          <span className="tabular-nums text-[#5B7083] dark:text-[#7E94A6]">
                            {(turn.latencyMs / 1000).toFixed(2)}s
                          </span>
                        </>
                      )}
                    </div>
                    {!isUser && turn.content && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(turn.id, turn.content)}
                          className="inline-flex items-center gap-1 px-2 py-1 font-mono-tech text-[10.5px] text-[#576B7D] hover:text-[#0B1218] dark:text-[#8CA0B2] dark:hover:text-white"
                        >
                          {copiedId === turn.id ? (
                            <Check className="h-3 w-3 text-[#4A9A80]" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedId === turn.id ? "Copied" : "Copy"}</span>
                        </button>
                        {isLast && !streaming && (
                          <button
                            type="button"
                            onClick={handleRegenerate}
                            className="inline-flex items-center gap-1 px-2 py-1 font-mono-tech text-[10.5px] text-[#576B7D] hover:text-[#0B1218] dark:text-[#8CA0B2] dark:hover:text-white"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Regenerate</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {turn.reasoning && (
                    <div className="mb-3 border border-[#D4DFE9] bg-[#F7FAFC] dark:border-white/10 dark:bg-[#070D14]">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedReasoning((p) => ({ ...p, [turn.id]: !p[turn.id] }))
                        }
                        className="flex w-full items-center justify-between px-3 py-1.5 font-mono-tech text-[10.5px] text-[#556A7D] dark:text-[#879DB0]"
                      >
                        <span>Reasoning Trace</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            expandedReasoning[turn.id] ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                      </button>
                      {expandedReasoning[turn.id] && (
                        <pre className="whitespace-pre-wrap border-t border-[#E2E9F0] px-3 py-2.5 font-mono-tech text-[12px] leading-[1.6] text-[#455A6C] dark:border-white/10 dark:text-[#9CB0C1]">
                          {turn.reasoning}
                        </pre>
                      )}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap text-[14px] leading-[1.7] text-[#0F1B26] dark:text-[#E8F0F6]">
                    {turn.content || (streaming && isLast ? statusLine || "Streaming..." : "")}
                  </div>

                  {turn.imageUrl && (
                    <div className="mt-3 overflow-hidden border border-[#D4DFE9] dark:border-white/12">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={turn.imageUrl}
                        alt="Generated output"
                        referrerPolicy="no-referrer"
                        className="max-h-[420px] w-auto object-contain"
                      />
                    </div>
                  )}
                </article>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Error / Upgrade Banner */}
      {errorMsg && (
        <div
          role="alert"
          className="mx-4 mb-2 flex flex-wrap items-center justify-between gap-2 border border-red-300 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800 sm:mx-6 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-200"
        >
          <span>{errorMsg}</span>
          {needsUpgrade && (
            <Link
              href="/upgrade"
              className="border border-current px-2.5 py-1 font-mono-tech text-[11px] uppercase"
            >
              Upgrade Plan
            </Link>
          )}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-[#DCE4EC] bg-white p-3.5 sm:px-6 dark:border-white/10 dark:bg-[#04080D]"
      >
        <div className="mx-auto max-w-[780px]">
          <textarea
            value={draftPrompt}
            onChange={(e) => onChangeDraftPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            rows={3}
            aria-label="Chat prompt editor"
            placeholder="Write a prompt... (Ctrl/Cmd + Enter to send)"
            className="w-full resize-none border border-[#D4DFE9] bg-[#F8FAFC] px-3.5 py-2.5 text-[14px] text-[#0B1218] placeholder-[#7B8E9F] focus:border-[#1F5B7C] focus:outline-none dark:border-white/12 dark:bg-[#070D14] dark:text-white dark:placeholder-[#5D7182] dark:focus:border-[#5B9EC2]"
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!draftPrompt.trim()}
                onClick={() => onSavePrompt(draftPrompt, systemPrompt)}
                className="inline-flex min-h-[34px] items-center gap-1.5 border border-[#D4DFE9] px-2.5 py-1 font-mono-tech text-[11px] text-[#455A6C] transition-colors hover:border-[#1B587A] hover:text-[#0B1218] disabled:opacity-40 dark:border-white/12 dark:text-[#8FA4B6] dark:hover:border-[#5B9EC2] dark:hover:text-white"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                <span>Save Prompt</span>
              </button>
              {turns.length > 0 && (
                <button
                  type="button"
                  disabled={streaming}
                  onClick={() => onChangeTurns([])}
                  className="inline-flex min-h-[34px] items-center gap-1.5 border border-[#D4DFE9] px-2.5 py-1 font-mono-tech text-[11px] text-[#455A6C] transition-colors hover:border-red-400 hover:text-red-700 disabled:opacity-40 dark:border-white/12 dark:text-[#8FA4B6] dark:hover:border-red-500/50 dark:hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </button>
              )}
              {statusLine && (
                <span className="font-mono-tech text-[11px] text-[#1B587A] dark:text-[#78B5D8]">
                  {statusLine}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {streaming ? (
                <button
                  type="button"
                  onClick={() => abortRef.current?.abort()}
                  className="inline-flex min-h-[36px] items-center gap-1.5 border border-red-500 bg-red-600 px-4 py-1.5 font-mono-tech text-[11.5px] font-medium text-white uppercase transition-colors hover:bg-red-700"
                >
                  <Square className="h-3 w-3 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex min-h-[36px] items-center gap-1.5 border border-[#1B587A] bg-[#1B587A] px-4 py-1.5 font-mono-tech text-[11.5px] font-medium text-white uppercase transition-colors hover:bg-[#154865] dark:border-[#5B9EC2] dark:bg-[#1F5B7C] dark:hover:bg-[#286D93]"
                >
                  <span>Run Prompt</span>
                  <CornerDownLeft className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
