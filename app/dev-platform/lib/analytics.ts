import type { ApiCategoryId, HttpMethod } from "./gyraCatalog";

export type TimeRangeKey = "1H" | "24H" | "7D" | "30D";

export type ChartMetricKey = "requests" | "credits" | "latency" | "tokens";

export interface ActivityRecord {
  id: string;
  request_id: string;
  endpoint: string;
  method: HttpMethod;
  category: ApiCategoryId;
  status_code: number;
  latency_ms: number;
  cost_usd: number;
  tokens_total?: number;
  model?: string;
  created_at: string;
  request_preview?: string;
  response_preview?: string;
}

export interface ApiKeyRecord {
  id: string;
  name: string;
  category: ApiCategoryId;
  keyPreview: string;
  active: boolean;
  created_at: string;
  last_used: string | null;
  request_count: number;
}

export interface WalletBalances {
  ai: number;
  media: number;
  network: number;
  utilities: number;
}

export interface TimeSeriesBucket {
  timestamp: number;
  label: string;
  fullLabel: string;
  requests: number;
  successCount: number;
  errorCount: number;
  credits: number;
  avgLatencyMs: number;
  tokens: number;
}

export interface SeriesSummary {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  totalCredits: number;
  totalTokens: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  peakRequestsPerBucket: number;
  deltaPercent: number | null;
}

export interface CategoryBreakdownItem {
  category: ApiCategoryId;
  requests: number;
  credits: number;
  sharePercent: number;
  successRate: number;
}

export interface EndpointBreakdownItem {
  endpoint: string;
  method: HttpMethod;
  category: ApiCategoryId;
  requests: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgLatencyMs: number;
  credits: number;
}

const RANGE_CONFIG: Record<
  TimeRangeKey,
  { durationMs: number; buckets: number }
> = {
  "1H": { durationMs: 60 * 60 * 1000, buckets: 24 },
  "24H": { durationMs: 24 * 60 * 60 * 1000, buckets: 24 },
  "7D": { durationMs: 7 * 24 * 60 * 60 * 1000, buckets: 28 },
  "30D": { durationMs: 30 * 24 * 60 * 60 * 1000, buckets: 30 },
};

function formatBucketLabel(ts: number, range: TimeRangeKey): string {
  const d = new Date(ts);
  if (range === "1H") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  if (range === "24H") {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatFullTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function filterActivityByRange(
  records: ActivityRecord[],
  range: TimeRangeKey,
  nowMs: number = Date.now()
): ActivityRecord[] {
  const { durationMs } = RANGE_CONFIG[range];
  const cutoff = nowMs - durationMs;
  return records.filter((r) => {
    const t = Date.parse(r.created_at);
    return Number.isFinite(t) && t >= cutoff && t <= nowMs + 60_000;
  });
}

export function aggregateActivitySeries(
  records: ActivityRecord[],
  range: TimeRangeKey,
  nowMs: number = Date.now()
): { buckets: TimeSeriesBucket[]; summary: SeriesSummary } {
  const { durationMs, buckets: bucketCount } = RANGE_CONFIG[range];
  const stepMs = durationMs / bucketCount;
  const startMs = nowMs - durationMs;

  const buckets: TimeSeriesBucket[] = Array.from({ length: bucketCount }, (_, idx) => {
    const bucketStart = startMs + idx * stepMs;
    return {
      timestamp: bucketStart,
      label: formatBucketLabel(bucketStart, range),
      fullLabel: formatFullTimestamp(bucketStart),
      requests: 0,
      successCount: 0,
      errorCount: 0,
      credits: 0,
      avgLatencyMs: 0,
      tokens: 0,
    };
  });

  const latencySums = new Array<number>(bucketCount).fill(0);
  const inWindow: ActivityRecord[] = [];
  let priorWindowCount = 0;
  const priorCutoff = startMs - durationMs;

  for (const r of records) {
    const t = Date.parse(r.created_at);
    if (!Number.isFinite(t)) continue;

    if (t >= priorCutoff && t < startMs) {
      priorWindowCount += 1;
      continue;
    }

    if (t < startMs || t > nowMs + 60_000) continue;
    inWindow.push(r);

    const rawIdx = Math.floor((t - startMs) / stepMs);
    const idx = Math.max(0, Math.min(bucketCount - 1, rawIdx));
    const bucket = buckets[idx];
    bucket.requests += 1;
    if (r.status_code >= 200 && r.status_code < 400) {
      bucket.successCount += 1;
    } else {
      bucket.errorCount += 1;
    }
    bucket.credits = Number((bucket.credits + (r.cost_usd || 0)).toFixed(4));
    bucket.tokens += r.tokens_total || 0;
    latencySums[idx] += r.latency_ms || 0;
  }

  for (let i = 0; i < bucketCount; i++) {
    if (buckets[i].requests > 0) {
      buckets[i].avgLatencyMs = Math.round(latencySums[i] / buckets[i].requests);
    }
  }

  const totalRequests = inWindow.length;
  const successCount = inWindow.filter((r) => r.status_code >= 200 && r.status_code < 400).length;
  const errorCount = totalRequests - successCount;
  const successRate = totalRequests > 0 ? Number(((successCount / totalRequests) * 100).toFixed(1)) : 100;
  const totalCredits = Number(
    inWindow.reduce((sum, r) => sum + (r.cost_usd || 0), 0).toFixed(2)
  );
  const totalTokens = inWindow.reduce((sum, r) => sum + (r.tokens_total || 0), 0);

  const latencies = inWindow
    .map((r) => r.latency_ms || 0)
    .filter((ms) => ms > 0)
    .sort((a, b) => a - b);

  const avgLatencyMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;
  const p95LatencyMs =
    latencies.length > 0
      ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))]
      : 0;
  const peakRequestsPerBucket = buckets.reduce((max, b) => Math.max(max, b.requests), 0);

  let deltaPercent: number | null = null;
  if (priorWindowCount > 0) {
    deltaPercent = Number(
      (((totalRequests - priorWindowCount) / priorWindowCount) * 100).toFixed(1)
    );
  }

  return {
    buckets,
    summary: {
      totalRequests,
      successCount,
      errorCount,
      successRate,
      totalCredits,
      totalTokens,
      avgLatencyMs,
      p95LatencyMs,
      peakRequestsPerBucket,
      deltaPercent,
    },
  };
}

