// app/api/coding/project/route.ts
// Project Intelligence endpoint. Everything returned here is scanned from the
// sandbox on demand — no cached guesses, no invented language percentages.

import { NextResponse } from "next/server";
import { scanProject } from "@/app/lib/coding/project";
import { errorMessage, getSandbox } from "@/app/lib/coding/handle";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sandboxId = url.searchParams.get("sandboxId");

  try {
    const sandbox = await getSandbox(sandboxId);
    const project = await scanProject(sandbox);

    return NextResponse.json({
      ok: true,
      sandboxId: sandbox.sandboxId,
      project,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}