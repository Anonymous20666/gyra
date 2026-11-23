"use client";
// app/coding/components/EditorSurface.tsx
// Tabs, toolbar, editor, inline AI edit, diff view. One file, no editor library.

import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "../../lib/coding/store";

export default function EditorSurface() {
  const openFiles = useWorkspace((state) => state.openFiles);
  const activePath = useWorkspace((state) => state.activePath);
  const setActivePath = useWorkspace((state) => state.setActivePath);
  const closeFile = useWorkspace((state) => state.closeFile);
  const updateFileContent = useWorkspace((state) => state.updateFileContent);
  const saveFile = useWorkspace((state) => state.saveFile);
  const saving = useWorkspace((state) => state.saving);
  const setCursor = useWorkspace((state) => state.setCursor);
  const mode = useWorkspace((state) => state.mode);
  const changes = useWorkspace((state) => state.changes);
  const pushActivity = useWorkspace((state) => state.pushActivity);

  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [instruction, setInstruction] = useState("");
  const [inlineOpen, setInlineOpen] = useState(false);
  const [inlineBusy, setInlineBusy] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const editor = useRef<HTMLTextAreaElement | null>(null);

  const active = openFiles.find((file) => file.path === activePath) ?? null;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveFile();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setInlineOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveFile]);

  function trackCursor() {
    const node = editor.current;
    if (!node) return;
    setCursor({
      line: node.value.slice(0, node.selectionStart).split("\n").length,
      column: node.selectionStart - node.value.lastIndexOf("\n", node.selectionStart - 1),
    });
  }

  async function runInline() {
    if (!active || inlineBusy) return;
    const prompt = instruction.trim();
    if (!prompt) return;
    const start = selection.start;
    const end = selection.end > selection.start ? selection.end : selection.start;
    const target = active.content.slice(start, end) || active.content;
    setInlineBusy(true);
    try {
      const response = await fetch("/api/coding/inline", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          path: active.path,
          language: active.language,
          instruction: prompt,
          selection: target,
          mode,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const replacement =
        typeof data.text === "string"
          ? data.text
          : typeof data.replacement === "string"
            ? data.replacement
            : typeof data.output === "string"
              ? data.output
              : "";
      if (!replacement) {
        pushActivity(
          "error",
          "Inline edit failed",
          typeof data.error === "string" ? data.error : `status ${response.status}`
        );
        return;
      }
      const next =
        active.content.slice(0, start) + replacement + active.content.slice(end);
      updateFileContent(active.path, next);
      pushActivity("success", "Inline edit applied", active.path);
      setInstruction("");
      setInlineOpen(false);
    } catch (caught) {
      pushActivity("error", "Inline edit failed", caught instanceof Error ? caught.message : "unknown");
    } finally {
      setInlineBusy(false);
    }
  }

  return (
    <main className="relative flex min-w-0 flex-1 flex-col bg-[#05070c]">
      {/* tabs */}
      <div className="flex h-9 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-white/10 bg-[#070a10]">
        {openFiles.length === 0 ? (
          <span className="px-3 font-mono text-[10.5px] text-white/25">no open files</span>
        ) : (
          openFiles.map((file) => {
            const isActive = file.path === activePath;
            return (
              <div
                key={file.path}
                className={`group flex shrink-0 items-center gap-1.5 border-r border-white/5 px-2.5 py-1.5 font-mono text-[10.5px] ${
                  isActive
                    ? "bg-white/[0.05] text-white/90"
                    : "text-white/40 hover:bg-white/[0.02] hover:text-white/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActivePath(file.path)}
                  className="flex items-center gap-1.5"
                >
                  <span className="max-w-[180px] truncate">{file.name}</span>
                  {file.dirty ? <span className="h-1 w-1 rounded-full bg-amber-300" /> : null}
                </button>
                <button
                  type="button"
                  onClick={() => closeFile(file.path)}
                  aria-label={`Close ${file.name}`}
                  className="text-white/20 opacity-0 transition group-hover:opacity-100 hover:text-rose-300"
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* toolbar */}
      {active ? (
        <div className="flex h-8 shrink-0 items-center gap-2 border-b border-white/5 px-3">
          <span className="truncate font-mono text-[9.5px] text-white/25">{active.path}</span>
          <span className="font-mono text-[9.5px] text-white/20">{active.language}</span>
          {active.dirty ? <span className="font-mono text-[9.5px] text-amber-300">modified</span> : null}

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setInlineOpen((current) => !current)}
              className="rounded border border-white/10 px-2 py-0.5 font-mono text-[9.5px] text-white/50 hover:text-white/90"
            >
              inline ai
            </button>
            <button
              type="button"
              onClick={() => setDiffOpen((current) => !current)}
              className="rounded border border-white/10 px-2 py-0.5 font-mono text-[9.5px] text-white/50 hover:text-white/90"
            >
              diff
            </button>
            <button
              type="button"
              onClick={() => void saveFile(active.path)}
              disabled={saving || !active.dirty}
              className="rounded border border-white/10 px-2 py-0.5 font-mono text-[9.5px] text-white/50 hover:text-white/90 disabled:opacity-30"
            >
              {saving ? "saving…" : "save"}
            </button>
          </div>
        </div>
      ) : null}

      {/* inline edit */}
      {active && inlineOpen ? (
        <div className="shrink-0 border-b border-white/10 bg-[#080b11] p-2">
          <div className="flex items-center gap-2">
            <input
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder="tell gyra what to do with the selection…"
              className="w-full rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 font-mono text-[11px] text-white/85 outline-none placeholder:text-white/20"
            />
            <button
              type="button"
              onClick={() => void runInline()}
              disabled={inlineBusy || !instruction.trim()}
              className="shrink-0 rounded border border-indigo-400/40 bg-indigo-400/10 px-2.5 py-1 font-mono text-[10px] text-indigo-200 disabled:opacity-40"
            >
              {inlineBusy ? "…" : "rewrite"}
            </button>
          </div>
          <p className="mt-1 font-mono text-[9.5px] text-white/25">
            {selection.end > selection.start
              ? `${selection.end - selection.start} characters selected`
              : "no selection — the whole file is the target"}
          </p>
        </div>
      ) : null}

      {/* diff */}
      {diffOpen ? (
        <div className="max-h-40 shrink-0 overflow-auto border-b border-white/10 bg-[#080b11] p-2">
          {changes.length === 0 ? (
            <p className="font-mono text-[10px] text-white/30">no change sets to diff</p>
          ) : (
            changes.map((change) => (
              <div key={change.id} className="mb-1">
                <p className="font-mono text-[10px] text-white/60">
                  {change.title}{" "}
                  <span className="text-emerald-300/80">+{change.additions}</span>{" "}
                  <span className="text-rose-300/80">-{change.deletions}</span>
                </p>
                {change.files.map((file) => (
                  <p key={file.path} className="truncate font-mono text-[9.5px] text-white/35">
                    {file.status} {file.path} (+{file.additions}/-{file.deletions})
                  </p>
                ))}
              </div>
            ))
          )}
        </div>
      ) : null}

      {/* body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {!active ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="text-[15px] text-white/60">No file open</p>
            <p className="max-w-sm text-[11.5px] leading-relaxed text-white/30">
              Pick a file in the explorer, or ask the agent to create one.
            </p>
          </div>
        ) : active.loading ? (
          <div className="grid h-full place-items-center font-mono text-[11.5px] text-white/35">
            Loading {active.name}…
          </div>
        ) : active.error ? (
          <div className="grid h-full place-items-center px-8 text-center">
            <p className="font-mono text-[11.5px] text-rose-300">{active.error}</p>
          </div>
        ) : (
          <textarea
            ref={editor}
            value={active.content}
            onChange={(event) => updateFileContent(active.path, event.target.value)}
            onSelect={(event) =>
              setSelection({
                start: event.currentTarget.selectionStart,
                end: event.currentTarget.selectionEnd,
              })
            }
            onKeyUp={trackCursor}
            onClick={trackCursor}
            spellCheck={false}
            className="h-full w-full resize-none bg-[#05070c] px-4 py-3 font-mono text-[12px] leading-relaxed text-white/85 outline-none"
          />
        )}
      </div>
    </main>
  );
}