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
  const [addMode, setAddMode] = useState<"file" | "url" | "text">("text");

  // Studio State
  const [isGenerating, setIsGenerating] = useState(false);

  // --- FETCH ALL NOTEBOOK DATA ON LOAD ---
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      // 1. Fetch Notebook Details
      const { data: nb } = await supabase
        .from("notebooks")
        .select("*")
        .eq("id", notebookId)
        .single();
      
      if (!nb) {
        alert("Notebook not found or you don't have permission.");
        return router.push("/notebooks");
      }
      setNotebook(nb);

      // 2. Fetch Sources
      const { data: src } = await supabase
        .from("notebook_sources")
        .select("*")
        .eq("notebook_id", notebookId)
        .order("created_at", { ascending: false });
      setSources(src || []);

      // 3. Fetch Chat History
      const { data: msg } = await supabase
        .from("notebook_messages")
        .select("*")
        .eq("notebook_id", notebookId)
        .order("created_at", { ascending: true });
      setMessages(msg || []);

      // 4. Fetch Studio Outputs
      const { data: std } = await supabase
        .from("notebook_studio")
        .select("*")
        .eq("notebook_id", notebookId)
        .order("created_at", { ascending: false });
      setStudioOutputs(std || []);

      setLoading(false);
    };
    if (notebookId) fetchData();
  }, [notebookId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- SOURCES HANDLERS ---
  const handleAddSource = async () => {
    if (addMode === "file") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".txt,.md,.csv"; // PDF needs backend parsing
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        
        const text = await file.text();
        
        const { data } = await supabase.from("notebook_sources").insert([{
          notebook_id: notebookId, name: file.name, type: file.type || "file", content: text.substring(0, 50000), status: "ready"
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
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsChatting(true);

    await supabase.from("notebook_messages").insert([{ notebook_id: notebookId, role: "user", content: input }]);

    try {
      const res = await fetch("/api/notebooks/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookId, messages: updatedMessages })
      });

      if (!res.ok) throw new Error("Failed to fetch chat");
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";
      let buffer = "";
      
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const dataStr = line.slice(5).trim();
          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);
            
            if (parsed.type === "content") {
              fullReply += parsed.text;
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1].content = fullReply;
                return next;
              });
            }
          } catch (e) {
            console.error("Error parsing SSE:", e);
          }
        }
      }

      await supabase.from("notebook_messages").insert([{ notebook_id: notebookId, role: "assistant", content: fullReply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Error connecting to AI. Please check your API route." }]);
    } finally {
      setIsChatting(false);
    }
  };

  // --- STUDIO HANDLER ---
  const generateStudioOutput = async (type: string) => {
    if (sources.length === 0) return alert("Add sources first to generate outputs.");
    setIsGenerating(true);
    
    try {
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
      } else {
        alert("Failed to generate output.");
      }
    } catch (e) {
      alert("Error generating studio output.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-4 border-[#3b82f6] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[#94a3b8]">Loading notebook workspace...</p>
    </div>
  );

  return (
    <main className="h-screen bg-[#0a0a0f] text-[#f1f5f9] flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="border-b border-[#1e293b] p-4 flex flex-col md:flex-row items-center justify-between bg-[#14141c] shrink-0 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={() => router.push("/notebooks")} className="text-[#94a3b8] hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back
          </button>
          <div className="h-4 w-px bg-[#1e293b] hidden md:block"></div>
          <h1 className="font-bold text-lg truncate max-w-[200px] md:max-w-md">{notebook?.title}</h1>
        </div>
        
        {/* Tab Switcher */}
        <div className="bg-[#0a0a0f] p-1 rounded-full border border-[#1e293b] flex items-center gap-1 w-full md:w-auto justify-center">
          {["sources", "chat", "studio"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 md:px-6 py-1.5 rounded-full text-sm font-medium capitalize transition-all flex-1 md:flex-none ${activeTab === tab ? "bg-[#3b82f6] text-white shadow-md" : "text-[#94a3b8] hover:text-white"}`}
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
          <div className="h-full overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <h2 className="text-2xl font-bold">Notebook Sources <span className="text-sm font-normal text-[#64748b] ml-2 bg-[#14141c] px-2 py-1 rounded-md border border-[#1e293b]">{sources.length} items</span></h2>
              <div className="flex bg-[#14141c] rounded-lg border border-[#1e293b] p-1 w-full md:w-auto">
                {["file", "url", "text"].map(m => (
                  <button key={m} onClick={() => setAddMode(m as any)} className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-xs capitalize transition-colors ${addMode === m ? "bg-[#1e293b] text-white" : "text-[#94a3b8] hover:text-white"}`}>{m}</button>
                ))}
              </div>
            </div>

            {/* Add Source UI */}
            <div className="mb-8 p-6 bg-[#14141c] border border-[#1e293b] border-dashed rounded-2xl flex flex-col items-center justify-center text-center">
              {addMode === "file" && (
                <>
                  <div className="w-12 h-12 bg-[#1e293b] rounded-full flex items-center justify-center mb-4 text-xl">📄</div>
                  <button onClick={handleAddSource} disabled={isUploading} className="bg-[#3b82f6] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50">
                    {isUploading ? "Uploading & Indexing..." : "Browse Files (TXT, MD, CSV)"}
                  </button>
                  <p className="text-xs text-[#64748b] mt-3">PDF support requires backend parsing.</p>
                </>
              )}
              {addMode === "url" && (
                <div className="flex flex-col md:flex-row w-full max-w-lg gap-2">
                  <input type="text" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com/article" className="flex-1 bg-[#0a0a0f] border border-[#1e293b] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3b82f6] text-white" />
                  <button onClick={handleAddSource} disabled={isUploading || !urlInput} className="bg-[#3b82f6] text-white px-6 py-3 rounded-xl text-sm font-medium disabled:opacity-50">Add URL</button>
                </div>
              )}
              {addMode === "text" && (
                <div className="flex flex-col w-full max-w-lg gap-3">
                  <input type="text" value={textName} onChange={(e) => setTextName(e.target.value)} placeholder="Note Title (e.g., Bible Study Notes)" className="bg-[#0a0a0f] border border-[#1e293b] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3b82f6] text-white" />
                  <textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} placeholder="Paste or type your text here..." rows={5} className="bg-[#0a0a0f] border border-[#1e293b] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3b82f6] resize-none text-white" />
                  <button onClick={handleAddSource} disabled={isUploading || !textContent || !textName} className="bg-[#3b82f6] text-white px-4 py-3 rounded-xl text-sm font-medium disabled:opacity-50">
                    {isUploading ? "Saving..." : "Save Note to Notebook"}
                  </button>
                </div>
              )}
            </div>

            {/* Source List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Saved Items</h3>
              {sources.length === 0 ? (
                <p className="text-sm text-[#64748b] italic">No sources added yet. Everything you add will appear here permanently.</p>
              ) : (
                sources.map((src) => (
                  <div key={src.id} className="flex items-center justify-between p-4 bg-[#14141c] border border-[#1e293b] rounded-xl hover:border-[#3b82f6]/30 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-[#1e293b] flex items-center justify-center text-lg shrink-0">
                        {src.type.includes("pdf") ? "📄" : src.type === "url" ? "🌐" : "📝"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-[200px] md:max-w-md">{src.name}</p>
                        <div className="flex items-center gap-2 text-xs text-[#64748b]">
                          <span className="flex items-center gap-1 text-[#14b8a6]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#14b8a6]"></span> Indexed
                          </span>
                          <span>•</span>
                          <span>{new Date(src.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => removeSource(src.id)} className="text-[#64748b] hover:text-red-400 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg hover:bg-red-400/10 shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-[#64748b]">
                  <div className="w-16 h-16 bg-[#14141c] border border-[#1e293b] rounded-2xl flex items-center justify-center mb-4 text-2xl">💬</div>
                  <h2 className="text-lg font-semibold text-white mb-1">Notebook Chat</h2>
                  <p className="text-sm max-w-xs text-center">Ask a question, and Gyra will answer based strictly on the sources you've added.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[90%] md:max-w-[85%] p-4 rounded-3xl ${msg.role === "user" ? "bg-[#3b82f6] text-white rounded-br-sm" : "bg-[#14141c] border border-[#1e293b] text-white rounded-bl-sm"}`}>
                    <div className="prose prose-invert max-w-none text-[15px] leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isChatting && messages[messages.length - 1]?.role === "user" && (
                 <div className="flex items-start">
                   <div className="bg-[#14141c] border border-[#1e293b] p-4 rounded-3xl rounded-tl-sm flex gap-1">
                     <div className="w-2 h-2 bg-[#64748b] rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-[#64748b] rounded-full animate-bounce [animation-delay:-.15s]"></div>
                     <div className="w-2 h-2 bg-[#64748b] rounded-full animate-bounce [animation-delay:-.3s]"></div>
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 border-t border-[#1e293b] bg-[#0a0a0f]">
              <div className="flex items-center gap-2 bg-[#14141c] border border-[#1e293b] rounded-[24px] p-2 pr-3 focus-within:border-[#3b82f6] transition-colors">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Ask a question or create something..."
                  className="flex-1 bg-transparent px-3 text-[15px] outline-none text-white placeholder:text-[#64748b]"
                />
                <button onClick={sendMessage} disabled={isChatting || !input.trim()} className="w-10 h-10 rounded-full bg-[#3b82f6] flex items-center justify-center disabled:opacity-50 hover:bg-blue-500 transition-colors shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STUDIO TAB */}
        {activeTab === "studio" && (
          <div className="h-full overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold">Studio</h2>
                <p className="text-sm text-[#94a3b8] mt-1">Generate structured content from your sources.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Summary", "FAQ", "Study Guide", "Report"].map(type => (
                  <button key={type} onClick={() => generateStudioOutput(type)} disabled={isGenerating} className="bg-[#14141c] border border-[#1e293b] hover:border-[#3b82f6] hover:text-white text-[#94a3b8] text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2">
                    {isGenerating ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            {studioOutputs.length === 0 ? (
              <div className="text-center py-20 text-[#64748b] bg-[#14141c] border border-[#1e293b] rounded-3xl border-dashed">
                <span className="text-4xl mb-4 block">✨</span>
                <p className="text-white font-medium mb-1">No outputs yet</p>
                <p className="text-sm">Click a button above to generate a summary, FAQ, or report.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studioOutputs.map(out => (
                  <div key={out.id} className="bg-[#14141c] border border-[#1e293b] rounded-2xl p-6 hover:border-[#14b8a6]/50 transition-colors cursor-pointer group relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-[#14b8a6] bg-[#14b8a6]/10 px-2.5 py-1 rounded-md uppercase tracking-wider border border-[#14b8a6]/20">{out.type}</span>
                      <span className="text-xs text-[#64748b]">{new Date(out.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-white mb-2 truncate">{out.title}</h3>
                    <p className="text-sm text-[#94a3b8] line-clamp-4 leading-relaxed">{out.content}</p>
                    <div className="mt-6 text-sm text-[#3b82f6] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Read full output <span>→</span></div>
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