"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, RotateCcw, Trash2, X } from "lucide-react";
import { DEMO_SAMPLE_RESPONSES } from "../../lib/demoData";
import {
  GYRA_API_BASE_URL,
  GYRA_ENDPOINTS,
  getEndpointById,
  getEndpointsByCategory,
  type ApiCategoryId,
  type GyraEndpointSpec,
} from "../../lib/gyraCatalog";
import { resolveEndpointUrl } from "../../lib/codeGen";
import {
  estimateTokenCount,
  parseSseChunk,
  type StreamMetrics,
} from "../../lib/streaming";
import { validateApiKeyForEndpoint, validateJsonBody } from "../../lib/validation";
import { EndpointExplorer } from "./EndpointExplorer";
import { RequestBuilder } from "./RequestBuilder";
import type {
  CrawlerQueueItem,
  LiveExecutionSnapshot,
} from "./ApiCrawlerVisualizer";
import { ResponseInspector, type ExecutionResult } from "./ResponseInspector";

export interface SessionHistoryItem {
  id: string;
  timestamp: string;
  endpointId: string;
  method: string;
  path: string;
  requestBody: string;
  result: ExecutionResult;
}

interface PlaygroundWorkspaceProps {
  initialCategory?: ApiCategoryId;
  initialEndpointId?: string;
  initialRequestBody?: string;
  initialApiKey?: string;
  apiBaseUrl?: string;
  onGoToKeys: () => void;
  onRecordLiveExecution?: (entry: {
    endpoint: string;
    method: "GET" | "POST";
    category: ApiCategoryId;
    statusCode: number;
    latencyMs: number;
    costUsd: number;
    requestBody: string;
    responsePreview: string;
  }) => void;
}

type MobileTab = "endpoints" | "request" | "response";

