/* app/lib/coding/sandbox.ts
 * Dependency-free E2B sandbox client built on plain `fetch`.
 * No `e2b` SDK, no node-only imports, nothing for Turbopack to resolve.
 */

export const SANDBOX_ROOT = "/home/user/gyra";
export const WORKSPACE_DIR = SANDBOX_ROOT;
export const DEFAULT_SANDBOX_PORT = 49983;
export const WORKSPACE_PORT = 3000;
export const DEFAULT_TIMEOUT_SECONDS = 900;

const DEFAULT_DOMAIN = "e2b.app";
const DEFAULT_API_HOST = "https://api.e2b.app";
const DEFAULT_ENVD_HOST = "https://sandbox.e2b.app";
const DEFAULT_TEMPLATE = "gyra";
const PROTOCOL_VERSION = "1";
const DEFAULT_EXEC_TIMEOUT_MS = 120000;

export type Sandbox = {
  sandboxId: string;
  sandboxID: string;
  templateId: string;
  templateID: string;
  domain: string;
  envdAccessToken: string;
  accessToken: string;
  createdAt: string;
  timeout: number;
  port: number;
};

export type SandboxRef = Sandbox | string;
export type SandboxInput = SandboxRef | null | undefined;

export type ExecResult = {
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number;
  ok: boolean;
  durationMs: number;
};

export type ExecOptions = {
  cwd?: string;
  envs?: Record<string, string>;
  timeoutMs?: number;
};

export type DirEntry = {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "unknown";
  size: number;
};

export type PathStat = {
  path: string;
  exists: boolean;
  type: "file" | "dir" | "symlink" | "unknown";
  size: number;
};

export class SandboxError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "SandboxError";
    this.status = status;
  }
}

/* ------------------------------------------------------------------ */
/* environment                                                         */
/* ------------------------------------------------------------------ */

