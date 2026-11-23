// app/api/coding/route.ts
// Gyra coding agent — streaming entry point.
//
// Design rules:
// 1. Never die silently. Any failure is streamed back as a real message, so the
//    panel shows the cause instead of a bare "An error occurred."
// 2. Tolerant input. Accepts either { messages: [...] } or { prompt: "..." },
//    so an older/newer UI can never break the agent.
// 3. Everything the agent reports about the project comes from the sandbox.

import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, type CoreMessage } from "ai";
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";

export const runtime = "nodejs";
export const maxDuration = 300;

const CWD = "/home/user";
const E2B_TIMEOUT_MS = 30 * 60 * 1000;
const MAX_READ_BYTES = 1_500_000;
const MAX_WRITE_BYTES = 1_000_000;
const MAX_COMMAND_TIMEOUT_MS = 120_000;

const GROQ_BASE_URL =
  process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const CODING_MODEL =
  process.env.CODING_MODEL ?? "llama-3.3-70b-versatile";

type RunOptions = Parameters<Sandbox["commands"]["run"]>[1];

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function clip(value: string, max = 20_000): string {
  if (!value) return "";
  return value.length <= max ? value : `${value.slice(0, max)}\n…[truncated]`;
}

async function shell(sandbox: Sandbox, command: string, timeoutMs = 60_000) {
  const options = { cwd: CWD, timeoutMs } as RunOptions;
  try {
    const result = await sandbox.commands.run(command, options);
    return {
      ok: (result.exitCode ?? 0) === 0,
      stdout: clip(result.stdout ?? ""),
      stderr: clip(result.stderr ?? ""),
      exitCode: result.exitCode ?? 0,
    };
  } catch (error: unknown) {
    const err = error as { message?: string; stdout?: string; stderr?: string; exitCode?: number };
    return {
      ok: false,
      stdout: clip(err?.stdout ?? ""),
      stderr: clip(err?.stderr ?? err?.message ?? String(error)),
      exitCode: typeof err?.exitCode === "number" ? err.exitCode : 1,
    };
  }
}

async function getSandbox(sandboxId?: string): Promise<Sandbox> {
  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing E2B_API_KEY. Create one at https://e2b.dev/dashboard and add it to .env.local, then restart the server.",
    );
  }
  const connectOptions = { apiKey, timeoutMs: E2B_TIMEOUT_MS };
  if (sandboxId) return Sandbox.connect(sandboxId, connectOptions);
  return Sandbox.create(connectOptions);
}

/** Real, sandbox-derived orientation for the system prompt. */
async function describeProject(sandbox: Sandbox): Promise<string> {
  const parts: string[] = [];

  const listing = await shell(
    sandbox,
    "ls -A | grep -v -E '^(node_modules|.git|.next|dist|build|out|.turbo|coverage)$' | head -n 60",
    20_000,
  );
  if (listing.stdout.trim()) {
    parts.push(`Top-level entries:\n${listing.stdout.trim()}`);
  } else {
    parts.push("Top-level entries: (directory is empty)");
  }

  const pkg = await shell(sandbox, "cat package.json 2>/dev/null | head -c 6000", 20_000);
  if (pkg.stdout.trim()) {
    parts.push(`package.json:\n${clip(pkg.stdout, 6000)}`);
  } else {
    parts.push("package.json: not present");
  }

  const git = await shell(
    sandbox,
    "git rev-parse --abbrev-ref HEAD 2>/dev/null; git status --porcelain 2>/dev/null | head -n 20",
    20_000,
  );
  if (git.stdout.trim()) {
    parts.push(`Git state:\n${clip(git.stdout, 2000)}`);
  }

  return parts.join("\n\n");
}

function systemPrompt(projectSummary: string, mode: string): string {
  return [
    "You are Forge, the coding agent inside Gyra's development environment.",
    "You operate on a real Linux sandbox. Every claim about the project must come from a tool result; never invent files, APIs, versions or test output.",
    "",
    "Working rules:",
    "1. Orient before acting: list files and read the real file before you change it.",
    "2. Make the smallest change that fully solves the request. No unrequested refactors, dependencies or files.",
    "3. When you write a file, write the entire file content — never a partial snippet or a placeholder comment.",
    "4. Explain destructive or wide-reaching commands before running them.",
    "5. After editing, verify with the narrowest real check (typecheck, build, or a single test) and report exactly what you ran and what it returned.",
    "6. If a tool fails, read the error and fix the cause; do not retry blindly. If you are blocked, say so plainly.",
    "7. Never claim something passed when you did not run it.",
    "",
    `Current mode: ${mode}.`,
    "",
    "Project state (read from the sandbox just now):",
    projectSummary,
  ].join("\n");
}

