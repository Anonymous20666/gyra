export type StreamEvent =
  | { type: "text"; value: string }
  | { type: "reasoning"; value: string }
  | { type: "tool-call"; id: string; name: string; args: Record<string, unknown> }
  | { type: "tool-result"; id: string; name: string; result: unknown }
  | { type: "error"; value: string }
  | { type: "finish"; value: string };

const EMPTY = new Set(["", " ", "\n"]);

export function parseStreamLine(line: string): StreamEvent | null {
  if (!line || EMPTY.has(line)) return null;

  const separator = line.indexOf(":");
  if (separator <= 0) return null;

  const code = line.slice(0, separator);
  const raw = line.slice(separator + 1);
  if (!raw) return null;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }

  switch (code) {
    case "0":
      return typeof json === "string" ? { type: "text", value: json } : null;
    case "g":
      return typeof json === "string" ? { type: "reasoning", value: json } : null;
    case "9": {
      const part = json as { toolCallId?: string; toolName?: string; args?: unknown };
      if (!part?.toolCallId || !part?.toolName) return null;
      return {
        type: "tool-call",
        id: part.toolCallId,
        name: part.toolName,
        args: (part.args ?? {}) as Record<string, unknown>,
      };
    }
    case "a": {
      const part = json as { toolCallId?: string; toolName?: string; result?: unknown };
      if (!part?.toolCallId) return null;
      return {
        type: "tool-result",
        id: part.toolCallId,
        name: part.toolName ?? "tool",
        result: part.result,
      };
    }
    case "3":
      return {
        type: "error",
        value: typeof json === "string" ? json : "The agent stream failed.",
      };
    case "d": {
      const part = json as { finishReason?: string };
      return { type: "finish", value: part?.finishReason ?? "stop" };
    }
    default:
      return null;
  }
}

export function resultToText(result: unknown): string {
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}