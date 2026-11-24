/* app/lib/coding/search.ts
 * Project text search inside the sandbox (ripgrep, grep fallback).
 */

import {
  SANDBOX_ROOT,
  execCommand,
  getSandbox,
  type SandboxInput,
} from "./sandbox";

export type SearchMatch = {
  path: string;
  line: number;
  column: number;
  text: string;
};

export type SearchOptions = {
  caseSensitive?: boolean;
  regex?: boolean;
  maxResults?: number;
  include?: string;
};

export type SearchResult = {
  query: string;
  matches: SearchMatch[];
  results: SearchMatch[];
  hits: SearchMatch[];
  total: number;
  truncated: boolean;
  error: string | null;
};

function shellQuote(value: string): string {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function clampMax(value?: number): number {
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return 500;
  return Math.min(Math.round(raw), 2000);
}

function parseMatches(output: string, limit: number): { matches: SearchMatch[]; truncated: boolean } {
  const matches: SearchMatch[] = [];
  let truncated = false;

  for (const rawLine of output.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (!line.trim()) continue;
    if (matches.length >= limit) {
      truncated = true;
      break;
    }

    const first = line.indexOf(":");
    if (first === -1) continue;
    const second = line.indexOf(":", first + 1);
    if (second === -1) continue;

    const path = line.slice(0, first).replace(/^\.\//, "");
    const lineNumber = Number(line.slice(first + 1, second));
    if (!Number.isFinite(lineNumber)) continue;

    matches.push({
      path,
      line: lineNumber,
      column: 1,
      text: line.slice(second + 1).trimEnd(),
    });
  }

  return { matches, truncated };
}

async function runSearch(
  target: SandboxInput,
  query: string,
  options: SearchOptions,
): Promise<SearchResult> {
  const limit = clampMax(options.maxResults);
  const pattern = shellQuote(query);
  const include = options.include ? `-g ${shellQuote(options.include)}` : "";

  const flags = [
    options.caseSensitive ? "" : "-i",
    options.regex ? "" : "-F",
  ]
    .filter(Boolean)
    .join(" ");

  const rg = `rg -n --no-heading --color never ${flags} ${include} -e ${pattern} . 2>/dev/null`;
  const grep = `grep -rnI ${options.caseSensitive ? "" : "-i"} ${
    options.regex ? "-E" : "-F"
  } -e ${pattern} . 2>/dev/null`;
  const exclude = `--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next --exclude-dir=dist --exclude-dir=build`;

  const command = [
    `cd ${SANDBOX_ROOT} 2>/dev/null || exit 1`,
    `if command -v rg >/dev/null 2>&1; then ${rg} | head -n ${limit + 50}; else ${grep.replace("grep -rnI", `grep -rnI ${exclude}`)} | head -n ${limit + 50}; fi`,
  ].join("; ");

  const sandbox = await getSandbox(target);
  const run = await execCommand(sandbox, command, {
    cwd: SANDBOX_ROOT,
    timeoutMs: 60000,
  }).catch(() => null);

  if (!run) {
    return {
      query,
      matches: [],
      results: [],
      hits: [],
      total: 0,
      truncated: false,
      error: "Search could not run inside the sandbox.",
    };
  }

  const { matches, truncated } = parseMatches(`${run.stdout}`, limit);

  return {
    query,
    matches,
    results: matches,
    hits: matches,
    total: matches.length,
    truncated,
    error: matches.length === 0 && run.stderr.trim() ? run.stderr.trim().slice(0, 400) : null,
  };
}

export async function searchProject(
  target: SandboxInput,
  query: string,
  options?: SearchOptions,
): Promise<SearchResult>;
export async function searchProject(
  query: string,
  options?: SearchOptions,
): Promise<SearchResult>;
export async function searchProject(
  targetOrQuery: SandboxInput | string,
  queryOrOptions?: string | SearchOptions,
  maybeOptions?: SearchOptions,
): Promise<SearchResult> {
  const queryIsSecond = typeof queryOrOptions === "string";

  const target: SandboxInput = queryIsSecond
    ? (targetOrQuery as SandboxInput)
    : undefined;
  const query = queryIsSecond
    ? (queryOrOptions as string)
    : String(targetOrQuery ?? "");
  const options = (queryIsSecond ? maybeOptions : (queryOrOptions as SearchOptions | undefined)) ?? {};

  const clean = query.trim();
  if (!clean) {
    return {
      query: "",
      matches: [],
      results: [],
      hits: [],
      total: 0,
      truncated: false,
      error: "A search query is required.",
    };
  }

  return runSearch(target, clean, options);
}

export const searchWorkspace = searchProject;
export const findInProject = searchProject;