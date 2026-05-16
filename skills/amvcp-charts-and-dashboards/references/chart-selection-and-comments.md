# Selection, comments, decision-mini — the chart-point atom contract

Every data mark in every chart type is a `chart-point` atom — a
selectable, comment-bearing, decision-radio-bearing element that plugs
into the runtime's multi-select / comment-modal / 3-state-pill machinery
with ZERO new wiring. This file documents the atom contract end-to-end.

## Table of contents

- [What a chart-point atom is](#what-a-chart-point-atom-is)
- [The selection payload shape](#the-selection-payload-shape)
- [The DOM contract — `data-ve-*` attributes](#the-dom-contract--data-ve--attributes)
- [The pointer + keyboard wiring](#the-pointer--keyboard-wiring)
- [Selected-state styling](#selected-state-styling)
- [The per-figure group comment-handle](#the-per-figure-group-comment-handle)
- [The 3-radio Skip/Approve/Deny decision-mini pill](#the-3-radio-skipapprovedeny-decision-mini-pill)
- [The defensive standalone-mode fallback](#the-defensive-standalone-mode-fallback)
- [veWireChart — the legacy Chart.js bridge](#vewirechart--the-legacy-chartjs-bridge)

---

## What a chart-point atom is

The chart module marks every datum-bearing visual element (a `<rect>` for
a bar, a `<circle>` for a line point, a `<path>` for a donut arc, a `<polygon>`
for a funnel stage, a `<div>` for a KPI card, a `<li>` for a Canvas a11y
list item) with the same set of attributes and the same selection payload.

The atom satisfies four contracts at once:

1. **Selectable** — clickable, Space/Enter-actuated, joins
   `window.veSelection`.
2. **Commentable** — when one or more atoms in a figure are selected, a
   `.ve-comment-handle` bubble mounts on the figure; clicking it opens the
   multi-turn comment modal scoped to the selected atoms.
3. **Decidable** — a 3-radio `Skip/Approve/Deny` decision-mini pill
   attaches to every atom on mount (defensively — no error if the runtime
   helper is absent).
4. **Accessible** — `tabindex="0"`, `role="button"`, native SVG `<title>`
   tooltip, focus ring via `:focus-visible`.

## The selection payload shape

The payload is **identical** to what the legacy `veWireChart` API emits
for hand-built Chart.js charts:

```js
{
  id: "ve-chart-3-d0-i2",
  type: "chart-point",
  label: "Revenue · Mar",
  data: {
    chartId: "ve-chart-3",
    datasetIndex: 0,
    datasetLabel: "Revenue",
    index: 2,
    xLabel: "Mar",
    value: 45200
  }
}
```

Field reference:

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique per atom. Pattern: `ve-chart-<seq>-d<datasetIdx>-i<categoryIdx>`. |
| `type` | string literal `"chart-point"` | The runtime's selection router branches on `type`. |
| `label` | string | Human-readable atom label (used in tooltip headers, comment thread titles). |
| `data.chartId` | string | The host figure's id (`ve-chart-N`). |
| `data.datasetIndex` | number | Zero-based series index. |
| `data.datasetLabel` | string\|null | Series label or null (single-series). |
| `data.index` | number | Zero-based category index. |
| `data.xLabel` | string\|number\|null | Category label or null. |
| `data.value` | number | The raw datum value (no formatting). |

The payload is stored on the atom node as `node.__veChartPayload` for fast
re-emit (no rebuild on click).

## The DOM contract — `data-ve-*` attributes

Every atom node carries:

```html
<rect class="ve-chart-bar"
      x="…" y="…" width="…" height="…"
      rx="var(--vc-radius-sm, 4)"
      fill="…"
      data-ve-id="ve-chart-3-d0-i2"
      data-ve-type="chart-point"
      data-ve-label="Revenue · Mar"
      data-ve-value="45200"
      tabindex="0"
      role="button">
  <title>Revenue · Mar: 45200</title>
</rect>
```

The runtime stamps `data-ve-selected="1"` on the node when the atom is in
`veSelection`; this drives the selected-state styling (see below).

`markPoint(node, info)` is the central helper that stamps all of the
above. Every renderer calls it for every atom.

## The pointer + keyboard wiring

`_wireMarks(fig)` attaches the events ONCE per figure (delegated at the
figure level, not per atom — this keeps the listener count constant
regardless of mark count):

- `mouseover` on a mark → show the tooltip (the shared `_tip` singleton).
- `mousemove` over a mark → reposition the tooltip with the new
  `clientX, clientY`.
- `mouseout` of a mark → schedule the tooltip hide on a 150ms timer.
- `click` on a mark → toggle the tooltip LOCK + call `_toggleSelection`
  with the atom's payload.
- `keydown` Space/Enter on a focused mark → call `_toggleSelection` (same
  payload).

The 150ms hide timer is the standard "hover-bridge" pattern (see
`~/.claude/rules/browser-ui-test-techniques.md` §2): the tooltip survives
the pointer crossing from mark to tooltip, so the tooltip's contents are
clickable without flicker.

Canvas backend wires its own listeners on the `<canvas>` element + the
hidden `<ul>` (see `chart-canvas-backend.md`).

## Selected-state styling

When `data-ve-selected="1"` is on the atom, the CSS applies:

```css
.ve-chart-bar[data-ve-selected="1"],
.ve-chart-point[data-ve-selected="1"],
.ve-chart-cell[data-ve-selected="1"],
.ve-chart-arc[data-ve-selected="1"],
.ve-chart-wf-bar[data-ve-selected="1"],
.ve-chart-mekko-cell[data-ve-selected="1"],
.ve-chart-funnel-stage[data-ve-selected="1"] {
  filter: brightness(1.18);
  stroke: var(--vc-color-accent, #b8861f);
  stroke-width: 2;
}
```

Hover-on-selected combines the boost AND the hover sheen:

```css
.ve-chart-bar[data-ve-selected="1"]:hover { /* … */
  filter: brightness(1.22)
          drop-shadow(0 0 4px var(--vc-color-accent, #b8861f));
}
```

The figure gets an OUTER RING when ANY atom inside is selected (same
affordance the runtime gives to table rows / list items / sections):

```css
.ve-chart:has([data-ve-selected="1"]) {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 4px;
  border-radius: var(--vc-radius-sm, 4px);
}
```

## The per-figure group comment-handle

Charts are NOT in the runtime's default container list (which mounts
comment handles only on tables, lists, sections). The chart module mounts
its OWN observer that injects ONE `.ve-comment-handle` on the figure
whenever ≥ 1 atom inside has `data-ve-selected="1"`:

```js
function _wireGroupHandle(fig) {
  if (fig.__veGroupHandleWired) { return; }
  fig.__veGroupHandleWired = true;
  _updateGroupHandle(fig);
  var mo = new MutationObserver(function () {
    _updateGroupHandle(fig);
  });
  mo.observe(fig, {
    subtree: true, attributes: true,
    attributeFilter: ['data-ve-selected']
  });
  fig.__veGroupHandleObserver = mo;
}
```

`_updateGroupHandle(fig)`:

- Queries `fig.querySelectorAll('[data-ve-selected="1"]')`.
- If 0 selected, removes any existing `.ve-comment-handle`.
- Otherwise, mounts (or repositions) ONE handle at the left edge of the
  figure, vertically aligned with the first selected mark.
- Stamps `data-ve-comment-id` = `chart:<figId>:<sortedAtomIds>` so the
  comment modal scopes to exactly those atoms.
- On click, delegates to `window.__veOpenCommentModal(handle)` (the
  runtime hook) so the existing multi-turn modal is reused — no parallel
  comment UI.

The handle CSS:

```css
.ve-chart > .ve-comment-handle {
  position: absolute; left: -40px;
  width: 28px; height: 22px;
  background: var(--vc-color-accent, #b8861f);
  color: var(--vc-color-on-accent, #ffffff);
  border-radius: 6px;
  /* …speech-bubble glyph 💬 inside, click → opens modal… */
}
```

## The 3-radio Skip/Approve/Deny decision-mini pill

Every atom is attached to a 3-state decision pill via the runtime helper
`amvcpRuntime.attachDecisionMini(atomEl, atomId)`. The chart module
calls it inside `markPoint(node, info)`:

```js
function _attachDecisionMini(atomEl, atomId) {
  if (!atomEl || atomEl.__veDecisionMiniAttached) { return; }
  var rt = window.amvcpRuntime;
  if (!rt || typeof rt.attachDecisionMini !== 'function') { return; }
  try {
    rt.attachDecisionMini(atomEl, atomId);
    atomEl.__veDecisionMiniAttached = true;
  } catch (_) { /* helper failed — chart stays usable, no pill */ }
}
```

The attachment is IDEMPOTENT (the `__veDecisionMiniAttached` flag prevents
double-attach when a chart re-renders) and DEFENSIVE (no error if
`amvcpRuntime` is absent — the chart still works without the pill).

The pill itself is owned by the runtime (`amvcp-runtime.js`); the chart
just registers each atom for pill attachment.

## The defensive standalone-mode fallback

When the chart module runs WITHOUT the runtime (test fixture, offline
preview, standalone HTML), `window.toggleElementSelection` doesn't exist.
The chart module keeps its OWN internal selection list:

```js
var _selection = [];
function getSelection() { return _selection.slice(); }
function _toggleSelection(payload) {
  if (typeof window.toggleElementSelection === 'function') {
    try { window.toggleElementSelection(payload); return; } catch (e) { }
  }
  // Internal fallback — toggle by id.
  for (var i = 0; i < _selection.length; i++) {
    if (_selection[i].id === payload.id) {
      _selection.splice(i, 1); return;
    }
  }
  _selection.push(payload);
}
```

The internal list is observable from JS:

```js
window.amvcpChart.getSelection();
//=> [{id, type, label, data}, …]
```

In standalone mode, `data-ve-selected="1"` is NOT auto-stamped (the
runtime usually does that as it adds to `veSelection`). The chart's
tooltip-lock + click toggle still work; the outer ring and group
comment-handle do not appear (they depend on the `data-ve-selected`
attribute the runtime stamps).

This means: the same chart works for end-to-end smoke tests without
booting the full runtime, AND works fully when the runtime is present.

## `veWireChart` — the legacy Chart.js bridge

The chart skill's fenced protocol is the canonical authoring path. For
LEGACY pages that already use hand-built Chart.js charts, the runtime
exposes `veWireChart(chart, { id })` as a bridge:

```js
var chart = new Chart(canvas, {
  type: 'line',
  data: { labels: […], datasets: [{ label: 'Revenue', data: [...] }] }
});
veWireChart(chart, { id: 'revenue' });
```

`veWireChart` chains an `onClick` handler onto the Chart.js instance that
emits the EXACT same `{type:"chart-point", data:{chartId, datasetIndex,
datasetLabel, index, xLabel, value}}` payload as a native chart-point atom.
This way the page's multi-select / comment / decision-pill machinery works
identically whether the chart is native (fenced) or legacy (Chart.js).

`veWireChart` is documented in
`/Users/emanuelesabetta/Code/visual-comunicator/skills/amvcp-charts-and-dashboards/references/chartjs-integration.md` (the older
reference file). NEW work should use the fenced protocol; `veWireChart`
stays available for compatibility.

## See also

- [chart-fence-protocol.md](./chart-fence-protocol.md) — the authoring spine that produces atoms.
- [chart-canvas-backend.md](./chart-canvas-backend.md) — Canvas-side atom handling.
- [chartjs-integration.md](./chartjs-integration.md) — the legacy `veWireChart` bridge.
- The runtime's `amvcpRuntime.attachDecisionMini` and the multi-turn comment modal — owned by `scripts/amvcp-runtime.js`.
