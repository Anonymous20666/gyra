// app/api/coding/search/route.ts
//   POST /api/coding/search { sandboxId?, query, limit? }
// Hybrid project search: filenames, content, symbols and imports.

import { NextResponse } from "next/server";
import { searchProject, searchResultToText } from "@/app/lib/coding/search";
import { errorMessage, getSandbox } from "@/app/lib/coding/handle";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const sandboxId = url.searchParams.get("sandboxId");

  if (!query.trim()) {
    return NextResponse.json(
      { ok: false, error: "A search query is required." },
      { status: 400 },
    );
  }

  try {
    const sandbox = await getSandbox(sandboxId);
    const results = await searchProject(sandbox, query.trim());

    return NextResponse.json({
      ok: true,
      sandboxId: sandbox.sandboxId,
      query,
      results,
      prompt: searchResultToText(results),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: { sandboxId?: string; query?: string } = {};
  try {
    body = (await request.json()) as { sandboxId?: string; query?: string };
  } catch {
    body = {};
  }

  const query = (body.query ?? "").trim();
  if (!query) {
    return NextResponse.json(
      { ok: false, error: "A search query is required." },
      { status: 400 },
    );
  }

  try {
    const sandbox = await getSandbox(body.sandboxId);
    const results = await searchProject(sandbox, query);

    return NextResponse.json({
      ok: true,
      sandboxId: sandbox.sandboxId,
      query,
      results,
      prompt: searchResultToText(results),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}