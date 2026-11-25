"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  Terminal,
  X,
} from "lucide-react";
import {
  formatCurrency,
  formatLatency,
  type ActivityRecord,
} from "../../lib/analytics";
import type { ApiCategoryId } from "../../lib/gyraCatalog";
import { JsonSyntaxHighlight } from "../shell/JsonSyntaxHighlight";

interface ActivityLogTableProps {
  records: ActivityRecord[];
  initialEndpointFilter?: string;
  onClearExternalFilter?: () => void;
  onReplayEndpoint: (endpointPath: string, requestPreview?: string) => void;
  compact?: boolean;
  maxRows?: number;
  onViewAll?: () => void;
}

const PAGE_SIZE = 12;

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return "text-emerald-400";
  if (code >= 400 && code < 500) return "text-amber-400";
  return "text-red-400";
}

function statusBorderBg(code: number): string {
  if (code >= 200 && code < 300) return "bg-emerald-500/10 border-emerald-500/25 text-emerald-400";
  if (code >= 400 && code < 500) return "bg-amber-500/10 border-amber-500/25 text-amber-400";
  return "bg-red-500/10 border-red-500/25 text-red-400";
}

function statusLabel(code: number): string {
  if (code === 200) return "200 OK";
  if (code === 201) return "201 Created";
  if (code === 400) return "400 Bad Request";
  if (code === 401) return "401 Unauthorized";
  if (code === 402) return "402 Insufficient Credits";
  if (code === 429) return "429 Rate Limited";
  if (code >= 500) return `${code} Server Error`;
  return String(code);
}

function latencyTier(ms: number): { label: string; color: string } {
  if (ms <= 350) return { label: "Fast", color: "text-emerald-400" };
  if (ms <= 850) return { label: "Nominal", color: "text-[#5B9EC2]" };
  return { label: "Elevated", color: "text-amber-400" };
}

