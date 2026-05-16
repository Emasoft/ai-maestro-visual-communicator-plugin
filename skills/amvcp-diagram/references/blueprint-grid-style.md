# Blueprint grid style

The `blueprint` theme preset — cyan-on-navy engineering-drawing
aesthetic. Pair with `background: "grid"` for the full effect.
The diagram reads as a piece of engineering documentation, not a
marketing pitch.

## When to choose the blueprint style

Use the blueprint style when:

- The diagram is **engineering documentation** (system design,
  protocol diagram, technical reference).
- The reader expects a **schematic look** (the audience is
  developers or architects).
- The DESIGN.md theme is otherwise too brand-y for the
  technical content.

Do NOT use the blueprint style when:

- The diagram is **customer-facing marketing** (use the default
  theme).
- The page is mostly prose with a small diagram (the blueprint
  style attracts visual attention disproportionate to the
  diagram's importance).
- The DESIGN.md already uses a navy or cyan palette (the
  blueprint clashes).

## Authoring

Apply the preset via `data-ve-scene-theme` on the wrapper:

```html
<div class="ve-scene-graph"
     data-ve-scene-preset="architecture-canvas"
     data-ve-scene-theme="blueprint">
  <script type="application/json">
    {
      "version": 1,
      "preset": "architecture-canvas",
      "background": "grid",
      "width": 1200,
      "height": 720,
      ...
    }
  </script>
</div>
```

The blueprint theme overrides `--vc-*` tokens ON THE WRAPPER
(not on `:root`), so multiple diagrams on one page can carry
different themes.

## The blueprint palette

| Token | Light value | Dark value |
|---|---|---|
| `--vc-color-canvas` | `#0d1830` (deep navy) | `#040814` (near black) |
| `--vc-color-surface` | `#1b2a4a` | `#0a1428` |
| `--vc-color-surface-sunken` | `#142139` | `#06101e` |
| `--vc-color-content` | `#d0e6ff` | `#a8c8e8` |
| `--vc-color-content-muted` | `#7a92b8` | `#5e7896` |
| `--vc-color-border` | `#2a4070` | `#152540` |
| `--vc-color-border-strong` | `#3a5588` | `#264070` |
| `--vc-color-accent` | `#22d3ee` (cyan) | `#22d3ee` |
| `--vc-color-on-accent` | `#04111c` | `#04111c` |
| `--vc-color-info` | `#60a5fa` | `#60a5fa` |
| `--vc-color-success` | `#34d399` | `#34d399` |
| `--vc-color-warning` | `#fbbf24` | `#fbbf24` |
| `--vc-color-danger` | `#fb7185` | `#fb7185` |

The light + dark values are deliberately CLOSE (the blueprint
look is dark even on light themes — the navy IS the canvas).

## The grid background

`background: "grid"` paints a faint grid:

- Minor grid (4-unit) at very low alpha — barely visible.
- Major grid (20-unit) at moderate alpha — clearly visible.
- Feature grid (100-unit) at higher alpha — used as visual
  scaffolding for the diagram's primary structure.

The grid is in `--vc-color-border` at low alpha. On the
blueprint palette, the grid reads as faint cyan lines on the
navy canvas — the classic blueprint look.

## Stroke widths

The blueprint style increases stroke widths slightly for the
"drawing" feel:

```css
[data-ve-scene-theme="blueprint"] .vc-scene-graph rect,
[data-ve-scene-theme="blueprint"] .vc-scene-graph polygon,
[data-ve-scene-theme="blueprint"] .vc-scene-graph path {
  stroke-width: 2;
}
[data-ve-scene-theme="blueprint"] .vc-scene-graph path[data-ve-edge] {
  stroke-width: 1.8;
}
```

Thicker strokes read as "drafted" lines.

## Typography

The blueprint style switches to `--vc-font-mono` for labels:

```css
[data-ve-scene-theme="blueprint"] .vc-scene-graph text {
  font-family: var(--vc-font-mono);
  letter-spacing: 0.05em;
}
```

Mono-font labels add to the technical aesthetic.

## Edge labels

Edge labels in the blueprint style sit in small monospaced
chips:

```css
[data-ve-scene-theme="blueprint"] .vc-scene-graph
  text[data-ve-edge-label] {
  background: var(--vc-color-surface);
  padding: 2px 6px;
  font-size: var(--vc-text-0);
  font-family: var(--vc-font-mono);
}
```

The chip background ensures readability when the label sits
ON the edge line.

## Theme pairing rules

The blueprint style pairs naturally with:

- `architecture-canvas` preset (layered engineering view).
- `free` preset with a schematic content (floor plans,
  circuit layouts).
- `background: "grid"` (always — without the grid the look is
  incomplete).

It pairs awkwardly with:

- `process-flow` (the brand-y process visualization clashes
  with the engineering feel).
- `phase-graph` (cards on blueprint feel heavy; cards belong
  to the default/dark themes).

## DESIGN.md tokens consumed

The blueprint theme defines values for every base `--vc-*`
token group. Importing the theme into a project's DESIGN.md:

```yaml
colors:
  light:
    canvas: '#0d1830'
    surface: '#1b2a4a'
    accent: '#22d3ee'
    # ...
  dark:
    # same — blueprint is dark-by-design
fonts:
  body: 'JetBrains Mono, monospace'
```

The DESIGN.md engine resolves these and the scene-graph
re-renders against them.

## Selection atoms

No changes to the selection contract — atoms are the same. The
hover/select treatment uses `filter: brightness(1.08)` (theme-
agnostic), so it works fine on the blueprint palette.

## Variations

### High-contrast blueprint

For accessibility audits, swap the blueprint's slightly faded
text colors for WCAG AAA contrast:

```yaml
colors:
  light:
    content: '#ffffff'
    border-strong: '#7090c0'
```

Loses some of the "drafted" feel but improves readability.

### Terminal-blueprint hybrid

Combine the blueprint canvas with terminal-green accents (used
for "active" elements):

```yaml
colors:
  light:
    canvas: '#0d1830'
    accent: '#34d399'    # terminal green instead of cyan
```

Creates a "command-and-control" aesthetic.

## Anti-patterns

- Blueprint theme on a marketing diagram: clashes with the
  brand voice; the technical look feels inappropriate.
- Blueprint theme with NO grid background: incomplete; the
  grid is half the look.
- Blueprint theme with proportional fonts: clashes with the
  monospace label convention.
- Multiple blueprint diagrams on the same page next to default-
  themed diagrams: visual confusion; the reader has to mentally
  switch themes mid-scroll.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark. Confirm:

- The grid is visible but not dominant.
- Node fills are distinguishable from the canvas (a common bug:
  surface and canvas too close in value, nodes disappear).
- Cyan accent reads as ACCENT (not just another navy shade).
- Mono labels are crisp and readable at typical zoom.
