# Node primitive — decision (diamond)

The `decision` node is the flowchart yes/no fork: a diamond drawn as
a `<polygon>` with 4 points on the 4-unit grid. Outline-only,
hairline-stroked. Conventionally tinted `warning` to mark "the reader
needs to choose a branch", but accepts any variant.

## What it renders

A single `<polygon>` with 4 points (top, right, bottom, left):

```
       (midX, y)
        ◆
 (x, midY)      (x+w, midY)
        ◆
     (midX, y+h)
```

The 4 points are computed:

```js
var midX = snap(x + w / 2);
var midY = snap(y + h / 2);
var points =
  midX + ',' + y + ' ' +
  (x + w) + ',' + midY + ' ' +
  midX + ',' + (y + h) + ' ' +
  x + ',' + midY;
```

Plus an optional centered `<text>` label.

## Scaffold

```html
<script type="application/icon-svg+json" id="decision-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Decision diamond demo",
  "primitives": [
    { "type": "decision",
      "id": "valid",
      "x": 280, "y": 280,
      "w": 440, "h": 440,
      "label": "Valid?", "variant": "warning" }
  ]
}
</script>
```

Compiles to:

```html
<g data-ve-id="valid" data-ve-type="icon-node"
   data-ve-comment-id="icon-node:valid"
   data-ve-label="Valid?">
  <polygon points="500,280 720,500 500,720 280,500"
           fill="none"
           stroke="var(--vc-color-warning, #a8791f)"
           stroke-width="2"/>
  <text x="500" y="500" text-anchor="middle"
        dominant-baseline="central"
        font-family="var(--vc-font-body, system-ui, sans-serif)"
        font-size="88"
        fill="var(--vc-color-content, #1f1a14)">Valid?</text>
</g>
```

## Geometry — keep w = h for a true diamond

A `w == h` decision renders as a true 90°-rotated square (a kite is a
rotated rectangle with `w ≠ h`). Authoring tip:

- Compact decision (one-word label): w=h=280 (small fork).
- Standard decision (a question): w=h=440 (the demo above).
- Wide decision: w > h (kite — reads as a stretched diamond, less
  flowchart-canonical, only use if you have lots of horizontal label
  text).

`label` size scales with `h` (`font-size = max(28, round(h * 0.20))`
in 1000-space) — same formula as `process`. A 440-tall diamond
renders the label at ~88, which fills the diamond nicely.

## Why `decision` is hand-drawn as `<polygon>`, not a rotated rect

The decision diamond could be authored as `<rect transform="rotate(45
…)">`. The compiler does NOT do this. The reasons:

1. **Hit testing** — a `<polygon>` has 4 exact vertices the browser
   uses for pointer events. A rotated `<rect>` has hit-test bounds
   that include the unrotated bounding box (an anti-pattern for
   click selection — half the corner is dead zone).
2. **Lint clarity** — the C3 grid-snap rule applies to polygon points
   directly; a rotated rect would need transform-aware snap math.
3. **Re-use** — the `<defs><use>` pass keys on `geomKey(p) = type | w
   | h | variant | label`. A polygon is geometry; a transformed rect
   is geometry plus a transform — two scenes with different
   rotations would split the reuse key for no visual benefit.

## Variants

| `variant` | stroke color | Conventional use |
|---|---|---|
| `default` (omitted) | `var(--vc-color-content, #1f1a14)` — ink | neutral decision |
| `warning` (RECOMMENDED) | `var(--vc-color-warning, #a8791f)` | "reader must choose" |
| `info` | `var(--vc-color-info, #3464a8)` | informational fork |
| `danger` | `var(--vc-color-danger, #a84a32)` | error branch |
| `success` | `var(--vc-color-success, #3a6b5c)` | happy-path branch |

The conventional choice is `warning` — a decision asks the reader to
choose, and the amber stroke matches the universal "attention" cue.

## Lib function

```js
var fragment = window.amvcpIconSvg.builders.nodeDecision({
  x: 280, y: 280, w: 440, h: 440,
  label: 'Valid?', variant: 'warning'
});
```

## DESIGN.md tokens consumed

- `--vc-color-content` — default stroke + label fill
- `--vc-color-{success|warning|danger|info}` — variant stroke
- `--vc-font-body` — label font family

## Selection / comment / decision-mini

Same as every primitive: a wrapping `<g data-ve-id>` is the selection
atom, the decision-mini-pill is attached on init. A scene with a
single decision diamond produces ONE per-atom thread keyed
`icon-node:valid`.

## When to use

- A yes/no fork in a flow.
- A "ready / not ready" gate.
- An "agree / disagree" prompt.
- ANY visual that asks the reader to pick between exactly two
  branches.

## When NOT to use

- For a 3+-way fork — diamond reads as binary; for more branches,
  switch to a `process` rect or a custom polygon.
- For a continuous decision (a slider, a confidence score) — use the
  `chart` skill.
- For a UI radio-group decision — that's `interactive-control`.

## Common authoring patterns

### Process → decision → two processes

icon-svg does not draw edges between them. Position the diamond
between two processes, then add the labelled arrows in the `diagram`
skill OR by hand-authoring two `<line>` primitives (in a separate
SCENE — icon-svg's diamond is one-shape).

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "process",  "id": "in", "x":   60, "y": 380,
      "w": 240, "h": 240, "label": "Input" },
    { "type": "decision", "id": "v",  "x":  380, "y": 380,
      "w": 240, "h": 240, "label": "Valid?", "variant": "warning" },
    { "type": "process",  "id": "ok", "x":  700, "y":  60,
      "w": 240, "h": 240, "label": "Accept", "variant": "success" },
    { "type": "process",  "id": "no", "x":  700, "y": 700,
      "w": 240, "h": 240, "label": "Reject", "variant": "danger" } ] }
```

### Standalone decision (a question on a slide)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "decision", "id": "q", "x": 150, "y": 150,
      "w": 700, "h": 700, "label": "Ship Friday?",
      "variant": "warning" } ] }
```

## What NOT to do

- Do NOT set `w != h` unless you specifically want a kite — diamond
  is the canonical shape.
- Do NOT supply a `fill` — decision is OUTLINE only.
- Do NOT use decision for a process step that happens to have two
  outputs (that's a `process`).
- Do NOT use decision for a `<details>` collapsible — that's
  `interactive-control`.

## Visual verification

In both light AND dark, confirm:

- All four vertices touch the bounding box `(x, y, w, h)`.
- The label is centered (text-anchor=middle, dominant-baseline=
  central).
- The stroke color matches the variant.
- Hover state shows the selection ring (the runtime's `svg g
  [data-ve-id]:hover > polygon` rule).

A common authoring mistake is to set `w != h` and end up with a kite;
the diamond reads as a true diamond only when `w == h`. Always set
the bounding box square unless you deliberately want the stretched
form.
