"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Cpu,
  Film,
  Globe,
  KeyRound,
  Plus,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { PlatformShell } from "../components/platform/PlatformShell";
import { getAccessToken, supabase } from "../supabase";

type ApiKey = {
  id: string;
  name: string;
  category: string;
  keyPreview: string;
  active: boolean;
  created_at: string;
  last_used: string | null;
  request_count: number;
};

type NewKey = {
  id: string;
  key: string;
  name: string;
  category: string;
  created_at: string;
};

const CATEGORIES = [
  {
    id: "ai",
    label: "AI API",
    description: "Chat, vision, files, voice, and video",
    prefix: "gyra_",
    Icon: Cpu,
  },
  {
    id: "media",
    label: "Media API",
    description: "Media extraction, audio, and transcription",
    prefix: "gyramedia_",
    Icon: Film,
  },
  {
    id: "network",
    label: "Network API",
    description: "Network intelligence and lookups",
    prefix: "gyranet_",
    Icon: Globe,
  },
  {
    id: "utilities",
    label: "Utilities API",
    description: "Developer utility endpoints",
    prefix: "gyrautils_",
    Icon: Wrench,
  },
] as const;

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("ai");
  const [creating, setCreating] = useState(false);

  const [createdKey, setCreatedKey] = useState<NewKey | null>(null);
  const [copiedNew, setCopiedNew] = useState(false);

  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadKeys = async () => {
    setLoading(true);
    setErrorMsg(null);
    const { data } = await supabase.auth.getUser();
    const token = await getAccessToken();
    if (!data.user || !token) {
      setAuthed(false);
      setLoading(false);
      return;
    }

    setAuthed(true);
    try {
      const res = await fetch("/api/keys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(json?.error?.message || "Failed to load API keys.");
      } else {
        setKeys(Array.isArray(json.keys) ? json.keys : []);
      }
    } catch {
      setErrorMsg("Network error loading API keys.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    const token = await getAccessToken();
    if (!token) {
      setAuthed(false);
      return;
    }

    setCreating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newName.trim() || `${newCategory.toUpperCase()} Key`,
          category: newCategory,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(json?.error?.message || "Unable to create API key.");
      } else {
        setCreatedKey({
          id: json.id,
          key: json.key,
          name: json.name,
          category: json.category,
          created_at: json.created_at,
        });
        setNewName("");
        setShowCreate(false);
        await loadKeys();
      }
    } catch {
      setErrorMsg("Network error creating API key.");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (target: ApiKey) => {
    const token = await getAccessToken();
    if (!token) return;
    setRevokingId(target.id);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/keys/${encodeURIComponent(target.id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(json?.error?.message || "Failed to revoke API key.");
      } else {
        setRevokeTarget(null);
        await loadKeys();
      }
    } catch {
      setErrorMsg("Network error revoking API key.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopyCreatedKey = async () => {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey.key);
      setCopiedNew(true);
      window.setTimeout(() => setCopiedNew(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const activeKeys = keys.filter((k) => k.active);
  const revokedKeys = keys.filter((k) => !k.active);

  return (
    <PlatformShell
      title="API Keys"
      description="Issue, monitor, and revoke scoped API credentials. Full secrets are shown once upon creation."
      actions={
        authed ? (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0B1220] dark:bg-white text-white dark:text-[#04080D] text-[12px] font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Key</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="inline-flex items-center h-8 px-3 rounded-md bg-[#1F5B7C] text-white text-[12px] font-medium"
          >
            Sign In
          </Link>
        )
      }
    >
      <div className="space-y-6">
        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-lg border border-red-500/30 bg-red-500/[0.06] text-[13px] text-red-700 dark:text-red-300 flex items-center justify-between gap-3"
          >
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              aria-label="Dismiss error"
              className="p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Newly minted secret reveal banner (shown once) */}
        {createdKey && (
          <div className="p-4 rounded-lg border border-emerald-500/35 bg-emerald-500/[0.07] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-emerald-900 dark:text-emerald-200">
                  Save your secret key now — it will not be displayed again
                </p>
                <p className="text-[12px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                  {createdKey.name} ({createdKey.category.toUpperCase()})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreatedKey(null)}
                aria-label="Close key reveal"
                className="p-1 text-emerald-800 dark:text-emerald-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-md bg-white dark:bg-[#04080D] border border-black/[0.1] dark:border-white/[0.1] font-mono text-[12.5px] text-[#0B1220] dark:text-[#F8FAFC] break-all">
                {createdKey.key}
              </code>
              <button
                type="button"
                onClick={handleCopyCreatedKey}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-md bg-[#0B1220] dark:bg-white text-white dark:text-[#04080D] text-[12px] font-semibold shrink-0"
              >
                {copiedNew ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedNew ? "Copied" : "Copy Secret"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Scoped category reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {CATEGORIES.map(({ id, label, description, prefix, Icon }) => {
            const count = activeKeys.filter((k) => k.category === id).length;
            return (
              <div
                key={id}
                className="p-3.5 rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                    <Icon className="h-4 w-4 text-[#1F5B7C] dark:text-[#5B9EC2]" />
                    <span>{label}</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#64748B] dark:text-white/45">
                    {count}/10
                  </span>
                </div>
                <p className="text-[12px] text-[#64748B] dark:text-white/55">{description}</p>
                <p className="text-[11px] font-mono text-[#1F5B7C] dark:text-[#5B9EC2]">
                  Prefix: {prefix}
                </p>
              </div>
            );
          })}
        </div>

        {/* Active Keys Table */}
        {!authed ? (
          <div className="p-8 rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] text-center space-y-3">
            <KeyRound className="h-6 w-6 mx-auto text-[#1F5B7C] dark:text-[#5B9EC2]" />
            <p className="text-[14px] font-medium text-[#0B1220] dark:text-[#F8FAFC]">
              Sign in to manage API keys
            </p>
            <p className="text-[12.5px] text-[#64748B] dark:text-white/50 max-w-md mx-auto">
              API keys are bound to your authenticated Gyra account and credit wallets.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center h-9 px-4 rounded-md bg-[#1F5B7C] text-white text-[13px] font-medium"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
            <div className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07] flex items-center justify-between">
              <h2 className="text-[13.5px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                Active Credentials ({activeKeys.length})
              </h2>
              <Link
                href="/api"
                className="text-[12px] text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
              >
                API Quickstart
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-[13px] text-[#64748B] dark:text-white/50">
                Loading credentials...
              </div>
            ) : activeKeys.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-[13.5px] text-[#475569] dark:text-white/65">
                  No active API keys yet.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#1F5B7C] text-white text-[12px] font-medium"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create your first key</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[12.5px]">
                  <thead>
                    <tr className="bg-[#F8FAFC] dark:bg-white/[0.03] border-b border-black/[0.07] dark:border-white/[0.07] text-[10.5px] font-mono uppercase text-[#64748B] dark:text-white/45">
                      <th className="py-2.5 px-4">Name</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Masked Key</th>
                      <th className="py-2.5 px-4">Requests</th>
                      <th className="py-2.5 px-4">Created</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                    {activeKeys.map((k) => (
                      <tr key={k.id}>
                        <td className="py-3 px-4 font-medium text-[#0B1220] dark:text-[#F8FAFC]">
                          {k.name}
                        </td>
                        <td className="py-3 px-4 font-mono uppercase text-[11px] text-[#64748B] dark:text-white/55">
                          {k.category}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#475569] dark:text-white/70">
                          {k.keyPreview}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#0B1220] dark:text-[#F8FAFC]">
                          {Number(k.request_count || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11.5px] text-[#64748B] dark:text-white/45">
                          {new Date(k.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setRevokeTarget(k)}
                            className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-red-500/25 text-[11.5px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/[0.07]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Revoke</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Revoked history */}
        {revokedKeys.length > 0 && (
          <div className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
            <div className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07]">
              <h2 className="text-[13px] font-semibold text-[#64748B] dark:text-white/55">
                Revoked Keys ({revokedKeys.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px]">
                <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                  {revokedKeys.map((k) => (
                    <tr key={k.id} className="opacity-65">
                      <td className="py-2.5 px-4 font-medium text-[#0B1220] dark:text-[#F8FAFC]">
                        {k.name}
                      </td>
                      <td className="py-2.5 px-4 font-mono uppercase text-[11px]">{k.category}</td>
                      <td className="py-2.5 px-4 font-mono">{k.keyPreview}</td>
                      <td className="py-2.5 px-4 font-mono text-right">
                        {Number(k.request_count || 0).toLocaleString()} reqs
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close modal"
              className="fixed inset-0 bg-black/55"
              onClick={() => setShowCreate(false)}
            />
            <form
              onSubmit={handleCreate}
              className="relative z-10 w-full max-w-md rounded-lg bg-white dark:bg-[#081018] border border-black/[0.1] dark:border-white/[0.1] p-5 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                  Create Scoped API Key
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  aria-label="Close"
                  className="p-1 text-[#64748B] dark:text-white/50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="key-name"
                  className="block text-[12px] font-medium text-[#334155] dark:text-white/75"
                >
                  Key Label
                </label>
                <input
                  id="key-name"
                  type="text"
                  maxLength={60}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Production Backend"
                  className="w-full h-9 px-3 rounded-md bg-[#F8FAFC] dark:bg-[#04080D] border border-black/[0.12] dark:border-white/[0.12] text-[13px] text-[#0B1220] dark:text-[#F8FAFC] focus:outline-none focus:border-[#1F5B7C] dark:focus:border-[#5B9EC2]"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="key-category"
                  className="block text-[12px] font-medium text-[#334155] dark:text-white/75"
                >
                  API Scope
                </label>
                <select
                  id="key-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full h-9 px-3 rounded-md bg-[#F8FAFC] dark:bg-[#04080D] border border-black/[0.12] dark:border-white/[0.12] text-[13px] text-[#0B1220] dark:text-[#F8FAFC]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.prefix})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="h-8 px-3 rounded-md border border-black/[0.1] dark:border-white/[0.1] text-[12.5px] font-medium text-[#334155] dark:text-white/75"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="h-8 px-4 rounded-md bg-[#1F5B7C] text-white text-[12.5px] font-medium disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Key"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Revoke Confirmation Modal */}
        {revokeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close confirmation"
              className="fixed inset-0 bg-black/55"
              onClick={() => setRevokeTarget(null)}
            />
            <div className="relative z-10 w-full max-w-md rounded-lg bg-white dark:bg-[#081018] border border-black/[0.1] dark:border-white/[0.1] p-5 space-y-4 shadow-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-[15px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                    Revoke API Key?
                  </h2>
                  <p className="text-[12.5px] text-[#475569] dark:text-white/65 mt-1 leading-relaxed">
                    Revoking <strong className="font-semibold">{revokeTarget.name}</strong> (
                    <code className="font-mono text-[11.5px]">{revokeTarget.keyPreview}</code>) immediately invalidates all future requests using this credential.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRevokeTarget(null)}
                  className="h-8 px-3 rounded-md border border-black/[0.1] dark:border-white/[0.1] text-[12.5px] font-medium text-[#334155] dark:text-white/75"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={revokingId === revokeTarget.id}
                  onClick={() => handleRevoke(revokeTarget)}
                  className="h-8 px-4 rounded-md bg-red-600 text-white text-[12.5px] font-medium disabled:opacity-50"
                >
                  {revokingId === revokeTarget.id ? "Revoking..." : "Revoke Key"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PlatformShell>
  );
}
