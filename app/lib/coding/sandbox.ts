// app/lib/coding/sandbox.ts
// E2B sandbox access layer for GYRA CODE.
// Owns: connection, command execution, file IO, tree building, PTY sessions,
// snapshots, process control. Everything else in the coding workspace goes through here.

import { Sandbox } from "@e2b/code-interpreter";
import { createHash } from "node:crypto";
import type { FileNode, PtySession, SandboxInfo } from "./types";

export const SANDBOX_ROOT = "/home/user";
export const SANDBOX_TIMEOUT_MS = 30 * 60 * 1000;
export const MAX_READ_BYTES = 1_500_000;
export const MAX_WRITE_BYTES = 1_000_000;
export const GYRA_DIR = `${SANDBOX_ROOT}/.gyra`;
export const SNAPSHOT_DIR = `${GYRA_DIR}/snapshots`;

export const PRUNE_DIRS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  ".turbo",
  ".cache",
  "coverage",
  ".venv",
  "venv",
  "__pycache__",
  "vendor",
  ".pnpm-store",
  ".svelte-kit",
  ".nuxt",
  "target",
];

export const CODE_EXTENSIONS = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "json",
  "css",
  "scss",
  "html",
  "md",
  "mdx",
  "py",
  "go",
  "rs",
  "java",
  "rb",
  "php",
  "sql",
  "yml",
  "yaml",
  "toml",
  "sh",
];

const BINARY_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "ico",
  "bmp",
  "avif",
  "pdf",
  "zip",
  "gz",
  "tgz",
  "tar",
  "mp3",
  "mp4",
  "mov",
  "wav",
  "woff",
  "woff2",
  "ttf",
  "otf",
  "eot",
  "so",
  "dll",
  "dylib",
  "exe",
  "wasm",
  "sqlite",
  "db",
  "lock",
]);

const LANGUAGE_BY_EXT: Record<string, string> = {
  ts: "typescript",
  tsx: "typescriptreact",
  js: "javascript",
  jsx: "javascriptreact",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  css: "css",
  scss: "scss",
  less: "less",
  html: "html",
  md: "markdown",
  mdx: "mdx",
  py: "python",
  go: "go",
  rs: "rust",
  java: "java",
  rb: "ruby",
  php: "php",
  sql: "sql",
  yml: "yaml",
  yaml: "yaml",
  toml: "ini",
  sh: "shell",
  bash: "shell",
  env: "ini",
  prisma: "prisma",
};

export function assertApiKey(): void {
  if (!process.env.E2B_API_KEY) {
    throw new Error(
      "Missing E2B_API_KEY. Create one at https://e2b.dev and add E2B_API_KEY to your environment.",
    );
  }
}

/* ------------------------------------------------------------------ */
/* Connection                                                         */
/* ------------------------------------------------------------------ */

export interface SandboxHandle {
  sandbox: Sandbox;
  info: SandboxInfo;
}

export async function openSandbox(sandboxId?: string): Promise<SandboxHandle> {
  assertApiKey();

  let sandbox: Sandbox;
  if (sandboxId) {
    sandbox = await Sandbox.connect(sandboxId, { timeoutMs: SANDBOX_TIMEOUT_MS });
  } else {
    sandbox = await Sandbox.create({ timeoutMs: SANDBOX_TIMEOUT_MS });
  }

  try {
    await sandbox.setTimeout(SANDBOX_TIMEOUT_MS);
  } catch {
    // Older SDK builds do not expose setTimeout; the create timeout still applies.
  }

  await exec(sandbox, `mkdir -p ${GYRA_DIR} ${SNAPSHOT_DIR}`, { timeoutMs: 10_000 });

  const info: SandboxInfo = {
    sandboxId: sandbox.sandboxId,
    root: SANDBOX_ROOT,
    startedAt: Date.now(),
    status: "running",
  };

  return { sandbox, info };
}

export async function pauseSandbox(sandbox: Sandbox): Promise<void> {
  try {
    await sandbox.pause();
  } catch {
    // Pausing is best effort; sandboxes also expire on their own timeout.
  }
}

/* ------------------------------------------------------------------ */
/* Paths                                                              */
/* ------------------------------------------------------------------ */

