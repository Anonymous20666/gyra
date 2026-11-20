"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "../Logo";
import { supabase } from "../supabase";

type Wallet = {
  category: string;
  label: string;
  balance: number;
  color: string;
  icon: string;
  spendLabel: string;
};

type KeyRow = {
  id: string;
  name: string;
  category: string;
  keyPreview: string;
  active: boolean;
  created_at: string;
  last_used: string | null;
  request_count: number;
};

type Activity = {
  id: string;
  endpoint: string;
  category: string;
  status_code: number;
  cost_usd: number;
  created_at: string;
};

const CATEGORY_META: Record<
  string,
  { label: string; icon: string; color: string; text: string; border: string; glow: string }
> = {
  ai: {
    label: "AI Wallet",
    icon: "🧠",
    color: "blue",
    text: "text-blue-300",
    border: "border-blue-500/30",
    glow: "from-blue-500/20 via-blue-500/5 to-transparent",
  },
  media: {
    label: "Media Wallet",
    icon: "🎬",
    color: "purple",
    text: "text-purple-300",
    border: "border-purple-500/30",
    glow: "from-purple-500/20 via-purple-500/5 to-transparent",
  },
  network: {
    label: "Network Wallet",
    icon: "🌐",
    color: "cyan",
    text: "text-cyan-300",
    border: "border-cyan-500/30",
    glow: "from-cyan-500/20 via-cyan-500/5 to-transparent",
  },
  utilities: {
    label: "Utilities Wallet",
    icon: "🛠️",
    color: "amber",
    text: "text-amber-300",
    border: "border-amber-500/30",
    glow: "from-amber-500/20 via-amber-500/5 to-transparent",
  },
};

