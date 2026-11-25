import type { Prompt, PromptCategory } from "./data";

export const PENDING_PROMPT_STORAGE_KEY = "gyra:pending_prompt_v1";

export type PromptVariable = {
  token: string;
  rawKey: string;
  label: string;
  placeholder: string;
  multiline: boolean;
};

export type PromptTemplateSegment =
  | { type: "text"; value: string }
  | { type: "variable"; token: string; rawKey: string };

export type EnrichedPrompt = Prompt & {
  categoryId: string;
  categoryTitle: string;
  categoryDescription: string;
  variables: PromptVariable[];
};

const FRIENDLY_LABELS: Record<string, { label: string; placeholder: string; multiline?: boolean }> = {
  "person/company": {
    label: "Recipient or company",
    placeholder: "e.g., Maya Chen, Head of Product at Linear",
  },
  topic: {
    label: "Topic",
    placeholder: "e.g., Q3 API migration partnership",
  },
  "paste text": {
    label: "Source text",
    placeholder: "Paste the text you want Gyra to process...",
    multiline: true,
  },
  "paste code": {
    label: "Code snippet",
    placeholder: "Paste your code here...",
    multiline: true,
  },
  "paste error": {
    label: "Error message",
    placeholder: "Paste the error output or stack trace...",
    multiline: true,
  },
  "describe pattern": {
    label: "Pattern to match",
    placeholder: "e.g., ISO-8601 dates or valid international phone numbers",
  },
  "company/product/idea": {
    label: "Company, product, or idea",
    placeholder: "e.g., B2B invoice automation platform for logistics teams",
  },
  product: {
    label: "Product",
    placeholder: "e.g., Gyra Developer API",
  },
  "skill/topic": {
    label: "Skill or topic",
    placeholder: "e.g., PostgreSQL query optimization",
  },
  premise: {
    label: "Story premise",
    placeholder: "e.g., A cartographer discovers a town missing from every satellite map",
    multiline: true,
  },
  "product/idea": {
    label: "Product or idea",
    placeholder: "e.g., Minimalist offline-first journaling app",
  },
  "goal/problem": {
    label: "Goal or problem",
    placeholder: "e.g., Reducing onboarding drop-off for self-serve developer tools",
  },
  a: {
    label: "Option A",
    placeholder: "e.g., PostgreSQL",
  },
  b: {
    label: "Option B",
    placeholder: "e.g., DynamoDB",
  },
  "use case": {
    label: "Use case",
    placeholder: "e.g., High-write multi-tenant analytics",
  },
  "decision/idea": {
    label: "Decision or idea",
    placeholder: "e.g., Moving from REST to GraphQL for our mobile client",
  },
};

function toTitleLabel(rawKey: string): string {
  const cleaned = rawKey.trim().replace(/[_-]+/g, " ");
  if (!cleaned) return "Field";
  return cleaned
    .split("/")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    })
    .filter(Boolean)
    .join(" / ");
}

const PLACEHOLDER_REGEX = /\[([^\[\]\n]{1,60})\]/g;

export function extractPromptVariables(template: string): PromptVariable[] {
  const seen = new Set<string>();
  const results: PromptVariable[] = [];

  for (const match of template.matchAll(PLACEHOLDER_REGEX)) {
    const token = match[0];
    const rawKey = match[1].trim();
    const normalized = rawKey.toLowerCase();
    if (!rawKey || seen.has(normalized)) continue;
    seen.add(normalized);

    const preset = FRIENDLY_LABELS[normalized];
    const isMultiline =
      preset?.multiline ??
      (normalized.includes("paste") ||
        normalized.includes("text") ||
        normalized.includes("code") ||
        normalized.includes("premise"));

    results.push({
      token,
      rawKey,
      label: preset?.label || toTitleLabel(rawKey),
      placeholder: preset?.placeholder || `Enter ${rawKey.toLowerCase()}...`,
      multiline: isMultiline,
    });
  }

  return results;
}

export function getVariableSegments(template: string): PromptTemplateSegment[] {
  const segments: PromptTemplateSegment[] = [];
  let lastIndex = 0;

  for (const match of template.matchAll(PLACEHOLDER_REGEX)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ type: "text", value: template.slice(lastIndex, start) });
    }
    segments.push({
      type: "variable",
      token: match[0],
      rawKey: match[1].trim(),
    });
    lastIndex = start + match[0].length;
  }

  if (lastIndex < template.length) {
    segments.push({ type: "text", value: template.slice(lastIndex) });
  }

  return segments;
}

export function renderResolvedPrompt(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(PLACEHOLDER_REGEX, (fullMatch, key: string) => {
    const normalized = key.trim().toLowerCase();
    const replacement = values[normalized];
    if (typeof replacement === "string" && replacement.trim().length > 0) {
      return replacement.trim();
    }
    return fullMatch;
  });
}

export function enrichPromptLibrary(categories: PromptCategory[]): EnrichedPrompt[] {
  const list: EnrichedPrompt[] = [];
  for (const cat of categories) {
    for (const item of cat.prompts) {
      list.push({
        ...item,
        categoryId: cat.id,
        categoryTitle: cat.title,
        categoryDescription: cat.description,
        variables: extractPromptVariables(item.prompt),
      });
    }
  }
  return list;
}

export type SortMode = "category" | "alphabetical" | "quickest";

export function filterPrompts(
  prompts: EnrichedPrompt[],
  query: string,
  activeCategory: string | null,
  sortMode: SortMode
): EnrichedPrompt[] {
  const q = query.trim().toLowerCase();

  const matched = prompts.filter((item) => {
    if (activeCategory && item.categoryId !== activeCategory) return false;
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.prompt.toLowerCase().includes(q) ||
      item.categoryTitle.toLowerCase().includes(q) ||
      item.categoryDescription.toLowerCase().includes(q)
    );
  });

  if (sortMode === "alphabetical") {
    return [...matched].sort((a, b) => a.title.localeCompare(b.title));
  }

  if (sortMode === "quickest") {
    return [...matched].sort(
      (a, b) => a.variables.length - b.variables.length || a.title.localeCompare(b.title)
    );
  }

  return matched;
}
