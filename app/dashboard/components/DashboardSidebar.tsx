"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  Code2,
  FolderKanban,
  LayoutGrid,
  LogIn,
  MessageSquare,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import GyraMark from "@/app/components/GyraMark";
import { useTheme } from "@/app/components/ThemeProvider";
import {
  groupChatsByDate,
  type ChatRecord,
  type SubscriptionState,
} from "../types";

type SidebarUser = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
} | null;

type DashboardSidebarProps = {
  user: SidebarUser;
  subscription: SubscriptionState;
  freeLimit: number;
  usedFreeCount: number;
  chats: ChatRecord[];
  chatsLoading: boolean;
  activeChatId: string | null;
  pinnedChatIds: string[];
  desktopCollapsed: boolean;
  mobileOpen: boolean;
  onToggleDesktopCollapse: () => void;
  onCloseMobile: () => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => Promise<void>;
  onTogglePinChat: (chatId: string) => void;
  onRequestDeleteChat: (chat: ChatRecord) => void;
  onOpenSettings: () => void;
};

const WORKSPACE_LINKS = [
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/library", label: "Prompt Samples", icon: LayoutGrid },
  { href: "/studio", label: "Studio", icon: Wand2 },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/playground", label: "Playground", icon: Terminal },
  { href: "/console", label: "Dev Console", icon: Code2 },
];

