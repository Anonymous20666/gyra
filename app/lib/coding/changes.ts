// app/lib/coding/changes.ts
// Change-set tracking: every agent edit becomes an inspectable record with a
// before/after snapshot, per-file accept/reject and one-click revert.

import type { Sandbox } from "@e2b/code-interpreter";
import { randomUUID } from "node:crypto";
import {
  createSnapshot,
  fileExists,
  readFileText,
  removePath,
  restoreSnapshot,
  writeFileText,
} from "./sandbox";
import { buildHunks, countChanges } from "./diff";
import type { ChangeSet, ChangeSetStatus, ChangeKind, FileChange } from "./types";

interface ChangeSetStore {
  sets: Map<string, ChangeSet>;
}

/**
 * Change sets are held in module memory per warm serverless instance and
 * mirrored to Supabase by the changes route for durability. The in-memory copy
 * keeps the agent loop fast and synchronous.
 */
const store: ChangeSetStore = { sets: new Map() };

export function createChangeSet(taskId: string, title: string, snapshotId?: string): ChangeSet {
  const now = Date.now();
  const changeSet: ChangeSet = {
    id: randomUUID(),
    taskId,
    title,
    changes: [],
    status: "open",
    createdAt: now,
    updatedAt: now,
    snapshotId,
  };
  store.sets.set(changeSet.id, changeSet);
  return changeSet;
}

export function getChangeSet(id: string): ChangeSet | undefined {
  return store.sets.get(id);
}

export function listChangeSets(): ChangeSet[] {
  return [...store.sets.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function hydrateChangeSet(changeSet: ChangeSet): void {
  store.sets.set(changeSet.id, changeSet);
}

export async function recordChange(
  sandbox: Sandbox,
  changeSet: ChangeSet,
  input: {
    path: string;
    kind: ChangeKind;
    before: string;
    after: string;
    source?: FileChange["source"];
    toolCallId?: string;
    fromPath?: string;
  },
): Promise<FileChange> {
  const counts = countChanges(input.before, input.after);
  const change: FileChange = {
    path: input.path,
    fromPath: input.fromPath,
    kind: input.kind,
    before: input.before,
    after: input.after,
    hunks: buildHunks(input.before, input.after),
    additions: counts.additions,
    deletions: counts.deletions,
    status: "pending",
    source: input.source ?? "agent",
    toolCallId: input.toolCallId,
  };

  const existing = changeSet.changes.find((entry) => entry.path === input.path);
  if (existing) {
    existing.before = input.before;
    existing.after = input.after;
    existing.hunks = change.hunks;
    existing.additions = change.additions;
    existing.deletions = change.deletions;
    existing.kind = input.kind;
    existing.status = "pending";
  } else {
    changeSet.changes.push(change);
  }

  changeSet.updatedAt = Date.now();
  changeSet.status = recomputeStatus(changeSet);
  store.sets.set(changeSet.id, changeSet);
  void sandbox;
  return existing ?? change;
}

function recomputeStatus(changeSet: ChangeSet): ChangeSetStatus {
  if (changeSet.changes.length === 0) return "open";
  const accepted = changeSet.changes.filter((change) => change.status === "accepted").length;
  const rejected = changeSet.changes.filter((change) => change.status === "rejected").length;
  if (accepted === changeSet.changes.length) return "accepted";
  if (rejected === changeSet.changes.length) return "rejected";
  if (accepted + rejected === 0) return "open";
  return "partially_applied";
}

export interface ApplyResult {
  applied: string[];
  failed: { path: string; error: string }[];
}

export async function applyChanges(
  sandbox: Sandbox,
  changeSet: ChangeSet,
  paths?: string[],
): Promise<ApplyResult> {
  const targets = changeSet.changes.filter(
    (change) => (!paths || paths.includes(change.path)) && change.status !== "rejected",
  );

  const result: ApplyResult = { applied: [], failed: [] };

  for (const change of targets) {
    try {
      if (change.kind === "deleted") {
        await removePath(sandbox, change.path);
      } else {
        await writeFileText(sandbox, change.path, change.after ?? "");
      }
      change.status = "accepted";
      result.applied.push(change.path);
    } catch (error) {
      result.failed.push({
        path: change.path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  changeSet.updatedAt = Date.now();
  changeSet.status = recomputeStatus(changeSet);
  return result;
}

export async function revertChanges(
  sandbox: Sandbox,
  changeSet: ChangeSet,
  paths?: string[],
): Promise<ApplyResult> {
  const targets = changeSet.changes.filter(
    (change) => !paths || paths.includes(change.path),
  );
  const result: ApplyResult = { applied: [], failed: [] };

  for (const change of targets) {
    try {
      if (change.kind === "added") {
        if (await fileExists(sandbox, change.path)) await removePath(sandbox, change.path);
      } else {
        await writeFileText(sandbox, change.path, change.before ?? "");
      }
      change.status = "rejected";
      result.applied.push(change.path);
    } catch (error) {
      result.failed.push({
        path: change.path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  changeSet.updatedAt = Date.now();
  changeSet.status = recomputeStatus(changeSet);
  return result;
}

export async function revertWholeSet(
  sandbox: Sandbox,
  changeSet: ChangeSet,
): Promise<{ reverted: boolean; message: string }> {
  if (changeSet.snapshotId) {
    const snapshot = await restoreSnapshot(sandbox, changeSet.snapshotId);
    if (snapshot.restored) {
      changeSet.status = "reverted";
      changeSet.updatedAt = Date.now();
      for (const change of changeSet.changes) change.status = "rejected";
      return { reverted: true, message: "Workspace restored to the pre-task snapshot." };
    }
    return { reverted: false, message: snapshot.message };
  }
  const result = await revertChanges(sandbox, changeSet);
  return {
    reverted: result.failed.length === 0,
    message:
      result.failed.length === 0
        ? "Reverted every change in this set."
        : `Could not revert: ${result.failed.map((entry) => entry.path).join(", ")}`,
  };
}

export function changeSetSummary(changeSet: ChangeSet): string {
  const modified = changeSet.changes.filter((change) => change.kind === "modified");
  const added = changeSet.changes.filter((change) => change.kind === "added");
  const deleted = changeSet.changes.filter((change) => change.kind === "deleted");
  const lines = [`${changeSet.title} — ${changeSet.changes.length} file(s) changed`];

  if (modified.length > 0) lines.push(`Modified: ${modified.map((change) => change.path).join(", ")}`);
  if (added.length > 0) lines.push(`Added: ${added.map((change) => change.path).join(", ")}`);
  if (deleted.length > 0) lines.push(`Deleted: ${deleted.map((change) => change.path).join(", ")}`);

  const additions = changeSet.changes.reduce((total, change) => total + change.additions, 0);
  const deletions = changeSet.changes.reduce((total, change) => total + change.deletions, 0);
  lines.push(`+${additions} / -${deletions}`);
  return lines.join("\n");
}

/** Snapshot the workspace before a write-heavy task begins. */
export async function snapshotBeforeTask(
  sandbox: Sandbox,
  taskTitle: string,
): Promise<string | undefined> {
  try {
    const snapshot = await createSnapshot(sandbox, taskTitle);
    return snapshot.tarPath;
  } catch {
    return undefined;
  }
}

/** Used by the files route when the user edits and saves directly. */
export async function recordManualChange(
  sandbox: Sandbox,
  path: string,
  before: string,
): Promise<{ before: string; after: string }> {
  const after = await readFileText(sandbox, path);
  return { before, after };
}