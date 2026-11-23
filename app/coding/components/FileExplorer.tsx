"use client";
// app/coding/components/FileExplorer.tsx
// Real tree from /api/coding/files, with a right-click context menu.

import { useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useWorkspace } from "../../lib/coding/store";
import type { TreeNode } from "../../lib/coding/store";

interface MenuState {
  x: number;
  y: number;
  node: TreeNode;
}

export default function FileExplorer() {
  const tree = useWorkspace((state) => state.tree);
  const loading = useWorkspace((state) => state.treeLoading);
  const error = useWorkspace((state) => state.treeError);
  const loadTree = useWorkspace((state) => state.loadTree);
  const openFile = useWorkspace((state) => state.openFile);
  const openFiles = useWorkspace((state) => state.openFiles);
  const activePath = useWorkspace((state) => state.activePath);
  const pushActivity = useWorkspace((state) => state.pushActivity);

  const [expanded, setExpanded] = useState<Set<string>>(new Set(["", ".", "app"]));
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [newFileDir, setNewFileDir] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");

  useEffect(() => {
    if (!tree) void loadTree();
  }, [tree, loadTree]);

  useEffect(() => {
    if (!menu) return;
    function close() {
      setMenu(null);
    }
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu]);

  function toggle(path: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  async function writeFile(path: string) {
    try {
      const response = await fetch("/api/coding/files", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path, content: "", action: "write" }),
      });
      if (!response.ok) {
        pushActivity("error", "Create failed", `${path} → ${response.status}`);
        return;
      }
      pushActivity("success", "File created", path);
      await loadTree();
      await openFile(path);
    } catch (caught) {
      pushActivity("error", "Create failed", caught instanceof Error ? caught.message : "unknown");
    }
  }

  async function remove(path: string) {
    try {
      const response = await fetch("/api/coding/files", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path, action: "delete" }),
      });
      if (!response.ok) {
        pushActivity("error", "Delete failed", `${path} → ${response.status}`);
        return;
      }
      pushActivity("warning", "Deleted", path);
      await loadTree();
    } catch (caught) {
      pushActivity("error", "Delete failed", caught instanceof Error ? caught.message : "unknown");
    }
  }

  function onContextMenu(event: ReactMouseEvent, node: TreeNode) {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY, node });
  }

  function renderNode(node: TreeNode, depth: number) {
    const isDir = node.type === "directory";
    const isOpen = expanded.has(node.path);
    const isActive = node.path === activePath;
    const isOpenFile = openFiles.some((file) => file.path === node.path);

    return (
      <li key={node.path || node.name}>
        <button
          type="button"
          onClick={() => (isDir ? toggle(node.path) : void openFile(node.path))}
          onContextMenu={(event) => onContextMenu(event, node)}
          className={`flex w-full items-center gap-1 rounded px-1 py-[3px] text-left font-mono text-[11px] ${
            isActive
              ? "bg-indigo-400/15 text-indigo-100"
              : isOpenFile
                ? "text-white/80"
                : "text-white/45 hover:bg-white/[0.04] hover:text-white/80"
          }`}
          style={{ paddingLeft: `${depth * 10 + 4}px` }}
        >
          <span className="w-3 shrink-0 text-white/25">
            {isDir ? (isOpen ? "▾" : "▸") : "·"}
          </span>
          <span className="truncate">{node.name}</span>
        </button>

        {isDir && isOpen && node.children && node.children.length > 0 ? (
          <ul>{node.children.map((child) => renderNode(child, depth + 1))}</ul>
        ) : null}
      </li>
    );
  }

  return (
    <aside className="relative hidden w-60 shrink-0 flex-col border-r border-white/10 bg-[#070a10] md:flex">
      <div className="flex h-9 items-center justify-between border-b border-white/10 px-3">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-white/30">
          explorer
        </span>
        <button
          type="button"
          onClick={() => void loadTree()}
          className="font-mono text-[9.5px] text-white/25 hover:text-white/80"
        >
          {loading ? "…" : "refresh"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-1">
        {error ? (
          <p className="px-3 py-2 font-mono text-[10px] text-rose-300">{error}</p>
        ) : !tree ? (
          <p className="px-3 py-2 font-mono text-[10px] text-white/25">
            {loading ? "reading tree…" : "no tree yet"}
          </p>
        ) : (
          <ul>{renderNode(tree, 0)}</ul>
        )}
      </div>

      {newFileDir !== null ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const name = newFileName.trim();
            if (!name) return;
            const path = newFileDir ? `${newFileDir}/${name}` : name;
            setNewFileDir(null);
            setNewFileName("");
            void writeFile(path);
          }}
          className="border-t border-white/10 p-2"
        >
          <input
            autoFocus
            value={newFileName}
            onChange={(event) => setNewFileName(event.target.value)}
            placeholder="file name"
            spellCheck={false}
            className="w-full rounded border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-white/80 outline-none"
          />
        </form>
      ) : null}

      {menu ? (
        <div
          className="fixed z-50 w-44 overflow-hidden rounded-md border border-white/10 bg-[#0b0f16] py-1 shadow-xl"
          style={{ left: menu.x, top: menu.y }}
        >
          {menu.node.type === "file" ? (
            <button
              type="button"
              onClick={() => void openFile(menu.node.path)}
              className="block w-full px-3 py-1.5 text-left font-mono text-[10.5px] text-white/70 hover:bg-white/[0.05]"
            >
              Open
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              const dir = menu.node.type === "directory" ? menu.node.path : menu.node.path.split("/").slice(0, -1).join("/");
              setNewFileDir(dir);
            }}
            className="block w-full px-3 py-1.5 text-left font-mono text-[10.5px] text-white/70 hover:bg-white/[0.05]"
          >
            New file here
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                void navigator.clipboard.writeText(menu.node.path);
                pushActivity("info", "Copied path", menu.node.path);
              }
            }}
            className="block w-full px-3 py-1.5 text-left font-mono text-[10.5px] text-white/70 hover:bg-white/[0.05]"
          >
            Copy path
          </button>
          <button
            type="button"
            onClick={() => void remove(menu.node.path)}
            className="block w-full px-3 py-1.5 text-left font-mono text-[10.5px] text-rose-300 hover:bg-rose-400/10"
          >
            Delete
          </button>
        </div>
      ) : null}
    </aside>
  );
}