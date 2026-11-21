import { keepAlive, openSandbox, resolvePath, SANDBOX_ROOT } from "@/app/lib/coding/sandbox";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const encoder = new TextEncoder();
const COMMAND_TIMEOUT_MS = 120_000;

export async function POST(req: Request) {
  let sandboxId: string | null = null;
  let command = "";
  let cwd = SANDBOX_ROOT;

  try {
    const body = await req.json();
    sandboxId = body?.sandboxId ?? null;
    command = String(body?.command ?? "").trim();
    cwd = resolvePath(body?.cwd);

    if (!command) {
      return Response.json({ error: "A command is required." }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));

      try {
        const sandbox = await openSandbox(sandboxId);
        await keepAlive(sandbox);
        send({ type: "start", sandboxId: sandbox.sandboxId, cwd });

        const result = await sandbox.commands.run(command, {
          cwd,
          timeoutMs: COMMAND_TIMEOUT_MS,
          onStdout: (chunk: string) => send({ type: "stdout", data: chunk }),
          onStderr: (chunk: string) => send({ type: "stderr", data: chunk }),
        });

        send({ type: "exit", code: result.exitCode ?? 0 });
      } catch (error) {
        send({
          type: "stderr",
          data: error instanceof Error ? error.message : "Command failed.",
        });
        send({ type: "exit", code: 1 });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}