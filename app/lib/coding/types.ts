// app/lib/coding/types.ts
// GYRA CODE — shared contract.
// Every panel, API route and agent tool in the coding workspace compiles against this file.
// Nothing here performs work; it is pure type surface + small label maps.

/* ------------------------------------------------------------------ */
/* Modes                                                              */
/* ------------------------------------------------------------------ */

export const AGENT_MODES = [
  "build",
  "plan",
  "debug",
  "explain",
  "refactor",
  "test",
  "review",
  "document",
  "optimize",
  "migrate",
  "design",
  "ship",
] as const;

export type AgentMode = (typeof AGENT_MODES)[number];

export interface ModeConfig {
  id: AgentMode;
  label: string;
  icon: string;
  hint: string;
  /** May the agent create/modify/delete files in this mode. */
  writes: boolean;
  /** May the agent run shell commands in this mode. */
  terminal: boolean;
  /** Must the agent produce a plan and wait for approval before writing. */
  requiresPlan: boolean;
  /** Tools enabled for this mode; every other tool is stripped before the model sees it. */
  tools: CodingToolName[];
  /** Appended to the system prompt. */
  system: string;
}

/* ------------------------------------------------------------------ */
/* Panels                                                            */
/* ------------------------------------------------------------------ */

export const PANEL_IDS = [
  "agent",
  "plan",
  "terminal",
  "preview",
  "changes",
  "tools",
  "problems",
  "tests",
  "debug",
  "review",
  "project",
  "search",
  "git",
] as const;

export type PanelId = (typeof PANEL_IDS)[number];

export interface PanelMeta {
  id: PanelId;
  label: string;
  /** Short badge text when the panel has something to report, e.g. "2" errors. */
  badgeKey?:
    | "problems"
    | "changes"
    | "tests"
    | "findings"
    | "planTasks"
    | "searchHits";
}

/* ------------------------------------------------------------------ */
/* Agent status + activity stream                                     */
/* ------------------------------------------------------------------ */

export const AGENT_STATUSES = [
  "idle",
  "thinking",
  "analyzing_project",
  "reading_files",
  "searching_code",
  "creating_files",
  "editing_files",
  "executing_commands",
  "installing",
  "testing",
  "debugging",
  "awaiting_approval",
  "completed",
  "failed",
  "stopped",
] as const;

export type AgentStatus = (typeof AGENT_STATUSES)[number];

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  idle: "Idle",
  thinking: "Thinking",
  analyzing_project: "Analyzing project",
  reading_files: "Reading files",
  searching_code: "Searching code",
  creating_files: "Creating files",
  editing_files: "Editing files",
  executing_commands: "Executing commands",
  installing: "Installing packages",
  testing: "Testing",
  debugging: "Debugging",
  awaiting_approval: "Waiting for approval",
  completed: "Completed",
  failed: "Failed",
  stopped: "Stopped",
};

export const ACTIVITY_KINDS = [
  "status",
  "thought",
  "scan",
  "read",
  "search",
  "create",
  "edit",
  "delete",
  "command",
  "install",
  "test",
  "build",
  "diagnose",
  "plan",
  "approval",
  "change",
  "git",
  "error",
  "done",
] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  /** One-line human sentence: "Read auth/session.ts". */
  label: string;
  /** Optional detail (command, query, path list, error text). */
  detail?: string;
  status: "running" | "done" | "failed" | "skipped";
  startedAt: number;
  endedAt?: number;
  /** Files this event touched. */
  files?: string[];
  /** Tool call this event came from, if any. */
  toolCallId?: string;
  /** Group events into a phase: "analyze", "implement", "verify". */
  phase?: string;
}

/* ------------------------------------------------------------------ */
/* Tools                                                              */
/* ------------------------------------------------------------------ */

export const CODING_TOOLS = [
  "scan_project",
  "list_directory",
  "read_file",
  "search_codebase",
  "find_symbol",
  "read_symbols",
  "execute_terminal",
  "install_package",
  "write_file",
  "edit_file",
  "delete_path",
  "move_path",
  "apply_patch",
  "run_tests",
  "run_diagnostics",
  "git",
  "request_preview",
  "propose_plan",
  "record_finding",
] as const;

