"use client";

import { useState } from "react";
import { useChat } from "ai/react";

export default function CodingWorkspace() {
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/coding",
    body: { sandboxId },
    onResponse: (response) => {
      // Capture the sandbox ID from the response headers (we will add this later)
    }
  });

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* LEFT PANEL: Agent Chat */}
      <div className="w-1/2 border-r border-zinc-800 flex flex-col p-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-400">Gyra Coding Agent</h1>
        
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`p-4 rounded-xl ${m.role === "user" ? "bg-zinc-900 border border-zinc-800" : "bg-blue-950/20 border border-blue-900/30"}`}>
              <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">{m.role}</p>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
              
              {/* Render Tool Calls */}
              {m.toolInvocations?.map((tool) => (
                <div key={tool.toolCallId} className="mt-2 text-xs font-mono bg-black p-2 rounded border border-zinc-800 text-zinc-400">
                  <span className="text-blue-400">[{tool.toolName}]</span> 
                  {tool.state === "result" ? (
                    <pre className="mt-1 text-green-400 overflow-x-auto">{JSON.stringify(tool.result, null, 2).substring(0, 300)}...</pre>
                  ) : (
                    <span className="ml-2 animate-pulse">Running...</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask Gyra to build something..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50"
          >
            Run
          </button>
        </form>
      </div>

      {/* RIGHT PANEL: The Real Sandbox (Terminal & Files) */}
      <div className="w-1/2 bg-[#09090b] p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-300">Sandbox Environment</h2>
          <span className="text-xs font-mono text-zinc-500">
            {sandboxId ? `ID: ${sandboxId.substring(0, 8)}...` : "No sandbox active"}
          </span>
        </div>
        
        <div className="flex-1 bg-black border border-zinc-800 rounded-xl p-4 font-mono text-sm text-zinc-400 overflow-y-auto">
           <p className="text-zinc-600 mb-2">$ Waiting for agent to execute commands...</p>
           {/* 
             In the next step, we will stream the actual terminal output here 
             using a shared state or a websocket.
           */}
        </div>
      </div>
    </div>
  );
}