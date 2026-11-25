"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../supabase";
import { FREE_LIMIT } from "../lib/paymentConfig";
import SettingsPanel from "../components/SettingsPanel";
import VoiceMode from "../components/VoiceMode";
import VoiceOutput from "../components/VoiceOutput";
import ToastContainer, { showToast } from "../components/Toast";
import MessageContextMenu from "../components/MessageContextMenu";
import DashboardSidebar from "./components/DashboardSidebar";
import ChatHeader from "./components/ChatHeader";
import EmptyWelcome from "./components/EmptyWelcome";
import MessageList from "./components/MessageList";
import ChatComposer from "./components/ChatComposer";
import {
  BroadcastBanner,
  DeleteChatModal,
  FileIndexModal,
  ImageLightboxModal,
  UpgradeModal,
} from "./components/DashboardModals";
import type {
  AttachmentState,
  BroadcastItem,
  ChatRecord,
  DashboardMessage,
  DashboardMode,
  ModelId,
  ProjectInfo,
  SubscriptionState,
} from "./types";

const SIDEBAR_COLLAPSED_KEY = "gyra:sidebar_collapsed_v1";
const RECENT_IMAGES_KEY = "gyra:recent_images_v1";
const PENDING_PROMPT_STORAGE_KEY = "gyra:pending_prompt_v1";

type SupabaseUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
} | null;

const EMPTY_ATTACHMENT: AttachmentState = {
  imageBase64: null,
  imageName: null,
  documentText: null,
  documentName: null,
  moderationStatus: "idle",
};

