// app/api/coding/changes/route.ts
// Change management endpoints: register what the agent touched, apply it,
// revert single files, or revert the whole set.
//
// Self-contained on purpose: the registry, the diff numbers and the sandbox
// writes all live here, so this route can never break because a helper library
// renamed an export.

import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { errorMessage, getSandbox } from "@/app/lib/coding/handle";

export const runtime = "nodejs";
export const maxDuration = 180;

const CWD = "/home/user";
const MAX_HISTORY = 50;

export type ChangeStatus = "pending" | "applied" | "reverted";

export interface FileChange {
  id: string;
  path: string;
  /** Exact file content before the change. null means the file did not exist. */
  before: string | null;
  /** Exact file content after the change. null means the file was deleted. */
  after: string | null;
  status: ChangeStatus;
  linesBefore: number;
  linesAfter: number;
  appliedAt: string | null;
}

export interface ChangeSet {
  id: string;
  title: string;
  createdAt: string;
  changes: FileChange[];
}

export interface ChangeSetSummary {
  id: string;
  title: string;
  createdAt: string;
  files: number;
  created: number;
  modified: number;
  deleted: number;
  applied: number;
  reverted: number;
  linesAdded: number;
  linesRemoved: number;
}

const registry = new Map<string, ChangeSet>();

type RunOptions = Parameters<
  ReturnType<typeof String> extends never ? never : never
> extends never
  ? never
  : never;

/* eslint-disable @typescript-eslint/no-explicit-any */

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function lineCount(value: string | null): number {
  if (value === null) return 0;
  if (value === "") return 0;
  return value.split("\n").length;
}

function prune(): void {
  if (registry.size <= MAX_HISTORY) return;
  const oldest = [...registry.values()]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, registry.size - MAX_HISTORY);
  for (const entry of oldest) registry.delete(entry.id);
}

