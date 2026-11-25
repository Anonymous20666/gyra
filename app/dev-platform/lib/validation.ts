import type { GyraEndpointSpec } from "./gyraCatalog";

export interface KeyValidationResult {
  valid: boolean;
  level: "ok" | "warning" | "error" | "empty";
  message: string;
}

export interface JsonValidationResult {
  valid: boolean;
  parsed: Record<string, unknown> | null;
  errorMessage: string | null;
  errorLine: number | null;
}

export type DetectedMediaKind =
  | "chat"
  | "video"
  | "images"
  | "music-tracks"
  | "youtube-transcript"
  | "media-metadata"
  | "voice"
  | "audio-transcript"
  | "json";

export interface DetectedResponsePayload {
  kind: DetectedMediaKind;
  chatText?: string;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  videoUrl?: string;
  jobStatus?: string;
  requestId?: string;
  imageUrls?: string[];
  tracks?: Array<{
    id: string;
    name: string;
    artists?: string;
    album?: string;
    coverArt?: string | null;
    previewUrl?: string | null;
    durationMs?: number;
    externalUrl?: string | null;
  }>;
  transcriptSegments?: Array<{ text: string; offset?: number; duration?: number }>;
  transcriptText?: string;
  metadataCard?: {
    title?: string;
    author?: string;
    thumbnail?: string;
    provider?: string;
    url?: string;
    width?: number;
    height?: number;
  };
  voicePayload?: {
    text: string;
    voiceId?: string;
    note?: string;
  };
  balanceAfter?: number;
}

export function validateApiKeyForEndpoint(
  key: string,
  endpoint: GyraEndpointSpec
): KeyValidationResult {
  const trimmed = key.trim();
  if (!trimmed) {
    return {
      valid: false,
      level: "empty",
      message:
        endpoint.authType === "session-token"
          ? "Session token or AI key required to execute live requests."
          : `Requires a ${endpoint.requiredKeyPrefix ?? "gyra_"} API key.`,
    };
  }

  if (endpoint.authType === "api-key" && endpoint.requiredKeyPrefix) {
    if (!trimmed.startsWith(endpoint.requiredKeyPrefix)) {
      return {
        valid: false,
        level: "error",
        message: `Key prefix mismatch: ${endpoint.title} expects a key starting with "${endpoint.requiredKeyPrefix}".`,
      };
    }
    if (trimmed.length < 18) {
      return {
        valid: false,
        level: "warning",
        message: "Key appears shorter than standard 40+ character Gyra credentials.",
      };
    }
  }

  return {
    valid: true,
    level: "ok",
    message: `Valid ${endpoint.requiredKeyPrefix ?? "credential"} format ready`,
  };
}

export function validateJsonBody(raw: string): JsonValidationResult {
  if (!raw.trim()) {
    return {
      valid: false,
      parsed: null,
      errorMessage: "Request body cannot be empty.",
      errorLine: 1,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        valid: false,
        parsed: null,
        errorMessage: "Top-level JSON payload must be an object ({ ... }).",
        errorLine: 1,
      };
    }
    return {
      valid: true,
      parsed: parsed as Record<string, unknown>,
      errorMessage: null,
      errorLine: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid JSON syntax";
    const posMatch = msg.match(/position\s+(\d+)/i);
    let errorLine: number | null = null;
    if (posMatch) {
      const pos = Number(posMatch[1]);
      if (Number.isFinite(pos)) {
        errorLine = raw.slice(0, pos).split("\n").length;
      }
    }
    return {
      valid: false,
      parsed: null,
      errorMessage: msg,
      errorLine,
    };
  }
}

export function formatJsonString(raw: string): { ok: boolean; formatted: string } {
  const res = validateJsonBody(raw);
  if (!res.valid || !res.parsed) return { ok: false, formatted: raw };
  return { ok: true, formatted: JSON.stringify(res.parsed, null, 2) };
}

