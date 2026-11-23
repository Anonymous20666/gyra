// app/lib/coding/codeindex.ts
// Function / class / symbol / import indexing for the whole project.
// Uses one batched grep pass per pattern set instead of reading every file,
// so indexing a 5,000-file repo stays cheap.

import type { Sandbox } from "@e2b/code-interpreter";
import { exec, hashContent, isBinaryPath } from "./sandbox";
import type { CodeIndex, ImportEdge, SymbolEntry, SymbolKind } from "./types";

const CODE_GLOBS = [
  "--include=*.ts",
  "--include=*.tsx",
  "--include=*.js",
  "--include=*.jsx",
  "--include=*.mjs",
  "--include=*.cjs",
  "--include=*.py",
  "--include=*.go",
  "--include=*.rs",
];

const EXCLUDES = [
  "--exclude-dir=node_modules",
  "--exclude-dir=.git",
  "--exclude-dir=.next",
  "--exclude-dir=dist",
  "--exclude-dir=build",
  "--exclude-dir=coverage",
  "--exclude-dir=.turbo",
  "--exclude-dir=__pycache__",
  "--exclude-dir=.venv",
].join(" ");

const SYMBOL_PATTERN = [
  // function declarations
  "^[[:space:]]*(export[[:space:]]+)?(default[[:space:]]+)?(async[[:space:]]+)?function\\*?[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*",
  // classes
  "^[[:space:]]*(export[[:space:]]+)?(default[[:space:]]+)?(abstract[[:space:]]+)?class[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*",
  // interfaces and types
  "^[[:space:]]*(export[[:space:]]+)?(declare[[:space:]]+)?interface[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*",
  "^[[:space:]]*(export[[:space:]]+)?type[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*=",
  // enums
  "^[[:space:]]*(export[[:space:]]+)?(const[[:space:]]+)?enum[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*",
  // const / let / var (covers arrow components, hooks, singletons)
  "^[[:space:]]*(export[[:space:]]+)?(const|let|var)[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*[:=]",
  // python def / class
  "^[[:space:]]*(async[[:space:]]+)?def[[:space:]]+[A-Za-z_][A-Za-z0-9_]*",
  // go func / type
  "^[[:space:]]*func[[:space:]]+(\\([^)]*\\)[[:space:]]*)?[A-Za-z_][A-Za-z0-9_]*",
  // rust fn / struct / enum / trait
  "^[[:space:]]*(pub[[:space:]]+)?(async[[:space:]]+)?(fn|struct|enum|trait)[[:space:]]+[A-Za-z_][A-Za-z0-9_]*",
].join("|");

const IMPORT_PATTERN = [
  "^[[:space:]]*import[[:space:]]+.*from[[:space:]]+['\"]",
  "^[[:space:]]*import[[:space:]]+['\"]",
  "^[[:space:]]*const[[:space:]]+.*=[[:space:]]*require\\(['\"]",
  "^[[:space:]]*from[[:space:]]+[A-Za-z_.]+[[:space:]]+import[[:space:]]+",
  "^[[:space:]]*use[[:space:]]+[A-Za-z_]+",
].join("|");

