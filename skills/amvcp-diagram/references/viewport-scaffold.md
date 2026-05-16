# Viewport scaffold — pan + zoom + mini-map for dense diagrams

When a diagram is too large or too dense to render comfortably inline,
opt in to **viewport mode**: a fixed-height container with a draggable
canvas, mouse-wheel zoom, a toolbar (top-right), and a draggable
mini-map (bottom-right).

## Why this exists (and why it's allowed)

The project's hard invariant is `no-nested-scrollbars`: wide content
extends the document, never introducing a second inner scroll axis.
Map-like surfaces are the documented exception (`~/.claude/rules/
no-nested-scrollbars.md` — "True application surfaces with a fixed
viewport (a code editor, a video timeline, a map). Those are not
'pages' in the sense the rule covers — they own their viewport by
design").

A 1800 × 1100 architecture diagram with 25 nodes and 28 edges is a
map. The reader navigates it the same way they navigate a map (pan,
zoom, jump-via-overview). Rendering it inline at viewport width
collapses every node to illegible postage stamps; rendering it
inline at natural width pushes everything else off the page.

The viewport scaffold gives a diagram its own fixed-height surface
with proper map controls — exactly the documented exception.

## How to enable

Add `data-ve-scene-viewport="<height-in-px>"` to the host element:

```html
<div class="ve-scene-graph"
     data-ve-scene-preset="free"
     data-ve-scene-viewport="420">
  <script type="application/json">
    { "version": 1, "preset": "free",
      "width": 1800, "height": 1100, ... }
  </script>
</div>
```

The minimum accepted height is `120`; values below that are clamped
to the default `480`. Anything ≥ `120` is honoured verbatim.

**Without the attribute, nothing changes** — the SVG keeps
`width: 100%` and the diagram extends the document horizontally (the
existing no-nested-scrollbars default). Viewport mode is strictly
opt-in.

## What you get

| Surface              | Behaviour                                              |
| -------------------- | ------------------------------------------------------ |
| `.ve-scene-stage`    | Fills the host, `overflow: hidden`, cursor `grab`.     |
| `.ve-scene-canvas`   | The transform target (`translate(x,y) scale(s)`).      |
| `<svg>` (natural-px) | Re-mounted inside `.ve-scene-canvas` at its declared `width` × `height`. |
| `.ve-scene-toolbar`  | Top-right: `−` / slider / `+` / label / `Fit` / `1:1` / `W` (fit-width). |
| `.ve-scene-minimap`  | Bottom-right: clone-SVG of the whole scene + accent-coloured frame rectangle. |

### Interactions

| Gesture                                | Effect                                  |
| -------------------------------------- | --------------------------------------- |
| Mouse-down + drag on the stage         | Pan the canvas (clamped to scene bounds). Cursor flips `grab` → `grabbing`. |
| Wheel up / down on the stage           | Zoom in / out, centred on the cursor (`preventDefault` so the page doesn't scroll). |
| Toolbar `−` / `+`                      | Step zoom out / in centred on the stage. |
| Toolbar slider                         | Direct zoom to a position between `min` (20%) and `max` (400%). |
| Toolbar `Fit`                          | Scale + centre the whole scene inside the stage. |
| Toolbar `1:1`                          | Actual size (scale = 1), centred. |
| Toolbar `W`                            | Fit to width (top-aligned). |
| Click + drag inside the mini-map       | Pan the canvas so the click point becomes the centre of the stage. |
| Click on a node atom (`data-ve-id`)    | Treated as a normal selection click — pan does NOT start (the gesture is consumed by the atom). |

### Initial state

On mount, the canvas is positioned via **fit-all**: the scene is
scaled to fit the stage, centred horizontally and vertically. So
the reader's first impression is always the whole diagram, never a
random crop.

## Comment-handle adjustment

The default `.ve-comment-handle` sits at `left: -40px` outside the
host. In viewport mode the host has `overflow: hidden`, so the
handle would be clipped. The injected CSS overrides position to
`left: 8px` (inside the stage, above toolbar/minimap z-index) so a
comment handle is still visible when an atom inside the viewport is
selected.

## Theme-token usage

Every visual reads `--vc-*` tokens via `var(--vc-*, fallback)`. A
DESIGN.md theme swap re-themes the toolbar, mini-map, frame, and
grid background automatically — no JS re-render needed. Both light
and dark themes are correct by construction.

Specifically:
- Toolbar background: `var(--vc-color-surface)` with 92% alpha mix
- Toolbar buttons: hover paints with 14% mix of `--vc-color-accent`
- Slider thumb: `accent-color: var(--vc-color-accent)`
- Mini-map frame: 2-px `--vc-color-accent` border + 12% mix fill
- Stage grid: 40% mix of `--vc-color-border` for grid lines

## When NOT to use viewport mode

- Small diagrams that fit the page at natural width (the default
  extend-page render is friendlier — no scroll-trap, page-search
  works).
- Diagrams meant to be screenshotted / printed inline as part of a
  PDF report (viewport mode clips; a wide inline render captures
  fully).
- Charts (those live in `amvcp-chart.js`, not this module).

For everything else dense — architecture canvases, large
state-machine diagrams, sprawling sequence diagrams — the viewport
keeps the page tidy and the diagram navigable.

## Reference test cases

- `tests/scripts/test-diagram.js`:
  - `diagram_viewport_scaffold_mounted` — host scaffold + control
    presence + default-mode untouched.
  - `diagram_viewport_fit_all_on_load` — initial scale matches
    `min(stageW/sceneW, stageH/sceneH)` within 1%.
  - `diagram_viewport_zoom_controls` — buttons, slider, and wheel
    all monotonically mutate scale.
  - `diagram_viewport_pan_drag` — after `1:1`, dragging the stage
    shifts the canvas by the drag delta.
  - `diagram_viewport_minimap_frame` — clone-SVG present (no
    `data-ve-id` leak), frame rectangle dimensions non-zero,
    minimap drag updates canvas transform.
  - `diagram_viewport_non_viewport_unaffected` — scenes without
    the opt-in attribute keep `overflow: visible` + percent-width
    SVG.

The fixture scene that backs these tests is `#scene-viewport` in
`tests/fixtures/diagram-fixture.html` — a 1800 × 1100 4-layer
e-commerce architecture canvas (25 nodes / 28 edges).
