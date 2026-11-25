"use client";

import { useEffect } from "react";
import {
  Copy,
  Flag,
  RotateCcw,
  Share2,
  TextSelect,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  X,
} from "lucide-react";

type MessageContextMenuProps = {
  open: boolean;
  onClose: () => void;
  role: "user" | "assistant";
  content: string;
  onCopy: () => void;
  onSelectText: () => void;
  onRegenerate?: () => void;
  onGoodResponse?: () => void;
  onBadResponse?: () => void;
  onReadAloud?: () => void;
  onShare?: () => void;
  onReport?: () => void;
};

export default function MessageContextMenu({
  open,
  onClose,
  role,
  onCopy,
  onSelectText,
  onRegenerate,
  onGoodResponse,
  onBadResponse,
  onReadAloud,
  onShare,
  onReport,
}: MessageContextMenuProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const actions = [
    { label: "Copy message", icon: Copy, onClick: onCopy, show: true },
    { label: "Select text", icon: TextSelect, onClick: onSelectText, show: true },
    {
      label: "Regenerate response",
      icon: RotateCcw,
      onClick: onRegenerate,
      show: role === "assistant" && !!onRegenerate,
    },
    {
      label: "Good response",
      icon: ThumbsUp,
      onClick: onGoodResponse,
      show: role === "assistant" && !!onGoodResponse,
    },
    {
      label: "Needs improvement",
      icon: ThumbsDown,
      onClick: onBadResponse,
      show: role === "assistant" && !!onBadResponse,
    },
    {
      label: "Read aloud",
      icon: Volume2,
      onClick: onReadAloud,
      show: role === "assistant" && !!onReadAloud,
    },
    { label: "Share excerpt", icon: Share2, onClick: onShare, show: !!onShare },
    {
      label: "Report issue",
      icon: Flag,
      onClick: onReport,
      show: role === "assistant" && !!onReport,
      destructive: true,
    },
  ].filter((a) => a.show);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Message actions"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] overflow-hidden shadow-2xl pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Message options
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-1.5">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  action.onClick?.();
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 min-h-[44px] text-sm font-medium transition-colors text-left ${
                  action.destructive
                    ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
