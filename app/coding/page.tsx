"use client";

import { useState } from "react";

export default function CodingWorkspace() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [sandboxId, setSandboxId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Add empty assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "", toolCalls: [] }]);

    try {
      const res = await fetch("/api/coding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], sandboxId }),
      });

      if (!res.body) throw new Error("No body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.slice(6).trim();
          if (dataStr === "[DONE]") break;
          
          try {
            const parsed = JSON.parse(dataStr);
            
            // Handle text streaming
            if (parsed.type === "text-delta") {
              fullReply += parsed.textDelta;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1].content = fullReply;
                return next;
              });
            }

            // Handle tool calls (Terminal commands)
            if (parsed.type === "tool-call") {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1].toolCalls = [
                  ...(next[next.length - 1].toolCalls || []),
                  { name: parsed.toolName, args: parsed.args }
                ];
                return next;
              });
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex overflow-hidden">
      
      {/* LEFT PANEL: Agent Chat (Glassmorphism) */}
      <div className="w-1/2 border-r border-zinc-800/50 flex flex-col bg-black/40 backdrop-blur-xl relative z-10">
        <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Gyra Workspace</h1>
            <p className="text-xs text-zinc-500">Autonomous Coding Agent</p>
          </div>
          <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-mono text-blue-400">
            {sandboxId ? "Sandbox Active" : "Ready"}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600">
              <span className="text-4xl mb-4">💻</span>
              <p className="text-sm">Ask Gyra to build something.</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-200"
              }`}>
                {m.content || (m.role === "assistant" && loading && <span className="animate-pulse">Thinking...</span>)}
              </div>
              
              {/* Tool Call UI */}
              {m.toolCalls?.map((tc: any, idx: number) => (
                <div key={idx} className="mt-2 bg-[#1e1e1e] border border-zinc-800 rounded-lg p-3 font-mono text-xs w-full max-w-[85%]">
                  <p className="text-blue-400 mb-1">⚙️ Running tool: {tc.name}</p>
                  <p className="text-zinc-500 truncate">{JSON.stringify(tc.args)}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800/50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Create a python script and run it..."
              className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition-colors"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              Run
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: The Real Terminal / File View */}
      <div className="w-1/2 bg-[#000000] flex flex-col relative">
        <div className="p-4 border-b border-zinc-800/50 flex items-center gap-2 bg-[#09090b]">
          <div className="w-3 h-3 rounded-full bg-red-500/20" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
          <div className="w-3 h-3 rounded-full bg-green-500/20" />
          <span className="ml-2 text-xs font-mono text-zinc-500">sandbox ~ terminal</span>
        </div>
        
        <div className="flex-1 p-4 font-mono text-sm text-green-400 overflow-y-auto">
           <p className="text-zinc-600 mb-4">// Terminal output will stream here</p>
           {messages.find(m => m.toolCalls?.length > 0)?.toolCalls?.map((tc: any, i: number) => (
              <div key={i} className="mb-2">
                <span className="text-blue-400">$ {tc.name}</span>
                <span className="text-zinc-500 ml-2">{JSON.stringify(tc.args)}</span>
              </div>
           ))}
        </div>
      </div>

    </div>
  );
}