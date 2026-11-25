import type { ActivityRecord, ApiKeyRecord, WalletBalances } from "./analytics";

/**
 * Explicitly labeled demonstration dataset for previewing analytics, key flows,
 * and rich response inspectors when no live Gyra account session is connected.
 * Never presented as real customer usage.
 */
export const DEMO_WALLETS: WalletBalances = {
  ai: 42.5,
  media: 18.9,
  network: 0,
  utilities: 0,
};

export const DEMO_API_KEYS: ApiKeyRecord[] = [
  {
    id: "key_demo_prod_ai",
    name: "Production Inference Gateway",
    category: "ai",
    keyPreview: "gyra_9f3k2m8x1q••••••••a4c9",
    active: true,
    created_at: new Date(Date.now() - 18 * 86_400_000).toISOString(),
    last_used: new Date(Date.now() - 4 * 60_000).toISOString(),
    request_count: 1482,
  },
  {
    id: "key_demo_media_worker",
    name: "Content Pipeline Media Worker",
    category: "media",
    keyPreview: "gyramedia_7p2v••••••••e81b",
    active: true,
    created_at: new Date(Date.now() - 11 * 86_400_000).toISOString(),
    last_used: new Date(Date.now() - 22 * 60_000).toISOString(),
    request_count: 346,
  },
  {
    id: "key_demo_staging_ai",
    name: "Staging Evaluation Runner",
    category: "ai",
    keyPreview: "gyra_4d8n5t0w3z••••••••91f0",
    active: true,
    created_at: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    last_used: new Date(Date.now() - 140 * 60_000).toISOString(),
    request_count: 194,
  },
  {
    id: "key_demo_revoked",
    name: "Legacy Webhook Prototype",
    category: "ai",
    keyPreview: "gyra_1x6q9r2p8m••••••••30d2",
    active: false,
    created_at: new Date(Date.now() - 29 * 86_400_000).toISOString(),
    last_used: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    request_count: 87,
  },
];

