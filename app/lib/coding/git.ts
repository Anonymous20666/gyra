/* app/lib/coding/git.ts
 * Git panel data for the workspace sandbox. Shell-only, dependency-free.
 */

import {
  SANDBOX_ROOT,
  execCommand,
  getSandbox,
  type SandboxInput,
} from "./sandbox";

export type GitFileStatus =
  | "added"
  | "modified"
  | "deleted"
  | "renamed"
  | "copied"
  | "untracked"
  | "conflicted"
  | "unknown";

export type GitFileChange = {
  path: string;
  previousPath: string | null;
  index: string;
  workingTree: string;
  staged: boolean;
  code: string;
  status: GitFileStatus;
};

export type GitCommit = {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  subject: string;
};

export type GitBranch = {
  name: string;
  current: boolean;
  upstream: string | null;
};

export type GitPanel = {
  isRepo: boolean;
  root: string;
  branch: string;
  upstream: string | null;
  ahead: number;
  behind: number;
  clean: boolean;
  files: GitFileChange[];
  branches: GitBranch[];
  commits: GitCommit[];
  remotes: string[];
  error: string | null;
};

type GitRun = {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
};

const DEFAULT_BRANCH = "main";

function shellQuote(value: string): string {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

async function git(
  target: SandboxInput,
  command: string,
  cwd: string = SANDBOX_ROOT,
  timeoutMs: number = 60000,
): Promise<GitRun> {
  const sandbox = await getSandbox(target);
  const result = await execCommand(sandbox, command, { cwd, timeoutMs });
  return {
    ok: result.exitCode === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
    exitCode: result.exitCode,
  };
}

function mapStatus(code: string, staged: boolean): GitFileStatus {
  const letter = staged ? code.charAt(0) : code.charAt(1);
  const effective = letter && letter !== " " ? letter : code.charAt(0);
  switch (effective) {
    case "A":
      return "added";
    case "M":
    case "T":
      return "modified";
    case "D":
      return "deleted";
    case "R":
      return "renamed";
    case "C":
      return "copied";
    case "U":
      return "conflicted";
    case "?":
      return "untracked";
    default:
      return "unknown";
  }
}

function parseStatus(output: string): GitFileChange[] {
  const changes: GitFileChange[] = [];
  for (const rawLine of output.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.length < 4) continue;

    const code = line.slice(0, 2);
    let rest = line.slice(3).trim();
    if (!rest) continue;

    let previousPath: string | null = null;
    const arrow = rest.indexOf(" -> ");
    if (arrow > -1) {
      previousPath = rest.slice(0, arrow).trim();
      rest = rest.slice(arrow + 4).trim();
    }
    rest = rest.replace(/^"|"$/g, "");

    const staged = code.charAt(0) !== " " && code.charAt(0) !== "?";
    changes.push({
      path: rest,
      previousPath,
      index: code.charAt(0),
      workingTree: code.charAt(1),
      staged,
      code,
      status: mapStatus(code, staged),
    });
  }
  return changes;
}

function parseCommits(output: string): GitCommit[] {
  return output
    .split("\n")
    .map((line) => line.replace(/\r$/, ""))
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const parts = line.split("\t");
      const hash = parts[0] ?? "";
      return {
        hash,
        shortHash: hash.slice(0, 7),
        author: parts[1] ?? "",
        email: parts[2] ?? "",
        date: parts[3] ?? "",
        subject: parts.slice(4).join(" "),
      };
    });
}

function parseBranches(output: string): GitBranch[] {
  return output
    .split("\n")
    .map((line) => line.replace(/\r$/, ""))
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const parts = line.split("\t");
      const name = (parts[0] ?? "").replace(/^\*/, "").trim();
      return {
        name,
        current: (parts[1] ?? "").trim() === "*" || line.startsWith("*"),
        upstream: (parts[2] ?? "").trim() || null,
      };
    })
    .filter((branch) => branch.name.length > 0);
}

function parseRemotes(output: string): string[] {
  const names = new Set<string>();
  for (const line of output.split("\n")) {
    const name = line.split("\t")[0]?.trim();
    if (name) names.add(name);
  }
  return Array.from(names).sort();
}

function emptyPanel(cwd: string, error: string | null): GitPanel {
  return {
    isRepo: false,
    root: cwd,
    branch: DEFAULT_BRANCH,
    upstream: null,
    ahead: 0,
    behind: 0,
    clean: true,
    files: [],
    branches: [],
    commits: [],
    remotes: [],
    error,
  };
}

