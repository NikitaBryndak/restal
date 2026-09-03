---
name: restal-browser-testing
description: Browser-based testing and smoke-test playbook for the Restal project. Use before driving the UI with the browser tool (form fills, file uploads, auth flows, mobile-viewport tests). Catalogs every error hit in past sessions with the correct technique so they are not repeated.
---

# restal-browser-testing

Playbook for automating the Restal UI (Next.js 15 + React 19) with the `browser` tool. Every entry below is a real mistake made in a past session — symptom first, then the working approach. Read this BEFORE any browser-driven test; it saves hours of wrong diagnosis.

## 1. Setup

- Dev server: port **3001** (3000 = Docker Desktop), `-H 0.0.0.0` for LAN/phone testing. Run as a hub process (`hub start`, name `restal-dev`), never plain bash — it must survive the turn and its logs are checked via `hub logs`.
- **Relay vs spawned browser.** The relay drives the USER'S real Chrome: desktop viewport, their logged-in sessions, their tabs. It is NOT mobile emulation and you cannot control window size. For isolated testing (fresh session, mobile viewport) spawn your own headless Chrome:
  ```json
  {"action":"open","name":"test","url":"...","app":{"path":"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","args":["--user-data-dir=C:/Users/<u>/AppData/Local/Temp/omp-chrome-profile"]},"viewport":{"width":390,"height":844}}
  ```
- **Always pass an isolated `--user-data-dir`.** Launching with the default profile fails when another Chrome instance is running ("already running without a reusable CDP endpoint"). Temp dir = disposable session, no cookies from user's real browser.
- Mobile test ≈ viewport 390×844 in the spawned browser. UA emulation optional for layout/scroll tests.
- `run` code executes with full Node access: `require('fs')`, raw puppeteer via `page`, CDP via `await page.target().createCDPSession()`.

## 2. Filling React controlled forms (the only way that works)

React ignores direct `.value = x` (state never updates). Use the native setter + event:

```js
const setVal = (el, v) => {
  el.focus();
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
};
```

- `<select>`: set `.value` then dispatch `new Event('change', { bubbles: true })`.
- **Dotted ids break CSS selectors.** react-hook-form generates ids like `travellers.0.firstName` — `#travellers.0.firstName` is invalid CSS. Use attribute form: `document.querySelector('[id="travellers.0.firstName"]')`.
- Submit with `form.requestSubmit()` or click the real `<button type=submit>` (check `!disabled`). Synthetic `dispatchEvent(new Event('submit'))` is less reliable for React onSubmit.
- **Verify success on specific post-submit text, never page headings.** Past mistake: regex matched the static heading "Залиште заявку" and reported success while a required field was actually empty. Also verify every field you intended to fill returned `true` from your setter — a missing selector (e.g. phone input has no id) fails silently per-field.

## 3. File uploads (DocumentsSection etc.)

The working chain, in order:
1. Get the node id via CDP querySelector (NOT manual tree traversal):
   ```js
   const cdp = await page.target().createCDPSession();
   const { root } = await cdp.send('DOM.getDocument');
   const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#document-file-contract' });
   ```
2. `await cdp.send('DOM.setFileInputFiles', { files: [absPath], nodeId });` — works on `display:none` inputs.

Verification (critical): **do NOT check `el.files.length`.** The app's onChange saves the File to React state (`pendingFiles`) and then clears `event.target.value = ''` by design (re-select same file). So `files: 0` after a successful upload is NORMAL. Verify via:
- UI text contains the filename, or
- server logs show `POST /api/upload 200`.

Dead ends already proven — do not retry:
- `el.files = dataTransfer.files` → silently ignored in Chrome (no exception).
- Manual CDP tree traversal for nodeId → returns undefined → "Failed to deserialize params.nodeId - int32 value expected". Use `DOM.querySelector`.
- `tab.uploadFile`/`page.$(...).uploadFile` on these hidden inputs appeared to no-op — same root cause as above (React clears the input); it may actually have worked. Judge by UI/logs, not DOM state.

## 4. Auth & session behavior (next-auth v4)

- Signout requires **POST** `/api/auth/signout`. GET does nothing — the session survives and confuses every later step ("why is /login redirecting me?").
- `/login` redirects already-authenticated users to `/dashboard/profile`. If you land on profile, you are still logged in; sign out properly first.
- **privilegeLevel changes in MongoDB propagate into the live session without re-login** — the jwt callback refreshes user data per request. To test manager/admin pages: `db.users.updateOne({phoneNumber}, {$set:{privilegeLevel: N}})` then just navigate. Levels: 1 CLIENT, 2 EDITOR, 3 MANAGER, 4 ADMIN (ADMIN sees everything; note manage-articles requires exactly EDITOR for non-admins).
- For a full smoke pass, promote the test user to level 4 once — every page becomes reachable in one session.

