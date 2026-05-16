# Tooltip & hover behavior

Every chart in this skill shares ONE tooltip — a singleton
`<div class="ve-chart-tooltip">` appended to `<body>`. The same tooltip
shows mark labels + values across every chart on the page (a bar, a donut
arc, a heatmap cell, a metric card). This file documents the tooltip's
mechanics + the hover-bridge anti-flicker pattern.

## Table of contents

- [The singleton tooltip](#the-singleton-tooltip)
- [The hover-bridge anti-flicker pattern](#the-hover-bridge-anti-flicker-pattern)
- [Click-to-lock](#click-to-lock)
- [Positioning + viewport clamp](#positioning--viewport-clamp)
- [Native SVG `<title>` fallback](#native-svg-title-fallback)
- [Canvas-side hover](#canvas-side-hover)
- [Tooltip body shape](#tooltip-body-shape)

---

## The singleton tooltip

There is exactly ONE tooltip per page. It's lazily created the first
time `_ensureTooltip()` is called and appended to `document.body`.
Subsequent calls return the existing element.

```js
var _tip = null;
var _tipHideTimer = null;
var _tipLocked = false;

function _ensureTooltip() {
  if (_tip) return _tip;
  _tip = el('div', { className: 've-chart-tooltip', role: 'status' });
  _tip.style.display = 'none';
  _tip.addEventListener('mouseover', function () {
    if (_tipHideTimer) { clearTimeout(_tipHideTimer); _tipHideTimer = null; }
  });
  _tip.addEventListener('mouseleave', function () {
    if (!_tipLocked) _scheduleTipHide();
  });
  document.body.appendChild(_tip);
  return _tip;
}
```

Why a singleton? With multiple charts on a page, dozens of marks per
chart, the alternative — a tooltip per mark — would create thousands of
DOM nodes. The singleton is reused across every chart's hover event.

## The hover-bridge anti-flicker pattern

The tooltip lives at `<body>` level (not as a child of the chart), so
when the mouse moves from a mark to the tooltip, there's typically a
small GAP — and naive `mouseout` would hide the tooltip the moment the
pointer crosses that gap. The classic flicker bug.

The fix is the HOVER-BRIDGE pattern (documented in
`~/.claude/rules/browser-ui-test-techniques.md` §2):

- The tooltip's HIDE is DEFERRED on a 160ms timer.
- The tooltip itself listens for `mouseover` — if the pointer reaches the
  tooltip, the hide timer is cancelled.
- The tooltip listens for `mouseleave` — if the pointer leaves the
  tooltip, the hide is rescheduled.

```js
function _scheduleTipHide() {
  if (_tipHideTimer) clearTimeout(_tipHideTimer);
  _tipHideTimer = setTimeout(function () {
    if (_tip && !_tipLocked) _tip.style.display = 'none';
    _tipHideTimer = null;
  }, 160);
}
```

160ms is the empirical sweet spot: short enough that a casual mouse drift
hides the tooltip, long enough that an intentional pointer move from
mark to tooltip clears it.

## Click-to-lock

A click on a mark TOGGLES a LOCK on the tooltip:

```js
fig.addEventListener('click', function (ev) {
  var mark = findMark(ev.target);
  if (!mark || !mark.__veChartPayload) return;
  _tipLocked = !_tipLocked;
  if (_tipLocked) {
    _showTooltip(_tooltipBody(p.label, p.data.value), ev.clientX, ev.clientY);
  } else {
    _hideTooltipNow();
  }
  _toggleSelection(p);
});
```

Locked state:
- Tooltip stays visible regardless of `mouseout`.
- Next click on the same (or any) mark UNLOCKS — tooltip hides immediately.
- Next click on a DIFFERENT mark toggles selection on that mark + may
  show the tooltip at the new position if hovered.

This is useful for COMMENT THREADS: the reader clicks a mark to lock the
tooltip showing the value, then opens the comment modal with the value
visible as reference context.

## Positioning + viewport clamp

The tooltip positions above-right of the pointer by default; if that
would clip the viewport, it flips to above-left:

```js
function _showTooltip(html, clientX, clientY) {
  var tip = _ensureTooltip();
  tip.innerHTML = '';
  tip.appendChild(html);
  tip.style.display = 'block';
  var pad = 14;
  var vw = window.innerWidth;
  var x = clientX + pad;
  var y = clientY + pad;
  var r = tip.getBoundingClientRect();
  if (x + r.width > vw - 4) x = clientX - r.width - pad;
  if (x < 4) x = 4;
  if (y < 4) y = clientY + pad;
  tip.style.left = (x + window.scrollX) + 'px';
  tip.style.top  = (y + window.scrollY) + 'px';
}
```

Note `window.scrollX` / `window.scrollY` are added — the tooltip is
positioned in DOCUMENT coordinates (not viewport), so it stays anchored
to the mark even as the page scrolls.

## Native SVG `<title>` fallback

In addition to the JS tooltip, every SVG mark has a `<title>` child:

```html
<rect class="ve-chart-bar" …>
  <title>Revenue · Q1: 2.4</title>
</rect>
```

Browser renders the `<title>` as a native tooltip after the OS's tooltip
delay (~500ms). This is the FALLBACK for users with JS disabled, for
print previews, and for accessibility tools (screen readers read the
`<title>` as the accessible name of the element).

The JS tooltip + the `<title>` BOTH appear when the user hovers; the
native tooltip appears later (after the OS delay) and shows the same
text, so it's not visually problematic. Accessibility wins, no UX loss.

## Canvas-side hover

For Canvas-backed charts, `mouseover` on a `<rect>` is impossible (Canvas
has no DOM nodes for marks). The hit-test approach (see
`chart-canvas-backend.md`) emulates hover:

```js
canvas.addEventListener('mousemove', function (ev) {
  var r = canvas.getBoundingClientRect();
  var m = hitTest(ev.clientX - r.left, ev.clientY - r.top);
  if (m) {
    var p = markPayload(m);
    _showTooltip(_tooltipBody(p.label, p.data.value), ev.clientX, ev.clientY);
  } else if (!_tipLocked) {
    _scheduleTipHide();
  }
});
```

Same `_showTooltip` + `_scheduleTipHide` calls; same singleton tooltip;
same hover-bridge behavior. The only difference is the hover SOURCE
(JS hit-test instead of DOM `mouseover`).

## Tooltip body shape

```js
function _tooltipBody(label, value) {
  var box = el('div', { className: 've-chart-tooltip-inner' });
  box.appendChild(el('div', { className: 've-chart-tooltip-label' }, label || ''));
  if (value !== undefined && value !== null) {
    box.appendChild(el('div', { className: 've-chart-tooltip-value' },
      fmtNum(value)));
  }
  return box;
}
```

Two lines:
1. The atom's LABEL ("Revenue · Q1") — bold, content color.
2. The atom's VALUE (formatted via `fmtNum` — k/M suffixes, 2-decimal
   limit) — medium, accent color.

The styles:

```css
.ve-chart-tooltip-label {
  color: var(--vc-color-content, #1f1a14);
  font-weight: var(--vc-weight-bold, 700);
}
.ve-chart-tooltip-value {
  color: var(--vc-color-accent, #b8861f);
  font-weight: var(--vc-weight-medium, 500);
  margin-top: 2px;
}
```

The tooltip itself has a shadow + border + padding (full CSS in
`chart-design-tokens.md`).

## See also

- [chart-selection-and-comments.md](./chart-selection-and-comments.md) — the click-to-toggle-selection that fires alongside the click-to-lock.
- [chart-canvas-backend.md](./chart-canvas-backend.md) — Canvas-side hit-testing.
- [chart-design-tokens.md](./chart-design-tokens.md) — tooltip CSS tokens.
- `~/.claude/rules/browser-ui-test-techniques.md` §2 — the hover-bridge pattern source.
