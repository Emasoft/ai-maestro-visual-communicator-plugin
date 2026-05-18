# Sub-technique G2 — Hover diagram / chart → code snippet panel

## Table of Contents

- [G2.1 The pattern](#g21-the-pattern)
- [G2.2 The markup](#g22-the-markup)
- [G2.3 The hover handler](#g23-the-hover-handler)
- [G2.4 The sliders writing to CSS variables](#g24-the-sliders-writing-to-css-variables)
- [G2.5 The snippet-template discipline](#g25-the-snippet-template-discipline)
- [G2.6 What this pattern is good for](#g26-what-this-pattern-is-good-for)
- [G2.7 What this pattern is NOT good for](#g27-what-this-pattern-is-not-good-for)
- [G2.8 The mouseleave default](#g28-the-mouseleave-default)
- [G2.9 Selection / commenting](#g29-selection--commenting)
- [G2.10 Light + dark verification](#g210-light--dark-verification)
- [G2.11 Tokens consumed](#g211-tokens-consumed)
- [G2.12 Mined source attribution](#g212-mined-source-attribution)

The lighter-weight cousin of [click-step-to-code-panel.md](./click-step-to-code-panel.md): HOVER any chart bar / diagram node → a
JSX-shaped code snippet renders below the visual with live token
values interpolated in. Mined from `06-component-variants.html` (html-
effectiveness catalog #6).

## G2.1 The pattern

A "design-token live preview" UX: the page has a SLIDER / RADIO /
CHECKBOX panel at the top, and a matrix of card-variant previews. The
sliders update CSS variables on `:root` in real time, re-skinning all
cards. Hovering any card variant fills in a JSX-shaped snippet at the
bottom of the page showing the current values.

The snippet is a TEMPLATE STRING with placeholders (e.g. `PAD`,
`BORDER`), and the hover handler runs `.replace(/PAD/g, padSliderValue)`
to interpolate live values.

## G2.2 The markup

```html
<section class="ve-token-preview">
  <div class="ve-token-preview__sliders">
    <label>Padding <input type="range" id="slider-pad" min="12" max="32" value="20"></label>
    <fieldset>
      <legend>Border</legend>
      <label><input type="radio" name="border" value="none">none</label>
      <label><input type="radio" name="border" value="hairline" checked>hairline</label>
      <label><input type="radio" name="border" value="solid">solid</label>
    </fieldset>
    <label><input type="checkbox" id="check-shadow"> Show shadow</label>
  </div>

  <div class="ve-token-preview__variants">
    <article class="ve-card-variant ve-card-variant--flat"     data-snippet="<Card variant='flat'     padding={PAD} border='BORDER' />">Flat</article>
    <article class="ve-card-variant ve-card-variant--outlined" data-snippet="<Card variant='outlined' padding={PAD} border='BORDER' />">Outlined</article>
    <article class="ve-card-variant ve-card-variant--elevated" data-snippet="<Card variant='elevated' padding={PAD} border='BORDER' />">Elevated</article>
    …
  </div>

  <aside class="ve-token-preview__snippet">
    <h4>JSX snippet for the hovered variant</h4>
    <div class="ve-code-block ve-code-panel-slate">
      <pre><code class="language-tsx" id="snippet-out">// hover any variant above</code></pre>
    </div>
  </aside>
</section>
```

## G2.3 The hover handler

```js
var padInput = document.getElementById('slider-pad');
var borderInputs = document.querySelectorAll('input[name="border"]');
var shadowInput = document.getElementById('check-shadow');

function currentValues() {
  var border = 'hairline';
  borderInputs.forEach(function (i) { if (i.checked) border = i.value; });
  return {
    pad: padInput.value,
    border: border,
    shadow: shadowInput.checked
  };
}

document.querySelectorAll('.ve-card-variant').forEach(function (card) {
  card.addEventListener('mouseenter', function () {
    var v = currentValues();
    var snippet = card.dataset.snippet
      .replace(/PAD/g, v.pad)
      .replace(/BORDER/g, v.border);
    document.getElementById('snippet-out').textContent = snippet;
    // Force re-tokenize
    var pre = document.getElementById('snippet-out').parentElement;
    pre.__veGutterInit = false;
    if (window.amvcpRuntime && window.amvcpRuntime.initCodeGutter) {
      window.amvcpRuntime.initCodeGutter(pre);
    }
  });
});
```

Same re-init dance as the click-to-panel pattern (see [click-step-to-
code-panel.md](./click-step-to-code-panel.md) §G1.5).

## G2.4 The sliders writing to CSS variables

```js
padInput.addEventListener('input', function () {
  document.documentElement.style.setProperty('--card-pad', padInput.value + 'px');
});
borderInputs.forEach(function (i) {
  i.addEventListener('change', function () {
    document.documentElement.style.setProperty('--card-border', i.value);
  });
});
shadowInput.addEventListener('change', function () {
  document.documentElement.style.setProperty('--card-shadow',
    shadowInput.checked ? '0 4px 12px rgba(0,0,0,0.08)' : 'none');
});
```

All 6 variants in the matrix use `padding: var(--card-pad)` etc.,
so a single var update re-flows the whole matrix. The hover fills in
the snippet with the CURRENT slider values — so the user sees
"here's what to write to get THIS visual".

## G2.5 The snippet-template discipline

The `data-snippet` attribute is a JSX-shaped string with PLACEHOLDER
TOKENS in caps (`PAD`, `BORDER`, `SHADOW`). The placeholders are NOT
JS template literals (`${pad}`) — using literals would require the
snippet to be a string-eval'd JS context, which is unsafe.

Plain string-replace is safer + simpler. The placeholders are tokens
the JS handler knows about; unknown tokens stay literal.

```html
<article data-snippet="<Card variant='flat' padding={PAD} border='BORDER' />">
```

The angle brackets, the `variant='flat'`, and the `<Card />` shape
are all literal text. Only `PAD` and `BORDER` are placeholders.

## G2.6 What this pattern is good for

- **Design-token live editor** — the canonical use case. Mined as
  "exactly the pattern for our future 'design-token live editor'
  panel".
- **Component prop explorer** — hover any variant → see the props
  needed to render it.
- **Chart-data inspector** — hover any bar / data point → see the
  data object that produced it.

## G2.7 What this pattern is NOT good for

- **Showing a long code block** — the snippet is for SHORT (1-5 line)
  fragments. For longer code, use a separate `<pre>` block.
- **Interactive editing** — the snippet is READ-ONLY. For editing,
  use the contenteditable editor pattern.
- **High-frequency hover** (mouse moving across many variants
  rapidly) — debounce with `requestAnimationFrame` to avoid re-
  init thrash on every mouseenter.

## G2.8 The mouseleave default

When the mouse leaves all variants, the snippet should fall back to
the LAST-HOVERED variant (not blank). Otherwise hovering off the
matrix erases the user's reference snippet:

```js
// No mouseleave handler — leaves the last hover content in place.
```

This is the LIGHTWEIGHT discipline: the snippet pane is informative,
not transient. The user's last hover is preserved as their working
context.

## G2.9 Selection / commenting

The snippet `<pre>` is a normal runtime-managed `.ve-code-block`.
Lines are selectable. The reader can copy the snippet via the runtime's
copy button (or via native browser copy after a text-select).

Comment payload includes the active variant's name (in `card.dataset`)
so the agent knows which component variant the snippet is for.

## G2.10 Light + dark verification

- [ ] Slider / radio / checkbox controls readable on both themes
- [ ] Card variants visible on both themes (the var updates affect
      them via CSS)
- [ ] Snippet panel readable on both themes (slate-bg pattern)
- [ ] Hover re-tokenize works on both themes

## G2.11 Tokens consumed

- All from [slate-bg-code-panel.md](./slate-bg-code-panel.md)
- The user-controlled tokens (`--card-pad`, `--card-border`, etc.) are
  declared on `:root` by the JS handler — these are CONSUMED by the
  visual variants, not by this snippet pattern itself

## G2.12 Mined source attribution

Catalog quote, source `06-component-variants.html`:

> *"Hovering any variant copies its props into the JSX snippet panel
> at the bottom (with the live PAD/BORDER values interpolated in). The
> hover→snippet binding reads `card.dataset.snippet` (a JSX-shaped
> string with PAD and BORDER placeholders) and `.replace(/PAD/g,
> pad.value)` injects the current values."*

> *"DESIGN.md-priority. This is the exact pattern for our future
> 'design-token live editor' panel: sliders/radios writing to CSS
> custom properties on `:root`, and downstream blocks instantly re-
> skinning."*

Adopted as the canonical hover-to-snippet pattern.
