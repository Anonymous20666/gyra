/* app/api/coding/git/route.ts */

import { NextResponse } from "next/server";
import {
  gitCheckout,
  gitCommit,
  gitCreateBranch,
  gitDiff,
  gitDiscard,
  gitStage,
  gitUnstage,
  readGitPanel,
  type GitPanel,
} from "@/app/lib/coding/git";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GitAction =
  | "stage"
  | "unstage"
  | "discard"
  | "commit"
  | "checkout"
  | "branch"
  | "diff";

type GitBody = {
  action?: GitAction;
  sandboxId?: string;
  cwd?: string;
  paths?: string[];
  path?: string;
  message?: string;
  branch?: string;
};

function message(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Git operation failed.";
}

function serialize(panel: GitPanel) {
  return {
    ok: true,
    ...panel,
    branch: panel.branch,
    branches: panel.branches,
    files: panel.files,
    commits: panel.commits,
    clean: panel.clean,
    isRepo: panel.isRepo,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sandboxId = url.searchParams.get("sandboxId") ?? undefined;
    const cwd = url.searchParams.get("cwd") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? "") || 20;

    const panel = await readGitPanel(sandboxId, { cwd, commitLimit: limit });
    return NextResponse.json(serialize(panel));
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GitBody;
    const sandboxId = body.sandboxId;
    const paths = Array.isArray(body.paths) ? body.paths : [];

    let result: { ok: boolean; error: string | null } = {
      ok: false,
      error: "Unsupported git action.",
    };

    switch (body.action) {
      case "stage":
        result = await gitStage(sandboxId ?? null, paths);
        break;
      case "unstage":
        result = await gitUnstage(sandboxId ?? null, paths);
        break;
      case "discard":
        result = await gitDiscard(sandboxId ?? null, paths);
        break;
      case "commit":
        result = await gitCommit(sandboxId ?? null, body.message ?? "");
        break;
      case "checkout":
        result = await gitCheckout(sandboxId ?? null, body.branch ?? "");
        break;
      case "branch":
        result = await gitCreateBranch(sandboxId ?? null, body.branch ?? "");
        break;
      case "diff": {
        const diff = await gitDiff(sandboxId ?? null, body.path);
        result = { ok: true, error: null };
        const panel = await readGitPanel(sandboxId ?? null, { cwd: body.cwd });
        return NextResponse.json({ ...serialize(panel), diff, ...result });
      }
      default:
        break;
    }

    const panel = await readGitPanel(sandboxId ?? null, { cwd: body.cwd });
    return NextResponse.json({ ...serialize(panel), ...result });
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}