export function detectResponseMedia(
  data: unknown,
  endpointId: string
): DetectedResponsePayload {
  if (typeof data === "string") {
    return { kind: "chat", chatText: data };
  }

  if (!data || typeof data !== "object") {
    return { kind: "json" };
  }

  const obj = data as Record<string, unknown>;
  const balanceAfter =
    typeof obj.balanceAfter === "number" ? obj.balanceAfter : undefined;

  // 1. OpenAI-style Chat Completions
  if (Array.isArray(obj.choices) && obj.choices.length > 0) {
    const first = obj.choices[0] as Record<string, unknown>;
    const msg = first?.message as Record<string, unknown> | undefined;
    const content = typeof msg?.content === "string" ? msg.content : "";
    return {
      kind: "chat",
      chatText: content,
      model: typeof obj.model === "string" ? obj.model : undefined,
      usage:
        obj.usage && typeof obj.usage === "object"
          ? (obj.usage as DetectedResponsePayload["usage"])
          : undefined,
      balanceAfter,
    };
  }

  // 2. Video generation / status payload
  if (
    endpointId === "video-generate" ||
    endpointId === "video-status" ||
    typeof obj.videoUrl === "string" ||
    typeof obj.video_url === "string" ||
    (typeof obj.requestId === "string" && typeof obj.status === "string")
  ) {
    const nestedVideo =
      obj.video && typeof obj.video === "object"
        ? (obj.video as Record<string, unknown>).url
        : undefined;
    const videoUrl =
      typeof obj.videoUrl === "string"
        ? obj.videoUrl
        : typeof obj.video_url === "string"
          ? obj.video_url
          : typeof nestedVideo === "string"
            ? nestedVideo
            : undefined;
    return {
      kind: "video",
      videoUrl,
      jobStatus: typeof obj.status === "string" ? obj.status : videoUrl ? "completed" : "queued",
      requestId:
        typeof obj.requestId === "string"
          ? obj.requestId
          : typeof obj.request_id === "string"
            ? obj.request_id
            : undefined,
      balanceAfter,
    };
  }

  // 3. Image array responses (Fal / OpenAI image arrays)
  if (Array.isArray(obj.images) && obj.images.length > 0) {
    const urls = obj.images
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && typeof (item as Record<string, unknown>).url === "string") {
          return (item as Record<string, unknown>).url as string;
        }
        return null;
      })
      .filter((u): u is string => Boolean(u));
    if (urls.length > 0) {
      return { kind: "images", imageUrls: urls, balanceAfter };
    }
  }
  if (typeof obj.imageUrl === "string") {
    return { kind: "images", imageUrls: [obj.imageUrl], balanceAfter };
  }

  // 4. Spotify Music Search results
  if (endpointId === "music-search" && Array.isArray(obj.results)) {
    const tracks = obj.results
      .filter((r): r is Record<string, unknown> => Boolean(r && typeof r === "object"))
      .map((r, idx) => ({
        id: String(r.id ?? idx),
        name: String(r.name ?? "Untitled"),
        artists: typeof r.artists === "string" ? r.artists : undefined,
        album: typeof r.album === "string" ? r.album : undefined,
        coverArt:
          typeof r.coverArt === "string"
            ? r.coverArt
            : typeof r.image === "string"
              ? r.image
              : null,
        previewUrl: typeof r.previewUrl === "string" ? r.previewUrl : null,
        durationMs: typeof r.durationMs === "number" ? r.durationMs : undefined,
        externalUrl: typeof r.externalUrl === "string" ? r.externalUrl : null,
      }));
    return { kind: "music-tracks", tracks, balanceAfter };
  }

  // 5. YouTube Transcript
  if (
    endpointId === "youtube-transcript" ||
    Array.isArray(obj.segments) ||
    typeof obj.transcript === "string"
  ) {
    const segments = Array.isArray(obj.segments)
      ? obj.segments
          .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === "object"))
          .map((s) => ({
            text: String(s.text ?? ""),
            offset: typeof s.offset === "number" ? s.offset : undefined,
            duration: typeof s.duration === "number" ? s.duration : undefined,
          }))
      : undefined;
    return {
      kind: "youtube-transcript",
      transcriptSegments: segments,
      transcriptText:
        typeof obj.transcript === "string"
          ? obj.transcript
          : typeof obj.text === "string"
            ? obj.text
            : segments?.map((s) => s.text).join(" "),
      balanceAfter,
    };
  }

  // 6. Media metadata (YouTube / TikTok oEmbed)
  if (
    endpointId === "youtube-metadata" ||
    endpointId === "tiktok-metadata" ||
    typeof obj.thumbnail_url === "string" ||
    typeof obj.thumbnail === "string"
  ) {
    return {
      kind: "media-metadata",
      metadataCard: {
        title: typeof obj.title === "string" ? obj.title : undefined,
        author:
          typeof obj.author_name === "string"
            ? obj.author_name
            : typeof obj.author === "string"
              ? obj.author
              : undefined,
        thumbnail:
          typeof obj.thumbnail_url === "string"
            ? obj.thumbnail_url
            : typeof obj.thumbnail === "string"
              ? obj.thumbnail
              : undefined,
        provider: typeof obj.provider_name === "string" ? obj.provider_name : undefined,
        url: typeof obj.author_url === "string" ? obj.author_url : undefined,
        width: typeof obj.width === "number" ? obj.width : undefined,
        height: typeof obj.height === "number" ? obj.height : undefined,
      },
      balanceAfter,
    };
  }

  // 7. Voice synthesis payload
  if (endpointId === "voice-synthesis" && typeof obj.text === "string") {
    return {
      kind: "voice",
      voicePayload: {
        text: obj.text,
        voiceId: typeof obj.voiceId === "string" ? obj.voiceId : "gyra-arax",
        note: "Returned voice payload ready for playback via Web Speech API.",
      },
      balanceAfter,
    };
  }

  // 8. Audio transcription
  if (endpointId === "media-transcribe" && typeof obj.text === "string") {
    return {
      kind: "audio-transcript",
      transcriptText: obj.text,
      balanceAfter,
    };
  }

  return { kind: "json", balanceAfter };
}
