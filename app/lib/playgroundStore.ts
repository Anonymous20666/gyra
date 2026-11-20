import type { PlaygroundMode } from "./modelCatalog";

export const PLAYGROUND_STORAGE_KEY = "gyra:playground:v1";

export interface SavedPromptItem {
  id: string;
  title: string;
  mode: PlaygroundMode;
  prompt: string;
  systemPrompt?: string;
  modelId: string;
  createdAt: string;
}

export interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  imageUrl?: string;
  modelId?: string;
  latencyMs?: number;
  createdAt: string;
}

export interface ImageHistoryItem {
  id: string;
  prompt: string;
  modelId: string;
  url: string;
  params: Record<string, string | number | boolean>;
  latencyMs?: number;
  createdAt: string;
}

export interface ComparisonResultItem {
  slot: "A" | "B";
  modelId: string;
  label: string;
  think: boolean;
  search: boolean;
  content: string;
  reasoning?: string;
  ttftMs: number | null;
  totalMs: number | null;
  status: "idle" | "streaming" | "done" | "error";
  error?: string;
}

export interface PlaygroundExperiment {
  id: string;
  title: string;
  mode: PlaygroundMode;
  modelId: string;
  systemPrompt: string;
  updatedAt: string;
  chatTurns: ChatTurn[];
  imageHistory: ImageHistoryItem[];
  lastComparePrompt?: string;
  lastCompareResults?: ComparisonResultItem[];
}

export interface PlaygroundPersistedState {
  experiments: PlaygroundExperiment[];
  savedPrompts: SavedPromptItem[];
}

const EMPTY_STATE: PlaygroundPersistedState = {
  experiments: [],
  savedPrompts: [],
};

export function createExperiment(
  mode: PlaygroundMode,
  modelId: string,
  title?: string,
  nowIso: string = new Date().toISOString(),
): PlaygroundExperiment {
  const modeLabel =
    mode === "chat"
      ? "Chat"
      : mode === "image"
        ? "Image"
        : mode === "video"
          ? "Video"
          : "Comparison";
  return {
    id: `exp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: title?.trim() || `${modeLabel} Experiment`,
    mode,
    modelId,
    systemPrompt: "You are Gyra, a precise and concise technical AI assistant.",
    updatedAt: nowIso,
    chatTurns: [],
    imageHistory: [],
  };
}

export function parsePlaygroundState(raw: string | null): PlaygroundPersistedState {
  if (!raw) return { experiments: [], savedPrompts: [] };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY_STATE;
    const experiments = Array.isArray(parsed.experiments)
      ? parsed.experiments.slice(0, 24)
      : [];
    const savedPrompts = Array.isArray(parsed.savedPrompts)
      ? parsed.savedPrompts.slice(0, 40)
      : [];
    return { experiments, savedPrompts };
  } catch {
    return { experiments: [], savedPrompts: [] };
  }
}

export function upsertExperiment(
  list: PlaygroundExperiment[],
  exp: PlaygroundExperiment,
  maxItems = 24,
): PlaygroundExperiment[] {
  const filtered = list.filter((e) => e.id !== exp.id);
  return [exp, ...filtered].slice(0, maxItems);
}

export function removeExperiment(
  list: PlaygroundExperiment[],
  id: string,
): PlaygroundExperiment[] {
  return list.filter((e) => e.id !== id);
}

export function addSavedPrompt(
  list: SavedPromptItem[],
  item: Omit<SavedPromptItem, "id" | "createdAt">,
  nowIso: string = new Date().toISOString(),
): SavedPromptItem[] {
  const created: SavedPromptItem = {
    ...item,
    id: `prm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    title: item.title.trim() || item.prompt.trim().slice(0, 48),
    createdAt: nowIso,
  };
  return [created, ...list].slice(0, 40);
}

export function removeSavedPrompt(
  list: SavedPromptItem[],
  id: string,
): SavedPromptItem[] {
  return list.filter((p) => p.id !== id);
}
