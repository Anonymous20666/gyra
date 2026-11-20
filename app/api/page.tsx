"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  KeyRound,
  RefreshCw,
  SlidersHorizontal,
  Terminal,
} from "lucide-react";
import { PlatformShell } from "../components/platform/PlatformShell";
import { CodeSnippetBlock } from "../components/platform/CodeSnippetBlock";
import { getAccessToken, supabase } from "../supabase";

type ApiTab = "overview" | "quickstart" | "reference" | "examples" | "history" | "usage";

interface KeyRow {
  id: string;
  name: string;
  category: string;
  keyPreview: string;
  active: boolean;
  request_count: number;
  last_used: string | null;
}

interface ActivityRow {
  id: string;
  endpoint: string;
  category: string;
  status_code: number;
  cost_usd: number;
  created_at: string;
}

interface WalletState {
  ai: number;
  media: number;
  network: number;
}

const TABS: readonly { id: ApiTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "quickstart", label: "Quickstart" },
  { id: "reference", label: "API Reference" },
  { id: "examples", label: "Code Examples" },
  { id: "history", label: "Request History" },
  { id: "usage", label: "Usage & Stats" },
];

const VERIFIED_ENDPOINTS = [
  {
    method: "POST",
    path: "/api/v1/chat",
    auth: "Bearer gyra_... (+ optional x-gyra-user-token)",
    summary: "Developer chat completion endpoint supporting streaming SSE or JSON responses.",
  },
  {
    method: "POST",
    path: "/api/chat",
    auth: "Session or x-gyra-user-token",
    summary: "Streaming chat endpoint with reasoning mode (think) and live web search.",
  },
  {
    method: "POST",
    path: "/api/fal/proxy",
    auth: "Bearer <supabase_jwt> + x-fal-target-url",
    summary: "Authenticated proxy for FLUX.1 Dev and FLUX 1.1 Pro Ultra image generation.",
  },
  {
    method: "POST",
    path: "/api/v1/video/generate",
    auth: "x-gyra-user-token (SuperGyra + $2.00 credits)",
    summary: "Queues a 720p LTX-Video 13B generation job and returns requestId.",
  },
  {
    method: "GET",
    path: "/api/v1/video/status/[id]",
    auth: "Public status poll by requestId",
    summary: "Returns queued, in_progress, completed (with videoUrl), or error status.",
  },
  {
    method: "GET",
    path: "/api/models",
    auth: "Public",
    summary: "Returns the authoritative Gyra model registry, parameters, and availability.",
  },
  {
    method: "GET / POST",
    path: "/api/keys",
    auth: "Bearer <supabase_jwt>",
    summary: "Lists masked API keys or creates a new scoped key (ai, media, network, utilities).",
  },
] as const;

const ERROR_CODES = [
  { code: "400", name: "invalid_request", meaning: "Malformed JSON body, empty prompt, or unsupported parameter." },
  { code: "401", name: "unauthorized", meaning: "Missing, expired, or revoked Bearer API key or Supabase token." },
  { code: "402", name: "insufficient_credits", meaning: "Free limit reached or wallet balance below operation cost." },
  { code: "403", name: "upgrade_required", meaning: "Endpoint or model (e.g. gyra-super2.0, LTX-Video) requires SuperGyra." },
  { code: "429", name: "rate_limited", meaning: "Request burst exceeded account or upstream rate ceiling." },
  { code: "500", name: "internal_error", meaning: "Upstream inference or provider error; credits are auto-refunded on job failure." },
] as const;

