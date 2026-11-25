"use client";

import {
  computeCategoryBreakdown,
  computeEndpointBreakdown,
  formatCurrency,
  formatLatency,
  type ActivityRecord,
} from "../../lib/analytics";
import { getCategoryById, type ApiCategoryId } from "../../lib/gyraCatalog";
import { CategoryIcon } from "../shell/GyraMark";

interface UsageBreakdownProps {
  records: ActivityRecord[];
  onFilterByEndpoint: (endpoint: string) => void;
}

const BAR_COLORS: Record<ApiCategoryId, string> = {
  ai: "bg-[#5B9EC2]",
  media: "bg-indigo-400",
  network: "bg-teal-400",
  utilities: "bg-amber-400",
};

export function UsageBreakdown({ records, onFilterByEndpoint }: UsageBreakdownProps) {
  const categories = computeCategoryBreakdown(records);
  const endpoints = computeEndpointBreakdown(records);
  const hasRecords = records.length > 0;

  return (
    <section
      aria-label="Usage Breakdown"
      className="grid grid-cols-1 xl:grid-cols-12 gap-4"
    >
      {/* Left: Category Distribution */}
      <div className="xl:col-span-4 bg-[#09090B] border border-[#1F1F23] rounded-lg p-5 flex flex-col justify-between">
        <div>
          <h2 className="font-display text-[14px] font-semibold text-[#F4F4F5]">
            Distribution by Service
          </h2>
          <p className="mt-1 text-[12.5px] text-[#71717A]">
            Request share and credit spend across API categories
          </p>

          {/* Proportional Stacked Bar */}
          <div className="mt-5 h-2.5 w-full rounded-sm bg-[#141418] overflow-hidden flex">
            {hasRecords ? (
              categories
                .filter((c) => c.sharePercent > 0)
                .map((c) => (
                  <div
                    key={c.category}
                    className={`${BAR_COLORS[c.category]} h-full transition-all`}
                    style={{ width: `${c.sharePercent}%` }}
                    title={`${getCategoryById(c.category).name}: ${c.sharePercent}%`}
                  />
                ))
            ) : (
              <div className="w-full h-full bg-[#141418]" />
            )}
          </div>

          {/* Clean Tabular Breakdown List */}
          <div className="mt-5 divide-y divide-[#18181B]">
            {categories.map((item) => {
              const meta = getCategoryById(item.category);
              return (
                <div
                  key={item.category}
                  className="py-2.5 flex items-center justify-between gap-3 text-[13px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-[2px] shrink-0 ${
                        item.requests > 0 ? BAR_COLORS[item.category] : "bg-[#27272A]"
                      }`}
                      aria-hidden="true"
                    />
                    <CategoryIcon
                      category={item.category}
                      className="w-3.5 h-3.5 text-[#71717A] shrink-0"
                    />
                    <span className="text-[#E4E4E7] truncate">{meta.name}</span>
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[12px] tabular-nums shrink-0">
                    <span className="text-[#A1A1AA]">{item.requests} req</span>
                    <span className="text-[#71717A] w-11 text-right">{item.sharePercent}%</span>
                    <span className="text-[#F4F4F5] w-14 text-right">
                      {formatCurrency(item.credits)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-4 pt-3 border-t border-[#18181B] text-[11.5px] text-[#71717A]">
          Only categories with logged requests consume wallet balances.
        </p>
      </div>

      {/* Right: Top Endpoints Table */}
      <div className="xl:col-span-8 bg-[#09090B] border border-[#1F1F23] rounded-lg overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[#1F1F23] flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-[14px] font-semibold text-[#F4F4F5]">
              Top Endpoints
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[#71717A]">
              Select any route to inspect individual execution logs
            </p>
          </div>
          <span className="text-[12px] font-mono text-[#71717A] tabular-nums">
            {endpoints.length} active routes
          </span>
        </div>

        {!hasRecords ? (
          <div className="px-6 py-12 text-center text-[13px] text-[#71717A]">
            Endpoint metrics will populate automatically once requests are recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#18181B] text-[11.5px] font-medium text-[#71717A]">
                  <th className="py-2.5 pl-5 pr-3">Endpoint</th>
                  <th className="py-2.5 px-3 text-right">Requests</th>
                  <th className="py-2.5 px-3 text-right">Success</th>
                  <th className="py-2.5 px-3 text-right">Avg Latency</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141418] text-[13px]">
                {endpoints.slice(0, 7).map((ep) => (
                  <tr
                    key={`${ep.method}-${ep.endpoint}`}
                    onClick={() => onFilterByEndpoint(ep.endpoint)}
                    className="hover:bg-[#121215] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 pl-5 pr-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`font-mono text-[11px] font-semibold w-10 shrink-0 ${
                            ep.method === "GET" ? "text-emerald-400" : "text-[#5B9EC2]"
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="font-mono text-[12.5px] text-[#E4E4E7] truncate">
                          {ep.endpoint}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#F4F4F5]">
                      {ep.requests.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      <span
                        className={
                          ep.successRate >= 95
                            ? "text-emerald-400"
                            : ep.successRate >= 85
                              ? "text-amber-400"
                              : "text-red-400"
                        }
                      >
                        {ep.successRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#A1A1AA]">
                      {formatLatency(ep.avgLatencyMs)}
                    </td>
                    <td className="py-2.5 pl-3 pr-5 text-right font-mono tabular-nums text-[#D4D4D8]">
                      {formatCurrency(ep.credits)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
