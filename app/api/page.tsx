"use client";

import Link from "next/link";
import Logo from "../Logo";
import FeatureGrid from "../components/FeatureGrid";
import ApiCategorySection from "../components/ApiCategorySection";
import { API_CATEGORIES } from "../lib/apiCategories";

export default function ApiPage() {
  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] bg-blue-500/8 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/6 rounded-full blur-[160px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-30 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5 backdrop-blur-sm bg-black/40 sticky top-0">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">API</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          {API_CATEGORIES.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              {c.name.replace("Gyra ", "").replace(" API", "")}
              {c.status === "live" ? (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              )}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-white transition-colors hidden md:block"
          >
            Sign in
          </Link>
          <Link
            href="/api-keys"
            className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Get API key
          </Link>
        </div>
      </nav>

      {/* ============ HERO WITH VIDEO ============ */}
      <section className="relative z-10 w-full min-h-[80vh] flex items-center overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/api-hero.png"
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/api-hero-bg.mp4" type="video/mp4" />
        </video>

        <div
          aria-hidden
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.72) 50%, rgba(0,0,0,0.94) 100%)",
          }}
        />

        <div
          aria-hidden
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(59,130,246,0.18) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 py-24 w-full">
          <div className="max-w-3xl">
            <p className="text-xs tracking-[0.4em] text-white/50 uppercase mb-8">
              The Gyra Developer Platform
            </p>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] mb-8 text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
              Four APIs.
              <br />
              One platform.
            </h1>

            <p className="text-base md:text-xl text-white/75 max-w-2xl leading-relaxed mb-12">
              AI, media intelligence, network tools, and utilities — all under
              one developer platform. OpenAI-compatible. Free to start. Built
              for Nigeria and the world.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/api-keys"
                className="bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-zinc-200 transition-colors text-center"
              >
                Get your free API key
              </Link>
              <Link
                href="#ai"
                className="border border-white/20 hover:border-white/50 text-white px-8 py-4 rounded-full font-medium transition-colors backdrop-blur-sm bg-white/5 text-center"
              >
                Explore APIs ↓
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce opacity-40">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* ============ STAT STRIP ============ */}
      <section className="relative z-10 border-y border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "4", label: "API Categories" },
              { value: "24+", label: "Endpoints" },
              { value: "<200ms", label: "Avg Latency" },
              { value: "99.9%", label: "Uptime" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">
                  {s.value}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ LOGO STRIP ============ */}
      <section className="relative z-10 border-b border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <p className="text-center text-xs text-zinc-500 tracking-[0.3em] uppercase mb-8">
            Works with your stack
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {[
              "Next.js",
              "React",
              "Python",
              "Node.js",
              "Expo",
              "Vercel AI SDK",
              "LangChain",
              "Curl",
            ].map((name) => (
              <span
                key={name}
                className="text-zinc-600 hover:text-zinc-400 transition-colors text-sm font-medium tracking-wide"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CATEGORY SECTIONS ============ */}
      {API_CATEGORIES.map((category, i) => (
        <ApiCategorySection
          key={category.id}
          category={category}
          index={i}
          reversed={i % 2 === 1}
        />
      ))}

      {/* ============ CONSTELLATION ============ */}
      <section className="relative z-10 border-t border-white/5 max-w-6xl mx-auto px-6 md:px-12 py-24">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
            The Gyra Ecosystem
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tighter max-w-2xl mx-auto leading-tight">
            One intelligence layer.
            <br />
            Every modality.
          </h2>
        </div>

        <div className="relative max-w-3xl mx-auto">
          <svg
            viewBox="0 0 800 500"
            className="w-full h-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>
            </defs>

            <circle cx="400" cy="250" r="200" fill="url(#glow)" />

            <ellipse
              cx="400"
              cy="250"
              rx="320"
              ry="200"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <ellipse
              cx="400"
              cy="250"
              rx="220"
              ry="140"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />

            {[
              { x: 120, y: 200 },
              { x: 680, y: 200 },
              { x: 200, y: 380 },
              { x: 600, y: 380 },
              { x: 400, y: 80 },
              { x: 400, y: 430 },
            ].map((pt, i) => (
              <line
                key={i}
                x1="400"
                y1="250"
                x2={pt.x}
                y2={pt.y}
                stroke="rgba(59,130,246,0.25)"
                strokeWidth="1"
              />
            ))}

            {[
              { x: 120, y: 200, label: "Chat" },
              { x: 680, y: 200, label: "Vision" },
              { x: 200, y: 380, label: "Voice" },
              { x: 600, y: 380, label: "Files" },
              { x: 400, y: 80, label: "Video" },
              { x: 400, y: 430, label: "Search" },
            ].map((s, i) => (
              <g key={i}>
                <circle
                  cx={s.x}
                  cy={s.y}
                  r="34"
                  fill="#0a0a0a"
                  stroke="rgba(59,130,246,0.4)"
                  strokeWidth="1.5"
                />
                <text
                  x={s.x}
                  y={s.y + 4}
                  textAnchor="middle"
                  fill="#a1a1aa"
                  fontSize="11"
                  fontFamily="system-ui"
                >
                  {s.label}
                </text>
              </g>
            ))}

            <circle
              cx="400"
              cy="250"
              r="56"
              fill="#0a0a0a"
              stroke="rgba(59,130,246,0.6)"
              strokeWidth="2"
            />
            <circle cx="400" cy="250" r="48" fill="url(#glow)" />
            <text
              x="400"
              y="257"
              textAnchor="middle"
              fill="white"
              fontSize="26"
              fontWeight="700"
              fontFamily="system-ui"
            >
              G
            </text>
          </svg>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="relative z-10 border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
              Why developers choose Gyra
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
              Built for builders.
            </h2>
          </div>

          <FeatureGrid
            features={[
              {
                icon: "⚡",
                title: "One key. Four APIs.",
                desc: "AI, Media, Network, and Utilities — all under one developer account with per-category access.",
              },
              {
                icon: "🌍",
                title: "Nigeria-first.",
                desc: "Naira pricing, Nigerian English, Yoruba, Igbo, Hausa, and Pidgin understood natively.",
              },
              {
                icon: "🔒",
                title: "Secure by default.",
                desc: "Keys stored hashed, revocable instantly, never logged in plaintext. Rate limits enforced server-side.",
              },
              {
                icon: "🎬",
                title: "Media intelligence.",
                desc: "Video transcripts, summaries, music metadata — the legitimate way to work with media APIs.",
              },
              {
                icon: "📊",
                title: "Real analytics.",
                desc: "Every request logged. Per-key usage, error rates, latency, and top endpoints.",
              },
              {
                icon: "💰",
                title: "Credits, not subscriptions.",
                desc: "Pay only for what you use. Top up anytime. No lock-in, no hidden fees.",
              },
            ]}
          />
        </div>
      </section>

      {/* ============ CODE EXAMPLE ============ */}
      <section className="relative z-10 border-t border-white/5 py-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">
              Get started in 30 seconds
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter">
              Three lines of code.
            </h2>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-black">
              <span className="text-xs text-zinc-500 font-mono">javascript</span>
              <button className="text-xs text-zinc-400 hover:text-white transition-colors">
                Copy
              </button>
            </div>
            <pre className="p-5 text-xs md:text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`const res = await fetch("https://gyra.ng/api/v1/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer gyra_xxxxx",
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Hello Gyra!" }],
  }),
});

