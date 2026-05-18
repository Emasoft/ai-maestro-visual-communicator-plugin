# Sub-technique D1 — Unified diff blocks

## Table of Contents

- [D1.1 What it does](#d11-what-it-does)
- [D1.2 The author markup — preferred form](#d12-the-author-markup--preferred-form)
- [D1.3 The author markup — explicit form (when needed)](#d13-the-author-markup--explicit-form-when-needed)
- [D1.4 The CSS (diff tints)](#d14-the-css-diff-tints)
- [D1.5 The tints come from semantic tokens — NEVER hardcoded](#d15-the-tints-come-from-semantic-tokens--never-hardcoded)
- [D1.6 The line-through-on-del variant](#d16-the-line-through-on-del-variant)
- [D1.7 The hunk header](#d17-the-hunk-header)
- [D1.8 Collapsing context regions (CB-01 reframed §C2)](#d18-collapsing-context-regions-cb-01-reframed-c2)
- [D1.9 Copy behaviour](#d19-copy-behaviour)
- [D1.10 Selection + commenting](#d110-selection--commenting)
- [D1.11 Light + dark verification](#d111-light--dark-verification)
- [D1.12 Tokens consumed](#d112-tokens-consumed)
- [D1.13 Author rules](#d113-author-rules)

Per-line `data-ve-diff="add|del|ctx|hunk"` driving olive / rust tints
from `--ve-code-diff-*` tokens. The unified-column variant of CB-01
(reframed: the Shiki+Zustand implementation is rejected, the
capability — unified diff views — is genuinely missing and implemented
here with the existing CSS-class model; PHASE2 backlog §12 P2).

## D1.1 What it does

A `<pre><code class="language-diff">` block where each `.ve-code-line`
carries `data-ve-diff="add|del|ctx|hunk"`. The CSS tints each line
type:

- `add` → olive-green row band, `+` prefix
- `del` → rust-red row band, `-` prefix
- `ctx` → no tint, leading whitespace prefix (`  `)
- `hunk` → gray-500 header (`@@ -42,7 +42,8 @@`)

The runtime's `initCodeGutter` builds the per-line atoms; the
tokenizer (in `diff` language mode) colours the leading `+` / `-` /
`@@` markers via `highlightDiffLine`; the diff CSS adds the row-tint
backgrounds keyed on the `data-ve-diff` attribute.

## D1.2 The author markup — preferred form

Most authors render diffs from a unified-diff text source. The
simplest form:

```html
<pre><code class="language-diff">@@ -42,7 +42,8 @@ export function hello (name) {
 export function hello (name) {
-  return 'Hi, ' + name;
+  return 'Hello, ' + name;
+  // greeting normalized
 }
</code></pre>
```

The tokenizer's `diff` language descriptor recognizes the leading
character (`+`, `-`, `@@`) and emits whole-line spans. **No author-
authored `data-ve-diff` attribute is needed** for this case — the
tokenizer infers the role from the marker.

This is the LIGHTEST form and the recommended default.

## D1.3 The author markup — explicit form (when needed)

When the source ISN'T a literal unified diff (e.g. the author wants to
show "rewritten lines" with full source visible, not `+`/`-` prefixed):

```html
<pre><code class="language-typescript">export function hello (name) {
<span class="ve-code-line" data-ve-diff="del">  return 'Hi, ' + name;</span>
<span class="ve-code-line" data-ve-diff="add">  return 'Hello, ' + name;</span>
<span class="ve-code-line" data-ve-diff="add">  // greeting normalized</span>
}
</code></pre>
```

The runtime's `initCodeGutter` skips a `<code>` with children — so
this form REQUIRES the author to construct `.ve-code-line` spans
manually. The visual works (the diff CSS reads `data-ve-diff`), but
the gutter machinery is bypassed.

For a NORMAL diff rendering (gutter + tokenizer + diff tints all
active), use Form D1.2.

## D1.4 The CSS (diff tints)

```css
.ve-code-line[data-ve-diff="add"] {
  background-color: var(--ve-code-diff-add-bg);
}
.ve-code-line[data-ve-diff="del"] {
  background-color: var(--ve-code-diff-del-bg);
}
.ve-code-line[data-ve-diff="ctx"] {
  /* no tint — context lines are neutral */
}
.ve-code-line[data-ve-diff="hunk"] {
  color: var(--ve-code-comment);
  font-weight: 500;
  background: transparent;
  padding-top: 6px;
  padding-bottom: 6px;
}
```

Plus the gutter cells get a stronger tint:

```css
.ve-code-line[data-ve-diff="add"] .ve-code-linenum {
  background-color: var(--ve-code-diff-add-gutter);
  color: var(--vc-color-success);
}
.ve-code-line[data-ve-diff="del"] .ve-code-linenum {
  background-color: var(--ve-code-diff-del-gutter);
  color: var(--vc-color-danger);
}
```

Two-tint layered: the row carries a SOFT tint (~22% opacity), the
gutter cell carries a STRONGER tint (~60% opacity). The reader's eye
catches the gutter strip from the corner of vision; the soft row tint
makes the actual change easy to read without dominating.

## D1.5 The tints come from semantic tokens — NEVER hardcoded

The diff tints are `color-mix` over the project's semantic color
tokens, not hardcoded `#9ece9e` / `#a84a32`. See
[diff-tints-from-semantic-tokens.md](./diff-tints-from-semantic-tokens.md)
for the full formula and the "why" — a DESIGN.md change to
`--vc-color-success` / `--vc-color-danger` re-themes every diff in the
plugin.

## D1.6 The line-through-on-del variant

Some PR-review fixtures show deleted lines with `text-decoration:
line-through`. Mined from `17-pr-writeup`:

```css
.ve-code-line[data-ve-diff="del"] .ve-code-content {
  text-decoration: line-through;
  opacity: 0.85;
}
```

This is an OPT-IN variant — add `ve-diff-strike` to the wrapping
`.ve-code-block` to enable:

```html
<div class="ve-code-block ve-diff-strike">
  <pre><code class="language-diff">…</code></pre>
</div>
```

The strike-through emphasises the "removed" nature of `del` lines —
useful for fixtures where the diff is presented historically (the
reader is asked to think about WHY a line was removed).

DO NOT use strike-through for context lines or unrelated
emphasis — strike-through has well-established "deletion" semantics.

## D1.7 The hunk header

A diff hunk header (`@@ -42,7 +42,8 @@ function context`) is a special
line type:

- It uses `data-ve-diff="hunk"` (set by the diff tokenizer or by hand-
  authoring).
- The CSS renders it in the comment colour with no row tint.
- The runtime's `initCodeGutter` excludes it from line numbering — a
  hunk header isn't a source line in either the pre- or post-change
  text.

To exclude from numbering, the tokenizer / author marks the line with
`data-ve-no-counter="1"`. The CSS:

```css
.ve-code-line[data-ve-diff="hunk"] { counter-increment: none; }
.ve-code-line[data-ve-diff="hunk"] .ve-code-linenum::before { content: ""; }
```

The gutter cell is still PRESENT (for layout consistency) but renders
empty.

## D1.8 Collapsing context regions (CB-01 reframed §C2)

A long diff often has 6+ unchanged context lines between changes. The
diff-aware collapse:

```html
<details class="ve-diff-context" data-ve-count="6">
  <summary>↕ 6 unchanged lines</summary>
  <pre><code class="language-diff">…6 lines of ctx…</code></pre>
</details>
```

The `<summary>` shows the count; expanding reveals the context. The
collapsed state shows a thin horizontal rule with the count, mirroring
GitHub's collapsed-context affordance.

When the diff is generated by an AI Maestro agent, the agent should
emit collapsed-context for any unchanged region ≥ 6 lines. Authors
hand-writing diffs can choose to omit context entirely.

## D1.9 Copy behaviour

The copy button copies the DIFF as-written (with `+` / `-` / leading
`  ` markers — that IS the source). To copy the RESOLVED text (only
the post-change version), the user has to either:
- Use a separate code block rendered next to the diff with the
  resolved source.
- Open the diff source in an editor (the copy is honest about being a
  diff).

There is no transform-on-copy magic; the source is the source.

## D1.10 Selection + commenting

Each `.ve-code-line` (add / del / ctx) IS a selectable atom. Multi-
line drag-paint works across mixed diff types. The selection payload
carries the `data-ve-diff` attribute alongside each line, so the
comment-receiving agent knows what the user selected was an add, a
del, or a context.

This is critical for "review the deletion at line 42" — the agent
knows it's a `del`, not a `ctx`, and can respond appropriately.

## D1.11 Light + dark verification

The diff tints MUST be visibly distinct in both themes (otherwise
adds and dels become indistinguishable). The default tints use
`color-mix(... 22%, transparent)` on dark and `color-mix(... 16%,
transparent)` on light — the light-theme reduction keeps the tints
from dominating on a bright surface.

Verification checklist:
- [ ] Dark theme: olive add row is visibly green; rust del row is
      visibly red; both differ from context.
- [ ] Light theme: same — both differ from context.
- [ ] Selected diff line: the per-line accent tint OVERLAYS the diff
      tint cleanly (neither disappears).
- [ ] The gutter cell's stronger tint reads on both themes.

## D1.12 Tokens consumed

- `--ve-code-diff-add-bg` / `-del-bg` — row tints
- `--ve-code-diff-add-gutter` / `-del-gutter` — gutter cell tints
- `--vc-color-success` / `--vc-color-danger` — the source tokens the
  diff tints are mixed from (see
  [diff-tints-from-semantic-tokens.md](./diff-tints-from-semantic-tokens.md))
- `--ve-code-comment` — the hunk header colour

## D1.13 Author rules

| Rule | Why |
|---|---|
| Use `language-diff` for unified-diff source; let the tokenizer infer the row type | Lightest authoring; correct visual |
| Use `data-ve-diff` on individual `.ve-code-line` spans ONLY when the source isn't a literal unified diff (rare) | Explicit form bypasses the gutter; only use when necessary |
| `ve-diff-strike` on the wrapper for "historical removal" emphasis | Opt-in; strike-through has strong semantic meaning |
| Collapse ≥ 6 lines of ctx into a `<details>` | Reading economy; matches GitHub's convention |
| DON'T copy-transform — let the user copy what they see | Honesty; the diff IS the source |
