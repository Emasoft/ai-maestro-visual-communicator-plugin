# Virtualizer tradeoffs — when to enable `VirtualizedFileDiff`

## Table of Contents

- Quick decision
- Feature parity matrix
- When to opt OUT of virtualizer
- When to opt IN to virtualizer
- Composition with the no-nested-scrollbars rule
- Overscan tuning
- Selection contract
- Cross-references

Pierre exports two diff classes: `FileDiff` (the simple variant —
every line mounts to the DOM at construction time) and
`VirtualizedFileDiff` (the windowed variant — only the lines
inside the viewport are mounted, rest are placeholder rows).
Picking between them is a tradeoff between memory footprint, initial
render latency, and feature parity.

## Quick decision

| File size (post-image lines) | Class to use |
|---|---|
| < 200 lines | `FileDiff` (no virtualizer overhead) |
| 200 – 1000 lines | Either — pick by feature needs |
| > 1000 lines | `VirtualizedFileDiff` (or page becomes janky) |
| Streaming / unknown size | `FileStream` (always virtualizes) |
| Merge conflict (`UnresolvedFile`) | Virtualizer is baked-in, you don't choose |

## Feature parity matrix

| Feature | `FileDiff` | `VirtualizedFileDiff` |
|---|---|---|
| Split layout | ✓ | ✓ |
| Stacked layout | ✓ | ✓ |
| Shiki syntax highlighting | ✓ | ✓ (lazy per-row) |
| `lineAnnotations` | ✓ | ✓ |
| Per-line click → multi-select payload | ✓ | ✓ |
| `Ctrl+F` find within diff | ✓ | ⚠ search ONLY mounted rows; Pierre adds a "load all" affordance for the full search |
| Native browser find (`Cmd+F`) | ✓ | ⚠ misses non-mounted rows; rely on Pierre's built-in find instead |
| Copy whole diff to clipboard | ✓ | ✓ (Pierre lifts the unmounted-row text from its source buffer) |
| Print / `window.print()` | ✓ | ⚠ unmounted rows ARE materialized for print; large diffs take long to paint |
| Memory footprint (10k lines) | ~50 MB (per-row DOM) | ~3 MB (50 row buffer) |
| Initial render latency (10k lines) | ~3 s on M1 | ~80 ms |

## When to opt OUT of virtualizer

- Short diffs (< 200 lines) — DOM mount cost is negligible, and
  you keep native browser find.
- Print-first pages (e.g. a PDF-export of the report) — the
  virtualizer's lazy paint hurts the print pipeline.
- Diffs the user will read top-to-bottom only once (no scrolling
  back and forth) — extra mount cost is one-time, not amortized.

## When to opt IN to virtualizer

- File ≥ 1000 lines.
- Page renders multiple diffs (every additional non-virtualized
  diff multiplies the memory footprint).
- The page is embedded in a layout that already has a heavy DOM
  (10k+ nodes elsewhere) and an additional 10k diff rows would
  hit V8's per-document node-count cliffs.

## Composition with the no-nested-scrollbars rule

Pierre's virtualizer needs to know the scroll position to mount
the right window of rows. By default it reads from its OWN scroll
container — an `overflow: auto` div around the rendered rows. This
violates the project's no-nested-scrollbars rule.

Pass `options.scrollHost: 'page'` to make the virtualizer track the
document's `scrollY` instead. The diff then expands to its full
natural height; the document's outer scrollbars are the only ones
the user sees. The virtualizer still mounts/unmounts rows based on
viewport intersection — the memory benefit is preserved.

```js
const instance = new VirtualizedFileDiff({
  container,
  patch,
  options: {
    layout: 'split',
    lang: 'typescript',
    scrollHost: 'page',     // ← key option
    overscan: 30,           // mount 30 extra rows above/below for fast scroll
  },
});
```

## Overscan tuning

`overscan` controls how many rows are kept mounted ABOVE and BELOW
the viewport — higher overscan = smoother fast scrolling, more
memory. Defaults to 20.

- For trackpad / smooth scrolling: 20 is fine.
- For keyboard navigation (PageUp / PageDown): bump to 40.
- For a diff inside a slide deck or modal where the user JUMPS
  to specific lines: 10 is enough.

## Selection contract

The selection payload format is identical whether you use
`FileDiff` or `VirtualizedFileDiff` — the consumer can't tell the
difference. The only nuance: when the user has selections in
non-mounted rows AND submits, the virtualizer materializes JUST
those rows (not the whole file) to read the line content. There's
no risk of `content: null`.

## Cross-references

- [`layout-choice`](./layout-choice.md) — applies to both classes.
- [`annotation-contract`](./annotation-contract.md) — annotations work identically.
- [`streaming-codeview`](./streaming-codeview.md) — `FileStream` is always virtualized; this doc covers the deferred-diff case.
- [`merge-conflict`](./merge-conflict.md) — `UnresolvedFile` bakes in the virtualizer; you can't opt out.
- Parent: [`SKILL.md`](../SKILL.md).
