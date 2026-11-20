export type ModelCategory = "chat" | "image" | "video" | "voice" | "embeddings";
export type ModelAvailability = "available" | "supergyra" | "coming-soon";
export type PlaygroundMode = "chat" | "image" | "video" | "compare";

export interface ModelParameterSpec {
  key: string;
  label: string;
  type: "toggle" | "select" | "number" | "text" | "image-upload";
  description: string;
  defaultValue: string | number | boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface GyraModelSpec {
  id: string;
  name: string;
  provider: string;
  category: ModelCategory;
  availability: ModelAvailability;
  endpoint: string;
  proxyTarget?: string;
  description: string;
  capabilities: string[];
  inputTypes: string[];
  outputTypes: string[];
  contextLimit: string;
  pricingSummary: string;
  supportsStreaming: boolean;
  supportsComparison: boolean;
  parameters: ModelParameterSpec[];
}

export const GYRA_MODEL_CATALOG: readonly GyraModelSpec[] = [
  {
    id: "gyra-1.0",
    name: "Gyra 1.0",
    provider: "Genvia AI · Fast Inference",
    category: "chat",
    availability: "available",
    endpoint: "/api/chat",
    description:
      "Low-latency conversational and coding model built for fast everyday reasoning, internal web search grounding, and structured engineering workflows.",
    capabilities: [
      "Streaming SSE responses",
      "Optional step-by-step Deep Think",
      "Atlas internal web search grounding",
      "6-agent build & QA pipeline for coding prompts",
    ],
    inputTypes: ["Text", "System Instructions"],
    outputTypes: ["Markdown Text", "Structured Code", "SSE Stream"],
    contextLimit: "32,000 chars / 50 messages (REST v1)",
    pricingSummary: "Included on Free tier (up to free limit) & SuperGyra",
    supportsStreaming: true,
    supportsComparison: true,
    parameters: [
      {
        key: "think",
        label: "Deep Think",
        type: "toggle",
        description: "Instructs the core to reason step-by-step before producing the answer.",
        defaultValue: false,
      },
      {
        key: "search",
        label: "Atlas Web Search",
        type: "toggle",
        description: "Grounds responses with live web sources scraped by Gyra Internal Search.",
        defaultValue: false,
      },
    ],
  },
  {
    id: "gyra-super2.0",
    name: "SuperGyra 2.0",
    provider: "Genvia AI · DeepSeek Reasoner",
    category: "chat",
    availability: "supergyra",
    endpoint: "/api/chat",
    description:
      "Flagship deep reasoning model for complex architecture, long-context synthesis, security reviews, and priority execution on SuperGyra.",
    capabilities: [
      "Deep chain-of-thought reasoning",
      "Priority execution & expanded context",
      "Atlas live web search grounding",
      "Full 6-agent verified engineering pipeline",
    ],
    inputTypes: ["Text", "System Instructions"],
    outputTypes: ["Deep Reasoning Trace", "Markdown Text", "SSE Stream"],
    contextLimit: "Expanded priority context (SuperGyra)",
    pricingSummary: "Requires active SuperGyra subscription",
    supportsStreaming: true,
    supportsComparison: true,
    parameters: [
      {
        key: "think",
        label: "Deep Think",
        type: "toggle",
        description: "Enables explicit step-by-step reasoning traces.",
        defaultValue: true,
      },
      {
        key: "search",
        label: "Atlas Web Search",
        type: "toggle",
        description: "Pulls live web context before reasoning.",
        defaultValue: false,
      },
    ],
  },
  {
    id: "fal-ai/flux/dev",
    name: "Gyra Imagine · Flux Dev",
    provider: "fal.ai via Authenticated Gyra Proxy",
    category: "image",
    availability: "available",
    endpoint: "/api/fal/proxy",
    proxyTarget: "fal-ai/flux/dev",
    description:
      "High-fidelity text-to-image synthesis routed through Gyra's authenticated server-side proxy with configurable resolution, inference steps, and guidance.",
    capabilities: [
      "Text-to-Image synthesis",
      "Configurable image aspect presets",
      "Controllable inference steps & guidance scale",
      "Authenticated server-side proxy (no exposed keys)",
    ],
    inputTypes: ["Text Prompt"],
    outputTypes: ["High-Resolution Image (PNG/JPEG)"],
    contextLimit: "Up to 2,000 prompt characters",
    pricingSummary: "Authenticated account access via /api/fal/proxy",
    supportsStreaming: false,
    supportsComparison: false,
    parameters: [
      {
        key: "image_size",
        label: "Aspect & Resolution",
        type: "select",
        description: "Target output frame geometry supported by Flux Dev.",
        defaultValue: "square_hd",
        options: [
          { value: "square_hd", label: "1:1 Square HD (1024×1024)" },
          { value: "landscape_4_3", label: "4:3 Landscape" },
          { value: "landscape_16_9", label: "16:9 Widescreen" },
          { value: "portrait_4_3", label: "3:4 Portrait" },
          { value: "portrait_16_9", label: "9:16 Vertical" },
        ],
      },
      {
        key: "num_inference_steps",
        label: "Inference Steps",
        type: "number",
        description: "Denoising iterations (higher values increase detail at longer runtime).",
        defaultValue: 28,
        min: 10,
        max: 50,
        step: 2,
      },
      {
        key: "guidance_scale",
        label: "Prompt Guidance",
        type: "number",
        description: "How closely the render adheres to the prompt wording.",
        defaultValue: 3.5,
        min: 1,
        max: 10,
        step: 0.5,
      },
      {
        key: "enable_safety_checker",
        label: "Safety Filter",
        type: "toggle",
        description: "Runs built-in content safety filtering on generated images.",
        defaultValue: true,
      },
    ],
  },
  {
    id: "fal-ai/flux-pro/v1.1-ultra",
    name: "Gyra Pro Ultra (T2I & I2I)",
    provider: "fal.ai via Authenticated Gyra Proxy",
    category: "image",
    availability: "available",
    endpoint: "/api/fal/proxy",
    proxyTarget: "fal-ai/flux-pro/v1.1-ultra",
    description:
      "Ultra-resolution studio image synthesis and optional reference-guided editing with photorealistic raw mode and architectural aspect ratios.",
    capabilities: [
      "Ultra-HD Text-to-Image",
      "Optional reference image conditioning (I2I)",
      "Raw photorealism mode",
      "Wide studio aspect ratios up to 21:9",
    ],
    inputTypes: ["Text Prompt", "Optional Reference Image"],
    outputTypes: ["Ultra-HD Studio Image"],
    contextLimit: "Up to 2,000 prompt characters",
    pricingSummary: "Authenticated account access via /api/fal/proxy",
    supportsStreaming: false,
    supportsComparison: false,
    parameters: [
      {
        key: "aspect_ratio",
        label: "Aspect Ratio",
        type: "select",
        description: "Output composition ratio supported by Flux Pro v1.1 Ultra.",
        defaultValue: "4:3",
        options: [
          { value: "1:1", label: "1:1 Square" },
          { value: "4:3", label: "4:3 Editorial" },
          { value: "16:9", label: "16:9 Cinema" },
          { value: "3:4", label: "3:4 Portrait" },
          { value: "9:16", label: "9:16 Vertical" },
          { value: "21:9", label: "21:9 Anamorphic" },
        ],
      },
      {
        key: "raw",
        label: "Raw Photorealism",
        type: "toggle",
        description: "Produces natural, less synthetic photographic textures and lighting.",
        defaultValue: true,
      },
      {
        key: "reference_image",
        label: "Reference Image (Optional)",
        type: "image-upload",
        description: "Attach a local image to guide composition or relighting.",
        defaultValue: "",
      },
      {
        key: "enable_safety_checker",
        label: "Safety Filter",
        type: "toggle",
        description: "Runs built-in content safety filtering.",
        defaultValue: true,
      },
    ],
  },
  {
    id: "fal-ai/ltx-video-13b-distilled",
    name: "Gyra Video · LTX-13B",
    provider: "fal.ai Queue via /api/v1/video/generate",
    category: "video",
    availability: "supergyra",
    endpoint: "/api/v1/video/generate",
    description:
      "Asynchronous 720p 24fps video generation (121 frames ≈ 5 seconds) supporting both Text-to-Video and Keyframe Image-to-Video with persisted job history.",
    capabilities: [
      "Text-to-Video (720p · 24fps · 121 frames)",
      "Image-to-Video reference frame anchor",
      "Async queue with live polling via /api/v1/video/status/[id]",
      "Automatic credit refund if upstream queue rejects job",
    ],
    inputTypes: ["Motion Prompt (max 2,000 chars)", "Optional Reference Frame (Image)"],
    outputTypes: ["720p MP4 Video (24fps, ~5s)"],
    contextLimit: "2,000 prompt chars · Fixed 121 frames @ 24fps",
    pricingSummary: "SuperGyra plan + $2.00 / render",
    supportsStreaming: false,
    supportsComparison: false,
    parameters: [
      {
        key: "aspectRatio",
        label: "Aspect Ratio",
        type: "select",
        description: "Supported output orientation enforced by /api/v1/video/generate.",
        defaultValue: "16:9",
        options: [
          { value: "16:9", label: "16:9 Widescreen (720p)" },
          { value: "9:16", label: "9:16 Vertical (720p)" },
        ],
      },
      {
        key: "imageBase64",
        label: "Keyframe Reference (Optional)",
        type: "image-upload",
        description: "Optional starting frame uploaded to fal storage for Image-to-Video.",
        defaultValue: "",
      },
    ],
  },
  {
    id: "gyra-voice-v1",
    name: "Gyra Voice Synthesis",
    provider: "Genvia AI · /api/v1/voice",
    category: "voice",
    availability: "supergyra",
    endpoint: "/api/v1/voice",
    description:
      "Voice synthesis endpoint returning voice parameters and credit-metered speech payloads for up to 5,000 characters per request.",
    capabilities: [
      "Multiple voice presets (Ara & studio personas)",
      "Up to 5,000 characters per request",
      "Rate-limited per IP (10 req/min)",
    ],
    inputTypes: ["Text (max 5,000 chars)", "Voice ID"],
    outputTypes: ["Speech Synthesis Payload"],
    contextLimit: "5,000 characters",
    pricingSummary: "SuperGyra plan + credit metering",
    supportsStreaming: false,
    supportsComparison: false,
    parameters: [
      {
        key: "voiceId",
        label: "Voice Preset",
        type: "select",
        description: "Voice persona identifier sent to /api/v1/voice.",
        defaultValue: "ara",
        options: [
          { value: "ara", label: "Ara (Default)" },
          { value: "orion", label: "Orion" },
          { value: "nova", label: "Nova" },
        ],
      },
    ],
  },
  {
    id: "gyra-embeddings-v1",
    name: "Gyra Embeddings v1",
    provider: "Genvia AI · Planned",
    category: "embeddings",
    availability: "coming-soon",
    endpoint: "Unavailable (In Development)",
    description:
      "Dedicated dense vector embedding endpoint for semantic indexing and custom RAG pipelines. Currently in development and not yet callable.",
    capabilities: [
      "Planned: High-dimensional semantic vectors",
      "Planned: Batch document chunk embedding",
    ],
    inputTypes: ["Text Chunks (Planned)"],
    outputTypes: ["Float32 Vector Array (Planned)"],
    contextLimit: "TBD",
    pricingSummary: "Coming Soon",
    supportsStreaming: false,
    supportsComparison: false,
    parameters: [],
  },
];

export function getModelsByCategory(
  category: ModelCategory | "all",
  models: readonly GyraModelSpec[] = GYRA_MODEL_CATALOG,
): GyraModelSpec[] {
  if (category === "all") return [...models];
  return models.filter((m) => m.category === category);
}

export function getModelsForPlaygroundMode(
  mode: PlaygroundMode,
  models: readonly GyraModelSpec[] = GYRA_MODEL_CATALOG,
): GyraModelSpec[] {
  if (mode === "chat" || mode === "compare") {
    return models.filter((m) => m.category === "chat" && m.availability !== "coming-soon");
  }
  if (mode === "image") {
    return models.filter((m) => m.category === "image" && m.availability !== "coming-soon");
  }
  return models.filter((m) => m.category === "video" && m.availability !== "coming-soon");
}

export function getModelById(
  id: string,
  models: readonly GyraModelSpec[] = GYRA_MODEL_CATALOG,
): GyraModelSpec | undefined {
  return models.find((m) => m.id === id);
}

export function buildDefaultParamsForModel(
  model: GyraModelSpec,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const param of model.parameters) {
    out[param.key] = param.defaultValue;
  }
  return out;
}

export function filterSupportedParams(
  model: GyraModelSpec,
  rawParams: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  const allowed = new Set(model.parameters.map((p) => p.key));
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(rawParams)) {
    if (allowed.has(k)) {
      out[k] = v;
    }
  }
  return out;
}

export function validatePromptInput(
  mode: PlaygroundMode,
  prompt: string,
): { ok: true; clean: string } | { ok: false; error: string } {
  const clean = prompt.trim();
  if (!clean) {
    return { ok: false, error: "Enter a prompt before running this experiment." };
  }
  const maxLen = mode === "video" || mode === "image" ? 2000 : 12000;
  if (clean.length > maxLen) {
    return {
      ok: false,
      error: `Prompt exceeds the ${maxLen.toLocaleString()}-character limit for ${mode} mode.`,
    };
  }
  return { ok: true, clean };
}
