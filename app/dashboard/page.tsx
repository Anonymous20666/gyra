"use client";

import Link from "next/link";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AttachmentMenu from "../components/AttachmentMenu";
import GyraMark from "../components/GyraMark";
import SettingsPanel from "../components/SettingsPanel";
import VoiceMode from "../components/VoiceMode";
import VoiceOutput from "../components/VoiceOutput";
import { supabase } from "../supabase";
import { 
  Terminal, Settings, BookOpen, Folder, Bot, 
  Paperclip, Zap, Search, Image as ImageIcon, 
  FileText, Mic, MapPin, MoreHorizontal, Sparkles,
  Volume2, ThumbsUp, ThumbsDown, Copy, RotateCcw, Share2,
  Briefcase, Code, Heart, Home, Globe, Camera
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

// Map icons for projects
const ICON_MAP: any = {
  Folder: <Folder className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  Code: <Code className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Book: <BookOpen className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  Home: <Home className="w-4 h-4" />,
  Globe: <Globe className="w-4 h-4" />,
  Camera: <Camera className="w-4 h-4" />,
};

// ============================================================
// MessageContent — Advanced Markdown Renderer (Mobile Fixed)
// ============================================================
function MessageContent({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-[15px] text-zinc-100 leading-[1.7] w-full max-w-full overflow-hidden break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (!inline && match) {
              return (
                <div className="bg-[#1e1e1e] border border-zinc-700 rounded-xl overflow-hidden my-4 shadow-lg w-full max-w-full">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-[#252526]">
                    <span className="text-xs text-zinc-400 font-mono font-semibold uppercase">{match[1]}</span>
                    <button
                      onClick={() => copyToClipboard(codeString)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 rounded-md transition-colors"
                    >
                      {copied ? "✓ Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <SyntaxHighlighter
                      style={vscDarkPlus as any}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{ margin: 0, padding: "1.25rem", background: "transparent", fontSize: "13px" }}
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                </div>
              );
            }
            return (
              <code className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-sm font-mono whitespace-pre-wrap break-all" {...props}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="w-full overflow-x-auto my-6 border border-zinc-800 rounded-lg block">
                <table className="w-full min-w-[500px] text-left text-sm text-zinc-300">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-zinc-900 border-b border-zinc-800 text-white">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-4 py-3 font-semibold whitespace-nowrap">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-3 border-b border-zinc-800/50">{children}</td>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-bold text-white mt-6 mb-3 flex items-center gap-2 break-words">{children}</h3>;
          },
          p({ children }) {
            return <p className="mb-4 break-words">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-6 mb-4 space-y-2 break-words">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 mb-4 space-y-2 break-words">{children}</ol>;
          },
          li({ children }) {
            return <li className="break-words">{children}</li>;
          },
          strong({ children }) {
            return <strong className="font-semibold text-white">{children}</strong>;
          }
        }}
      >
        {content.replace(/\[GENERATE_IMAGE:\s*".+?"\]/g, "")}
      </ReactMarkdown>
    </div>
  );
}

// ============================================================
// Dashboard Content Component
// ============================================================
function DashboardContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [user, setUser] = useState<any>(null);
  const [project, setProject] = useState<any>(null); 
  const [showToS, setShowToS] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const [subscription, setSubscription] = useState<{
    plan: string;
    status: string;
    expiresAt: string | null;
    isSuperGyra: boolean;
  } | null>(null);

  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeChatMenu, setActiveChatMenu] = useState<string | null>(null);

  const [thinkMode, setThinkMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [recentImages, setRecentImages] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<{
    base64: string;
    type: "image" | "file";
    name: string;
    status: "checking" | "valid" | "nsfw";
  } | null>(null);

  const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const voiceReplyResolverRef = useRef<((reply: string | null) => void) | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<any[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ============================================================
  // ONE-SHOT ENTRY PROMPT (landing composer handoff)
  // The landing composer stores {text, ts} in sessionStorage.
  // Consume it once (10-min freshness) -> new chat + send.
  // ============================================================
  const entryHandledRef = useRef(false);
  useEffect(() => {
    if (entryHandledRef.current || !user) return;
    entryHandledRef.current = true;
    let entry: string | null = null;
    try {
      const raw = window.sessionStorage.getItem("gyra_entry_prompt");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.text === "string" && Date.now() - Number(parsed.ts || 0) < 10 * 60 * 1000) {
          entry = parsed.text;
        }
        window.sessionStorage.removeItem("gyra_entry_prompt");
      }
    } catch {}
    if (!entry) return;
    const t = setTimeout(async () => {
      try {
        await createNewChat();
        await new Promise((r) => setTimeout(r, 400));
        await sendMessage(entry!);
      } catch {}
    }, 900);
    return () => clearTimeout(t);
  }, [user]);

  // ============================================================
  // INIT
  // ============================================================
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (token) {
            const res = await fetch("/api/v1/subscription/status", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const sub = await res.json();
              setSubscription(sub);
            }
          }
        } catch {}

        if (projectId) {
          const { data: projData } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single();
          if (projData) setProject(projData);
        }

        let query = supabase
          .from("chats")
          .select("*")
          .eq("user_id", user.id)
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (projectId) {
          query = query.eq("project_id", projectId);
        } else {
          query = query.is("project_id", null); 
        }

        const { data: chatsData } = await query;

        if (chatsData) {
          setChats(chatsData);
          
          const specificChatId = searchParams.get("chat");
          
          if (specificChatId) {
            setActiveChatId(specificChatId);
            await loadMessages(specificChatId);
          } else if (chatsData.length > 0) {
            setActiveChatId(chatsData[0].id);
            await loadMessages(chatsData[0].id);
          }
        }
      }

      try {
        const { data: bc } = await supabase
          .from("broadcasts")
          .select("*")
          .eq("active", true)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1);
        if (bc && bc[0]) setActiveBroadcast(bc[0]);
      } catch (e) {}
    };
    init();
  }, [projectId, searchParams]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ============================================================
  // MESSAGE LOADING
  // ============================================================
  const loadMessages = async (chatId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data.map((m: any) => ({ 
        role: m.role, 
        content: m.content,
        generatedImage: m.generated_image || null 
      })));
    }
  };

  const createNewChat = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chats")
      .insert([{ 
        user_id: user.id, 
        title: "New Conversation",
        project_id: projectId || null 
      }])
      .select()
      .single();
    if (data) {
      setChats([data, ...chats]);
      setActiveChatId(data.id);
      setMessages([]);
      setIsSidebarOpen(false);
    }
  };

  const selectChat = async (id: string) => {
    setActiveChatId(id);
    setMessages([]);
    setIsSidebarOpen(false);
    await loadMessages(id);
  };

  // ============================================================
  // ATTACHMENT HANDLERS
  // ============================================================
  const processImage = async (base64: string, name: string, type: "image" | "file") => {
    if (type === "image") {
      setRecentImages(prev => {
        const newList = [base64, ...prev.filter(img => img !== base64)];
        return newList.slice(0, 5);
      });
    }

    setAttachment({ base64, type, name, status: "checking" });
    setShowAttachMenu(false);

    if (type === "image") {
      try {
        const res = await fetch("/api/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const data = await res.json();

        if (!data.safe) {
          setAttachment({ base64, type, name, status: "nsfw" });
          return;
        }
      } catch (e) {}
    }
    
    setAttachment({ base64, type, name, status: "valid" });
  };

  const handleCamera = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => processImage(reader.result as string, file.name, "image");
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleGallery = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => processImage(reader.result as string, file.name, "image");
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleFiles = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.txt,.csv,.json,.md,.xlsx,.pptx";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => processImage(reader.result as string, file.name, "file");
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // ============================================================
  // CORE CHAT SENDER (6-Agent Pipeline)
  // ============================================================
  const runChat = async (
    text: string,
    imageBase64?: string,
    fileBase64?: string
  ) => {
    if (!text.trim() && !imageBase64 && !fileBase64) return;
    if (attachment?.status === "nsfw") return;

    let chatId = activeChatId;
    let isNewChat = false;

    if (!chatId) {
      if (!user) return;
      const { data } = await supabase
        .from("chats")
        .insert([{ 
          user_id: user.id, 
          title: "New Conversation",
          project_id: projectId || null 
        }])
        .select()
        .single();
      if (!data) return;
      setChats([data, ...chats]);
      setActiveChatId(data.id);
      chatId = data.id;
      isNewChat = true;
    }

    const userMessage: any = { role: "user", content: text.trim() };
    if (imageBase64) userMessage.imageBase64 = imageBase64;
    if (fileBase64) userMessage.fileBase64 = fileBase64;

    const updatedMessages = [...messagesRef.current, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    await supabase
      .from("messages")
      .insert([{ chat_id: chatId, role: "user", content: text.trim() }]);

    if (isNewChat) {
      fetch("/api/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text || "Analyzed an image" }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.title) {
          supabase.from("chats").update({ title: data.title }).eq("id", chatId).then();
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: data.title } : c));
        }
      });
    }

    setMessages([
      ...updatedMessages,
      { role: "assistant", content: "", reasoning: "", reasoningTime: 0, searchStatus: null, searchCount: 0, generatedImage: null, agentLogs: [] },
    ]);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-gyra-user-token": token } : {}) },
        body: JSON.stringify({
          messages: updatedMessages.map((m: any) => ({ role: m.role, content: m.content, imageBase64: m.imageBase64, fileBase64: m.fileBase64 })),
          think: thinkMode,
          search: searchMode,
          projectInstructions: project?.instructions || null 
        }),
      });

      if (res.status === 402) { setLoading(false); setMessages((prev) => prev.slice(0, -1)); setShowLimitModal(true); return; }
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";
      let generatedImageUrl = "";
      let buffer = "";
      let startTime = Date.now();

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
            
            if (parsed.type === "status") {
              setMessages((prev) => {
                const next = [...prev];
                const currentMsg = next[next.length - 1];
                currentMsg.agentLogs = [...(currentMsg.agentLogs || []), {
                  agent: parsed.agent,
                  status: parsed.status,
                  time: parsed.time
                }];
                
                if (parsed.agent === "Atlas") {
                   if (parsed.status.includes("Scraped")) {
                     currentMsg.searchStatus = "done";
                     currentMsg.searchCount = parseInt(parsed.status.match(/\d+/)?.[0] || "3");
                   } else {
                     currentMsg.searchStatus = "searching";
                   }
                }
                return next;
              });
            }

            if (parsed.type === "reasoning") {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1].reasoningTime = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
                next[next.length - 1].reasoning = parsed.reasoning;
                return next;
              });
            }

            if (parsed.type === "content") {
              fullReply += parsed.text;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1].content = fullReply;
                return next;
              });
            }

            if (parsed.type === "image") {
              generatedImageUrl = parsed.url;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1].generatedImage = generatedImageUrl;
                return next;
              });
            }

          if (parsed.type === "done") {
            if (parsed.totalTime) {
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1].reasoningTime = parsed.totalTime;
                return next;
              });
            }
            
            const insertPayload: any = { 
              chat_id: chatId, 
              role: "assistant", 
              content: fullReply 
            };
            
            if (generatedImageUrl) {
              insertPayload.generated_image = generatedImageUrl;
            }

            await supabase.from("messages").insert([insertPayload]);
          }
        } catch (e) {
          console.error("Failed to parse chunk:", e);
        }
      }
    }

  } catch (err) {
    console.error(err);
    setMessages((prev) => { 
      const next = [...prev]; 
      next[next.length - 1] = { role: "assistant", content: "Sorry, an error occurred." }; 
      return next; 
    });
  }
  setLoading(false);
};

  const sendMessage = async (overrideText?: string) => {
    const textToSend = overrideText !== undefined ? overrideText : input;
    if (!textToSend.trim() && !attachment) return;
    if (attachment?.status === "nsfw") return;

    const currentInput = textToSend.trim() || (attachment ? "Analyze this" : "");
    const imageBase64 =
      attachment && attachment.type === "image" ? attachment.base64 : undefined;
    const fileBase64 =
      attachment && attachment.type === "file" ? attachment.base64 : undefined;

    setInput("");
    setAttachment(null);

    await runChat(currentInput, imageBase64, fileBase64);
  };

  // ============================================================
  // VOICE MODE
  // ============================================================
  const handleVoiceTranscript = (transcript: string) => {
    runChat(transcript);
  };

  const getLatestAssistantReply = () =>
    new Promise<string | null>((resolve) => {
      const last = messagesRef.current[messagesRef.current.length - 1];
      if (last && last.role === "assistant" && last.content) {
        resolve(last.content);
        return;
      }
      voiceReplyResolverRef.current = resolve;
      setTimeout(() => {
        if (voiceReplyResolverRef.current === resolve) {
          voiceReplyResolverRef.current = null;
          resolve(null);
        }
      }, 60_000);
    });

  const readAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const regenerateResponse = async () => {
    const lastUserMsg = [...messagesRef.current].reverse().find((m: any) => m.role === "user");
    if (!lastUserMsg) return;
    setMessages(prev => prev.slice(0, -1));
    await runChat(lastUserMsg.content);
  };

  // ============================================================
  // CHAT ACTIONS
  // ============================================================
  const deleteChat = async (id: string) => {
    await supabase.from("chats").delete().eq("id", id);
    setChats(chats.filter((c) => c.id !== id));
    if (activeChatId === id) {
      const remaining = chats.filter((c) => c.id !== id);
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
      setMessages([]);
    }
    setActiveChatMenu(null);
  };

  const renameChat = async (id: string) => {
    const newTitle = window.prompt("Rename conversation:");
    if (newTitle && newTitle.trim()) {
      await supabase.from("chats").update({ title: newTitle }).eq("id", id);
      setChats(chats.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
    }
    setActiveChatMenu(null);
  };

  const pinChat = async (id: string, currentPinStatus: boolean) => {
    const newPinStatus = !currentPinStatus;
    await supabase.from("chats").update({ pinned: newPinStatus }).eq("id", id);
    const updatedChats = chats.map((c) =>
      c.id === id ? { ...c, pinned: newPinStatus } : c
    );
    updatedChats.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    setChats(updatedChats);
    setActiveChatMenu(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const formatChatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const latestAssistantMessage =
    messages.length > 0 && messages[messages.length - 1].role === "assistant"
      ? messages[messages.length - 1].content
      : "";

  const isSuperGyra = subscription?.isSuperGyra === true;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <main className="h-screen bg-black text-white flex relative overflow-hidden">
      {voiceEnabled && latestAssistantMessage && (
        <VoiceOutput
          enabled={voiceEnabled}
          text={latestAssistantMessage}
          rate={1.05}
          pitch={1}
        />
      )}

      <VoiceMode
        open={showVoiceMode}
        onClose={() => setShowVoiceMode(false)}
        onTranscript={handleVoiceTranscript}
        getLatestAssistantReply={getLatestAssistantReply}
      />

      {activeBroadcast && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-[90] max-w-md w-[calc(100%-2rem)] rounded-2xl border p-4 shadow-2xl ${
            activeBroadcast.type === "alert"
              ? "bg-red-950/95 border-red-500/50"
              : activeBroadcast.type === "warning"
              ? "bg-yellow-950/95 border-yellow-500/50"
              : activeBroadcast.type === "success"
              ? "bg-green-950/95 border-green-500/50"
              : "bg-blue-950/95 border-blue-500/50"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl">📢</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{activeBroadcast.title}</p>
              <p className="text-xs text-zinc-300 mt-1">
                {activeBroadcast.message}
              </p>
            </div>
            <button
              onClick={() => setActiveBroadcast(null)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showToS && (
        <div className="absolute inset-0 bg-black/90 z-[80] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold mb-4">
              Updates to our Terms of Service
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              We&apos;re updating our Terms of Service and Acceptable Use
              Policy. Now&apos;s a great chance to review them.
            </p>
            <button
              onClick={() => setShowToS(false)}
              className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors w-full"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showLimitModal && (
        <div className="absolute inset-0 bg-black/90 z-[85] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 max-w-md w-full flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-5">
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Chat limit reached</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              You've reached the free limit of 20 messages in this conversation.
              Upgrade to SuperGyra for unlimited chat, video generation, and
              more.
            </p>
            <Link
              href="/upgrade"
              className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors w-full mb-3"
            >
              Upgrade to SuperGyra →
            </Link>
            <button
              onClick={() => setShowLimitModal(false)}
              className="text-zinc-500 hover:text-white text-sm transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsPanel
          user={user}
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
        />
      )}

      {showUpgrade && (
        <div className="absolute inset-0 bg-black z-[75] flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <button
              onClick={() => setShowUpgrade(false)}
              className="text-zinc-400 hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <h2 className="text-2xl font-bold text-center mb-2">
              Keep chatting with basic access
            </h2>
            <p className="text-zinc-400 text-center text-sm mb-6">
              Choose the right plan for you
            </p>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">
                SuperGyra{" "}
                <span className="text-zinc-500 font-normal">Lite</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Link
                  href="/upgrade"
                  className="border-2 border-blue-500 bg-blue-500/10 rounded-xl p-4 text-left block"
                >
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mb-2">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-bold">₦10,000.00</p>
                  <p className="text-xs text-zinc-500">Billed monthly</p>
                </Link>
                <Link
                  href="/upgrade"
                  className="border border-zinc-800 rounded-xl p-4 text-left relative block"
                >
                  <span className="absolute top-2 right-2 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                    Save 17%
                  </span>
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-700 mb-2"></div>
                  <p className="text-lg font-bold">₦118,800.00</p>
                  <p className="text-xs text-zinc-500">Billed yearly</p>
                </Link>
              </div>
              <Link
                href="/upgrade"
                className="w-full bg-white text-black py-3 rounded-full font-semibold hover:bg-zinc-200 transition-colors text-center block"
              >
                Upgrade to Lite
              </Link>
              <div className="flex flex-col gap-3 mt-6">
                {[
                  "Access to Gyra Build",
                  "Create apps with a single prompt",
                  "Unlimited conversations in Chat",
                  "Expert mode",
                  "Try out AI image & video creation",
                  "Increased limits at regular speed",
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-zinc-400 w-6 text-center">✦</span>
                    <p className="text-sm text-zinc-300">{f}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="absolute inset-0 bg-black/60 z-40 md:hidden"
        />
      )}

      <div
        className={`fixed md:relative inset-y-0 left-0 z-50 w-[85%] max-w-sm md:w-64 border-r border-zinc-800/50 flex flex-col justify-between bg-black transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold">
                {user ? user.email[0].toUpperCase() : "?"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user ? user.email.split("@")[0] : "Loading..."}
                </p>
                {isSuperGyra && (
                  <span className="inline-block mt-0.5 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                    ⚡ SuperGyra
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-zinc-500 hover:text-white md:hidden"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {[
              {
                label: "Console",
                icon: <Terminal className="w-5 h-5" />,
                action: () => {
                  window.location.href = "/console";
                  setIsSidebarOpen(false);
                },
              },
              {
                label: "Automations",
                icon: <Settings className="w-5 h-5" />,
                action: () => {
                  window.location.href = "/studio";
                  setIsSidebarOpen(false);
                },
              },
              {
                label: "Library",
                icon: <BookOpen className="w-5 h-5" />,
                action: () => {
                  window.location.href = "/library";
                  setIsSidebarOpen(false);
                },
              },
              {
                label: "Projects",
                icon: <Folder className="w-5 h-5" />,
                action: () => {
                  window.location.href = "/projects";
                  setIsSidebarOpen(false);
                },
              },
              {
                label: "Gyra Bot",
                icon: <Bot className="w-5 h-5" />,
                badge: "New",
                action: () => window.open("https://t.me/Gyra_AiBot", "_blank"),
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="flex items-center gap-3 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors text-left text-zinc-300 hover:text-white"
              >
                <span className="flex items-center justify-center">
                  {item.icon}
                </span>
                {item.label}
                {item.badge && (
                  <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isSuperGyra ? (
            <div className="w-full flex items-center gap-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4 mb-6">
              <div className="flex-1">
                <p className="font-semibold text-sm text-blue-300">SuperGyra</p>
                <p className="text-xs text-blue-400/80">
                  Active
                  {subscription?.expiresAt &&
                    ` · renews ${new Date(
                      subscription.expiresAt
                    ).toLocaleDateString()}`}
                </p>
              </div>
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
          ) : (
            <button
              onClick={() => {
                setShowUpgrade(true);
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-500 rounded-2xl p-4 mb-6 transition-colors text-left"
            >
              <div className="flex-1">
                <p className="font-semibold text-sm">SuperGyra</p>
                <p className="text-xs text-blue-200">
                  Unlimited chat + video generation
                </p>
              </div>
              <span className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                Upgrade
              </span>
            </button>
          )}

          <div className="mb-4">
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider px-1 mb-2">
              Conversations
            </p>
            <div className="flex flex-col gap-1">
              {filteredChats.length === 0 ? (
                <p className="text-xs text-zinc-500 px-2 italic">
                  No chats yet.
                </p>
              ) : (
                filteredChats.map((chat) => (
                  <div key={chat.id} className="relative group">
                    <button
                      onClick={() => selectChat(chat.id)}
                      className={`w-full text-left px-2 py-2 rounded-lg transition-colors pr-8 ${
                        activeChatId === chat.id
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-300 hover:bg-zinc-900"
                      }`}
                    >
                      <p className="text-sm truncate">
                        {chat.pinned && "📌 "}
                        {chat.title}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {formatChatDate(chat.created_at)}
                      </p>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveChatMenu(
                          activeChatMenu === chat.id ? null : chat.id
                        );
                      }}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-700 ${
                        activeChatMenu === chat.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {activeChatMenu === chat.id && (
                      <div className="absolute right-0 top-12 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-[100] p-1 flex flex-col">
                        <button
                          onClick={() => {
                            window.open(
                              `/dashboard?chat=${chat.id}`,
                              "_blank"
                            );
                            setActiveChatMenu(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md text-left"
                        >
                          Open new tab
                        </button>
                        <button
                          onClick={() => renameChat(chat.id)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md text-left"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => pinChat(chat.id, chat.pinned)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 rounded-md text-left"
                        >
                          {chat.pinned ? "Unpin" : "Pin"}
                        </button>
                        <div className="h-px bg-zinc-700 my-1"></div>
                        <button
                          onClick={() => deleteChat(chat.id)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-zinc-700 rounded-md text-left"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800/50">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2">
              <Search className="w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none text-sm text-zinc-300 placeholder:text-zinc-500 flex-1 min-w-0"
              />
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
            >
              <Settings className="w-5 h-5 text-zinc-400" />
            </button>
            <button
              onClick={createNewChat}
              className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
            >
              <svg
                className="w-5 h-5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative z-10 h-full">
        <div className="w-full flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center md:hidden"
            >
              <svg
                className="w-5 h-5 text-zinc-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            
            <div className="hidden md:flex items-center gap-2 ml-2">
              {project && (
                <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-400">
                  {ICON_MAP[project.icon] || <Folder className="w-4 h-4" />}
                </div>
              )}
              <h1 className="text-lg font-bold truncate max-w-[200px]">
                {project ? project.name : (chats.find(c => c.id === activeChatId)?.title || "Gyra")}
              </h1>
            </div>
            
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/console"
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center transition-colors"
              title="Developer Console"
            >
              <Terminal className="w-5 h-5 text-zinc-300" />
            </Link>
            <button
              onClick={() => (window.location.href = "/api")}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center"
              title="Developer API"
            >
              <svg
                className="w-5 h-5 text-zinc-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 py-4">
          {messages.length === 0 ? (
  <div className="h-full flex flex-col items-center justify-center pb-20">
    <div className="relative mb-6">
      <div className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center opacity-30 grayscale">
        <GyraMark size={120} glow={false} animated={false} />
      </div>
    </div>
    <p className="text-zinc-500 text-sm text-center">
      {project ? `Start chatting in ${project.name}.` : "Gyra is Here to Help, Ask Anything."}
    </p>
  </div>
) : (
            <div className="w-full flex flex-col gap-6 pb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  {msg.role === "user" && (
                    <div className="bg-[#2f2f2f] text-white px-5 py-3 rounded-3xl max-w-[85%] text-[15px] leading-relaxed">
                      {msg.imageBase64 && <img src={msg.imageBase64} className="w-48 h-auto rounded-xl mb-2 object-cover" />}
                      {msg.content}
                    </div>
                  )}

                  {msg.role === "assistant" && (
                    <div className="w-full max-w-[95%] flex flex-col items-start">
                      
{(msg.searchStatus || msg.reasoning || msg.reasoningTime > 0 || msg.agentLogs?.length > 0) && (
   <div className="mb-4 w-full flex flex-col gap-2 border-l-2 border-zinc-800 pl-4 py-2">
     
     {(msg.agentLogs?.find((l: any) => l.status.includes("Analyzing") || l.status.includes("Thinking")) || msg.reasoning) && (
       <details className="group">
         <summary className="flex items-center gap-2 text-[14px] text-zinc-400 cursor-pointer select-none w-fit">
           <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400/50 flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-blue-400/30 animate-pulse" />
             <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-ping" />
           </div>
           
           <span>Thinking for {msg.reasoningTime || 2}s</span>
           <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
         </summary>
         <div className="mt-2 text-[13px] text-zinc-500 pl-6 whitespace-pre-wrap font-mono">
           {msg.reasoning || "Analyzing your request..."}
         </div>
       </details>
     )}

     {msg.agentLogs?.find((l: any) => l.status.includes("Searching")) && (
       <div className="flex items-center gap-2 text-sm text-zinc-400 mt-2">
         <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
         {msg.agentLogs?.find((l: any) => l.status.includes("Searching"))?.status}
       </div>
     )}

     {msg.searchStatus === "done" && msg.sources && msg.sources.length > 0 && (
       <div className="flex items-center gap-2 bg-[#1c1c1c] border border-zinc-800 px-3 py-1.5 rounded-xl mt-3 w-fit">
         <div className="flex -space-x-1">
           {msg.sources.slice(0, 3).map((src: any, i: number) => (
             <div key={i} className="w-5 h-5 bg-zinc-800 rounded-full border-2 border-[#1c1c1c] flex items-center justify-center text-[9px] font-bold text-white uppercase">
               {src.domain ? src.domain[0] : "W"}
             </div>
           ))}
         </div>
         <span className="text-[12px] font-medium text-zinc-300">{msg.sources.length} pages found</span>
       </div>
     )}

     {msg.agentLogs && msg.agentLogs.filter((l: any) => !l.status.includes("Thinking") && !l.status.includes("Searching")).length > 0 && (
       <div className="flex flex-col gap-2 mt-2">
         {msg.agentLogs.filter((l: any) => !l.status.includes("Thinking") && !l.status.includes("Searching")).map((log: any, idx: number) => (
           <div key={idx} className="flex items-center gap-2 text-sm text-zinc-400">
             <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
             <span className="font-semibold text-white">{log.agent}</span>
             <span className="font-mono text-[13px]">{log.status}</span>
           </div>
         ))}
       </div>
     )}

   </div>
)}

<div className="w-full">
   {msg.content ? <MessageContent content={msg.content} /> : (loading && <span className="inline-block w-2.5 h-4 bg-zinc-400 animate-pulse rounded-sm"></span>)}
</div>

                      {msg.generatedImage && (
                        <div className="mt-4 border border-zinc-800 rounded-2xl overflow-hidden w-full max-w-md animate-in fade-in zoom-in-95 duration-500 shadow-xl">
                          <div className="bg-[#1e1e1e] px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
                             <ImageIcon className="w-5 h-5 text-zinc-300" />
                             <span className="text-sm font-medium text-white">Imagine</span>
                          </div>
                          <img src={msg.generatedImage} alt="Generated" className="w-full object-cover" />
                          <div className="bg-[#1e1e1e] p-3 flex items-center justify-between border-t border-zinc-800">
                            <button onClick={() => {
                                fetch(msg.generatedImage)
                                  .then(res => res.blob())
                                  .then(blob => {
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `gyra-${Date.now()}.jpg`;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                    window.URL.revokeObjectURL(url);
                                  })
                                  .catch(err => alert("Download failed. Try long-pressing the image to save."));
                            }} className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              Download
                            </button>
                            <button onClick={() => {
                                if (navigator.share) {
                                    navigator.share({ url: msg.generatedImage });
                                } else {
                                    alert("Sharing is not supported on this browser.");
                                }
                            }} className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white transition-colors">
                              <Share2 className="w-4 h-4" />
                              Share
                            </button>
                          </div>
                        </div>
                      )}

                      {msg.content && !loading && (
                        <div className="flex items-center gap-1 mt-3 text-zinc-400">
                          <button onClick={() => navigator.clipboard.writeText(msg.content)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors" title="Copy"><Copy className="w-[18px] h-[18px]" /></button>
                          <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors" title="Good response"><ThumbsUp className="w-[18px] h-[18px]" /></button>
                          <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors" title="Bad response"><ThumbsDown className="w-[18px] h-[18px]" /></button>
                          <button onClick={() => readAloud(msg.content)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors" title="Read aloud"><Volume2 className="w-[18px] h-[18px]" /></button>
                          
                          <button 
                            onClick={async () => {
                              try {
                                if (!activeChatId) {
                                  alert("No active chat to share.");
                                  return;
                                }
                                
                                const { data: sessionData } = await supabase.auth.getSession();
                                const token = sessionData.session?.access_token;
                                if (!token) return;

                                const res = await fetch("/api/v1/share", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ chatId: activeChatId }),
                                });
                                
                                const data = await res.json();
                                if (data.id) {
                                  const shareUrl = `${window.location.origin}/share/${data.id}`;
                                  
                                  if (navigator.share) {
                                    await navigator.share({
                                      title: "Gyra AI Shared Chat",
                                      text: "Check out this AI conversation on Gyra",
                                      url: shareUrl,
                                    });
                                  } else {
                                    await navigator.clipboard.writeText(shareUrl);
                                    alert("Link copied to clipboard!");
                                  }
                                } else {
                                  alert(data.error?.message || "Failed to generate share link.");
                                }
                              } catch (err) {
                                console.error("Share error:", err);
                                alert("Failed to generate share link.");
                              }
                            }} 
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors" 
                            title="Share"
                          >
                            <Share2 className="w-[18px] h-[18px]" />
                          </button>
                          
                          <button onClick={regenerateResponse} className="ml-auto p-2 hover:bg-zinc-800 rounded-lg transition-colors" title="Regenerate"><RotateCcw className="w-[18px] h-[18px]" /></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="w-full max-w-3xl mx-auto px-4 pb-4 shrink-0 relative">
          
          {attachment?.status === "valid" && attachment.type === "image" && (
            <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar animate-in fade-in slide-in-from-bottom-2">
              {["What's This", "Analyze", "Suggest a Solution"].map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="whitespace-nowrap px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  {s} <span>→</span>
                </button>
              ))}
            </div>
          )}

          {attachment && (
            <div className="mb-3 animate-in fade-in slide-in-from-bottom-2">
              {attachment.status === "checking" ? (
                <div className="w-24 h-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-zinc-500 text-center">Checking...</span>
                </div>
              ) : attachment.status === "nsfw" ? (
                <div className="relative w-24 h-24 rounded-2xl bg-red-950/30 border border-red-500/50 flex flex-col items-center justify-center p-2 text-center">
                   <button onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">✕</button>
                   <svg className="w-6 h-6 text-red-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                   <span className="text-[10px] text-red-400 font-medium leading-tight">May violate terms</span>
                </div>
              ) : (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-zinc-700 group">
                  {attachment.type === "image" ? (
                    <img src={attachment.base64} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                       <FileText className="w-8 h-8 text-zinc-400" />
                    </div>
                  )}
                  <button onClick={() => setAttachment(null)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white backdrop-blur-sm">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}
            </div>
          )}

          {showAttachMenu && (
            <AttachmentMenu
              onCamera={handleCamera}
              onGallery={handleGallery}
              onFiles={handleFiles}
              onClose={() => setShowAttachMenu(false)}
              recentImages={recentImages}
              onSelectRecent={(base64) => processImage(base64, "recent.jpg", "image")}
            />
          )}

          {showToolsMenu && (
            <div className="absolute bottom-20 left-0 w-full bg-[#212121] border border-zinc-800 rounded-3xl p-4 shadow-2xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowToolsMenu(false);
                    window.location.href = "/journal"; 
                  }}
                  className="flex items-center gap-3 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-sm font-medium transition-colors text-left text-white"
                >
                  <span className="text-zinc-400">
                    <FileText className="w-5 h-5" />
                  </span>
                  Journal
                </button>
              </div>
            </div>
          )}

          <div className={`w-full bg-[#212121] rounded-[32px] p-3 flex flex-col gap-2 transition-opacity ${attachment?.status === "nsfw" ? "opacity-50 pointer-events-none" : ""}`}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message or hold to speak"
              className="bg-transparent outline-none text-[15px] text-white placeholder:text-zinc-500 w-full px-2 py-1"
              disabled={attachment?.status === "nsfw"}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setThinkMode(!thinkMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${thinkMode ? "bg-blue-600/20 text-blue-400" : "text-zinc-400 hover:bg-zinc-800"}`}
                >
                  <Sparkles className="w-4 h-4" />
                  Think
                </button>
                <button
                  onClick={() => setSearchMode(!searchMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${searchMode ? "bg-blue-600/20 text-blue-400" : "text-zinc-400 hover:bg-zinc-800"}`}
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showAttachMenu ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
                </button>

                <button
                  onClick={() => setShowToolsMenu(!showToolsMenu)}
                  className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors group"
                  title="Gyra Tools"
                >
                  <svg 
                    className="w-[18px] h-[18px] text-zinc-300 group-hover:text-white transition-colors" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.5" />
                    <path d="M12 12h9" />
                  </svg>
                </button>

                {input.trim().length > 0 || attachment ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    disabled={loading}
                    className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}