export function computeCategoryBreakdown(
  records: ActivityRecord[]
): CategoryBreakdownItem[] {
  const categories: ApiCategoryId[] = ["ai", "media", "network", "utilities"];
  const total = records.length;

  return categories.map((cat) => {
    const items = records.filter((r) => r.category === cat);
    const ok = items.filter((r) => r.status_code >= 200 && r.status_code < 400).length;
    const credits = Number(items.reduce((acc, r) => acc + (r.cost_usd || 0), 0).toFixed(2));
    return {
      category: cat,
      requests: items.length,
      credits,
      sharePercent: total > 0 ? Number(((items.length / total) * 100).toFixed(1)) : 0,
      successRate: items.length > 0 ? Number(((ok / items.length) * 100).toFixed(1)) : 100,
    };
  });
}

export function computeEndpointBreakdown(
  records: ActivityRecord[]
): EndpointBreakdownItem[] {
  const map = new Map<
    string,
    {
      endpoint: string;
      method: HttpMethod;
      category: ApiCategoryId;
      requests: number;
      successCount: number;
      errorCount: number;
      latencySum: number;
      credits: number;
    }
  >();

  for (const r of records) {
    const key = `${r.method} ${r.endpoint}`;
    const existing = map.get(key) ?? {
      endpoint: r.endpoint,
      method: r.method,
      category: r.category,
      requests: 0,
      successCount: 0,
      errorCount: 0,
      latencySum: 0,
      credits: 0,
    };

    existing.requests += 1;
    if (r.status_code >= 200 && r.status_code < 400) existing.successCount += 1;
    else existing.errorCount += 1;
    existing.latencySum += r.latency_ms || 0;
    existing.credits += r.cost_usd || 0;
    map.set(key, existing);
  }

  return Array.from(map.values())
    .map((item) => ({
      endpoint: item.endpoint,
      method: item.method,
      category: item.category,
      requests: item.requests,
      successCount: item.successCount,
      errorCount: item.errorCount,
      successRate:
        item.requests > 0
          ? Number(((item.successCount / item.requests) * 100).toFixed(1))
          : 100,
      avgLatencyMs:
        item.requests > 0 ? Math.round(item.latencySum / item.requests) : 0,
      credits: Number(item.credits.toFixed(2)),
    }))
    .sort((a, b) => b.requests - a.requests);
}

export interface SparklinePoint {
  index: number;
  label: string;
  requests: number;
  avgLatencyMs: number;
  errorCount: number;
  credits: number;
}

export function computeCategorySparklineSeries(
  records: ActivityRecord[],
  category: ApiCategoryId,
  buckets: number = 16,
  nowMs: number = Date.now()
): SparklinePoint[] {
  const durationMs = 24 * 60 * 60 * 1000;
  const startMs = nowMs - durationMs;
  const stepMs = durationMs / buckets;

  const series: SparklinePoint[] = [];
  const latencySums = new Array<number>(buckets).fill(0);

  for (let i = 0; i < buckets; i++) {
    const ts = startMs + (i + 1) * stepMs;
    const d = new Date(ts);
    series.push({
      index: i,
      label: d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      requests: 0,
      avgLatencyMs: 0,
      errorCount: 0,
      credits: 0,
    });
  }

  for (const r of records) {
    if (r.category !== category) continue;
    const t = Date.parse(r.created_at);
    if (!Number.isFinite(t) || t < startMs || t > nowMs + 60_000) continue;
    const idx = Math.max(0, Math.min(buckets - 1, Math.floor((t - startMs) / stepMs)));
    const pt = series[idx];
    pt.requests += 1;
    if (r.status_code >= 400) pt.errorCount += 1;
    pt.credits = Number((pt.credits + (r.cost_usd || 0)).toFixed(2));
    latencySums[idx] += r.latency_ms || 0;
  }

  for (let i = 0; i < buckets; i++) {
    if (series[i].requests > 0) {
      series[i].avgLatencyMs = Math.round(latencySums[i] / series[i].requests);
    }
  }

  return series;
}

export function computeCategorySparkline(
  records: ActivityRecord[],
  category: ApiCategoryId,
  buckets: number = 12,
  nowMs: number = Date.now()
): number[] {
  return computeCategorySparklineSeries(records, category, buckets, nowMs).map(
    (p) => p.requests
  );
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function formatLatency(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}
