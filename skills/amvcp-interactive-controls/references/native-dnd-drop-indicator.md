# Native HTML5 drag-and-drop with gap drop indicator

Single-column reorderable list using the HTML5 drag API and a 2 px
clay drop indicator that snaps to the **nearest gap** between
siblings (not raw cursor Y). The indicator's "decisive" feel is
what separates this pattern from a default `dragover` highlight —
the user sees exactly where the item will land.

## What it is

`references/drag-reorder.md` covers a multi-column Kanban with
between-column moves. This pattern is the simpler sibling: ONE
column, items reorderable within it. Use cases: a sidebar nav
prototype, a list of triage tickets in priority order, a step list
the user wants to re-sort.

The drop indicator is a single absolutely-positioned `<div>` whose
`top` is recomputed in `dragover`: walks siblings, finds the first
whose midpoint is below the cursor, sets the indicator just above
it. If the cursor is past every item, the indicator pins to the
list bottom.

## Scaffold

```html
<ul class="ic-droplist" data-ic-droplist data-ic-persist data-id="sidebar-order">
  <li class="ic-drop-item" draggable="true" data-id="row-a">
    <span class="ic-drop-grip" aria-hidden="true"></span>
    <span class="ic-drop-label">Inbox</span>
    <span class="ic-drop-count">12</span>
  </li>
  <li class="ic-drop-item" draggable="true" data-id="row-b">
    <span class="ic-drop-grip" aria-hidden="true"></span>
    <span class="ic-drop-label">Triage</span>
    <span class="ic-drop-count">3</span>
  </li>
  <li class="ic-drop-item" draggable="true" data-id="row-c">
    <span class="ic-drop-grip" aria-hidden="true"></span>
    <span class="ic-drop-label">Archive</span>
  </li>
</ul>
```

CSS:

```css
.ic-droplist {
  list-style: none;
  margin: var(--vc-space-3, 16px) 0;
  padding: var(--vc-space-1, 8px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  background: var(--ve-control-bg, #ffffff);
  position: relative;
}
.ic-drop-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--vc-space-2, 12px);
  padding: var(--vc-space-1, 8px) var(--vc-space-2, 12px);
  margin: var(--vc-space-0, 4px) 0;
  border-radius: var(--vc-radius-sm, 4px);
  cursor: grab;
  background: var(--ve-control-bg, #ffffff);
  border: 1px solid transparent;
  user-select: none;
}
.ic-drop-item:hover { border-color: var(--ve-control-border, #e3dcc9); }
.ic-drop-item.ic-dragging {
  opacity: 0.35;
  transform: rotate(2deg);
  cursor: grabbing;
}
/* 2x3 grid of 3px circles — the visible "drag handle" affordance. */
.ic-drop-grip {
  display: grid;
  grid-template-columns: 3px 3px;
  grid-template-rows: 3px 3px 3px;
  gap: 2px;
  width: 8px;
  height: 13px;
}
.ic-drop-grip::before, .ic-drop-grip::after {
  content: ""; background: var(--ve-control-fg-dim, #5b5343); border-radius: 50%;
}
/* (real impl: 6 pseudo-element fakes would need an inline SVG or 6
   nested spans; the simplest is a single inline-block with a
   linear-gradient pattern — same visual.) */

.ic-drop-indicator {
  position: absolute;
  left: var(--vc-space-1, 8px);
  right: var(--vc-space-1, 8px);
  height: 2px;
  background: var(--vc-color-accent, #b8861f);
  border-radius: var(--vc-radius-full, 9999px);
  pointer-events: none;
}
.ic-drop-indicator::before {
  content: "";
  position: absolute;
  left: -3px;
  top: -3px;
  width: 8px;
  height: 8px;
  border-radius: var(--vc-radius-full, 9999px);
  background: var(--vc-color-accent, #b8861f);
}
```

## JS engine

