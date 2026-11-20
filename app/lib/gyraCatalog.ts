export type ProductAvailability = "available" | "preview" | "in-development";

export interface CoreProduct {
  id: "chat" | "image" | "video";
  index: string;
  name: string;
  shortLabel: string;
  tagline: string;
  summary: string;
  availability: ProductAvailability;
  availabilityNote: string;
  route: string;
  ctaLabel: string;
  accentHex: string;
  specs: { label: string; value: string }[];
}

export interface EcosystemItem {
  id: string;
  name: string;
  category: "workspace" | "channel" | "api";
  availability: ProductAvailability;
  description: string;
  route: string;
  external?: boolean;
  meta: string;
}

export interface RoadmapItem {
  id: string;
  name: string;
  scope: string;
  description: string;
}

export const GYRA_COMPANY = {
  brand: "Gyra",
  parentCompany: "Genvia AI Company",
  founder: "Victory Lord",
  foundedYear: "2026",
  tagline: "Intelligence, Simplified.",
  domain: "https://gyra.ng",
  emails: {
    support: "support@gyra.ng",
    business: "hello@gyra.ng",
    press: "press@gyra.ng",
    safety: "safety@gyra.ng",
  },
  socials: [
    { id: "x", label: "X", href: "https://x.com/GyraAi" },
    { id: "telegram-news", label: "Telegram News", href: "https://t.me/GenviaNews" },
    { id: "telegram-bot", label: "Telegram Bot", href: "https://t.me/GyraAi" },
    { id: "youtube", label: "YouTube", href: "https://youtube.com/@Gyra_Ai" },
    { id: "tiktok", label: "TikTok", href: "https://tiktok.com/@gyraai" },
  ],
} as const;

export const CORE_PRODUCTS: readonly CoreProduct[] = [
  {
    id: "chat",
    index: "01",
    name: "Gyra Chat",
    shortLabel: "Chat",
    tagline: "Conversational reasoning with multi-agent engineering execution.",
    summary:
      "Fast everyday responses on Gyra 1.0 and deep multi-step reasoning on SuperGyra 2.0. Complex build requests automatically coordinate a six-agent pipeline with live web grounding, file reading, vision, and voice.",
    availability: "available",
    availabilityNote: "Free up to 20 messages per conversation · Unlimited with SuperGyra",
    route: "/dashboard",
    ctaLabel: "Open Gyra Chat",
    accentHex: "#67E8F9",
    specs: [
      { label: "Models", value: "Gyra 1.0 · SuperGyra 2.0" },
      { label: "Pipeline", value: "6-Agent Build Orchestration" },
      { label: "Inputs", value: "Text, Images, PDFs, Voice" },
    ],
  },
  {
    id: "image",
    index: "02",
    name: "Gyra Image",
    shortLabel: "Image",
    tagline: "Text-to-image generation and surgical image-to-image editing.",
    summary:
      "Generate high-resolution visual concepts from natural language or upload existing scenes, interfaces, and photographs for targeted edits powered by Gyra Pro Ultra while preserving layout and geometry.",
    availability: "available",
    availabilityNote: "Available inside Gyra Chat for SuperGyra · Dedicated Studio expanding",
    route: "/dashboard",
    ctaLabel: "Create with Gyra Image",
    accentHex: "#E5B975",
    specs: [
      { label: "Synthesis", value: "Text-to-Image (HD)" },
      { label: "Editing", value: "Gyra Pro Ultra (Img2Img)" },
      { label: "Workflow", value: "Inline Lightbox & Export" },
    ],
  },
  {
    id: "video",
    index: "03",
    name: "Gyra Video",
    shortLabel: "Video",
    tagline: "Text-to-video and image-to-video motion inside Gyra Studio.",
    summary:
      "Direct 720p, 24 fps cinematic clips from text prompts or reference still frames. Switch between widescreen 16:9 and vertical 9:16 framing, apply Studio templates, and track asynchronous renders in your history.",
    availability: "available",
    availabilityNote: "Available in Gyra Studio · SuperGyra + $2.00 per render",
    route: "/studio",
    ctaLabel: "Open Gyra Studio",
    accentHex: "#5EEAD4",
    specs: [
      { label: "Output", value: "720p · 24 fps · 121 frames" },
      { label: "Aspect", value: "16:9 Widescreen · 9:16 Vertical" },
      { label: "Modes", value: "Text-to-Video · Image-to-Video" },
    ],
  },
] as const;

export const ECOSYSTEM_ITEMS: readonly EcosystemItem[] = [
  {
    id: "projects",
    name: "Projects Workspace",
    category: "workspace",
    availability: "available",
    description:
      "Upload PDFs, source code, and documents to ground conversations in your own files with shareable Viewer and Editor links.",
    route: "/projects",
    meta: "RAG · File Grounding",
  },
  {
    id: "coding",
    name: "Forge Coding Workspace",
    category: "workspace",
    availability: "preview",
    description:
      "Autonomous coding agent connected to an isolated Linux terminal and file system for iterative building and verification.",
    route: "/coding",
    meta: "Preview · Linux Sandbox",
  },
  {
    id: "journal",
    name: "Gyra Journal",
    category: "workspace",
    availability: "available",
    description:
      "Structured dark-mode rich-text workspace supporting markdown, image attachments, audio recording, and location notes.",
    route: "/journal",
    meta: "Rich Text · Media Notes",
  },
  {
    id: "telegram",
    name: "Gyra Telegram Bot",
    category: "channel",
    availability: "available",
    description:
      "Real-time streaming access to Gyra directly inside Telegram with multi-agent assistance on mobile.",
    route: "https://t.me/GyraAi",
    external: true,
    meta: "@GyraAi · Live SSE",
  },
  {
    id: "api-ai",
    name: "Gyra AI & Voice API",
    category: "api",
    availability: "available",
    description:
      "OpenAI-compatible /api/v1/chat completions alongside speech synthesis, Whisper transcription, and video generation queues.",
    route: "/api",
    meta: "OpenAI-Compatible REST",
  },
  {
    id: "api-media",
    name: "Gyra Media API",
    category: "api",
    availability: "available",
    description:
      "Programmatic YouTube transcripts and metadata, TikTok metadata extraction, Spotify search, and audio transcription.",
    route: "/docs/media",
    meta: "$0.90/req · 10 free/mo",
  },
] as const;

export const ROADMAP_ITEMS: readonly RoadmapItem[] = [
  {
    id: "network-api",
    name: "Gyra Network API",
    scope: "In Development",
    description: "IP geolocation, DNS record inspection, WHOIS lookups, and SSL certificate checks.",
  },
  {
    id: "utilities-api",
    name: "Gyra Utilities API",
    scope: "In Development",
    description: "Programmatic file conversion, image compression, QR generation, and URL safety checks.",
  },
  {
    id: "studio-modes",
    name: "Expanded Studio Modes",
    scope: "In Development",
    description: "Dedicated standalone image controls alongside Studio Ask and Build workflows.",
  },
  {
    id: "realtime-embeddings",
    name: "Embeddings & Realtime",
    scope: "In Development",
    description: "Vector indexing endpoints for retrieval systems and low-latency bidirectional streams.",
  },
] as const;

export const AVAILABILITY_LABELS: Record<ProductAvailability, string> = {
  available: "Available",
  preview: "Preview",
  "in-development": "In Development",
};
