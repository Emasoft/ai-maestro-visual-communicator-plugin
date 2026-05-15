# ASCII / Unicode diagrams

A no-JS, copy-pasteable diagram fallback. Renders as a themed `<pre>`
that page-expands — wide ASCII art extends the document, never an inner
`overflow:scroll` box.

## When to use ASCII

- The output must survive with JavaScript disabled.
- The diagram will be pasted into a terminal, a code comment, or a
  plain-text channel.
- A 3-second inline sketch where a full SVG scene graph is overkill.

For anything richer — selectable nodes, theming, animation — use the
SVG scene-graph instead (see scene-graph-schema.md).

## The authoring surface

```html
<pre class="ve-ascii-diagram" data-ve-ascii-style="detailed"
     data-ve-ascii-selectable="1">
┌────────┐  1. Request   ┌──────────┐  2. Process   ┌─────────┐
│ Client │──────────────▶│ Gateway  │──────────────▶│ Service │
└────────┘               └──────────┘               └─────────┘
</pre>
```

`amvcp-diagram.js` themes the `<pre>`: `--vc-font-mono`,
`--vc-color-content` text, `--vc-color-surface-sunken` background, a
`--vc-color-border` frame, `--vc-radius-md` corners, and crucially
`overflow: visible` + `white-space: pre`. The `<pre>` is never broken
into per-glyph atoms — that would be meaningless. Set
`data-ve-ascii-selectable="1"` to give the whole block ONE optional
`data-ve-id` so it can be selected and commented as a unit.

## The four styles

`data-ve-ascii-style` records which glyph set the author used. The
runtime CSS is identical for all four (it just renders monospace text);
the attribute is documentation for the agent.

| Style | Glyphs | Use |
|---|---|---|
| `detailed` | Unicode boxes `┌─┐│└┘` + connector labels | the default — clearest |
| `unicode` | Unicode boxes, no connector labels | compact, still pretty |
| `classic` | pure ASCII `+ - |` | maximum compatibility (old terminals) |
| `compact` | a single line `A → B → C` | a quick inline flow |

## Alignment validator (build-time, NEVER shipped)

ASCII diagrams break the moment a double-width character (emoji, CJK)
or a tab sneaks in — monospace columns stop lining up. Validate
alignment BEFORE pasting the diagram into the `<pre>`.

The workflow:

1. Author the diagram.
2. Write it to a temp file.
3. Run the alignment checker against the file. It flags: double-width
   characters that break monospace columns; lines of inconsistent
   display width within a box group; vertical connectors (`│`, `╭`)
   whose column drifts between consecutive lines; tab characters.
4. Fix every error.
5. Only then paste the validated text into the `<pre>`.

The checker is a build-time authoring aid — it is NEVER shipped in the
output HTML and NEVER run by the runtime. It is the home of the
3-zoom escalation pattern too: an overview ASCII sketch -> a detailed
ASCII diagram -> a full SVG scene graph as the diagram grows past what
monospace text can express clearly.

## Page-expansion (the hard rule)

The `<pre>` is `overflow: visible` — a non-negotiable invariant. A wide
ASCII diagram extends the document and the reader uses the page's own
single horizontal scrollbar. Never wrap the `<pre>` in an
`overflow-x: auto` box; that creates a nested scrollbar, which steals
scroll inertia and breaks find-in-page.
