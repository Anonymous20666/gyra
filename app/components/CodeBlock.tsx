"use client";

import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  language?: string;
  code: string;
}

const LANG_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  tsx: "tsx",
  jsx: "jsx",
  py: "python",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
  txt: "text",
};

export default function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const rawLang = (language || "text").toLowerCase().trim();
  const resolvedLang = LANG_ALIASES[rawLang] || rawLang;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked in insecure context
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#0D0E12] text-zinc-100">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800/90 bg-[#121318] px-3.5 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={1.75} />
          <span className="truncate font-mono text-xs text-zinc-300 lowercase">
            {rawLang || "code"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B9EC2] whitespace-nowrap shrink-0"
          aria-label={copied ? "Code copied" : "Copy code"}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={resolvedLang}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "0.84rem",
            lineHeight: "1.6",
            fontFamily: "var(--font-gyra-mono), ui-monospace, SFMono-Regular, monospace",
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-gyra-mono), ui-monospace, SFMono-Regular, monospace",
            },
          }}
          PreTag="div"
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
