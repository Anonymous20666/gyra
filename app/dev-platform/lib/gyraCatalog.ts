export type ApiCategoryId = "ai" | "media" | "network" | "utilities";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type ServiceAvailability = "live" | "unavailable";

export interface GyraModelSpec {
  id: string;
  name: string;
  category: "chat" | "video" | "transcription";
  providerBacking: string;
  description: string;
  inputs: string[];
  outputs: string[];
  supportsStreaming: boolean;
  availability: "live" | "supergyra";
  pricingNote: string;
}

export interface EndpointParamSpec {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "enum" | "image-data-url";
  required: boolean;
  description: string;
  options?: string[];
  placeholder?: string;
}

export interface EndpointPreset {
  id: string;
  label: string;
  description: string;
  body: Record<string, unknown>;
}

export interface GyraEndpointSpec {
  id: string;
  category: ApiCategoryId;
  method: HttpMethod;
  path: string;
  title: string;
  shortDescription: string;
  availability: ServiceAvailability;
  authType: "api-key" | "session-token";
  requiredKeyPrefix?: "gyra_" | "gyramedia_" | "gyranet_" | "gyrautils_";
  supportsStreaming: boolean;
  isAsyncJob?: boolean;
  costUsd: number;
  costLabel: string;
  modelCategory?: "chat" | "video" | "transcription";
  params: EndpointParamSpec[];
  defaultBody: Record<string, unknown>;
  presets: EndpointPreset[];
  docsPath: string;
}

export interface GyraCategorySpec {
  id: ApiCategoryId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  availability: ServiceAvailability;
  keyPrefix: "gyra_" | "gyramedia_" | "gyranet_" | "gyrautils_";
  pricingSummary: string;
  docsHref: string;
}

export const GYRA_API_BASE_URL = "https://gyra.ng";

export const GYRA_CATEGORIES: GyraCategorySpec[] = [
  {
    id: "ai",
    name: "AI API",
    shortName: "AI",
    tagline: "Chat completions, reasoning, video & speech",
    description:
      "OpenAI-compatible chat completions across Gyra 1.0 and SuperGyra 2.0, asynchronous LTX-Video generation, and voice synthesis.",
    availability: "live",
    keyPrefix: "gyra_",
    pricingSummary: "Chat free tier · Video $2.00/render",
    docsHref: "/docs",
  },
  {
    id: "media",
    name: "Media API",
    shortName: "Media",
    tagline: "Music search, transcripts & social metadata",
    description:
      "Unified media extraction layer covering Spotify catalog search, YouTube captions and metadata, TikTok oEmbed, and Whisper audio transcription.",
    availability: "live",
    keyPrefix: "gyramedia_",
    pricingSummary: "$0.90/request · 10 free/month",
    docsHref: "/docs/media",
  },
  {
    id: "network",
    name: "Network API",
    shortName: "Network",
    tagline: "IP geolocation, DNS, WHOIS & SSL checks",
    description:
      "Planned network diagnostics suite for IP geolocation, DNS record inspection, WHOIS lookups, SSL verification, and HTTP header traces.",
    availability: "unavailable",
    keyPrefix: "gyranet_",
    pricingSummary: "Planned · $0.05/request",
    docsHref: "/docs/network",
  },
  {
    id: "utilities",
    name: "Utilities API",
    shortName: "Utilities",
    tagline: "Document conversion, QR & URL inspection",
    description:
      "Planned developer utilities covering document conversion, image compression, QR generation, and URL safety verification.",
    availability: "unavailable",
    keyPrefix: "gyrautils_",
    pricingSummary: "Planned · $0.02/request",
    docsHref: "/docs/utilities",
  },
];

