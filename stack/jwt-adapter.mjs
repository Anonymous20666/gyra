// GYRA JWT adapter: normalizes the Supabase "role" claim on tokens issued by
// the local GoTrue (which leaves role empty for email users) before forwarding
// to PostgREST / storage-api. Re-signs with the shared HS256 secret.
import http from "node:http";
import fs from "node:fs";
import { createHmac } from "node:crypto";

const envText = fs.readFileSync("/root/gyra/.secrets/local-stack.env", "utf8");
const SECRET = (envText.match(/^JWT_SECRET=(.*)$/m) || [])[1].trim();
if (!SECRET) { console.error("JWT_SECRET missing"); process.exit(1); }

const TARGETS = [
  ["/sb/rest/v1/", "127.0.0.1:3001"],
  ["/sb/storage/v1/", "127.0.0.1:3002"],
];

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
function reSign(payload) {
  const h = b64u({ alg: "HS256", typ: "JWT" });
  const p = b64u(payload);
  const s = createHmac("sha256", SECRET).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${s}`;
}
function fixJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return token;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!payload.role) payload.role = payload.sub ? "authenticated" : "anon";
    if (!payload.exp) payload.exp = Math.floor(Date.now() / 1000) + 3600;
    return reSign(payload);
  } catch {
    return token;
  }
}

const server = http.createServer((req, res) => {
  const t = TARGETS.find(([p]) => req.url.startsWith(p));
  if (!t) { res.writeHead(404, { "content-type": "application/json" }); res.end('{"error":"no route"}'); return; }
  const [prefix, target] = t;
  const qIdx = req.url.indexOf("?");
  const rawPath = qIdx === -1 ? req.url : req.url.slice(0, qIdx);
  const query = qIdx === -1 ? "" : req.url.slice(qIdx);
  let path = rawPath.slice(prefix.length);
  if (!path.startsWith("/")) path = "/" + path;
  const [host, port] = target.split(":");
  const up = { host, port: Number(port), path: path + query, method: req.method };
  const headers = { ...req.headers, host: target };
  const auth = req.headers["authorization"];
  if (auth && auth.startsWith("Bearer ")) headers.authorization = "Bearer " + fixJwt(auth.slice(7));
  const proxyReq = http.request({ ...up, headers }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on("error", (e) => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "bad_gateway", message: e.message }));
  });
  req.pipe(proxyReq);
});
server.listen(3010, "127.0.0.1", () => console.log("gyra jwt-adapter listening on 127.0.0.1:3010"));