```js
function initDropList(listEl) {
  var indicator = document.createElement('div');
  indicator.className = 'ic-drop-indicator';
  indicator.style.display = 'none';
  listEl.appendChild(indicator);

  var dragId = null;

  listEl.addEventListener('dragstart', function (ev) {
    var item = ev.target.closest('.ic-drop-item');
    if (!item) { return; }
    dragId = item.getAttribute('data-id');
    item.classList.add('ic-dragging');
    if (ev.dataTransfer) {
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', dragId);
    }
  });
  listEl.addEventListener('dragend', function (ev) {
    var item = ev.target.closest('.ic-drop-item');
    if (item) { item.classList.remove('ic-dragging'); }
    indicator.style.display = 'none';
    dragId = null;
  });

  listEl.addEventListener('dragover', function (ev) {
    ev.preventDefault();
    var siblings = Array.prototype.slice.call(
      listEl.querySelectorAll('.ic-drop-item:not(.ic-dragging)'));
    var listRect = listEl.getBoundingClientRect();
    var cursorY = ev.clientY;
    var insertBefore = null;
    for (var i = 0; i < siblings.length; i++) {
      var r = siblings[i].getBoundingClientRect();
      var mid = r.top + r.height / 2;
      if (cursorY < mid) { insertBefore = siblings[i]; break; }
    }
    var indicatorY;
    if (insertBefore) {
      indicatorY = insertBefore.getBoundingClientRect().top - listRect.top - 1;
    } else if (siblings.length) {
      var last = siblings[siblings.length - 1].getBoundingClientRect();
      indicatorY = last.bottom - listRect.top - 1;
    } else {
      indicatorY = 0;
    }
    indicator.style.display = 'block';
    indicator.style.top = indicatorY + 'px';
  });

  listEl.addEventListener('drop', function (ev) {
    ev.preventDefault();
    if (!dragId) { return; }
    var dragEl = listEl.querySelector('[data-id="' + dragId + '"]');
    if (!dragEl) { return; }
    // Same scan as dragover to pick the insertion point.
    var siblings = Array.prototype.slice.call(
      listEl.querySelectorAll('.ic-drop-item:not(.ic-dragging)'));
    var cursorY = ev.clientY;
    var insertBefore = null;
    for (var i = 0; i < siblings.length; i++) {
      var r = siblings[i].getBoundingClientRect();
      if (cursorY < r.top + r.height / 2) { insertBefore = siblings[i]; break; }
    }
    if (insertBefore) {
      listEl.insertBefore(dragEl, insertBefore);
    } else {
      listEl.insertBefore(dragEl, indicator);   // before the indicator (last child)
    }
    indicator.style.display = 'none';
    dragEl.classList.remove('ic-dragging');

    // Persist via state-plumbing.
    var order = Array.prototype.slice.call(
      listEl.querySelectorAll('.ic-drop-item'))
      .map(function (el) { return el.getAttribute('data-id'); });
    if (listEl.hasAttribute('data-ic-persist')) {
      amvcpInteractive.saveState(listEl, order);
    }
    listEl.dispatchEvent(new CustomEvent('ic:reorder', {
      bubbles: true, detail: { listId: listEl.getAttribute('data-id'), order: order }
    }));
  });
}
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-accent` | indicator line + dot |
| `--vc-radius-full` | indicator dot + line ends |
| `--ve-control-bg` / `--ve-control-border` | list chrome |
| `--ve-control-fg-dim` | grip dots |
| `--vc-radius-sm` | item hover border |
| `--vc-radius-md` | list container |

The 2 px height + 8 px dot is small enough not to push content
around but bold enough to read at glance — keep these dimensions
literal (not tokenized) because they are visual constants of the
"decisive drop indicator" pattern.

## Selection / comment / decision-mini

- **Each `.ic-drop-item` is a selectable atom** with a stable
  `data-id` (the same id used for ordering persistence). The
  selection survives reorder because the atom-id is the
  intrinsic identity, not the position.
- **Decision-mini on each row** lets a reviewer Skip / Approve /
  Deny an individual row before committing the order.
- **List-level comment.** The `.ic-droplist` ALSO carries
  `data-ve-id="droplist:<id>"` so a comment can attach to "the
  whole reorder" (e.g. "this order is wrong; here's the right
  one").

## JS-off degradation

**The list shows but cannot reorder.** With JS off:

- The `<ul>` renders with all items in their author-supplied order.
- `draggable="true"` is honored by the browser (a ghost appears on
  drag-start) but no drop target exists, so the gesture rejects.
- No reordering happens; no persistence; no events fire.
- A `<noscript>` block above the list should state: "Drag-to-reorder
  requires JavaScript; the list is shown in its authored order."

This is acceptable: a static list with the right items in a
reasonable order communicates almost everything; only the
*re-ordering* requires JS.

## Anti-patterns

- Walking `siblings` and computing midpoint per `dragover` without
  caching. On a 200-item list `dragover` fires ~60 times/sec —
  cache the bounding rects on `dragstart` and only invalidate when
  the page scrolls or resizes.
- Snapping to "the sibling under the cursor" instead of "the
  sibling whose midpoint is below the cursor". The midpoint rule
  is what makes the indicator feel decisive — items above the
  cursor stay above, items below go below.
- Forgetting `ev.preventDefault()` in `dragover`. Without it, the
  drop event never fires (the HTML5 API treats the target as
  "not a drop zone" by default).
- Storing the order in JS only. The DOM IS the order — read it
  with `querySelectorAll` after the drop and persist that.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md` and the
**browser-ui-test-techniques** "trust real mouse paths" rule:

```js
// Programmatic drag does NOT exercise the real path. Use page.mouse:
const srcRect = await page.locator('.ic-drop-item').first().boundingBox();
const dstRect = await page.locator('.ic-drop-item').last().boundingBox();
await page.mouse.move(srcRect.x + 8, srcRect.y + srcRect.height / 2);
await page.mouse.down();
// step-by-step move so dragover fires per step
await page.mouse.move(dstRect.x + 8, dstRect.y + dstRect.height + 4, { steps: 12 });
await page.mouse.up();

const order = await page.evaluate(() => Array.from(
  document.querySelectorAll('.ic-drop-item')).map(e => e.dataset.id));
console.assert(order[0] !== 'row-a', 'item did not move');
```

Note: `dragstart`/`dragover`/`drop` are NOT exercised by
`mouse.down()`+`mouse.move()` in Playwright/Puppeteer — those
synthesise mouse events but the browser only fires HTML5 drag
events for a *real* user gesture or for explicit
`element.dispatchEvent(new DragEvent('dragstart'))`. Most tests for
this pattern dispatch the DragEvents directly; that's acceptable
because the failure mode the test guards against is the math (which
sibling), not the event sequence.

Screenshot light + dark; verify the indicator line + dot is
visible in both.
