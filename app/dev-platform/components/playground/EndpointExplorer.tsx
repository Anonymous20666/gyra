"use client";

import { Lock, Search } from "lucide-react";
import { useState } from "react";
import {
  GYRA_CATEGORIES,
  getEndpointsByCategory,
  type ApiCategoryId,
  type GyraEndpointSpec,
} from "../../lib/gyraCatalog";
import { CategoryIcon } from "../shell/GyraMark";

interface EndpointExplorerProps {
  activeCategory: ApiCategoryId;
  activeEndpointId: string;
  onSelectCategory: (cat: ApiCategoryId) => void;
  onSelectEndpoint: (ep: GyraEndpointSpec) => void;
}

export function EndpointExplorer({
  activeCategory,
  activeEndpointId,
  onSelectCategory,
  onSelectEndpoint,
}: EndpointExplorerProps) {
  const [query, setQuery] = useState("");

  const categoryMeta =
    GYRA_CATEGORIES.find((c) => c.id === activeCategory) ?? GYRA_CATEGORIES[0];
  const categoryEndpoints = getEndpointsByCategory(activeCategory);

  const filteredEndpoints = categoryEndpoints.filter((ep) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      ep.title.toLowerCase().includes(q) ||
      ep.path.toLowerCase().includes(q) ||
      ep.shortDescription.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      {/* Category Selector */}
      <div className="p-3 border-b border-[#1F1F23]">
        <p className="text-[11px] font-medium text-[#71717A] mb-2 px-0.5">
          API Categories
        </p>
        <div className="grid grid-cols-2 gap-1.5" role="tablist" aria-label="API Categories">
          {GYRA_CATEGORIES.map((cat) => {
            const selected = cat.id === activeCategory;
            const liveCount = getEndpointsByCategory(cat.id).filter(
              (e) => e.availability === "live"
            ).length;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-2 py-2 rounded-md border text-left transition-colors ${
                  selected
                    ? "bg-[#121215] border-[#5B9EC2]/70 text-[#F4F4F5]"
                    : "bg-[#09090B] border-[#1F1F23] text-[#A1A1AA] hover:border-[#2E2E34] hover:text-[#E4E4E7]"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <CategoryIcon
                      category={cat.id}
                      className={`w-3.5 h-3.5 shrink-0 ${
                        selected ? "text-[#5B9EC2]" : "text-[#71717A]"
                      }`}
                    />
                    <span className="text-[12px] font-medium truncate">
                      {cat.shortName}
                    </span>
                  </span>
                  <span
                    className="font-mono text-[10.5px] text-[#71717A] tabular-nums shrink-0"
                    title={cat.availability === "live" ? `${liveCount} live endpoints` : "Unavailable — planned"}
                  >
                    {cat.availability === "live" ? liveCount : "—"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Summary & Search */}
      <div className="p-3 border-b border-[#1F1F23] space-y-2.5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-[13.5px] font-semibold text-[#F4F4F5]">
              {categoryMeta.name}
            </h2>
            <span
              className={`text-[11px] font-mono ${
                categoryMeta.availability === "live"
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {categoryMeta.availability === "live" ? "Live" : "Unavailable"}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-[#71717A] leading-snug">
            {categoryMeta.tagline}
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter endpoints..."
            aria-label="Filter endpoints"
            className="w-full bg-[#000000] border border-[#1F1F23] focus:border-[#5B9EC2] focus:outline-none rounded-md pl-8 pr-2.5 py-1.5 text-[12px] text-[#F4F4F5] placeholder-[#71717A]"
          />
        </div>
      </div>

      {/* Endpoint List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {categoryMeta.availability === "unavailable" && (
          <div className="mx-1 mb-2 p-3 rounded-md bg-[#09090B] border border-[#1F1F23] text-[12px] text-[#A1A1AA]">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Category Not Yet Live</span>
            </div>
            <p className="leading-relaxed text-[#71717A]">
              {categoryMeta.name} routes are planned and cannot be executed yet. Select{" "}
              <strong className="text-[#D4D4D8]">AI</strong> or{" "}
              <strong className="text-[#D4D4D8]">Media</strong> to run live endpoints.
            </p>
          </div>
        )}

        {filteredEndpoints.map((ep) => {
          const isSelected = ep.id === activeEndpointId;
          const isDisabled = ep.availability !== "live";
          return (
            <button
              key={ep.id}
              type="button"
              onClick={() => onSelectEndpoint(ep)}
              className={`w-full text-left p-2.5 rounded-md border transition-colors ${
                isSelected
                  ? "bg-[#121215] border-[#5B9EC2]/70"
                  : isDisabled
                    ? "bg-transparent border-transparent opacity-65 hover:bg-[#09090B]"
                    : "bg-transparent border-transparent hover:bg-[#09090B] hover:border-[#1F1F23]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`font-mono text-[10.5px] font-semibold shrink-0 ${
                      ep.method === "GET"
                        ? "text-emerald-400"
                        : ep.method === "DELETE"
                          ? "text-red-400"
                          : "text-[#5B9EC2]"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-[13px] font-medium text-[#F4F4F5] truncate">
                    {ep.title}
                  </span>
                </div>
                <span className="font-mono text-[10.5px] text-[#71717A] whitespace-nowrap shrink-0">
                  {ep.costLabel}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-[#71717A] truncate">
                {ep.path}
              </p>
              <p className="mt-1 text-[11.5px] text-[#A1A1AA] line-clamp-2 leading-snug">
                {ep.shortDescription}
              </p>
            </button>
          );
        })}

        {filteredEndpoints.length === 0 && (
          <p className="px-3 py-6 text-center text-[12px] text-[#71717A]">
            No endpoints match “{query}”.
          </p>
        )}
      </div>

      {/* Key Prefix Reference Footer */}
      <div className="px-3 py-2.5 border-t border-[#1F1F23] text-[11.5px] text-[#71717A] flex items-center justify-between">
        <span>Key scope</span>
        <code className="text-[#A1A1AA] text-[11px]">{categoryMeta.keyPrefix}•••</code>
      </div>
    </div>
  );
}
