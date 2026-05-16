# Error degradation — fail-fast, fail-visible

When a chart spec is malformed, the runtime does NOT silently default,
fabricate data, or hide the failure. It REPLACES the `<pre>` with a
visible error block: a danger-tinted banner stating the exact failure
reason, plus the original JSON kept verbatim in a code block. The
author fixes the spec in place and re-runs.

This file documents every failure mode + what the error block looks like.

## Table of contents

- [The degrade function](#the-degrade-function)
- [Failure modes](#failure-modes)
  - [1. Malformed JSON](#1-malformed-json)
  - [2. Missing `title`](#2-missing-title)
  - [3. Missing `series` / empty `series`](#3-missing-series--empty-series)
  - [4. Bad `series[i].data` shape](#4-bad-seriesidata-shape)
  - [5. Unknown chart type](#5-unknown-chart-type)
  - [6. Version too new](#6-version-too-new)
  - [7. Renderer throws](#7-renderer-throws)
- [What the error block looks like](#what-the-error-block-looks-like)
- [Accessing the error reason programmatically](#accessing-the-error-reason-programmatically)

---

## The degrade function

```js
function _degrade(pre, originalText, reason) {
  var wrap = el('div', { className: 've-chart-error' });
  wrap.appendChild(el('div', { className: 've-chart-error-banner' },
    'Chart error: ' + reason));
  var code = el('pre', { className: 've-chart-error-src' });
  code.appendChild(document.createTextNode(originalText || ''));
  wrap.appendChild(code);
  if (pre && pre.parentNode) {
    pre.parentNode.replaceChild(wrap, pre);
  }
  return wrap;
}
```

Two child elements:
1. `.ve-chart-error-banner` — a danger-tinted strip with the reason.
2. `.ve-chart-error-src` — a preformatted block with the original JSON
   text verbatim (no edits, no escaping).

The wrapper `<div class="ve-chart-error">` has `overflow: visible` and a
danger-colored border so the failure is unmissable in the rendered page.

## Failure modes

### 1. Malformed JSON

```
chart:bar@1
{
  "title": "Broken",
  "series": [{ "label": "x", "data": [{"x":"A","y":1},] }
}
```

Trailing comma + missing closing `}`. The `JSON.parse` throws; the
runtime catches and degrades:

```
Chart error: invalid JSON — Unexpected token } in JSON at position 47
```

Common causes:
- Trailing comma (`[1,2,3,]` — JSON forbids this; YAML allows it).
- Single quotes (`'A'` — JSON requires double quotes).
- Unquoted keys (`{x:1}` — JSON requires `{"x":1}`).
- Mismatched braces.

### 2. Missing `title`

```chart:bar@1
{ "series": [{ "label": "x", "data": [{"x":"A","y":1}] }] }
```

```
Chart error: chart spec missing required 'title'
```

The validation gate in `_validateEnvelope`:

```js
if (typeof spec.title !== 'string' || !spec.title.replace(/\s/g, '')) {
  return "chart spec missing required 'title'";
}
```

Whitespace-only titles fail too (`"title": "   "` is treated as empty).

### 3. Missing `series` / empty `series`

```chart:bar@1
{ "title": "X" }
```

```
Chart error: chart spec missing required 'series'
```

Or:

```chart:bar@1
{ "title": "X", "series": [] }
```

(Same error — empty array fails the `series.length === 0` check.)

### 4. Bad `series[i].data` shape

```chart:bar@1
{ "title": "X", "series": [{ "label": "x" }] }
```

```
Chart error: series[0] has no 'data' array
```

The `data` field is missing entirely. Similarly:

```chart:bar@1
{ "title": "X", "series": [{ "label": "x", "data": [null, {"x":"B","y":2}] }] }
```

```
Chart error: series[0].data[0] is not an object
```

(The `_validateXY` gate checks every datum is an object.)

### 5. Unknown chart type

```chart:teapot@1
{ "title": "Not a real type", "series": [{ "label": "x", "data": [] }] }
```

```
Chart error: unknown chart type: teapot
```

The registry lookup returned undefined; the runtime degrades rather than
guessing a default type.

### 6. Version too new

```chart:bar@9
{ "title": "From the future", "series": [{ "label": "x", "data": [] }] }
```

```
Chart error: chart version 9 is newer than this runtime supports (max 1)
```

The runtime supports `chart:<type>@1` only. A future schema bump will
raise `maxVersion`; for now, the explicit failure signals "your chart
needs a newer runtime".

### 7. Renderer throws

If the renderer itself throws (rare — typically a bug, not a spec issue),
the catch in `scan()` degrades to:

```
Chart error: <the error.message text>
```

Example: a heatmap spec with `options.grid: []` (empty grid):

```chart:heatmap@1
{ "title": "Empty", "series": [{ "label":"x", "data":[] }],
  "options": { "grid": [] } }
```

```
Chart error: heatmap needs a non-empty grid of cells
```

(Thrown by `renderSvgGrid` because `_gridCells` returns an empty array.)

## What the error block looks like

```html
<div class="ve-chart-error">
  <div class="ve-chart-error-banner">
    Chart error: invalid JSON — Unexpected token } in JSON at position 47
  </div>
  <pre class="ve-chart-error-src">{
  "title": "Broken",
  "series": [{ "label": "x", "data": [{"x":"A","y":1},] }
}</pre>
</div>
```

Styled by the chart module's injected CSS:

```css
.ve-chart-error {
  border: 1px solid var(--vc-color-danger, #a84a32);
  border-radius: var(--vc-radius-md, 8px);
  margin-block: var(--vc-space-4, 24px);
  overflow: visible;
}
.ve-chart-error-banner {
  background: color-mix(in srgb, var(--vc-color-danger) 12%, transparent);
  color: var(--vc-color-danger, #a84a32);
  font-family: var(--vc-font-body, system-ui, sans-serif);
  font-size: var(--vc-text-1, 14px);
  font-weight: var(--vc-weight-bold, 700);
  padding: var(--vc-space-2, 12px) var(--vc-space-3, 16px);
}
.ve-chart-error-src {
  margin: 0;
  padding: var(--vc-space-2, 12px) var(--vc-space-3, 16px);
  background: var(--vc-color-surface-sunken, #f1ece0);
  color: var(--vc-color-content, #1f1a14);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 12px);
  overflow: visible;
  white-space: pre-wrap;
  word-break: break-word;
}
```

Both themes paint the error block with high contrast — the banner is
danger-tinted in light mode and danger-tinted in dark mode, both via the
`--vc-color-danger` token.

## Accessing the error reason programmatically

The error block has no machine-readable `data-error-reason` attribute
(the rendered text is the source of truth). To programmatically check
for errors:

```js
document.querySelectorAll('.ve-chart-error').forEach(function (errEl) {
  var banner = errEl.querySelector('.ve-chart-error-banner');
  var src    = errEl.querySelector('.ve-chart-error-src');
  console.warn(banner.textContent, src.textContent);
});
```

For test fixtures, this lets a smoke test verify "every fenced block
either renders a chart OR a clear error" — never a silent blank.

## See also

- [chart-fence-protocol.md](./chart-fence-protocol.md#validation-gates-fail-fast) — the validation gates.
- [chart-guardrails.md](./chart-guardrails.md) — Guardrail 7 (fail-fast, fail-visible).
- [chart-design-tokens.md](./chart-design-tokens.md) — error-block CSS tokens.
