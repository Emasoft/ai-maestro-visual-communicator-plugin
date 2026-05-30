---
trdd-id: ed5e8cc2-74af-4aea-af0b-bf464f8cbe7f
title: Composed-page live data-ve-theme flip wedges main thread — Chart.js responsive ResizeObserver loop on the 25 canvas donuts
status: completed
created: 2026-05-25T21:58:18+0200
updated: 2026-05-30T08:47:35+0200
---

# TRDD-ed5e8cc2 — Composed-page live `data-ve-theme` flip wedges main thread via DESIGN.md re-theme cascade

**Filename:** `design/tasks/TRDD-20260525_215818+0200-ed5e8cc2-composed-page-retheme-loop.md`
**Tracked in:** this repo (design/tasks/ is git-tracked)

## ✓✓✓ RESOLVED 2026-05-30 — F1 (responsive:false + re-mount) + composition min-width

The fix is implemented and verified FLAWLESS across 8 configs (phone / tablet /
desktop / TV-FullHD, each landscape + portrait), both themes, head-less.

**Runtime fix — `scripts/amvcp-runtime.js` (Chart.js mount):**
- `_veChartApplyThemeDefaults`: `responsive: false` (Chart.js no longer attaches
  its responsive ResizeObserver — the loop cannot exist; census now shows
  **0** ROs constructed, was 25).
- `_veChartSizeCanvasToHost` (new): sizes the canvas pixel buffer to the host's
  laid-out box, devicePixelRatio-aware, at every (re-)mount — required since
  responsive:false disables Chart.js auto-fit.
- `_veChartMountOne`: calls the sizer; dedups the `_veChartInstances` push
  (`indexOf` guard) — fixes a latent infinite re-mount (the rebuild loops
  re-read `.length` while pushing).
- `_bindChartWindowResize` (new, wired in `bootEverything`): debounced window
  `resize` → `initAllCharts()` re-mount, restoring window responsiveness lost
  to responsive:false. No RO, so no feedback loop.

**Composition fix — `tests/fixtures/lan-composability/lan-network-map.html`:**
- `#lan-stage { min-width: 820px }`. The 1930px-natural map previously scaled
  to fit any width via `width:100%`, and below ~0.4× (phone-portrait) the SVG
  glyphs and `<foreignObject>` donuts collided (overlap) while donuts collapsed
  to ~3×8px. The floor keeps the map in the flawless scale band; below it the
  DOCUMENT scrolls horizontally (`overflow-x:auto`) — the
  no-nested-scrollbars-compliant way to present non-wrappable wide content.

