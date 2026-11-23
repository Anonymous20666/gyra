// app/lib/coding/handle.ts
// One place that knows how to get an E2B sandbox handle for an API route.
// Every coding route imports this instead of repeating the connect/create dance.

import { Sandbox } from "@e2b/code-interpreter";

export const SANDBOX_TIMEOUT_MS = 30 * 60 * 1000;

export class SandboxUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SandboxUnavailableError";
  }
}

export function requireApiKey(): string {
  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) {
    throw new SandboxUnavailableError(
      "Missing E2B_API_KEY. Create one at https://e2b.dev/dashboard, add it to .env.local, then restart the server.",
    );
  }
  return apiKey;
}

/**
 * Connects to an existing sandbox, or creates a fresh one when no id is given.
 * Throws SandboxUnavailableError with a human-readable reason.
 */
export async function getSandbox(sandboxId?: string | null): Promise<Sandbox> {
  const apiKey = requireApiKey();
  const options = { apiKey, timeoutMs: SANDBOX_TIMEOUT_MS };

  if (sandboxId && sandboxId.trim()) {
    try {
      return await Sandbox.connect(sandboxId.trim(), options);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      // A dead sandbox id is common after a restart; fall back to a fresh one.
      console.warn(`[coding] could not reconnect to ${sandboxId}: ${message}`);
    }
  }

  return Sandbox.create(options);
}

export function errorMessage(error: unknown): string {
  if (error instanceof SandboxUnavailableError) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
}