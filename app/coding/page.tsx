"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertCircle,
  Bot,
  CircleDot,
  ExternalLink,
  LayoutPanelLeft,
  ListChecks,
  Loader2,
  Play,
  RefreshCw,
  Save,
  SquareTerminal,
  X,
} from "lucide-react";
import FileExplorer from "./components/FileExplorer";
import AgentPanel from "./components/AgentPanel";
import TerminalPane from "./components/TerminalPane";
import { modeConfig } from "@/app/lib/coding/modes";
import { parseStreamLine, resultToText } from "@/app/lib/coding/stream";
import type {
  AgentMode,
  ChatMessageView,
  FileNode,
  ImplementationPlan,
  PanelTab,
  SandboxInfo,
  TerminalLine,
} from "@/app/lib/coding/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface OpenFile {
  path: string;
  content: string;
  dirty: boolean;
}

const STORAGE_KEY = "gyra.coding.sandbox";

function languageFor(path: string): string {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    css: "css",
    scss: "scss",
    html: "html",
    md: "markdown",
    py: "python",
    rs: "rust",
    go: "go",
    sh: "shell",
    yml: "yaml",
    yaml: "yaml",
    sql: "sql",
    env: "ini",
  };
  return map[extension] ?? "plaintext";
}

export default function CodingWorkspace() {
  const [session, setSession] = useState<SandboxInfo | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("agent");
  const [mode, setMode] = useState<AgentMode>("build");
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [loading, setLoading] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [terminalRunning, setTerminalRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<ImplementationPlan | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const terminalAbortRef = useRef<AbortController | null>(null);
  const sandboxIdRef = useRef<string | null>(null);

  const activeFile = openFiles.find((file) => file.path === activePath) ?? null;

  const flash = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2600);
  }, []);

  const loadTree = useCallback(async (sandboxId: string) => {
    try {
      const res = await fetch(`/api/coding/files?sandboxId=${encodeURIComponent(sandboxId)}`);
      const data = await res.json();
      if (data?.tree) setTree(data.tree as FileNode[]);
    } catch {
      // Tree refresh is best-effort.
    }
  }, []);

  const boot = useCallback(async () => {
    setSessionError(null);
    const stored = window.localStorage.getItem(STORAGE_KEY);
    try {
      const res = await fetch("/api/coding/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId: stored }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not start the sandbox.");

      sandboxIdRef.current = data.sandboxId;
      window.localStorage.setItem(STORAGE_KEY, data.sandboxId);
      setSession({
        sandboxId: data.sandboxId,
        previewUrl: data.previewUrl ?? "",
        root: data.root ?? "/home/user",
      });
      if (data.previewUrl) setPreviewUrl(data.previewUrl);
      setTree(data.tree ?? []);
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : "Could not start the sandbox.");
    }
  }, []);

  useEffect(() => {
    void boot();
  }, [boot]);

  const openFile = useCallback(
    async (path: string) => {
      setActivePath(path);
      if (openFiles.some((file) => file.path === path)) return;
      if (!sandboxIdRef.current) return;

      try {
        const res = await fetch(
          `/api/coding/files?sandboxId=${encodeURIComponent(sandboxIdRef.current)}&path=${encodeURIComponent(path)}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Could not open the file.");
        setOpenFiles((prev) => [...prev, { path, content: data.content ?? "", dirty: false }]);
      } catch (error) {
        flash(error instanceof Error ? error.message : "Could not open the file.");
        setActivePath(null);
      }
    },
    [openFiles, flash]
  );

  const updateActiveContent = useCallback(
    (content: string) => {
      if (!activePath) return;
      setOpenFiles((prev) =>
        prev.map((file) => (file.path === activePath ? { ...file, content, dirty: true } : file))
      );
    },
    [activePath]
  );

  const saveActiveFile = useCallback(async () => {
    if (!activeFile || !sandboxIdRef.current) return;
    try {
      const res = await fetch(`/api/coding/files?sandboxId=${encodeURIComponent(sandboxIdRef.current)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: activeFile.path, content: activeFile.content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not save.");
      setOpenFiles((prev) =>
        prev.map((file) => (file.path === activeFile.path ? { ...file, dirty: false } : file))
      );
      flash(`Saved ${activeFile.path}`);
    } catch (error) {
      flash(error instanceof Error ? error.message : "Could not save.");
    }
  }, [activeFile, flash]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveActiveFile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [saveActiveFile]);

  const createFile = useCallback(async () => {
    const path = window.prompt("New file path (e.g. src/components/Button.tsx)");
    if (!path || !sandboxIdRef.current) return;
    try {
      const res = await fetch(`/api/coding/files?sandboxId=${encodeURIComponent(sandboxIdRef.current)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not create the file.");
      await loadTree(sandboxIdRef.current);
      await openFile(path);
    } catch (error) {
      flash(error instanceof Error ? error.message : "Could not create the file.");
    }
  }, [loadTree, openFile, flash]);

  const createFolder = useCallback(async () => {
    const path = window.prompt("New folder path (e.g. src/lib)");
    if (!path || !sandboxIdRef.current) return;
    try {
      const res = await fetch(`/api/coding/files?sandboxId=${encodeURIComponent(sandboxIdRef.current)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) throw new Error((await res.json())?.error ?? "Could not create the folder.");
      await loadTree(sandboxIdRef.current);
    } catch (error) {
      flash(error instanceof Error ? error.message : "Could not create the folder.");
    }
  }, [loadTree, flash]);

  const deletePath = useCallback(
    async (path: string) => {
      if (!sandboxIdRef.current) return;
      if (!window.confirm(`Delete ${path}? This cannot be undone.`)) return;
      try {
        const res = await fetch(
          `/api/coding/files?sandboxId=${encodeURIComponent(sandboxIdRef.current)}&path=${encodeURIComponent(path)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error((await res.json())?.error ?? "Could not delete.");
        setOpenFiles((prev) => prev.filter((file) => !file.path.startsWith(path)));
        if (activePath?.startsWith(path)) setActivePath(null);
        await loadTree(sandboxIdRef.current);
      } catch (error) {
        flash(error instanceof Error ? error.message : "Could not delete.");
      }
    },
    [activePath, loadTree, flash]
  );

  const updateAssistant = useCallback(
    (id: string, updater: (message: ChatMessageView) => ChatMessageView) => {
      setMessages((prev) => prev.map((message) => (message.id === id ? updater(message) : message)));
    },
    []
  );

  const send = useCallback(
    async (text: string, overrideMode?: AgentMode) => {
      if (!sandboxIdRef.current) return;

      const userMessage: ChatMessageView = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text,
        tools: [],
      };
      const assistantId = `a-${Date.now()}`;
      const assistantMessage: ChatMessageView = {
        id: assistantId,
        role: "assistant",
        content: "",
        tools: [],
        plan: null,
      };

      const history = [...messages, userMessage].map((message) => ({
        role: message.role,
        content: message.content,
      }));

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setLoading(true);
      setPanelTab("agent");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/coding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            sandboxId: sandboxIdRef.current,
            mode: overrideMode ?? mode,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error ?? "The agent could not start.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const handleLine = (line: string) => {
          const event = parseStreamLine(line);
          if (!event) return;

          if (event.type === "text") {
            updateAssistant(assistantId, (message) => ({
              ...message,
              content: message.content + event.value,
            }));
            return;
          }

          if (event.type === "reasoning") {
            updateAssistant(assistantId, (message) => ({
              ...message,
              reasoning: (message.reasoning ?? "") + event.value,
            }));
            return;
          }

          if (event.type === "tool-call") {
            updateAssistant(assistantId, (message) => ({
              ...message,
              tools: [
                ...message.tools,
                {
                  id: event.id,
                  name: event.name,
                  args: event.args,
                  state: "running",
                  startedAt: Date.now(),
                },
              ],
            }));
            return;
          }

          if (event.type === "tool-result") {
            const text = resultToText(event.result);
            updateAssistant(assistantId, (message) => {
              const tools = message.tools.map((tool) =>
                tool.id === event.id
                  ? {
                      ...tool,
                      state: text.toLowerCase().includes("failed") ? "error" : "done",
                      result: text,
                      endedAt: Date.now(),
                    }
                  : tool
              );

              let plan = message.plan ?? null;
              if (event.name === "propose_plan") {
                try {
                  plan = JSON.parse(text) as ImplementationPlan;
                  setActivePlan(plan);
                  setPanelTab("plan");
                } catch {
                  // Ignore an unparsable plan payload.
                }
              }

              return { ...message, tools, plan } as ChatMessageView;
            });
            return;
          }

          if (event.type === "error") {
            updateAssistant(assistantId, (message) => ({ ...message, error: event.value }));
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          lines.forEach(handleLine);
        }
        if (buffer.trim()) handleLine(buffer);
      } catch (error) {
        const aborted = error instanceof DOMException && error.name === "AbortError";
        updateAssistant(assistantId, (message) => ({
          ...message,
          error: aborted
            ? "Stopped."
            : error instanceof Error
            ? error.message
            : "The agent stream failed.",
        }));
      } finally {
        setLoading(false);
        abortRef.current = null;
        if (sandboxIdRef.current) void loadTree(sandboxIdRef.current);
      }
    },
    [messages, mode, updateAssistant, loadTree]
  );

  const proceed = useCallback(
    (plan: ImplementationPlan) => {
      const brief = [
        "The plan is approved. Execute it now in Build mode.",
        `Goal: ${plan.goal}`,
        "Steps:",
        ...plan.steps.map((step, index) => `${index + 1}. ${step.title}`),
        "Verification:",
        ...plan.verification.map((item) => `- ${item}`),
        "Write the real files and run the verification. Do not re-plan.",
      ].join("\n");
      void send(brief, "build");
    },
    [send]
  );

  const runCommand = useCallback(
    async (command: string) => {
      if (!sandboxIdRef.current) return;
      const stamp = Date.now();
      setTerminalLines((prev) => [
        ...prev,
        { id: `c-${stamp}`, kind: "command", text: command },
      ]);
      setTerminalRunning(true);

      const controller = new AbortController();
      terminalAbortRef.current = controller;

      try {
        const res = await fetch("/api/coding/terminal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command, sandboxId: sandboxIdRef.current }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error("The terminal could not start.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const handleLine = (line: string) => {
          if (!line.trim()) return;
          try {
            const event = JSON.parse(line) as {
              type: string;
              data?: string;
              code?: number;
              sandboxId?: string;
            };
            if (event.type === "stdout" && event.data) {
              setTerminalLines((prev) => [
                ...prev,
                { id: `o-${Date.now()}-${Math.random()}`, kind: "stdout", text: event.data as string },
              ]);
            } else if (event.type === "stderr" && event.data) {
              setTerminalLines((prev) => [
                ...prev,
                { id: `e-${Date.now()}-${Math.random()}`, kind: "stderr", text: event.data as string },
              ]);
            } else if (event.type === "exit") {
              setTerminalLines((prev) => [
                ...prev,
                { id: `x-${Date.now()}-${Math.random()}`, kind: "exit", text: String(event.code ?? 0) },
              ]);
            }
          } catch {
            // Skip malformed chunks.
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          lines.forEach(handleLine);
        }
        if (buffer.trim()) handleLine(buffer);

        if (sandboxIdRef.current) void loadTree(sandboxIdRef.current);
      } catch (error) {
        const aborted = error instanceof DOMException && error.name === "AbortError";
        if (!aborted) {
          setTerminalLines((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              kind: "stderr",
              text: error instanceof Error ? error.message : "Command failed.",
            },
          ]);
        }
      } finally {
        setTerminalRunning(false);
        terminalAbortRef.current = null;
      }
    },
    [loadTree]
  );

  const startPreview = useCallback(async () => {
    if (!sandboxIdRef.current) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch("/api/coding/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId: sandboxIdRef.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not start the preview.");
      setPreviewUrl(`${data.url}?t=${Date.now()}`);
      if (!data.ready) setPreviewError("The server is still booting. Give it a few seconds and refresh.");
      setPanelTab("preview");
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "Could not start the preview.");
      setPanelTab("preview");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const closeTab = (path: string) => {
    setOpenFiles((prev) => prev.filter((file) => file.path !== path));
    if (activePath === path) {
      const remaining = openFiles.filter((file) => file.path !== path);
      setActivePath(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  };

  const tabs: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    { id: "agent", label: "Agent", icon: <Bot size={12} /> },
    { id: "plan", label: "Plan", icon: <ListChecks size={12} /> },
    { id: "terminal", label: "Terminal", icon: <SquareTerminal size={12} /> },
    { id: "preview", label: "Preview", icon: <LayoutPanelLeft size={12} /> },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#08080a] font-sans text-white">
      <header className="z-10 flex items-center justify-between border-b border-white/5 bg-[#0d0d0f] px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-indigo-400">
            <Bot size={16} /> GYRA CODE
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5 text-[12px] text-gray-300">
            gyra-workspace
            <CircleDot size={10} className="text-emerald-500" />
            <span className="text-gray-500">main</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {notice && (
            <span className="hidden text-[11px] text-indigo-300 sm:block">{notice}</span>
          )}
          <div
            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${
              session
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : sessionError
                ? "border-red-500/20 bg-red-500/10 text-red-400"
                : "border-amber-500/20 bg-amber-500/10 text-amber-400"
            }`}
          >
            {session
              ? `E2B ${session.sandboxId.slice(0, 8)}`
              : sessionError
              ? "sandbox error"
              : "connecting…"}
          </div>
          <button
            onClick={() => activeFile && void saveActiveFile()}
            disabled={!activeFile?.dirty}
            className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-gray-300 hover:bg-white/[0.07] disabled:opacity-40"
          >
            <Save size={12} /> Save
          </button>
          <button
            onClick={() => void startPreview()}
            className="flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/20"
          >
            {previewLoading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
            Run
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <FileExplorer
          tree={tree}
          activePath={activePath}
          onOpen={(path) => void openFile(path)}
          onRefresh={() => sandboxIdRef.current && void loadTree(sandboxIdRef.current)}
          onCreateFile={() => void createFile()}
          onCreateFolder={() => void createFolder()}
          onDelete={(path) => void deletePath(path)}
        />

        <main className="flex min-w-0 flex-1 flex-col bg-[#111113]">
          <div className="flex items-center overflow-x-auto border-b border-white/5 bg-[#0d0d0f]">
            {openFiles.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-gray-600">No file open</div>
            ) : (
              openFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => setActivePath(file.path)}
                  className={`group flex shrink-0 cursor-pointer items-center gap-1.5 border-r border-white/5 px-3 py-2 text-[11px] ${
                    activePath === file.path
                      ? "border-t-2 border-t-indigo-500 bg-[#111113] text-gray-100"
                      : "text-gray-500 hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="max-w-[180px] truncate">{file.path.split("/").pop()}</span>
                  {file.dirty && <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />}
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTab(file.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))
            )}
            {activeFile?.dirty && (
              <span className="ml-auto px-3 text-[10px] text-gray-600">unsaved</span>
            )}
          </div>

          <div className="relative flex-1">
            {!session && !sessionError && (
              <div className="flex h-full items-center justify-center gap-2 text-[12px] text-gray-500">
                <Loader2 size={14} className="animate-spin" /> Starting your sandbox…
              </div>
            )}

            {sessionError && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <AlertCircle size={22} className="text-red-400" />
                <p className="max-w-sm text-[12px] text-gray-400">{sessionError}</p>
                <button
                  onClick={() => void boot()}
                  className="flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-white/5"
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}

            {session && !activeFile && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Bot size={28} className="text-indigo-400/30" />
                <p className="text-[12px] text-gray-500">Pick a file on the left, or ask Forge to build one.</p>
                <p className="font-mono text-[10px] text-gray-700">{session.root}</p>
              </div>
            )}

            {session && activeFile && (
              <MonacoEditor
                height="100%"
                path={activeFile.path}
                language={languageFor(activeFile.path)}
                theme="vs-dark"
                value={activeFile.content}
                onChange={(value) => updateActiveContent(value ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  wordWrap: "on",
                  padding: { top: 12 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  tabSize: 2,
                }}
              />
            )}
          </div>
        </main>

        <aside className="flex w-[440px] shrink-0 flex-col border-l border-white/5 bg-[#0a0a0c]">
          <div className="flex border-b border-white/5 bg-[#0d0d0f]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPanelTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-[10px] font-medium uppercase tracking-[0.12em] transition ${
                  panelTab === tab.id
                    ? "border-b-2 border-indigo-500 bg-indigo-500/[0.06] text-indigo-300"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {panelTab === "agent" && (
              <AgentPanel
                messages={messages}
                loading={loading}
                mode={mode}
                onModeChange={setMode}
                onSubmit={(text) => void send(text)}
                onStop={() => abortRef.current?.abort()}
                onProceed={proceed}
                onOpenPlan={() => setPanelTab("plan")}
              />
            )}

            {panelTab === "plan" && (
              <div className="h-full overflow-y-auto px-3 py-3">
                {!activePlan ? (
                  <div className="mt-10 text-center">
                    <ListChecks size={26} className="mx-auto mb-2 text-indigo-400/30" />
                    <p className="text-[12px] text-gray-500">No plan yet.</p>
                    <p className="mt-1 text-[11px] text-gray-600">
                      Switch the agent to Plan mode and describe the feature.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-gray-600">goal</p>
                      <p className="mt-1 text-[12.5px] text-gray-200">{activePlan.goal}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-gray-600">steps</p>
                      <ol className="mt-1 space-y-2">
                        {activePlan.steps.map((step, index) => (
                          <li key={index} className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2">
                            <p className="text-[12px] text-gray-200">
                              <span className="mr-1 text-indigo-400">{index + 1}.</span>
                              {step.title}
                            </p>
                            {step.detail && (
                              <p className="mt-0.5 text-[11px] text-gray-500">{step.detail}</p>
                            )}
                            {step.files?.length ? (
                              <p className="mt-1 font-mono text-[10px] text-gray-600">
                                {step.files.join(" · ")}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-gray-600">verification</p>
                      <ul className="mt-1 space-y-1">
                        {activePlan.verification.map((item, index) => (
                          <li key={index} className="text-[11.5px] text-gray-400">
                            · {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => proceed(activePlan)}
                      disabled={loading}
                      className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-indigo-500 disabled:opacity-40"
                    >
                      Proceed with build
                    </button>
                  </div>
                )}
              </div>
            )}

            {panelTab === "terminal" && (
              <TerminalPane
                lines={terminalLines}
                running={terminalRunning}
                onRun={(command) => void runCommand(command)}
                onStop={() => terminalAbortRef.current?.abort()}
              />
            )}

            {panelTab === "preview" && (
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
                  <span className="flex-1 truncate font-mono text-[10px] text-gray-500">
                    {previewUrl || "no server running"}
                  </span>
                  {previewUrl && (
                    <button
                      onClick={() => setPreviewUrl((url) => `${url.split("?")[0]}?t=${Date.now()}`)}
                      className="text-gray-500 hover:text-indigo-300"
                      title="Reload"
                    >
                      <RefreshCw size={12} />
                    </button>
                  )}
                  {previewUrl && (
                    <a
                      href={previewUrl.split("?")[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-500 hover:text-indigo-300"
                      title="Open in a new tab"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {previewError && (
                  <p className="border-b border-white/5 px-3 py-2 text-[11px] text-amber-400">
                    {previewError}
                  </p>
                )}

                {previewUrl ? (
                  <iframe
                    src={previewUrl}
                    title="Sandbox preview"
                    className="flex-1 bg-white"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
                    <Play size={22} className="text-gray-700" />
                    <p className="text-[11px] text-gray-600">
                      Press Run to detect the framework and start the dev server.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      <footer className="flex items-center justify-between border-t border-white/5 bg-[#0d0d0f] px-3 py-1 text-[10px] text-gray-600">
        <div className="flex items-center gap-3">
          <span>{modeConfig(mode).label} mode</span>
          <span>{tree.length} entries</span>
          <span>{openFiles.length} open</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono">{session?.sandboxId.slice(0, 12) ?? "—"}</span>
          <span>Ctrl/Cmd + S to save</span>
        </div>
      </footer>
    </div>
  );
}