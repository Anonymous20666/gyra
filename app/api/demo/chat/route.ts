import { rateLimit, getClientIP } from "../../security";

// Dev-mode AI provider adapter for the landing page demo.
// Talks to a LOCAL Ollama instance (never exposed publicly) and streams
// the response as SSE. Rate-limited per IP; no auth required because the
// model is small and the endpoint is intentionally cheap to run.

const OLLAMA_URL = process.env.GYRA_DEMO_OLLAMA_URL || "http://127.0.0.1:11434";
const MODEL = process.env.GYRA_DEMO_LLM_MODEL || "qwen2.5-coder:3b";
const SYSTEM_PROMPT =
  "You are Gyra, an AI intelligence product by Genvia AI Company. " +
  "You are a calm, precise, helpful assistant for general questions, ideas, writing, and light coding. " +
  "Be concise: usually 2–6 sentences. " +
  "When asked to build or write code, reply with at most two short sentences of explanation, " +
  "then ONE complete fenced code block (markdown) with the full, runnable code. " +
  "Never invent facts, citations, or APIs that do not exist. If you are unsure, say so briefly. " +
  "Keep total output under ~3500 characters.";

let inFlight = 0;
const MAX_IN_FLIGHT = 2;

export const maxDuration = 120;

export async function POST(req: Request) {
  const ip = getClientIP(req);
  const rl = rateLimit(`demo:${ip}`, 8, 10 * 60 * 1000);
  if (!rl.success) {
    return Response.json(
      { error: "Too many demo requests. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }
  if (inFlight >= MAX_IN_FLIGHT) {
    return Response.json({ error: "The demo model is busy. Try again in a moment." }, { status: 503 });
  }

  let prompt: string;
  try {
    const body = await req.json();
    prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!prompt) return Response.json({ error: "Missing prompt." }, { status: 400 });
  if (prompt.length > 800) return Response.json({ error: "Prompt too long (max 800 characters)." }, { status: 400 });

  inFlight++;
  const started = Date.now();

  const encoder = new TextEncoder();
  const send = (obj: unknown) => `data: ${JSON.stringify(obj)}\n\n`;
  let streamClosed = false;
  let streamController: ReadableStreamDefaultController | undefined;
  const safeEnqueue = (chunk: Uint8Array) => {
    if (streamClosed) return;
    try {
      streamController?.enqueue(chunk);
    } catch {
      // stream was cancelled/closed by the client — nothing more to deliver
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      streamController = controller;
      const abort = new AbortController();
      const onClientAbort = () => abort.abort();
      req.signal.addEventListener("abort", onClientAbort);
      const hardTimeout = setTimeout(() => abort.abort(), 90_000);

      try {
        safeEnqueue(encoder.encode(send({ type: "status", status: "thinking", model: MODEL })));

        const res = await fetch(`${OLLAMA_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abort.signal,
          body: JSON.stringify({
            model: MODEL,
            stream: true,
            keep_alive: "10m",
            options: { num_ctx: 4096, num_predict: 900, temperature: 0.4 },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: prompt },
            ],
          }),
        });
        if (!res.ok || !res.body) {
          throw new Error(`Ollama error ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let text = "";
        let evalTokens = 0;
        safeEnqueue(encoder.encode(send({ type: "status", status: "streaming" })));

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n");
          buf = parts.pop() ?? "";
          for (const part of parts) {
            if (!part.trim()) continue;
            try {
              const j = JSON.parse(part);
              if (j.error) throw new Error(j.error);
              const delta = j.message?.content ?? "";
              if (delta) {
                text += delta;
                safeEnqueue(encoder.encode(send({ type: "content", text: delta })));
              }
              if (j.done) evalTokens = j.eval_count ?? 0;
            } catch (e) {
              if (e instanceof Error && e.message && e.message.length < 300 && !e.message.startsWith("{")) {
                throw e;
              }
              // partial JSON lines are expected mid-stream; ignore
            }
          }
        }
        safeEnqueue(
          encoder.encode(
            send({ type: "done", ms: Date.now() - started, tokens: evalTokens, chars: text.length })
          )
        );
      } catch (e) {
        const aborted = abort.signal.aborted;
        const msg = aborted
          ? "cancelled"
          : e instanceof Error && /fetch failed|ECONNREFUSED/i.test(e.message)
            ? "The local model is not reachable right now."
            : e instanceof Error && /Ollama error/i.test(e.message)
              ? "The local model returned an error."
              : "Something went wrong while talking to the model.";
        safeEnqueue(
          encoder.encode(send({ type: aborted ? "cancelled" : "error", message: msg }))
        );
      } finally {
        clearTimeout(hardTimeout);
        req.signal.removeEventListener("abort", onClientAbort);
        inFlight--;
        try {
          controller.close();
        } catch {
          // already closed/cancelled
        }
      }
    },
    cancel() {
      streamClosed = true;
      // client disconnected; fetch abort happens via req.signal listener
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
