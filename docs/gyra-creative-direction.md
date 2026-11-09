# GYRA — Creative Direction & Website Transformation

**Product:** Gyra  
**Parent Company:** Genvia AI Company  
**Website:** https://gyra-tester.duckdns.org/  
**Positioning:** A complete AI intelligence platform — one unified place to ask, research, create, and build.

---

## 1. Benchmark Study & Reference Analysis

### Meta AI (`meta.ai`)
- **Why it succeeds visually:** Radical opening simplicity. The hero does not bury the visitor in marketing slogans before letting them interact; the prompt composer *is* the hero focal point.
- **What Gyra learns:** Immediate conversational invitation, calm opening posture, zero clutter around the primary prompt composer, and effortless mobile ergonomics where typing or tapping a starter chip feels instantaneous.
- **What Gyra avoids:** Overly casual consumer social-media styling that undersells deep research, autonomous coding, and developer API capabilities.

### Perplexity (`perplexity.ai`)
- **Why it succeeds visually:** Information hierarchy and research authority. Questions lead to structured synthesis backed by explicit, verifiable citations and source cards rather than opaque walls of text.
- **What Gyra learns:** Presenting Research as an editorial, source-grounded dossier rather than just another chat bubble; pairing a focused prompt composer with tangible starter queries.
- **What Gyra avoids:** Dense utilitarian search-portal chrome on the opening brand canvas.

### Claude (`claude.com`)
- **Why it succeeds visually:** Editorial composure, typographic warmth, and intellectual trust. Every heading is deliberately paced; paragraphs breathe with generous measure and calm contrast.
- **What Gyra learns:** Restraint, editorial pacing between dense interactive demonstrations and quiet architectural statements, and natural human copywriting free of artificial hype.
- **What Gyra avoids:** Warm parchment/terracotta colour schemes that conflict with Gyra's luminous deep-space computational identity.

### Runway (`runwayml.com`)
- **Why it succeeds visually:** Cinema-first presentation of generative media. Artwork and moving images are treated as gallery pieces with generous framing, sharp aspect ratios, and coherent colour grading.
- **What Gyra learns:** Dedicated, gallery-grade Image and Video showcases where bespoke high-resolution visuals and muted looping cinema reels take centre stage rather than cramped UI thumbnails.
- **What Gyra avoids:** Positioning the entire company exclusively as a filmmaking tool.

### Linear (`linear.app`)
- **Why it succeeds visually:** Millimetre-precise dark-mode surface craft. Hairline borders (`1px solid rgba(160, 180, 210, 0.14)`), disciplined elevation hierarchy, optical typography compensation on dark backgrounds, and purposeful spatial depth.
- **What Gyra learns:** Surface discipline, single-elevation card clarity, tactile hover and focus states, and hardware-grade precision in code/agent demonstrations.
- **What Gyra avoids:** Monochromatic issue-tracker density across creative media sections.

### OpenAI (`openai.com`)
- **Why it succeeds visually:** Cohesive brand architecture connecting conversational intelligence, deep research, multimodal creation (image, video, voice), autonomous agents, and developer APIs under one clear product umbrella.
- **What Gyra learns:** Clear relationship hierarchy (**Genvia AI Company → Gyra → Unified Capabilities**) and distinct visual compositions for each capability dimension.
- **What Gyra avoids:** Disconnected sub-brands or generic directory layouts.

---

## 2. Audit of Previous Implementation & Defects Resolved

1. **Eliminating the Single Giant Tabbed Demo ("See it think"):**
   - *Previous defect:* All six capabilities (Chat, Research, Image, Video, Voice, Build) were trapped inside a single tabbed box (`CapabilityStage.tsx`), hiding five-sixths of Gyra's breadth at any moment. Worse, the Image and Video tabs displayed empty placeholder gate notices instead of showcasing visual creative power.
   - *Transformation:* Replaced the tabbed box with **six dedicated, individually art-directed capability sections**, each with its own spatial composition, bespoke visual assets, and interactive behavior.
2. **Replacing Stationary Opacity Dots with a Genuine 3D Rolling Digital Light Field:**
   - *Previous defect:* `NeuralField.tsx` rendered a flat 2D grid of stationary points that only flickered in opacity.
   - *Transformation:* Engineered the **Gyra Living Digital Field** — a true 3D perspective-projected computational wave fabric (`(x, y, z)` spatial coordinates with multi-octave rolling wave displacement, travelling light ridges, pointer/touch spatial ripples, scroll-linked wave evolution, vertical spatial light filaments, and soft depth-of-field luminance).
3. **Art-Directed Typography:**
   - *Previous defect:* Used default `Inter` across headings and body copy.
   - *Transformation:* Paired **Outfit** (characterful, architectural geometric display face with tight tracking and `text-wrap: balance`) for primary headlines with **Plus Jakarta Sans** for crisp, high-legibility body prose and **JetBrains Mono** (`tabular-nums`) for code, citations, and telemetry.
