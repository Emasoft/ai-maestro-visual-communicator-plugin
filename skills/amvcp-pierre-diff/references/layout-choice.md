# Layout choice — split vs stacked

## Table of Contents

- Decision table
- Inheriting the page's design tokens
- Tradeoffs vs amvcp-code-diff

## Decision table

Pierre's `FileDiff` (and `VirtualizedFileDiff`) accepts `layout: 'split' | 'stacked'` in its options. Pick by the table below; do NOT autopilot one or the other.

| Diff shape | Layout | Why |
|---|---|---|
| Small (< ~30 lines), focused change | `split` | Side-by-side comparison is fast to scan when both sides fit at once |
| Wide screen (≥ 1280 px) + short prose lines | `split` | The split layout's per-side column has plenty of horizontal room without wrapping; reader's eye moves left-right naturally |
| Narrow viewport (< 900 px) or mobile | `stacked` | Split's two columns collapse to ~440 px each — too narrow for most code lines without aggressive wrap |
| Code with long lines (regexes, SQL with `--` comments, embedded JSON) | `stacked` + `wrap: true` | Long lines wrap once instead of twice (split's per-side max-width forces double-wrap) |
| Merge conflicts (`UnresolvedFile` instead of `FileDiff`) | `stacked` (forced) | Conflicts are three-way (`ours` / `base` / `theirs`); split layout doesn't compose with a third column |
| Streaming code (`FileStream`) | `stacked` | Streaming is single-pane by definition (there's no "old" side) |
| 1000+ lines | either + `VirtualizedFileDiff` | Always virtualize at scale; the layout itself can be split or stacked |

The `unified` boolean checkbox in Pierre's demo maps to `layout: 'stacked'` (unified = stacked in their vocabulary).

## Inheriting the page's design tokens

Pierre's themes (`pierre-dark`, `pierre-light`) are independent of our DESIGN.md `--vc-*` tokens. They control:

- syntax-highlighting colours (Shiki tokens)
- diff add/del tints (Pierre's own green/red)
- gutter background, line-number colour, hunk-header background

To synchronise with the page's `--vc-theme`:

```js
import { FileDiff } from './amvcp-pierre-diff.mjs';

function pickTheme(prefersDark) {
  return {
    dark: 'pierre-dark',
    light: 'pierre-light',
  };
}

const instance = new FileDiff({
  container,
  patch,
  options: {
    layout: 'split',
    theme: pickTheme(document.documentElement.dataset.veTheme === 'dark'),
    lang: 'typescript',
  },
});
```

When the user toggles the page theme via the standard `data-ve-theme` flip, the instance picks up the change automatically (Pierre observes the host page's `prefers-color-scheme` media query AND honours the resolved theme key).

If the DESIGN.md presets diverge significantly from Pierre's themes (e.g. a high-contrast accessibility preset), you can swap Pierre's themes for one of Shiki's bundled themes via `theme: { dark: 'github-dark', light: 'github-light' }` — Shiki ships ~60 themes and they're all accessible by name.

## Tradeoffs vs amvcp-code-diff

`amvcp-code-diff`'s split layout is pure CSS twin-column — no per-side viewport, no wrapping engine, ~5 KB of CSS. Pierre's split layout adds:

- two independent virtualized scroll containers (synchronised by `ScrollSyncManager`)
- per-side line-wrap toggle (`wrap: true|false`)
- per-side annotation slot (a comment on the old side stays anchored to old line N even when the user scrolls the new side)
- per-side selection (drag-select range on either side — emits both line numbers in the selection payload)

Picking Pierre's split for a tiny ≤ 30-line diff overkill. Pick `amvcp-code-diff` for those.
