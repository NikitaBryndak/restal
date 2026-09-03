# Restal — Agent Guide

Next.js 15 (App Router) + Turbopack, React 19, Tailwind v4. MongoDB Atlas via mongoose (single default connection), next-auth v4 (credentials), Twilio SMS, Gmail/nodemailer notifications, GCS document storage, Gemini AI chat. Ukrainian-language travel/rental product; deployed on Vercel at restal.in.ua.

## Running locally

- `npm install`, then dev server on port **3001** — port 3000 is occupied by Docker Desktop on the dev machine:
  ```
  node node_modules/next/dist/bin/next dev --turbopack -H 0.0.0.0 -p 3001
  ```
  `-H 0.0.0.0` exposes it to the LAN (phone testing at `http://<lan-ip>:3001`).
- Env lives in `.env.local` (gitignored). It mirrors the Vercel project "restal" secrets — reference where values live, never copy secret values into tracked files or docs.

## Database routing (important)

- `lib/mongodb.ts` connects with bare `MONGODB_URI`, no explicit `dbName` → the database name comes from the URI path segment.
- **Production** URI has no path segment → prod data lives in a database literally named **`test`**.
- **Local dev** appends `/dev_restal` to the same cluster URI → isolated dev database on the same Atlas cluster; collections/indexes auto-create via mongoose, so schema converges with prod naturally. Never point local at the bare prod URI.

## Commits & deploys

- **Commit policy**: commit only major features or massive/critical fixes. No routine/intermediate commits, and agents never push — pushing is a human action.
- **Deploy topology** (set 2026-09-03): Vercel's production branch is **`production`**, not `master`. Pushes to `master` create **Preview (dev)** deployments only — they never touch prod. Production deploys are manual, from the server only:
  - promote a specific commit: `git push origin <commit>:production`
  - or promote a deployment in the Vercel dashboard / `vercel --prod`.
- The live site (restal.in.ua) keeps serving the last production deploy until one of the above runs.

## Gotchas

- **Twilio (`lib/sms.ts`)**: mock mode only activates when `TWILIO_*` creds are *absent*. With real creds present it sends **real SMS even in development**. Local `.env.local` deliberately omits them (user decision 2026-09-03) → OTP codes print to server logs; the commented values sit at the bottom of that file if real local SMS is ever needed.
- **`GCP_PRIVATE_KEY`**: env value is a single line containing literal `\n` escape sequences; code unescapes at runtime via `.replace(/\\n/g, '\n')`. Preserve that format when editing .env files.
- **`NEXTAUTH_URL`** must match the URL clients actually use (e.g., LAN IP for phone testing) or auth callbacks break.
- Rate limits: `/api/register` 5/h/IP, `/api/auth/send-otp` 3/15min/IP, `/api/auth/verify-otp` 10/15min/IP — relevant when smoke-testing flows repeatedly.

## Memory

Persistent project memory lives in `.memory/` (gitignored; **English-only** content, no secret values). The full protocol — when to write, file format, hybrid retrieval — is defined by the **restal-memory** skill. Read `skill://restal-memory` (file: `.claude/skills/restal-memory/SKILL.md`) before non-trivial work in this repo, and follow it whenever recording decisions or findings. For browser-driven UI testing/smoke passes, read `skill://restal-browser-testing` first — it catalogs every automation error hit so far with the working technique.