function formatJsonPretty(raw?: string): string {
  if (!raw) return "{}";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function formatBytes(text: string): string {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function ActivityLogTable({
  records,
  initialEndpointFilter = "",
  onClearExternalFilter,
  onReplayEndpoint,
  compact = false,
  maxRows,
  onViewAll,
}: ActivityLogTableProps) {
  const [search, setSearch] = useState(initialEndpointFilter);
  const [statusFilter, setStatusFilter] = useState<"all" | "2xx" | "4xx" | "5xx">("all");
  const [categoryFilter, setCategoryFilter] = useState<ApiCategoryId | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ActivityRecord | null>(null);
  const [copiedField, setCopiedField] = useState<"id" | "req" | "res" | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (statusFilter === "2xx" && (r.status_code < 200 || r.status_code >= 300)) return false;
      if (statusFilter === "4xx" && (r.status_code < 400 || r.status_code >= 500)) return false;
      if (statusFilter === "5xx" && r.status_code < 500) return false;
      if (
        q &&
        !r.endpoint.toLowerCase().includes(q) &&
        !r.request_id.toLowerCase().includes(q) &&
        !(r.model || "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [records, search, statusFilter, categoryFilter]);

  const pageSize = maxRows ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = compact
    ? filtered.slice(0, pageSize)
    : filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleCopy = async (field: "id" | "req" | "res", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1600);
    } catch {
      // clipboard unavailable
    }
  };

  const formattedReq = selected ? formatJsonPretty(selected.request_preview) : "";
  const formattedRes = selected ? formatJsonPretty(selected.response_preview) : "";

  return (
    <section aria-label="Activity and Request Logs" className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2
            className={`font-display font-semibold text-[#F4F4F5] ${
              compact ? "text-[14px]" : "text-[17px]"
            }`}
          >
            {compact ? "Recent Request Activity" : "Request Logs"}
          </h2>
          <p className={`mt-0.5 text-[#A1A1AA] ${compact ? "text-[12px]" : "text-[13px]"}`}>
            Click any row to inspect full request &amp; response payloads, status code, and latency
          </p>
        </div>
        {compact && onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#5B9EC2] hover:text-[#7DD3FC] transition-colors shrink-0"
          >
            <span>View all {records.length.toLocaleString()} logs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="font-mono text-[12px] text-[#71717A] tabular-nums">
            {filtered.length.toLocaleString()} matching events
          </span>
        )}
      </div>

      {/* Filters Toolbar (full logs view) */}
      {!compact && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
                if (!e.target.value && onClearExternalFilter) onClearExternalFilter();
              }}
              placeholder="Search by endpoint, request ID, or model..."
              aria-label="Search activity logs"
              className="w-full bg-[#09090B] border border-[#1F1F23] focus:border-[#5B9EC2] focus:outline-none rounded-md pl-9 pr-8 py-2 text-[13px] text-[#F4F4F5] placeholder-[#71717A]"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                  onClearExternalFilter?.();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#F4F4F5]"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex items-center p-0.5 rounded-md bg-[#09090B] border border-[#1F1F23]"
              role="tablist"
              aria-label="Filter by HTTP status"
            >
              {(["all", "2xx", "4xx", "5xx"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === st}
                  onClick={() => {
                    setStatusFilter(st);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 text-[12px] font-mono font-medium rounded transition-colors ${
                    statusFilter === st
                      ? "bg-[#121215] text-[#F4F4F5]"
                      : "text-[#71717A] hover:text-[#D4D4D8]"
                  }`}
                >
                  {st === "all" ? "All" : st}
                </button>
              ))}
            </div>

            <div
              className="inline-flex items-center p-0.5 rounded-md bg-[#09090B] border border-[#1F1F23]"
              role="tablist"
              aria-label="Filter by API category"
            >
              {(["all", "ai", "media"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={categoryFilter === cat}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 text-[12px] font-medium rounded transition-colors uppercase ${
                    categoryFilter === cat
                      ? "bg-[#121215] text-[#F4F4F5]"
                      : "text-[#71717A] hover:text-[#D4D4D8]"
                  }`}
                >
                  {cat === "all" ? "All APIs" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#09090B] border border-[#1F1F23] rounded-lg overflow-hidden">
        {paged.length === 0 ? (
          <div className="px-6 py-12 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-lg bg-[#121215] border border-[#1F1F23] flex items-center justify-center mb-3 text-[#71717A]">
              <Activity className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <h3 className="font-display text-[15px] font-semibold text-[#F4F4F5]">
              {records.length === 0 ? "No request logs yet" : "No logs match these filters"}
            </h3>
            <p className="mt-1.5 text-[13px] text-[#A1A1AA] max-w-md">
              {records.length === 0
                ? "Individual API calls, status codes, latencies, and request payloads will appear here as soon as traffic begins."
                : "Adjust your status, category, or endpoint query to broaden results."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#18181B] text-[11.5px] font-medium text-[#71717A]">
                    <th className="py-2.5 pl-5 pr-3">Timestamp</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Endpoint</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Latency</th>
                    <th className="py-2.5 px-3 text-right">Cost</th>
                    <th className="py-2.5 pl-3 pr-5 text-right">Request ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141418] text-[12.5px]">
                  {paged.map((row) => (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Inspect ${row.method} ${row.endpoint} (${row.status_code}, ${formatLatency(row.latency_ms)})`}
                      onClick={() => setSelected(row)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(row);
                        }
                      }}
                      className={`group cursor-pointer transition-colors focus:outline-none focus:bg-[#121215] ${
                        selected?.id === row.id
                          ? "bg-[#121215]"
                          : "hover:bg-[#121215]"
                      }`}
                    >
                      <td className="py-2.5 pl-5 pr-3 font-mono tabular-nums text-[#A1A1AA] whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString([], {
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })}
                      </td>
                      <td
                        className={`py-2.5 px-3 font-mono font-medium tabular-nums whitespace-nowrap ${statusColor(
                          row.status_code
                        )}`}
                      >
                        {row.status_code}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-[11px] font-semibold mr-2 ${
                            row.method === "GET" ? "text-emerald-400" : "text-[#5B9EC2]"
                          }`}
                        >
                          {row.method}
                        </span>
                        <span className="font-mono text-[#E4E4E7]">{row.endpoint}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[#A1A1AA] uppercase text-[11.5px] font-mono">
                        {row.category}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#D4D4D8] whitespace-nowrap">
                        {formatLatency(row.latency_ms)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#A1A1AA] whitespace-nowrap">
                        {row.cost_usd > 0 ? formatCurrency(row.cost_usd) : "Free"}
                      </td>
                      <td className="py-2.5 pl-3 pr-5 text-right font-mono text-[#71717A] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <span>{row.request_id}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#52525B] group-hover:text-[#5B9EC2] transition-colors" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination (full logs view only) */}
            {!compact && totalPages > 1 && (
              <div className="px-5 py-3 border-t border-[#18181B] flex items-center justify-between text-[12px] text-[#A1A1AA]">
                <span className="font-mono tabular-nums">
                  Page {safePage} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded border border-[#1F1F23] bg-[#000000] hover:bg-[#121215] disabled:opacity-40 text-[#D4D4D8]"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded border border-[#1F1F23] bg-[#000000] hover:bg-[#121215] disabled:opacity-40 text-[#D4D4D8]"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Technical Request & Response Payload Inspector Drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Technical request and response payload inspector"
        >
          <div
            className="fixed inset-0 bg-black/65"
            onClick={() => setSelected(null)}
          />
          <aside className="relative z-10 w-full max-w-2xl bg-[#000000] border-l border-[#1F1F23] h-full flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-[#1F1F23] flex items-start justify-between gap-3 bg-[#09090B]">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border ${
                      selected.method === "GET"
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                        : "bg-[#5B9EC2]/10 border-[#5B9EC2]/30 text-[#7DD3FC]"
                    }`}
                  >
                    {selected.method}
                  </span>
                  <h3 className="font-mono text-[14px] font-semibold text-[#F4F4F5] truncate">
                    {selected.endpoint}
                  </h3>
                  <span
                    className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border tabular-nums ${statusBorderBg(
                      selected.status_code
                    )}`}
                  >
                    {statusLabel(selected.status_code)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[11.5px] font-mono text-[#71717A]">
                  <span>{selected.request_id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("id", selected.request_id)}
                    className="inline-flex items-center gap-1 text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors"
                    aria-label="Copy request ID"
                  >
                    {copiedField === "id" ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <span>·</span>
                  <span>{new Date(selected.created_at).toISOString()}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 text-[#71717A] hover:text-[#F4F4F5] rounded-md shrink-0"
                aria-label="Close inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Technical Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[12.5px]">
                <div className="bg-[#09090B] border border-[#1F1F23] rounded-md p-3">
                  <p className="text-[#71717A] text-[11px]">Status Code</p>
                  <p
                    className={`mt-1 font-mono font-semibold tabular-nums ${statusColor(
                      selected.status_code
                    )}`}
                  >
                    HTTP {selected.status_code}
                  </p>
                </div>
                <div className="bg-[#09090B] border border-[#1F1F23] rounded-md p-3">
                  <p className="text-[#71717A] text-[11px]">Latency</p>
                  <p className="mt-1 font-mono font-semibold tabular-nums text-[#F4F4F5] flex items-baseline gap-1.5">
                    <span>{formatLatency(selected.latency_ms)}</span>
                    <span className={`text-[10.5px] font-normal ${latencyTier(selected.latency_ms).color}`}>
                      {latencyTier(selected.latency_ms).label}
                    </span>
                  </p>
                </div>
                <div className="bg-[#09090B] border border-[#1F1F23] rounded-md p-3">
                  <p className="text-[#71717A] text-[11px]">Cost / Credits</p>
                  <p className="mt-1 font-mono font-semibold tabular-nums text-[#F4F4F5]">
                    {selected.cost_usd > 0 ? formatCurrency(selected.cost_usd) : "$0.00 (Free)"}
                  </p>
                </div>
                <div className="bg-[#09090B] border border-[#1F1F23] rounded-md p-3">
                  <p className="text-[#71717A] text-[11px]">Model / Scope</p>
                  <p className="mt-1 font-mono text-[#D4D4D8] truncate">
                    {selected.model || selected.category.toUpperCase()}
                    {selected.tokens_total ? (
                      <span className="text-[#71717A] text-[11px] ml-1">
                        · {selected.tokens_total}t
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              {/* Technical Trace Headers */}
              <div className="bg-[#09090B] border border-[#1F1F23] rounded-md overflow-hidden">
                <div className="px-3.5 py-2 border-b border-[#18181B] flex items-center justify-between text-[11.5px] font-medium text-[#A1A1AA]">
                  <span>Trace Metadata</span>
                  <span className="font-mono text-[#71717A]">application/json</span>
                </div>
                <div className="px-3.5 py-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[11.5px]">
                  <div className="flex justify-between gap-2">
                    <span className="text-[#71717A]">x-request-id</span>
                    <span className="text-[#D4D4D8] truncate">{selected.request_id}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#71717A]">x-gyra-service</span>
                    <span className="text-[#D4D4D8] uppercase">{selected.category}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#71717A]">x-response-time</span>
                    <span className="text-[#D4D4D8] tabular-nums">{selected.latency_ms}ms</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[#71717A]">http-status</span>
                    <span className={statusColor(selected.status_code)}>{statusLabel(selected.status_code)}</span>
                  </div>
                </div>
              </div>

              {/* Full Request Payload */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[12.5px] font-medium text-[#E4E4E7]">Request Payload</p>
                    <span className="font-mono text-[11px] text-[#71717A] tabular-nums">
                      {formatBytes(formattedReq)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy("req", formattedReq)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-[11.5px] font-medium rounded border border-[#1F1F23] bg-[#09090B] hover:bg-[#121215] text-[#D4D4D8] transition-colors"
                  >
                    {copiedField === "req" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-[#000000] border border-[#1F1F23] rounded-md p-3.5 overflow-x-auto max-h-[260px] overflow-y-auto">
                  <JsonSyntaxHighlight value={formattedReq} />
                </div>
              </div>

              {/* Full Response Payload */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[12.5px] font-medium text-[#E4E4E7]">Response Payload</p>
                    <span className="font-mono text-[11px] text-[#71717A] tabular-nums">
                      {formatBytes(formattedRes)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy("res", formattedRes)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-[11.5px] font-medium rounded border border-[#1F1F23] bg-[#09090B] hover:bg-[#121215] text-[#D4D4D8] transition-colors"
                  >
                    {copiedField === "res" ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-[#000000] border border-[#1F1F23] rounded-md p-3.5 overflow-x-auto max-h-[300px] overflow-y-auto">
                  <JsonSyntaxHighlight value={formattedRes} />
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-5 py-3.5 border-t border-[#1F1F23] bg-[#09090B] flex items-center justify-between gap-2">
              <span className="font-mono text-[11.5px] text-[#71717A]">
                Press Esc to close
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="px-3.5 py-2 text-[12.5px] font-medium bg-[#121215] hover:bg-[#18181B] border border-[#27272A] text-[#D4D4D8] rounded-md transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onReplayEndpoint(selected.endpoint, selected.request_preview);
                    setSelected(null);
                  }}
                  className="px-4 py-2 text-[12.5px] font-medium bg-[#1F5B7C] hover:bg-[#286F96] text-[#F4F4F5] rounded-md transition-colors inline-flex items-center gap-2"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Replay in Playground</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