export type CodingToolName = (typeof CODING_TOOLS)[number];

/** Tools that mutate the user's project and therefore obey mode + approval gates. */
export const MUTATING_TOOLS: CodingToolName[] = [
  "write_file",
  "edit_file",
  "delete_path",
  "move_path",
  "apply_patch",
  "install_package",
];

/** Tools that can damage the environment if misused; approval-gated in every mode. */
export const DANGEROUS_PATTERNS = [
  /\brm\s+-rf\b/,
  /\bsudo\b/,
  /\bmkfs\b/,
  /\bdd\s+if=/,
  /:\(\)\s*\{.*\};:/,
  /\bshutdown\b/,
  /\breboot\b/,
  /\bchmod\s+777\s+\//,
  /--force\b/,
  /\bgit\s+push\b/,
  /\bnpm\s+publish\b/,
];

export type ToolStatus = "pending" | "running" | "completed" | "failed" | "rejected";

export interface ToolCallView {
  id: string;
  tool: CodingToolName;
  /** Raw model input, kept for the inspector. */
  input: Record<string, unknown>;
  /** Truncated human-readable output. */
  output?: string;
  status: ToolStatus;
  startedAt: number;
  endedAt?: number;
  error?: string;
  /** True when the call needs explicit user approval before execution. */
  requiresApproval?: boolean;
  approval?: ApprovalState;
  /** Files read/written, for the activity stream + context accounting. */
  files?: string[];
}

export type ApprovalState = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  toolCallId: string;
  tool: CodingToolName;
  /** What the user is approving, in plain language. */
  summary: string;
  /** Diff, command, or payload preview shown in the approval card. */
  preview?: string;
  reason: "mutating" | "dangerous" | "plan";
  createdAt: number;
  state: ApprovalState;
}

/* ------------------------------------------------------------------ */
/* Task + progress                                                    */
/* ------------------------------------------------------------------ */

export interface AgentTask {
  id: string;
  title: string;
  mode: AgentMode;
  status: AgentStatus;
  startedAt: number;
  endedAt?: number;
  /** Current single operation string: "Rewriting auth/session.ts". */
  operation?: string;
  filesRead: string[];
  filesModified: string[];
  toolCalls: number;
  planId?: string;
  changeSetId?: string;
  error?: string;
}

export interface ProgressSummary {
  total: number;
  done: number;
  running: number;
  failed: number;
  pending: number;
}

/* ------------------------------------------------------------------ */
/* Plans                                                              */
/* ------------------------------------------------------------------ */

export type PlanTaskStatus = "pending" | "running" | "done" | "failed" | "skipped";

export type Complexity = "trivial" | "simple" | "moderate" | "complex" | "critical";

export interface PlanTask {
  id: string;
  title: string;
  detail?: string;
  status: PlanTaskStatus;
  /** Ids of tasks that must finish first. */
  dependsOn: string[];
  complexity: Complexity;
  /** Files this task is expected to touch. */
  files?: string[];
  /** Which panel/phase this task is verified by. */
  verify?: "tests" | "diagnostics" | "build" | "manual" | "review";
  startedAt?: number;
  endedAt?: number;
  result?: string;
}

export interface PlanPhase {
  id: string;
  title: string;
  /** Short purpose of this phase. */
  goal?: string;
  tasks: PlanTask[];
}

export type PlanStatus =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "running"
  | "completed"
  | "failed"
  | "rejected";

export interface ImplementationPlan {
  id: string;
  title: string;
  summary: string;
  phases: PlanPhase[];
  status: PlanStatus;
  createdAt: number;
  updatedAt: number;
  /** Why the agent chose this approach. Shown above the plan. */
  rationale?: string;
  /** Files discovered during analysis that justify the plan. */
  relevantFiles?: string[];
  /** Plan version, bumped on regeneration. */
  revision: number;
}

/* ------------------------------------------------------------------ */
/* Files + explorer                                                   */
/* ------------------------------------------------------------------ */

