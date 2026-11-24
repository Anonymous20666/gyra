/* app/lib/coding/project.ts
 * Real workspace scan (files, framework, scripts, routes). Dependency-free.
 */

import {
  SANDBOX_ROOT,
  execCommand,
  getSandbox,
  readFileText,
  writeFileText,
  type SandboxInput,
} from "./sandbox";

export type ProjectEntry = {
  path: string;
  name: string;
  type: "file" | "directory";
  depth: number;
};

export type ProjectSnapshot = {
  root: string;
  name: string;
  framework: string;
  packageManager: string;
  language: string;
  files: string[];
  directories: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  languages: Record<string, number>;
  hasGit: boolean;
  gitBranch: string | null;
  apiRoutes: string[];
  testFiles: string[];
  entries: ProjectEntry[];
  scannedAt: string;
};

export type PackageJson = {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

const IGNORED = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  ".turbo",
  ".vercel",
  "coverage",
  ".cache",
];

const CODE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".sql",
  ".css",
  ".scss",
  ".md",
  ".py",
  ".go",
  ".rs",
];

function languageFor(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith(".tsx")) return "tsx";
  if (lower.endsWith(".ts")) return "ts";
  if (lower.endsWith(".jsx")) return "jsx";
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) return "js";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".sql")) return "sql";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".scss")) return "scss";
  if (lower.endsWith(".md")) return "md";
  if (lower.endsWith(".py")) return "py";
  if (lower.endsWith(".go")) return "go";
  if (lower.endsWith(".rs")) return "rs";
  return "text";
}

function detectFramework(pkg: PackageJson): string {
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const has = (name: string): boolean => Object.prototype.hasOwnProperty.call(deps, name);

  if (has("next")) return "Next.js";
  if (has("nuxt")) return "Nuxt";
  if (has("@sveltejs/kit")) return "SvelteKit";
  if (has("svelte")) return "Svelte";
  if (has("@remix-run/react")) return "Remix";
  if (has("astro")) return "Astro";
  if (has("vite")) return "Vite";
  if (has("@angular/core")) return "Angular";
  if (has("vue")) return "Vue";
  if (has("react")) return "React";
  if (has("express")) return "Express";
  if (has("fastify")) return "Fastify";
  return "Unknown";
}

function detectLanguage(pkg: PackageJson, files: string[]): string {
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  if (Object.prototype.hasOwnProperty.call(deps, "typescript")) return "TypeScript";
  if (files.some((file) => file.endsWith(".ts") || file.endsWith(".tsx"))) {
    return "TypeScript";
  }
  if (files.some((file) => file.endsWith(".js") || file.endsWith(".jsx"))) {
    return "JavaScript";
  }
  return "Unknown";
}

function detectPackageManager(files: string[]): string {
  if (files.includes("pnpm-lock.yaml")) return "pnpm";
  if (files.includes("yarn.lock")) return "yarn";
  if (files.includes("bun.lockb") || files.includes("bun.lock")) return "bun";
  if (files.includes("package-lock.json")) return "npm";
  return "npm";
}

function isTestFile(path: string): boolean {
  const lower = path.toLowerCase();
  return (
    lower.includes("__tests__/") ||
    lower.endsWith(".test.ts") ||
    lower.endsWith(".test.tsx") ||
    lower.endsWith(".test.js") ||
    lower.endsWith(".spec.ts") ||
    lower.endsWith(".spec.tsx") ||
    lower.endsWith(".spec.js")
  );
}

function isApiRoute(path: string): boolean {
  return (
    (path.startsWith("app/") || path.startsWith("src/app/")) &&
    path.includes("/api/") &&
    (path.endsWith("route.ts") || path.endsWith("route.js"))
  );
}

