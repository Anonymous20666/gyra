import Link from "next/link";
import Logo from "../Logo";

// ============================================================
// TYPES
// ============================================================
type Bullet = {
  text: string;
  bold?: string[]; 
  codeRefs?: string[]; 
  links?: { text: string; href: string }[];
};

type Group = {
  title: string;
  bullets: Bullet[];
};

type Entry = {
  version: string;
  date: string;
  highlight?: string;
  isLatest?: boolean;
  groups: Group[];
};

type YearBlock = {
  year: string;
  entries: Entry[];
};

// ============================================================
// DATA
// ============================================================
const CHANGELOG: YearBlock[] = [
  {
    year: "2026",
    entries: [
      {
        version: "Gyra 1.3",
        date: "October 28, 2026",
        highlight: "The Omni-Intelligence Update",
        isLatest: true,
        groups: [
          {
            title: "The 6-Agent Orchestrator",
            bullets: [
              {
                text: "Introduced the Gyra Agent Orchestrator — a multi-agent pipeline that breaks down complex coding tasks into distinct steps.",
                bold: ["Gyra Agent Orchestrator"],
              },
              {
                text: "Added Orion (Intent Analysis), Architect (Design), Forge (Coding), Sentinel (Security), and Mentor (Education).",
                bold: ["Orion", "Architect", "Forge", "Sentinel", "Mentor"],
              },
              {
                text: "The AI now intelligently routes simple questions to fast responses, and complex builds to the 6-agent pipeline.",
              },
            ],
          },
          {
            title: "Internal Search & Real-Time UI",
            bullets: [
              {
                text: "Built the Gyra Internal Search Engine",
                bold: ["Gyra Internal Search Engine"],
              },
              {
                text: "Added real-time web scraping. Atlas can now read up to 3 live web pages to answer questions accurately.",
                bold: ["Atlas"],
              },
              {
                text: "Redesigned the Thinking UI to show live timers, animated mini-orbs, and real-time page counts",
              },
            ],
          },
          {
            title: "Auth & Design",
            bullets: [
              {
                text: "Redesigned the /login page with a premium, minimalist UI matching industry leaders like Grok and X.",
                links: [{ text: "/login", href: "/login" }],
              },
              {
                text: "Added Google, GitHub (X), and Passwordless Email OTP authentication flows.",
              },
              {
                text: "Upgraded the main dashboard empty state with the new dark-mode Gyra wordmark.",
              },
            ],
          },
        ],
      },
      {
        version: "Gyra 1.2",
        date: "October 14, 2026",
        highlight: "The developer platform release",
        groups: [
          {
            title: "New Features",
            bullets: [
              {
                text: "Added the Gyra Developer API platform — four API categories under one brand.",
                bold: ["Gyra Developer API platform", "four API categories"],
              },
              {
                text: "Added the Gyra Media API with five endpoints: YouTube transcripts, YouTube metadata, TikTok metadata, Spotify music search, and audio transcription.",
                bold: ["Gyra Media API", "five endpoints"],
              },
              {
                text: "Added per-category API key prefixes: gyra_ for AI, gyramedia_ for Media, gyranet_ for Network, gyrautils_ for Utilities.",
                codeRefs: ["gyra_", "gyramedia_", "gyranet_", "gyrautils_"],
              },
              {
                text: "Added separate credit wallets per API category — AI, Media, Network, and Utilities.",
                bold: ["separate credit wallets"],
              },
              {
                text: "Added the Developer Console at /console with wallet balances, key management, and request history.",
                links: [{ text: "/console", href: "/console" }],
              },
              {
                text: "Added the Live Playground at /playground for testing any Gyra endpoint in real time.",
                links: [{ text: "/playground", href: "/playground" }],
              },
              {
                text: "Added Media API documentation at /docs/media.",
                links: [{ text: "/docs/media", href: "/docs/media" }],
              },
            ],
          },
          {
            title: "Developer Platform",
            bullets: [
              {
                text: "Category-scoped API keys with independent rate limits and usage tracking.",
              },
              {
                text: "Media API pricing at $0.90 per request, with 10 free requests per month.",
                bold: ["$0.90 per request"],
              },
              {
                text: "Request logging with per-endpoint breakdown and status codes.",
              },
              {
                text: "Server-side rate limiting — 30 requests per minute per IP, 20 per key.",
              },
            ],
          },
          {
            title: "Design",
            bullets: [
              {
                text: "Redesigned the API landing page with a video hero and multi-category layout.",
              },
              {
                text: "Added the Gyra constellation diagram — one intelligence layer, every modality.",
              },
            ],
          },
        ],
      },
      {
        version: "Gyra 1.1",
        date: "September 18, 2026",
        highlight: "Voice and themes",
        groups: [
          {
            title: "New Features",
            bullets: [
              { text: "Added voice output for all replies." },
              { text: "Added theme switching in the settings panel." },
              { text: "Added hands-free voice mode with live audio visualizer." },
              {
                text: "Added four voice personalities — Ara, James, Nova, and Sage.",
                bold: ["Ara, James, Nova, and Sage"],
              },
              {
                text: "Added a Prompt Library with curated prompts across categories.",
                links: [{ text: "Prompt Library", href: "/library" }],
              },
              {
                text: "Added shareable chat links with public read-only URLs.",
              },
            ],
          },
          {
            title: "Fixed",
            bullets: [
              { text: "Fixed streaming lag on slow connections." },
              { text: "Fixed chat session persistence issues on web and mobile." },
            ],
          },
        ],
      },
      {
        version: "Gyra 1.0",
        date: "September 1, 2026",
        highlight: "The first release",
        groups: [
          {
            title: "First public release",
            bullets: [
              {
                text: "Launched the Gyra platform — an intelligent, simplified AI assistant.",
                bold: ["intelligent, simplified AI assistant"],
                codeRefs: ["gyra"],
              },
              {
                text: "Introduced the public Developer API with free keys.",
                codeRefs: ["gyra_"],
              },
              { text: "Added Vision — image, screenshot, and diagram understanding.", bold: ["Vision"] },
              { text: "Added Think mode for step-by-step reasoning." },
              { text: "Added Search mode with real-time web results." },
            ],
          },
          {
            title: "Community",
            bullets: [
              {
                text: "Launched the Telegram bot at @GyraAI.",
                links: [
                  { text: "@GyraAI", href: "https://t.me/GyraAI" },
                ],
              },
              {
                text: "Opened the community channel at @GyraAiNews.",
                links: [
                  { text: "@GyraAiNews", href: "https://t.me/GyraAiNews" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// ============================================================
// Inline code chip
// ============================================================
function Code({ children }: { children: string }) {
  return (
    <code className="bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded text-[0.85em] font-mono">
      {children}
    </code>
  );
}

// ============================================================
// Bullet renderer
// ============================================================
function BulletLine({ bullet }: { bullet: Bullet }) {
  type Segment = { start: number; end: number; node: React.ReactNode; };
  const text = bullet.text;
  const segments: Segment[] = [];
  const used = new Set<number>();

  const claim = (start: number, end: number, node: React.ReactNode) => {
    for (let i = start; i < end; i++) { if (used.has(i)) return false; }
    for (let i = start; i < end; i++) used.add(i);
    segments.push({ start, end, node });
    return true;
  };

  (bullet.bold || []).forEach((phrase, i) => {
    const idx = text.indexOf(phrase);
    if (idx >= 0) claim(idx, idx + phrase.length, <strong key={`b-${i}`} className="font-semibold text-white">{phrase}</strong>);
  });

  (bullet.codeRefs || []).forEach((phrase, i) => {
    const idx = text.indexOf(phrase);
    if (idx >= 0) claim(idx, idx + phrase.length, <Code key={`c-${i}`}>{phrase}</Code>);
  });

  (bullet.links || []).forEach((link, i) => {
    const idx = text.indexOf(link.text);
    if (idx >= 0) {
      const isExternal = link.href.startsWith("http");
      claim(idx, idx + link.text.length, isExternal ? (
        <a key={`l-${i}`} href={link.href} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">{link.text}</a>
      ) : (
        <Link key={`l-${i}`} href={link.href} className="text-blue-400 hover:text-blue-300 hover:underline">{link.text}</Link>
      ));
    }
  });

  segments.sort((a, b) => a.start - b.start);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (s.start > cursor) nodes.push(text.substring(cursor, s.start));
    nodes.push(s.node);
    cursor = s.end;
  }
  if (cursor < text.length) nodes.push(text.substring(cursor));

  return (
    <li className="flex gap-3.5 leading-[1.7]">
      <span className="text-zinc-700 select-none shrink-0 mt-[9px] text-[6px]">●</span>
      <span className="text-zinc-400">{nodes.length > 0 ? nodes : text}</span>
    </li>
  );
}

// ============================================================
// Page
// ============================================================
export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-500/5 rounded-full blur-[180px]" />
      </div>

      {/* Top nav */}
      <div className="relative z-30 border-b border-zinc-800/50 px-6 py-4 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={28} animated={false} />
          <span className="font-bold tracking-widest text-sm">GYRA</span>
          <span className="text-zinc-600 text-xs tracking-widest">CHANGELOG</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <Link href="/api" className="hover:text-white transition-colors">API</Link>
          <Link href="/status" className="hover:text-white transition-colors">Status</Link>
          <Link href="/" className="hover:text-white transition-colors">← Back</Link>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-12 py-16">
        {/* Header */}
        <div className="mb-14">
          <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-4">Changelog</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">What&apos;s new in Gyra</h1>
          <p className="text-zinc-400 leading-relaxed mb-3">
            The Gyra platform is an intelligent, simplified AI assistant built for people, developers, and the applications they build.
          </p>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Every change we ship lives here. Newest first. For developer docs, see the <Link href="/docs" className="text-blue-400 hover:underline">documentation</Link>.
          </p>
        </div>

        {/* Subscribe callout */}
        <div className="mb-16 border-l-2 border-blue-500 bg-blue-500/5 pl-5 py-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Subscribe to{" "}
            <a href="https://t.me/GyraAiNews" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">@GyraAiNews</a>{" "}
            for release announcements, and join the community at{" "}
            <a href="https://t.me/GyraAI" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">@GyraAI</a>.
          </p>
        </div>

        {/* Years */}
        {CHANGELOG.map((yearBlock) => (
          <section key={yearBlock.year} className="mb-20">
            <h2 className="text-3xl font-bold tracking-tight mb-12">{yearBlock.year}</h2>

            <div className="flex flex-col gap-20">
              {yearBlock.entries.map((entry) => (
                <article key={entry.date}>
                  {/* Version + date — editorial style */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      {entry.isLatest && (
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                      )}
                      <p className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                        {entry.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-semibold text-zinc-300">{entry.version}</span>
                      {entry.highlight && (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span className="text-zinc-500 italic">{entry.highlight}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Groups */}
                  <div className="flex flex-col gap-10">
                    {entry.groups.map((group) => (
                      <div key={group.title}>
                        <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">{group.title}</h4>
                        <ul className="flex flex-col gap-3">
                          {group.bullets.map((b, i) => (
                            <BulletLine key={i} bullet={b} />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}

        {/* Footer */}
        <div className="mt-24 pt-8 border-t border-zinc-800/60 text-xs text-zinc-600 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <p>© 2026 Gyra · Genvia AI Company</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/api" className="hover:text-white transition-colors">API</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </main>
  );
}