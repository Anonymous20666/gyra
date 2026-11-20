"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Columns2,
  Cpu,
  Film,
  Image as ImageIcon,
  KeyRound,
  MessageSquare,
  SlidersHorizontal,
  Terminal,
  Wallet,
} from "lucide-react";
import { PlatformShell } from "../components/platform/PlatformShell";
import { getAccessToken, supabase } from "../supabase";
import { GYRA_MODEL_CATALOG, type GyraModelSpec } from "../lib/modelCatalog";
import {
  PLAYGROUND_STORAGE_KEY,
  parsePlaygroundState,
  type PlaygroundExperiment,
} from "../lib/playgroundStore";

interface SubStatus {
  plan: string;
  status: string;
  isSuperGyra: boolean;
  creditsUsd: number;
}

interface WalletBalances {
  ai: number;
  media: number;
  network: number;
}

interface ActivityRow {
  id: string;
  endpoint: string;
  category: string;
  status_code: number;
  cost_usd: number;
  created_at: string;
}

interface VideoRow {
  id: string;
  request_id: string;
  prompt: string;
  status: string;
  created_at: string;
}

const LAUNCHERS = [
  {
    mode: "chat",
    title: "Chat Playground",
    detail: "Stream Gyra 1.0 and SuperGyra 2.0 with reasoning traces and live web search.",
    href: "/playground?mode=chat",
    Icon: MessageSquare,
  },
  {
    mode: "image",
    title: "Image Playground",
    detail: "Synthesize high-resolution imagery via FLUX.1 Dev and FLUX 1.1 Pro Ultra.",
    href: "/playground?mode=image",
    Icon: ImageIcon,
  },
  {
    mode: "video",
    title: "Video Playground",
    detail: "Generate 720p motion clips on LTX-Video 13B with optional reference frames.",
    href: "/playground?mode=video",
    Icon: Film,
  },
  {
    mode: "compare",
    title: "Model Comparison",
    detail: "Dispatch one prompt across two model configurations and measure live latency.",
    href: "/playground?mode=compare",
    Icon: Columns2,
  },
] as const;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function WorkspaceOverviewPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [wallets, setWallets] = useState<WalletBalances | null>(null);
  const [activeKeyCount, setActiveKeyCount] = useState<number | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [experiments, setExperiments] = useState<PlaygroundExperiment[]>([]);
  const [models, setModels] = useState<readonly GyraModelSpec[]>(GYRA_MODEL_CATALOG);

  useEffect(() => {
    try {
      const parsed = parsePlaygroundState(window.localStorage.getItem(PLAYGROUND_STORAGE_KEY));
      setExperiments(parsed.experiments);
    } catch {
      // Ignore storage errors
    }

    fetch("/api/models")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.models?.length) setModels(d.models);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      const { data } = await supabase.auth.getUser();
      const token = await getAccessToken();
      if (!active) return;

      setUserEmail(data.user?.email ?? null);
      setAuthReady(true);
      if (!token) return;

      const authHeaders = { Authorization: `Bearer ${token}` };

      const [subRes, walRes, keysRes, actRes, vidRes] = await Promise.allSettled([
        fetch("/api/v1/subscription/status", { headers: authHeaders }),
        fetch("/api/me/wallets", { headers: authHeaders }),
        fetch("/api/keys", { headers: authHeaders }),
        fetch("/api/me/activity", { headers: authHeaders }),
        fetch("/api/v1/video/history", { headers: { "x-gyra-user-token": token } }),
      ]);

      if (!active) return;

      if (subRes.status === "fulfilled" && subRes.value.ok) {
        const j = await subRes.value.json().catch(() => null);
        if (j && !j.error) setSub(j);
      }
      if (walRes.status === "fulfilled" && walRes.value.ok) {
        const j = await walRes.value.json().catch(() => null);
        if (j && !j.error) {
          setWallets({
            ai: Number(j.ai || 0),
            media: Number(j.media || 0),
            network: Number(j.network || 0),
          });
        }
      }
      if (keysRes.status === "fulfilled" && keysRes.value.ok) {
        const j = await keysRes.value.json().catch(() => null);
        if (Array.isArray(j?.keys)) {
          setActiveKeyCount(j.keys.filter((k: { active: boolean }) => k.active).length);
        }
      }
      if (actRes.status === "fulfilled" && actRes.value.ok) {
        const j = await actRes.value.json().catch(() => null);
        if (Array.isArray(j?.activity)) setActivity(j.activity.slice(0, 6));
      }
      if (vidRes.status === "fulfilled" && vidRes.value.ok) {
        const j = await vidRes.value.json().catch(() => null);
        if (Array.isArray(j?.jobs)) setVideos(j.jobs.slice(0, 5));
      }
    }

    hydrate();
    return () => {
      active = false;
    };
  }, []);

  const totalCredits = wallets ? wallets.ai + wallets.media + wallets.network : null;
  const availableModels = models.filter((m) => m.availability !== "coming-soon");

  return (
    <PlatformShell
      title="Workspace Overview"
      description={
        userEmail
          ? `Signed in as ${userEmail}. Launch experiments, inspect models, or manage API access.`
          : "Explore Gyra's unified AI Playground, model registry, and developer platform."
      }
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/api-keys"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#0B1219] text-[12px] font-medium text-[#0B1220] dark:text-[#F8FAFC] hover:border-[#1F5B7C] dark:hover:border-[#5B9EC2] transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>API Keys</span>
          </Link>
          <Link
            href="/playground"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0B1220] dark:bg-white text-white dark:text-[#04080D] text-[12px] font-semibold hover:opacity-90 transition-opacity"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Open Playground</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Account & Usage Strip */}
        <section aria-label="Account summary">
          {authReady && !userEmail ? (
            <div className="p-4 sm:p-5 rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#1F5B7C] dark:text-[#5B9EC2]">
                  Guest Session
                </p>
                <p className="text-[14px] text-[#0B1220] dark:text-[#F8FAFC] font-medium">
                  Sign in to sync wallets, issue API keys, generate FLUX images, and render LTX videos.
                </p>
                <p className="text-[12.5px] text-[#64748B] dark:text-white/50">
                  Chat Playground on Gyra 1.0 and the Models catalog are available immediately.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-[#1F5B7C] text-white text-[13px] font-medium hover:opacity-95 transition-opacity"
                >
                  Sign In
                </Link>
                <Link
                  href="/playground"
                  className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-black/[0.12] dark:border-white/[0.12] text-[13px] font-medium text-[#0B1220] dark:text-[#F8FAFC] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                >
                  Try Playground
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-black/[0.08] dark:border-white/[0.08] rounded-lg bg-white dark:bg-[#060C12] divide-y sm:divide-y-0 sm:divide-x divide-black/[0.08] dark:divide-white/[0.08]">
              <div className="p-4 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/45">
                  Subscription Plan
                </span>
                <p className="text-[20px] font-semibold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
                  {sub ? (sub.isSuperGyra ? "SuperGyra" : "Free") : "—"}
                </p>
                <Link
                  href="/upgrade"
                  className="inline-flex items-center gap-1 text-[12px] text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                >
                  <span>{sub?.isSuperGyra ? "Manage plan" : "Upgrade plan"}</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="p-4 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/45">
                  Combined Credits
                </span>
                <p className="text-[20px] font-semibold font-mono tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
                  {totalCredits !== null ? `$${totalCredits.toFixed(2)}` : "—"}
                </p>
                <Link
                  href="/credits"
                  className="inline-flex items-center gap-1 text-[12px] text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                >
                  <span>Top up wallets</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="p-4 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/45">
                  Active API Keys
                </span>
                <p className="text-[20px] font-semibold font-mono tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
                  {activeKeyCount !== null ? activeKeyCount : "—"}
                </p>
                <Link
                  href="/api-keys"
                  className="inline-flex items-center gap-1 text-[12px] text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                >
                  <span>Manage keys</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="p-4 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/45">
                  Available Models
                </span>
                <p className="text-[20px] font-semibold font-mono tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
                  {availableModels.length}
                </p>
                <Link
                  href="/models"
                  className="inline-flex items-center gap-1 text-[12px] text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                >
                  <span>Inspect catalog</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Quick Playground Launchers */}
        <section aria-labelledby="launchers-heading" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2
                id="launchers-heading"
                className="text-[15px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]"
              >
                Start an Experiment
              </h2>
              <p className="text-[12.5px] text-[#64748B] dark:text-white/50">
                Jump directly into any live Playground mode with real backend execution.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {LAUNCHERS.map(({ mode, title, detail, href, Icon }) => (
              <Link
                key={mode}
                href={href}
                className="group p-4 rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] hover:border-[#1F5B7C]/50 dark:hover:border-[#5B9EC2]/50 transition-colors flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="h-8 w-8 rounded-md bg-[#F1F5F9] dark:bg-white/[0.06] flex items-center justify-center text-[#1F5B7C] dark:text-[#5B9EC2]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[#94A3B8] group-hover:text-[#1F5B7C] dark:group-hover:text-[#5B9EC2] transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                      {title}
                    </h3>
                    <p className="text-[12.5px] leading-relaxed text-[#475569] dark:text-white/55 mt-1">
                      {detail}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/40">
                  Open {mode}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Two-column activity and capabilities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: Recent Playground Experiments & Video Jobs */}
          <div className="lg:col-span-7 space-y-6">
            <section className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
              <div className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07] flex items-center justify-between">
                <h2 className="text-[13.5px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                  Recent Playground Experiments
                </h2>
                <Link
                  href="/playground"
                  className="text-[12px] text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                >
                  Open Playground
                </Link>
              </div>
              {experiments.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <p className="text-[13px] text-[#475569] dark:text-white/60">
                    No local experiments recorded yet.
                  </p>
                  <Link
                    href="/playground"
                    className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                  >
                    <span>Launch your first prompt</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                  {experiments.slice(0, 6).map((exp) => (
                    <li
                      key={exp.id}
                      className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-black/[0.015] dark:hover:bg-white/[0.02]"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#0B1220] dark:text-[#F8FAFC] truncate">
                          {exp.title}
                        </p>
                        <p className="text-[11px] font-mono text-[#64748B] dark:text-white/45 mt-0.5">
                          {exp.mode.toUpperCase()} · {exp.modelId} · {formatDate(exp.updatedAt)}
                        </p>
                      </div>
                      <Link
                        href={`/playground?mode=${exp.mode}&model=${encodeURIComponent(exp.modelId)}`}
                        className="shrink-0 text-[12px] font-medium text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                      >
                        Resume
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Recent Video Generations */}
            <section className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
              <div className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07] flex items-center justify-between">
                <h2 className="text-[13.5px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                  Recent Video Generations
                </h2>
                <Link
                  href="/playground?mode=video"
                  className="text-[12px] text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                >
                  Video Playground
                </Link>
              </div>
              {videos.length === 0 ? (
                <div className="p-5 text-[12.5px] text-[#64748B] dark:text-white/50">
                  {userEmail
                    ? "No video jobs found on your account yet."
                    : "Sign in to view your persisted video generation queue."}
                </div>
              ) : (
                <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                  {videos.map((v) => (
                    <li key={v.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] text-[#0B1220] dark:text-[#F8FAFC] truncate">
                          {v.prompt}
                        </p>
                        <p className="text-[11px] font-mono text-[#64748B] dark:text-white/45 mt-0.5">
                          {formatDate(v.created_at)}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-mono uppercase text-[#1F5B7C] dark:text-[#5B9EC2]">
                        {v.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right column: Capabilities & Recent API Activity */}
          <div className="lg:col-span-5 space-y-6">
            <section className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
              <div className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07] flex items-center justify-between">
                <h2 className="text-[13.5px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                  Platform Capabilities
                </h2>
                <Link
                  href="/models"
                  className="text-[12px] text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                >
                  View all
                </Link>
              </div>
              <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                {models.map((m) => (
                  <li key={m.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2.5">
                      <Cpu className="h-3.5 w-3.5 shrink-0 text-[#64748B] dark:text-white/40" />
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium text-[#0B1220] dark:text-[#F8FAFC] truncate">
                          {m.name}
                        </p>
                        <p className="text-[11px] font-mono text-[#64748B] dark:text-white/40 truncate">
                          {m.category} · {m.endpoint}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[10.5px] font-mono uppercase ${
                        m.availability === "coming-soon"
                          ? "text-[#94A3B8] dark:text-white/35"
                          : m.availability === "supergyra"
                            ? "text-[#1F5B7C] dark:text-[#5B9EC2]"
                            : "text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {m.availability === "coming-soon"
                        ? "Coming Soon"
                        : m.availability === "supergyra"
                          ? "SuperGyra"
                          : "Live"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
              <div className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07] flex items-center justify-between">
                <h2 className="text-[13.5px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                  Recent API Activity
                </h2>
                <Link
                  href="/api"
                  className="text-[12px] text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                >
                  API Platform
                </Link>
              </div>
              {activity.length === 0 ? (
                <div className="p-5 space-y-2">
                  <p className="text-[12.5px] text-[#64748B] dark:text-white/50">
                    {userEmail
                      ? "No logged media API calls yet."
                      : "Sign in and call Gyra endpoints to inspect request logs here."}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <Link
                      href="/api"
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                    >
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Quickstart</span>
                    </Link>
                    <Link
                      href="/credits"
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-[#475569] dark:text-white/60 hover:underline"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      <span>Credits</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                  {activity.map((row) => (
                    <li key={row.id} className="px-4 py-2.5 flex items-center justify-between gap-2 text-[12px]">
                      <div className="min-w-0">
                        <p className="font-mono text-[#0B1220] dark:text-[#F8FAFC] truncate">
                          {row.endpoint}
                        </p>
                        <p className="text-[11px] text-[#64748B] dark:text-white/45">
                          {formatDate(row.created_at)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 font-mono">
                        <span
                          className={
                            row.status_code < 400
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {row.status_code}
                        </span>
                        <p className="text-[11px] text-[#64748B] dark:text-white/45">
                          ${row.cost_usd.toFixed(4)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </PlatformShell>
  );
}
