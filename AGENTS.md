# Restal — Agent Guide

Next.js 15 (App Router) + Turbopack, React 19, Tailwind v4. MongoDB Atlas via mongoose (single default connection), next-auth v4 (credentials), Twilio SMS, Gmail/nodemailer notifications, GCS document storage, Gemini AI chat. Ukrainian-language travel/rental product; deployed on Vercel at restal.in.ua.

## Hard rules

- **Subagents**: YOU ARE NEVER ALLOWED TO USE SUBAGENTS — no `task` tool, no delegation of any kind; do all work directly in this session.

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

- **Commit policy**: commit only major features or massive/critical fixes. No routine/intermediate commits, and agents never push — pushing is a human action (exception: an explicit user instruction to push).
- **Deploy topology** (set 2026-09-03): Vercel's production branch is **`production`**, not `master`. Pushes to `master` create **Preview (dev)** deployments only — they never touch prod. Production deploys are manual, from the server only:
  - promote a specific commit: `git push origin <commit>:production`
  - or promote a deployment in the Vercel dashboard / `vercel --prod`.
- The live site (restal.in.ua) keeps serving the last production deploy until one of the above runs.

## Testing & commit loop (mandatory)

- **After every new feature, before committing**: run the full local verification loop — `npm test` (vitest suite) AND `next build --turbopack`. Both must pass. **Build before you commit**, no exceptions; a red build or failing test blocks the commit.
- **Tests are LOCAL ONLY — NEVER use production details or APIs** (user decision 2026-09-04): agents never run tests against Vercel remote deployments (not Preview, not Production), never query the prod database (`test`), and never call restal.in.ua endpoints or touch real user data. All verification happens against the local dev server on port 3001 with the `dev_restal` database; reusable fixture users/creds are cataloged in `.memory/test-fixtures-dev-restal.md`. Remote behavior is confirmed by the user manually after deploy.
- **New feature → new tests**: every feature ships with tests covering its observable contract (auth/permission boundaries, validation errors, data shapes, side effects like audit entries). Tests mirror app structure under `tests/` (`lib/`, `api/`, `models/`, `middleware`). API routes are tested by importing the handler and calling it with a `NextRequest`; sessions come from mocking `getServerSession` (see `tests/api/users-roles.test.ts`); audit writes are fire-and-forget, so assert on a mocked `logAudit` call, not DB state.
- **Bug fix → immediate regression test** (user decision 2026-09-04): every bug found and fixed MUST ship with a test covering the broken behavior in the same change — "fix now, test later" is forbidden. The test must exercise the exact path that was broken (ideally failing on the pre-fix code). Type-level-only fixes (caught by `tsc`/build) are exempt; any behavioral bug always gets a test.
- **Feature removed or changed → remove/update its tests** in the same change (user decision 2026-09-04): a test for deleted code must not survive — dead tests rot, mask regressions, and keep the suite red.
- **Build vs dev server**: stop the `restal-dev` hub process before running `next build` — a concurrent Turbopack dev server sharing `.next` corrupts page collection (`PageNotFoundError ... ENOENT`, e.g. `/api/promo-codes/[code]`). Restart it afterwards for UI work.

## Gotchas

- **Twilio (`lib/sms.ts`)**: mock mode only activates when `TWILIO_*` creds are *absent*. With real creds present it sends **real SMS even in development**. Local `.env.local` deliberately omits them (user decision 2026-09-03) → OTP codes print to server logs; the commented values sit at the bottom of that file if real local SMS is ever needed.
- **`GCP_PRIVATE_KEY`**: env value is a single line containing literal `\n` escape sequences; code unescapes at runtime via `.replace(/\\n/g, '\n')`. Preserve that format when editing .env files.
- **`NEXTAUTH_URL`** must match the URL clients actually use (e.g., LAN IP for phone testing) or auth callbacks break.
- Rate limits: `/api/register` 5/h/IP, `/api/auth/send-otp` 3/15min/IP, `/api/auth/verify-otp` 10/15min/IP — relevant when smoke-testing flows repeatedly.

## Debugging discipline (avoid loops)

- **Stop condition**: max 2–3 independent probes per live-page symptom. If they don't yield decisive evidence (or the observation tool itself proves unreliable), STOP: report what's fixed + unit-verified, document residual symptoms with collected evidence in `.memory/`, and hand manual verification to the user. Continuing requires explicit user approval.
- **Stuck on a real bug → pause and ask** (user decision 2026-09-05): if after reasonable investigation you can't find the solution, stop digging and ask — present what's known, what was tried, and the options. Do not keep generating new hypotheses from ambiguous probe results on your own.
- **Unit-verified fix = shippable.** A fix verified against real schema/resolver/components in tests is done; chasing the last 10% of live-page behavior (reading dist/minified sources, fiber probes) is optional follow-up, not part of "done".
- **Verify observation tooling first.** Before building a hypothesis on probe output, confirm the probe works (e.g., a deliberate `console.log` must be captured). If it doesn't, discard all evidence collected with that tool — don't reinterpret it.

## Memory

Persistent project memory lives in `.memory/` (gitignored; **English-only** content, no secret values). The full protocol — when to write, file format, hybrid retrieval — is defined by the **restal-memory** skill. Read `skill://restal-memory` (file: `.claude/skills/restal-memory/SKILL.md`) before non-trivial work in this repo, and follow it whenever recording decisions or findings. For browser-driven UI testing/smoke passes, read `skill://restal-browser-testing` first — it catalogs every automation error hit so far with the working technique.
