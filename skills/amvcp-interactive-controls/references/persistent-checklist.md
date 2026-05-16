# Persistent checklist — review/assessment with localStorage

A checklist that survives reload. Every checkbox carries `data-id`;
its state persists via the state-plumbing layer. Visible "X of N
done" counter updates live. The pattern behind any "review this
PR / test plan / runbook" deliverable where the reader's progress
should not be thrown away on refresh.

## What it is

`references/state-plumbing.md` covers the `data-ic-persist` +
`data-id` contract. This widget applies it to the simplest possible
control — a `<input type="checkbox">` — and adds:

- A `[data-ic-checklist-counter]` element that displays "X / N" and
  flips to a "Done" state when all checkboxes are checked.
- A `[data-ic-checklist-reset]` button that uncheck everything in
  one gesture.

Use cases: PR test-plan, deploy checklist, security-review rubric,
"step through this concept" walkthroughs where the reader confirms
each step.

## Scaffold

```html
<div class="ic-checklist" data-ic-checklist data-id="pr-1234-review"
     data-ic-persist>
  <header class="ic-checklist-head">
    <h3 class="ic-checklist-title">Review checklist</h3>
    <span class="ic-checklist-counter" data-ic-checklist-counter>
      <span data-ic-checklist-done>0</span> / <span data-ic-checklist-total>0</span>
    </span>
    <button class="ic-checklist-reset" type="button"
            data-ic-checklist-reset>Reset</button>
  </header>
  <ul class="ic-checklist-list">
    <li><label>
      <input type="checkbox" data-id="cov-tests">
      <span>Tests cover the new branch</span>
    </label></li>
    <li><label>
      <input type="checkbox" data-id="cov-edge">
      <span>Edge cases (empty array, null, NaN) are handled</span>
    </label></li>
    <li><label>
      <input type="checkbox" data-id="cov-docs">
      <span>Docs updated (changelog, README, JSDoc)</span>
    </label></li>
  </ul>
</div>
```

CSS:

```css
.ic-checklist {
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  background: var(--ve-control-bg, #ffffff);
  padding: var(--vc-space-3, 16px);
  margin: var(--vc-space-3, 16px) 0;
}
.ic-checklist-head {
  display: flex;
  align-items: center;
  gap: var(--vc-space-2, 12px);
  margin-bottom: var(--vc-space-2, 12px);
}
.ic-checklist-title {
  margin: 0;
  flex: 1;
  font: var(--vc-weight-bold, 700) var(--vc-text-2, 16px)/1.3
        var(--vc-font-heading, inherit);
  color: var(--ve-control-fg, #14110b);
}
.ic-checklist-counter {
  padding: var(--vc-space-0, 4px) var(--vc-space-2, 12px);
  border-radius: var(--vc-radius-full, 9999px);
  background: color-mix(in srgb,
              var(--ve-control-fg, #14110b) 8%, transparent);
  font: var(--vc-weight-medium, 500) var(--vc-text-0, 12px)/1
        var(--ve-control-mono, ui-monospace, Menlo, monospace);
  color: var(--ve-control-fg-dim, #5b5343);
  font-variant-numeric: tabular-nums;
}
.ic-checklist[data-ic-checklist-complete] .ic-checklist-counter {
  background: var(--vc-color-success, #3a6b5c);
  color: var(--vc-color-on-success, #ffffff);
}
.ic-checklist-reset {
  padding: var(--vc-space-0, 4px) var(--vc-space-2, 12px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-sm, 4px);
  background: var(--ve-control-bg, #ffffff);
  color: var(--ve-control-fg-dim, #5b5343);
  font: var(--vc-weight-medium, 500) var(--vc-text-0, 12px)/1.2
        var(--ve-control-font, inherit);
  cursor: pointer;
}
.ic-checklist-reset:hover { color: var(--vc-color-accent, #b8861f); }
.ic-checklist-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--vc-space-1, 8px);
}
.ic-checklist-list label {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--vc-space-2, 12px);
  align-items: start;
  cursor: pointer;
}
.ic-checklist-list input[type="checkbox"] {
  accent-color: var(--vc-color-success, #3a6b5c);
  margin-top: 0.25em;
}
/* When the box is checked, dim the label so the reader's eye finds
   the still-to-do items first. */
.ic-checklist-list label:has(input:checked) span {
  color: var(--ve-control-fg-dim, #5b5343);
  text-decoration: line-through;
}
```

## JS engine

