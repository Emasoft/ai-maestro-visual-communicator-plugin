# Sub-technique A3 — Line-number gutter anatomy

The per-line `.ve-code-line` atom + the absolute-positioned
`.ve-code-linenum` cell + the CSS-counter line-number machinery + the
full-height bbox for drag-hit reliability. Implements CB-05 (HAVE —
runtime baseline, **document & preserve**; see PHASE2 backlog §12 A1).

The runtime already ships this — this reference is the contract every
other code-display reference reads from. Do NOT reimplement; do NOT
override. The gutter is the foundation of every other affordance
(selection, copy, diff, soft-wrap).

## A3.1 What it does

Rebuilds each `<pre><code>` into per-line `<span class="ve-code-line">`
atoms when the `<code>` has no child elements. Each line atom contains
two children:

```html
<span class="ve-code-line" data-ve-block-id="…" data-ve-line="N"
      style="--ve-code-indent:N;">
  <span class="ve-code-linenum"></span>          <!-- gutter cell (number via ::before) -->
  <span class="ve-code-content">…source text…</span>
</span>
```

The number is rendered by `.ve-code-linenum::before { content:
counter(ve-code-line); }` — pure CSS, no JS sync, no parallel-column
drift.

## A3.2 Why per-line `<span>`s, not a sibling gutter `<div>`

The earlier two-column design (separate `<div class="ve-code-gutter">`
sibling of the `<pre>`) had a fundamental limitation: gutter and pre
were sibling flex children, each owning its OWN line-box stack, so
baselines drifted apart for reasons that don't show up in any single
CSS property. **Per-line containers eliminate the problem at the
architecture level** — the number cell + the code text live INSIDE THE
SAME `.ve-code-line` span, same line-box, same baseline, automatically
aligned by the browser's text layout.

## A3.3 The CSS counter

```css
.ve-code-block > pre { counter-reset: ve-code-line; }
.ve-code-line {
  counter-increment: ve-code-line;
  display: block;          /* each line is its own row */
  position: relative;      /* anchor for the absolute linenum */
}
.ve-code-linenum::before { content: counter(ve-code-line); }
```

- `counter-reset` on the `<pre>` zeroes the counter for each block (so
  a page with 3 code blocks gets `1..N`, `1..M`, `1..P` — not
  `1..(N+M+P)` continuous).
- `counter-increment` fires once per `.ve-code-line` span — each span
  gets the next integer in the sequence.
- `display: block` on `.ve-code-line` gives each line its own row. No
  literal `\n` is needed between sibling spans (adding one would create
  a SECOND break: `display:block` + literal newline preserved by
  `white-space:pre` = double row spacing).

## A3.4 The absolute-positioned linenum cell

```css
.ve-code-linenum {
  position: absolute;
  left: 0; top: 0; bottom: 0;          /* FULL-height bbox */
  display: flex; align-items: flex-start; justify-content: flex-end;
  box-sizing: border-box;
  min-width: 3.5ch; padding: 0 0.6ch 0 0.3ch;
  text-align: right;
  text-indent: 0;                       /* re-zero so parent's -2ch doesn't shift the gutter */
  white-space: nowrap;
  color: color-mix(in srgb, currentColor 50%, transparent);
  border-right: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  user-select: none; -webkit-user-select: none;
  -webkit-touch-callout: none;
  cursor: pointer;
  transition: background 100ms ease, color 100ms ease;
}
```

**Key design decisions:**

- **`position: absolute`** so the linenum overlays the first ~4ch of
  the line's `padding-left` area without participating in inline flow
  (which would interact with `text-indent` and break the hanging-indent
  calculation).
- **`top: 0; bottom: 0`** stretches the bbox to the FULL HEIGHT of the
  parent `.ve-code-line` — **critical** because drag-paint uses
  `elementFromPoint(x, y)` on every intermediate position. If the
  linenum were just its intrinsic line-height (~18px), a drag through
  the middle of a wrapped line would miss the linenum and the drag-
  paint would skip that line. Full-height bbox ensures the leftmost
  gutter column always catches drag hits.
- **`user-select: none; -webkit-user-select: none; -webkit-touch-
  callout: none`** — WebKit (iTerm2 WKWebView, Safari) requires both
  the prefix AND the touch-callout: without them, mousedown over the
  pseudo-element digit triggers text-selection / Look-Up and the click
  is never seen by the runtime's mousedown listener.
- **`color: color-mix(... currentColor 50% ...)`** — the number is
  visibly subordinate to the code text; selecting a line bumps it to
  full strength via the pressed-state rule.

## A3.5 The per-line dynamic hanging indent

Each `.ve-code-line` carries an inline `--ve-code-indent` CSS variable
set by `initCodeGutter` to `(source-leading-whitespace + 2)`. The CSS:

