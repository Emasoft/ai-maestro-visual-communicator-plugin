# Flow animation

Animated SVG edges and scroll-reveal for scene graphs. Pure SVG / SMIL
/ CSS — zero dependencies.

## Accessibility gate (mandatory)

Every animated edge ships a `prefers-reduced-motion: reduce`
substitute. Under reduce the edge renders **static-visible** — no dash
march, no particle, no pulse halo — but is still fully drawn. The
substitute is meaning-preserving: the edge still connects its two
nodes; only the decorative motion is removed. The OS preference is read
once at module load and re-read live on change (a mid-session toggle
re-renders the diagrams).

## Animated edges

Set `animate` on an edge in the scene graph. Three techniques:

| `animate` | Technique | How it works |
|---|---|---|
| `flow` | flowing dashes | `stroke-dasharray: 8 12` + an `<animate>` marching `stroke-dashoffset` from 0 to -20, `repeatCount="indefinite"`. The duration derives from `--vc-duration-slow`. |
| `particle` | a dot on the path | a small `<circle>` + `<animateMotion>` with an `<mpath>` pointing at the edge path; the dot travels the exact route. |
| `pulse` | a glow halo | a `<filter>` with an `<feGaussianBlur>` whose `stdDeviation` is animated `2 -> 5 -> 2`; the edge breathes. |

SMIL `dur` attributes **cannot reference a CSS variable**, so the flow
engine resolves `--vc-duration-*` to a concrete value at render time.
On a motion-token change the durations are re-written when the scene
re-renders.

## Scroll-reveal

Set `data-ve-scene-reveal="scroll"` on the `.ve-scene-graph` wrapper.
Each edge path starts with `stroke-dasharray` = its full length and
`stroke-dashoffset` = the full length too — i.e. invisible. An
`IntersectionObserver` fires once per node; when a node scrolls into
view the connecting edges transition `stroke-dashoffset` to 0 — the
draw-on reveal. The path-length approach works for curved (bezier /
loop) edges, not just straight ones.

The transition duration is `--vc-duration-slow`. Under
`prefers-reduced-motion: reduce` the offset is set to 0 immediately —
the edge is simply there, no draw animation.

If `IntersectionObserver` is unavailable the engine fails SAFE: it
draws every edge at once. Content is never stuck invisible.

## Motion-token consumption

The flow layer reads only `--vc-duration-*` and `--vc-easing-*`. The
`motion:` group of a DESIGN.md is **optional** — when it is absent the
layer uses documented fallbacks (`flow` 1.4s, draw-on 400ms) and the
diagram still animates correctly. Fail-fast does not apply to optional
token groups.

## Theme hot-swap

The DESIGN.md engine fires a theme-change event when a DESIGN.md is
hot-swapped. The diagram module binds a listener on `vc:themechange`
(the documented event name; the legacy `themechange` is also bound).
On the event every scene graph is re-rendered from its stored pristine
JSON — most fills re-theme for free because they are `var(--vc-*)`
expressions; the re-render covers any value that had to be baked.