/** Accepts the modern { messages } shape and the legacy { prompt } shape. */
function normalizeMessages(body: Record<string, unknown>): CoreMessage[] {
  const raw = Array.isArray(body.messages) ? body.messages : null;

  if (raw && raw.length) {
    const converted: CoreMessage[] = [];
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const message = item as {
        role?: string;
        content?: unknown;
        parts?: Array<{ type?: string; text?: string }>;
      };
      const role =
        message.role === "assistant" || message.role === "system" || message.role === "user"
          ? message.role
          : "user";

      let text = "";
      if (typeof message.content === "string") {
        text = message.content;
      } else if (Array.isArray(message.parts)) {
        text = message.parts
          .map((part) => (part?.type === "text" ? part.text ?? "" : ""))
          .join("");
      }

      if (text.trim()) converted.push({ role, content: text });
    }
    if (converted.length) return converted;
  }

  const prompt =
    typeof body.prompt === "string"
      ? body.prompt
      : typeof body.message === "string"
        ? body.message
        : "";

  return prompt.trim() ? [{ role: "user", content: prompt }] : [];
}

const MAX_STEPS = 12;

export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const messages = normalizeMessages(body);
  if (!messages.length) {
    return new Response(
      `3:${JSON.stringify("No message received. Send { messages: [...] } or { prompt: \"...\" }.")}\n`,
      { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  const mode = typeof body.mode === "string" ? body.mode : "builder";
  const sandboxId = typeof body.sandboxId === "string" ? body.sandboxId : undefined;

  let sandbox: Sandbox;
  try {
    sandbox = await getSandbox(sandboxId);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      `3:${JSON.stringify(`Sandbox unavailable: ${message}`)}\n`,
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }

  let projectSummary = "Unknown: the project scan failed.";
  try {
    projectSummary = await describeProject(sandbox);
  } catch (error: unknown) {
    projectSummary = `Project scan failed: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }

  const provider = createOpenAI({
    baseURL: GROQ_BASE_URL,
    apiKey: process.env.GROQ_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  });

  try {
    const result = streamText({
      model: provider(CODING_MODEL),
      system: systemPrompt(projectSummary, mode),
      messages,
      maxSteps: MAX_STEPS,
      temperature: 0.2,
      tools: {
        list_files: tool({
          description:
            "List files and directories under a path in the sandbox. Use this to orient yourself.",
          parameters: z.object({
            path: z.string().describe("Absolute or project-relative path. Defaults to the project root."),
            depth: z.number().min(1).max(4).optional().describe("How many levels to descend."),
          }),
          execute: async ({ path, depth }) => {
            const target = path?.trim() ? path.trim() : ".";
            const levels = depth ?? 2;
            const command = [
              `cd ${shellQuote(CWD)}`,
              `find ${shellQuote(target)} -maxdepth ${levels}`,
              `-not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.next/*'`,
              `-not -path '*/dist/*' -not -path '*/build/*' | head -n 300`,
            ].join(" ");
            const listing = await shell(sandbox, command, 30_000);
            if (!listing.stdout.trim()) {
              return listing.stderr.trim() || `No entries found under ${target}.`;
            }
            return listing.stdout;
          },
        }),

        read_file: tool({
          description: "Read a file from the sandbox. Always read before you edit.",
          parameters: z.object({
            path: z.string().describe("Project-relative or absolute file path."),
            startLine: z.number().min(1).optional(),
            endLine: z.number().min(1).optional(),
          }),
          execute: async ({ path, startLine, endLine }) => {
            if (startLine || endLine) {
              const from = startLine ?? 1;
              const to = endLine ?? from + 400;
              const slice = await shell(
                sandbox,
                `cd ${shellQuote(CWD)} && sed -n '${from},${to}p' ${shellQuote(path)}`,
                30_000,
              );
              return slice.ok ? clip(slice.stdout) : `Could not read ${path}: ${slice.stderr}`;
            }

            const whole = await shell(
              sandbox,
              `cd ${shellQuote(CWD)} && head -c ${MAX_READ_BYTES} ${shellQuote(path)}`,
              30_000,
            );
            if (!whole.ok) return `Could not read ${path}: ${whole.stderr}`;
            return whole.stdout.trim() ? whole.stdout : `${path} is empty.`;
          },
        }),

        write_file: tool({
          description:
            "Write the complete contents of a file. The content you pass replaces the whole file.",
          parameters: z.object({
            path: z.string().describe("Project-relative or absolute file path."),
            content: z.string().describe("The complete, unabridged file content."),
            reason: z.string().describe("One sentence on why this file changes."),
          }),
          execute: async ({ path, content, reason }) => {
            const bytes = Buffer.byteLength(content, "utf8");
            if (bytes > MAX_WRITE_BYTES) {
              return `Refused: ${bytes} bytes exceeds the ${MAX_WRITE_BYTES} byte write limit. Split the work.`;
            }
            const encoded = Buffer.from(content, "utf8").toString("base64");
            const command = [
              `cd ${shellQuote(CWD)}`,
              `&& mkdir -p "$(dirname ${shellQuote(path)})"`,
              `&& printf '%s' ${shellQuote(encoded)} | base64 -d > ${shellQuote(path)}`,
              `&& wc -c < ${shellQuote(path)}`,
            ].join(" ");
            const written = await shell(sandbox, command, 45_000);
            if (!written.ok) return `Write failed for ${path}: ${written.stderr}`;
            return `Wrote ${path} (${written.stdout.trim()} bytes). Reason: ${reason}`;
          },
        }),

        run_command: tool({
          description:
            "Run a shell command in the project root. State destructive commands to the user before running them.",
          parameters: z.object({
            command: z.string().describe("The command to run."),
            timeoutMs: z
              .number()
              .min(1000)
              .max(MAX_COMMAND_TIMEOUT_MS)
              .optional()
              .describe("Timeout in milliseconds."),
          }),
          execute: async ({ command, timeoutMs }) => {
            const run = await shell(
              sandbox,
              `cd ${shellQuote(CWD)} && ${command}`,
              timeoutMs ?? 60_000,
            );
            const output = [
              `exit code: ${run.exitCode}`,
              run.stdout.trim() ? `stdout:\n${run.stdout}` : "",
              run.stderr.trim() ? `stderr:\n${run.stderr}` : "",
            ]
              .filter(Boolean)
              .join("\n");
            return output || `Command produced no output (exit ${run.exitCode}).`;
          },
        }),

        search_files: tool({
          description:
            "Search the project for a string, symbol or import. Use it to find where something lives instead of guessing.",
          parameters: z.object({
            query: z.string().describe("Literal text or regular expression to find."),
            glob: z.string().optional().describe("Optional file glob such as '*.ts'."),
            maxResults: z.number().min(1).max(200).optional(),
          }),
          execute: async ({ query, glob, maxResults }) => {
            if (!query.trim()) return "Empty query.";
            const include = glob ? `--include=${shellQuote(glob)} ` : "";
            const limit = maxResults ?? 80;
            const found = await shell(
              sandbox,
              [
                `cd ${shellQuote(CWD)}`,
                `&& grep -rnE ${include}--exclude-dir=node_modules --exclude-dir=.git`,
                `--exclude-dir=.next --exclude-dir=dist --exclude-dir=build`,
                `-m 3 ${shellQuote(query)} . | head -n ${limit}`,
              ].join(" "),
              45_000,
            );
            if (!found.stdout.trim()) return `No matches for ${query}.`;
            return found.stdout;
          },
        }),
      },
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[coding] stream error:", error);
        return `Coding agent error: ${message}`;
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[coding] route failed before streaming:", error);
    return new Response(
      `3:${JSON.stringify(
        `Coding agent could not start: ${message}. Check E2B_API_KEY and GROQ_API_KEY in .env.local.`,
      )}\n`,
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
}