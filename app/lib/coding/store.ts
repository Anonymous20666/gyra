"use client";
// app/lib/coding/store.ts
// Single source of truth for the coding workspace.
// Dependency-free: no zustand, no external store. Only React + fetch.

import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type PanelId =
  | "project"
  | "search"
  | "changes"
  | "problems"
  | "tests"
  | "terminal"
  | "preview"
  | "git"
  | "plan"
  | "tools"
  | "debug"
  | "review";

export const PANEL_ORDER: PanelId[] = [
  "project",
  "search",
  "changes",
  "problems",
  "tests",
  "terminal",
  "preview",
  "git",
  "plan",
  "tools",
  "debug",
  "review",
];

export const PANEL_LABELS: Record<PanelId, string> = {
  project: "Project",
  search: "Search",
  changes: "Changes",
  problems: "Problems",
  tests: "Tests",
  terminal: "Terminal",
  preview: "Preview",
  git: "Git",
  plan: "Plan",
  tools: "Tools",
  debug: "Debug",
  review: "Review",
};

export type AgentMode = "forge" | "reflect" | "plan" | "review" | "ask";

export const AGENT_MODES: { id: AgentMode; label: string; hint: string }[] = [
  { id: "forge", label: "Forge", hint: "Build and change code end to end" },
  { id: "reflect", label: "Reflect", hint: "Behaviour-preserving cleanup" },
  { id: "plan", label: "Plan", hint: "Design the approach before touching files" },
  { id: "review", label: "Review", hint: "Critique and harden what exists" },
  { id: "ask", label: "Ask", hint: "Answer questions about the project" },
];

export type WorkspaceStatus = "idle" | "booting" | "ready" | "busy" | "error";

export type Severity = "error" | "warning" | "info";

export type ActivityKind =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "tool"
  | "text"
  | "result";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  at: number;
}

export interface Toast {
  id: string;
  kind: ActivityKind;
  message: string;
}

export interface Problem {
  id: string;
  name?: string;
  severity: Severity;
  file: string;
  line: number;
  column?: number;
  message: string;
  source?: string;
  code?: string;
}

export interface Cursor {
  line: number;
  column: number;
}

/** An open editor buffer. `name` is the basename, `loading`/`error` drive the surface. */
export interface OpenFile {
  path: string;
  name: string;
  content: string;
  dirty: boolean;
  language: string;
  loading: boolean;
  error: string | null;
  savedAt?: number;
}

export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: TreeNode[];
}

/** Project intelligence snapshot. Field names are what the panels render. */
export interface ProjectSnapshot {
  root: string;
  name: string;
  framework: string;
  packageManager: string;
  language: string;
  files: number;
  directories: number;
  dependencies: { name: string; version: string }[];
  devDependencies: { name: string; version: string }[];
  scripts: Record<string, string>;
  languages: { language: string; percent: number }[];
  hasGit: boolean;
  gitBranch: string;
  apiRoutes: string[];
  testFiles: number;
  entries: string[];
  scannedAt: number;
}

export interface ChangeFileSummary {
  path: string;
  additions: number;
  deletions: number;
  status: "added" | "modified" | "deleted" | "renamed";
}

export interface ChangeSetSummary {
  id: string;
  title: string;
  summary?: string;
  createdAt: number;
  applied: boolean;
  files: ChangeFileSummary[];
  additions: number;
  deletions: number;
}

export interface TestFailure {
  name: string;
  file?: string;
  message: string;
}

export interface TestRunSummary {
  ok: boolean;
  framework: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  duration: number;
  failures: TestFailure[];
  output: string;
  ranAt: number;
}

export interface PlanStep {
  id: string;
  title: string;
  detail?: string;
  status: "pending" | "active" | "done" | "skipped";
}

export interface PlanSummary {
  id: string;
  title: string;
  rationale?: string;
  createdAt: number;
  steps: PlanStep[];
}

export interface GitChangedFile {
  path: string;
  status: string;
  staged: boolean;
}

export interface GitSummary {
  branch: string;
  ahead: number;
  behind: number;
  clean: boolean;
  staged: number;
  unstaged: number;
  untracked: number;
  changed: GitChangedFile[];
  recentCommits: { hash: string; message: string; at?: string }[];
}

