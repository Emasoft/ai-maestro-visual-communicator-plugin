# Sub-technique D2 — Split-pane diff blocks

Two synced panes (before / after) sharing the page-level scroll axis.
The split-view variant of CB-01 (reframed; PHASE2 backlog §12 C2). The
runtime's `:has()` selector chain lets the two panes share state
without JS coordination.

## D2.1 What it does

Renders two side-by-side `.ve-code-block` panes — "Before" and "After"
— each with its own gutter + selection + copy button. The two panes
share:

- The page's vertical scroll axis (no inner scrolling — both panes
  participate in the document scroll).
- An optional "expand context" affordance (clicking expands the same
  region in both panes simultaneously).
- A label header identifying each pane.

The visual gives the reader a clear before/after comparison without
the noise of `+` / `-` markers; instead, each side shows the literal
file as it was / will be.

## D2.2 The markup

```html
<div class="ve-code-split">
  <div class="ve-code-split__pane" data-side="before">
    <div class="ve-code-split__label">Before</div>
    <div class="ve-code-block">
      <pre><code class="language-typescript">…before source, with del-line tints…</code></pre>
    </div>
  </div>
  <div class="ve-code-split__pane" data-side="after">
    <div class="ve-code-split__label">After</div>
    <div class="ve-code-block">
      <pre><code class="language-typescript">…after source, with add-line tints…</code></pre>
    </div>
  </div>
</div>
```

Each pane is a normal `.ve-code-block`. The split container is just
a flex/grid layout.

## D2.3 The CSS

```css
.ve-code-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.ve-code-split__pane {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;            /* allow the pane to shrink below content; wrap kicks in */
}
.ve-code-split__label {
  font-family: var(--vc-font-mono);
  font-size: var(--vc-text-small);
  color: var(--vc-color-neutral-500);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0 4px;
}
.ve-code-split__pane[data-side="before"] .ve-code-block { /* before-specific tweaks if any */ }
.ve-code-split__pane[data-side="after"]  .ve-code-block { /* after-specific tweaks if any */ }
@media (max-width: 720px) {
  .ve-code-split { grid-template-columns: 1fr; }
  /* On narrow screens the panes stack — still no horizontal scroll */
}
```

**Key constraint:** `min-width: 0` on the pane lets the inner code
block shrink below its natural content width, triggering `pre-wrap` —
the wrap-marker stripe paints, the page never overflows horizontally.

The mobile breakpoint stacks the panes vertically — split view at
< 720px would force each pane below 360px which is unreadable.

## D2.4 Where to put the diff tints

The two panes show the SAME source TYPE (e.g. TypeScript), with the
"before" pane showing del-tinted lines for removed bits and the
"after" pane showing add-tinted lines for new bits. Context (ctx) is
shared between both, untinted.

```html
<!-- Before pane content example -->
<pre><code class="language-typescript"><span class="ve-code-line" data-ve-diff="ctx">function hello (name) {</span>
<span class="ve-code-line" data-ve-diff="del">  return 'Hi, ' + name;</span>
<span class="ve-code-line" data-ve-diff="ctx">}</span>
</code></pre>

<!-- After pane content example -->
<pre><code class="language-typescript"><span class="ve-code-line" data-ve-diff="ctx">function hello (name) {</span>
<span class="ve-code-line" data-ve-diff="add">  return 'Hello, ' + name;</span>
<span class="ve-code-line" data-ve-diff="add">  // greeting normalized</span>
<span class="ve-code-line" data-ve-diff="ctx">}</span>
</code></pre>
```

The hand-authored `data-ve-diff` form is explicit — split-view diffs
are usually agent-generated from a parsed unified diff, with the
agent emitting one pane per side with the correct tints per line.

For agent-generated content, the agent should emit:
- The full "before" source with `del` rows marking what's about to be
  removed.
- The full "after" source with `add` rows marking what was inserted.
- Identical context lines (`ctx`) on both sides — same line content,
  same line number, no tint.

## D2.5 Line-number alignment

In a true side-by-side diff, line N in "before" should LOOK at the same
horizontal level as line N (or N+offset) in "after". For ADDED lines
in "after", the "before" pane shows a blank "phantom" line at the same
position; for REMOVED lines in "before", the "after" pane shows a
phantom line.

The phantom line is a `.ve-code-line` with no content:

```html
<span class="ve-code-line" data-ve-diff="phantom" data-ve-no-counter="1">&nbsp;</span>
```

CSS:

