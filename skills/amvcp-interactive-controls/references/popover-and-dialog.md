# Native `<dialog>` and `popover` — modern modal & menu

The CSS-only `:target` modal pattern (`references/panels-disclosure.md`)
is the universal-baseline. This reference catalogs the two **modern**
alternatives that ship in every current browser: `<dialog>` and the
`popover` attribute. Use them when the deployment context allows;
they're significantly nicer than `:target`.

## Two patterns

| Pattern | Modal? | Backdrop? | ESC | Focus trap | Top-layer |
|---|---|---|---|---|---|
| `:target` modal (baseline) | Y (semantically) | scrim div | N | N | N |
| `<dialog open>` | Y if `showModal()`, else N | `::backdrop` | Y on modal | Y on modal | Y |
| `popover` attribute | N | N | Y | N | Y |

The `:target` baseline still ships when the page MUST open from
`file://` on older browsers; `<dialog>` and `popover` are the right
choice on every modern Chromium / Firefox / Safari.

## `<dialog>` — true modal

```html
<button type="button" class="ic-dialog-open"
        data-ic-dialog-open="confirm-delete">Delete</button>

<dialog class="ic-dialog" id="confirm-delete">
  <form method="dialog" class="ic-dialog-form">
    <h2 class="ic-dialog-title">Delete this item?</h2>
    <p class="ic-dialog-body">This cannot be undone.</p>
    <menu class="ic-dialog-actions">
      <button type="button" value="cancel"
              class="ic-dialog-cancel">Cancel</button>
      <button type="submit" value="confirm"
              class="ic-dialog-confirm">Delete</button>
    </menu>
  </form>
</dialog>
```

Opener:

```js
document.addEventListener('click', function (ev) {
  var trig = ev.target.closest('[data-ic-dialog-open]');
  if (!trig) { return; }
  var id = trig.getAttribute('data-ic-dialog-open');
  var dlg = document.getElementById(id);
  if (dlg && typeof dlg.showModal === 'function') {
    dlg.showModal();
  } else if (dlg) {
    dlg.setAttribute('open', '');   // non-modal fallback
  }
});
```

For the `Cancel` button: `<form method="dialog">` makes any submit
inside it close the dialog and return the button's `value` via
`dialog.returnValue`. Read it after close:

```js
dlg.addEventListener('close', function () {
  if (dlg.returnValue === 'confirm') { performDelete(); }
});
```

CSS:

```css
.ic-dialog {
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-lg, 12px);
  background: var(--vc-color-surface-raised, #ffffff);
  color: var(--vc-color-content, #14110b);
  padding: var(--vc-space-4, 24px);
  max-width: 32rem;
  width: calc(100vw - 2 * var(--vc-space-4, 24px));
  /* NO max-height + overflow:auto — tall dialog grows; page scrolls
     behind the backdrop (no-nested-scrollbars). */
}
.ic-dialog::backdrop {
  background: color-mix(in srgb,
              var(--vc-color-content, #000) 55%, transparent);
}
.ic-dialog-title {
  margin: 0 0 var(--vc-space-2, 12px);
  font: var(--vc-weight-bold, 700) var(--vc-text-3, 20px)/1.2
        var(--vc-font-heading, inherit);
}
.ic-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--vc-space-1, 8px);
  margin: var(--vc-space-3, 16px) 0 0;
  padding: 0;
}
.ic-dialog-cancel, .ic-dialog-confirm {
  padding: var(--vc-space-1, 8px) var(--vc-space-3, 16px);
  border-radius: var(--vc-radius-sm, 4px);
  font: var(--vc-weight-medium, 500) var(--vc-text-1, 14px)/1.2
        var(--ve-control-font, inherit);
  cursor: pointer;
}
.ic-dialog-cancel {
  background: var(--ve-control-bg, #fff);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  color: var(--ve-control-fg, #14110b);
}
.ic-dialog-confirm {
  background: var(--vc-color-danger, #a84a32);
  border: 1px solid var(--vc-color-danger, #a84a32);
  color: var(--vc-color-on-accent, #fff);
}
```

`<dialog>` automatically:

- Lives in the top-layer (above every other stacking context).
- Traps focus inside.
- Closes on ESC.
- Inert-ifies the rest of the page (clicks outside don't reach
  anywhere).

