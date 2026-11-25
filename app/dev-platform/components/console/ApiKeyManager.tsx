"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  KeyRound,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { ApiKeyRecord } from "../../lib/analytics";
import { GYRA_CATEGORIES, type ApiCategoryId } from "../../lib/gyraCatalog";
import { CategoryIcon } from "../shell/GyraMark";

interface ApiKeyManagerProps {
  keys: ApiKeyRecord[];
  onCreateKey: (name: string, category: ApiCategoryId) => Promise<{
    id: string;
    fullKey: string;
    name: string;
    category: ApiCategoryId;
  }>;
  onRevokeKey: (id: string) => Promise<void>;
  onUseKeyInPlayground: (keyPreviewOrValue: string, category: ApiCategoryId) => void;
}

function formatRelativeDate(iso: string | null): string {
  if (!iso) return "Never";
  const diffMs = Date.now() - Date.parse(iso);
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function ApiKeyManager({
  keys,
  onCreateKey,
  onRevokeKey,
  onUseKeyInPlayground,
}: ApiKeyManagerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ApiCategoryId | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<ApiCategoryId>("ai");
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{
    fullKey: string;
    name: string;
    category: ApiCategoryId;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<ApiKeyRecord | null>(null);
  const [revoking, setRevoking] = useState(false);

  const filteredKeys = useMemo(() => {
    const q = search.trim().toLowerCase();
    return keys.filter((k) => {
      if (categoryFilter !== "all" && k.category !== categoryFilter) return false;
      if (q && !k.name.toLowerCase().includes(q) && !k.keyPreview.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [keys, search, categoryFilter]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {
      // Clipboard blocked in sandboxed iframe
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      const created = await onCreateKey(
        newName.trim() || "Production Key",
        newCategory
      );
      setRevealedKey({
        fullKey: created.fullKey,
        name: created.name,
        category: created.category,
      });
      setNewName("");
    } finally {
      setCreating(false);
    }
  };

  const confirmRevoke = async () => {
    if (!pendingRevoke || revoking) return;
    setRevoking(true);
    try {
      await onRevokeKey(pendingRevoke.id);
      setPendingRevoke(null);
    } finally {
      setRevoking(false);
    }
  };

  const activeCount = keys.filter((k) => k.active).length;

  return (
    <section aria-label="API Keys Management" className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-display text-[17px] font-semibold text-[#F4F4F5]">
            API Keys
          </h2>
          <p className="mt-0.5 text-[13px] text-[#A1A1AA]">
            Category-scoped credentials for authenticating requests against{" "}
            <code className="text-[#D4D4D8] text-[12px]">gyra.ng/api/v1/*</code> ·{" "}
            <span className="font-mono tabular-nums text-[#D4D4D8]">{activeCount}</span> active
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setRevealedKey(null);
            setShowCreateModal(true);
          }}
          className="px-4 py-2 text-[13px] font-medium bg-[#1F5B7C] hover:bg-[#286F96] text-[#F4F4F5] rounded-md transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Generate API Key</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter keys by name or prefix..."
            aria-label="Filter API keys"
            className="w-full bg-[#09090B] border border-[#1F1F23] focus:border-[#5B9EC2] focus:outline-none rounded-md pl-9 pr-3 py-2 text-[13px] text-[#F4F4F5] placeholder-[#71717A]"
          />
        </div>

        <div
          className="inline-flex items-center p-0.5 rounded-md bg-[#09090B] border border-[#1F1F23] overflow-x-auto"
          role="tablist"
          aria-label="Filter keys by category"
        >
          <button
            type="button"
            role="tab"
            aria-selected={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1 text-[12px] font-medium rounded transition-colors whitespace-nowrap ${
              categoryFilter === "all"
                ? "bg-[#121215] text-[#F4F4F5]"
                : "text-[#71717A] hover:text-[#D4D4D8]"
            }`}
          >
            All
          </button>
          {GYRA_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={categoryFilter === cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 text-[12px] font-medium rounded transition-colors whitespace-nowrap ${
                categoryFilter === cat.id
                  ? "bg-[#121215] text-[#F4F4F5]"
                  : "text-[#71717A] hover:text-[#D4D4D8]"
              }`}
            >
              {cat.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Keys Table or Empty State */}
      <div className="bg-[#09090B] border border-[#1F1F23] rounded-lg overflow-hidden">
        {filteredKeys.length === 0 ? (
          <div className="px-6 py-14 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-[#121215] border border-[#1F1F23] flex items-center justify-center mb-3 text-[#71717A]">
              <KeyRound className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h3 className="font-display text-[15px] font-semibold text-[#F4F4F5]">
              {keys.length === 0 ? "No API keys created yet" : "No keys match your filter"}
            </h3>
            <p className="mt-1.5 text-[13px] text-[#A1A1AA] max-w-md">
              {keys.length === 0
                ? "Create your first scoped key (gyra_ for AI or gyramedia_ for Media) to authenticate requests from your backend or the Playground."
                : "Clear your search query or switch category filters to inspect all credentials."}
            </p>
            {keys.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setRevealedKey(null);
                  setShowCreateModal(true);
                }}
                className="mt-4 px-4 py-2 text-[13px] font-medium bg-[#1F5B7C] hover:bg-[#286F96] text-[#F4F4F5] rounded-md transition-colors"
              >
                Create your first key
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#18181B] text-[11.5px] font-medium text-[#71717A]">
                  <th className="py-2.5 pl-5 pr-3">Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Secret Key</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Requests</th>
                  <th className="py-2.5 px-3">Last Used</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141418] text-[13px]">
                {filteredKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-[#121215]/60 transition-colors">
                    <td className="py-3 pl-5 pr-3">
                      <p className="font-medium text-[#F4F4F5] whitespace-nowrap">{k.name}</p>
                      <p className="text-[11.5px] text-[#71717A] font-mono">
                        Created {formatRelativeDate(k.created_at)}
                      </p>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#D4D4D8]">
                        <CategoryIcon
                          category={k.category}
                          className="w-3.5 h-3.5 text-[#5B9EC2]"
                        />
                        <span>{k.category.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 font-mono text-[12px] text-[#A1A1AA]">
                        <span>{k.keyPreview}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(k.keyPreview, k.id)}
                          className="p-1 text-[#71717A] hover:text-[#F4F4F5] rounded transition-colors"
                          aria-label={`Copy masked prefix for ${k.name}`}
                          title="Copy key preview"
                        >
                          {copiedId === k.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-[12px] font-medium">
                      {k.active ? (
                        <span className="text-emerald-400">Active</span>
                      ) : (
                        <span className="text-[#71717A]">Revoked</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[#E4E4E7]">
                      {k.request_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-[12.5px] text-[#A1A1AA] font-mono tabular-nums">
                      {formatRelativeDate(k.last_used)}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                      {k.active ? (
                        <button
                          type="button"
                          onClick={() => setPendingRevoke(k)}
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-[#A1A1AA] hover:text-red-400 transition-colors px-2 py-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      ) : (
                        <span className="text-[12px] text-[#52525B]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-key-title"
        >
          <div className="bg-[#09090B] border border-[#27272A] rounded-lg max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1F1F23] flex items-center justify-between">
              <h3 id="create-key-title" className="font-display text-[15px] font-semibold text-[#F4F4F5]">
                {revealedKey ? "Save your secret API key" : "Generate new API key"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setRevealedKey(null);
                }}
                className="p-1 text-[#71717A] hover:text-[#F4F4F5] rounded"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {revealedKey ? (
              <div className="p-5 space-y-4">
                <p className="text-[13px] text-[#A1A1AA] leading-relaxed">
                  For security, this full secret key is shown <strong className="text-[#F4F4F5]">only once</strong>.
                  Store it in your environment variables before closing this dialog.
                </p>

                <div className="bg-[#000000] border border-[#2E2E34] rounded-md p-3 flex items-center justify-between gap-2">
                  <code className="text-[12.5px] text-emerald-300 break-all">
                    {revealedKey.fullKey}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(revealedKey.fullKey, "new-secret")}
                    className="px-2.5 py-1.5 text-[12px] font-medium bg-[#121215] hover:bg-[#18181B] border border-[#27272A] text-[#F4F4F5] rounded shrink-0 inline-flex items-center gap-1.5"
                  >
                    {copiedId === "new-secret" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  {(revealedKey.category === "ai" || revealedKey.category === "media") && (
                    <button
                      type="button"
                      onClick={() => {
                        onUseKeyInPlayground(revealedKey.fullKey, revealedKey.category);
                        setShowCreateModal(false);
                        setRevealedKey(null);
                      }}
                      className="px-3.5 py-2 text-[12.5px] font-medium text-[#D4D4D8] bg-[#121215] hover:bg-[#18181B] border border-[#27272A] rounded-md transition-colors"
                    >
                      Load in Playground
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setRevealedKey(null);
                    }}
                    className="px-4 py-2 text-[12.5px] font-medium bg-[#1F5B7C] hover:bg-[#286F96] text-[#F4F4F5] rounded-md transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                <div>
                  <label
                    htmlFor="key-name-input"
                    className="block text-[12.5px] font-medium text-[#D4D4D8] mb-1.5"
                  >
                    Key name
                  </label>
                  <input
                    id="key-name-input"
                    type="text"
                    required
                    maxLength={60}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Production Backend Gateway"
                    className="w-full bg-[#000000] border border-[#1F1F23] focus:border-[#5B9EC2] focus:outline-none rounded-md px-3 py-2 text-[13px] text-[#F4F4F5] placeholder-[#71717A]"
                  />
                </div>

                <div>
                  <span className="block text-[12.5px] font-medium text-[#D4D4D8] mb-1.5">
                    Service scope
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {GYRA_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewCategory(cat.id)}
                        className={`p-2.5 rounded-md border text-left transition-colors ${
                          newCategory === cat.id
                            ? "bg-[#121215] border-[#5B9EC2] text-[#F4F4F5]"
                            : "bg-[#000000] border-[#1F1F23] text-[#A1A1AA] hover:border-[#2E2E34]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CategoryIcon category={cat.id} className="w-3.5 h-3.5 text-[#5B9EC2]" />
                          <span className="text-[12.5px] font-medium">{cat.shortName}</span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-[#71717A]">
                          {cat.keyPrefix}•••
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-2 text-[12.5px] font-medium text-[#A1A1AA] hover:text-[#F4F4F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 text-[12.5px] font-medium bg-[#1F5B7C] hover:bg-[#286F96] disabled:opacity-50 text-[#F4F4F5] rounded-md transition-colors"
                  >
                    {creating ? "Generating..." : "Create Key"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Destructive Revoke Confirmation Dialog */}
      {pendingRevoke && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="revoke-key-title"
        >
          <div className="bg-[#09090B] border border-[#27272A] rounded-lg max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 id="revoke-key-title" className="font-display text-[15px] font-semibold text-[#F4F4F5]">
                  Revoke “{pendingRevoke.name}”?
                </h3>
                <p className="mt-1 text-[13px] text-[#A1A1AA] leading-relaxed">
                  Any service authenticating with{" "}
                  <code className="text-[#D4D4D8] text-[12px]">{pendingRevoke.keyPreview}</code>{" "}
                  will immediately receive <code className="text-red-400 text-[12px]">401 Unauthorized</code>.
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingRevoke(null)}
                className="px-3.5 py-2 text-[12.5px] font-medium text-[#A1A1AA] hover:text-[#F4F4F5]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revoking}
                onClick={confirmRevoke}
                className="px-4 py-2 text-[12.5px] font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-md transition-colors"
              >
                {revoking ? "Revoking..." : "Revoke Key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
