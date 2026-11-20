"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CreditCard,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { PlatformShell } from "../components/platform/PlatformShell";
import { useTheme } from "../components/ThemeProvider";
import type { ThemeMode } from "../lib/themePreference";
import { getAccessToken, supabase } from "../supabase";

interface SubStatus {
  plan: string;
  status: string;
  expiresAt: string | null;
  isSuperGyra: boolean;
  creditsUsd: number;
}

interface Wallets {
  ai: number;
  media: number;
  network: number;
}

const THEME_MODES: readonly { id: ThemeMode; label: string; desc: string; Icon: typeof Sun }[] = [
  { id: "light", label: "Light", desc: "Bright daylight canvas", Icon: Sun },
  { id: "dark", label: "Dark", desc: "Obsidian low-glare studio", Icon: Moon },
  { id: "system", label: "System", desc: "Match OS appearance", Icon: Monitor },
];

export default function AccountPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string; created_at?: string } | null>(null);
  const [sub, setSub] = useState<SubStatus | null>(null);
  const [wallets, setWallets] = useState<Wallets | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase.auth.getUser();
      const token = await getAccessToken();
      if (!active) return;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
        });
      }

      if (token) {
        const headers = { Authorization: `Bearer ${token}` };
        const [subRes, walRes] = await Promise.allSettled([
          fetch("/api/v1/subscription/status", { headers }),
          fetch("/api/me/wallets", { headers }),
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
      }
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <PlatformShell
      title="Account & Settings"
      description="Manage your profile, workspace appearance, subscription limits, and security controls."
    >
      <div className="max-w-4xl space-y-6">
        {/* Profile */}
        <section className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-[#1F5B7C] dark:text-[#5B9EC2]" />
              <h2 className="text-[15px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                Profile
              </h2>
            </div>
            {!loading && !user && (
              <Link
                href="/login"
                className="inline-flex items-center h-8 px-3 rounded-md bg-[#1F5B7C] text-white text-[12px] font-medium"
              >
                Sign In
              </Link>
            )}
          </div>

          {loading ? (
            <p className="text-[13px] text-[#64748B] dark:text-white/50">Loading account...</p>
          ) : user ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <dt className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#64748B] dark:text-white/40">
                  Email Address
                </dt>
                <dd className="font-medium text-[#0B1220] dark:text-[#F8FAFC] mt-0.5">
                  {user.email || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#64748B] dark:text-white/40">
                  Account ID
                </dt>
                <dd className="font-mono text-[12px] text-[#475569] dark:text-white/65 mt-0.5 truncate">
                  {user.id}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-[13px] text-[#475569] dark:text-white/60">
              You are currently browsing as a guest. Sign in to manage wallets, API keys, and SuperGyra entitlements.
            </p>
          )}
        </section>

        {/* Preferences / Appearance */}
        <section className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] p-5 space-y-4">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
              Appearance Preferences
            </h2>
            <p className="text-[12.5px] text-[#64748B] dark:text-white/50 mt-0.5">
              Theme preference persists locally across every Gyra product page.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="Theme preference">
            {THEME_MODES.map(({ id, label, desc, Icon }) => {
              const active = theme === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(id)}
                  className={`p-3 rounded-md border text-left transition-colors ${
                    active
                      ? "border-[#1F5B7C] dark:border-[#5B9EC2] bg-[#1F5B7C]/[0.06] dark:bg-[#5B9EC2]/[0.1]"
                      : "border-black/[0.09] dark:border-white/[0.09] hover:border-black/[0.2] dark:hover:border-white/[0.2]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-[13px] font-medium text-[#0B1220] dark:text-[#F8FAFC]">
                    <Icon className="h-4 w-4 text-[#1F5B7C] dark:text-[#5B9EC2]" />
                    <span>{label}</span>
                  </div>
                  <p className="text-[11.5px] text-[#64748B] dark:text-white/45 mt-1">{desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Usage, Subscription & Billing */}
        <section className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-4 w-4 text-[#1F5B7C] dark:text-[#5B9EC2]" />
              <h2 className="text-[15px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                Usage, Limits & Billing
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/credits"
                className="inline-flex items-center gap-1 h-8 px-3 rounded-md border border-black/[0.1] dark:border-white/[0.1] text-[12px] font-medium text-[#0B1220] dark:text-[#F8FAFC]"
              >
                <span>Credits</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/upgrade"
                className="inline-flex items-center gap-1 h-8 px-3 rounded-md bg-[#0B1220] dark:bg-white text-white dark:text-[#04080D] text-[12px] font-semibold"
              >
                <span>Plans</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div>
              <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-white/40">
                Plan
              </span>
              <p className="text-[16px] font-semibold text-[#0B1220] dark:text-[#F8FAFC] mt-0.5">
                {sub ? (sub.isSuperGyra ? "SuperGyra" : "Free") : "—"}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-white/40">
                AI Wallet
              </span>
              <p className="text-[16px] font-mono font-semibold text-[#0B1220] dark:text-[#F8FAFC] mt-0.5">
                {wallets ? `$${wallets.ai.toFixed(2)}` : "—"}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-white/40">
                Media Wallet
              </span>
              <p className="text-[16px] font-mono font-semibold text-[#0B1220] dark:text-[#F8FAFC] mt-0.5">
                {wallets ? `$${wallets.media.toFixed(2)}` : "—"}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-white/40">
                Network Wallet
              </span>
              <p className="text-[16px] font-mono font-semibold text-[#0B1220] dark:text-[#F8FAFC] mt-0.5">
                {wallets ? `$${wallets.network.toFixed(2)}` : "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Security & Sign Out */}
        <section className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 text-[#1F5B7C] dark:text-[#5B9EC2]" />
            <h2 className="text-[15px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
              Security & Session
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/api-keys"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-black/[0.1] dark:border-white/[0.1] text-[12.5px] font-medium text-[#0B1220] dark:text-[#F8FAFC]"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Manage API Keys</span>
              </Link>
              <Link
                href="/delete-account"
                className="inline-flex items-center h-8 px-3 rounded-md border border-red-500/25 text-[12.5px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/[0.06]"
              >
                Delete Account
              </Link>
            </div>

            {user && (
              <button
                type="button"
                disabled={signingOut}
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md border border-black/[0.12] dark:border-white/[0.12] text-[12.5px] font-medium text-[#0B1220] dark:text-[#F8FAFC] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
              </button>
            )}
          </div>
        </section>
      </div>
    </PlatformShell>
  );
}
