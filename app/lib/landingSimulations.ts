export type HeroModality = "chat" | "image" | "video";
export type ChatModelId = "gyra-1.0" | "gyra-super2.0";
export type ImageWorkbenchMode = "edit" | "generate";
export type VideoWorkbenchMode = "text-to-video" | "image-to-video";
export type VideoAspect = "16:9" | "9:16";
export type ApiEndpointId = "chat" | "video" | "media";
export type CodeLanguage = "curl" | "typescript" | "python";

export interface AgentStep {
  id: string;
  order: string;
  name: string;
  role: string;
  durationSec: number;
  summary: string;
}

export interface ChatScenario {
  id: string;
  label: string;
  prompt: string;
  usesPipeline: boolean;
  agents: AgentStep[];
  responseByModel: Record<
    ChatModelId,
    {
      latencyLabel: string;
      reasoningNote: string;
      output: string;
    }
  >;
}

export interface ImagePreset {
  id: string;
  title: string;
  category: string;
  imageSrc: string;
  prompt: string;
  resolution: string;
  modelLabel: string;
  aspect: string;
}

export interface VideoTemplateItem {
  id: string;
  label: string;
  category: string;
  videoSrc: string;
  posterSrc: string;
  referenceStillSrc: string;
  prompt: string;
  durationLabel: string;
  specs: string;
}

export interface ArchitectureLayer {
  id: string;
  index: string;
  title: string;
  subtitle: string;
  nodes: { label: string; detail: string }[];
  description: string;
}

export interface ApiExampleSpec {
  id: ApiEndpointId;
  label: string;
  method: "POST";
  endpoint: string;
  authNote: string;
  snippets: Record<CodeLanguage, string>;
  sampleResponse: string;
}

export const CHAT_MODELS: Record<
  ChatModelId,
  { id: ChatModelId; name: string; tier: string; description: string }
> = {
  "gyra-1.0": {
    id: "gyra-1.0",
    name: "Gyra 1.0",
    tier: "Standard",
    description: "Fast daily reasoning, conversation, file analysis, and web grounding.",
  },
  "gyra-super2.0": {
    id: "gyra-super2.0",
    name: "SuperGyra 2.0",
    tier: "Deep Reasoning",
    description: "Extended multi-step logic, deep architectural synthesis, and unlimited streaming.",
  },
};

