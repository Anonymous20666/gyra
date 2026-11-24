/* app/lib/coding/diagnostics.ts
 * TypeScript + ESLint diagnostics read from the sandbox. Dependency-free.
 */

import {
  SANDBOX_ROOT,
  execCommand,
  getSandbox,
  type SandboxInput,
} from "./sandbox";

export type DiagnosticSeverity = "error" | "warning" | "info";

export type Diagnostic = {
  file: string;
  line: number;
  column: number;
  severity: DiagnosticSeverity;
  message: string;
  code: string | null;
  source: "typescript" | "eslint";
};

export type DiagnosticReport = {
  ok: boolean;
  total: number;
  errors: number;
  warnings: number;
  ranTsc: boolean;
  ranEslint: boolean;
  diagnostics: Diagnostic[];
  raw: string;
  error: string | null;
  scannedAt: string;
};

const TSC_MISSING = "__NO_TSC__";
const ESLINT_MISSING = "__NO_ESLINT__";
const TSC_PATTERN = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+)?:?\s*(.*)$/;
const ESLINT_PATTERN = /^(.+?):(\d+):(\d+):\s+(error|warning)\s+(.*?)(?:\s+\(([^)]+)\))?$/;

function normalizePath(path: string): string {
  const clean = path.replace(/\\/g, "/").trim();
  if (clean.startsWith(SANDBOX_ROOT)) {
    return clean.slice(SANDBOX_ROOT.length).replace(/^\/+/, "");
  }
  return clean.replace(/^\.?\//, "");
}

function clampLimit(limit?: number): number {
  const raw = Number(limit);
  if (!Number.isFinite(raw) || raw <= 0) return 500;
  return Math.min(Math.round(raw), 5000);
}

function parseTsc(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const rawLine of output.split("\n")) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line) continue;
    const match = TSC_PATTERN.exec(line);
    if (!match) continue;
    const file = match[1] ?? "";
    const severity = match[4] === "warning" ? "warning" : "error";
    diagnostics.push({
      file: normalizePath(file),
      line: Number(match[2]) || 1,
      column: Number(match[3]) || 1,
      severity,
      code: match[5] ?? null,
      message: (match[6] ?? "").trim() || "TypeScript error",
      source: "typescript",
    });
  }
  return diagnostics;
}

function parseEslint(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const start = output.indexOf("[");
  const end = output.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return diagnostics;

  let parsed: unknown;
  try {
    parsed = JSON.parse(output.slice(start, end + 1));
  } catch {
    return diagnostics;
  }
  if (!Array.isArray(parsed)) return diagnostics;

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as { filePath?: unknown; messages?: unknown };
    const file = typeof record.filePath === "string" ? record.filePath : "";
    if (!file || !Array.isArray(record.messages)) continue;

    for (const message of record.messages) {
      if (!message || typeof message !== "object") continue;
      const item = message as {
        line?: unknown;
        column?: unknown;
        severity?: unknown;
        message?: unknown;
        ruleId?: unknown;
      };
      diagnostics.push({
        file: normalizePath(file),
        line: typeof item.line === "number" ? item.line : 1,
        column: typeof item.column === "number" ? item.column : 1,
        severity: item.severity === 1 ? "warning" : "error",
        code: typeof item.ruleId === "string" ? item.ruleId : null,
        message:
          typeof item.message === "string" && item.message.trim()
            ? item.message.trim()
            : "Lint problem",
        source: "eslint",
      });
    }
  }
  return diagnostics;
}

export async function runDiagnostics(
  target?: SandboxInput,
  options: { includeEslint?: boolean; limit?: number } = {},
): Promise<DiagnosticReport> {
  const sandbox = await getSandbox(target);
  const limit = clampLimit(options.limit);
  const includeEslint = options.includeEslint !== false;

  const tscCommand = [
    `cd ${SANDBOX_ROOT} 2>/dev/null || exit 1`,
    `if [ -x node_modules/.bin/tsc ]; then node_modules/.bin/tsc --noEmit --pretty false; elif [ -f tsconfig.json ]; then echo ${TSC_MISSING}; else echo ${TSC_MISSING}; fi`,
  ].join("; ");

  const tscRun = await execCommand(sandbox, tscCommand, {
    cwd: SANDBOX_ROOT,
    timeoutMs: 240000,
  }).catch(() => null);

  const raw = tscRun ? `${tscRun.stdout}${tscRun.stderr}` : "";
  const ranTsc = Boolean(tscRun) && !raw.includes(TSC_MISSING);
  const diagnostics: Diagnostic[] = ranTsc
    ? parseTsc(raw)
    : [];

  let ranEslint = false;
  let eslintRaw = "";

  if (includeEslint) {
    const eslintCommand = [
      `cd ${SANDBOX_ROOT} 2>/dev/null || exit 1`,
      `if [ -x node_modules/.bin/eslint ]; then node_modules/.bin/eslint . --format json --no-error-on-unmatched-pattern 2>/dev/null; else echo ${ESLINT_MISSING}; fi`,
    ].join("; ");

    const eslintRun = await execCommand(sandbox, eslintCommand, {
      cwd: SANDBOX_ROOT,
      timeoutMs: 240000,
    }).catch(() => null);

    eslintRaw = eslintRun ? `${eslintRun.stdout}${eslintRun.stderr}` : "";
    ranEslint = Boolean(eslintRun) && !eslintRaw.includes(ESLINT_MISSING);
    if (ranEslint) diagnostics.push(...parseEslint(eslintRaw));
  }

  const trimmed = diagnostics.slice(0, limit);
  const errors = trimmed.filter((item) => item.severity === "error").length;
  const warnings = trimmed.filter((item) => item.severity === "warning").length;

  return {
    ok: errors === 0,
    total: trimmed.length,
    errors,
    warnings,
    ranTsc,
    ranEslint,
    diagnostics: trimmed,
    raw: raw.slice(0, 20000),
    error:
      !ranTsc && !ranEslint
        ? "No TypeScript or ESLint installation was found in the workspace yet."
        : null,
    scannedAt: new Date().toISOString(),
  };
}

export const diagnosticsReport = runDiagnostics;
export const getDiagnostics = runDiagnostics;
export const analyzeProject = runDiagnostics;

export async function diagnoseFile(
  target: SandboxInput,
  path: string,
): Promise<Diagnostic[]> {
  const report = await runDiagnostics(target, { includeEslint: false });
  const wanted = normalizePath(path);
  return report.diagnostics.filter((item) => item.file === wanted);
}