export function hasSandboxCredentials(): boolean {
  const key = process.env.E2B_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

function apiKey(): string {
  const key = (process.env.E2B_API_KEY || "").trim();
  if (!key) {
    throw new SandboxError(
      "E2B_API_KEY is missing. Add it in your Vercel project settings.",
      500,
    );
  }
  return key;
}

function apiHost(): string {
  const host = (process.env.E2B_API_HOST || "").trim() || DEFAULT_API_HOST;
  return host.replace(/\/+$/, "");
}

function envdHost(): string {
  const host = (process.env.E2B_ENVD_HOST || "").trim() || DEFAULT_ENVD_HOST;
  return host.replace(/\/+$/, "");
}

function sandboxDomain(): string {
  return (process.env.E2B_DOMAIN || "").trim() || DEFAULT_DOMAIN;
}

function templateId(): string {
  return (process.env.E2B_TEMPLATE || "").trim() || DEFAULT_TEMPLATE;
}

function username(): string {
  return (process.env.E2B_USER || "").trim() || "user";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown sandbox error";
}

function clampTimeout(seconds?: number): number {
  const raw = Number(seconds);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_TIMEOUT_SECONDS;
  return Math.min(Math.max(Math.round(raw), 60), 86400);
}

/* ------------------------------------------------------------------ */
/* path helpers                                                        */
/* ------------------------------------------------------------------ */

export function workspacePath(input: string = "."): string {
  const clean = String(input || ".").replace(/\\/g, "/").trim();
  if (!clean || clean === ".") return SANDBOX_ROOT;
  if (clean === SANDBOX_ROOT || clean.startsWith(`${SANDBOX_ROOT}/`)) {
    return clean.replace(/\/+$/, "") || SANDBOX_ROOT;
  }
  const rel = clean.replace(/^\.?\//, "").replace(/\/+$/, "");
  return rel ? `${SANDBOX_ROOT}/${rel}` : SANDBOX_ROOT;
}

export function resolvePath(input: string = "."): string {
  return workspacePath(input);
}

export function relativePath(input: string): string {
  const clean = String(input || "").replace(/\\/g, "/");
  if (clean === SANDBOX_ROOT) return "";
  if (clean.startsWith(`${SANDBOX_ROOT}/`)) return clean.slice(SANDBOX_ROOT.length + 1);
  return clean.replace(/^\.?\//, "");
}

function parentDir(path: string): string {
  const clean = path.replace(/\/+$/, "");
  const index = clean.lastIndexOf("/");
  if (index <= 0) return "/";
  return clean.slice(0, index);
}

function shellQuote(value: string): string {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

/* ------------------------------------------------------------------ */
/* connect protocol helpers                                            */
/* ------------------------------------------------------------------ */

function encodeConnectMessage(payload: unknown): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const buffer = new ArrayBuffer(bytes.length + 5);
  const frame = new Uint8Array(buffer);
  frame[0] = 0;
  frame[1] = (bytes.length >>> 24) & 0xff;
  frame[2] = (bytes.length >>> 16) & 0xff;
  frame[3] = (bytes.length >>> 8) & 0xff;
  frame[4] = bytes.length & 0xff;
  frame.set(bytes, 5);
  return buffer;
}

type ConnectFrame = { flags: number; payload: unknown };

function decodeConnectFrames(buffer: Uint8Array): ConnectFrame[] {
  const frames: ConnectFrame[] = [];
  const byte = (index: number): number => buffer[index] ?? 0;
  let offset = 0;

  while (offset + 5 <= buffer.length) {
    const flags = byte(offset);
    const length =
      ((byte(offset + 1) << 24) |
        (byte(offset + 2) << 16) |
        (byte(offset + 3) << 8) |
        byte(offset + 4)) >>> 0;
    const start = offset + 5;
    const end = start + length;
    if (end > buffer.length) break;

    const text = new TextDecoder().decode(buffer.subarray(start, end));
    let payload: unknown = null;
    if (text.trim().length > 0) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }
    frames.push({ flags, payload });
    offset = end;
  }

  return frames;
}

type ProcessStreamPayload = {
  event?: {
    start?: unknown;
    data?: { stdout?: string; stderr?: string; pty?: string };
    end?: { exitCode?: number; error?: string | null };
  };
  error?: { message?: string; code?: string };
};

/* ------------------------------------------------------------------ */
/* transport                                                           */
/* ------------------------------------------------------------------ */

async function envdFetch(
  sandbox: Sandbox,
  path: string,
  init: RequestInit & { port?: number } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("E2b-Sandbox-Id", sandbox.sandboxId);
  headers.set(
    "E2b-Sandbox-Port",
    String(init.port ?? sandbox.port ?? DEFAULT_SANDBOX_PORT),
  );
  const token = sandbox.envdAccessToken || sandbox.accessToken;
  if (token) headers.set("X-Access-Token", token);

  const response = await fetch(`${envdHost()}${path}`, { ...init, headers });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new SandboxError(
      `Sandbox request failed (${response.status}) on ${path}${
        detail ? `: ${detail.slice(0, 400)}` : ""
      }`,
      response.status,
    );
  }
  return response;
}

/* ------------------------------------------------------------------ */
/* lifecycle                                                           */
/* ------------------------------------------------------------------ */

export async function openSandbox(
  options: { template?: string; timeoutSeconds?: number } = {},
): Promise<Sandbox> {
  const timeout = clampTimeout(options.timeoutSeconds);
  const template = (options.template || "").trim() || templateId();

  let response: Response;
  try {
    response = await fetch(`${apiHost()}/v2/sandboxes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey(),
      },
      body: JSON.stringify({ templateID: template, timeout }),
      cache: "no-store",
    });
  } catch (error) {
    throw new SandboxError(`Could not reach E2B: ${errorMessage(error)}`, 502);
  }

  const text = await response.text();
  if (!response.ok) {
    throw new SandboxError(
      `Could not start sandbox (${response.status})${
        text ? `: ${text.slice(0, 400)}` : ""
      }`,
      response.status,
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new SandboxError("E2B returned an unreadable sandbox response.", 502);
  }

  const id = String(payload.sandboxID ?? payload.sandboxId ?? "").trim();
  if (!id) throw new SandboxError("E2B did not return a sandbox id.", 502);

  const token = String(
    payload.envdAccessToken ?? payload.accessToken ?? "",
  ).trim();

  const sandbox: Sandbox = {
    sandboxId: id,
    sandboxID: id,
    templateId: String(payload.templateID ?? template),
    templateID: String(payload.templateID ?? template),
    domain: String(payload.domain ?? sandboxDomain()),
    envdAccessToken: token,
    accessToken: token,
    createdAt: new Date().toISOString(),
    timeout,
    port: DEFAULT_SANDBOX_PORT,
  };

  cacheSandbox(sandbox);
  return sandbox;
}

export async function createSandbox(options?: {
  template?: string;
  timeoutSeconds?: number;
}): Promise<Sandbox> {
  return openSandbox(options);
}

export async function connectSandbox(sandboxId: string): Promise<Sandbox> {
  const id = String(sandboxId || "").trim();
  if (!id) throw new SandboxError("A sandbox id is required.", 400);

  const cached = cachedSandbox(id);
  if (cached) return cached;

  const hosts = [`${apiHost()}/sandboxes/${id}`, `${apiHost()}/v2/sandboxes/${id}`];

  for (const url of hosts) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "X-API-Key": apiKey() },
        cache: "no-store",
      });
      if (!response.ok) continue;
      const payload = (await response.json()) as Record<string, unknown>;
      const token = String(
        payload.envdAccessToken ?? payload.accessToken ?? "",
      ).trim();
      const sandbox: Sandbox = {
        sandboxId: id,
        sandboxID: id,
        templateId: String(payload.templateID ?? ""),
        templateID: String(payload.templateID ?? ""),
        domain: String(payload.domain ?? sandboxDomain()),
        envdAccessToken: token,
        accessToken: token,
        createdAt: String(payload.startedAt ?? new Date().toISOString()),
        timeout: Number(payload.endAt ? 0 : DEFAULT_TIMEOUT_SECONDS),
        port: DEFAULT_SANDBOX_PORT,
      };
      cacheSandbox(sandbox);
      return sandbox;
    } catch {
      continue;
    }
  }

  const fallback: Sandbox = {
    sandboxId: id,
    sandboxID: id,
    templateId: "",
    templateID: "",
    domain: sandboxDomain(),
    envdAccessToken: "",
    accessToken: "",
    createdAt: new Date().toISOString(),
    timeout: DEFAULT_TIMEOUT_SECONDS,
    port: DEFAULT_SANDBOX_PORT,
  };
  cacheSandbox(fallback);
  return fallback;
}

const sandboxCache = new Map<string, Sandbox>();
let lastSandbox: Sandbox | null = null;

function cacheSandbox(sandbox: Sandbox): Sandbox {
  sandboxCache.set(sandbox.sandboxId, sandbox);
  lastSandbox = sandbox;
  return sandbox;
}

function cachedSandbox(sandboxId: string): Sandbox | null {
  return sandboxCache.get(sandboxId) ?? null;
}

export async function getSandbox(target?: SandboxInput): Promise<Sandbox> {
  if (target && typeof target === "object") {
    return cacheSandbox(target);
  }
  if (typeof target === "string" && target.trim().length > 0) {
    return connectSandbox(target.trim());
  }
  if (lastSandbox) return lastSandbox;
  return openSandbox();
}

export const ensureSandbox = getSandbox;

export async function keepAlive(
  target?: SandboxInput,
  timeoutSeconds?: number,
): Promise<{ ok: boolean; timeout: number }> {
  const sandbox = await getSandbox(target);
  const timeout = clampTimeout(timeoutSeconds);

  try {
    const response = await fetch(`${apiHost()}/sandboxes/${sandbox.sandboxId}/timeout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey(),
      },
      body: JSON.stringify({ timeout }),
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, timeout: sandbox.timeout };
    const updated: Sandbox = { ...sandbox, timeout };
    cacheSandbox(updated);
    return { ok: true, timeout };
  } catch {
    return { ok: false, timeout: sandbox.timeout };
  }
}

