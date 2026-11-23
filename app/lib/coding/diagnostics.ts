// app/lib/coding/diagnostics.ts
// Problems panel backend: runs the project's real type checker, linter and build,
// then normalises everything into a single Problem[] list.

import type { Sandbox } from "@e2b/code-interpreter";
import { exec, fileExists } from "./sandbox";
import type { DiagnosticsReport, Problem, ProblemSource } from "./types";

const MAX_PROBLEMS = 500;

interface TscMatch {
  file: string;
  line: number;
  column: number;
  severity: "error" | "warning";
  code: string;
  message: string;
}

function parseTsc(output: string): TscMatch[] {
  const matches: TscMatch[] = [];
  const regex = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(output)) !== null) {
    matches.push({
      file: match[1],
      line: Number(match[2]),
      column: Number(match[3]),
      severity: match[4] === "error" ? "error" : "warning",
      code: match[5],
      message: match[6].trim(),
    });
  }
  return matches;
}

interface EslintMessage {
  line?: number;
  column?: number;
  severity?: number;
  message?: string;
  ruleId?: string | null;
}

interface EslintFile {
  filePath?: string;
  messages?: EslintMessage[];
}

function parseEslint(output: string): Problem[] {
  const start = output.indexOf("[");
  if (start === -1) return [];
  let parsed: EslintFile[];
  try {
    parsed = JSON.parse(output.slice(start)) as EslintFile[];
  } catch {
    return [];
  }

  const problems: Problem[] = [];
  for (const file of parsed) {
    const path = (file.filePath ?? "").replace(/^.*\/home\/user\//, "");
    for (const message of file.messages ?? []) {
      if (!message.message) continue;
      const rule = message.ruleId ?? undefined;
      const security = Boolean(rule && /security|no-eval|no-implied-eval|no-unsafe/i.test(rule));
      problems.push({
        id: `eslint:${path}:${message.line ?? 0}:${rule ?? "rule"}`,
        severity: message.severity === 2 ? "error" : "warning",
        source: security ? "security" : "eslint",
        message: message.message,
        file: path,
        line: message.line,
        column: message.column,
        code: rule,
        fixable: true,
        origin: "npx eslint . --format json",
      });
    }
  }
  return problems;
}

function parseBuild(output: string): Problem[] {
  const problems: Problem[] = [];
  const seen = new Set<string>();
  const regex = /^(?:\.\/)?([\w./-]+\.(?:ts|tsx|js|jsx|css))[:(](\d+)[,:](\d+)?\)?\s*[-:]?\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(output)) !== null) {
    const key = `${match[1]}:${match[2]}:${match[4].slice(0, 60)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    problems.push({
      id: `build:${key}`,
      severity: /error|failed|cannot|unable/i.test(match[4]) ? "error" : "warning",
      source: "build",
      message: match[4].trim(),
      file: match[1],
      line: Number(match[2]),
      column: match[3] ? Number(match[3]) : undefined,
      origin: "npm run build",
    });
  }
  return problems;
}

async function hasBinary(sandbox: Sandbox, relative: string): Promise<boolean> {
  return fileExists(sandbox, relative);
}

export interface DiagnosticsOptions {
  /** Also run the production build. Slow (30–120s); off by default. */
  build?: boolean;
  /** Restrict linting to one path. */
  lintPath?: string;
}

export async function runDiagnostics(
  sandbox: Sandbox,
  options: DiagnosticsOptions = {},
): Promise<DiagnosticsReport> {
  const problems: Problem[] = [];
  const executed: ProblemSource[] = [];
  const skipped: { source: ProblemSource; reason: string }[] = [];

  /* TypeScript ------------------------------------------------------ */
  const hasTsconfig = await hasBinary(sandbox, "tsconfig.json");
  const hasLocalTsc = await hasBinary(sandbox, "node_modules/.bin/tsc");

  if (!hasTsconfig) {
    skipped.push({ source: "typescript", reason: "No tsconfig.json in this project." });
  } else if (!hasLocalTsc) {
    skipped.push({
      source: "typescript",
      reason: "TypeScript is not installed yet (run npm install).",
    });
  } else {
    const result = await exec(sandbox, "node_modules/.bin/tsc --noEmit --pretty false", {
      timeoutMs: 180_000,
    });
    executed.push("typescript");
    const matches = parseTsc(`${result.stdout}\n${result.stderr}`);
    for (const match of matches) {
      const isImport = match.code === "TS2307" || match.code === "TS7016";
      problems.push({
        id: `tsc:${match.file}:${match.line}:${match.code}`,
        severity: match.severity,
        source: isImport ? "import" : "typescript",
        message: match.message,
        file: match.file,
        line: match.line,
        column: match.column,
        code: match.code,
        fixable: false,
        origin: "tsc --noEmit",
      });
    }
    if (matches.length === 0 && result.exitCode !== 0 && result.stdout.trim()) {
      problems.push({
        id: "tsc:unknown",
        severity: "error",
        source: "typescript",
        message: result.stdout.trim().slice(0, 400),
        origin: "tsc --noEmit",
      });
    }
  }

  /* ESLint ---------------------------------------------------------- */
  const hasEslint = await hasBinary(sandbox, "node_modules/.bin/eslint");
  if (!hasEslint) {
    skipped.push({ source: "eslint", reason: "ESLint is not installed in this project." });
  } else {
    const target = options.lintPath ? `'${options.lintPath}'` : ".";
    const result = await exec(
      sandbox,
      `node_modules/.bin/eslint ${target} --format json --max-warnings=-1 2>/dev/null`,
      { timeoutMs: 180_000 },
    );
    executed.push("eslint");
    problems.push(...parseEslint(`${result.stdout}\n${result.stderr}`));
  }

  /* Build ----------------------------------------------------------- */
  if (options.build) {
    const result = await exec(sandbox, "npm run build 2>&1 | tail -n 200", {
      timeoutMs: 300_000,
    });
    executed.push("build");
    const buildProblems = parseBuild(result.stdout);
    if (result.exitCode !== 0 && buildProblems.length === 0) {
      buildProblems.push({
        id: "build:failed",
        severity: "error",
        source: "build",
        message: result.stdout.trim().split("\n").slice(-6).join("\n") || "Build failed.",
        origin: "npm run build",
      });
    }
    problems.push(...buildProblems);
  }

  const deduped = new Map<string, Problem>();
  for (const problem of problems) deduped.set(problem.id, problem);
  const list = [...deduped.values()].slice(0, MAX_PROBLEMS);

  return {
    problems: list,
    errors: list.filter((problem) => problem.severity === "error").length,
    warnings: list.filter((problem) => problem.severity === "warning").length,
    ranAt: Date.now(),
    executed,
    skipped,
  };
}

export function diagnosticsToPrompt(report: DiagnosticsReport, limit = 25): string {
  if (report.problems.length === 0) {
    return `No problems found. Checks run: ${report.executed.join(", ") || "none"}.`;
  }
  const lines = [
    `${report.errors} error(s), ${report.warnings} warning(s). Checks run: ${report.executed.join(", ")}.`,
  ];
  for (const problem of report.problems.slice(0, limit)) {
    const location = problem.file ? `${problem.file}${problem.line ? `:${problem.line}` : ""}` : "(project)";
    lines.push(`- [${problem.severity}] ${location} ${problem.code ?? ""} ${problem.message}`);
  }
  if (report.problems.length > limit) lines.push(`… ${report.problems.length - limit} more.`);
  return lines.join("\n");
}

/** Explain a single problem using the surrounding code, for the "Explain error" action. */
export async function problemContext(
  sandbox: Sandbox,
  problem: Problem,
  radius = 6,
): Promise<string> {
  if (!problem.file) return "";
  const result = await exec(
    sandbox,
    `sed -n '${
      Math.max(1, (problem.line ?? 1) - radius)
    },${(problem.line ?? 1) + radius}p' '${problem.file}'`,
    { timeoutMs: 15_000 },
  );
  return result.stdout;
}