export type GitFileStatus = "clean" | "modified" | "added" | "deleted" | "renamed" | "untracked" | "conflict";

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  /** Byte size for files. */
  size?: number;
  /** Epoch ms. */
  modifiedAt?: number;
  /** Only present for files. */
  language?: string;
  gitStatus?: GitFileStatus;
  hidden?: boolean;
  /** Only for directories. */
  children?: FileNode[];
}

export interface FileMeta {
  path: string;
  size: number;
  lines: number;
  language: string;
  encoding: "utf8" | "binary";
  modifiedAt: number;
  gitStatus?: GitFileStatus;
  /** sha256 of the current content — used to detect external edits. */
  hash: string;
}

export interface FileVersion {
  id: string;
  path: string;
  hash: string;
  createdAt: number;
  /** Who produced this version. */
  source: "user" | "agent" | "snapshot" | "restore";
  changeSetId?: string;
  /** Not stored in list responses. */
  content?: string;
}

export interface EditorTab {
  path: string;
  /** Monaco model value. */
  value: string;
  savedValue: string;
  language: string;
  pinned: boolean;
  /** Preview tabs are replaced by the next single-click open. */
  preview: boolean;
  /** Cursor restore. */
  cursor?: { lineNumber: number; column: number };
  scrollTop?: number;
  /** Pane index for split view: 0 = left, 1 = right. */
  pane: 0 | 1;
}

/* ------------------------------------------------------------------ */
/* Changes                                                            */
/* ------------------------------------------------------------------ */

export type ChangeKind = "modified" | "added" | "deleted" | "renamed" | "mode";

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export interface FileChange {
  path: string;
  fromPath?: string;
  kind: ChangeKind;
  before?: string;
  after?: string;
  hunks?: DiffHunk[];
  additions: number;
  deletions: number;
  status: "pending" | "accepted" | "rejected";
  /** Who made the change. */
  source: "agent" | "user" | "format" | "revert";
  toolCallId?: string;
}

export type ChangeSetStatus = "open" | "partially_applied" | "accepted" | "rejected" | "reverted";

export interface ChangeSet {
  id: string;
  taskId: string;
  title: string;
  changes: FileChange[];
  status: ChangeSetStatus;
  createdAt: number;
  updatedAt: number;
  /** Snapshot id usable to restore the pre-change state. */
  snapshotId?: string;
}

/* ------------------------------------------------------------------ */
/* Problems / diagnostics                                             */
/* ------------------------------------------------------------------ */

export type ProblemSeverity = "error" | "warning" | "info";

export const PROBLEM_SOURCES = ["typescript", "eslint", "build", "runtime", "test", "import", "dependency", "security"] as const;

export type ProblemSource = (typeof PROBLEM_SOURCES)[number];

export interface Problem {
  id: string;
  severity: ProblemSeverity;
  source: ProblemSource;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  endLine?: number;
  /** Compiler/linter rule code, e.g. TS2304. */
  code?: string;
  /** Whether we know how to auto-fix this. */
  fixable?: boolean;
  /** Raw tool output for the details view. */
  raw?: string;
  /** Command that produced it, e.g. "npx tsc --noEmit". */
  origin?: string;
}

export interface DiagnosticsReport {
  problems: Problem[];
  errors: number;
  warnings: number;
  ranAt: number;
  /** Which checks were actually executed in this run. */
  executed: ProblemSource[];
  /** Checks that could not run, with the reason. */
  skipped: { source: ProblemSource; reason: string }[];
}

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */

export type TestStatus = "passed" | "failed" | "skipped" | "todo";

export interface TestCase {
  id: string;
  name: string;
  suite?: string;
  file?: string;
  status: TestStatus;
  durationMs?: number;
  failureMessage?: string;
  stack?: string;
}

export interface TestRun {
  id: string;
  command: string;
  framework?: string;
  cases: TestCase[];
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  startedAt: number;
  /** Non-zero when the runner itself failed (no config, missing script). */
  exitCode?: number;
  /** Raw output for logs. */
  output?: string;
}

/* ------------------------------------------------------------------ */
/* Debug                                                              */
/* ------------------------------------------------------------------ */

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  enabled: boolean;
  condition?: string;
}