```js
function initChecklist(rootEl) {
  var doneEl  = rootEl.querySelector('[data-ic-checklist-done]');
  var totalEl = rootEl.querySelector('[data-ic-checklist-total]');
  var resetEl = rootEl.querySelector('[data-ic-checklist-reset]');
  var inputs  = rootEl.querySelectorAll('input[type="checkbox"][data-id]');
  if (!inputs.length) { return; }

  // Restore each checkbox's persisted state by its own data-id.
  function ls(id) { return 'amvcp-ic:cl:' + rootEl.getAttribute('data-id') + ':' + id; }

  function restore() {
    inputs.forEach(function (cb) {
      try {
        var v = localStorage.getItem(ls(cb.getAttribute('data-id')));
        if (v !== null) { cb.checked = v === '1'; }
      } catch (e) { /* private mode — skip */ }
    });
  }
  function persistOne(cb) {
    try {
      localStorage.setItem(ls(cb.getAttribute('data-id')),
                           cb.checked ? '1' : '0');
    } catch (e) { /* best-effort */ }
  }
  function refresh() {
    var done = 0;
    inputs.forEach(function (cb) { if (cb.checked) { done++; } });
    if (doneEl)  { doneEl.textContent  = String(done); }
    if (totalEl) { totalEl.textContent = String(inputs.length); }
    if (done === inputs.length) {
      rootEl.setAttribute('data-ic-checklist-complete', '');
    } else {
      rootEl.removeAttribute('data-ic-checklist-complete');
    }
  }

  inputs.forEach(function (cb) {
    cb.addEventListener('change', function () {
      persistOne(cb);
      refresh();
      rootEl.dispatchEvent(new CustomEvent('ic:checklist-change', {
        bubbles: true,
        detail: {
          checklistId: rootEl.getAttribute('data-id'),
          itemId: cb.getAttribute('data-id'),
          checked: cb.checked
        }
      }));
    });
  });
  if (resetEl) {
    resetEl.addEventListener('click', function () {
      inputs.forEach(function (cb) { cb.checked = false; persistOne(cb); });
      refresh();
    });
  }

  restore();
  refresh();
}
document.querySelectorAll('[data-ic-checklist]').forEach(initChecklist);
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--ve-control-bg` / `--ve-control-border` | container chrome |
| `--vc-color-success` | accent on checked boxes + "all done" badge |
| `--vc-color-on-success` | "all done" text |
| `--vc-radius-full` | counter pill |
| `--ve-control-fg-dim` | dim checked labels |
| `--ve-control-mono` | counter font |

`accent-color: var(--vc-color-success)` on the checkbox tints the
native check without a custom checkbox SVG — supported by all
modern browsers, falls back to the UA default cleanly.

## Selection / comment / decision-mini

- **Each `<label>` row IS a selectable atom** (`data-ve-id="cl:<id>:<item-id>"`)
  so a reviewer can comment "this item is missing" or "this should
  be required, not optional".
- **The checklist root** carries its own atom for whole-list comments
  ("this checklist is wrong for this PR shape").
- **Decision-mini.** Each item's checkbox state IS its own
  3-state (unchecked / checked / N/A) — but we keep the checkbox
  as binary; the S/A/D pill stays separate and means
  Skip / Approve / Deny the *requirement itself*, not its
  fulfilment status.

## JS-off degradation

**Checkboxes still toggle, but state does not survive reload.**
With JS off:

- Every `<input type="checkbox">` is a real, fully functional
  checkbox.
- Toggling marks it checked in the DOM; the CSS `:has(input:checked)`
  rule strikes through the label.
- The "X / N" counter shows `0 / 0` because the JS isn't running.
- Reset button does nothing.
- On reload, every checkbox returns to its HTML default (unchecked).

This is graceful: the checklist works as a paper-checklist; only the
"remember my progress across sessions" enhancement is lost. The
reader can still scan, click, and visually track their progress
within one session.

## Anti-patterns

- Putting every checkbox's state under a single `data-id` JSON
  array — a re-rendered checklist with a new item would scramble
  every check. Per-item `data-id` is the invariant.
- Using `<input type="checkbox">` without a wrapping `<label>` —
  the clickable area shrinks to a tiny box and tab navigation
  is fiddly.
- Hardcoding the success color — must be `var(--vc-color-success,
  #fallback)` so theme hot-swap recolors live.
- Forgetting `font-variant-numeric: tabular-nums` on the counter
  — "0 / 9" vs "10 / 99" widths shift the layout every check.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Click an item — counter increments + persists.
const cb = document.querySelector('input[data-id="cov-tests"]');
cb.click();
console.assert(cb.checked);
const done = document.querySelector('[data-ic-checklist-done]').textContent;
console.assert(done === '1');
// localStorage was written
console.assert(localStorage.getItem('amvcp-ic:cl:pr-1234-review:cov-tests') === '1');

// All items checked → root gets data-ic-checklist-complete
document.querySelectorAll('input[type="checkbox"][data-id]').forEach(c => {
  if (!c.checked) { c.click(); }
});
console.assert(document.querySelector('.ic-checklist').hasAttribute('data-ic-checklist-complete'));

// Reset button uncheck everything.
document.querySelector('[data-ic-checklist-reset]').click();
const stillChecked = Array.from(document.querySelectorAll('input[type="checkbox"][data-id]'))
  .filter(c => c.checked);
console.assert(stillChecked.length === 0);
```

Screenshot both states — partial completion + 100% completion — in
light and dark themes; verify the "complete" badge contrast reads.
