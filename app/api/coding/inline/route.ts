// app/api/coding/inline/route.ts
// Inline AI edits: take a selection, return a replacement plus an honest diff.
// Self-contained diffing here so the panel never depends on another module's
// shape.   POST { sandboxId?, path, selection, instruction, mode? }

import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { errorMessage, getSandbox } from "@/app/lib/coding/handle";

export const runtime = "nodejs";
export const maxDuration = 120;

const GROQ_BASE_URL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const INLINE_MODEL = process.env.INLINE_MODEL ?? process.env.CODING_MODEL ?? "llama-3.3-70b-versatile";

const MAX_FILE_BYTES = 200_000;

interface InlineBody {
  sandboxId?: string;
  path?: string;
  selection?: string;
  instruction?: string;
  mode?: string;
}

type DiffOp = "same" | "added" | "removed";

interface DiffLine {
  op: DiffOp;
  text: string;
  oldLine: number | null;
  newLine: number | null;
}

/** Simple, dependency-free line diff (patience-free LCS on short blocks). */
function lineDiff(before: string, after: string): DiffLine[] {
  const left = before.split("\n");
  const right = after.split("\n");
  const rows = left.length;
  const cols = right.length;

  // Guard against pathological sizes: fall back to a flat replace.
  if (rows * cols > 1_500_000) {
    return [
      ...left.map((text, index) => ({
        op: "removed" as DiffOp,
        text,
        oldLine: index + 1,
        newLine: null,
      })),
      ...right.map((text, index) => ({
        op: "added" as DiffOp,
        text,
        oldLine: null,
        newLine: index + 1,
      })),
    ];
  }

  const table: number[][] = Array.from({ length: rows + 1 }, () =>
    new Array<number>(cols + 1).fill(0),
  );

  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      table[i][j] =
        left[i] === right[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;

  while (i < rows && j < cols) {
    if (left[i] === right[j]) {
      lines.push({ op: "same", text: left[i], oldLine: i + 1, newLine: j + 1 });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      lines.push({ op: "removed", text: left[i], oldLine: i + 1, newLine: null });
      i += 1;
    } else {
      lines.push({ op: "added", text: right[j], oldLine: null, newLine: j + 1 });
      j += 1;
    }
  }

  while (i < rows) {
    lines.push({ op: "removed", text: left[i], oldLine: i + 1, newLine: null });
    i += 1;
  }
  while (j < cols) {
    lines.push({ op: "added", text: right[j], oldLine: null, newLine: j + 1 });
    j += 1;
  }

  return lines;
}

function unified(lines: DiffLine[], path: string): string {
  const body = lines
    .filter((line) => line.op !== "same")
    .map((line) =>
      line.op === "added" ? `+${line.text}` : `-${line.text}`,
    )
    .join("\n");

  return body ? `--- a/${path}\n+++ b/${path}\n@@ inline @@\n${body}` : "";
}

function stripFences(text: string): string {
  const fenced = text.match(/```[a-zA-Z0-9]*\s*\n([\s\S]*?)```/);
  return (fenced ? fenced[1] : text).replace(/\s+$/, "");
}

export async function POST(request: Request): Promise<Response> {
  let body: InlineBody = {};
  try {
    body = (await request.json()) as InlineBody;
  } catch {
    body = {};
  }

  const path = (body.path ?? "").trim();
  const selection = body.selection ?? "";
  const instruction = (body.instruction ?? "").trim();

  if (!path) {
    return NextResponse.json(
      { ok: false, error: "A file path is required." },
      { status: 400 },
    );
  }
  if (!instruction) {
    return NextResponse.json(
      { ok: false, error: "An instruction is required for an inline edit." },
      { status: 400 },
    );
  }
  if (!selection.trim()) {
    return NextResponse.json(
      { ok: false, error: "Select some code first — inline edits replace a selection." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GROQ_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "No model key configured. Set GROQ_API_KEY in .env.local.",
      },
      { status: 500 },
    );
  }

  // Read real surrounding context from the sandbox when we can.
  let fileContext = "";
  try {
    const sandbox = await getSandbox(body.sandboxId);
    const options = { cwd: "/home/user", timeoutMs: 20_000 } as Parameters<
      typeof sandbox.commands.run
    >[1];
    const file = await sandbox.commands.run(
      `head -c ${MAX_FILE_BYTES} '${path.replace(/'/g, `'\\''`)}'`,
      options,
    );
    if ((file.exitCode ?? 0) === 0 && file.stdout) {
      fileContext = file.stdout.slice(0, 6000);
    }
  } catch {
    fileContext = "";
  }

  try {
    const provider = createOpenAI({ baseURL: GROQ_BASE_URL, apiKey });
    const result = await generateText({
      model: provider(INLINE_MODEL),
      temperature: 0.15,
      prompt: [
        `You are editing one selection inside ${path}.`,
        body.mode ? `Mode: ${body.mode}.` : "",
        "Return ONLY the replacement code for the selection. No explanations, no markdown fences.",
        "Preserve the surrounding style, indentation and imports. Do not rename unrelated things.",
        "",
        "Selection to replace:",
        selection,
        fileContext && !fileContext.includes(selection)
          ? `\nFile context (for reference only):\n${fileContext}`
          : "",
        "",
        `Instruction: ${instruction}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    const replacement = stripFences(result.text);
    const diffLines = lineDiff(selection, replacement);
    const added = diffLines.filter((line) => line.op === "added").length;
    const removed = diffLines.filter((line) => line.op === "removed").length;
    const changed = added > 0 || removed > 0;

    return NextResponse.json({
      ok: true,
      path,
      original: selection,
      replacement,
      changed,
      added,
      removed,
      diff: diffLines,
      unified: unified(diffLines, path),
      note: changed ? null : "The model returned the selection unchanged.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}