# Sub-technique D3 — Diff-aware twin-column gutter (old/new line numbers)

## Table of Contents

- [D3.1 What it does](#d31-what-it-does)
- [D3.2 The markup](#d32-the-markup)
- [D3.3 The CSS](#d33-the-css)
- [D3.4 The runtime extension](#d34-the-runtime-extension)
- [D3.5 Hunk header rendering in twin mode](#d35-hunk-header-rendering-in-twin-mode)
- [D3.6 Collapsing hunks](#d36-collapsing-hunks)
- [D3.7 Drag-paint selection across the twin gutter](#d37-drag-paint-selection-across-the-twin-gutter)
- [D3.8 The copy behaviour](#d38-the-copy-behaviour)
- [D3.9 Composition with split view](#d39-composition-with-split-view)
- [D3.10 When to use](#d310-when-to-use)
- [D3.11 Light + dark verification](#d311-light--dark-verification)
- [D3.12 Tokens consumed](#d312-tokens-consumed)
- [D3.13 Author rules](#d313-author-rules)

A specialized gutter that shows TWO numbers per line — the line's
position in the OLD file + the line's position in the NEW file. The
GitHub-style diff gutter. Implements CB-01's C3 sub-technique
(PHASE2 backlog §12 C3).

## D3.1 What it does

Replaces the default single-column line-number gutter with a 2-column
gutter:

```
42  42  function hello (name) {
43      -  return 'Hi, ' + name;
    43  +  return 'Hello, ' + name;
    44  +  // greeting normalized
44  45  }
```

- Column 1 = line number in the OLD file (blank for `add` lines).
- Column 2 = line number in the NEW file (blank for `del` lines).
- The actual diff marker (`+` / `-` / ` `) renders at column 3 as part
  of the source content.

The reader can cite line numbers in either version without having to
visually count.

## D3.2 The markup

Adding `data-ve-diff-gutter="twin"` on a `.ve-code-block` opts into the
twin gutter:

```html
<div class="ve-code-block" data-ve-diff-gutter="twin">
  <pre><code class="language-diff">@@ -42,4 +42,5 @@
 function hello (name) {
-  return 'Hi, ' + name;
+  return 'Hello, ' + name;
+  // greeting normalized
 }
</code></pre>
</div>
```

The runtime's `initCodeGutter`, on encountering `data-ve-diff-gutter=
"twin"`:
1. Parses the hunk header to extract the starting old-line number and
   new-line number.
2. Walks the diff lines, incrementing old or new (or both) per line
   type.
3. Emits TWO `.ve-code-linenum` cells per line, with the appropriate
   numbers as their `::before` content.

## D3.3 The CSS

```css
.ve-code-block[data-ve-diff-gutter="twin"] .ve-code-line {
  padding-left: calc(7.4ch + var(--ve-code-indent, 2) * 1ch);
  text-indent: calc(var(--ve-code-indent, 2) * -1ch);
}
.ve-code-block[data-ve-diff-gutter="twin"] .ve-code-linenum--old {
  position: absolute;
  left: 0;
  top: 0; bottom: 0;
  width: 3.5ch;
  text-align: right;
  padding-right: 0.4ch;
  border-right: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  color: color-mix(in srgb, currentColor 45%, transparent);
}
.ve-code-block[data-ve-diff-gutter="twin"] .ve-code-linenum--new {
  position: absolute;
  left: 3.7ch;
  top: 0; bottom: 0;
  width: 3.5ch;
  text-align: right;
  padding-right: 0.4ch;
  border-right: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  color: color-mix(in srgb, currentColor 50%, transparent);
}
.ve-code-block[data-ve-diff-gutter="twin"] .ve-code-linenum--old::before {
  content: attr(data-old);
}
.ve-code-block[data-ve-diff-gutter="twin"] .ve-code-linenum--new::before {
  content: attr(data-new);
}
```

The total left-padding becomes `7.4ch` (two 3.5ch gutter columns +
0.4ch separator) instead of the default `4.2ch`. Wrap continuations
still work — they paint past the 7.4ch column.

## D3.4 The runtime extension

`initCodeGutter` needs the twin-mode branch. Pseudocode (the
integration pass implements this in `scripts/amvcp-runtime.js`):

```js
function initCodeGutterTwinDiff(pre) {
  var raw = pre.textContent || '';
  var lines = raw.split('\n');
  var oldNum = null;
  var newNum = null;
  var out = '';
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var type = classifyDiffLine(line);   // returns 'add' | 'del' | 'ctx' | 'hunk'
    if (type === 'hunk') {
      var m = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (m) { oldNum = parseInt(m[1], 10); newNum = parseInt(m[2], 10); }
      // Hunk header has no per-line numbers
      out += renderHunkHeader(line);
      continue;
    }
    var oldStr = (type === 'add') ? '' : String(oldNum);
    var newStr = (type === 'del') ? '' : String(newNum);
    out += '<span class="ve-code-line" data-ve-diff="' + type + '">'
      +   '<span class="ve-code-linenum ve-code-linenum--old" data-old="' + oldStr + '"></span>'
      +   '<span class="ve-code-linenum ve-code-linenum--new" data-new="' + newStr + '"></span>'
      +   '<span class="ve-code-content">' + escapeHtml(line) + '</span>'
      + '</span>';
    if (type !== 'add') oldNum++;
    if (type !== 'del') newNum++;
  }
  // ... rest of initCodeGutter wrapper/copybutton ...
}
```

The runtime owns this; the author just sets the `data-ve-diff-gutter=
"twin"` attribute.

## D3.5 Hunk header rendering in twin mode

The hunk header (`@@ -42,4 +42,5 @@ function hello`) is rendered as a
special row:

```html
<div class="ve-code-hunk-header" data-ve-diff="hunk">@@ -42,4 +42,5 @@ function hello (name) {</div>
```

CSS:

```css
.ve-code-hunk-header {
  color: var(--ve-code-comment);
  font-family: var(--vc-font-mono);
  font-size: var(--vc-text-small);
  padding: 8px 12px;
  margin: 6px 0;
  background: color-mix(in srgb, var(--ve-accent) 4%, transparent);
  border-left: 3px solid color-mix(in srgb, var(--ve-accent) 35%, transparent);
}
```

A subtle accent stripe at the left visually separates hunks. The
function-context (the trailing prose) helps the reader locate the
hunk in the larger file.

## D3.6 Collapsing hunks

Each hunk can be wrapped in a `<details>` (the runtime sets it up):

```html
<details class="ve-code-hunk" open>
  <summary class="ve-code-hunk-header">@@ -42,4 +42,5 @@ function hello (name) {</summary>
  <div class="ve-code-hunk-body">
    <!-- lines for this hunk -->
  </div>
</details>
```

Reader can collapse a hunk they don't care about. The default is `open`
(all hunks visible); the runtime adds a "Collapse all / Expand all"
button on multi-hunk blocks.

## D3.7 Drag-paint selection across the twin gutter

The drag-paint hit-test still works — `elementFromPoint` returns
either `.ve-code-linenum--old` or `.ve-code-linenum--new`; both
forward the click to the parent `.ve-code-line`. The selection state
is per-line, not per-gutter-column.

The selection payload carries BOTH `data-old` and `data-new` so the
agent knows the reader's mental reference (they might say "comment on
old line 43" or "comment on new line 45" — both resolve to the same
selected `.ve-code-line` in the diff).

## D3.8 The copy behaviour

Copy still writes the byte-exact diff source (with `+` / `-` /
leading-space markers). The TWO line numbers are gutter-only; they're
NOT in the source text. The clipboard payload is identical to a
single-gutter diff block's payload.

## D3.9 Composition with split view

In split-view diff (see [diff-blocks-split.md](./diff-blocks-split.md)), each pane uses a SINGLE gutter — the "before" pane shows
old line numbers, the "after" pane shows new line numbers. The twin
gutter is for UNIFIED diff blocks only, where both numbers need to live
together.

## D3.10 When to use

| Use twin gutter when… | Use single gutter when… |
|---|---|
| The diff is large + multi-hunk (a real PR) | The diff is short (3-5 lines) |
| Readers will cite line numbers ("look at old:43") | Readers won't reference specific lines |
| The page is a PR-review composition | The diff is illustrative |
| The viewport is reasonably wide (≥ 540px) | Narrow viewport → twin gutter eats too much horizontal space |

For narrow viewports OR short illustrative diffs, the single-gutter
default is correct.

## D3.11 Light + dark verification

- [ ] Both old and new gutter columns visible in both themes
- [ ] The vertical separator line between columns renders subtly in
      both themes (via `color-mix(... currentColor 12% ...)`)
- [ ] Empty cells (no number) leave clean visual gaps, not collapse to
      zero width
- [ ] Hunk header band is distinct from regular lines in both themes
- [ ] Selected diff line: both gutter cells take the accent tint

## D3.12 Tokens consumed

- `--ve-accent` — gutter cell selection / hover (same as default)
- `--ve-code-comment` — hunk header colour
- `currentColor` — the gutter divider tinting (via `color-mix`)
- All from [gutter-anatomy.md](../../amvcp-code-syntax/references/gutter-anatomy.md) and
  [diff-blocks-unified.md](./diff-blocks-unified.md)

## D3.13 Author rules

| Rule | Why |
|---|---|
| Use `data-ve-diff-gutter="twin"` on the `.ve-code-block` wrapper, not the inner `<pre>` | Runtime reads it from the wrapper after `initCodeGutter` re-parents |
| Provide a valid `@@` hunk header in the diff source | Twin gutter parses it to seed old/new line counters; without it, both columns start at 1 (legal but loses fidelity) |
| Don't mix twin and single mode in the same block | Visual confusion |
| The runtime handles the gutter; authors don't write `.ve-code-linenum--old/--new` themselves | Same discipline as the single-gutter pattern |
