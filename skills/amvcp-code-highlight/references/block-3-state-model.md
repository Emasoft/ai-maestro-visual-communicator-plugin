# Sub-technique B1 — The 3-state code-block visual model

The wrapping `.ve-code-block`'s four visual states (normal / hover-
unselected / selected / hover-over-selected) and the CSS `:has()`
selector chain that drives them — without overriding the runtime's
generic atom-hover overlay. From `scripts/amvcp-runtime.js →
injectStyles()`.

## B1.1 The four states

| State | Selector | Visual |
|---|---|---|
| **Normal** | `.ve-code-block > pre` | 1px brown border, no glow, no outline, host-page interior color (no bg override). |
| **Hover-unselected** | `.ve-code-block:hover:not(:has(.ve-code-line[data-ve-pressed="1"])) > pre` | 2px accent-tinted outline (60% mix) + 16px halo (45% mix). Signals "you can click a line here". |
| **Selected** (≥1 line pressed) | `.ve-code-block:has(.ve-code-line[data-ve-pressed="1"]) > pre` | 2px solid accent outline (no glow). Strong, focused. |
| **Hover-over-selected** | `.ve-code-block:hover:has(.ve-code-line[data-ve-pressed="1"]) > pre` | 2px solid accent outline + 20px halo (60% mix). "You can extend the selection here". |

All four states transition together via:

```css
.ve-code-block { transition: box-shadow 120ms ease, outline-color 120ms ease; }
.ve-code-block > pre { transition: outline-color 120ms ease, box-shadow 120ms ease; }
```

120ms is the project's standard responsive-interactive duration — fast
enough to feel snappy, slow enough not to flash.

## B1.2 Why `:has()` and not a JS class toggle

The runtime's selection model sets `data-ve-pressed="1"` on individual
`.ve-code-line` spans. The block-level visual reads from there via
CSS `:has()` instead of duplicating state to the wrapper:

- One source of truth — the per-line marker IS the selection state.
- No JS sync — adding a sibling-class-toggle adds a desync surface.
- `:has()` supports `:not(:has(…))` for "block has NO selected lines"
  — exactly the discriminator the hover-unselected state needs.

`:has()` is supported in Chromium 105+ (2022) and Safari 15.4+ (2022)
— well within the runtime's supported-browser matrix (which includes
iTerm2's WKWebView via Safari 15.4).

## B1.3 The CSS-variable neutralization trick

The `<pre>` carries a `data-ve-id` (the runtime stamps every
selectable atom). Without intervention, the generic
`[data-ve-id]:hover` rule applies to it too — and that rule sets a
background overlay, a glow, and a brightness filter that look correct
on a paragraph but ugly on a code block.

The fix: neutralize those generic side-effects with LOCAL CSS-variable
overrides on the `<pre>`:

```css
.ve-code-block > pre {
  margin: 0;
  counter-reset: ve-code-line;
  border: 1px solid var(--ve-accent, #b8861f);
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  -webkit-backdrop-filter: blur(1.5px);
  backdrop-filter: blur(1.5px);
  --ve-overlay-hover: transparent;
  --ve-overlay-selected: transparent;
  --ve-glow-hover: none;
  --ve-brightness-hover: 1;
  --ve-brightness-selected: 1;
}
```

The five `--ve-*` overrides at the bottom neutralize the generic atom-
hover rule's overlay / glow / brightness side-effects. The hover
affordance for the code block is the **outline + halo**, not an
overlay — these overrides ensure only the outline rule (defined
above) applies.

## B1.4 The 1.5px backdrop-filter — why it's there

`backdrop-filter: blur(1.5px)` is **just** enough to soften the body-
grid lines (the blueprint theme) under the `<pre>` without erasing
them. Earlier 6px was too aggressive — the grid disappeared completely.
1.5px reads as a "frosted glass" effect, distinguishing the code
surface from the page bg without hiding the page bg's identity.

Browsers that don't support `backdrop-filter` (older Firefox) gracefully
skip the property; the code block renders without the frost, still
correct.

## B1.5 The `!important` rationale

State rules use `!important`:

