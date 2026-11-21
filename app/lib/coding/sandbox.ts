import { Sandbox } from "@e2b/code-interpreter";
import path from "node:path";
import type { FileNode } from "./types";

export const SANDBOX_ROOT = "/home/user";
export const SANDBOX_TIMEOUT_MS = 30 * 60 * 1000;

const IGNORED = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  ".cache",
  ".turbo",
  "coverage",
  ".venv",
  "__pycache__",
  ".pnpm-store",
];

const IGNORED_SET = new Set(IGNORED);

export function assertApiKey() {
  if (!process.env.E2B_API_KEY) {
    throw new Error(
      "Missing E2B_API_KEY. The coding workspace cannot start a sandbox without it."
    );
  }
}

export function resolvePath(input?: string | null): string {
  const raw = (input ?? ".").trim();
  if (!raw || raw === "." || raw === "./") return SANDBOX_ROOT;

  const absolute = path.posix.isAbsolute(raw)
    ? raw
    : path.posix.join(SANDBOX_ROOT, raw);
  const normalised = path.posix.normalize(absolute);

  if (normalised !== SANDBOX_ROOT && !normalised.startsWith(`${SANDBOX_ROOT}/`)) {
    throw new Error(`Path escapes the workspace: ${raw}`);
  }
  return normalised;
}

export function workspacePath(absolute: string): string {
  if (absolute === SANDBOX_ROOT) return ".";
  return absolute.slice(SANDBOX_ROOT.length + 1);
}

export async function openSandbox(sandboxId?: string | null): Promise<Sandbox> {
  assertApiKey();

  if (sandboxId) {
    try {
      const resumed = await Sandbox.connect(sandboxId.trim());
      await resumed.setTimeout(SANDBOX_TIMEOUT_MS);
      return resumed;
    } catch {
      // Sandbox expired or was killed: fall through and create a fresh one.
    }
  }

  return Sandbox.create({ timeoutMs: SANDBOX_TIMEOUT_MS });
}

export async function keepAlive(sandbox: Sandbox) {
  try {
    await sandbox.setTimeout(SANDBOX_TIMEOUT_MS);
  } catch {
    // A failed keep-alive must never break the request.
  }
}

export async function readFileText(
  sandbox: Sandbox,
  absolutePath: string
): Promise<string> {
  const raw = await sandbox.files.read(absolutePath);
  if (typeof raw === "string") return raw;
  return new TextDecoder().decode(raw as unknown as Uint8Array);
}

export async function writeFileText(
  sandbox: Sandbox,
  absolutePath: string,
  content: string
) {
  await sandbox.files.write(absolutePath, content);
}

export function buildTree(paths: string[]): FileNode[] {
  const root: FileNode[] = [];

  for (const raw of paths) {
    const segments = raw
      .replace(/^\.\//, "")
      .split("/")
      .filter((segment) => segment && !IGNORED_SET.has(segment));
    if (segments.length === 0) continue;

    let level = root;
    let walked = "";

    segments.forEach((segment, index) => {
      walked = walked ? `${walked}/${segment}` : segment;
      const isLeaf = index === segments.length - 1;
      let node = level.find((entry) => entry.name === segment);

      if (!node) {
        node = {
          name: segment,
          path: walked,
          type: isLeaf ? "file" : "dir",
          ...(isLeaf ? {} : { children: [] }),
        };
        level.push(node);
      }

      if (!isLeaf && node.children) level = node.children;
    });
  }

  const sortLevel = (nodes: FileNode[]): FileNode[] => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.children) node.children = sortLevel(node.children);
    });
    return nodes;
  };

  return sortLevel(root);
}

export async function readTree(sandbox: Sandbox, depth = 6): Promise<FileNode[]> {
  const prune = IGNORED.map((name) => `-name ${name}`).join(" -o ");
  const command = `cd ${SANDBOX_ROOT} && find . -maxdepth ${depth} -mindepth 1 \\( ${prune} \\) -prune -o -print | head -n 5000`;

  const result = await sandbox.commands.run(command);
  const lines = (result.stdout || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return buildTree(lines);
}

export function previewUrl(sandbox: Sandbox, port = 3000): string {
  try {
    return `https://${sandbox.getHost(port)}`;
  } catch {
    return "";
  }
}