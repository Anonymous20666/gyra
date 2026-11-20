"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, KeyRound, SlidersHorizontal } from "lucide-react";
import { PlatformShell } from "../components/platform/PlatformShell";
import { CodeSnippetBlock } from "../components/platform/CodeSnippetBlock";

const SECTIONS = [
  { id: "getting-started", label: "Getting Started" },
  { id: "authentication", label: "Authentication" },
  { id: "chat-api", label: "Chat API" },
  { id: "image-api", label: "Image Generation API" },
  { id: "video-api", label: "Video Generation API" },
  { id: "models-api", label: "Models Registry" },
  { id: "errors", label: "Errors & Troubleshooting" },
  { id: "guides", label: "Integration Guides" },
] as const;

export default function DocsPage() {
  const [baseUrl, setBaseUrl] = useState("https://gyra.ai");

  useEffect(() => {
    if (typeof window !== "undefined") setBaseUrl(window.location.origin);
  }, []);

  return (
    <PlatformShell
      title="Documentation"
      description="Verified reference guides derived directly from Gyra's production API routes."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/docs/media"
            className="hidden sm:inline-flex items-center gap-1 h-8 px-3 rounded-md border border-black/[0.1] dark:border-white/[0.1] bg-white dark:bg-[#0B1219] text-[12px] font-medium text-[#0B1220] dark:text-[#F8FAFC]"
          >
            <span>Media API Docs</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/playground"
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0B1220] dark:bg-white text-white dark:text-[#04080D] text-[12px] font-semibold"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Playground</span>
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sticky Table of Contents */}
        <aside className="lg:col-span-3 lg:sticky lg:top-6 space-y-3">
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748B] dark:text-white/45">
            On This Page
          </p>
          <nav aria-label="Documentation sections" className="space-y-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block py-1.5 px-2.5 rounded-md text-[13px] text-[#475569] dark:text-white/65 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#0B1220] dark:hover:text-white transition-colors"
              >
                {s.label}
              </a>
            ))}
          </nav>

          <div className="pt-3 border-t border-black/[0.08] dark:border-white/[0.08] space-y-2">
            <Link
              href="/api-keys"
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Manage API Keys</span>
            </Link>
            <Link
              href="/docs/media"
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#475569] dark:text-white/65 hover:underline"
            >
              <span>Media API Reference</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>

        {/* Documentation Body */}
        <article className="lg:col-span-9 space-y-10 max-w-3xl">
          <section id="getting-started" className="space-y-3 scroll-mt-8">
            <h2 className="text-[20px] font-semibold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
              Getting Started
            </h2>
            <p className="text-[13.5px] leading-relaxed text-[#334155] dark:text-white/75">
              Gyra exposes REST and Server-Sent Events (SSE) endpoints for conversational inference, FLUX image synthesis, LTX 720p video generation, and media tooling. Every endpoint documented on this page maps directly to an active route handler in this deployment.
            </p>
            <div className="p-3.5 rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] font-mono text-[12.5px] text-[#0B1220] dark:text-[#F8FAFC]">
              Base URL: <span className="text-[#1F5B7C] dark:text-[#5B9EC2]">{baseUrl}</span>
            </div>
          </section>

          <section id="authentication" className="space-y-3 scroll-mt-8 pt-6 border-t border-black/[0.08] dark:border-white/[0.08]">
            <h2 className="text-[20px] font-semibold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
              Authentication
            </h2>
            <p className="text-[13.5px] leading-relaxed text-[#334155] dark:text-white/75">
              Developer endpoints accept scoped Bearer API keys created in{" "}
              <Link href="/api-keys" className="text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline">
                API Keys
              </Link>
              . Account-scoped browser routes (image proxy, video generation, wallets, key management) authenticate with your Supabase session JWT via{" "}
              <code className="font-mono text-[12px]">Authorization: Bearer &lt;jwt&gt;</code> or{" "}
              <code className="font-mono text-[12px]">x-gyra-user-token</code>.
            </p>
            <CodeSnippetBlock
              title="Authentication Headers"
              tabs={[
                {
                  id: "headers",
                  label: "HTTP Headers",
                  code: `# Scoped Developer API Key (e.g. /api/v1/chat)
Authorization: Bearer gyra_xxxxxxxxxxxxxxxxxxxxxxxx

# Authenticated User Session (e.g. /api/fal/proxy, /api/v1/video/generate)
Authorization: Bearer <supabase_access_token>
x-gyra-user-token: <supabase_access_token>`,
                },
              ]}
            />
          </section>

          <section id="chat-api" className="space-y-3 scroll-mt-8 pt-6 border-t border-black/[0.08] dark:border-white/[0.08]">
            <h2 className="text-[20px] font-semibold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
              Chat API
            </h2>
            <p className="text-[13.5px] leading-relaxed text-[#334155] dark:text-white/75">
              Use <code className="font-mono text-[12px]">POST /api/v1/chat</code> for external applications with an API key (up to 50 messages, 32,000 characters), or{" "}
              <code className="font-mono text-[12px]">POST /api/chat</code> for interactive streaming sessions with{" "}
              <code className="font-mono text-[12px]">think</code> (reasoning trace) and{" "}
              <code className="font-mono text-[12px]">search</code> (web grounding) toggles.
            </p>
            <CodeSnippetBlock
              title="POST /api/v1/chat"
              tabs={[
                {
                  id: "curl",
                  label: "cURL",
                  code: `curl -X POST ${baseUrl}/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_GYRA_API_KEY" \\
  -d '{
    "model": "gyra-1.0",
    "stream": true,
    "messages": [
      { "role": "system", "content": "Be concise and technical." },
      { "role": "user", "content": "Compare HTTP/2 multiplexing with HTTP/3 QUIC." }
    ]
  }'`,
                },
                {
                  id: "ts",
                  label: "TypeScript",
                  code: `const res = await fetch("${baseUrl}/api/v1/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${process.env.GYRA_API_KEY}\`,
  },
  body: JSON.stringify({
    model: "gyra-1.0",
    stream: false,
    messages: [{ role: "user", content: "Compare HTTP/2 with HTTP/3." }],
  }),
});
const data = await res.json();`,
                },
              ]}
            />
          </section>

          <section id="image-api" className="space-y-3 scroll-mt-8 pt-6 border-t border-black/[0.08] dark:border-white/[0.08]">
            <h2 className="text-[20px] font-semibold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
              Image Generation API
            </h2>
            <p className="text-[13.5px] leading-relaxed text-[#334155] dark:text-white/75">
              Image synthesis routes through <code className="font-mono text-[12px]">POST /api/fal/proxy</code> with an explicit{" "}
              <code className="font-mono text-[12px]">x-fal-target-url</code> header targeting{" "}
              <code className="font-mono text-[12px]">https://fal.run/fal-ai/flux/dev</code> or{" "}
              <code className="font-mono text-[12px]">https://fal.run/fal-ai/flux-pro/v1.1-ultra</code>.
            </p>
            <CodeSnippetBlock
              title="POST /api/fal/proxy"
              tabs={[
                {
                  id: "ts",
                  label: "TypeScript",
                  code: `const res = await fetch("${baseUrl}/api/fal/proxy", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: \`Bearer \${supabaseAccessToken}\`,
    "x-fal-target-url": "https://fal.run/fal-ai/flux-pro/v1.1-ultra",
  },
  body: JSON.stringify({
    prompt: "Industrial aluminum audio preamp macro photography, studio rim lighting",
    aspect_ratio: "16:9",
    raw: true,
    enable_safety_checker: true,
    num_images: 1,
  }),
});
const { images } = await res.json();`,
                },
              ]}
            />
          </section>

          <section id="video-api" className="space-y-3 scroll-mt-8 pt-6 border-t border-black/[0.08] dark:border-white/[0.08]">
            <h2 className="text-[20px] font-semibold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
              Video Generation API
            </h2>
            <p className="text-[13.5px] leading-relaxed text-[#334155] dark:text-white/75">
              Video jobs run asynchronously on <code className="font-mono text-[12px]">fal-ai/ltx-video-13b-distilled</code> at 720p (121 frames, 24fps). Requires an active SuperGyra subscription and $2.00 AI wallet credits per render (automatically refunded if upstream fails).
            </p>
            <CodeSnippetBlock
              title="Video Queue + Poll"
              tabs={[
                {
                  id: "curl",
                  label: "cURL",
                  code: `curl -X POST ${baseUrl}/api/v1/video/generate \\
  -H "Content-Type: application/json" \\
  -H "x-gyra-user-token: YOUR_SUPABASE_ACCESS_TOKEN" \\
  -d '{ "prompt": "Aerial glide over misty basalt cliffs at sunrise", "aspectRatio": "16:9" }'

# Poll status
curl ${baseUrl}/api/v1/video/status/REQUEST_ID

# List account video jobs
curl ${baseUrl}/api/v1/video/history -H "x-gyra-user-token: YOUR_SUPABASE_ACCESS_TOKEN"`,
                },
              ]}
            />
          </section>

          <section id="models-api" className="space-y-3 scroll-mt-8 pt-6 border-t border-black/[0.08] dark:border-white/[0.08]">
            <h2 className="text-[20px] font-semibold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
              Models Registry
            </h2>
            <p className="text-[13.5px] leading-relaxed text-[#334155] dark:text-white/75">
              Query <code className="font-mono text-[12px]">GET /api/models</code> to discover every active model, its endpoint, availability tier, and supported parameters programmatically. You can also browse the visual registry in{" "}
              <Link href="/models" className="text-[#1F5B7C] dark:text-[#5B9EC2] hover:underline">
                Models
              </Link>
              .
            </p>
          </section>

          <section id="errors" className="space-y-3 scroll-mt-8 pt-6 border-t border-black/[0.08] dark:border-white/[0.08]">
            <h2 className="text-[20px] font-semibold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
              Errors & Troubleshooting
            </h2>
            <p className="text-[13.5px] leading-relaxed text-[#334155] dark:text-white/75">
              All JSON error responses follow a structured <code className="font-mono text-[12px]">{"{ error: { code, message } }"}</code> envelope. Check{" "}
              <code className="font-mono text-[12px]">401</code> for invalid or revoked keys,{" "}
              <code className="font-mono text-[12px]">402</code> when credits or free limits are exhausted, and{" "}
              <code className="font-mono text-[12px]">403</code> when a SuperGyra entitlement is required.
            </p>
            <CodeSnippetBlock
              title="Error Payload Example"
              tabs={[
                {
                  id: "json",
                  label: "JSON",
                  code: `{
  "error": {
    "code": "insufficient_credits",
    "message": "Video generation requires $2.00 in AI wallet credits."
  }
}`,
                },
              ]}
            />
          </section>

          <section id="guides" className="space-y-3 scroll-mt-8 pt-6 border-t border-black/[0.08] dark:border-white/[0.08]">
            <h2 className="text-[20px] font-semibold tracking-tight text-[#0B1220] dark:text-[#F8FAFC]">
              Integration Guides
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  title: "Interactive Playground Testing",
                  desc: "Prototype prompts and compare models side-by-side before writing code.",
                  href: "/playground",
                },
                {
                  title: "Developer API Hub",
                  desc: "Inspect live request history, wallet balances, and per-key request counters.",
                  href: "/api",
                },
                {
                  title: "Media & Audio API Docs",
                  desc: "Reference guide for media extraction and transcription endpoints.",
                  href: "/docs/media",
                },
                {
                  title: "System Status",
                  desc: "Check live operational health across Gyra services.",
                  href: "/status",
                },
              ].map((g) => (
                <Link
                  key={g.href}
                  href={g.href}
                  className="p-4 rounded-lg bg-white dark:bg-[#060C12] border border-black/[0.08] dark:border-white/[0.08] hover:border-[#1F5B7C]/50 dark:hover:border-[#5B9EC2]/50 transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-semibold text-[#0B1220] dark:text-[#F8FAFC]">
                      {g.title}
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#1F5B7C] dark:text-[#5B9EC2]" />
                  </div>
                  <p className="text-[12px] text-[#64748B] dark:text-white/55">{g.desc}</p>
                </Link>
              ))}
            </div>
          </section>
        </article>
      </div>
    </PlatformShell>
  );
}