4. **Intentional Mobile-First Architecture (320px – 430px):**
   - *Previous defect:* Cramped horizontal tab strips, overflowing prompt chips, and desktop-proportioned panels squeezed onto small screens.
   - *Transformation:* Every section is composed specifically for mobile viewports (`320×740`, `360×800`, `375×812`, `390×844`, `412×915`, `430×932`) with zero horizontal page overflow, touch-friendly controls, contained momentum swipe for cinema media, and clean vertical stacking.

---

## 3. Proposed Unique Gyra Art Direction

### A. Visual World: "Luminous Computational Depth"
Gyra exists in a deep atmospheric field (`#05070B` to `#080D15`) illuminated by a living three-dimensional wave of fine digital points in **Cyan (`#48DCE5`)**, **Deep Cobalt (`#416FEA`)**, and **Restrained Violet (`#8F85EF`)**. Surfaces float above this continuous living field using calibrated translucent materials (`#0B121E` / `#101925`), crisp hairline borders (`rgba(160, 180, 210, 0.15)`), and subtle top-edge specular highlights.

### B. Color System
| Token | Value | Purpose |
| :--- | :--- | :--- |
| `--gy-bg-deep` | `#05070B` | Deep atmospheric canvas |
| `--gy-bg-graphite` | `#080D15` | Secondary spatial backdrop |
| `--gy-surface-navy` | `#101925` | Elevated interactive product surface |
| `--gy-text-primary` | `#F5F7FA` | Crisp primary editorial text |
| `--gy-text-secondary` | `#A5B2C3` | Balanced supporting copy |
| `--gy-text-muted` | `#6E7E96` | Quiet metadata & technical captions |
| `--gy-cyan` | `#48DCE5` | Primary focal illumination & active state accent |
| `--gy-blue` | `#416FEA` | Deep spatial wave & secondary illumination |
| `--gy-violet` | `#8F85EF` | Restrained harmonic accent |
| `--gy-border` | `rgba(160, 180, 210, 0.15)` | Precision hairline structural border |

### C. Section-by-Section Architectural Rhythm
1. **Hero (`#top`) — Entering Gyra:** Calm, centered architectural opening over the richest region of the 3D Living Digital Field. Features the Gyra mark, `GYRA INTELLIGENCE · BUILT BY GENVIA AI COMPANY` label, *"Intelligence, simplified."* headline, *"One place to ask, research, create and build."* subheadline, the live prompt composer (`"Ask Gyra anything..."`) wired directly to the `/dashboard` workspace handoff, and 5 tactile prompt chips + capability jump anchors.
2. **01 · Chat (`#chat`) — Conversations That Feel Natural:** Asymmetric 2-column editorial + live conversational studio. Left column frames Gyra's conversational clarity and multi-domain reasoning; right column hosts a clean, live streaming conversation powered by `/api/demo/chat` with instant prompt starters.
3. **02 · Research (`#research`) — Intelligence With Depth:** Structured editorial research dossier layout. Displays the investigation pipeline (query decomposition → multi-source verification → cited synthesis), an interactive research report with inline `[1] [2] [3]` source citations, verified source cards, and a live web research bar wired to `/api/demo/research`.
4. **03 · Image (`#image`) — Creative Intelligence:** Gallery-scale visual showcase built around bespoke, high-resolution custom Gyra artwork. Visitors can inspect the main 16:9 architectural piece and switch across 4 curated prompt studies with full prompt transparency, aspect ratio metadata, and variations.
5. **04 · Video (`#video`) — Cinematic Intelligence:** Widescreen momentum cinema gallery featuring real muted, looping, lazy-loaded video outputs (`/products-hero-bg.mp4`, `/api-hero-bg.mp4`, `/docs-hero-bg.mp4`, and live studio captures) with fluid touch/drag physics and camera-motion metadata.
6. **05 · Voice (`#voice`) — A Distinctive Intelligence:** Acoustic spatial studio featuring a multi-layered real-time harmonic waveform & frequency visualizer, real audio playback (`/media/voice-signature.wav`) with explicit unmute/play control, and live neural voice synthesis via `/api/demo/voice`.
7. **06 · Build (`#build`) — Create With an Agent:** Autonomous software engineering workbench showing a user brief, 4-stage agent execution plan, file tree with line diffs, multi-file syntax-highlighted code editor, build terminal, and an interactive live application preview.
8. **Ecosystem, Developer API, Pricing & FAQ (`#ecosystem`, `#developers`, `#pricing`, `#faq`):** Unified product doors (`/dashboard`, `/studio`, `/projects`, `/api`), OpenAI-compatible SDK showcase, transparent NGN/USD subscription & credit packs, and clear answers.