export type DebugState = "inactive" | "starting" | "paused" | "running" | "stopped" | "error";

export interface StackFrame {
  id: number;
  functionName: string;
  file: string;
  line: number;
  column: number;
}

export interface DebugSession {
  id: string;
  state: DebugState;
  pid?: number;
  breakpoints: Breakpoint[];
  frames: StackFrame[];
  variables?: Record<string, string>;
  console: string[];
  message?: string;
}

/* ------------------------------------------------------------------ */
/* Review                                                             */
/* ------------------------------------------------------------------ */

export const REVIEW_CATEGORIES = [
  "quality",
  "security",
  "performance",
  "maintainability",
  "architecture",
  "errorHandling",
  "naming",
  "duplication",
  "dependencyRisk",
  "bestPractices",
] as const;

export type ReviewCategory = (typeof REVIEW_CATEGORIES)[number];

export type ReviewGrade = "good" | "moderate" | "needs_attention";

export interface ReviewFinding {
  id: string;
  category: ReviewCategory;
  severity: ProblemSeverity;
  title: string;
  explanation: string;
  file?: string;
  line?: number;
  /** Suggested fix, if any. */
  suggestion?: string;
  /** Patch the user can apply. */
  patch?: string;
  status: "open" | "fixed" | "ignored" | "accepted";
}

