"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2, SquareTerminal } from "lucide-react";
import type { TerminalLine } from "@/app/lib/coding/types";

interface Props {
  lines: TerminalLine[];
  running: boolean;
  onRun: (command: string) => void;
  onStop: () => void;
}

export default function TerminalPane({ lines, running, onRun, onStop }: Props) {
  const [command, setCommand] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines.length, running]);

  return (
    <div className="flex h-full flex-col bg-[#08080a]">
      <div className="flex-1 overflow-y-auto px-3 py-3 font-mono text-[12px] leading-relaxed">
        <p className="mb-3 text-[11px] text-gray-600">bash · /home/user</p>

        {lines.length === 0 ? (
          <p className="text-gray-700">
            Run anything: <span className="text-gray-500">npm run build</span>,{" "}
            <span className="text-gray-500">git status</span>,{" "}
            <span className="text-gray-500">curl -s localhost:3000</span>
          </p>
        ) : (
          lines.map((line) => {
            if (line.kind === "command") {
              return (
                <div key={line.id} className="mt-2 text-indigo-300">
                  <span className="text-emerald-400">$ </span>
                  {line.text}
                </div>
              );
            }
            if (line.kind === "stderr") {
              return (
                <pre key={line.id} className="whitespace-pre-wrap text-red-400">
                  {line.text}
                </pre>
              );
            }
            if (line.kind === "exit") {
              return (
                <div
                  key={line.id}
                  className={`mt-1 mb-2 text-[11px] ${
                    line.text === "0" ? "text-emerald-500" : "text-amber-500"
                  }`}
                >
                  exit {line.text}
                </div>
              );
            }
            return (
              <pre key={line.id} className="whitespace-pre-wrap text-gray-300">
                {line.text}
              </pre>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!command.trim() || running) return;
          onRun(command.trim());
          setCommand("");
        }}
        className="flex items-center gap-2 border-t border-white/5 bg-[#0d0d0f] px-3 py-2"
      >
        <SquareTerminal size={13} className="text-gray-500" />
        <input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          placeholder="Enter a command"
          spellCheck={false}
          className="flex-1 bg-transparent font-mono text-[12px] text-gray-200 placeholder-gray-600 outline-none"
        />
        {running ? (
          <button
            type="button"
            onClick={onStop}
            className="flex items-center gap-1 rounded bg-red-500/15 px-2 py-1 text-[11px] text-red-300 hover:bg-red-500/25"
          >
            <Loader2 size={11} className="animate-spin" /> stop
          </button>
        ) : (
          <span className="text-[10px] text-gray-600">enter</span>
        )}
      </form>
    </div>
  );
}