export default function ApiPlatformPage() {
  const [tab, setTab] = useState<ApiTab>("overview");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [wallets, setWallets] = useState<WalletState | null>(null);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState("https://gyra.ai");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const loadDeveloperData = async () => {
    setLoading(true);
    const { data } = await supabase.auth.getUser();
    const token = await getAccessToken();
    setUserEmail(data.user?.email ?? null);

    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const [keysRes, actRes, walRes] = await Promise.allSettled([
      fetch("/api/keys", { headers }),
      fetch("/api/me/activity", { headers }),
      fetch("/api/me/wallets", { headers }),
    ]);

    if (keysRes.status === "fulfilled" && keysRes.value.ok) {
      const j = await keysRes.value.json().catch(() => null);
      if (Array.isArray(j?.keys)) setKeys(j.keys);
    }
    if (actRes.status === "fulfilled" && actRes.value.ok) {
      const j = await actRes.value.json().catch(() => null);
      if (Array.isArray(j?.activity)) setActivity(j.activity);
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
    setLoading(false);
  };

  useEffect(() => {
    loadDeveloperData();
  }, []);

  const activeKeys = keys.filter((k) => k.active);
  const totalRequests = keys.reduce((acc, k) => acc + Number(k.request_count || 0), 0);
  const totalBalance = wallets ? wallets.ai + wallets.media + wallets.network : null;

  const chatQuickstartTabs = [
    {
      id: "curl",
      label: "cURL",
      code: `curl -X POST ${baseUrl}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_GYRA_API_KEY" \\
  -d '{
    "model": "gyra-1.0",
    "stream": false,
    "messages": [
      { "role": "user", "content": "Explain SSE streaming in one sentence." }
    ]
  }'`,
    },
    {
      id: "ts",
      label: "TypeScript",
      code: `const response = await fetch("${baseUrl}/api/v1/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${process.env.GYRA_API_KEY}\`,
  },
  body: JSON.stringify({
    model: "gyra-1.0",
    stream: false,
    messages: [
      { role: "user", content: "Explain SSE streaming in one sentence." },
    ],
  }),
});

if (!response.ok) {
  const err = await response.json();
  throw new Error(err?.error?.message || "Gyra API request failed");
}

const data = await response.json();
console.log(data);`,
    },
    {
      id: "py",
      label: "Python",
      code: `import os
import requests

res = requests.post(
    "${baseUrl}/api/v1/chat",
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.environ['GYRA_API_KEY']}",
    },
    json={
        "model": "gyra-1.0",
        "stream": False,
        "messages": [
            {"role": "user", "content": "Explain SSE streaming in one sentence."}
        ],
    },
    timeout=60,
)
res.raise_for_status()
print(res.json())`,
    },
  ];

  const videoExampleTabs = [
    {
      id: "curl",
      label: "cURL",
      code: `# 1. Queue 720p video synthesis (LTX-Video 13B)
curl -X POST ${baseUrl}/api/v1/video/generate \\
  -H "Content-Type: application/json" \\
  -H "x-gyra-user-token: YOUR_SUPABASE_ACCESS_TOKEN" \\
  -d '{
    "prompt": "Slow dolly shot over rain-slicked asphalt reflecting neon signage at night",
    "aspectRatio": "16:9"
  }'

# 2. Poll job status until status == "completed"
curl ${baseUrl}/api/v1/video/status/REQUEST_ID`,
    },
    {
      id: "ts",
      label: "TypeScript",
      code: `const queued = await fetch("${baseUrl}/api/v1/video/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-gyra-user-token": supabaseAccessToken,
  },
  body: JSON.stringify({
    prompt: "Slow dolly shot over rain-slicked asphalt reflecting neon signage at night",
    aspectRatio: "16:9",
  }),
}).then((r) => r.json());

// Poll /api/v1/video/status/:id
const status = await fetch(\`${baseUrl}/api/v1/video/status/\${queued.requestId}\`).then((r) =>
  r.json(),
);
console.log(status.status, status.videoUrl);`,
    },
  ];

  const imageExampleTabs = [
    {
      id: "ts",
      label: "TypeScript",
      code: `const res = await fetch("${baseUrl}/api/fal/proxy", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${supabaseAccessToken}\`,
    "x-fal-target-url": "https://fal.run/fal-ai/flux/dev",
  },
  body: JSON.stringify({
    prompt: "Editorial architectural concrete pavilion at dawn, soft fog, 35mm film",
    image_size: "landscape_16_9",
    num_inference_steps: 28,
    guidance_scale: 3.5,
    num_images: 1,
  }),
});

const result = await res.json();
console.log(result.images?.[0]?.url);`,
    },
    {
      id: "curl",
      label: "cURL",
      code: `curl -X POST ${baseUrl}/api/fal/proxy \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \\
  -H "x-fal-target-url: https://fal.run/fal-ai/flux/dev" \\
  -d '{
    "prompt": "Editorial architectural concrete pavilion at dawn, soft fog, 35mm film",
    "image_size": "landscape_16_9",
    "num_inference_steps": 28,
    "guidance_scale": 3.5,
    "num_images": 1
  }'`,
    },
  ];

  return (
    <PlatformShell
      title="Developer API Platform"
      description="Authenticate requests, inspect real endpoints, copy verified SDK snippets, and audit account usage."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/docs"
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#0B1219] text-[12px] font-medium text-[#0B1220] dark:text-[#F8FAFC]"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Full Docs</span>
          </Link>
          <Link
            href="/api-keys"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0B1220] dark:bg-white text-white dark:text-[#04080D] text-[12px] font-semibold"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Manage Keys</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Sub-navigation Tabs */}
        <div
          className="flex flex-wrap items-center gap-1 border-b border-black/[0.08] dark:border-white/[0.08] pb-2"
          role="tablist"
          aria-label="API sections"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={`h-8 px-3 rounded-md text-[12.5px] font-medium transition-colors ${
                  active
                    ? "bg-[#1F5B7C]/12 dark:bg-[#5B9EC2]/18 text-[#1F5B7C] dark:text-[#5B9EC2]"
                    : "text-[#475569] dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 border border-black/[0.08] dark:border-white/[0.08] rounded-lg bg-white dark:bg-[#060C12] divide-y sm:divide-y-0 sm:divide-x divide-black/[0.08] dark:divide-white/[0.08]">
              <div className="p-4 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/45">
                  Active API Keys
                </span>
                <p className="text-[22px] font-semibold font-mono text-[#0B1220] dark:text-[#F8FAFC]">
                  {userEmail ? activeKeys.length : "—"}
                </p>
                <Link
                  href="/api-keys"
                  className="inline-flex items-center gap-1 text-[12px] text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                >
                  <span>Create or revoke keys</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="p-4 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/45">
                  Recorded Key Requests
                </span>
                <p className="text-[22px] font-semibold font-mono text-[#0B1220] dark:text-[#F8FAFC]">
                  {userEmail ? totalRequests.toLocaleString() : "—"}
                </p>
                <span className="text-[12px] text-[#64748B] dark:text-white/45">
                  Aggregated across active & revoked keys
                </span>
              </div>
              <div className="p-4 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/45">
                  Available Credit Balance
                </span>
                <p className="text-[22px] font-semibold font-mono text-[#0B1220] dark:text-[#F8FAFC]">
                  {totalBalance !== null ? `$${totalBalance.toFixed(2)}` : "—"}
                </p>
                <Link
                  href="/credits"
                  className="inline-flex items-center gap-1 text-[12px] text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                >
                  <span>Manage wallets</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-3">
                <h2 className="text-[15px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                  Quickstart Call
                </h2>
                <CodeSnippetBlock title="POST /api/v1/chat" tabs={chatQuickstartTabs} />
              </div>

              <div className="lg:col-span-5 rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] p-4 space-y-3">
                <h2 className="text-[14px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                  Key Prefix Scoping
                </h2>
                <p className="text-[12.5px] text-[#475569] dark:text-white/60 leading-relaxed">
                  Gyra separates API credentials by product domain so you can isolate keys per service and revoke them independently.
                </p>
                <dl className="divide-y divide-black/[0.06] dark:divide-white/[0.06] text-[12px]">
                  {[
                    { prefix: "gyra_", scope: "AI Chat, reasoning, vision, voice, video" },
                    { prefix: "gyramedia_", scope: "Media download, audio & transcription APIs" },
                    { prefix: "gyranet_", scope: "Network & intelligence utilities" },
                    { prefix: "gyrautils_", scope: "Developer utility endpoints" },
                  ].map((item) => (
                    <div key={item.prefix} className="py-2 flex items-baseline justify-between gap-3">
                      <dt className="font-mono font-semibold text-[#1F5B7C] dark:text-[#5B9EC2]">
                        {item.prefix}
                      </dt>
                      <dd className="text-right text-[#475569] dark:text-white/65">{item.scope}</dd>
                    </div>
                  ))}
                </dl>
                <div className="pt-2 flex items-center gap-3">
                  <Link
                    href="/api-keys"
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Issue a key</span>
                  </Link>
                  <Link
                    href="/playground"
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#475569] dark:text-white/65 hover:underline"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Test in Playground</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QUICKSTART */}
        {tab === "quickstart" && (
          <div className="max-w-4xl space-y-6">
            <div className="space-y-2">
              <h2 className="text-[16px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                1. Issue a Scoped API Key
              </h2>
              <p className="text-[13px] text-[#475569] dark:text-white/65 leading-relaxed">
                Open{" "}
                <Link href="/api-keys" className="text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline font-medium">
                  API Keys
                </Link>{" "}
                and generate a key under the <code className="font-mono text-[12px]">ai</code> category. Store it in an environment variable such as{" "}
                <code className="font-mono text-[12px]">GYRA_API_KEY</code> — never commit secrets to client-side bundles.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-[16px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                2. Send Your First Chat Completion
              </h2>
              <CodeSnippetBlock title="Chat Completion" tabs={chatQuickstartTabs} />
            </div>

            <div className="space-y-2">
              <h2 className="text-[16px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                3. Inspect Available Models Dynamically
              </h2>
              <CodeSnippetBlock
                title="GET /api/models"
                tabs={[
                  {
                    id: "curl",
                    label: "cURL",
                    code: `curl ${baseUrl}/api/models`,
                  },
                  {
                    id: "ts",
                    label: "TypeScript",
                    code: `const { models } = await fetch("${baseUrl}/api/models").then((r) => r.json());
console.log(models.map((m: { id: string; availability: string }) => [m.id, m.availability]));`,
                  },
                ]}
              />
            </div>
          </div>
        )}

        {/* REFERENCE */}
        {tab === "reference" && (
          <div className="space-y-6">
            <div className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[#F8FAFC] dark:bg-white/[0.03] border-b border-black/[0.07] dark:border-white/[0.07] text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/45">
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4">Endpoint</th>
                    <th className="py-2.5 px-4">Authentication</th>
                    <th className="py-2.5 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                  {VERIFIED_ENDPOINTS.map((ep) => (
                    <tr key={ep.path}>
                      <td className="py-3 px-4 font-mono font-semibold text-[#1F5B7C] dark:text-[#5B9EC2] whitespace-nowrap">
                        {ep.method}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#0B1220] dark:text-[#F8FAFC] whitespace-nowrap">
                        {ep.path}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11.5px] text-[#475569] dark:text-white/60">
                        {ep.auth}
                      </td>
                      <td className="py-3 px-4 text-[#334155] dark:text-white/75">{ep.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3">
              <h2 className="text-[15px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                Standard Error Responses
              </h2>
              <div className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] overflow-x-auto">
                <table className="w-full text-left border-collapse text-[12.5px]">
                  <thead>
                    <tr className="bg-[#F8FAFC] dark:bg-white/[0.03] border-b border-black/[0.07] dark:border-white/[0.07] text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#64748B] dark:text-white/45">
                      <th className="py-2.5 px-4">HTTP</th>
                      <th className="py-2.5 px-4">Error Code</th>
                      <th className="py-2.5 px-4">Cause</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                    {ERROR_CODES.map((er) => (
                      <tr key={er.code}>
                        <td className="py-2.5 px-4 font-mono font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                          {er.code}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#1F5B7C] dark:text-[#5B9EC2]">
                          {er.name}
                        </td>
                        <td className="py-2.5 px-4 text-[#475569] dark:text-white/65">{er.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CODE EXAMPLES */}
        {tab === "examples" && (
          <div className="max-w-4xl space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-[#1F5B7C] dark:text-[#5B9EC2]" />
                <h2 className="text-[15px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                  Chat Completions (/api/v1/chat)
                </h2>
              </div>
              <CodeSnippetBlock title="Chat API" tabs={chatQuickstartTabs} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-[#1F5B7C] dark:text-[#5B9EC2]" />
                <h2 className="text-[15px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                  FLUX Image Synthesis (/api/fal/proxy)
                </h2>
              </div>
              <CodeSnippetBlock title="Image Proxy" tabs={imageExampleTabs} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-[#1F5B7C] dark:text-[#5B9EC2]" />
                <h2 className="text-[15px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                  Video Generation & Polling (/api/v1/video/generate)
                </h2>
              </div>
              <CodeSnippetBlock title="Video API" tabs={videoExampleTabs} />
            </div>
          </div>
        )}

        {/* REQUEST HISTORY */}
        {tab === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-[#475569] dark:text-white/65">
                Live request telemetry returned from <code className="font-mono text-[12px]">GET /api/me/activity</code>.
              </p>
              <button
                type="button"
                onClick={loadDeveloperData}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-black/[0.1] dark:border-white/[0.1] text-[12px] font-medium text-[#0B1220] dark:text-[#F8FAFC]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-[13px] text-[#64748B] dark:text-white/50">
                  Loading request logs...
                </div>
              ) : !userEmail ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-[13px] text-[#475569] dark:text-white/60">
                    Sign in to view your account request history.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center h-8 px-3 rounded-md bg-[#1F5B7C] text-white text-[12px] font-medium"
                  >
                    Sign In
                  </Link>
                </div>
              ) : activity.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-[#64748B] dark:text-white/50">
                  No recorded API requests yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-[12.5px]">
                  <thead>
                    <tr className="bg-[#F8FAFC] dark:bg-white/[0.03] border-b border-black/[0.07] dark:border-white/[0.07] text-[10.5px] font-mono uppercase text-[#64748B] dark:text-white/45">
                      <th className="py-2.5 px-4">Endpoint</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Cost</th>
                      <th className="py-2.5 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                    {activity.map((row) => (
                      <tr key={row.id}>
                        <td className="py-2.5 px-4 font-mono text-[#0B1220] dark:text-[#F8FAFC]">
                          {row.endpoint}
                        </td>
                        <td className="py-2.5 px-4 font-mono uppercase text-[11px] text-[#64748B] dark:text-white/50">
                          {row.category}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          <span
                            className={
                              row.status_code < 400
                                ? "text-emerald-700 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }
                          >
                            {row.status_code}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#0B1220] dark:text-[#F8FAFC]">
                          ${row.cost_usd.toFixed(4)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11.5px] text-[#64748B] dark:text-white/45">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* USAGE & STATS */}
        {tab === "usage" && (
          <div className="space-y-6">
            {!userEmail ? (
              <div className="p-6 rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-[13px] text-[#475569] dark:text-white/65">
                  Sign in to inspect your real wallet balances and per-key request counters.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-8 px-4 rounded-md bg-[#1F5B7C] text-white text-[12.5px] font-medium"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "AI Wallet", val: wallets?.ai ?? 0, desc: "Chat, vision & LTX video renders" },
                    { label: "Media Wallet", val: wallets?.media ?? 0, desc: "Media API & transcription" },
                    { label: "Network Wallet", val: wallets?.network ?? 0, desc: "Network endpoints" },
                  ].map((w) => (
                    <div
                      key={w.label}
                      className="p-4 rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] space-y-1"
                    >
                      <span className="text-[11px] font-mono uppercase text-[#64748B] dark:text-white/45">
                        {w.label}
                      </span>
                      <p className="text-[22px] font-mono font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                        ${w.val.toFixed(2)}
                      </p>
                      <p className="text-[12px] text-[#64748B] dark:text-white/50">{w.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] overflow-x-auto">
                  <div className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.07] flex items-center justify-between">
                    <h2 className="text-[13.5px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                      Per-Key Request Counters
                    </h2>
                    <Link
                      href="/api-keys"
                      className="text-[12px] text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
                    >
                      Manage keys
                    </Link>
                  </div>
                  {keys.length === 0 ? (
                    <div className="p-6 text-[13px] text-[#64748B] dark:text-white/50">
                      No API keys issued yet.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-[12.5px]">
                      <thead>
                        <tr className="bg-[#F8FAFC] dark:bg-white/[0.03] border-b border-black/[0.07] dark:border-white/[0.07] text-[10.5px] font-mono uppercase text-[#64748B] dark:text-white/45">
                          <th className="py-2 px-4">Key Name</th>
                          <th className="py-2 px-4">Scope</th>
                          <th className="py-2 px-4">Masked Key</th>
                          <th className="py-2 px-4">Status</th>
                          <th className="py-2 px-4 text-right">Requests</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                        {keys.map((k) => (
                          <tr key={k.id}>
                            <td className="py-2.5 px-4 font-medium text-[#0B1220] dark:text-[#F8FAFC]">
                              {k.name}
                            </td>
                            <td className="py-2.5 px-4 font-mono uppercase text-[11px] text-[#64748B] dark:text-white/50">
                              {k.category}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[#475569] dark:text-white/65">
                              {k.keyPreview}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-[11px] uppercase">
                              <span
                                className={
                                  k.active
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-[#94A3B8] dark:text-white/35"
                                }
                              >
                                {k.active ? "Active" : "Revoked"}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-mono text-right text-[#0B1220] dark:text-[#F8FAFC]">
                              {Number(k.request_count || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </PlatformShell>
  );
}
