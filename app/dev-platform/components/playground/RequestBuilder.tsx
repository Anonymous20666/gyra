"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ClipboardPaste,
  Code2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Square,
  Upload,
  Wand2,
} from "lucide-react";
import type { GyraEndpointSpec } from "../../lib/gyraCatalog";
import {
  formatJsonString,
  validateApiKeyForEndpoint,
  validateJsonBody,
} from "../../lib/validation";
import { ModelExplorer } from "./ModelExplorer";
import {
  ApiCrawlerVisualizer,
  type CrawlerQueueItem,
  type LiveExecutionSnapshot,
} from "./ApiCrawlerVisualizer";

interface RequestBuilderProps {
  endpoint: GyraEndpointSpec;
  apiKey: string;
  onChangeApiKey: (val: string) => void;
  requestBody: string;
  onChangeRequestBody: (val: string) => void;
  loading: boolean;
  elapsedMs: number;
  onRun: () => void;
  onCancel: () => void;
  onPreviewSample: () => void;
  onGoToKeys: () => void;
  runSignal?: number;
  liveExecution?: LiveExecutionSnapshot | null;
  onSelectCrawlerEndpoint?: (item: CrawlerQueueItem) => void;
}

export function RequestBuilder({
  endpoint,
  apiKey,
  onChangeApiKey,
  requestBody,
  onChangeRequestBody,
  loading,
  elapsedMs,
  onRun,
  onCancel,
  onPreviewSample,
  onGoToKeys,
  runSignal = 0,
  liveExecution = null,
  onSelectCrawlerEndpoint,
}: RequestBuilderProps) {
  const [editorMode, setEditorMode] = useState<"visual" | "json">("visual");
  const [showKey, setShowKey] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const keyValidation = useMemo(
    () => validateApiKeyForEndpoint(apiKey, endpoint),
    [apiKey, endpoint]
  );

  const jsonValidation = useMemo(
    () => validateJsonBody(requestBody),
    [requestBody]
  );

  const parsed = jsonValidation.parsed ?? endpoint.defaultBody;
  const isUnavailable = endpoint.availability !== "live";

  const updateJsonField = (field: string, value: unknown) => {
    const base = { ...(jsonValidation.parsed ?? endpoint.defaultBody) };
    if (value === undefined || value === "") {
      delete base[field];
    } else {
      base[field] = value;
    }
    onChangeRequestBody(JSON.stringify(base, null, 2));
  };

  const updateChatMessage = (role: "system" | "user", content: string) => {
    const base = { ...(jsonValidation.parsed ?? endpoint.defaultBody) };
    const existing = Array.isArray(base.messages)
      ? (base.messages as Array<{ role: string; content: string }>)
      : [];
    const next = existing.filter((m) => m.role !== role);
    if (role === "system") {
      if (content.trim()) next.unshift({ role: "system", content });
    } else {
      next.push({ role: "user", content });
    }
    base.messages = next;
    onChangeRequestBody(JSON.stringify(base, null, 2));
  };

  const getChatMessage = (role: "system" | "user"): string => {
    const msgs = Array.isArray(parsed.messages)
      ? (parsed.messages as Array<{ role: string; content: string }>)
      : [];
    return msgs.find((m) => m.role === role)?.content ?? "";
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onChangeApiKey(text.trim());
    } catch {
      // Clipboard read not allowed
    }
  };

  const handleFormatJson = () => {
    const res = formatJsonString(requestBody);
    if (res.ok) onChangeRequestBody(res.formatted);
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(requestBody);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 1600);
    } catch {
      // Ignore
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateJsonField("imageBase64", reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isUnavailable && !loading) onRun();
    }
  };

  const lineCount = Math.max(8, requestBody.split("\n").length);

  return (
    <div
      className="flex flex-col h-full bg-[#000000]"
      onKeyDown={handleKeyDown}
    >
      {/* Endpoint Header Bar */}
      <div className="px-4 py-3 border-b border-[#1F1F23] bg-[#000000] flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#121215] border border-[#27272A] ${
                endpoint.method === "GET" ? "text-emerald-400" : "text-[#5B9EC2]"
              }`}
            >
              {endpoint.method}
            </span>
            <code className="text-[13px] font-medium text-[#F4F4F5] truncate">
              {endpoint.path}
            </code>
          </div>
          <p className="mt-1 text-[12px] text-[#A1A1AA] truncate">
            {endpoint.shortDescription}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-[11.5px] font-mono text-[#71717A]">
          <span>{endpoint.costLabel}</span>
          {endpoint.supportsStreaming && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#5B9EC2]">SSE</span>
            </>
          )}
        </div>
      </div>

      {/* Scrollable Configuration Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3">
        {/* Authentication Bar */}
        <div className="bg-[#09090B] border border-[#1F1F23] rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="playground-api-key"
              className="text-[12px] font-medium text-[#D4D4D8] flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#5B9EC2]" />
              <span>
                {endpoint.authType === "session-token"
                  ? "Gyra Session Token (x-gyra-user-token)"
                  : `API Key (${endpoint.requiredKeyPrefix ?? "gyra_"})`}
              </span>
            </label>
            <button
              type="button"
              onClick={onGoToKeys}
              className="text-[11.5px] font-medium text-[#5B9EC2] hover:text-[#7DD3FC] whitespace-nowrap"
            >
              Generate key
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative flex-1 min-w-0">
              <input
                id="playground-api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => onChangeApiKey(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder={
                  endpoint.authType === "session-token"
                    ? "Paste Gyra session token..."
                    : `Paste ${endpoint.requiredKeyPrefix ?? "gyra_"} key (kept in memory only)`
                }
                className="w-full bg-[#000000] border border-[#1F1F23] focus:border-[#5B9EC2] focus:outline-none rounded-md pl-3 pr-9 py-2 font-mono text-[12.5px] text-[#F4F4F5] placeholder-[#71717A]"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#D4D4D8]"
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handlePasteKey}
              className="px-2.5 py-2 bg-[#121215] hover:bg-[#18181B] border border-[#27272A] rounded-md text-[#D4D4D8] transition-colors shrink-0"
              aria-label="Paste key from clipboard"
              title="Paste from clipboard"
            >
              <ClipboardPaste className="w-4 h-4" />
            </button>
          </div>

          <p
            className={`text-[11.5px] ${
              keyValidation.level === "error"
                ? "text-red-400"
                : keyValidation.level === "warning"
                  ? "text-amber-400"
                  : keyValidation.level === "ok"
                    ? "text-emerald-400"
                    : "text-[#71717A]"
            }`}
          >
            {keyValidation.message}
          </p>
        </div>

        {/* Model Selector when applicable */}
        {endpoint.modelCategory && (
          <div className="space-y-1.5">
            <span className="text-[12px] font-medium text-[#D4D4D8]">Model</span>
            <ModelExplorer
              category={endpoint.modelCategory}
              selectedModelId={
                typeof parsed.model === "string"
                  ? parsed.model
                  : endpoint.modelCategory === "video"
                    ? "gyra-video-1.0"
                    : endpoint.modelCategory === "transcription"
                      ? "whisper-large-v3"
                      : "gyra-1.0"
              }
              onSelectModel={(modelId) => {
                if (endpoint.modelCategory === "chat") {
                  updateJsonField("model", modelId);
                }
              }}
            />
          </div>
        )}

        {/* Presets & Mode Switcher Bar */}
        {!isUnavailable && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div
              className="inline-flex items-center p-0.5 rounded-md bg-[#09090B] border border-[#1F1F23]"
              role="tablist"
              aria-label="Request editor mode"
            >
              <button
                type="button"
                role="tab"
                aria-selected={editorMode === "visual"}
                onClick={() => setEditorMode("visual")}
                className={`px-2.5 py-1 text-[12px] font-medium rounded inline-flex items-center gap-1.5 transition-colors ${
                  editorMode === "visual"
                    ? "bg-[#121215] text-[#F4F4F5]"
                    : "text-[#71717A] hover:text-[#D4D4D8]"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Parameters</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={editorMode === "json"}
                onClick={() => setEditorMode("json")}
                className={`px-2.5 py-1 text-[12px] font-medium rounded inline-flex items-center gap-1.5 transition-colors ${
                  editorMode === "json"
                    ? "bg-[#121215] text-[#F4F4F5]"
                    : "text-[#71717A] hover:text-[#D4D4D8]"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Raw JSON</span>
              </button>
            </div>

            {endpoint.presets.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {endpoint.presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onChangeRequestBody(JSON.stringify(preset.body, null, 2))
                    }
                    className="px-2.5 py-1 text-[11.5px] font-medium text-[#A1A1AA] hover:text-[#F4F4F5] bg-[#09090B] hover:bg-[#121215] border border-[#1F1F23] rounded transition-colors whitespace-nowrap"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unavailable Endpoint Message */}
        {isUnavailable ? (
          <div className="bg-[#09090B] border border-[#1F1F23] rounded-lg p-6 text-center">
            <p className="font-display text-[15px] font-semibold text-[#F4F4F5]">
              {endpoint.title} is currently unavailable
            </p>
            <p className="mt-1.5 text-[13px] text-[#A1A1AA] max-w-md mx-auto">
              This endpoint is documented on the Gyra roadmap but not yet deployed on the backend.
              Switch to AI API or Media API in the explorer to run live requests.
            </p>
          </div>
        ) : editorMode === "visual" ? (
          /* VISUAL PARAMETER BUILDER */
          <div className="bg-[#09090B] border border-[#1F1F23] rounded-lg p-4 space-y-4">
            {endpoint.id === "chat-completions" ? (
              <>
                <div>
                  <label
                    htmlFor="chat-system-prompt"
                    className="block text-[12px] font-medium text-[#D4D4D8] mb-1.5"
                  >
                    System Prompt
                  </label>
                  <textarea
                    id="chat-system-prompt"
                    rows={2}
                    value={getChatMessage("system")}
                    onChange={(e) => updateChatMessage("system", e.target.value)}
                    placeholder="Define assistant role, tone, or output schema..."
                    className="w-full bg-[#000000] border border-[#1F1F23] focus:border-[#5B9EC2] focus:outline-none rounded-md px-3 py-2 text-[13px] text-[#F4F4F5] placeholder-[#71717A] resize-y"
                  />
                </div>

                <div>
                  <label
                    htmlFor="chat-user-prompt"
                    className="block text-[12px] font-medium text-[#D4D4D8] mb-1.5"
                  >
                    User Message
                  </label>
                  <textarea
                    id="chat-user-prompt"
                    rows={4}
                    value={getChatMessage("user")}
                    onChange={(e) => updateChatMessage("user", e.target.value)}
                    placeholder="Ask Gyra to reason, write code, or extract structured data..."
                    className="w-full bg-[#000000] border border-[#1F1F23] focus:border-[#5B9EC2] focus:outline-none rounded-md px-3 py-2 text-[13px] text-[#F4F4F5] placeholder-[#71717A] resize-y"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <label className="inline-flex items-center gap-2 text-[12.5px] text-[#D4D4D8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(parsed.stream)}
                      onChange={(e) => updateJsonField("stream", e.target.checked)}
                      className="accent-[#5B9EC2] rounded"
                    />
                    <span>Stream SSE tokens</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-[12.5px] text-[#D4D4D8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(parsed.voice)}
                      onChange={(e) => updateJsonField("voice", e.target.checked)}
                      className="accent-[#5B9EC2] rounded"
                    />
                    <span>Include voice metadata</span>
                  </label>
                </div>
              </>
            ) : (
              endpoint.params.map((param) => {
                const currentVal = parsed[param.name];
                return (
                  <div key={param.name} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`param-${param.name}`}
                        className="text-[12px] font-medium text-[#D4D4D8] font-mono"
                      >
                        {param.name}
                        {param.required && (
                          <span className="text-amber-400 ml-1" title="Required">
                            *
                          </span>
                        )}
                      </label>
                      <span className="text-[11px] font-mono text-[#71717A]">
                        {param.type}
                      </span>
                    </div>

                    {param.type === "enum" && param.options ? (
                      <div className="flex flex-wrap gap-1.5">
                        {param.options.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateJsonField(param.name, opt)}
                            className={`px-3 py-1.5 text-[12px] font-mono rounded-md border transition-colors ${
                              String(currentVal ?? "") === opt
                                ? "bg-[#121215] border-[#5B9EC2] text-[#F4F4F5]"
                                : "bg-[#000000] border-[#1F1F23] text-[#A1A1AA] hover:border-[#2E2E34]"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : param.type === "number" ? (
                      <input
                        id={`param-${param.name}`}
                        type="number"
                        min={1}
                        max={20}
                        value={typeof currentVal === "number" ? currentVal : 5}
                        onChange={(e) =>
                          updateJsonField(param.name, Number(e.target.value) || 1)
                        }
                        className="w-32 bg-[#000000] border border-[#1F1F23] focus:border-[#5B9EC2] focus:outline-none rounded-md px-3 py-2 font-mono text-[13px] text-[#F4F4F5] tabular-nums"
                      />
                    ) : param.type === "image-data-url" ? (
                      <div className="flex items-center gap-3">
                        <label className="px-3 py-2 bg-[#121215] hover:bg-[#18181B] border border-[#27272A] rounded-md text-[12px] font-medium text-[#D4D4D8] cursor-pointer inline-flex items-center gap-2">
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {currentVal ? "Replace keyframe image" : "Attach optional image"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        {typeof currentVal === "string" && currentVal.length > 0 && (
                          <button
                            type="button"
                            onClick={() => updateJsonField(param.name, undefined)}
                            className="text-[12px] text-[#71717A] hover:text-red-400"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ) : (
                      <textarea
                        id={`param-${param.name}`}
                        rows={param.name === "prompt" || param.name === "text" ? 3 : 1}
                        value={typeof currentVal === "string" ? currentVal : ""}
                        onChange={(e) => updateJsonField(param.name, e.target.value)}
                        placeholder={param.placeholder}
                        className="w-full bg-[#000000] border border-[#1F1F23] focus:border-[#5B9EC2] focus:outline-none rounded-md px-3 py-2 text-[13px] text-[#F4F4F5] placeholder-[#71717A] resize-y"
                      />
                    )}
                    <p className="text-[11.5px] text-[#71717A]">{param.description}</p>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* RAW JSON EDITOR */
          <div className="bg-[#09090B] border border-[#1F1F23] rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-[#1F1F23] flex items-center justify-between gap-2 bg-[#000000]">
              <span className="font-mono text-[11.5px] text-[#A1A1AA]">
                application/json
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFormatJson}
                  className="px-2 py-1 text-[11.5px] text-[#A1A1AA] hover:text-[#F4F4F5] rounded hover:bg-[#121215] inline-flex items-center gap-1"
                  title="Prettify JSON"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>Format</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChangeRequestBody(JSON.stringify(endpoint.defaultBody, null, 2))
                  }
                  className="px-2 py-1 text-[11.5px] text-[#A1A1AA] hover:text-[#F4F4F5] rounded hover:bg-[#121215] inline-flex items-center gap-1"
                  title="Reset to default payload"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-2 py-1 text-[11.5px] text-[#A1A1AA] hover:text-[#F4F4F5] rounded hover:bg-[#121215] inline-flex items-center gap-1"
                >
                  {copiedJson ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedJson ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="flex bg-[#000000]">
              <div
                aria-hidden="true"
                className="select-none py-3 pl-3 pr-2 text-right font-mono text-[12px] leading-[1.6] text-[#52525B] border-r border-[#121215] tabular-nums"
              >
                {Array.from({ length: lineCount }, (_, i) => (
                  <div
                    key={i}
                    className={
                      jsonValidation.errorLine === i + 1 ? "text-red-400 font-semibold" : ""
                    }
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <textarea
                aria-label="Raw JSON request body"
                value={requestBody}
                onChange={(e) => onChangeRequestBody(e.target.value)}
                spellCheck={false}
                rows={Math.min(18, lineCount)}
                className="flex-1 w-full bg-transparent p-3 font-mono text-[12.5px] leading-[1.6] text-[#E4E4E7] focus:outline-none resize-y"
              />
            </div>

            {!jsonValidation.valid && (
              <div className="px-3 py-2 border-t border-red-500/30 bg-red-500/10 flex items-center gap-2 text-[12px] text-red-300">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono">
                  {jsonValidation.errorLine ? `Line ${jsonValidation.errorLine}: ` : ""}
                  {jsonValidation.errorMessage}
                </span>
              </div>
            )}
          </div>
        )}
{/* Live Precision Telemetry API Crawler */}
        <ApiCrawlerVisualizer
          endpointPath={endpoint.path}
          method={endpoint.method === "GET" ? "GET" : "POST"}
          model={
            typeof parsed.model === "string"
              ? parsed.model
              : endpoint.id === "video-generate"
                ? "gyra-video-1.0"
                : endpoint.id === "media-transcribe"
                  ? "whisper-large-v3"
                  : "gyra-1.0"
          }
          systemPrompt={
            getChatMessage("system") ||
            "You are Gyra, a concise AI infrastructure assistant."
          }
          userMessage={
            getChatMessage("user") ||
            (typeof parsed.prompt === "string" ? parsed.prompt : "") ||
            (typeof parsed.text === "string" ? parsed.text : "") ||
            (typeof parsed.query === "string" ? parsed.query : "") ||
            (typeof parsed.url === "string" ? parsed.url : "") ||
            endpoint.shortDescription
          }
          stream={
            typeof parsed.stream === "boolean"
              ? parsed.stream
              : endpoint.supportsStreaming
          }
          includeVoice={Boolean(parsed.includeVoice)}
          runSignal={runSignal}
          isProcessing={loading}
          liveExecution={liveExecution}
          onSelectQueueItem={onSelectCrawlerEndpoint}
        />
      </div>

      {/* Bottom Execution Toolbar */}
      <div className="px-4 py-3 border-t border-[#1F1F23] bg-[#000000] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {loading ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-[13px] font-medium bg-red-600/90 hover:bg-red-500 text-white rounded-md transition-colors inline-flex items-center gap-2"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop ({elapsedMs}ms)</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isUnavailable || !jsonValidation.valid}
              onClick={onRun}
              className="px-4 py-2 text-[13px] font-medium bg-[#1F5B7C] hover:bg-[#286F96] disabled:opacity-40 text-[#F4F4F5] rounded-md transition-colors inline-flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Request</span>
              <kbd className="hidden sm:inline text-[10.5px] font-mono text-[#D4D4D8]/80 bg-black/25 px-1.5 py-0.5 rounded">
                ⌘↵
              </kbd>
            </button>
          )}

          {!isUnavailable && !loading && (
            <button
              type="button"
              onClick={onPreviewSample}
              className="px-3 py-2 text-[12.5px] font-medium text-[#D4D4D8] bg-[#121215] hover:bg-[#18181B] border border-[#27272A] rounded-md transition-colors inline-flex items-center gap-1.5"
              title="Inspect rich response renderer using sample data without executing a billed request"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5B9EC2]" />
              <span>Preview Sample</span>
            </button>
          )}
        </div>

        <span className="text-[11.5px] text-[#71717A] font-mono hidden sm:inline">
          {jsonValidation.valid ? "JSON valid" : "Fix JSON syntax"}
        </span>
      </div>
    </div>
  );
}
