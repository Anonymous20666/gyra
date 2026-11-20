// ### app/coding/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { 
  FolderTree, 
  Terminal, 
  Bot, 
  Play, 
  Share2, 
  Settings, 
  GitBranch,
  ChevronRight,
  Code2,
  AlertCircle,
  FileCode2,
  FolderOpen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Tab = "agent" | "terminal" | "problems" | "output";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCalls?: any[];
  toolResults?: any[];
}

export default function CodingWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>("agent");
  const [activeFile, setActiveFile] = useState("index.js");
  const [code, setCode] = useState("// Gyra Coding Agent Workspace\n// Waiting for instructions...\n");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sandboxId, setSandboxId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "", toolCalls: [] }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/coding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], sandboxId }),
      });

      // Capture the Sandbox ID to maintain session
      const newSandboxId = res.headers.get("X-Sandbox-Id");
      if (newSandboxId && !sandboxId) setSandboxId(newSandboxId);

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
          if (dataStr === "[DONE]") continue;
          
          try {
            const parsed = JSON.parse(dataStr);
            
            if (parsed.type === "text-delta") {
              fullReply += parsed.textDelta;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1].content = fullReply;
                return next;
              });
            }

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

            if (parsed.type === "tool-result") {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1].toolResults = [
                  ...(next[next.length - 1].toolResults || []),
                  { name: parsed.toolName, result: parsed.result }
                ];
                return next;
              });
              // If it's a terminal command, switch to terminal tab to show output
              if (parsed.toolName === "execute_terminal") {
                setActiveTab("terminal");
              }
            }
          } catch (err) {}
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Mock file tree for UI purposes (This will eventually be populated by E2B list_directory)
  const files = [
    { name: "src", type: "folder", children: ["app.js", "bot.js", "commands.js", "database.js"] },
    { name: "package.json", type: "file" },
    { name: "README.md", type: "file" },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#111111] border-b border-gray-800 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-wider">
            <Bot size={20} /> GYRA CODE
          </div>
          <div className="h-4 w-px bg-gray-700" />
          <div className="text-sm font-medium text-gray-300 flex items-center gap-2">
            gyra-workspace <GitBranch size={14} className="text-gray-500" /> main
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 text-[10px] font-mono rounded-full border ${sandboxId ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"}`}>
            {sandboxId ? "E2B Sandbox Active" : "Connecting..."}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 rounded-md hover:bg-green-500/20 transition">
            <Play size={14} /> Run
          </button>
        </div>
      </header>

      {/* MAIN SPLIT VIEW */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT: File Explorer */}
        <aside className="w-60 bg-[#0f0f0f] border-r border-gray-800 flex flex-col">
          <div className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
            Explorer
            <FolderTree size={14} />
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-1">
            {files.map((folder) => (
              <div key={folder.name} className="mb-1">
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-800/50 rounded cursor-pointer">
                  <ChevronRight size={14} className="text-gray-500" />
                  {folder.name}
                </div>
                {folder.children && (
                  <div className="ml-4 border-l border-gray-800 pl-2">
                    {folder.children.map((file) => (
                      <div 
                        key={file} 
                        onClick={() => setActiveFile(file)}
                        className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer ${activeFile === file ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-400 hover:bg-gray-800/50'}`}
                      >
                        <FileCode2 size={14} className={activeFile === file ? 'text-indigo-400' : 'text-gray-500'} />
                        {file}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER: Code Editor */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          <div className="flex items-center bg-[#0f0f0f] border-b border-gray-800 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] text-gray-200 border-r border-gray-800 border-t-2 border-t-indigo-500">
              <FileCode2 size={14} className="text-indigo-400" />
              {activeFile}
            </div>
          </div>
          <div className="flex-1 relative">
            <MonacoEditor
              height="100%"
              language={activeFile.endsWith('.js') ? 'javascript' : 'json'}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                padding: { top: 16 },
                fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </main>

        {/* RIGHT: Agent & Terminal Panel */}
        <aside className="w-[450px] bg-[#0a0a0a] border-l border-gray-800 flex flex-col">
          
          {/* Panel Tabs */}
          <div className="flex border-b border-gray-800 bg-[#0f0f0f]">
            {(["agent", "terminal", "problems", "output"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              
              {/* AGENT TAB */}
              {activeTab === "agent" && (
                <motion.div 
                  key="agent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full space-y-4 pb-4"
                >
                  {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                      <Bot size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="text-sm">I am Forge, your Gyra Coding Agent.</p>
                      <p className="text-xs mt-2 text-gray-600">I can read files, write code, and execute terminal commands in a secure E2B sandbox.</p>
                    </div>
                  )}
                  
                  {messages.map((m, i) => (
                    <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{m.role}</span>
                      
                      <div className={`px-3 py-2 rounded-lg text-sm max-w-[95%] whitespace-pre-wrap ${
                        m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-[#1a1a1a] text-gray-200 border border-gray-800'
                      }`}>
                        {m.content || (m.role === 'assistant' && loading && i === messages.length - 1 && (
                          <span className="animate-pulse text-indigo-400">Forge is thinking...</span>
                        ))}
                      </div>

                      {/* Tool Calls */}
                      {m.toolCalls?.map((tc, idx) => (
                        <div key={idx} className="mt-2 bg-[#121212] border border-gray-800 rounded-lg p-3 font-mono text-xs w-full max-w-[95%]">
                          <p className="text-blue-400 mb-1 flex items-center gap-2"><Settings size={12} /> Executing: {tc.name}</p>
                          <p className="text-gray-500 break-all">{JSON.stringify(tc.args)}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </motion.div>
              )}

              {/* TERMINAL TAB */}
              {activeTab === "terminal" && (
                <motion.div 
                  key="terminal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full font-mono text-sm text-gray-300"
                >
                  <div className="mb-2 text-gray-500">$ bash (E2B Sandbox)</div>
                  {messages.flatMap((m) => m.toolResults || []).filter((tr) => tr.name === "execute_terminal").map((tr, i) => (
                    <div key={i} className="mb-4">
                       <div className="text-blue-400">$ {tr.result?.command || "command"}</div>
                       <pre className="text-gray-300 whitespace-pre-wrap">{tr.result?.stdout || tr.result}</pre>
                       {tr.result?.stderr && <pre className="text-red-400 whitespace-pre-wrap">{tr.result?.stderr}</pre>}
                    </div>
                  ))}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-green-500">➜</span>
                    <span className="text-blue-400">~/workspace</span>
                    <span className="w-2 h-4 bg-gray-500 animate-pulse" />
                  </div>
                </motion.div>
              )}

              {/* PROBLEMS TAB */}
              {activeTab === "problems" && (
                <motion.div 
                  key="problems"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-gray-400"
                >
                  <div className="flex items-center gap-2 text-gray-500 mb-4">
                    <AlertCircle size={16} /> No problems detected.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Agent Input Area */}
          {activeTab === "agent" && (
            <div className="p-4 border-t border-gray-800 bg-[#0f0f0f]">
              <form onSubmit={handleSubmit} className="relative flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Forge to build or fix something..."
                  className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}