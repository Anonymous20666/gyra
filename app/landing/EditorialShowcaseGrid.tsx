"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import {
  calculateInteriorBundle,
  calculateSaasForecast,
  clampComparisonSlider,
} from "./fieldMath";
import type { OmniMode } from "./Hero";

function GyraSparkIcon() {
  return (
    <span className="gy-spark-avatar" aria-hidden="true">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        className="gy-spark-svg"
      >
        <path
          d="M12 2.5L14.4 9.6L21.5 12L14.4 14.4L12 21.5L9.6 14.4L2.5 12L9.6 9.6L12 2.5Z"
          fill="#4F6EF7"
        />
        <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
      </svg>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Captured-thread chrome: header, user turn, gyra turn               */
/* ------------------------------------------------------------------ */

function ThreadHeader({ topic, stamp }: { topic: string; stamp: string }) {
  return (
    <div className="gy-thread-header">
      <span className="gy-thread-dot" aria-hidden="true" />
      <span className="gy-thread-topic">{topic}</span>
      <span className="gy-thread-stamp">{stamp}</span>
    </div>
  );
}

function UserTurn({
  text,
  stamp,
  thumbSrc,
  thumbAlt,
}: {
  text: string;
  stamp: string;
  thumbSrc?: string;
  thumbAlt?: string;
}) {
  return (
    <div className="gy-turn-user">
      <div className="gy-thread-user-bubble">
        {thumbSrc && (
          <img
            src={thumbSrc}
            alt={thumbAlt || "Attachment"}
            referrerPolicy="no-referrer"
            className="gy-user-Upload-thumb"
          />
        )}
        <p className="gy-thread-user-text">{text}</p>
      </div>
      <span className="gy-turn-time">{stamp}</span>
    </div>
  );
}

function GyraTurn({ chip, children }: { chip: string; children: ReactNode }) {
  return (
    <div className="gy-turn-gyra">
      <GyraSparkIcon />
      <div className="gy-thread-gyra-body">
        <div className="gy-gyra-meta-line">
          <span className="gy-gyra-name">Gyra</span>
          <span className="gy-gyra-chip">{chip}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface FabricHotspot {
  id: string;
  xPct: number;
  yPct: number;
  title: string;
  material: string;
  spec: string;
}

const FLATLAY_HOTSPOTS: FabricHotspot[] = [
  {
    id: "merino",
    xPct: 31,
    yPct: 36,
    title: "Camel Merino Rib Knit",
    material: "100% Extra-Fine 19.5μm Merino Wool",
    spec: "Sub-millimeter rib stitch geometry & soft studio self-shadowing preserved.",
  },
  {
    id: "linen",
    xPct: 33,
    yPct: 74,
    title: "Raw Oatmeal Linen Shirt",
    material: "Belgian Long-Staple Unbleached Flax",
    spec: "Natural warp/weft slub variation and mother-of-pearl button speculars.",
  },
  {
    id: "trousers",
    xPct: 71,
    yPct: 40,
    title: "Charcoal Worsted Flannel",
    material: "Super 120s Brushed Twill Weave",
    spec: "Matte light absorption with zero synthetic plastic sheen.",
  },
  {
    id: "boots",
    xPct: 70,
    yPct: 78,
    title: "Full-Grain Cordovan Boots",
    material: "Vegetable-Tanned Aniline Calfskin",
    spec: "Realistic crease micro-roughness and stacked welt edge stitching.",
  },
];

interface InteriorProduct {
  id: string;
  name: string;
  price: number;
  dimensions: string;
  finish: string;
  tag: string;
  href: string;
}

const INTERIOR_PRODUCTS: InteriorProduct[] = [
  {
    id: "sofa",
    name: "Low-profile MCM Velvet Sofa",
    price: 950,
    dimensions: '76" W × 34" D × 29" H',
    finish: "Moss Performance Velvet · Tapered Walnut Legs",
    tag: "Anchor Piece",
    href: "https://gyra-tester.duckdns.org/dashboard?agent=shopping&item=mcm-velvet-sofa",
  },
  {
    id: "chair",
    name: "Sculpted Bouclé Lounge Chair",
    price: 220,
    dimensions: '32" W × 31" D × 28" H',
    finish: "Cream Heavyweight Bouclé · 360° Oak Swivel",
    tag: "Accent Seating",
    href: "https://gyra-tester.duckdns.org/dashboard?agent=shopping&item=boucle-lounge-chair",
  },
  {
    id: "lamp",
    name: "Spun Brass Arc Floor Lamp",
    price: 145,
    dimensions: '64" H · Warm 2700K LED',
    finish: "Brushed Antique Brass · Solid Walnut Side Table Pair",
    tag: "Optional Swap",
    href: "https://gyra-tester.duckdns.org/dashboard?agent=shopping&item=brass-arc-lamp",
  },
];

const SAAS_SLIDER_TS_CODE = `import { useState } from "react";
import { calculateSaasForecast } from "./fieldMath";

export function SaasRevenueForecastCard() {
  const [customers, setCustomers] = useState(420);
  const [arpu, setArpu] = useState(89);
  const [nrr, setNrr] = useState(118);

  const { currentMrr, projectedArr, expansionGainArr, monthlySeries } =
    calculateSaasForecast(customers, arpu, nrr);

  return (
    <div className="rounded-2xl bg-[#16181D]/90 border border-white/[0.08] p-5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-zinc-400">12-Month Projected ARR</span>
        <strong className="font-mono text-2xl text-white">
          \${projectedArr.toLocaleString()}
        </strong>
      </div>
      <input
        type="range"
        min={50}
        max={2000}
        value={customers}
        onChange={(e) => setCustomers(Number(e.target.value))}
      />
    </div>
  );
}`;

const DECK_SLIDES = [
  {
    num: "01",
    title: "Executive Summary & Margin Wedge",
    bullet: "Unified compute pooling models a 41% lower per-seat cost at 100+ seats vs legacy SaaS (illustrative model).",
  },
  {
    num: "02",
    title: "Competitor A vs B vs C Pricing Matrix",
    bullet: "14 pricing pages compiled from the sample dataset: hidden overage multipliers flagged on video & API tiers.",
  },
  {
    num: "03",
    title: "Enterprise Gross Margin Sensitivity",
    bullet: "Illustrative 78.4% blended gross margin held across multimodal text, vision, and code workloads.",
  },
  {
    num: "04",
    title: "Q4 Migration & Land-and-Expand Playbook",
    bullet: "OpenAI SDK drop-in compatibility (live on /api/v1/chat) keeps enterprise switching friction minimal.",
  },
];

export default function EditorialShowcaseGrid() {
  // Card 1 State: Precision Photo Restyling (Before/After Slider)
  const [splitPercent, setSplitPercent] = useState<number>(54);
  const compareStageRef = useRef<HTMLDivElement>(null);
  const [draggingSplit, setDraggingSplit] = useState(false);

  // Card 2 State: Studio Product & Flat-Lay Hotspots
  const [activeHotspotId, setActiveHotspotId] = useState<string>("merino");

  // Card 3 State: Smart Interior & Shopping Agent Carousel
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(["sofa", "chair"]);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Card 4 State: Interactive Code & Live UI Artifact Card
  const [artifactTab, setArtifactTab] = useState<"preview" | "code">("preview");
  const [customers, setCustomers] = useState<number>(420);
  const [arpu, setArpu] = useState<number>(89);
  const [nrr, setNrr] = useState<number>(118);
  const [codeCopied, setCodeCopied] = useState(false);

  // Card 5 State: Cinema Video Extension & Camera Control (rig preview over still)
  const [cameraPreset, setCameraPreset] = useState<"orbit" | "dolly" | "crane">("orbit");
  const orbitCanvasRef = useRef<HTMLCanvasElement>(null);

  // Card 6 State: Autonomous Multi-Step Workflow Agent (sample run)
  const [agentStep, setAgentStep] = useState<number>(3);
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [deckDownloaded, setDeckDownloaded] = useState(false);

  const activeHotspot =
    FLATLAY_HOTSPOTS.find((h) => h.id === activeHotspotId) || FLATLAY_HOTSPOTS[0];

  const selectedPrices = INTERIOR_PRODUCTS.filter((p) =>
    selectedItemIds.includes(p.id)
  ).map((p) => p.price);
  const bundleStats = calculateInteriorBundle(selectedPrices, 1200);

  const forecast = calculateSaasForecast(customers, arpu, nrr);
  const maxMonthMrr = Math.max(...forecast.monthlySeries, 1);

  const dispatchRemixToComposer = (prompt: string, mode: OmniMode) => {
    window.dispatchEvent(
      new CustomEvent("gyra:remix-prompt", {
        detail: { prompt, mode },
      })
    );
  };

  const updateSplitFromClientX = (clientX: number) => {
    const el = compareStageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rawPct = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
    setSplitPercent(clampComparisonSlider(rawPct));
  };

  // Card 5: Volumetric fog & 360° orbital camera trajectory overlay canvas (rig preview)
  useEffect(() => {
    const canvas = orbitCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const renderOrbit = (now: number) => {
      const w = canvas.clientWidth || 420;
      const h = canvas.clientHeight || 236;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const t = now * 0.001;

      // Volumetric fog layers drifting across frame (rig preview, real-time canvas)
      for (let i = 0; i < 4; i++) {
        const fx = ((t * (18 + i * 7) + i * 110) % (w + 180)) - 90;
        const fy = h * (0.45 + i * 0.12);
        const grad = ctx.createRadialGradient(fx, fy, 8, fx, fy, 110);
        grad.addColorStop(0, "rgba(210, 225, 255, 0.13)");
        grad.addColorStop(1, "rgba(210, 225, 255, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // 360° Orbital Camera Trajectory Arc HUD at bottom-right
      const cx = w - 68;
      const cy = h - 42;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 42, 14, 0, 0, Math.PI * 2);
      ctx.stroke();

      const angle =
        cameraPreset === "orbit"
          ? t * 1.35
          : cameraPreset === "dolly"
          ? Math.sin(t * 1.5) * 0.8
          : -Math.PI * 0.5 + Math.sin(t * 1.2) * 0.6;
      const camX = cx + Math.cos(angle) * 42;
      const camY = cy + Math.sin(angle) * 14;

      ctx.fillStyle = "#4F6EF7";
      ctx.beginPath();
      ctx.arc(camX, camY, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      raf = requestAnimationFrame(renderOrbit);
    };

    raf = requestAnimationFrame(renderOrbit);
    return () => cancelAnimationFrame(raf);
  }, [cameraPreset]);

  const replayWorkflowAgent = () => {
    setAgentStep(1);
    window.setTimeout(() => setAgentStep(2), 320);
    window.setTimeout(() => setAgentStep(3), 680);
  };

  const handleDownloadDeckBrief = () => {
    const content = [
      "# Gyra Autonomous Agent — Competitor Pricing & Margin Matrix (Sample Run)",
      "",
      "> Demo dataset — figures are illustrative. Live Deep Research runs scrape and cite every source.",
      "",
      "## Executive Summary",
      "- Compiled 14 pricing pages (sample dataset) across 3 competitor profiles.",
      "- Modeled +18.4% gross margin advantage at 50+ enterprise seats (illustrative model).",
      "",
      "## Slide Breakdown",
      ...DECK_SLIDES.map((s) => `${s.num}. ${s.title}: ${s.bullet}`),
    ].join("\n");

    try {
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Gyra_Competitor_Pricing_Deck_Brief.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
    setDeckDownloaded(true);
    window.setTimeout(() => setDeckDownloaded(false), 2500);
  };

  return (
    <section
      id="showcase-cards"
      className="gy-section gy-editorial-showcase-section"
      aria-label="Multimodal Conversation & Agent Showcase"
    >
      <div className="gy-container">
        <div className="gy-section-header-split">
          <div>
            <p className="gy-cap-kicker">
              <span className="gy-cap-kicker-num">CAPTURED THREADS</span>
              <span>NATIVE MULTIMODAL WORKFLOWS</span>
            </p>
            <h2 className="gy-h2">
              Real work inside a single conversation.
            </h2>
          </div>
          <p className="gy-body-lead">
            Six captured conversations, left live on purpose. Everything inside
            them is real and testable: drag the compare, toggle the bundle,
            move the sliders, preview the camera rig, and export the deck.
          </p>
        </div>

        {/* 6 CAPTURED CONVERSATION SHOWCASE CARDS */}
        <div className="gy-meta-cards-grid">
          {/* ==========================================================
              CARD 1 — PRECISION PHOTO RESTYLING (BEFORE / AFTER SLIDER)
              ========================================================== */}
          <article
            className="gy-meta-card"
            id="card-photo-restyle"
            data-testid="showcase-card-1"
          >
            <span id="image" aria-hidden="true" />
            <ThreadHeader topic="Ramen shot · studio restyle" stamp="Today" />

            <UserTurn
              thumbSrc="/media/showcase/ramen-before-rustic.jpg"
              thumbAlt="Original rustic wooden-table ramen bowl attachment"
              text="Here&apos;s the shoot — can you move this to a clean studio backdrop? Keep the steam dramatic."
              stamp="14:02"
            />

            <GyraTurn chip="Omni 4.0 · image-edit">
              <p className="gy-gyra-prose">
                Done. I kept the bowl, chopsticks and steam untouched and
                rebuilt the background as a slate-blue studio surface with a
                soft backlight so the steam reads. Drag the split to compare.
              </p>

              <div
                ref={compareStageRef}
                className="gy-compare-stage"
                onMouseMove={(e) => {
                  if (draggingSplit) updateSplitFromClientX(e.clientX);
                }}
                onMouseDown={(e) => {
                  setDraggingSplit(true);
                  updateSplitFromClientX(e.clientX);
                }}
                onMouseUp={() => setDraggingSplit(false)}
                onMouseLeave={() => setDraggingSplit(false)}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  if (touch) updateSplitFromClientX(touch.clientX);
                }}
              >
                {/* Base Layer: AFTER (Studio Neutral Blue + Enhanced Steam Lighting) */}
                <img
                  src="/media/showcase/ramen-after-studio.jpg"
                  alt="After restyling: artisanal ramen on clean studio neutral slate-blue surface with backlit volumetric steam"
                  referrerPolicy="no-referrer"
                  className="gy-compare-img"
                  draggable={false}
                />

                {/* Clipped Layer: BEFORE (Rustic Wooden Table) */}
                <div
                  className="gy-compare-before-clip"
                  style={{ clipPath: `inset(0 ${100 - splitPercent}% 0 0)` }}
                >
                  <img
                    src="/media/showcase/ramen-before-rustic.jpg"
                    alt="Before restyling: ramen bowl on rustic wooden table"
                    referrerPolicy="no-referrer"
                    className="gy-compare-img"
                    draggable={false}
                  />
                </div>

                {/* Interactive Divider Line & Handle */}
                <div
                  className="gy-compare-divider"
                  style={{ left: `${splitPercent}%` }}
                  aria-hidden="true"
                >
                  <span className="gy-compare-handle">⇄</span>
                </div>

                <span className="gy-compare-tag gy-compare-tag-left">
                  Before · Rustic Wood
                </span>
                <span className="gy-compare-tag gy-compare-tag-right">
                  After · Studio Slate Blue ({100 - splitPercent}% view)
                </span>

                <input
                  type="range"
                  min={4}
                  max={96}
                  value={splitPercent}
                  aria-label="Compare Before and After photo restyling"
                  className="gy-compare-range-input"
                  onChange={(e) =>
                    setSplitPercent(clampComparisonSlider(Number(e.target.value)))
                  }
                />
              </div>

              <div className="gy-compare-quick-bar">
                <span>Drag slider to inspect lighting &amp; steam</span>
                <div className="gy-compare-quick-btns">
                  <button
                    type="button"
                    onClick={() => setSplitPercent(85)}
                    className={splitPercent > 70 ? "on" : ""}
                  >
                    Before
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitPercent(50)}
                    className={splitPercent >= 35 && splitPercent <= 65 ? "on" : ""}
                  >
                    50 / 50
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitPercent(14)}
                    className={splitPercent < 30 ? "on" : ""}
                  >
                    After
                  </button>
                </div>
              </div>
            </GyraTurn>

            <UserTurn
              text="Push the steam a touch more — it should almost kiss the bowl rim."
              stamp="14:04"
            />

            <GyraTurn chip="Omni 4.0 · image-edit">
              <p className="gy-gyra-prose">
                Agreed — I lifted the steam highlights so it trails right to
                the rim. If it gets too heavy for print, one word and I&apos;ll
                dial it back a stop.
              </p>
            </GyraTurn>

            {/* Bottom Caption + Pill CTA */}
            <div className="gy-meta-card-footer">
              <div className="gy-meta-card-caption">
                <strong>Precision Photo Restyling</strong>
                <span>Subject-locked relighting &amp; studio surface replacement</span>
              </div>
              <button
                type="button"
                className="gy-meta-pill-cta"
                onClick={() =>
                  dispatchRemixToComposer(
                    "Change the background of this rustic wooden-table ramen bowl to a clean studio neutral blue and enhance volumetric steam lighting.",
                    "Image Gen"
                  )
                }
              >
                Edit a photo
              </button>
            </div>
          </article>

          {/* ==========================================================
              CARD 2 — STUDIO PRODUCT & FLAT-LAY GENERATION (HOTSPOTS)
              ========================================================== */}
          <article
            className="gy-meta-card"
            id="card-studio-flatlay"
            data-testid="showcase-card-2"
          >
            <ThreadHeader topic="Autumn capsule · flat-lay" stamp="Today" />

            <UserTurn
              text="Put together a neutral autumn capsule wardrobe — flat lay on warm linen, overhead, soft studio light."
              stamp="11:21"
            />

            <GyraTurn chip="Omni 4.0 · image-gen">
              <p className="gy-gyra-prose">
                Here&apos;s the board — four core pieces in a camel / oat /
                charcoal palette. Tap any pin to inspect the weave the
                generator rendered on that panel.
              </p>

              <div className="gy-flatlay-stage">
                <img
                  src="/media/showcase/autumn-flatlay-wardrobe.jpg"
                  alt="Capsule wardrobe of neutral autumn clothing laid out flat on a warm linen backdrop"
                  referrerPolicy="no-referrer"
                  className="gy-flatlay-img"
                />

                {FLATLAY_HOTSPOTS.map((spot) => {
                  const isSelected = spot.id === activeHotspot.id;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      style={{ left: `${spot.xPct}%`, top: `${spot.yPct}%` }}
                      className={`gy-hotspot-pin ${isSelected ? "on" : ""}`}
                      aria-label={`Inspect texture: ${spot.title}`}
                      onMouseEnter={() => setActiveHotspotId(spot.id)}
                      onClick={() => setActiveHotspotId(spot.id)}
                    >
                      <span className="gy-hotspot-core" />
                    </button>
                  );
                })}
              </div>

              {/* Live Texture Inspector Callout */}
              <div className="gy-hotspot-readout" data-testid="flatlay-hotspot-readout">
                <div className="gy-hotspot-readout-top">
                  <strong>{activeHotspot.title}</strong>
                  <span>{activeHotspot.material}</span>
                </div>
                <p>{activeHotspot.spec}</p>
              </div>
            </GyraTurn>

            <UserTurn
              text="That merino knit — is the texture real?"
              stamp="11:24"
            />

            <GyraTurn chip="Omni 4.0 · image-gen">
              <p className="gy-gyra-prose">
                It&apos;s a rendered approximation — the generator reproduces
                rib geometry and self-shadowing well at this resolution, but
                for final QC I&apos;d still check it against a physical
                swatch. Want a tighter macro of that panel?
              </p>
            </GyraTurn>

            <div className="gy-meta-card-footer">
              <div className="gy-meta-card-caption">
                <strong>Studio Product &amp; Flat-Lay Generation</strong>
                <span>Tap hotspots to inspect micro-fabric weave realism</span>
              </div>
              <button
                type="button"
                className="gy-meta-pill-cta"
                onClick={() =>
                  dispatchRemixToComposer(
                    "A capsule wardrobe of neutral autumn clothing laid out flat, photographed from above on a warm linen backdrop, soft studio light",
                    "Image Gen"
                  )
                }
              >
                Create images
              </button>
            </div>
          </article>

          {/* ==========================================================
              CARD 3 — SMART INTERIOR & SHOPPING AGENT (CAROUSEL)
              ========================================================== */}
          <article
            className="gy-meta-card"
            id="card-shopping-agent"
            data-testid="showcase-card-3"
          >
            <span id="chat" aria-hidden="true" />
            <ThreadHeader topic="Studio furniture · under $1,200" stamp="Today" />

            <UserTurn
              text="Help me furnish my new studio with mid-century finds under $1,200. Show me how people style these spaces."
              stamp="09:47"
            />

            <GyraTurn chip="Omni 4.0 · shopping agent">
              <div className="gy-interior-reply-bubble">
                <p className="gy-interior-advice">
                  Anchor the main wall with a low-profile walnut-framed sofa
                  in olive velvet, then pair a curved cream bouclé swivel
                  chair by the window to keep sightlines open. Here is your
                  styled room concept and curated bundle under{" "}
                  <strong>$1,200</strong>:
                </p>

                <div className="gy-interior-room-preview">
                  <img
                    src="/media/showcase/mcm-interior-studio.jpg"
                    alt="Mid-century modern studio living space with olive velvet sofa and cream bouclé chair"
                    referrerPolicy="no-referrer"
                    className="gy-interior-room-img"
                  />
                  <div className="gy-interior-budget-bar">
                    <span>
                      Selected Bundle:{" "}
                      <strong data-testid="interior-bundle-total">
                        ${bundleStats.total.toLocaleString()}
                      </strong>{" "}
                      / $1,200
                    </span>
                    <span
                      className={`gy-budget-status ${
                        bundleStats.withinBudget ? "ok" : "over"
                      }`}
                    >
                      {bundleStats.withinBudget
                        ? `$${bundleStats.remaining} under budget`
                        : `$${Math.abs(bundleStats.remaining)} over budget`}
                    </span>
                  </div>
                </div>

                {/* Horizontal Swipeable Multi-Card Product Carousel */}
                <div className="gy-product-carousel-head">
                  <span>SWIPE OR TOGGLE FINDS ({selectedItemIds.length} SELECTED)</span>
                  <div className="gy-carousel-nav-btns">
                    <button
                      type="button"
                      aria-label="Scroll product carousel left"
                      onClick={() =>
                        carouselRef.current?.scrollBy({ left: -220, behavior: "smooth" })
                      }
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      aria-label="Scroll product carousel right"
                      onClick={() =>
                        carouselRef.current?.scrollBy({ left: 220, behavior: "smooth" })
                      }
                    >
                      →
                    </button>
                  </div>
                </div>

                <div
                  ref={carouselRef}
                  className="gy-product-carousel"
                  role="region"
                  aria-label="Mid-century furniture recommendations carousel"
                >
                  {INTERIOR_PRODUCTS.map((item) => {
                    const included = selectedItemIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        className={`gy-product-mini-card ${included ? "is-selected" : ""}`}
                      >
                        <div className="gy-product-mini-top">
                          <span className="gy-product-mini-tag">{item.tag}</span>
                          <strong className="gy-product-mini-price">
                            ${item.price}
                          </strong>
                        </div>
                        <h4 className="gy-product-mini-title">
                          {item.name} • ${item.price}
                        </h4>
                        <p className="gy-product-mini-spec">{item.finish}</p>
                        <div className="gy-product-mini-actions">
                          <button
                            type="button"
                            className="gy-product-toggle-btn"
                            onClick={() =>
                              setSelectedItemIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              )
                            }
                          >
                            {included ? "✓ In Studio Bundle" : "+ Add to Bundle"}
                          </button>
                          <a
                            href={item.href}
                            className="gy-product-link"
                            aria-label={`View ${item.name} details`}
                          >
                            View ↗
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GyraTurn>

            <UserTurn
              text="Add the lamp — does it still fit the budget?"
              stamp="09:52"
            />

            <GyraTurn chip="Omni 4.0 · shopping agent">
              <p className="gy-gyra-prose">
                {bundleStats.withinBudget
                  ? `All ${selectedItemIds.length} pieces in, $${bundleStats.total.toLocaleString()} total — $${bundleStats.remaining} under your cap. There's room for a rug if you want one.`
                  : `That puts the bundle at $${bundleStats.total.toLocaleString()} — $${Math.abs(bundleStats.remaining)} over. Drop the lamp, or I can scout a cheaper arc.`}
              </p>
            </GyraTurn>

            <div className="gy-meta-card-footer">
              <div className="gy-meta-card-caption">
                <strong>Smart Interior &amp; Shopping Agent</strong>
                <span>Visual room styling + live budget-constrained sourcing</span>
              </div>
              <button
                type="button"
                className="gy-meta-pill-cta"
                onClick={() =>
                  dispatchRemixToComposer(
                    "Help me furnish my new studio with mid-century finds under $1,200. Show me how people style these spaces.",
                    "Chat"
                  )
                }
              >
                Run Shopping Agent
              </button>
            </div>
          </article>

          {/* ==========================================================
              CARD 4 — INTERACTIVE CODE & LIVE UI ARTIFACT CARD
              ========================================================== */}
          <article
            className="gy-meta-card"
            id="card-code-artifact"
            data-testid="showcase-card-4"
          >
            <ThreadHeader topic="Revenue forecast widget" stamp="Today" />

            <UserTurn
              text="Build me an interactive SaaS revenue forecast card — React, dark, live sliders for seats, ARPU and NRR."
              stamp="16:30"
            />

            <GyraTurn chip="Omni 4.0 · code agent">
              <p className="gy-gyra-prose">
                Here it is, running live — drag any slider and every KPI plus
                the 12-month curve recalculates instantly. Clean TypeScript
                is in the second tab.
              </p>

              <div className="gy-artifact-shell">
                <div className="gy-artifact-tabs" role="tablist" aria-label="Code artifact view mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={artifactTab === "preview"}
                    className={`gy-artifact-tab ${artifactTab === "preview" ? "on" : ""}`}
                    onClick={() => setArtifactTab("preview")}
                  >
                    Live Interactive Preview
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={artifactTab === "code"}
                    className={`gy-artifact-tab ${artifactTab === "code" ? "on" : ""}`}
                    onClick={() => setArtifactTab("code")}
                  >
                    Clean TypeScript Code
                  </button>
                </div>

                {artifactTab === "preview" ? (
                  <div className="gy-saas-widget" data-testid="saas-forecast-widget">
                    <div className="gy-saas-kpi-row">
                      <div className="gy-saas-kpi">
                        <span>12-MO PROJECTED ARR</span>
                        <strong data-testid="saas-projected-arr">
                          ${forecast.projectedArr.toLocaleString()}
                        </strong>
                      </div>
                      <div className="gy-saas-kpi">
                        <span>NET EXPANSION GAIN</span>
                        <strong className="gy-saas-positive">
                          {forecast.expansionGainArr >= 0 ? "+" : ""}$
                          {forecast.expansionGainArr.toLocaleString()}
                        </strong>
                      </div>
                    </div>

                    {/* Interactive Sliders right on the Landing Page */}
                    <div className="gy-saas-sliders">
                      <label className="gy-saas-slider-row">
                        <div className="gy-saas-slider-label">
                          <span>Active Enterprise Seats</span>
                          <strong>{customers} seats</strong>
                        </div>
                        <input
                          type="range"
                          min={50}
                          max={1500}
                          step={10}
                          value={customers}
                          aria-label="Active Enterprise Seats"
                          onChange={(e) => setCustomers(Number(e.target.value))}
                        />
                      </label>

                      <label className="gy-saas-slider-row">
                        <div className="gy-saas-slider-label">
                          <span>Monthly ARPU ($/seat)</span>
                          <strong>${arpu}/mo</strong>
                        </div>
                        <input
                          type="range"
                          min={25}
                          max={250}
                          step={5}
                          value={arpu}
                          aria-label="Monthly ARPU"
                          onChange={(e) => setArpu(Number(e.target.value))}
                        />
                      </label>

                      <label className="gy-saas-slider-row">
                        <div className="gy-saas-slider-label">
                          <span>Net Dollar Retention (NRR)</span>
                          <strong>{nrr}%</strong>
                        </div>
                        <input
                          type="range"
                          min={90}
                          max={145}
                          step={1}
                          value={nrr}
                          aria-label="Net Dollar Retention percentage"
                          onChange={(e) => setNrr(Number(e.target.value))}
                        />
                      </label>
                    </div>

                    {/* 12-Month Compound Trajectory Bars */}
                    <div className="gy-saas-bars" aria-label="12-month MRR trajectory chart">
                      {forecast.monthlySeries.map((mVal, i) => {
                        const hPct = Math.max(16, Math.round((mVal / maxMonthMrr) * 100));
                        return (
                          <div key={i} className="gy-saas-bar-col">
                            <div
                              className="gy-saas-bar-fill"
                              style={{ height: `${hPct}%` }}
                              title={`Month ${i + 1}: $${mVal.toLocaleString()} MRR`}
                            />
                            <span className="gy-saas-bar-m">M{i + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="gy-artifact-code-box">
                    <div className="gy-artifact-code-bar">
                      <span>SaasRevenueForecastCard.tsx</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(SAAS_SLIDER_TS_CODE).catch(() => {});
                          setCodeCopied(true);
                          setTimeout(() => setCodeCopied(false), 1800);
                        }}
                      >
                        {codeCopied ? "Copied ✓" : "Copy TypeScript"}
                      </button>
                    </div>
                    <pre className="gy-artifact-pre">
                      <code>{SAAS_SLIDER_TS_CODE}</code>
                    </pre>
                  </div>
                )}
              </div>
            </GyraTurn>

            <UserTurn text="Ship it." stamp="16:33" />

            <GyraTurn chip="Omni 4.0 · code agent">
              <p className="gy-gyra-prose">
                Pushed to your workspace as <code> SaasRevenueForecastCard.tsx</code> —
                drop it in and it mounts standalone. Want a light theme
                variant too?
              </p>
            </GyraTurn>

            <div className="gy-meta-card-footer">
              <div className="gy-meta-card-caption">
                <strong>Interactive Code &amp; Live UI Artifacts</strong>
                <span>Drag the sliders above or inspect the TypeScript source</span>
              </div>
              <button
                type="button"
                className="gy-meta-pill-cta"
                onClick={() =>
                  dispatchRemixToComposer(
                    "Build an interactive SaaS revenue forecast slider with dark glassmorphism in React.",
                    "Code Agent"
                  )
                }
              >
                Launch Code Studio
              </button>
            </div>
          </article>

          {/* ==========================================================
              CARD 5 — CINEMA CAMERA RIG PREVIEW (STILL PLATE + RIG)
              ========================================================== */}
          <article
            className="gy-meta-card"
            id="card-cinema-camera"
            data-testid="showcase-card-5"
          >
            <span id="video" aria-hidden="true" />
            <ThreadHeader topic="Hypercar · camera rig" stamp="Today" />

            <UserTurn
              thumbSrc="/media/showcase/hypercar-tokyo-photoreal.jpg"
              thumbAlt="Static hypercar reference attachment"
              text="Static shot of the car in Tokyo — can you move a camera around it with some fog?"
              stamp="18:12"
            />

            <GyraTurn chip="Omni 4.0 · video studio">
              <p className="gy-gyra-prose">
                Camera rig preview below — I set a 3D orbit path around the
                plate with drifting volumetric fog. Pick a trajectory; this
                previews the move on the still. Full-frame renders launch in
                Video Studio with your chosen rig and length.
              </p>

              <div className="gy-camera-video-stage">
                <img
                  src="/media/showcase/hypercar-tokyo-photoreal.jpg"
                  alt="Still plate: matte-black hypercar on a Tokyo street at night, with live camera-rig overlay"
                  referrerPolicy="no-referrer"
                  className={`gy-camera-motion-img gy-cam-mode-${cameraPreset}`}
                />
                <canvas
                  ref={orbitCanvasRef}
                  className="gy-camera-orbit-canvas"
                  aria-hidden="true"
                />

                <div className="gy-camera-badge-top">
                  <span className="gy-camera-path-badge">
                    {cameraPreset === "orbit"
                      ? "Orbit Left · rig preview"
                      : cameraPreset === "dolly"
                      ? "Push Dolly · rig preview"
                      : "Crane Rise · rig preview"}
                  </span>
                  <span className="gy-camera-fps-pill">RIG PREVIEW</span>
                </div>
              </div>

              <div
                className="gy-camera-preset-bar"
                role="group"
                aria-label="Select camera motion trajectory preview"
              >
                <button
                  type="button"
                  className={`gy-cam-preset-btn ${cameraPreset === "orbit" ? "on" : ""}`}
                  onClick={() => setCameraPreset("orbit")}
                >
                  Orbit Left
                </button>
                <button
                  type="button"
                  className={`gy-cam-preset-btn ${cameraPreset === "dolly" ? "on" : ""}`}
                  onClick={() => setCameraPreset("dolly")}
                >
                  Push Dolly
                </button>
                <button
                  type="button"
                  className={`gy-cam-preset-btn ${cameraPreset === "crane" ? "on" : ""}`}
                  onClick={() => setCameraPreset("crane")}
                >
                  Crane Rise
                </button>
              </div>
            </GyraTurn>

            <UserTurn
              text="Orbit looks right. Can you queue the render from here?"
              stamp="18:15"
            />

            <GyraTurn chip="Omni 4.0 · video studio">
              <p className="gy-gyra-prose">
                Not from this thread — renders launch in Video Studio with the
                rig and length attached. The button below hands that exact
                brief over with the orbit preset.
              </p>
            </GyraTurn>

            <div className="gy-meta-card-footer">
              <div className="gy-meta-card-caption">
                <strong>Cinema Camera Rig Preview</strong>
                <span>3D trajectory preview over the plate · renders run in Studio</span>
              </div>
              <button
                type="button"
                className="gy-meta-pill-cta"
                onClick={() =>
                  dispatchRemixToComposer(
                    "Take this static car photo and set up a slow orbital camera move with volumetric fog in Video Studio.",
                    "Video Studio"
                  )
                }
              >
                Open in Video Studio
              </button>
            </div>
          </article>

          {/* ==========================================================
              CARD 6 — AUTONOMOUS WORKFLOW AGENT (SAMPLE RUN)
              ========================================================== */}
          <article
            className="gy-meta-card"
            id="card-workflow-agent"
            data-testid="showcase-card-6"
          >
            <span id="research" aria-hidden="true" />
            <ThreadHeader topic="Competitor pricing · research" stamp="Today" />

            <UserTurn
              text="Research our top 3 competitors&apos; pricing, build a comparison matrix, and export a pitch deck."
              stamp="08:05"
            />

            <GyraTurn chip="Omni 4.0 · deep research">
              <p className="gy-gyra-prose">
                Here&apos;s a <strong>sample run</strong> of the full
                workflow on a demo dataset — the shape of a real Deep
                Research run, with nothing invented. Live runs scrape and
                cite every page. Replay the steps, flip the slides, or
                export the deck — the .md download is a real file.
              </p>

              <div className="gy-workflow-box">
                <div className="gy-workflow-log-head">
                  <span>AGENT WORKFLOW · SAMPLE RUN</span>
                  <button
                    type="button"
                    className="gy-workflow-replay-btn"
                    onClick={replayWorkflowAgent}
                  >
                    ↻ Replay Steps
                  </button>
                </div>

                <ul className="gy-workflow-steps">
                  <li className={agentStep >= 1 ? "done" : "pending"}>
                    <span className="gy-wf-icon">✓</span>
                    <div className="gy-wf-copy">
                      <strong>Compiled 14 pricing pages</strong>
                      <span>Sample dataset · self-serve, enterprise seat &amp; API token tiers</span>
                    </div>
                  </li>
                  <li className={agentStep >= 2 ? "done" : "pending"}>
                    <span className="gy-wf-icon">✓</span>
                    <div className="gy-wf-copy">
                      <strong>Synthesized margin table</strong>
                      <span>Illustrative margin model at 50+ seats (demo data)</span>
                    </div>
                  </li>
                  <li className={agentStep >= 3 ? "done" : "pending"}>
                    <span className="gy-wf-icon">✓</span>
                    <div className="gy-wf-copy">
                      <strong>Generated 8-slide deck</strong>
                      <span>Real .md export — try the button</span>
                    </div>
                  </li>
                </ul>

                {/* Compact Comparison Matrix + Interactive 8-Slide Deck Preview Card */}
                <div className="gy-workflow-matrix">
                  <div className="gy-wf-matrix-row gy-wf-matrix-head">
                    <span>Platform</span>
                    <span>50-Seat TCO</span>
                    <span>Video / Code</span>
                  </div>
                  <div className="gy-wf-matrix-row gy-wf-matrix-highlight">
                    <strong>Gyra</strong>
                    <span>SuperGyra ₦10,000 / mo (≈$12)</span>
                    <span>Included</span>
                  </div>
                  <div className="gy-wf-matrix-row">
                    <span>Competitor A <em className="gy-wf-sample-tag">sample</em></span>
                    <span>$3,000 / mo</span>
                    <span>+$240 add-on</span>
                  </div>
                  <div className="gy-wf-matrix-row">
                    <span>Competitor B <em className="gy-wf-sample-tag">sample</em></span>
                    <span>$2,450 / mo</span>
                    <span>Text only</span>
                  </div>
                </div>

                {/* Interactive Downloadable Deck Preview */}
                <div className="gy-deck-preview-card">
                  <div className="gy-deck-preview-top">
                    <div>
                      <span className="gy-deck-badge">8-SLIDE PITCH DECK · SAMPLE RUN</span>
                      <h4 className="gy-deck-title">
                        {DECK_SLIDES[activeSlideIdx].num} · {DECK_SLIDES[activeSlideIdx].title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      className="gy-deck-download-btn"
                      onClick={handleDownloadDeckBrief}
                    >
                      {deckDownloaded ? "Downloaded ✓" : "Export Deck (.md)"}
                    </button>
                  </div>
                  <p className="gy-deck-bullet">{DECK_SLIDES[activeSlideIdx].bullet}</p>
                  <div className="gy-deck-slide-pills" role="tablist" aria-label="Inspect pitch deck slides">
                    {DECK_SLIDES.map((s, idx) => (
                      <button
                        key={s.num}
                        type="button"
                        role="tab"
                        aria-selected={idx === activeSlideIdx}
                        className={idx === activeSlideIdx ? "on" : ""}
                        onClick={() => setActiveSlideIdx(idx)}
                      >
                        Slide {s.num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </GyraTurn>

            <UserTurn
              text="Run it live on the real three?"
              stamp="08:09"
            />

            <GyraTurn chip="Omni 4.0 · deep research">
              <p className="gy-gyra-prose">
                Yes — hit <strong>Deploy Agent</strong> below and it opens
                Deep Research with this exact brief. Live runs log every step
                and cite each source, and the deck exports at the end.
              </p>
            </GyraTurn>

            <div className="gy-meta-card-footer">
              <div className="gy-meta-card-caption">
                <strong>Autonomous Multi-Step Workflow Agent</strong>
                <span>Sample run shown · live runs scrape &amp; cite each source</span>
              </div>
              <button
                type="button"
                className="gy-meta-pill-cta"
                onClick={() =>
                  dispatchRemixToComposer(
                    "Research our top 3 competitors' pricing, build a comparison matrix, and export a pitch deck.",
                    "Deep Research"
                  )
                }
              >
                Deploy Agent
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
