/* app/api/coding/search/route.ts */

import { NextResponse } from "next/server";
import { searchProject, type SearchResult } from "@/app/lib/coding/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function message(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Search failed.";
}

function serialize(result: SearchResult) {
  return {
    ok: result.error === null,
    query: result.query,
    results: result.results,
    hits: result.hits,
    matches: result.matches,
    total: result.total,
    truncated: result.truncated,
    error: result.error,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? url.searchParams.get("query") ?? "";
    const sandboxId = url.searchParams.get("sandboxId") ?? undefined;
    const include = url.searchParams.get("include") ?? undefined;
    const caseSensitive = url.searchParams.get("case") === "1";
    const regex = url.searchParams.get("regex") === "1";
    const maxResults = Number(url.searchParams.get("limit") ?? "") || 500;

    const result = await searchProject(sandboxId, query, {
      include,
      caseSensitive,
      regex,
      maxResults,
    });

    return NextResponse.json(serialize(result));
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: {
      query?: string;
      q?: string;
      sandboxId?: string;
      include?: string;
      caseSensitive?: boolean;
      regex?: boolean;
      maxResults?: number;
    } = {};

    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }

    const result = await searchProject(body.sandboxId ?? null, body.query ?? body.q ?? "", {
      include: body.include,
      caseSensitive: body.caseSensitive,
      regex: body.regex,
      maxResults: body.maxResults,
    });

    return NextResponse.json(serialize(result));
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}