function listSets(): ChangeSet[] {
  return [...registry.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

function getSet(id: string): ChangeSet | null {
  return registry.get(id) ?? null;
}

function summarize(set: ChangeSet): ChangeSetSummary {
  const created = set.changes.filter((change) => change.before === null).length;
  const deleted = set.changes.filter((change) => change.after === null).length;
  const modified = set.changes.length - created - deleted;

  return {
    id: set.id,
    title: set.title,
    createdAt: set.createdAt,
    files: set.changes.length,
    created,
    modified,
    deleted,
    applied: set.changes.filter((change) => change.status === "applied").length,
    reverted: set.changes.filter((change) => change.status === "reverted").length,
    linesAdded: set.changes.reduce((sum, change) => sum + change.linesAfter, 0),
    linesRemoved: set.changes.reduce((sum, change) => sum + change.linesBefore, 0),
  };
}

async function writeFile(
  sandbox: any,
  path: string,
  content: string,
): Promise<{ ok: boolean; detail: string }> {
  const encoded = Buffer.from(content, "utf8").toString("base64");
  const options = { cwd: CWD, timeoutMs: 45_000 };
  const command = [
    `cd ${shellQuote(CWD)}`,
    `&& mkdir -p "$(dirname ${shellQuote(path)})"`,
    `&& printf '%s' ${shellQuote(encoded)} | base64 -d > ${shellQuote(path)}`,
    `&& wc -c < ${shellQuote(path)}`,
  ].join(" ");

  try {
    const result = await sandbox.commands.run(command, options);
    const exitCode = result.exitCode ?? 0;
    if (exitCode !== 0) {
      return { ok: false, detail: (result.stderr ?? "").trim() || `exit ${exitCode}` };
    }
    return { ok: true, detail: `${(result.stdout ?? "").trim()} bytes` };
  } catch (error: unknown) {
    return { ok: false, detail: errorMessage(error) };
  }
}

async function deleteFile(
  sandbox: any,
  path: string,
): Promise<{ ok: boolean; detail: string }> {
  const options = { cwd: CWD, timeoutMs: 30_000 };
  try {
    const result = await sandbox.commands.run(`rm -f ${shellQuote(path)}`, options);
    const exitCode = result.exitCode ?? 0;
    return {
      ok: exitCode === 0,
      detail: exitCode === 0 ? "deleted" : (result.stderr ?? "").trim(),
    };
  } catch (error: unknown) {
    return { ok: false, detail: errorMessage(error) };
  }
}

interface RegisterBody {
  sandboxId?: string;
  action?: "register" | "apply" | "revert" | "revert-set" | "delete";
  title?: string;
  changeSetId?: string;
  changeIds?: string[];
  changes?: Array<{ path?: string; before?: string | null; after?: string | null }>;
}

export async function GET(): Promise<Response> {
  const sets = listSets();
  return NextResponse.json({
    ok: true,
    changeSets: sets,
    summaries: sets.map(summarize),
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: RegisterBody = {};
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    body = {};
  }

  const action = body.action ?? "register";

  if (action === "register") {
    const incoming = (body.changes ?? []).filter(
      (change) => change && typeof change.path === "string" && change.path.trim(),
    );

    if (!incoming.length) {
      return NextResponse.json(
        { ok: false, error: "Registering a change set needs at least one change with a path." },
        { status: 400 },
      );
    }

    const changes: FileChange[] = incoming.map((change) => {
      const before = typeof change.before === "string" ? change.before : null;
      const after = typeof change.after === "string" ? change.after : null;
      return {
        id: randomUUID(),
        path: String(change.path).trim(),
        before,
        after,
        status: "pending",
        linesBefore: lineCount(before),
        linesAfter: lineCount(after),
        appliedAt: null,
      };
    });

    const set: ChangeSet = {
      id: randomUUID(),
      title: (body.title ?? "").trim() || `Change set ${new Date().toISOString()}`,
      createdAt: new Date().toISOString(),
      changes,
    };

    registry.set(set.id, set);
    prune();

    return NextResponse.json({
      ok: true,
      changeSet: set,
      summary: summarize(set),
    });
  }

  const changeSetId = (body.changeSetId ?? "").trim();
  if (!changeSetId) {
    return NextResponse.json(
      { ok: false, error: "A changeSetId is required." },
      { status: 400 },
    );
  }

  const set = getSet(changeSetId);
  if (!set) {
    return NextResponse.json(
      { ok: false, error: `No change set with id ${changeSetId}.` },
      { status: 404 },
    );
  }

  if (action === "delete") {
    registry.delete(changeSetId);
    return NextResponse.json({ ok: true, deleted: changeSetId, changeSets: listSets() });
  }

  let sandbox: any;
  try {
    sandbox = await getSandbox(body.sandboxId);
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }

  const targets =
    action === "revert" || action === "apply"
      ? (() => {
          if (action === "apply") return set.changes;
          const ids = new Set((body.changeIds ?? []).filter(Boolean));
          return ids.size
            ? set.changes.filter((change) => ids.has(change.id))
            : [];
        })()
      : set.changes;

  if (!targets.length) {
    return NextResponse.json(
      {
        ok: false,
        error:
          action === "revert"
            ? "The revert action needs at least one valid changeId."
            : "This change set is empty.",
      },
      { status: 400 },
    );
  }

  const results: Array<{ id: string; path: string; ok: boolean; detail: string }> = [];

  for (const change of targets) {
    if (action === "apply") {
      if (change.after === null) {
        const outcome = await deleteFile(sandbox, change.path);
        results.push({ id: change.id, path: change.path, ...outcome });
        if (outcome.ok) {
          change.status = "applied";
          change.appliedAt = new Date().toISOString();
        }
      } else {
        const outcome = await writeFile(sandbox, change.path, change.after);
        results.push({ id: change.id, path: change.path, ...outcome });
        if (outcome.ok) {
          change.status = "applied";
          change.appliedAt = new Date().toISOString();
        }
      }
      continue;
    }

    // revert / revert-set both restore the "before" state.
    if (change.before === null) {
      const outcome = await deleteFile(sandbox, change.path);
      results.push({ id: change.id, path: change.path, ...outcome });
      if (outcome.ok) {
        change.status = "reverted";
        change.appliedAt = null;
      }
    } else {
      const outcome = await writeFile(sandbox, change.path, change.before);
      results.push({ id: change.id, path: change.path, ...outcome });
      if (outcome.ok) {
        change.status = "reverted";
        change.appliedAt = null;
      }
    }
  }

  registry.set(set.id, { ...set, changes: [...set.changes] });

  const failed = results.filter((entry) => !entry.ok);

  return NextResponse.json({
    ok: failed.length === 0,
    action,
    changeSetId: set.id,
    results,
    error:
      failed.length === 0
        ? undefined
        : `${failed.length} of ${results.length} file operations failed: ${failed
            .map((entry) => `${entry.path} (${entry.detail})`)
            .join(", ")}`,
    summary: summarize(set),
    changeSets: listSets(),
  });
}