function DashboardWorkspace() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const queryChatId = searchParams.get("chat");
  const queryPrompt = searchParams.get("prompt");
  const fromSamples = searchParams.get("from");

  // User & subscription
  const [user, setUser] = useState<SupabaseUser>(null);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    isSuper: false,
    plan: "free",
    status: "inactive",
  });
  const [activeProject, setActiveProject] = useState<ProjectInfo | null>(null);

  // Navigation & layout
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [voiceAutoRead, setVoiceAutoRead] = useState(false);

  // Conversations & messages
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);

  // Composer & model controls
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelId>("gyra-1.0");
  const [mode, setMode] = useState<DashboardMode>("chat");
  const [thinkMode, setThinkMode] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [attachment, setAttachment] = useState<AttachmentState>(EMPTY_ATTACHMENT);
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [recentImages, setRecentImages] = useState<string[]>([]);
  const [showRecentImagesModal, setShowRecentImagesModal] = useState(false);

  // Streaming & live activity
  const [isLoading, setIsLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState("");
  const [liveAgent, setLiveAgent] = useState("Gyra");
  const [readingProgress, setReadingProgress] = useState<number | null>(null);
  const [readingFileName, setReadingFileName] = useState("");

  // Modals & overlays
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatRecord | null>(null);
  const [deletingChat, setDeletingChat] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{
    open: boolean;
    reason: "limit" | "super-model";
  }>({ open: false, reason: "limit" });
  const [showFileModal, setShowFileModal] = useState(false);
  const [indexingFile, setIndexingFile] = useState(false);
  const [contextMenuIndex, setContextMenuIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  // Scroll behavior
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Refs for async access & abort control
  const messagesRef = useRef<DashboardMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const voiceReplyResolverRef = useRef<((reply: string | null) => void) | null>(null);
  const projectFilesPromptedRef = useRef<string | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load prefilled prompt handed off from Prompt Samples (/library) without auto-submitting
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      let incoming = queryPrompt ? queryPrompt.trim() : "";
      try {
        const stored = sessionStorage.getItem(PENDING_PROMPT_STORAGE_KEY);
        if (stored && stored.trim()) {
          // Prefer sessionStorage when present (preserves long multiline templates cleanly)
          incoming = stored.trim();
          sessionStorage.removeItem(PENDING_PROMPT_STORAGE_KEY);
        }
      } catch {
        // Ignore storage restrictions
      }

      if (!incoming) return;

      setInput(incoming);
      showToast("Prompt loaded — review and send when ready", "info");

      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has("prompt") || url.searchParams.has("from")) {
          url.searchParams.delete("prompt");
          url.searchParams.delete("from");
          const cleanUrl = url.pathname + (url.search ? url.search : "") + url.hash;
          window.history.replaceState({}, "", cleanUrl);
        }
      } catch {
        // Ignore URL cleanup error
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [queryPrompt, fromSamples]);

  // Restore persisted UI preferences after mount without blocking render
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      try {
        const savedCollapse = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        if (savedCollapse === "true") setDesktopCollapsed(true);

        const savedRecent = localStorage.getItem(RECENT_IMAGES_KEY);
        if (savedRecent) {
          const parsed = JSON.parse(savedRecent);
          if (Array.isArray(parsed)) setRecentImages(parsed.slice(0, 6));
        }
      } catch {
        // Ignore storage errors in restricted contexts
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  const toggleDesktopCollapse = useCallback(() => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  // Load messages for a given chat
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error || !data) {
        setMessages([]);
        return;
      }

      const mapped: DashboardMessage[] = data.map((row: Record<string, unknown>) => ({
        id: typeof row.id === "string" ? row.id : undefined,
        role: row.role === "user" ? "user" : "assistant",
        content: typeof row.content === "string" ? row.content : "",
        imageUrl: typeof row.generated_image === "string" ? row.generated_image : undefined,
        createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
      }));
      setMessages(mapped);
    } catch {
      setMessages([]);
    }
  }, []);

  // Initialize auth, subscription, project, chats, and broadcasts
  useEffect(() => {
    let active = true;

    const init = async () => {
      setChatsLoading(true);
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!active) return;
        setUser(authUser as SupabaseUser);

        if (authUser) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (token) {
              const res = await fetch("/api/v1/subscription/status", {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok && active) {
                const sub = await res.json();
                setSubscription({
                  isSuper: Boolean(sub?.isSuperGyra),
                  plan: sub?.plan || (sub?.isSuperGyra ? "super" : "free"),
                  status: sub?.status || "inactive",
                });
              }
            }
          } catch {
            // Keep default free tier
          }

          if (projectId) {
            const { data: projData } = await supabase
              .from("projects")
              .select("*")
              .eq("id", projectId)
              .single();
            if (projData && active) {
              setActiveProject({
                id: projData.id,
                name: projData.name,
                instructions: projData.instructions,
              });
            }
          } else {
            setActiveProject(null);
          }

          let query = supabase
            .from("chats")
            .select("*")
            .eq("user_id", authUser.id)
            .order("pinned", { ascending: false })
            .order("created_at", { ascending: false });

          if (projectId) {
            query = query.eq("project_id", projectId);
          } else {
            query = query.is("project_id", null);
          }

          const { data: chatsData } = await query;
          if (!active) return;

          if (chatsData) {
            const list = chatsData as ChatRecord[];
            setChats(list);

            if (queryChatId && list.some((c) => c.id === queryChatId)) {
              setActiveChatId(queryChatId);
              await loadMessages(queryChatId);
            } else if (queryChatId) {
              setActiveChatId(queryChatId);
              await loadMessages(queryChatId);
            }
          }
        }
      } catch {
        // Allow graceful guest rendering if Supabase is unavailable
      } finally {
        if (active) setChatsLoading(false);
      }

      try {
        const { data: bc } = await supabase
          .from("broadcasts")
          .select("*")
          .eq("active", true)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1);
        if (bc && bc[0] && active) {
          setActiveBroadcast(bc[0] as BroadcastItem);
        }
      } catch {
        // Optional broadcast banner
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, [projectId, queryChatId, loadMessages]);

  // Check for project files when entering a project workspace
  useEffect(() => {
    if (!projectId || !user || projectFilesPromptedRef.current === projectId) return;

    const checkProjectFiles = async () => {
      try {
        const { data } = await supabase
          .from("project_files")
          .select("id")
          .eq("project_id", projectId)
          .limit(1);
        if (data && data.length > 0 && messagesRef.current.length === 0) {
          projectFilesPromptedRef.current = projectId;
          setShowFileModal(true);
        }
      } catch {
        // Ignore
      }
    };

    void checkProjectFiles();
  }, [projectId, user]);

  // Smooth auto-scroll on new messages when near bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (!showScrollToBottom) {
      scrollToBottom("smooth");
    }
  }, [messages.length, showScrollToBottom, scrollToBottom]);

  const handleScrollContainer = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollToBottom(distanceFromBottom > 180);
  }, []);

  // Read project files via existing streaming endpoint
  const runProjectFileReading = useCallback(async () => {
    if (!projectId) return;
    setShowFileModal(false);
    setIndexingFile(true);
    setReadingFileName(activeProject?.name || "project files");
    setReadingProgress(15);
    setIsLoading(true);
    setLiveAgent("Gyra");
    setLiveStatus("Reading project files...");

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", modeUsed: "chat" },
    ]);

    try {
      const res = await fetch("/api/projects/read-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to read project files.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const dataStr = line.slice(5).trim();
          if (!dataStr || dataStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === "status") {
              setLiveStatus(parsed.status || "Reading project files...");
              setReadingProgress((p) => Math.min((p ?? 20) + 18, 92));
            } else if (parsed.type === "content" && parsed.text) {
              fullReply += parsed.text;
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                  next[next.length - 1] = { ...last, content: fullReply };
                }
                return next;
              });
            }
          } catch {
            // Ignore partial chunk
          }
        }
      }
      setReadingProgress(100);
      setTimeout(() => setReadingProgress(null), 500);
    } catch {
      setReadingProgress(null);
      showToast("Could not read project files.", "error");
    } finally {
      setIndexingFile(false);
      setIsLoading(false);
      setLiveStatus("");
    }
  }, [projectId, activeProject]);

  // Create new conversation
  const handleNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setLiveStatus("");
    setActiveChatId(null);
    setMessages([]);
    setAttachment(EMPTY_ATTACHMENT);
    setShowScrollToBottom(false);
  }, []);

  // Global keyboard shortcut: Cmd/Ctrl+K for new chat
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleNewChat]);

  const handleSelectChat = useCallback(
    async (chatId: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsLoading(false);
      setLiveStatus("");
      setActiveChatId(chatId);
      setShowScrollToBottom(false);
      await loadMessages(chatId);
    },
    [loadMessages]
  );

  // Stop active generation cleanly
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setLiveStatus("");
    showToast("Generation stopped", "info");
  }, []);

  // Core AI streaming execution
  const runChat = useCallback(
    async (
      promptText: string,
      opts?: {
        imageBase64?: string;
        fileBase64?: string;
        fileName?: string;
        baseMessages?: DashboardMessage[];
        overrideMode?: DashboardMode;
        overrideSearch?: boolean;
        overrideThink?: boolean;
      }
    ) => {
      const cleanDisplay = promptText.replace(/\[generate\/change image\]/gi, "").trim();
      const activeMode = opts?.overrideMode ?? mode;
      const activeSearch = opts?.overrideSearch ?? searchMode;
      const activeThink = opts?.overrideThink ?? thinkMode;

      if (selectedModel === "gyra-super2.0" && !subscription.isSuper) {
        setUpgradeModal({ open: true, reason: "super-model" });
        return;
      }

      // Create chat record if logged in and starting a new thread
      let chatId = activeChatId;
      let isNewChat = false;

      if (user && !chatId) {
        isNewChat = true;
        const initialTitle = (cleanDisplay || opts?.fileName || "New conversation").slice(0, 48);
        const { data: created } = await supabase
          .from("chats")
          .insert([
            {
              user_id: user.id,
              title: initialTitle,
              project_id: projectId || null,
            },
          ])
          .select()
          .single();

        if (created) {
          chatId = created.id;
          setActiveChatId(created.id);
          setChats((prev) => [created as ChatRecord, ...prev]);
        }
      }

      const priorMessages = opts?.baseMessages ?? messagesRef.current;
      const userMessage: DashboardMessage = {
        role: "user",
        content: cleanDisplay || (opts?.imageBase64 ? "Analyze this image" : "Analyze this file"),
        imageBase64: opts?.imageBase64,
        fileBase64: opts?.fileBase64,
        fileName: opts?.fileName,
      };

      const apiHistory = [
        ...priorMessages.map((m) => ({
          role: m.role,
          content: m.content,
          imageBase64: m.imageBase64,
          fileBase64: m.fileBase64,
        })),
        {
          role: "user" as const,
          content: promptText,
          imageBase64: opts?.imageBase64,
          fileBase64: opts?.fileBase64,
        },
      ];

      const nextMessages: DashboardMessage[] = [
        ...priorMessages,
        userMessage,
        {
          role: "assistant",
          content: "",
          reasoning: "",
          sources: [],
          agentLogs: [],
          modeUsed: activeMode,
        },
      ];

      setMessages(nextMessages);
      setIsLoading(true);
      setLiveAgent(activeMode === "agent" ? "Atlas" : "Gyra");
      setLiveStatus(
        activeMode === "agent"
          ? "Starting multi-agent pipeline..."
          : activeSearch
          ? "Searching live sources..."
          : "Thinking..."
      );

      // Persist user message & auto-title new conversation
      if (user && chatId) {
        void supabase.from("messages").insert([
          {
            chat_id: chatId,
            role: "user",
            content: userMessage.content,
          },
        ]);

        if (isNewChat) {
          fetch("/api/title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMessage.content }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data?.title && chatId) {
                void supabase.from("chats").update({ title: data.title }).eq("id", chatId);
                setChats((prev) =>
                  prev.map((c) => (c.id === chatId ? { ...c, title: data.title } : c))
                );
              }
            })
            .catch(() => {});
        }
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        const res = await fetch("/api/chat", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "x-gyra-user-token": token } : {}),
          },
          body: JSON.stringify({
            messages: apiHistory,
            model: selectedModel,
            mode: activeMode,
            think: activeThink,
            search: activeSearch,
            projectInstructions: activeProject?.instructions || null,
          }),
        });

        if (res.status === 402) {
          setMessages((prev) => prev.slice(0, -1));
          setUpgradeModal({ open: true, reason: "limit" });
          setIsLoading(false);
          setLiveStatus("");
          return;
        }

        if (res.status === 403) {
          setMessages((prev) => prev.slice(0, -1));
          setUpgradeModal({ open: true, reason: "super-model" });
          setIsLoading(false);
          setLiveStatus("");
          return;
        }

        if (!res.ok || !res.body) {
          throw new Error(`Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullReply = "";
        let fullReasoning = "";
        let generatedImageUrl: string | undefined;
        let collectedSources: string[] = [];
        const collectedLogs: Array<{ agent: string; status: string; timestamp: number }> = [];
        let finalTime: string | undefined;

        const syncAssistantMessage = () => {
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last.role !== "assistant") return prev;
            copy[copy.length - 1] = {
              ...last,
              content: fullReply,
              reasoning: fullReasoning || undefined,
              imageUrl: generatedImageUrl,
              sources: collectedSources.length > 0 ? [...collectedSources] : undefined,
              agentLogs: collectedLogs.length > 0 ? [...collectedLogs] : undefined,
              totalTime: finalTime,
            };
            return copy;
          });
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const dataStr = trimmed.slice(6).trim();
            if (!dataStr || dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);

              if (parsed.type === "status") {
                const agentName = parsed.agent || "Gyra";
                const statusMsg = parsed.status || "Working...";
                setLiveAgent(agentName);
                setLiveStatus(statusMsg);
                collectedLogs.push({
                  agent: agentName,
                  status: statusMsg,
                  timestamp: Date.now(),
                });
                if (Array.isArray(parsed.sources) && parsed.sources.length > 0) {
                  collectedSources = Array.from(
                    new Set([...collectedSources, ...parsed.sources])
                  );
                }
                syncAssistantMessage();
              } else if (parsed.type === "reasoning" && parsed.reasoning) {
                fullReasoning += parsed.reasoning;
                syncAssistantMessage();
              } else if (parsed.type === "content" && parsed.text) {
                fullReply += parsed.text;
                syncAssistantMessage();
              } else if (parsed.type === "image" && parsed.url) {
                generatedImageUrl = parsed.url;
                syncAssistantMessage();
              } else if (parsed.type === "error" && parsed.text) {
                fullReply = fullReply
                  ? `${fullReply}\n\n${parsed.text}`
                  : parsed.text;
                syncAssistantMessage();
              } else if (parsed.type === "done") {
                finalTime = parsed.totalTime ? String(parsed.totalTime) : undefined;
                syncAssistantMessage();
              }
            } catch {
              // Ignore malformed partial frame
            }
          }
        }

        // Persist assistant message
        if (user && chatId && (fullReply || generatedImageUrl)) {
          const insertPayload: Record<string, unknown> = {
            chat_id: chatId,
            role: "assistant",
            content: fullReply,
          };
          if (generatedImageUrl) {
            insertPayload.generated_image = generatedImageUrl;
          }
          void supabase.from("messages").insert([insertPayload]);
        }

        // Resolve voice mode listener if waiting
        if (voiceReplyResolverRef.current) {
          voiceReplyResolverRef.current(fullReply || null);
          voiceReplyResolverRef.current = null;
        }
      } catch (err: unknown) {
        const isAbort =
          err instanceof Error && err.name === "AbortError";
        if (!isAbort) {
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last.role === "assistant" && !last.content) {
              copy[copy.length - 1] = {
                ...last,
                content:
                  "Unable to complete this request right now. Please check your connection and try again.",
              };
            }
            return copy;
          });
          showToast("Request failed. Please retry.", "error");
        }
        if (voiceReplyResolverRef.current) {
          voiceReplyResolverRef.current(null);
          voiceReplyResolverRef.current = null;
        }
      } finally {
        abortControllerRef.current = null;
        setIsLoading(false);
        setLiveStatus("");
      }
    },
    [
      activeChatId,
      activeProject,
      mode,
      projectId,
      searchMode,
      selectedModel,
      subscription.isSuper,
      thinkMode,
      user,
    ]
  );

  // Send from composer
  const handleSend = useCallback(async () => {
    if (isLoading) return;
    if (attachment.moderationStatus === "checking" || attachment.moderationStatus === "nsfw") {
      return;
    }

    const trimmed = input.trim();
    const hasImage = Boolean(attachment.imageBase64);
    const hasDoc = Boolean(attachment.documentText);
    if (!trimmed && !hasImage && !hasDoc) return;

    let promptToSend = trimmed || (hasImage ? "Analyze this image" : "Analyze this attached file");
    if (hasImage && !promptToSend.toLowerCase().includes("[generate/change image]")) {
      // Preserve explicit image editing trigger only when requested via suggestion or edit intent
      const lc = promptToSend.toLowerCase();
      if (lc.includes("edit") || lc.includes("change") || lc.includes("modify")) {
        promptToSend += " [generate/change image]";
      }
    }

    const imageBase64 = attachment.imageBase64 || undefined;
    const fileBase64 = attachment.documentText || undefined;
    const fileName = attachment.documentName || undefined;

    setInput("");
    setAttachment(EMPTY_ATTACHMENT);
    await runChat(promptToSend, { imageBase64, fileBase64, fileName });
  }, [attachment, input, isLoading, runChat]);

  // Attachments & moderation
  const processSelectedImage = useCallback(async (base64: string, name: string) => {
    setRecentImages((prev) => {
      const next = [base64, ...prev.filter((img) => img !== base64)].slice(0, 6);
      try {
        localStorage.setItem(RECENT_IMAGES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    setAttachment((prev) => ({
      ...prev,
      imageBase64: base64,
      imageName: name,
      moderationStatus: "checking",
    }));

    try {
      const res = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.safe === false) {
          setAttachment((prev) => ({ ...prev, moderationStatus: "nsfw" }));
          showToast("Image blocked by safety policy", "error");
          return;
        }
      }
    } catch {
      // Fail open only if moderation endpoint is unreachable
    }

    setAttachment((prev) => ({ ...prev, moderationStatus: "valid" }));
  }, []);

  const openFilePicker = useCallback(
    (kind: "camera" | "image" | "document") => {
      const picker = document.createElement("input");
      picker.type = "file";

      if (kind === "camera") {
        picker.accept = "image/*";
        picker.setAttribute("capture", "environment");
      } else if (kind === "image") {
        picker.accept = "image/*";
      } else {
        picker.accept =
          ".pdf,.doc,.docx,.txt,.csv,.json,.md,.xlsx,.pptx,.ts,.tsx,.js,.py,.html,.css";
      }

      picker.onchange = (event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          if (kind === "document") {
            setAttachment((prev) => ({
              ...prev,
              documentText: result,
              documentName: file.name,
            }));
            showToast(`Attached ${file.name}`, "info");
          } else {
            void processSelectedImage(result, file.name);
          }
        };
        reader.readAsDataURL(file);
      };

      picker.click();
    },
    [processSelectedImage]
  );

  // Conversation management
  const handleRenameChat = useCallback(async (chatId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: trimmed } : c)));
    await supabase.from("chats").update({ title: trimmed }).eq("id", chatId);
    showToast("Conversation renamed", "success");
  }, []);

  const handleTogglePinChat = useCallback(
    async (chatId: string) => {
      const target = chats.find((c) => c.id === chatId);
      if (!target) return;
      const nextPinned = !target.pinned;
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, pinned: nextPinned } : c))
      );
      await supabase.from("chats").update({ pinned: nextPinned }).eq("id", chatId);
      showToast(nextPinned ? "Conversation pinned" : "Conversation unpinned", "info");
    },
    [chats]
  );

  const handleConfirmDeleteChat = useCallback(async () => {
    if (!deleteTarget) return;
    setDeletingChat(true);
    try {
      await supabase.from("chats").delete().eq("id", deleteTarget.id);
      const remaining = chats.filter((c) => c.id !== deleteTarget.id);
      setChats(remaining);
      if (activeChatId === deleteTarget.id) {
        setActiveChatId(null);
        setMessages([]);
      }
      showToast("Conversation deleted", "info");
    } catch {
      showToast("Failed to delete conversation", "error");
    } finally {
      setDeletingChat(false);
      setDeleteTarget(null);
    }
  }, [activeChatId, chats, deleteTarget]);

  // Share active conversation
  const handleShareChat = useCallback(async () => {
    if (!activeChatId) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        showToast("Sign in to share conversations", "info");
        return;
      }

      const res = await fetch("/api/v1/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId: activeChatId }),
      });

      const data = await res.json();
      if (!data?.id) {
        showToast(data?.error?.message || "Could not create share link", "error");
        return;
      }

      const shareUrl = `${window.location.origin}/share/${data.id}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Gyra Conversation",
            text: "Shared conversation from Gyra",
            url: shareUrl,
          });
          return;
        } catch {
          // User cancelled native share; fallback to clipboard
        }
      }
      await navigator.clipboard.writeText(shareUrl);
      showToast("Share link copied to clipboard", "success");
    } catch {
      showToast("Failed to generate share link", "error");
    }
  }, [activeChatId]);

  // Message actions
  const handleCopyText = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showToast("Copied to clipboard", "success");
    } catch {
      showToast("Clipboard unavailable", "error");
    }
  }, []);

  const handleEditUserMessage = useCallback(
    async (index: number, newContent: string) => {
      const prefix = messagesRef.current.slice(0, index);
      const original = messagesRef.current[index];
      await runChat(newContent, {
        baseMessages: prefix,
        imageBase64: original?.imageBase64,
        fileBase64: original?.fileBase64,
        fileName: original?.fileName,
      });
    },
    [runChat]
  );

  const handleRegenerate = useCallback(
    async (assistantIndex: number) => {
      const before = messagesRef.current.slice(0, assistantIndex);
      let lastUserIdx = -1;
      for (let i = before.length - 1; i >= 0; i--) {
        if (before[i].role === "user") {
          lastUserIdx = i;
          break;
        }
      }
      if (lastUserIdx === -1) return;
      const lastUser = before[lastUserIdx];
      await runChat(lastUser.content, {
        baseMessages: before.slice(0, lastUserIdx),
        imageBase64: lastUser.imageBase64,
        fileBase64: lastUser.fileBase64,
        fileName: lastUser.fileName,
      });
    },
    [runChat]
  );

  const handleRateMessage = useCallback((index: number, rating: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const nextRating = m.feedback === rating ? null : rating;
        return { ...m, feedback: nextRating };
      })
    );
    showToast(
      rating === "up" ? "Marked as helpful" : "Feedback noted",
      "info"
    );
  }, []);

  const handleToggleSpeak = useCallback(
    (index: number, content: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        showToast("Speech synthesis not supported in this browser", "error");
        return;
      }
      if (speakingIndex === index) {
        window.speechSynthesis.cancel();
        setSpeakingIndex(null);
        return;
      }
      window.speechSynthesis.cancel();
      const clean = content.replace(/[#*`>_~]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.onend = () => setSpeakingIndex(null);
      utterance.onerror = () => setSpeakingIndex(null);
      setSpeakingIndex(index);
      window.speechSynthesis.speak(utterance);
    },
    [speakingIndex]
  );

  const handleShareExcerpt = useCallback(async (content: string) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Gyra response", text: content });
        return;
      }
    } catch {
      // Fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(content);
      showToast("Response copied for sharing", "success");
    } catch {
      showToast("Could not share response", "error");
    }
  }, []);

  const handleDownloadImage = useCallback(async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `gyra-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      showToast("Image downloaded", "success");
    } catch {
      showToast("Could not download image", "error");
    }
  }, []);

  // Voice mode handlers
  const handleVoiceTranscript = useCallback(
    (transcript: string) => {
      if (!transcript.trim()) return;
      void runChat(transcript);
    },
    [runChat]
  );

  const getLatestAssistantReply = useCallback(
    () =>
      new Promise<string | null>((resolve) => {
        voiceReplyResolverRef.current = resolve;
        setTimeout(() => {
          if (voiceReplyResolverRef.current === resolve) {
            voiceReplyResolverRef.current = null;
            resolve(null);
          }
        }, 60_000);
      }),
    []
  );

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  }, []);

  // Derived values
  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) || null,
    [chats, activeChatId]
  );
  const pinnedChatIds = useMemo(
    () => chats.filter((c) => c.pinned).map((c) => c.id),
    [chats]
  );
  const userMessageCount = useMemo(
    () => messages.filter((m) => m.role === "user").length,
    [messages]
  );
  const latestAssistantText = useMemo(() => {
    if (isLoading || messages.length === 0) return "";
    const last = messages[messages.length - 1];
    return last.role === "assistant" ? last.content : "";
  }, [isLoading, messages]);

  const contextMessage =
    contextMenuIndex !== null ? messages[contextMenuIndex] || null : null;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white dark:bg-[#09090B] text-zinc-950 dark:text-zinc-100">
      {/* Desktop collapsible sidebar + Mobile off-canvas drawer */}
      <DashboardSidebar
        user={user}
        subscription={subscription}
        freeLimit={FREE_LIMIT}
        usedFreeCount={userMessageCount}
        chats={chats}
        chatsLoading={chatsLoading}
        activeChatId={activeChatId}
        pinnedChatIds={pinnedChatIds}
        desktopCollapsed={desktopCollapsed}
        mobileOpen={mobileMenuOpen}
        onToggleDesktopCollapse={toggleDesktopCollapse}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={(id) => void handleSelectChat(id)}
        onRenameChat={handleRenameChat}
        onTogglePinChat={(id) => void handleTogglePinChat(id)}
        onRequestDeleteChat={(chat) => setDeleteTarget(chat)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main chat workspace */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <BroadcastBanner
          broadcast={activeBroadcast}
          onDismiss={() => setActiveBroadcast(null)}
        />

        <ChatHeader
          chatTitle={activeChat?.title || "New conversation"}
          hasActiveChat={Boolean(activeChatId)}
          activeProject={activeProject}
          selectedModel={selectedModel}
          mode={mode}
          subscription={subscription}
          voiceAutoRead={voiceAutoRead}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onSelectModel={(m) => {
            setSelectedModel(m);
            showToast(
              m === "gyra-super2.0" ? "Switched to SuperGyra 2.0" : "Switched to Gyra 1.0",
              "info"
            );
          }}
          onSelectMode={(nextMode) => {
            setMode(nextMode);
            showToast(
              nextMode === "agent"
                ? "Agent mode active (6-agent pipeline)"
                : "Chat mode active",
              "info"
            );
          }}
          onRenameActiveChat={async (nextTitle) => {
            if (activeChatId) await handleRenameChat(activeChatId, nextTitle);
          }}
          onShareChat={() => void handleShareChat()}
          onNewChat={handleNewChat}
          onToggleVoiceAutoRead={() => {
            setVoiceAutoRead((prev) => {
              const next = !prev;
              showToast(next ? "Auto-read replies enabled" : "Auto-read muted", "info");
              return next;
            });
          }}
          onOpenUpgrade={() => setUpgradeModal({ open: true, reason: "super-model" })}
        />

        {/* Scrollable conversation canvas or empty welcome */}
        <main
          ref={scrollContainerRef}
          onScroll={handleScrollContainer}
          className="flex flex-1 flex-col overflow-y-auto overscroll-contain"
        >
          {messages.length === 0 ? (
            <EmptyWelcome
              mode={mode}
              activeProject={activeProject}
              onSelectStarter={({ prompt, mode: nextMode, enableSearch, enableThink }) => {
                if (nextMode) setMode(nextMode);
                if (typeof enableSearch === "boolean") setSearchMode(enableSearch);
                if (typeof enableThink === "boolean") setThinkMode(enableThink);
                setInput(prompt);
              }}
              onTriggerAttachment={() => setAttachmentMenuOpen(true)}
            />
          ) : (
            <MessageList
              messages={messages}
              isLoading={isLoading}
              liveStatus={liveStatus}
              liveAgent={liveAgent}
              readingProgress={readingProgress}
              readingFileName={readingFileName}
              speakingIndex={speakingIndex}
              showScrollToBottom={showScrollToBottom}
              onScrollToBottom={() => scrollToBottom("smooth")}
              onCopyMessage={(content) => void handleCopyText(content)}
              onEditUserMessage={(idx, text) => void handleEditUserMessage(idx, text)}
              onRegenerate={(idx) => void handleRegenerate(idx)}
              onRateMessage={handleRateMessage}
              onToggleSpeak={handleToggleSpeak}
              onShareMessage={(content) => void handleShareExcerpt(content)}
              onOpenContextMenu={(idx) => setContextMenuIndex(idx)}
              onOpenImageLightbox={(url) => setLightboxImage(url)}
              onDownloadImage={(url) => void handleDownloadImage(url)}
            />
          )}
          <div ref={messagesEndRef} className="h-2 shrink-0" />
        </main>

        {/* Sticky bottom composer */}
        <ChatComposer
          input={input}
          mode={mode}
          thinkMode={thinkMode}
          searchMode={searchMode}
          isLoading={isLoading}
          attachment={attachment}
          attachmentMenuOpen={attachmentMenuOpen}
          onInputChange={setInput}
          onSubmit={() => void handleSend()}
          onStopGeneration={handleStopGeneration}
          onSelectMode={setMode}
          onToggleThink={() => setThinkMode((v) => !v)}
          onToggleSearch={() => setSearchMode((v) => !v)}
          onToggleAttachmentMenu={() => setAttachmentMenuOpen((v) => !v)}
          onCloseAttachmentMenu={() => setAttachmentMenuOpen(false)}
          onSelectCamera={() => openFilePicker("camera")}
          onSelectPhotos={() => openFilePicker("image")}
          onSelectFiles={() => openFilePicker("document")}
          onSelectRecent={() => setShowRecentImagesModal(true)}
          onRemoveImage={() =>
            setAttachment((prev) => ({
              ...prev,
              imageBase64: null,
              imageName: null,
              moderationStatus: "idle",
            }))
          }
          onRemoveDocument={() =>
            setAttachment((prev) => ({
              ...prev,
              documentText: null,
              documentName: null,
            }))
          }
          onApplyImageSuggestion={(text) => setInput(text)}
          onOpenVoiceMode={() => setShowVoiceMode(true)}
        />
      </div>

      {/* Recent Images Picker Modal */}
      {showRecentImagesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowRecentImagesModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Recent images"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Recent images
              </h2>
              <button
                type="button"
                onClick={() => setShowRecentImagesModal(false)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Close
              </button>
            </div>
            {recentImages.length === 0 ? (
              <p className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                No recently uploaded images yet.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {recentImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setShowRecentImagesModal(false);
                      void processSelectedImage(img, `recent-${idx + 1}.png`);
                    }}
                    className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 aspect-square hover:border-[#5B9EC2] transition-colors"
                  >
                    <img
                      src={img}
                      alt={`Recent upload ${idx + 1}`}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing Settings, Voice, Onboarding, Context Menu & Dashboard Modals */}
      {showSettings && (
        <SettingsPanel
          user={user}
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
        />
      )}

      <VoiceMode
        open={showVoiceMode}
        onClose={() => setShowVoiceMode(false)}
        onTranscript={handleVoiceTranscript}
        getLatestAssistantReply={getLatestAssistantReply}
      />

      <VoiceOutput enabled={voiceAutoRead} text={latestAssistantText} />

      {contextMessage && contextMenuIndex !== null && (
        <MessageContextMenu
          open={true}
          onClose={() => setContextMenuIndex(null)}
          role={contextMessage.role}
          content={contextMessage.content}
          onCopy={() => void handleCopyText(contextMessage.content)}
          onSelectText={() => {
            showToast("Tip: drag across any text to select", "info");
          }}
          onRegenerate={() => void handleRegenerate(contextMenuIndex)}
          onGoodResponse={() => handleRateMessage(contextMenuIndex, "up")}
          onBadResponse={() => handleRateMessage(contextMenuIndex, "down")}
          onReadAloud={() => handleToggleSpeak(contextMenuIndex, contextMessage.content)}
          onShare={() => void handleShareExcerpt(contextMessage.content)}
          onReport={() => showToast("Issue report logged for review", "info")}
        />
      )}

      <DeleteChatModal
        chat={deleteTarget}
        deleting={deletingChat}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDeleteChat()}
      />

      <ImageLightboxModal
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
        onDownload={(url) => void handleDownloadImage(url)}
        onShare={(url) => void handleShareExcerpt(url)}
      />

      <FileIndexModal
        open={showFileModal}
        fileName={activeProject?.name || "Project files"}
        indexing={indexingFile}
        onSkip={() => setShowFileModal(false)}
        onIndex={() => void runProjectFileReading()}
      />

      <UpgradeModal
        open={upgradeModal.open}
        reason={upgradeModal.reason}
        onClose={() => setUpgradeModal((prev) => ({ ...prev, open: false }))}
      />

      <ToastContainer />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] w-full items-center justify-center bg-white dark:bg-[#09090B] text-sm text-zinc-500">
          Loading Gyra workspace...
        </div>
      }
    >
      <DashboardWorkspace />
    </Suspense>
  );
}
