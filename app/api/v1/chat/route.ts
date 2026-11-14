import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import {
  rateLimit,
  getClientIP,
  detectJailbreak,
  logSecurityEvent,
  rateLimitResponse,
  jailbreakResponse,
} from "../../security";
import {
  getUserFromToken,
  getSubscription,
  isSuperGyra,
  type Subscription,
} from "@/app/lib/subscription";
import { FREE_LIMIT } from "@/app/lib/paymentConfig";

// ---------- Types ----------
type ChatRole = "system" | "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatRequestBody {
  messages?: unknown;
  voice?: unknown;
  stream?: boolean;
  model?: string; // 🚨 Added to accept gyra-super2.0
}

// ---------- Config ----------
const MAX_MESSAGES = 50;
const MAX_TOTAL_CHARS = 32_000;
const PROVIDER_TIMEOUT_MS = 60_000; // Increased for DeepSeek reasoning
const IP_RATE_LIMIT = 60;          // per minute
const KEY_RATE_LIMIT = 100;        // per minute

// ---------- Supabase admin ----------
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ---------- Helpers ----------
function errorResponse(
  code: string,
  message: string,
  status: number,
  extraHeaders: Record<string, string> = {}
) {
  return Response.json(
    { error: { code, message } },
    { status, headers: extraHeaders }
  );
}

function hashKeyPrefix(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex").slice(0, 12);
}

function validateMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  if (input.length > MAX_MESSAGES) return null;

  const validRoles: ChatRole[] = ["system", "user", "assistant"];
  let totalChars = 0;
  const out: ChatMessage[] = [];

  for (const m of input) {
    if (
      !m ||
      typeof m !== "object" ||
      typeof (m as any).role !== "string" ||
      typeof (m as any).content !== "string" ||
      !validRoles.includes((m as any).role)
    ) {
      return null;
    }
    const content = (m as any).content as string;
    totalChars += content.length;
    if (totalChars > MAX_TOTAL_CHARS) return null;
    out.push({ role: (m as any).role as ChatRole, content });
  }
  return out;
}

