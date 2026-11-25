"use client";

import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { getVariableSegments, type EnrichedPrompt } from "../utils";
import CategoryIcon from "./CategoryIcon";

type SamplesHeroProps = {
  totalPrompts: number;
  totalCategories: number;
  featuredPrompt: EnrichedPrompt | null;
  onPreviewFeatured: (prompt: EnrichedPrompt) => void;
  onUseFeatured: (prompt: EnrichedPrompt) => void;
};

export default function SamplesHero({
  totalPrompts,
  totalCategories,
  featuredPrompt,
  onPreviewFeatured,
  onUseFeatured,
}: SamplesHeroProps) {
  return (
    <section className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-[#FAFAFB] dark:bg-[#0B0B0E]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Primary editorial intro */}
          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs font-semibold tracking-wider text-[#1F5B7C] dark:text-[#7DD3FC]">
              Prompt collection
            </p>

            <h1
              className="text-3xl sm:text-4xl lg:text-[42px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 leading-[1.1] text-balance"
              style={{ fontFamily: "var(--font-gyra-display), sans-serif" }}
            >
              Find the right starting point.
            </h1>

            <p className="max-w-xl text-sm sm:text-[15px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Explore thoughtfully crafted prompts for writing, coding, research,
              business, learning, and creative work. Choose a sample, personalize its
              fields, and open it directly in Gyra Chat.
            </p>

            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-1 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
              <span>{totalPrompts} templates</span>
              <span aria-hidden="true">·</span>
              <span>{totalCategories} categories</span>
              <span aria-hidden="true">·</span>
              <span>Editable placeholders</span>
            </div>
          </div>

          {/* Desktop interactive sample preview (compact, real data from PROMPT_LIBRARY) */}
          {featuredPrompt && (
            <div className="hidden lg:block lg:col-span-5">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111115] p-5">
                <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                    <CategoryIcon
                      categoryId={featuredPrompt.categoryId}
                      className="h-3.5 w-3.5 text-[#1F5B7C] dark:text-[#7DD3FC]"
                    />
                    <span>{featuredPrompt.categoryTitle}</span>
                  </span>
                  <span className="tabular-nums">
                    {featuredPrompt.variables.length}{" "}
                    {featuredPrompt.variables.length === 1 ? "field" : "fields"}
                  </span>
                </div>

                <h2 className="mt-2.5 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {featuredPrompt.title}
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {featuredPrompt.description}
                </p>

                <div className="mt-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0A0A0D] px-3.5 py-3 font-mono text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 line-clamp-3">
                  {getVariableSegments(featuredPrompt.prompt).map((seg, idx) =>
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

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onPreviewFeatured(featuredPrompt)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>Personalize</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUseFeatured(featuredPrompt)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F5B7C] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#194a66] transition-colors"
                  >
                    <span>Use in Chat</span>
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