export default function DashboardSidebar({
  user,
  subscription,
  freeLimit,
  usedFreeCount,
  chats,
  chatsLoading,
  activeChatId,
  pinnedChatIds,
  desktopCollapsed,
  mobileOpen,
  onToggleDesktopCollapse,
  onCloseMobile,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onTogglePinChat,
  onRequestDeleteChat,
  onOpenSettings,
}: DashboardSidebarProps) {
  const { resolved: resolvedTheme, toggle: toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Lock body scrolling when mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [mobileOpen, onCloseMobile]);

  // Close per-chat dropdown when clicking outside
  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpenId]);

  // Focus inline rename input when opened
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  const filteredChats = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => (c.title || "Untitled chat").toLowerCase().includes(q));
  }, [chats, searchQuery]);

  const groupedChats = useMemo(
    () => groupChatsByDate(filteredChats, pinnedChatIds),
    [filteredChats, pinnedChatIds]
  );

  const pinnedSet = useMemo(() => new Set(pinnedChatIds), [pinnedChatIds]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split("@")[0] : "Guest");
  const avatarLetter = (displayName || "G").charAt(0).toUpperCase();

  const startInlineRename = (chat: ChatRecord) => {
    setMenuOpenId(null);
    setEditingChatId(chat.id);
    setEditingTitle(chat.title || "Untitled chat");
  };

  const commitInlineRename = async (chatId: string) => {
    const trimmed = editingTitle.trim();
    setEditingChatId(null);
    if (!trimmed) return;
    await onRenameChat(chatId, trimmed);
  };

  const renderSidebarBody = (isMobile: boolean) => {
    const isCollapsed = !isMobile && desktopCollapsed;

    if (isCollapsed) {
      return (
        <div className="flex h-full flex-col items-center justify-between py-3 px-2 select-none">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onToggleDesktopCollapse}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/80 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
            >
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={onNewChat}
              title="New conversation"
              aria-label="New conversation"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </button>

            <div className="my-2 h-px w-6 bg-zinc-200 dark:bg-zinc-800" />

            {WORKSPACE_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/80 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle color theme"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/80 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              title="Settings"
              aria-label="Open settings"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/80 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} />
            </button>

            {user ? (
              <button
                type="button"
                onClick={onOpenSettings}
                title={user.email || displayName}
                aria-label="Account"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1F5B7C] text-xs font-semibold text-white"
              >
                {avatarLetter}
              </button>
            ) : (
              <Link
                href="/login"
                title="Sign in"
                aria-label="Sign in"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800/80 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
              >
                <LogIn className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex h-full flex-col ${
          isMobile
            ? "pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            : "py-3"
        }`}
      >
        {/* Top brand + collapse/close */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <Link
            href="/"
            onClick={() => isMobile && onCloseMobile()}
            className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2]"
          >
            <GyraMark size={24} />
            <span
              className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-100"
              style={{ fontFamily: "var(--font-gyra-display), sans-serif" }}
            >
              Gyra
            </span>
          </Link>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleDesktopCollapse}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
            >
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* New Chat + Search */}
        <div className="space-y-2 px-3 pb-3">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              if (isMobile) onCloseMobile();
            }}
            className="flex w-full items-center justify-between rounded-xl bg-zinc-900 dark:bg-zinc-100 px-3.5 py-2.5 min-h-[42px] text-sm font-medium text-white dark:text-zinc-950 hover:opacity-92 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2]"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>New chat</span>
            </span>
            <kbd className="hidden md:inline-block font-mono text-[11px] opacity-60">
              ⌘K
            </kbd>
          </button>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations"
              aria-label="Search conversations"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800/90 bg-white dark:bg-[#0E0E11] py-2 pl-8.5 pr-8 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-[#5B9EC2] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Workspace links */}
        <nav aria-label="Gyra workspace" className="px-3 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="grid grid-cols-2 gap-1">
            {WORKSPACE_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && onCloseMobile()}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 min-h-[36px] text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors whitespace-nowrap"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-zinc-400" strokeWidth={1.75} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Scrollable conversation history */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {chatsLoading ? (
            <div className="space-y-2 px-1.5">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="h-9 rounded-lg bg-zinc-200/70 dark:bg-zinc-800/50 animate-pulse"
                />
              ))}
            </div>
          ) : groupedChats.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <MessageSquare
                className="mx-auto mb-2 h-5 w-5 text-zinc-400 dark:text-zinc-600"
                strokeWidth={1.5}
              />
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {searchQuery ? "No matching conversations" : "No conversations yet"}
              </p>
              <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                {searchQuery
                  ? "Try a different keyword."
                  : user
                  ? "Start a new chat to save your history."
                  : "Sign in to sync conversations across devices."}
              </p>
            </div>
          ) : (
            groupedChats.map((group) => (
              <div key={group.label} className="space-y-0.5">
                <div className="px-2.5 pb-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                  {group.label}
                </div>

                {group.items.map((chat) => {
                  const isActive = activeChatId === chat.id;
                  const isPinned = pinnedSet.has(chat.id);
                  const isEditing = editingChatId === chat.id;
                  const isMenuOpen = menuOpenId === chat.id;

                  return (
                    <div
                      key={chat.id}
                      className={`group relative flex items-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-950 dark:text-zinc-50"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      {isEditing ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            void commitInlineRename(chat.id);
                          }}
                          className="flex w-full items-center gap-1 px-2 py-1"
                        >
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => void commitInlineRename(chat.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                setEditingChatId(null);
                              }
                            }}
                            aria-label="Rename conversation"
                            className="w-full rounded-md border border-[#5B9EC2] bg-white dark:bg-[#09090B] px-2 py-1 text-xs text-zinc-950 dark:text-zinc-100 focus:outline-none"
                          />
                          <button
                            type="submit"
                            aria-label="Save title"
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-emerald-600 dark:text-emerald-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={2} />
                          </button>
                        </form>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectChat(chat.id);
                              if (isMobile) onCloseMobile();
                            }}
                            className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 min-h-[38px] text-left text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2] rounded-lg"
                          >
                            {isPinned && (
                              <Pin
                                className="h-3 w-3 shrink-0 text-[#1F5B7C] dark:text-[#5B9EC2]"
                                strokeWidth={2}
                              />
                            )}
                            <span className="truncate font-normal">
                              {chat.title || "Untitled conversation"}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(isMenuOpen ? null : chat.id);
                            }}
                            aria-label={`Conversation options for ${chat.title || "chat"}`}
                            className={`mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300/60 dark:hover:bg-zinc-700/80 hover:text-zinc-950 dark:hover:text-zinc-100 transition-opacity ${
                              isMenuOpen || isActive || isMobile
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100 focus:opacity-100"
                            }`}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
                          </button>

                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              role="menu"
                              className="absolute right-1 top-full z-40 mt-1 w-40 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-1 shadow-xl"
                            >
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => startInlineRename(chat)}
                                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left"
                              >
                                <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                                <span>Rename</span>
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  onTogglePinChat(chat.id);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left"
                              >
                                {isPinned ? (
                                  <>
                                    <PinOff className="h-3.5 w-3.5" strokeWidth={1.75} />
                                    <span>Unpin</span>
                                  </>
                                ) : (
                                  <>
                                    <Pin className="h-3.5 w-3.5" strokeWidth={1.75} />
                                    <span>Pin</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setMenuOpenId(null);
                                  onRequestDeleteChat(chat);
                                }}
                                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left"
                              >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Bottom account, plan & settings */}
        <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 px-3 pt-3 space-y-2">
          {!subscription.isSuper && (
            <Link
              href="/upgrade"
              onClick={() => isMobile && onCloseMobile()}
              className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] px-3 py-2.5 hover:border-[#5B9EC2]/60 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  <Sparkles className="h-3.5 w-3.5 text-[#1F5B7C] dark:text-[#5B9EC2]" strokeWidth={1.75} />
                  <span>Upgrade to SuperGyra</span>
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {Math.min(usedFreeCount, freeLimit)}/{freeLimit} free messages in thread
                </p>
              </div>
            </Link>
          )}

          <div className="flex items-center justify-between gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  if (isMobile) onCloseMobile();
                }}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 min-h-[42px] text-left hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F5B7C] text-xs font-semibold text-white">
                  {avatarLetter}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {displayName}
                  </div>
                  <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                    {subscription.isSuper ? "SuperGyra plan" : "Free plan"}
                  </div>
                </div>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => isMobile && onCloseMobile()}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 min-h-[42px] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 transition-colors"
              >
                <LogIn className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" strokeWidth={1.75} />
                <span>Sign in to Gyra</span>
              </Link>
            )}

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                title={resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
                aria-label="Toggle theme"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Moon className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  if (isMobile) onCloseMobile();
                }}
                title="Settings"
                aria-label="Open settings"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/70 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
              >
                <Settings className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop collapsible sidebar */}
      <aside
        aria-label="Sidebar navigation"
        className={`hidden md:flex shrink-0 flex-col border-r border-zinc-200/90 dark:border-zinc-800/80 bg-[#F6F8FA] dark:bg-[#000000] transition-[width] duration-200 ease-out ${
          desktopCollapsed ? "w-16" : "w-[264px]"
        }`}
      >
        {renderSidebarBody(false)}
      </aside>

      {/* Mobile off-canvas drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex h-full w-[86vw] max-w-[320px] flex-col border-r border-zinc-200 dark:border-zinc-800 bg-[#F6F8FA] dark:bg-[#000000] shadow-2xl">
            {renderSidebarBody(true)}
          </aside>
        </div>
      )}
    </>
  );
}
