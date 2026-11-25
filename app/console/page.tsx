"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConsoleWorkspace } from "../dev-platform/components/console/ConsoleWorkspace";
import {
  DevShell,
  type ConsoleSection,
  type DataSourceMode,
} from "../dev-platform/components/shell/DevShell";
import { DocsReferenceModal } from "../dev-platform/components/shell/DocsReferenceModal";
import { savePlaygroundHandoff } from "../dev-platform/handoff";
import type {
  ActivityRecord,
  ApiKeyRecord,
  WalletBalances,
} from "../dev-platform/lib/analytics";
import {
  buildDemoActivity,
  DEMO_API_KEYS,
  DEMO_WALLETS,
} from "../dev-platform/lib/demoData";
import {
  getCategoryById,
  type ApiCategoryId,
} from "../dev-platform/lib/gyraCatalog";
import { getAccessToken, isSupabaseConfigured, supabase } from "../supabase";

const EMPTY_WALLETS: WalletBalances = {
  ai: 0,
  media: 0,
  network: 0,
  utilities: 0,
};

function generateDemoSecret(prefix: string): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = prefix;
  for (let i = 0; i < 36; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export default function ConsolePage() {
  const router = useRouter();
  const [section, setSection] = useState<ConsoleSection>("overview");
  const [dataMode, setDataMode] = useState<DataSourceMode>("demo");
  const [docsOpen, setDocsOpen] = useState(false);

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [liveWallets, setLiveWallets] = useState<WalletBalances>(EMPTY_WALLETS);
  const [liveKeys, setLiveKeys] = useState<ApiKeyRecord[]>([]);
  const [liveActivity, setLiveActivity] = useState<ActivityRecord[]>([]);

  const [demoKeys, setDemoKeys] = useState<ApiKeyRecord[]>(DEMO_API_KEYS);
  const [demoActivity, setDemoActivity] = useState<ActivityRecord[]>([]);

  useEffect(() => {
    setDemoActivity(buildDemoActivity());
  }, []);

  // Connect to real main Gyra backend when authenticated
  useEffect(() => {
    let cancelled = false;

    const loadLiveAccount = async () => {
      if (!isSupabaseConfigured) return;
      const token = await getAccessToken();
      if (!token || cancelled) return;

      setAuthToken(token);
      setDataMode("live");

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [walletsRes, keysRes, actRes] = await Promise.all([
          fetch("/api/me/wallets", { headers }),
          fetch("/api/keys", { headers }),
          fetch("/api/me/activity", { headers }),
        ]);

        if (cancelled) return;

        if (walletsRes.ok) {
          const w = (await walletsRes.json()) as Partial<WalletBalances>;
          setLiveWallets({
            ai: Number(w.ai ?? 0),
            media: Number(w.media ?? 0),
            network: Number(w.network ?? 0),
            utilities: Number(w.utilities ?? 0),
          });
        }

        if (keysRes.ok) {
          const kJson = (await keysRes.json()) as { keys?: ApiKeyRecord[] } | ApiKeyRecord[];
          const list = Array.isArray(kJson) ? kJson : kJson.keys ?? [];
          setLiveKeys(list);
        }

        if (actRes.ok) {
          const aJson = (await actRes.json()) as {
            activity?: Array<{
              id: string;
              endpoint: string;
              category?: string;
              status_code?: number;
              cost_usd?: number;
              latency_ms?: number;
              created_at: string;
            }>;
          };
          const mapped: ActivityRecord[] = (aJson.activity ?? []).map((item) => ({
            id: item.id,
            request_id: `req_${String(item.id).slice(0, 8)}`,
            endpoint: item.endpoint,
            method: item.endpoint.includes("/status/") ? "GET" : "POST",
            category: (item.category as ApiCategoryId) || "media",
            status_code: Number(item.status_code ?? 200),
            latency_ms: Number(item.latency_ms ?? 240),
            cost_usd: Number(item.cost_usd ?? 0),
            created_at: item.created_at,
          }));
          setLiveActivity(mapped);
        }
      } catch {
        // Keep graceful fallback without crashing UI
      }
    };

    void loadLiveAccount();

    const { data: sub } = isSupabaseConfigured
      ? supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.access_token) {
            void loadLiveAccount();
          } else {
            setAuthToken(null);
          }
        })
      : { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const activeWallets = useMemo<WalletBalances>(() => {
    if (dataMode === "demo") return DEMO_WALLETS;
    if (dataMode === "empty") return EMPTY_WALLETS;
    return liveWallets;
  }, [dataMode, liveWallets]);

  const activeKeys = useMemo<ApiKeyRecord[]>(() => {
    if (dataMode === "demo") return demoKeys;
    if (dataMode === "empty") return [];
    return liveKeys;
  }, [dataMode, demoKeys, liveKeys]);

  const activeActivity = useMemo<ActivityRecord[]>(() => {
    if (dataMode === "demo") return demoActivity;
    if (dataMode === "empty") return [];
    return liveActivity;
  }, [dataMode, demoActivity, liveActivity]);

  const handleCreateKey = async (name: string, category: ApiCategoryId) => {
    if (dataMode === "live" && authToken) {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name, category }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Failed to create key (HTTP ${res.status})`);
      }
      const created = (await res.json()) as {
        id: string;
        key: string;
        name: string;
        category: ApiCategoryId;
      };
      const fullKey = created.key;
      const newRecord: ApiKeyRecord = {
        id: created.id,
        name: created.name,
        category: created.category,
        keyPreview: `${fullKey.slice(0, 14)}••••••••${fullKey.slice(-4)}`,
        active: true,
        created_at: new Date().toISOString(),
        last_used: null,
        request_count: 0,
      };
      setLiveKeys((prev) => [newRecord, ...prev]);
      return { id: created.id, fullKey, name: created.name, category: created.category };
    }

    const meta = getCategoryById(category);
    const fullKey = generateDemoSecret(meta.keyPrefix);
    const newRecord: ApiKeyRecord = {
      id: `key_${Date.now()}`,
      name,
      category,
      keyPreview: `${fullKey.slice(0, 14)}••••••••${fullKey.slice(-4)}`,
      active: true,
      created_at: new Date().toISOString(),
      last_used: null,
      request_count: 0,
    };
    setDemoKeys((prev) => [newRecord, ...prev]);
    return { id: newRecord.id, fullKey, name, category };
  };

  const handleRevokeKey = async (id: string) => {
    if (dataMode === "live" && authToken) {
      const res = await fetch(`/api/keys/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to revoke key (HTTP ${res.status})`);
      }
      setLiveKeys((prev) => prev.map((k) => (k.id === id ? { ...k, active: false } : k)));
      return;
    }
    setDemoKeys((prev) => prev.map((k) => (k.id === id ? { ...k, active: false } : k)));
  };

  const handleOpenPlayground = (opts?: {
    category?: ApiCategoryId;
    endpointPath?: string;
    requestBody?: string;
    apiKey?: string;
  }) => {
    if (opts) savePlaygroundHandoff(opts);
    router.push("/playground");
  };

  return (
    <>
      <DevShell
        route="console"
        consoleSection={section}
        dataMode={dataMode}
        activeKeyCount={activeKeys.filter((k) => k.active).length}
        onNavigateRoute={(r) => {
          if (r === "playground") router.push("/playground");
        }}
        onSelectConsoleSection={setSection}
        onChangeDataMode={setDataMode}
        onOpenDocs={() => setDocsOpen(true)}
      >
        <ConsoleWorkspace
          section={section}
          dataMode={dataMode}
          wallets={activeWallets}
          keys={activeKeys}
          activity={activeActivity}
          onSelectSection={setSection}
          onCreateKey={handleCreateKey}
          onRevokeKey={handleRevokeKey}
          onOpenPlayground={handleOpenPlayground}
          onChangeDataMode={setDataMode}
        />
      </DevShell>

      <DocsReferenceModal
        open={docsOpen}
        onClose={() => setDocsOpen(false)}
        onSelectEndpoint={(ep) => {
          setDocsOpen(false);
          router.push(`/playground?endpoint=${encodeURIComponent(ep.id)}`);
        }}
      />
    </>
  );
}