export function buildDemoActivity(nowMs: number = Date.now()): ActivityRecord[] {
  const templates: Array<{
    endpoint: string;
    method: "GET" | "POST";
    category: "ai" | "media";
    cost: number;
    baseLatency: number;
    model?: string;
    tokens?: number;
    reqPreview: string;
    resPreview: string;
  }> = [
    {
      endpoint: "/api/v1/chat",
      method: "POST",
      category: "ai",
      cost: 0,
      baseLatency: 215,
      model: "gyra-1.0",
      tokens: 640,
      reqPreview: JSON.stringify({
        model: "gyra-1.0",
        stream: true,
        temperature: 0.2,
        messages: [
          { role: "system", content: "You are Gyra, a concise AI infrastructure assistant." },
          { role: "user", content: "Summarize webhook retry policy with exponential backoff." },
        ],
      }),
      resPreview: JSON.stringify({
        id: "chatcmpl-9a81f",
        object: "chat.completion",
        model: "gyra-1.0",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant",
              content: "Use capped exponential backoff with full jitter (1s, 2s, 4s, 8s, max 60s) and stop retrying on 4xx client errors except 429.",
            },
          },
        ],
        usage: { prompt_tokens: 48, completion_tokens: 592, total_tokens: 640 },
      }),
    },
    {
      endpoint: "/api/v1/chat",
      method: "POST",
      category: "ai",
      cost: 0,
      baseLatency: 480,
      model: "gyra-super2.0",
      tokens: 1420,
      reqPreview: JSON.stringify({
        model: "gyra-super2.0",
        stream: true,
        messages: [
          { role: "system", content: "Act as a PostgreSQL performance engineer." },
          { role: "user", content: "Audit composite B-tree index selectivity on (tenant_id, created_at DESC)." },
        ],
      }),
      resPreview: JSON.stringify({
        id: "chatcmpl-4b10c",
        object: "chat.completion",
        model: "gyra-super2.0",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant",
              content: "Leading with tenant_id satisfies equality predicates and preserves reverse-chronological scan order without an extra Sort node.",
            },
          },
        ],
        usage: { prompt_tokens: 62, completion_tokens: 1358, total_tokens: 1420 },
      }),
    },
    {
      endpoint: "/api/v1/media/music/search",
      method: "POST",
      category: "media",
      cost: 0.9,
      baseLatency: 310,
      reqPreview: JSON.stringify({
        q: "Wizkid Essence",
        type: "track",
        limit: 5,
      }),
      resPreview: JSON.stringify({
        query: "Wizkid Essence",
        type: "track",
        count: 5,
        balanceAfter: 18.9,
        results: [
          {
            id: "5FG7Tl93LdH117jEKYl3Cm",
            name: "Essence (feat. Tems)",
            artists: ["Wizkid", "Tems"],
            album: "Made In Lagos",
            duration_ms: 248040,
          },
        ],
      }),
    },
    {
      endpoint: "/api/v1/media/youtube/transcript",
      method: "POST",
      category: "media",
      cost: 0.9,
      baseLatency: 620,
      reqPreview: JSON.stringify({
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        lang: "en",
      }),
      resPreview: JSON.stringify({
        videoId: "dQw4w9WgXcQ",
        language: "en",
        segmentsCount: 48,
        balanceAfter: 19.8,
        preview: "00:00 Welcome to the engineering walkthrough on distributed inference pipelines...",
      }),
    },
    {
      endpoint: "/api/v1/video/generate",
      method: "POST",
      category: "ai",
      cost: 2.0,
      baseLatency: 840,
      model: "gyra-video-1.0",
      reqPreview: JSON.stringify({
        prompt: "Architectural fiber-optic server corridor with cool volumetric lighting, slow dolly forward",
        aspectRatio: "16:9",
      }),
      resPreview: JSON.stringify({
        requestId: "req_vid_88a1c",
        status: "queued",
        resolution: "720p",
        fps: 24,
        costUsd: 2.0,
        balanceAfter: 40.5,
      }),
    },
    {
      endpoint: "/api/v1/media/tiktok/metadata",
      method: "POST",
      category: "media",
      cost: 0.9,
      baseLatency: 290,
      reqPreview: JSON.stringify({
        url: "https://www.tiktok.com/@tiktok/video/7010000000000000000",
      }),
      resPreview: JSON.stringify({
        title: "Creator highlight — studio workflow breakdown",
        author_name: "tiktok",
        provider_name: "TikTok",
        width: 720,
        height: 1280,
        balanceAfter: 18.0,
      }),
    },
  ];

  const records: ActivityRecord[] = [];
  // Deterministic pseudo-random helper so renders are consistent & flicker-free
  let seed = 4219;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // Generate realistic organic diurnal traffic across 1H, 24H, 7D, and 30D windows
  const scheduleOffsetsMin: number[] = [];
  // Last 1H: 14 organic requests
  for (let i = 0; i < 14; i++) {
    scheduleOffsetsMin.push(Math.max(1, Math.round(i * 4.1 + nextRand() * 3)));
  }
  // Last 24H (hours 1..23): organic diurnal sine-modulated curve (4 to 15 req/hour)
  for (let h = 1; h < 24; h++) {
    const wave = Math.sin(((h + 3) / 24) * Math.PI * 2) * 0.5 + 0.5;
    const count = Math.round(4 + wave * 9 + nextRand() * 3);
    for (let j = 0; j < count; j++) {
      scheduleOffsetsMin.push(h * 60 + Math.floor(nextRand() * 58));
    }
  }
  // Prior 24H (hours 24..47): slightly lower diurnal wave so 24H delta is realistic (~+12% to +20%)
  for (let h = 24; h < 48; h++) {
    const wave = Math.sin(((h + 2) / 24) * Math.PI * 2) * 0.5 + 0.5;
    const count = Math.round(3.5 + wave * 7.5 + nextRand() * 2.5);
    for (let j = 0; j < count; j++) {
      scheduleOffsetsMin.push(h * 60 + Math.floor(nextRand() * 58));
    }
  }
  // Days 3..7: balanced daily traffic
  for (let d = 2; d < 7; d++) {
    const dayCount = Math.round(110 + Math.sin(d * 1.1) * 24 + nextRand() * 20);
    for (let j = 0; j < dayCount; j++) {
      scheduleOffsetsMin.push(d * 1440 + Math.floor(nextRand() * 1420));
    }
  }
  // Days 8..30: steady 30D baseline traffic
  for (let d = 7; d < 30; d++) {
    const dayCount = Math.round(68 + Math.cos(d * 0.6) * 18 + nextRand() * 16);
    for (let j = 0; j < dayCount; j++) {
      scheduleOffsetsMin.push(d * 1440 + Math.floor(nextRand() * 1420));
    }
  }

  scheduleOffsetsMin.forEach((minsAgo, idx) => {
    const r = nextRand();
    const tplIdx =
      r < 0.42 ? 0 : r < 0.65 ? 1 : r < 0.78 ? 2 : r < 0.88 ? 3 : r < 0.94 ? 4 : 5;
    const tpl = templates[tplIdx];
    const errRoll = nextRand();
    const status_code = errRoll < 0.935 ? 200 : errRoll < 0.97 ? 429 : errRoll < 0.99 ? 401 : 502;
    const latencyJitter = Math.round((nextRand() - 0.3) * 140);
    const latency_ms = Math.max(85, tpl.baseLatency + latencyJitter);
    const createdAt = new Date(nowMs - minsAgo * 60_000).toISOString();

    records.push({
      id: `demo_act_${idx + 1}`,
      request_id: `req_${(100000 + idx * 7919).toString(36)}`,
      endpoint: tpl.endpoint,
      method: tpl.method,
      category: tpl.category,
      status_code,
      latency_ms,
      cost_usd: status_code === 200 ? tpl.cost : 0,
      tokens_total:
        status_code === 200 && tpl.tokens
          ? Math.round(tpl.tokens * (0.65 + nextRand() * 0.8))
          : undefined,
      model: tpl.model,
      created_at: createdAt,
      request_preview: tpl.reqPreview,
      response_preview:
        status_code === 200
          ? tpl.resPreview
          : JSON.stringify({
              error: {
                code:
                  status_code === 429
                    ? "rate_limit_exceeded"
                    : status_code === 401
                      ? "invalid_api_key"
                      : "upstream_timeout",
                message:
                  status_code === 429
                    ? "Rate limit reached for current minute window."
                    : status_code === 401
                      ? "Invalid or revoked Bearer credential."
                      : "Upstream inference provider timed out.",
              },
            }),
    });
  });

  return records.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
}

