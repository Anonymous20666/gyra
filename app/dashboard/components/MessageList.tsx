"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  ArrowDown,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Maximize2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import GyraMark from "@/app/components/GyraMark";
import CodeBlock from "@/app/components/CodeBlock";
import {
  extractDomainLabel,
  sanitizeExternalUrl,
  type DashboardMessage,
} from "../types";

type MessageListProps = {
  messages: DashboardMessage[];
  isLoading: boolean;
  liveStatus: string;
  liveAgent: string;
  readingProgress: number | null;
  readingFileName: string;
  speakingIndex: number | null;
  showScrollToBottom: boolean;
  onScrollToBottom: () => void;
  onCopyMessage: (content: string) => void;
  onEditUserMessage: (index: number, newContent: string) => void;
  onRegenerate: (assistantIndex: number) => void;
  onRateMessage: (index: number, rating: "up" | "down") => void;
  onToggleSpeak: (index: number, content: string) => void;
  onShareMessage: (content: string) => void;
  onOpenContextMenu: (index: number) => void;
  onOpenImageLightbox: (url: string) => void;
  onDownloadImage: (url: string) => void;
};

export default function MessageList({
  messages,
  isLoading,
  liveStatus,
  liveAgent,
  readingProgress,
  readingFileName,
  speakingIndex,
  showScrollToBottom,
  onScrollToBottom,
  onCopyMessage,
  onEditUserMessage,
  onRegenerate,
  onRateMessage,
  onToggleSpeak,
  onShareMessage,
  onOpenContextMenu,
  onOpenImageLightbox,
  onDownloadImage,
}: MessageListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [expandedPanels, setExpandedPanels] = useState<Record<number, boolean>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState("");

  const handleCopy = (index: number, content: string) => {
    onCopyMessage(content);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex((prev) => (prev === index ? null : prev));
    }, 1800);
  };

  const togglePanel = (index: number) => {
    setExpandedPanels((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const startEdit = (index: number, content: string) => {
    setEditingIndex(index);
    setEditingDraft(content);
  };

  const submitEdit = (index: number) => {
    const trimmed = editingDraft.trim();
    setEditingIndex(null);
    if (!trimmed) return;
    onEditUserMessage(index, trimmed);
  };

  return (
    <div className="relative mx-auto w-full max-w-[780px] px-4 sm:px-6 pt-5 pb-6 space-y-6">
      {messages.map((msg, index) => {
        const isLast = index === messages.length - 1;
        const isStreamingThis = isLoading && isLast && msg.role === "assistant";
        const isUser = msg.role === "user";

        if (isUser) {
          const isEditing = editingIndex === index;
          return (
            <div key={msg.id || `user-${index}`} className="group flex flex-col items-end">
              {msg.imageBase64 && (
                <button
                  type="button"
                  onClick={() => onOpenImageLightbox(msg.imageBase64!)}
                  className="mb-2 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-[240px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2]"
                >
                  <img
                    src={msg.imageBase64}
                    alt="Uploaded attachment"
                    className="max-h-56 w-auto object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              )}

              {msg.fileName && (
                <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121215] px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                  <FileText className="h-3.5 w-3.5 text-[#1F5B7C] dark:text-[#5B9EC2]" strokeWidth={1.75} />
                  <span className="max-w-[240px] truncate">{msg.fileName}</span>
                </div>
              )}

              {isEditing ? (
                <div className="w-full max-w-[90%] sm:max-w-[82%] rounded-2xl border border-[#5B9EC2] bg-white dark:bg-[#121215] p-3">
                  <textarea
                    value={editingDraft}
                    onChange={(e) => setEditingDraft(e.target.value)}
                    rows={3}
                    aria-label="Edit message"
                    className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                  <div className="mt-2.5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => submitEdit(index)}
                      disabled={!editingDraft.trim()}
                      className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 text-xs font-medium text-white dark:text-zinc-950 hover:opacity-90 disabled:opacity-40"
                    >
                      Save & resend
                    </button>
                  </div>
                </div>
              ) : (
                <div className="max-w-[88%] sm:max-w-[78%] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-100/90 dark:bg-[#18181B] px-4 py-3 text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              )}

              {!isEditing && (
                <div className="mt-1.5 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleCopy(index, msg.content)}
                    aria-label="Copy prompt"
                    title="Copy"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
                    ) : (
                      <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                    )}
                  </button>
                  {!isLoading && (
                    <button
                      type="button"
                      onClick={() => startEdit(index, msg.content)}
                      aria-label="Edit and resend"
                      title="Edit"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        }

        const hasActivityDetails =
          Boolean(msg.reasoning) || (msg.agentLogs && msg.agentLogs.length > 0);
        const isPanelOpen = Boolean(expandedPanels[index]);
        const cleanSources = (msg.sources || [])
          .map((u) => ({ raw: u, safe: sanitizeExternalUrl(u) }))
          .filter((item): item is { raw: string; safe: string } => Boolean(item.safe));
        const isSpeaking = speakingIndex === index;

        return (
          <article
            key={msg.id || `assistant-${index}`}
            className="group flex items-start gap-3 sm:gap-4"
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
              <GyraMark size={18} />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Gyra</span>
                {msg.modeUsed === "agent" && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-[#1F5B7C] dark:text-[#7DD3FC]">
                      <Bot className="h-3 w-3" strokeWidth={1.75} />
                      Agent pipeline
                    </span>
                  </>
                )}
                {msg.totalTime && !isStreamingThis && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-[11px]">{msg.totalTime}s</span>
                  </>
                )}
              </div>

              {isLast && readingProgress !== null && (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121215] p-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="inline-flex items-center gap-2 truncate">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-[#5B9EC2]" strokeWidth={1.75} />
                      <span className="truncate">Reading {readingFileName || "attachment"}</span>
                    </span>
                    <span className="font-mono tabular-nums text-[11px] text-zinc-500">
                      {readingProgress}%
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full bg-[#1F5B7C] dark:bg-[#5B9EC2] transition-all duration-150"
                      style={{ width: `${readingProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {isStreamingThis && (liveStatus || !msg.content) && (
                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin text-[#1F5B7C] dark:text-[#5B9EC2] shrink-0"
                    strokeWidth={2}
                  />
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {liveAgent || "Gyra"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{liveStatus || "Generating response..."}</span>
                </div>
              )}

              {hasActivityDetails && (
                <div className="rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/70 dark:bg-[#101014]">
                  <button
                    type="button"
                    onClick={() => togglePanel(index)}
                    aria-expanded={isPanelOpen}
                    className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      {isPanelOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                      )}
                      <span className="truncate">
                        {msg.agentLogs && msg.agentLogs.length > 1
                          ? `Activity trace (${msg.agentLogs.length} steps)`
                          : "Reasoning notes"}
                      </span>
                    </span>
                    {msg.totalTime && (
                      <span className="font-mono tabular-nums text-[11px] text-zinc-400 shrink-0">
                        {msg.totalTime}s
                      </span>
                    )}
                  </button>

                  {isPanelOpen && (
                    <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 px-3.5 py-3 space-y-3 text-xs">
                      {msg.agentLogs && msg.agentLogs.length > 0 && (
                        <ol className="space-y-1.5">
                          {msg.agentLogs.map((entry, idx) => (
                            <li
                              key={`${entry.agent}-${idx}`}
                              className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400"
                            >
                              <span className="font-mono text-[11px] text-zinc-400 tabular-nums shrink-0 mt-0.5">
                                {String(idx + 1).padStart(2, "0")}.
                              </span>
                              <span className="font-medium text-zinc-800 dark:text-zinc-200 shrink-0">
                                {entry.agent}
                              </span>
                              <span className="text-zinc-500 dark:text-zinc-400">
                                {entry.status}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}

                      {msg.reasoning && (
                        <div className="rounded-lg border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-[#0B0B0E] p-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                          {msg.reasoning}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {cleanSources.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                    <Globe className="h-3 w-3" strokeWidth={1.75} />
                    Sources
                  </span>
                  {cleanSources.map((src, sIdx) => (
                    <a
                      key={`${src.safe}-${sIdx}`}
                      href={src.safe}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215] px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:border-[#5B9EC2] hover:text-[#1F5B7C] dark:hover:text-[#7DD3FC] transition-colors"
                    >
                      <span className="max-w-[180px] truncate">
                        {extractDomainLabel(src.safe)}
                      </span>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-60" strokeWidth={1.75} />
                    </a>
                  ))}
                </div>
              )}

              {msg.imageUrl && (
                <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121215] max-w-md">
                  <button
                    type="button"
                    onClick={() => onOpenImageLightbox(msg.imageUrl!)}
                    className="block w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2]"
                  >
                    <img
                      src={msg.imageUrl}
                      alt="Generated by Gyra"
                      className="w-full h-auto object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                  <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Generated image</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenImageLightbox(msg.imageUrl!)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadImage(msg.imageUrl!)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {msg.content && (
                <div className="gyra-prose text-[15px] leading-[1.7] text-zinc-900 dark:text-zinc-100 break-words">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="mt-5 mb-2.5 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mt-5 mb-2 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mt-4 mb-1.5 text-base font-semibold text-zinc-950 dark:text-zinc-100">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                      ul: ({ children }) => (
                        <ul className="mb-3 ml-5 list-disc space-y-1.5 marker:text-zinc-400">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-3 ml-5 list-decimal space-y-1.5 marker:text-zinc-400">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => <li className="pl-0.5">{children}</li>,
                      hr: () => (
                        <hr className="my-5 border-zinc-200 dark:border-zinc-800" />
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="my-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121215] px-4 py-3 text-zinc-700 dark:text-zinc-300">
                          {children}
                        </blockquote>
                      ),
                      a: ({ href, children }) => {
                        const safe = href ? sanitizeExternalUrl(href) : null;
                        if (!safe) return <span>{children}</span>;
                        return (
                          <a
                            href={safe}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-[#1F5B7C] dark:text-[#7DD3FC] underline decoration-[#5B9EC2]/40 underline-offset-2 hover:decoration-[#5B9EC2]"
                          >
                            {children}
                          </a>
                        );
                      },
                      table: ({ children }) => (
                        <div className="my-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                          <table className="w-full border-collapse text-left text-sm tabular-nums">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#121215] text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {children}
                        </thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-3.5 py-2.5 font-semibold">{children}</th>
                      ),
                      td: ({ children }) => (
                        <td className="border-t border-zinc-200/70 dark:border-zinc-800/70 px-3.5 py-2.5 text-zinc-700 dark:text-zinc-300">
                          {children}
                        </td>
                      ),
                      code({
                        className,
                        children,
                      }: {
                        className?: string;
                        children?: ReactNode;
                      }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeString = String(children || "").replace(/\n$/, "");
                        const isBlock = Boolean(match) || codeString.includes("\n");
                        if (isBlock) {
                          return <CodeBlock language={match?.[1]} code={codeString} />;
                        }
                        return (
                          <code className="rounded-md bg-zinc-100 dark:bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[0.86em] text-zinc-900 dark:text-zinc-100">
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>

                  {isStreamingThis && (
                    <span
                      aria-hidden="true"
                      className="ml-1 inline-block h-4 w-1.5 translate-y-0.5 rounded-xs bg-[#1F5B7C] dark:bg-[#5B9EC2] animate-pulse"
                    />
                  )}
                </div>
              )}

              {!isStreamingThis && (msg.content || msg.imageUrl) && (
                <div className="flex flex-wrap items-center gap-1 pt-0.5 text-zinc-400 dark:text-zinc-500">
                  <button
                    type="button"
                    onClick={() => handleCopy(index, msg.content)}
                    title="Copy response"
                    aria-label="Copy response"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                    )}
                  </button>

                  {!isLoading && (
                    <button
                      type="button"
                      onClick={() => onRegenerate(index)}
                      title="Regenerate response"
                      aria-label="Regenerate response"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onRateMessage(index, "up")}
                    title="Good response"
                    aria-label="Good response"
                    aria-pressed={msg.feedback === "up"}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      msg.feedback === "up"
                        ? "bg-zinc-100 dark:bg-zinc-800 text-[#1F5B7C] dark:text-[#7DD3FC]"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onRateMessage(index, "down")}
                    title="Needs improvement"
                    aria-label="Needs improvement"
                    aria-pressed={msg.feedback === "down"}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      msg.feedback === "down"
                        ? "bg-zinc-100 dark:bg-zinc-800 text-red-500 dark:text-red-400"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleSpeak(index, msg.content)}
                    title={isSpeaking ? "Stop reading" : "Read aloud"}
                    aria-label={isSpeaking ? "Stop reading" : "Read aloud"}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isSpeaking
                        ? "bg-zinc-100 dark:bg-zinc-800 text-[#1F5B7C] dark:text-[#7DD3FC]"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-3.5 w-3.5" strokeWidth={1.75} />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onShareMessage(msg.content)}
                    title="Share response"
                    aria-label="Share response"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenContextMenu(index)}
                    title="More actions"
                    aria-label="More message actions"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {showScrollToBottom && (
        <div className="sticky bottom-3 flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={onScrollToBottom}
            aria-label="Scroll to latest message"
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-[#141418]/95 text-zinc-700 dark:text-zinc-200 shadow-lg backdrop-blur hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowDown className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
