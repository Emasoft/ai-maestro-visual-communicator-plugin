# Design guardrails — enforced by default

This skill ships a set of design rules that are NOT opt-in. They're
enforced by the renderer; spec authors cannot disable them. The rules
codify Hyperframes / Tufte chart philosophy (CH-15 in the mining catalog)
and are responsible for the bulk of the chart skill's "looks professional"
behavior.

## Table of contents

- [Guardrail 1 — No pie charts](#guardrail-1--no-pie-charts)
- [Guardrail 2 — Sparse horizontal gridlines only (≤ 4)](#guardrail-2--sparse-horizontal-gridlines-only--4)
- [Guardrail 3 — No vertical gridlines, ever](#guardrail-3--no-vertical-gridlines-ever)
- [Guardrail 4 — No D3, no Plotly, no Chart.js](#guardrail-4--no-d3-no-plotly-no-chartjs)
- [Guardrail 5 — Every chart needs an insight title](#guardrail-5--every-chart-needs-an-insight-title)
- [Guardrail 6 — No inner scrollbars](#guardrail-6--no-inner-scrollbars)
- [Guardrail 7 — Fail-fast, fail-visible](#guardrail-7--fail-fast-fail-visible)
- [Guardrail 8 — Theme-driven colors, no hardcoded literals](#guardrail-8--theme-driven-colors-no-hardcoded-literals)
- [Guardrail 9 — Motion respects `prefers-reduced-motion`](#guardrail-9--motion-respects-prefers-reduced-motion)

---

## Guardrail 1 — No pie charts

**Rule:** `chart:pie@1` is automatically remapped to `chart:bar@1` with
`options.sortDescending: true`.

**Why:** Angle perception is poor; bars are perceptually superior for
parts-of-a-whole. See `chart-pie-guardrail.md` for the full rationale.

**Override:** None. Use `donut` for circular geometry, `segmented-bar` for
inline part-to-whole.

## Guardrail 2 — Sparse horizontal gridlines only (≤ 4)

**Rule:** The renderer caps horizontal gridlines at `MAX_GRIDLINES = 4`.
Even if `niceTicks(min, max, count)` produces 5+ "nice" tick values, the
`_capTicks(ticks)` helper sub-samples down to ≤ 4 while keeping the first
and last.

```js
var MAX_GRIDLINES = 4;
function _capTicks(ticks) {
  if (ticks.length <= MAX_GRIDLINES) { return ticks; }
  var out = [ticks[0]];
  var interior = ticks.length - 2;
  var keepInterior = MAX_GRIDLINES - 2;
  var stride = interior / (keepInterior + 1);
  for (var k = 1; k <= keepInterior; k++) {
    out.push(ticks[Math.round(k * stride)]);
  }
  out.push(ticks[ticks.length - 1]);
  return out;
}
```

**Why:** Gridline density past 4-5 horizontal rules creates "graph paper"
noise that competes with the data for attention. Sparse rules at meaningful
intervals are enough.

**Override:** None directly. Authors can set `niceTicks(min, max, count)`
to a higher count — `_capTicks` will still cap it at 4. To get more
visual granularity, scale the chart taller or use a `metric-cards` tile
to show the exact peak value instead of relying on gridlines.

## Guardrail 3 — No vertical gridlines, ever

**Rule:** The renderer NEVER draws vertical gridlines. Only horizontal
rules at niceTicks values. Category labels under the x-axis serve as the
visual reference for x position.

**Why:** Vertical gridlines compete with the bars/lines for attention and
double the gridline noise. Category labels are already there.

**Override:** None.

## Guardrail 4 — No D3, no Plotly, no Chart.js

**Rule:** Zero external dependencies. The renderer is pure SVG / CSS /
Canvas, ES5-style JavaScript, no build step, no CDN, no `<script
src="https://…">`. The plugin's "self-contained offline HTML" promise
holds for every chart.

**Why:** A report shouldn't depend on the network to render. CDN
dependencies create offline failure modes, slow first-paint, and dilute
the report's portability (a 2-MB Plotly bundle for a 4-bar chart is
disproportionate).

**Override:** None within this skill. If a use case genuinely requires
D3 / Plotly (advanced interactivity, WebGL acceleration), use a different
plugin and accept the dependency.

## Guardrail 5 — Every chart needs an insight title

**Rule:** The `title` field is REQUIRED on every chart spec. A spec
missing `title` (or with `title: ""`) is rejected with a visible error
block. The validation gate in `_validateEnvelope`:

```js
if (typeof spec.title !== 'string' || !spec.title.replace(/\s/g, '')) {
  return "chart spec missing required 'title'";
}
```

**Why:** A chart without a title forces the reader to infer the
insight from the bars/lines alone — they may infer wrong, miss the point,
or simply skip the chart. The title should state the INSIGHT ("Q4 was the
strongest in 3 years"), not just label the data ("Revenue chart").

**Override:** None. Even a one-word title beats no title; if you can't
state an insight, ask yourself why the chart is in the document at all.

## Guardrail 6 — No inner scrollbars

**Rule:** The chart `<figure>`, the `<svg>`, the `<canvas>`, the
`.ve-chart-segmented` (CSS segmented bar) — every chart container is
`overflow: visible; max-width: none;`. A wide chart EXTENDS the page; it
never creates an inner horizontal scrollbar.

**Why:** Cross-cutting CLAUDE.md rule
(`~/.claude/rules/no-nested-scrollbars.md`). Two scrollbars in one page
(the document's + the inner box's) is a usability disaster — scroll
inertia gets stolen, find-in-page misses content, screenshots are partial.

**Override:** None. To shrink an oversized chart, use a smaller viewBox
or aggregate the data.

## Guardrail 7 — Fail-fast, fail-visible

**Rule:** A malformed spec — bad JSON, unknown type, version too new,
missing required `title`/`series` — degrades the `<pre>` to a VISIBLE
error block: a danger-tinted banner with the exact failure reason, plus
the original JSON kept verbatim. Never a silent blank box, never an
invented default dataset.

```js
function _degrade(pre, originalText, reason) {
  var wrap = el('div', { className: 've-chart-error' });
  wrap.appendChild(el('div', { className: 've-chart-error-banner' },
    'Chart error: ' + reason));
  var code = el('pre', { className: 've-chart-error-src' });
  code.appendChild(document.createTextNode(originalText || ''));
  wrap.appendChild(code);
  pre.parentNode.replaceChild(wrap, pre);
}
```

**Why:** A blank box is the worst failure mode — the reader sees nothing
and assumes the agent broke something. A visible error block with the
exact reason lets the author fix the spec in place.

**Override:** None.

## Guardrail 8 — Theme-driven colors, no hardcoded literals

**Rule:** Every fill / stroke / gap / radius / font / duration is read via
`var(--vc-…, <fallback>)`. There are NO hardcoded color literals in the
renderer's output — only the canonical fallbacks baked into each `var()`
call.

This means:
- A tokenless page still renders correctly (fallback values apply).
- A page with DESIGN.md tokens overrides the fallbacks.
- A theme hot-swap restyles every chart with NO re-render (CSS custom
  properties cascade).
- A printable / accessible variant can be authored by swapping the
  token VALUES, not the chart code.

**Why:** Hardcoded literals create silent failures across themes,
accessibility variants, and brand swaps. Token-driven colors are the only
way to keep the chart correct without per-theme branching code.

**Override:** No spec field exists to override token resolution. Edit
DESIGN.md.

## Guardrail 9 — Motion respects `prefers-reduced-motion`

**Rule:** Every entry animation — bar growUp, line stroke-dashoffset
draw-on, donut arc sweep, radar polygon inflate — gates on the OS's
`prefers-reduced-motion: reduce` preference. When set, animations skip to
their final frame immediately.

```js
var REDUCED = false;
if (typeof window !== 'undefined' && window.matchMedia) {
  _mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  REDUCED = !!_mql.matches;
}
// Then in each renderer:
animateOnView(host, function () {
  if (REDUCED) { /* skip to final */ return; }
  /* otherwise animate */
});
```

The preference is also re-read on OS toggle (the `change` event on the
media query) so a user who toggles mid-session gets the right behavior.

**Why:** Animation can trigger vestibular distress in some users; the OS
preference is the canonical signal. Hardcoding "always animate" violates
WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions).

**Override:** None. Test pages can force-disable via the test hook:
`window.__veChart.REDUCED = true;` — but production pages must honor the
OS preference.

## See also

- [chart-pie-guardrail.md](./chart-pie-guardrail.md) — the pie remap in detail.
- [chart-palette-engine.md](./chart-palette-engine.md) — the no-per-datum-colors policy.
- [chart-animations-and-motion.md](./chart-animations-and-motion.md) — the entry-animation system.
- [chart-design-tokens.md](./chart-design-tokens.md) — the full token reference.
- [chart-canvas-backend.md](./chart-canvas-backend.md) — the auto-switch threshold.
- The cross-cutting `~/.claude/rules/no-nested-scrollbars.md` for guardrail 6.
