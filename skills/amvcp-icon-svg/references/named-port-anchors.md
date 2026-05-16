# Named port anchors — re-usable shape with semantic terminals

A pattern mined from kleemans `tikzlibrarysignalflowoperators` /
`tikzlibrarysignalflowblocks`: define a complex shape once with
SEMANTIC PORT names (`.in1`, `.out`, `.outl`, `.dots`) on its
perimeter, then connect to ports BY NAME instead of by pixel offset.
Drastically improves diagram-source readability. Useful for any
N-port box (decoders, demuxers, ALU control units, symbol mappers).

## Why this matters for icon-svg

icon-svg's existing primitives (`process`, `database`, etc.) have
NO named anchors — when you connect to one, you connect to the
bounding-box edges via the `diagram` skill's edge routing.

For a SCHEMATIC diagram with multi-port boxes (a decoder with 8
labeled outputs, a multiplexer with N labeled inputs), you'd need:

1. To author the box as a custom shape.
2. To declare named anchor points on the box.
3. To reference those anchor points from the connecting edges.

This is properly the `diagram` skill's territory (custom-shape +
edge endpoint anchoring). But the named-port concept INFORMS how
icon-svg primitives could be extended.

## The TikZ source pattern (for reference)

```tex
\pgfdeclareshape{symbol mapper shape}{
  \inheritsavedanchors[from=rectangle]
  \inheritbackgroundpath[from=rectangle]
  \savedanchor\centerpoint{...}
  \saveddimen\bound{...}
  \anchor{in1}{\bound\northeast\bound\southwest\center
                \pgf@y=0.1\bound@y \pgf@x=-\bound@x}
  \anchor{in2}{\pgf@y=0.3\bound@y \pgf@x=-\bound@x}
  \anchor{inl}{\pgf@y=0.9\bound@y \pgf@x=-\bound@x}
  \anchor{dots}{\pgf@y=0.6\bound@y \pgf@x=-\bound@x}
  \anchor{out}{\pgf@y=0.5\bound@y \pgf@x=\bound@x}
  ...
}
```

The shape is a 20x20mm rectangle; the anchors are named positions
on its perimeter (`in1` at 10% down the left edge; `in2` at 30%
down; `inl` at 90% — the "last input"; `out` at 50% on the right;
`dots` at 60% — the "..." continuation marker).

Then connections are written:

```tex
\node[symbol mapper shape] (M) at (0,0) {};
\node (src) at (-3,0) {Input};
\draw (src) -- (M.in1);
\draw (src) |- (M.in2);
\draw (src) |- (M.inl);
\draw (M.out) -- (4,0) node[right]{Output};
```

Highly readable — `(M.in1)` says "connect to the first input port
of M", and the renderer figures out the pixel coordinate.

## The HTML/SVG analog

For an icon-svg-equivalent named-port system in HTML/SVG, the agent
would author a custom shape with `<g>` children carrying `data-port`
attributes:

```html
<svg class="schematic-shape" viewBox="0 0 200 200">
  <rect x="40" y="20" width="120" height="160"
        fill="none"
        stroke="var(--vc-color-content)"
        stroke-width="2"/>
  <text x="100" y="100" text-anchor="middle"
        font-family="var(--vc-font-body)">Mapper</text>

  <!-- Named ports — invisible markers, hit-test for connectors -->
  <g data-port="in1" cx="40" cy="40"/>
  <g data-port="in2" cx="40" cy="80"/>
  <g data-port="inl" cx="40" cy="180"/>
  <g data-port="dots" cx="40" cy="120"/>
  <g data-port="out" cx="160" cy="100"/>
</svg>
```

A connecting edge in a sibling SVG references the ports:

```html
<line x1="..." y1="..."
      data-from="(Mapper.in1)"
      data-to="(other.out)"
      ... />
```

Then a small JavaScript helper resolves `(Mapper.in1)` to the actual
pixel coordinate of the matching `<g data-port="in1">`.

## Where this pattern actually lives in this plugin

icon-svg does NOT implement the named-port system. The `diagram`
skill is the canonical home for:

- Custom-shape registries.
- Named-anchor support.
- Edge endpoint resolution.

For a schematic diagram with multi-port boxes, route to the
`diagram` skill (`free` preset + custom nodes + manual edge
authoring). The icon-svg primitives (`process`, `database`, etc.)
do NOT support named ports.

## When the pattern would extend icon-svg

If icon-svg ever grows a `type: "schematic"` family (electronic
schematics, signal-flow diagrams, control-system block diagrams),
the named-port system would be the right scaffolding. Today,
icon-svg's 5 structural primitives + 6 logo blocks + 6 shapes don't
need them.

## Documented as an idea, not a feature

This reference exists to acknowledge the named-port concept as
mined material — useful pattern, not currently icon-svg surface.
The mining sweep flagged it as "gold for AMVCP wireframe / diagram
skills"; for icon-svg, it's a CROSS-REFERENCE to the `diagram`
skill's edge endpoint anchoring.

## When you actually need this

- A circuit schematic with multi-input gates.
- A signal-flow diagram with N-port operators.
- A decoder / demuxer / ALU diagram.
- A communication protocol stack with labeled interfaces.

For all of these, use the `diagram` skill. icon-svg's structural
primitives are for STANDALONE assets with no connectivity.

## What if I really must in icon-svg?

Author your own custom SVG (not via the scene-graph compiler — the
compiler's primitives don't include arbitrary `<g data-port="…">`).
Then connect via the `diagram` skill's edge primitives that
reference your custom ports. The CROSS-SKILL pattern works; the
PURE-ICON-SVG pattern doesn't.
