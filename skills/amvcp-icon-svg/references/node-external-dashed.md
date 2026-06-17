# Node primitive — external (dashed rounded rect)

## Table of Contents

- [What it renders](#what-it-renders)
- [Scaffold](#scaffold)
- [Variants](#variants)
- [Lib function](#lib-function)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini](#selection--comment--decision-mini)
- [When to use](#when-to-use)
- [When NOT to use](#when-not-to-use)
- [Common authoring patterns](#common-authoring-patterns)
  - [Single external boundary (a single vendor in a system diagram)](#single-external-boundary-a-single-vendor-in-a-system-diagram)
  - [Two externals (upstream + downstream)](#two-externals-upstream--downstream)
  - [External + process pair (vendor → our handler)](#external--process-pair-vendor--our-handler)
- [What NOT to do](#what-not-to-do)
- [Visual verification](#visual-verification)

The `external` node marks a SYSTEM BOUNDARY: something outside the
diagrammed scope. A vendor API, a third-party service, a user-side
device, an upstream input the team doesn't own. Visually identical to
`process` (rounded rect, no fill) EXCEPT the stroke is DASHED — the
universal visual idiom for "out of bounds".

## What it renders

A single `<rect>`:

- `rx = ry = 16` in 1000-space — same radius as `process`.
- `fill = "none"` — outline only.
- `stroke = var(--vc-color-content-muted, #5b5343)` BY DEFAULT —
  the MUTED ink, NOT the primary ink. External things should fade
  into the background relative to in-scope nodes.
- `stroke-width = 2` — hairline.
- `stroke-dasharray = "16 12"` — 16 units painted, 12 units gapped.
  The pattern is visible at any rendered size in the 1000-space.

When `variant` is set to anything other than `default`, the stroke
takes the variant's semantic color INSTEAD of the muted default — so
`{external, variant: "warning"}` is "a deprecated external service
the team is migrating away from", marked amber.

## Scaffold

```html
<script type="application/icon-svg+json" id="external-demo">
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "External service boundary",
  "primitives": [
    { "type": "external",
      "id": "vendor",
      "x": 200, "y": 400,
      "w": 600, "h": 200,
      "label": "Vendor API" }
  ]
}
</script>
```

Compiles to:

```html
<g data-ve-id="vendor" data-ve-type="icon-node"
   data-ve-comment-id="icon-node:vendor"
   data-ve-label="Vendor API">
  <rect x="200" y="400" width="600" height="200"
        rx="16" ry="16"
        fill="none"
        stroke="var(--vc-color-content-muted, #5b5343)"
        stroke-width="2"
        stroke-dasharray="16 12"/>
  <text x="500" y="500" text-anchor="middle"
        dominant-baseline="central"
        font-family="var(--vc-font-body, system-ui, sans-serif)"
        font-size="40"
        fill="var(--vc-color-content, #1f1a14)">Vendor API</text>
</g>
```

The dash pattern `16 12` is in 1000-space units. At a typical
displayed width of ~360px, that's ~5.8px painted / ~4.3px gapped —
the dashes are clearly readable as dashed without looking like a
rolling-stitch border.

## Variants

| `variant` | stroke color |
|---|---|
| `default` (omitted) | `var(--vc-color-content-muted, #5b5343)` — MUTED ink (the special case) |
| `success` | `var(--vc-color-success, #3a6b5c)` |
| `warning` | `var(--vc-color-warning, #a8791f)` |
| `danger` | `var(--vc-color-danger, #a84a32)` |
| `info` | `var(--vc-color-info, #3464a8)` |

Note that `external`'s `default` stroke is MUTED (not the primary
ink). This is the deliberate exception in the variant ladder:
external things fade visually, so they don't compete with in-scope
nodes. A `variant` override puts them back at full color when needed.

## Lib function

```js
var fragment = window.amvcpIconSvg.builders.nodeExternal({
  x: 200, y: 400, w: 600, h: 200,
  label: 'Vendor API', variant: 'default'
});
```

## DESIGN.md tokens consumed

- `--vc-color-content-muted` — default stroke (the special case)
- `--vc-color-content` — label fill
- `--vc-color-{success|warning|danger|info}` — variant stroke
- `--vc-font-body` — label font family

## Selection / comment / decision-mini

Same as every primitive.

## When to use

- A third-party SaaS API (`Stripe`, `Twilio`, `Auth0`).
- A vendor service (`AWS S3`, `Cloudflare`, `Sentry`).
- An upstream data source the team doesn't own.
- A downstream consumer the team doesn't deploy.
- A legacy system being migrated away from.
- A user-side device (a phone, a desktop) when drawing a system
  boundary.
- ANYTHING the reader should read as "not our code, not our
  responsibility".

## When NOT to use

- For an in-scope service — that's `process`.
- For an in-scope database — that's `database`.
- For an in-scope CDN / edge — that's `network` (cloud).
- For an external API the team DOES own (a sibling team's
  microservice) — that's `process` with `variant: "info"` (signals
  "in scope but not directly controlled here").

## Common authoring patterns

### Single external boundary (a single vendor in a system diagram)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Twilio dependency",
  "primitives": [
    { "type": "external", "id": "tw", "x": 250, "y": 400,
      "w": 500, "h": 200, "label": "Twilio" } ] }
```

### Two externals (upstream + downstream)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "external", "id": "src", "x":  60, "y": 380,
      "w": 380, "h": 240, "label": "User upload" },
    { "type": "external", "id": "snk", "x": 560, "y": 380,
      "w": 380, "h": 240, "label": "Email digest" } ] }
```

### External + process pair (vendor → our handler)

```json
{ "viewBox": [0, 0, 1000, 1000],
  "primitives": [
    { "type": "external", "id": "vendor", "x":  60, "y": 380,
      "w": 380, "h": 240, "label": "Stripe webhook" },
    { "type": "process",  "id": "handler", "x": 560, "y": 380,
      "w": 380, "h": 240, "label": "Charge handler" } ] }
```

The dashed external + solid process visually distinguishes the trust
boundary at a glance.

## What NOT to do

- Do NOT make external the SAME visual weight as process — the
  dashed border + muted stroke is the WHOLE point. Tweaking it back
  to solid + ink defeats the boundary marker.
- Do NOT use external for "a process we wrote that just happens to
  be in a different package" — the team owns it, it's `process`.
- Do NOT use external for the system boundary RECTANGLE that
  CONTAINS all of the architecture — that's a `group` in the
  `diagram` skill, not an icon-svg primitive.

## Visual verification

In both light AND dark, confirm:

- The dash pattern is clearly visible at the rendered size (~5–7px
  paint, ~3–5px gap on a typical display).
- The default stroke is MUTED ink (lighter than `--vc-color-content`),
  not the primary ink.
- The label fill stays at primary ink (the label is foreground; the
  border is the boundary marker).
- Variant overrides switch the stroke color but keep the dash
  pattern.

Comparing side-by-side with a `process` rect should make the
external-ness instantly readable: same shape, muted dashed stroke vs
solid ink stroke. If you can't tell them apart at a glance, the
external isn't pulling its weight — bump up the dash contrast by
moving to a darker theme or check that the runtime is loading the
DESIGN.md palette.
