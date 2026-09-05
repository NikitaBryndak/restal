---
name: restal-og-images
description: Playbook for Restal's per-trip Open Graph image route (next/og + satori) on shared trip pages. Read before touching opengraph-image.tsx or adding OG images anywhere — catalogs every satori error hit with the working card pattern and a fast verification loop.
---

# restal-og-images

Per-trip OG cards: `app/shared/trip/[token]/opengraph-image.tsx` renders a 1200×630 PNG on demand (trip data + country photo background; generic branded card for unknown tokens — no 404s). Fonts: static Inter TTF subsets in `public/fonts/` (rebuild via `scripts/build-og-fonts.py`). Tests: `tests/api/og-image.test.ts`.

## 1. Satori hard rules (violating any = broken image or thrown error)

1. **Absolutely-positioned children inside a `React.Fragment` are silently dropped.** `<><img/><div/></>` as a child of the root → both elements vanish, no error, 200 PNG with only the background color. Fix: render `{bg && <img …/>}` and `{bg && <div overlay/>}` as **direct children** of the positioned root. Never wrap absolutely-positioned elements in a fragment.
2. **Multi-child divs need an explicit `display`**, else satori throws "Expected `<div>` to have explicit display: flex or display: none if it has more than one child node" — this applies even when every child is `position: absolute`. The root card div needs `display: "flex"` regardless.
3. **Mixed text + interpolation = multiple children**: `<div>Подорож до {trip.country}</div>` throws (2 children, no display). Use a template literal `{`Подорож до ${trip.country}`}` or make the div flex.
4. **Fonts: static TTF/OTF only.** WOFF2 and variable fonts are rejected by the bundled parser. Keep `public/fonts/Inter-{Regular,Bold}.ttf` (ASCII+Cyrillic subset) committed; rebuild via `scripts/build-og-fonts.py`.

## 2. Working card layout pattern

Flex-column stacking of tall mixed blocks is unreliable in this satori build (children overlap/misplace). Use **absolute-positioned sections with fixed top offsets** on the 1200×630 canvas: brand row `top:48` · title `top:240` (fontSize 84) · region `top:356` (44) · dates row `top:440` (flex row, gap 72; each column a small flex-column label+value — that works fine) · tour line `top:556` (30). Photo background = `<img>` with data URL + solid `rgba(5,8,16,0.7)` overlay div, both direct root children (rule 1).

## 3. Verification loop (fast → slow)

1. **Isolated node probe** (<1s per render): plain `.cjs` script — `require("next/og")` + `react.createElement`, write PNG, inspect it. Use for bisecting satori behavior; no server round trip.
2. **vitest**: `npx vitest run tests/api/og-image.test.ts` — seeds a Греція trip in dev_restal; asserts the per-trip card differs from the generic one (proves the photo branch renders).
3. **Live visual check** on port 3001: curl all three variants and inspect the PNGs — country with image (Греція), without (Італія), unknown token (generic): `curl -s http://localhost:3001/shared/trip/<token>/opengraph-image -o .tmp-og.png`

## 4. Session mistakes not to repeat

- **Stale dev-server renders**: a live PNG that looks like old code may be a stale Turbopack compile (no "Compiling" line in the log). Check `hub logs` for fresh compiles before theorizing about satori behavior.
- **`&&` chains hide skipped steps**: `npx vitest … && curl A && curl B; file *` — if vitest exits non-zero, both curls are silently skipped and you inspect STALE PNGs from a previous run. Use `;` between independent verification steps or separate calls.
- **Debug logs truncate in hub output**: keep payloads short (`{"hasBg":true,"bgLen":118223}` fits; full objects get cut mid-line).

## 5. Fixtures

Demo trip `TEST-REVIEW-DEMO` (shareToken `NIKITA-REVIEW-DEMO`) is Греція/Санторині as of 2026-09-05 — the photo path is visually testable with it. See `.memory/test-fixtures-dev-restal.md`.