You get all that for free; no `tabindex` walking, no scrim event
listener, no manual `removeAttribute('tabindex')` to re-enable.

## `popover` attribute — non-modal disclosure

For a non-modal anchored popover (e.g. a help tooltip, a settings
menu, an inline definition):

```html
<button type="button" popovertarget="help-1"
        class="ic-pop-trigger">What is X?</button>
<div id="help-1" popover="auto" class="ic-popover">
  <p>X is the magic constant we use for …</p>
</div>
```

The `popovertarget` attribute on the button is wired by the browser:
clicking the button opens the popover; clicking outside (or pressing
ESC) closes it. `popover="auto"` is the dismissible mode;
`popover="manual"` requires explicit `.showPopover()` /
`.hidePopover()`.

CSS:

```css
.ic-popover {
  margin: 0;
  padding: var(--vc-space-3, 16px);
  border: 1px solid var(--ve-control-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  background: var(--vc-color-surface-raised, #ffffff);
  color: var(--vc-color-content, #14110b);
  box-shadow: var(--vc-shadow-2, 0 4px 16px rgba(0,0,0,.10));
  font: var(--vc-weight-regular, 400) var(--vc-text-1, 14px)/1.5
        var(--ve-control-font, inherit);
  max-width: 24rem;
}
.ic-popover:popover-open {
  /* Browser positions it; only style here. */
}
```

The browser's anchor-positioning of the popover relative to the
trigger is in the **CSS Anchor Positioning** spec — supported in
Chromium 125+; for now, position via JS or default to viewport-
centered.

## DESIGN.md tokens

| Token | Role |
|---|---|
| `--vc-color-surface-raised` | dialog / popover background |
| `--vc-color-content` | text + backdrop scrim |
| `--vc-color-danger` | confirm-delete button |
| `--ve-control-border` | borders |
| `--vc-radius-lg` / `--vc-radius-md` | dialog vs popover roundness |
| `--vc-shadow-2` | popover lift |

## Selection / comment / decision-mini

- **Dialog content (title + body)** is a selectable atom for the
  reader who wants to comment on the prompt's wording.
- **Trigger button is NOT an atom** — it's a verb.
- **Decision-mini.** A confirmation dialog is itself a S/A/D
  choice; the dialog's `<menu>` IS the decision UI. Skip the
  pill on the dialog.

## JS-off degradation

**Both patterns work without JS, with degraded UX.** With JS off:

- The dialog opener (`[data-ic-dialog-open]`) does nothing. Pages
  needing JS-off support should use the `:target` modal pattern
  instead.
- The `popover` attribute and `popovertarget` are read by the
  browser without JS — the popover opens and closes correctly on
  click and ESC! No JS layer needed for the basic case.

Mitigation: prefer `popover` for static reports that may open from
`file://`; reserve `<dialog>` for interactive contexts.

## Anti-patterns

- Polyfilling `<dialog>` with a JS reimplementation when the
  audience all has modern browsers. The native `<dialog>` is
  better in every dimension.
- Using `<dialog>` non-modally (`open` attribute) for a tooltip.
  Use `popover` — it's the right primitive.
- Putting interactive content inside a `<dialog>` without a
  `<form method="dialog">`. You lose the auto-close + return-value
  pipeline.
- Setting `max-height` + `overflow: auto` on the dialog content —
  forbidden by no-nested-scrollbars; let the dialog grow and the
  page scroll.

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

```js
// <dialog>.showModal() — focus moves inside, ESC closes.
const dlg = document.getElementById('confirm-delete');
document.querySelector('[data-ic-dialog-open="confirm-delete"]').click();
console.assert(dlg.open, 'dialog did not open');
console.assert(dlg.contains(document.activeElement),
               'focus did not move into dialog');
await page.keyboard.press('Escape');
console.assert(!dlg.open, 'ESC did not close');

// popover — clicking trigger opens; clicking outside closes.
const pop = document.getElementById('help-1');
document.querySelector('[popovertarget="help-1"]').click();
console.assert(pop.matches(':popover-open'));
document.body.click();
console.assert(!pop.matches(':popover-open'));
```

Screenshot both light + dark; verify the dialog backdrop scrim is
visible AND the dialog card contrasts against it in both themes.
