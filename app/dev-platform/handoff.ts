import type { ApiCategoryId } from "./lib/gyraCatalog";

export interface PlaygroundHandoff {
  category?: ApiCategoryId;
  endpointPath?: string;
  requestBody?: string;
  apiKey?: string;
}

const HANDOFF_KEY = "gyra:dev-playground-handoff";

export function savePlaygroundHandoff(data: PlaygroundHandoff): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export function consumePlaygroundHandoff(): PlaygroundHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(HANDOFF_KEY);
    return JSON.parse(raw) as PlaygroundHandoff;
  } catch {
    return null;
  }
}