export async function readGitPanel(
  target?: SandboxInput,
  options: { cwd?: string; commitLimit?: number } = {},
): Promise<GitPanel> {
  const cwd = options.cwd ? options.cwd : SANDBOX_ROOT;
  const commitLimit = Math.min(Math.max(options.commitLimit ?? 20, 1), 100);

  const check = await git(target, "git rev-parse --is-inside-work-tree", cwd);
  if (!check.ok || check.stdout.trim() !== "true") {
    return emptyPanel(cwd, check.stderr || "This workspace is not a git repository yet.");
  }

  const [statusRun, branchRun, commitRun, branchesRun, remotesRun, countRun] =
    await Promise.all([
      git(target, "git status --porcelain=v1 --branch", cwd),
      git(target, "git rev-parse --abbrev-ref HEAD", cwd),
      git(
        target,
        `git log -n ${commitLimit} --pretty=format:%H%x09%an%x09%ae%x09%aI%x09%s`,
        cwd,
      ),
      git(target, "git branch --format=%(refname:short)%09%(HEAD)%09%(upstream:short)", cwd),
      git(target, "git remote -v", cwd),
      git(target, "git rev-list --left-right --count HEAD...@{upstream}", cwd),
    ]);

  const statusLines: string[] = [];
  let upstream: string | null = null;
  let ahead = 0;
  let behind = 0;

  for (const rawLine of statusRun.stdout.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (!line) continue;
    if (line.startsWith("## ")) {
      const header = line.slice(3);
      const tracking = header.match(/\.\.\.(\S+)/);
      if (tracking && tracking[1]) upstream = tracking[1];
      const lead = header.match(/ahead (\d+)/);
      const trail = header.match(/behind (\d+)/);
      if (lead && lead[1]) ahead = Number(lead[1]);
      if (trail && trail[1]) behind = Number(trail[1]);
      continue;
    }
    statusLines.push(line);
  }

  if (countRun.ok) {
    const parts = countRun.stdout.split(/\s+/).filter(Boolean);
    if (parts.length === 2) {
      ahead = Number(parts[0]) || ahead;
      behind = Number(parts[1]) || behind;
    }
  }

  const files = parseStatus(statusLines.join("\n"));
  const branch = branchRun.ok ? branchRun.stdout.trim() : DEFAULT_BRANCH;

  return {
    isRepo: true,
    root: cwd,
    branch: branch || DEFAULT_BRANCH,
    upstream,
    ahead,
    behind,
    clean: files.length === 0,
    files,
    branches: parseBranches(branchesRun.stdout),
    commits: parseCommits(commitRun.stdout),
    remotes: parseRemotes(remotesRun.stdout),
    error: null,
  };
}

export const gitPanel = readGitPanel;
export const getGitPanel = readGitPanel;

export async function isGitRepo(target?: SandboxInput): Promise<boolean> {
  const run = await git(target, "git rev-parse --is-inside-work-tree");
  return run.ok && run.stdout.trim() === "true";
}

export async function gitStatus(
  target?: SandboxInput,
): Promise<{ branch: string; clean: boolean; files: GitFileChange[] }> {
  const panel = await readGitPanel(target);
  return { branch: panel.branch, clean: panel.clean, files: panel.files };
}

export async function gitLog(
  target?: SandboxInput,
  limit: number = 20,
): Promise<GitCommit[]> {
  const bounded = Math.min(Math.max(Math.round(limit) || 20, 1), 100);
  const run = await git(
    target,
    `git log -n ${bounded} --pretty=format:%H%x09%an%x09%ae%x09%aI%x09%s`,
  );
  return run.ok ? parseCommits(run.stdout) : [];
}

export async function gitBranches(target?: SandboxInput): Promise<GitBranch[]> {
  const run = await git(
    target,
    "git branch --format=%(refname:short)%09%(HEAD)%09%(upstream:short)",
  );
  return run.ok ? parseBranches(run.stdout) : [];
}

export async function gitDiff(
  target?: SandboxInput,
  path?: string,
): Promise<string> {
  const args = path ? `-- ${shellQuote(path)}` : "";
  const run = await git(target, `git diff ${args}`.trim());
  return run.ok ? run.stdout : run.stderr;
}

export async function gitStage(
  target: SandboxInput,
  paths: string[],
): Promise<{ ok: boolean; error: string | null }> {
  if (!paths.length) return { ok: false, error: "No paths to stage." };
  const list = paths.map(shellQuote).join(" ");
  const run = await git(target, `git add -- ${list}`);
  return { ok: run.ok, error: run.ok ? null : run.stderr || "git add failed" };
}

export async function gitUnstage(
  target: SandboxInput,
  paths: string[],
): Promise<{ ok: boolean; error: string | null }> {
  if (!paths.length) return { ok: false, error: "No paths to unstage." };
  const list = paths.map(shellQuote).join(" ");
  const run = await git(target, `git restore --staged -- ${list}`);
  return { ok: run.ok, error: run.ok ? null : run.stderr || "git restore failed" };
}

export async function gitDiscard(
  target: SandboxInput,
  paths: string[],
): Promise<{ ok: boolean; error: string | null }> {
  if (!paths.length) return { ok: false, error: "No paths to discard." };
  const list = paths.map(shellQuote).join(" ");
  const run = await git(target, `git checkout -- ${list}`);
  return { ok: run.ok, error: run.ok ? null : run.stderr || "git checkout failed" };
}

export async function gitCommit(
  target: SandboxInput,
  message: string,
): Promise<{ ok: boolean; error: string | null }> {
  const clean = message.trim();
  if (!clean) return { ok: false, error: "A commit message is required." };
  const run = await git(target, `git commit -m ${shellQuote(clean)}`);
  return { ok: run.ok, error: run.ok ? null : run.stderr || "git commit failed" };
}

export async function gitCheckout(
  target: SandboxInput,
  branch: string,
): Promise<{ ok: boolean; error: string | null }> {
  const name = branch.trim();
  if (!name) return { ok: false, error: "A branch name is required." };
  const run = await git(target, `git checkout ${shellQuote(name)}`);
  return { ok: run.ok, error: run.ok ? null : run.stderr || "git checkout failed" };
}

export async function gitCreateBranch(
  target: SandboxInput,
  branch: string,
): Promise<{ ok: boolean; error: string | null }> {
  const name = branch.trim();
  if (!name) return { ok: false, error: "A branch name is required." };
  const run = await git(target, `git checkout -b ${shellQuote(name)}`);
  return { ok: run.ok, error: run.ok ? null : run.stderr || "Could not create branch" };
}