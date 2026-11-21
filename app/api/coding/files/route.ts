import {
  keepAlive,
  openSandbox,
  readFileText,
  readTree,
  resolvePath,
  writeFileText,
  workspacePath,
  SANDBOX_ROOT,
} from "@/app/lib/coding/sandbox";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_FILE_BYTES = 1_000_000;

async function sandboxFor(req: Request) {
  const id = new URL(req.url).searchParams.get("sandboxId");
  const sandbox = await openSandbox(id);
  await keepAlive(sandbox);
  return sandbox;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("path");
    const sandbox = await sandboxFor(req);

    if (!target) {
      return Response.json({ tree: await readTree(sandbox) });
    }

    const absolute = resolvePath(target);
    const content = await readFileText(sandbox, absolute);
    if (content.length > MAX_FILE_BYTES) {
      return Response.json(
        { error: "File is too large to open in the editor (over 1 MB)." },
        { status: 413 }
      );
    }

    return Response.json({ path: workspacePath(absolute), content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read the file.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const sandbox = await sandboxFor(req);
    const body = await req.json();
    const absolute = resolvePath(body?.path);
    const content = typeof body?.content === "string" ? body.content : "";

    if (absolute === SANDBOX_ROOT) {
      return Response.json({ error: "Cannot write to the workspace root." }, { status: 400 });
    }
    if (content.length > MAX_FILE_BYTES) {
      return Response.json({ error: "File is too large (over 1 MB)." }, { status: 413 });
    }

    await sandbox.files.makeDir(absolute.slice(0, absolute.lastIndexOf("/")) || SANDBOX_ROOT).catch(() => {});
    await writeFileText(sandbox, absolute, content);

    return Response.json({ ok: true, path: workspacePath(absolute) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the file.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sandbox = await sandboxFor(req);
    const body = await req.json();

    if (body?.from && body?.to) {
      const from = resolvePath(body.from);
      const to = resolvePath(body.to);
      await sandbox.commands.run(`mv ${JSON.stringify(from)} ${JSON.stringify(to)}`);
      return Response.json({ ok: true, path: workspacePath(to) });
    }

    const absolute = resolvePath(body?.path);
    await sandbox.files.makeDir(absolute);
    return Response.json({ ok: true, path: workspacePath(absolute) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create the entry.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const sandbox = await sandboxFor(req);
    const absolute = resolvePath(url.searchParams.get("path"));

    if (absolute === SANDBOX_ROOT) {
      return Response.json({ error: "Refusing to delete the workspace root." }, { status: 400 });
    }

    await sandbox.commands.run(`rm -rf ${JSON.stringify(absolute)}`);
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete the entry.";
    return Response.json({ error: message }, { status: 500 });
  }
}