export function PlaygroundWorkspace({
  initialCategory,
  initialEndpointId,
  initialRequestBody,
  initialApiKey = "",
  apiBaseUrl = GYRA_API_BASE_URL,
  onGoToKeys,
  onRecordLiveExecution,
}: PlaygroundWorkspaceProps) {
  const startEndpoint = initialEndpointId
    ? getEndpointById(initialEndpointId)
    : initialCategory
      ? getEndpointsByCategory(initialCategory)[0] ?? GYRA_ENDPOINTS[0]
      : GYRA_ENDPOINTS[0];

  const [activeCategory, setActiveCategory] = useState<ApiCategoryId>(
    initialCategory ?? startEndpoint.category
  );
  const [activeEndpoint, setActiveEndpoint] = useState<GyraEndpointSpec>(startEndpoint);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [requestBody, setRequestBody] = useState(
    initialRequestBody || JSON.stringify(startEndpoint.defaultBody, null, 2)
  );
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [runSignal, setRunSignal] = useState(0);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("request");
  const [displayBaseUrl, setDisplayBaseUrl] = useState<string>(
    apiBaseUrl || GYRA_API_BASE_URL
  );

  useEffect(() => {
    if (!apiBaseUrl && typeof window !== "undefined") {
      setDisplayBaseUrl(window.location.origin);
    } else if (apiBaseUrl) {
      setDisplayBaseUrl(apiBaseUrl);
    }
  }, [apiBaseUrl]);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);
  const sampleStreamTimerRef = useRef<number | null>(null);

  const stopSampleStream = () => {
    if (sampleStreamTimerRef.current) {
      window.clearInterval(sampleStreamTimerRef.current);
      sampleStreamTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (sampleStreamTimerRef.current) window.clearInterval(sampleStreamTimerRef.current);
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSelectCategory = (cat: ApiCategoryId) => {
    setActiveCategory(cat);
    const first = getEndpointsByCategory(cat)[0];
    if (first) {
      setActiveEndpoint(first);
      setRequestBody(JSON.stringify(first.defaultBody, null, 2));
      setResult(null);
    }
  };

  const handleSelectEndpoint = (ep: GyraEndpointSpec) => {
    setActiveEndpoint(ep);
    setActiveCategory(ep.category);
    setRequestBody(JSON.stringify(ep.defaultBody, null, 2));
    setResult(null);
    setMobileTab("request");
  };

  const pushHistory = (ep: GyraEndpointSpec, body: string, execResult: ExecutionResult) => {
    setHistory((prev) =>
      [
        {
          id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          endpointId: ep.id,
          method: ep.method,
          path: ep.path,
          requestBody: body,
          result: execResult,
        },
        ...prev,
      ].slice(0, 25)
    );
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    stopSampleStream();
    stopTimer();
    setLoading(false);
    setResult((prev) =>
      prev
        ? {
            ...prev,
            streaming: false,
            error: "Stream stopped by user.",
            streamMetrics: prev.streamMetrics
              ? { ...prev.streamMetrics, status: "cancelled" }
              : undefined,
          }
        : prev
    );
  };

  const handleSelectCrawlerEndpoint = (item: CrawlerQueueItem) => {
    const matched = GYRA_ENDPOINTS.find((ep) => ep.path === item.path);
    if (!matched) return;
    setActiveEndpoint(matched);
    setActiveCategory(matched.category);
    const nextBody: Record<string, unknown> = { ...matched.defaultBody };
    if (matched.path === "/api/v1/chat") {
      nextBody.model = item.model;
      nextBody.stream = item.stream;
      nextBody.messages = [
        { role: "system", content: item.systemPrompt },
        { role: "user", content: item.userMessage },
      ];
    }
    setRequestBody(JSON.stringify(nextBody, null, 2));
    setResult(null);
  };

  const liveExecution: LiveExecutionSnapshot | null = result
    ? {
        statusCode: result.statusCode,
        latencyMs: result.latencyMs,
        ttftMs: result.streamMetrics?.ttftMs ?? null,
        tokenCount: result.streamMetrics?.tokenCount ?? null,
        requestId: result.requestId,
        payloadSizeLabel: result.payloadSizeLabel,
        streaming: result.streaming,
      }
    : null;

  const handlePreviewSample = () => {
    setRunSignal((n) => n + 1);
    stopSampleStream();
    stopTimer();
    const sample = DEMO_SAMPLE_RESPONSES[activeEndpoint.id];
    if (!sample) return;

    // Stream chat sample through the real LiveStreamVisualizer pipeline when stream: true
    let wantsStream = activeEndpoint.supportsStreaming;
    let selectedModel = "gyra-1.0";
    try {
      const parsedReq = JSON.parse(requestBody) as Record<string, unknown>;
      if (typeof parsedReq.stream === "boolean") wantsStream = parsedReq.stream;
      if (typeof parsedReq.model === "string") selectedModel = parsedReq.model;
    } catch {
      // keep default
    }

    const sampleChoices =
      sample.body &&
      typeof sample.body === "object" &&
      "choices" in sample.body &&
      Array.isArray((sample.body as { choices?: unknown[] }).choices)
        ? (sample.body as { choices: Array<{ message?: { content?: string } }> }).choices
        : null;
    const sampleChatContent = sampleChoices?.[0]?.message?.content;

    if (wantsStream && typeof sampleChatContent === "string" && sampleChatContent.length > 0) {
      const pieces = sampleChatContent.match(/\S+\s*|\n+/g) ?? [sampleChatContent];
      const started = performance.now();
      let idx = 0;
      let accumulated = "";
      let firstTokenAt: number | null = null;
      const velocityHistory: number[] = [];

      setLoading(true);
      setElapsedMs(0);
      setMobileTab("response");

      setResult({
        statusCode: 200,
        latencyMs: 0,
        payloadSizeLabel: null,
        requestId: sample.headers["x-request-id"] ?? "req_sample_stream",
        headers: {
          ...sample.headers,
          "content-type": "text/event-stream; charset=utf-8",
        },
        rawText: "",
        parsedJson: null,
        error: null,
        isSamplePreview: true,
        streaming: true,
        streamMetrics: {
          status: "streaming",
          ttftMs: null,
          elapsedMs: 0,
          chunkCount: 0,
          tokenCount: 0,
          tokensPerSec: 0,
          velocityHistory: [],
          model: selectedModel,
        },
      });

      timerRef.current = window.setInterval(() => {
        setElapsedMs(Math.round(performance.now() - started));
      }, 60);

      sampleStreamTimerRef.current = window.setInterval(() => {
        const batchSize = idx === 0 ? 1 : 2;
        const slice = pieces.slice(idx, idx + batchSize).join("");
        idx += batchSize;
        const now = performance.now();
        if (firstTokenAt === null) firstTokenAt = now;
        accumulated += slice;

        const ttftMs = Math.round(firstTokenAt - started);
        const genSec = Math.max(0.05, (now - firstTokenAt) / 1000);
        const tokenCount = estimateTokenCount(accumulated);
        const tokPerSec = Number((tokenCount / genSec).toFixed(1));
        velocityHistory.push(tokPerSec);
        if (velocityHistory.length > 24) velocityHistory.shift();

        const finished = idx >= pieces.length;
        const latencyMs = Math.round(now - started);
        const sizeKB = (new Blob([accumulated]).size / 1024).toFixed(1);

        const nextResult: ExecutionResult = {
          statusCode: 200,
          latencyMs,
          payloadSizeLabel: `${sizeKB} KB`,
          requestId: sample.headers["x-request-id"] ?? "req_sample_stream",
          headers: {
            ...sample.headers,
            "content-type": "text/event-stream; charset=utf-8",
          },
          rawText: accumulated,
          parsedJson: null,
          error: null,
          isSamplePreview: true,
          streaming: !finished,
          streamMetrics: {
            status: finished ? "complete" : "streaming",
            ttftMs,
            elapsedMs: latencyMs,
            chunkCount: idx,
            tokenCount,
            tokensPerSec: tokPerSec,
            velocityHistory: [...velocityHistory],
            model: selectedModel,
          },
        };

        setResult(nextResult);

        if (finished) {
          stopSampleStream();
          stopTimer();
          setLoading(false);
          pushHistory(activeEndpoint, requestBody, nextResult);
        }
      }, 42);
      return;
    }

    const rawText = JSON.stringify(sample.body, null, 2);
    const sizeKB = (new Blob([rawText]).size / 1024).toFixed(1);
    const execResult: ExecutionResult = {
      statusCode: sample.status,
      latencyMs: sample.latencyMs,
      payloadSizeLabel: `${sizeKB} KB`,
      requestId: sample.headers["x-request-id"] ?? null,
      headers: sample.headers,
      rawText,
      parsedJson: sample.body,
      error: null,
      isSamplePreview: true,
      streaming: false,
    };
    setResult(execResult);
    pushHistory(activeEndpoint, requestBody, execResult);
    setMobileTab("response");
  };

  const executeEndpoint = async (
    targetEndpoint: GyraEndpointSpec,
    bodyStr: string
  ) => {
    if (loading) return;
    const keyCheck = validateApiKeyForEndpoint(apiKey, targetEndpoint);
    if (!keyCheck.valid) {
      setResult({
        statusCode: null,
        latencyMs: null,
        payloadSizeLabel: null,
        requestId: null,
        headers: {},
        rawText: "",
        parsedJson: null,
        error: keyCheck.message,
        isSamplePreview: false,
        streaming: false,
      });
      setMobileTab("response");
      return;
    }

    setRunSignal((n) => n + 1);
    const jsonCheck = validateJsonBody(bodyStr);
    if (!jsonCheck.valid || !jsonCheck.parsed) {
      setResult({
        statusCode: null,
        latencyMs: null,
        payloadSizeLabel: null,
        requestId: null,
        headers: {},
        rawText: "",
        parsedJson: null,
        error: jsonCheck.errorMessage ?? "Invalid JSON body.",
        isSamplePreview: false,
        streaming: false,
      });
      setMobileTab("response");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setElapsedMs(0);
    setMobileTab("response");

    const started = performance.now();
    timerRef.current = window.setInterval(() => {
      setElapsedMs(Math.round(performance.now() - started));
    }, 60);

    const url = resolveEndpointUrl(
      targetEndpoint,
      jsonCheck.parsed,
      apiBaseUrl
    );
    const requestedModel =
      typeof jsonCheck.parsed.model === "string" ? jsonCheck.parsed.model : undefined;
    const requestedStream =
      targetEndpoint.supportsStreaming && jsonCheck.parsed.stream !== false;

    const headers: Record<string, string> = {};
    if (targetEndpoint.method !== "GET") {
      headers["Content-Type"] = "application/json";
    }
    if (targetEndpoint.authType === "session-token") {
      headers["x-gyra-user-token"] = apiKey.trim();
    } else {
      headers["Authorization"] = `Bearer ${apiKey.trim()}`;
    }

    try {
      const res = await fetch(url, {
        method: targetEndpoint.method,
        headers,
        body: targetEndpoint.method === "GET" ? undefined : JSON.stringify(jsonCheck.parsed),
        signal: controller.signal,
      });

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        resHeaders[k] = v;
      });
      const contentType = res.headers.get("content-type") || "";
      const requestId = res.headers.get("x-request-id");

      if (
        (contentType.includes("text/event-stream") || (requestedStream && res.ok && !contentType.includes("application/json"))) &&
        res.body
      ) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";
        let firstTokenAt: number | null = null;
        let chunkCount = 0;
        let resolvedModel = requestedModel;
        let exactUsageTokens: number | undefined;
        let streamError: string | null = null;
        const velocityHistory: number[] = [];
        let lastHistoryPush = performance.now();
        let tokensSinceLastSample = 0;

        const baseMetrics: StreamMetrics = {
          status: "streaming",
          ttftMs: null,
          elapsedMs: Math.round(performance.now() - started),
          chunkCount: 0,
          tokenCount: 0,
          tokensPerSec: 0,
          velocityHistory: [],
          model: resolvedModel,
        };

        setResult({
          statusCode: res.status,
          latencyMs: baseMetrics.elapsedMs,
          payloadSizeLabel: null,
          requestId,
          headers: resHeaders,
          rawText: "",
          parsedJson: null,
          error: null,
          isSamplePreview: false,
          streaming: true,
          streamMetrics: baseMetrics,
        });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const decoded = decoder.decode(value, { stream: true });
          const parsed = parseSseChunk(buffer, decoded);
          buffer = parsed.remainingBuffer;

          if (parsed.model) resolvedModel = parsed.model;
          if (parsed.usageTotalTokens) exactUsageTokens = parsed.usageTotalTokens;
          if (parsed.errorMessage) streamError = parsed.errorMessage;

          const appended = parsed.tokens.join("");
          if (appended) {
            const now = performance.now();
            if (firstTokenAt === null) firstTokenAt = now;
            accumulated += appended;
            chunkCount += parsed.tokens.length;
            tokensSinceLastSample += Math.max(1, estimateTokenCount(appended));

            const ttftMs = Math.round(firstTokenAt - started);
            const genSec = Math.max(0.05, (now - firstTokenAt) / 1000);
            const tokenCount = exactUsageTokens ?? estimateTokenCount(accumulated);
            const tokensPerSec = Number((tokenCount / genSec).toFixed(1));

            if (now - lastHistoryPush >= 120 || velocityHistory.length === 0) {
              const dtSec = Math.max(0.05, (now - lastHistoryPush) / 1000);
              const instantVel = Number((tokensSinceLastSample / dtSec).toFixed(1));
              velocityHistory.push(Math.min(instantVel, tokensPerSec * 2.5 + 20));
              if (velocityHistory.length > 24) velocityHistory.shift();
              lastHistoryPush = now;
              tokensSinceLastSample = 0;
            }

            const elapsedNow = Math.round(now - started);
            setResult((prev) =>
              prev
                ? {
                    ...prev,
                    rawText: accumulated,
                    latencyMs: elapsedNow,
                    streamMetrics: {
                      status: "streaming",
                      ttftMs,
                      elapsedMs: elapsedNow,
                      chunkCount,
                      tokenCount,
                      tokensPerSec,
                      velocityHistory: [...velocityHistory],
                      model: resolvedModel,
                    },
                  }
                : prev
            );
          }

          if (parsed.done) break;
        }

        const latencyMs = Math.round(performance.now() - started);
        const sizeKB = (new Blob([accumulated]).size / 1024).toFixed(1);
        const tokenCount = exactUsageTokens ?? estimateTokenCount(accumulated);
        const ttftMs = firstTokenAt !== null ? Math.round(firstTokenAt - started) : latencyMs;
        const genSec =
          firstTokenAt !== null
            ? Math.max(0.05, (performance.now() - firstTokenAt) / 1000)
            : Math.max(0.05, latencyMs / 1000);
        const tokensPerSec = tokenCount > 0 ? Number((tokenCount / genSec).toFixed(1)) : 0;

        const finalResult: ExecutionResult = {
          statusCode: res.status,
          latencyMs,
          payloadSizeLabel: `${sizeKB} KB`,
          requestId,
          headers: resHeaders,
          rawText: accumulated || "(empty stream)",
          parsedJson: null,
          error:
            streamError ??
            (res.ok ? null : `HTTP ${res.status} error returned from stream.`),
          isSamplePreview: false,
          streaming: false,
          streamMetrics: {
            status: res.ok && !streamError ? "complete" : "error",
            ttftMs,
            elapsedMs: latencyMs,
            chunkCount,
            tokenCount,
            tokensPerSec,
            velocityHistory: [...velocityHistory],
            model: resolvedModel,
          },
        };
        setResult(finalResult);
        pushHistory(targetEndpoint, bodyStr, finalResult);
        onRecordLiveExecution?.({
          endpoint: targetEndpoint.path,
          method: targetEndpoint.method === "GET" ? "GET" : "POST",
          category: targetEndpoint.category,
          statusCode: res.status,
          latencyMs,
          costUsd: res.ok ? targetEndpoint.costUsd : 0,
          requestBody: bodyStr,
          responsePreview: accumulated.slice(0, 260),
        });
      } else {
        const text = await res.text();
        const latencyMs = Math.round(performance.now() - started);
        const sizeKB = (new Blob([text]).size / 1024).toFixed(1);
        let parsedJson: unknown | null = null;
        try {
          parsedJson = JSON.parse(text);
        } catch {
          parsedJson = null;
        }

        const apiErrorMessage =
          !res.ok &&
          parsedJson &&
          typeof parsedJson === "object" &&
          "error" in parsedJson
            ? typeof (parsedJson as { error?: { message?: string } }).error?.message === "string"
              ? (parsedJson as { error: { message: string } }).error.message
              : `HTTP ${res.status} error`
            : !res.ok
              ? `Request returned HTTP ${res.status}`
              : null;

        const finalResult: ExecutionResult = {
          statusCode: res.status,
          latencyMs,
          payloadSizeLabel: `${sizeKB} KB`,
          requestId,
          headers: resHeaders,
          rawText: text,
          parsedJson,
          error: apiErrorMessage,
          isSamplePreview: false,
          streaming: false,
        };
        setResult(finalResult);
        pushHistory(targetEndpoint, bodyStr, finalResult);
        onRecordLiveExecution?.({
          endpoint: targetEndpoint.path,
          method: targetEndpoint.method === "GET" ? "GET" : "POST",
          category: targetEndpoint.category,
          statusCode: res.status,
          latencyMs,
          costUsd: res.ok ? targetEndpoint.costUsd : 0,
          requestBody: bodyStr,
          responsePreview: text.slice(0, 260),
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      const message =
        err instanceof Error
          ? `${err.message}. Verify network access, CORS policy for ${GYRA_API_BASE_URL}, and credential validity.`
          : "Network request failed.";
      setResult({
        statusCode: null,
        latencyMs: Math.round(performance.now() - started),
        payloadSizeLabel: null,
        requestId: null,
        headers: {},
        rawText: "",
        parsedJson: null,
        error: message,
        isSamplePreview: false,
        streaming: false,
      });
    } finally {
      stopTimer();
      setLoading(false);
    }
  };

  const handlePollVideoStatus = (jobId: string) => {
    const statusEp = getEndpointById("video-status");
    const nextBody = JSON.stringify({ id: jobId }, null, 2);
    setActiveEndpoint(statusEp);
    setActiveCategory("ai");
    setRequestBody(nextBody);
    executeEndpoint(statusEp, nextBody);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] min-h-[580px]">
      {/* Compact Workspace Utility Bar (Session History + Mobile Panel Switcher) */}
      <div className="px-4 py-2 border-b border-[#1F1F23] bg-[#000000] flex items-center justify-between gap-3 shrink-0">
        {/* Mobile Panel Switcher */}
        <div
          className="flex lg:hidden items-center p-0.5 rounded-md bg-[#000000] border border-[#1F1F23]"
          role="tablist"
          aria-label="Playground workspace panels"
        >
          {(
            [
              { id: "endpoints", label: "Explore" },
              { id: "request", label: "Request" },
              { id: "response", label: "Response" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mobileTab === tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={`px-3 py-1 text-[12px] font-medium rounded transition-colors ${
                mobileTab === tab.id
                  ? "bg-[#121215] text-[#F4F4F5]"
                  : "text-[#71717A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop Title */}
        <div className="hidden lg:flex items-center gap-3 min-w-0">
          <h1 className="font-display text-[14px] font-semibold text-[#F4F4F5] whitespace-nowrap">
            AI Playground
          </h1>
          <span className="text-[12px] text-[#71717A] truncate">
            Live execution against{" "}
            <code className="text-[#A1A1AA]">{displayBaseUrl}</code>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="px-2.5 py-1 text-[12px] font-medium text-[#D4D4D8] bg-[#09090B] hover:bg-[#121215] border border-[#1F1F23] rounded-md inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Clock className="w-3.5 h-3.5 text-[#5B9EC2]" />
          <span>History</span>
          <span className="font-mono text-[11px] text-[#71717A] tabular-nums">
            ({history.length})
          </span>
        </button>
      </div>

      {/* Responsive 3-Pane Desktop / Tabbed Mobile Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-[248px_minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Pane 1: Endpoint Explorer */}
        <div
          className={`${
            mobileTab === "endpoints" ? "block" : "hidden"
          } lg:block lg:col-span-3 xl:col-span-1 border-r border-[#1F1F23] min-h-0 overflow-hidden`}
        >
          <EndpointExplorer
            activeCategory={activeCategory}
            activeEndpointId={activeEndpoint.id}
            onSelectCategory={handleSelectCategory}
            onSelectEndpoint={handleSelectEndpoint}
          />
        </div>

        {/* Pane 2: Request Builder */}
        <div
          className={`${
            mobileTab === "request" ? "block" : "hidden"
          } lg:block lg:col-span-4 xl:col-span-1 border-r border-[#1F1F23] min-h-0 overflow-hidden`}
        >
          <RequestBuilder
            endpoint={activeEndpoint}
            apiKey={apiKey}
            onChangeApiKey={setApiKey}
            requestBody={requestBody}
            onChangeRequestBody={setRequestBody}
            loading={loading}
            elapsedMs={elapsedMs}
            onRun={() => executeEndpoint(activeEndpoint, requestBody)}
            onCancel={handleCancel}
            onPreviewSample={handlePreviewSample}
            onGoToKeys={onGoToKeys}
            runSignal={runSignal}
            liveExecution={liveExecution}
            onSelectCrawlerEndpoint={handleSelectCrawlerEndpoint}
          />
        </div>

        {/* Pane 3: Response Inspector */}
        <div
          className={`${
            mobileTab === "response" ? "block" : "hidden"
          } lg:block lg:col-span-5 xl:col-span-1 min-h-0 overflow-hidden`}
        >
          <ResponseInspector
            endpoint={activeEndpoint}
            requestBody={requestBody}
            apiKey={apiKey}
            apiBaseUrl={displayBaseUrl}
            result={result}
            loading={loading}
            onPollVideoStatus={handlePollVideoStatus}
          />
        </div>
      </div>

      {/* Session Request History Drawer */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Session request history"
        >
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setHistoryOpen(false)}
          />
          <aside className="relative z-10 w-full max-w-md bg-[#000000] border-l border-[#1F1F23] h-full flex flex-col">
            <div className="px-4 py-3.5 border-b border-[#1F1F23] flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-[14.5px] font-semibold text-[#F4F4F5]">
                  Session Request History
                </h2>
                <p className="text-[11.5px] text-[#71717A]">
                  Stored in memory for this browser session only
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setHistory([])}
                    className="p-1.5 text-[#71717A] hover:text-red-400 rounded"
                    aria-label="Clear session history"
                    title="Clear history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="p-1.5 text-[#71717A] hover:text-[#F4F4F5] rounded"
                  aria-label="Close history"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#18181B]">
              {history.length === 0 ? (
                <div className="p-8 text-center text-[13px] text-[#71717A]">
                  Executed requests and sample previews from this session will appear here for quick
                  comparison and replay.
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 hover:bg-[#09090B] transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-[12px] font-mono">
                      <span className="text-[#F4F4F5] truncate">
                        <strong className="text-[#5B9EC2] mr-1.5">{item.method}</strong>
                        {item.path}
                      </span>
                      <span
                        className={
                          item.result.statusCode && item.result.statusCode < 300
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }
                      >
                        {item.result.statusCode ?? "ERR"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] tabular-nums">
                      <span>
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })}
                        {item.result.latencyMs ? ` · ${item.result.latencyMs}ms` : ""}
                        {item.result.isSamplePreview ? " · Sample" : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const ep = getEndpointById(item.endpointId);
                          setActiveEndpoint(ep);
                          setActiveCategory(ep.category);
                          setRequestBody(item.requestBody);
                          setResult(item.result);
                          setHistoryOpen(false);
                        }}
                        className="text-[#5B9EC2] hover:text-[#7DD3FC] inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
