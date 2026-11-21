import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, type CoreMessage } from "ai";
import { z } from "zod";
import {
  keepAlive,
  openSandbox,
  previewUrl,
  readFileText,
  resolvePath,
  workspacePath,
  writeFileText,
  SANDBOX_ROOT,
} from "@/app/lib/coding/sandbox";
import { modeConfig } from "@/app/lib/coding/modes";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_MESSAGES = 40;
const MAX_CHARS = 60_000;
const MAX_STEPS = 12;

function trimMessages(input: unknown): CoreMessage[] {
  if (!Array.isArray(input)) return [];
  const cleaned = input
    .filter(
      (m): m is { role: string; content: string } =>
        !!m && typeof m === "object" && typeof (m as any).content === "string"
    )
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }))
    .slice(-MAX_MESSAGES);

  let total = 0;
  const output: CoreMessage[] = [];
  for (let i = cleaned.length - 1; i >= 0; i -= 1) {
    total += cleaned[i].content.length;
    if (total > MAX_CHARS) break;
    output.unshift(cleaned[i] as CoreMessage);
  }
  return output;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = trimMessages(body?.messages);
    if (messages.length === 0) {
      return Response.json({ error: "`messages` must contain at least one message." }, { status: 400 });
    }

    const mode = modeConfig(body?.mode);
    const sandbox = await openSandbox(body?.sandboxId);
    await keepAlive(sandbox);

    const tools: Record<string, any> = {
      list_directory: tool({
        description:
          "List the project tree. Use this first when you need to understand the workspace layout.",
        parameters: z.object({
          path: z.string().default("."),
          depth: z.number().min(1).max(4).default(2),
        }),
        execute: async ({ path, depth }) => {
          const absolute = resolvePath(path);
          const result = await sandbox.commands.run(
            `cd ${JSON.stringify(absolute)} && find . -maxdepth ${depth} -mindepth 1 \\( -name node_modules -o -name .git -o -name .next \\) -prune -o -print | head -n 400`
          );
          const listing = (result.stdout || "").trim();
          return listing || "(empty directory)";
        },
      }),

      read_file: tool({
        description:
          "Read a file from the workspace. Always read before you edit, and never guess at file contents.",
        parameters: z.object({
          path: z.string(),
          startLine: z.number().min(1).optional(),
          endLine: z.number().min(1).optional(),
        }),
        execute: async ({ path, startLine, endLine }) => {
          const absolute = resolvePath(path);
          const content = await readFileText(sandbox, absolute);
          const lines = content.split("\n");
          const from = (startLine ?? 1) - 1;
          const to = endLine ?? Math.min(lines.length, from + 400);
          const slice = lines.slice(from, to);

          if (slice.length === 0) return "(empty file)";
          return slice
            .map((line, index) => `${String(from + index + 1).padStart(4, " ")} | ${line}`)
            .join("\n");
        },
      }),

      search_codebase: tool({
        description:
          "Search the codebase for a string or pattern and get matching file paths with line numbers. Use this instead of listing directories one by one.",
        parameters: z.object({
          query: z.string(),
          glob: z.string().optional().describe("Optional glob, e.g. '*.ts' or 'src/**/*.tsx'"),
        }),
        execute: async ({ query, glob }) => {
          const include = glob ? `--include=${JSON.stringify(glob)}` : "";
          const result = await sandbox.commands.run(
            `cd ${SANDBOX_ROOT} && grep -rn ${include} --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --binary-files=without-match ${JSON.stringify(
              query
            )} . | head -n 60`,
            { timeoutMs: 60_000 }
          );
          const matches = (result.stdout || "").trim();
          return matches || `No matches for "${query}".`;
        },
      }),

      execute_terminal: tool({
        description:
          "Run a shell command in the sandbox. Use it to install packages, build, test, or reproduce a bug. Read the real output before deciding what to do next.",
        parameters: z.object({
          command: z.string(),
          cwd: z.string().default("."),
        }),
        execute: async ({ command, cwd }) => {
          const absolute = resolvePath(cwd);
          try {
            const result = await sandbox.commands.run(command, {
              cwd: absolute,
              timeoutMs: 120_000,
            });
            const stdout = (result.stdout || "").slice(-4000);
            const stderr = (result.stderr || "").slice(-4000);
            return [
              `exit code: ${result.exitCode ?? 0}`,
              stdout ? `stdout:\n${stdout}` : "",
              stderr ? `stderr:\n${stderr}` : "",
            ]
              .filter(Boolean)
              .join("\n\n");
          } catch (error) {
            return `Command failed: ${error instanceof Error ? error.message : "unknown error"}`;
          }
        },
      }),
    };

    if (mode.writes) {
      tools.write_file = tool({
        description:
          "Create or replace a whole file. The content must be the complete, unabridged file with no placeholders and no truncation.",
        parameters: z.object({
          path: z.string(),
          content: z.string().describe("The complete file content."),
        }),
        execute: async ({ path, content }) => {
          const absolute = resolvePath(path);
          const parent = absolute.slice(0, absolute.lastIndexOf("/")) || SANDBOX_ROOT;
          await sandbox.files.makeDir(parent).catch(() => {});
          await writeFileText(sandbox, absolute, content);
          const lineCount = content.split("\n").length;
          return `Wrote ${workspacePath(absolute)} (${lineCount} lines).`;
        },
      });

      tools.edit_file = tool({
        description:
          "Make a surgical edit: replace one exact block of text in an existing file. Prefer this over rewriting a file. `find` must match character for character and must appear exactly once.",
        parameters: z.object({
          path: z.string(),
          find: z.string().describe("The exact existing text to replace."),
          replace: z.string().describe("The new text."),
        }),
        execute: async ({ path, find, replace }) => {
          const absolute = resolvePath(path);
          const original = await readFileText(sandbox, absolute);

          const occurrences = original.split(find).length - 1;
          if (occurrences === 0) {
            return `Edit rejected: that exact text was not found in ${workspacePath(
              absolute
            )}. Read the file again and copy the block precisely.`;
          }
          if (occurrences > 1) {
            return `Edit rejected: that text appears ${occurrences} times in ${workspacePath(
              absolute
            )}. Include more surrounding lines so it is unique.`;
          }

          const updated = original.replace(find, replace);
          await writeFileText(sandbox, absolute, updated);
          return `Edited ${workspacePath(absolute)}.`;
        },
      });

      tools.delete_path = tool({
        description: "Delete a file or directory inside the workspace.",
        parameters: z.object({ path: z.string() }),
        execute: async ({ path }) => {
          const absolute = resolvePath(path);
          if (absolute === SANDBOX_ROOT) return "Refused: cannot delete the workspace root.";
          await sandbox.commands.run(`rm -rf ${JSON.stringify(absolute)}`);
          return `Deleted ${workspacePath(absolute)}.`;
        },
      });

      tools.git = tool({
        description:
          "Run a git operation: status, diff, log, stage, commit or branch. Never force-push and never rewrite published history.",
        parameters: z.object({
          action: z.enum(["status", "diff", "log", "stage", "commit", "branch"]),
          message: z.string().optional(),
          name: z.string().optional(),
        }),
        execute: async ({ action, message, name }) => {
          const map: Record<string, string> = {
            status: "git status --short --branch",
            diff: "git diff --stat && git diff | head -n 400",
            log: "git log --oneline -20",
            stage: "git add -A && git status --short",
            commit: `git add -A && git -c user.name="Gyra Agent" -c user.email="agent@gyra.ng" commit -m ${JSON.stringify(
              message || "chore: agent update"
            )}`,
            branch: `git branch ${JSON.stringify(name || "")} 2>&1 || git branch --show-current`,
          };
          const result = await sandbox.commands.run(map[action], {
            cwd: SANDBOX_ROOT,
            timeoutMs: 60_000,
          });
          return (
            [(result.stdout || "").trim(), (result.stderr || "").trim()]
              .filter(Boolean)
              .join("\n") || `git ${action}: no output`
          );
        },
      });

      tools.request_preview = tool({
        description:
          "Get the public URL for a port inside the sandbox so the user can see the running app. Start the dev server first.",
        parameters: z.object({ port: z.number().min(1).max(65535).default(3000) }),
        execute: async ({ port }) => `Preview available at ${previewUrl(sandbox, port)}`,
      });
    }

    tools.propose_plan = tool({
      description:
        "Record an implementation plan for the human to approve. Call this exactly once in Plan mode, after you have inspected the code.",
      parameters: z.object({
        goal: z.string(),
        steps: z
          .array(
            z.object({
              title: z.string(),
              detail: z.string().optional(),
              files: z.array(z.string()).optional(),
            })
          )
          .min(1)
          .max(12),
        verification: z.array(z.string()).min(1).max(6),
      }),
      execute: async ({ goal, steps, verification }) =>
        JSON.stringify({ goal, steps, verification }),
    });

    const toolPolicy = [
      mode.writes
        ? "Write tools are enabled. Use edit_file for targeted changes and write_file only for new or fully rewritten files."
        : "Write tools are DISABLED in this mode. You may only read, search, and (if allowed) run non-mutating commands.",
      mode.terminal
        ? "You may run shell commands."
        : "Do not run shell commands in this mode.",
    ].join("\n");

    const systemPrompt = `You are Forge, the coding agent inside Gyra Workspace, built by Victory Lord at Genvia AI.

You are a real agent with a real Linux sandbox and a real filesystem. Your workspace root is ${SANDBOX_ROOT}. Paths you pass to tools are resolved relative to that root — "src/app.tsx" means ${SANDBOX_ROOT}/src/app.tsx.

${mode.prompt}

${toolPolicy}

NON-NEGOTIABLE RULES
1. Read before you write. Never invent a file's contents.
2. Every file you write is complete and unabridged. Never emit placeholders like "rest of code here", "..." or "unchanged".
3. Never claim something works. Run it, read the output, and report what actually happened.
4. If a command fails, treat the real error text as your next instruction. Fix it and re-run. You have ${MAX_STEPS} steps to converge.
5. Do not install a package if an existing dependency already does the job.
6. Keep the user's existing stack and conventions: Next.js App Router, React, Tailwind, Supabase.
7. When you finish, state precisely what changed, which files were touched, and what you verified.`;

    const result = await streamText({
      model: groq("openai/gpt-oss-120b"),
      system: systemPrompt,
      messages,
      tools,
      maxSteps: MAX_STEPS,
      temperature: 0.2,
    });

    const response = result.toDataStreamResponse();
    response.headers.set("X-Sandbox-Id", sandbox.sandboxId);
    return response;
  } catch (error) {
    console.error("coding agent error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "The coding agent failed." },
      { status: 500 }
    );
  }
}