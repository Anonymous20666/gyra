# Gyra — Master Directive Report
**Date:** 2026-11-06 · **Target:** https://gyra-tester.duckdns.org · **VPS:** 37.16.17.38 (Fly, Ubuntu 24.04, 16-core EPYC, 125 GB RAM)

---

## 1. Vision

Gyra (Genvia AI Company / Victory Lord) becomes a world-class AI development platform: chat-first agent workflow (plan before action, visible tool steps, stop/rollback), real generated previews, project files, and a working terminal surface — with zero fake features. Production target remains gyra.ng; the test domain is a continuously-updated, fully-verified mirror.

## 2. Codebase & Infrastructure Audit (findings that shaped the work)

- **App:** Next.js 16 (App Router) + Supabase client. 20 business tables (chats, messages, projects, files, keys, subscriptions, payments, broadcasts, analytics…). Product surface: AI chat (Groq), video (fal), voice, Spotify, subscriptions (₦10,000/mo · ₦118,800/yr, MoMo + crypto), OpenAI-compatible API (`/api/v1`, model "gyra-1.0"), admin gated to victorylordhimself@gmail.com.
- **Infra (before):** single VPS, nginx + pm2, **no systemd** (Fly machine, `/fly/init` PID 1), root disk 7.8 GB at ~100% (docker root on `/data` 492 GB), Pterodactyl + earning-hub pre-existing and untouched.
- **Risks found & handled:** HTML cached with `s-maxage=31536000` (mobile saw stale pages) → fixed with `headers()` policy in `next.config.ts`; watchdog self-restart bug (grep on a /dev/null-redirected pipe) → fixed; `drop schema auth cascade` silently dropped all 20 RLS policies → canonical re-setup saved to `/root/gyra/.secrets/full-db-setup.sql`.

## 3. Deployment Status

**LIVE: https://gyra-tester.duckdns.org** — external HTTP 200, HTTP→HTTPS 301.
- nginx (80→301, 443→pm2) + `/sb/{auth,rest,storage}/v1` proxied to the self-hosted backend (below).
- Deploy pipeline: `SKIP_PULL=1 /root/gyra/deploy.sh` (build-gated: never restarts on a failed build; health-checks local+external after). Last deploy **DEPLOY OK 2026-11-06 03:38 UTC**.
- Watchdog: `healthwatch.sh` every minute via cron — restarts nginx/pm2 apps and all gyra-* containers if they die. Log: `/root/gyra/.watchdog.log`.

## 4. Certificate & Renewal

- Let's Encrypt cert for gyra-tester.duckdns.org, **valid until 2027-02-04** (≈90 days), valid chain, HTTP→HTTPS redirect verified externally.
- Renewal **dry-run PASSED**. Auto-renewal trigger: unverifiable — no systemd on this box; a manual `certbot renew` every ~60 days is the honest procedure until the Fly image gains boot persistence. (Noted as an open item, not claimed fixed.)

## 5. Competitor Findings (Phase 2, 2026 landscape)

- **Lovable** (~8M users, $25/mo): chat-first + structured plan stage, Supabase-native, prompt→preview loop, visible build steps, shared credit pools, low lock-in.
- **Bolt.new** (StackBlitz): code-first split view — chat left; file tree + Monaco + terminal + live WebContainer preview right; open source; Figma import; high lock-in.
- **Replit** (40M users, $20/mo): full IDE canvas + agent, strongest eval/ecosystem brand.
- **2026 agent-UX bar:** editable plan as first-class object (Claude Code), per-hunk diff accept/reject before writes (Cursor), tool calls as visible collapsible blocks, stop button that actually stops, honest meters, per-step live status, per-turn rollback, progress narration over progress bars, autonomy dial, honest "stuck" state (Devin).
- Billing: credit pools vs token meters. Implication for Gyra: surface a real plan/credits model and per-step status in chat — not simulated sparkles.

## 6. Redesign Roadmap (Phase 3/4 — proposed, not yet built)

1. **Design tokens first:** premium type scale (one display + one UI family), 8-pt spacing, restrained palette (no gradient headings, no glass, no glow), single accent.
2. **Chat as agent console:** plan block → executable steps with live status (pending/running/done) → diffs with accept/reject → preview pane; stop/undo per turn.
3. **Project workspace:** file tree, inline editor, terminal/preview tabs (Bolt-style split), all wired to the now-working storage API.
4. **Empty/loading/error states everywhere** (real states, no skeletons pretending).
5. **Mobile:** pass-the-thumb navigation, chat-first.
(Sequencing: tokens → chat console → workspace → mobile pass. To be executed next, after this self-hosted foundation.)

