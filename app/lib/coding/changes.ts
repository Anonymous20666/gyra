/* app/lib/coding/changes.ts
 * Proposed change sets: build, apply and revert edits inside the sandbox.
 */

import {
  deletePath,
  ensureSandbox,
  fileExists,
  readFileText,
  writeFileText,
  type SandboxInput,
} from "./sandbox";

export type ChangeKind = "create" | "update" | "delete" | "rename";

export type FileChange = {
  id: string;
  path: string;
  previousPath: string | null;
  kind: ChangeKind;
  before: string | null;
  after: string | null;
  additions: number;
  deletions: number;
  applied: boolean;
  createdAt: string;
};

export type ChangeSet = {
  id: string;
  sandboxId: string;
  title: string;
  summary: string;
  changes: FileChange[];
  files: number;
  additions: number;
  deletions: number;
  createdAt: string;
  appliedAt: string | null;
};

export type ProposedChange = {
  path: string;
  content?: string | null;
  previousPath?: string | null;
  kind?: ChangeKind;
};

const sets = new Map<string, ChangeSet>();

function makeId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}

export function countLineDelta(
  before: string | null,
  after: string | null,
): { additions: number; deletions: number } {
  const oldLines = before ? before.split("\n") : [];
  const newLines = after ? after.split("\n") : [];
  const oldSet = new Map<string, number>();
  for (const line of oldLines) {
    oldSet.set(line, (oldSet.get(line) ?? 0) + 1);
  }

  let additions = 0;
  for (const line of newLines) {
    const remaining = oldSet.get(line) ?? 0;
    if (remaining > 0) oldSet.set(line, remaining - 1);
    else additions += 1;
  }

  let deletions = 0;
  for (const count of oldSet.values()) deletions += count;

  return { additions, deletions };
}

export function getChangeSet(id: string): ChangeSet | null {
  return sets.get(id) ?? null;
}

export function listChangeSets(sandboxId?: string): ChangeSet[] {
  const all = Array.from(sets.values());
  const filtered = sandboxId
    ? all.filter((set) => set.sandboxId === sandboxId)
    : all;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function beginChangeSet(input: {
  sandboxId: string;
  title?: string;
  summary?: string;
}): ChangeSet {
  const set: ChangeSet = {
    id: makeId("cs"),
    sandboxId: input.sandboxId,
    title: input.title?.trim() || "Workspace changes",
    summary: input.summary?.trim() || "",
    changes: [],
    files: 0,
    additions: 0,
    deletions: 0,
    createdAt: new Date().toISOString(),
    appliedAt: null,
  };
  sets.set(set.id, set);
  return set;
}

function recompute(set: ChangeSet): ChangeSet {
  set.files = set.changes.length;
  set.additions = set.changes.reduce((total, change) => total + change.additions, 0);
  set.deletions = set.changes.reduce((total, change) => total + change.deletions, 0);
  sets.set(set.id, set);
  return set;
}

export function recordChange(
  setId: string,
  change: ProposedChange,
  before: string | null = null,
): ChangeSet {
  const set = sets.get(setId);
  if (!set) throw new Error(`Unknown change set: ${setId}`);

  const kind: ChangeKind =
    change.kind ?? (before === null ? "create" : "update");
  const after = change.content ?? null;
  const delta = countLineDelta(kind === "create" ? null : before, after);

  set.changes.push({
    id: makeId("ch"),
    path: change.path,
    previousPath: change.previousPath ?? null,
    kind,
    before: kind === "create" ? null : before,
    after,
    additions: delta.additions,
    deletions: delta.deletions,
    applied: false,
    createdAt: new Date().toISOString(),
  });

  return recompute(set);
}

export async function buildChangeSet(
  target: SandboxInput,
  input: { title?: string; summary?: string; changes: ProposedChange[] },
): Promise<ChangeSet> {
  const sandbox = await ensureSandbox(target);
  const set = beginChangeSet({
    sandboxId: sandbox.sandboxId,
    title: input.title,
    summary: input.summary,
  });

  for (const change of input.changes) {
    const exists = await fileExists(sandbox, change.path);
    const before = exists ? await readFileText(sandbox, change.path).catch(() => null) : null;
    recordChange(set.id, change, before);
  }

  return recompute(set);
}

export async function applyChange(
  target: SandboxInput,
  change: FileChange,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const sandbox = await ensureSandbox(target);
    if (change.kind === "delete") {
      await deletePath(sandbox, change.path);
      return { ok: true, error: null };
    }
    if (typeof change.after === "string") {
      await writeFileText(sandbox, change.path, change.after);
      change.applied = true;
      return { ok: true, error: null };
    }
    return { ok: false, error: "This change has no content to apply." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not apply change",
    };
  }
}

export async function applyChangeSet(
  target: SandboxInput,
  setId: string,
): Promise<{ ok: boolean; applied: number; error: string | null }> {
  const set = sets.get(setId);
  if (!set) return { ok: false, applied: 0, error: `Unknown change set: ${setId}` };

  let applied = 0;
  for (const change of set.changes) {
    const result = await applyChange(target, change);
    if (!result.ok) {
      return { ok: false, applied, error: result.error };
    }
    applied += 1;
  }

  set.appliedAt = new Date().toISOString();
  sets.set(set.id, set);
  return { ok: true, applied, error: null };
}

export async function revertChangeSet(
  target: SandboxInput,
  setId: string,
): Promise<{ ok: boolean; reverted: number; error: string | null }> {
  const set = sets.get(setId);
  if (!set) return { ok: false, reverted: 0, error: `Unknown change set: ${setId}` };

  const sandbox = await ensureSandbox(target);
  let reverted = 0;

  for (const change of [...set.changes].reverse()) {
    try {
      if (change.kind === "create") {
        await deletePath(sandbox, change.path);
      } else if (typeof change.before === "string") {
        await writeFileText(sandbox, change.path, change.before);
      }
      change.applied = false;
      reverted += 1;
    } catch (error) {
      return {
        ok: false,
        reverted,
        error: error instanceof Error ? error.message : "Could not revert change",
      };
    }
  }

  set.appliedAt = null;
  sets.set(set.id, set);
  return { ok: true, reverted, error: null };
}

export function summarizeChangeSet(set: ChangeSet): string {
  if (set.changes.length === 0) return "No changes proposed.";
  const parts = set.changes.map((change) => {
    const sign = change.kind === "delete" ? "-" : "+";
    return `${sign}${change.path} (+${change.additions}/-${change.deletions})`;
  });
  return `${set.files} file(s): ${parts.join(", ")}`;
}

export const proposeChange = recordChange;
export const applyChanges = applyChangeSet;
export const revertChanges = revertChangeSet;