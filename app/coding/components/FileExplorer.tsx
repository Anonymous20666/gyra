"use client";

import React, { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  Folder,
  FolderOpen,
  FilePlus2,
  FolderPlus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import type { FileNode } from "@/app/lib/coding/types";

interface Props {
  tree: FileNode[];
  activePath: string | null;
  onOpen: (path: string) => void;
  onRefresh: () => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onDelete: (path: string) => void;
}

function matches(node: FileNode, query: string): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  if (node.name.toLowerCase().includes(needle)) return true;
  return (node.children ?? []).some((child) => matches(child, query));
}

export default function FileExplorer({
  tree,
  activePath,
  onOpen,
  onRefresh,
  onCreateFile,
  onCreateFolder,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const filter = (nodes: FileNode[]): FileNode[] =>
      nodes.filter((node) => matches(node, query)).map((node) => ({
        ...node,
        children: node.children ? filter(node.children) : undefined,
      }));
    return query ? filter(tree) : tree;
  }, [tree, query]);

  const toggle = (path: string) =>
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));

  const renderNodes = (nodes: FileNode[], depth = 0): React.ReactNode =>
    nodes.map((node) => {
      const isOpen = query ? true : expanded[node.path] ?? depth === 0;
      const isActive = activePath === node.path;

      if (node.type === "dir") {
        return (
          <div key={node.path}>
            <div
              className="group flex items-center gap-1.5 rounded px-1.5 py-1 text-[13px] text-gray-300 hover:bg-white/5 cursor-pointer"
              style={{ paddingLeft: 6 + depth * 12 }}
              onClick={() => toggle(node.path)}
            >
              {isOpen ? (
                <ChevronDown size={13} className="text-gray-500 shrink-0" />
              ) : (
                <ChevronRight size={13} className="text-gray-500 shrink-0" />
              )}
              {isOpen ? (
                <FolderOpen size={13} className="text-indigo-400 shrink-0" />
              ) : (
                <Folder size={13} className="text-indigo-400/70 shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(node.path);
                }}
                className="ml-auto opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
            {isOpen && node.children ? renderNodes(node.children, depth + 1) : null}
          </div>
        );
      }

      return (
        <div
          key={node.path}
          onClick={() => onOpen(node.path)}
          className={`group flex items-center gap-1.5 rounded px-1.5 py-1 text-[13px] cursor-pointer ${
            isActive
              ? "bg-indigo-500/15 text-indigo-200"
              : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
          }`}
          style={{ paddingLeft: 6 + depth * 12 }}
        >
          <FileCode2
            size={13}
            className={isActive ? "text-indigo-400 shrink-0" : "text-gray-500 shrink-0"}
          />
          <span className="truncate">{node.name}</span>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDelete(node.path);
            }}
            className="ml-auto opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      );
    });

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/5 bg-[#0d0d0f]">
      <div className="flex items-center justify-between px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
        Explorer
        <div className="flex items-center gap-2">
          <button onClick={onCreateFile} title="New file" className="hover:text-indigo-300">
            <FilePlus2 size={13} />
          </button>
          <button onClick={onCreateFolder} title="New folder" className="hover:text-indigo-300">
            <FolderPlus size={13} />
          </button>
          <button onClick={onRefresh} title="Refresh" className="hover:text-indigo-300">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="px-2 pb-2">
        <div className="flex items-center gap-1.5 rounded-md border border-white/5 bg-white/[0.03] px-2 py-1.5">
          <Search size={12} className="text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find file"
            className="w-full bg-transparent text-[12px] text-gray-200 placeholder-gray-600 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-4">
        {visible.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-gray-600">
            {tree.length === 0 ? "Sandbox is empty." : "No matching files."}
          </p>
        ) : (
          renderNodes(visible)
        )}
      </div>
    </aside>
  );
}