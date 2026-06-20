# Sub-technique A6 — Per-line atom selection + the 9-level multi-click ladder

## Table of Contents

- [A6.1 What the runtime ships](#a61-what-the-runtime-ships)
- [A6.2 The 9-level multi-click ladder (code variant)](#a62-the-9-level-multi-click-ladder-code-variant)
- [A6.3 The drag-paint contract](#a63-the-drag-paint-contract)
- [A6.4 The selection payload (the comment-pill format)](#a64-the-selection-payload-the-comment-pill-format)
- [A6.5 The comment pill](#a65-the-comment-pill)
- [A6.6 The hover hint (preview state)](#a66-the-hover-hint-preview-state)
- [A6.7 The yield rule (CRITICAL — re-stated)](#a67-the-yield-rule-critical--re-stated)
- [A6.8 Author rules](#a68-author-rules)
- [A6.9 The accessibility surface](#a69-the-accessibility-surface)
- [A6.10 Tokens consumed (selection-specific)](#a610-tokens-consumed-selection-specific)

Every `.ve-code-line` IS a selectable atom — selectable, commentable,
drag-paintable, multi-clickable. This reference codifies the contract
the runtime ships and the rules a code-display reference must respect.

Phase 2.5 (TRDD-352ef46a) confirmed code lines as atoms equivalent to
prose paragraphs and table rows — the multi-click ladder applies to
code lines exactly as it does to prose.

## A6.1 What the runtime ships

- **Single-line selection.** `mousedown` on the `.ve-code-linenum`
  cell (the gutter number) toggles `data-ve-pressed="1"` on the parent
  `.ve-code-line` span.
- **Drag-paint selection.** `mousedown + mousemove` across multiple
  `.ve-code-linenum` cells paints `data-ve-preview="1"` on every line
  the drag crosses; `mouseup` commits the previewed range to `data-ve-
  pressed="1"`.
- **3-state block visual.** The wrapping `.ve-code-block` reads
  `:has(.ve-code-line[data-ve-pressed="1"])` to switch its outline
  state between normal / hover-unselected / selected / hover-over-
  selected. See [block-3-state-model.md](../../amvcp-code-syntax-chrome/references/block-3-state-model.md).
- **Token-yield CSS.** Selected lines force every descendant
  `.ve-tok-*` span to `color: inherit` so tokens read against the
  selection bg. See [token-roles-palette.md](./token-roles-palette.md)
  §A2.6.

## A6.2 The 9-level multi-click ladder (code variant)

The runtime's multi-click ladder operates on every selectable atom.
For code, the levels collapse onto natural code units:

| Click count | Selects | Notes |
|---|---|---|
| 1× | the clicked `.ve-code-line` (one line) | The atomic unit. |
| 2× | the indent-block containing the line | "Indent block" = consecutive lines whose `--ve-code-indent` is ≥ the clicked line's indent; same as the inside of a function body. |
| 3× | the smallest "logical block" surrounding the line | First leading-whitespace=0 line above + everything beneath it until the next 0-indent line. Typical: a whole function. |
| 4× | the whole `.ve-code-block` | All lines in the `<pre>`. |
| 5× | + the immediately-preceding heading or `<p>` | If the code block is part of an annotated callout (e.g. `<h3>Function X</h3><pre>...</pre>`), grab the heading too. |
| 6× | + the surrounding `<details>` | If the code block is inside `<details>`, the whole disclosure. |
| 7× | + the surrounding section (e.g. `<section>`) | The whole prose+code section the block lives inside. |
| 8× | the whole article/main | Everything in `<main>`. |
| 9× | the whole document | Page-level. |

Each subsequent click WIDENS the selection while preserving the
existing selection's start. This matches the prose multi-click ladder
exactly — the only code-specific levels are 2× (indent block) and 3×
(logical block); levels 4-9 are the standard "atom → ancestor
chain" climb.

## A6.3 The drag-paint contract

`mousedown` on `.ve-code-linenum` starts a drag. The runtime captures
the pointer (`setPointerCapture`) and listens for `pointermove`. On
each move, `elementFromPoint(x, y)` resolves the line under the
pointer and toggles `data-ve-preview="1"` on every line between the
drag-start line and the current line.

`mouseup` commits the previewed range: every previewed line gets
`data-ve-pressed="1"`; every non-previewed line is left unchanged.
**Existing pressed lines are NOT cleared** — the drag adds to the
selection (Shift+drag) or replaces it (plain drag), per the runtime's
selection model.

The full-height absolute `.ve-code-linenum` bbox (see
[gutter-anatomy.md](./gutter-anatomy.md) §A3.4) is what makes drag-paint
reliable. A 14px-tall intrinsic linenum would miss any drag that
passes through a wrapped line's continuation rows; the full-height
bbox guarantees the leftmost column always catches the pointer.

## A6.4 The selection payload (the comment-pill format)

When a line (or range) is selected and the comment pill is clicked,
the payload sent to the parent agent is the same shape as a prose
selection:

```json
{
  "kind": "code",
  "blockId": "veblock-3",
  "lang": "typescript",
  "lines": [
    { "n": 42, "text": "function hello (name) {" },
    { "n": 43, "text": "  return 'Hello, ' + name;" },
    { "n": 44, "text": "}" }
  ],
  "selection": {
    "startLine": 42,
    "endLine": 44,
    "ladder": 3
  }
}
```

- `blockId` is the runtime's auto-assigned `data-ve-block-id` (a
  stable per-block string)
- `lang` is the resolved language id (`null` if undeclared)
- `lines` are the byte-exact source lines (no token-span markup)
- `ladder` is the multi-click level the selection corresponds to
  (1 = single line, 4 = whole block, etc.) — lets the agent know
  whether the user asked about "this line" or "this block"

## A6.5 The comment pill

When ≥ 1 line is selected, a small pill renders just outside the
block's top-right corner (or inline next to the selection start, per
the runtime's anchor logic). Clicking the pill emits the payload above
to the parent agent via the runtime's `bridgePostMessage` channel.

The pill is the EXACT same visual as the prose comment pill — same
shape, same colour, same hover affordance. The reader transfers their
mental model of "click the pill to ask the agent about this" from
prose to code with no friction.

See `scripts/amvcp-runtime.js → mountCommentPill` for the pill's
positioning + visibility rules.

## A6.6 The hover hint (preview state)

While drag-painting, every previewed line gets `data-ve-preview="1"`,
which renders as a softer accent tint (18% vs 28% bg, 60% vs 100%
gutter accent). The reader sees the in-flight selection BEFORE
committing on mouseup — they know exactly what they're about to
select.

The preview-state pill, if it appears, is also softer (50% opacity)
— a visual promise of "if you release here, this is what you'll
comment on".

## A6.7 The yield rule (CRITICAL — re-stated)

The integrity-probe-friendly tokenization means selected lines have
inline `<span class="ve-tok-*">` children. By default, those children
have their own `color:` declarations — which would render the tokens
in their syntax-colour AGAINST the selection's accent-tinted bg,
making them muddy / unreadable.

The yield rule:

```css
.ve-code-line[data-ve-pressed="1"] .ve-tok-keyword,
.ve-code-line[data-ve-pressed="1"] .ve-tok-string,
/* … all 12 roles … */
{ color: inherit; }
```

Plus the same rule for `[data-ve-code-sel]` and `[data-ve-code-sel-
block]` markers (older / forward-compat selection markers).

After the yield rule, every selected-line token inherits the
`.ve-code-content`'s default colour, which renders cleanly against the
accent bg. Tokens are still grouped by their span boundaries (so a
post-yield highlight pass — say, "highlight the function name within
the selected lines" — still has spans to target), but their colour is
the selection-readable colour.

## A6.8 Author rules

| Rule | Why |
|---|---|
| Author plain `<pre><code class="language-x">…</code></pre>` | The runtime owns the per-line atoms. Hand-authoring `.ve-code-line` spans defeats `initCodeGutter`. |
| Do NOT add `tabindex` to `.ve-code-line` | The runtime sets the right focus/tabindex behaviour; overrides break drag-paint. |
| Do NOT bind a click handler to the gutter `.ve-code-linenum` | Same. The runtime's listener is exclusive. |
| Use `data-ve-no-gutter` to opt out completely (no selection, no gutter, no copy) | The three ship as one unit. |
| If you need a static, non-interactive code display, use `data-ve-no-gutter` AND a page-CSS rule to hide the comment pill machinery | Rare — most readers expect to be able to ask about lines. |

## A6.9 The accessibility surface

- Each `.ve-code-line` gets a `tabindex="0"` from the runtime, so
  keyboard users can `Tab` into the block and `Space` / `Enter` to
  toggle selection on the focused line.
- Arrow keys move focus between sibling lines.
- `Shift + Arrow` extends the selection (same model as text editors).
- The selection's accent bg passes WCAG AA contrast against tokens
  via the yield rule (otherwise tokens at lightness ~70% on accent at
  lightness ~50% would fail).

## A6.10 Tokens consumed (selection-specific)

- `--ve-accent` — the selection bg tint (28% / 18% via `color-mix`)
- `--ve-sel-text` — the dark-on-accent text colour for the gutter
  cell
- `--ve-glow-hover` — the hover ring on a selected block (the 3-state
  model)

See [block-3-state-model.md](../../amvcp-code-syntax-chrome/references/block-3-state-model.md) for the visual
state machine the selection drives.
