import { openSandbox, previewUrl, readTree, SANDBOX_ROOT } from "@/app/lib/coding/sandbox";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sandbox = await openSandbox(body?.sandboxId);
    const tree = await readTree(sandbox);

    return Response.json({
      sandboxId: sandbox.sandboxId,
      root: SANDBOX_ROOT,
      previewUrl: previewUrl(sandbox, 3000),
      tree,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not open the sandbox.";
    console.error("coding session error:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}