**Follow-ups landed 2026-05-30:**
- Acceptance #4 — added a PERMANENT regression test
  `tests/scripts/test-composability-responsive.js` (20/20 green): per viewport
  (TV / desktop / tablet / mobile-portrait / split-screen) it asserts the live
  flip stays responsive (wedge guard), the donut stays legible (squish guard),
  the graph node re-themes (acceptance #1), and `--vc-color-canvas` re-resolves
  (engine guard). The 12-config screenshot verifier is archived in
  `tests_dev/ed5e8cc2-themeflip-diagnosis/`.
- Secondary "diagram doesn't re-theme" item — **was NOT a real bug.** diagram.js
  paints zero inline colours; the graph is coloured by --vc-* CSS classes and
  re-themes via the cascade with no JS (the `graph_rethemes` assertion PASSES at
  every config). Adding a diagram themechange listener / rescan call (as the old
  note suggested) would have needlessly re-rendered the whole scene every flip —
  a regression. Fixed the two STALE COMMENTS in `amvcp-runtime.js`
  (`bootVisualizeModules` + `bootThemeRescanListener`) that wrongly claimed the
  diagram self-binds a listener; corrected to state it re-themes via CSS.
- Regression: full suite 379/382 (the 3 failures are pre-existing
  `test-decision-pills` flakes — fail 4/9 in isolation, unrelated comment-modal
  queue subsystem; this fix's diff touches zero decision/modal/queue code).

**Verification (8 configs × light+dark, screenshots examined by eye):**
tv-landscape 1920×1080 ✓, tv-portrait 1080×1920 ✓, desktop 1440×900 / 900×1440 ✓,
tablet 1112×834 / 834×1112 ✓, mobile 844×390 ✓, mobile 390×844 ✓ (was the
broken one — now clean, full-size donuts, page scrolls). Live `data-ve-theme`
flip stays responsive at every config (no wedge); `donut_sized` PASS at every
config; resize-refit PASS.

**Fix attempts ledger:** epsilon RO guard → FAIL (wrong RO; enableGraphZoom is
dead code here). rAF+cap RO guard → FAIL (same). S2 suspend-RO-on-themechange →
FAIL (same wrong RO). F2 resizeDelay → FAIL (right charts, but only slows the
loop). **F1 responsive:false + re-mount → PASS.** The decisive insight was the
census construction-stack showing the RO came from Chart.js's
`bindResponsiveEvents`, created by the runtime's `_veChartMountOne`, NOT the
`enableGraphZoom` RO every earlier attempt targeted.

---

## ✓✓ DEFINITIVE root cause 2026-05-29 (Chart.js responsive ResizeObserver) — SUPERSEDES ALL analysis below

Captured the **construction stack** of every `ResizeObserver` on the LAN
fixture (census wrapper injected before boot). Result: **25 ResizeObservers,
one per `figure.ve-chart`, created by Chart.js 4.4.7** (`chart.umd.min.js` from
cdn.jsdelivr.net):

```
new ResizeObserver
  ys                            chart.umd.min.js (Chart.js 4.4.7)
  ws.addEventListener
  An.bindResponsiveEvents       ← Chart.js's built-in responsive ResizeObserver
  An.bindEvents
```

The 25 "donuts" are **Chart.js canvas charts** (not amvcp SVG donuts as the
LAN build-spec prose implies), mounted by the runtime's `_veChartMountOne`
(`initAllCharts` finds the composer-created `[data-ve-chart-type]` hosts).
Chart.js's `responsive` defaults to **true**, so it attaches a ResizeObserver
per chart; the census shows those callbacks firing **775× even at boot**. On a
live theme flip the `--vc-*` change relayouts the chart containers — which are
nested in `<foreignObject>` where height resolution is circular — so the 25
Chart.js ROs enter the well-known **Chart.js responsive-resize infinite loop**,
×25 in parallel → the renderer's layout/raster threads peg at **~700 % CPU
(multi-core)** and the main thread is starved (wedge).

**This means BOTH earlier analyses in this file are wrong about the SOURCE:**
- The original "re-theme cascade / `data-ve-theme` re-entry" hypothesis: refuted.
- The first correction ("`enableGraphZoom` `refreshViewportHeight` RO"): also
  wrong — `enableGraphZoom` only runs for runtime Graphviz graphs (`.ve-graph`),
  but the LAN graph is the **diagram module** (`.ve-scene-graph`), so
  `enableGraphZoom` is **dead code on this fixture**. That is why the targeted
  guard + S2 (suspend that RO) had ZERO effect — they patched an observer that
  never runs here. (The runtime change was reverted; the `refreshViewportHeight`
  RO is still a latent feedback-shaped bug for Graphviz-graph pages, trackable
  separately.)

The diagnosis is now consistent with EVERY datum: A/B no-op-`ResizeObserver`
fixes it (Chart.js can't observe); bisection needs both chart + icon re-render
(both perturb the foreignObject layout the Chart.js ROs watch); multi-core CPU
(25 canvas re-renders + layout); rAF-break is no help (Chart.js uses a RO, not
rAF). `ResizeObserver` never appears in our source because it lives in the
minified Chart.js bundle — which is why six earlier rounds missed it.

### ✓ The fix is in the runtime's Chart.js mount (protected file — get approval)

Chart.js's own docs cite **`resizeDelay`** as the mitigation for resize-observer
loops. Candidates (in `_veChartMountOne` / `_veChartApplyThemeDefaults`):

- **F1 — `responsive: false`** for runtime-mounted charts. Bulletproof (matches
  the A/B that no-ops the RO): Chart.js attaches no ResizeObserver, so the loop
  cannot exist. The runtime already re-mounts charts on `themechange` itself, so
  it does not depend on Chart.js's responsive auto-resize. Cost: loses Chart.js
  auto-resize on window resize (would need a runtime `window` resize re-mount,
  if desired). Likely the right call.
- **F2 — `resizeDelay: <ms>`** (debounce the RO). Keeps responsiveness; Chart.js
  docs say it prevents RO loops. May only *slow* a truly non-converging loop
  rather than stop it — needs verification on this fixture.
- **F3 — definite container height** (not `minHeight`) + explicit canvas px size
  so the foreignObject sizing is not circular. Addresses the composition side.

Recommended: **F1** (most robust, matches the proven A/B), optionally + F2.
NOTE: also confirm whether this is exercised outside the test fixture — any
agent-composed page that nests Chart.js canvas charts in SVG/foreignObject hits
the same loop, so the runtime fix protects real output, not just the test.

### Creation site CONFIRMED + F2 verified INSUFFICIENT (2026-05-29)

Full 16-frame construction stack pins the creator unambiguously:

```
new An (Chart.js 4.4.7)
_veChartMountOne   amvcp-runtime.js:10215   ← new Chart(canvas, config)
```

So the 25 Chart.js charts go through the runtime's `_veChartMountOne` →
`_veChartApplyThemeDefaults` (the donut `<pre>` fences are compiled by
amvcp-chart.js's scan into `figure.ve-chart[data-ve-chart-backend="canvas"]`
hosts with `data-ve-chart-type`, which `initAllCharts` then mounts). The fix
belongs in `_veChartApplyThemeDefaults`.

**F2 (`resizeDelay: 200`) was applied there and verified head-less — it
FAILED.** The synced runtime contained the setting (confirmed), yet the live
flip still wedged the page (unresponsive; zero samples captured). Mechanism:
`resizeDelay` only debounces Chart.js's *response*; Chart.js still resizes the
canvas (just spaced out), which keeps re-perturbing the `foreignObject` layout,
so the loop persists (merely slowed) — exactly the risk flagged when F2 was
chosen. The setting was reverted; the runtime is pristine.

**⇒ F1 (`responsive: false`) is required** (matches the A/B: no RO ⇒ no loop).
Caveat discovered: `responsive:false` disables Chart.js auto-fit, so the mount
must set explicit canvas pixel dimensions from the container (devicePixelRatio-
aware) at mount time, and — to keep window-resize responsiveness — add a
debounced `window` `resize` listener that re-mounts the charts (the runtime
already has destroy+rebuild in `_veChartMountOne`; `_bindChartThemeRescan`'s
`rebuild` is the re-mount primitive to reuse). That is the "F1 + window-resize
re-mount" variant. Plain F1 (no re-mount) is simpler but drops window auto-resize
(acceptable for composed/fixed-size scenes, lossy for standalone charts).

Status: F2 attempted + reverted (1/1 for F2); creation site confirmed; awaiting
a decision between plain-F1 and F1+re-mount before the next runtime change.

---

> Everything below (Summary, How it surfaced, both prior "root cause" blocks,
> candidate fixes, fix-attempt log) predates the census and is **superseded**
> by the Chart.js finding above. Kept for the audit trail.

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

## ✓ VERIFIED root cause — CORRECTION 2026-05-29 (supersedes the hypothesis below)

The original hypothesis in this TRDD (a re-entrant `data-ve-theme` re-theme
**cascade** — the observer re-applying tokens + re-dispatching `themechange`
in an unbounded loop "amplified ~51× by composed atoms") is **REFUTED** by
both static reading and empirical reproduction. The real cause is a
**ResizeObserver layout-feedback loop**, unrelated to the theme/event path.

**Root cause (✓ VERIFIED):** `enableGraphZoom()` (`scripts/amvcp-runtime.js`
~4439) wraps the graph `svgEl` in a `viewport` div (`overflow:hidden;
width:100%`), sets `svgEl.style.width:100%`, then installs:

```js
function refreshViewportHeight() {
  var h = svgEl.getBoundingClientRect().height;   // MEASURE
  if (h > 0) viewport.style.height = h + 'px';     // WRITE a layout property
}
new ResizeObserver(refreshViewportHeight).observe(svgEl);
```

This is a textbook RO feedback loop: the callback **writes a layout property
derived from the observed element's measured size**. When a live
`data-ve-theme` flip re-renders composed content **inside** the observed
region (donut charts via `amvcpChart.scan` + icon scenes via
`amvcpIconSvg.refresh`, both fired by `dispatchThemeChange → rescan`), the
measured height oscillates sub-pixel and the RO never converges. The browser
runs this in its **parallel layout/style/raster pipeline**, so it pegs the
renderer at **multi-core ~700% CPU** and starves the main thread (no macrotask
runs) → the observed "wedge". Boot is fine because `enableGraphZoom`'s RO is
installed after the initial render and the height is stable until a live
re-render perturbs it.

**Why "boot per theme" works:** booting in-theme never re-renders content
inside the observed region post-RO-install, so the height never oscillates.

**Evidence chain (all reproduced head-less on the LAN fixture; harness is
archived at `tests_dev/ed5e8cc2-themeflip-diagnosis/`):**

1. A live flip wedges (in-page `setTimeout` macrotask never fires in 6–9 s),
   both light→dark and dark→light.
2. The renderer pegs **~125–700 % CPU (multi-core)** during the wedge → a
   browser layout/style thrash, **not** single-threaded JS (which caps at
   100 %), **not** rAF (breaking rAF at 800 calls did not help).
3. **Ruled out** with runtime-injected breakers: `data-ve-theme` re-stamp
   loop, `themechange` re-dispatch loop, `scan`/`refresh` re-invocation, rAF
   storm — none broke the wedge.
4. **Bisection:** the wedge needs **both** `chart.scan` AND `icon.refresh` to
   run once (each alone returns in 0 ms with no wedge); they re-render content
   inside the observed `svgEl`, seeding the oscillation.
5. **A/B (decisive):** an identical fixture that no-ops `window.ResizeObserver`
   *before boot* does **not** wedge (flip completes in ~700 ms); the
   unmodified fixture wedges. ⇒ the loop IS a ResizeObserver loop.

**Static facts that refute the old hypothesis:** `amvcpDesignMd.applyTokens`
only does `el.style.setProperty('--vc-*', …)` — it touches **no** observed
attribute; the theme observer's `attributeFilter` is `['data-ve-theme']`
(style mutations don't re-trigger it); **no** `themechange` listener
re-stamps `data-ve-theme` or re-dispatches `themechange`. So the observer
fires **exactly once** per distinct value — there is no attribute/event loop.

### Corrected fix direction (touches the protected runtime — surface diff, get approval)

- **Primary (root cause):** add an anti-feedback guard to
  `refreshViewportHeight` — cache the last-applied height and only write
  `viewport.style.height` when it changes beyond a small epsilon (e.g.
  > 0.5 px); optionally coalesce the write via `requestAnimationFrame` with a
  "pending" flag. Tiny, local, breaks the RO loop at its source. Apply the
  same guard to the table-handles RO (`~6374`) for parity.
- **Secondary (separate, also blocks acceptance #1):** `amvcp-diagram.js` has
  **no** `themechange` listener and `rescan` (runtime ~11933) explicitly
  EXCLUDES diagram, yet the runtime comment (~11921-11924) claims diagram
  "installs its own listener". So the **graph never re-themes on a live flip**.
  Fix the comment + make the graph re-theme (add a diagram theme listener OR
  include diagram in `rescan`).
- The original candidate fixes A/B/C (re-entrancy latch / debounce
  `dispatchThemeChange` / make handlers read-only w.r.t. the theme attribute)
  targeted the **wrong** subsystem and are **not** the fix, though a debounce
  of the re-render fan-out remains a reasonable perf nicety / defense-in-depth.

### Fix attempts 2026-05-29 — targeted callback guards FAILED (the loop is below the JS layer)

Two attempts at guarding the `refreshViewportHeight` **callback** both left the
flip wedged (verified head-less on the LAN fixture); the diff is saved at
`tests_dev/ed5e8cc2-themeflip-diagnosis/refreshViewportHeight-guard-INSUFFICIENT.patch`
and the runtime was reverted to pristine:

1. **Epsilon guard** (write only when height changed > 0.5 px) → still wedged.
   The oscillation delta is > 0.5 px (not sub-pixel rounding).
2. **rAF-coalesce + hard per-burst write cap (8)** → still wedged.

Why they fail (✓ VERIFIED): an RO-counting probe injected before boot found the
page **stays unresponsive — even a trivial `window.__roCount` read times out for
14 s**, and the rAF-coalesced callback is deferred forever on the saturated
thread. So the runaway is the **browser's own layout / ResizeObserver-delivery
cycle over the composed `foreignObject` content** (the graph nests donut + icon
foreignObjects whose reflow does not converge while `svgEl` is observed), NOT
the JS callback's write. Guarding/capping the callback can't help because the
callback barely runs — yet removing the RO entirely (the A/B test) DOES fix it.

**⇒ The correct fix is STRUCTURAL, not a callback guard.** Candidate directions
(each needs its own design + head-less verification; bigger than the originally
proposed one-line guard):

- **S1 — stop observing `svgEl` for the viewport fit.** Size the viewport from
  the SVG's intrinsic `viewBox` aspect once + a `window` `resize` listener; drop
  the element ResizeObserver that feeds back through the composed content.
- **S2 — suspend the graph-zoom RO during a re-theme.** `disconnect()` it before
  the re-render fan-out and re-`observe()` one frame later (mirrors the A/B that
  proved "no RO during re-theme ⇒ no wedge"), but only re-fit if the *intrinsic*
  size changed.
- **S3 — break the foreignObject reflow non-convergence** (give the nested
  donut/icon foreignObjects fixed/intrinsic dimensions so the graph's measured
  height is stable). Most invasive; touches the composition contract.

Status: diagnosis COMPLETE and verified; targeted fix attempts exhausted (2/2);
awaiting a decision on the structural fix direction (S1/S2/S3) before the next
runtime change.

---

> The sections below are the ORIGINAL 2026-05-25 analysis, **kept for audit
> trail but REFUTED** by the correction above. Do not act on them.

## How it surfaced

Building the permanent LAN composability test (3 skills on one page — graph +
icon-svg + chart, per the user's 2026-05-25 request to prove arbitrary
element combinations work). The dual-theme assertion could not flip the theme
live without hanging; booting per-theme via `?theme=` was substituted and the
limitation documented inline in `testLightDarkThemes`. Reported in
`reports/html-effectiveness/20260525_210726+0200-build-lan-composability.md`
(§"Known limitation").

## Root cause (REFUTED 2026-05-29 — the code reading was right, the loop conclusion was wrong; see correction above)

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