export type MessageRole = "user" | "agent" | "tool" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  reasoning?: string;
  tool?: string;
  error?: boolean;
  at: number;
}

export interface TerminalTabSummary {
  id: string;
  title: string;
}

export interface WorkspaceState {
  /* session */
  sandboxId: string | null;
  booting: boolean;
  bootError: string | null;
  status: WorkspaceStatus;
  running: boolean;

  /* activity feed + toasts */
  activity: ActivityEvent[];
  pushActivity: (kind: ActivityKind, title: string, detail?: string) => void;
  clearActivity: () => void;
  events: ActivityEvent[];
  pushEvent: (kind: ActivityKind, text: string) => void;
  clearEvents: () => void;
  toasts: Toast[];
  pushToast: (kind: ActivityKind, message: string) => void;
  dismissToast: (id: string) => void;

  /* agent */
  mode: AgentMode;
  setMode: (mode: AgentMode) => void;
  messages: Message[];
  streaming: boolean;
  pushMessage: (message: Omit<Message, "id" | "at"> & { id?: string; at?: number }) => string;
  appendText: (id: string, chunk: string) => void;
  appendReasoning: (id: string, chunk: string) => void;
  patchMessage: (id: string, patch: Partial<Message>) => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean) => void;
  setRunning: (running: boolean) => void;
  setStatus: (status: WorkspaceStatus) => void;

  /* project */
  project: ProjectSnapshot | null;
  projectLoading: boolean;
  projectError: string | null;
  tree: TreeNode | null;
  treeLoading: boolean;
  treeError: string | null;

  /* files */
  openFiles: OpenFile[];
  activePath: string | null;
  cursor: Cursor;
  saving: boolean;
  saveError: string | null;

  /* panels */
  activePanel: PanelId | null;
  panelOpen: boolean;

  /* intelligence */
  problems: Problem[];
  problemsLoading: boolean;
  changes: ChangeSetSummary[];
  changesLoading: boolean;
  testRun: TestRunSummary | null;
  testsRunning: boolean;
  plan: PlanSummary | null;
  planLoading: boolean;
  git: GitSummary | null;
  gitLoading: boolean;
  terminals: TerminalTabSummary[];
  activeTerminalId: string | null;

  /* actions */
  bootstrap: () => Promise<void>;
  loadProject: () => Promise<void>;
  loadTree: (path?: string) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  setActivePath: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path?: string) => Promise<void>;
  setCursor: (cursor: Cursor | number, column?: number) => void;
  togglePanel: (panel: PanelId) => void;
  setPanel: (panel: PanelId | null) => void;
  refreshProblems: () => Promise<void>;
  loadChanges: () => Promise<void>;
  applyChange: (id: string) => Promise<void>;
  revertChange: (id: string) => Promise<void>;
  runTests: () => Promise<void>;
  loadPlan: () => Promise<void>;
  loadGit: () => Promise<void>;
  addTerminal: () => void;
  closeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  reset: () => void;
}

/* ------------------------------------------------------------------ */
/* Tolerant JSON helpers                                               */
/* ------------------------------------------------------------------ */

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function asStringArray(value: unknown): string[] {
  return asArray(value)
    .map((entry) => {
      if (typeof entry === "string") return entry;
      const record = asRecord(entry);
      return asString(pick(record, ["path", "name", "route", "label"]));
    })
    .filter((entry) => entry.length > 0);
}

function pick(source: Json, keys: string[]): unknown {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return undefined;
}