function parseGrepLines(output: string): { file: string; line: number; text: string }[] {
  const results: { file: string; line: number; text: string }[] = [];
  for (const raw of output.split("\n")) {
    if (!raw.trim()) continue;
    const match = raw.match(/^(.*?):(\d+):(.*)$/);
    if (!match) continue;
    const [, file, line, text] = match;
    results.push({ file: file.replace(/^\.\//, ""), line: Number(line), text });
  }
  return results;
}

function symbolKindOf(text: string): SymbolKind | null {
  if (/\bclass\b/.test(text)) return "class";
  if (/\binterface\b/.test(text)) return "interface";
  if (/\btype\s+[A-Za-z_$]/.test(text)) return "type";
  if (/\benum\b/.test(text)) return "enum";
  if (/\bfunction\b/.test(text) || /\bdef\s/.test(text) || /\bfunc\s/.test(text) || /\bfn\s/.test(text)) {
    return "function";
  }
  if (/\b(const|let|var)\b/.test(text)) return "const";
  return "variable";
}

function refineKind(name: string, kind: SymbolKind): SymbolKind {
  if (kind !== "const" && kind !== "variable") return kind;
  if (/^use[A-Z]/.test(name)) return "hook";
  if (/^[A-Z]/.test(name)) return "component";
  return "const";
}

function nameFromText(text: string): string | null {
  const patterns = [
    /\bfunction\*?\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    /\bclass\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    /\binterface\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    /\btype\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    /\benum\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    /\b(const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/,
    /\bdef\s+([A-Za-z_][A-Za-z0-9_]*)/,
    /\bfunc\s+(?:\([^)]*\)\s*)?([A-Za-z_][A-Za-z0-9_]*)/,
    /\bfn\s+([A-Za-z_][A-Za-z0-9_]*)/,
    /\b(struct|trait)\s+([A-Za-z_][A-Za-z0-9_]*)/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const candidate = match[2] && /^(const|let|var|struct|trait)$/.test(match[1]) ? match[2] : match[1];
    if (candidate && /^[A-Za-z_$]/.test(candidate)) return candidate;
  }
  return null;
}

function columnOf(text: string, name: string): number {
  const index = text.indexOf(name);
  return index === -1 ? 0 : index + 1;
}

function resolveSpecifier(fromFile: string, specifier: string, allFiles: Set<string>): string | undefined {
  if (!specifier.startsWith(".")) return undefined;
  const baseSegments = fromFile.split("/").slice(0, -1);
  const parts = specifier.split("/");
  const stack = [...baseSegments];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  const base = stack.join("/");
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.mjs`,
    `${base}.cjs`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
    `${base}/index.js`,
    `${base}/index.jsx`,
  ];
  return candidates.find((candidate) => allFiles.has(candidate));
}

function importedNames(text: string): string[] | undefined {
  const named = text.match(/\{([^}]+)\}/);
  if (!named) return undefined;
  return named[1]
    .split(",")
    .map((part) => part.trim().split(/\s+as\s+/)[0].trim())
    .filter((name) => Boolean(name) && /^[A-Za-z_$][\w$]*$/.test(name));
}

export async function buildCodeIndex(sandbox: Sandbox): Promise<CodeIndex> {
  const [filesResult, symbolResult, importResult] = await Promise.all([
    exec(
      sandbox,
      `find . -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.mjs' -o -name '*.cjs' -o -name '*.py' -o -name '*.go' -o -name '*.rs' \\) ` +
        `-not -path './node_modules/*' -not -path './.git/*' -not -path './.next/*' -not -path './dist/*' -not -path './build/*' ` +
        `-not -path './coverage/*' | head -n 8000`,
      { timeoutMs: 45_000 },
    ),
    exec(
      sandbox,
      `grep -rnE ${JSON.stringify(SYMBOL_PATTERN)} ${EXCLUDES} ${CODE_GLOBS.join(" ")} . 2>/dev/null | head -n 12000`,
      { timeoutMs: 90_000 },
    ),
    exec(
      sandbox,
      `grep -rnE ${JSON.stringify(IMPORT_PATTERN)} ${EXCLUDES} ${CODE_GLOBS.join(" ")} . 2>/dev/null | head -n 12000`,
      { timeoutMs: 90_000 },
    ),
  ]);

  const allFiles = new Set(
    filesResult.stdout
      .split("\n")
      .map((line) => line.replace(/^\.\//, "").trim())
      .filter((line) => line && !isBinaryPath(line)),
  );

  const symbols: SymbolEntry[] = [];
  const seen = new Set<string>();

  for (const entry of parseGrepLines(symbolResult.stdout)) {
    if (!allFiles.has(entry.file)) continue;
    const name = nameFromText(entry.text);
    if (!name) continue;
    const rawKind = symbolKindOf(entry.text);
    if (!rawKind) continue;

    const key = `${entry.file}:${entry.line}:${name}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const kind = refineKind(name, rawKind);
    const exported = /\bexport\b/.test(entry.text);

    symbols.push({
      id: key,
      name,
      kind,
      file: entry.file,
      line: entry.line,
      column: columnOf(entry.text, name),
      exported,
      signature: entry.text.trim().slice(0, 240),
    });

    if (symbols.length >= 8000) break;
  }

  const imports: ImportEdge[] = [];
  const importSeen = new Set<string>();

  for (const entry of parseGrepLines(importResult.stdout)) {
    if (!allFiles.has(entry.file)) continue;

    const specifierMatch =
      entry.text.match(/from\s+['"]([^'"]+)['"]/) ??
      entry.text.match(/require\(\s*['"]([^'"]+)['"]\s*\)/) ??
      entry.text.match(/^import\s+['"]([^'"]+)['"]/) ??
      entry.text.match(/^from\s+([A-Za-z_.]+)\s+import/) ??
      entry.text.match(/^use\s+([A-Za-z_]+)/);
    if (!specifierMatch) continue;

    const specifier = specifierMatch[1];
    const key = `${entry.file}:${entry.line}:${specifier}`;
    if (importSeen.has(key)) continue;
    importSeen.add(key);

    const external =
      !specifier.startsWith(".") &&
      !specifier.startsWith("/") &&
      !specifier.startsWith("@/") &&
      !specifier.startsWith("~/");

    imports.push({
      from: entry.file,
      specifier,
      resolved: external ? undefined : resolveSpecifier(entry.file, specifier, allFiles),
      external,
      names: importedNames(entry.text),
      line: entry.line,
    });

    if (imports.length >= 10000) break;
  }

  const fileHashes: Record<string, string> = {};
  for (const file of allFiles) {
    fileHashes[file] = hashContent(`${file}:${Date.now()}`);
  }

  return {
    symbols,
    imports,
    fileHashes,
    builtAt: Date.now(),
  };
}

/* ------------------------------------------------------------------ */
/* Queries                                                            */
/* ------------------------------------------------------------------ */

export function findSymbols(
  index: CodeIndex,
  query: string,
  limit = 40,
): SymbolEntry[] {
  const needle = query.toLowerCase();
  const scored = index.symbols
    .map((symbol) => {
      const name = symbol.name.toLowerCase();
      let score = 0;
      if (name === needle) score = 100;
      else if (name.startsWith(needle)) score = 80;
      else if (name.includes(needle)) score = 60;
      else if (symbol.file.toLowerCase().includes(needle)) score = 25;
      if (symbol.exported) score += 5;
      return { symbol, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.symbol);
}

export function symbolsInFile(index: CodeIndex, file: string): SymbolEntry[] {
  return index.symbols.filter((symbol) => symbol.file === file).sort((a, b) => a.line - b.line);
}

export function importersOf(index: CodeIndex, file: string): string[] {
  const importers = new Set<string>();
  for (const edge of index.imports) {
    if (edge.resolved === file) importers.add(edge.from);
  }
  return [...importers];
}

export function dependenciesOf(index: CodeIndex, file: string): string[] {
  const dependencies = new Set<string>();
  for (const edge of index.imports) {
    if (edge.from === file && edge.resolved) dependencies.add(edge.resolved);
  }
  return [...dependencies];
}

export function exportedSymbolNames(index: CodeIndex, file: string): string[] {
  return index.symbols
    .filter((symbol) => symbol.file === file && symbol.exported)
    .map((symbol) => symbol.name);
}

export function symbolOutline(index: CodeIndex, file: string): string {
  const symbols = symbolsInFile(index, file);
  if (symbols.length === 0) return "";
  return symbols
    .map((symbol) => `${symbol.line}: ${symbol.kind} ${symbol.name}${symbol.exported ? " (exported)" : ""}`)
    .join("\n");
}