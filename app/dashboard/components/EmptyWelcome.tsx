"use client";

import {
  ArrowUpRight,
  Bot,
  FileSearch,
  Globe,
  PenLine,
} from "lucide-react";
import GyraMark from "@/app/components/GyraMark";
import type { DashboardMode, ProjectInfo } from "../types";

type EmptyWelcomeProps = {
  mode: DashboardMode;
  activeProject: ProjectInfo | null;
  onSelectStarter: (opts: {
    prompt: string;
    mode?: DashboardMode;
    enableSearch?: boolean;
    enableThink?: boolean;
    submitImmediately?: boolean;
  }) => void;
  onTriggerAttachment: () => void;
};

const STARTERS = [
  {
    id: "write",
    title: "Reason & write",
    subtitle: "Draft technical specs, emails, or clear strategy memos",
    prompt:
      "Draft a concise product launch memo outlining problem, solution, rollout milestones, and key risks.",
    icon: PenLine,
    mode: "chat" as DashboardMode,
    enableThink: true,
    enableSearch: false,
    isAttachment: false,
  },
  {
    id: "agent",
    title: "Build with Agent pipeline",
    subtitle: "Run Orion, Architect, Forge, Sentinel, and Mentor end-to-end",
    prompt:
      "Build a rate-limited TypeScript API endpoint with Zod validation, clean error responses, and unit tests.",
    icon: Bot,
    mode: "agent" as DashboardMode,
    enableThink: false,
    enableSearch: false,
    isAttachment: false,
  },
  {
    id: "research",
    title: "Research with live web",
    subtitle: "Fetch current sources with Atlas internal search and citations",
    prompt:
      "Compare the current strengths and trade-offs of Next.js App Router, Remix, and Astro in 2026.",
    icon: Globe,
    mode: "chat" as DashboardMode,
    enableThink: false,
    enableSearch: true,
    isAttachment: false,
  },
  {
    id: "files",
    title: "Analyze a document or image",
    subtitle: "Attach PDFs, code files, or screenshots for instant inspection",
    prompt: "",
    icon: FileSearch,
    mode: "chat" as DashboardMode,
    enableThink: false,
    enableSearch: false,
    isAttachment: true,
  },
];

export default function EmptyWelcome({
  mode,
  activeProject,
  onSelectStarter,
  onTriggerAttachment,
}: EmptyWelcomeProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-[740px] space-y-7">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121215]">
            <GyraMark size={30} />
          </div>

          <h1
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 text-balance"
            style={{ fontFamily: "var(--font-gyra-display), sans-serif" }}
          >
            {activeProject ? activeProject.name : "What would you like to work on?"}
          </h1>

          <p className="mt-2 max-w-lg text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {activeProject
              ? "Project instructions and indexed files are attached to this conversation."
              : mode === "agent"
              ? "Agent mode coordinates Atlas, Orion, Architect, Forge, Sentinel, and Mentor for structured builds."
              : "Ask directly for fast answers, turn on Think for deeper reasoning, or enable Search for live web citations."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {STARTERS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.isAttachment) {
                    onTriggerAttachment();
                    return;
                  }
                  onSelectStarter({
                    prompt: item.prompt,
                    mode: item.mode,
                    enableSearch: item.enableSearch,
                    enableThink: item.enableThink,
                    submitImmediately: false,
                  });
                }}
                className="group flex items-start gap-3.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#101013] p-4 text-left transition-colors hover:border-[#5B9EC2]/70 hover:bg-zinc-50 dark:hover:bg-[#141418] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2]"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#18181C] text-zinc-600 dark:text-zinc-300 group-hover:text-[#1F5B7C] dark:group-hover:text-[#7DD3FC] transition-colors">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 shrink-0 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      strokeWidth={1.75}
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