export interface ReviewReport {
  id: string;
  overall: ReviewGrade;
  scores: Partial<Record<ReviewCategory, ReviewGrade>>;
  summary: string;
  findings: ReviewFinding[];
  filesReviewed: number;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/* Project intelligence                                               */
/* ------------------------------------------------------------------ */

export interface LanguageStat {
  language: string;
  files: number;
  bytes: number;
  percent: number;
}

export interface DependencyInfo {
  name: string;
  version: string;
  dev: boolean;
  /** Installed version resolved from node_modules, when present. */
  installed?: string;
}

export interface ApiRouteInfo {
  method: string;
  route: string;
  file: string;
  dynamic?: boolean;
}

export interface ArchitectureLayer {
  name: string;
  paths: string[];
  description: string;
}

export interface ProjectIntel {
  root: string;
  name: string;
  type: "next" | "vite" | "cra" | "node" | "python" | "go" | "rust" | "static" | "unknown";
  framework?: string;
  runtime?: string;
  packageManager?: "npm" | "pnpm" | "yarn" | "bun" | "pip" | "poetry" | "cargo" | "go" | "unknown";
  entryPoints: string[];
  languages: LanguageStat[];
  dependencies: DependencyInfo[];
  scripts: Record<string, string>;
  database?: string;
  apiRoutes: ApiRouteInfo[];
  architecture: ArchitectureLayer[];
  fileCount: number;
  directoryCount: number;
  totalBytes: number;
  tests: { framework?: string; files: number; command?: string };
  git: GitSummary;
  /** Short natural-language snapshot for the model. */
  summary: string;
  scannedAt: number;
}

export interface GitSummary {
  isRepo: boolean;
  branch?: string;
  clean?: boolean;
  ahead?: number;
  behind?: number;
  changed?: number;
  remotes?: string[];
}

export interface GitStatusEntry {
  path: string;
  status: GitFileStatus;
  staged: boolean;
  additions?: number;
  deletions?: number;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  email?: string;
  date: string;
  subject: string;
  body?: string;
  filesChanged?: number;
  insertions?: number;
  deletions?: number;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
  ahead?: number;
  behind?: number;
}

export interface GitPanelState {
  summary: GitSummary;
  entries: GitStatusEntry[];
  branches: GitBranch[];
  commits: GitCommit[];
}

/* ------------------------------------------------------------------ */
/* Code index + search                                                */
/* ------------------------------------------------------------------ */

export const SYMBOL_KINDS = [
  "function",
  "class",
  "method",
  "interface",
  "type",
  "enum",
  "const",
  "variable",
  "component",
  "hook",
] as const;

export type SymbolKind = (typeof SYMBOL_KINDS)[number];

export interface SymbolEntry {
  id: string;
  name: string;
  kind: SymbolKind;
  file: string;
  line: number;
  column: number;
  /** Containing class/function, for methods. */
  parent?: string;
  exported: boolean;
  /** First line of the signature or doc, for hover text. */
  signature?: string;
  doc?: string;
}

export interface ImportEdge {
  from: string;
  specifier: string;
  /** Resolved workspace path, when resolvable. */
  resolved?: string;
  external: boolean;
  names?: string[];
  line: number;
}

export interface CodeIndex {
  symbols: SymbolEntry[];
  imports: ImportEdge[];
  /** path -> sha256 at index time, so we can incrementally reindex. */
  fileHashes: Record<string, string>;
  builtAt: number;
}

export interface SearchFilters {
  glob?: string;
  language?: string;
  caseSensitive?: boolean;
  regex?: boolean;
  exact?: boolean;
  includeHidden?: boolean;
  modifiedOnly?: boolean;
  kinds?: ("file" | "content" | "symbol" | "import" | "comment")[];
}

export interface SearchMatch {
  line: number;
  column: number;
  length: number;
  preview: string;
}

export interface SearchHit {
  path: string;
  /** Why this hit exists. */
  type: "file" | "content" | "symbol" | "import" | "comment";
  score: number;
  matches: SearchMatch[];
  symbol?: SymbolEntry;
  /** One-line explanation, e.g. "exported function used by 4 files". */
  note?: string;
}

export interface SearchResponse {
  query: string;
  hits: SearchHit[];
  totalFiles: number;
  tookMs: number;
  strategy: "lexical" | "symbol" | "hybrid" | "semantic";
}

/* ------------------------------------------------------------------ */
/* Context selection                                                  */
/* ------------------------------------------------------------------ */

export interface ContextFile {
  path: string;
  content: string;
  /** Why it was included. */
  reason: string;
  score: number;
  /** Truncated? */
  truncated?: boolean;
}

export interface ContextBundle {
  files: ContextFile[];
  symbols: SymbolEntry[];
  projectSummary: string;
  totalChars: number;
  budgetChars: number;
}

/* ------------------------------------------------------------------ */
/* Terminal / PTY                                                     */
/* ------------------------------------------------------------------ */

export interface TerminalLine {
  id: string;
  stream: "stdout" | "stderr" | "system" | "input";
  text: string;
  at: number;
}

export interface PtySession {
  /** E2B process id. */
  pid: number;
  title: string;
  cols: number;
  rows: number;
  createdAt: number;
  status: "running" | "exited";
  cwd?: string;
}

export type PtyRequest =
  | { action: "create"; title?: string; cols: number; rows: number; cwd?: string }
  | { action: "list" }
  | { action: "input"; pid: number; data: string }
  | { action: "resize"; pid: number; cols: number; rows: number }
  | { action: "kill"; pid: number }
  | { action: "connect"; pid: number };

export type PtyEvent =
  | { type: "ready"; pid: number }
  | { type: "data"; pid: number; data: string }
  | { type: "exit"; pid: number; code?: number }
  | { type: "sessions"; sessions: PtySession[] }
  | { type: "error"; message: string };

export interface BackgroundProcess {
  pid: number;
  command: string;
  cwd?: string;
  startedAt: number;
  status: "running" | "exited";
}

/* ------------------------------------------------------------------ */
/* Sandbox                                                            */
/* ------------------------------------------------------------------ */

export interface SandboxInfo {
  sandboxId: string;
  root: string;
  startedAt: number;
  expiresAt?: number;
  status: "running" | "paused" | "unknown";
  /** Last known preview. */
  preview?: PreviewState;
}

export interface PreviewState {
  url?: string;
  port?: number;
  ready: boolean;
  framework?: string;
  command?: string;
  pid?: number;
  startedAt?: number;
  logs: string[];
  error?: string;
  services?: { name: string; port: number; url: string; ready: boolean }[];
}

/* ------------------------------------------------------------------ */
/* Inline AI editing                                                  */
/* ------------------------------------------------------------------ */

export const INLINE_ACTIONS = [
  "explain",
  "fix",
  "optimize",
  "refactor",
  "comment",
  "document",
  "errorHandling",
  "convert",
  "secure",
  "tests",
] as const;

export type InlineAction = (typeof INLINE_ACTIONS)[number];

export interface EditorSelection {
  file: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  text: string;
}

export type InlineProposalStatus = "streaming" | "ready" | "accepted" | "rejected";

export interface InlineProposal {
  id: string;
  file: string;
  action: InlineAction;
  selection: EditorSelection;
  original: string;
  proposed: string;
  status: InlineProposalStatus;
  explanation?: string;
  createdAt: number;
  error?: string;
}

/* ------------------------------------------------------------------ */
/* Persistence (Supabase)                                             */
/* ------------------------------------------------------------------ */

export interface ProjectRecord {
  id: string;
  ownerId: string;
  name: string;
  sandboxId?: string;
  createdAt: string;
  lastOpenedAt: string;
  archived?: boolean;
}

export interface WorkspaceSnapshot {
  id: string;
  projectId: string;
  label: string;
  createdAt: string;
  /** Stored in the sandbox, not the DB. */
  tarPath: string;
  bytes: number;
  files: number;
}

export interface TaskRecord {
  id: string;
  projectId: string;
  title: string;
  mode: AgentMode;
  status: AgentStatus;
  plan?: ImplementationPlan;
  changeSetId?: string;
  createdAt: string;
  finishedAt?: string;
}

/* ------------------------------------------------------------------ */
/* Streaming protocol (client ← /api/coding)                          */
/* ------------------------------------------------------------------ */

/**
 * The route streams AI SDK v4 data lines (`0:`, `g:`, `9:`, `a:`, `d:`, `3:`)
 * and interleaves our own namespaced control lines prefixed with `y:` whose
 * payload is one of the events below.
 */
export type CodingStreamEvent =
  | { type: "status"; status: AgentStatus; operation?: string }
  | { type: "activity"; event: ActivityEvent }
  | { type: "tool"; call: ToolCallView }
  | { type: "approval"; request: ApprovalRequest }
  | { type: "plan"; plan: ImplementationPlan }
  | { type: "changes"; changeSet: ChangeSet }
  | { type: "problems"; report: DiagnosticsReport }
  | { type: "tests"; run: TestRun }
  | { type: "project"; intel: ProjectIntel }
  | { type: "preview"; state: PreviewState }
  | { type: "task"; task: AgentTask }
  | { type: "done"; taskId: string }
  | { type: "error"; message: string };

/* ------------------------------------------------------------------ */
/* Store shape (zustand)                                              */
/* ------------------------------------------------------------------ */

export interface WorkspaceState {
  /* session */
  sandboxId?: string;
  root: string;
  booting: boolean;
  bootError?: string;

