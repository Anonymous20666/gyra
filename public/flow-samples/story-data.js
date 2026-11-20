// Rich Real-World Gyra Architecture Stories (zero fabricated metrics — grounded in real repo capabilities)
window.GYRA_STORY = {
  parent: {
    name: "GENVIA",
    role: "Parent AI Company",
    note: "Builds the unified models, safety policies, and multi-modal infrastructure behind Gyra."
  },
  platform: {
    name: "GYRA",
    role: "AI Platform",
    surfaces: ["Web Workspace", "Android", "Telegram (@Gyra_AiBot)", "REST API v1"]
  },
  stages: [
    {
      id: "understand",
      code: "01",
      name: "Understand",
      tagline: "Intent, Context & Auth",
      desc: "Parses prompts, uploaded PDFs/images, framing presets, and scoped authentication."
    },
    {
      id: "orchestrate",
      code: "02",
      name: "Orchestrate",
      tagline: "Routing, Agents & Guardrails",
      desc: "Selects optimal model tier, coordinates multi-agent handoffs, and enforces rate/safety policies."
    },
    {
      id: "execute",
      code: "03",
      name: "Execute",
      tagline: "Inference & Live Delivery",
      desc: "Streams SSE tokens, synthesizes images/720p video, or returns OpenAI-compatible JSON."
    }
  ],
  products: [
    {
      id: "chat",
      code: "01",
      name: "Gyra Chat",
      category: "Reasoning & 6-Agent Core",
      endpoint: "POST /api/chat",
      surface: "Web · Android · Telegram",
      scenarioTitle: "Build a replay-safe TypeScript webhook endpoint",
      inputPrompt: "“Write a Next.js App Router POST webhook handler with constant-time HMAC verification and per-IP rate limiting.”",
      stageNarratives: [
        {
          stage: "01 · Understand",
          headline: "Parsed engineering build intent + workspace RAG context",
          detail: "Detected multi-file security requirement; verified user session and checked attached project files."
        },
        {
          stage: "02 · Orchestrate",
          headline: "Escalated to SuperGyra 2.0 + scheduled 6-Agent Pipeline",
          detail: "Dispatched Atlas (research) → Orion (analysis) → Architect (spec) → Forge (code) → Sentinel (HMAC security QA)."
        },
        {
          stage: "03 · Execute",
          headline: "Streamed verified TypeScript handler over live SSE",
          detail: "Delivered constant-time timingSafeEqual check, 5-minute replay window guard, and 429 Retry-After headers."
        }
      ],
      failNarrative: {
        headline: "Simulated upstream inference timeout (504)",
        detail: "Orchestrator caught stalled reasoning stream cleanly, preserved prompt context, and surfaced safe retry."
      },
      outputLabel: "Verified Handler · SuperGyra 2.0 + Sentinel QA",
      outputPreview: "POST /api/webhook → timingSafeEqual(hmac) · window=300s · rateLimit=60/min · status 200 OK",
      subEngines: [
        { id: "chat-1", name: "Gyra 1.0", role: "Fast everyday reasoning & live search" },
        { id: "chat-2", name: "SuperGyra 2.0", role: "Deep multi-step architecture & code" },
        { id: "chat-3", name: "6-Agent Pipeline", role: "Atlas · Orion · Architect · Forge · Sentinel · Mentor" },
        { id: "chat-4", name: "Projects RAG", role: "Grounded PDF & codebase retrieval" }
      ]
    },
    {
      id: "image",
      code: "02",
      name: "Gyra Image",
      category: "Synthesis & Geometry-Locked I2I",
      endpoint: "POST /api/fal/proxy",
      surface: "Gyra Chat · Pro Ultra Studio",
      scenarioTitle: "Relight a studio interior to tungsten dusk without altering geometry",
      inputPrompt: "“Shift exterior window light to blue-hour dusk and switch on the desk lamp at 2700K — preserve every object and camera angle.”",
      stageNarratives: [
        {
          stage: "01 · Understand",
          headline: "Encoded reference photograph + lighting preservation constraints",
          detail: "Authenticated session through hardened /api/fal/proxy and extracted structural depth map from source frame."
        },
        {
          stage: "02 · Orchestrate",
          headline: "Routed to Gyra Pro Ultra I2I with geometry lock enabled",
          detail: "Selected image-to-image relighting graph over text-only Flux Dev to guarantee pixel-accurate object retention."
        },
        {
          stage: "03 · Execute",
          headline: "Completed diffusion refinement & delivered 1440×1080 asset",
          detail: "Rendered warm tungsten specular falloff across metal surfaces while keeping original composition intact."
        }
      ],
      failNarrative: {
        headline: "Simulated proxy validation guard (422)",
        detail: "Hardened /api/fal/proxy rejected malformed image payload before dispatching compute, protecting credits."
      },
      outputLabel: "Rendered Frame · Gyra Pro Ultra I2I",
      outputPreview: "1440×1080 PNG · Geometry Lock: Preserved · Lighting: Blue-Hour + 2700K Tungsten",
      subEngines: [
        { id: "img-1", name: "Flux Dev", role: "High-res text-to-image synthesis" },
        { id: "img-2", name: "Gyra Pro Ultra I2I", role: "Geometry-locked image editing" },
        { id: "img-3", name: "Prompt Refiner", role: "Composition & material fidelity" },
        { id: "img-4", name: "Hardened Proxy", role: "Authenticated server-side delivery" }
      ]
    },
    {
      id: "video",
      code: "03",
      name: "Gyra Video",
      category: "Cinematic 720p Studio Motion",
      endpoint: "POST /api/v1/video/generate",
      surface: "Gyra Studio · REST Queue",
      scenarioTitle: "Direct a 720p twilight aerial shot from a reference frame",
      inputPrompt: "Reference frame + “Slow cinematic drone glide across cable-stayed bridge over dark lagoon at blue hour · 16:9.”",
      stageNarratives: [
        {
          stage: "01 · Understand",
          headline: "Validated attached keyframe + 16:9 widescreen studio preset",
          detail: "Checked Studio render balance, extracted Frame 001 anchor, and parsed smooth dolly-forward camera motion."
        },
        {
          stage: "02 · Orchestrate",
          headline: "Queued asynchronous render job on LTX-Video 13B worker",
          detail: "Issued trackable job ID for /api/v1/video/status/[id] polling and reserved GPU motion synthesis slot."
        },
        {
          stage: "03 · Execute",
          headline: "Synthesized 121 coherent frames at 720p · 24 fps",
          detail: "Encoded smooth twilight water reflections and traffic trails; saved clip to Gyra Studio render history."
        }
      ],
      failNarrative: {
        headline: "Simulated async render worker interruption",
        detail: "Status poller marked job interrupted and automatically released the held render credit back to wallet."
      },
      outputLabel: "Studio Render · LTX-Video 13B",
      outputPreview: "720p · 24 fps · 121 frames (5.0s) · Aspect 16:9 · Saved to Studio History",
      subEngines: [
        { id: "vid-1", name: "LTX-Video 13B", role: "720p · 24 fps · 121-frame synthesis" },
        { id: "vid-2", name: "I2V Frame Anchor", role: "Reference keyframe motion lock" },
        { id: "vid-3", name: "Async Studio Queue", role: "Job status polling & history" },
        { id: "vid-4", name: "Aspect Framing", role: "16:9 widescreen & 9:16 vertical" }
      ]
    },
    {
      id: "api",
      code: "04",
      name: "Gyra API",
      category: "OpenAI-Compat REST & Media",
      endpoint: "POST /api/v1/chat",
      surface: "REST · Console · Playground",
      scenarioTitle: "Serve a production OpenAI-compatible chat & media request",
      inputPrompt: "POST /api/v1/chat · Authorization: Bearer $GYRA_KEY · { model: \"gyra-super2.0\", stream: true }",
      stageNarratives: [
        {
          stage: "01 · Understand",
          headline: "Verified category-scoped Bearer key + OpenAI JSON payload",
          detail: "Validated key permissions, checked wallet credits, and normalized messages array for Gyra runtime."
        },
        {
          stage: "02 · Orchestrate",
          headline: "Applied per-key rate guardrails & selected v1 endpoint route",
          detail: "Enforced quota policy and dispatched cleanly across Chat, Voice/Whisper, Video, or Media API handlers."
        },
        {
          stage: "03 · Execute",
          headline: "Returned 200 OK chat.completion response & logged telemetry",
          detail: "Streamed standard OpenAI-compatible payload and recorded request entry in Developer Console analytics."
        }
      ],
      failNarrative: {
        headline: "Simulated 429 rate-limit guard triggered",
        detail: "Gateway protected downstream inference pool and returned structured JSON error with Retry-After header."
      },
      outputLabel: "REST Response · 200 OK JSON",
      outputPreview: "{ object: \"chat.completion\", model: \"gyra-super2.0\", finish_reason: \"stop\" }",
      subEngines: [
        { id: "api-1", name: "OpenAI-Compat v1", role: "Drop-in /api/v1/chat completions" },
        { id: "api-2", name: "Voice & Whisper", role: "/api/v1/voice & /api/v1/transcribe" },
        { id: "api-3", name: "Gyra Media API", role: "YouTube transcripts, TikTok & Spotify" },
        { id: "api-4", name: "Scoped Keys & Ledger", role: "Category scopes, quotas & console" }
      ]
    }
  ]
};
