// app/api/coding/diagnostics/route.ts
// Problems panel backend: TypeScript, ESLint and build output, parsed into
// a single shape. Reports honestly when no checker is configured.

import { NextResponse } from "next/server";
import { runDiagnostics, diagnosticsToPrompt } from "@/app/lib/coding/diagnostics";
import { errorMessage, getSandbox } from "@/app/lib/coding/handle";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sandboxId = url.searchParams.get("sandboxId");

  try {
    const sandbox = await getSandbox(sandboxId);
    const report = await runDiagnostics(sandbox);

    return NextResponse.json({
      ok: true,
      sandboxId: sandbox.sandboxId,
      report,
      prompt: diagnosticsToPrompt(report),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: { sandboxId?: string } = {};
  try {
    body = (await request.json()) as { sandboxId?: string };
  } catch {
    body = {};
  }

  try {
    const sandbox = await getSandbox(body.sandboxId);
    const report = await runDiagnostics(sandbox);

    return NextResponse.json({
      ok: true,
      sandboxId: sandbox.sandboxId,
      report,
      prompt: diagnosticsToPrompt(report),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}