function buildEntries(files: string[], directories: string[]): ProjectEntry[] {
  const entries: ProjectEntry[] = [];

  for (const dir of directories) {
    const depth = dir.split("/").filter(Boolean).length;
    entries.push({
      path: dir,
      name: dir.split("/").filter(Boolean).pop() ?? dir,
      type: "directory",
      depth,
    });
  }

  for (const file of files) {
    const depth = file.split("/").filter(Boolean).length;
    entries.push({
      path: file,
      name: file.split("/").filter(Boolean).pop() ?? file,
      type: "file",
      depth,
    });
  }

  return entries.sort((a, b) => {
    if (a.path === b.path) return 0;
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

function emptySnapshot(root: string): ProjectSnapshot {
  return {
    root,
    name: "workspace",
    framework: "Unknown",
    packageManager: "npm",
    language: "Unknown",
    files: [],
    directories: [],
    dependencies: {},
    devDependencies: {},
    scripts: {},
    languages: {},
    hasGit: false,
    gitBranch: null,
    apiRoutes: [],
    testFiles: [],
    entries: [],
    scannedAt: new Date().toISOString(),
  };
}

export async function scanProject(
  target?: SandboxInput,
): Promise<ProjectSnapshot> {
  const sandbox = await getSandbox(target);

  const excludes = IGNORED.map((name) => `-not -path '*/${name}/*'`).join(" ");
  const command = [
    `cd ${SANDBOX_ROOT} 2>/dev/null || exit 1`,
    `find . -maxdepth 6 -mindepth 1 ${excludes} -print 2>/dev/null`,
  ].join(" && ");

  const run = await execCommand(sandbox, command, {
    cwd: SANDBOX_ROOT,
    timeoutMs: 60000,
  }).catch(() => null);

  if (!run || run.exitCode !== 0) {
    return emptySnapshot(SANDBOX_ROOT);
  }

  const files: string[] = [];
  const directories: string[] = [];

  for (const rawLine of run.stdout.split("\n")) {
    const line = rawLine.replace(/\r$/, "").trim();
    if (!line.startsWith("./")) continue;
    const path = line.slice(2).replace(/\/+$/, "");
    if (!path) continue;

    if (IGNORED.some((name) => path === name || path.startsWith(`${name}/`))) {
      continue;
    }

    if (line.endsWith("/")) {
      directories.push(path);
      continue;
    }

    const lower = path.toLowerCase();
    if (!CODE_EXTENSIONS.some((ext) => lower.endsWith(ext))) continue;
    files.push(path);
  }

  files.sort();
  directories.sort();

  let pkg: PackageJson = {};
  if (files.includes("package.json")) {
    const text = await readFileText(sandbox, "package.json").catch(() => "");
    pkg = text ? parseJson<PackageJson>(text, {}) : {};
  }

  const branchRun = await execCommand(
    sandbox,
    "git rev-parse --abbrev-ref HEAD 2>/dev/null || true",
    { cwd: SANDBOX_ROOT, timeoutMs: 20000 },
  ).catch(() => null);

  const gitBranch = branchRun ? branchRun.stdout.trim() : "";
  const languages: Record<string, number> = {};
  for (const file of files) {
    const language = languageFor(file);
    languages[language] = (languages[language] ?? 0) + 1;
  }

  return {
    root: SANDBOX_ROOT,
    name: typeof pkg.name === "string" && pkg.name.trim() ? pkg.name.trim() : "workspace",
    framework: detectFramework(pkg),
    packageManager: detectPackageManager(files),
    language: detectLanguage(pkg, files),
    files,
    directories,
    dependencies: pkg.dependencies ?? {},
    devDependencies: pkg.devDependencies ?? {},
    scripts: pkg.scripts ?? {},
    languages,
    hasGit: Boolean(gitBranch) && gitBranch !== "HEAD",
    gitBranch: gitBranch || null,
    apiRoutes: files.filter(isApiRoute),
    testFiles: files.filter(isTestFile),
    entries: buildEntries(files, directories),
    scannedAt: new Date().toISOString(),
  };
}

export const getProject = scanProject;
export const readProject = scanProject;
export const projectSnapshot = scanProject;

export async function readProjectFile(
  target: SandboxInput,
  path: string,
): Promise<string> {
  return readFileText(target, path);
}

export async function writeProjectFile(
  target: SandboxInput,
  path: string,
  content: string,
): Promise<void> {
  return writeFileText(target, path, content);
}

export async function readPackageJson(
  target: SandboxInput,
): Promise<PackageJson> {
  const text = await readFileText(target, "package.json").catch(() => "");
  return text ? parseJson<PackageJson>(text, {}) : {};
}