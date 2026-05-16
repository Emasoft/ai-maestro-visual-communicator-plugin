# 27 — Blocks: `image` + `spacer` + delegated (`code` / `diagram` / `chart`)

This reference covers the "rest of the blocks" — `image` for
embedded visuals, `spacer` for rhythm control, and the three
DELEGATED block types (`code`, `diagram`, `chart`) that dispatch to
sibling renderer modules.

## What this is

### `image` block

```jsonc
{ "type": "image",
  "src": "data:image/jpeg;base64,…",
  "alt": "Cache hit rate chart on a dark background.",
  "fit": "cover" }
```

Required: `src` (string — URL, data-URI, or relative path).
Optional: `alt` (string — default empty), `fit` (`"cover"` |
`"contain"`, default `"cover"`).

Renders as:
```html
<img class="vsd-image vsd-image--cover"
     src="…"
     alt="Cache hit rate chart on a dark background." />
```

Fit modes:
- `"cover"` — fills the parent; crops the image. Best for hero /
  full-bleed images.
- `"contain"` — fits inside the parent; letterboxes the image. Best
  for screenshots / illustrations where the whole image must show.

### `spacer` block

```jsonc
{ "type": "spacer", "size": 4 }
```

Optional: `size` (number — `--vc-space-N` index, default 3 if
omitted).

Renders as:
```html
<div class="vsd-spacer" style="min-height: var(--vc-space-4, 40px)"></div>
```

The spacer is empty by design — it injects vertical rhythm where
needed. Used SPARINGLY; the layout CSS handles inter-block spacing
correctly in 95% of cases.

### Delegated blocks (`code` / `diagram` / `chart`)

```jsonc
// code
{ "type": "code", "lang": "rust", "source": "fn handle() { … }" }

// diagram
{ "type": "diagram", "notation": "mermaid", "source": "flowchart LR\n  A --> B" }

// chart
{ "type": "chart", "chartType": "line", "data": { … } }
```

The renderer dispatches to:
- `window.amvcpCodeBlock.renderInto(host, {lang, source})` for
  `code`.
- `window.amvcpDiagram.renderInto(host, {notation, source})` for
  `diagram`.
- `window.amvcpChart.renderInto(host, {chartType, data})` for
  `chart`.

If the sibling module is missing, the renderer THROWS with a clear
message naming the expected global — never a blank placeholder.

## Scaffold to emit

### Image — embedded screenshot:

```jsonc
{ "type": "image",
  "src": "data:image/png;base64,…",
  "alt": "Architecture diagram showing the new cache layer.",
  "fit": "contain" }
```

### Image — full-bleed hero (used in `full-bleed` layout):

```jsonc
{ "type": "image",
  "src": "data:image/jpeg;base64,…",
  "alt": "Cache hit rate climbing chart against a dark sky.",
  "fit": "cover" }
```

### Spacer between heading and bullets (rare — usually the layout CSS handles this):

```jsonc
{ "type": "heading", "level": 2, "text": "..." },
{ "type": "spacer",  "size": 5 },
{ "type": "bullets", "items": [...] }
```

### Code (delegated):

```jsonc
{ "type": "code",
  "lang": "rust",
  "source": "fn handle(req: Request) -> Response {\n    cache.get_or_insert(req.key, || db.fetch(req))\n}" }
```

### Diagram (delegated):

```jsonc
{ "type": "diagram",
  "notation": "mermaid",
  "source": "flowchart LR\n  Client --> Cache\n  Cache --> DB\n  Cache -.->|stale| Refresh" }
```

### Chart (delegated):

```jsonc
{ "type": "chart",
  "chartType": "line",
  "data": {
    "labels": ["Apr 22","Apr 29","May 6","May 13","May 20"],
    "datasets": [
      { "label": "Cache hit %", "data": [41, 48, 62, 71, 78] }
    ]
  } }
```

## Lib functions called

- `renderBlock(doc, block, ctx)` — dispatches.
- For `image`: builds `<img>` with the src + alt + fit class.
- For `spacer`: builds an empty `<div>` with the spacing token as
  `min-height`.
- For `code` / `diagram` / `chart`: calls `renderDelegated(doc,
  block, type)`.
- `renderDelegated(doc, block, type)` — looks up `window[meta.global]`,
  calls `.renderInto(host, spec)`, throws on missing module.

