"use client";

import { useState } from "react";
import Link from "next/link";
import GyraMark from "../components/GyraMark";

/* ============================================================================
 * ECOSYSTEM & BRAND ARCHITECTURE — Genvia AI Company → Gyra → Unified Product
 * ============================================================================ */

export function Ecosystem() {
  const doors = [
    {
      num: "01",
      title: "Gyra Workspace",
      desc: "Your daily environment for conversation, deep web research, writing, and rapid problem solving.",
      href: "/dashboard",
      cta: "Enter Workspace",
    },
    {
      num: "02",
      title: "Creative Studio",
      desc: "Dedicated visual, cinema video, and neural voice synthesis with fine-grained prompt control.",
      href: "/studio",
      cta: "Open Studio",
    },
    {
      num: "03",
      title: "Agent Projects",
      desc: "Multi-file software workspaces with autonomous planning, code execution, and automations.",
      href: "/projects",
      cta: "Explore Projects",
    },
    {
      num: "04",
      title: "Developer API",
      desc: "OpenAI-compatible intelligence endpoints, real-time streaming, playground, and per-key telemetry.",
      href: "/api",
      cta: "View API Platform",
    },
  ];

  return (
    <section id="ecosystem" className="gy-section">
      <div className="gy-container">
        <div className="gy-section-header-centered">
          <p className="gy-cap-kicker">
            <span className="gy-cap-kicker-num">ECOSYSTEM</span>
            <span>GENVIA AI COMPANY → GYRA</span>
          </p>
          <h2 className="gy-h2">One unified product. Four specialized doors.</h2>
          <p className="gy-body-lead gy-mx-auto">
            Built by Genvia AI Company, Gyra connects conversational reasoning,
            verified research, multimodal creation, and software engineering
            under a single account and credit wallet.
          </p>
        </div>

        <div className="gy-doors-grid">
          {doors.map((d) => (
            <Link key={d.num} href={d.href} className="gy-door-card">
              <span className="gy-door-idx">{d.num}</span>
              <h3 className="gy-door-title">{d.title}</h3>
              <p className="gy-door-desc">{d.desc}</p>
              <span className="gy-door-cta">{d.cta} →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * DEVELOPERS — OpenAI-Compatible API Showcase
 * ============================================================================ */

const API_SNIPPETS: Record<string, { label: string; code: string }> = {
  curl: {
    label: "cURL",
    code: `curl https://gyra-tester.duckdns.org/api/v1/chat \\
  -H "Authorization: Bearer $GYRA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gyra-1.0",
    "messages": [
      { "role": "system", "content": "You are a precise research analyst." },
      { "role": "user", "content": "Summarize key risks in solid-state battery scaling." }
    ],
    "stream": true
  }'`,
  },
  ts: {
    label: "TypeScript",
    code: `import OpenAI from "openai";

const gyra = new OpenAI({
  apiKey: process.env.GYRA_API_KEY,
  baseURL: "https://gyra-tester.duckdns.org/api/v1",
});

const response = await gyra.chat.completions.create({
  model: "gyra-1.0",
  messages: [
    { role: "user", content: "Design a resilient webhook retry queue in TypeScript." }
  ],
});

console.log(response.choices[0].message.content);`,
  },
  py: {
    label: "Python",
    code: `from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ["GYRA_API_KEY"],
    base_url="https://gyra-tester.duckdns.org/api/v1",
)

stream = client.chat.completions.create(
    model="gyra-1.0",
    messages=[{"role": "user", "content": "Extract structured entities from this clinical report."}],
    stream=True,
)
for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")`,
  },
};

export function Developers() {
  const [lang, setLang] = useState<"curl" | "ts" | "py">("ts");
  const [copied, setCopied] = useState(false);

  const copySnippet = () => {
    navigator.clipboard?.writeText(API_SNIPPETS[lang].code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section id="developers" className="gy-section">
      <div className="gy-container">
        <div className="gy-dev-layout">
          <div className="gy-dev-copy">
            <p className="gy-cap-kicker">
              <span className="gy-cap-kicker-num">DEVELOPERS</span>
              <span>GYRA API PLATFORM</span>
            </p>
            <h2 className="gy-h2">Drop-in compatible. Built to ship.</h2>
            <p className="gy-body-lead">
              Integrate Gyra into your own products in minutes. Point any
              OpenAI-compatible SDK at Gyra&apos;s `/api/v1` endpoints and monitor
              latency, token throughput, and per-key budgets from the Developer
              Console.
            </p>

            <div className="gy-dev-features">
              <div className="gy-dev-feat">
                <strong>OpenAI SDK Compatibility</strong>
                <span>Zero-friction migration for chat, transcription, media, and voice routes.</span>
              </div>
              <div className="gy-dev-feat">
                <strong>Real-Time Console Telemetry</strong>
                <span>Inspect request logs, endpoint latency distributions, and credit usage.</span>
              </div>
            </div>

            <div className="gy-dev-links">
              <Link href="/api" className="gy-btn-primary">
                Explore API Platform
              </Link>
              <Link href="/docs" className="gy-btn-secondary">
                Read Documentation
              </Link>
              <Link href="/playground" className="gy-btn-ghost">
                Open Playground →
              </Link>
            </div>
          </div>

          <div className="gy-dev-code-card">
            <div className="gy-dev-code-head">
              <div className="gy-dev-tabs" role="tablist" aria-label="SDK language">
                {(Object.keys(API_SNIPPETS) as ("curl" | "ts" | "py")[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={lang === k}
                    className={lang === k ? "on" : ""}
                    onClick={() => setLang(k)}
                  >
                    {API_SNIPPETS[k].label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="gy-dev-copy-btn"
                onClick={copySnippet}
              >
                {copied ? "Copied" : "Copy snippet"}
              </button>
            </div>

            <pre className="gy-dev-pre">
              <code>{API_SNIPPETS[lang].code}</code>
            </pre>

            <div className="gy-dev-foot">
              <span>Endpoint: /api/v1/chat · /api/v1/media · /api/v1/voice</span>
              <Link href="/api-keys">Create API Key →</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * PRICING — Real Plans & Credit Packs (Preserved from paymentConfig)
 * ============================================================================ */

export function Pricing() {
  const creditPacks = [
    { usd: "$5", ngn: "₦8,000", credits: "5 Credits" },
    { usd: "$10", ngn: "₦16,000", credits: "10 Credits", popular: true },
    { usd: "$25", ngn: "₦40,000", credits: "25 Credits" },
    { usd: "$50", ngn: "₦80,000", credits: "50 Credits" },
    { usd: "$100", ngn: "₦160,000", credits: "100 Credits" },
  ];

  return (
    <section id="pricing" className="gy-section">
      <div className="gy-container">
        <div className="gy-section-header-centered">
          <p className="gy-cap-kicker">
            <span className="gy-cap-kicker-num">PRICING</span>
            <span>PLANS & GENERATION CREDITS</span>
          </p>
          <h2 className="gy-h2">Transparent plans, real creative power.</h2>
          <p className="gy-body-lead gy-mx-auto">
            Start free in the workspace. Upgrade to SuperGyra via local Naira
            (MoMo or bank transfer) or crypto to unlock full creative studio
            engines and included generation credits.
          </p>
        </div>

        <div className="gy-pricing-grid">
          {/* Free Starter Tier */}
          <div className="gy-price-card">
            <div className="gy-price-top">
              <h3>Starter</h3>
              <p className="gy-price-tag">
                Free<span>forever</span>
              </p>
              <p className="gy-price-desc">
                Immediate access to Gyra conversation, web research, and prompt workflows.
              </p>
            </div>
            <ul className="gy-price-list">
              <li>Conversational intelligence &amp; writing</li>
              <li>Live web research with verified citations</li>
              <li>Standard workspace &amp; prompt library</li>
              <li>API playground preview</li>
            </ul>
            <Link href="/dashboard" className="gy-btn-secondary gy-btn-full">
              Start Free in Workspace
            </Link>
          </div>

          {/* Monthly Plan */}
          <div className="gy-price-card">
            <div className="gy-price-top">
              <h3>SuperGyra Monthly</h3>
              <p className="gy-price-tag">
                ₦10,000<span>/month</span>
              </p>
              <p className="gy-price-desc">
                Full creative studio, autonomous build agents, and monthly generation credits.
              </p>
            </div>
            <ul className="gy-price-list">
              <li>Full Chat, Deep Research &amp; 6-Agent Build Workspace</li>
              <li><strong>5 generation credits</strong> included every month</li>
              <li>SuperGyra Image, Video &amp; Neural Voice Studio</li>
              <li>Cancel or switch plans anytime</li>
            </ul>
            <Link href="/upgrade" className="gy-btn-primary gy-btn-full">
              Choose Monthly
            </Link>
          </div>

          {/* Yearly Plan */}
          <div className="gy-price-card gy-price-card-featured">
            <div className="gy-price-top">
              <div className="gy-price-title-row">
                <h3>SuperGyra Yearly</h3>
                <span className="gy-save-tag">Save 17%</span>
              </div>
              <p className="gy-price-tag">
                ₦118,800<span>/year</span>
              </p>
              <p className="gy-price-desc">
                Maximum capacity for creators, researchers, and engineering teams.
              </p>
            </div>
            <ul className="gy-price-list">
              <li>Everything in SuperGyra Monthly</li>
              <li><strong>60 generation credits</strong> included upfront</li>
              <li>Priority studio queue &amp; multi-file agent builds</li>
              <li>Locked-in annual rate for 12 months</li>
            </ul>
            <Link href="/upgrade" className="gy-btn-primary gy-btn-full">
              Choose Yearly
            </Link>
          </div>
        </div>

        {/* Credit Top-Up Packs */}
        <div className="gy-credits-panel">
          <div className="gy-credits-head">
            <h3>On-Demand Credit Top-Up Packs</h3>
            <p>
              Credits power heavy synthesis engines: $2.00 per cinema video · $2.00 per neural voice generation · image studio included with SuperGyra.
            </p>
          </div>
          <div className="gy-credits-strip">
            {creditPacks.map((pack) => (
              <Link
                key={pack.usd}
                href="/credits"
                className={`gy-credit-pill ${pack.popular ? "gy-credit-popular" : ""}`}
              >
                <span className="gy-credit-usd">{pack.usd}</span>
                <span className="gy-credit-ngn">{pack.ngn}</span>
                <span className="gy-credit-amt">{pack.credits}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * FAQ — Clear, Direct Answers
 * ============================================================================ */

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const questions = [
    {
      q: "Is Gyra only an AI coding tool?",
      a: "No. Coding is just one of Gyra's capabilities. Gyra is a complete AI intelligence platform built by Genvia AI Company—covering natural conversation, source-verified web research, professional writing, high-resolution image creation, cinema video generation, neural voice synthesis, and autonomous software engineering.",
    },
    {
      q: "Who builds and operates Gyra?",
      a: "Gyra is designed and engineered by Genvia AI Company as a unified intelligence product with its own cohesive workspace, creative studio, and developer API platform.",
    },
    {
      q: "How does Gyra Research verify its answers?",
      a: "When you run a research query, Gyra retrieves live web sources, extracts relevant passages, and synthesizes a structured answer with numbered inline citations ([1], [2]) linked directly to the original source URLs.",
    },
    {
      q: "How do plans and generation credits work?",
      a: "You can start using Gyra for free in the workspace. Upgrading to SuperGyra (₦10,000/month or ₦118,800/year) unlocks the full Creative Studio and includes generation credits for cinema video and neural voice synthesis, with instant top-up packs available from $5 (₦8,000).",
    },
    {
      q: "Can my engineering team integrate Gyra via API?",
      a: "Yes. Gyra provides an OpenAI-compatible API (/api/v1/chat, /api/v1/media, /api/v1/voice) with API key management, an interactive Playground, and real-time analytics in the Developer Console.",
    },
  ];

  return (
    <section id="faq" className="gy-section">
      <div className="gy-container gy-container-narrow">
        <div className="gy-section-header-centered">
          <p className="gy-cap-kicker">
            <span className="gy-cap-kicker-num">FAQ</span>
            <span>COMMON QUESTIONS</span>
          </p>
          <h2 className="gy-h2">Clarity before you begin.</h2>
        </div>

        <div className="gy-faq-list">
          {questions.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={item.q}
                className={`gy-faq-card ${isOpen ? "open" : ""}`}
              >
                <button
                  type="button"
                  className="gy-faq-trigger"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <span>{item.q}</span>
                  <span className="gy-faq-symbol" aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && <p className="gy-faq-answer">{item.a}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * FINAL CTA & FOOTER
 * ============================================================================ */

export function FinalCta() {
  return (
    <section id="start" className="gy-section">
      <div className="gy-container">
        <div className="gy-final-banner">
          <span className="gy-mark-hero" aria-hidden="true">
            <GyraMark size={48} glow animated />
          </span>
          <p className="gy-eyebrow">GYRA INTELLIGENCE · GENVIA AI COMPANY</p>
          <h2 className="gy-h2">Start with a single question.</h2>
          <p className="gy-body-lead gy-mx-auto">
            Ask, research, create imagery and cinema video, synthesize voice, or
            build full-stack software inside one calm, intelligent workspace.
          </p>
          <div className="gy-final-buttons">
            <Link href="/dashboard" className="gy-btn-primary gy-btn-lg">
              Open Gyra Workspace
            </Link>
            <a
              href="#top"
              className="gy-btn-secondary gy-btn-lg"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Ask in the Composer ↑
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="gy-footer">
      <div className="gy-container">
        <div className="gy-footer-grid">
          <div className="gy-footer-brand">
            <Link href="/" className="gy-nav-brand">
              <GyraMark size={24} glow={false} animated={false} />
              <span className="gy-nav-word">GYRA</span>
            </Link>
            <p className="gy-footer-tagline">
              Intelligence, engineered to ship.
              <br />A flagship AI product built by <strong>Genvia AI Company</strong>.
            </p>
          </div>

          <div className="gy-footer-col">
            <p className="gy-footer-heading">Capabilities</p>
            <a href="#chat">01 · Chat</a>
            <a href="#research">02 · Research</a>
            <a href="#image">03 · Image Studio</a>
            <a href="#video">04 · Cinema Video</a>
            <a href="#voice">05 · Neural Voice</a>
            <a href="#build">06 · Agent Build</a>
          </div>

          <div className="gy-footer-col">
            <p className="gy-footer-heading">Platform &amp; API</p>
            <Link href="/dashboard">Gyra Workspace</Link>
            <Link href="/studio">Creative Studio</Link>
            <Link href="/projects">Agent Projects</Link>
            <Link href="/api">Developer API</Link>
            <Link href="/docs">Documentation</Link>
            <Link href="/playground">API Playground</Link>
            <Link href="/console">Developer Console</Link>
          </div>

          <div className="gy-footer-col">
            <p className="gy-footer-heading">Genvia AI Company</p>
            <Link href="/about">About</Link>
            <Link href="/upgrade">SuperGyra Plans</Link>
            <Link href="/credits">Generation Credits</Link>
            <Link href="/changelog">Changelog</Link>
            <Link href="/status">System Status</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>

        <div className="gy-footer-bottom">
          <span>© 2026 Gyra · Built by Genvia AI Company. All rights reserved.</span>
          <div className="gy-footer-social">
            <a
              href="https://t.me/GenviaNews"
              target="_blank"
              rel="noopener noreferrer"
            >
              @GenviaNews
            </a>
            <span aria-hidden="true">·</span>
            <Link href="/status">All systems operational</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
