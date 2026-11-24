/* app/api/coding/session/route.ts */

import { NextResponse } from "next/server";
import {
  SANDBOX_ROOT,
  SandboxError,
  hasSandboxCredentials,
  makeDir,
  openSandbox,
  previewUrl,
  WORKSPACE_PORT,
} from "@/app/lib/coding/sandbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function message(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Could not start the sandbox.";
}

export async function GET() {
  return NextResponse.json({
    ok: hasSandboxCredentials(),
    configured: hasSandboxCredentials(),
    root: SANDBOX_ROOT,
  });
}

export async function POST(request: Request) {
  try {
    if (!hasSandboxCredentials()) {
      return NextResponse.json(
        {
          error:
            "E2B_API_KEY is not set. Add it in your Vercel project settings and redeploy.",
        },
        { status: 500 },
      );
    }

    let body: { timeoutSeconds?: number; template?: string } = {};
    try {
      body = (await request.json()) as { timeoutSeconds?: number; template?: string };
    } catch {
      body = {};
    }

    const sandbox = await openSandbox({
      timeoutSeconds: body.timeoutSeconds,
      template: body.template,
    });

    await makeDir(sandbox, SANDBOX_ROOT).catch(() => undefined);

    const url = previewUrl(sandbox, WORKSPACE_PORT);

    return NextResponse.json({
      ok: true,
      id: sandbox.sandboxId,
      sandboxId: sandbox.sandboxId,
      sessionId: sandbox.sandboxId,
      template: sandbox.templateId,
      timeout: sandbox.timeout,
      root: SANDBOX_ROOT,
      previewUrl: url,
      url,
    });
  } catch (error) {
    const status = error instanceof SandboxError ? error.status : 500;
    return NextResponse.json({ error: message(error) }, { status });
  }
}