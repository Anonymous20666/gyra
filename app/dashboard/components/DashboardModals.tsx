"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Download,
  FileCheck2,
  Megaphone,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { BroadcastItem, ChatRecord } from "../types";

export function BroadcastBanner({
  broadcast,
  onDismiss,
}: {
  broadcast: BroadcastItem | null;
  onDismiss: () => void;
}) {
  if (!broadcast) return null;

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#101318] px-4 py-2 text-xs">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <Megaphone
            className="h-3.5 w-3.5 shrink-0 text-[#1F5B7C] dark:text-[#7DD3FC]"
            strokeWidth={1.75}
          />
          <p className="truncate">
            <span className="font-semibold">{broadcast.title}</span>
            <span className="mx-1.5 text-zinc-400" aria-hidden="true">
              ·
            </span>
            <span className="text-zinc-600 dark:text-zinc-300">{broadcast.message}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-md p-1 text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-100"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export function DeleteChatModal({
  chat,
  deleting,
  onCancel,
  onConfirm,
}: {
  chat: ChatRecord | null;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!chat) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [chat, onCancel]);

  if (!chat) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-chat-title"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
            <Trash2 className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="delete-chat-title"
              className="text-base font-semibold text-zinc-950 dark:text-zinc-50"
            >
              Delete conversation?
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              “{chat.title || "Untitled conversation"}” and its messages will be permanently removed.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ImageLightboxModal({
  imageUrl,
  onClose,
  onDownload,
  onShare,
}: {
  imageUrl: string | null;
  onClose: () => void;
  onDownload: (url: string) => void;
  onShare: (url: string) => void;
}) {
  useEffect(() => {
    if (!imageUrl) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <div
        className="absolute right-4 top-4 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onDownload(imageUrl)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>Download</span>
        </button>
        <button
          type="button"
          onClick={() => onShare(imageUrl)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
        >
          <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>Share</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <img
        src={imageUrl}
        alt="Expanded view"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[82vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export function FileIndexModal({
  open,
  fileName,
  indexing,
  onSkip,
  onIndex,
}: {
  open: boolean;
  fileName: string | null;
  indexing: boolean;
  onSkip: () => void;
  onIndex: () => void;
}) {
  if (!open || !fileName) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-index-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1F5B7C]/12 dark:bg-[#5B9EC2]/20 text-[#1F5B7C] dark:text-[#7DD3FC]">
            <FileCheck2 className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="file-index-title"
              className="text-base font-semibold text-zinc-950 dark:text-zinc-50"
            >
              Save file to project?
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Index <span className="font-medium text-zinc-800 dark:text-zinc-200">{fileName}</span> so Gyra can reference it across future conversations in this project.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onSkip}
            disabled={indexing}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Use once
          </button>
          <button
            type="button"
            onClick={onIndex}
            disabled={indexing}
            className="rounded-lg bg-[#1F5B7C] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#194a66] disabled:opacity-50"
          >
            {indexing ? "Saving..." : "Save to project"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UpgradeModal({
  open,
  reason,
  onClose,
}: {
  open: boolean;
  reason: "limit" | "super-model";
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F5B7C]/12 dark:bg-[#5B9EC2]/20 text-[#1F5B7C] dark:text-[#7DD3FC]">
              <Sparkles className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2
                id="upgrade-modal-title"
                className="text-base font-semibold text-zinc-950 dark:text-zinc-50"
              >
                {reason === "limit" ? "Free thread limit reached" : "Unlock SuperGyra 2.0"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Upgrade for unlimited conversations and deep reasoning.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <ul className="mt-4 space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4 text-sm text-zinc-700 dark:text-zinc-300">
          <li>· Unlimited messages across all conversations</li>
          <li>· Access to SuperGyra 2.0 deep reasoning engine</li>
          <li>· Built-in image generation and editing</li>
          <li>· Priority execution on the 6-agent pipeline</li>
        </ul>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Not now
          </button>
          <Link
            href="/upgrade"
            className="rounded-lg bg-[#1F5B7C] px-4 py-2 text-xs font-medium text-white hover:bg-[#184863] transition-colors"
          >
            View SuperGyra plans
          </Link>
        </div>
      </div>
    </div>
  );
}

export function TermsModal({
  open,
  onAccept,
}: {
  open: boolean;
  onAccept: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tos-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] p-6 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <ShieldCheck
            className="h-5 w-5 text-[#1F5B7C] dark:text-[#7DD3FC]"
            strokeWidth={1.75}
          />
          <h2 id="tos-title" className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            Terms & privacy
          </h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          By using Gyra, you agree to our{" "}
          <Link href="/terms" className="text-[#1F5B7C] dark:text-[#7DD3FC] underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#1F5B7C] dark:text-[#7DD3FC] underline">
            Privacy Policy
          </Link>
          . Gyra is an AI assistant and may occasionally generate inaccurate outputs — always verify critical decisions.
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onAccept}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-xs font-medium text-white dark:text-zinc-950 hover:opacity-90 transition-opacity"
          >
            Continue to Gyra
          </button>
        </div>
      </div>
    </div>
  );
}
