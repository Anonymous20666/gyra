import {
  rateLimit,
  getClientIP,
  logSecurityEvent,
  rateLimitResponse,
} from "../../security";

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const HF_URL =
  "https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

export async function POST(req: Request) {
  try {
    // 1. Rate limit — 20 transcriptions/min per IP
    const clientIP = getClientIP(req);
    const limit = rateLimit(`transcribe:${clientIP}`, 20, 60 * 1000);
    if (!limit.success) {
      logSecurityEvent("rate_limit", {
        ip: clientIP,
        path: "/api/v1/transcribe",
      });
      return rateLimitResponse(limit.resetAt);
    }

    // 2. Read multipart form
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return errorResponse(
        "invalid_request",
        "Expected multipart/form-data.",
        400
      );
    }

    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return errorResponse("invalid_request", "Missing `audio` field.", 400);
    }

    if (audio.size > MAX_BYTES) {
      return errorResponse(
        "payload_too_large",
        "Audio file is too large (max 25MB).",
        413
      );
    }

    // 3. Try Groq first
    if (process.env.GROQ_API_KEY) {
      const text = await tryGroq(audio);
      if (text) return Response.json({ text, provider: "groq" });
    }

    // 4. Fall back to HuggingFace
    if (process.env.HUGGINGFACE_API_TOKEN) {
      const text = await tryHuggingFace(audio);
      if (text) return Response.json({ text, provider: "huggingface" });
    }

    return errorResponse(
      "stt_unavailable",
      "Speech-to-text is not configured. Set GROQ_API_KEY or HUGGINGFACE_API_TOKEN.",
      503
    );
  } catch (err) {
    console.error("transcribe route error:", err);
    return errorResponse("internal_error", "Unexpected error.", 500);
  }
}

// ---------- providers ----------
async function tryGroq(audio: Blob): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("file", audio, "audio.webm");
    form.append("model", "whisper-large-v3-turbo");
    form.append("response_format", "json");
    form.append("temperature", "0");

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: form,
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      console.error(
        "groq stt non-OK:",
        res.status,
        await res.text().catch(() => "")
      );
      return null;
    }
    const data = await res.json();
    return typeof data?.text === "string" ? data.text : null;
  } catch (e) {
    console.error("groq stt error:", e);
    return null;
  }
}

async function tryHuggingFace(audio: Blob): Promise<string | null> {
  try {
    const buf = await audio.arrayBuffer();
    const res = await fetch(HF_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
        "Content-Type": audio.type || "audio/webm",
      },
      body: buf,
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      console.error(
        "hf stt non-OK:",
        res.status,
        await res.text().catch(() => "")
      );
      return null;
    }
    const data = await res.json();
    if (typeof data === "string") return data;
    return typeof data?.text === "string" ? data.text : null;
  } catch (e) {
    console.error("hf stt error:", e);
    return null;
  }
}

// ---------- helper ----------
function errorResponse(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}