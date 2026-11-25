"use client";

import { useState } from "react";
import { ArrowRight, ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
import {
  formatCompactNumber,
  formatCurrency,
  type ActivityRecord,
  type ApiKeyRecord,
  type TimeRangeKey,
  type WalletBalances,
} from "../../lib/analytics";
import type { ApiCategoryId } from "../../lib/gyraCatalog";
import type { ConsoleSection, DataSourceMode } from "../shell/DevShell";
import { ActivityLogTable } from "./ActivityLogTable";
import { ApiKeyManager } from "./ApiKeyManager";
import { ServiceBalanceGrid } from "./ServiceBalanceGrid";
import { UsageBreakdown } from "./UsageBreakdown";
import { UsageChart } from "./UsageChart";

interface ConsoleWorkspaceProps {
  section: ConsoleSection;
  dataMode: DataSourceMode;
  wallets: WalletBalances;
  keys: ApiKeyRecord[];
  activity: ActivityRecord[];
  onSelectSection: (section: ConsoleSection) => void;
  onCreateKey: (
    name: string,
    category: ApiCategoryId
  ) => Promise<{ id: string; fullKey: string; name: string; category: ApiCategoryId }>;
  onRevokeKey: (id: string) => Promise<void>;
  onOpenPlayground: (opts?: {
    category?: ApiCategoryId;
    endpointPath?: string;
    requestBody?: string;
    apiKey?: string;
  }) => void;
  onChangeDataMode: (mode: DataSourceMode) => void;
}

export function ConsoleWorkspace({
  section,
  dataMode,
  wallets,
  keys,
  activity,
  onSelectSection,
  onCreateKey,
  onRevokeKey,
  onOpenPlayground,
  onChangeDataMode,
}: ConsoleWorkspaceProps) {
  const [range, setRange] = useState<TimeRangeKey>("24H");
  const [endpointFilter, setEndpointFilter] = useState("");

  const totalBalance = wallets.ai + wallets.media + wallets.network + wallets.utilities;
  const activeKeys = keys.filter((k) => k.active).length;
  const totalRequests = activity.length;
  const totalTokens = activity.reduce((sum, r) => sum + (r.tokens_total || 0), 0);

  const handleFilterEndpoint = (endpoint: string) => {
    setEndpointFilter(endpoint);
    onSelectSection("activity");
  };

  if (dataMode === "live" && keys.length === 0 && activity.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12">
        <div className="bg-[#09090B] border border-[#1F1F23] rounded-lg p-8 max-w-2xl mx-auto">
          <div className="w-10 h-10 rounded-lg bg-[#121215] border border-[#27272A] flex items-center justify-center text-[#5B9EC2] mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="font-display text-[22px] font-semibold text-[#F4F4F5]">
            Live Account Connection
          </h1>
          <p className="mt-2 text-[14px] text-[#A1A1AA] leading-relaxed">
            In production deployment on <code className="text-[#D4D4D8]">gyra.ng/console</code>,
            this view authenticates via your Gyra session and reads directly from{" "}
            <code className="text-[#D4D4D8]">/api/me/wallets</code>,{" "}
            <code className="text-[#D4D4D8]">/api/keys</code>, and{" "}
            <code className="text-[#D4D4D8]">/api/me/activity</code>. Sign in with your Gyra account to view live wallets, keys, and request logs.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="/login"
              className="px-4 py-2 text-[13px] font-medium bg-[#1F5B7C] hover:bg-[#286F96] text-[#F4F4F5] rounded-md transition-colors inline-flex items-center gap-2"
            >
              <span>Sign in to Gyra</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => onOpenPlayground()}
              className="px-4 py-2 text-[13px] font-medium bg-[#121215] hover:bg-[#18181B] border border-[#27272A] text-[#D4D4D8] rounded-md transition-colors inline-flex items-center gap-2"
            >
              <span>Open Playground</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeDataMode("demo")}
              className="px-4 py-2 text-[13px] font-medium bg-[#121215] hover:bg-[#18181B] border border-[#27272A] text-[#D4D4D8] rounded-md transition-colors"
            >
              Inspect Demo Dataset
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* OVERVIEW SECTION */}
      {section === "overview" && (
        <>
          {/* Account & Period Summary Strip */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-[#18181B]">
            <div>
              <h1 className="font-display text-[22px] sm:text-[24px] font-semibold text-[#F4F4F5]">
                Developer Console
              </h1>
              <p className="mt-1 text-[13.5px] text-[#A1A1AA]">
                {dataMode === "demo"
                  ? "dev-platform@gyra.ng · Demonstration workspace · Current billing cycle"
                  : "No active usage recorded · Current billing cycle"}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3">
              <div>
                <p className="text-[11.5px] text-[#71717A]">Total Balance</p>
                <p className="mt-0.5 font-mono text-[17px] font-semibold text-[#F4F4F5] tabular-nums">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
              <div>
                <p className="text-[11.5px] text-[#71717A]">API Keys</p>
                <p className="mt-0.5 font-mono text-[17px] font-semibold text-[#F4F4F5] tabular-nums">
                  {activeKeys}
                  <span className="text-[12px] text-[#71717A] font-normal">/{keys.length}</span>
                </p>
              </div>
              <div>
                <p className="text-[11.5px] text-[#71717A]">Requests (30d)</p>
                <p className="mt-0.5 font-mono text-[17px] font-semibold text-[#F4F4F5] tabular-nums">
                  {totalRequests.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11.5px] text-[#71717A]">Tokens Logged</p>
                <p className="mt-0.5 font-mono text-[17px] font-semibold text-[#F4F4F5] tabular-nums">
                  {formatCompactNumber(totalTokens)}
                </p>
              </div>
            </div>
          </div>

          {/* Primary Financial-Grade Usage Visualization */}
          <UsageChart
            records={activity}
            range={range}
            onChangeRange={setRange}
            isDemoMode={dataMode === "demo"}
            onOpenPlayground={() => onOpenPlayground()}
          />

          {/* Service Wallets Grid */}
          <ServiceBalanceGrid
            wallets={wallets}
            activity={activity}
            onOpenCategoryInPlayground={(category) => onOpenPlayground({ category })}
            onOpenBilling={() => onSelectSection("billing")}
          />

          {/* Usage Breakdown */}
          <UsageBreakdown
            records={activity}
            onFilterByEndpoint={handleFilterEndpoint}
          />

          {/* Recent Activity with click-to-inspect technical payload drawer */}
          <ActivityLogTable
            records={activity}
            compact
            maxRows={6}
            onViewAll={() => onSelectSection("activity")}
            onReplayEndpoint={(endpointPath, requestBody) =>
              onOpenPlayground({ endpointPath, requestBody })
            }
          />
        </>
      )}

      {/* DEDICATED ANALYTICS SECTION */}
      {section === "analytics" && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-[#18181B]">
            <h1 className="font-display text-[22px] font-semibold text-[#F4F4F5]">
              Usage &amp; Analytics
            </h1>
            <p className="mt-1 text-[13.5px] text-[#A1A1AA]">
              Time-series request volume, credit burn, token throughput, and per-route latency
            </p>
          </div>
          <UsageChart
            records={activity}
            range={range}
            onChangeRange={setRange}
            isDemoMode={dataMode === "demo"}
            onOpenPlayground={() => onOpenPlayground()}
          />
          <UsageBreakdown
            records={activity}
            onFilterByEndpoint={handleFilterEndpoint}
          />
        </div>
      )}

      {/* API KEYS SECTION */}
      {section === "keys" && (
        <ApiKeyManager
          keys={keys}
          onCreateKey={onCreateKey}
          onRevokeKey={onRevokeKey}
          onUseKeyInPlayground={(apiKey, category) =>
            onOpenPlayground({ apiKey, category })
          }
        />
      )}

      {/* ACTIVITY LOGS SECTION */}
      {section === "activity" && (
        <ActivityLogTable
          key={endpointFilter}
          records={activity}
          initialEndpointFilter={endpointFilter}
          onClearExternalFilter={() => setEndpointFilter("")}
          onReplayEndpoint={(endpointPath, requestBody) =>
            onOpenPlayground({ endpointPath, requestBody })
          }
        />
      )}

      {/* CREDITS & BILLING SECTION */}
      {section === "billing" && (
        <div className="space-y-6">
          <div className="pb-4 border-b border-[#18181B]">
            <h1 className="font-display text-[22px] font-semibold text-[#F4F4F5]">
              Credits &amp; Billing
            </h1>
            <p className="mt-1 text-[13.5px] text-[#A1A1AA]">
              Isolated category balances for predictable AI and Media API spend
            </p>
          </div>

          <ServiceBalanceGrid
            wallets={wallets}
            activity={activity}
            onOpenCategoryInPlayground={(category) => onOpenPlayground({ category })}
            onOpenBilling={() => {}}
          />

          <div className="bg-[#09090B] border border-[#1F1F23] rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[12px] font-medium text-[#71717A]">AI API Pricing</p>
              <p className="mt-1.5 font-display text-[16px] font-semibold text-[#F4F4F5]">
                Chat Free Tier · Video $2.00
              </p>
              <p className="mt-1 text-[13px] text-[#A1A1AA]">
                <code className="text-[12px] text-[#D4D4D8]">/api/v1/chat</code> runs on your scoped{" "}
                <code className="text-[12px] text-[#D4D4D8]">gyra_</code> key. Async 720p video
                renders deduct $2.00 from AI credits.
              </p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-[#71717A]">Media API Pricing</p>
              <p className="mt-1.5 font-display text-[16px] font-semibold text-[#F4F4F5]">
                $0.90 / request · 10 free/mo
              </p>
              <p className="mt-1 text-[13px] text-[#A1A1AA]">
                Unified rate across Music Search, YouTube Transcripts, YouTube/TikTok Metadata, and
                Whisper Transcription.
              </p>
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-[12px] font-medium text-[#71717A]">Top Up Wallets</p>
                <p className="mt-1 text-[13px] text-[#A1A1AA]">
                  Fund your AI or Media wallet via Gyra Billing and manage scoped keys in one place.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="/credits"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 text-[12.5px] font-medium bg-[#1F5B7C] hover:bg-[#286F96] text-[#F4F4F5] rounded-md transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Add Credits</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => onSelectSection("keys")}
                  className="px-3.5 py-2 text-[12.5px] font-medium bg-[#121215] hover:bg-[#18181B] border border-[#27272A] text-[#D4D4D8] rounded-md transition-colors inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Manage Keys</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
