"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy, SlidersHorizontal } from "lucide-react";
import { getVariableSegments, type EnrichedPrompt } from "../utils";
import CategoryIcon from "./CategoryIcon";

type PromptCardProps = {
  item: EnrichedPrompt;
  showCategoryLabel?: boolean;
  onPreview: (item: EnrichedPrompt) => void;
  onUsePrompt: (item: EnrichedPrompt) => void;
  onCopyPrompt: (item: EnrichedPrompt) => void;
};

export default function PromptCard({
  item,
  showCategoryLabel = true,
  onPreview,
  onUsePrompt,
  onCopyPrompt,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyPrompt(item);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <article
      onClick={() => onPreview(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPreview(item);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Preview ${item.title}`}
      className="group flex flex-col rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111115] p-4 sm:p-5 text-left transition-colors hover:border-[#1F5B7C]/60 dark:hover:border-[#5B9EC2]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2] cursor-pointer"
    >
      {/* Top quiet metadata line */}
      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <CategoryIcon
            categoryId={item.categoryId}
            className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400 group-hover:text-[#1F5B7C] dark:group-hover:text-[#7DD3FC] transition-colors"
          />
          {showCategoryLabel && (
            <span className="truncate font-medium text-zinc-600 dark:text-zinc-300">
              {item.categoryTitle}
            </span>
          )}
        </span>

        {item.variables.length > 0 && (
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
            {item.variables.length} {item.variables.length === 1 ? "field" : "fields"}
          </span>
        )}
      </div>

      {/* Title & concise description */}
      <h3 className="mt-2.5 text-[15px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 group-hover:text-[#1F5B7C] dark:group-hover:text-[#7DD3FC] transition-colors">
        {item.title}
      </h3>
      <p className="mt-1 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {item.description}
      </p>

      {/* Readable monospace template excerpt with highlighted placeholders */}
      <div className="mt-3.5 rounded-lg border border-zinc-200/75 dark:border-zinc-800/80 bg-zinc-50/90 dark:bg-[#0A0A0D] px-3 py-2.5 font-mono text-[12px] leading-[1.6] text-zinc-700 dark:text-zinc-300 line-clamp-3">
        {getVariableSegments(item.prompt).map((seg, idx) =>
          seg.type === "variable" ? (
            <span
              key={idx}
              className="font-medium text-[#1F5B7C] dark:text-[#7DD3FC]"
            >
              {seg.token}
            </span>
          ) : (
            <span key={idx}>{seg.value}</span>
          )
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPreview(item);
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 -ml-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>Customize</span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${item.title} prompt`}
            title="Copy prompt"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
            ) : (
              <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUsePrompt(item);
            }}
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 text-xs font-medium text-white dark:text-zinc-950 hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <span>Use</span>
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </article>
  );
}
