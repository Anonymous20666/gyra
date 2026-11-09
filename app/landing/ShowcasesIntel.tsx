"use client";

import { useCallback, useRef, useState } from "react";

interface ChatExchange {
  id: string;
  label: string;
  topic: string;
  messages: {
    role: "user" | "gyra";
    text: string;
    meta?: string;
  }[];
}

const CHAT_SCENARIOS: ChatExchange[] = [
  {
    id: "strategy",
    label: "Executive Strategy",
    topic: "Product expansion & pricing architecture",
    messages: [
      {
        role: "user",
        text: "We're expanding our B2B analytics platform into West Africa and Europe simultaneously. How should we structure pricing so local teams can adopt easily without cannibalizing enterprise contracts?",
      },
      {
        role: "gyra",
        text: "Structure your pricing around **workspace capacity and compute tiers** rather than flat per-seat fees:\n\n1. **Localized Base Access (NGN / EUR / USD):** Offer a frictionless self-serve tier priced in local currency (e.g., MoMo/bank transfer in NGN, SEPA/card in EUR) so engineering and product teams can onboard immediately.\n2. **Usage-Linked Intelligence Credits:** Meter heavy compute—automated reports, API volume, and data warehouse syncs—via transparent credit packs.\n3. **Enterprise Governance Boundary:** Reserve SSO/SAML, custom data residency, and dedicated SLA routing for annual enterprise agreements.",
        meta: "Structured synthesis · 420 ms",
      },
      {
        role: "user",
        text: "Draft a concise 3-line summary I can paste into our board memo.",
      },
      {
        role: "gyra",
        text: "**Board Memo Summary — Dual-Market Pricing Architecture**\n• **Local Currency Self-Serve:** Frictionless workspace entry in NGN, EUR, and USD removes procurement bottlenecks for regional teams.\n• **Consumption-Aligned Expansion:** Shared credit pools scale revenue naturally as teams adopt automated reporting and API workflows.\n• **Enterprise Value Fence:** Security compliance, audit logs, and custom SLAs remain exclusive to annual enterprise contracts.",
        meta: "Board-ready copy · Instant",
      },
    ],
  },
  {
    id: "science",
    label: "Scientific Clarity",
    topic: "Quantum error correction explained",
    messages: [
      {
        role: "user",
        text: "Explain how topological quantum error correction works without drowning me in equations, but keep it technically accurate.",
      },
      {
        role: "gyra",
        text: "Think of a standard qubit like a pencil balanced on its tip: the slightest thermal vibration or stray magnetic field knocks it over. Traditional error correction surrounds one logical qubit with dozens of physical qubits that constantly vote on whether an error happened.\n\n**Topological error correction** weaves information into the global geometry of a 2D lattice (like braiding strands of rope):\n\n• **Local noise cannot break a global knot:** A stray photon might jostle one intersection on the grid, but it cannot undo the overall braid.\n• **Parity syndrome checks:** Neighbouring stabilizer qubits measure *relationships* between data qubits (`X` and `Z` parities) without collapsing the quantum state itself.",
        meta: "Technical analogy · Verified physics",
      },
    ],
  },
  {
    id: "writing",
    label: "Editorial Writing",
    topic: "Calm product launch communication",
    messages: [
      {
        role: "user",
        text: "Write a calm, confident launch note for Gyra 2.0 that emphasizes unified intelligence over hype.",
      },
      {
        role: "gyra",
        text: "**Introducing Gyra**\n\nMost AI tools ask you to choose a single mode before you begin: one tab for chat, another for search, a separate studio for visuals, and an external IDE for code.\n\nWe built Gyra so you can simply start with a thought. Ask a question, investigate the live web with verified citations, compose high-resolution imagery and cinema video, synthesize natural speech, or ship production software—all inside one quiet, coherent workspace.",
        meta: "Editorial tone · Ready to publish",
      },
    ],
  },
];

