/* app/api/coding/diagnostics/route.ts */

import { NextResponse } from "next/server";
import { runDiagnostics } from "@/app/lib/coding/diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function message(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Diagnostics failed.";
}

async function readOptions(request: Request) {
  const url = new URL(request.url);
  const sandboxId = url.searchParams.get("sandboxId") ?? undefined;
  const lint = url.searchParams.get("eslint");
  return {
    sandboxId,
    includeEslint: lint !== "0" && lint !== "false",
  };
}

export async function GET(request: Request) {
  try {
    const { sandboxId, includeEslint } = await readOptions(request);
    const report = await runDiagnostics(sandboxId, { includeEslint });
    return NextResponse.json({
      ok: report.ok,
      total: report.total,
      errors: report.errors,
      warnings: report.warnings,
      ranTsc: report.ranTsc,
      ranEslint: report.ranEslint,
      diagnostics: report.diagnostics,
      items: report.diagnostics,
      error: report.error,
      scannedAt: report.scannedAt,
    });
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: { sandboxId?: string; includeEslint?: boolean } = {};
    try {
      body = (await request.json()) as { sandboxId?: string; includeEslint?: boolean };
    } catch {
      body = {};
    }

    const report = await runDiagnostics(body.sandboxId ?? null, {
      includeEslint: body.includeEslint !== false,
    });

    return NextResponse.json({
      ok: report.ok,
      total: report.total,
      errors: report.errors,
      warnings: report.warnings,
      ranTsc: report.ranTsc,
      ranEslint: report.ranEslint,
      diagnostics: report.diagnostics,
      items: report.diagnostics,
      error: report.error,
      scannedAt: report.scannedAt,
    });
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}