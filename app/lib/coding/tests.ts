// app/lib/coding/tests.ts
// Test & Verification Center backend: detects the runner, executes it, parses
// structured results, and reports honestly when no tests exist.
//
// Deliberately self-contained: this file depends only on the E2B sandbox
// handle. It does NOT import helpers from ./project or ./sandbox, so a change
// in those layers can never break the test center again.

import { randomUUID } from "node:crypto";
import type { Sandbox } from "@e2b/code-interpreter";

const CWD = "/home/user";
const DEFAULT_TIMEOUT_MS = 180_000;
const MAX_OUTPUT = 40_000;

export type TestFramework =
  | "vitest"
  | "jest"
  | "playwright"
  | "mocha"
  | "script"
  | null;

export interface TestFrameworkInfo {
  framework: TestFramework;
  command: string | null;
  hasTests: boolean;
  /** Where the detection came from, so the UI can be honest about it. */
  source: string | null;
  notes: string[];
}

export interface TestCaseResult {
  id: string;
  name: string;
  suite: string | null;
  file: string | null;
  line: number | null;
  status: "passed" | "failed" | "skipped" | "todo";
  durationMs: number | null;
  failureMessages: string[];
}

export interface TestRunResult {
  id: string;
  framework: TestFramework;
  command: string | null;
  ok: boolean;
  ranAt: string;
  durationMs: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  cases: TestCaseResult[];
  stdout: string;
  stderr: string;
  notes: string[];
}

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface ExecResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

/** Trim runaway output so a chat payload never blows up. */
function clip(value: string, max = MAX_OUTPUT): string {
  if (!value) return "";
  return value.length <= max ? value : `${value.slice(0, max)}\n…[truncated]`;
}

/**
 * Single place where the sandbox is touched. Options are typed from the
 * installed SDK itself, so an E2B version drift cannot produce a type error.
 */
type RunOptions = Parameters<Sandbox["commands"]["run"]>[1];

