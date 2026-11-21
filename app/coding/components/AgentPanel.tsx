"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Loader2,
  Send,
  Sparkles,
  Square,
  Wrench,
} from "lucide-react";
import { AGENT_MODES, type AgentMode, type ChatMessageView, type ImplementationPlan, type ToolCallView } from "@/app/lib/coding/types";
import { MODES } from "@/app/lib/coding/modes";

interface Props {
  messages: ChatMessageView[];
  loading: boolean;
  mode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
  onSubmit: (text: string) => void;
  onStop: () => void;
  onProceed: (plan: ImplementationPlan) => void;
  onOpenPlan: () => void;
}

function ToolCard({ tool }: { tool: ToolCallView }) {
  const [open, setOpen] = useState(false);
  const duration = tool.endedAt ? `${((tool.endedAt - tool.startedAt) / 1000).toFixed(1)}s` : null;

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-white/5 bg-white/[0.02]">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 px-2.5 py-2 text-left font-mono text-[11px]"
      >
        {tool.state === "running" ? (
          <Loader2 size={12} className="animate-spin text-indigo-400" />
        ) : tool.state === "error" ? (
          <CircleAlert size={12} className="text-red-400" />
        ) : (
          <Check size={12} className="text-emerald-400" />
        )}
        <Wrench size={11} className="text-gray-500" />
        <span className="text-indigo-300">{tool.name}</span>
        <span className="truncate text-gray-500">
          {String(tool.args.path ?? tool.args.command ?? tool.args.query ?? "")}
        </span>
        <span className="ml-auto shrink-0 text-gray-600">{duration}</span>
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
      </button>

      {open && (
        <div className="space-y-2 border-t border-white/5 px-2.5 py-2 font-mono text-[11px]">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-600">input</p>
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-gray-400">
              {JSON.stringify(tool.args, null, 2)}
            </pre>
          </div>
          {tool.result !== undefined && (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-gray-600">output</p>
              <pre className="max-h-52 overflow-auto whitespace-pre-wrap text-gray-400">
                {tool.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  onProceed,
  onOpenPlan,
}: {
  plan: ImplementationPlan;
  onProceed: () => void;
  onOpenPlan: () => void;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-indigo-500/25 bg-indigo-500/[0.06]">
      <div className="flex items-center gap-2 border-b border-indigo-500/20 px-3 py-2">
        <Sparkles size={13} className="text-indigo-300" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
          Implementation plan
        </span>
        <button onClick={onOpenPlan} className="ml-auto text-[10px] text-indigo-300/70 hover:text-indigo-200">
          open
        </button>
      </div>
      <div className="space-y-2 px-3 py-2.5">
        <p className="text-[12px] text-gray-300">{plan.goal}</p>
        <ol className="space-y-1">
          {plan.steps.map((step, index) => (
            <li key={index} className="flex gap-2 text-[12px] text-gray-400">
              <span className="text-indigo-400">{index + 1}.</span>
              <span>
                {step.title}
                {step.files?.length ? (
                  <span className="ml-1 font-mono text-[10px] text-gray-600">
                    {step.files.join(", ")}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
        <button
          onClick={onProceed}
          className="mt-1 w-full rounded-lg bg-indigo-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-indigo-500"
        >
          Proceed
        </button>
      </div>
    </div>
  );
}

export default function AgentPanel({
  messages,
  loading,
  mode,
  onModeChange,
  onSubmit,
  onStop,
  onProceed,
  onOpenPlan,
}: Props) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
        <select
          value={mode}
          onChange={(event) => onModeChange(event.target.value as AgentMode)}
          className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[11px] text-gray-200 outline-none"
        >
          {AGENT_MODES.map((id) => (
            <option key={id} value={id} className="bg-[#111]">
              {MODES[id].label}
            </option>
          ))}
        </select>
        <span className="truncate text-[11px] text-gray-600">{MODES[mode].hint}</span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
        {messages.length === 0 && (
          <div className="mt-10 text-center">
            <Sparkles size={34} className="mx-auto mb-3 text-indigo-400/30" />
            <p className="text-[13px] text-gray-400">I am Forge.</p>
            <p className="mx-auto mt-1 max-w-[260px] text-[11px] leading-relaxed text-gray-600">
              I read files, write real code, run commands and fix my own failures inside this sandbox.
              Plan mode shows you the plan before I touch anything.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-gray-600">
              {message.role === "user" ? "you" : "forge"}
            </p>

            {message.reasoning ? (
              <details className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
                <summary className="cursor-pointer text-[10px] uppercase tracking-wider text-gray-500">
                  reasoning
                </summary>
                <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-gray-500">
                  {message.reasoning}
                </pre>
              </details>
            ) : null}

            {message.content ? (
              <div
                className={`whitespace-pre-wrap rounded-xl px-3 py-2 text-[12.5px] leading-relaxed ${
                  message.role === "user"
                    ? "ml-auto max-w-[92%] bg-indigo-600 text-white"
                    : "max-w-full border border-white/5 bg-white/[0.03] text-gray-200"
                }`}
              >
                {message.content}
              </div>
            ) : null}

            {message.tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}

            {message.plan ? (
              <PlanCard
                plan={message.plan}
                onOpenPlan={onOpenPlan}
                onProceed={() => message.plan && onProceed(message.plan)}
              />
            ) : null}

            {message.error ? (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-2 text-[11px] text-red-300">
                {message.error}
              </p>
            ) : null}

            {message.role === "assistant" &&
            loading &&
            !message.content &&
            !message.reasoning &&
            message.tools.length === 0 ? (
              <p className="animate-pulse text-[12px] text-indigo-400">Forge is working…</p>
            ) : null}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/5 bg-[#0d0d0f] p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!input.trim() || loading) return;
            onSubmit(input.trim());
            setInput("");
          }}
          className="relative"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (input.trim() && !loading) {
                  onSubmit(input.trim());
                  setInput("");
                }
              }
            }}
            rows={2}
            placeholder="Ask Forge to build, fix, test or explain something…"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-3 pr-11 text-[12.5px] text-gray-100 placeholder-gray-600 outline-none focus:border-indigo-500/60"
          />
          {loading ? (
            <button
              type="button"
              onClick={onStop}
              className="absolute right-2 top-2 rounded-lg bg-red-500/20 p-1.5 text-red-300 hover:bg-red-500/30"
            >
              <Square size={13} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 top-2 rounded-lg bg-indigo-600 p-1.5 text-white hover:bg-indigo-500 disabled:opacity-40"
            >
              <Send size={13} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}