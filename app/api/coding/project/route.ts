/* app/api/coding/project/route.ts */

import { NextResponse } from "next/server";
import {
  readPackageJson,
  readProjectFile,
  scanProject,
  writeProjectFile,
  type ProjectSnapshot,
} from "@/app/lib/coding/project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ProjectBody = {
  action?: "read" | "write" | "package";
  sandboxId?: string;
  path?: string;
  content?: string;
};

function message(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Project request failed.";
}

function serialize(snapshot: ProjectSnapshot) {
  return {
    ok: true,
    ...snapshot,
    project: snapshot,
    tree: snapshot.entries,
    fileCount: snapshot.files.length,
    directoryCount: snapshot.directories.length,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sandboxId = url.searchParams.get("sandboxId") ?? undefined;
    const path = url.searchParams.get("path");

    if (path) {
      const content = await readProjectFile(sandboxId ?? null, path);
      return NextResponse.json({ ok: true, path, content });
    }

    if (url.searchParams.get("package") === "1") {
      const pkg = await readPackageJson(sandboxId ?? null);
      return NextResponse.json({ ok: true, package: pkg });
    }

    const snapshot = await scanProject(sandboxId ?? null);
    return NextResponse.json(serialize(snapshot));
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: ProjectBody = {};
    try {
      body = (await request.json()) as ProjectBody;
    } catch {
      body = {};
    }

    const sandboxId = body.sandboxId ?? null;
    const action = body.action ?? "read";

    if (action === "write") {
      const path = (body.path ?? "").trim();
      if (!path) {
        return NextResponse.json(
          { error: "A path is required to write a file." },
          { status: 400 },
        );
      }
      await writeProjectFile(sandboxId, path, body.content ?? "");
      const snapshot = await scanProject(sandboxId);
      return NextResponse.json({
        ok: true,
        path,
        savedAt: new Date().toISOString(),
        files: snapshot.files,
        entries: snapshot.entries,
      });
    }

    if (action === "package") {
      const pkg = await readPackageJson(sandboxId);
      return NextResponse.json({ ok: true, package: pkg });
    }

    const path = (body.path ?? "").trim();
    if (path) {
      const content = await readProjectFile(sandboxId, path);
      return NextResponse.json({ ok: true, path, content });
    }

    const snapshot = await scanProject(sandboxId);
    return NextResponse.json(serialize(snapshot));
  } catch (error) {
    return NextResponse.json({ error: message(error) }, { status: 500 });
  }
}