export function resolvePath(relPath: string): string {
  const cleaned = relPath.replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
  if (!cleaned) return SANDBOX_ROOT;
  const segments = cleaned.split("/");
  if (segments.some((segment) => segment === "..")) {
    throw new Error(`Refusing to access a path outside the workspace: ${relPath}`);
  }
  return `${SANDBOX_ROOT}/${cleaned}`;
}

export function relativePath(absPath: string): string {
  if (absPath === SANDBOX_ROOT) return "";
  return absPath.startsWith(`${SANDBOX_ROOT}/`)
    ? absPath.slice(SANDBOX_ROOT.length + 1)
    : absPath;
}

export function extOf(path: string): string {
  const name = path.split("/").pop() ?? path;
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index + 1).toLowerCase();
}

export function languageFor(path: string): string {
  return LANGUAGE_BY_EXT[extOf(path)] ?? "plaintext";
}

export function isBinaryPath(path: string): boolean {
  return BINARY_EXTENSIONS.has(extOf(path));
}

export function isTextPath(path: string): boolean {
  return CODE_EXTENSIONS.includes(extOf(path)) && !isBinaryPath(path);
}

export function hashContent(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

/* ------------------------------------------------------------------ */
/* Execution                                                          */
/* ------------------------------------------------------------------ */

export interface ExecOptions {
  cwd?: string;
  timeoutMs?: number;
  envs?: Record<string, string>;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

interface RawCommandResult {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}

export async function exec(
  sandbox: Sandbox,
  command: string,
  options: ExecOptions = {},
): Promise<ExecResult> {
  const startedAt = Date.now();
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  try {
    const result = (await sandbox.commands.run(command, {
      cwd: options.cwd ?? SANDBOX_ROOT,
      timeoutMs: options.timeoutMs ?? 60_000,
      envs: options.envs,
      onStdout: (chunk: string) => {
        stdoutChunks.push(chunk);
        options.onStdout?.(chunk);
      },
      onStderr: (chunk: string) => {
        stderrChunks.push(chunk);
        options.onStderr?.(chunk);
      },
    })) as RawCommandResult;

    return {
      stdout: result.stdout ?? stdoutChunks.join(""),
      stderr: result.stderr ?? stderrChunks.join(""),
      exitCode: result.exitCode ?? 0,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    const failure = error as RawCommandResult & { message?: string };
    return {
      stdout: failure.stdout ?? stdoutChunks.join(""),
      stderr: failure.stderr ?? stderrChunks.join("") ?? failure.message ?? String(error),
      exitCode: typeof failure.exitCode === "number" ? failure.exitCode : 1,
      durationMs: Date.now() - startedAt,
    };
  }
}

export interface BackgroundHandle {
  pid: number;
  kill: () => Promise<void>;
}

export async function runBackground(
  sandbox: Sandbox,
  command: string,
  options: ExecOptions = {},
): Promise<BackgroundHandle> {
  const handle = await sandbox.commands.run(command, {
    cwd: options.cwd ?? SANDBOX_ROOT,
    envs: options.envs,
    background: true,
    onStdout: (chunk: string) => options.onStdout?.(chunk),
    onStderr: (chunk: string) => options.onStderr?.(chunk),
  });

  return {
    pid: handle.pid,
    kill: async () => {
      try {
        await handle.kill();
      } catch {
        await killProcess(sandbox, handle.pid);
      }
    },
  };
}

export interface ProcessInfo {
  pid: number;
  command: string;
  cwd?: string;
  running: boolean;
}

export async function listProcesses(sandbox: Sandbox): Promise<ProcessInfo[]> {
  try {
    const processes = await sandbox.commands.list();
    return processes.map((entry) => ({
      pid: entry.pid,
      command: "cmd" in entry ? String(entry.cmd ?? "") : "",
      cwd: "cwd" in entry ? String(entry.cwd ?? "") : undefined,
      running: true,
    }));
  } catch {
    return [];
  }
}

export async function killProcess(sandbox: Sandbox, pid: number): Promise<boolean> {
  try {
    return await sandbox.commands.kill(pid);
  } catch {
    const result = await exec(sandbox, `kill -9 ${Number(pid)} || true`, { timeoutMs: 10_000 });
    return result.exitCode === 0;
  }
}

/* ------------------------------------------------------------------ */
/* Files                                                              */
/* ------------------------------------------------------------------ */

async function readRaw(sandbox: Sandbox, absPath: string): Promise<string> {
  const value = (await sandbox.files.read(absPath)) as unknown as string | Uint8Array;
  return typeof value === "string" ? value : new TextDecoder().decode(value);
}

export async function readFileText(sandbox: Sandbox, relPath: string): Promise<string> {
  if (isBinaryPath(relPath)) {
    throw new Error(`Cannot read binary file as text: ${relPath}`);
  }
  const content = await readRaw(sandbox, resolvePath(relPath));
  if (content.length > MAX_READ_BYTES) {
    return `${content.slice(0, MAX_READ_BYTES)}\n\n/* [GYRA truncated at ${MAX_READ_BYTES} bytes] */`;
  }
  return content;
}

export async function writeFileText(
  sandbox: Sandbox,
  relPath: string,
  content: string,
): Promise<void> {
  if (content.length > MAX_WRITE_BYTES) {
    throw new Error(`File too large to write (${content.length} bytes, limit ${MAX_WRITE_BYTES}).`);
  }
  const absPath = resolvePath(relPath);
  const dir = absPath.slice(0, absPath.lastIndexOf("/"));
  if (dir) await sandbox.files.makeDir(dir);
  await sandbox.files.write(absPath, content);
}

export async function fileExists(sandbox: Sandbox, relPath: string): Promise<boolean> {
  try {
    return await sandbox.files.exists(resolvePath(relPath));
  } catch {
    return false;
  }
}

export async function makeDirectory(sandbox: Sandbox, relPath: string): Promise<void> {
  await sandbox.files.makeDir(resolvePath(relPath));
}

export async function removePath(sandbox: Sandbox, relPath: string): Promise<void> {
  const rel = relPath.replace(/^\/+|\/+$/g, "");
  if (!rel) throw new Error("Refusing to delete the workspace root.");
  await sandbox.files.remove(resolvePath(rel));
}

export async function copyPath(
  sandbox: Sandbox,
  fromRel: string,
  toRel: string,
): Promise<void> {
  const from = resolvePath(fromRel);
  const to = resolvePath(toRel);
  const targetDir = to.slice(0, to.lastIndexOf("/"));
  if (targetDir) await sandbox.files.makeDir(targetDir);
  const result = await exec(sandbox, `cp -r ${shellQuote(from)} ${shellQuote(to)}`, {
    timeoutMs: 30_000,
  });
  if (result.exitCode !== 0) throw new Error(result.stderr || "Copy failed");
}

export async function movePath(
  sandbox: Sandbox,
  fromRel: string,
  toRel: string,
): Promise<void> {
  const from = resolvePath(fromRel);
  const to = resolvePath(toRel);
  const targetDir = to.slice(0, to.lastIndexOf("/"));
  if (targetDir) await sandbox.files.makeDir(targetDir);
  const result = await exec(sandbox, `mv ${shellQuote(from)} ${shellQuote(to)}`, {
    timeoutMs: 30_000,
  });
  if (result.exitCode !== 0) throw new Error(result.stderr || "Move failed");
}

export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/* ------------------------------------------------------------------ */
/* Tree                                                               */
/* ------------------------------------------------------------------ */

export interface FindEntry {
  type: "file" | "directory" | "link";
  path: string;
  size: number;
  modifiedAt: number;
}

const PRUNE_EXPRESSION = PRUNE_DIRS.map((dir) => `-name ${dir}`).join(" -o ");

export async function findEntries(
  sandbox: Sandbox,
  limit = 20_000,
): Promise<FindEntry[]> {
  const command =
    `find . -mindepth 1 \\( ${PRUNE_EXPRESSION} \\) -prune -o ` +
    `-printf '%y\\t%s\\t%T@\\t%p\\n' 2>/dev/null | head -n ${limit}`;

  const result = await exec(sandbox, command, { timeoutMs: 45_000 });
  const entries: FindEntry[] = [];

  for (const line of result.stdout.split("\n")) {
    if (!line.trim()) continue;
    const match = line.match(/^([fdl])\t(\d+)\t([\d.]+)\t(.*)$/);
    if (!match) continue;
    const [, type, size, mtime, rawPath] = match;
    const path = rawPath.replace(/^\.\//, "");
    if (!path) continue;
    entries.push({
      type: type === "d" ? "directory" : type === "l" ? "link" : "file",
      path,
      size: Number(size) || 0,
      modifiedAt: Math.round(Number(mtime) * 1000) || 0,
    });
  }

  return entries;
}

export function buildTree(entries: FindEntry[]): FileNode[] {
  const root: FileNode[] = [];
  const directories = new Map<string, FileNode>();

  const ensureDirectory = (path: string): FileNode[] => {
    if (!path) return root;
    const existing = directories.get(path);
    if (existing) return existing.children as FileNode[];

    const parentPath = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    const parentChildren = ensureDirectory(parentPath);
    const node: FileNode = {
      name: path.split("/").pop() ?? path,
      path,
      type: "directory",
      hidden: (path.split("/").pop() ?? "").startsWith("."),
      children: [],
    };
    parentChildren.push(node);
    directories.set(path, node);
    return node.children as FileNode[];
  };

  for (const entry of entries) {
    if (entry.type === "directory") {
      ensureDirectory(entry.path);
      continue;
    }
    const parentPath = entry.path.includes("/")
      ? entry.path.slice(0, entry.path.lastIndexOf("/"))
      : "";
    const parent = ensureDirectory(parentPath);
    parent.push({
      name: entry.path.split("/").pop() ?? entry.path,
      path: entry.path,
      type: "file",
      size: entry.size,
      modifiedAt: entry.modifiedAt,
      language: languageFor(entry.path),
      hidden: (entry.path.split("/").pop() ?? "").startsWith("."),
    });
  }

  const sortNodes = (nodes: FileNode[]): void => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) sortNodes(node.children);
    }
  };

  sortNodes(root);
  return root;
}

export async function readTree(sandbox: Sandbox): Promise<FileNode[]> {
  const entries = await findEntries(sandbox);
  return buildTree(entries);
}

/* ------------------------------------------------------------------ */
/* Preview URLs                                                       */
/* ------------------------------------------------------------------ */

export function previewUrl(sandbox: Sandbox, port: number): string {
  try {
    return `https://${sandbox.getHost(port)}`;
  } catch {
    return `https://${port}-${sandbox.sandboxId}.e2b.app`;
  }
}

/* ------------------------------------------------------------------ */
/* PTY (interactive terminal)                                         */
/* ------------------------------------------------------------------ */

interface PtyHandle {
  pid: number;
  wait: () => Promise<void>;
}

export interface PtyApi {
  create: (options: {
    cols: number;
    rows: number;
    cwd?: string;
    envs?: Record<string, string>;
    onData?: (data: string) => void;
  }) => Promise<PtyHandle>;
  connect: (
    pid: number,
    options: { onData: (data: string) => void },
  ) => Promise<PtyHandle>;
  sendInput: (pid: number, data: Uint8Array) => Promise<void>;
  resize?: (pid: number, options: { cols: number; rows: number }) => Promise<void>;
  kill?: (pid: number) => Promise<boolean>;
}

/**
 * The code-interpreter package does not always surface the PTY module in its
 * public types, even though the underlying sandbox supports it. We read it
 * defensively so a version bump cannot break the terminal panel.
 */
export function getPty(sandbox: Sandbox): PtyApi | null {
  const candidate = sandbox as unknown as { pty?: PtyApi };
  if (!candidate.pty || typeof candidate.pty.create !== "function") return null;
  return candidate.pty;
}

export async function createPtySession(
  sandbox: Sandbox,
  options: { title?: string; cols: number; rows: number; cwd?: string },
  onData: (data: string) => void,
): Promise<PtySession> {
  const pty = getPty(sandbox);
  if (!pty) throw new Error("Interactive terminal is unavailable in this sandbox build.");

  const handle = await pty.create({
    cols: options.cols,
    rows: options.rows,
    cwd: options.cwd ? resolvePath(options.cwd) : SANDBOX_ROOT,
    onData,
  });

  return {
    pid: handle.pid,
    title: options.title ?? "Terminal",
    cols: options.cols,
    rows: options.rows,
    createdAt: Date.now(),
    status: "running",
    cwd: options.cwd ?? "",
  };
}

export async function attachPty(
  sandbox: Sandbox,
  pid: number,
  onData: (data: string) => void,
): Promise<void> {
  const pty = getPty(sandbox);
  if (!pty) throw new Error("Interactive terminal is unavailable in this sandbox build.");
  try {
    await pty.connect(pid, { onData });
  } catch {
    // Already attached elsewhere; output will still arrive on the original stream.
  }
}

export async function writePty(sandbox: Sandbox, pid: number, data: string): Promise<void> {
  const pty = getPty(sandbox);
  if (!pty) throw new Error("Interactive terminal is unavailable in this sandbox build.");
  await pty.sendInput(pid, new TextEncoder().encode(data));
}

export async function resizePty(
  sandbox: Sandbox,
  pid: number,
  cols: number,
  rows: number,
): Promise<void> {
  const pty = getPty(sandbox);
  if (!pty?.resize) return;
  try {
    await pty.resize(pid, { cols, rows });
  } catch {
    // Resize is cosmetic; ignore failures.
  }
}

export async function killPty(sandbox: Sandbox, pid: number): Promise<void> {
  const pty = getPty(sandbox);
  if (pty?.kill) {
    try {
      await pty.kill(pid);
      return;
    } catch {
      // fall through to process kill
    }
  }
  await killProcess(sandbox, pid);
}

export async function listPtySessions(sandbox: Sandbox): Promise<PtySession[]> {
  const processes = await listProcesses(sandbox);
  return processes
    .filter((entry) => entry.command.includes("bash") || entry.command.includes("sh -"))
    .map((entry) => ({
      pid: entry.pid,
      title: `Terminal ${entry.pid}`,
      cols: 80,
      rows: 24,
      createdAt: Date.now(),
      status: "running" as const,
      cwd: entry.cwd ?? "",
    }));
}

/* ------------------------------------------------------------------ */
/* Snapshots                                                          */
/* ------------------------------------------------------------------ */

export interface SnapshotResult {
  id: string;
  tarPath: string;
  bytes: number;
  files: number;
}

export async function createSnapshot(
  sandbox: Sandbox,
  label: string,
): Promise<SnapshotResult> {
  const id = `${Date.now()}-${label.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "snap"}`;
  const tarPath = `${SNAPSHOT_DIR}/${id}.tgz`;
  const excludes = PRUNE_DIRS.map((dir) => `--exclude=${dir}`).join(" ");

  const result = await exec(
    sandbox,
    `mkdir -p ${SNAPSHOT_DIR} && tar -czf ${shellQuote(tarPath)} ${excludes} --exclude=.gyra . 2>/dev/null; ` +
      `stat -c %s ${shellQuote(tarPath)} 2>/dev/null || echo 0; ` +
      `find . -type f -not -path './node_modules/*' -not -path './.git/*' | wc -l`,
    { timeoutMs: 120_000 },
  );

  const [sizeLine, countLine] = result.stdout.trim().split("\n");

  return {
    id,
    tarPath,
    bytes: Number(sizeLine) || 0,
    files: Number(countLine) || 0,
  };
}

export async function restoreSnapshot(
  sandbox: Sandbox,
  tarPath: string,
): Promise<{ restored: boolean; message: string }> {
  if (!tarPath.startsWith(SNAPSHOT_DIR)) {
    return { restored: false, message: "Snapshot path is outside the snapshot directory." };
  }
  const result = await exec(
    sandbox,
    `cd ${SANDBOX_ROOT} && tar -xzf ${shellQuote(tarPath)} 2>&1`,
    { timeoutMs: 120_000 },
  );
  return {
    restored: result.exitCode === 0,
    message: result.exitCode === 0 ? "Workspace restored." : result.stderr || result.stdout,
  };
}