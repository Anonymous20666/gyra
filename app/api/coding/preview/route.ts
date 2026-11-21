import {
  keepAlive,
  openSandbox,
  previewUrl,
  readFileText,
  resolvePath,
  SANDBOX_ROOT,
} from "@/app/lib/coding/sandbox";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type Detected = { command: string; port: number; framework: string };

async function detect(sandbox: Awaited<ReturnType<typeof openSandbox>>, requestedPort: number) {
  const port = requestedPort;

  try {
    const pkgRaw = await readFileText(sandbox, resolvePath("package.json"));
    const pkg = JSON.parse(pkgRaw) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
    const framework = deps.next
      ? "next"
      : deps.vite
      ? "vite"
      : deps["react-scripts"]
      ? "cra"
      : deps.nuxt
      ? "nuxt"
      : deps.astro
      ? "astro"
      : "node";

    const script = pkg.scripts?.dev
      ? "dev"
      : pkg.scripts?.start
      ? "start"
      : pkg.scripts?.serve
      ? "serve"
      : null;

    if (script) {
      return {
        command: `PORT=${port} BROWSER=none npm run ${script} -- --port ${port} --host 0.0.0.0`,
        port,
        framework,
      } satisfies Detected;
    }
  } catch {
    // No package.json: fall through to the static options below.
  }

  try {
    await readFileText(sandbox, resolvePath("index.html"));
    return {
      command: `python3 -m http.server ${port} --bind 0.0.0.0`,
      port,
      framework: "static",
    } satisfies Detected;
  } catch {
    return null;
  }
}

async function probe(sandbox: Awaited<ReturnType<typeof openSandbox>>, port: number) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const res = await sandbox.commands.run(
        `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:${port} || true`
      );
      const code = (res.stdout || "").trim();
      if (code.startsWith("2") || code.startsWith("3")) return true;
    } catch {
      // Server not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sandbox = await openSandbox(body?.sandboxId);
    await keepAlive(sandbox);

    const requestedPort = Number(body?.port) || 3000;
    const detected = body?.command
      ? { command: String(body.command), port: requestedPort, framework: "custom" }
      : await detect(sandbox, requestedPort);

    if (!detected) {
      return Response.json(
        {
          error:
            "No dev server found. Add a package.json with a dev script, or start one from the terminal.",
        },
        { status: 404 }
      );
    }

    await sandbox.commands.run(
      `pkill -f "port ${detected.port}" >/dev/null 2>&1 || true`,
      { cwd: SANDBOX_ROOT }
    ).catch(() => {});

    await sandbox.commands.run(detected.command, {
      cwd: SANDBOX_ROOT,
      background: true,
    });

    const ready = await probe(sandbox, detected.port);

    return Response.json({
      sandboxId: sandbox.sandboxId,
      url: previewUrl(sandbox, detected.port),
      port: detected.port,
      command: detected.command,
      framework: detected.framework,
      ready,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start the preview.";
    console.error("preview error:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}