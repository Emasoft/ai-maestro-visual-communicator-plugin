# Sub-technique C3 — Single-keyword arrow highlight ("look at THIS token")

When a code block contains one token / keyword that the surrounding
prose is asking the reader to focus on, this pattern HIGHLIGHTS that
token with the accent gold + a small SVG arrow rendered in the gutter.

Mined from the html-effectiveness catalog's "hand-wrap with `hl` class"
pattern, elevated to a first-class focus affordance.

## C3.1 What it does

Within a code block (either tokenizer-rendered or hand-wrapped), one
token / range carries `<span class="ve-hl-focus">…</span>` (or
`class="hl"` in the hand-wrap variant). The class:

- Renders the token in full accent gold (not the dimmer ve-code-* role
  color).
- Adds a subtle 1-2px underline.
- Optionally, the surrounding prose's `<code class="inline">` mention
  of the same identifier gets a matching `data-ve-link-to-focus="X"`
  attribute that JS uses to scroll the focus into view on click.

The pattern signals "the thing the prose is talking about lives HERE
in the code".

## C3.2 The markup (tokenizer variant)

```html
<p>The <code class="inline" data-ve-link-to-focus="useDebounce-arg">300ms debounce</code>
   is the only difference between this hook and the naïve version.</p>

<pre><code class="language-typescript">export function useSearch (query: string) {
  const debounced = useDebounce(query, <span class="ve-hl-focus" id="useDebounce-arg">300</span>);
  return useQuery(['search', debounced]);
}</code></pre>
```

Critical: the `<span class="ve-hl-focus">` is INSIDE the `<code>` — but
the runtime's `initCodeGutter` REFUSES to wrap a `<code>` whose
children > 0. So the author has TWO paths:

**Path A — opt out of the gutter:** add `data-ve-no-gutter` and use the
hand-wrap 4-class approach (`hl` class). Loses gutter + copy button +
selection. Acceptable for short focus snippets.

**Path B — post-render injection:** let the tokenizer render normally,
then a JS post-pass finds tokens by source-line + offset and adds the
`ve-hl-focus` class to the appropriate `<span class="ve-tok-*">`. The
runtime's gutter still works (the JS post-pass runs AFTER
`initCodeGutter`). The injection runs in the runtime's
`bootEverything()` chain.

For most use cases, Path A is simpler. Path B is for "explainer
docs" where the gutter is load-bearing.

## C3.3 The CSS

```css
.ve-hl-focus {
  color: var(--ve-accent, #b8861f);
  font-weight: 600;
  border-bottom: 1.5px solid var(--ve-accent, #b8861f);
  padding-bottom: 1px;
  transition: background 200ms ease;
}
.ve-hl-focus:target,                          /* :target when URL anchors here */
.ve-hl-focus[data-ve-focused="1"] {           /* manual focus from a link */
  background: color-mix(in srgb, var(--ve-accent) 24%, transparent);
  padding: 1px 3px;
  border-radius: 3px;
  animation: ve-hl-pulse 1.4s ease-out forwards;
}
@keyframes ve-hl-pulse {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--ve-accent) 60%, transparent); }
  100% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--ve-accent)  0%, transparent); }
}
```

The pulse animation is the "you just landed here" affordance — the
reader's eye is drawn to the focused token without a layout shift.

Light + dark theming is automatic (the `--ve-accent` token resolves to
the theme-appropriate gold).

## C3.4 The link-to-focus JS

```js
document.querySelectorAll('[data-ve-link-to-focus]').forEach(function (link) {
  link.addEventListener('click', function (ev) {
    var targetId = link.dataset.veLinkToFocus;
    var target = document.getElementById(targetId);
    if (!target) return;
    ev.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.setAttribute('data-ve-focused', '1');
    setTimeout(function () { target.removeAttribute('data-ve-focused'); }, 1400);
  });
});
```

8 lines of JS. Smooth-scrolls the focus into view + adds the pulse
animation marker for 1.4s. Same pattern as the catalog's
`03-code-review-pr.html` "risk-map chip → file card pulse" navigation
(adapted from §A.10's mined catalog entry).

## C3.5 The :target variant (URL anchor)

If the page is read from a deep-link (the URL ends in `#useDebounce-
arg`), the `:target` pseudo-class triggers the same pulse — no JS
needed. Both paths converge on the same visual.

## C3.6 Selection contract

A `ve-hl-focus` span IS NOT a `.ve-code-line` atom. It doesn't
participate in the selection model. The selection still works on the
CONTAINING line — selecting that line yields the token's colour to the
selection bg (via the yield rule, see
[token-roles-palette.md](./token-roles-palette.md) §A2.6). The focus
visual REMAINS visible inside the selection (the bottom-border stays).

## C3.7 When to use

| Use this when… | Use something else when… |
|---|---|
| One token in a block is the centre of the prose's argument | The whole block matters equally → no focus class |
| Multiple FOCUSES are needed → use 1 per code block, but link them by ID through the prose | Many concurrent focuses → use multiple smaller blocks each with one focus |
| The reader needs to navigate from prose to code → link-to-focus | The reader can find the token visually → bare visual focus, no link |
| The focused token is short (1-3 tokens) | The focused range is several lines → use `data-ve-hl-block` (a different mechanism, see [block-3-state-model.md](./block-3-state-model.md)) |

## C3.8 Don't overuse

One `ve-hl-focus` per code block. Two or more = visual cacophony, the
reader doesn't know which is "the" focus. If you genuinely need two,
split into two blocks.

The focused token should be SHORT (1 token, occasionally a 2-3 token
phrase). Highlighting a whole line is the wrong tool — use a per-line
selection marker instead.

## C3.9 Accessibility

- The pulse animation respects `prefers-reduced-motion`: the keyframe
  animation falls back to a static accent bg with no movement.
- The focused span has no role / aria-label — it's a visual emphasis,
  not a semantic role. Screen readers announce the surrounding code.
- The link-to-focus is an `<a href="#...">` (anchor-link semantics) +
  JS enhancement. Without JS, the browser jumps to the `id` and the
  `:target` rule provides the visual.

## C3.10 Tokens consumed

- `--ve-accent` — the focus colour + pulse glow
- The pulse keyframe uses `color-mix` over `--ve-accent` for the fade

## C3.11 Author rules

| Rule | Why |
|---|---|
| One `ve-hl-focus` per block, max | Visual emphasis principle |
| Always pair with a prose mention that links to it | The focus class is a NAVIGATION target, not just colour |
| Use a stable, semantic `id` (`useDebounce-arg`, not `focus-1`) | Survives prose edits / re-orderings |
| Honour `prefers-reduced-motion` for the pulse | Accessibility |
| Don't combine with `<span class="hl">` (the 4-class variant) | `hl` is the hand-wrap version of the same idea — pick one per block |