async function run(
  sandbox: Sandbox,
  command: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ExecResult> {
  const options = { cwd: CWD, timeoutMs } as RunOptions;
  try {
    const result = await sandbox.commands.run(command, options);
    const exitCode = typeof result.exitCode === "number" ? result.exitCode : 0;
    return {
      ok: exitCode === 0,
      stdout: clip(result.stdout ?? ""),
      stderr: clip(result.stderr ?? ""),
      exitCode,
    };
  } catch (error: unknown) {
    const err = error as {
      message?: string;
      stdout?: string;
      stderr?: string;
      exitCode?: number;
    };
    return {
      ok: false,
      stdout: clip(err?.stdout ?? ""),
      stderr: clip(err?.stderr ?? err?.message ?? String(error)),
      exitCode: typeof err?.exitCode === "number" ? err.exitCode : 1,
    };
  }
}

async function fileExists(sandbox: Sandbox, path: string): Promise<boolean> {
  const result = await run(sandbox, `test -e ${shellQuote(path)} && echo yes || echo no`, 15_000);
  return result.stdout.trim() === "yes";
}

async function readText(sandbox: Sandbox, path: string): Promise<string | null> {
  const result = await run(sandbox, `cat ${shellQuote(path)}`, 20_000);
  return result.ok ? result.stdout : null;
}

async function readJson<T>(sandbox: Sandbox, path: string): Promise<T | null> {
  const raw = await readText(sandbox, path);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function hasDependency(pkg: PackageJson, name: string): boolean {
  return Boolean(pkg.dependencies?.[name] ?? pkg.devDependencies?.[name]);
}

/**
 * Detects the test runner from real project evidence only: package.json
 * scripts/dependencies, then config files, then test directories.
 */
export async function detectTestFramework(
  sandbox: Sandbox,
): Promise<TestFrameworkInfo> {
  const notes: string[] = [];
  const pkg = (await readJson<PackageJson>(sandbox, "package.json")) ?? {};
  const script = pkg.scripts?.test?.trim() ?? "";

  const configProbe = await run(
    sandbox,
    [
      "for f in vitest.config.ts vitest.config.js vitest.config.mts " +
        "jest.config.ts jest.config.js jest.config.mjs jest.config.cjs " +
        "playwright.config.ts playwright.config.js .mocharc.json .mocharc.js; do",
      '  [ -e "$f" ] && echo "CONFIG:$f"',
      "done",
      'for d in tests test __tests__ e2e spec cypress; do',
      '  [ -d "$d" ] && echo "DIR:$d"',
      "done",
      "true",
    ].join("\n"),
    20_000,
  );

  const configs = configProbe.stdout
    .split("\n")
    .filter((line) => line.startsWith("CONFIG:"))
    .map((line) => line.slice("CONFIG:".length).trim());
  const dirs = configProbe.stdout
    .split("\n")
    .filter((line) => line.startsWith("DIR:"))
    .map((line) => line.slice("DIR:".length).trim());

  const testFileProbe = await run(
    sandbox,
    "find . -maxdepth 3 -type f \\( -name '*.test.*' -o -name '*.spec.*' \\) " +
      "-not -path './node_modules/*' | head -n 20",
    20_000,
  );
  const testFiles = testFileProbe.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const hasTests = testFiles.length > 0 || dirs.length > 0;

  if (hasDependency(pkg, "vitest") || configs.some((c) => c.startsWith("vitest"))) {
    return {
      framework: "vitest",
      command:
        "npx --no-install vitest run --reporter=json --outputFile=/tmp/gyra-vitest.json",
      hasTests,
      source: hasDependency(pkg, "vitest") ? "package.json:vitest" : "vitest.config",
      notes,
    };
  }

  if (hasDependency(pkg, "jest") || configs.some((c) => c.startsWith("jest"))) {
    return {
      framework: "jest",
      command:
        "npx --no-install jest --json --outputFile=/tmp/gyra-jest.json --ci",
      hasTests,
      source: hasDependency(pkg, "jest") ? "package.json:jest" : "jest.config",
      notes,
    };
  }

  if (
    hasDependency(pkg, "@playwright/test") ||
    configs.some((c) => c.startsWith("playwright"))
  ) {
    return {
      framework: "playwright",
      command: "npx --no-install playwright test --reporter=json",
      hasTests,
      source: "playwright",
      notes,
    };
  }

  if (hasDependency(pkg, "mocha") || configs.some((c) => c.startsWith(".mocharc"))) {
    return {
      framework: "mocha",
      command: "npx --no-install mocha",
      hasTests,
      source: "mocha",
      notes,
    };
  }

  if (script) {
    notes.push(`Falling back to the package.json test script: ${script}`);
    return {
      framework: "script",
      command: "npm test --silent",
      hasTests,
      source: "package.json:scripts.test",
      notes,
    };
  }

  notes.push(
    hasTests
      ? "Test files exist but no runner was found in package.json or config files."
      : "No test runner and no test files detected in this project.",
  );

  return {
    framework: null,
    command: null,
    hasTests,
    source: null,
    notes,
  };
}

function normalizeStatus(value: unknown): TestCaseResult["status"] {
  const text = String(value ?? "").toLowerCase();
  if (text === "passed" || text === "pass" || text === "ok") return "passed";
  if (text === "failed" || text === "fail" || text === "error") return "failed";
  if (text === "skipped" || text === "pending" || text === "disabled") return "skipped";
  if (text === "todo") return "todo";
  return "passed";
}

function firstFileAndLine(message: string): { file: string | null; line: number | null } {
  const match = message.match(/([^\s()]+\.(?:ts|tsx|js|jsx|mjs|cjs)):(\d+)/);
  if (!match) return { file: null, line: null };
  return { file: match[1], line: Number(match[2]) };
}

interface VitestJson {
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  numPendingTests?: number;
  testResults?: Array<{
    name?: string;
    assertionResults?: Array<{
      fullName?: string;
      title?: string;
      ancestorTitles?: string[];
      status?: string;
      duration?: number | null;
      failureMessages?: string[];
    }>;
  }>;
}

interface JestJson {
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  numPendingTests?: number;
  testResults?: Array<{
    name?: string;
    assertionResults?: Array<{
      fullName?: string;
      title?: string;
      ancestorTitles?: string[];
      status?: string;
      duration?: number | null;
      failureMessages?: string[];
    }>;
  }>;
}

function parseRunnerJson(
  json: VitestJson | JestJson | null,
): { cases: TestCaseResult[]; totals: { total: number; passed: number; failed: number; skipped: number } } {
  const cases: TestCaseResult[] = [];

  for (const file of json?.testResults ?? []) {
    const filePath = file.name ?? null;
    for (const assertion of file.assertionResults ?? []) {
      const failureMessages = Array.isArray(assertion.failureMessages)
        ? assertion.failureMessages
        : [];
      const located = firstFileAndLine(failureMessages.join("\n"));
      cases.push({
        id: randomUUID(),
        name:
          assertion.fullName ||
          assertion.title ||
          (assertion.ancestorTitles ?? []).join(" › ") ||
          "unnamed test",
        suite:
          (assertion.ancestorTitles ?? []).filter(Boolean).join(" › ") || null,
        file: located.file ?? filePath,
        line: located.line,
        status: normalizeStatus(assertion.status),
        durationMs:
          typeof assertion.duration === "number" ? assertion.duration : null,
        failureMessages: failureMessages.map((m) => clip(m, 4000)),
      });
    }
  }

  const passed = cases.filter((c) => c.status === "passed").length;
  const failed = cases.filter((c) => c.status === "failed").length;
  const skipped = cases.filter(
    (c) => c.status === "skipped" || c.status === "todo",
  ).length;

  return {
    cases,
    totals: {
      total: cases.length || (json?.numTotalTests ?? 0),
      passed: passed || (json?.numPassedTests ?? 0),
      failed: failed || (json?.numFailedTests ?? 0),
      skipped: skipped || (json?.numPendingTests ?? 0),
    },
  };
}

/** Last-resort parser for plain-text runners (npm script, mocha, playwright). */
function parseTextOutput(stdout: string, stderr: string): {
  cases: TestCaseResult[];
  totals: { total: number; passed: number; failed: number; skipped: number };
} {
  const cases: TestCaseResult[] = [];
  const combined = `${stdout}\n${stderr}`;

  for (const line of combined.split("\n")) {
    const failing = line.match(/^\s*(?:✕|×|✗|×|FAIL|●)\s*(.+)$/);
    if (failing) {
      cases.push({
        id: randomUUID(),
        name: failing[1].trim().slice(0, 200),
        suite: null,
        file: null,
        line: null,
        status: "failed",
        durationMs: null,
        failureMessages: [],
      });
      continue;
    }
    const passing = line.match(/^\s*(?:✓|√|PASS)\s*(.+)$/);
    if (passing) {
      cases.push({
        id: randomUUID(),
        name: passing[1].trim().slice(0, 200),
        suite: null,
        file: null,
        line: null,
        status: "passed",
        durationMs: null,
        failureMessages: [],
      });
    }
  }

  const failed = cases.filter((c) => c.status === "failed").length;
  const passed = cases.filter((c) => c.status === "passed").length;

  let total = cases.length;
  const summary = combined.match(/(\d+)\s+passed/);
  const summaryFailed = combined.match(/(\d+)\s+failed/);
  if (summary) total = Math.max(total, Number(summary[1]) + Number(summaryFailed?.[1] ?? 0));
  if (summaryFailed) total = Math.max(total, Number(summaryFailed[1]) + Number(summary?.[1] ?? 0));

  return {
    cases,
    totals: {
      total,
      passed: passed || Number(summary?.[1] ?? 0),
      failed: failed || Number(summaryFailed?.[1] ?? 0),
      skipped: 0,
    },
  };
}

export interface RunTestsOptions {
  command?: string | null;
  timeoutMs?: number;
}

/**
 * Runs the detected (or supplied) test command and returns structured results.
 * Never throws: a broken runner is reported as a failed run with notes.
 */
export async function runTests(
  sandbox: Sandbox,
  options: RunTestsOptions = {},
): Promise<TestRunResult> {
  const ranAt = new Date().toISOString();
  const detected = await detectTestFramework(sandbox);
  const command = options.command?.trim() || detected.command;

  if (!command) {
    return {
      id: randomUUID(),
      framework: detected.framework,
      command: null,
      ok: false,
      ranAt,
      durationMs: 0,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      cases: [],
      stdout: "",
      stderr: "",
      notes: detected.notes,
    };
  }

  const startedAt = Date.now();
  const result = await run(sandbox, command, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const durationMs = Date.now() - startedAt;

  let parsed: {
    cases: TestCaseResult[];
    totals: { total: number; passed: number; failed: number; skipped: number };
  } | null = null;

  if (detected.framework === "vitest") {
    const json = await readJson<VitestJson>(sandbox, "/tmp/gyra-vitest.json");
    if (json?.testResults) parsed = parseRunnerJson(json);
  } else if (detected.framework === "jest") {
    const json = await readJson<JestJson>(sandbox, "/tmp/gyra-jest.json");
    if (json?.testResults) parsed = parseRunnerJson(json);
  } else if (detected.framework === "playwright") {
    try {
      const json = JSON.parse(result.stdout) as VitestJson;
      if (json?.testResults) parsed = parseRunnerJson(json);
    } catch {
      parsed = null;
    }
  }

  if (!parsed) parsed = parseTextOutput(result.stdout, result.stderr);

  const notes = [...detected.notes];
  if (!parsed.cases.length) {
    notes.push(
      "The runner produced no per-test records. Check the raw output below; it may use an unsupported reporter.",
    );
  }
  if (!result.ok && parsed.totals.failed === 0) {
    notes.push(
      "The command exited non-zero without reporting a failing test (build error, missing script, or a crash).",
    );
  }

  return {
    id: randomUUID(),
    framework: detected.framework,
    command,
    ok: result.ok && parsed.totals.failed === 0,
    ranAt,
    durationMs,
    total: parsed.totals.total,
    passed: parsed.totals.passed,
    failed: parsed.totals.failed,
    skipped: parsed.totals.skipped,
    cases: parsed.cases,
    stdout: result.stdout,
    stderr: result.stderr,
    notes,
  };
}

/** Compact prompt block for the agent. */
export function testsToPrompt(runResult: TestRunResult, limit = 25): string {
  const lines: string[] = [];
  lines.push(`Test run: ${runResult.framework ?? "unknown runner"} — ${runResult.ok ? "PASSING" : "FAILING"}`);
  lines.push(
    `${runResult.passed} passed, ${runResult.failed} failed, ${runResult.skipped} skipped (${runResult.total} total) in ${runResult.durationMs}ms`,
  );
  if (runResult.command) lines.push(`Command: ${runResult.command}`);

  const failing = runResult.cases.filter((c) => c.status === "failed").slice(0, limit);
  for (const test of failing) {
    const location = test.file ? ` (${test.file}${test.line ? `:${test.line}` : ""})` : "";
    lines.push(`- FAIL ${test.name}${location}`);
    const message = test.failureMessages[0];
    if (message) lines.push(`  ${message.split("\n").slice(0, 6).join("\n  ")}`);
  }

  for (const note of runResult.notes) lines.push(`Note: ${note}`);
  if (!runResult.cases.length && runResult.stderr) {
    lines.push(`Stderr: ${runResult.stderr.split("\n").slice(0, 12).join("\n")}`);
  }

  return lines.join("\n");
}

/** Plain list of failing test names, used by the fix-it loop. */
export function failingTestNames(runResult: TestRunResult): string[] {
  return runResult.cases
    .filter((test) => test.status === "failed")
    .map((test) => test.name);
}