export const extendSandboxTimeout = keepAlive;

export function previewUrl(target: SandboxRef, port: number = WORKSPACE_PORT): string {
  const sandboxId = typeof target === "string" ? target : target.sandboxId;
  const domain =
    typeof target === "string" ? sandboxDomain() : target.domain || sandboxDomain();
  return `https://${port}-${sandboxId}.${domain}`;
}

export async function getPreviewUrl(
  target?: SandboxInput,
  port: number = WORKSPACE_PORT,
): Promise<string> {
  const sandbox = await getSandbox(target);
  return previewUrl(sandbox, port);
}

/* ------------------------------------------------------------------ */
/* files                                                               */
/* ------------------------------------------------------------------ */

export async function readFileText(
  target: SandboxInput,
  path: string,
): Promise<string> {
  const sandbox = await getSandbox(target);
  const absolute = workspacePath(path);
  const query = new URLSearchParams({ path: absolute, username: username() });
  const response = await envdFetch(sandbox, `/files?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  return response.text();
}

export const readFile = readFileText;

export async function writeFileText(
  target: SandboxInput,
  path: string,
  content: string,
): Promise<void> {
  const sandbox = await getSandbox(target);
  const absolute = workspacePath(path);
  await makeDir(sandbox, parentDir(absolute));

  const query = new URLSearchParams({ path: absolute, username: username() });
  await envdFetch(sandbox, `/files?${query.toString()}`, {
    method: "POST",
    body: content,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export const writeFile = writeFileText;

export async function fileExists(
  target: SandboxInput,
  path: string,
): Promise<boolean> {
  const sandbox = await getSandbox(target);
  const absolute = workspacePath(path);
  const result = await execCommand(
    sandbox,
    `if [ -e ${shellQuote(absolute)} ]; then echo yes; else echo no; fi`,
    { timeoutMs: 15000 },
  );
  return result.stdout.trim() === "yes";
}

export async function makeDir(target: SandboxInput, path: string): Promise<void> {
  const sandbox = await getSandbox(target);
  const absolute = workspacePath(path);
  await execCommand(sandbox, `mkdir -p ${shellQuote(absolute)}`, {
    timeoutMs: 20000,
  });
}

export async function deletePath(target: SandboxInput, path: string): Promise<void> {
  const sandbox = await getSandbox(target);
  const absolute = workspacePath(path);
  await execCommand(sandbox, `rm -rf -- ${shellQuote(absolute)}`, {
    timeoutMs: 30000,
  });
}

export async function listDir(
  target: SandboxInput,
  path: string = ".",
): Promise<DirEntry[]> {
  const sandbox = await getSandbox(target);
  const absolute = workspacePath(path);
  const command = [
    `cd ${shellQuote(absolute)} 2>/dev/null || exit 3`,
    `find . -mindepth 1 -maxdepth 1 -printf '%y\\t%s\\t%f\\n' 2>/dev/null || ls -1Ap`,
  ].join(" && ");

  const result = await execCommand(sandbox, command, { timeoutMs: 30000 });
  if (result.exitCode !== 0) return [];

  const entries: DirEntry[] = [];
  for (const line of result.stdout.split("\n")) {
    const trimmed = line.replace(/\r$/, "");
    if (!trimmed.trim()) continue;

    const parts = trimmed.split("\t");
    if (parts.length >= 3) {
      const kind = parts[0];
      const size = Number(parts[1]);
      const name = parts.slice(2).join("\t");
      if (!name) continue;
      entries.push({
        name,
        path: absolute === "/" ? `/${name}` : `${absolute}/${name}`,
        type:
          kind === "d"
            ? "dir"
            : kind === "f"
              ? "file"
              : kind === "l"
                ? "symlink"
                : "unknown",
        size: Number.isFinite(size) ? size : 0,
      });
      continue;
    }

    const name = trimmed.replace(/\/$/, "");
    if (!name || name === "." || name === "..") continue;
    entries.push({
      name,
      path: absolute === "/" ? `/${name}` : `${absolute}/${name}`,
      type: trimmed.endsWith("/") ? "dir" : "unknown",
      size: 0,
    });
  }

  entries.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    if (a.type === "dir") return -1;
    if (b.type === "dir") return 1;
    return a.name.localeCompare(b.name);
  });

  return entries;
}

export const listFiles = listDir;

export async function statPath(
  target: SandboxInput,
  path: string,
): Promise<PathStat> {
  const sandbox = await getSandbox(target);
  const absolute = workspacePath(path);
  const quoted = shellQuote(absolute);
  const command = [
    `if [ -d ${quoted} ]; then t=dir; elif [ -f ${quoted} ]; then t=file; elif [ -L ${quoted} ]; then t=symlink; elif [ -e ${quoted} ]; then t=unknown; else t=missing; fi`,
    `s=$(wc -c < ${quoted} 2>/dev/null || echo 0)`,
    `printf '%s\\t%s' "$t" "$s"`,
  ].join("; ");

  const result = await execCommand(sandbox, command, { timeoutMs: 20000 });
  const [kindRaw, sizeRaw] = result.stdout.trim().split("\t");
  const kind = (kindRaw || "missing").trim();
  const size = Number(String(sizeRaw || "0").trim());

  if (kind === "missing") {
    return { path: absolute, exists: false, type: "unknown", size: 0 };
  }

  return {
    path: absolute,
    exists: true,
    type:
      kind === "dir"
        ? "dir"
        : kind === "file"
          ? "file"
          : kind === "symlink"
            ? "symlink"
            : "unknown",
    size: Number.isFinite(size) ? size : 0,
  };
}

/* ------------------------------------------------------------------ */
/* commands                                                            */
/* ------------------------------------------------------------------ */

export async function execCommand(
  target: SandboxInput,
  command: string,
  options: ExecOptions = {},
): Promise<ExecResult> {
  const sandbox = await getSandbox(target);
  const started = Date.now();
  const timeoutMs = options.timeoutMs ?? DEFAULT_EXEC_TIMEOUT_MS;

  const body = encodeConnectMessage({
    process: {
      cmd: "/bin/bash",
      args: ["-lc", command],
      envs: options.envs ?? {},
      cwd: workspacePath(options.cwd ?? "."),
    },
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await envdFetch(sandbox, "/process.Process/Start", {
      method: "POST",
      body,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/connect+json",
        "Connect-Protocol-Version": PROTOCOL_VERSION,
      },
    });
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof Error && error.name === "AbortError") {
      throw new SandboxError(`Command timed out after ${timeoutMs}ms.`, 504);
    }
    if (error instanceof SandboxError) throw error;
    throw new SandboxError(
      `Could not run command: ${errorMessage(error)}`,
      502,
    );
  }

  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    const buffer = new Uint8Array(await response.arrayBuffer());
    for (const frame of decodeConnectFrames(buffer)) {
      const payload = frame.payload as ProcessStreamPayload | string | null;
      if (!payload || typeof payload === "string") continue;

      if (payload.error?.message) {
        stderr += `${payload.error.message}\n`;
      }

      const event = payload.event;
      if (!event) continue;
      if (event.data) {
        if (typeof event.data.stdout === "string") stdout += event.data.stdout;
        if (typeof event.data.stderr === "string") stderr += event.data.stderr;
        if (typeof event.data.pty === "string") stdout += event.data.pty;
      }
      if (event.end) {
        if (typeof event.end.exitCode === "number") exitCode = event.end.exitCode;
        if (typeof event.end.error === "string" && event.end.error) {
          stderr += `${event.end.error}\n`;
        }
      }
    }
  } finally {
    clearTimeout(timer);
  }

  return {
    stdout,
    stderr,
    output: `${stdout}${stderr}`,
    exitCode,
    ok: exitCode === 0,
    durationMs: Date.now() - started,
  };
}

export const runCommand = execCommand;
export const exec = execCommand;