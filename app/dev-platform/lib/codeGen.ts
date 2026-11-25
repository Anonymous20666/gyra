import { GYRA_API_BASE_URL, type GyraEndpointSpec } from "./gyraCatalog";

export type CodeLanguage = "curl" | "typescript" | "python";

export function maskCredentialForSnippet(
  rawKey: string,
  requiredPrefix?: string
): string {
  const trimmed = rawKey.trim();
  if (!trimmed) {
    if (requiredPrefix === "gyramedia_") return "$GYRA_MEDIA_API_KEY";
    return "$GYRA_API_KEY";
  }
  if (trimmed.length <= 12) return "••••••••";
  return `${trimmed.slice(0, 10)}••••${trimmed.slice(-4)}`;
}

export function resolveEndpointUrl(
  endpoint: GyraEndpointSpec,
  parsedBody: Record<string, unknown> | null,
  baseUrl: string = GYRA_API_BASE_URL
): string {
  let resolvedPath = endpoint.path;
  if (resolvedPath.includes("{id}")) {
    const idVal =
      parsedBody && typeof parsedBody.id === "string" && parsedBody.id.trim()
        ? parsedBody.id.trim()
        : "YOUR_JOB_ID";
    resolvedPath = resolvedPath.replace("{id}", encodeURIComponent(idVal));
  }
  return `${baseUrl.replace(/\/$/, "")}${resolvedPath}`;
}

function getAuthHeaderLine(
  endpoint: GyraEndpointSpec,
  maskedKey: string
): { headerName: string; headerValue: string } {
  if (endpoint.authType === "session-token") {
    return {
      headerName: "x-gyra-user-token",
      headerValue: maskedKey.startsWith("$") ? "$GYRA_SESSION_TOKEN" : maskedKey,
    };
  }
  return {
    headerName: "Authorization",
    headerValue: `Bearer ${maskedKey}`,
  };
}

export function generateCodeSnippet(
  lang: CodeLanguage,
  endpoint: GyraEndpointSpec,
  rawJsonBody: string,
  apiKey: string,
  baseUrl: string = GYRA_API_BASE_URL
): string {
  let parsed: Record<string, unknown> | null = null;
  try {
    const obj = JSON.parse(rawJsonBody);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      parsed = obj as Record<string, unknown>;
    }
  } catch {
    parsed = null;
  }

  const fullUrl = resolveEndpointUrl(endpoint, parsed, baseUrl);
  const maskedKey = maskCredentialForSnippet(apiKey, endpoint.requiredKeyPrefix);
  const auth = getAuthHeaderLine(endpoint, maskedKey);
  const formattedBody = parsed ? JSON.stringify(parsed, null, 2) : rawJsonBody.trim() || "{}";
  const hasBody = endpoint.method !== "GET";

  if (lang === "curl") {
    const lines = [
      `curl -X ${endpoint.method} "${fullUrl}" \\`,
      `  -H "${auth.headerName}: ${auth.headerValue}"${hasBody ? " \\" : ""}`,
    ];
    if (hasBody) {
      lines.push(`  -H "Content-Type: application/json" \\`);
      lines.push(`  -d '${formattedBody.replace(/'/g, "'\\''")}'`);
    }
    return lines.join("\n");
  }

  if (lang === "typescript") {
    const envVar =
      endpoint.authType === "session-token"
        ? "process.env.GYRA_SESSION_TOKEN"
        : endpoint.requiredKeyPrefix === "gyramedia_"
          ? "process.env.GYRA_MEDIA_API_KEY"
          : "process.env.GYRA_API_KEY";

    const headerAuthExpr =
      endpoint.authType === "session-token"
        ? `"${auth.headerName}": ${envVar} ?? ""`
        : `"Authorization": \`Bearer \${${envVar}}\``;

    const indentedBody = formattedBody
      .split("\n")
      .map((line, i) => (i === 0 ? line : `  ${line}`))
      .join("\n");

    const fetchOptions = hasBody
      ? `{\n  method: "${endpoint.method}",\n  headers: {\n    "Content-Type": "application/json",\n    ${headerAuthExpr},\n  },\n  body: JSON.stringify(${indentedBody}),\n}`
      : `{\n  method: "${endpoint.method}",\n  headers: {\n    ${headerAuthExpr},\n  },\n}`;

    return `const response = await fetch("${fullUrl}", ${fetchOptions});\n\nif (!response.ok) {\n  throw new Error(\`Gyra API error: \${response.status}\`);\n}\n\nconst data = await response.json();\nconsole.log(data);`;
  }

  // Python
  const envVar =
    endpoint.authType === "session-token"
      ? "GYRA_SESSION_TOKEN"
      : endpoint.requiredKeyPrefix === "gyramedia_"
        ? "GYRA_MEDIA_API_KEY"
        : "GYRA_API_KEY";

  const authPy =
    endpoint.authType === "session-token"
      ? `"${auth.headerName}": os.environ["${envVar}"]`
      : `"Authorization": f"Bearer {os.environ['${envVar}']}"`;

  const pyBody = formattedBody
    .replace(/\btrue\b/g, "True")
    .replace(/\bfalse\b/g, "False")
    .replace(/\bnull\b/g, "None");

  if (!hasBody) {
    return `import os\nimport requests\n\nresponse = requests.${endpoint.method.toLowerCase()}(\n    "${fullUrl}",\n    headers={${authPy}},\n    timeout=30,\n)\nresponse.raise_for_status()\nprint(response.json())`;
  }

  return `import os\nimport requests\n\npayload = ${pyBody}\n\nresponse = requests.${endpoint.method.toLowerCase()}(\n    "${fullUrl}",\n    headers={\n        "Content-Type": "application/json",\n        ${authPy},\n    },\n    json=payload,\n    timeout=60,\n)\nresponse.raise_for_status()\nprint(response.json())`;
}
