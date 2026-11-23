"use client";
// app/coding/components/TopBar.tsx
// The command strip: identity, agent mode, sandbox, one-click panels.

import { AGENT_MODES, PANEL_LABELS, useWorkspace } from "../../lib/coding/store";
import type { PanelId } from "../../lib/coding/store";

const QUICK_PANELS: PanelId[] = [
  "search",
  "changes",
  "problems",
  "tests",
  "terminal",
  "preview",
  "git",
];

export default function TopBar() {
  const project = useWorkspace((state) => state.project);
  const mode = useWorkspace((state) => state.mode);
  const setMode = useWorkspace((state) => state.setMode);
  const sandboxId = useWorkspace((state) => state.sandboxId);
  const booting = useWorkspace((state) => state.booting);
  const bootError = useWorkspace((state) => state.bootError);
  const activePanel = useWorkspace((state) => state.activePanel);
  const panelOpen = useWorkspace((state) => state.panelOpen);
  const togglePanel = useWorkspace((state) => state.togglePanel);
  const bootstrap = useWorkspace((state) => state.bootstrap);
  const loadProject = useWorkspace((state) => state.loadProject);
  const loadTree = useWorkspace((state) => state.loadTree);
  const refreshProblems = useWorkspace((state) => state.refreshProblems);
  const loadChanges = useWorkspace((state) => state.loadChanges);
  const loadGit = useWorkspace((state) => state.loadGit);

  const activeMode = AGENT_MODES.find((entry) => entry.id === mode) ?? AGENT_MODES[0];

  async function rescan() {
    await loadProject();
    await loadTree();
    void refreshProblems();
    void loadChanges();
    void loadGit();
  }

  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b border-white/10 bg-[#070a10] px-3">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-indigo-400 to-cyan-400 text-[11px] font-black text-[#05070c]">
          G
        </span>
        <div className="leading-tight">
          <p className="text-[12px] font-semibold tracking-tight text-white/90">Gyra</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
            coding
          </p>
        </div>
      </div>

      <span className="h-5 w-px bg-white/10" />

      <div className="min-w-0">
        <p className="truncate text-[11.5px] text-white/75">
          {project?.name || project?.root || "no project snapshot"}
        </p>
        <p className="truncate font-mono text-[9.5px] text-white/30">
          {project
            ? `${project.framework} · ${project.language} · ${project.packageManager} · ${project.files} files`
            : "run a scan to read the sandbox"}
        </p>
      </div>

      <div className="ml-2 flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] p-1">
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as typeof mode)}
          aria-label="Agent mode"
          className="rounded bg-transparent px-1.5 py-0.5 text-[11px] text-white/80 outline-none"
        >
          {AGENT_MODES.map((entry) => (
            <option key={entry.id} value={entry.id} className="bg-[#0b0f16] text-white">
              {entry.label}
            </option>
          ))}
        </select>
        <span className="hidden font-mono text-[9.5px] text-white/25 lg:inline">
          {activeMode.hint}
        </span>
      </div>

      <nav className="ml-auto flex items-center gap-1">
        {QUICK_PANELS.map((panel) => {
          const isActive = panelOpen && activePanel === panel;
          return (
            <button
              key={panel}
              type="button"
              onClick={() => togglePanel(panel)}
              aria-pressed={isActive}
              className={`rounded-md border px-2 py-1 font-mono text-[10px] transition ${
                isActive
                  ? "border-indigo-400/40 bg-indigo-400/15 text-indigo-200"
                  : "border-white/10 bg-white/[0.02] text-white/45 hover:border-white/20 hover:text-white/80"
              }`}
            >
              {PANEL_LABELS[panel]}
            </button>
          );
        })}
      </nav>

      <span className="h-5 w-px bg-white/10" />

      <button
        type="button"
        onClick={() => void rescan()}
        disabled={!sandboxId}
        className="rounded-md border border-white/10 bg-white/[0.02] px-2 py-1 font-mono text-[10px] text-white/55 transition hover:border-white/20 hover:text-white/90 disabled:opacity-40"
      >
        rescan
      </button>

      <button
        type="button"
        onClick={() => void bootstrap()}
        disabled={booting}
        className={`rounded-md px-2 py-1 font-mono text-[10px] transition ${
          bootError
            ? "border border-rose-400/40 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
            : sandboxId
              ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : "border border-white/10 bg-white/[0.03] text-white/60 hover:text-white/90"
        } disabled:opacity-50`}
        title={bootError ?? sandboxId ?? "Start the sandbox"}
      >
        {booting ? "starting…" : bootError ? "retry sandbox" : sandboxId ? "sandbox on" : "start sandbox"}
      </button>
    </header>
  );
}