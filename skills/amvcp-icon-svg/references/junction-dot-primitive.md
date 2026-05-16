# Junction-dot primitive — wire / cable intersection marker

The junction dot is a TINY SVG icon: a small filled circle that
marks a wire intersection in a schematic diagram. Adopted from the
TikZ `\tikzstyle{branch}=[fill,shape=circle,minimum size=3pt,inner
sep=0pt]` declaration used 30+ times across electronic-circuit
schematics (mined source: kleemans schematic diagrams). icon-svg
exposes the junction dot as a hand-author pattern; it's NOT a
first-class primitive (no `type: "junction"` keyword) because the
canonical home for wire-junctions is the `diagram` skill.

## What it renders

A single small filled `<circle>`:

```html
<circle cx="<x>" cy="<y>" r="8" fill="var(--vc-color-content)"/>
```

The 8-unit radius in the 1000-space renders as a ~3px dot at typical
display sizes — small enough to read as a JUNCTION (not a node), big
enough to be visually unambiguous.

## How to author one

icon-svg's scene-graph primitive types don't include "junction" —
the closest is a `shape` with custom `kind` (but `shape` only
supports the 6 documented kinds). So junctions are authored in the
`diagram` skill as part of edge geometry, NOT in icon-svg.

If you NEED a standalone junction dot in icon-svg (rare —
schematics belong in `diagram`), use a `tint-hierarchy` logo block
at a very small size, OR hand-author a `<circle>` in raw SVG inside
a `free` scene (but icon-svg doesn't have a `free` preset — that's
a diagram-skill feature).

The PRACTICAL pattern: author the junction in `diagram` as part of
the edge:

```json
{
  "version": 1,
  "preset": "free",
  "nodes": [
    { "id": "a", "type": "process", "x": 100, "y": 100,
      "w": 200, "h": 100, "label": "A" }
  ],
  "edges": [
    { "from": "a", "to": "b", "label": "•",
      "route": "ortho" }
  ]
}
```

(With the `•` Unicode label, the edge midpoint gets a junction dot
glyph — but that's the diagram-skill way.)

## Why icon-svg doesn't have a junction primitive

icon-svg is for STANDALONE AUTHORED ASSETS — icons, logos, frames,
shapes, hotspots. A junction is a CONNECTIVITY MARK that lives
inside an edge — wire intersections only make sense when there ARE
wires. Wires + nodes = `diagram` skill.

The icon-svg-spec deliberately keeps junctions out of scope (the
`shape` primitive includes star / chevron / hexagon / etc. — visual
glyphs, not connectivity marks).

## When you DO need a junction in icon-svg (the edge case)

A standalone "dot" mark — a polka dot, a bullet glyph, a focal point
— is just a tiny circle. Hand-author it via a `shape: hexagon` at
small size (which renders close-to-round at low resolutions) or use a
CSS `<span>`:

```html
<span style="display: inline-block;
             inline-size: 8px; block-size: 8px;
             background: var(--vc-color-content);
             border-radius: 50%;"></span>
```

This is JUST a styled span — no icon-svg primitive at all. For a
selectable bullet (e.g. a clickable dot), add `data-ve-id` and
`role="button"` like a hotspot.

## Cross-skill seam — junction dots in the `diagram` skill

The `diagram` skill renders edges as `<path>` elements; it can
optionally place a `<circle>` glyph at every T-junction in the
network. The diagram skill has a `references/edge-glyphs.md` that
describes the junction-dot at edge boundaries. This is where the
junction concept properly lives.

## Visual verification

A 3px dot rendered at typical viewport sizes is hard to verify
visually — zoom in to 200%+ to confirm:

- The dot is a CIRCLE (not a square / not a polygon).
- The dot is FILLED with the chosen color.
- The dot is CENTERED at its `(cx, cy)` coordinate.

In both light AND dark themes, confirm the dot's fill color
contrasts with the surface — for an ink dot on a canvas surface, the
contrast should be clear.

## Why this reference exists

The mining sweep (kleemans-extended) flagged the "branch-dot named
style for wire junctions" as a `icon-svg` category idea worth
cataloging. Documenting WHY icon-svg deliberately doesn't include it
(and where to find the canonical implementation in `diagram`) is
the responsible classification.

For a real junction-dot system, see the `diagram` skill's
references. For a standalone tiny dot, use the CSS `<span>`
pattern above.
