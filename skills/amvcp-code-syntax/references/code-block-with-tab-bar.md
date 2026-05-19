# Sub-technique B5 — Code block with tab-bar header

## Table of Contents

- [B5.1 What it does](#b51-what-it-does)
- [B5.2 The canonical use cases](#b52-the-canonical-use-cases)
- [B5.3 The markup](#b53-the-markup)
- [B5.4 The 6-line JS handler](#b54-the-6-line-js-handler)
- [B5.5 The CSS](#b55-the-css)
- [B5.6 The active-tab indicator](#b56-the-active-tab-indicator)
- [B5.7 Composing with file-path / language-icon](#b57-composing-with-file-path--language-icon)
- [B5.8 Visual state during runtime selection](#b58-visual-state-during-runtime-selection)
- [B5.9 The single-pane fallback (no JS)](#b59-the-single-pane-fallback-no-js)
- [B5.10 The `data-ve-no-gutter` opt-out per tab](#b510-the-data-ve-no-gutter-opt-out-per-tab)
- [B5.11 When NOT to use](#b511-when-not-to-use)
- [B5.12 Tokens consumed](#b512-tokens-consumed)
- [B5.13 Mined source: `14-research-feature-explainer.html`](#b513-mined-source-14-research-feature-explainerhtml)

A tab-bar above a code block lets one container present multiple
variants (multiple files for the same change, before/after, multiple
languages). Mined from `14-research-feature-explainer.html` — the
canonical "tabbed code panel" pattern.

## B5.1 What it does

Renders 2-5 tabs above a single code panel; clicking a tab swaps which
`<pre>` is visible. All `<pre>`s live in the DOM at once; the tab
toggles a `.on` class that drives `display: block`.

The pattern is **stateful**: the current tab is rendered, others are
`display: none`. Selection / copy / link / scroll-to-line all work on
the visible tab; switching tabs preserves the other tabs' state
(scroll position is irrelevant per the no-nested-scroll rule).

## B5.2 The canonical use cases

| Scenario | Tabs |
|---|---|
| Same change from N angles | `limits.yaml` / `route.ts` / `client-response.json` (3-perspective config example) |
| Before / After | `Before` / `After` |
| Multiple language ports | `Python` / `TypeScript` / `Go` |
| Implementation variants | `Inline useEffect` / `Custom hook` / `use-debounce lib` |
| Output variants | `JSON` / `YAML` / `TOML` (same data, three formats) |

Each tab MUST show fundamentally the SAME thing (the same change, the
same concept, the same input expressed differently). If the tabs show
DIFFERENT things, use separate code blocks, not tabs — tabs imply
"these are equivalents".

## B5.3 The markup

```html
<div class="ve-code-tabs" data-ve-code-tabs>
  <div class="ve-code-tabs__bar" role="tablist">
    <button type="button" class="ve-code-tabs__btn on" data-t="0" role="tab" aria-selected="true">limits.yaml</button>
    <button type="button" class="ve-code-tabs__btn"    data-t="1" role="tab" aria-selected="false">route.ts</button>
    <button type="button" class="ve-code-tabs__btn"    data-t="2" role="tab" aria-selected="false">client-response.json</button>
  </div>
  <div class="ve-code-tabs__panels">
    <pre class="on" data-pane="0"><code class="language-yaml">…</code></pre>
    <pre        data-pane="1"><code class="language-typescript">…</code></pre>
    <pre        data-pane="2"><code class="language-json">…</code></pre>
  </div>
</div>
```

Key attributes:
- `data-ve-code-tabs` on the container — opts into the tab-handler.
- `data-t="N"` on each button — the tab index.
- `data-pane="N"` on each `<pre>` — matches the tab index.
- `.on` on the active button + the active `<pre>` — initial state.
- `role="tablist"` / `role="tab"` / `aria-selected` — accessibility
  (the runtime hooks the `aria-selected` toggle automatically).

## B5.4 The 6-line JS handler

```js
document.querySelectorAll('[data-ve-code-tabs]').forEach(function (root) {
  root.querySelectorAll('.ve-code-tabs__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var i = btn.dataset.t;
      root.querySelectorAll('.on').forEach(function (el) {
        el.classList.remove('on');
        if (el.tagName === 'BUTTON') el.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('on');
      btn.setAttribute('aria-selected', 'true');
      var pane = root.querySelector('[data-pane="' + i + '"]');
      if (pane) pane.classList.add('on');
    });
  });
});
```

Six lines of logic. Mined directly from the catalog (`14-research-
feature-explainer.html`'s tab handler) — the simplest correct
implementation.

Runs at `DOMContentLoaded` (in the runtime's `bootEverything`).
Adding a `data-ve-code-tabs` block at any time and re-running the
initializer is fine; it's idempotent (re-attaching a listener to the
same button replaces the previous one).

## B5.5 The CSS

```css
.ve-code-tabs {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ve-accent, #b8861f);
  border-radius: var(--vc-radius-md, 12px);
  overflow: hidden;       /* clips the inner corners — NOT a scroll surface */
}
.ve-code-tabs__bar {
  display: flex;
  flex-wrap: wrap;        /* tabs wrap, NEVER scroll horizontally */
  gap: 2px;
  background: var(--vc-color-neutral-100);
  border-bottom: 1px solid var(--ve-accent);
}
.ve-code-tabs__btn {
  appearance: none;
  border: none;
  background: transparent;
  font-family: var(--vc-font-mono);
  font-size: var(--vc-text-small);
  color: var(--vc-color-neutral-500);
  padding: 8px 14px;
  cursor: pointer;
  transition: color 120ms ease, background 120ms ease;
  border-bottom: 2px solid transparent;
}
.ve-code-tabs__btn:hover {
  color: var(--vc-color-neutral-700);
  background: var(--vc-color-neutral-50);
}
.ve-code-tabs__btn.on {
  color: var(--ve-accent);
  background: var(--vc-color-neutral-50);
  border-bottom-color: var(--ve-accent);
}
.ve-code-tabs__panels > pre { display: none; }
.ve-code-tabs__panels > pre.on { display: block; }
```

**The `overflow: hidden` on `.ve-code-tabs`** clips the inner corners —
it does NOT introduce a scrollbox (no `overflow: auto`). This is the
single permitted use of `overflow: hidden` in code-display chrome.

**`flex-wrap: wrap`** on the tab bar: with 7 tabs on a 320px screen,
the tabs wrap to a second row. They NEVER introduce a horizontal
scrollbar (no-nested-scrollbars rule).

## B5.6 The active-tab indicator

The active tab gets `border-bottom: 2px solid var(--ve-accent)` — a
classic underline indicator that doesn't shift layout. The 2px height
matches the project's standard active-state visual (used by nav links,
selected tabs in other UI).

Color is the accent gold — the same colour the gutter selection uses,
so the reader's "this is the active thing" mental model transfers.

## B5.7 Composing with file-path / language-icon

Each tab button's text is typically a file path or a perspective name.
For a file-path tab, the path label IS the tab — no separate
`.ve-code-path` inside the panel. Don't double-up.

For a perspective name (`Before` / `After`), add an inline file-type
icon to the tab if useful:

```html
<button type="button" class="ve-code-tabs__btn on" data-t="0">
  <svg width="12" height="12" aria-hidden="true">…</svg>
  Before
</button>
```

## B5.8 Visual state during runtime selection

Selection state on `.ve-code-line` inside a tab panel:
- Lives on the line, not on the panel.
- Survives a tab switch (the line keeps `data-ve-pressed="1"` when
  hidden; reappears when the tab is re-shown).
- The 3-state block visual reads from the CURRENTLY-VISIBLE `<pre>`
  via CSS (`:has()` walks the visible DOM).

Authors should NOT rely on hidden-tab selection being announced; the
selection IS preserved but it's not visible until the tab is shown.

## B5.9 The single-pane fallback (no JS)

The runtime requires JS for the tab switch. With JS disabled:
- All panes are `display: none` per the CSS.
- The first pane has `.on` per the markup → it's visible.
- Other panes are HIDDEN — never shown.

This is acceptable degradation: the reader sees the first tab's
content, which by convention should be the primary/canonical one. The
tab bar is still visible but clicking does nothing.

For a fully JS-free fallback, render an `<input type="radio">` +
`label` pattern instead — but that's heavier markup for a rare case.

## B5.10 The `data-ve-no-gutter` opt-out per tab

Some tab variants might be data, not code (a YAML config vs a JSON
output). Both are fine for the gutter / selection / copy treatment.
Don't opt out unless the content is genuinely non-code (e.g. a SVG
preview tab — rare).

## B5.11 When NOT to use

| Don't use tabs when… | Use instead… |
|---|---|
| The tabs would show fundamentally different content (not equivalents) | Separate code blocks |
| There are > 5 tabs | Compose a `<details>` per variant, or a side menu — tabs at 6+ feels cramped |
| The reader needs to compare two variants side-by-side | A 2-column layout — `compare-n-approaches.md` |
| The variants are tiny (one-liners) | Inline chips, no tab machinery |

## B5.12 Tokens consumed

- `--ve-accent` — active tab underline + bar color
- `--vc-color-neutral-100` / `-50` / `-500` / `-700` — bar + button neutrals
- `--vc-font-mono` — button text font
- `--vc-text-small` — button text size
- `--vc-radius-md` — outer radius

## B5.13 Mined source: `14-research-feature-explainer.html`

The catalog entry says: *"The **tabbed code panel** (3 perspectives on
the same change: yaml → route.ts → client response) is the cleanest way
to show 'the same thing from 3 angles' without a wall of code. Adopt
this exact 6-line tab pattern in our `amvcp-prose-pages` and `amvcp-
code-highlight`."*

This reference is the adoption. The 6-line JS handler in §B5.4 is the
literal pattern from `14-research-feature-explainer.html`'s source.
