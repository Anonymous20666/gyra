import Link from "next/link";
import Logo from "../Logo";
import { Sparkles, ArrowRight, Code2, Cpu, ShieldCheck, Folder, FileText, Image as ImageIcon, Bot } from "lucide-react";

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
        version: "Gyra 2.0",
        date: "November 14, 2026",
        highlight: "The SuperGyra & Mobile Era",
        isLatest: true,
        groups: [
          {
            title: "SuperGyra 2.0 Model",
            bullets: [
              {
                text: "Introduced the exclusive SuperGyra 2.0 model for premium subscribers.",
                bold: ["SuperGyra 2.0"],
              },
              {
                text: "Routed SuperGyra 2.0 to DeepSeek Reasoner for elite logic, deep reasoning, and unlimited streaming.",
                bold: ["DeepSeek Reasoner"],
              },
              {
                text: "Unlocked advanced Image-to-Image editing (Grok-style) using Flux Pro Ultra, allowing users to edit specific elements in screenshots and UI designs.",
                bold: ["Image-to-Image editing", "Flux Pro Ultra"],
              },
            ],
          },
          {
            title: "Projects & RAG System",
            bullets: [
              {
                text: "Launched the Projects Workspace — a full RAG (Retrieval-Augmented Generation) environment.",
                bold: ["Projects Workspace"],
              },
              {
                text: "Added Project Files: Upload PDFs, text, and code to ground the AI's answers in your own data.",
              },
              {
                text: "Added the 'Cinematic 6-Agent File Reader' — a custom loading animation and summary generator when files are attached to a project.",
              },
              {
                text: "Added Project Sharing: Generate public read-only links with Resend email invites and Viewer/Editor permissions.",
              },
            ],
          },
          {
            title: "Developer Platform & API",
            bullets: [
              {
                text: "The Gyra Developer API now accepts `gyra-super2.0` for external integrations.",
                codeRefs: ["gyra-super2.0"],
              },
              {
                text: "Unlimited streaming and context windows for premium API keys.",
              },
              {
                text: "Launched the Gyra Telegram Bot with real-time SSE streaming and full 6-agent support.",
                bold: ["Gyra Telegram Bot"],
              },
            ],
          },
          {
            title: "Mobile App Prep",
            bullets: [
              {
                text: "Built the complete Google Play Store submission pipeline and compliance forms.",
                bold: ["Google Play Store"],
              },
              {
                text: "Added the GDPR-compliant Delete Account portal with Resend email verification and full database wipe.",
              },
            ],
          },
        ],
      },
      {
        version: "Gyra 1.5",
        date: "November 10, 2026",
        highlight: "The Journal & UI Update",
        groups: [
          {
            title: "Gyra Journal",
            bullets: [
              {
                text: "Launched Gyra Journal — a completely reimagined, premium journaling app.",
                bold: ["Gyra Journal"],
              },
              {
                text: "Added rich-text editing (Tiptap), markdown support, and dark-mode typography.",
              },
              {
                text: "Integrated full media support: upload images, record audio with waveforms, and tag exact locations (OpenStreetMap).",
              },
            ],
          },
          {
            title: "Dashboard Upgrades",
            bullets: [
              {
                text: "Upgraded the dashboard UI to use Lucide SVG icons instead of emojis for a more professional look.",
              },
              {
                text: "Fixed mobile responsiveness so markdown tables and long code blocks no longer break the screen layout.",
              },
              {
                text: "Added the 'Slow Stream' typewriter effect for a more natural, readable AI response.",
              },
            ],
          },
        ],
      },
      {
        version: "Gyra 1.3",
        date: "October 28, 2026",
        highlight: "The Omni-Intelligence Update",
        groups: [
          {
            title: "The 6-Agent Orchestrator",
            bullets: [
              {
                text: "Introduced the Gyra Agent Orchestrator — a multi-agent pipeline that breaks down complex coding tasks into distinct steps.",
                bold: ["Gyra Agent Orchestrator"],
              },
              {
                text: "Added Orion (Intent Analysis), Atlas (Web Scraping), Architect (Design), Forge (Coding), Sentinel (Security), and Mentor (Education).",
                bold: ["Orion", "Atlas", "Architect", "Forge", "Sentinel", "Mentor"],
              },
            ],
          },
          {
            title: "Internal Search & Real-Time UI",
            bullets: [
              {
                text: "Built the Gyra Internal Search Engine using DuckDuckGo and Cheerio for autonomous web research.",
                bold: ["Gyra Internal Search Engine"],
              },
              {
                text: "Redesigned the Thinking UI to show live timers, animated mini-orbs, and real-time page counts.",
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
                bold: ["Gyra Developer API platform"],
              },
              {
                text: "Added per-category API key prefixes: gyra_ for AI, gyramedia_ for Media.",
                codeRefs: ["gyra_", "gyramedia_"],
              },
              {
                text: "Added the Developer Console at /console with wallet balances, key management, and request history.",
                links: [{ text: "/console", href: "/console" }],
              },
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
              },
              { text: "Added Vision — image, screenshot, and diagram understanding.", bold: ["Vision"] },
              { text: "Added Think mode for step-by-step reasoning." },
              { text: "Added Search mode with real-time web results." },
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
    <code className="bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono border border-blue-500/20">
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
    if (idx >= 0) claim(idx, idx + phrase.length, <strong key={`b-${i}`} className="font-semibold text-white bg-white/5 px-1 rounded">{phrase}</strong>);
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
        <a key={`l-${i}`} href={link.href} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline decoration-blue-500/30 underline-offset-4 transition-all">{link.text}</a>
      ) : (
        <Link key={`l-${i}`} href={link.href} className="text-blue-400 hover:text-blue-300 hover:underline decoration-blue-500/30 underline-offset-4 transition-all">{link.text}</Link>
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
    <li className="flex gap-3 leading-relaxed group">
      <span className="text-blue-500/50 group-hover:text-blue-400 transition-colors select-none shrink-0 mt-1.5 text-[8px]">◆</span>
      <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors">{nodes.length > 0 ? nodes : text}</span>
    </li>
  );
}

// ============================================================
// Page
// ============================================================
export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30">
      
      {/* 🚨 AMBIENT BACKGROUND GLOW 🚨 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-600/10 blur-[120px] rounded-[100%]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* 🚨 TOP NAVIGATION 🚨 */}
      <nav className="relative z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full group-hover:bg-blue-500/40 transition-all" />
              <Logo size={24} animated={false} />
            </div>
            <span className="font-bold tracking-widest text-sm">GYRA</span>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider ml-2">CHANGELOG</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/api" className="hover:text-white transition-colors">API</Link>
            <Link href="/status" className="hover:text-white transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Status
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        
        {/* 🚨 HEADER 🚨 */}
        <div className="text-center mb-24">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
            What's new in Gyra
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Every update, feature, and architectural shift we ship. Newest first.
          </p>
        </div>

        {/* 🚨 TIMELINE 🚨 */}
        <div className="relative">
          {/* The vertical glowing line */}
          <div className="absolute left-[19px] top-4 bottom-0 w-[2px] bg-gradient-to-b from-blue-500 via-blue-500/20 to-transparent" />

          {CHANGELOG.map((yearBlock) => (
            <section key={yearBlock.year} className="mb-20">
              
              <div className="relative pl-12 mb-12">
                <div className="absolute left-[11px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                <h2 className="text-2xl font-bold tracking-widest text-zinc-500">{yearBlock.year}</h2>
              </div>

              <div className="flex flex-col gap-12">
                {yearBlock.entries.map((entry) => (
                  <article key={entry.date} className="relative pl-12 group">
                    
                    {/* Timeline Dot */}
                    <div className={`absolute left-[12px] top-6 w-3 h-3 rounded-full border-2 ${entry.isLatest ? 'bg-blue-500 border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-pulse' : 'bg-zinc-800 border-zinc-600 group-hover:border-blue-500 transition-colors'}`} />

                    {/* Glassmorphic Card */}
                    <div className="bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all duration-300">
                      
                      {/* Card Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-white/5">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-white">{entry.version}</h3>
                            {entry.isLatest && (
                              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                                Latest
                              </span>
                            )}
                          </div>
                          {entry.highlight && (
                            <p className="text-blue-400/80 text-sm font-medium flex items-center gap-2">
                              <Sparkles className="w-4 h-4" /> {entry.highlight}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 md:mt-0 text-sm font-mono text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                          {entry.date}
                        </div>
                      </div>

                      {/* Card Body (Groups) */}
                      <div className="flex flex-col gap-8">
                        {entry.groups.map((group) => (
                          <div key={group.title}>
                            <h4 className="text-sm font-semibold text-white mb-4 tracking-wide flex items-center gap-2">
                              <Cpu className="w-4 h-4 text-blue-500" /> {group.title}
                            </h4>
                            <ul className="flex flex-col gap-3">
                              {group.bullets.map((b, i) => (
                                <BulletLine key={i} bullet={b} />
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* 🚨 FOOTER CALLOUT 🚨 */}
        <div className="mt-24 p-8 rounded-3xl bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/20 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
          <h3 className="text-xl font-bold text-white mb-2 relative z-10">Stay in the loop</h3>
          <p className="text-zinc-400 mb-6 relative z-10">Subscribe to our Telegram for immediate release announcements and early access.</p>
          <a 
            href="https://t.me/GyraAiNews" 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] relative z-10"
          >
            Join @GyraAiNews <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Bottom Footer */}
        <div className="mt-16 text-center text-xs text-zinc-600">
          <p>© 2026 Gyra · Genvia AI Company. All rights reserved.</p>
        </div>

      </div>
    </main>
  );
}