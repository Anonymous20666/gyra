// Canonical Gyra Intelligence Architecture Data (shared across all 6 HTML flow samples)
// All product names, models, agents, and endpoints reflect the actual Gyra repository.
window.GYRA_ARCH = {
  parent: {
    name: "GENVIA",
    role: "Parent AI Company",
    tagline: "Research, models, and unified AI infrastructure behind Gyra."
  },
  platform: {
    name: "GYRA",
    role: "AI Platform",
    surfaces: ["Web", "Android", "Telegram", "REST API"]
  },
  stages: [
    {
      id: "understand",
      code: "01",
      name: "Understand",
      short: "Parse intent, files & auth",
      detail: "Inspects prompt intent, uploaded files/images, bearer scope, and model selection."
    },
    {
      id: "orchestrate",
      code: "02",
      name: "Orchestrate",
      short: "Route engines & guardrails",
      detail: "Selects optimal model tier, agent sequence, safety checks, and async queue routing."
    },
    {
      id: "execute",
      code: "03",
      name: "Execute",
      short: "Run models & stream output",
      detail: "Streams SSE tokens, renders frames, or dispatches structured JSON payloads."
    }
  ],
  branches: [
    {
      id: "chat",
      code: "01",
      name: "Gyra Chat",
      category: "Reasoning & Agents",
      endpoint: "POST /api/chat",
      summary: "Conversational intelligence with Gyra 1.0, SuperGyra 2.0, and a 6-agent build pipeline.",
      status: "Available",
      subEngines: [
        { name: "Gyra 1.0", role: "Fast everyday inference & live search" },
        { name: "SuperGyra 2.0", role: "Deep multi-step engineering reasoning" },
        { name: "6-Agent Pipeline", role: "Atlas · Orion · Architect · Forge · Sentinel · Mentor" },
        { name: "Projects RAG", role: "PDF, codebase & document grounding" }
      ],
      capabilities: ["Live Web Search", "File & Vision Input", "6-Agent Build Mode", "Voice I/O"],
      trace: [
        { stage: "understand", log: "[UNDERSTAND] Parsed user prompt + workspace context · Auth verified" },
        { stage: "orchestrate", log: "[ORCHESTRATE] Routed to SuperGyra 2.0 · Engaged Atlas -> Architect -> Forge -> Sentinel" },
        { stage: "execute", log: "[EXECUTE] Streaming SSE response tokens to client workspace · Complete" }
      ],
      failTrace: [
        { stage: "understand", log: "[UNDERSTAND] Parsed request · Session token validated" },
        { stage: "orchestrate", log: "[ORCHESTRATE] Upstream inference slot busy · Evaluating retry policy" },
        { stage: "failed", log: "[FAILED] Simulated upstream timeout (504) — Ready to retry cleanly" }
      ]
    },
    {
      id: "image",
      code: "02",
      name: "Gyra Image",
      category: "Synthesis & I2I Edit",
      endpoint: "POST /api/fal/proxy",
      summary: "Text-to-image synthesis via Flux Dev and geometry-locked editing via Gyra Pro Ultra.",
      status: "Available",
      subEngines: [
        { name: "Flux Dev", role: "High-resolution text-to-image synthesis" },
        { name: "Gyra Pro Ultra I2I", role: "Geometry-locked lighting & scene edits" },
        { name: "Prompt Refiner", role: "Aspect, framing & material guidance" },
        { name: "Signed Proxy", role: "Authenticated server-side asset delivery" }
      ],
      capabilities: ["Text-to-Image", "Image-to-Image Edit", "Geometry Lock", "High-Res Export"],
      trace: [
        { stage: "understand", log: "[UNDERSTAND] Loaded reference frame + lighting edit instruction" },
        { stage: "orchestrate", log: "[ORCHESTRATE] Selected Gyra Pro Ultra I2I with structure preservation lock" },
        { stage: "execute", log: "[EXECUTE] Denoising passes finalized · Delivered 1440x1080 asset" }
      ],
      failTrace: [
        { stage: "understand", log: "[UNDERSTAND] Loaded reference frame + prompt payload" },
        { stage: "orchestrate", log: "[ORCHESTRATE] Validated proxy bearer scope · Checking payload limits" },
        { stage: "failed", log: "[FAILED] Simulated safety/payload guard rejection (422) — Adjust prompt & retry" }
      ]
    },
    {
      id: "video",
      code: "03",
      name: "Gyra Video",
      category: "Cinematic Motion",
      endpoint: "POST /api/v1/video/generate",
      summary: "Text-to-video and image-to-video 720p, 24 fps clips queued inside Gyra Studio.",
      status: "Available",
      subEngines: [
        { name: "LTX-Video 13B", role: "720p · 24 fps · 121-frame motion synthesis" },
        { name: "I2V Frame Anchor", role: "Keyframe-conditioned camera motion" },
        { name: "Async Studio Queue", role: "Job status polling & render history" },
        { name: "Aspect Framing", role: "Widescreen 16:9 & vertical 9:16 presets" }
      ],
      capabilities: ["Text-to-Video", "Image-to-Video", "16:9 & 9:16 Framing", "Render History"],
      trace: [
        { stage: "understand", log: "[UNDERSTAND] Parsed camera motion prompt + 16:9 framing preset" },
        { stage: "orchestrate", log: "[ORCHESTRATE] Dispatched async job to LTX-Video 13B Studio queue" },
        { stage: "execute", log: "[EXECUTE] Rendered 121 frames at 720p/24fps · MP4 ready in Studio" }
      ],
      failTrace: [
        { stage: "understand", log: "[UNDERSTAND] Parsed video prompt + reference frame attachment" },
        { stage: "orchestrate", log: "[ORCHESTRATE] Checked render wallet credits · Queue capacity check" },
        { stage: "failed", log: "[FAILED] Simulated render worker interruption — Job safely refunded" }
      ]
    },
    {
      id: "api",
      code: "04",
      name: "Gyra API",
      category: "Developer Platform",
      endpoint: "POST /api/v1/chat",
      summary: "OpenAI-compatible REST chat, async video queues, voice synthesis, and media extraction.",
      status: "Available",
      subEngines: [
        { name: "OpenAI-Compat v1", role: "Drop-in /api/v1/chat completions" },
        { name: "Voice & Whisper", role: "/api/v1/voice & /api/v1/transcribe" },
        { name: "Gyra Media API", role: "YouTube transcripts, TikTok & Spotify metadata" },
        { name: "Scoped Keys & Quotas", role: "Category keys, rate limits & credit ledger" }
      ],
      capabilities: ["Bearer Key Auth", "SSE Streaming", "Media Extraction", "Live Playground"],
      trace: [
        { stage: "understand", log: "[UNDERSTAND] Verified Bearer API key scope + JSON schema" },
        { stage: "orchestrate", log: "[ORCHESTRATE] Applied per-key rate limit + routed to /api/v1/chat" },
        { stage: "execute", log: "[EXECUTE] Returned 200 OK chat.completion payload · Ledger updated" }
      ],
      failTrace: [
        { stage: "understand", log: "[UNDERSTAND] Inspected Authorization header & category scope" },
        { stage: "orchestrate", log: "[ORCHESTRATE] Evaluating rate-limit bucket for scoped key" },
        { stage: "failed", log: "[FAILED] Simulated 429 rate-limit guard — Retry-After header issued" }
      ]
    }
  ]
};
