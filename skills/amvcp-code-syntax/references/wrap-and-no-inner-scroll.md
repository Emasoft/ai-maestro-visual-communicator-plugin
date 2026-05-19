# Sub-technique A4 — Soft-wrap + no inner scrollbar invariant

## Table of Contents

- [A4.1 What it does](#a41-what-it-does)
- [A4.2 The rule (verbatim from the project)](#a42-the-rule-verbatim-from-the-project)
- [A4.3 Why nested scrollbars break code reading specifically](#a43-why-nested-scrollbars-break-code-reading-specifically)
- [A4.4 The wrap-marker stripe — making wraps visible](#a44-the-wrap-marker-stripe--making-wraps-visible)
- [A4.5 The hanging-indent math (why it matters here)](#a45-the-hanging-indent-math-why-it-matters-here)
- [A4.6 The author rule](#a46-the-author-rule)
- [A4.7 Wrap correctness with token spans](#a47-wrap-correctness-with-token-spans)
- [A4.8 The vertical-extent corollary](#a48-the-vertical-extent-corollary)
- [A4.9 What about a really long line (a minified bundle pasted in)?](#a49-what-about-a-really-long-line-a-minified-bundle-pasted-in)
- [A4.10 The verification checklist](#a410-the-verification-checklist)
- [A4.11 Project-rule cross-reference](#a411-project-rule-cross-reference)

The hard rule: code blocks NEVER have an inner horizontal scrollbar.
Wide code wraps. Wider code extends the page. The page's own
scrollbars are the only scrollbars permitted. Implements CB-06 (HAVE —
runtime baseline + global rule, **document & preserve**; PHASE2
backlog §12 A4 "CRITICAL SAFETY FLAG").

This reference enforces the project-wide `no-nested-scrollbars` rule
specifically for the code-highlight category.

## A4.1 What it does

The runtime applies `white-space: pre-wrap; word-break: break-word;
overflow-wrap: anywhere;` to every `.ve-code-block > pre` AND every
`.ve-code-line` span. A 200-character line of code wraps; a 500-
character single token (a huge minified bundle inserted by accident)
breaks anywhere; a 5000-line code block extends the page vertically
and the reader scrolls the page.

`overflow` on `<pre>` and `<code>` is **`visible`** — never `auto`,
never `scroll`.

## A4.2 The rule (verbatim from the project)

> Never create nested scrollviews. When content is wider or taller than
> the viewport, **let the page itself expand** to contain it. The
> document's own scrollbars are the only scrollbars permitted — never
> introduce inner `overflow:auto` / `overflow:scroll` boxes with their
> own scrollbars.

`pre { overflow-x: auto }` is **specifically forbidden** — listed in
the project's `no-nested-scrollbars` rule as the canonical anti-
example.

## A4.3 Why nested scrollbars break code reading specifically

- **You can't select what you can't see.** Drag-paint selection of a
  line that scrolled off-right is impossible — the user has to
  separately scroll into view first, breaking the gesture.
- **Find-in-page misses content.** Browser find walks the DOM but
  can't bring scrolled-off content into view on its own.
- **Screen readers truncate.** A `<pre>` with `overflow: auto` reads
  only the visible portion in many assistive-tech configurations.
- **The copy button now lies.** The button writes the byte-exact
  source from `wrapper.__veSourceText`, so the clipboard payload is
  correct — but the visual "what you copied" is ambiguous when half
  of every long line is off-screen.
- **Two-axis scroll is a usability disaster.** The page already
  scrolls vertically; adding a second axis on every `<pre>` means
  every reader, every device, has to learn TWO scroll surfaces. The
  rule "one document, one scroll axis" is the readable model.

## A4.4 The wrap-marker stripe — making wraps visible

A line wraps. How does the reader know it wrapped (versus the next
line being indented in the source)?

Answer: the runtime paints a vertical stripe in the hanging-indent
column, starting at y = 1.55em (the first row's height) and covering
everything below. Only wrapped rows of a line carry the stripe — the
first visual row never does. See
[gutter-anatomy.md](./gutter-anatomy.md) §A3.7 for the gradient
machinery.

The stripe colour comes from `--ve-code-wrap-marker`:

- Dark theme: `rgba(0,0,0,0.30)` — a subtractive shadow over the
  surrounding code background
- Light theme: `rgba(110,77,24,0.22)` — a warm brown tint over the
  parchment background

Both themes mandatory (light-theme mirror discipline).

## A4.5 The hanging-indent math (why it matters here)

A wrap-continuation that started at column 0 would look exactly like
the next line of code — the wrap would be invisible. The runtime's
solution:

- `padding-left = gutter (4.2ch) + (source-indent + 2)ch`
- `text-indent = -(source-indent + 2)ch`

So the first visual line of code renders at its NATURAL source-indent
position, and every wrap-continuation starts at `(source-indent + 2)ch`
past the gutter — i.e. always 2ch to the right of where the first
line's text begins. The reader sees:

```
12 │ const path = await someVeryLongPathToA
   │   …deeplyNestedConfigFile('/etc/foo');
13 │ return path;
```

The `…` is not literal; it's the wrap-marker stripe rendering at the
2ch column where the wrap began. The 2-ch indentation makes the wrap
visually subordinate to its starting line.

## A4.6 The author rule

Authors MUST NOT:

| Anti-pattern | Why forbidden |
|---|---|
| `<pre style="overflow-x: auto">` | Nested scrollbar. Violates the global rule. |
| `<pre style="overflow: scroll">` | Same. |
| `<div style="overflow-x: auto"><pre>…</pre></div>` | The wrapper is the scrollbox, with the same fundamental problem. |
| `pre { max-width: 80ch; overflow-x: auto; }` in a page stylesheet | Defeats the runtime's wrap. Remove. |
| `<pre style="white-space: pre">` (without `-wrap`) | Forces non-wrapping. The runtime's `:where()` cascade may not override an inline style — author must fix. |

Authors SHOULD instead:

| Right approach | Why correct |
|---|---|
| Just author `<pre><code class="language-x">…</code></pre>` | Runtime applies `white-space:pre-wrap` automatically. |
| Set `data-ve-no-gutter` if you have a special case | Opt-out, see [opting-out-pre.md](../../amvcp-code-fences/references/opting-out-pre.md). |
| Manually re-wrap a long string literal in the source | The visual will still wrap, but at the author-chosen break — better readability. |

## A4.7 Wrap correctness with token spans

The tokenizer emits inline `<span class="ve-tok-*">` spans. Inline
spans wrap naturally within their containing block. Critical: the
spans MUST be `display: inline` (the default for `<span>`) — `display:
inline-block` would prevent wrapping mid-token. The CSS:

```css
.ve-tok-keyword     { color: var(--ve-code-keyword); }   /* no display override */
.ve-tok-string      { color: var(--ve-code-string); }    /* no display override */
/* … same for all 12 roles … */
```

The bare `color:` rules mean spans stay inline; long string tokens
(e.g. a single-quoted URL) can wrap mid-token via `overflow-wrap:
anywhere` on the parent `.ve-code-line`. The integrity probe still
passes because the SOURCE TEXT of the spans (concatenated) byte-
matches the original line, regardless of where the spans break visually.

## A4.8 The vertical-extent corollary

A page with 5 code blocks, each 200 lines, makes for a long page.
**This is correct.** The reader scrolls the page. We do NOT introduce a
`max-height` on a code block + `overflow-y: auto` to "save space" —
that's the vertical version of the forbidden horizontal pattern.

If a code block is genuinely too long for casual reading, the right
solution is a `<details>` wrapper (see
[collapsed-snippets-walkthrough.md](../../amvcp-code-snippets/references/collapsed-snippets-walkthrough.md))
— the reader chooses to expand it, and once expanded the full block
participates in the page's scroll. NOT a nested scroll box.

## A4.9 What about a really long line (a minified bundle pasted in)?

`overflow-wrap: anywhere` lets the line break anywhere a wrap is
needed — even mid-identifier — so the page never blows out horizontally.
The line becomes visually unreadable, but it doesn't BREAK the layout.
That's the correct degradation: if the user pasted a minified bundle,
they get a wrapped wall of text and can read it (badly). The
alternative (page-width-overflow + horizontal page scroll) is worse for
every other reader of every other element on the page.

## A4.10 The verification checklist

For every new code-display fixture:

- [ ] Open at viewport width 1200 — wide code wraps inside the block;
      no horizontal scrollbar on the block; no horizontal scrollbar on
      the page (unless a non-code element forced it).
- [ ] Resize to 600 — wide code still wraps; wrap-marker stripe still
      paints; the block doesn't introduce a horizontal scrollbar.
- [ ] Resize to 320 (smallest realistic) — wraps still legible; the
      gutter remains visible; the copy button remains in the top-right.
- [ ] Insert a 5000-character single-token line — `overflow-wrap:
      anywhere` breaks it; no horizontal scrollbar.
- [ ] In dev-tools Computed pane, every `.ve-code-block > pre`
      `overflow-x` reads `visible`, never `auto` / `scroll`.

## A4.11 Project-rule cross-reference

The full project rule is at
`~/.claude/rules/no-nested-scrollbars.md`. This reference re-states the
parts that bind the code-highlight category — every code block on
every page MUST comply.

The one exception the rule allows (text wrapping in `<p>` / `<li>`)
does NOT apply to code: code already wraps via `pre-wrap`. Code is in
the "cannot be wrapped" → "must extend the page" bucket... except that
the runtime's wrap machinery handles the "cannot be wrapped" part for
us, so wide code DOES wrap, and the document stays at viewport width.
The page-extent fallback only applies if the wrap machinery fails (it
doesn't).
