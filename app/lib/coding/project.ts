// app/lib/coding/project.ts
// Automatic project scanning and analysis.
// Produces ProjectIntel from real filesystem evidence — never invented numbers.

import type { Sandbox } from "@e2b/code-interpreter";
import {
  exec,
  extOf,
  findEntries,
  isBinaryPath,
  readFileText,
  relativePath,
  type FindEntry,
} from "./sandbox";
import type {
  ApiRouteInfo,
  ArchitectureLayer,
  DependencyInfo,
  GitSummary,
  LanguageStat,
  ProjectIntel,
} from "./types";

const MANIFESTS = [
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "next.config.js",
  "next.config.mjs",
  "vite.config.ts",
  "vite.config.js",
  "astro.config.mjs",
  "nuxt.config.ts",
  "pyproject.toml",
  "requirements.txt",
  "go.mod",
  "Cargo.toml",
  "composer.json",
  "Gemfile",
];

const ENTRY_CANDIDATES = [
  "app/page.tsx",
  "app/page.ts",
  "app/layout.tsx",
  "pages/index.tsx",
  "pages/index.js",
  "src/index.ts",
  "src/index.tsx",
  "src/main.tsx",
  "src/main.ts",
  "src/App.tsx",
  "index.js",
  "index.ts",
  "server.js",
  "server.ts",
  "src/server.ts",
  "main.py",
  "app.py",
  "manage.py",
  "main.go",
  "cmd/main.go",
  "src/main.rs",
];