export const CHAT_SCENARIOS: readonly ChatScenario[] = [
  {
    id: "webhook",
    label: "Build a rate-limited webhook",
    prompt: "Build a TypeScript webhook endpoint with HMAC signature verification and per-IP rate limiting.",
    usesPipeline: true,
    agents: [
      {
        id: "atlas",
        order: "01",
        name: "Atlas",
        role: "Research",
        durationSec: 0.5,
        summary: "Reviewed Web Crypto timing-safe HMAC verification and Edge-compatible token bucket headers.",
      },
      {
        id: "orion",
        order: "02",
        name: "Orion",
        role: "Analysis",
        durationSec: 0.4,
        summary: "Identified replay-attack risk, raw body digest requirement, and 429 Retry-After contract.",
      },
      {
        id: "architect",
        order: "03",
        name: "Architect",
        role: "System Design",
        durationSec: 0.6,
        summary: "Structured route handler -> raw buffer signature check -> sliding window store -> typed dispatch.",
      },
      {
        id: "forge",
        order: "04",
        name: "Forge",
        role: "Implementation",
        durationSec: 1.1,
        summary: "Generated strict TypeScript Next.js App Router POST handler with constant-time comparison.",
      },
      {
        id: "sentinel",
        order: "05",
        name: "Sentinel",
        role: "Security QA",
        durationSec: 0.5,
        summary: "Verified timingSafeEqual length guard, 5-minute timestamp skew check, and raw body parsing.",
      },
      {
        id: "mentor",
        order: "06",
        name: "Mentor",
        role: "Delivery",
        durationSec: 0.3,
        summary: "Attached environment setup instructions and local curl verification test.",
      },
    ],
    responseByModel: {
      "gyra-1.0": {
        latencyLabel: "3.4s · 6 agents",
        reasoningNote: "Standard pipeline: raw body read before JSON parse, SHA-256 HMAC check, fixed-window limiter.",
        output: `import { createHmac, timingSafeEqual } from "node:crypto";

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-gyra-signature") ?? "";
  const expected = createHmac("sha256", process.env.WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  return Response.json({ received: true }, { status: 200 });
}`,
      },
      "gyra-super2.0": {
        latencyLabel: "4.8s · 6 agents · Deep Reasoner",
        reasoningNote:
          "SuperGyra 2.0 enforces timestamped signature payloads (t + '.' + body) to block replay attacks alongside constant-time buffer checks and IP + key bucket isolation.",
        output: `import { createHmac, timingSafeEqual } from "node:crypto";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_SKEW_MS = 5 * 60 * 1000;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const quota = checkRateLimit(\`webhook:\${ip}\`, { limit: 60, windowMs: 60_000 });
  if (!quota.allowed) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(quota.retryAfterSec) } }
    );
  }

  const timestamp = Number(req.headers.get("x-webhook-ts"));
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > MAX_SKEW_MS) {
    return Response.json({ error: "stale_timestamp" }, { status: 401 });
  }

  const rawBody = await req.text();
  const expected = createHmac("sha256", process.env.WEBHOOK_SECRET!)
    .update(\`\${timestamp}.\${rawBody}\`)
    .digest();
  const provided = Buffer.from(req.headers.get("x-webhook-sig") ?? "", "hex");

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return Response.json({ error: "invalid_signature" }, { status: 401 });
  }

  // Sentinel verified: replay window bounded, constant-time compare guarded
  return Response.json({ ok: true, eventId: JSON.parse(rawBody).id });
}`,
      },
    },
  },
  {
    id: "rag-audit",
    label: "Analyze an uploaded PDF spec",
    prompt: "Compare the SLA commitments and API rate caps across our attached Q3 infrastructure brief.",
    usesPipeline: false,
    agents: [
      {
        id: "gyra-reader",
        order: "01",
        name: "File Reader",
        role: "Document Grounding",
        durationSec: 0.6,
        summary: "Extracted 14 pages from Q3-Infrastructure-Brief.pdf and indexed SLA + quota tables.",
      },
      {
        id: "gyra-reasoner",
        order: "02",
        name: "Gyra Reasoner",
        role: "Synthesis",
        durationSec: 0.9,
        summary: "Cross-referenced burst limits against webhook retry intervals and flagged one mismatch.",
      },
    ],
    responseByModel: {
      "gyra-1.0": {
        latencyLabel: "1.5s · File Grounded",
        reasoningNote: "Direct extraction from Section 4.2 (Rate Caps) and Section 6.1 (Availability Targets).",
        output: `Key findings from Q3-Infrastructure-Brief.pdf:

1. Rate Caps:
   - Standard tier: 60 req/min per IP, 100 req/min per API key.
   - Media endpoints: metered per request with monthly free allowance.

2. Operational Gap Flagged (Page 11):
   - Webhook retry backoff retries 5 times in 15 seconds, which can exceed burst quotas during batch imports. Recommend exponential backoff (2s -> 4s -> 8s -> 16s).`,
      },
      "gyra-super2.0": {
        latencyLabel: "2.3s · Deep File Audit",
        reasoningNote:
          "Cross-checked every numeric table in Sections 4, 6, and Appendix B for policy contradictions and billing edge cases.",
        output: `Structured Audit — Q3-Infrastructure-Brief.pdf

| Domain            | Documented Limit        | Risk / Contradiction Identified                   |
|-------------------|-------------------------|---------------------------------------------------|
| Chat API (/v1)    | 100 req/min per key     | Compatible with SSE streaming                     |
| Video Queue       | 5 req/min per IP        | Needs idempotency key to prevent duplicate debits |
| Credit Deduction  | Pre-queue debit + refund| Verified safe on upstream queue rejection         |

Recommended Action:
Introduce an optional Idempotency-Key header on POST /api/v1/video/generate so client retries during network drops return the existing requestId rather than submitting a second render.`,
      },
    },
  },
  {
    id: "architecture-plan",
    label: "Design a multi-region queue",
    prompt: "Outline a resilient async media rendering queue that safely handles credit deductions and upstream failures.",
    usesPipeline: true,
    agents: [
      {
        id: "atlas",
        order: "01",
        name: "Atlas",
        role: "Research",
        durationSec: 0.4,
        summary: "Benchmarked ledger-first reservation patterns for asynchronous GPU inference queues.",
      },
      {
        id: "orion",
        order: "02",
        name: "Orion",
        role: "Analysis",
        durationSec: 0.4,
        summary: "Separated synchronous job submission from long-running status polling and credit reconciliation.",
      },
      {
        id: "architect",
        order: "03",
        name: "Architect",
        role: "System Design",
        durationSec: 0.7,
        summary: "Defined state machine: RESERVED -> QUEUED -> IN_PROGRESS -> COMPLETED | REFUNDED.",
      },
      {
        id: "forge",
        order: "04",
        name: "Forge",
        role: "Implementation",
        durationSec: 0.9,
        summary: "Drafted atomic debit ledger transaction and webhook/poller reconciliation handler.",
      },
      {
        id: "sentinel",
        order: "05",
        name: "Sentinel",
        role: "Security QA",
        durationSec: 0.4,
        summary: "Checked double-refund prevention via unique job_id constraint on refund ledger entries.",
      },
      {
        id: "mentor",
        order: "06",
        name: "Mentor",
        role: "Delivery",
        durationSec: 0.3,
        summary: "Summarized rollout checklist and monitoring alerts for stuck queued jobs.",
      },
    ],
    responseByModel: {
      "gyra-1.0": {
        latencyLabel: "3.1s · 6 agents",
        reasoningNote: "Atomic debit before upstream dispatch, automatic refund in catch block on queue error.",
        output: `Resilient Media Queue Blueprint:

1. Validate auth, subscription tier, and credit balance server-side.
2. Reserve/deduct credit atomically in the ledger with a unique job reference.
3. Submit job to upstream inference queue -> persist request_id as status="queued".
4. Poll status endpoint or receive callback -> update record to "completed" with media URL.
5. On terminal failure -> issue idempotent credit refund linked to the original job_id.`,
      },
      "gyra-super2.0": {
        latencyLabel: "4.1s · 6 agents · Deep Reasoner",
        reasoningNote: "Models both synchronous submission failures and delayed worker timeouts via a reconciliation sweeper.",
        output: `Ledger-Safe Async Render State Machine

States:
  RESERVED  -> Credit locked inside DB transaction (prevents concurrent overdraft)
  QUEUED    -> Upstream request_id stored; client receives 202 + requestId
  COMPLETED -> Asset persisted; reservation finalized
  FAILED    -> Compensating ledger entry credited once (UNIQUE(job_id, kind='refund'))

Recovery Invariant:
A background sweeper marks any job stuck in QUEUED > 15m as TIMED_OUT, queries upstream status once to prevent false refunds, and reconciles the wallet deterministically.`,
      },
    },
  },
] as const;

