"use client";

import { useEffect, useRef, useState } from "react";
import { BookmarkPlus, Check, Copy, Play, Square } from "lucide-react";
import { validatePromptInput, type GyraModelSpec } from "../../lib/modelCatalog";
import type { ComparisonResultItem } from "../../lib/playgroundStore";
import { streamGyraChat } from "./streamGyraChat";

export interface CompareSlotConfig {
  modelId: string;
  think: boolean;
  search: boolean;
}

export interface CompareModeWorkspaceProps {
  chatModels: GyraModelSpec[];
  slotA: CompareSlotConfig;
  slotB: CompareSlotConfig;
  systemPrompt: string;
  draftPrompt: string;
  onChangeDraftPrompt: (val: string) => void;
  results: ComparisonResultItem[];
  onChangeResults: (next: ComparisonResultItem[]) => void;
  onSavePrompt: (prompt: string) => void;
  onRunMeta: (meta: { latencyMs: number; ttftMs: number | null; status: string }) => void;
  accessToken: string | null;
}

export function CompareModeWorkspace({
  chatModels,
  slotA,
  slotB,
  systemPrompt,
  draftPrompt,
  onChangeDraftPrompt,
  results,
  onChangeResults,
  onSavePrompt,
  onRunMeta,
  accessToken,
}: CompareModeWorkspaceProps) {
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedSlot, setCopiedSlot] = useState<string | null>(null);
  const controllersRef = useRef<AbortController[]>([]);

  useEffect(() => {
    return () => {
      controllersRef.current.forEach((c) => c.abort());
    };
  }, []);

  const labelForSlot = (cfg: CompareSlotConfig) => {
    const m = chatModels.find((x) => x.id === cfg.modelId)?.name ?? cfg.modelId;
    const flags = [cfg.think ? "Think" : null, cfg.search ? "Search" : null].filter(Boolean);
    return flags.length ? `${m} (${flags.join(" + ")})` : m;
  };

  const handleRunCompare = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (running) return;
    const check = validatePromptInput("compare", draftPrompt);
    if (!check.ok) {
      setErrorMsg(check.error);
      return;
    }

    setErrorMsg(null);
    setRunning(true);

    const initial: ComparisonResultItem[] = [
      {
        slot: "A",
        modelId: slotA.modelId,
        label: labelForSlot(slotA),
        think: slotA.think,
        search: slotA.search,
        content: "",
        ttftMs: null,
        totalMs: null,
        status: "streaming",
      },
      {
        slot: "B",
        modelId: slotB.modelId,
        label: labelForSlot(slotB),
        think: slotB.think,
        search: slotB.search,
        content: "",
        ttftMs: null,
        totalMs: null,
        status: "streaming",
      },
    ];

    let live = [...initial];
    onChangeResults(live);

    const updateSlot = (
      slot: "A" | "B",
      updater: (cur: ComparisonResultItem) => ComparisonResultItem,
    ) => {
      live = live.map((item) => (item.slot === slot ? updater(item) : item));
      onChangeResults(live);
    };

    const messages: { role: "system" | "user"; content: string }[] = [];
    if (systemPrompt.trim()) {
      messages.push({ role: "system", content: systemPrompt.trim() });
    }
    messages.push({ role: "user", content: check.clean });

    const ctrlA = new AbortController();
    const ctrlB = new AbortController();
    controllersRef.current = [ctrlA, ctrlB];
    const started = performance.now();

    const runOne = async (slot: "A" | "B", cfg: CompareSlotConfig, ctrl: AbortController) => {
      try {
        const res = await streamGyraChat({
          messages,
          model: cfg.modelId,
          think: cfg.think,
          search: cfg.search,
          accessToken,
          signal: ctrl.signal,
          onContent: (chunk) => {
            updateSlot(slot, (c) => ({ ...c, content: c.content + chunk }));
          },
          onReasoning: (chunk) => {
            updateSlot(slot, (c) => ({
              ...c,
              reasoning: (c.reasoning ? `${c.reasoning}\n` : "") + chunk,
            }));
          },
        });
        updateSlot(slot, (c) => ({
          ...c,
          content: res.content || c.content,
          ttftMs: res.ttftMs,
          totalMs: res.totalMs,
          status: "done",
        }));
      } catch (err: unknown) {
        const er = err as Error;
        updateSlot(slot, (c) => ({
          ...c,
          status: "error",
          error: er.name === "AbortError" ? "Stopped" : er.message || "Request failed.",
        }));
      }
    };

    await Promise.all([runOne("A", slotA, ctrlA), runOne("B", slotB, ctrlB)]);

    const elapsed = Math.round(performance.now() - started);
    onRunMeta({ latencyMs: elapsed, ttftMs: null, status: "Comparison Finished" });
    setRunning(false);
    controllersRef.current = [];
  };

  const handleCopy = async (slot: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSlot(slot);
      window.setTimeout(() => setCopiedSlot(null), 1500);
    } catch {
      // ignore
    }
  };

  const panes: ComparisonResultItem[] =
    results.length === 2
      ? results
      : [
          {
            slot: "A",
            modelId: slotA.modelId,
            label: labelForSlot(slotA),
            think: slotA.think,
            search: slotA.search,
            content: "",
            ttftMs: null,
            totalMs: null,
            status: "idle",
          },
          {
            slot: "B",
            modelId: slotB.modelId,
            label: labelForSlot(slotB),
            think: slotB.think,
            search: slotB.search,
            content: "",
            ttftMs: null,
            totalMs: null,
            status: "idle",
          },
        ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-[#586D80] dark:text-[#8BA0B2]">
          <span>
            Parallel side-by-side execution against <code className="font-mono-tech text-[12px]">/api/chat</code>. All latency and output metrics are measured live from each response stream.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {panes.map((pane) => (
            <section
              key={pane.slot}
              data-testid={`compare-pane-${pane.slot}`}
              className="flex min-h-[340px] flex-col border border-[#DCE4EC] bg-white dark:border-white/12 dark:bg-[#04080D]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4ECF3] px-4 py-2.5 dark:border-white/10">
                <div>
                  <span className="font-mono-tech text-[10.5px] tracking-[0.1em] text-[#1B587A] uppercase dark:text-[#78B5D8]">
                    Model {pane.slot}
                  </span>
                  <h3 className="text-[13.5px] font-semibold text-[#0B1218] dark:text-white">
                    {pane.label}
                  </h3>
                </div>
                {pane.content && (
                  <button
                    type="button"
                    onClick={() => handleCopy(pane.slot, pane.content)}
                    className="inline-flex items-center gap-1 px-2 py-1 font-mono-tech text-[10.5px] text-[#576B7D] hover:text-[#0B1218] dark:text-[#8CA0B2] dark:hover:text-white"
                  >
                    {copiedSlot === pane.slot ? (
                      <Check className="h-3 w-3 text-[#4A9A80]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    <span>{copiedSlot === pane.slot ? "Copied" : "Copy"}</span>
                  </button>
                )}
              </div>

              {/* Real Measured Telemetry Row */}
              <div className="grid grid-cols-3 divide-x divide-[#E4ECF3] border-b border-[#E4ECF3] bg-[#F8FAFC] font-mono-tech text-[11px] dark:divide-white/10 dark:border-white/10 dark:bg-[#070D14]">
                <div className="px-3 py-1.5">
                  <span className="text-[#687C8F] dark:text-[#708598]">TTFT </span>
                  <span className="tabular-nums font-medium text-[#0B1218] dark:text-white">
                    {pane.ttftMs !== null ? `${pane.ttftMs}ms` : "—"}
                  </span>
                </div>
                <div className="px-3 py-1.5">
                  <span className="text-[#687C8F] dark:text-[#708598]">Total </span>
                  <span className="tabular-nums font-medium text-[#0B1218] dark:text-white">
                    {pane.totalMs !== null ? `${(pane.totalMs / 1000).toFixed(2)}s` : "—"}
                  </span>
                </div>
                <div className="px-3 py-1.5">
                  <span className="text-[#687C8F] dark:text-[#708598]">Chars </span>
                  <span className="tabular-nums font-medium text-[#0B1218] dark:text-white">
                    {pane.content.length > 0 ? pane.content.length.toLocaleString() : "—"}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 text-[13.5px] leading-[1.65] text-[#0F1B26] dark:text-[#E5EEF5]">
                {pane.status === "error" ? (
                  <p className="text-red-700 dark:text-red-300">{pane.error}</p>
                ) : pane.content ? (
                  <div className="whitespace-pre-wrap">{pane.content}</div>
                ) : pane.status === "streaming" ? (
                  <p className="font-mono-tech text-[12px] text-[#5B7083] dark:text-[#7F95A8]">
                    Streaming response from {pane.modelId}...
                  </p>
                ) : (
                  <p className="text-[13px] text-[#6B7E90] dark:text-[#6D8294]">
                    Ready. Configure Model A and Model B in the right panel, then submit one shared prompt below.
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mx-4 mb-2 border border-red-300 bg-red-50 px-3.5 py-2 text-[13px] text-red-800 sm:mx-6 dark:border-red-500/35 dark:bg-red-950/40 dark:text-red-200"
        >
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleRunCompare}
        className="shrink-0 border-t border-[#DCE4EC] bg-white p-3.5 sm:px-6 dark:border-white/10 dark:bg-[#04080D]"
      >
        <textarea
          value={draftPrompt}
          onChange={(e) => onChangeDraftPrompt(e.target.value)}
          rows={2}
          aria-label="Comparison prompt editor"
          placeholder="Enter one prompt to run simultaneously across Model A and Model B..."
          className="w-full resize-none border border-[#D4DFE9] bg-[#F8FAFC] px-3.5 py-2.5 text-[14px] text-[#0B1218] placeholder-[#7B8E9F] focus:border-[#1F5B7C] focus:outline-none dark:border-white/12 dark:bg-[#070D14] dark:text-white dark:placeholder-[#5D7182] dark:focus:border-[#5B9EC2]"
        />
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={!draftPrompt.trim()}
            onClick={() => onSavePrompt(draftPrompt)}
            className="inline-flex min-h-[34px] items-center gap-1.5 border border-[#D4DFE9] px-2.5 py-1 font-mono-tech text-[11px] text-[#455A6C] transition-colors hover:border-[#1B587A] hover:text-[#0B1218] disabled:opacity-40 dark:border-white/12 dark:text-[#8FA4B6] dark:hover:border-[#5B9EC2] dark:hover:text-white"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            <span>Save Prompt</span>
          </button>

          {running ? (
            <button
              type="button"
              onClick={() => controllersRef.current.forEach((c) => c.abort())}
              className="inline-flex min-h-[36px] items-center gap-1.5 border border-red-500 bg-red-600 px-4 py-1.5 font-mono-tech text-[11.5px] font-medium text-white uppercase hover:bg-red-700"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Stop Both</span>
            </button>
          ) : (
            <button
              type="submit"
              className="inline-flex min-h-[36px] items-center gap-1.5 border border-[#1B587A] bg-[#1B587A] px-4 py-1.5 font-mono-tech text-[11.5px] font-medium text-white uppercase hover:bg-[#154865] dark:border-[#5B9EC2] dark:bg-[#1F5B7C] dark:hover:bg-[#286D93]"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Compare Models</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