```css
.ve-code-line[data-ve-diff="phantom"] {
  background: repeating-linear-gradient(
    45deg,
    transparent 0,
    transparent 8px,
    color-mix(in srgb, currentColor 4%, transparent) 8px,
    color-mix(in srgb, currentColor 4%, transparent) 16px
  );
  opacity: 0.5;
  counter-increment: none;
}
.ve-code-line[data-ve-diff="phantom"] .ve-code-linenum::before { content: ""; }
```

Phantom lines render as a faint diagonal-hatch band — the "nothing
here" visual. The gutter is empty.

## D2.6 No shared scroll axis

A split-view diff does NOT have a JS scroll-sync between panes. The
two panes share the PAGE-level scroll axis: the reader scrolls the
page, both panes scroll together (because both are positioned at the
same horizontal stripe).

Adding a JS scroll-sync would require each pane to be its own
overflow:auto scrollbox — VIOLATING the no-nested-scrollbars rule. The
two-pane-same-page-scroll model is the correct alternative; the
phantom-line trick keeps the rows aligned without inner scrolling.

## D2.7 Copy behaviour per pane

Each pane has its own copy button. Clicking the "Before" copy button
copies the byte-exact "before" source; clicking the "After" copy
button copies the byte-exact "after" source. Phantom lines do NOT
appear in the copy payload (they have `data-ve-no-counter="1"` and
their content is `&nbsp;` — the runtime's `__veSourceText` stash
captures the original source text, not the rendered phantoms).

There is NO "copy the resolved version" button — the "after" pane's
copy button IS the resolved version.

## D2.8 Selection across panes

A reader can select lines in the "before" pane AND in the "after"
pane simultaneously. The selection payload includes a `pane` field
indicating which side each line came from. The runtime's selection
machinery doesn't enforce "single pane at a time" — both can be
selected for comment.

For a comment that's specifically about a change ("why was this
deleted?"), the user typically selects the `del` line in "before" or
the `add` line in "after". The agent receiving the comment uses the
`pane` + `data-ve-diff` to understand the intent.

## D2.9 Composing with file-path label

Each pane gets its own file-path label, or the labels become "Before
[file path]" and "After [file path]" when both panes are the same
file (the common case):

```html
<div class="ve-code-split">
  <div class="ve-code-split__pane">
    <div class="ve-code-path">src/auth/middleware.ts <span class="ve-code-path__lines">Before</span></div>
    <div class="ve-code-block">…</div>
  </div>
  <div class="ve-code-split__pane">
    <div class="ve-code-path">src/auth/middleware.ts <span class="ve-code-path__lines">After</span></div>
    <div class="ve-code-block">…</div>
  </div>
</div>
```

The line-range slot ("After" / "Before") doubles as a side label. Clean.

## D2.10 When to use split vs unified

| Use split when… | Use unified when… |
|---|---|
| The change is small in line count but the surrounding context matters (full file shown) | The change is the whole story (no need to see unchanged code in two columns) |
| The change is conceptual (refactor) — "look how it READS now" matters | The change is mechanical (rename, deletion) — `+ / -` is enough |
| The reader is unfamiliar with diff format | The reader is a developer (GitHub-style diff is native) |
| The viewport is wide (> 720px) | The viewport is narrow → unified wins (split stacks to 1col anyway) |

A page can mix both — use whichever serves the specific change being
shown.

## D2.11 Light + dark verification

Same as unified diff (see [diff-blocks-unified.md](./diff-blocks-
unified.md) §D1.11). Plus:

- [ ] Both panes' diff tints read correctly on both themes
- [ ] Phantom lines render as faint hatch in both themes
- [ ] The split layout collapses to a single column at < 720px (stack
      "Before" above "After")
- [ ] Selecting a line in one pane doesn't visually affect the other
      pane

## D2.12 Tokens consumed

- All from [diff-blocks-unified.md](./diff-blocks-unified.md)
- `--vc-color-neutral-500` — the label colour
- `--vc-font-mono` / `--vc-text-small` — label typography

## D2.13 Author rules

| Rule | Why |
|---|---|
| Use the same language on both panes (the SAME file's content) | Comparing apples to apples |
| Use phantom lines for row alignment, not JS scroll-sync | No-nested-scrollbars; correct degradation |
| Each pane gets its own copy button automatically | The runtime handles this |
| Don't add inner `overflow: auto` on a pane | Wraps via the runtime's `pre-wrap`; no inner scrollbox |
| Stack to 1-col below 720px (the CSS does this) | Narrow viewports unreadable in 2-col |
