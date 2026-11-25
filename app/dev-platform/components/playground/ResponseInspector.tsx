"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Copy, Terminal } from "lucide-react";
import { generateCodeSnippet, type CodeLanguage } from "../../lib/codeGen";
import type { GyraEndpointSpec } from "../../lib/gyraCatalog";
import type { StreamMetrics } from "../../lib/streaming";
import { detectResponseMedia } from "../../lib/validation";
import { JsonSyntaxHighlight } from "../shell/JsonSyntaxHighlight";
import { LiveStreamVisualizer } from "./LiveStreamVisualizer";
import { MediaResultViewer } from "./MediaResultViewer";

export interface ExecutionResult {
  statusCode: number | null;
  latencyMs: number | null;
  payloadSizeLabel: string | null;
  requestId: string | null;
  headers: Record<string, string>;
  rawText: string;
  parsedJson: unknown | null;
  error: string | null;
  isSamplePreview: boolean;
  streaming: boolean;
  streamMetrics?: StreamMetrics;
}

interface ResponseInspectorProps {
  endpoint: GyraEndpointSpec;
  requestBody: string;
  apiKey: string;
  apiBaseUrl?: string;
  result: ExecutionResult | null;
  loading: boolean;
  onPollVideoStatus?: (requestId: string) => void;
}

type InspectorTab = "rendered" | "json" | "raw" | "headers" | "code";

