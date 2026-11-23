// app/lib/coding/approvals.ts
// Approval queue for actions that touch the user's code or machines.
// The agent asks; the cockpit answers; nothing destructive runs in between.

import { randomUUID } from "node:crypto";

export type ApprovalKind =
  | "write_file"
  | "run_command"
  | "git_commit"
  | "git_discard"
  | "install";

export type ApprovalStatus = "pending" | "approved" | "denied" | "expired";

export interface ApprovalRequest {
  id: string;
  kind: ApprovalKind;
  title: string;
  detail: string;
  paths: string[];
  command: string | null;
  createdAt: string;
  status: ApprovalStatus;
  resolvedAt: string | null;
  note: string | null;
}

const MAX_HISTORY = 200;
const queue = new Map<string, ApprovalRequest>();

export interface RequestApprovalInput {
  kind: ApprovalKind;
  title: string;
  detail?: string;
  paths?: string[];
  command?: string | null;
}

export function requestApproval(input: RequestApprovalInput): ApprovalRequest {
  const request: ApprovalRequest = {
    id: randomUUID(),
    kind: input.kind,
    title: input.title,
    detail: input.detail ?? "",
    paths: input.paths ?? [],
    command: input.command ?? null,
    createdAt: new Date().toISOString(),
    status: "pending",
    resolvedAt: null,
    note: null,
  };

  queue.set(request.id, request);

  if (queue.size > MAX_HISTORY) {
    const oldest = [...queue.values()]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, queue.size - MAX_HISTORY);
    for (const entry of oldest) queue.delete(entry.id);
  }

  return request;
}

export function listApprovals(status?: ApprovalStatus): ApprovalRequest[] {
  const all = [...queue.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return status ? all.filter((entry) => entry.status === status) : all;
}

export function getApproval(id: string): ApprovalRequest | null {
  return queue.get(id) ?? null;
}

export function resolveApproval(
  id: string,
  approved: boolean,
  note?: string,
): ApprovalRequest | null {
  const existing = queue.get(id);
  if (!existing) return null;

  const resolved: ApprovalRequest = {
    ...existing,
    status: approved ? "approved" : "denied",
    resolvedAt: new Date().toISOString(),
    note: note ?? null,
  };

  queue.set(id, resolved);
  return resolved;
}

/** Blocks until the user answers, or expires. Never throws. */
export function waitForApproval(
  id: string,
  timeoutMs = 120_000,
): Promise<ApprovalRequest | null> {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    const tick = () => {
      const current = queue.get(id);
      if (!current) {
        resolve(null);
        return;
      }
      if (current.status !== "pending") {
        resolve(current);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        const expired: ApprovalRequest = {
          ...current,
          status: "expired",
          resolvedAt: new Date().toISOString(),
          note: "No answer before the approval timeout.",
        };
        queue.set(id, expired);
        resolve(expired);
        return;
      }
      setTimeout(tick, 400);
    };

    tick();
  });
}

export function clearApprovals(): void {
  queue.clear();
}