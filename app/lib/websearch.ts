// Shared web-search helper for Gyra (Atlas agent + landing research demo).
// Engine order: DuckDuckGo HTML (verified relevant results from this server),
// Bing fallback (unreliable from datacenter IPs — guarded by a relevance check),
// DuckDuckGo Lite as last resort.
// Returns REAL current results — never fabricated. If no engine returns
// results relevant to the query, returns empty (callers report honestly).

import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

export type SearchResult = { title: string; url: string };

/** Bing wraps result URLs in /ck/a redirects; the real URL is base64 in u=a1. */
function bingUnwrap(url: string): string {
  try {
    const m = url.match(/u=a1([A-Za-z0-9+/=_-]+)/);
    if (m) {
      let b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const dec = Buffer.from(b64, "base64").toString("utf8");
      if (dec.startsWith("http")) return dec;
    }
  } catch {}
  return url;
}

async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`http ${res.status}`);
  return res.text();
}

async function searchDdgHtml(query: string, max: number): Promise<SearchResult[]> {
  const html = await fetchText(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    9000
  );
  // Blocked/challenge pages have no result links; treat as a failure so the
  // fallback engines are tried.
  if (/anomaly|challenge|not a robot|please try again/i.test(html.slice(0, 3000))) {
    throw new Error("ddg html blocked");
  }
  const $ = cheerio.load(html);
  const out: SearchResult[] = [];
  $(".result__a").each((i, el) => {
    if (i >= max) return;
    let url = $(el).attr("href") || "";
    const title = $(el).text().trim();
    if (url.startsWith("/l/?uddg=")) url = decodeURIComponent(url.split("uddg=")[1] || "");
    if (url && title && url.startsWith("http")) out.push({ title, url });
  });
  return out;
}

async function searchBing(query: string, max: number): Promise<SearchResult[]> {
  const html = await fetchText(
    `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${max + 4}`,
    9000
  );
  const $ = cheerio.load(html);
  const out: SearchResult[] = [];
  $("li.b_algo").each((i, el) => {
    if (out.length >= max) return;
    const a = $(el).find("h2 a").first();
    let url = (a.attr("href") || "").trim();
    const title = (a.text() || "").trim();
    if (!url || !title) return;
    if (url.startsWith("http://www.bing.com/ck/") || url.startsWith("https://www.bing.com/ck/")) {
      url = bingUnwrap(decodeURIComponent(url));
    }
    if (!url.startsWith("http")) return;
    out.push({ title, url });
  });
  return out;
}

async function searchDdgLite(query: string, max: number): Promise<SearchResult[]> {
  const html = await fetchText(
    `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
    9000
  );
  const $ = cheerio.load(html);
  const out: SearchResult[] = [];
  $("a.result-link").each((i, el) => {
    if (out.length >= max) return;
    const url = ($(el).attr("href") || "").trim();
    const title = $(el).text().trim();
    if (url && title && url.startsWith("http")) out.push({ title, url });
  });
  return out;
}

// --- Relevance guard -------------------------------------------------------
// Bing from this server sometimes serves results for a single extracted
// keyword (e.g. "did" → dissociative identity disorder). If none of the
// significant query words appear in any result, the set is treated as noise
// and the next engine is tried.

const STOPWORDS = new Set([
  "about", "after", "again", "along", "among", "around", "because", "before",
  "being", "between", "could", "during", "either", "every", "first", "from",
  "further", "given", "having", "however", "into", "itself", "it's", "just",
  "like", "made", "make", "many", "might", "much", "must", "name", "names",
  "next", "only", "other", "over", "please", "rather", "should", "since",
  "some", "such", "than", "them", "then", "there", "these", "those", "through",
  "under", "until", "very", "were", "what", "when", "where", "which", "while",
  "who", "whom", "whose", "why", "will", "with", "would", "your", "yours",
]);

function significantTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

function resultsRelevant(query: string, results: SearchResult[]): boolean {
  const toks = significantTokens(query);
  if (toks.length === 0) return true;
  for (const r of results) {
    const hay = (r.title + " " + r.url).toLowerCase();
    if (toks.some((t) => hay.includes(t))) return true;
  }
  return false;
}

// --- Context fetching ------------------------------------------------------

async function fetchContext(url: string, chars: number): Promise<string> {
  try {
    const html = await fetchText(url, 5000);
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header, aside, noscript").remove();
    return $("body").text().replace(/\s+/g, " ").trim().substring(0, chars);
  } catch {
    return "";
  }
}

// --- Public API ------------------------------------------------------------

export async function webSearch(
  query: string,
  opts: { max?: number; contextChars?: number } = {}
): Promise<{ results: SearchResult[]; contexts: string[] }> {
  const max = opts.max ?? 4;
  const contextChars = opts.contextChars ?? 900;

  const engines = [searchDdgHtml, searchBing, searchDdgLite];
  let results: SearchResult[] = [];
  for (const engine of engines) {
    try {
      const found = await engine(query, max);
      if (found.length > 0 && resultsRelevant(query, found)) {
        results = found;
        break;
      }
    } catch {
      // try next engine
    }
  }
  if (results.length === 0) return { results: [], contexts: [] };

  const contexts: string[] = [];
  for (let i = 0; i < results.length; i++) {
    const text = await fetchContext(results[i].url, contextChars);
    contexts.push(`${i + 1}. ${results[i].url}\n${text || "(source unavailable)"}`);
  }
  return { results, contexts };
}
