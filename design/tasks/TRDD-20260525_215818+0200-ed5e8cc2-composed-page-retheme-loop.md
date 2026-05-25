---
trdd-id: ed5e8cc2-74af-4aea-af0b-bf464f8cbe7f
title: Composed-page live data-ve-theme flip wedges main thread via DESIGN.md re-theme cascade
status: not-started
created: 2026-05-25T21:58:18+0200
updated: 2026-05-25T21:58:18+0200
---

# TRDD-ed5e8cc2 — Composed-page live `data-ve-theme` flip wedges main thread via DESIGN.md re-theme cascade

**Filename:** `design/tasks/TRDD-20260525_215818+0200-ed5e8cc2-composed-page-retheme-loop.md`
**Tracked in:** this repo (design/tasks/ is git-tracked)

## Summary

On a page that composes many visual-element atoms (the LAN-map composability
test: 1 graph + 25 donuts + 25 icons + the DESIGN.md engine), flipping
`data-ve-theme` on `<html>` **at runtime** (vs. booting already in that theme)
wedges the main thread. The permanent LAN test works around it by booting once
per theme via a `?theme=` URL param, which is closer to how a shared page is
actually opened — but the live-swap path is the plugin's stated **realtime
Graphic-Style Mode** pillar, so the defect must be fixed, not just routed
around.

This is a **runtime / DESIGN.md theme-system defect**, independent of the
LAN test. The LAN build's own in-scope fix (the `amvcp-diagram.js`
pristine-JSON ordering bug) is already done and is unrelated to this.

## How it surfaced

Building the permanent LAN composability test (3 skills on one page — graph +
icon-svg + chart, per the user's 2026-05-25 request to prove arbitrary
element combinations work). The dual-theme assertion could not flip the theme
live without hanging; booting per-theme via `?theme=` was substituted and the
limitation documented inline in `testLightDarkThemes`. Reported in
`reports/html-effectiveness/20260525_210726+0200-build-lan-composability.md`
(§"Known limitation").

## Root cause (✓ VERIFIED by reading `scripts/amvcp-runtime.js`)

1. **The DESIGN.md engine is always armed after boot.** `bootDesignMdEngine()`
   (runtime.js:8783) loads the page's embedded `<script type="text/design-md">`
   if present, otherwise the built-in `DEFAULT_DESIGNMD_TEXT` (line 8813).
   Either way `veDesignMdApply` runs and sets `veDesignMdState.designmd`
   (line 8725). So **on every booted page `veDesignMdState.designmd` is
   truthy** — there is no such thing as a "no DESIGN.md loaded" booted page.

2. **The theme-attribute observer therefore always takes the full re-theme
   path.** `bindThemeAttributeObserver()` (runtime.js:11056) watches
   `<html data-ve-theme>` and, on a change, runs (lines 11061-11077):
   - 11065 `if (next !== 'light' && next !== 'dark') return;`
   - 11066 `if (next === veDesignMdState.theme) return;`  — same-value no-op
   - 11067 `if (!veDesignMdState.designmd) return;`  — **never taken post-boot
     (see #1)**
   - 11068 `veDesignMdApply(veDesignMdState.designmd, next);` — re-resolves +
     re-applies the entire `--vc-*` token map to `:root`
   - 11074 `dispatchThemeChange(next);` — fires `vc:themechange` /
     `ve:themechange` / `themechange` on `document`

3. **`dispatchThemeChange` fans out to every composed module at once.** On the
   LAN page that is: the diagram module's `vc:themechange` handler (re-renders
   the scene graph), each of the 25 donut chart instances (`initAllCharts`
   re-theme), the icon atoms, and the engine itself — all reacting to a single
   flip.

4. **The wedge.** The single-flip no-op guard (line 11066) catches a re-stamp
   to the *same* value, so one honest flip to a new value runs the path once.
   The observed main-thread wedge means the cascade in #3 **re-enters the
   theme path with a *different* value (or re-dispatches `themechange`
   re-entrantly)** so the work never settles — amplified ~51× by the number of
   composed atoms. The exact re-entry edge (which of graph / donut / engine
   re-mutates `data-ve-theme` or re-dispatches) is **? NOT YET ISOLATED** and
   is the core investigation this TRDD tracks.

## Why "boot per theme" is not an acceptable permanent answer

