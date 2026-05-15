# Filter pills / segmented control

A horizontal bar of pills; clicking a pill shows the content tagged with
that pill's tag and hides the rest. Shares the `:checked` CSS spine with
the tabs, so the show/hide is pure CSS — works with JS off.

## HTML skeleton

```html
<div class="ic-filterbar" data-ic-persist data-id="findings-filter"
     role="radiogroup" aria-label="Filter findings">
  <span class="ic-pill-group">
    <input class="ic-pill-radio" type="radio" name="findings-filter"
           id="flt-all" value="*" checked>
    <label class="ic-pill" for="flt-all">All
      <span class="ic-pill-count"></span></label>
    <input class="ic-pill-radio" type="radio" name="findings-filter"
           id="flt-bug" value="bug">
    <label class="ic-pill" for="flt-bug">Bugs
      <span class="ic-pill-count"></span></label>
  </span>
</div>
<div class="ic-filtered" data-filter-tag="bug">  … bug item …  </div>
<div class="ic-filtered" data-filter-tag="perf"> … perf item … </div>
```

## `display:contents` — the transparent wrapper

`.ic-pill-group` wraps the radios+labels so the markup is groupable, but
`display:contents` makes the wrapper visually transparent — the pills
become direct flex children of `.ic-filterbar` without an extra layout
box. This is the IC-03 technique.

## Show/hide — CSS-only baseline

Because the radios share a `name` and precede the `.ic-filtered` blocks,
one general-sibling rule per filter drives visibility. The renderer emits
into the scaffold's `<style>`, for each filter value:

```css
/* "All" shows everything: */
#flt-all:checked ~ .ic-filtered { display:block; }
/* a specific filter shows only matching tags: */
#flt-bug:checked ~ .ic-filtered                       { display:none; }
#flt-bug:checked ~ .ic-filtered[data-filter-tag="bug"] { display:block; }
```

## JS-enhanced layer

`amvcp-interactive.js` adds, on top of the CSS-only path:

- restores the active filter from localStorage on boot;
- saves it on `change` and fires `ic:filter-change`;
- fills each `.ic-pill-count` badge with how many `.ic-filtered` blocks
  carry that pill's tag (`*` counts every block).

The CSS-only path fully works with JS off — only persistence + counts
need JS.

## no-nested-scrollbars

The pill bar `flex-wrap:wrap`s to multiple rows rather than introducing a
horizontal scroller. Never `overflow-x:auto` the bar.
