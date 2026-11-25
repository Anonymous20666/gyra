"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  RotateCcw,
  X,
} from "lucide-react";
import {
  getVariableSegments,
  renderResolvedPrompt,
  type EnrichedPrompt,
} from "../utils";
import CategoryIcon from "./CategoryIcon";

type PromptDetailDrawerProps = {
  prompt: EnrichedPrompt | null;
  onClose: () => void;
  onUseResolvedPrompt: (resolvedText: string) => void;
  onCopyResolvedPrompt: (resolvedText: string) => void;
};

export default function PromptDetailDrawer({
  prompt,
  onClose,
  onUseResolvedPrompt,
  onCopyResolvedPrompt,
}: PromptDetailDrawerProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Lock background scroll and allow Escape close
  useEffect(() => {
    if (!prompt) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [prompt, onClose]);

  const resolvedPrompt = useMemo(() => {
    if (!prompt) return "";
    return renderResolvedPrompt(prompt.prompt, values);
  }, [prompt, values]);

  const segments = useMemo(() => {
    if (!prompt) return [];
    return getVariableSegments(prompt.prompt);
  }, [prompt]);

  if (!prompt) return null;

  const filledCount = prompt.variables.filter(
    (v) => (values[v.rawKey.toLowerCase()] || "").trim().length > 0
  ).length;

  const handleCopy = () => {
    onCopyResolvedPrompt(resolvedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleReset = () => {
    setValues({});
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-detail-title"
    >
      {/* Mobile bottom sheet -> Desktop side panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-h-[90dvh] md:max-h-none md:h-full md:max-w-xl flex-col rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0E0E12] shadow-2xl overflow-hidden"
      >
        {/* Mobile grab handle */}
        <div className="flex justify-center pt-2.5 pb-1 md:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        {/* Sticky header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 px-5 sm:px-6 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <CategoryIcon
                categoryId={prompt.categoryId}
                className="h-3.5 w-3.5 text-[#1F5B7C] dark:text-[#7DD3FC]"
              />
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {prompt.categoryTitle}
              </span>
              {prompt.variables.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {filledCount}/{prompt.variables.length} filled
                  </span>
                </>
              )}
            </div>

            <h2
              id="prompt-detail-title"
              className="mt-1.5 text-lg sm:text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              {prompt.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {prompt.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close prompt preview"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-6">
          {/* Dynamic Variable Personalizer */}
          {prompt.variables.length > 0 && (
            <section aria-labelledby="personalize-heading" className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <h3
                  id="personalize-heading"
                  className="text-xs font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  Personalize template fields
                </h3>
                {filledCount > 0 && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {prompt.variables.map((variable) => {
                  const key = variable.rawKey.toLowerCase();
                  const val = values[key] || "";
                  const fieldId = `prompt-var-${key.replace(/[^a-z0-9]/g, "-")}`;

                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={fieldId}
                          className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                        >
                          {variable.label}
                        </label>
                        <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                          {variable.token}
                        </span>
                      </div>

                      {variable.multiline ? (
                        <textarea
                          id={fieldId}
                          rows={3}
                          value={val}
                          onChange={(e) =>
                            setValues((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          placeholder={variable.placeholder}
                          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#141418] px-3.5 py-2.5 text-sm text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#1F5B7C] dark:focus:border-[#5B9EC2] focus:bg-white dark:focus:bg-[#111115] focus:outline-none transition-colors resize-y"
                        />
                      ) : (
                        <input
                          id={fieldId}
                          type="text"
                          value={val}
                          onChange={(e) =>
                            setValues((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          placeholder={variable.placeholder}
                          className="h-10 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#141418] px-3.5 text-sm text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#1F5B7C] dark:focus:border-[#5B9EC2] focus:bg-white dark:focus:bg-[#111115] focus:outline-none transition-colors"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Complete Live Prompt Preview */}
          <section aria-labelledby="full-prompt-heading" className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3
                id="full-prompt-heading"
                className="text-xs font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Full prompt preview
              </h3>
              <span className="font-mono text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                {resolvedPrompt.length} chars
              </span>
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090C] p-4 font-mono text-[13px] leading-[1.7] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words">
              {segments.map((seg, idx) => {
                if (seg.type === "text") {
                  return <span key={idx}>{seg.value}</span>;
                }
                const customVal = (values[seg.rawKey.toLowerCase()] || "").trim();
                if (customVal) {
                  return (
                    <span
                      key={idx}
                      className="rounded bg-[#1F5B7C]/15 dark:bg-[#5B9EC2]/20 px-1 py-0.5 text-[#154663] dark:text-[#7DD3FC] font-medium"
                    >
                      {customVal}
                    </span>
                  );
                }
                return (
                  <span
                    key={idx}
                    className="rounded bg-zinc-200/80 dark:bg-zinc-800 px-1 py-0.5 text-zinc-700 dark:text-zinc-300"
                  >
                    {seg.token}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Opening in Gyra Chat places this prompt in your composer so you can review or edit before sending.
            </p>
          </section>
        </div>

        {/* Sticky Footer CTA Bar */}
        <div className="flex items-center justify-between gap-2.5 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#0E0E12] px-5 sm:px-6 pt-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" strokeWidth={2} />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" strokeWidth={1.75} />
                <span>Copy prompt</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onUseResolvedPrompt(resolvedPrompt)}
            className="inline-flex h-11 flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-5 text-xs font-semibold text-white dark:text-zinc-950 hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <span>Use in Gyra Chat</span>
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