function buildResponseBody(
  aiReply: string,
  provider: string,
  voice: boolean,
  modelName: string
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    id: `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: modelName,
    provider,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: aiReply },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    },
  };

  if (voice) {
    body.voice = {
      enabled: true,
      voice_id: "gyra-arax",
      voice_name: "Ara",
      speak_text: aiReply,
      instructions:
        "Use your platform's text-to-speech to speak `speak_text` aloud.",
    };
  }

  return body;
}

// ---------- Provider callers ----------
async function callHuggingFace(messages: ChatMessage[]): Promise<string | null> {
  if (!process.env.HUGGINGFACE_API_TOKEN) return null;
  try {
    const res = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.1-8B-Instruct",
          messages,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    return null;
  }
}

async function callXai(messages: ChatMessage[]): Promise<string | null> {
  if (!process.env.XAI_API_KEY) return null;
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    return null;
  }
}

// ---------- Route ----------
export async function POST(req: Request) {
  try {
    // 1. IP rate limit — 60 req/min
    const clientIP = getClientIP(req);
    const ipLimit = rateLimit(`api-ip:${clientIP}`, IP_RATE_LIMIT, 60 * 1000);

    if (!ipLimit.success) {
      logSecurityEvent("rate_limit", { ip: clientIP, path: "/api/v1/chat" });
      return rateLimitResponse(ipLimit.resetAt);
    }

    // 2. Extract API key
    const authHeader = req.headers.get("authorization") || "";
    const [scheme, token] = authHeader.split(" ");
    const apiKey = (token || "").trim();

    if (scheme !== "Bearer" || !apiKey || !apiKey.startsWith("gyra_")) {
      return errorResponse(
        "invalid_api_key",
        "Missing or invalid API key. Include header: Authorization: Bearer gyra_xxx",
        401
      );
    }

    const keyPrefix = hashKeyPrefix(apiKey);

    // 3. Per-key rate limit — 100 req/min
    const keyLimit = rateLimit(`api-key:${apiKey}`, KEY_RATE_LIMIT, 60 * 1000);
    if (!keyLimit.success) {
      logSecurityEvent("rate_limit", {
        ip: clientIP,
        keyPrefix,
        path: "/api/v1/chat",
      });
      return errorResponse(
        "rate_limited",
        "Your API key has hit its rate limit (100 requests per minute).",
        429,
        {
          "Retry-After": String(
            Math.max(1, Math.ceil((keyLimit.resetAt - Date.now()) / 1000))
          ),
        }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 4. Validate key
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("key", apiKey)
      .eq("active", true)
      .maybeSingle();

    if (keyError || !keyData) {
      return errorResponse(
        "invalid_api_key",
        "This API key does not exist or has been revoked.",
        401
      );
    }

    // 5. Parse body
    let body: ChatRequestBody;
    try {
      body = (await req.json()) as ChatRequestBody;
    } catch {
      return errorResponse("invalid_json", "Request body must be valid JSON.", 400);
    }

    const messages = validateMessages(body.messages);
    if (!messages) {
      return errorResponse(
        "invalid_request",
        `\`messages\` must be a non-empty array of {role, content} objects.`,
        400
      );
    }

    // 5b. Subscription check
    let subscription: Subscription = {
      plan: "free",
      status: "inactive",
      expiresAt: null,
      creditsUsd: 0,
    };

    const userToken = req.headers.get("x-gyra-user-token") || "";
    if (userToken) {
      try {
        const user = await getUserFromToken(userToken);
        if (user) {
          subscription = await getSubscription(user.id);
        }
      } catch (e) {}
    }

    const isSuper = isSuperGyra(subscription);
    const requestedModel = body.model || "gyra-1.0";
    const useSuperModel = requestedModel === "gyra-super2.0";

    // 🚨 BLOCK NON-SUBSCRIBERS FROM SUPER 2.0 🚨
    if (useSuperModel && !isSuper) {
      return errorResponse(
        "upgrade_required",
        "SuperGyra 2.0 is exclusive to subscribers. Please upgrade your account.",
        403,
        { "X-Upgrade-URL": "https://gyra.ng/upgrade" }
      );
    }

    // Standard limits apply ONLY if not using Super 2.0
    const userMessageCount = messages.filter((m) => m.role === "user").length;
    if (!useSuperModel && !isSuper && userMessageCount > FREE_LIMIT) {
      return errorResponse(
        "chat_limit_reached",
        `You've reached the free limit of ${FREE_LIMIT} messages.`,
        402,
        { "X-Upgrade-URL": "https://gyra.ng/upgrade" }
      );
    }

    const voiceEnabled = body.voice === true;
    const isStreaming = body.stream === true;

    // 6. Jailbreak detection
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg?.content) {
      const check = detectJailbreak(lastUserMsg.content);
      if (check.suspicious) {
        logSecurityEvent("jailbreak", {
          ip: clientIP,
          keyPrefix,
          matched: check.matched,
          path: "/api/v1/chat",
        });
        return jailbreakResponse();
      }
    }

    // 7. Build request
    const systemPrompt: ChatMessage = {
      role: "system",
      content: useSuperModel 
        ? "You are Gyra Super 2.0, the premium, elite-tier AI created by Victory Lord of Genvia AI Company. You have deep reasoning capabilities, unlimited context, and priority execution. Be incredibly helpful, concise, and precise."
        : "You are Gyra, created by Genvia AI Company. Be helpful, direct, and accurate.",
    };

    const fullMessages: ChatMessage[] = [systemPrompt, ...messages];

    // 🚨 ROUTE TO DEEPSEEK IF SUPER, GROQ IF STANDARD 🚨
    if (useSuperModel) {
      const deepseekRes = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-reasoner",
          messages: fullMessages,
          stream: isStreaming,
        }),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });

      if (!deepseekRes.ok) {
        throw new Error("DeepSeek API failed.");
      }

      // Update usage
      void supabaseAdmin.rpc("increment_api_key_usage", { key_id: keyData.id }).then(() => {});

      if (isStreaming && deepseekRes.body) {
        return new Response(deepseekRes.body, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
        });
      }

      const data = await deepseekRes.json();
      const aiReply = data.choices?.[0]?.message?.content || "";
      return Response.json(buildResponseBody(aiReply, "deepseek", voiceEnabled, "gyra-super2.0"));
    } else {
      // Standard Gyra 1.0
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: fullMessages,
          temperature: 0.7,
          stream: isStreaming,
        }),
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      });

      if (groqRes.ok) {
        void supabaseAdmin.rpc("increment_api_key_usage", { key_id: keyData.id }).then(() => {});

        if (isStreaming && groqRes.body) {
          return new Response(groqRes.body, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
          });
        }

        const data = await groqRes.json();
        const aiReply = data?.choices?.[0]?.message?.content;
        if (aiReply) {
          return Response.json(buildResponseBody(aiReply, "groq", voiceEnabled, "gyra-1.0"));
        }
      }

      // --- FALLBACKS ---
      let aiReply: string | null = null;
      let provider = "none";

      aiReply = await callHuggingFace(fullMessages);
      if (aiReply) provider = "huggingface";

      if (!aiReply) {
        aiReply = await callXai(fullMessages);
        if (aiReply) provider = "grok";
      }

      if (!aiReply) {
        return errorResponse("ai_unavailable", "All AI providers are temporarily unavailable.", 503);
      }

      return Response.json(buildResponseBody(aiReply, provider, voiceEnabled, "gyra-1.0"));
    }

  } catch (err) {
    console.error("chat route error:", err);
    return errorResponse("internal_error", "An unexpected error occurred.", 500);
  }
}