## 5. App-specific facts (selectors & pages)

- Contact form: phone input has **no id** → `input[placeholder="+380XXXXXXXXX"]`. Success banner: "Надіслано! Ми зв'яжемося з вами найближчим часом."
- `/search` is an **AI chat only** (Gemini) — no tour-list search. `[name=search-query]` IS the chat input; a submitted query returns an AI answer (also proves GEMINI_API_KEY works).
- Dev mode renders duplicate component trees; `document.querySelector` first match was consistently the live one (form fills worked). If something misbehaves, count matches: `document.querySelectorAll(sel).length`.
- Trip detail: `/dashboard/trips/[id]`; add-tour requires MANAGER+; created trip redirects to `/dashboard` after ~1.5s success banner.
- Rate limits bite during repeated smoke tests: register 5/h/IP, send-otp 3/15min/IP, verify-otp 10/15min/IP (see AGENTS.md).

## 6. Windows / environment gotchas

- Python `subprocess.run(text=True)` mangles Cyrillic node output on Windows → use `encoding="utf-8", errors="replace"`.
- No `lint` npm script — run `npx eslint .` directly (exit 0 with ~116 legacy warnings is the healthy baseline).
- One-off DB check scripts: write `.db-check.cjs`, run with node + MONGODB_URI from `.env.local` (parse it yourself; dotenv not needed), **delete after use**.
- `crypto.randomUUID()` and other secure-context-only APIs crash on plain HTTP LAN access (`http://<lan-ip>:3001`) — the app had this bug in `/search`, fixed 2026-09-03 (commit c115ce9). If a page dies with "X is not a function" only over HTTP, suspect secure-context APIs.

## 7. Error catalog (symptom → cause)

| Symptom | Cause / fix |
|---|---|
| `files: 0` after upload, no error | React cleared the input by design — check UI filename or server log |
| "Failed to deserialize params.nodeId - int32 value expected" | nodeId undefined from manual traversal — use CDP `DOM.querySelector` |
| DataTransfer file assign does nothing | Chrome ignores `.files = dt.files` — use CDP `DOM.setFileInputFiles` |
| Form submit does nothing / state empty | Direct `.value=` ignored by React — native setter + input event (section 2) |
| "Success" reported but form still there | Matched a page heading, not the banner; or a required field silently unfilled (no id) |
| `#a.b.c` selector throws SyntaxError | Dotted react-hook-form ids — use `[id="a.b.c"]` |
| Launch fails "already running without CDP endpoint" | Default profile in use — pass isolated `--user-data-dir` |
| Mobile test shows desktop layout | Used relay (user's real Chrome) — spawn own headless with viewport |
| Signout "worked" but still logged in | GET signout is a no-op — POST `/api/auth/signout` |
| Level change not visible | It IS live — navigate again; no re-login needed |
| Cyrillic garbled / empty python output | `text=True` locale decoding — explicit utf-8 |
| Page crashes "crypto.randomUUID is not a function" over HTTP | Secure-context API on non-secure origin (fixed in app; see section 6) |
| Save in settings UI "does nothing" | Controlled combobox ignores programmatic value set — type real keystrokes; Enter submits the form (may save accidentally) |
| Text won't select in a web input | Ctrl+A/triple-click intercepted — clear with repeated Backspace |

## 8. Vercel dashboard settings edits (via relay)

- Drive the UI, not the API: `api.vercel.com` rejects dashboard session cookies and blocks cross-origin fetch from vercel.com pages.
- Branch-tracking / text inputs are controlled comboboxes: **real keystrokes only** (`page.keyboard.type`). Programmatic `.value` + input event never registers (Save stays disabled or re-saves the old value).
- Ctrl+A and triple-click do NOT select text in these fields — clear with repeated Backspace.
- **Enter submits/saves the form.** An accidental Enter can persist a save you thought failed; always confirm by fresh reload, not same-page state.
- Save enables only when internal state differs from server value (disabled = no diff or already saved).
- Radix ids (`input-_r_XX_`) change every render — select by placeholder/attribute, never by remembered id.
- Project settings live under **Settings → Environments** in the current UI (Production branch tracking is NOT on the Git page anymore).
