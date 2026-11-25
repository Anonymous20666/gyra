"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  FolderKanban,
  Lock,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  GYRA_MODELS,
  type DashboardMode,
  type ModelId,
  type ProjectInfo,
  type SubscriptionState,
} from "../types";

type ChatHeaderProps = {
  chatTitle: string;
  hasActiveChat: boolean;
  activeProject: ProjectInfo | null;
  selectedModel: ModelId;
  mode: DashboardMode;
  subscription: SubscriptionState;
  voiceAutoRead: boolean;
  onOpenMobileMenu: () => void;
  onSelectModel: (model: ModelId) => void;
  onSelectMode: (mode: DashboardMode) => void;
  onRenameActiveChat: (newTitle: string) => Promise<void>;
  onShareChat: () => void;
  onNewChat: () => void;
  onToggleVoiceAutoRead: () => void;
  onOpenUpgrade: () => void;
};

export default function ChatHeader({
  chatTitle,
  hasActiveChat,
  activeProject,
  selectedModel,
  mode,
  subscription,
  voiceAutoRead,
  onOpenMobileMenu,
  onSelectModel,
  onSelectMode,
  onRenameActiveChat,
  onShareChat,
  onNewChat,
  onToggleVoiceAutoRead,
  onOpenUpgrade,
}: ChatHeaderProps) {
  const [modelPopoverOpen, setModelPopoverOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(chatTitle);

  const modelRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const currentModel = GYRA_MODELS.find((m) => m.id === selectedModel) || GYRA_MODELS[0];


  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelPopoverOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModelPopoverOpen(false);
        setMoreMenuOpen(false);
        setEditingTitle(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const commitTitle = async () => {
    const next = draftTitle.trim();
    setEditingTitle(false);
    if (!next || next === chatTitle) return;
    await onRenameActiveChat(next);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-[#09090B]/90 px-3 sm:px-5 backdrop-blur-md">
      {/* Left: Mobile drawer trigger + Model selector + Active title */}
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="flex md:hidden h-11 w-11 -ml-1.5 shrink-0 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>

        {/* Model Selector Popover */}
        <div ref={modelRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setModelPopoverOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={modelPopoverOpen}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 min-h-[38px] text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2] whitespace-nowrap"
          >
            <span>{currentModel.shortName}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-150 ${
                modelPopoverOpen ? "rotate-180" : ""
              }`}
              strokeWidth={2}
            />
          </button>

          {modelPopoverOpen && (
            <div
              role="listbox"
              aria-label="Select Gyra model"
              className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-1.5 shadow-2xl z-50"
            >
              <div className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                Select model
              </div>
              {GYRA_MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                const locked = model.requiresSuper && !subscription.isSuper;
                return (
                  <button
                    key={model.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setModelPopoverOpen(false);
                      if (locked) {
                        onOpenUpgrade();
                        return;
                      }
                      onSelectModel(model.id);
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-zinc-100 dark:bg-zinc-800/90"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {model.name}
                        </span>
                        {locked && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1F5B7C] dark:text-[#7DD3FC]">
                            <Lock className="h-3 w-3" strokeWidth={2} />
                            SuperGyra
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
                        {model.summary}
                      </p>
                      <p className="mt-1 text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                        {model.capabilityNote}
                      </p>
                    </div>
                    <div className="mt-0.5 shrink-0">
                      {isSelected && (
                        <Check
                          className="h-4 w-4 text-[#1F5B7C] dark:text-[#5B9EC2]"
                          strokeWidth={2.25}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider + Context Title on tablet/desktop */}
        {(hasActiveChat || activeProject) && (
          <div className="hidden lg:flex min-w-0 items-center gap-2.5 pl-1">
            <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 shrink-0" aria-hidden="true" />
            {activeProject && (
              <Link
                href={`/projects/${activeProject.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1F5B7C] dark:text-[#7DD3FC] hover:underline whitespace-nowrap shrink-0"
              >
                <FolderKanban className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="max-w-[140px] truncate">{activeProject.name}</span>
              </Link>
            )}
            {hasActiveChat && (
              editingTitle ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void commitTitle();
                  }}
                  className="flex items-center gap-1"
                >
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onBlur={() => void commitTitle()}
                    aria-label="Edit conversation title"
                    className="w-48 rounded-md border border-[#5B9EC2] bg-white dark:bg-[#121215] px-2 py-1 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => { setDraftTitle(chatTitle); setEditingTitle(true); }}
                  title="Click to rename conversation"
                  className="group flex items-center gap-1.5 min-w-0 rounded-md px-1.5 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <span className="max-w-[220px] truncate">{chatTitle}</span>
                  <Pencil
                    className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    strokeWidth={1.75}
                  />
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Right: Chat/Agent segmented switch + actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Segmented Chat / Agent mode control (hidden on narrow mobile where composer carries it) */}
        <div
          role="group"
          aria-label="Assistant mode"
          className="hidden sm:inline-flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-[#121215] p-0.5"
        >
          <button
            type="button"
            onClick={() => onSelectMode("chat")}
            aria-pressed={mode === "chat"}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
              mode === "chat"
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectMode("agent")}
            aria-pressed={mode === "agent"}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
              mode === "agent"
                ? "bg-[#1F5B7C] text-white shadow-xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Agent</span>
          </button>
        </div>

        {/* Share active chat (desktop) */}
        {hasActiveChat && (
          <button
            type="button"
            onClick={onShareChat}
            title="Share conversation"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] px-3 py-1.5 min-h-[34px] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
          >
            <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>Share</span>
          </button>
        )}

        {/* Quick New Chat (mobile + tablet) */}
        <button
          type="button"
          onClick={onNewChat}
          title="New chat"
          aria-label="New chat"
          className="flex md:hidden h-10 w-10 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
        >
          <Plus className="h-5 w-5" strokeWidth={1.75} />
        </button>

        {/* Overflow menu */}
        <div ref={moreRef} className="relative">
          <button
            type="button"
            onClick={() => setMoreMenuOpen((v) => !v)}
            aria-label="More chat options"
            aria-expanded={moreMenuOpen}
            className="flex h-9 w-9 sm:h-9 sm:w-9 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
          </button>

          {moreMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-1.5 shadow-2xl z-50"
            >
              {hasActiveChat && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    onShareChat();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 min-h-[40px] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left"
                >
                  <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  <span>Share conversation</span>
                </button>
              )}

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onToggleVoiceAutoRead();
                  setMoreMenuOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 min-h-[40px] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left"
              >
                {voiceAutoRead ? (
                  <>
                    <VolumeX className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>Mute auto-read replies</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>Auto-read replies</span>
                  </>
                )}
              </button>

              <Link
                href="/docs"
                onClick={() => setMoreMenuOpen(false)}
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 min-h-[40px] text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <BookOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Documentation</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
