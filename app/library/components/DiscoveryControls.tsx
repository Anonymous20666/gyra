"use client";

import { useEffect, useRef } from "react";
import { ArrowUpDown, Search, X } from "lucide-react";
import type { PromptCategory } from "../data";
import type { SortMode } from "../utils";
import CategoryIcon from "./CategoryIcon";

type DiscoveryControlsProps = {
  categories: PromptCategory[];
  totalCount: number;
  visibleCount: number;
  query: string;
  activeCategory: string | null;
  sortMode: SortMode;
  onQueryChange: (value: string) => void;
  onSelectCategory: (categoryId: string | null) => void;
  onSortChange: (sort: SortMode) => void;
};

export default function DiscoveryControls({
  categories,
  totalCount,
  visibleCount,
  query,
  activeCategory,
  sortMode,
  onQueryChange,
  onSelectCategory,
  onSortChange,
}: DiscoveryControlsProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  // Press "/" anywhere outside inputs to focus search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Keep selected category visible in horizontal mobile scroller
  useEffect(() => {
    activeTabRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeCategory]);

  return (
    <div className="space-y-4">
      {/* Search + Sort + Live result count */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            strokeWidth={1.75}
          />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search prompts, tasks or categories..."
            aria-label="Search prompt samples"
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111115] pl-10 pr-16 text-sm text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#1F5B7C] dark:focus:border-[#5B9EC2] focus:outline-none transition-colors"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                onQueryChange("");
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          ) : (
            <kbd className="pointer-events-none hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 items-center rounded border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
              /
            </kbd>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
            {visibleCount === totalCount
              ? `${totalCount} samples`
              : `${visibleCount} of ${totalCount} samples`}
          </span>

          <div className="relative flex items-center">
            <ArrowUpDown
              className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-zinc-400"
              strokeWidth={1.75}
            />
            <select
              value={sortMode}
              onChange={(e) => onSortChange(e.target.value as SortMode)}
              aria-label="Sort prompt samples"
              className="h-9 appearance-none rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111115] pl-8 pr-7 text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:border-[#1F5B7C] dark:focus:border-[#5B9EC2] focus:outline-none cursor-pointer"
            >
              <option value="category">By category</option>
              <option value="alphabetical">A to Z</option>
              <option value="quickest">Fewest fields</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Selector: horizontal scroll rail on mobile, clean filter bar on desktop */}
      <div
        role="tablist"
        aria-label="Prompt categories"
        className="-mx-4 px-4 sm:mx-0 sm:px-0 flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          ref={activeCategory === null ? activeTabRef : undefined}
          type="button"
          role="tab"
          aria-selected={activeCategory === null}
          onClick={() => onSelectCategory(null)}
          className={`inline-flex h-10 sm:h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2] ${
            activeCategory === null
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950"
              : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111115] text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-100"
          }`}
        >
          <CategoryIcon categoryId={null} className="h-3.5 w-3.5 shrink-0" />
          <span>All</span>
          <span
            className={`tabular-nums text-[11px] ${
              activeCategory === null
                ? "text-white/70 dark:text-zinc-950/60"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            {totalCount}
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              ref={isSelected ? activeTabRef : undefined}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectCategory(cat.id)}
              className={`inline-flex h-10 sm:h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2] ${
                isSelected
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950"
                  : "border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111115] text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-100"
              }`}
            >
              <CategoryIcon categoryId={cat.id} className="h-3.5 w-3.5 shrink-0" />
              <span>{cat.title}</span>
              <span
                className={`tabular-nums text-[11px] ${
                  isSelected
                    ? "text-white/70 dark:text-zinc-950/60"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {cat.prompts.length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
