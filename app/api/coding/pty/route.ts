// app/api/coding/pty/route.ts
// Real terminal backend over E2B PTYs.
//   POST { action: "create" | "input" | "resize" | "kill", ... }
//   GET  ?sandboxId=...&pid=...   -> server-sent events with live output
//
// PTY support is reached defensively through getPty(), because the public
// @e2b/code-interpreter types do not always expose sandbox.pty.

import { NextResponse } from "next/server";
import { getPty } from "@/app/lib/coding/sandbox";
import { errorMessage, getSandbox } from "@/app/lib/coding/handle";

export const runtime = "nodejs";
export const maxDuration = 300;

interface PtyBody {
  sandboxId?: string;
  action?: "create" | "input" | "resize" | "kill";
  pid?: number;
  cols?: number;
  rows?: number;
  cwd?: string;
  data?: string;
  encoding?: "utf8" | "base64";
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function unavailable(): Response {
  return NextResponse.json(
    {
      ok: false,
      error:
        "This sandbox image does not expose PTY support. The terminal falls back to the command runner. Update @e2b/code-interpreter to restore PTYs.",
    },
    { status: 501 },
  );
}

export async function POST(request: Request): Promise<Response> {
  let body: PtyBody = {};
  try {
    body = (await request.json()) as PtyBody;
  } catch {
    body = {};
  }

  if (!body.action) {
    return NextResponse.json(
      { ok: false, error: "An action is required." },
      { status: 400 },
    );
  }

  try {
    const sandbox = await getSandbox(body.sandboxId);
    const pty = getPty(sandbox) as any;
    if (!pty) return unavailable();

    switch (body.action) {
      case "create": {
        const cols = Math.max(20, Math.min(400, body.cols ?? 100));
        const rows = Math.max(5, Math.min(200, body.rows ?? 30));
        const cwd = body.cwd?.trim() || "/home/user";

        const handle = await pty.create({
          cols,
          rows,
          cwd,
          onData: () => {
            /* live output is consumed by the SSE connection */
          },
        });

        return NextResponse.json({
          ok: true,
          sandboxId: sandbox.sandboxId,
          pid: handle?.pid ?? null,
        });
      }

      case "input": {
        if (typeof body.pid !== "number") {
          return NextResponse.json(
            { ok: false, error: "A pid is required." },
            { status: 400 },
          );
        }
        const raw = body.data ?? "";
        const bytes =
          body.encoding === "base64"
            ? new Uint8Array(Buffer.from(raw, "base64"))
            : new TextEncoder().encode(raw);

        await pty.sendInput(body.pid, bytes);
        return NextResponse.json({ ok: true });
      }

      case "resize": {
        if (typeof body.pid !== "number") {
          return NextResponse.json(
            { ok: false, error: "A pid is required." },
            { status: 400 },
          );
        }
        await pty.resize(body.pid, {
          cols: Math.max(20, Math.min(400, body.cols ?? 100)),
          rows: Math.max(5, Math.min(200, body.rows ?? 30)),
        });
        return NextResponse.json({ ok: true });
      }

      case "kill": {
        if (typeof body.pid !== "number") {
          return NextResponse.json(
            { ok: false, error: "A pid is required." },
            { status: 400 },
          );
        }
        await pty.kill(body.pid);
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json(
          { ok: false, error: `Unknown pty action: ${String(body.action)}` },
          { status: 400 },
        );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sandboxId = url.searchParams.get("sandboxId") ?? undefined;
  const pidRaw = url.searchParams.get("pid");
  const pid = pidRaw ? Number(pidRaw) : NaN;

  if (!Number.isFinite(pid)) {
    return NextResponse.json(
      { ok: false, error: "A numeric pid is required." },
      { status: 400 },
    );
  }

  let sandbox;
  try {
    sandbox = await getSandbox(sandboxId);
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }

  const pty = getPty(sandbox) as any;
  if (!pty) return unavailable();

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const push = (payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          closed = true;
        }
      };

      const onData = (chunk: Uint8Array) => {
        const text = new TextDecoder().decode(chunk);
        push({ type: "data", data: text });
      };

      let handle: any = null;
      try {
        handle = pty.connect(pid, { onData });
        push({ type: "ready", pid });
      } catch (error: unknown) {
        push({ type: "error", error: errorMessage(error) });
      }

      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          closed = true;
        }
      }, 15_000);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        try {
          handle?.disconnect?.();
        } catch {
          /* ignore */
        }
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      };
    },
    cancel() {
      cleanup?.();
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