export const GYRA_MODELS: GyraModelSpec[] = [
  {
    id: "gyra-1.0",
    name: "Gyra 1.0",
    category: "chat",
    providerBacking: "Low-latency inference engine",
    description:
      "Low-latency general-purpose model for everyday completions, summarization, extraction, and structured code generation.",
    inputs: ["Text", "System prompt", "Conversation history"],
    outputs: ["Text", "Markdown", "JSON", "SSE stream"],
    supportsStreaming: true,
    availability: "live",
    pricingNote: "Included in standard API key quota",
  },
  {
    id: "gyra-super2.0",
    name: "SuperGyra 2.0",
    category: "chat",
    providerBacking: "Deep reasoning engine",
    description:
      "Multi-step reasoning model designed for complex architecture analysis, debugging, technical synthesis, and long-form engineering tasks.",
    inputs: ["Text", "System prompt", "Conversation history"],
    outputs: ["Text", "Markdown", "JSON", "SSE stream"],
    supportsStreaming: true,
    availability: "supergyra",
    pricingNote: "Requires active SuperGyra access or AI credits",
  },
  {
    id: "gyra-video-1.0",
    name: "Gyra Video 1.0",
    category: "video",
    providerBacking: "Async 720p · 24fps video engine",
    description:
      "Asynchronous text-to-video and image-to-video synthesis generating 121-frame 720p sequences at 24fps in 16:9 or 9:16.",
    inputs: ["Text prompt", "Optional base64 keyframe image"],
    outputs: ["Async Job ID", "MP4 Video (720p)"],
    supportsStreaming: false,
    availability: "supergyra",
    pricingNote: "$2.00 per render (SuperGyra)",
  },
  {
    id: "whisper-large-v3",
    name: "Whisper Large v3",
    category: "transcription",
    providerBacking: "High-accuracy audio transcription",
    description:
      "Multilingual speech-to-text transcription optimized for clear technical vocabulary and West African / global English accents.",
    inputs: ["Audio URL or multipart audio file"],
    outputs: ["Transcript text", "Segments & language metadata"],
    supportsStreaming: false,
    availability: "live",
    pricingNote: "$0.90 per request (Media API)",
  },
];