export default function ConsolePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [wallets, setWallets] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<
    "overview" | "keys" | "activity"
  >("overview");

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const u = auth.user;
      setUser(u);

      if (!u) {
        setLoading(false);
        return;
      }

      // Load keys
      const { data: keyData } = await supabase
        .from("api_keys")
        .select(
          "id, name, category, key, active, created_at, last_used, request_count"
        )
        .eq("user_id", u.id)
        .order("created_at", { ascending: false });

      if (keyData) {
        setKeys(
          keyData.map((k: any) => ({
            id: k.id,
            name: k.name,
            category: k.category || "ai",
            keyPreview: `${k.key.slice(0, 14)}••••••••${k.key.slice(-4)}`,
            active: k.active,
            created_at: k.created_at,
            last_used: k.last_used,
            request_count: k.request_count || 0,
          }))
        );
      }

      // Load wallets
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("credits_usd, media_credits_usd, network_credits_usd")
        .eq("user_id", u.id)
        .maybeSingle();

      if (sub) {
        setWallets({
          ai: Number(sub.credits_usd || 0),
          media: Number(sub.media_credits_usd || 0),
          network: Number(sub.network_credits_usd || 0),
          utilities: 0,
        });
      }

      // Load media activity
      const { data: media } = await supabase
        .from("media_requests")
        .select("id, endpoint, status_code, cost_usd, created_at")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (media) {
        setActivity(
          media.map((m: any) => ({
            id: m.id,
            endpoint: m.endpoint,
            category: "media",
            status_code: m.status_code,
            cost_usd: Number(m.cost_usd || 0),
            created_at: m.created_at,
          }))
        );
      }

      setLoading(false);
    };
    init();
  }, []);

  const WALLETS = ["ai", "media", "network", "utilities"];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-500/8 rounded-full blur-[180px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-30 border-b border-white/5 backdrop-blur-sm bg-black/60 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo size={26} animated={false} />
            <span className="font-bold tracking-widest text-sm">GYRA</span>
            <span className="text-zinc-600 text-xs tracking-widest">
              CONSOLE
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/workspace" className="hover:text-white transition-colors">
              Workspace
            </Link>
            <Link href="/api" className="hover:text-white transition-colors">
              API
            </Link>
            <Link href="/docs" className="hover:text-white transition-colors">
              Docs
            </Link>
            <Link
              href="/playground"
              className="hover:text-white transition-colors"
            >
              Playground
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className="hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-12">
        {loading ? (
          <p className="text-zinc-500">Loading console…</p>
        ) : !user ? (
          // Not signed in
          <div className="text-center py-24 max-w-lg mx-auto">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6">
              <span className="text-3xl font-bold">G</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              Sign in to access the Console
            </h1>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              The Gyra Developer Console shows your wallets, keys, request
              history, and usage. Sign in with your Gyra account.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-white text-black px-8 py-3.5 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              Sign in →
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-10">
              <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-3">
                Developer Console
              </p>
              <h1 className="text-4xl font-bold tracking-tighter mb-2">
                Welcome back
              </h1>
              <p className="text-zinc-500 text-sm">
                {user.email}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8">
              {[
                { id: "overview" as const, label: "Overview" },
                { id: "keys" as const, label: "API Keys" },
                { id: "activity" as const, label: "Activity" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === t.id
                      ? "bg-white text-black"
                      : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <>
                {/* Wallets */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                  {WALLETS.map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const balance = wallets[cat] ?? 0;
                    return (
                      <div
                        key={cat}
                        className={`relative overflow-hidden rounded-2xl p-6 border ${meta.border} bg-black/50 backdrop-blur-xl`}
                      >
                        <div
                          className={`absolute -top-16 -right-16 w-40 h-40 bg-gradient-to-br ${meta.glow} rounded-full blur-3xl pointer-events-none`}
                        />
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-2xl">{meta.icon}</span>
                            <span
                              className={`text-[10px] uppercase tracking-wider font-semibold ${meta.text}`}
                            >
                              {meta.label.replace(" Wallet", "")}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
                            Balance
                          </p>
                          <p className="text-3xl font-bold tracking-tight mb-1">
                            ${balance.toFixed(2)}
                          </p>
                          <p className="text-[11px] text-zinc-600">
                            USD credits
                          </p>
                          <Link
                            href={`/upgrade?wallet=${cat}`}
                            className="mt-4 inline-block text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Top up →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  {[
                    {
                      label: "Total keys",
                      value: keys.length,
                    },
                    {
                      label: "Active keys",
                      value: keys.filter((k) => k.active).length,
                    },
                    {
                      label: "Total requests",
                      value: keys.reduce((a, k) => a + k.request_count, 0),
                    },
                    {
                      label: "Categories",
                      value: new Set(keys.map((k) => k.category)).size,
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-zinc-950/60 backdrop-blur-sm border border-white/5 rounded-2xl p-5"
                    >
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                        {s.label}
                      </p>
                      <p className="text-2xl font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Recent activity */}
                <div className="bg-zinc-950/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold tracking-wide">
                      Recent activity
                    </h2>
                    <button
                      onClick={() => setActiveTab("activity")}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      View all →
                    </button>
                  </div>
                  {activity.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                      No requests yet. Generate a key and make your first call.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {activity.slice(0, 8).map((a) => {
                        const meta = CATEGORY_META[a.category];
                        return (
                          <div
                            key={a.id}
                            className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-sm">
                                {meta?.icon || "◆"}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-mono text-zinc-300 truncate">
                                  {a.endpoint}
                                </p>
                                <p className="text-[10px] text-zinc-500">
                                  {new Date(a.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span
                                className={`text-[10px] font-mono ${
                                  a.status_code === 200
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {a.status_code}
                              </span>
                              <span className="text-xs text-zinc-500 font-mono">
                                -${a.cost_usd.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* KEYS TAB */}
            {activeTab === "keys" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-zinc-400">
                    {keys.length} key{keys.length === 1 ? "" : "s"}
                  </p>
                  <Link
                    href="/api-keys"
                    className="bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors"
                  >
                    + Create new key
                  </Link>
                </div>
                {keys.length === 0 ? (
                  <div className="bg-zinc-950/60 border border-white/5 rounded-2xl p-12 text-center">
                    <p className="font-medium mb-2">No API keys yet</p>
                    <p className="text-xs text-zinc-500">
                      Generate your first key to start building.
                    </p>
                  </div>
                ) : (
                  keys.map((k) => {
                    const meta = CATEGORY_META[k.category];
                    return (
                      <div
                        key={k.id}
                        className="bg-zinc-950/60 backdrop-blur-sm border border-white/5 rounded-2xl p-5"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                              <p className="font-semibold text-sm">{k.name}</p>
                              <span
                                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${
                                  meta?.text || "text-zinc-400"
                                } bg-black/40 border ${
                                  meta?.border || "border-white/10"
                                }`}
                              >
                                {meta?.icon} {meta?.label.replace(" Wallet", "")}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-zinc-500 truncate">
                              {k.keyPreview}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-zinc-500">
                          <span>
                            Created{" "}
                            {new Date(k.created_at).toLocaleDateString()}
                          </span>
                          <span>
                            {k.last_used
                              ? `Used ${new Date(k.last_used).toLocaleDateString()}`
                              : "Never used"}
                          </span>
                          <span>
                            {k.request_count.toLocaleString()} requests
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === "activity" && (
              <div className="bg-zinc-950/60 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
                {activity.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-sm text-zinc-500">
                      No activity yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-black/40 text-zinc-500 text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="text-left p-4">Endpoint</th>
                          <th className="text-left p-4">Category</th>
                          <th className="text-left p-4">Status</th>
                          <th className="text-left p-4">Cost</th>
                          <th className="text-left p-4">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activity.map((a) => (
                          <tr
                            key={a.id}
                            className="border-t border-white/5 hover:bg-white/[0.02]"
                          >
                            <td className="p-4 font-mono text-xs text-zinc-300">
                              {a.endpoint}
                            </td>
                            <td className="p-4 text-xs text-zinc-500">
                              {a.category}
                            </td>
                            <td className="p-4">
                              <span
                                className={`text-xs font-mono ${
                                  a.status_code === 200
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {a.status_code}
                              </span>
                            </td>
                            <td className="p-4 text-xs font-mono text-zinc-500">
                              -${a.cost_usd.toFixed(2)}
                            </td>
                            <td className="p-4 text-xs text-zinc-500">
                              {new Date(a.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}