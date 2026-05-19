# Inline code chips and `<pre>` block typography

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why `0.9em` (not `var(--vc-text-N)`)](#why-09em-not-var--vc-text-n)
- [Why `<pre>` uses `--vc-text-1` (one step down from body)](#why-pre-uses---vc-text-1-one-step-down-from-body)
- [No nested scrollbars on `<pre>`](#no-nested-scrollbars-on-pre)
- [`<kbd>` — the 1px border trick](#kbd--the-1px-border-trick)
- [`<var>` — italic mono](#var--italic-mono)
- [Tabular numerics in `<pre>` / `<code>`](#tabular-numerics-in-pre--code)
- [Light + dark — fully covered](#light--dark--fully-covered)
- [Selection-contract conformance](#selection-contract-conformance)
- [When to use which element](#when-to-use-which-element)
- [Cross-references](#cross-references)

The mono face's typography contract — how inline `<code>` chips read
inside body prose; how `<pre>` blocks read as self-contained code
display; how `<kbd>` and `<samp>` get their secondary contracts. The
mono face is the *third register* of the tri-font stack (see
[tri-font-stack-anthropic.md](../../amvcp-typo-foundation/references/tri-font-stack-anthropic.md)); this
reference describes the per-element shapes that consume it.

The **code-highlight** skill owns syntax-colouring (the `.tok-kw`,
`.tok-str`, `.tok-cm` tokens); this reference owns the *typography*
half — size, leading, padding, the chip background — which is
DESIGN.md-themed and stays correct in light + dark.

## What it is

The mono register has FIVE element shapes the typography skill
contracts for:

1. **Inline `<code>` chip** — a *value* inside a sentence:
   `apply the migration with sql/2026-04-21-init.sql`. Renders as
   smaller-than-body, with a faint background tint and a small radius
   so it pops out without screaming.
2. **`<pre>` block** — a *self-contained* code listing. Renders with
   block padding, fixed leading, and a soft surface background.
3. **`<kbd>`** — a *keystroke*: `<kbd>⌘K</kbd>`. Renders with the
   same body chip shape but with a 1px subtle border so it reads as
   "press this key".
4. **`<samp>`** — *sample output*: `<samp>Permission denied</samp>`.
   Renders with the inline chip shape but no background tint — the
   reader recognises it as "what the program said" by content.
5. **`<var>`** — a *variable name in mathematical or programming
   prose*: `<var>n</var>`. Renders in the mono face but italicised —
   the only mono element with italic styling.

## The contract

```css
/* Inline <code> chip — the most-reused mono shape. */
code,
.vc-code-inline {
  font-family: var(--vc-font-mono, ui-monospace, Menlo, monospace);
  font-size: 0.9em;                    /* 0.9× the surrounding body */
  font-weight: var(--vc-weight-body, var(--vc-weight-regular, 400));
  /* Background uses a NEUTRAL surface token, not a colour token —
     keeps theme-correct in light + dark with NO color rule here. */
  background: var(--ve-surface-soft, color-mix(in srgb, currentColor 6%, transparent));
  padding: 0.1em 0.4em;
  border-radius: 4px;
  /* No tracking. Mono digits at body size are already comfortably spaced. */
}

/* <pre> block — multi-line, padded, surface-bg. */
pre,
.vc-code-block {
  font-family: var(--vc-font-mono, ui-monospace, Menlo, monospace);
  font-size: var(--vc-text-1);          /* one step DOWN from body */
  font-weight: var(--vc-weight-body, var(--vc-weight-regular, 400));
  line-height: 1.55;                   /* code leading band */
  background: var(--ve-surface-soft, color-mix(in srgb, currentColor 4%, transparent));
  padding: 1em 1.25em;
  border-radius: 8px;
  /* NO overflow rule — wide code extends the page (compliance with
     no-nested-scrollbars.md). */
}

/* <kbd> — keystroke chip. */
kbd,
.vc-kbd {
  font-family: var(--vc-font-mono, ui-monospace, Menlo, monospace);
  font-size: 0.85em;
  font-weight: var(--vc-weight-label, var(--vc-weight-medium, 500));
  padding: 0.15em 0.5em;
  border-radius: 4px;
  border: 1px solid currentColor;
  /* `currentColor` for the border = always theme-correct: the border
     adopts the text colour, which is itself themed. */
}

/* <samp> — sample output. */
samp,
.vc-samp {
  font-family: var(--vc-font-mono, ui-monospace, Menlo, monospace);
  font-size: 0.9em;
  /* No background — distinguishes from <code> chip. */
}

/* <var> — italic mono. */
var,
.vc-var {
  font-family: var(--vc-font-mono, ui-monospace, Menlo, monospace);
  font-style: italic;
}
```

This contract is owned by the typography skill (it covers font,
size, weight, leading, the chip shape). Syntax colours inside `<pre>`
are owned by `amvcp-code-highlight`.

## Scaffold

```html
<!-- Inline code chip -->
<p>Run the migration with <code>uv run scripts/migrate.py</code>.</p>

<!-- Block code -->
<pre><code class="lang-python">def hello(name):
    return f"hi, {name}"</code></pre>

<!-- Keystroke -->
<p>Save with <kbd>⌘S</kbd> on macOS, <kbd>Ctrl</kbd>+<kbd>S</kbd> on Windows.</p>

<!-- Sample output -->
<p>The CLI prints <samp>Permission denied</samp> when the token is missing.</p>

<!-- Variable in prose -->
<p>For each row <var>i</var> in the table, compute <var>i</var>·2.</p>
```

## Tokens consumed / extended

- **Consumes:** `--vc-font-mono`, `--vc-text-1` (the body-step-down
  size for `<pre>`), `--vc-weight-body`, `--vc-weight-label`,
  `--ve-surface-soft` (runtime token, the faint surface tint).
- **Extends:** nothing.

`--ve-surface-soft` is a **runtime** token, not an engine token —
the runtime emits it as a derivative of `--vc-color-surface` (a
softer, lower-contrast variant for chip / pre backgrounds). If the
runtime is not loaded, the `color-mix(in srgb, currentColor 6%,
transparent)` fallback synthesises an equivalent soft tint from the
inherited text colour, so the chip is correct on a bare HTML page too.

## Why `0.9em` (not `var(--vc-text-N)`)

The inline `<code>` chip uses `font-size: 0.9em` — a *relative* size
to the surrounding context — rather than a token (`--vc-text-1`).
This is deliberate:

- A `<code>` chip can appear inside a `<p>` (body), inside an `<h1>`
  (heading), or inside a `.vc-type-overline` (eyebrow). Each context
  has a different base font-size.
- If the chip were anchored to `--vc-text-1`, it would render at the
  same absolute size everywhere — meaning the chip inside a hero
  heading would look TINY, and the chip inside an eyebrow would
  break the eyebrow's vertical rhythm.
- `0.9em` scales **with the context** — a chip inside a hero is large,
  a chip inside an eyebrow is small. Both fit their surroundings.

This is the one place in the typography contract where the size is
*relative* to the parent rather than absolute. The chip is the
exception that proves the rule.

## Why `<pre>` uses `--vc-text-1` (one step down from body)

A `<pre>` block is *standalone* — it does NOT live inside another
typography role, so the relative-size argument above does not apply.
A standalone `<pre>` rendering at the body size feels visually loud;
stepping it down to `--vc-text-1` reads as "code sample, secondary to
the prose around it", which is the correct hierarchy.

The runtime's existing `<pre>` styling matches this — confirming
`--vc-text-1` is the right step.

## No nested scrollbars on `<pre>`

The `<pre>` contract sets **NO `overflow` rule**. A wide line in a
code block extends the page; the page's own scrollbar handles
horizontal scrolling. This is non-negotiable — compliant with
`no-nested-scrollbars.md`. The runtime's recent "responsive
code-blocks" change (commit 752deb1 "feat(report-v5): responsive
code-blocks") replaced an inner `overflow-x: auto` with the
page-extends pattern — that change is the canonical implementation.

**Forbidden:** `pre { overflow-x: auto }` would re-introduce an inner
scrollbar. Do not do this. If a code block visually overpowers the
viewport, that is information the reader needs (the code IS that
wide), not a rendering bug.

## `<kbd>` — the 1px border trick

`<kbd>` uses `border: 1px solid currentColor` — the border picks up
the *inherited text colour*. This is critical for theme correctness:

- Light theme: text is `#141413`, border is `#141413` (a near-black
  hairline around the kbd).
- Dark theme: text is `#f5f5f5`, border is `#f5f5f5` (a near-white
  hairline).

If the border used a hardcoded colour (`border: 1px solid #999`) the
kbd would look right in one theme and broken in the other. `currentColor`
is the canonical fix — the typography layer never adds a `color` rule
to `<kbd>` (preserving the theme-inherit chain), and the border
automatically follows.

## `<var>` — italic mono

`<var>` is the **only** mono element with `font-style: italic`. The
italic mono is reserved for *mathematical variables in prose* —
`<var>n</var>` reads as "the variable n", visually distinct from
`<code>n</code>` (which would read as "the value n").

A surprising number of mono fonts ship a high-quality italic variant
(JetBrains Mono, IBM Plex Mono, DM Mono). If the chosen mono face
lacks an italic, the browser synthesizes one (slants the upright
glyphs ~12°) — fail-soft, slightly less elegant, still legible.

## Tabular numerics in `<pre>` / `<code>`

By default `<pre>` and `<code>` do NOT enable tabular numerics — the
mono face's *width* is already tabular for a monospace font (every
glyph is the same width), so the digits are inherently aligned.

The `.vc-tabular-nums` utility (see
[tabular-numerics.md](../../amvcp-typo-microtype/references/tabular-numerics.md)) is for the **body sans**
face — turning its proportional digits into tabular. Applying it to a
mono `<code>` is a no-op (the digits are already tabular).

## Light + dark — fully covered

The contract above sets:

- `background: var(--ve-surface-soft, color-mix(…))` — a token, themed.
- `border: 1px solid currentColor` — inherits, themed.
- NO `color` rule — the runtime's `--ve-control-fg` chain sets it.

So every mono element renders correctly in BOTH themes without any
per-theme override. Verify per
`skills/amvcp-self-debug-rules/SKILL.md` — a dev-browser screenshot
of the specimen page in light and dark themes, with at least one
`<code>` chip and one `<pre>` block.

## Selection-contract conformance

Each `<pre>` block is a typography atom — the runtime's
`markTypographyAtoms` walker stamps it with `data-ve-id` (typically
the file path of the embedded code or a sequential pre-block-N id)
and `data-ve-type="type-pre"` (extending the SHAPE table — added by
the integration pass). A `<code>` chip *inline* in a paragraph is NOT
a separate atom (the parent `<p>` already is); a *standalone*
`<code>` (a `<code>` outside any block container) is.

## When to use which element

| You want to show | Element | Notes |
|---|---|---|
| A value inside a sentence | `<code>` | The chip. |
| A multi-line listing | `<pre><code>…</code></pre>` | Use the doubled markup. |
| A keystroke / shortcut | `<kbd>` | One per key. `<kbd>⌘</kbd><kbd>S</kbd>` for combos. |
| What the program printed | `<samp>` | Distinguishes from input. |
| A mathematical variable | `<var>` | Italic. |
| A file path or env var | `<code>` | Yes, still a chip. Don't reach for `<var>`. |
| A command the user types | `<kbd>` | The reader will type this. |
| A command in documentation | `<code>` | The reader will copy this. |

The distinction between `<kbd>` (the reader will type) and `<code>`
(the reader may copy) is subtle but real — `<kbd>` is for the
"how to enter this" docs; `<code>` is for the "what to put in your
file" docs.

## Cross-references

- [tri-font-stack-anthropic.md](../../amvcp-typo-foundation/references/tri-font-stack-anthropic.md) — the
  tri-font preset where the mono face is the third register.
- [tabular-numerics.md](../../amvcp-typo-microtype/references/tabular-numerics.md) — the
  `.vc-tabular-nums` utility (no-op on mono, important on sans).
- `amvcp-code-highlight` skill — owns the syntax colouring inside
  `<pre>` (the `.tok-*` classes); this reference owns only the
  typography (size / leading / padding / chip shape).
