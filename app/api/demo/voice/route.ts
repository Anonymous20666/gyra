import { NextRequest } from "next/server";
import { spawn } from "node:child_process";
import { writeFileSync, unlinkSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PIPER_BIN = process.env.GYRA_VOICE_PIPER_BIN || "/data/gyra-piper/bin/piper";
const PIPER_DIR = process.env.GYRA_VOICE_PIPER_DIR || "/data/gyra-piper";
const PIPER_MODEL = process.env.GYRA_VOICE_MODEL || "en_US-lessac-medium";
const MAX_CHARS = 300;
const RATE_LIMIT = 6; // generations
const RATE_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes
const TTS_TIMEOUT_MS = 30000;

// In-memory per-IP rate limit (demo endpoint; single instance)
const buckets = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (buckets.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    buckets.set(ip, arr);
    return true;
  }
  arr.push(now);
  buckets.set(ip, arr);
  return false;
}

function runPiper(text: string): Promise<Buffer> {
  const id = randomBytes(8).toString("hex");
  const wavPath = `${tmpdir()}/gyra-voice-${id}.wav`;
  const txtPath = `${tmpdir()}/gyra-voice-text-${id}.txt`;
  writeFileSync(txtPath, text, "utf8");

  return new Promise<Buffer>((resolve, reject) => {
    let child;
    try {
      // -i reads the text from a file: no shell, no argument injection.
      child = spawn(/*turbopackIgnore: true*/ PIPER_BIN, ["-m", PIPER_MODEL, "-i", txtPath, "-f", wavPath], {
        cwd: PIPER_DIR,
        stdio: ["ignore", "ignore", "pipe"],
      });
    } catch (e) {
      reject(e as Error);
      return;
    }
    let stderr = "";
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString("utf8");
    });
    const timer = setTimeout(() => {
      try { child.kill("SIGKILL"); } catch {}
      reject(new Error("Voice generation timed out."));
    }, TTS_TIMEOUT_MS);
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const cleanup = () => {
        try { if (existsSync(wavPath)) unlinkSync(wavPath); } catch {}
        try { if (existsSync(txtPath)) unlinkSync(txtPath); } catch {}
      };
      if (code === 0 && existsSync(wavPath)) {
        const wav = readFileSync(wavPath);
        cleanup();
        resolve(wav);
      } else {
        cleanup();
        reject(new Error("Voice generation failed. " + (stderr.split("\n").pop() || "Unknown error")));
      }
    });
  });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (rateLimited(ip)) {
    return Response.json(
      { error: "Rate limit reached. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return Response.json({ error: "Missing text." }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return Response.json(
      { error: `Please keep it under ${MAX_CHARS} characters.` },
      { status: 400 }
    );
  }

  try {
    const wav = await runPiper(text);
    const bytes = new Uint8Array(wav.length);
    wav.copy(bytes);
    return new Response(bytes.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Voice generation failed." },
      { status: 500 }
    );
  }
}