export const IMAGE_EDIT_SHOWCASE = {
  beforeSrc: "/showcase/edit-before.webp",
  afterSrc: "/showcase/edit-after.webp",
  beforeLabel: "Original · Overcast Daylight",
  afterLabel: "Gyra Pro Ultra · Tungsten Dusk",
  prompt:
    "Shift exterior light to blue-hour dusk, turn on the articulated desk lamp with warm 2700K tungsten falloff across the steel table, and deepen concrete shadows — keep every object and angle identical.",
  modelLabel: "Gyra Pro Ultra (Image-to-Image)",
  resolution: "1440 × 1080",
} as const;

export const IMAGE_PRESETS: readonly ImagePreset[] = [
  {
    id: "muse",
    title: "Editorial Beauty Muse",
    category: "Editorial",
    imageSrc: "/showcase/muse-hd.webp",
    prompt:
      "Hasselblad 100MP medium-format beauty editorial portrait in tailored obsidian silk, natural luminous skin texture, soft golden-hour window key light with cool slate architectural falloff, 85mm f/2.0.",
    resolution: "1920 × 1440 HD",
    modelLabel: "Gyra Pro Ultra",
    aspect: "4:3",
  },
  {
    id: "product",
    title: "Industrial Acoustic Monitor",
    category: "Hardware",
    imageSrc: "/showcase/hardware-hd.webp",
    prompt:
      "Ultra-sharp macro product photography of a precision-milled matte obsidian anodized aluminum audio monitor with chamfered brushed titanium dial resting on honed volcanic basalt, steel-blue rim light.",
    resolution: "1920 × 1440 HD",
    modelLabel: "Gyra Flux",
    aspect: "4:3",
  },
  {
    id: "fragrance",
    title: "Smoked Crystal Fragrance",
    category: "Luxury Macro",
    imageSrc: "/showcase/fragrance-hd.webp",
    prompt:
      "Phase One 100MP macro studio still life of a hand-cut smoked glass fragrance flacon with machined titanium cap on wet volcanic basalt, warm amber caustics and micro water droplets.",
    resolution: "1920 × 1440 HD",
    modelLabel: "Gyra Pro Ultra",
    aspect: "4:3",
  },
  {
    id: "kyoto",
    title: "Kyoto Rain Pavilion",
    category: "Architecture",
    imageSrc: "/showcase/kyoto-hd.webp",
    prompt:
      "Leica SL2 35mm architectural photograph of a charred-cedar and glass pavilion mirroring across a black reflecting pool in Kyoto at blue-hour dusk after rain, warm 2700K interior glow.",
    resolution: "1920 × 1440 HD",
    modelLabel: "Gyra Pro Ultra",
    aspect: "4:3",
  },
  {
    id: "alpine",
    title: "Alpine Titanium Hypercar",
    category: "Automotive",
    imageSrc: "/showcase/alpine-hd.webp",
    prompt:
      "Editorial twilight automotive study of a sculpted matte liquid-titanium grand tourer on a rain-slicked Swiss alpine pass, mist over granite peaks and crisp wet-asphalt light reflections.",
    resolution: "1920 × 1440 HD",
    modelLabel: "Gyra Pro Ultra",
    aspect: "4:3",
  },
  {
    id: "architecture",
    title: "Coastal Concrete Pavilion",
    category: "Architecture",
    imageSrc: "/showcase/pavilion-hd.webp",
    prompt:
      "Monolithic cantilevered poured-concrete pavilion hovering above still dark ocean water at blue-hour dusk, warm 2700K recessed soffit lighting reflecting softly across calm ripples, 28mm tilt-shift frame.",
    resolution: "1920 × 1440 HD",
    modelLabel: "Gyra Flux",
    aspect: "4:3",
  },
  {
    id: "horology",
    title: "Titanium Tourbillon Calibre",
    category: "Horology",
    imageSrc: "/showcase/horology-hd.webp",
    prompt:
      "Open-worked brushed grade-5 titanium mechanical tourbillon wristwatch resting on honed dark slate, exposed sapphire gear train and blued steel screws, cool steel-blue rim highlight.",
    resolution: "1920 × 1440 HD",
    modelLabel: "Gyra Flux",
    aspect: "4:3",
  },
  {
    id: "material",
    title: "Optical Glass & Titanium",
    category: "Materials",
    imageSrc: "/showcase/optics-hd.webp",
    prompt:
      "Hand-milled smoked borosilicate optical glass prisms beside a brushed dark titanium cylinder on matte honed slate, crisp steel-blue refractions and fine tungsten caustics.",
    resolution: "1920 × 1440 HD",
    modelLabel: "Gyra Flux",
    aspect: "4:3",
  },
  {
    id: "mobility",
    title: "Obsidian Electric GT",
    category: "Mobility",
    imageSrc: "/showcase/mobility-hd.webp",
    prompt:
      "Sculptural matte obsidian electric grand tourer parked inside a cavernous poured-concrete gallery at twilight, single linear overhead skylight casting crisp reflections across sculpted bodywork.",
    resolution: "1920 × 1440 HD",
    modelLabel: "Gyra Flux",
    aspect: "4:3",
  },
  {
    id: "portrait",
    title: "Editorial Studio Portrait",
    category: "Portrait",
    imageSrc: "/showcase/portrait-hd.webp",
    prompt:
      "High-contrast editorial studio portrait in tailored dark charcoal wool against a matte slate backdrop, sculpted Rembrandt key light with cool steel-blue rim highlight, Leica 80mm medium format.",
    resolution: "1920 × 1440 HD",
    modelLabel: "Gyra Flux",
    aspect: "4:3",
  },
  {
    id: "interior",
    title: "Monolithic Concrete Atrium",
    category: "Interior",
    imageSrc: "/showcase/interior-hd.webp",
    prompt:
      "Serene brutalist poured-concrete reading library and gallery atrium at twilight, arched skylight casting cool blue-hour shafts onto dark smoked oak tables and warm 2700K recessed bookshelves.",
    resolution: "1920 × 1440 HD",
    modelLabel: "Gyra Flux",
    aspect: "4:3",
  },
  {
    id: "aerospace",
    title: "Carbon VTOL Wind-Tunnel",
    category: "Aerospace",
    imageSrc: "/showcase/aero-hd.webp",
    prompt:
      "Forged carbon-fiber autonomous electric VTOL aircraft wing and ducted titanium rotor inside a dark architectural wind-tunnel hangar, linear overhead light tracing steel-blue highlights across wet-sheen concrete.",
    resolution: "1920 × 1440 HD",
    modelLabel: "Gyra Flux",
    aspect: "4:3",
  },
] as const;

