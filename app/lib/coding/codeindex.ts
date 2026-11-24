/* app/lib/coding/codeindex.ts
 * Lightweight symbol index of the sandbox workspace. Dependency-free.
 */

import {
  SANDBOX_ROOT,
  execCommand,
  getSandbox,
  readFileText,
  type SandboxInput,
} from "./sandbox";

export type CodeSymbolKind =
  | "function"
  | "class"
  | "interface"
  | "type"
  | "const"
  | "enum"
  | "component"
  | "route"
  | "export";

export type CodeSymbol = {
  name: string;
  kind: CodeSymbolKind;
  path: string;
  line: number;
  exported: boolean;
  signature: string;
};

export type IndexedFile = {
  path: string;
  language: string;
  lines: number;
  symbols: CodeSymbol[];
};

export type CodeIndex = {
  sandboxId: string;
  root: string;
  files: IndexedFile[];
  symbols: CodeSymbol[];
  byName: Record<string, CodeSymbol[]>;
  fileCount: number;
  symbolCount: number;
  builtAt: string;
};

const INDEXABLE = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const MAX_FILES = 500;
const MAX_BYTES = 400000;
const CONCURRENCY = 8;

const cache = new Map<string, CodeIndex>();

function languageFor(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".tsx")) return "tsx";
  if (lower.endsWith(".ts")) return "ts";
  if (lower.endsWith(".jsx")) return "jsx";
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) return "js";
  return "text";
}

export function extractSymbols(path: string, content: string): CodeSymbol[] {
  const symbols: CodeSymbol[] = [];
  const lines = content.split("\n");
  const isComponent = languageFor(path) !== "ts" && languageFor(path) !== "js";

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const line = raw.trim();
    if (!line || line.startsWith("//") || line.startsWith("*") || line.startsWith("/*")) {
      continue;
    }

    const exported = /\bexport\b/.test(line);
    const at = (name: string, kind: CodeSymbolKind): void => {
      symbols.push({
        name,
        kind,
        path,
        line: index + 1,
        exported,
        signature: line.slice(0, 200),
      });
    };

    const fn = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)/.exec(line);
    if (fn?.[1]) {
      const name = fn[1];
      at(name, isComponent && /^[A-Z]/.test(name) ? "component" : "function");
      continue;
    }

    const arrow =
      /^(?:export\s+)?(?:default\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*(?::[^=]+)?=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/.exec(
        line,
      );
    if (arrow?.[1]) {
      const name = arrow[1];
      at(name, isComponent && /^[A-Z]/.test(name) ? "component" : "const");
      continue;
    }

    const cls = /^(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)/.exec(line);
    if (cls?.[1]) {
      at(cls[1], "class");
      continue;
    }

    const iface = /^(?:export\s+)?interface\s+([A-Za-z0-9_$]+)/.exec(line);
    if (iface?.[1]) {
      at(iface[1], "interface");
      continue;
    }

    const typeAlias = /^(?:export\s+)?type\s+([A-Za-z0-9_$]+)\s*[=<]/.exec(line);
    if (typeAlias?.[1]) {
      at(typeAlias[1], "type");
      continue;
    }

    const enumDecl = /^(?:export\s+)?(?:const\s+)?enum\s+([A-Za-z0-9_$]+)/.exec(line);
    if (enumDecl?.[1]) {
      at(enumDecl[1], "enum");
      continue;
    }

    const route =
      /^export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/.exec(line);
    if (route?.[1]) {
      at(`${route[1]} ${path}`, "route");
      continue;
    }

    const reexport = /^export\s+\{([^}]+)\}/.exec(line);
    if (reexport?.[1]) {
      for (const piece of reexport[1].split(",")) {
        const name = piece.replace(/\btype\b/, "").split(/\s+as\s+/).pop()?.trim();
        if (name) at(name, "export");
      }
    }
  }

  return symbols;
}

function buildByName(symbols: CodeSymbol[]): Record<string, CodeSymbol[]> {
  const map: Record<string, CodeSymbol[]> = {};
  for (const symbol of symbols) {
    const key = symbol.name;
    const list = map[key];
    if (list) list.push(symbol);
    else map[key] = [symbol];
  }
  return map;
}

async function readMany(
  target: SandboxInput,
  paths: string[],
): Promise<IndexedFile[]> {
  const indexed: IndexedFile[] = [];
  let cursor = 0;

  const worker = async (): Promise<void> => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      const path = paths[index];
      if (!path) return;

      const content = await readFileText(target, path).catch(() => "");
      if (!content) continue;
      if (content.length > MAX_BYTES) continue;

      indexed.push({
        path,
        language: languageFor(path),
        lines: content.split("\n").length,
        symbols: extractSymbols(path, content),
      });
    }
  };

  const workers = Array.from({ length: Math.min(CONCURRENCY, paths.length) }, () =>
    worker(),
  );
  await Promise.all(workers);

  return indexed.sort((a, b) => a.path.localeCompare(b.path));
}

export async function buildIndex(
  target?: SandboxInput,
  options: { force?: boolean } = {},
): Promise<CodeIndex> {
  const sandbox = await getSandbox(target);
  const cached = cache.get(sandbox.sandboxId);
  if (cached && !options.force) return cached;

  const command = [
    `cd ${SANDBOX_ROOT} 2>/dev/null || exit 1`,
    `find . -maxdepth 6 -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.mjs' -o -name '*.cjs' \\) -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.next/*' -not -path '*/dist/*' -not -path '*/build/*' -print 2>/dev/null`,
  ].join(" && ");

  const run = await execCommand(sandbox, command, {
    cwd: SANDBOX_ROOT,
    timeoutMs: 60000,
  }).catch(() => null);

  const paths: string[] = [];
  if (run && run.exitCode === 0) {
    for (const rawLine of run.stdout.split("\n")) {
      const line = rawLine.replace(/\r$/, "").trim();
      if (!line.startsWith("./")) continue;
      const path = line.slice(2);
      if (!INDEXABLE.some((ext) => path.toLowerCase().endsWith(ext))) continue;
      paths.push(path);
      if (paths.length >= MAX_FILES) break;
    }
  }

  const files = await readMany(sandbox, paths);
  const symbols = files.flatMap((file) => file.symbols);

  const index: CodeIndex = {
    sandboxId: sandbox.sandboxId,
    root: SANDBOX_ROOT,
    files,
    symbols,
    byName: buildByName(symbols),
    fileCount: files.length,
    symbolCount: symbols.length,
    builtAt: new Date().toISOString(),
  };

  cache.set(sandbox.sandboxId, index);
  return index;
}

export const getIndex = buildIndex;
export const indexProject = buildIndex;

export function invalidateIndex(sandboxId?: string): void {
  if (sandboxId) cache.delete(sandboxId);
  else cache.clear();
}

export async function findSymbol(
  name: string,
  target?: SandboxInput,
): Promise<CodeSymbol[]> {
  const index = await buildIndex(target);
  return index.byName[name] ?? [];
}

export async function searchSymbols(
  query: string,
  target?: SandboxInput,
  limit: number = 50,
): Promise<CodeSymbol[]> {
  const index = await buildIndex(target);
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const bounded = Math.min(Math.max(Math.round(limit) || 50, 1), 500);
  return index.symbols
    .filter((symbol) => symbol.name.toLowerCase().includes(needle))
    .slice(0, bounded);
}