The plugin's two-mode contract (project `CLAUDE.md` §4) makes **Graphic Style
Mode realtime**: the user opens the 🎨 pod and swaps DESIGN.md / theme and
every element re-themes live, with no reload. A composed page that can only be
themed by reloading with `?theme=` violates that pillar precisely when it
matters most — rich, multi-element pages are exactly where live restyle is
most useful. The `?theme=` boot is correct for the *test harness* (a page is
usually opened in one theme), but the live-swap path must still work.

## Acceptance criteria

1. On the LAN composability fixture (`tests/fixtures/lan-composability/lan-network-map.html`),
   a live `data-ve-theme` flip (`document.documentElement.setAttribute('data-ve-theme','dark')`)
   completes in bounded time (single re-theme pass, no main-thread wedge), with
   the graph, all 25 donuts, all 25 icons, and the LAN chips all re-themed.
2. The flip is **idempotent and convergent**: flipping light→dark→light returns
   the page to its original computed styles; no unbounded growth of listeners,
   no repeated re-dispatch.
3. A re-entrancy guard makes the theme path safe regardless of how many atoms
   are composed (works for 1 atom and for 500).
4. `tests/scripts/test-composability-lan.js` is upgraded: drop the `?theme=`
   per-theme boot workaround in `testLightDarkThemes` and assert a **live flip**
   re-themes both ways within a timeout (the test currently documents the
   limitation; it should instead prove the fix).
5. Full suite stays green; `test-diagram.js` stays 33/33; no new leaked
   Chromium renderers.

## Investigation plan (do this before touching the runtime)

1. **Instrument, don't guess.** Add a temporary counter in
   `bindThemeAttributeObserver` and `dispatchThemeChange` logging
   `(value, veDesignMdState.theme, reentrancyDepth)` on a throwaway branch;
   open the LAN fixture; flip once; capture the sequence that proves the
   re-entry edge. (Per the GOLDEN RULE — read the whole flow, ask "what can
   go wrong at this step".)
2. Confirm whether the re-entry comes from (a) a module handler re-setting
   `data-ve-theme`, (b) `applyTokens` mutating an observed attribute, or
   (c) a `themechange` listener re-dispatching `themechange`.
3. Only then choose the fix.

## Candidate fixes (decide after investigation — do NOT pre-commit)

- **A — re-entrancy latch (most likely correct, smallest).** Wrap the
  observer body in a `veDesignMdState.__reTheming` guard so a re-entrant
  `data-ve-theme` mutation during an in-flight re-theme is ignored; clear the
  latch in a `finally`. Pair with `requestAnimationFrame`/microtask coalescing
  so N atom reactions to one flip collapse to one pass.
- **B — coalesce the fan-out.** Debounce `dispatchThemeChange` to one trailing
  fire per frame so 51 atoms re-theme once, not per-mutation.
- **C — make module handlers read-only w.r.t. the theme attribute.** Audit
  every `vc:themechange`/`themechange` listener (diagram, chart, icon,
  wireframe) to guarantee none re-stamps `data-ve-theme` or re-dispatches
  `themechange` — they should only re-read `--vc-*` and repaint.

Likely the real fix is **A + C** (latch the path *and* remove the re-entry
source), with B as a perf nicety.

## Affected / relevant files

- `scripts/amvcp-runtime.js` — `bindThemeAttributeObserver` (11056),
  `dispatchThemeChange` (11090), `veDesignMdApply` (8714),
  `bootDesignMdEngine` (8813). **DO-NOT-TOUCH without prior approval** (this
  file is on the protected list) — surface the proposed diff first.
- `scripts/amvcp-chart.js` / `scripts/amvcp-diagram.js` / icon module — their
  `themechange` listeners (candidate fix C).
- `tests/scripts/test-composability-lan.js` — upgrade `testLightDarkThemes`
  (acceptance #4).
- `tests/fixtures/lan-composability/lan-network-map.html` — the live repro.

## Notes

- The `amvcp-diagram.js` pristine-JSON fix shipped alongside the LAN build is
  **unrelated** to this loop — that one fixed a wiped-`<script>` re-render
  painting a bogus "no scene graph" error; it is correct and in scope for the
  LAN build. This TRDD is strictly the theme-swap cascade.
- Plan `warm-kindling-kitten.md` (R27-R38) records R29 "3-state selection
  always overrides DESIGN.md palette" and the realtime hot-swap (`veDesignMdHotSwap`,
  runtime.js:10974) as the live-restyle surface; this loop is the bug that
  blocks proving R29/realtime on composed pages.
