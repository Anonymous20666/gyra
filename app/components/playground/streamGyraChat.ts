export interface StreamChatOptions {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  model: string;
  think: boolean;
  search: boolean;
  accessToken?: string | null;
  signal?: AbortSignal;
  onStatus?: (agent: string, status: string) => void;
  onReasoning?: (chunk: string) => void;
  onContent?: (chunk: string) => void;
  onImage?: (url: string) => void;
}

export interface StreamChatResult {
  content: string;
  reasoning: string;
  imageUrl?: string;
  ttftMs: number | null;
  totalMs: number;
}

export async function streamGyraChat(
  opts: StreamChatOptions,
): Promise<StreamChatResult> {
  const startedAt = performance.now();
  let ttftMs: number | null = null;
  let content = "";
  let reasoning = "";
  let imageUrl: string | undefined;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.accessToken) {
    headers["x-gyra-user-token"] = opts.accessToken;
  }

  const res = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages: opts.messages,
      model: opts.model,
      think: opts.think,
      search: opts.search,
    }),
    signal: opts.signal,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const errJson = await res.json();
      message = errJson?.error?.message || errJson?.error || message;
    } catch {
      // keep default
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!res.body || contentType.includes("application/json")) {
    const data = await res.json().catch(() => ({}));
    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.content ||
      data?.reply ||
      "";
    if (reply) {
      ttftMs = Math.round(performance.now() - startedAt);
      content = reply;
      opts.onContent?.(reply);
    }
    return {
      content,
      reasoning,
      imageUrl,
      ttftMs,
      totalMs: Math.round(performance.now() - startedAt),
    };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "status") {
          opts.onStatus?.(ev.agent || "Gyra", ev.status || "Processing...");
        } else if (ev.type === "reasoning" && ev.reasoning) {
          reasoning += (reasoning ? "\n" : "") + String(ev.reasoning);
          opts.onReasoning?.(String(ev.reasoning));
        } else if (ev.type === "content" && ev.text) {
          if (ttftMs === null) ttftMs = Math.round(performance.now() - startedAt);
          content += String(ev.text);
          opts.onContent?.(String(ev.text));
        } else if (ev.type === "image" && ev.url) {
          imageUrl = String(ev.url);
          opts.onImage?.(imageUrl);
        } else if (ev.type === "error") {
          throw new Error(ev.text || "Stream error from Gyra backend.");
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
          // Only rethrow explicit backend stream errors
          if (parseErr.message.includes("Stream error") || parseErr.message.includes("pipeline")) {
            throw parseErr;
          }
        }
      }
    }
  }

  return {
    content,
    reasoning,
    imageUrl,
    ttftMs,
    totalMs: Math.round(performance.now() - startedAt),
  };
}
