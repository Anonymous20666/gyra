// app/api/coding/tests/route.ts
// Test & Verification Center endpoints.
//   GET  /api/coding/tests?sandboxId=...           -> detected runner + honesty notes
//   POST /api/coding/tests  { sandboxId, command? } -> run the suite, structured results

import { NextResponse } from "next/server";
import {
  detectTestFramework,
  runTests,
  testsToPrompt,
} from "@/app/lib/coding/tests";
import { errorMessage, getSandbox } from "@/app/lib/coding/handle";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sandboxId = url.searchParams.get("sandboxId");

  try {
    const sandbox = await getSandbox(sandboxId);
    const info = await detectTestFramework(sandbox);

    return NextResponse.json({
      ok: true,
      sandboxId: sandbox.sandboxId,
      info,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: { sandboxId?: string; command?: string } = {};
  try {
    body = (await request.json()) as { sandboxId?: string; command?: string };
  } catch {
    body = {};
  }

  try {
    const sandbox = await getSandbox(body.sandboxId);
    const run = await runTests(sandbox, { command: body.command ?? null });

    return NextResponse.json({
      ok: true,
      sandboxId: sandbox.sandboxId,
      run,
      prompt: testsToPrompt(run),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}