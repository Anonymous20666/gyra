// app/api/coding/git/route.ts
// Git Center backend. Read actions are free; every write action is explicit
// and returns the fresh panel state so the UI never drifts.

import { NextResponse } from "next/server";
import {
  checkoutBranch,
  commit,
  commitDetails,
  createBranch,
  deleteBranch,
  diffForPath,
  discardPaths,
  readGitPanel,
  stagePaths,
  unstagePaths,
} from "@/app/lib/coding/git";
import { errorMessage, getSandbox } from "@/app/lib/coding/handle";

export const runtime = "nodejs";
export const maxDuration = 180;

type GitAction =
  | "stage"
  | "unstage"
  | "discard"
  | "commit"
  | "branch-create"
  | "branch-checkout"
  | "branch-delete"
  | "diff"
  | "commit-details";

interface GitBody {
  sandboxId?: string;
  action?: GitAction;
  paths?: string[];
  message?: string;
  name?: string;
  hash?: string;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const sandboxId = url.searchParams.get("sandboxId");

  try {
    const sandbox = await getSandbox(sandboxId);
    const panel = await readGitPanel(sandbox);

    return NextResponse.json({
      ok: true,
      sandboxId: sandbox.sandboxId,
      panel,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: GitBody = {};
  try {
    body = (await request.json()) as GitBody;
  } catch {
    body = {};
  }

  if (!body.action) {
    return NextResponse.json(
      { ok: false, error: "An action is required." },
      { status: 400 },
    );
  }

  const paths = (body.paths ?? []).filter((path) => typeof path === "string" && path.trim());
  const needsPaths = ["stage", "unstage", "discard"].includes(body.action);

  if (needsPaths && !paths.length) {
    return NextResponse.json(
      { ok: false, error: `The ${body.action} action needs at least one path.` },
      { status: 400 },
    );
  }

  try {
    const sandbox = await getSandbox(body.sandboxId);
    let result: unknown = null;

    switch (body.action) {
      case "stage":
        result = await stagePaths(sandbox, paths);
        break;

      case "unstage":
        result = await unstagePaths(sandbox, paths);
        break;

      case "discard":
        result = await discardPaths(sandbox, paths);
        break;

      case "commit": {
        const message = (body.message ?? "").trim();
        if (!message) {
          return NextResponse.json(
            { ok: false, error: "A commit message is required." },
            { status: 400 },
          );
        }
        result = await commit(sandbox, message);
        break;
      }

      case "branch-create": {
        const name = (body.name ?? "").trim();
        if (!name) {
          return NextResponse.json(
            { ok: false, error: "A branch name is required." },
            { status: 400 },
          );
        }
        result = await createBranch(sandbox, name);
        break;
      }

      case "branch-checkout": {
        const name = (body.name ?? "").trim();
        if (!name) {
          return NextResponse.json(
            { ok: false, error: "A branch name is required." },
            { status: 400 },
          );
        }
        result = await checkoutBranch(sandbox, name);
        break;
      }

      case "branch-delete": {
        const name = (body.name ?? "").trim();
        if (!name) {
          return NextResponse.json(
            { ok: false, error: "A branch name is required." },
            { status: 400 },
          );
        }
        result = await deleteBranch(sandbox, name);
        break;
      }

      case "diff": {
        const path = paths[0] ?? (body.name ?? "").trim();
        if (!path) {
          return NextResponse.json(
            { ok: false, error: "A path is required to diff." },
            { status: 400 },
          );
        }
        result = await diffForPath(sandbox, path);
        break;
      }

      case "commit-details": {
        const hash = (body.hash ?? "").trim();
        if (!hash) {
          return NextResponse.json(
            { ok: false, error: "A commit hash is required." },
            { status: 400 },
          );
        }
        result = await commitDetails(sandbox, hash);
        break;
      }

      default:
        return NextResponse.json(
          { ok: false, error: `Unknown git action: ${String(body.action)}` },
          { status: 400 },
        );
    }

    const panel = await readGitPanel(sandbox);

    return NextResponse.json({
      ok: true,
      sandboxId: sandbox.sandboxId,
      action: body.action,
      result,
      panel,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}