export const VIDEO_TEMPLATES: readonly VideoTemplateItem[] = [
  {
    id: "headset-reveal",
    label: "Studio Headset Reveal",
    category: "Image-to-Video",
    videoSrc: "/products-hero-bg.mp4",
    posterSrc: "/video-samples/headset-f001.webp",
    referenceStillSrc: "/video-samples/headset-f001.webp",
    prompt:
      "Slow macro orbital reveal of matte obsidian over-ear studio headphones with brushed titanium acoustic mesh, sweeping low-key rim light across precision-milled aluminum hardware.",
    durationLabel: "6.0s · Cinema Loop",
    specs: "720p · 24 fps · LTX-Video 13B",
  },
  {
    id: "editorial-muse",
    label: "Editorial Portrait Muse",
    category: "Human Cinema",
    videoSrc: "/video-samples/editorial-muse.mp4",
    posterSrc: "/video-samples/editorial-muse-f001.webp",
    referenceStillSrc: "/video-samples/editorial-muse-f001.webp",
    prompt:
      "Intimate 85mm cinema close-up of a young woman in a softly lit warm beauty studio, subtle natural eye contact and luminous skin tones framed against warm tungsten bokeh.",
    durationLabel: "7.0s · 168 frames",
    specs: "720p · 24 fps · Gyra Cinema HD",
  },
  {
    id: "monitor-orbit",
    label: "Acoustic Monitor Orbit",
    category: "Image-to-Video",
    videoSrc: "/video-samples/monitor-orbit.mp4",
    posterSrc: "/video-samples/monitor-orbit-f001.webp",
    referenceStillSrc: "/video-samples/monitor-orbit-f001.webp",
    prompt:
      "Smooth 18° macro studio orbital glide around a precision-milled obsidian aluminum acoustic monitor, steel-blue edge rim sweeping across the knurled titanium dial.",
    durationLabel: "5.0s · 121 frames",
    specs: "720p · 24 fps · LTX-Video 13B",
  },
  {
    id: "pavilion-relight",
    label: "Pavilion Dusk Relight",
    category: "Text-to-Video",
    videoSrc: "/video-samples/pavilion-relight.mp4",
    posterSrc: "/video-samples/pavilion-relight-f001.webp",
    referenceStillSrc: "/video-samples/pavilion-relight-f001.webp",
    prompt:
      "Calm architectural dolly glide across a cantilevered concrete pavilion over still ocean water at blue hour, warm 2700K soffit reflections rippling softly across the surface.",
    durationLabel: "5.0s · 121 frames",
    specs: "720p · 24 fps · LTX-Video 13B",
  },
  {
    id: "aero-windtunnel",
    label: "Carbon VTOL Wind-Tunnel",
    category: "Image-to-Video",
    videoSrc: "/video-samples/aero-windtunnel.mp4",
    posterSrc: "/video-samples/aero-windtunnel-f001.webp",
    referenceStillSrc: "/video-samples/aero-windtunnel-f001.webp",
    prompt:
      "Controlled laminar smoke ribbons sweeping across a forged carbon VTOL rotor cowling inside a dark architectural wind tunnel with cool steel-blue overhead strip lighting.",
    durationLabel: "5.0s · 121 frames",
    specs: "720p · 24 fps · LTX-Video 13B",
  },
  {
    id: "optics-aperture",
    label: "Optical Prism Caustics",
    category: "Macro Study",
    videoSrc: "/video-samples/optics-aperture.mp4",
    posterSrc: "/video-samples/optics-aperture-f001.webp",
    referenceStillSrc: "/video-samples/optics-aperture-f001.webp",
    prompt:
      "Slow rack-focus optical macro sweep across smoked borosilicate glass prisms and brushed titanium cylinders, shifting crisp steel-blue refractions and warm caustics.",
    durationLabel: "5.0s · 121 frames",
    specs: "720p · 24 fps · LTX-Video 13B",
  },
  {
    id: "tourbillon-flare",
    label: "Titanium Tourbillon Macro",
    category: "Horology",
    videoSrc: "/video-samples/tourbillon-flare.mp4",
    posterSrc: "/video-samples/tourbillon-flare-f001.webp",
    referenceStillSrc: "/video-samples/tourbillon-flare-f001.webp",
    prompt:
      "Seamless horological macro motion study tracking brushed Grade-5 titanium bridges and sapphire reflections under controlled studio rim lighting.",
    durationLabel: "5.0s · 121 frames",
    specs: "720p · 24 fps · LTX-Video 13B",
  },
] as const;

