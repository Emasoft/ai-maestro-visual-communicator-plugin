# Sub-technique E10 — Source-location chip

## Table of Contents

- [E10.1 The pattern](#e101-the-pattern)
- [E10.2 The markup](#e102-the-markup)
- [E10.3 The CSS](#e103-the-css)
- [E10.4 Where it appears](#e104-where-it-appears)
- [E10.5 The line-range forms](#e105-the-line-range-forms)
- [E10.6 Selection / commenting](#e106-selection--commenting)
- [E10.7 Light + dark verification](#e107-light--dark-verification)
- [E10.8 Tokens consumed](#e108-tokens-consumed)
- [E10.9 Anti-patterns](#e109-anti-patterns)
- [E10.10 Mined source attribution](#e1010-mined-source-attribution)

The smallest recurring code-explainer atom: a `path:line` location
label. Mono path in full-contrast content color, the line-range dimmed
one step so the eye reads the file first, the range second. It recurs in
every code-explainer THING — the callstack walkthrough step head, the
`<details>` summary of a collapsed snippet, a "where to focus" card, a
detail-panel `meta` line. Mined from `04-code-understanding.html`
(html-effectiveness catalog #4), whose walkthrough steps carried a
`file.ts :22-48` location chip (`.step-loc` + dimmed `.range`).

This is a one-class graphic-style primitive — no JS required for the
static form. It is the visual unit that the larger compositions
(`architecture-explainer-snippets.md` E6, `collapsed-snippets-walkthrough.md`
E2) already point at by hand; naming it gives them one shared spelling.

## E10.1 The pattern

A `path` segment + a `range` segment, side by side, mono. The path is
`--vc-color-content` (full contrast); the range is `--vc-color-content-muted`
(dimmed) so the hierarchy reads "file, then where in it" without bold or
size changes.

## E10.2 The markup

```html
<span class="ve-loc-chip">
  <span class="ve-loc-chip__path">src/auth/jwt.ts</span>
  <span class="ve-loc-chip__range">L15-L38</span>
</span>
```

The two inner spans are separate so the range can dim independently and
so the selection payload (E10.6) can read path and range as distinct
fields.

## E10.3 The CSS

```css
.ve-loc-chip {
  display: inline-flex;
  align-items: baseline;
  gap: var(--vc-space-2, 8px);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
}
.ve-loc-chip__path  { color: var(--vc-color-content, #1f1a14); }
.ve-loc-chip__range { color: var(--vc-color-content-muted, #5b5343); }
```

Two color tokens, one font token, one size token — the dim-the-range
hierarchy comes entirely from the `content` / `content-muted` pair, so a
theme swap keeps the same two-tier contrast on both light and dark.

### Boxed variant (standalone, off a prose line)

When the chip sits on its own (a card corner, a panel `meta` slot) a
faint pill makes it a discrete object:

```css
.ve-loc-chip--boxed {
  padding: 2px 8px;
  border-radius: var(--vc-radius-sm, 4px);
  background: var(--vc-color-surface-sunken, #f1ece0);
}
```

Inline in running prose, use the unboxed form; standalone, the boxed.

## E10.4 Where it appears

| Composition | Slot |
|---|---|
| `collapsed-snippets-walkthrough` (E2) | right side of each `<summary>` |
| `architecture-explainer-snippets` (E6) | the step head, beside the badge |
| `click-step-to-code-panel` (G1) | the detail panel `meta` line |
| `feature-explainer-tabbed` (E7) | the "where" label on a step |
| a "where to focus" card | the `→ path L42` link text |

In every case it is the same atom — author it once, reuse the class.

## E10.5 The line-range forms

| Content | Form |
|---|---|
| Single line | `L42` |
| Range | `L15-L38` |
| Whole file | omit the range span (path only) |
| Column-precise | `L42:8` (rare — only when the column matters) |

Use the `L` prefix consistently (matches editor / GitHub deep-link
convention). Do not mix `15-38` and `L15-L38` across one page.

## E10.6 Selection / commenting

The chip is selectable as a unit (`{type:"source-location", path:"…",
range:"L15-L38"}`) so a reviewer can comment "this range is stale — the
function moved" without selecting the surrounding prose. When the chip
labels a code block, the comment payload carries both the chip's
path/range AND the selected code, giving the agent precise context.

```html
<span class="ve-loc-chip" data-ve-id="vc-loc-3" data-ve-type="source-location"
      data-ve-data='{"path":"src/auth/jwt.ts","range":"L15-L38"}'>
  <span class="ve-loc-chip__path">src/auth/jwt.ts</span>
  <span class="ve-loc-chip__range">L15-L38</span>
</span>
```

## E10.7 Light + dark verification

- [ ] Path reads at full contrast on both themes
- [ ] Range is visibly dimmer than the path, yet still legible, on both
      themes (the `content` / `content-muted` gap must survive the dark
      canvas)
- [ ] Boxed variant: the sunken-surface pill is distinguishable from the
      page background on both themes

## E10.8 Tokens consumed

| Token | Used in |
|---|---|
| `--vc-font-mono` | The whole chip |
| `--vc-color-content` | Path segment |
| `--vc-color-content-muted` | Range segment (the dim) |
| `--vc-text-0` | Chip size (small) |
| `--vc-color-surface-sunken` | Boxed variant background |
| `--vc-radius-sm` | Boxed variant corner |
| `--vc-space-2` | Path↔range gap |

## E10.9 Anti-patterns

- **Path and range the same color** — the hierarchy is the whole point;
  dim the range or the eye can't tell file from location.
- **Hardcoded color instead of the `content` / `content-muted` pair** —
  the dim must be a token so it survives a theme swap.
- **Bolding or up-sizing the range to "make it visible"** — that
  inverts the hierarchy; the file name leads.
- **A non-mono path** — file paths are code; a proportional font breaks
  the alignment and the convention.
- **Inventing a range syntax** (`lines 15 through 38`) — use `L15-L38`;
  it matches every editor and code host the reader already knows.

## E10.10 Mined source attribution

Catalog quote from the "diagrams" group, source `04-code-understanding.html`:

> *"`file.ts :22-48` line-range location label (`.step-loc` + `.range`)
> — MISSING as a named primitive … there is no dedicated 'source
> location chip' (path in mono + dimmed line-range) documented. Small
> but recurring in code-explainer THINGS."*

Adopted as this one-class primitive so every code-explainer composition
spells the location label the same way.
