"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export interface CodeTab {
  id: string;
  label: string;
  code: string;
}

export function CodeSnippetBlock({
  tabs,
  title,
}: {
  tabs: CodeTab[];
  title?: string;
}) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const [copied, setCopied] = useState(false);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  if (!active) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="overflow-hidden border border-[#D4DFE9] bg-[#060B10] text-[#E6EFF6] dark:border-white/12">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#0B1219] px-3 py-2">
        <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
          {title && (
            <span className="mr-3 font-mono-tech text-[10.5px] tracking-[0.1em] text-[#7D96AA] uppercase whitespace-nowrap">
              {title}
            </span>
          )}
          {tabs.length > 1 && (
            <div role="tablist" className="flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={tab.id === active.id}
                  onClick={() => setActiveId(tab.id)}
                  className={`px-2.5 py-1 font-mono-tech text-[11px] transition-colors whitespace-nowrap ${
                    tab.id === active.id
                      ? "bg-[#1F5B7C] text-white"
                      : "text-[#8BA0B2] hover:bg-white/6 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1.5 border border-white/12 px-2.5 py-1 font-mono-tech text-[10.5px] text-[#C4D6E4] transition-colors hover:border-[#5B9EC2] hover:text-white whitespace-nowrap"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#4A9A80]" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono-tech text-[12.5px] leading-[1.65] text-[#DCE9F2]">
        <code>{active.code}</code>
      </pre>
    </div>
  );
}
