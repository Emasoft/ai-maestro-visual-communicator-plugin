# Selection and comment — the FIXED Interaction Mode

## Table of Contents

- [What it does](#what-it-does)
- [The FIXED Interaction Mode](#the-fixed-interaction-mode)
- [The atom contract](#the-atom-contract)
- [Plain click vs Alt-click](#plain-click-vs-alt-click)
- [The comment round-trip = "editable"](#the-comment-round-trip--editable)
- [Export = snippet + selection payload](#export--snippet--selection-payload)
- [What this module must NEVER add](#what-this-module-must-never-add)
- [Visual verification](#visual-verification)

Variant cells become commentable atoms via the **runtime**, reused
verbatim — this module never reinvents selection. This is the FIXED half
of the two-mode contract (project CLAUDE.md §4).

## What it does

Each cell carries `data-ve-id` + `data-ve-type` + `data-ve-label`. The
runtime (`amvcp-runtime.js`) installs ONE delegated click handler and an
injected stylesheet that, together, give every `[data-ve-id]` element:
selection toggling, the triple-state feedback (normal · hover ·
selected, each with its brightness-direction + glow delta), and the
28px gold comment handle when one+ atoms in a figure are selected. The
matrix gets all of that with zero interaction code of its own.

## The FIXED Interaction Mode

The plugin's signature UX — interaction · selection · highlighting ·
triple-state feedback · the comment-box round-trip — is done ONE way,
uniform across EVERY visual element (chart, table, diff, slide, and this
matrix). It IS the identity of the visual communicator. An imported
example's own selection / drag / hover-preview UX (the source
`06-component-variants.html` used a sticky toolbar + hover-to-preview
snippet panel) is **subordinate**: its graphic-style ideas were adopted
(the treatments, the variant-label pill, the "best for" note, the
snippet), but its INTERACTION was dropped in favour of our fixed model.

## The atom contract

```html
<div class="vc-cvm-cell"
     data-ve-id="component-variant:Card:default-flat"
     data-ve-type="component-variant"
     data-ve-label="Card · Flat"> … </div>
```

`data-ve-id` is shaped `component-variant:<component>:<variant.key>`, so
when the agent receives a selection it knows exactly which component and
which variant the user picked. See
`${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` for the
canonical payload model.

## Plain click vs Alt-click

The delegated copy listener mirrors `amvcp-token-sheet.js`:

- **plain click** on a cell → does nothing in this module; it falls
  through to the runtime's `[data-ve-id]` handler, which toggles
  selection and shows the comment handle;
- **Alt/Option-click (or Meta-click)** on the cell's `copy` button →
  copies the snippet to the clipboard (and `stopPropagation()` so the
  runtime does NOT also select).

This keeps the PRIMARY gesture (select-for-comment) on the plain click,
exactly as the token contact sheet does for its swatches.

## The comment round-trip = "editable"

The matrix has no inline variant editor — and it doesn't need one. A
variant is "edited" by selecting its cell and telling Claude "change the
selected variant this way: …". Claude reads the selection payload
(`component-variant:<component>:<key>`), re-emits the schema with the
change, and re-mounts. The select → comment → re-emit channel
(`amvcp-select.py` → `{selections:[…]}` JSON → Claude) is the universal
edit channel — reused, never rebuilt per-skill.

## Export = snippet + selection payload

Two export paths, both reusing existing mechanisms:

1. **per-cell snippet** — Alt-click the `copy` button to put that
   variant's source (`variant.snippet`) on the clipboard;
2. **selection payload** — the runtime returns the selected cells'
   `data-ve-id`s as JSON, which the agent can turn into a patch / commit.

No foreign "export panel" UX is introduced.

## What this module must NEVER add

- a custom drag-reorder, custom multi-select rubber-band, or custom
  highlight (the runtime owns all of these);
- selection / hover / `data-ve-selected` CSS in `#vc-cvm-style` (that
  would duplicate and diverge from the runtime's fixed feedback);
- a foreign export/share UX distinct from snippet-copy + selection JSON;
- any interaction paradigm copied from an external example.

If a catalogued external technique is an *interaction* technique that
differs from our fixed mode, express it through our selection/comment
model or drop it. Only *graphic-style* techniques are adopted (wired to
DESIGN.md so they stay themeable).

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the matrix under
`dev-browser`. Verify:

1. a plain click on a cell adds `data-ve-selected="1"` (runtime) and the
   comment handle appears — with NO selection rule in `#vc-cvm-style`;
2. hover gives the runtime's triple-state feedback;
3. Alt-click on the `copy` button copies the snippet and does NOT select;
4. the selection payload returned by the runner carries the
   `component-variant:<component>:<key>` id.
