// app/lib/coding/git.ts
// Git Management Center backend. Read operations are cheap and safe; write
// operations are exposed individually so the route can gate them behind approval.

import type { Sandbox } from "@e2b/code-interpreter";
import { exec, shellQuote } from "./sandbox";
import type {
  GitBranch,
  GitCommit,
  GitFileStatus,
  GitPanelState,
  GitStatusEntry,
  GitSummary,
} from "./types";

function mapStatus(code: string): GitFileStatus {
  const value = code.trim();
  if (value === "??") return "untracked";
  if (value.includes("U") || value === "AA" || value === "DD") return "conflict";
  if (value.includes("R")) return "renamed";
  if (value.includes("A")) return "added";
  if (value.includes("D")) return "deleted";
  if (value.includes("M")) return "modified";
  return "modified";
}

export async function isGitRepo(sandbox: Sandbox): Promise<boolean> {
  const result = await exec(sandbox, "git rev-parse --is-inside-work-tree 2>/dev/null", {
    timeoutMs: 15_000,
  });
  return result.stdout.trim() === "true";
}

export async function readGitSummary(sandbox: Sandbox): Promise<GitSummary> {
  if (!(await isGitRepo(sandbox))) return { isRepo: false };

  const [header, status, remotes] = await Promise.all([
    exec(sandbox, "git status -sb 2>/dev/null | head -n 1", { timeoutMs: 20_000 }),
    exec(sandbox, "git status --porcelain=v1 2>/dev/null | wc -l", { timeoutMs: 20_000 }),
    exec(sandbox, "git remote 2>/dev/null", { timeoutMs: 15_000 }),
  ]);

  const line = header.stdout.trim();
  const nameMatch = line.match(/^##\s+([^.\s]+)/);
  const aheadMatch = line.match(/ahead (\d+)/);
  const behindMatch = line.match(/behind (\d+)/);
  const changed = Number(status.stdout.trim()) || 0;

  return {
    isRepo: true,
    branch: nameMatch?.[1] ?? "unknown",
    clean: changed === 0,
    changed,
    ahead: aheadMatch ? Number(aheadMatch[1]) : 0,
    behind: behindMatch ? Number(behindMatch[1]) : 0,
    remotes: remotes.stdout.trim().split("\n").filter(Boolean),
  };
}

export async function readStatusEntries(sandbox: Sandbox): Promise<GitStatusEntry[]> {
  const result = await exec(sandbox, "git status --porcelain=v1 2>/dev/null | head -n 500", {
    timeoutMs: 30_000,
  });

  const entries: GitStatusEntry[] = [];
  for (const raw of result.stdout.split("\n")) {
    if (raw.length < 4) continue;
    const indexCode = raw[0];
    const workTreeCode = raw[1];
    const path = raw.slice(3).trim().replace(/^"|"$/g, "");
    if (!path) continue;

    entries.push({
      path,
      status: mapStatus(indexCode !== " " && indexCode !== "?" ? indexCode : workTreeCode),
      staged: indexCode !== " " && indexCode !== "?",
    });
  }
  return entries;
}

export async function readBranches(sandbox: Sandbox): Promise<GitBranch[]> {
  const result = await exec(sandbox, "git branch -vv --no-color 2>/dev/null", {
    timeoutMs: 20_000,
  });

  const branches: GitBranch[] = [];
  for (const raw of result.stdout.split("\n")) {
    if (!raw.trim()) continue;
    const current = raw.startsWith("*");
    const cleaned = raw.replace(/^\*?\s*/, "");
    const name = cleaned.split(/\s+/)[0];
    if (!name) continue;
    const aheadMatch = cleaned.match(/ahead (\d+)/);
    const behindMatch = cleaned.match(/behind (\d+)/);
    const remoteMatch = cleaned.match(/\[([^\]/]+)\//);
    branches.push({
      name,
      current,
      remote: remoteMatch?.[1],
      ahead: aheadMatch ? Number(aheadMatch[1]) : 0,
      behind: behindMatch ? Number(behindMatch[1]) : 0,
    });
  }
  return branches;
}

export async function readCommits(sandbox: Sandbox, limit = 30): Promise<GitCommit[]> {
  const format = "%H%x1f%h%x1f%an%x1f%ae%x1f%aI%x1f%s%x1f%b%x1e";
  const result = await exec(
    sandbox,
    `git log -n ${limit} --pretty=format:'${format}' 2>/dev/null`,
    { timeoutMs: 30_000 },
  );

  const commits: GitCommit[] = [];
  for (const chunk of result.stdout.split("\x1e")) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    const [hash, shortHash, author, email, date, subject, body] = trimmed.split("\x1f");
    if (!hash) continue;
    commits.push({
      hash: hash.trim(),
      shortHash: (shortHash ?? hash).trim(),
      author: (author ?? "unknown").trim(),
      email: email?.trim(),
      date: (date ?? "").trim(),
      subject: (subject ?? "").trim(),
      body: body?.trim() || undefined,
    });
  }
  return commits;
}

export async function readGitPanel(sandbox: Sandbox): Promise<GitPanelState> {
  const summary = await readGitSummary(sandbox);
  if (!summary.isRepo) {
    return { summary, entries: [], branches: [], commits: [] };
  }
  const [entries, branches, commits] = await Promise.all([
    readStatusEntries(sandbox),
    readBranches(sandbox),
    readCommits(sandbox),
  ]);
  return { summary, entries, branches, commits };
}

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

export async function stagePaths(sandbox: Sandbox, paths: string[]): Promise<string> {
  if (paths.length === 0) return "Nothing to stage.";
  const args = paths.map((path) => shellQuote(path)).join(" ");
  const result = await exec(sandbox, `git add -- ${args}`, { timeoutMs: 60_000 });
  return result.exitCode === 0 ? `Staged ${paths.length} file(s).` : result.stderr || "Staging failed.";
}

export async function unstagePaths(sandbox: Sandbox, paths: string[]): Promise<string> {
  if (paths.length === 0) return "Nothing to unstage.";
  const args = paths.map((path) => shellQuote(path)).join(" ");
  const result = await exec(sandbox, `git restore --staged -- ${args}`, { timeoutMs: 60_000 });
  return result.exitCode === 0
    ? `Unstaged ${paths.length} file(s).`
    : result.stderr || "Unstage failed.";
}

export async function discardPaths(sandbox: Sandbox, paths: string[]): Promise<string> {
  if (paths.length === 0) return "Nothing to discard.";
  const args = paths.map((path) => shellQuote(path)).join(" ");
  const result = await exec(
    sandbox,
    `git checkout -- ${args} 2>&1 || git restore -- ${args} 2>&1`,
    { timeoutMs: 60_000 },
  );
  return result.exitCode === 0 ? `Discarded changes in ${paths.length} file(s).` : result.stderr;
}

export async function commit(
  sandbox: Sandbox,
  message: string,
  options: { stageAll?: boolean; author?: { name: string; email: string } } = {},
): Promise<{ ok: boolean; output: string; hash?: string }> {
  if (options.stageAll) {
    await exec(sandbox, "git add -A", { timeoutMs: 60_000 });
  }

  const authorFlag = options.author
    ? `-c user.name=${shellQuote(options.author.name)} -c user.email=${shellQuote(options.author.email)} `
    : "";

  const result = await exec(
    sandbox,
    `git ${authorFlag}commit -m ${shellQuote(message)} 2>&1 | head -n 40`,
    { timeoutMs: 90_000 },
  );

  const hashResult = await exec(sandbox, "git rev-parse --short HEAD 2>/dev/null", {
    timeoutMs: 15_000,
  });

  return {
    ok: result.exitCode === 0,
    output: result.stdout.trim() || result.stderr.trim(),
    hash: hashResult.stdout.trim() || undefined,
  };
}

export async function createBranch(sandbox: Sandbox, name: string): Promise<string> {
  const result = await exec(sandbox, `git checkout -b ${shellQuote(name)} 2>&1`, {
    timeoutMs: 30_000,
  });
  return result.exitCode === 0 ? `Switched to new branch ${name}.` : result.stderr || result.stdout;
}

export async function checkoutBranch(sandbox: Sandbox, name: string): Promise<string> {
  const result = await exec(sandbox, `git checkout ${shellQuote(name)} 2>&1`, {
    timeoutMs: 30_000,
  });
  return result.exitCode === 0 ? `Checked out ${name}.` : result.stderr || result.stdout;
}

export async function deleteBranch(sandbox: Sandbox, name: string): Promise<string> {
  const result = await exec(sandbox, `git branch -D ${shellQuote(name)} 2>&1`, {
    timeoutMs: 30_000,
  });
  return result.exitCode === 0 ? `Deleted branch ${name}.` : result.stderr || result.stdout;
}

export async function diffForPath(
  sandbox: Sandbox,
  path: string,
  staged = false,
): Promise<string> {
  const result = await exec(
    sandbox,
    `git diff ${staged ? "--cached " : ""}-- ${shellQuote(path)} 2>/dev/null | head -n 400`,
    { timeoutMs: 30_000 },
  );
  return result.stdout;
}

export async function commitDetails(sandbox: Sandbox, hash: string): Promise<string> {
  const safeHash = hash.replace(/[^0-9a-fA-F]/g, "");
  if (!safeHash) return "";
  const result = await exec(
    sandbox,
    `git show --stat --patch ${safeHash} 2>/dev/null | head -n 300`,
    { timeoutMs: 45_000 },
  );
  return result.stdout;
}

/** Files changed in the working tree — used to keep the explorer badges honest. */
export async function statusMap(sandbox: Sandbox): Promise<Record<string, GitFileStatus>> {
  const entries = await readStatusEntries(sandbox);
  const map: Record<string, GitFileStatus> = {};
  for (const entry of entries) map[entry.path] = entry.status;
  return map;
}