export function ResponseInspector({
  endpoint,
  requestBody,
  apiKey,
  apiBaseUrl,
  result,
  loading,
  onPollVideoStatus,
}: ResponseInspectorProps) {
  const [tab, setTab] = useState<InspectorTab>("rendered");
  const [codeLang, setCodeLang] = useState<CodeLanguage>("curl");
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pinnedToBottomRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !result?.streaming || !pinnedToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [result?.rawText, result?.streaming]);

  const detected = useMemo(() => {
    if (!result) return null;
    if (result.parsedJson !== null) {
      return detectResponseMedia(result.parsedJson, endpoint.id);
    }
    if (result.rawText) {
      return detectResponseMedia(result.rawText, endpoint.id);
    }
    return null;
  }, [result, endpoint.id]);

  const codeSnippet = useMemo(
    () => generateCodeSnippet(codeLang, endpoint, requestBody, apiKey, apiBaseUrl),
    [codeLang, endpoint, requestBody, apiKey, apiBaseUrl]
  );

  const prettyJsonText = useMemo(() => {
    if (!result) return "";
    if (result.parsedJson !== null) {
      return JSON.stringify(result.parsedJson, null, 2);
    }
    return result.rawText;
  }, [result]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  };

  const statusTone = (code: number | null) => {
    if (code === null) return "text-[#A1A1AA]";
    if (code >= 200 && code < 300) return "text-emerald-400";
    if (code >= 400 && code < 500) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="flex flex-col h-full bg-[#000000]">
      {/* Inspector Tab Bar & Copy */}
      <div className="px-3.5 py-2.5 border-b border-[#1F1F23] flex items-center justify-between gap-2">
        <div
          className="inline-flex items-center p-0.5 rounded-md bg-[#000000] border border-[#1F1F23] overflow-x-auto min-w-0"
          role="tablist"
          aria-label="Response inspector views"
        >
          {(
            [
              { id: "rendered", label: "Rendered" },
              { id: "json", label: "JSON" },
              { id: "raw", label: "Raw" },
              { id: "headers", label: "Headers" },
              { id: "code", label: "Code" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-2.5 py-1 text-[11.5px] font-medium rounded transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "bg-[#121215] text-[#F4F4F5]"
                  : "text-[#71717A] hover:text-[#D4D4D8]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {(tab === "code" || result?.rawText) && (
          <button
            type="button"
            onClick={() =>
              handleCopy(tab === "code" ? codeSnippet : prettyJsonText || result?.rawText || "")
            }
            className="px-2 py-1 text-[11.5px] font-medium text-[#A1A1AA] hover:text-[#F4F4F5] bg-[#09090B] hover:bg-[#121215] border border-[#1F1F23] rounded inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        )}
      </div>

      {/* Real Execution Telemetry Bar */}
      {result && tab !== "code" && (
        <div className="px-4 py-2 border-b border-[#18181B] bg-[#000000] flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] font-mono tabular-nums">
          {result.isSamplePreview && (
            <span className="text-amber-400 font-medium">
              Sample Preview (Not Executed)
            </span>
          )}
          {result.statusCode !== null && (
            <span className={`font-semibold ${statusTone(result.statusCode)}`}>
              HTTP {result.statusCode}
            </span>
          )}
          {result.latencyMs !== null && (
            <span className="text-[#A1A1AA]">{result.latencyMs}ms</span>
          )}
          {result.payloadSizeLabel && (
            <span className="text-[#71717A]">{result.payloadSizeLabel}</span>
          )}
          {result.requestId && (
            <span className="text-[#71717A] truncate max-w-[180px]">
              {result.requestId}
            </span>
          )}
          {detected?.usage?.total_tokens !== undefined && detected.usage.total_tokens > 0 && (
            <span className="text-[#D4D4D8]">
              {detected.usage.total_tokens} tokens
            </span>
          )}
          {detected?.balanceAfter !== undefined && (
            <span className="text-emerald-400">
              Balance ${detected.balanceAfter.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* Body Area */}
      <div
        ref={scrollRef}
        onScroll={() => {
          const el = scrollRef.current;
          if (!el) return;
          pinnedToBottomRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 64;
        }}
        className="flex-1 overflow-y-auto p-4"
      >
        {tab === "code" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div
                className="inline-flex items-center p-0.5 rounded-md bg-[#000000] border border-[#1F1F23]"
                role="tablist"
                aria-label="Code language"
              >
                {(
                  [
                    { id: "curl", label: "cURL" },
                    { id: "typescript", label: "TypeScript" },
                    { id: "python", label: "Python" },
                  ] as const
                ).map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    role="tab"
                    aria-selected={codeLang === l.id}
                    onClick={() => setCodeLang(l.id)}
                    className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors ${
                      codeLang === l.id
                        ? "bg-[#121215] text-[#F4F4F5]"
                        : "text-[#71717A] hover:text-[#D4D4D8]"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-mono text-[#71717A]">
                Synced to live request · Credentials masked
              </span>
            </div>

            <div className="rounded-lg bg-[#000000] border border-[#1F1F23] p-3.5 overflow-x-auto">
              <pre className="font-mono text-[12px] leading-[1.65] text-[#D4D4D8] whitespace-pre">
                <code>{codeSnippet}</code>
              </pre>
            </div>
          </div>
        ) : loading && !result?.rawText && !result?.streaming ? (
          <div className="space-y-3 py-6">
            <div className="h-3.5 w-32 bg-[#121215] rounded animate-pulse" />
            <div className="h-3 w-full bg-[#121215] rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-[#121215] rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-[#121215] rounded animate-pulse" />
            <p className="pt-2 font-mono text-[12px] text-[#5B9EC2]">
              Awaiting response from {endpoint.path}...
            </p>
          </div>
        ) : !result ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-10 h-10 rounded-lg bg-[#09090B] border border-[#1F1F23] flex items-center justify-center text-[#5B9EC2] mb-3.5">
              <Terminal className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h3 className="font-display text-[15px] font-semibold text-[#F4F4F5]">
              Response Inspector Ready
            </h3>
            <p className="mt-1.5 text-[13px] text-[#A1A1AA] max-w-sm leading-relaxed">
              Enter your Gyra API key and click <strong className="text-[#E4E4E7]">Run Request</strong>{" "}
              to execute live against <code className="text-[12px] text-[#D4D4D8]">{endpoint.path}</code>,
              or choose <strong className="text-[#E4E4E7]">Preview Sample</strong> to inspect rich output rendering.
            </p>
          </div>
        ) : result.error && !result.rawText ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-300 font-medium text-[13.5px]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Request Failed</span>
            </div>
            <p className="text-[13px] text-red-200/90 leading-relaxed">{result.error}</p>
          </div>
        ) : tab === "headers" ? (
          <div className="divide-y divide-[#18181B] border border-[#1F1F23] rounded-lg bg-[#000000] overflow-hidden">
            {Object.keys(result.headers).length === 0 ? (
              <p className="p-4 text-[12.5px] text-[#71717A]">
                No response headers exposed by browser CORS policy.
              </p>
            ) : (
              Object.entries(result.headers).map(([k, v]) => (
                <div
                  key={k}
                  className="px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono text-[12px]"
                >
                  <span className="text-[#7DD3FC]">{k}</span>
                  <span className="text-[#D4D4D8] break-all">{v}</span>
                </div>
              ))
            )}
          </div>
        ) : tab === "raw" ? (
          <pre className="font-mono text-[12px] leading-[1.6] text-[#D4D4D8] bg-[#000000] border border-[#1F1F23] rounded-lg p-3.5 overflow-x-auto whitespace-pre-wrap break-all">
            {result.rawText || "(empty response body)"}
          </pre>
        ) : tab === "json" ? (
          <div className="bg-[#000000] border border-[#1F1F23] rounded-lg p-3.5 overflow-x-auto">
            <JsonSyntaxHighlight value={prettyJsonText || "(non-JSON response)"} />
          </div>
        ) : (
          /* RENDERED TAB */
          <div className="space-y-4">
            {result.error && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-[12.5px] text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{result.error}</span>
              </div>
            )}

            {result.streaming && !detected ? (
              <LiveStreamVisualizer
                text={result.rawText}
                streaming={result.streaming}
                model={result.streamMetrics?.model}
                metrics={result.streamMetrics}
                isSamplePreview={result.isSamplePreview}
              />
            ) : detected && detected.kind !== "json" ? (
              <MediaResultViewer
                detected={detected}
                streaming={result.streaming}
                isSamplePreview={result.isSamplePreview}
                streamMetrics={result.streamMetrics}
                onPollVideoStatus={onPollVideoStatus}
              />
            ) : (
              <div className="bg-[#000000] border border-[#1F1F23] rounded-lg p-3.5 overflow-x-auto">
                <JsonSyntaxHighlight value={prettyJsonText} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
