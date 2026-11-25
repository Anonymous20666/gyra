export type StreamLifecycleStatus =
  | "connecting"
  | "streaming"
  | "complete"
  | "cancelled"
  | "error";

export interface StreamMetrics {
  status: StreamLifecycleStatus;
  ttftMs: number | null;
  elapsedMs: number;
  chunkCount: number;
  tokenCount: number;
  tokensPerSec: number;
  velocityHistory: number[];
  model?: string;
}

export interface ParsedSseResult {
  remainingBuffer: string;
  tokens: string[];
  reasoningTokens: string[];
  done: boolean;
  model?: string;
  usageTotalTokens?: number;
  errorMessage?: string;
}

/**
 * Parses arbitrary incoming SSE chunks (including split TCP frames) for both
 * Gyra native `{ token }` and OpenAI-compatible `{ choices: [{ delta: { content } }] }` streams.
 */
export function parseSseChunk(buffer: string, incoming: string): ParsedSseResult {
  const combined = buffer + incoming;
  const lines = combined.split(/\r?\n/);
  const remainingBuffer = lines.pop() ?? "";

  const tokens: string[] = [];
  const reasoningTokens: string[] = [];
  let done = false;
  let model: string | undefined;
  let usageTotalTokens: number | undefined;
  let errorMessage: string | undefined;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith(":")) continue;
    if (!trimmed.startsWith("data:")) continue;

    const payload = trimmed.slice(5).trim();
    if (!payload) continue;
    if (payload === "[DONE]") {
      done = true;
      continue;
    }

    try {
      const chunk = JSON.parse(payload) as Record<string, unknown>;
      if (typeof chunk.model === "string" && !model) {
        model = chunk.model;
      }

      if (chunk.error && typeof chunk.error === "object") {
        const msg = (chunk.error as { message?: unknown }).message;
        if (typeof msg === "string") errorMessage = msg;
      }

      if (chunk.usage && typeof chunk.usage === "object") {
        const total = (chunk.usage as { total_tokens?: unknown }).total_tokens;
        if (typeof total === "number" && Number.isFinite(total)) {
          usageTotalTokens = total;
        }
      }

      if (typeof chunk.token === "string" && chunk.token.length > 0) {
        tokens.push(chunk.token);
        continue;
      }

      const choices = chunk.choices;
      if (Array.isArray(choices) && choices.length > 0) {
        const first = choices[0] as Record<string, unknown>;
        const delta = first?.delta as Record<string, unknown> | undefined;
        if (delta) {
          if (typeof delta.reasoning_content === "string" && delta.reasoning_content.length > 0) {
            reasoningTokens.push(delta.reasoning_content);
          }
          if (typeof delta.content === "string" && delta.content.length > 0) {
            tokens.push(delta.content);
          }
        }
      }
    } catch {
      // Ignore malformed/partial JSON payloads gracefully
    }
  }

  return {
    remainingBuffer,
    tokens,
    reasoningTokens,
    done,
    model,
    usageTotalTokens,
    errorMessage,
  };
}

/**
 * Adaptive smooth character reveal engine: turns bursty SSE packets into a
 * fluid real-time typing effect without lagging behind high-speed streams.
 */
export function advanceSmoothTyping(
  targetLength: number,
  currentLength: number,
  deltaMs: number,
  isStreaming: boolean
): number {
  if (currentLength >= targetLength) return targetLength;
  const backlog = targetLength - currentLength;
  const clampedDeltaSec = Math.min(0.1, Math.max(0.008, deltaMs / 1000));

  // Scale characters-per-second smoothly with queue backlog so fast streams stay crisp
  let charsPerSec: number;
  if (!isStreaming) {
    charsPerSec = Math.max(180, backlog * 8);
  } else if (backlog <= 14) {
    charsPerSec = 78;
  } else if (backlog <= 60) {
    charsPerSec = 78 + (backlog - 14) * 3.8;
  } else {
    charsPerSec = Math.max(260, backlog * 5.2);
  }

  const step = Math.max(1, Math.round(charsPerSec * clampedDeltaSec));
  return Math.min(targetLength, currentLength + step);
}

export interface MarkdownSegment {
  type: "text" | "code";
  content: string;
  lang?: string;
  closed?: boolean;
}

/**
 * Splits markdown into prose and fenced code blocks while safely handling
 * in-progress unclosed ``` fences mid-stream so layout never flickers.
 */
export function splitStreamingMarkdown(text: string): MarkdownSegment[] {
  if (!text) return [];
  const segments: MarkdownSegment[] = [];
  const fenceRegex = /```([a-zA-Z0-9_-]*)[ \t]*\r?\n?/g;

  let cursor = 0;
  let inCode = false;
  let currentLang = "code";
  let codeStart = 0;

  let match: RegExpExecArray | null;
  while ((match = fenceRegex.exec(text)) !== null) {
    if (!inCode) {
      if (match.index > cursor) {
        segments.push({ type: "text", content: text.slice(cursor, match.index) });
      }
      inCode = true;
      currentLang = match[1]?.trim() || "code";
      codeStart = match.index + match[0].length;
    } else {
      segments.push({
        type: "code",
        lang: currentLang,
        content: text.slice(codeStart, match.index),
        closed: true,
      });
      inCode = false;
      cursor = match.index + match[0].length;
    }
  }

  if (inCode) {
    segments.push({
      type: "code",
      lang: currentLang,
      content: text.slice(codeStart),
      closed: false,
    });
  } else if (cursor < text.length) {
    segments.push({ type: "text", content: text.slice(cursor) });
  }

  return segments;
}

export function estimateTokenCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.round(trimmed.length / 4));
}