export const ARCHITECTURE_LAYERS: readonly ArchitectureLayer[] = [
  {
    id: "surfaces",
    index: "01",
    title: "Product Surfaces",
    subtitle: "Consumer, Creative & Mobile Touchpoints",
    description:
      "Every Gyra product — conversational workspace, visual editing, video studio, document projects, journal, and Telegram — shares one account, one identity, and one memory model.",
    nodes: [
      { label: "Gyra Chat", detail: "/dashboard · Web & Mobile" },
      { label: "Gyra Image", detail: "Text-to-Image & Pro Ultra Edit" },
      { label: "Gyra Video", detail: "/studio · 720p Cinema Queue" },
      { label: "Projects & Journal", detail: "RAG Files · Rich Notes" },
    ],
  },
  {
    id: "orchestration",
    index: "02",
    title: "Intelligence & Orchestration",
    subtitle: "Model Routing, Multi-Agent Execution & Media Synthesis",
    description:
      "Requests dynamically route across specialized reasoning and synthesis engines — pairing fast everyday responses with six-agent code verification and high-fidelity media pipelines.",
    nodes: [
      { label: "Gyra 1.0", detail: "Low-latency general reasoning" },
      { label: "SuperGyra 2.0", detail: "Deep logic & unlimited streaming" },
      { label: "6-Agent Pipeline", detail: "Atlas -> Orion -> Architect -> Forge -> Sentinel -> Mentor" },
      { label: "Media Engines", detail: "Flux Pro Ultra · LTX-Video 13B" },
    ],
  },
  {
    id: "platform",
    index: "03",
    title: "Developer Platform & Governance",
    subtitle: "Programmable Endpoints, Security & Unified Credits",
    description:
      "OpenAI-compatible REST interfaces, category-scoped API keys, server-side rate limiting, content moderation, and a single transparent credits wallet power both Gyra apps and external software.",
    nodes: [
      { label: "OpenAI-Compatible API", detail: "POST /api/v1/chat" },
      { label: "Media & Video APIs", detail: "Queue, status polling, transcripts" },
      { label: "Scoped Keys & Console", detail: "Per-category keys & usage logs" },
      { label: "Unified Credits", detail: "Free chat tier · pay-per-render media" },
    ],
  },
] as const;

