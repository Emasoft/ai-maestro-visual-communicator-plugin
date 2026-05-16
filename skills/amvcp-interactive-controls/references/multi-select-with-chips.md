# Multi-select with chips

A multi-select form control where selected items render as
removable chips below the picker. Used for tag selection, "members
of this group", "files included in this scope", any "pick N from
a list" UX. Combines a `<select multiple>` (the JS-off baseline)
with chip rendering on top.

## What it is

Native `<select multiple>` is hideous and fiddly to use (Cmd-click,
Shift-click — half the users don't know). A chip-based multi-select
shows the picked items as removable pills, with a search input
to add more. The picker can be:

- A dropdown with a search input and a checkbox list.
- A simple "add" input with autocomplete.
- A grid of pickable tiles.

This reference focuses on the second pattern (smallest scaffold)
with a CSS-only baseline.

## Scaffold

The baseline is a real `<select multiple>` named for form
submission. The JS layer wraps it with a chip view:

```html
<div class="ic-msel" data-ic-msel data-id="findings-tags"
     data-ic-persist>
  <label class="ic-msel-label" for="ic-msel-tags">Tags</label>
  <select class="ic-msel-select" id="ic-msel-tags" name="tags"
          multiple size="6">
    <option value="bug">bug</option>
    <option value="perf">perf</option>
    <option value="security">security</option>
    <option value="docs">docs</option>
    <option value="ux">ux</option>
    <option value="a11y">a11y</option>
  </select>
  <div class="ic-msel-chips" data-ic-msel-chips
       role="list" aria-label="Selected tags"></div>
  <input class="ic-msel-add" type="text"
         placeholder="Add tag…" list="ic-msel-tags-datalist"
         data-ic-msel-add>
  <datalist id="ic-msel-tags-datalist">
    <option value="bug"></option>
    <option value="perf"></option>
    <option value="security"></option>
    <option value="docs"></option>
    <option value="ux"></option>
    <option value="a11y"></option>
  </datalist>
</div>
```

CSS:

```css
.ic-msel {
  margin: var(--vc-space-3, 16px) 0;
}
.ic-msel-label {
  display: block;
  font: var(--vc-weight-medium, 500) var(--vc-text-1, 14px)/1.2
        var(--ve-control-font, inherit);
  color: var(--ve-control-fg-dim, #5b5343);
  margin-bottom: var(--vc-space-1, 8px);
}
/* Hide the native multi-select when JS is on; show when not.
   With JS we use the chip view; without, we use the native control. */
.js-on .ic-msel-select { display: none; }
.ic-msel-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--vc-space-1, 8px);
  margin: var(--vc-space-1, 8px) 0;
  min-height: 2em;
}
.ic-msel-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--vc-space-0, 4px);
  padding: var(--vc-space-0, 4px) var(--vc-space-1, 8px) var(--vc-space-0, 4px) var(--vc-space-2, 12px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-full, 9999px);
  background: var(--ve-control-bg, #ffffff);
  font: var(--vc-weight-medium, 500) var(--vc-text-0, 12px)/1.2
        var(--ve-control-font, inherit);
  color: var(--ve-control-fg, #14110b);
}
.ic-msel-chip-remove {
  display: inline-grid;
  place-items: center;
  width: 1.2em;
  height: 1.2em;
  border-radius: var(--vc-radius-full, 9999px);
  border: none;
  background: transparent;
  color: var(--ve-control-fg-dim, #5b5343);
  cursor: pointer;
  font: var(--vc-weight-bold, 700) 1em/1
        var(--ve-control-font, inherit);
}
.ic-msel-chip-remove:hover {
  background: color-mix(in srgb,
              var(--vc-color-danger, #a84a32) 18%, transparent);
  color: var(--vc-color-danger, #a84a32);
}
.ic-msel-add {
  width: 100%;
  padding: var(--vc-space-1, 8px) var(--vc-space-3, 16px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-sm, 4px);
  background: var(--ve-control-bg, #ffffff);
  font: inherit;
  color: var(--ve-control-fg, #14110b);
}
.ic-msel-add:focus-visible {
  outline: 2px solid var(--vc-color-accent, #b8861f);
  outline-offset: 2px;
}
```

## JS engine

```js
function initMsel(rootEl) {
  // Mark <html> so the CSS hides the native select.
  document.documentElement.classList.add('js-on');

  var select = rootEl.querySelector('.ic-msel-select');
  var chips  = rootEl.querySelector('.ic-msel-chips');
  var add    = rootEl.querySelector('.ic-msel-add');
  if (!select || !chips || !add) { return; }

  function render() {
    chips.textContent = '';
    Array.from(select.selectedOptions).forEach(function (opt) {
      var chip = document.createElement('span');
      chip.className = 'ic-msel-chip';
      chip.setAttribute('role', 'listitem');
      chip.textContent = opt.value;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ic-msel-chip-remove';
      btn.setAttribute('aria-label', 'Remove ' + opt.value);
      btn.textContent = '×';   // ×
      btn.addEventListener('click', function () {
        opt.selected = false;
        render(); persist(); emit();
      });
      chip.appendChild(btn);
      chips.appendChild(chip);
    });
  }

  function addValue(v) {
    v = String(v).trim().toLowerCase();
    if (!v) { return; }
    var matched = false;
    Array.from(select.options).forEach(function (opt) {
      if (opt.value === v) { opt.selected = true; matched = true; }
    });
    if (!matched) {
      // Add a new option (free-form tags).
      var opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      opt.selected = true;
      select.appendChild(opt);
    }
    render(); persist(); emit();
  }

  function persist() {
    if (!rootEl.hasAttribute('data-ic-persist')) { return; }
    var vals = Array.from(select.selectedOptions).map(function (o) { return o.value; });
    amvcpInteractive.saveState(rootEl, vals);
  }
  function emit() {
    rootEl.dispatchEvent(new CustomEvent('ic:msel-change', {
      bubbles: true,
      detail: {
        mselId: rootEl.getAttribute('data-id'),
        values: Array.from(select.selectedOptions).map(function (o) { return o.value; })
      }
    }));
  }

  // Restore persisted selection.
  if (rootEl.hasAttribute('data-ic-persist')) {
    var saved = amvcpInteractive.loadState(rootEl, null);
    if (saved && saved.length) {
      saved.forEach(addValue);
    }
  }

  add.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      addValue(add.value);
      add.value = '';
    } else if (ev.key === 'Backspace' && !add.value) {
      // Remove the last chip on backspace from empty input.
      var opts = Array.from(select.selectedOptions);
      if (opts.length) {
        opts[opts.length - 1].selected = false;
        render(); persist(); emit();
      }
    }
  });

  render();
}
document.querySelectorAll('[data-ic-msel]').forEach(initMsel);
```

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--ve-control-bg` / `--ve-control-border` | chip + input chrome |
| `--vc-color-danger` | remove-button hover tint |
| `--vc-color-accent` | input focus ring |
| `--vc-radius-full` | chip + remove-button pills |
| `--ve-control-fg-dim` | remove button + label |

## Selection / comment / decision-mini

- **The whole `.ic-msel` is one selectable atom** — comments
  attach to the multi-select itself ("rename this set", "this
  doesn't apply to these items").
- **Each chip is NOT independently selectable** — it's a state, not
  content. Comments don't make sense on a single chip.
- **Decision-mini.** A multi-select selection IS a decision set;
  the pill belongs alongside the multi-select.

## JS-off degradation

**Native `<select multiple>` takes over.** With JS off:

- `<html class="js-on">` is never added, so the `.ic-msel-select`
  stays visible — the user sees the standard multi-line select.
- They Cmd/Shift-click to select multiple. Form submission posts
  the values normally.
- The `.ic-msel-chips` and `.ic-msel-add` render but the input
  Enter handler doesn't fire — they're decorative without JS.

The fallback is functional, just uglier. The contract honours
graceful degradation.

## Anti-patterns

- Replacing `<select multiple>` with a `<div>`-and-JS picker
  without keeping the underlying select for form submission. You
  break form post + AT contract.
- A custom autocomplete with a fetch — for a static report, the
  picker should be self-contained (use `<datalist>` for suggestions,
  which is browser-native and zero-JS).
- No Backspace-from-empty handler — the user keeps clicking the
  × buttons; tedious for power users.
- A `+` button next to the input instead of relying on Enter — the
  Enter pattern is universal and the visual indicator (the
  placeholder + datalist arrow) suffices.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// Type and Enter — chip appears, select option marked.
const add = document.querySelector('[data-ic-msel-add]');
add.focus();
add.value = 'security';
await page.keyboard.press('Enter');
const chips = document.querySelectorAll('.ic-msel-chip');
console.assert(chips.length === 1);
const sel = document.querySelector('.ic-msel-select');
console.assert(sel.selectedOptions[0].value === 'security');

// Backspace from empty input removes the last chip.
await page.keyboard.press('Backspace');
console.assert(document.querySelectorAll('.ic-msel-chip').length === 0);
```

Screenshot light + dark themes with 0, 3, 8 chips. Verify chip
wrap and remove-button hover state in both.