```css
.ve-code-line {
  padding-left: calc(4.2ch + var(--ve-code-indent, 2) * 1ch);
  text-indent: calc(var(--ve-code-indent, 2) * -1ch);
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}
```

The math:
- `padding-left = gutter (4.2ch) + indent ch` → wrap continuations go
  here
- `text-indent = -indent ch` → first line pulled back to gutter

Net effect: the source's leading whitespace renders at its natural
position on the first visual line, and any wrap continuation starts at
`(source-indent + 2ch)` past the gutter — i.e. always 2ch right of
where the first line's visible text actually begins. The universal
"this is a wrap" affordance.

A fixed 2ch hanging indent fails when the source already starts with
≥ 2ch of indent (the wrap continuation would appear LEFT of the first
line's text, looking like an outdent). The dynamic version solves this.

## A3.6 The empty-line guard

```css
.ve-code-line { min-height: 1.55em; }
```

Source lines that contain only whitespace (or are empty) would
otherwise collapse to height 0 because the absolute-positioned linenum
is out of flow and the inline content span has nothing to render.
Matching the surrounding 1.55 line-height:

- keeps blank lines **visible** (a blank line in the source renders
  as a blank line, not an invisible gap)
- keeps the drag-paint hit-test **correct** — a drag from line N to
  line N+2 through an empty line N+1 must not skip line N+1; the
  full-height bbox ensures it picks up the empty line too.

## A3.7 The wrap-marker stripe (anatomy)

A linear-gradient painted as the background of `.ve-code-line`, with
`background-position: 0 1.55em` so it ONLY appears on wrapped
continuation rows (the first visual row is "above" the gradient's
starting position).

```css
.ve-code-line {
  background-image: linear-gradient(
    to right,
    transparent 0,
    transparent calc(4.2ch + (var(--ve-code-indent, 2) - 2) * 1ch),
    var(--ve-code-wrap-marker, rgba(0,0,0,0.30))
      calc(4.2ch + (var(--ve-code-indent, 2) - 2) * 1ch),
    var(--ve-code-wrap-marker, rgba(0,0,0,0.30))
      calc(4.2ch + var(--ve-code-indent, 2) * 1ch),
    transparent calc(4.2ch + var(--ve-code-indent, 2) * 1ch)
  );
  background-position: 0 1.55em;        /* skip the first visual row */
  background-repeat: no-repeat;
  background-size: 100% calc(100% - 1.55em);  /* covers row 2 → end */
}
```

The stripe colour comes from `--ve-code-wrap-marker` (subtractive on
dark — `rgba(0,0,0,0.35)`; brown tint on light — `rgba(110,77,24,
0.22)`) so the wrap-indent space reads visually distinct from real
source-code whitespace. See [wrap-and-no-inner-scroll.md](./wrap-and-no-
inner-scroll.md) for the rationale and the no-inner-scrollbar
guarantee.

## A3.8 The pressed-state visual

When a line is selected (`data-ve-pressed="1"` set by the runtime), the
gutter cell turns the accent gold:

```css
.ve-code-line[data-ve-pressed="1"] {
  background: color-mix(in srgb, var(--ve-accent, #b8861f) 28%, transparent);
}
.ve-code-line[data-ve-pressed="1"] .ve-code-linenum {
  background: var(--ve-accent, #b8861f);
  color: var(--ve-sel-text, #14110b);
}
```

The preview-state (`data-ve-preview="1"` — set during drag-paint
hover) uses 18% bg tint + 60% gutter accent — a softer visual that
tells the reader "you're about to commit to selecting this line."

## A3.9 Opt-out: `data-ve-no-gutter`

A `<pre>` with `data-ve-no-gutter` (or any ancestor with that
attribute) skips `initCodeGutter`. Use cases:

- Snippet popups inside overlay modals
- The regex graph (`.ve-regex` — has its own renderer)
- Tooltips that show a one-line code fragment in the bubble

See [opting-out-pre.md](./opting-out-pre.md) for the canonical opt-out
list.

## A3.10 What the author writes

```html
<pre><code class="language-js">function hello (name) {
  return 'Hello, ' + name;
}</code></pre>
```

That's it. The runtime adds the wrapper, the gutter, the copy button,
the per-line atoms, the wrap-marker stripe, the selection chrome — and
the tokenizer fills each line's `.ve-code-content` with token spans.

**Do NOT** hand-author `<span class="ve-code-line">`, `<span
class="ve-code-linenum">`, or token spans. The runtime owns them all.

## A3.11 Tokens consumed

- `--ve-accent` — gutter selection / hover ring
- `--ve-sel-text` — the dark-on-gold pressed text colour
- `--ve-code-wrap-marker` — the wrap-stripe tint (one of two values
  — see A3.7)
- `currentColor` — the gutter divider line uses `color-mix(...
  currentColor 18% ...)` so it auto-themes with the surrounding text.