export const GYRA_ENDPOINTS: GyraEndpointSpec[] = [
  // AI API — Live verified endpoints
  {
    id: "chat-completions",
    category: "ai",
    method: "POST",
    path: "/api/v1/chat",
    title: "Chat Completions",
    shortDescription: "OpenAI-compatible chat and SSE token streaming",
    availability: "live",
    authType: "api-key",
    requiredKeyPrefix: "gyra_",
    supportsStreaming: true,
    costUsd: 0,
    costLabel: "Free tier",
    modelCategory: "chat",
    docsPath: "/docs#chat-completions",
    params: [
      {
        name: "model",
        type: "enum",
        required: false,
        options: ["gyra-1.0", "gyra-super2.0"],
        description: "Target Gyra model identifier. Defaults to gyra-1.0.",
      },
      {
        name: "messages",
        type: "array",
        required: true,
        description: "Ordered array of { role, content } message turns.",
      },
      {
        name: "stream",
        type: "boolean",
        required: false,
        description: "Return real-time Server-Sent Events (SSE) token stream.",
      },
      {
        name: "voice",
        type: "boolean",
        required: false,
        description: "Include browser voice playback metadata alongside text output.",
      },
    ],
    defaultBody: {
      model: "gyra-1.0",
      stream: true,
      messages: [
        {
          role: "system",
          content: "You are Gyra, a concise AI infrastructure assistant.",
        },
        {
          role: "user",
          content:
            "Design a TypeScript webhook signature verifier using HMAC-SHA256 with replay protection.",
        },
      ],
    },
    presets: [
      {
        id: "webhook-ts",
        label: "HMAC Webhook Verifier",
        description: "Streaming TypeScript security code example",
        body: {
          model: "gyra-1.0",
          stream: true,
          messages: [
            { role: "system", content: "You are Gyra, a senior backend engineer." },
            {
              role: "user",
              content:
                "Design a TypeScript webhook signature verifier using HMAC-SHA256 with replay protection.",
            },
          ],
        },
      },
      {
        id: "supergyra-architecture",
        label: "SuperGyra 2.0 Reasoning",
        description: "Multi-region rate limiter design with deep reasoning",
        body: {
          model: "gyra-super2.0",
          stream: true,
          messages: [
            { role: "system", content: "Provide structured systems architecture tradeoffs." },
            {
              role: "user",
              content:
                "Compare token bucket vs sliding window log rate limiting across multi-region edge workers.",
            },
          ],
        },
      },
      {
        id: "json-extraction",
        label: "Structured JSON Extraction",
        description: "Non-streaming structured JSON output",
        body: {
          model: "gyra-1.0",
          stream: false,
          messages: [
            {
              role: "system",
              content:
                "Extract invoice fields and return strictly valid JSON with keys: vendor, currency, total, lineItems.",
            },
            {
              role: "user",
              content:
                "Invoice from Lagos Cloud Systems: 2x Dedicated GPU Node ($420 each) and 1x Edge Bandwidth Add-on ($85). Total due: $925 USD.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "video-generate",
    category: "ai",
    method: "POST",
    path: "/api/v1/video/generate",
    title: "Video Generation",
    shortDescription: "Queue 720p 24fps text-to-video or image-to-video job",
    availability: "live",
    authType: "session-token",
    requiredKeyPrefix: "gyra_",
    supportsStreaming: false,
    isAsyncJob: true,
    costUsd: 2.0,
    costLabel: "$2.00 / render",
    modelCategory: "video",
    docsPath: "/docs#video-generation",
    params: [
      {
        name: "prompt",
        type: "string",
        required: true,
        description: "Visual scene description (max 2,000 characters).",
        placeholder: "Slow architectural camera dolly across a sunlit brutalist data center...",
      },
      {
        name: "aspectRatio",
        type: "enum",
        required: false,
        options: ["16:9", "9:16"],
        description: "Output frame aspect ratio. Defaults to 16:9.",
      },
      {
        name: "imageBase64",
        type: "image-data-url",
        required: false,
        description: "Optional base64 data URI to animate as initial keyframe.",
      },
    ],
    defaultBody: {
      prompt:
        "Slow cinematic tracking shot of precision fiber-optic server racks in a minimalist architectural studio, cool rim lighting, 24fps",
      aspectRatio: "16:9",
    },
    presets: [
      {
        id: "product-reveal",
        label: "Hardware Studio Orbit",
        description: "16:9 studio product reveal",
        body: {
          prompt:
            "Slow cinematic tracking shot of precision fiber-optic server racks in a minimalist architectural studio, cool rim lighting, 24fps",
          aspectRatio: "16:9",
        },
      },
      {
        id: "vertical-reel",
        label: "Vertical City Dusk (9:16)",
        description: "9:16 portrait atmospheric sequence",
        body: {
          prompt:
            "Aerial twilight glide over Victoria Island Lagos waterfront skyline as glass towers illuminate against deep indigo dusk",
          aspectRatio: "9:16",
        },
      },
    ],
  },
  {
    id: "video-status",
    category: "ai",
    method: "GET",
    path: "/api/v1/video/status/{id}",
    title: "Video Job Status",
    shortDescription: "Poll asynchronous LTX-Video render status and output URL",
    availability: "live",
    authType: "api-key",
    requiredKeyPrefix: "gyra_",
    supportsStreaming: false,
    costUsd: 0,
    costLabel: "Free",
    docsPath: "/docs#video-status",
    params: [
      {
        name: "id",
        type: "string",
        required: true,
        description: "Request ID returned by POST /api/v1/video/generate.",
        placeholder: "req_video_01j9...",
      },
    ],
    defaultBody: {
      id: "req_ltx_720p_sample",
    },
    presets: [
      {
        id: "status-check",
        label: "Check Queue Job",
        description: "Inspect status of an existing video render job",
        body: { id: "req_ltx_720p_sample" },
      },
    ],
  },
  {
    id: "voice-synthesis",
    category: "ai",
    method: "POST",
    path: "/api/v1/voice",
    title: "Voice Synthesis",
    shortDescription: "Generate speech metadata payload for voice playback",
    availability: "live",
    authType: "session-token",
    requiredKeyPrefix: "gyra_",
    supportsStreaming: false,
    costUsd: 2.0,
    costLabel: "$2.00 / call",
    docsPath: "/docs#voice",
    params: [
      {
        name: "text",
        type: "string",
        required: true,
        description: "Text content to prepare for voice output.",
      },
      {
        name: "voiceId",
        type: "enum",
        required: false,
        options: ["gyra-arax", "gyra-nova", "gyra-orion"],
        description: "Preferred voice profile identifier.",
      },
    ],
    defaultBody: {
      text: "Welcome to the Gyra Developer Platform. Your real-time API pipeline is ready.",
      voiceId: "gyra-arax",
    },
    presets: [
      {
        id: "briefing",
        label: "Status Briefing",
        description: "Short status readout with Ara profile",
        body: {
          text: "Welcome to the Gyra Developer Platform. Your real-time API pipeline is ready.",
          voiceId: "gyra-arax",
        },
      },
    ],
  },

  // Media API — Live verified endpoints
  {
    id: "music-search",
    category: "media",
    method: "POST",
    path: "/api/v1/media/music/search",
    title: "Music Search",
    shortDescription: "Search Spotify tracks, artists, and albums with cover art & previews",
    availability: "live",
    authType: "api-key",
    requiredKeyPrefix: "gyramedia_",
    supportsStreaming: false,
    costUsd: 0.9,
    costLabel: "$0.90 / req",
    docsPath: "/docs/media#music-search",
    params: [
      {
        name: "q",
        type: "string",
        required: true,
        description: "Search query for track, artist, or album.",
        placeholder: "Wizkid Essence",
      },
      {
        name: "type",
        type: "enum",
        required: false,
        options: ["track", "artist", "album"],
        description: "Entity type to return from Spotify catalog.",
      },
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Result count (1–20). Defaults to 10.",
      },
    ],
    defaultBody: {
      q: "Wizkid Essence",
      type: "track",
      limit: 5,
    },
    presets: [
      {
        id: "track-search",
        label: "Track Search",
        description: "Return top 5 Spotify tracks with cover art and preview URLs",
        body: { q: "Wizkid Essence", type: "track", limit: 5 },
      },
      {
        id: "artist-search",
        label: "Artist Lookup",
        description: "Return artist popularity, followers, and genres",
        body: { q: "Burna Boy", type: "artist", limit: 3 },
      },
    ],
  },
  {
    id: "youtube-transcript",
    category: "media",
    method: "POST",
    path: "/api/v1/media/youtube/transcript",
    title: "YouTube Transcript",
    shortDescription: "Extract public caption segments with timestamps",
    availability: "live",
    authType: "api-key",
    requiredKeyPrefix: "gyramedia_",
    supportsStreaming: false,
    costUsd: 0.9,
    costLabel: "$0.90 / req",
    docsPath: "/docs/media#youtube-transcript",
    params: [
      {
        name: "url",
        type: "string",
        required: true,
        description: "Full public YouTube video URL.",
        placeholder: "https://www.youtube.com/watch?v=...",
      },
    ],
    defaultBody: {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    presets: [
      {
        id: "yt-default",
        label: "Standard Video Captions",
        description: "Fetch timestamped transcript segments",
        body: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      },
    ],
  },
  {
    id: "youtube-metadata",
    category: "media",
    method: "POST",
    path: "/api/v1/media/youtube/metadata",
    title: "YouTube Metadata",
    shortDescription: "Fetch title, channel author, dimensions, and thumbnail",
    availability: "live",
    authType: "api-key",
    requiredKeyPrefix: "gyramedia_",
    supportsStreaming: false,
    costUsd: 0.9,
    costLabel: "$0.90 / req",
    docsPath: "/docs/media#youtube-metadata",
    params: [
      {
        name: "url",
        type: "string",
        required: true,
        description: "Public YouTube video URL.",
      },
    ],
    defaultBody: {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    presets: [
      {
        id: "yt-meta",
        label: "Inspect Video Metadata",
        description: "Retrieve oEmbed metadata and thumbnail asset",
        body: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
      },
    ],
  },
  {
    id: "tiktok-metadata",
    category: "media",
    method: "POST",
    path: "/api/v1/media/tiktok/metadata",
    title: "TikTok Metadata",
    shortDescription: "Retrieve TikTok title, creator handle, and cover thumbnail",
    availability: "live",
    authType: "api-key",
    requiredKeyPrefix: "gyramedia_",
    supportsStreaming: false,
    costUsd: 0.9,
    costLabel: "$0.90 / req",
    docsPath: "/docs/media#tiktok-metadata",
    params: [
      {
        name: "url",
        type: "string",
        required: true,
        description: "Public TikTok video URL.",
      },
    ],
    defaultBody: {
      url: "https://www.tiktok.com/@tiktok/video/7010000000000000000",
    },
    presets: [
      {
        id: "tt-meta",
        label: "TikTok oEmbed Lookup",
        description: "Extract creator info and preview frame",
        body: { url: "https://www.tiktok.com/@tiktok/video/7010000000000000000" },
      },
    ],
  },
  {
    id: "media-transcribe",
    category: "media",
    method: "POST",
    path: "/api/v1/media/transcribe",
    title: "Audio Transcription",
    shortDescription: "Transcribe audio streams or URLs via Whisper Large v3",
    availability: "live",
    authType: "api-key",
    requiredKeyPrefix: "gyramedia_",
    supportsStreaming: false,
    costUsd: 0.9,
    costLabel: "$0.90 / req",
    modelCategory: "transcription",
    docsPath: "/docs/media#transcribe",
    params: [
      {
        name: "audioUrl",
        type: "string",
        required: true,
        description: "Publicly accessible audio file URL (MP3, WAV, M4A, OGG).",
      },
      {
        name: "language",
        type: "string",
        required: false,
        description: "Optional ISO-639-1 language hint (e.g. en, fr, yo).",
      },
    ],
    defaultBody: {
      audioUrl: "https://example.com/sample-briefing.mp3",
      language: "en",
    },
    presets: [
      {
        id: "whisper-en",
        label: "English Audio URL",
        description: "Transcribe remote MP3 audio with Whisper v3",
        body: { audioUrl: "https://example.com/sample-briefing.mp3", language: "en" },
      },
    ],
  },

  // Network API — Explicitly unavailable / planned (NOT executable)
  {
    id: "network-ip",
    category: "network",
    method: "GET",
    path: "/api/v1/network/ip",
    title: "IP Geolocation",
    shortDescription: "ASN, ISP, country, and threat telemetry lookup",
    availability: "unavailable",
    authType: "api-key",
    requiredKeyPrefix: "gyranet_",
    supportsStreaming: false,
    costUsd: 0.05,
    costLabel: "Planned",
    docsPath: "/docs/network",
    params: [],
    defaultBody: {},
    presets: [],
  },
  {
    id: "network-dns",
    category: "network",
    method: "GET",
    path: "/api/v1/network/dns",
    title: "DNS Inspector",
    shortDescription: "Query A, AAAA, MX, TXT, NS, and CNAME records",
    availability: "unavailable",
    authType: "api-key",
    requiredKeyPrefix: "gyranet_",
    supportsStreaming: false,
    costUsd: 0.05,
    costLabel: "Planned",
    docsPath: "/docs/network",
    params: [],
    defaultBody: {},
    presets: [],
  },

  // Utilities API — Explicitly unavailable / planned (NOT executable)
  {
    id: "utils-convert",
    category: "utilities",
    method: "POST",
    path: "/api/v1/utils/convert",
    title: "Document Converter",
    shortDescription: "Programmatic PDF, DOCX, and XLSX extraction & conversion",
    availability: "unavailable",
    authType: "api-key",
    requiredKeyPrefix: "gyrautils_",
    supportsStreaming: false,
    costUsd: 0.02,
    costLabel: "Planned",
    docsPath: "/docs/utilities",
    params: [],
    defaultBody: {},
    presets: [],
  },
];

export function getCategoryById(id: ApiCategoryId): GyraCategorySpec {
  return GYRA_CATEGORIES.find((c) => c.id === id) ?? GYRA_CATEGORIES[0];
}

export function getEndpointsByCategory(category: ApiCategoryId): GyraEndpointSpec[] {
  return GYRA_ENDPOINTS.filter((ep) => ep.category === category);
}

export function getEndpointById(id: string): GyraEndpointSpec {
  return GYRA_ENDPOINTS.find((ep) => ep.id === id) ?? GYRA_ENDPOINTS[0];
}
