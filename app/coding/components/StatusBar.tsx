"use client";
// app/coding/components/StatusBar.tsx
// Always-on truth about the workspace: sandbox, branch, problems, cursor.

import { useWorkspace } from "@/app/lib/coding/store";

export default function StatusBar() {
  const sandboxId = useWorkspace((state) => state.sandboxId);
  const project = useWorkspace((state) => state.project);
  const problems = useWorkspace((state) => state.problems);
  const activePath = useWorkspace((state) => state.activePath);
  const openFiles = useWorkspace((state) => state.openFiles);
  const cursor = useWorkspace((state) => state.cursor);
  const status = useWorkspace((state) => state.status);
  const running = useWorkspace((state) => state.running);
  const booting = useWorkspace((state) => state.booting);
  const bootError = useWorkspace((state) => state.bootError);

  const errors = problems.filter((problem) => problem.severity === "error").length;
  const warnings = problems.filter((problem) => problem.severity === "warning").length;
  const active = openFiles.find((file) => file.path === activePath) ?? null;
  const dirtyCount = openFiles.filter((file) => file.dirty).length;

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-white/10 bg-[#07090f] px-3 text-[10.5px] text-white/40">
      <span
        className={`flex items-center gap-1.5 ${
          bootError ? "text-rose-300" : sandboxId ? "text-emerald-300" : "text-amber-300"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            bootError ? "bg-rose-400" : sandboxId ? "bg-emerald-400" : "bg-amber-400"
          }`}
        />
        {bootError ? "sandbox failed" : sandboxId ? "sandbox live" : booting ? "starting" : "no sandbox"}
      </span>

      {project?.gitBranch ? (
        <span className="text-white/55">⑂ {project.gitBranch}</span>
      ) : null}

      <span className={errors > 0 ? "text-rose-300" : ""}>
        {errors} error{errors === 1 ? "" : "s"}
      </span>
      <span className={warnings > 0 ? "text-amber-300" : ""}>
        {warnings} warning{warnings === 1 ? "" : "s"}
      </span>

      {dirtyCount > 0 ? (
        <span className="text-cyan-300">{dirtyCount} unsaved</span>
      ) : null}

      <span className="truncate">{running ? "agent working…" : status}</span>

      <span className="ml-auto flex items-center gap-3">
        {active ? (
          <>
            <span className="text-white/55">{active.language}</span>
            <span>
              Ln {cursor.line}, Col {cursor.column}
            </span>
            <span className="max-w-[220px] truncate text-white/30">{active.path}</span>
          </>
        ) : (
          <span className="text-white/25">no file open</span>
        )}
        {sandboxId ? (
          <span className="hidden text-white/20 lg:inline">{sandboxId.slice(0, 10)}</span>
        ) : null}
      </span>
    </footer>
  );
}