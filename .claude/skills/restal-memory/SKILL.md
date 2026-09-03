---
name: restal-memory
description: Persistent memory protocol for the Restal project. Use before non-trivial work (retrieve prior findings/decisions) and after making decisions, discovering gotchas, or verifying behavior (record them). All memory content is English-only. Hybrid retrieval via bundled search script (local LM Studio embeddings + grep fallback).
---

# restal-memory

Persistent project memory for Restal. Source of truth: markdown files in `<repo>/.memory/` (gitignored). This skill defines the write and retrieval protocol.

## When to use

- **Before** non-trivial work in this repo (debugging, config changes, anything touching DB/auth/deploy): retrieve first — prior sessions may already know the answer.
- **After**: making a decision with tradeoffs, discovering a gotcha/incident, verifying behavior that was previously unknown, or closing an open item.

Trivial one-off commands don't need memory. Rule of thumb: if a future session would waste 5+ minutes rediscovering it, write it down.

## Storage rules (mandatory)

1. **English only.** All memory content is written in English regardless of the conversation language. Code identifiers, API paths, and verbatim error strings stay as-is (they are already English/technical).
2. **Never store secret values** — no connection strings with passwords, API keys, tokens, or private key material. Reference where a value lives instead (e.g., "in `.env.local`, mirrored from Vercel").
3. One file per topic: `<repo>/.memory/YYYY-MM-DD-<short-topic>.md`. Continue the existing file for an ongoing topic; new file when the topic changes.
4. Section structure within each file:
   - `## Decisions` — what was chosen and why (include rejected alternatives in one line)
   - `## Findings` — facts discovered about the system, incidents with dates
   - `## Verified` / `## NOT yet verified` — what was actually tested vs assumed
   - `## Open items` — `- [ ]` checkboxes; flip to `- [x]` when resolved (don't delete)
5. Keep entries short: one fact per bullet. Durable facts only — no transient session chatter.

## Write protocol

Append as findings happen, not in a batch at the end of a session (a crashed session loses unbatched memory). Update `## Open items` checkboxes immediately when something resolves.

## Retrieval protocol

Hybrid: semantic + keyword, union both signals.

1. **Semantic** — run the bundled script (resolves `.memory/` relative to repo root automatically):
   ```
   node <skill-dir>/search.mjs "<query>" [-k 5] [--grep]
   ```
   It embeds the query via local LM Studio (`nomic-embed-text-v1.5`, `localhost:1234/v1/embeddings`), lazily re-embeds changed sections (index in `.memory/.index/`, disposable — safe to delete), and prints top-k sections with file + line ranges. If LM Studio is down it degrades to grep-only and says so in the output (`MODE:` line).
2. **Keyword** — additionally `grep` for exact tokens the query contains (error codes, identifiers like `GCP_PRIVATE_KEY`, phone numbers, SIDs). Embeddings miss exact strings; grep never does.
3. Read only the winning line ranges from step 1–2 (`read` with offsets), not whole files.

Cross-language note: semantic recall is weaker for Ukrainian queries against English notes — lean on grep for UI-string/error-message lookups.

## Assets

- `skill://restal-memory/search.mjs` — retrieval script (no dependencies, Node ≥ 18). Env overrides: `LMSTUDIO_EMBED_URL`, `LMSTUDIO_EMBED_MODEL`.
