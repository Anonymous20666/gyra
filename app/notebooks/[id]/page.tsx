"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function NotebookWorkspace() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params.id as string;

  const [notebook, setNotebook] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"sources" | "chat" | "studio">("sources");
  const [loading, setLoading] = useState(true);

  // Data States
  const [sources, setSources] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [studioOutputs, setStudioOutputs] = useState<any[]>([]);

  // Chat State
  const [input, setInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Source State
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [textName, setTextName] = useState("");
  const [textContent, setTextContent] = useState("");
  const [addMode, setAddMode] = useState<"file" | "url" | "text">("file");

  // Studio State
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: nb } = await supabase.from("notebooks").select("*").eq("id", notebookId).single();
      setNotebook(nb);

      const { data: src } = await supabase.from("notebook_sources").select("*").eq("notebook_id", notebookId).order("created_at", { ascending: false });
      setSources(src || []);

      const { data: msg } = await supabase.from("notebook_messages").select("*").eq("notebook_id", notebookId).order("created_at", { ascending: true });
      setMessages(msg || []);

      const { data: std } = await supabase.from("notebook_studio").select("*").eq("notebook_id", notebookId).order("created_at", { ascending: false });
      setStudioOutputs(std || []);

      setLoading(false);
    };
    fetchData();
  }, [notebookId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- SOURCES HANDLERS ---
  const handleAddSource = async () => {
    if (addMode === "file") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,.txt,.md,.csv";
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        
        // Simulating text extraction. In production, use a PDF parser like pdf-parse.
        const text = await file.text(); 
        
        const { data } = await supabase.from("notebook_sources").insert([{
          notebook_id: notebookId, name: file.name, type: file.type, content: text.substring(0, 50000), status: "ready"
        }]).select().single();

        if (data) setSources([data, ...sources]);
        setIsUploading(false);
      };
      input.click();
    } else if (addMode === "url") {
      if (!urlInput.trim()) return;
      setIsUploading(true);
      const { data } = await supabase.from("notebook_sources").insert([{
        notebook_id: notebookId, name: urlInput, type: "url", url: urlInput, content: "URL content indexed (simulated)", status: "ready"
      }]).select().single();
      if (data) setSources([data, ...sources]);
      setUrlInput("");
      setIsUploading(false);
    } else {
      if (!textContent.trim() || !textName.trim()) return;
      setIsUploading(true);
      const { data } = await supabase.from("notebook_sources").insert([{
        notebook_id: notebookId, name: textName, type: "text", content: textContent, status: "ready"
      }]).select().single();
      if (data) setSources([data, ...sources]);
      setTextContent(""); setTextName("");
      setIsUploading(false);
    }
  };

  const removeSource = async (id: string) => {
    await supabase.from("notebook_sources").delete().eq("id", id);
    setSources(sources.filter(s => s.id !== id));
  };

  // --- CHAT HANDLER ---
  const sendMessage = async () => {
    if (!input.trim() || isChatting) return;
    
    const userMsg = { role: "user", content: input };
    setMessages([...messages, userMsg]);
    setInput("");
    setIsChatting(true);

    await supabase.from("notebook_messages").insert([{ notebook_id: notebookId, role: "user", content: input }]);

    // Call AI
    const res = await fetch("/api/notebooks/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notebookId, messages: [...messages, userMsg] })
    });

    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullReply = "";
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullReply += chunk;
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1].content = fullReply;
        return next;
      });
    }

    await supabase.from("notebook_messages").insert([{ notebook_id: notebookId, role: "assistant", content: fullReply }]);
    setIsChatting(false);
  };

  // --- STUDIO HANDLER ---
  const generateStudioOutput = async (type: string) => {
    if (sources.length === 0) return alert("Add sources first to generate outputs.");
    setIsGenerating(true);
    
    const res = await fetch("/api/notebooks/studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notebookId, type })
    });
    
    const data = await res.json();
    if (data.output) {
      const { data: saved } = await supabase.from("notebook_studio").insert([{
        notebook_id: notebookId, title: `${type} - ${new Date().toLocaleDateString()}`, type, content: data.output
      }]).select().single();
      if (saved) setStudioOutputs([saved, ...studioOutputs]);
    }
    setIsGenerating(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Loading workspace...</div>;

  return (
    <main className="h-screen bg-[#0a0a0f] text-[#f1f5f9] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-[#1e293b] p-4 flex items-center justify-between bg-[#14141c] shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/notebooks")} className="text-[#94a3b8] hover:text-white transition-colors">← Back</button>
          <h1 className="font-bold text-lg">{notebook?.title}</h1>
        </div>
        {/* Tab Switcher */}
        <div className="bg-[#0a0a0f] p-1 rounded-full border border-[#1e293b] flex items-center gap-1">
          {["sources", "chat", "studio"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${activeTab === tab ? "bg-[#3b82f6] text-white shadow-md" : "text-[#94a3b8] hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* SOURCES TAB */}
        {activeTab === "sources" && (
          <div className="h-full overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Notebook Sources <span className="text-sm font-normal text-[#64748b] ml-2">{sources.length} items</span></h2>
              <div className="flex bg-[#14141c] rounded-lg border border-[#1e293b] p-1">
                {["file", "url", "text"].map(m => (
                  <button key={m} onClick={() => setAddMode(m as any)} className={`px-3 py-1 rounded-md text-xs capitalize ${addMode === m ? "bg-[#1e293b] text-white" : "text-[#94a3b8]"}`}>{m}</button>
                ))}
              </div>
            </div>

            {/* Add Source UI */}
            <div className="mb-8 p-6 bg-[#14141c] border border-[#1e293b] border-dashed rounded-2xl flex flex-col items-center justify-center text-center">
              {addMode === "file" && (
                <>
                  <button onClick={handleAddSource} disabled={isUploading} className="bg-[#3b82f6] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-500 transition-colors">
                    {isUploading ? "Uploading..." : "Browse Files (PDF, TXT, MD)"}
                  </button>
                  <p className="text-xs text-[#64748b] mt-2">or drag and drop files here</p>
                </>
              )}
              {addMode === "url" && (
                <div className="flex w-full max-w-md gap-2">
                  <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com/article" className="flex-1 bg-[#0a0a0f] border border-[#1e293b] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#3b82f6]" />
                  <button onClick={handleAddSource} disabled={isUploading} className="bg-[#3b82f6] text-white px-4 py-2 rounded-xl text-sm font-medium">Add</button>
                </div>
              )}
              {addMode === "text" && (
                <div className="flex flex-col w-full max-w-md gap-2">
                  <input type="text" value={textName} onChange={(e) => setTextName(e.target.value)} placeholder="Note Title" className="bg-[#0a0a0f] border border-[#1e293b] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#3b82f6]" />
                  <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Paste text here..." rows={4} className="bg-[#0a0a0f] border border-[#1e293b] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#3b82f6] resize-none" />
                  <button onClick={handleAddSource} disabled={isUploading} className="bg-[#3b82f6] text-white px-4 py-2 rounded-xl text-sm font-medium">Save Note</button>
                </div>
              )}
            </div>

            {/* Source List */}
            <div className="space-y-3">
              {sources.map((src) => (
                <div key={src.id} className="flex items-center justify-between p-4 bg-[#14141c] border border-[#1e293b] rounded-xl hover:border-[#3b82f6]/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1e293b] flex items-center justify-center text-lg">
                      {src.type.includes("pdf") ? "📄" : src.type === "url" ? "🌐" : "📝"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-[300px] md:max-w-md">{src.name}</p>
                      <p className="text-xs text-[#64748b]">{src.status === "ready" ? "Indexed" : "Processing..."}</p>
                    </div>
                  </div>
                  <button onClick={() => removeSource(src.id)} className="text-[#64748b] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <div className="h-full flex flex-col max-w-4xl mx-auto">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-[#64748b]">
                  <span className="text-4xl mb-4">💬</span>
                  <p>Ask a question based on your sources.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === "user" ? "bg-[#3b82f6] text-white" : "bg-[#14141c] border border-[#1e293b]"}`}>
                    <div className="prose prose-invert max-w-none text-sm">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-[#1e293b] bg-[#0a0a0f]">
              <div className="flex items-center gap-2 bg-[#14141c] border border-[#1e293b] rounded-2xl p-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask a question or create something..."
                  className="flex-1 bg-transparent px-3 text-sm outline-none text-white placeholder:text-[#64748b]"
                />
                <button onClick={sendMessage} disabled={isChatting || !input.trim()} className="w-9 h-9 rounded-xl bg-[#3b82f6] flex items-center justify-center disabled:opacity-50 hover:bg-blue-500 transition-colors">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STUDIO TAB */}
        {activeTab === "studio" && (
          <div className="h-full overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Studio Outputs</h2>
              <div className="flex gap-2">
                {["Summary", "FAQ", "Study Guide", "Report"].map(type => (
                  <button key={type} onClick={() => generateStudioOutput(type)} disabled={isGenerating} className="bg-[#14141c] border border-[#1e293b] hover:border-[#3b82f6] text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                    {isGenerating ? "..." : `+ ${type}`}
                  </button>
                ))}
              </div>
            </div>
            
            {studioOutputs.length === 0 ? (
              <div className="text-center py-20 text-[#64748b]">
                <span className="text-4xl mb-4 block">✨</span>
                <p>Generate a summary, FAQ, or report from your sources.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studioOutputs.map(out => (
                  <div key={out.id} className="bg-[#14141c] border border-[#1e293b] rounded-2xl p-6 hover:border-[#14b8a6]/50 transition-colors cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-[#14b8a6] uppercase tracking-wider">{out.type}</span>
                      <span className="text-xs text-[#64748b]">{new Date(out.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-white mb-2">{out.title}</h3>
                    <p className="text-sm text-[#94a3b8] line-clamp-3">{out.content}</p>
                    <div className="mt-4 text-xs text-[#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity">Read full output →</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}