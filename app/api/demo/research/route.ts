import { rateLimit, getClientIP } from "../../security";
import { webSearch } from "@/app/lib/websearch";

// Gyra demo research endpoint for the landing page.
// REAL web research (Bing primary, DuckDuckGo fallbacks — same pipeline as
// the product's Atlas agent), then a real LLM synthesis with the local
// Ollama model. Rate-limited per IP. Sources returned are REAL current
// results — never fabricated.

const OLLAMA_URL = process.env.GYRA_DEMO_OLLAMA_URL || "http://127.0.0.1:11434";
const MODEL = process.env.GYRA_DEMO_LLM_MODEL || "qwen2.5-coder:3b";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const MAX_CHARS = 200;

export async function POST(req: Request) {
  try {
    const ip = getClientIP(req);
    const rl = rateLimit(`demo-research:${ip}`, 3, 10 * 60 * 1000);
    if (!rl.success) {
      return Response.json(
        { error: "Too many research demos. Try again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    let query = "";
    try {
      const body = await req.json();
      query = typeof body?.query === "string" ? body.query.trim() : "";
    } catch {
      query = "";
    }
    if (query.length < 3 || query.length > MAX_CHARS) {
      return Response.json(
        { error: "Send a short research question (3–200 characters)." },
        { status: 400 }
      );
    }

    // 1. Real web search + source reading
    let search;
    try {
      search = await webSearch(query, { max: 4, contextChars: 900 });
    } catch {
      return Response.json(
        { error: "Live search is unavailable right now. Try again shortly." },
        { status: 502 }
      );
    }

    if (search.results.length === 0) {
      return Response.json({ query, sources: [], answer: "", sourceCount: 0 });
    }

    // 2. Real LLM synthesis from the scraped context (local model)
    let answer = "";
    try {
      const res = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          model: MODEL,
          stream: false,
          options: { num_predict: 260 },
          messages: [
            {
              role: "system",
              content:
                "You are Gyra, an AI research assistant. Answer ONLY using the provided sources. " +
                "Write 3–5 clear sentences. Cite sources inline as [1], [2] matching their numbers. " +
                "If the sources are insufficient, say exactly what is missing. No filler.",
            },
            {
              role: "user",
              content: `Question: ${query}\n\nSources:\n${search.contexts.join("\n\n")}`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        answer = data?.message?.content?.trim() || "";
      }
    } catch {
      answer = "";
    }

    return Response.json({
      query,
      sources: search.results.map((r) => ({ title: r.title, url: r.url })),
      answer,
      sourceCount: search.results.length,
    });
  } catch (err: any) {
    return Response.json(
      { error: "Research demo failed. Try again." },
      { status: 500 }
    );
  }
}
