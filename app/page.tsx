"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "./supabase";
import GyraMark from "./components/GyraMark";

const TAGLINE = "Intelligence, Simplified.";

const APIS = [
  {
    id: "ai",
    name: "Gyra AI API",
    description: "Conversation, vision, file understanding, and voice — unified through OpenAI-compatible endpoints.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    status: "Live",
    href: "/api",
  },
  {
    id: "media",
    name: "Gyra Media API",
    description: "YouTube transcripts, TikTok metadata, Spotify music search, and Whisper audio transcription.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    status: "Live",
    href: "/api",
  },
  {
    id: "network",
    name: "Network API",
    description: "IP geolocation, DNS records, WHOIS data, and SSL certificate inspection.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    status: "Soon",
    href: "#",
  },
  {
    id: "utilities",
    name: "Utilities API",
    description: "File conversion, image compression, QR codes, and URL safety checks.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    status: "Soon",
    href: "#",
  },
];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setChecking(false);
    });
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <main className="min-h-screen bg-[#000000] text-[#ededed] selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden">
      
      {/* ============================================================
          AMBIENT BACKGROUND (Grid)
          ============================================================ */}
      <div className="fixed inset-0 pointer-events-none flex justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse at top, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at top, black 40%, transparent 80%)",
          }}
        />
      </div>

      {/* ============================================================
          NAVBAR
          ============================================================ */}
      <nav className="relative z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-7 h-7">
              <img 
                src="/gyra-logo.png" 
                alt="Gyra Logo" 
                className="w-full h-full object-contain absolute inset-0 z-10" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center text-black font-bold text-xs -z-0">
                G
              </div>
            </div>
            <span className="font-semibold tracking-wide text-sm group-hover:text-white transition-colors">
              Gyra
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
            <Link href="/api" className="hover:text-white transition-colors">API</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link>
            <Link href="/status" className="hover:text-white transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Status
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {!checking && user ? (
              <Link
                href="/dashboard"
                className="bg-white text-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">
                  Sign in
                </Link>
                <Link
                  href="/login"
                  className="bg-white text-black px-4 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors"
                >
                  Start Building
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ============================================================
          HERO SECTION (Trenchers AI Style)
          ============================================================ */}
      <section className="relative z-10 pt-24 md:pt-32 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        
        {/* ELEGANT BACKGROUND GLOW */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/30 blur-[120px] rounded-[100%] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-indigo-500/20 blur-[80px] rounded-full" />
        </div>

        {/* CLEAN GLOWING LOGO CIRCLE */}
        <div className={`transition-all duration-1000 ease-out ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border border-white/10 bg-white/[0.02] backdrop-blur-md flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.2)] overflow-hidden">
            {/* Inner subtle glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-blue-500/10 to-transparent" />
            
            {/* Center Logo - Fixed sizing to fill the circle properly */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
               <GyraMark size={160} glow={false} animated={false} className="w-full h-full object-cover scale-110" />
            </div>
          </div>
        </div>

        <h1 className="mt-12 text-5xl md:text-7xl font-semibold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 mb-6 max-w-3xl leading-[1.05]">
          One intelligence layer.<br className="hidden md:block" /> Every modality.
        </h1>
        
        <p className="max-w-2xl text-base md:text-lg text-zinc-400 leading-relaxed mb-10">
          A multimodal AI platform for people, developers, and the applications they build. Conversation, vision, files, and voice — unified under one intelligence.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href={user ? "/dashboard" : "#"}
            onClick={(e) => { if (!user) { e.preventDefault(); handleLogin(); } }}
            className="w-full sm:w-auto bg-white text-black px-6 py-2.5 rounded-md font-medium text-sm hover:bg-zinc-200 transition-colors"
          >
            {user ? "Open Dashboard" : "Start Building Free"}
          </Link>
          <Link
            href="/api"
            className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-6 py-2.5 rounded-md font-medium text-sm hover:bg-white/10 transition-colors"
          >
            Explore APIs
          </Link>
        </div>

        {/* Credibility Line */}
        <div className="mt-16 pt-8 border-t border-white/5 w-full max-w-sm flex items-center justify-center gap-8 text-xs font-mono text-zinc-500">
          <div className="text-center">
            <span className="block text-white text-base mb-1">1M+</span>
            API Requests
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <span className="block text-white text-base mb-1">2,000+</span>
            Users
          </div>
        </div>
      </section>

      {/* ============================================================
          API SHOWCASE
          ============================================================ */}
      <section className="relative z-10 border-t border-white/5 bg-zinc-950/50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">One Platform. Multiple Possibilities.</h2>
            <p className="text-zinc-400">Unified APIs for builders, creators, and enterprises.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {APIS.map((api) => (
              <Link
                key={api.id}
                href={api.href}
                className={`group relative bg-black border border-white/10 rounded-xl p-6 transition-all duration-300 ${
                  api.status === "Live" ? "hover:border-white/30 cursor-pointer" : "opacity-60 cursor-default"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-white transition-colors">
                    {api.icon}
                  </div>
                  <span className={`text-[10px] font-mono tracking-wider uppercase px-2 py-1 rounded-sm border ${
                    api.status === "Live" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : "bg-zinc-900 text-zinc-500 border-zinc-800"
                  }`}>
                    {api.status}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{api.name}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">{api.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          DEVELOPER EXPERIENCE
          ============================================================ */}
      <section className="relative z-10 border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          {/* Left: Steps */}
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">From Idea to Integration.</h2>
            <div className="flex flex-col gap-6">
              {[
                { step: "01", title: "Create account", desc: "Sign in with your Google account in seconds." },
                { step: "02", title: "Generate API key", desc: "Pick a category (AI, Media) and generate a key." },
                { step: "03", title: "Test in Playground", desc: "Make live requests without writing a line of code." },
                { step: "04", title: "Integrate & Monitor", desc: "Build your app and track usage in the Console." },
              ].map((s) => (
                <div key={s.step} className="flex gap-4">
                  <span className="text-xs font-mono text-zinc-600 mt-1">{s.step}</span>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{s.title}</h4>
                    <p className="text-sm text-zinc-400 mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link href="/docs" className="text-sm font-medium text-white flex items-center gap-2 hover:text-blue-400 transition-colors">
                Read the Documentation
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>

          {/* Right: Code Snippet */}
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-2xl blur" />
            <div className="relative bg-[#09090b] border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center px-4 py-3 border-b border-white/5 bg-black/40">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                </div>
                <span className="ml-4 text-xs font-mono text-zinc-500">api/chat.ts</span>
              </div>
              <pre className="p-6 text-sm font-mono leading-relaxed text-zinc-300 overflow-x-auto">
                <code>
{`const res = await fetch(
  "https://gyra.ng/api/v1/chat",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer gyra_xxxxx"
    },
    body: JSON.stringify({
      messages: [
        { role: "user", content: "Hello" }
      ]
    })
  }
);`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          BENEFITS
          ============================================================ */}
      <section className="relative z-10 border-t border-white/5 bg-zinc-950/50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-12 text-center">Everything you need to build smarter.</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Unified platform", desc: "AI, media, and network tools through a single account and dashboard." },
              { title: "Developer first", desc: "OpenAI-compatible endpoints. Drop-in replacement for your existing code." },
              { title: "Built to scale", desc: "Server-side rate limiting, category-scoped keys, and real-time analytics." }
            ].map((b) => (
              <div key={b.title} className="text-center md:text-left">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 mx-auto md:mx-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{b.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
          ============================================================ */}
      <section className="relative z-10 border-t border-white/5 py-32 text-center overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 relative z-10">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tighter mb-6">Your next breakthrough starts here.</h2>
          <p className="text-zinc-400 mb-10 text-lg">
            Bring your ideas to life with the tools, APIs, and infrastructure to build what comes next.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleLogin}
              className="w-full sm:w-auto bg-white text-black px-6 py-3 rounded-md font-medium text-sm hover:bg-zinc-200 transition-colors"
            >
              Get Your API Key
            </button>
            <Link
              href="/docs"
              className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-6 py-3 rounded-md font-medium text-sm hover:bg-white/10 transition-colors"
            >
              Explore Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOOTER
          ============================================================ */}
      <footer className="relative z-10 border-t border-white/5 bg-black">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <GyraMark size={24} glow={false} animated={false} />
                <span className="font-semibold tracking-wide text-sm">Gyra</span>
              </Link>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-[200px] mb-6">
                Intelligence, Simplified.<br />
                Built by Genvia AI Company.
              </p>
              
              {/* SOCIAL ICONS */}
              <div className="flex items-center gap-4">
                <a href="https://x.com/GyraAi" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://tiktok.com/@gyraai" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                </a>
                <a href="https://t.me/GyraAi" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </a>
                <a href="https://youtube.com/@Gyra_Ai" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Product</p>
              <div className="flex flex-col gap-2 text-sm text-zinc-500">
                <Link href="/dashboard" className="hover:text-white transition-colors">AI Chat</Link>
                <Link href="/api" className="hover:text-white transition-colors">Developer API</Link>
                <Link href="/studio" className="hover:text-white transition-colors">Studio</Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Developers</p>
              <div className="flex flex-col gap-2 text-sm text-zinc-500">
                <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
                <Link href="/playground" className="hover:text-white transition-colors">Playground</Link>
                <Link href="/console" className="hover:text-white transition-colors">Console</Link>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-white uppercase tracking-wider mb-4">Company</p>
              <div className="flex flex-col gap-2 text-sm text-zinc-500">
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
                <Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
            <p>©️ 2026 Gyra · Genvia AI Company. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/status" className="hover:text-white transition-colors flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                All systems operational
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}