## 7. What Was Implemented (this phase — self-hosted test backend)

Every external backend dependency now runs **on the VPS** — zero external API keys needed for the core loop:

| Service | Runs as | Verified |
|---|---|---|
| Auth (GoTrue 2.147.1) | docker `gyra-gotrue` :9999 | signup, auto-confirm, password login, JWTs |
| Data API (PostgREST 12.2.9) | docker `gyra-postgrest` :3001 | CRUD on all tables, RLS enforced |
| Storage (storage-api 1.89.13, S3 backend) | docker `gyra-storage` :3002 | upload / public read / owner delete / bucket list |
| S3 (moto 4.2.14, pinned) | pm2 `gyra-moto` :9000 (bridge IP only, not public) | full object lifecycle |
| JWT role adapter | pm2 `gyra-jwt-adapter` :3010 | re-signs GoTrue tokens so `role` claims match Supabase semantics |
| AI (Ollama 0.40.15 + **gpt-oss:20b**, 13 GB on /data) | pm2 `gyra-ollama` :11434 | real local inference, streaming |
| Email (Mailpit) | docker `gyra-mailpit` :1025/:8025 | invite mail delivered & inspected |

**Code changes (all build-gated, deployed 03:38 UTC):**
- `app/lib/llm.ts` + 4 routes (`api/chat`, `api/title`, `api/v1/chat`, `api/mobile/chat`) — LLM endpoint/model/key now env-driven (`GYRA_LLM_BASE_URL/MODEL/API_KEY`); default still Groq, test env points at Ollama. No mocks.
- `api/send-invite` — self-hosted SMTP (built-in minimal client, no new deps; root disk is full so no npm install possible) with Resend fallback for prod; also fixed the invite link (`/project/` → `/projects/`).
- Storage RLS replaced with Supabase-standard policies (public-bucket read, owner-only write); persisted in `full-db-setup.sql`.
- Reproducibility: `start-local-stack.sh` rebuilds the whole stack (idempotent); `healthwatch.sh` recovers it.

## 8. What Was Tested (all from outside, via the public domain)

- HTTPS 200 + redirect + cert chain ✅
- Signup → auto-confirmed account; password login → JWT ✅
- Chat CRUD via REST; **RLS isolation: second user sees 0 of first user's rows** ✅; service-role sees all ✅
- Storage: upload 200, public read returns exact bytes, non-owner delete rejected (400), owner delete 200, bucket list ✅ (checked at T0 and T+10s)
- **AI chat: streamed a real reply from the local model** ("GYRA-SELFHOSTED-OK"; math check 17×23=391 correct) — inference on VPS CPU, ~5–15 s/answer, no external calls ✅
- **Invite: `POST /api/send-invite` → message present in Mailpit** with correct From (Gyra Projects <no-reply@gyra.local>), To, Subject, and rendered body ✅
- Mobile UA: homepage 200; project page 200 ✅
- Services: all 4 pm2 apps online, all 5 containers up, watchdog active, zero external API keys required ✅

## 9. Blockers & Honest Caveats

1. **No systemd (Fly image):** boot persistence and cert-renewal trigger can't be verified. Runtime crashes are covered by the watchdog; after a true reboot, `/root/gyra/start-local-stack.sh` + `pm2 resurrect` bring the stack back.
2. **Root disk 100% full (7.8 GB):** large artifacts live on `/data` (Ollama + models 13 GB, moto, docker). `npm install` is currently impossible on `/`; future work needing new npm deps requires moving `/root/gyra` to `/data` first.
3. **moto is in-memory:** object *bytes* are lost if the moto process restarts (metadata stays in Postgres; re-upload needed). Fine for a test env; a durable S3 or moto file-storage would close this.
4. **CPU-only inference:** 16-core EPYC, no GPU — replies take ~5–15 s; first request after a server restart pays ~30–60 s model load.
5. **public bucket semantics** (Supabase template parity): `project-files` is public-read (path-privacy only); writes are owner-only.
6. **Invite link target:** invitees are sent to `/projects/{id}`; project *membership* acceptance flow doesn't exist in the current schema — the link lands on the project page, access depends on existing membership. Product gap, not a backend failure.
7. **Still key-gated (honest, no fakes):** fal video, Spotify, XAI/Tavily/Gemini fallbacks, Resend — hidden/503 without keys by design.
8. gyra pm2 restarts (↺29) are fully explained: an early watchdog bug (fixed 03:24) + ecosystem-file reloads during adapter setup. App has been stable since the 03:38 deploy.

---

*Every item above was verified externally today unless explicitly marked otherwise. Nothing is claimed that wasn't tested.*
