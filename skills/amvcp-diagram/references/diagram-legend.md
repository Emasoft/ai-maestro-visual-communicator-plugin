# Diagram legend

## Table of Contents

- [When a diagram needs a legend](#when-a-diagram-needs-a-legend)
- [The chip-row markup](#the-chip-row-markup)
- [The CSS](#the-css)
- [Shape chips — mirroring the node-type vocabulary](#shape-chips--mirroring-the-node-type-vocabulary)
- [Role chips — mirroring the role tints](#role-chips--mirroring-the-role-tints)
- [Edge chips — mirroring edge styles](#edge-chips--mirroring-edge-styles)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition](#composition)
- [Anti-patterns](#anti-patterns)
- [Visual verification](#visual-verification)

The engine themes nodes by `type` (shape) and `role` (tint), and edges
by style — but a diagram never ships the *key* that decodes them. A
legend is a horizontal row of chips, each chip reproducing one
shape / role / edge-style the diagram actually uses, paired with its
plain-language meaning. Mined from `13-flowchart-diagram.html`
(html-effectiveness catalog #13), whose flowchart shipped a chip legend
(rect = process, rotated square = decision, role-tinted = success /
failure) beneath the canvas.

This is a pure CSS + markup primitive — no engine change. The legend is
authored alongside the diagram and reuses the same `--vc-*` role tokens
the engine resolves, so it re-themes in lockstep with the nodes it
decodes.

## When a diagram needs a legend

| Add a legend | Skip it |
|---|---|
| The diagram uses ≥2 role tints (e.g. success + danger paths) | Single-role / untinted diagram |
| The diagram mixes ≥3 node shapes the reader must distinguish | Only `process` rects |
| Yes/no or sync/async edges carry meaning via color or dashing | All edges identical |
| The audience is not fluent in flowchart shape conventions | Internal diagram for flowchart-literate reviewers |

A legend that decodes a single self-evident shape is noise. Add it only
when the diagram leans on a vocabulary the reader would otherwise have
to guess.

## The chip-row markup

```html
<div class="ve-diagram-legend" aria-label="Diagram legend">
  <span class="ve-legend-chip">
    <span class="ve-legend-chip__swatch ve-legend-chip__swatch--rect"></span>
    process
  </span>
  <span class="ve-legend-chip">
    <span class="ve-legend-chip__swatch ve-legend-chip__swatch--diamond"></span>
    decision
  </span>
  <span class="ve-legend-chip">
    <span class="ve-legend-chip__swatch ve-legend-chip__swatch--role" style="--ve-legend-role: var(--vc-color-success);"></span>
    success path
  </span>
  <span class="ve-legend-chip">
    <span class="ve-legend-chip__swatch ve-legend-chip__swatch--role" style="--ve-legend-role: var(--vc-color-danger);"></span>
    failure path
  </span>
</div>
```

Place the legend directly beneath the SVG canvas (or in the sticky aside
next to it). One chip per vocabulary item the diagram actually uses —
never list shapes/roles that do not appear.

## The CSS

```css
.ve-diagram-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--vc-space-3, 12px);
  margin-block-start: var(--vc-space-3, 12px);
  font-size: var(--vc-text-0, 11px);
  color: var(--vc-color-content-muted, #5b5343);
}
.ve-legend-chip { display: inline-flex; align-items: center; gap: 6px; }
.ve-legend-chip__swatch {
  width: 16px; height: 12px; flex: none;
  border: 1.5px solid var(--vc-color-content-subtle, #8a8170);
  background: var(--vc-color-surface, #faf6ee);
}
/* Shape swatches mirror node-type-library.md geometry: a rect is a
   small rounded rect, a decision is the rotated square the diamond
   reduces to, a terminal is a full pill. One declaration each. */
.ve-legend-chip__swatch--rect    { border-radius: var(--vc-radius-sm, 4px); }
.ve-legend-chip__swatch--pill    { border-radius: 999px; width: 20px; }
.ve-legend-chip__swatch--diamond {
  width: 11px; height: 11px;
  transform: rotate(45deg);
  border-radius: 2px;
}
/* Role swatch: the per-chip --ve-legend-role drives both the tint wash
   and the stroke, so it re-resolves per theme exactly like the engine's
   node fill (14% role over canvas, role stroke). */
.ve-legend-chip__swatch--role {
  border-radius: var(--vc-radius-sm, 4px);
  border-color: var(--ve-legend-role);
  background: color-mix(in srgb, var(--ve-legend-role) 14%, transparent);
}
```

The swatch geometry deliberately echoes `node-type-library.md`: the
diamond chip is the same rotated square the engine's diamond renderer
reduces to at small scale, so the key reads as a shrunken version of the
real node.

## Shape chips — mirroring the node-type vocabulary

Use one shape modifier per node `type` the diagram contains, drawn from
the seven-shape library:

| Node `type` | Swatch modifier | Label |
|---|---|---|
| `process` / `subprocess` | `--rect` | "process" / "sub-process" |
| `decision` | `--diamond` | "decision" |
| `start` / `end` | `--pill` | "start" / "end" |
| `external` | `--rect` + dashed border (see below) | "external" |

For the `external` dashed look, add `border-style: dashed;` inline or
via an `--external` modifier — it mirrors the dashed-stroke rect the
engine draws for `type:"external"`.

## Role chips — mirroring the role tints

For role-tinted diagrams, one chip per role in play. The chip's
`--ve-legend-role` MUST be the same `--vc-color-*` token the node uses
(see `node-type-library.md` "Role tinting per type"):

| `role` | `--ve-legend-role` | Typical label |
|---|---|---|
| `accent` | `var(--vc-color-accent)` | "focus / hot path" |
| `data` | `var(--vc-color-success)` | "success / data store" |
| `infra` | `var(--vc-color-warning)` | "infra / caution" |
| `client` | `var(--vc-color-info)` | "client / entry" |
| (failure) | `var(--vc-color-danger)` | "failure path" |

## Edge chips — mirroring edge styles

When edges carry meaning (yes/no, sync/async), add line-swatch chips:

```html
<span class="ve-legend-chip">
  <span class="ve-legend-chip__line ve-legend-chip__line--solid"
        style="--ve-legend-role: var(--vc-color-success);"></span>
  yes / healthy
</span>
<span class="ve-legend-chip">
  <span class="ve-legend-chip__line ve-legend-chip__line--dashed"
        style="--ve-legend-role: var(--vc-color-danger);"></span>
  no / failure
</span>
```

```css
.ve-legend-chip__line {
  width: 22px; height: 0;
  flex: none;
  border-top: 2px solid var(--ve-legend-role);
}
.ve-legend-chip__line--dashed { border-top-style: dashed; }
```

This matches the engine's yes/no edge coloring (olive solid / rust
dashed) — the legend line is literally the same stroke token + dash
state the edge renders with.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | `--vc-color-*` role tokens (one per chip), `--vc-color-content-muted` (labels), `--vc-color-content-subtle` (neutral swatch stroke), `--vc-color-surface` (swatch fill) |
| typography | `--vc-text-0` (chip text — small) |
| radius | `--vc-radius-sm` (rect / role swatches) |
| spacing | `--vc-space-3` (gap + top margin) |

Every legend swatch resolves the **same** role token its node/edge
resolves, so a theme swap re-tints the legend and the diagram together
— the key is structurally incapable of decoding the wrong color.

## Composition

- Pairs with any `amvcp-diagram` scene that uses ≥2 roles or ≥3 shapes.
- Sits beneath the canvas, or inside the sticky aside of the
  click-step-detail-panel layout (`click-step-detail-panel.md`).
- For a flowchart, list shapes + the yes/no edge chips; for an
  architecture/dependency map, list the role tints (see
  `hot-path-tinting.md` for the single-accent "look here" role).

## Anti-patterns

- **Legend chips for shapes/roles the diagram doesn't use** — the key
  must decode exactly what's on the canvas, nothing more.
- **Hardcoded hex in a swatch** — always a `--vc-color-*` token, or the
  legend drifts from the node colors on a theme swap.
- **A legend on a single-shape, single-role diagram** — pure noise; the
  reader decodes one self-evident shape without help.
- **Re-labelling roles differently from the diagram** — if a node's
  tooltip says "data store", the legend says "data store", not "DB".
- **Putting the legend above the diagram** — it is a key, read *after*
  the reader meets an unfamiliar shape; below or beside the canvas.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser screenshot
light + dark. Confirm each swatch color matches its corresponding node
/ edge in the same screenshot (hold the legend dot next to the node it
decodes — they must be the same hue on both themes). Diamond chip must
read as a diamond, pill as a pill, at the small swatch size.
