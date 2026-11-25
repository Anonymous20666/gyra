"use client";

import React from "react";

interface JsonHighlightProps {
  value: string;
  className?: string;
}

const JSON_TOKEN_REGEX =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;

export function JsonSyntaxHighlight({ value, className = "" }: JsonHighlightProps) {
  const lines = value.split("\n");

  return (
    <pre
      className={`font-mono text-[12.5px] leading-[1.6] text-[#D4D4D8] overflow-x-auto ${className}`}
    >
      {lines.map((line, lineIdx) => {
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        JSON_TOKEN_REGEX.lastIndex = 0;

        while ((match = JSON_TOKEN_REGEX.exec(line)) !== null) {
          if (match.index > lastIndex) {
            parts.push(line.slice(lastIndex, match.index));
          }
          const token = match[0];
          let colorClass = "text-[#D4D4D8]";

          if (token.startsWith('"')) {
            if (token.endsWith(":")) {
              colorClass = "text-[#7DD3FC]"; // key
            } else {
              colorClass = "text-[#A7F3D0]"; // string value
            }
          } else if (token === "true" || token === "false") {
            colorClass = "text-[#FCD34D]"; // boolean
          } else if (token === "null") {
            colorClass = "text-[#A1A1AA]"; // null
          } else {
            colorClass = "text-[#C4B5FD]"; // number
          }

          parts.push(
            <span key={`${lineIdx}-${match.index}`} className={colorClass}>
              {token}
            </span>
          );
          lastIndex = match.index + token.length;
        }

        if (lastIndex < line.length) {
          parts.push(line.slice(lastIndex));
        }

        return (
          <div key={lineIdx} className="flex">
            <span
              className="select-none w-9 pr-3 text-right text-[#52525B] tabular-nums shrink-0"
              aria-hidden="true"
            >
              {lineIdx + 1}
            </span>
            <span className="whitespace-pre-wrap break-all">{parts.length ? parts : " "}</span>
          </div>
        );
      })}
    </pre>
  );
}
