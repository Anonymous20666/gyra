// app/lib/coding/diff.ts
// Self-contained line diffing: no external dependency.
// Produces unified hunks for the diff viewer and accurate +/- counts for the
// changes panel.

import type { DiffHunk } from "./types";

export type DiffOp =
  | { type: "equal"; lines: string[] }
  | { type: "insert"; lines: string[] }
  | { type: "delete"; lines: string[] };

const MAX_CELLS = 4_000_000;

function splitLines(text: string): string[] {
  if (text === "") return [];
  return text.split("\n");
}

/**
 * Longest-common-subsequence diff with an O(n*m) table.
 * For pathologically large inputs we fall back to a single replace block so the
 * request never hangs the sandbox.
 */
export function diffLines(before: string, after: string): DiffOp[] {
  const a = splitLines(before);
  const b = splitLines(after);

  if (a.length * b.length > MAX_CELLS) {
    const ops: DiffOp[] = [];
    if (a.length > 0) ops.push({ type: "delete", lines: a });
    if (b.length > 0) ops.push({ type: "insert", lines: b });
    return ops;
  }

  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] =
        a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  const push = (type: DiffOp["type"], line: string) => {
    const last = ops[ops.length - 1];
    if (last && last.type === type) last.lines.push(line);
    else ops.push({ type, lines: [line] });
  };

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push("equal", a[i]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      push("delete", a[i]);
      i += 1;
    } else {
      push("insert", b[j]);
      j += 1;
    }
  }
  while (i < a.length) {
    push("delete", a[i]);
    i += 1;
  }
  while (j < b.length) {
    push("insert", b[j]);
    j += 1;
  }

  return ops;
}

export interface ChangeCounts {
  additions: number;
  deletions: number;
  identical: boolean;
}

export function countChanges(before: string, after: string): ChangeCounts {
  const ops = diffLines(before, after);
  let additions = 0;
  let deletions = 0;
  for (const op of ops) {
    if (op.type === "insert") additions += op.lines.length;
    if (op.type === "delete") deletions += op.lines.length;
  }
  return { additions, deletions, identical: additions === 0 && deletions === 0 };
}

export function buildHunks(before: string, after: string, context = 3): DiffHunk[] {
  const ops = diffLines(before, after);

  interface FlatLine {
    type: " " | "+" | "-";
    text: string;
    oldLine?: number;
    newLine?: number;
  }

  const flat: FlatLine[] = [];
  let oldLine = 1;
  let newLine = 1;

  for (const op of ops) {
    for (const line of op.lines) {
      if (op.type === "equal") {
        flat.push({ type: " ", text: line, oldLine, newLine });
        oldLine += 1;
        newLine += 1;
      } else if (op.type === "delete") {
        flat.push({ type: "-", text: line, oldLine });
        oldLine += 1;
      } else {
        flat.push({ type: "+", text: line, newLine });
        newLine += 1;
      }
    }
  }

  const changedIndexes = flat
    .map((line, index) => (line.type === " " ? -1 : index))
    .filter((index) => index !== -1);

  if (changedIndexes.length === 0) return [];

  const ranges: { start: number; end: number }[] = [];
  for (const index of changedIndexes) {
    const start = Math.max(0, index - context);
    const end = Math.min(flat.length, index + context + 1);
    const last = ranges[ranges.length - 1];
    if (last && start <= last.end) last.end = Math.max(last.end, end);
    else ranges.push({ start, end });
  }

  return ranges.map((range) => {
    const slice = flat.slice(range.start, range.end);
    const oldStart = slice.find((line) => line.oldLine !== undefined)?.oldLine ?? 1;
    const newStart = slice.find((line) => line.newLine !== undefined)?.newLine ?? 1;
    const oldLines = slice.filter((line) => line.type !== "+").length;
    const newLines = slice.filter((line) => line.type !== "-").length;

    return {
      header: `@@ -${oldStart},${oldLines} +${newStart},${newLines} @@`,
      oldStart,
      oldLines,
      newStart,
      newLines,
      lines: slice.map((line) => `${line.type}${line.text}`),
    };
  });
}

export function unifiedDiff(
  before: string,
  after: string,
  options: { path?: string; context?: number } = {},
): string {
  const hunks = buildHunks(before, after, options.context ?? 3);
  const header = options.path
    ? `--- a/${options.path}\n+++ b/${options.path}\n`
    : "--- before\n+++ after\n";
  if (hunks.length === 0) return `${header}(no changes)\n`;
  return `${header}${hunks.map((hunk) => `${hunk.header}\n${hunk.lines.join("\n")}`).join("\n")}\n`;
}

/** Compact side-by-side rows for a two-column diff view. */
export interface SideBySideRow {
  left?: { number?: number; text: string; type: " " | "-" };
  right?: { number?: number; text: string; type: " " | "+" };
}

export function sideBySide(before: string, after: string): SideBySideRow[] {
  const ops = diffLines(before, after);
  const rows: SideBySideRow[] = [];
  let oldLine = 1;
  let newLine = 1;

  for (const op of ops) {
    if (op.type === "equal") {
      for (const line of op.lines) {
        rows.push({
          left: { number: oldLine, text: line, type: " " },
          right: { number: newLine, text: line, type: " " },
        });
        oldLine += 1;
        newLine += 1;
      }
    } else if (op.type === "delete") {
      for (const line of op.lines) {
        rows.push({ left: { number: oldLine, text: line, type: "-" } });
        oldLine += 1;
      }
    } else {
      for (const line of op.lines) {
        rows.push({ right: { number: newLine, text: line, type: "+" } });
        newLine += 1;
      }
    }
  }

  return rows;
}

/** Line-level summary used in agent messages: first N changed lines only. */
export function diffExcerpt(before: string, after: string, maxLines = 40): string {
  const hunks = buildHunks(before, after, 2);
  const lines: string[] = [];
  for (const hunk of hunks) {
    lines.push(hunk.header);
    lines.push(...hunk.lines);
    if (lines.length >= maxLines) break;
  }
  if (lines.length === 0) return "No textual changes.";
  const trimmed = lines.slice(0, maxLines);
  if (lines.length > maxLines) trimmed.push("… diff truncated");
  return trimmed.join("\n");
}