"use client";
// app/coding/components/PanelHost.tsx
// The cockpit. One drawer, twelve panels, every value from real workspace state.

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { PANEL_LABELS, PANEL_ORDER, useWorkspace } from "../../lib/coding/store";
import type { PanelId } from "../../lib/coding/store";
import TerminalPane from "./TerminalPane";

/* helpers ------------------------------------------------------------ */

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : fallback;
}

function asNum(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-relaxed text-white/40">
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/5 py-1.5">
      <span className="text-[10.5px] uppercase tracking-wide text-white/30">{label}</span>
      <span className="truncate font-mono text-[11px] text-white/75">{value}</span>
    </div>
  );
}

function Action({
  onClick,
  children,
  tone = "default",
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  tone?: "default" | "accent" | "danger";
  disabled?: boolean;
}) {
  const style =
    tone === "accent"
      ? "border-indigo-400/40 bg-indigo-400/10 text-indigo-200 hover:bg-indigo-400/20"
      : tone === "danger"
        ? "border-rose-400/40 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
        : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white/90";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2.5 py-1 font-mono text-[10.5px] transition ${style} disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

/* panels ------------------------------------------------------------- */

function ProjectPanel() {
  const project = useWorkspace((state) => state.project);
  const loading = useWorkspace((state) => state.projectLoading);
  const error = useWorkspace((state) => state.projectError);
  const loadProject = useWorkspace((state) => state.loadProject);
  const loadTree = useWorkspace((state) => state.loadTree);

  if (loading) return <Notice>Scanning the sandbox…</Notice>;
  if (!project) {
    return (
      <div className="space-y-3">
        <Notice>No project snapshot yet.</Notice>
        {error ? <p className="font-mono text-[10.5px] text-rose-300">{error}</p> : null}
        <Action tone="accent" onClick={() => { void loadProject(); void loadTree(); }}>
          Scan project
        </Action>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Row label="root" value={project.root} />
        <Row label="framework" value={project.framework || "not detected"} />
        <Row label="language" value={project.language || "not detected"} />
        <Row label="package manager" value={project.packageManager || "not detected"} />
        <Row label="branch" value={project.gitBranch || "no git branch"} />
        <Row label="api routes" value={project.apiRoutes.length} />
        <Row label="test files" value={project.testFiles} />
        <Row label="files" value={project.files} />
        <Row label="directories" value={project.directories} />
        <Row label="dependencies" value={project.dependencies.length + project.devDependencies.length} />
      </div>

      {project.entries.length > 0 ? (
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/30">Top level</p>
          <div className="flex flex-wrap gap-1">
            {project.entries.slice(0, 40).map((entry) => (
              <span
                key={entry}
                className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/50"
              >
                {entry}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {project.languages.length > 0 ? (
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-white/30">Languages</p>
          {project.languages.slice(0, 6).map((entry) => (
            <div key={entry.language} className="mb-1">
              <div className="flex justify-between font-mono text-[10px] text-white/45">
                <span>{entry.language}</span>
                <span>{entry.percent.toFixed(1)}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/10">
                <div
                  className="h-1 rounded-full bg-indigo-400/70"
                  style={{ width: `${Math.min(100, Math.max(0, entry.percent))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <Action onClick={() => { void loadProject(); void loadTree(); }}>Rescan</Action>
    </div>
  );
}

interface SearchHit {
  path: string;
  line: number;
  snippet: string;
}

function SearchPanel() {
  const openFile = useWorkspace((state) => state.openFile);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    const term = query.trim();
    if (!term || busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/coding/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: term, q: term }),
      });
      const data = asRecord(await response.json().catch(() => ({})));
      const raw = Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.hits)
          ? data.hits
          : Array.isArray(data.matches)
            ? data.matches
            : [];
      setHits(
        raw.map((entry) => {
          const row = asRecord(entry);
          return {
            path: asText(row.path, asText(row.file, "unknown")),
            line: asNum(row.line, 1),
            snippet: asText(row.snippet, asText(row.text, asText(row.preview))),
          };
        })
      );
      if (!response.ok) setError(asText(data.error, asText(data.message, `search ${response.status}`)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "search failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run();
        }}
        className="flex gap-2"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="grep the project…"
          spellCheck={false}
          className="w-full rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5 font-mono text-[11px] text-white/85 outline-none placeholder:text-white/20 focus:border-indigo-400/40"
        />
        <Action tone="accent" onClick={() => void run()}>
          {busy ? "…" : "find"}
        </Action>
      </form>

      {error ? <p className="font-mono text-[10.5px] text-rose-300">{error}</p> : null}
      {!busy && hits.length === 0 && !error ? <Notice>No matches yet.</Notice> : null}

      <ul className="space-y-1">
        {hits.map((hit, index) => (
          <li key={`${hit.path}-${hit.line}-${index}`}>
            <button
              type="button"
              onClick={() => void openFile(hit.path)}
              className="w-full rounded-md border border-white/5 px-2 py-1.5 text-left hover:border-white/20"
            >
              <p className="truncate font-mono text-[10.5px] text-indigo-200">
                {hit.path}:{hit.line}
              </p>
              {hit.snippet ? (
                <p className="mt-0.5 line-clamp-2 font-mono text-[10px] text-white/40">{hit.snippet}</p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChangesPanel() {
  const changes = useWorkspace((state) => state.changes);
  const loading = useWorkspace((state) => state.changesLoading);
  const loadChanges = useWorkspace((state) => state.loadChanges);
  const applyChange = useWorkspace((state) => state.applyChange);
  const revertChange = useWorkspace((state) => state.revertChange);

  useEffect(() => {
    void loadChanges();
  }, [loadChanges]);

  if (loading && changes.length === 0) return <Notice>Reading change sets…</Notice>;
  if (changes.length === 0) {
    return (
      <div className="space-y-3">
        <Notice>No change sets yet. They appear when the agent edits files.</Notice>
        <Action onClick={() => void loadChanges()}>Refresh</Action>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {changes.map((change) => (
        <div key={change.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[11.5px] text-white/80">{change.title}</p>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9.5px] ${
                change.applied
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "bg-amber-400/15 text-amber-300"
              }`}
            >
              {change.applied ? "applied" : "pending"}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[10px] text-emerald-300/80">
            +{change.additions} <span className="text-rose-300/80">-{change.deletions}</span>
          </p>
          <ul className="mt-1 space-y-0.5">
            {change.files.slice(0, 8).map((file) => (
              <li key={file.path} className="truncate font-mono text-[10px] text-white/40">
                {file.status} · {file.path}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            {!change.applied ? (
              <Action tone="accent" onClick={() => void applyChange(change.id)}>
                apply
              </Action>
            ) : (
              <Action tone="danger" onClick={() => void revertChange(change.id)}>
                revert
              </Action>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProblemsPanel() {
  const problems = useWorkspace((state) => state.problems);
  const loading = useWorkspace((state) => state.problemsLoading);
  const refreshProblems = useWorkspace((state) => state.refreshProblems);
  const openFile = useWorkspace((state) => state.openFile);

  useEffect(() => {
    void refreshProblems();
  }, [refreshProblems]);

  if (loading && problems.length === 0) return <Notice>Collecting diagnostics…</Notice>;
  if (problems.length === 0) {
    return (
      <div className="space-y-3">
        <Notice>No problems reported by the sandbox.</Notice>
        <Action onClick={() => void refreshProblems()}>Run diagnostics</Action>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {problems.map((problem) => (
        <li key={problem.id}>
          <button
            type="button"
            onClick={() => void openFile(problem.file)}
            className="w-full rounded-md border border-white/5 px-2 py-1.5 text-left hover:border-white/20"
          >
            <p className="flex items-center gap-1.5 font-mono text-[10px]">
              <span
                className={
                  problem.severity === "error"
                    ? "text-rose-300"
                    : problem.severity === "warning"
                      ? "text-amber-300"
                      : "text-white/40"
                }
              >
                {problem.severity}
              </span>
              <span className="truncate text-white/50">
                {problem.file}:{problem.line}
              </span>
            </p>
            <p className="mt-0.5 line-clamp-2 text-[10.5px] text-white/60">{problem.message}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}

function TestPanel() {
  const testRun = useWorkspace((state) => state.testRun);
  const running = useWorkspace((state) => state.testsRunning);
  const runTests = useWorkspace((state) => state.runTests);

  return (
    <div className="space-y-3">
      <Action tone="accent" onClick={() => void runTests()} disabled={running}>
        {running ? "running…" : "run tests"}
      </Action>

      {!testRun ? (
        <Notice>No test run yet. Gyra detects the framework from package.json.</Notice>
      ) : (
        <div className="space-y-2">
          <div>
            <Row label="framework" value={testRun.framework} />
            <Row label="total" value={testRun.total} />
            <Row label="passed" value={testRun.passed} />
            <Row label="failed" value={testRun.failed} />
            <Row label="duration" value={`${Math.round(testRun.durationMs)} ms`} />
          </div>

          {testRun.failures.length > 0 ? (
            <ul className="space-y-1">
              {testRun.failures.slice(0, 8).map((failure, index) => (
                <li
                  key={`${failure.name}-${index}`}
                  className="rounded border border-rose-400/20 bg-rose-400/5 px-2 py-1.5"
                >
                  <p className="font-mono text-[10.5px] text-rose-200">{failure.name}</p>
                  <p className="mt-0.5 line-clamp-3 font-mono text-[10px] text-white/40">
                    {failure.message}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {testRun.output ? (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded border border-white/10 bg-[#05070c] p-2 font-mono text-[10px] text-white/50">
              {testRun.output}
            </pre>
          ) : null}
        </div>
      )}
    </div>
  );
}

function GitPanel() {
  const git = useWorkspace((state) => state.git);
  const loading = useWorkspace((state) => state.gitLoading);
  const loadGit = useWorkspace((state) => state.loadGit);

  useEffect(() => {
    if (!git) void loadGit();
  }, [git, loadGit]);

  if (loading && !git) return <Notice>Reading git state…</Notice>;
  if (!git) {
    return (
      <div className="space-y-3">
        <Notice>No git status yet.</Notice>
        <Action onClick={() => void loadGit()}>Refresh</Action>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Row label="branch" value={git.branch} />
        <Row label="ahead" value={git.ahead} />
        <Row label="behind" value={git.behind} />
        <Row label="staged" value={git.staged} />
        <Row label="unstaged" value={git.unstaged} />
        <Row label="untracked" value={git.untracked} />
      </div>

      {git.changed.length > 0 ? (
        <ul className="space-y-0.5">
          {git.changed.slice(0, 20).map((file) => (
            <li key={file.path} className="truncate font-mono text-[10px] text-white/45">
              <span className="text-amber-300/80">{file.status}</span> {file.path}
            </li>
          ))}
        </ul>
      ) : (
        <Notice>Working tree is clean.</Notice>
      )}

      {git.recentCommits.length > 0 ? (
        <ul className="space-y-0.5">
          {git.recentCommits.slice(0, 5).map((commit) => (
            <li key={commit.hash} className="truncate font-mono text-[10px] text-white/35">
              <span className="text-indigo-300/80">{commit.hash.slice(0, 7)}</span> {commit.message}
            </li>
          ))}
        </ul>
      ) : null}

      <Action onClick={() => void loadGit()}>Refresh</Action>
    </div>
  );
}

function PlanPanel() {
  const plan = useWorkspace((state) => state.plan);
  const loading = useWorkspace((state) => state.planLoading);
  const loadPlan = useWorkspace((state) => state.loadPlan);
  const mode = useWorkspace((state) => state.mode);

  return (
    <div className="space-y-3">
      <Action tone="accent" onClick={() => void loadPlan()} disabled={loading}>
        {loading ? "thinking…" : `draft a ${mode} plan`}
      </Action>

      {!plan ? (
        <Notice>No plan yet. Gyra writes one from your project state and agent mode.</Notice>
      ) : (
        <div className="space-y-2">
          <p className="text-[12px] text-white/85">{plan.title}</p>
          {plan.rationale ? (
            <p className="text-[10.5px] leading-relaxed text-white/40">{plan.rationale}</p>
          ) : null}
          <ol className="space-y-1">
            {plan.steps.map((step, index) => (
              <li key={step.id} className="rounded border border-white/10 px-2 py-1.5">
                <p className="flex gap-2 font-mono text-[10.5px]">
                  <span
                    className={
                      step.status === "done"
                        ? "text-emerald-300"
                        : step.status === "active"
                          ? "text-cyan-300"
                          : "text-white/30"
                    }
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-white/75">{step.title}</span>
                </p>
                {step.detail ? (
                  <p className="mt-0.5 pl-6 text-[10px] text-white/35">{step.detail}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

const TOOL_NAMES = ["list_files", "read_file", "write_file", "run_command", "search_files"];

function ToolsPanel() {
  const activity = useWorkspace((state) => state.activity);
  const toolEvents = activity.filter((event) => event.kind === "tool");

  return (
    <div className="space-y-3">
      <Notice>
        These are the only tools the agent can call. Every write goes through the change registry, so
        nothing lands unseen.
      </Notice>
      <ul className="space-y-1">
        {TOOL_NAMES.map((name) => {
          const count = toolEvents.filter((event) => event.title.includes(name)).length;
          return (
            <li
              key={name}
              className="flex items-center justify-between rounded border border-white/10 px-2 py-1.5"
            >
              <span className="font-mono text-[10.5px] text-white/65">{name}</span>
              <span className="font-mono text-[10px] text-white/30">{count} calls</span>
            </li>
          );
        })}
      </ul>

      {toolEvents.length > 0 ? (
        <ul className="space-y-0.5">
          {toolEvents.slice(-10).reverse().map((event) => (
            <li key={event.id} className="truncate font-mono text-[10px] text-white/35">
              {event.title}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function DebugPanel() {
  const status = useWorkspace((state) => state.status);
  const sandboxId = useWorkspace((state) => state.sandboxId);
  const booting = useWorkspace((state) => state.booting);
  const bootError = useWorkspace((state) => state.bootError);
  const running = useWorkspace((state) => state.running);
  const streaming = useWorkspace((state) => state.streaming);
  const messages = useWorkspace((state) => state.messages);
  const problems = useWorkspace((state) => state.problems);

  return (
    <div className="space-y-3">
      <div>
        <Row label="status" value={status} />
        <Row label="sandbox" value={sandboxId ?? "none"} />
        <Row label="booting" value={booting ? "yes" : "no"} />
        <Row label="agent running" value={running ? "yes" : "no"} />
        <Row label="streaming" value={streaming ? "yes" : "no"} />
        <Row label="messages" value={messages.length} />
        <Row label="problems" value={problems.length} />
      </div>
      {bootError ? (
        <p className="rounded border border-rose-400/30 bg-rose-400/5 p-2 font-mono text-[10px] text-rose-200">
          {bootError}
        </p>
      ) : null}
    </div>
  );
}

function ReviewPanel() {
  const changes = useWorkspace((state) => state.changes);
  const problems = useWorkspace((state) => state.problems);
  const testRun = useWorkspace((state) => state.testRun);
  const openFile = useWorkspace((state) => state.openFile);

  const pending = changes.filter((change) => !change.applied);
  const errors = problems.filter((problem) => problem.severity === "error");
  const touched = new Set<string>();
  for (const change of changes) for (const file of change.files) touched.add(file.path);

  const risk =
    errors.length * 3 + (testRun?.failed ?? 0) * 2 + pending.length + Math.min(5, touched.size);

  return (
    <div className="space-y-3">
      <Notice>
        Derived from live state only: {touched.size} touched files, {errors.length} errors,{" "}
        {testRun ? `${testRun.failed} failing tests` : "no test run"}, {pending.length} unapplied
        change sets.
      </Notice>

      <div>
        <Row label="risk score" value={risk} />
        <Row label="touched files" value={touched.size} />
        <Row label="open errors" value={errors.length} />
        <Row label="pending change sets" value={pending.length} />
      </div>

      {errors.length > 0 ? (
        <ul className="space-y-0.5">
          {errors.slice(0, 8).map((problem) => (
            <li key={problem.id}>
              <button
                type="button"
                onClick={() => void openFile(problem.file)}
                className="w-full truncate text-left font-mono text-[10px] text-rose-300/80 hover:text-rose-200"
              >
                {problem.file}:{problem.line} — {problem.message}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {testRun && testRun.failed > 0 ? (
        <ul className="space-y-0.5">
          {testRun.failures.slice(0, 6).map((failure, index) => (
            <li key={`${failure.name}-${index}`} className="font-mono text-[10px] text-amber-300/80">
              {failure.name}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function PreviewPanel() {
  const sandboxId = useWorkspace((state) => state.sandboxId);
  const pushActivity = useWorkspace((state) => state.pushActivity);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/coding/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: "/", sandboxId }),
      });
      const data = asRecord(await response.json().catch(() => ({})));
      const next = asText(data.url, asText(data.previewUrl, asText(data.href)));
      if (!next) {
        setError(asText(data.error, asText(data.message, `preview ${response.status}`)));
        pushActivity("warning", "Preview", `no url returned (${response.status})`);
      } else {
        setUrl(next);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "preview failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Action tone="accent" onClick={() => void load()} disabled={busy || !sandboxId}>
        {busy ? "starting…" : url ? "reload preview" : "start preview"}
      </Action>
      {error ? <p className="font-mono text-[10.5px] text-rose-300">{error}</p> : null}
      {url ? (
        <iframe
          src={url}
          title="Sandbox preview"
          className="h-72 w-full rounded-md border border-white/10 bg-white/5"
        />
      ) : (
        <Notice>Start the dev server inside the sandbox, then load the preview URL here.</Notice>
      )}
    </div>
  );
}

/* shell -------------------------------------------------------------- */

export default function PanelHost() {
  const panelOpen = useWorkspace((state) => state.panelOpen);
  const activePanel = useWorkspace((state) => state.activePanel);
  const setPanel = useWorkspace((state) => state.setPanel);

  useEffect(() => {
    if (!panelOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPanel(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelOpen, setPanel]);

  if (!panelOpen || !activePanel) return null;

  function body(panel: PanelId) {
    if (panel === "project") return <ProjectPanel />;
    if (panel === "search") return <SearchPanel />;
    if (panel === "changes") return <ChangesPanel />;
    if (panel === "problems") return <ProblemsPanel />;
    if (panel === "tests") return <TestPanel />;
    if (panel === "git") return <GitPanel />;
    if (panel === "plan") return <PlanPanel />;
    if (panel === "tools") return <ToolsPanel />;
    if (panel === "debug") return <DebugPanel />;
    if (panel === "review") return <ReviewPanel />;
    if (panel === "preview") return <PreviewPanel />;
    return (
      <div className="h-[320px]">
        <TerminalPane />
      </div>
    );
  }

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-[344px] max-w-[92vw] flex-col border-l border-white/10 bg-[#080b11]">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-white/10 px-2">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {PANEL_ORDER.map((panel) => (
            <button
              key={panel}
              type="button"
              onClick={() => setPanel(panel)}
              className={`shrink-0 rounded px-1.5 py-1 font-mono text-[10px] transition ${
                panel === activePanel
                  ? "bg-white/[0.07] text-white/90"
                  : "text-white/35 hover:text-white/70"
              }`}
            >
              {PANEL_LABELS[panel]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPanel(null)}
          aria-label="Close panel"
          className="shrink-0 rounded px-1.5 py-1 font-mono text-[11px] text-white/30 hover:text-rose-300"
        >
          ×
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">{body(activePanel)}</div>
    </aside>
  );
}