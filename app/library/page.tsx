"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, SearchX } from "lucide-react";
import ToastContainer, { showToast } from "@/app/components/Toast";
import { PROMPT_LIBRARY } from "./data";
import {
  PENDING_PROMPT_STORAGE_KEY,
  enrichPromptLibrary,
  filterPrompts,
  type EnrichedPrompt,
  type SortMode,
} from "./utils";
import SamplesHeader from "./components/SamplesHeader";
import SamplesHero from "./components/SamplesHero";
import DiscoveryControls from "./components/DiscoveryControls";
import PromptCard from "./components/PromptCard";
import PromptDetailDrawer from "./components/PromptDetailDrawer";
import CategoryIcon from "./components/CategoryIcon";

export default function PromptSamplesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("category");
  const [selectedPrompt, setSelectedPrompt] = useState<EnrichedPrompt | null>(null);

  const allPrompts = useMemo(() => enrichPromptLibrary(PROMPT_LIBRARY), []);

  const visiblePrompts = useMemo(
    () => filterPrompts(allPrompts, query, activeCategory, sortMode),
    [allPrompts, query, activeCategory, sortMode]
  );

  const featuredPrompt = useMemo(() => {
    if (activeCategory) {
      return allPrompts.find((p) => p.categoryId === activeCategory) || allPrompts[0] || null;
    }
    return allPrompts[0] || null;
  }, [allPrompts, activeCategory]);

  // Group by category when viewing "All" in default category order with no active search
  const showGroupedByCategory =
    activeCategory === null && sortMode === "category" && query.trim().length === 0;

  const groupedSections = useMemo(() => {
    if (!showGroupedByCategory) return [];
    return PROMPT_LIBRARY.map((cat) => ({
      ...cat,
      items: visiblePrompts.filter((p) => p.categoryId === cat.id),
    })).filter((cat) => cat.items.length > 0);
  }, [showGroupedByCategory, visiblePrompts]);

  const launchInChat = useCallback(
    (promptText: string) => {
      const cleaned = promptText.trim();
      if (!cleaned) return;

      try {
        sessionStorage.setItem(PENDING_PROMPT_STORAGE_KEY, cleaned);
      } catch {
        // Fallback to URL param below
      }

      if (cleaned.length <= 1400) {
        router.push(`/dashboard?prompt=${encodeURIComponent(cleaned)}`);
      } else {
        router.push("/dashboard?from=samples");
      }
    },
    [router]
  );

  const copyPromptText = useCallback(async (promptText: string) => {
    try {
      await navigator.clipboard.writeText(promptText);
      showToast("Prompt copied to clipboard", "success");
    } catch {
      showToast("Could not access clipboard", "error");
    }
  }, []);

  const resetFilters = () => {
    setQuery("");
    setActiveCategory(null);
    setSortMode("category");
  };

  return (
    <div className="min-h-[100dvh] bg-white dark:bg-[#09090B] text-zinc-950 dark:text-zinc-100 flex flex-col">
      <SamplesHeader />

      <SamplesHero
        totalPrompts={allPrompts.length}
        totalCategories={PROMPT_LIBRARY.length}
        featuredPrompt={featuredPrompt}
        onPreviewFeatured={(item) => setSelectedPrompt(item)}
        onUseFeatured={(item) => launchInChat(item.prompt)}
      />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-[max(4rem,calc(env(safe-area-inset-bottom)+3rem))]">
        <DiscoveryControls
          categories={PROMPT_LIBRARY}
          totalCount={allPrompts.length}
          visibleCount={visiblePrompts.length}
          query={query}
          activeCategory={activeCategory}
          sortMode={sortMode}
          onQueryChange={setQuery}
          onSelectCategory={setActiveCategory}
          onSortChange={setSortMode}
        />

        <div className="mt-7 sm:mt-8">
          {visiblePrompts.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#101014] px-6 py-14 text-center">
              <SearchX
                className="mx-auto h-7 w-7 text-zinc-400 dark:text-zinc-500"
                strokeWidth={1.5}
              />
              <h2 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                No matching prompt samples
              </h2>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                {query.trim()
                  ? `Nothing matched "${query.trim()}". Try broader keywords or clear your category filter.`
                  : "This category does not have any matching prompts right now."}
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 text-xs font-medium text-white dark:text-zinc-950 hover:opacity-90 transition-opacity"
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Reset filters</span>
              </button>
            </div>
          ) : showGroupedByCategory ? (
            <div className="space-y-10 sm:space-y-12">
              {groupedSections.map((section) => (
                <section
                  key={section.id}
                  aria-labelledby={`cat-heading-${section.id}`}
                  className="space-y-4"
                >
                  <div className="flex items-end justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CategoryIcon
                          categoryId={section.id}
                          className="h-4 w-4 text-[#1F5B7C] dark:text-[#7DD3FC] shrink-0"
                        />
                        <h2
                          id={`cat-heading-${section.id}`}
                          className="text-base sm:text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
                        >
                          {section.title}
                        </h2>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                          · {section.items.length}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                        {section.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveCategory(section.id)}
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
                    >
                      Filter category
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {section.items.map((item) => (
                      <PromptCard
                        key={item.id}
                        item={item}
                        showCategoryLabel={false}
                        onPreview={(p) => setSelectedPrompt(p)}
                        onUsePrompt={(p) => launchInChat(p.prompt)}
                        onCopyPrompt={(p) => void copyPromptText(p.prompt)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visiblePrompts.map((item) => (
                <PromptCard
                  key={item.id}
                  item={item}
                  showCategoryLabel={activeCategory === null}
                  onPreview={(p) => setSelectedPrompt(p)}
                  onUsePrompt={(p) => launchInChat(p.prompt)}
                  onCopyPrompt={(p) => void copyPromptText(p.prompt)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Responsive Detail Sheet / Slide-over Drawer (key resets field state per prompt) */}
      <PromptDetailDrawer
        key={selectedPrompt?.id || "closed"}
        prompt={selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
        onUseResolvedPrompt={(resolved) => {
          setSelectedPrompt(null);
          launchInChat(resolved);
        }}
        onCopyResolvedPrompt={(resolved) => void copyPromptText(resolved)}
      />

      <ToastContainer />
    </div>
  );
}