export const API_EXAMPLES: readonly ApiExampleSpec[] = [
  {
    id: "chat",
    label: "Chat Completions",
    method: "POST",
    endpoint: "/api/v1/chat",
    authNote: "Bearer API Key · OpenAI-compatible payload · Supports gyra-1.0 & gyra-super2.0",
    snippets: {
      curl: `curl -X POST https://gyra.ng/api/v1/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $GYRA_API_KEY" \\
  -d '{
    "model": "gyra-super2.0",
    "messages": [
      { "role": "user", "content": "Explain idempotency keys in webhook handlers." }
    ]
  }'`,
      typescript: `const response = await fetch("https://gyra.ng/api/v1/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": \`Bearer \${process.env.GYRA_API_KEY}\`,
  },
  body: JSON.stringify({
    model: "gyra-super2.0",
    messages: [
      { role: "user", content: "Explain idempotency keys in webhook handlers." },
    ],
  }),
});

const completion = await response.json();
console.log(completion.choices[0].message.content);`,
      python: `import os, requests

res = requests.post(
    "https://gyra.ng/api/v1/chat",
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {os.environ['GYRA_API_KEY']}",
    },
    json={
        "model": "gyra-super2.0",
        "messages": [
            {"role": "user", "content": "Explain idempotency keys in webhook handlers."}
        ],
    },
    timeout=60,
)
print(res.json()["choices"][0]["message"]["content"])`,
    },
    sampleResponse: `{
  "id": "chatcmpl-1795078800",
  "object": "chat.completion",
  "model": "gyra-super2.0",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "An idempotency key binds a client retry sequence to a single server-side outcome..."
      },
      "finish_reason": "stop"
    }
  ]
}`,
  },
  {
    id: "video",
    label: "Video Generation",
    method: "POST",
    endpoint: "/api/v1/video/generate",
    authNote: "Session token · SuperGyra + Credits ($2.00/render) · 720p 24fps",
    snippets: {
      curl: `curl -X POST https://gyra.ng/api/v1/video/generate \\
  -H "Content-Type: application/json" \\
  -H "x-gyra-user-token: $GYRA_SESSION_TOKEN" \\
  -d '{
    "prompt": "Drone shot gliding across Victoria Island lagoon at twilight, calm reflections",
    "aspectRatio": "16:9"
  }'`,
      typescript: `const queued = await fetch("https://gyra.ng/api/v1/video/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-gyra-user-token": sessionToken,
  },
  body: JSON.stringify({
    prompt: "Drone shot gliding across Victoria Island lagoon at twilight, calm reflections",
    aspectRatio: "16:9",
  }),
}).then((r) => r.json());

// Poll status until completed
const status = await fetch(\`https://gyra.ng/api/v1/video/status/\${queued.requestId}\`).then((r) => r.json());`,
      python: `import requests

queued = requests.post(
    "https://gyra.ng/api/v1/video/generate",
    headers={"x-gyra-user-token": session_token},
    json={
        "prompt": "Drone shot gliding across Victoria Island lagoon at twilight, calm reflections",
        "aspectRatio": "16:9",
    },
).json()

status = requests.get(
    f"https://gyra.ng/api/v1/video/status/{queued['requestId']}"
).json()`,
    },
    sampleResponse: `{
  "requestId": "req_8f21a90c4e",
  "model": "fal-ai/ltx-video-13b-distilled",
  "cost": 2.0,
  "newBalance": 8.0
}`,
  },
  {
    id: "media",
    label: "Media Intelligence",
    method: "POST",
    endpoint: "/api/v1/media/youtube/transcript",
    authNote: "Media-scoped API key · 10 free requests/month · $0.90/request",
    snippets: {
      curl: `curl -X POST https://gyra.ng/api/v1/media/youtube/transcript \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $GYRA_MEDIA_KEY" \\
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'`,
      typescript: `const res = await fetch("https://gyra.ng/api/v1/media/youtube/transcript", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": \`Bearer \${process.env.GYRA_MEDIA_KEY}\`,
  },
  body: JSON.stringify({
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  }),
});

const transcript = await res.json();`,
      python: `import os, requests

res = requests.post(
    "https://gyra.ng/api/v1/media/youtube/transcript",
    headers={"Authorization": f"Bearer {os.environ['GYRA_MEDIA_KEY']}"},
    json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
)
print(res.json())`,
    },
    sampleResponse: `{
  "videoId": "dQw4w9WgXcQ",
  "language": "en",
  "segments": [
    { "start": 0.0, "duration": 3.4, "text": "..." }
  ]
}`,
  },
] as const;

/** Clamp image comparison split slider strictly to [5, 95] or [0, 100] bounds. */
export function clampSplitPercent(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Calculate total pipeline duration in seconds (1 decimal precision). */
export function getTotalPipelineDuration(steps: readonly AgentStep[]): number {
  const sum = steps.reduce((acc, s) => acc + s.durationSec, 0);
  return Math.round(sum * 10) / 10;
}

/** Compute next step index for deterministic agent progression. */
export function getNextAgentIndex(currentIndex: number, totalSteps: number): number {
  if (totalSteps <= 0) return -1;
  if (currentIndex < 0) return 0;
  return Math.min(currentIndex + 1, totalSteps - 1);
}

/** Resolve route links cleanly across standalone preview vs Next.js deployment. */
export function resolveGyraRoute(route: string, baseOrigin = ""): string {
  if (route.startsWith("http://") || route.startsWith("https://") || route.startsWith("mailto:") || route.startsWith("#")) {
    return route;
  }
  if (!baseOrigin) return route;
  return `${baseOrigin.replace(/\/$/, "")}${route}`;
}