```css
.ve-code-block:hover:not(:has(.ve-code-line[data-ve-pressed="1"])) > pre {
  outline: 2px solid color-mix(in srgb, var(--ve-accent, #b8861f) 60%, transparent) !important;
  outline-offset: 3px !important;
  box-shadow: 0 0 16px color-mix(in srgb, var(--ve-accent, #b8861f) 45%, transparent) !important;
}
```

The generic `[data-ve-id]:hover` rule sets `outline` unconditionally.
CSS specificity ties between the two selectors (both are `:hover` +
attribute-selector level), so SOURCE ORDER wins — and the generic rule
appears AFTER the code-block rule in `injectStyles()`. `!important`
forces the code-block rule to win regardless of order.

This is a documented exception to the project's "avoid `!important`"
guideline — the alternative is reordering `injectStyles()`, which
would couple the code-block CSS to the runtime's emission sequence.

## B1.6 Why the outline + halo, not a bg fill

A background fill on the wrapper would:
- override the blueprint theme (the graph-paper grid would disappear),
- override the host page's `surface` color,
- compete with the per-line `data-ve-pressed` selection bg tint.

An outline + halo:
- doesn't touch the interior,
- composes with the blueprint theme,
- complements (not competes with) the per-line selection tint.

The chosen visual reads as "this block is alive / clickable" without
restyling the block's identity.

## B1.7 The 4 states in dev-tools

To verify in the browser:

1. Open a fixture with at least one code block.
2. Hover the block (NOT a specific line yet) — the wrapper should
   render with state 2 (accent-tinted outline + halo).
3. Click any `.ve-code-linenum` — state changes to state 3 (solid
   outline, no halo).
4. Move the mouse off the block while keeping the selection — state
   stays at state 3 (selection survives).
5. Move the mouse back over the block — state 4 (solid outline + halo).
6. Click the same `.ve-code-linenum` again — selection clears, state
   returns to 2 (hover-unselected).

If state 2 doesn't show, the CSS-variable overrides are missing or
the generic rule's `!important` is winning — check
`injectStyles()` for the exact CSS emission.

## B1.8 Per-line vs block-level visual responsibility

| Concern | Owner |
|---|---|
| Block outline / halo (4 states) | This reference — `.ve-code-block > pre` |
| Per-line pressed bg tint | Per-line `[data-ve-pressed="1"]` rule — see `gutter-anatomy.md` |
| Per-line preview bg tint | Per-line `[data-ve-preview="1"]` rule — see `gutter-anatomy.md` |
| Token colour inside selected lines | The yield rule — see `token-roles-palette.md` §A2.6 |
| The comment pill | Runtime's `mountCommentPill` |

The four are layered: the block outline tells the reader the block is
interactive; the per-line tint shows WHICH lines are selected; the
yield rule keeps tokens readable inside the selection; the pill
provides the action.

## B1.9 Multi-block pages

Every block has its own state machine. A page with 5 blocks can have:
- block 1 in state 1 (normal)
- block 2 in state 4 (hover-over-selected, 3 lines pressed)
- block 3 in state 2 (hover-unselected — the pointer is here)
- block 4 in state 3 (selected, pointer left)
- block 5 in state 1

…simultaneously, each transitioning independently at 120ms. There's
no global "active block" — every block is autonomous.

This matters for compositions (PR review, postmortems, explainer) that
render many blocks: the reader can pin selections on multiple blocks
and the page handles it correctly.

## B1.10 Tokens consumed

- `--ve-accent` — outline + halo colour (mixed at 60% / 45% / 60% via
  `color-mix`)
- `--ve-overlay-hover` / `--ve-overlay-selected` / `--ve-glow-hover` /
  `--ve-brightness-hover` / `--ve-brightness-selected` — overridden
  locally to neutralize the generic hover side-effects

## B1.11 Don't override

Authors SHOULD NOT add page-stylesheet rules that:
- set `background` on `.ve-code-block > pre` (overrides the host page
  bg + the blueprint theme)
- set `outline` on `.ve-code-block > pre` without the 4-state
  conditions (breaks the state machine)
- target `[data-ve-id]:hover` directly on a `<pre>` (the runtime
  already neutralizes this — re-enabling it brings back the ugly
  overlay)

If a fixture genuinely needs a different visual (e.g. an inverted
slide deck where code blocks should be dark-on-dark), the right path
is a DESIGN.md theme override that changes `--ve-accent` — not local
CSS that re-enters the same machinery.
