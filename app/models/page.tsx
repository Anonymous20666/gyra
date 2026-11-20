"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, Cpu, Search, SlidersHorizontal } from "lucide-react";
import { PlatformShell } from "../components/platform/PlatformShell";
import {
  GYRA_MODEL_CATALOG,
  getModelsByCategory,
  type GyraModelSpec,
  type ModelCategory,
} from "../lib/modelCatalog";

const CATEGORY_TABS: readonly { id: ModelCategory | "all"; label: string }[] = [
  { id: "all", label: "All Models" },
  { id: "chat", label: "Chat & Reasoning" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "voice", label: "Voice" },
  { id: "embeddings", label: "Upcoming" },
];

function playgroundHrefForModel(model: GyraModelSpec): string | null {
  if (model.availability === "coming-soon") return null;
  if (model.category === "chat") return `/playground?mode=chat&model=${encodeURIComponent(model.id)}`;
  if (model.category === "image") return `/playground?mode=image&model=${encodeURIComponent(model.id)}`;
  if (model.category === "video") return `/playground?mode=video&model=${encodeURIComponent(model.id)}`;
  return null;
}

export default function ModelsPage() {
  const [models, setModels] = useState<readonly GyraModelSpec[]>(GYRA_MODEL_CATALOG);
  const [category, setCategory] = useState<ModelCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(GYRA_MODEL_CATALOG[0].id);

  useEffect(() => {
    let active = true;
    fetch("/api/models")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.models) && data.models.length > 0) {
          setModels(data.models);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const byCat = getModelsByCategory(category, models);
    const q = search.trim().toLowerCase();
    if (!q) return byCat;
    return byCat.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.capabilities.some((c) => c.toLowerCase().includes(q)),
    );
  }, [category, models, search]);

  const selectedModel = useMemo(
    () => filtered.find((m) => m.id === selectedId) ?? filtered[0] ?? models[0],
    [filtered, selectedId, models],
  );

  const launchHref = selectedModel ? playgroundHrefForModel(selectedModel) : null;

  return (
    <PlatformShell
      title="Models"
      description="Inspect every AI model exposed by Gyra's backend, its exact input/output types, and supported parameters."
      actions={
        <Link
          href="/playground"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0B1220] dark:bg-white text-white dark:text-[#04080D] text-[12px] font-semibold hover:opacity-90 transition-opacity"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Playground</span>
        </Link>
      }
    >
      <div className="space-y-5">
        {/* Filter bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Model categories">
            {CATEGORY_TABS.map((tab) => {
              const active = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(tab.id)}
                  className={`h-8 px-3 rounded-md text-[12.5px] font-medium border transition-colors ${
                    active
                      ? "bg-[#0B1220] dark:bg-white text-white dark:text-[#04080D] border-transparent"
                      : "bg-white dark:bg-[#060C12] text-[#475569] dark:text-white/65 border-black/[0.09] dark:border-white/[0.09] hover:border-[#1F5B7C] dark:hover:border-[#5B9EC2]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="h-3.5 w-3.5 text-[#64748B] dark:text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter models..."
              aria-label="Filter models"
              className="w-full h-8 pl-8 pr-3 rounded-md bg-white dark:bg-[#060C12] border border-black/[0.1] dark:border-white/[0.1] text-[12.5px] text-[#0B1220] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] dark:placeholder:text-white/35 focus:outline-none focus:border-[#1F5B7C] dark:focus:border-[#5B9EC2]"
            />
          </div>
        </div>

        {/* Master-Detail Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Model List */}
          <div className="lg:col-span-6 rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-black/[0.07] dark:border-white/[0.07] flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/45">
              <span>Registry ({filtered.length})</span>
              <span>Status</span>
            </div>
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-[#64748B] dark:text-white/50">
                No models match &ldquo;{search}&rdquo;.
              </div>
            ) : (
              <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                {filtered.map((m) => {
                  const isSelected = selectedModel?.id === m.id;
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(m.id)}
                        className={`w-full text-left px-4 py-3.5 transition-colors flex items-start justify-between gap-3 ${
                          isSelected
                            ? "bg-[#1F5B7C]/[0.07] dark:bg-[#5B9EC2]/[0.1]"
                            : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[13.5px] font-semibold text-[#0B1220] dark:text-[#F8FAFC] truncate">
                              {m.name}
                            </span>
                            <span className="text-[10.5px] font-mono uppercase text-[#64748B] dark:text-white/40">
                              {m.category}
                            </span>
                          </div>
                          <p className="text-[12px] font-mono text-[#64748B] dark:text-white/45 truncate">
                            {m.id}
                          </p>
                          <p className="text-[12px] text-[#475569] dark:text-white/60 line-clamp-2">
                            {m.description}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                            m.availability === "coming-soon"
                              ? "border-black/[0.12] dark:border-white/[0.12] text-[#64748B] dark:text-white/45"
                              : m.availability === "supergyra"
                                ? "border-[#1F5B7C]/35 text-[#1F5B7C] dark:text-[#5B9EC2]"
                                : "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {m.availability === "coming-soon"
                            ? "Coming Soon"
                            : m.availability === "supergyra"
                              ? "SuperGyra"
                              : "Available"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Model Specification Inspector */}
          {selectedModel && (
            <aside className="lg:col-span-6 rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] p-5 space-y-5 lg:sticky lg:top-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-[#1F5B7C] dark:text-[#5B9EC2]" />
                    <h2 className="text-[18px] font-semibold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
                      {selectedModel.name}
                    </h2>
                  </div>
                  <p className="text-[12px] font-mono text-[#64748B] dark:text-white/45">
                    {selectedModel.id} · {selectedModel.provider}
                  </p>
                </div>

                {launchHref ? (
                  <Link
                    href={launchHref}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#1F5B7C] text-white text-[12px] font-medium hover:opacity-95 transition-opacity"
                  >
                    <span>Open in Playground</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                ) : selectedModel.availability === "coming-soon" ? (
                  <span className="inline-flex items-center h-8 px-3 rounded-md border border-black/[0.1] dark:border-white/[0.1] text-[12px] font-mono text-[#64748B] dark:text-white/45">
                    Not Yet Active
                  </span>
                ) : (
                  <Link
                    href="/docs"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-black/[0.12] dark:border-white/[0.12] text-[12px] font-medium text-[#0B1220] dark:text-[#F8FAFC]"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>API Reference</span>
                  </Link>
                )}
              </div>

              <p className="text-[13px] leading-relaxed text-[#334155] dark:text-white/75">
                {selectedModel.description}
              </p>

              {/* Structured Specs */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-black/[0.07] dark:border-white/[0.07] text-[12.5px]">
                <div>
                  <dt className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#64748B] dark:text-white/40">
                    Endpoint
                  </dt>
                  <dd className="font-mono text-[#0B1220] dark:text-[#F8FAFC] mt-0.5">
                    {selectedModel.endpoint}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#64748B] dark:text-white/40">
                    Limits / Output
                  </dt>
                  <dd className="text-[#0B1220] dark:text-[#F8FAFC] mt-0.5">
                    {selectedModel.contextLimit}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#64748B] dark:text-white/40">
                    Input Types
                  </dt>
                  <dd className="text-[#0B1220] dark:text-[#F8FAFC] mt-0.5">
                    {selectedModel.inputTypes.join(", ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#64748B] dark:text-white/40">
                    Output Types
                  </dt>
                  <dd className="text-[#0B1220] dark:text-[#F8FAFC] mt-0.5">
                    {selectedModel.outputTypes.join(", ")}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#64748B] dark:text-white/40">
                    Access & Billing
                  </dt>
                  <dd className="text-[#0B1220] dark:text-[#F8FAFC] mt-0.5">
                    {selectedModel.pricingSummary}
                  </dd>
                </div>
              </dl>

              {/* Capabilities */}
              <div className="pt-4 border-t border-black/[0.07] dark:border-white/[0.07] space-y-2">
                <h3 className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/45">
                  Capabilities
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[12.5px] text-[#334155] dark:text-white/75">
                  {selectedModel.capabilities.map((cap) => (
                    <li key={cap} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1F5B7C] dark:bg-[#5B9EC2]" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Supported Parameters Table */}
              <div className="pt-4 border-t border-black/[0.07] dark:border-white/[0.07] space-y-2">
                <h3 className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/45">
                  Supported Parameters ({selectedModel.parameters.length})
                </h3>
                {selectedModel.parameters.length === 0 ? (
                  <p className="text-[12.5px] text-[#64748B] dark:text-white/50">
                    No configurable runtime parameters exposed for this model.
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-black/[0.07] dark:border-white/[0.07] rounded-md">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead>
                        <tr className="bg-[#F8FAFC] dark:bg-white/[0.03] border-b border-black/[0.07] dark:border-white/[0.07] text-[10.5px] font-mono uppercase text-[#64748B] dark:text-white/45">
                          <th className="py-2 px-3">Parameter</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Default</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                        {selectedModel.parameters.map((p) => (
                          <tr key={p.key}>
                            <td className="py-2 px-3">
                              <p className="font-mono text-[#0B1220] dark:text-[#F8FAFC]">
                                {p.key}
                              </p>
                              <p className="text-[11px] text-[#64748B] dark:text-white/45">
                                {p.description}
                              </p>
                            </td>
                            <td className="py-2 px-3 font-mono text-[#475569] dark:text-white/65 align-top">
                              {p.type}
                            </td>
                            <td className="py-2 px-3 font-mono text-[#475569] dark:text-white/65 align-top">
                              {String(p.defaultValue || "—")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </PlatformShell>
  );
}