async function callJson(
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; data: Json; error: string | null }> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    const raw = await response.text();
    let parsed: unknown = {};
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = { message: raw.slice(0, 500) };
      }
    }
    const data = asRecord(parsed);
    if (!response.ok) {
      const message =
        asString(pick(data, ["error", "message", "detail"])) ||
        `Request failed with ${response.status}`;
      return { ok: false, data, error: message };
    }
    return { ok: true, data, error: null };
  } catch (error) {
    return {
      ok: false,
      data: {},
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function baseName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

/* ------------------------------------------------------------------ */
/* Language detection                                                  */
/* ------------------------------------------------------------------ */

const EXTENSIONS: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  jsonc: "json",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",
  html: "html",
  htm: "html",
  md: "markdown",
  mdx: "markdown",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  sql: "sql",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  c: "c",
  h: "c",
  cpp: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  env: "shell",
  prisma: "prisma",
  graphql: "graphql",
  gql: "graphql",
  txt: "plaintext",
  lock: "plaintext",
};

export function languageFromPath(path: string): string {
  const clean = path.split("?")[0];
  const name = clean.split("/").pop() ?? clean;
  const lower = name.toLowerCase();
  if (lower === "dockerfile") return "dockerfile";
  if (lower === "makefile") return "makefile";
  if (lower === ".env" || lower.startsWith(".env.")) return "shell";
  const ext = lower.includes(".") ? lower.split(".").pop() ?? "" : "";
  return EXTENSIONS[ext] ?? "plaintext";
}

/* ------------------------------------------------------------------ */
/* Response mapping                                                    */
/* ------------------------------------------------------------------ */

function toProjectSnapshot(input: unknown): ProjectSnapshot | null {
  const source = asRecord(input);
  const body = asRecord(pick(source, ["project", "snapshot", "data"]) ?? source);
  if (Object.keys(body).length === 0) return null;

  const dependencies = asArray(pick(body, ["dependencies", "deps"])).map((entry) => {
    const record = asRecord(entry);
    return {
      name: asString(pick(record, ["name", "package", "key"])),
      version: asString(pick(record, ["version", "range", "value"])),
    };
  });

  const devDependencies = asArray(pick(body, ["devDependencies", "devDeps"])).map((entry) => {
    const record = asRecord(entry);
    return {
      name: asString(pick(record, ["name", "package", "key"])),
      version: asString(pick(record, ["version", "range", "value"])),
    };
  });

  const languages = asArray(pick(body, ["languages", "languageStats"])).map((entry) => {
    const record = asRecord(entry);
    return {
      language: asString(pick(record, ["language", "name", "ext"])),
      percent: asNumber(pick(record, ["percent", "percentage", "value"])),
    };
  });

  const scripts: Record<string, string> = {};
  const rawScripts = asRecord(pick(body, ["scripts"]) ?? {});
  for (const key of Object.keys(rawScripts)) scripts[key] = asString(rawScripts[key]);

  return {
    root: asString(pick(body, ["root", "path"]), "/home/user"),
    name: asString(pick(body, ["name", "projectName", "repo"])),
    framework: asString(pick(body, ["framework", "name"]), "unknown"),
    packageManager: asString(pick(body, ["packageManager", "package_manager"]), "npm"),
    language: asString(pick(body, ["language", "primaryLanguage"]), "typescript"),
    files: asNumber(pick(body, ["files", "fileCount", "totalFiles"])),
    directories: asNumber(pick(body, ["directories", "dirCount", "totalDirectories"])),
    dependencies,
    devDependencies,
    scripts,
    languages,
    hasGit: asBool(pick(body, ["hasGit", "git"]), false),
    gitBranch: asString(pick(body, ["gitBranch", "branch", "currentBranch"])),
    apiRoutes: asStringArray(pick(body, ["apiRoutes", "routes", "endpoints"])),
    testFiles: asNumber(pick(body, ["testFiles", "testFileCount", "tests"])),
    entries: asStringArray(
      pick(body, ["entries", "topLevel", "topLevelEntries", "children", "rootEntries"])
    ),
    scannedAt: asNumber(pick(body, ["scannedAt", "at"]), Date.now()),
  };
}

function toNode(input: unknown, parentPath = ""): TreeNode | null {
  const record = asRecord(input);
  if (Object.keys(record).length === 0) return null;
  const name = asString(pick(record, ["name", "label", "basename"]));
  const path = asString(
    pick(record, ["path", "fullPath"]),
    parentPath ? `${parentPath}/${name}` : name
  );
  const rawType = asString(pick(record, ["type", "kind"]), "file");
  const isDirectory = rawType === "directory" || rawType === "dir" || rawType === "folder";
  const children = asArray(pick(record, ["children", "entries", "items"]))
    .map((child) => toNode(child, path))
    .filter((child): child is TreeNode => child !== null)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return {
    name: name || path.split("/").pop() || path,
    path,
    type: isDirectory ? "directory" : "file",
    size: asNumber(pick(record, ["size"]), 0) || undefined,
    children: isDirectory ? children : undefined,
  };
}

function toProblems(input: unknown): Problem[] {
  const source = asRecord(input);
  return asArray(pick(source, ["problems", "diagnostics", "issues", "data"])).map(
    (entry, index) => {
      const record = asRecord(entry);
      const raw = asString(pick(record, ["severity", "level"]), "error").toLowerCase();
      const severity: Severity =
        raw === "warning" || raw === "warn"
          ? "warning"
          : raw === "info" || raw === "hint"
            ? "info"
            : "error";
      return {
        id: asString(pick(record, ["id"]), `problem_${index}`),
        name: asString(pick(record, ["name", "title", "rule"])) || undefined,
        severity,
        file: asString(pick(record, ["file", "path", "filename"]), "unknown"),
        line: asNumber(pick(record, ["line", "startLine", "row"]), 1),
        column: asNumber(pick(record, ["column", "col", "startColumn"]), 1) || undefined,
        message: asString(pick(record, ["message", "text", "description"]), "Unknown problem"),
        source: asString(pick(record, ["source", "tool"])) || undefined,
        code: asString(pick(record, ["code", "ruleId"])) || undefined,
      };
    }
  );
}

function toChangeSets(input: unknown): ChangeSetSummary[] {
  const source = asRecord(input);
  return asArray(pick(source, ["changes", "changeSets", "sets", "data"])).map((entry, index) => {
    const record = asRecord(entry);
    const files = asArray(pick(record, ["files", "changes"])).map((file) => {
      const row = asRecord(file);
      const status = asString(pick(row, ["status", "kind"]), "modified");
      return {
        path: asString(pick(row, ["path", "file", "filename"])),
        additions: asNumber(pick(row, ["additions", "added"])),
        deletions: asNumber(pick(row, ["deletions", "removed"])),
        status:
          status === "added" || status === "deleted" || status === "renamed"
            ? (status as ChangeFileSummary["status"])
            : ("modified" as const),
      };
    });
    return {
      id: asString(pick(record, ["id", "setId"]), `set_${index}`),
      title: asString(pick(record, ["title", "label"]), "Change set"),
      summary: asString(pick(record, ["summary", "description"])) || undefined,
      createdAt: asNumber(pick(record, ["createdAt", "at"]), Date.now()),
      applied: asBool(pick(record, ["applied", "isApplied"]), false),
      files,
      additions:
        asNumber(pick(record, ["additions"])) ||
        files.reduce((total, file) => total + file.additions, 0),
      deletions:
        asNumber(pick(record, ["deletions"])) ||
        files.reduce((total, file) => total + file.deletions, 0),
    };
  });
}

function toTestRun(input: unknown): TestRunSummary | null {
  const source = asRecord(input);
  const body = asRecord(pick(source, ["run", "result", "data"]) ?? source);
  if (Object.keys(body).length === 0) return null;
  const failures = asArray(pick(body, ["failures", "failedTests"])).map((entry) => {
    const record = asRecord(entry);
    return {
      name: asString(pick(record, ["name", "title", "test"]), "unnamed test"),
      file: asString(pick(record, ["file", "path"])) || undefined,
      message: asString(pick(record, ["message", "error"]), "Failed"),
    };
  });
  const total = asNumber(pick(body, ["total", "count"]));
  const failed = asNumber(pick(body, ["failed", "failuresCount"]), failures.length);
  const durationMs = asNumber(pick(body, ["durationMs", "duration", "time"]), 0);
  return {
    ok: asBool(pick(body, ["ok", "passed", "success"]), failed === 0),
    framework: asString(pick(body, ["framework", "runner"]), "unknown"),
    total,
    passed: asNumber(pick(body, ["passed"]), Math.max(0, total - failed)),
    failed,
    durationMs,
    duration: durationMs,
    failures,
    output: asString(pick(body, ["output", "log", "stdout"]), ""),
    ranAt: asNumber(pick(body, ["ranAt", "at"]), Date.now()),
  };
}

function toPlan(input: unknown): PlanSummary | null {
  const source = asRecord(input);
  const body = asRecord(pick(source, ["plan", "data"]) ?? source);
  if (Object.keys(body).length === 0) return null;
  const steps = asArray(pick(body, ["steps", "tasks"])).map((entry, index) => {
    const record = asRecord(entry);
    const status = asString(pick(record, ["status", "state"]), "pending");
    return {
      id: asString(pick(record, ["id"]), `step_${index}`),
      title: asString(pick(record, ["title", "name", "text"]), `Step ${index + 1}`),
      detail: asString(pick(record, ["detail", "description", "body"])) || undefined,
      status:
        status === "active" || status === "done" || status === "skipped"
          ? (status as PlanStep["status"])
          : ("pending" as const),
    };
  });
  return {
    id: asString(pick(body, ["id"]), newId()),
    title: asString(pick(body, ["title", "name"]), "Plan"),
    rationale: asString(pick(body, ["rationale", "summary", "why"])) || undefined,
    createdAt: asNumber(pick(body, ["createdAt", "at"]), Date.now()),
    steps,
  };
}

function toGit(input: unknown): GitSummary | null {
  const source = asRecord(input);
  const body = asRecord(pick(source, ["git", "status", "data"]) ?? source);
  if (Object.keys(body).length === 0) return null;
  const changed = asArray(pick(body, ["changed", "files", "entries"])).map((entry) => {
    const record = asRecord(entry);
    return {
      path: asString(pick(record, ["path", "file"])),
      status: asString(pick(record, ["status", "state"]), "modified"),
      staged: asBool(pick(record, ["staged", "isStaged"]), false),
    };
  });
  const recentCommits = asArray(pick(body, ["recentCommits", "commits", "log"])).map((entry) => {
    const record = asRecord(entry);
    return {
      hash: asString(pick(record, ["hash", "sha", "id"])),
      message: asString(pick(record, ["message", "subject"])),
      at: asString(pick(record, ["at", "date"])) || undefined,
    };
  });
  return {
    branch: asString(pick(body, ["branch", "current"]), "main"),
    ahead: asNumber(pick(body, ["ahead"])),
    behind: asNumber(pick(body, ["behind"])),
    clean: asBool(pick(body, ["clean"]), changed.length === 0),
    staged: asNumber(pick(body, ["staged"]), changed.filter((file) => file.staged).length),
    unstaged: asNumber(pick(body, ["unstaged"]), changed.filter((file) => !file.staged).length),
    untracked: asNumber(pick(body, ["untracked"])),
    changed,
    recentCommits,
  };
}

/* ------------------------------------------------------------------ */
/* Store core                                                          */
/* ------------------------------------------------------------------ */

function blankState(): WorkspaceState {
  return {
    sandboxId: null,
    booting: false,
    bootError: null,
    status: "idle",
    running: false,

    activity: [],
    pushActivity: () => undefined,
    clearActivity: () => undefined,
    events: [],
    pushEvent: () => undefined,
    clearEvents: () => undefined,
    toasts: [],
    pushToast: () => undefined,
    dismissToast: () => undefined,

    mode: "forge",
    setMode: () => undefined,
    messages: [],
    streaming: false,
    pushMessage: () => "",
    appendText: () => undefined,
    appendReasoning: () => undefined,
    patchMessage: () => undefined,
    clearMessages: () => undefined,
    setStreaming: () => undefined,
    setRunning: () => undefined,
    setStatus: () => undefined,

    project: null,
    projectLoading: false,
    projectError: null,
    tree: null,
    treeLoading: false,
    treeError: null,

    openFiles: [],
    activePath: null,
    cursor: { line: 1, column: 1 },
    saving: false,
    saveError: null,

    activePanel: null,
    panelOpen: false,

    problems: [],
    problemsLoading: false,
    changes: [],
    changesLoading: false,
    testRun: null,
    testsRunning: false,
    plan: null,
    planLoading: false,
    git: null,
    gitLoading: false,
    terminals: [{ id: "main", title: "bash" }],
    activeTerminalId: "main",

    bootstrap: async () => undefined,
    loadProject: async () => undefined,
    loadTree: async () => undefined,
    openFile: async () => undefined,
    closeFile: () => undefined,
    setActivePath: () => undefined,
    updateFileContent: () => undefined,
    saveFile: async () => undefined,
    setCursor: () => undefined,
    togglePanel: () => undefined,
    setPanel: () => undefined,
    refreshProblems: async () => undefined,
    loadChanges: async () => undefined,
    applyChange: async () => undefined,
    revertChange: async () => undefined,
    runTests: async () => undefined,
    loadPlan: async () => undefined,
    loadGit: async () => undefined,
    addTerminal: () => undefined,
    closeTerminal: () => undefined,
    setActiveTerminal: () => undefined,
    reset: () => undefined,
  };
}

let state: WorkspaceState = blankState();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function setState(
  patch: Partial<WorkspaceState> | ((current: WorkspaceState) => Partial<WorkspaceState>)
): void {
  const next = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...next };
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): WorkspaceState {
  return state;
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

const actions = {
  pushActivity: (kind: ActivityKind, title: string, detail?: string) =>
    setState((current) => ({
      activity: [...current.activity, { id: newId(), kind, title, detail, at: Date.now() }].slice(
        -200
      ),
    })),

  clearActivity: () => setState({ activity: [] }),

  pushEvent: (kind: ActivityKind, text: string) =>
    setState((current) => ({
      events: [...current.events, { id: newId(), kind, title: text, at: Date.now() }].slice(-250),
    })),

  clearEvents: () => setState({ events: [] }),

  pushToast: (kind: ActivityKind, message: string) => {
    const toast: Toast = { id: newId(), kind, message };
    setState((current) => ({ toasts: [...current.toasts, toast].slice(-4) }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setState((current) => ({
          toasts: current.toasts.filter((entry) => entry.id !== toast.id),
        }));
      }, 5000);
    }
  },

  dismissToast: (id: string) =>
    setState((current) => ({ toasts: current.toasts.filter((toast) => toast.id !== id) })),

  setMode: (mode: AgentMode) => setState({ mode }),

  setStatus: (status: WorkspaceStatus) => setState({ status }),
  setRunning: (running: boolean) => setState({ running }),
  setStreaming: (streaming: boolean) => setState({ streaming }),

  setCursor: (cursor: Cursor | number, column?: number) => {
    const next: Cursor =
      typeof cursor === "number"
        ? { line: cursor, column: typeof column === "number" ? column : 1 }
        : { line: cursor.line, column: cursor.column };
    setState({ cursor: next });
  },

  pushMessage: (message: Omit<Message, "id" | "at"> & { id?: string; at?: number }) => {
    const id = message.id ?? newId();
    setState((current) => ({
      messages: [
        ...current.messages,
        {
          id,
          role: message.role,
          content: message.content ?? "",
          reasoning: message.reasoning,
          tool: message.tool,
          error: message.error,
          at: message.at ?? Date.now(),
        },
      ],
    }));
    return id;
  },

  appendText: (id: string, chunk: string) => {
    if (!chunk) return;
    setState((current) => ({
      messages: current.messages.map((message) =>
        message.id === id ? { ...message, content: message.content + chunk } : message
      ),
    }));
  },

  appendReasoning: (id: string, chunk: string) => {
    if (!chunk) return;
    setState((current) => ({
      messages: current.messages.map((message) =>
        message.id === id
          ? { ...message, reasoning: (message.reasoning ?? "") + chunk }
          : message
      ),
    }));
  },

  patchMessage: (id: string, patch: Partial<Message>) =>
    setState((current) => ({
      messages: current.messages.map((message) =>
        message.id === id ? { ...message, ...patch } : message
      ),
    })),

  clearMessages: () => setState({ messages: [] }),

  bootstrap: async () => {
    if (getSnapshot().booting) return;
    setState({ booting: true, bootError: null, status: "booting" });
    const session = await callJson("/api/coding/session", { method: "POST" });
    if (!session.ok && session.error) {
      setState({ booting: false, bootError: session.error, status: "error" });
      actions.pushActivity("error", "Sandbox unavailable", session.error);
      return;
    }
    const sandboxId = asString(pick(session.data, ["sandboxId", "sandbox_id", "id"])) || null;
    setState({ sandboxId, booting: false, status: "ready" });
    actions.pushActivity("success", "Sandbox ready", sandboxId ?? undefined);
    await Promise.all([actions.loadProject(), actions.loadTree()]);
  },

  loadProject: async () => {
    setState({ projectLoading: true, projectError: null });
    const response = await callJson("/api/coding/project", { method: "POST" });
    setState((current) => ({
      projectLoading: false,
      project: toProjectSnapshot(response.data) ?? current.project,
      projectError: response.ok ? null : response.error,
    }));
    if (!response.ok && response.error) {
      actions.pushActivity("error", "Project scan failed", response.error);
    }
  },

  loadTree: async (path = ".") => {
    setState({ treeLoading: true, treeError: null });
    const response = await callJson(
      `/api/coding/files?path=${encodeURIComponent(path)}&tree=1`,
      { method: "GET" }
    );
    const rawTree = pick(response.data, ["tree", "root", "data"]);
    const entries = asArray(pick(response.data, ["entries", "files", "items"]));
    const node =
      toNode(rawTree) ??
      toNode({
        name: path === "." ? "project" : path.split("/").pop(),
        path: path === "." ? "" : path,
        type: "directory",
        children: entries,
      });
    setState((current) => ({
      treeLoading: false,
      tree: node ?? current.tree,
      treeError: response.ok ? null : response.error,
    }));
  },

  openFile: async (path: string) => {
    const existing = getSnapshot().openFiles.find((file) => file.path === path);
    if (existing) {
      setState({ activePath: path });
      return;
    }
    const placeholder: OpenFile = {
      path,
      name: baseName(path),
      content: "",
      dirty: false,
      language: languageFromPath(path),
      loading: true,
      error: null,
    };
    setState((current) => ({
      openFiles: [...current.openFiles, placeholder],
      activePath: path,
    }));

    const response = await callJson(`/api/coding/files?path=${encodeURIComponent(path)}`, {
      method: "GET",
    });
    const content = asString(pick(response.data, ["content", "text", "data"]), "");
    setState((current) => ({
      openFiles: current.openFiles.map((file) =>
        file.path === path
          ? {
              ...file,
              content: response.ok ? content : file.content,
              loading: false,
              error: response.ok ? null : response.error,
            }
          : file
      ),
      saveError: response.ok ? null : response.error,
    }));
    if (!response.ok && response.error) {
      actions.pushActivity("error", `Could not open ${path}`, response.error);
    }
  },

  closeFile: (path: string) =>
    setState((current) => {
      const openFiles = current.openFiles.filter((file) => file.path !== path);
      return {
        openFiles,
        activePath:
          current.activePath === path
            ? (openFiles[openFiles.length - 1]?.path ?? null)
            : current.activePath,
      };
    }),

  setActivePath: (path: string) => setState({ activePath: path }),

  updateFileContent: (path: string, content: string) =>
    setState((current) => ({
      openFiles: current.openFiles.map((file) =>
        file.path === path ? { ...file, content, dirty: true } : file
      ),
    })),

  saveFile: async (path?: string) => {
    const target = path ?? getSnapshot().activePath;
    if (!target) return;
    const file = getSnapshot().openFiles.find((entry) => entry.path === target);
    if (!file) return;
    setState({ saving: true, saveError: null, status: "busy" });
    const response = await callJson("/api/coding/files", {
      method: "POST",
      body: JSON.stringify({ path: target, content: file.content, action: "write" }),
    });
    setState((current) => ({
      saving: false,
      status: response.ok ? "ready" : "error",
      saveError: response.error,
      openFiles: response.ok
        ? current.openFiles.map((entry) =>
            entry.path === target
              ? { ...entry, dirty: false, savedAt: Date.now(), error: null }
              : entry
          )
        : current.openFiles,
    }));
    actions.pushActivity(
      response.ok ? "success" : "error",
      response.ok ? `Saved ${target}` : `Save failed: ${target}`,
      response.error ?? undefined
    );
  },

  togglePanel: (panel: PanelId) =>
    setState((current) =>
      current.activePanel === panel && current.panelOpen
        ? { activePanel: null, panelOpen: false }
        : { activePanel: panel, panelOpen: true }
    ),

  setPanel: (panel: PanelId | null) => setState({ activePanel: panel, panelOpen: panel !== null }),

  refreshProblems: async () => {
    setState({ problemsLoading: true });
    const response = await callJson("/api/coding/diagnostics", { method: "POST" });
    setState((current) => ({
      problemsLoading: false,
      problems: response.ok ? toProblems(response.data) : current.problems,
    }));
  },

  loadChanges: async () => {
    setState({ changesLoading: true });
    const response = await callJson("/api/coding/changes", { method: "GET" });
    setState((current) => ({
      changesLoading: false,
      changes: response.ok ? toChangeSets(response.data) : current.changes,
    }));
  },

  applyChange: async (id: string) => {
    const response = await callJson("/api/coding/changes", {
      method: "POST",
      body: JSON.stringify({ action: "apply", id }),
    });
    if (response.ok) {
      actions.pushActivity("success", "Change set applied");
      await actions.loadChanges();
      await actions.loadTree();
    } else {
      actions.pushActivity("error", "Apply failed", response.error ?? undefined);
    }
  },

  revertChange: async (id: string) => {
    const response = await callJson("/api/coding/changes", {
      method: "POST",
      body: JSON.stringify({ action: "revert", id }),
    });
    if (response.ok) {
      actions.pushActivity("info", "Change set reverted");
      await actions.loadChanges();
      await actions.loadTree();
    } else {
      actions.pushActivity("error", "Revert failed", response.error ?? undefined);
    }
  },

  runTests: async () => {
    if (getSnapshot().testsRunning) return;
    setState({ testsRunning: true, status: "busy" });
    const response = await callJson("/api/coding/tests", { method: "POST" });
    setState((current) => ({
      testsRunning: false,
      status: "ready",
      testRun: toTestRun(response.data) ?? current.testRun,
    }));
    actions.pushActivity("info", "Test run finished", response.error ?? undefined);
  },

  loadPlan: async () => {
    setState({ planLoading: true });
    const response = await callJson("/api/coding/plan", {
      method: "POST",
      body: JSON.stringify({ prompt: "", mode: getSnapshot().mode }),
    });
    setState((current) => ({
      planLoading: false,
      plan: toPlan(response.data) ?? current.plan,
    }));
  },

  loadGit: async () => {
    setState({ gitLoading: true });
    const response = await callJson("/api/coding/git", { method: "GET" });
    setState((current) => ({
      gitLoading: false,
      git: toGit(response.data) ?? current.git,
    }));
  },

  addTerminal: () =>
    setState((current) => {
      const id = `term_${current.terminals.length + 1}`;
      return {
        terminals: [...current.terminals, { id, title: `bash ${current.terminals.length + 1}` }],
        activeTerminalId: id,
      };
    }),

  closeTerminal: (id: string) =>
    setState((current) => {
      if (current.terminals.length <= 1) return {};
      const terminals = current.terminals.filter((terminal) => terminal.id !== id);
      return {
        terminals,
        activeTerminalId:
          current.activeTerminalId === id
            ? (terminals[0]?.id ?? null)
            : current.activeTerminalId,
      };
    }),

  setActiveTerminal: (id: string) => setState({ activeTerminalId: id }),

  reset: () => {
    state = { ...blankState(), ...actions } as WorkspaceState;
    emit();
  },
};

state = { ...blankState(), ...actions } as WorkspaceState;

/* ------------------------------------------------------------------ */
/* Hook + imperative access                                            */
/* ------------------------------------------------------------------ */

export function useWorkspace<T>(selector: (current: WorkspaceState) => T): T {
  const snapshot = useSyncExternalStore<WorkspaceState>(subscribe, getSnapshot, getSnapshot);
  return selector(snapshot);
}

export function getWorkspaceState(): WorkspaceState {
  return state;
}

export function setWorkspaceState(patch: Partial<WorkspaceState>): void {
  setState(patch);
}