# Panels & disclosure — accordion / tabs / modal

Three patterns. All have a **CSS-only baseline** (keyboard-native,
JS-disabled-safe); `amvcp-interactive.js` adds ARIA + persistence + drafts
on top — it never replaces the CSS mechanism.

## Accordion — native `<details>`/`<summary>`

```html
<div class="ic-accordion" data-ic-accordion="single">
  <details class="ic-acc-item" open>
    <summary class="ic-acc-head">Section title</summary>
    <div class="ic-acc-body"> … </div>
  </details>
  <details class="ic-acc-item"> … </details>
</div>
```

`<details>` is keyboard- and screen-reader-native and needs zero JS. The
JS layer only adds single-open-at-a-time when the container carries
`data-ic-accordion="single"` — opening one `<details>` closes its
siblings.

## Tabs — radio inputs + `:checked` + sibling combinator

```html
<div class="ic-tabs" data-ic-persist data-id="report-tabs">
  <input class="ic-tab-radio" type="radio" name="report-tabs" id="tab-1" checked>
  <input class="ic-tab-radio" type="radio" name="report-tabs" id="tab-2">
  <div class="ic-tablist">
    <label class="ic-tab" for="tab-1">Overview</label>
    <label class="ic-tab" for="tab-2">Detail</label>
  </div>
  <div class="ic-tabpanels">
    <section class="ic-tabpanel" data-tab="tab-1"> … </section>
    <section class="ic-tabpanel" data-tab="tab-2"> … </section>
  </div>
</div>
```

The renderer emits **one per-page rule pair per tab** into the scaffold's
`<style>` (the radio ids are page-specific, so they cannot live in
`amvcp-interactive.css`):

```css
#tab-1:checked ~ .ic-tabpanels .ic-tabpanel[data-tab="tab-1"] { display:block; }
#tab-1:checked ~ .ic-tablist  .ic-tab[for="tab-1"] {
  color: var(--ve-control-fg, #14110b);
  border-bottom-color: var(--vc-color-accent, #b8861f);
}
```

No JS is needed for the panel switch. The JS layer **adds**:

- **ARIA** — `role="tab"` + `aria-selected` + `aria-controls` on each
  label; `role="tabpanel"` + `aria-labelledby` on each panel; roving
  `tabindex` (active tab `0`, others `-1`). Arrow keys cycle, Home/End
  jump.
- **Persistence** — on tab change, the active tab id is saved; on boot,
  the persisted tab is restored.
- **Per-tab textarea drafts** — any `<textarea data-ic-draft data-id="…">`
  inside a panel autosaves on `input` with a **500 ms debounce** and
  restores on boot.

## Modal — `:target`

```html
<a class="ic-modal-open" href="#ic-modal-x">Open</a>
<div class="ic-modal" id="ic-modal-x" role="dialog" aria-modal="true"
     aria-labelledby="ic-modal-x-title">
  <div class="ic-modal-card">
    <h2 id="ic-modal-x-title">Title</h2>
    <div class="ic-modal-body"> … </div>
    <a class="ic-modal-close" href="#" aria-label="Close">&times;</a>
  </div>
  <a class="ic-modal-scrim" href="#" aria-label="Close" tabindex="-1"></a>
</div>
```

`.ic-modal:target` flips `display:none` → `display:grid`. The close link
and scrim link both navigate `href="#"`, clearing the target.

## no-nested-scrollbars

The modal card has **no** `max-height` + `overflow:auto`. A tall modal's
grid lets the page scroll behind it; the card grows and the **document's
own scrollbar** handles it. Same for accordion and tab panels — none get
an inner scroller.
