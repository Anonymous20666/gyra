// app/lib/coding/search.ts
// Hybrid project search: filenames + content + symbols + imports.
// One engine powers the Search panel, the agent's search_codebase tool and
// context selection.

import type { Sandbox } from "@e2b/code-interpreter";
import type { CodeIndex } from "./types";
import { exec } from "./sandbox";
import type { SearchFilters, SearchHit, SearchMatch, SearchResponse } from "./types";

const GREP_EXCLUDES = [
  "--exclude-dir=node_modules",
  "--exclude-dir=.git",
  "--exclude-dir=.next",
  "--exclude-dir=dist",
  "--exclude-dir=build",
  "--exclude-dir=coverage",
  "--exclude-dir=.turbo",
  "--exclude-dir=.venv",
  "--exclude-dir=__pycache__",
].join(" ");

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPattern(query: string, filters: SearchFilters): string {
  if (filters.regex) return query;
  if (filters.exact) return escapeRegex(query);
  return query
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegex)
    .join(".*");
}

function parseGrep(output: string, filters: SearchFilters): Map<string, SearchMatch[]> {
  const byFile = new Map<string, SearchMatch[]>();
  const regex = filters.regex
    ? (() => {
        try {
          return new RegExp(
            filters.exact ? escapeRegex(filters.glob ?? "") : "",
            filters.caseSensitive ? "" : "i",
          );
        } catch {
          return undefined;
        }
      })()
    : undefined;

  for (const raw of output.split("\n")) {
    if (!raw.trim()) continue;
    const match = raw.match(/^(.*?):(\d+):(.*)$/);
    if (!match) continue;
    const [, file, lineText, text] = match;
    const path = file.replace(/^\.\//, "");
    const column = filters.caseSensitive ? text.indexOf(lineText) : -1;

    const entry: SearchMatch = {
      line: Number(lineText),
      column: column === -1 ? Math.max(0, text.toLowerCase().indexOf(lineText.toLowerCase())) : column,
      length: lineText.length,
      preview: text.trim().slice(0, 240),
    };

    const current = byFile.get(path) ?? [];
    if (current.length < 8) current.push(entry);
    byFile.set(path, current);
  }

  void regex;
  return byFile;
}

function pathScore(path: string, query: string): number {
  const filename = (path.split("/").pop() ?? path).toLowerCase();
  const needle = query.toLowerCase();
  if (filename === needle) return 120;
  if (filename === `${needle}.ts` || filename === `${needle}.tsx` || filename === `${needle}.js`) return 110;
  if (filename.startsWith(needle)) return 85;
  if (filename.includes(needle)) return 65;
  if (path.toLowerCase().includes(needle)) return 40;
  return 0;
}

export async function searchProject(
  sandbox: Sandbox,
  query: string,
  options: { index?: CodeIndex; filters?: SearchFilters; limit?: number } = {},
): Promise<SearchResponse> {
  const startedAt = Date.now();
  const filters = options.filters ?? {};
  const limit = options.limit ?? 60;
  const trimmed = query.trim();

  if (!trimmed) {
    return { query, hits: [], totalFiles: 0, tookMs: 0, strategy: "lexical" };
  }

  const pattern = buildPattern(trimmed, filters);
  const include = filters.glob ? `--include='${filters.glob}'` : "";
  const insensitive = filters.caseSensitive ? "" : "-i";
  const hidden = filters.includeHidden ? "" : "--exclude-dir='.*'";

  const [contentResult, fileResult] = await Promise.all([
    exec(
      sandbox,
      `grep -rnE ${insensitive} ${hidden} ${include} ${GREP_EXCLUDES} -- ${JSON.stringify(pattern)} . 2>/dev/null | head -n 900`,
      { timeoutMs: 60_000 },
    ),
    exec(
      sandbox,
      `find . -type f -not -path './node_modules/*' -not -path './.git/*' -not -path './.next/*' ` +
        `-not -path './dist/*' -not -path './build/*' ${insensitive ? "-iname" : "-name"} ${JSON.stringify(
          `*${trimmed}*`,
        )} 2>/dev/null | head -n 60`,
      { timeoutMs: 30_000 },
    ),
  ]);

  const contentByFile = parseGrep(contentResult.stdout, { ...filters, regex: Boolean(filters.regex) });
  const hits = new Map<string, SearchHit>();

  const addHit = (hit: SearchHit): void => {
    const existing = hits.get(hit.path);
    if (!existing || existing.score < hit.score) {
      hits.set(hit.path, { ...hit, matches: hit.matches.length > 0 ? hit.matches : existing?.matches ?? [] });
    } else if (existing) {
      existing.score += Math.min(hit.score / 4, 20);
      const merged = new Map<number, SearchMatch>();
      for (const match of [...existing.matches, ...hit.matches]) merged.set(match.line, match);
      existing.matches = [...merged.values()].slice(0, 8);
    }
  };

  /* filenames */
  for (const rawPath of fileResult.stdout.split("\n")) {
    const path = rawPath.replace(/^\.\//, "").trim();
    if (!path) continue;
    addHit({
      path,
      type: "file",
      score: pathScore(path, trimmed),
      matches: [],
      note: "Filename match",
    });
  }

  /* content */
  for (const [path, matches] of contentByFile) {
    const isComment = matches.some((match) =>
      /^\s*(\/\/|\*|\/\*|#)/.test(match.preview),
    );
    const score = 22 + Math.min(matches.length, 10) * 5 + pathScore(path, trimmed) / 3;
    addHit({
      path,
      type: isComment ? "comment" : "content",
      score,
      matches,
      note: `${matches.length} match${matches.length === 1 ? "" : "es"}`,
    });
  }

  /* symbols + imports from the index */
  if (options.index) {
    const needle = trimmed.toLowerCase();
    for (const symbol of options.index.symbols) {
      const name = symbol.name.toLowerCase();
      if (!(name === needle || name.includes(needle))) continue;
      addHit({
        path: symbol.file,
        type: "symbol",
        score: (name === needle ? 95 : 55) + (symbol.exported ? 5 : 0),
        matches: [
          {
            line: symbol.line,
            column: Math.max(0, symbol.column - 1),
            length: symbol.name.length,
            preview: symbol.signature ?? symbol.name,
          },
        ],
        symbol,
        note: `Definition: ${symbol.kind} ${symbol.name}`,
      });
    }

    for (const edge of options.index.imports) {
      if (!edge.specifier.toLowerCase().includes(needle)) continue;
      addHit({
        path: edge.from,
        type: "import",
        score: 35,
        matches: [
          { line: edge.line, column: 0, length: trimmed.length, preview: edge.specifier },
        ],
        note: `Imports ${edge.specifier}`,
      });
    }
  }

  const ranked = [...hits.values()]
    .filter((hit) => {
      if (filters.language && !hit.path.endsWith(`.${filters.language}`)) return false;
      if (filters.modifiedOnly && hit.type === "file" && hit.matches.length === 0) return false;
      if (filters.kinds && !filters.kinds.includes(hit.type)) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
    .slice(0, limit);

  return {
    query: trimmed,
    hits: ranked,
    totalFiles: hits.size,
    tookMs: Date.now() - startedAt,
    strategy: options.index ? "hybrid" : "lexical",
  };
}

/** Compact text block the model can read, used by the agent tool. */
export function searchResultToText(response: SearchResponse, maxHits = 18): string {
  if (response.hits.length === 0) {
    return `No matches for "${response.query}".`;
  }
  const lines: string[] = [
    `${response.hits.length} of ${response.totalFiles} files matched "${response.query}" (${response.strategy}, ${response.tookMs}ms):`,
  ];
  for (const hit of response.hits.slice(0, maxHits)) {
    lines.push(`- ${hit.path} — ${hit.note ?? hit.type}`);
    for (const match of hit.matches.slice(0, 3)) {
      lines.push(`    ${match.line}: ${match.preview}`);
    }
  }
  return lines.join("\n");
}