const LAYER_RULES: { name: string; match: RegExp; description: string }[] = [
  { name: "Routes / API", match: /^(app\/(api|.*\/route\.(ts|js))|pages\/api\/|src\/pages\/api\/)/, description: "HTTP endpoints and request handlers." },
  { name: "Screens / Pages", match: /^(app\/|pages\/|src\/pages\/|src\/app\/)/, description: "User-facing pages and layouts." },
  { name: "Components", match: /(^|\/)(components|ui)\//, description: "Reusable view components." },
  { name: "Lib / Domain", match: /(^|\/)(lib|utils|helpers|services|core|domain|server)\//, description: "Business logic and shared utilities." },
  { name: "State / Store", match: /(^|\/)(store|stores|state|context|hooks)\//, description: "Client state, hooks and providers." },
  { name: "Data / DB", match: /(^|\/)(db|database|prisma|migrations|schema|models)\//, description: "Persistence layer and schemas." },
  { name: "Tests", match: /(^|\/)(__tests__|tests?|spec)\/|\.(test|spec)\./, description: "Automated tests." },
  { name: "Config", match: /(^|\/)(config|configs|\.github|scripts)\//, description: "Build, CI and tooling configuration." },
  { name: "Static assets", match: /^(public|static|assets)\//, description: "Served static files." },
];

const TEXT_EXT_FOR_STATS = new Set([
  "ts", "tsx", "js", "jsx", "mjs", "cjs", "css", "scss", "html", "md", "mdx",
  "py", "go", "rs", "java", "rb", "php", "sql", "yml", "yaml", "toml", "sh", "json",
]);

export interface ReadJsonResult<T> {
  ok: boolean;
  value?: T;
  error?: string;
}

export async function readJson<T>(sandbox: Sandbox, path: string): Promise<ReadJsonResult<T>> {
  try {
    const raw = await readFileText(sandbox, path);
    return { ok: true, value: JSON.parse(raw) as T };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function readText(sandbox: Sandbox, path: string): Promise<string | undefined> {
  try {
    return await readFileText(sandbox, path);
  } catch {
    return undefined;
  }
}

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  packageManager?: string;
  engines?: Record<string, string>;
  type?: string;
  main?: string;
}

function toDependencies(pkg: PackageJson | undefined): DependencyInfo[] {
  if (!pkg) return [];
  const deps: DependencyInfo[] = [];
  for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
    deps.push({ name, version, dev: false });
  }
  for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
    deps.push({ name, version, dev: true });
  }
  return deps.sort((a, b) => a.name.localeCompare(b.name));
}

function detectType(pkg: PackageJson | undefined, entries: FindEntry[]): ProjectIntel["type"] {
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  const has = (name: string) => Boolean(deps[name]);

  if (has("next")) return "next";
  if (has("nuxt")) return "next";
  if (has("astro")) return "vite";
  if (has("vite")) return "vite";
  if (has("react-scripts")) return "cra";
  if (pkg) return "node";

  const hasExt = (ext: string) => entries.some((entry) => entry.type === "file" && extOf(entry.path) === ext);
  if (entries.some((entry) => /^(go\.mod)$/.test(entry.path))) return "go";
  if (entries.some((entry) => /^Cargo\.toml$/.test(entry.path))) return "rust";
  if (hasExt("py") || entries.some((entry) => entry.path === "pyproject.toml")) return "python";
  if (hasExt("html")) return "static";
  return "unknown";
}

function detectFramework(pkg: PackageJson | undefined, type: ProjectIntel["type"]): string | undefined {
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  if (deps.next) return `Next.js ${deps.next}`;
  if (deps.nuxt) return `Nuxt ${deps.nuxt}`;
  if (deps.astro) return `Astro ${deps.astro}`;
  if (deps.vite) return `Vite ${deps.vite}`;
  if (deps.expo) return `Expo ${deps.expo}`;
  if (deps["react-native"]) return "React Native";
  if (deps.react) return `React ${deps.react}`;
  if (deps.vue) return `Vue ${deps.vue}`;
  if (deps.svelte) return `Svelte ${deps.svelte}`;
  if (deps.express) return `Express ${deps.express}`;
  if (deps.fastify) return `Fastify ${deps.fastify}`;
  if (deps.hono) return `Hono ${deps.hono}`;
  if (type === "python") return "Python";
  if (type === "go") return "Go";
  if (type === "rust") return "Rust";
  return undefined;
}

function detectPackageManager(pkg: PackageJson | undefined, entries: FindEntry[]): ProjectIntel["packageManager"] {
  const paths = new Set(entries.map((entry) => entry.path));
  if (paths.has("pnpm-lock.yaml")) return "pnpm";
  if (paths.has("yarn.lock")) return "yarn";
  if (paths.has("bun.lockb") || paths.has("bun.lock")) return "bun";
  if (paths.has("package-lock.json")) return "npm";
  if (pkg?.packageManager) {
    const name = pkg.packageManager.split("@")[0];
    if (name === "npm" || name === "pnpm" || name === "yarn" || name === "bun") return name;
  }
  if (pkg) return "npm";
  if (paths.has("poetry.lock") || paths.has("pyproject.toml")) return "poetry";
  if (paths.has("requirements.txt")) return "pip";
  if (paths.has("Cargo.toml")) return "cargo";
  if (paths.has("go.mod")) return "go";
  return undefined;
}

function detectDatabase(pkg: PackageJson | undefined, entries: FindEntry[]): string | undefined {
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  if (deps["@supabase/supabase-js"]) return "Supabase (Postgres)";
  if (deps.prisma) {
    const provider = entries.find((entry) => entry.path.endsWith("schema.prisma"));
    return provider ? "Prisma" : "Prisma";
  }
  if (deps.drizzle || deps["drizzle-orm"]) return "Drizzle";
  if (deps.mongoose) return "MongoDB (Mongoose)";
  if (deps.pg || deps.postgres) return "PostgreSQL";
  if (deps.mysql2) return "MySQL";
  if (deps.redis || deps.ioredis) return "Redis";
  return undefined;
}

function languageStatistics(entries: FindEntry[]): LanguageStat[] {
  const totals = new Map<string, { files: number; bytes: number }>();
  let allBytes = 0;

  for (const entry of entries) {
    if (entry.type !== "file" || isBinaryPath(entry.path)) continue;
    const ext = extOf(entry.path);
    if (!TEXT_EXT_FOR_STATS.has(ext)) continue;
    const language = languageName(ext);
    const current = totals.get(language) ?? { files: 0, bytes: 0 };
    current.files += 1;
    current.bytes += entry.size;
    totals.set(language, current);
    allBytes += entry.size;
  }

  return [...totals.entries()]
    .map(([language, value]) => ({
      language,
      files: value.files,
      bytes: value.bytes,
      percent: allBytes > 0 ? Math.round((value.bytes / allBytes) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10);
}

function languageName(ext: string): string {
  const map: Record<string, string> = {
    ts: "TypeScript",
    tsx: "TypeScript",
    js: "JavaScript",
    jsx: "JavaScript",
    mjs: "JavaScript",
    cjs: "JavaScript",
    css: "CSS",
    scss: "SCSS",
    html: "HTML",
    md: "Markdown",
    mdx: "MDX",
    json: "JSON",
    py: "Python",
    go: "Go",
    rs: "Rust",
    java: "Java",
    rb: "Ruby",
    php: "PHP",
    sql: "SQL",
    yml: "YAML",
    yaml: "YAML",
    toml: "TOML",
    sh: "Shell",
  };
  return map[ext] ?? ext.toUpperCase();
}

function toRoutePath(filePath: string): string {
  if (filePath.startsWith("app/")) {
    const segments = filePath
      .replace(/^app\//, "")
      .replace(/\/route\.(ts|js|tsx|jsx)$/, "")
      .replace(/\/page\.(ts|js|tsx|jsx)$/, "")
      .split("/")
      .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
      .map((segment) => {
        const optionalCatchAll = segment.match(/^\[\[\.\.\.(.+)\]\]$/);
        if (optionalCatchAll) return `:${optionalCatchAll[1]}?`;
        const catchAll = segment.match(/^\[\.\.\.(.+)\]$/);
        if (catchAll) return `:${catchAll[1]}*`;
        const dynamic = segment.match(/^\[(.+)\]$/);
        if (dynamic) return `:${dynamic[1]}`;
        return segment;
      });
    return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
  }
  return filePath
    .replace(/^(src\/)?pages\/api\//, "/api/")
    .replace(/\.(ts|js|tsx|jsx)$/, "")
    .replace(/\/index$/, "")
    .replace(/\[(.+?)\]/g, ":$1");
}

async function collectApiRoutes(sandbox: Sandbox, entries: FindEntry[]): Promise<ApiRouteInfo[]> {
  const routeFiles = entries.filter(
    (entry) =>
      entry.type === "file" &&
      (/^app\/.*\/?route\.(ts|js|tsx|jsx)$/.test(entry.path) || /^(src\/)?pages\/api\/.*\.(ts|js|tsx|jsx)$/.test(entry.path)),
  );
  if (routeFiles.length === 0) return [];

  const list = routeFiles.slice(0, 300).map((entry) => entry.path);
  const grep = await exec(
    sandbox,
    `grep -nE "export (async )?function (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)|export const (GET|POST|PUT|PATCH|DELETE)" ${list
      .map((path) => `'${path}'`)
      .join(" ")} 2>/dev/null | head -n 400`,
    { timeoutMs: 30_000 },
  );

  const methodsByFile = new Map<string, string[]>();
  for (const line of grep.stdout.split("\n")) {
    const match = line.match(/^(.*?):(\d+):(.*)$/);
    if (!match) continue;
    const [, file, , text] = match;
    const method = text.match(/\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/)?.[1];
    if (!method) continue;
    const current = methodsByFile.get(file) ?? [];
    if (!current.includes(method)) current.push(method);
    methodsByFile.set(file, current);
  }

  const routes: ApiRouteInfo[] = [];
  for (const file of list) {
    const methods = methodsByFile.get(file) ?? ["ANY"];
    const route = toRoutePath(file);
    for (const method of methods) {
      routes.push({ method, route, file, dynamic: route.includes(":") });
    }
  }
  return routes.sort((a, b) => a.route.localeCompare(b.route) || a.method.localeCompare(b.method));
}

function architectureLayers(entries: FindEntry[]): ArchitectureLayer[] {
  const groups = new Map<string, Set<string>>();
  for (const entry of entries) {
    if (entry.type !== "file" || isBinaryPath(entry.path)) continue;
    for (const rule of LAYER_RULES) {
      if (!rule.match.test(entry.path)) continue;
      const bucket = groups.get(rule.name) ?? new Set<string>();
      const topLevel = entry.path.split("/").slice(0, 2).join("/");
      bucket.add(topLevel);
      groups.set(rule.name, bucket);
      break;
    }
  }

  const layers: ArchitectureLayer[] = [];
  for (const rule of LAYER_RULES) {
    const paths = groups.get(rule.name);
    if (!paths || paths.size === 0) continue;
    layers.push({
      name: rule.name,
      paths: [...paths].slice(0, 12),
      description: rule.description,
    });
  }
  return layers;
}

function detectTests(pkg: PackageJson | undefined, entries: FindEntry[]): ProjectIntel["tests"] {
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  const files = entries.filter(
    (entry) =>
      entry.type === "file" &&
      /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.path) ||
      (entry.type === "file" && /(^|\/)__tests__\//.test(entry.path)),
  ).length;

  let framework: string | undefined;
  let command: string | undefined;

  if (deps.vitest) {
    framework = "vitest";
    command = "npx vitest run";
  } else if (deps.jest) {
    framework = "jest";
    command = "npx jest";
  } else if (deps.playwright || deps["@playwright/test"]) {
    framework = "playwright";
    command = "npx playwright test";
  } else if (deps.mocha) {
    framework = "mocha";
    command = "npx mocha";
  } else if (pkg?.scripts?.test) {
    framework = "script";
    command = `${pkg.scripts.test}`;
  }

  return { framework, files, command };
}

async function readGitSummary(sandbox: Sandbox): Promise<GitSummary> {
  const check = await exec(sandbox, "git rev-parse --is-inside-work-tree 2>/dev/null", {
    timeoutMs: 15_000,
  });
  if (check.stdout.trim() !== "true") return { isRepo: false };

  const [status, branch, remotes] = await Promise.all([
    exec(sandbox, "git status --porcelain=v1 2>/dev/null | wc -l", { timeoutMs: 20_000 }),
    exec(sandbox, "git status -sb 2>/dev/null | head -n 1", { timeoutMs: 20_000 }),
    exec(sandbox, "git remote 2>/dev/null", { timeoutMs: 15_000 }),
  ]);

  const header = branch.stdout.trim();
  const nameMatch = header.match(/^##\s+([^.\s]+)/);
  const aheadMatch = header.match(/ahead (\d+)/);
  const behindMatch = header.match(/behind (\d+)/);
  const changed = Number(status.stdout.trim()) || 0;

  return {
    isRepo: true,
    branch: nameMatch?.[1]?.replace(/^No commits yet on /, "") ?? "unknown",
    clean: changed === 0,
    changed,
    ahead: aheadMatch ? Number(aheadMatch[1]) : 0,
    behind: behindMatch ? Number(behindMatch[1]) : 0,
    remotes: remotes.stdout.trim().split("\n").filter(Boolean),
  };
}

function projectSummary(intel: Omit<ProjectIntel, "summary">): string {
  const parts: string[] = [];
  parts.push(`${intel.name} — ${intel.type}${intel.framework ? ` (${intel.framework})` : ""}.`);
  parts.push(
    `${intel.fileCount} files across ${intel.directoryCount} directories, ${Math.round(
      intel.totalBytes / 1024,
    )} KB of text.`,
  );
  if (intel.languages.length > 0) {
    parts.push(
      `Languages: ${intel.languages
        .slice(0, 4)
        .map((language) => `${language.language} ${language.percent}%`)
        .join(", ")}.`,
    );
  }
  if (intel.packageManager) parts.push(`Package manager: ${intel.packageManager}.`);
  if (intel.entryPoints.length > 0) parts.push(`Entry points: ${intel.entryPoints.join(", ")}.`);
  if (intel.apiRoutes.length > 0) {
    parts.push(
      `${intel.apiRoutes.length} API routes, e.g. ${intel.apiRoutes
        .slice(0, 5)
        .map((route) => `${route.method} ${route.route}`)
        .join(", ")}.`,
    );
  }
  if (intel.database) parts.push(`Database: ${intel.database}.`);
  if (intel.tests.command) parts.push(`Tests: ${intel.tests.framework} (${intel.tests.command}).`);
  if (intel.git.isRepo) {
    parts.push(
      `Git: branch ${intel.git.branch}, ${intel.git.clean ? "clean" : `${intel.git.changed} changed`}.`,
    );
  }
  return parts.join(" ");
}

export async function scanProject(sandbox: Sandbox): Promise<ProjectIntel> {
  const entries = await findEntries(sandbox);

  const paths = new Set(entries.map((entry) => entry.path));
  const packageJsonPath = MANIFESTS.find((path) => paths.has(path) && path === "package.json");
  const pkgResult = packageJsonPath
    ? await readJson<PackageJson>(sandbox, packageJsonPath)
    : { ok: false as const };
  const pkg = pkgResult.ok ? pkgResult.value : undefined;

  const type = detectType(pkg, entries);
  const dependencies = toDependencies(pkg);

  const entryPoints = ENTRY_CANDIDATES.filter((path) => paths.has(path));
  if (entryPoints.length === 0 && pkg?.main && paths.has(pkg.main)) entryPoints.push(pkg.main);

  const [apiRoutes, git] = await Promise.all([
    collectApiRoutes(sandbox, entries),
    readGitSummary(sandbox),
  ]);

  const fileEntries = entries.filter((entry) => entry.type === "file");
  const directoryEntries = entries.filter((entry) => entry.type === "directory");

  const base: Omit<ProjectIntel, "summary"> = {
    root: "",
    name: pkg?.name ?? relativePath("") ?? "workspace",
    type,
    framework: detectFramework(pkg, type),
    runtime: pkg?.engines?.node ? `node ${pkg.engines.node}` : type === "python" ? "python" : undefined,
    packageManager: detectPackageManager(pkg, entries),
    entryPoints,
    languages: languageStatistics(entries),
    dependencies,
    scripts: pkg?.scripts ?? {},
    database: detectDatabase(pkg, entries),
    apiRoutes,
    architecture: architectureLayers(entries),
    fileCount: fileEntries.length,
    directoryCount: directoryEntries.length,
    totalBytes: fileEntries.reduce((total, entry) => total + entry.size, 0),
    tests: detectTests(pkg, entries),
    git,
    scannedAt: Date.now(),
  };

  // name falls back to the workspace directory name
  if (!pkg?.name) {
    const pwd = await exec(sandbox, "basename $(pwd)");
    base.name = pwd.stdout.trim() || "workspace";
    base.root = relativePath((await exec(sandbox, "pwd")).stdout.trim());
  }

  return { ...base, summary: projectSummary(base) };
}