  /* files */
  tree: FileNode[];
  treeFilter: string;
  selectedPaths: string[];
  expanded: Record<string, boolean>;
  hiddenVisible: boolean;
  clipboard?: { paths: string[]; mode: "copy" | "cut" };

  /* editor */
  tabs: EditorTab[];
  activePath?: string;
  activePane: 0 | 1;
  splitPath?: string;
  dirtyPaths: string[];

  /* agent */
  mode: AgentMode;
  status: AgentStatus;
  operation?: string;
  task?: AgentTask;
  activity: ActivityEvent[];
  toolCalls: ToolCallView[];
  approvals: ApprovalRequest[];
  messages: ChatMessageView[];

  /* plan */
  plan?: ImplementationPlan;

  /* changes */
  changeSets: ChangeSet[];
  activeChangeSetId?: string;

  /* problems / tests / review */
  diagnostics?: DiagnosticsReport;
  testRun?: TestRun;
  review?: ReviewReport;

  /* project / search / git */
  project?: ProjectIntel;
  search?: SearchResponse;
  git?: GitPanelState;

  /* terminal / preview */
  ptySessions: PtySession[];
  activePtyPid?: number;
  preview?: PreviewState;

  /* ui */
  panel: PanelId;
  panelOpen: boolean;
  paletteOpen: boolean;
}

export interface ChatMessageView {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning?: string;
  toolCalls: string[];
  createdAt: number;
  pending?: boolean;
  error?: string;
}