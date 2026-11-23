"use client";

/**
 * coding.gyra.ng — workspace shell.
 *
 * This file is intentionally a frame, not a workshop. It mounts the six
 * surfaces that do the work and starts the sandbox session on first paint.
 * It imports nothing from the store, so it cannot break the build if the
 * store's helper names change.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import TopBar from "./components/TopBar";
import StatusBar from "./components/StatusBar";
import FileExplorer from "./components/FileExplorer";
import EditorSurface from "./components/EditorSurface";
import TerminalPane from "./components/TerminalPane";
import AgentCockpit from "./components/AgentCockpit";
import PanelHost from "./components/PanelHost";

type SessionResponse = {
  sandboxId?: string;
  sessionId?: string;
  id?: string;
  error?: string;
  message?: string;
};

export default function CodingPage() {
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const started = useRef(false);

  const startSession = useCallback(async () => {
    setBooting(true);
    setBootError(null);

    try {
      const response = await fetch("/api/coding/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as SessionResponse;

      if (!response.ok) {
        throw new Error(
          payload.error ||
            payload.message ||
            `Session failed (${response.status})`,
        );
      }

      const id = payload.sandboxId ?? payload.sessionId ?? payload.id ?? "";

      if (!id) {
        setBootError("Sandbox started without an id.");
      } else {
        setSandboxId(id);
      }
    } catch (error) {
      setBootError(
        error instanceof Error ? error.message : "Could not start the sandbox.",
      );
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void startSession();
  }, [startSession]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      <TopBar />

      {bootError ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-red-900/60 bg-red-950/40 px-4 py-1.5 text-[12px] text-red-200">
          <span className="truncate">{bootError}</span>
          <button
            type="button"
            onClick={() => {
              started.current = true;
              void startSession();
            }}
            className="shrink-0 rounded border border-red-800 px-2 py-0.5 text-[11px] hover:bg-red-900/50"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <FileExplorer />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <EditorSurface />
          </div>
          <div className="h-[240px] shrink-0 border-t border-neutral-800">
            <TerminalPane />
          </div>
        </div>

        <AgentCockpit />
      </div>

      <PanelHost />

      <div
        className="flex h-6 shrink-0 items-center justify-between border-t border-neutral-800 bg-neutral-900 px-3 text-[11px] text-neutral-400"
        title={sandboxId ? `Sandbox ${sandboxId}` : "No sandbox session"}
      >
        <span>
          {booting
            ? "Starting sandbox…"
            : bootError
              ? "Sandbox offline"
              : sandboxId
                ? `Sandbox ${sandboxId.slice(0, 12)}`
                : "Sandbox ready"}
        </span>
        <span className="text-neutral-500">coding.gyra.ng</span>
      </div>

      <StatusBar />
    </div>
  );
}