## DESIGN.md tokens used

### `image`

| Token | Default | What |
|---|---|---|
| `--vc-radius-image` | `12 px` | Optional border-radius for non-full-bleed. |

(Most styling is parent-driven — the layout CSS handles position +
sizing; the image block contributes only the `<img>` element.)

### `spacer`

| Token | Default | What |
|---|---|---|
| `--vc-space-N` (per `size`) | varies | The spacer's `min-height`. |

`size: 1` → `--vc-space-1 = 4 px`.
`size: 2` → `--vc-space-2 = 8 px`.
`size: 3` → `--vc-space-3 = 16 px` (default).
…
`size: 7` → `--vc-space-7 = 64 px`.

### Delegated blocks

Theming is handled by the sibling renderer modules:
- `code` → see `amvcp-code-highlight` skill.
- `diagram` → see `amvcp-graph-diagrams` skill.
- `chart` → see `amvcp-charts-and-dashboards` skill.

The slide layer contributes only the host element wrapping the
delegated render output.

## Selection / comment / decision-mini contract notes

None of these blocks carry their own `data-ve-id` from the slide
layer. The delegated blocks MAY have their own `data-ve-id` set by
their sibling renderer module — that's the sibling module's
concern. The slide is the comment unit at the slide layer.

## When to use this reference

Open this ref when:

- Embedding an image or screenshot in a slide.
- The default block spacing isn't right — use `spacer` to nudge.
- Adding a code snippet (`code` block + `code-focus` layout) or a
  diagram (`diagram` block + `two-column` / `data-story` layout) or
  a chart (`chart` block + `data-story` layout).
- Getting a "sibling module not loaded" error — see "Delegated-block
  errors" below.

## Delegated-block errors

When the renderer throws `"amvcp-slide: block type \"X\" needs the
Y renderer module, but window.amvcpZ.renderInto is not available"`:

| Block type | Missing module | Fix |
|---|---|---|
| `code` | `amvcp-codeblock.js` | Include `<script src="./amvcp-codeblock.js"></script>` BEFORE `amvcp-slide.js`. |
| `diagram` | `amvcp-graphdiagram.js` | Include `<script src="./amvcp-graphdiagram.js"></script>` before. |
| `chart` | `amvcp-charts.js` | Include `<script src="./amvcp-charts.js"></script>` before. |

The script order matters — `amvcp-slide.js` checks
`window.amvcpCodeBlock` (etc.) at RENDER time, which happens after
`DOMContentLoaded`. If the sibling script is missing or loaded
AFTER the boot fires, the check fails.

## Don'ts

- Don't inline binary image bytes in the JSON (it bloats the
  embedded `<script type="application/json">` block past the parse
  limit). Use base64 data-URIs in the `src` field; the renderer
  treats `src` as opaque.
- Don't omit `image.alt`. Empty alt is acceptable for decorative
  images, but a missing `alt` field breaks accessibility. The
  default is empty string; explicitly set "" if the image is
  decorative.
- Don't abuse `spacer`. The layout CSS's gap rules handle 95% of
  spacing; reaching for `spacer` is usually a sign you should use
  a different layout.
- Don't author markdown / HTML in `code.source` — the code-block
  renderer treats it as code. Markdown rendering belongs in a
  different block type (text / bullets).

## Visual verification

After authoring image / spacer / delegated blocks, capture light +
dark at 1280×720 via the dev-browser path in
`skills/amvcp-self-debug-rules/SKILL.md`:

1. Images load and display (no broken-image icons).
2. The image's `fit` mode matches what was specified (cover crops;
   contain letterboxes).
3. Spacer-driven gaps are visible (and match the size).
4. Delegated blocks render via their sibling modules (no
   "module not loaded" errors in the console).

## Source provenance

- The `image` block API (src + alt + fit) is the converged image-
  embed pattern from SL-11's typed-block schema.
- The `spacer` block follows the spatial-ladder discipline
  documented in ref #01 of `amvcp-layout/references/` — every gap
  is a `--vc-space-N` index, never a literal pixel.
- The delegated-block fail-fast pattern (throw with a clear module
  name) is slide-spec.md §5.4 / §12.2 — "never a blank
  placeholder".
