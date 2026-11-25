"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUp,
  AudioLines,
  Bot,
  CheckCircle2,
  FileText,
  Globe,
  Lightbulb,
  Loader2,
  Plus,
  Square,
  X,
} from "lucide-react";
import AttachmentMenu from "@/app/components/AttachmentMenu";
import type { AttachmentState, DashboardMode } from "../types";

type ChatComposerProps = {
  input: string;
  mode: DashboardMode;
  thinkMode: boolean;
  searchMode: boolean;
  isLoading: boolean;
  attachment: AttachmentState;
  attachmentMenuOpen: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStopGeneration: () => void;
  onSelectMode: (mode: DashboardMode) => void;
  onToggleThink: () => void;
  onToggleSearch: () => void;
  onToggleAttachmentMenu: () => void;
  onCloseAttachmentMenu: () => void;
  onSelectCamera: () => void;
  onSelectPhotos: () => void;
  onSelectFiles: () => void;
  onSelectRecent: () => void;
  onRemoveImage: () => void;
  onRemoveDocument: () => void;
  onApplyImageSuggestion: (text: string) => void;
  onOpenVoiceMode: () => void;
};

const IMAGE_SUGGESTIONS = [
  "Describe this image in detail",
  "Extract all text from this image",
  "[generate/change image] Enhance lighting and clarity",
];

export default function ChatComposer({
  input,
  mode,
  thinkMode,
  searchMode,
  isLoading,
  attachment,
  attachmentMenuOpen,
  onInputChange,
  onSubmit,
  onStopGeneration,
  onSelectMode,
  onToggleThink,
  onToggleSearch,
  onToggleAttachmentMenu,
  onCloseAttachmentMenu,
  onSelectCamera,
  onSelectPhotos,
  onSelectFiles,
  onSelectRecent,
  onRemoveImage,
  onRemoveDocument,
  onApplyImageSuggestion,
  onOpenVoiceMode,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const isModerationBlocking =
    attachment.moderationStatus === "checking" ||
    attachment.moderationStatus === "nsfw";

  const hasContent =
    input.trim().length > 0 ||
    Boolean(attachment.imageBase64) ||
    Boolean(attachment.documentText);

  const canSend = !isLoading && !isModerationBlocking && hasContent;

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
  };

  return (
    <div className="shrink-0 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#09090B] dark:via-[#09090B]/95 dark:to-transparent pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-[780px] px-3 sm:px-6">
        <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] shadow-sm transition-colors focus-within:border-[#1F5B7C] dark:focus-within:border-[#5B9EC2]">
          {(attachment.imageBase64 || attachment.documentName) && (
            <div className="border-b border-zinc-200/80 dark:border-zinc-800/80 px-3.5 py-2.5 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                {attachment.imageBase64 && (
                  <div className="relative flex items-center gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181C] p-1.5 pr-3">
                    <img
                      src={attachment.imageBase64}
                      alt={attachment.imageName || "Selected image"}
                      className="h-11 w-11 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="max-w-[160px] truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {attachment.imageName || "Image attached"}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px]">
                        {attachment.moderationStatus === "checking" && (
                          <span className="inline-flex items-center gap-1 text-zinc-500">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Checking image...
                          </span>
                        )}
                        {attachment.moderationStatus === "valid" && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Ready
                          </span>
                        )}
                        {attachment.moderationStatus === "nsfw" && (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            Blocked by safety filter
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onRemoveImage}
                      aria-label="Remove attached image"
                      className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                )}

                {attachment.documentName && (
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181C] px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200">
                    <FileText
                      className="h-4 w-4 shrink-0 text-[#1F5B7C] dark:text-[#5B9EC2]"
                      strokeWidth={1.75}
                    />
                    <span className="max-w-[200px] truncate font-medium">
                      {attachment.documentName}
                    </span>
                    <button
                      type="button"
                      onClick={onRemoveDocument}
                      aria-label="Remove attached document"
                      className="ml-1 flex h-5 w-5 items-center justify-center rounded text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                )}
              </div>

              {attachment.imageBase64 && attachment.moderationStatus === "valid" && (
                <div className="flex flex-wrap gap-1.5">
                  {IMAGE_SUGGESTIONS.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => onApplyImageSuggestion(label)}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141418] px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:border-[#5B9EC2] hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                    >
                      {label.replace("[generate/change image] ", "")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="px-3.5 pt-3 pb-1.5">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                mode === "agent"
                  ? "Describe what you want Gyra agents to research, design, and build..."
                  : "Message Gyra..."
              }
              aria-label="Message Gyra"
              className="block max-h-[200px] min-h-[28px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-1">
            <div className="flex items-center gap-1 min-w-0">
              <div className="relative">
                <button
                  type="button"
                  onClick={onToggleAttachmentMenu}
                  aria-label="Attach files or media"
                  aria-expanded={attachmentMenuOpen}
                  title="Attach image or file"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                </button>

                <AttachmentMenu
                  open={attachmentMenuOpen}
                  onClose={onCloseAttachmentMenu}
                  onSelectCamera={onSelectCamera}
                  onSelectPhotos={onSelectPhotos}
                  onSelectFiles={onSelectFiles}
                  onSelectRecent={onSelectRecent}
                />
              </div>

              <button
                type="button"
                onClick={() => onSelectMode(mode === "agent" ? "chat" : "agent")}
                aria-pressed={mode === "agent"}
                title={mode === "agent" ? "Agent mode active (click for Chat)" : "Switch to Agent mode"}
                className={`inline-flex sm:hidden h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  mode === "agent"
                    ? "bg-[#1F5B7C] text-white"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Bot className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span>Agent</span>
              </button>

              <button
                type="button"
                onClick={onToggleThink}
                aria-pressed={thinkMode}
                title="Step-by-step reasoning"
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  thinkMode
                    ? "bg-[#1F5B7C]/12 dark:bg-[#5B9EC2]/20 text-[#1F5B7C] dark:text-[#7DD3FC]"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Lightbulb className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span>Think</span>
              </button>

              <button
                type="button"
                onClick={onToggleSearch}
                aria-pressed={searchMode}
                title="Search live web sources"
                className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  searchMode
                    ? "bg-[#1F5B7C]/12 dark:bg-[#5B9EC2]/20 text-[#1F5B7C] dark:text-[#7DD3FC]"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Globe className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                <span>Search</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onOpenVoiceMode}
                title="Hands-free voice chat"
                aria-label="Start voice chat"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                <AudioLines className="h-4 w-4" strokeWidth={1.75} />
              </button>

              {isLoading ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  aria-label="Stop generating"
                  title="Stop generation"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90 transition-opacity"
                >
                  <Square className="h-3.5 w-3.5 fill-current" strokeWidth={2} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!canSend}
                  aria-label="Send message"
                  title="Send message"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.25} />
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="hidden sm:block mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
          Gyra can make mistakes. Verify important details.{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300">
            Terms
          </Link>
          {" · "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-zinc-600 dark:hover:text-zinc-300">
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}