export const DEMO_SAMPLE_RESPONSES: Record<
  string,
  { status: number; latencyMs: number; headers: Record<string, string>; body: unknown }
> = {
  "chat-completions": {
    status: 200,
    latencyMs: 312,
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_sample_chat_01",
      "x-gyra-model": "gyra-1.0",
    },
    body: {
      id: "chatcmpl-sample-94a1",
      object: "chat.completion",
      model: "gyra-1.0",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              "### HMAC-SHA256 Webhook Verifier (TypeScript)\n\nUse constant-time digest comparison and enforce a strict timestamp skew window to block replay attacks:\n\n```ts\nimport { createHmac, timingSafeEqual } from \"node:crypto\";\n\nconst MAX_SKEW_SEC = 300;\n\nexport function verifyWebhookSignature(\n  rawBody: string,\n  signatureHex: string,\n  timestampSec: number,\n  secret: string\n): boolean {\n  const now = Math.floor(Date.now() / 1000);\n  if (Math.abs(now - timestampSec) > MAX_SKEW_SEC) return false;\n\n  const expected = createHmac(\"sha256\", secret)\n    .update(`${timestampSec}.${rawBody}`)\n    .digest(\"hex\");\n\n  const a = Buffer.from(expected, \"hex\");\n  const b = Buffer.from(signatureHex, \"hex\");\n  return a.length === b.length && timingSafeEqual(a, b);\n}\n```\n\n**Key safeguards:**\n- Bind the signed payload to `${timestamp}.${rawBody}` so attackers cannot tamper with timestamps.\n- Compare fixed-length buffers via `timingSafeEqual` to eliminate timing side channels.",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 46,
        completion_tokens: 218,
        total_tokens: 264,
      },
    },
  },
  "video-generate": {
    status: 200,
    latencyMs: 685,
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_sample_vid_02",
    },
    body: {
      requestId: "req_vid_720p_sample",
      status: "completed",
      model: "gyra-video-1.0",
      resolution: "720p",
      fps: 24,
      aspectRatio: "16:9",
      costUsd: 2.0,
      balanceAfter: 40.5,
      videoUrl: "",
      note: "Sample preview response — execute with a live SuperGyra session token to queue a real 720p MP4 render.",
    },
  },
  "video-status": {
    status: 200,
    latencyMs: 184,
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_sample_status_03",
    },
    body: {
      requestId: "req_vid_720p_sample",
      status: "in_progress",
      note: "Asynchronous video render queue polling state (sample preview).",
    },
  },
  "voice-synthesis": {
    status: 200,
    latencyMs: 142,
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_sample_voice_04",
    },
    body: {
      text: "Welcome to the Gyra Developer Platform. Your real-time API pipeline is ready.",
      voiceId: "gyra-arax",
      balanceAfter: 40.5,
    },
  },
  "music-search": {
    status: 200,
    latencyMs: 288,
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_sample_music_05",
    },
    body: {
      query: "Wizkid Essence",
      type: "track",
      count: 3,
      balanceAfter: 18.0,
      results: [
        {
          id: "5FG7Tl93LdH117jEKYl3Cm",
          name: "Essence (feat. Tems)",
          artists: "Wizkid, Tems",
          album: "Made In Lagos",
          coverArt: null,
          previewUrl: null,
          durationMs: 248040,
          externalUrl: "https://open.spotify.com/track/5FG7Tl93LdH117jEKYl3Cm",
        },
        {
          id: "1mSxbLW7fKABfeY4lGpg0E",
          name: "Essence (feat. Justin Bieber & Tems)",
          artists: "Wizkid, Justin Bieber, Tems",
          album: "Made In Lagos: Deluxe Edition",
          coverArt: null,
          previewUrl: null,
          durationMs: 263512,
          externalUrl: "https://open.spotify.com/track/1mSxbLW7fKABfeY4lGpg0E",
        },
        {
          id: "3k79jB4aGmMDUQzEwa46Rz",
          name: "Ginger (feat. Burna Boy)",
          artists: "Wizkid, Burna Boy",
          album: "Made In Lagos",
          coverArt: null,
          previewUrl: null,
          durationMs: 196210,
          externalUrl: "https://open.spotify.com/track/3k79jB4aGmMDUQzEwa46Rz",
        },
      ],
    },
  },
  "youtube-transcript": {
    status: 200,
    latencyMs: 492,
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_sample_yt_06",
    },
    body: {
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      language: "en",
      balanceAfter: 18.0,
      segments: [
        { offset: 0, duration: 4200, text: "Opening intro and system architecture walkthrough." },
        { offset: 4200, duration: 5100, text: "Each request is authenticated with scoped Bearer credentials." },
        { offset: 9300, duration: 4800, text: "Streaming responses emit incremental chunks over Server-Sent Events." },
      ],
    },
  },
  "youtube-metadata": {
    status: 200,
    latencyMs: 244,
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_sample_ytm_07",
    },
    body: {
      title: "Building Low-Latency AI Infrastructure",
      author_name: "Gyra Engineering",
      provider_name: "YouTube",
      width: 1280,
      height: 720,
      balanceAfter: 18.0,
    },
  },
  "tiktok-metadata": {
    status: 200,
    latencyMs: 265,
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_sample_tt_08",
    },
    body: {
      title: "Edge inference benchmarks in 60 seconds",
      author_name: "gyraai",
      provider_name: "TikTok",
      width: 576,
      height: 1024,
      balanceAfter: 18.0,
    },
  },
  "media-transcribe": {
    status: 200,
    latencyMs: 710,
    headers: {
      "content-type": "application/json",
      "x-request-id": "req_sample_tr_09",
    },
    body: {
      model: "whisper-large-v3",
      language: "en",
      text: "Deployment verified across edge nodes. All primary inference and media extraction endpoints are healthy.",
      balanceAfter: 18.0,
    },
  },
};