const data = await res.json();
console.log(data.choices[0].message.content);`}
            </pre>
          </div>

          <div className="text-center mt-10">
            <Link
              href="/docs"
              className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
            >
              More examples in the docs <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="relative z-10 border-t border-white/5 py-24">
        <div className="max-w-3xl mx-auto px-6 md:px-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter leading-tight mb-6">
            Start building with Gyra.
          </h2>
          <p className="text-zinc-400 mb-10 leading-relaxed">
            Get your free API key in 30 seconds. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/api-keys"
              className="bg-white text-black px-8 py-4 rounded-full font-medium hover:bg-zinc-200 transition-colors"
            >
              Get API key
            </Link>
            <Link
              href="/docs"
              className="border border-white/10 hover:border-white/30 text-white px-8 py-4 rounded-full font-medium transition-colors"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-10">
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size={24} animated={false} />
            <div>
              <p className="font-bold tracking-widest text-xs">GYRA</p>
              <p className="text-[10px] text-zinc-600 tracking-wider">
                INTELLIGENCE, SIMPLIFIED.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-500">
            <Link href="/docs" className="hover:text-white transition-colors">
              Docs
            </Link>
            <Link href="/products" className="hover:text-white transition-colors">
              Products
            </Link>
            <Link href="/status" className="hover:text-white transition-colors">
              Status
            </Link>
            <Link
              href="/changelog"
              className="hover:text-white transition-colors"
            >
              Changelog
            </Link>
            <a
              href="https://t.me/Gyra_AiBot"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              Telegram
            </a>
          </div>
        </div>
        <p className="mt-8 text-[11px] text-zinc-700 text-center">
          © 2026 Gyra · Genvia AI Company. All rights reserved.
        </p>
      </footer>
    </main>
  );
}