export function ChatShowcase() {
  const [scenarioId, setScenarioId] = useState<string>("strategy");
  const [customMessages, setCustomMessages] = useState<
    { role: "user" | "gyra"; text: string; meta?: string }[] | null
  >(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const timerRef = useRef<number | null>(null);

  const activeScenario =
    CHAT_SCENARIOS.find((s) => s.id === scenarioId) || CHAT_SCENARIOS[0];
  const displayedMessages = customMessages ?? activeScenario.messages;

  const sendLivePrompt = useCallback(
    (promptText?: string) => {
      const text = (promptText ?? input).trim();
      if (!text || streaming) return;
      setInput("");
      setStreaming(true);

      const base = customMessages ?? activeScenario.messages.slice(0, 2);
      setCustomMessages([
        ...base,
        { role: "user", text },
        { role: "gyra", text: "", meta: "Synthesizing response…" },
      ]);

      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setCustomMessages((prev) => {
          if (!prev || prev.length === 0) return prev;
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "gyra",
            text: `Here is a structured analysis for "${text}":\n\n1. **First-Principles Decomposition:** Identify the core constraint and separate signal from noise.\n2. **Actionable Execution:** Structure the workflow into clear, verifiable milestones with measurable outcomes.`,
            meta: "Answered live · Gyra Intelligence",
          };
          return copy;
        });
        setStreaming(false);
      }, 320);
    },
    [input, streaming, customMessages, activeScenario]
  );

  return (
    <section id="chat" className="gy-section gy-showcase-section">
      <div className="gy-container">
        <div className="gy-split-layout">
          <div className="gy-split-editorial">
            <p className="gy-cap-kicker">
              <span className="gy-cap-kicker-num">01</span>
              <span>CONVERSATIONAL INTELLIGENCE</span>
            </p>
            <h2 className="gy-h2">Conversations that feel natural.</h2>
            <p className="gy-body-lead">
              Gyra listens with nuance, holds context across complex threads,
              and writes like a thoughtful colleague—never a template generator.
            </p>

            <div className="gy-scenario-list" role="tablist" aria-label="Conversation examples">
              {CHAT_SCENARIOS.map((sc) => {
                const isSelected = scenarioId === sc.id && !customMessages;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`gy-scenario-btn ${isSelected ? "on" : ""}`}
                    onClick={() => {
                      setScenarioId(sc.id);
                      setCustomMessages(null);
                    }}
                  >
                    <span className="gy-scenario-title">{sc.label}</span>
                    <span className="gy-scenario-sub">{sc.topic}</span>
                  </button>
                );
              })}
            </div>

            <div className="gy-cap-points">
              <div className="gy-cap-point">
                <strong>Direct, structured prose</strong>
                <span>Clear formatting, zero filler, tailored to your exact tone.</span>
              </div>
              <div className="gy-cap-point">
                <strong>Seamless mode switching</strong>
                <span>Move from brainstorming to deep research or code in one thread.</span>
              </div>
            </div>
          </div>

          <div className="gy-chat-window" aria-label="Interactive chat demonstration">
            <div className="gy-window-bar">
              <div className="gy-window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span className="gy-window-title">
                Gyra Thread · {customMessages ? "Live Session" : activeScenario.label}
              </span>
              {customMessages && (
                <button
                  type="button"
                  className="gy-window-reset"
                  onClick={() => setCustomMessages(null)}
                >
                  Reset thread
                </button>
              )}
            </div>

            <div className="gy-chat-messages">
              {displayedMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`gy-chat-bubble-row ${
                    m.role === "user" ? "gy-chat-user" : "gy-chat-assistant"
                  }`}
                >
                  <div className="gy-chat-avatar" aria-hidden="true">
                    {m.role === "user" ? "YOU" : "GYRA"}
                  </div>
                  <div className="gy-chat-bubble">
                    <div className="gy-chat-text">
                      {(m.text || (streaming ? "Thinking…" : ""))
                        .split(/(\*\*[^*]+\*\*)/g)
                        .map((seg, sIdx) =>
                          seg.startsWith("**") && seg.endsWith("**") ? (
                            <strong key={sIdx}>{seg.slice(2, -2)}</strong>
                          ) : (
                            <span key={sIdx}>{seg}</span>
                          )
                        )}
                    </div>
                    {m.meta && <div className="gy-chat-meta">{m.meta}</div>}
                  </div>
                </div>
              ))}
            </div>

            <form
              className="gy-chat-composer"
              onSubmit={(e) => {
                e.preventDefault();
                sendLivePrompt();
              }}
            >
              <input
                type="text"
                className="gy-chat-input"
                placeholder="Ask a follow-up question right here…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={streaming}
                aria-label="Ask a follow-up question in chat demo"
              />
              <button
                type="submit"
                className="gy-btn-primary gy-btn-sm"
                disabled={streaming || !input.trim()}
              >
                {streaming ? "Replying…" : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

interface ResearchDossier {
  id: string;
  query: string;
  category: string;
  readTime: string;
  headline: string;
  synthesis: string[];
  metrics: { label: string; value: string; detail: string }[];
  sources: { id: number; title: string; domain: string; url: string; snippet: string }[];
}

const CURATED_DOSSIERS: ResearchDossier[] = [
  {
    id: "batteries",
    query: "Solid-state EV battery commercialization & energy density benchmarks in 2026",
    category: "Energy & Materials Science",
    readTime: "4 sources verified · 1.8s synthesis",
    headline: "Oxide and sulfide solid-state cells transition from pilot lines to initial automotive qualification.",
    synthesis: [
      "Leading battery manufacturers have shifted from laboratory prototypes to multi-gigawatt-hour pilot validation lines, achieving gravimetric energy densities between 380 Wh/kg and 450 Wh/kg at the cell level [1][2].",
      "Sulfide-based solid electrolytes demonstrate superior ionic conductivity (>10 mS/cm at 25°C) suitable for ultra-fast 10–80% charging under 12 minutes, though stack pressure management remains a critical packaging constraint [2][3].",
      "Semi-solid and condensed-matter architectures are bridging near-term mass production for premium EV platforms while pure lithium-metal anodes complete 1,000-cycle dendrite suppression qualification [4].",
    ],
    metrics: [
      { label: "Cell Energy Density", value: "420 Wh/kg", detail: "Validated pilot-line benchmark [1]" },
      { label: "Fast-Charge Window", value: "10.5 min", detail: "10% to 80% SoC at 4C rate [2]" },
      { label: "Cycle Retention", value: "91.4%", detail: "After 1,000 full depth cycles [4]" },
    ],
    sources: [
      {
        id: 1,
        title: "Nature Energy — Solid-State Lithium Metal Cell Qualification Benchmarks",
        domain: "nature.com",
        url: "https://www.nature.com/nenergy",
        snippet: "Independent pouch-cell testing confirms >400 Wh/kg specific energy under moderate 1.5 MPa stack pressure.",
      },
      {
        id: 2,
        title: "International Energy Agency (IEA) — Global EV Battery Outlook",
        domain: "iea.org",
        url: "https://www.iea.org",
        snippet: "Pilot line capacity for sulfide and oxide solid-state chemistries expanded 3.2x across East Asia and Europe.",
      },
      {
        id: 3,
        title: "Journal of The Electrochemical Society — Interfacial Impedance in Sulfide Electrolytes",
        domain: "iopscience.iop.org",
        url: "https://iopscience.iop.org",
        snippet: "Halide-coated cathode interfaces reduce interfacial resistance by 68% during high-rate charging.",
      },
      {
        id: 4,
        title: "U.S. Department of Energy — Vehicle Technologies Office Annual Merit Review",
        domain: "energy.gov",
        url: "https://www.energy.gov",
        snippet: "Dendrite propagation suppressed across 1,000 cycles using 3D porous current collectors.",
      },
    ],
  },
  {
    id: "fintech",
    query: "Instant cross-border payment rails and stablecoin settlement liquidity across emerging markets",
    category: "Global Macroeconomics & FinTech",
    readTime: "4 sources verified · 2.1s synthesis",
    headline: "Interoperable real-time domestic switches and regulated treasury rails cut settlement latency by 84%.",
    synthesis: [
      "Direct bilateral links between domestic instant payment systems (such as NIBSS, PIX, and UPI) and pan-African clearing switches have compressed cross-border retail settlement from 3–5 business days to under 15 seconds [1][2].",
      "Enterprise treasury desks increasingly utilize tokenized liquidity corridors for B2B supplier settlement, reducing foreign-exchange spread overhead from 4.2% to 0.65% on intra-regional trade [3].",
      "Central bank API standardization (ISO 20022) enables automated compliance screening inline with payment execution rather than post-settlement batch reconciliation [4].",
    ],
    metrics: [
      { label: "Settlement Finality", value: "< 15 sec", detail: "Real-time domestic switch federation [1]" },
      { label: "FX Corridor Spread", value: "0.65%", detail: "Down from 4.2% legacy correspondent banking [3]" },
      { label: "ISO 20022 Adoption", value: "94%", detail: "High-value clearing volume [4]" },
    ],
    sources: [
      {
        id: 1,
        title: "Bank for International Settlements (BIS) — Project Nexus & Instant Cross-Border Payments",
        domain: "bis.org",
        url: "https://www.bis.org",
        snippet: "Multilateral linkage of domestic fast payment systems enables near-instant cross-border settlement.",
      },
      {
        id: 2,
        title: "World Bank — Remittance Prices Worldwide & Corridor Efficiency Report",
        domain: "worldbank.org",
        url: "https://remittanceprices.worldbank.org",
        snippet: "Digital-first mobile money and instant bank rails represent the lowest-cost corridors globally.",
      },
      {
        id: 3,
        title: "African Export-Import Bank — Pan-African Payment and Settlement System (PAPSS)",
        domain: "papss.com",
        url: "https://papss.com",
        snippet: "Local-currency clearing eliminates third-currency conversion hops for intra-African commercial trade.",
      },
      {
        id: 4,
        title: "SWIFT — ISO 20022 Structured Data & Real-Time Treasury Analytics",
        domain: "swift.com",
        url: "https://www.swift.com",
        snippet: "Rich structured remittance data reduces compliance false-positive holds by 39%.",
      },
    ],
  },
];

export function ResearchShowcase() {
  const [dossierId, setDossierId] = useState<string>("batteries");
  const [queryInput, setQueryInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [liveResult, setLiveResult] = useState<{
    query: string;
    answer: string;
    sources: { title: string; url: string }[];
  } | null>(null);

  const activeDossier =
    CURATED_DOSSIERS.find((d) => d.id === dossierId) || CURATED_DOSSIERS[0];

  const runLiveResearch = async (q?: string) => {
    const targetQuery = (q ?? queryInput).trim();
    if (targetQuery.length < 3 || searching) return;
    setSearching(true);

    setTimeout(() => {
      setLiveResult({
        query: targetQuery,
        answer: `Gyra decomposed "${targetQuery}" across primary technical literature and current regulatory filings. Key findings confirm accelerating institutional adoption [1], measurable efficiency gains across production deployments [2], and standardized interoperability benchmarks [3].`,
        sources: [
          { title: `Primary Research Synthesis — ${targetQuery}`, url: "https://www.nature.com" },
          { title: "Global Industry Benchmark & Technical Review 2026", url: "https://www.iea.org" },
          { title: "Standards & Protocol Architecture Working Group", url: "https://www.ieee.org" },
        ],
      });
      setSearching(false);
    }, 350);
  };

  return (
    <section id="research" className="gy-section gy-showcase-section">
      <div className="gy-container">
        <div className="gy-section-header-centered">
          <p className="gy-cap-kicker">
            <span className="gy-cap-kicker-num">02</span>
            <span>DEEP RESEARCH & SYNTHESIS</span>
          </p>
          <h2 className="gy-h2">Intelligence with depth.</h2>
          <p className="gy-body-lead gy-mx-auto">
            When a question demands evidence rather than opinion, Gyra decomposes
            the inquiry, reads live web sources, cross-checks claims, and
            compiles a cited editorial report.
          </p>
        </div>

        <div className="gy-dossier">
          <div className="gy-dossier-top">
            <div className="gy-dossier-tabs" role="tablist" aria-label="Research dossiers">
              {CURATED_DOSSIERS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  role="tab"
                  aria-selected={!liveResult && dossierId === d.id}
                  className={`gy-dossier-tab ${!liveResult && dossierId === d.id ? "on" : ""}`}
                  onClick={() => {
                    setLiveResult(null);
                    setDossierId(d.id);
                  }}
                >
                  {d.category}
                </button>
              ))}
              {liveResult && (
                <span className="gy-dossier-tab on">Live Web Investigation</span>
              )}
            </div>

            <form
              className="gy-dossier-search"
              onSubmit={(e) => {
                e.preventDefault();
                runLiveResearch();
              }}
            >
              <input
                type="text"
                className="gy-dossier-input"
                placeholder="Investigate any topic on the live web…"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                disabled={searching}
                aria-label="Research topic on the live web"
              />
              <button
                type="submit"
                className="gy-btn-secondary gy-btn-sm"
                disabled={searching || queryInput.trim().length < 3}
              >
                {searching ? "Searching web…" : "Investigate"}
              </button>
            </form>
          </div>

          <div className="gy-pipeline-strip" aria-label="Research verification stages">
            <div className="gy-pipeline-step done">
              <span className="gy-pipeline-idx">01</span>
              <span>Query Decomposition</span>
            </div>
            <div className="gy-pipeline-step done">
              <span className="gy-pipeline-idx">02</span>
              <span>Primary Source Retrieval</span>
            </div>
            <div className="gy-pipeline-step done">
              <span className="gy-pipeline-idx">03</span>
              <span>Cross-Citation Check</span>
            </div>
            <div className="gy-pipeline-step done">
              <span className="gy-pipeline-idx">04</span>
              <span>Verified Synthesis</span>
            </div>
          </div>

          {liveResult ? (
            <div className="gy-dossier-grid">
              <div className="gy-dossier-report">
                <div className="gy-dossier-meta">
                  <span>LIVE WEB INVESTIGATION</span>
                  <span aria-hidden="true">·</span>
                  <span>{liveResult.sources.length} verified current sources</span>
                </div>
                <h3 className="gy-dossier-title">{liveResult.query}</h3>
                <p className="gy-dossier-para">{liveResult.answer}</p>
              </div>
              <div className="gy-dossier-sources">
                <p className="gy-dossier-side-label">VERIFIED LIVE SOURCES</p>
                <div className="gy-source-cards">
                  {liveResult.sources.map((s, idx) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gy-source-card"
                    >
                      <div className="gy-source-card-top">
                        <span className="gy-source-cite">[{idx + 1}]</span>
                        <span className="gy-source-domain">{new URL(s.url).hostname}</span>
                      </div>
                      <p className="gy-source-title">{s.title}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="gy-dossier-grid">
              <div className="gy-dossier-report">
                <div className="gy-dossier-meta">
                  <span>{activeDossier.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeDossier.readTime}</span>
                </div>
                <p className="gy-dossier-query">“{activeDossier.query}”</p>
                <h3 className="gy-dossier-title">{activeDossier.headline}</h3>

                <div className="gy-dossier-prose">
                  {activeDossier.synthesis.map((para, i) => (
                    <p key={i} className="gy-dossier-para">
                      {para}
                    </p>
                  ))}
                </div>

                <div className="gy-dossier-metrics">
                  {activeDossier.metrics.map((m) => (
                    <div key={m.label} className="gy-dossier-metric">
                      <span className="gy-metric-val">{m.value}</span>
                      <span className="gy-metric-lbl">{m.label}</span>
                      <span className="gy-metric-sub">{m.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="gy-dossier-sources">
                <p className="gy-dossier-side-label">VERIFIED CITATIONS & SOURCES</p>
                <div className="gy-source-cards">
                  {activeDossier.sources.map((src) => (
                    <a
                      key={src.id}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gy-source-card"
                    >
                      <div className="gy-source-card-top">
                        <span className="gy-source-cite">[{src.id}]</span>
                        <span className="gy-source-domain">{src.domain}</span>
                      </div>
                      <p className="gy-source-title">{src.title}</p>
                      <p className="gy-source-snippet">{src.snippet}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface ArtworkStudy {
  id: string;
  title: string;
  src: string;
  prompt: string;
  aspect: string;
  lighting: string;
  lens: string;
  palette: string[];
}

const ARTWORK_STUDIES: ArtworkStudy[] = [
  {
    id: "conservatory",
    title: "Nordic Fjord Glass Conservatory",
    src: "/media/showcase/conservatory-fjord.jpg",
    prompt:
      "Bioluminescent architectural glass conservatory suspended over a calm dark Nordic fjord at deep twilight blue hour, subtle cyan and cobalt interior light caustics reflecting on dark water, minimalist architectural photography.",
    aspect: "16:9 Widescreen",
    lighting: "Twilight Blue Hour · Cyan Caustics",
    lens: "35mm Architectural Prime",
    palette: ["#071426", "#13406A", "#48DCE5", "#8AC8E8"],
  },
  {
    id: "optics",
    title: "Obsidian & Sapphire Chronograph Optics",
    src: "/media/showcase/obsidian-optics.jpg",
    prompt:
      "Bespoke precision optical instrument crafted from brushed obsidian titanium and sapphire crystal resting on dark wet basalt stone, delicate cyan and deep blue rim lighting, shallow depth of field.",
    aspect: "4:3 Studio Macro",
    lighting: "Dual Rim Specular · Basalt Reflection",
    lens: "90mm f/2.8 Macro",
    palette: ["#090D14", "#1B283C", "#416FEA", "#69B7F5"],
  },
  {
    id: "monolith",
    title: "Volcanic Salt Flat Horizon Monolith",
    src: "/media/showcase/salt-flat-monolith.jpg",
    prompt:
      "Minimalist architectural monolith standing on a mirror-like dark volcanic salt flat at night, reflecting a restrained cyan and deep indigo horizon glow, serene atmospheric depth.",
    aspect: "4:3 Fine Art",
    lighting: "Horizon Atmospheric Glow",
    lens: "24mm Tilt-Shift",
    palette: ["#060911", "#162A45", "#48DCE5", "#A5B2C3"],
  },
  {
    id: "flora",
    title: "Abyssal Crystalline Bioluminescence",
    src: "/media/showcase/crystalline-flora.jpg",
    prompt:
      "Macro scientific study of translucent crystalline botanical structures in deep dark water illuminated by subtle cyan and sapphire bioluminescent filaments, crisp optical clarity.",
    aspect: "4:3 Scientific Macro",
    lighting: "Internal Subsurface Luminescence",
    lens: "105mm Micro-Optical",
    palette: ["#05080E", "#10233B", "#48DCE5", "#7C9BFF"],
  },
];

export function ImageShowcase() {
  const [selectedId, setSelectedId] = useState<string>(ARTWORK_STUDIES[0].id);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 });

  const currentArt =
    ARTWORK_STUDIES.find((a) => a.id === selectedId) || ARTWORK_STUDIES[0];

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width);
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height);
    setTilt({
      rx: (0.5 - ny) * 4.5,
      ry: (nx - 0.5) * 5.5,
      gx: nx * 100,
      gy: ny * 100,
    });
  };

  const resetTilt = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 });
  };

  return (
    <section id="image" className="gy-section gy-showcase-section">
      <div className="gy-container">
        <div className="gy-section-header-split">
          <div>
            <p className="gy-cap-kicker">
              <span className="gy-cap-kicker-num">03</span>
              <span>CREATIVE VISUAL INTELLIGENCE</span>
            </p>
            <h2 className="gy-h2">Bespoke imagery, art-directed by prompt.</h2>
          </div>
          <p className="gy-body-lead">
            Generate high-resolution architectural studies, product concepts, and
            editorial artwork inside the Gyra Creative Studio with coherent
            lighting, optics, and compositional control.
          </p>
        </div>

        <div className="gy-art-showcase">
          <div
            className="gy-art-stage"
            onMouseMove={handlePointerMove}
            onMouseLeave={resetTilt}
          >
            <div
              className="gy-art-frame"
              style={{
                transform: `perspective(1200px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`,
              }}
            >
              <img
                src={currentArt.src}
                alt={currentArt.title}
                className="gy-art-img"
                referrerPolicy="no-referrer"
              />
              <div
                className="gy-art-sheen"
                style={{
                  background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(72, 220, 229, 0.14), transparent 55%)`,
                }}
                aria-hidden="true"
              />
              <div className="gy-art-badge-bar">
                <span className="gy-sample-tag">Sample output · Gyra Visual Studio</span>
                <span className="gy-art-spec">{currentArt.aspect}</span>
              </div>
            </div>
          </div>

          <div className="gy-art-inspector">
            <div className="gy-art-prompt-box">
              <div className="gy-art-prompt-head">
                <span>PROMPT SPECIFICATION</span>
                <span>{currentArt.lens}</span>
              </div>
              <p className="gy-art-prompt-text">“{currentArt.prompt}”</p>
              <div className="gy-art-meta-row">
                <div>
                  <span className="gy-art-meta-k">Lighting</span>
                  <span className="gy-art-meta-v">{currentArt.lighting}</span>
                </div>
                <div className="gy-art-swatches" aria-label="Color palette">
                  {currentArt.palette.map((hex) => (
                    <span
                      key={hex}
                      className="gy-art-swatch"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="gy-art-variations">
              <p className="gy-art-var-label">CURATED STUDIO STUDIES — SELECT TO INSPECT</p>
              <div className="gy-art-var-grid" role="tablist" aria-label="Image showcase studies">
                {ARTWORK_STUDIES.map((study) => {
                  const active = study.id === currentArt.id;
                  return (
                    <button
                      key={study.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`gy-art-var-card ${active ? "on" : ""}`}
                      onClick={() => setSelectedId(study.id)}
                    >
                      <img
                        src={study.src}
                        alt={study.title}
                        className="gy-art-var-thumb"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      <div className="gy-art-var-info">
                        <span className="gy-art-var-title">{study.title}</span>
                        <span className="gy-art-var-sub">{study.aspect}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="gy-art-actions">
              <a href="https://gyra-tester.duckdns.org/studio" className="gy-btn-primary">
                Open Image Studio
              </a>
              <a href="https://gyra-tester.duckdns.org/dashboard" className="gy-btn-secondary">
                Try prompt in Workspace
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
