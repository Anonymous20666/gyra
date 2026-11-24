/* app/api/coding/pty/route.ts
 * Single-shot command channel. The terminal pane uses /api/coding/terminal for
 * interactive runs; this endpoint stays available for callers that just want
 * one command's output.
 */

import { NextResponse } from "next/server";
import {
  SANDBOX_ROOT,
  SandboxError,
  execCommand,
  getSandbox,
} from "@/app/lib/coding/sandbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function message(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Command failed.";
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    channel: "pty",
    streaming: false,
    root: SANDBOX_ROOT,
  });
}

export async function POST(request: Request) {
  try {
    let body: {
      command?: string;
      cmd?: string;
      cwd?: string;
      sandboxId?: string;
      sessionId?: string;
      timeoutMs?: number;
    } = {};

    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }

    const command = (body.command ?? body.cmd ?? "").trim();
    if (!command) {
      return NextResponse.json(
        { error: "A command is required." },
        { status: 400 },
      );
    }

    const sandbox = await getSandbox(body.sandboxId ?? body.sessionId ?? null);
    const result = await execCommand(sandbox, command, {
      cwd: body.cwd ?? SANDBOX_ROOT,
      timeoutMs: body.timeoutMs,
    });

    return NextResponse.json({
      ok: result.ok,
      output: result.output,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
    });
  } catch (error) {
    const status = error instanceof SandboxError ? error.status : 500;
    return NextResponse.json({ error: message(error) }, { status });
  }
}