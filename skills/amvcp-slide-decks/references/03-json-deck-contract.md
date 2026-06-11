# 03 — JSON deck contract (the typed-block authoring format)

## Table of Contents

- [What this is](#what-this-is)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Don'ts](#donts)
- [Visual verification](#visual-verification)
- [Source provenance](#source-provenance)

The single artefact an agent emits is a JSON deck. Not HTML. Not Markdown.
JSON. The runtime owns every transformation from JSON → DOM via
`parseDeck()` → `renderDeck()` → typed-block dispatch. This reference is the
authoritative spec of that contract.

The contract is the scaffold format that converged across the JSON-typed-slide
projects (SL-11 in the master catalog) — every slide is an array of typed
blocks; every block dispatches to one renderer. The renderer is the only
place that knows HTML; the authoring layer thinks only in typed blocks.

## What this is

A deck is a JSON object with deck-level keys (`kind`, `title`, `aspect`,
`fit`, `mood`, `transition`, `loop`, `slides`). Each slide is a JSON object
with a `layout` enum + a `blocks` array. Each block is a JSON object with a
`type` enum + per-type required keys.

### Deck-level keys

| Key | Type | Required? | Default | Enum |
|---|---|---|---|---|
| `kind` | string | No | `"deck"` | `"deck"` \| `"poster"` |
| `title` | string | **Yes** | — | (free) |
| `aspect` | string | No | `"16:9"` | `"16:9"` \| `"4:3"` \| `"3:2"` |
| `fit` | string | No | `"letterbox"` | `"letterbox"` \| `"responsive"` |
| `mood` | string | No | `"minimal"` | `"minimal"` \| `"editorial"` \| `"dramatic"` \| `"playful"` \| `"techy"` |
| `transition` | string | No | `"crossfade"` | `"crossfade"` \| `"slide-left"` \| `"zoom"` \| `"page-turn"` |
| `loop` | boolean | No | `false` | — |
| `slides` | array | **Yes** | — | non-empty array of slide objects |

`title` is required because it's the `localStorage`-namespace key for slide
position persistence. Two decks with the same title share the same storage.

### Slide-level keys

| Key | Type | Required? | Notes |
|---|---|---|---|
| `layout` | string | **Yes** | One of the 16 layout names (see ref #04). |
| `blocks` | array | **Yes** | Non-empty array of typed-block objects. |
| `grid` | string | No | `bento`-only: one of 7 bento grids (see ref #16). |
| `numeral` | string\|number | No | `section-divider`-only: the ghost numeral. |
| `notes` | string | No | Speaker notes (read by the `?notes` window). |

### Block-level: the 10 OWNED types

These are rendered directly by `amvcp-slide.js`:

| `type` | Required keys | Optional keys | Renders as |
|---|---|---|---|
| `eyebrow` | `text` (string) | — | `<p class="vsd-eyebrow">` |
| `heading` | `text` (string) | `level` (1\|2) | `<h1>` / `<h2 class="vsd-heading">` |
| `text` | `text` (string) | — | `<p class="vsd-text">` |
| `bullets` | `items` (array of string or `{text, sub}`) | — | `<ul class="vsd-bullets">` |
| `metric` | `value`, `label` | `delta` (string) | `<div class="vsd-metric">` |
| `callout` | `variant` (info\|tip\|warning\|danger), `text` | — | `<div class="vsd-callout">` |
| `quote` | `text` (string) | `cite` (string) | `<blockquote class="vsd-quote">` |
| `comparison` | `left` `{title, items}`, `right` `{title, items}` | — | Two `.vsd-compare-pane`s side-by-side |
| `image` | `src` (string) | `alt`, `fit` (cover\|contain) | `<img class="vsd-image">` |
| `spacer` | — | `size` (number — `--vc-space-N` index) | empty `<div>` for rhythm |

### Block-level: the 3 DELEGATED types

These dispatch to sibling renderer modules (`window.amvcpCodeHighlight`,
`window.amvcpDiagram`, `window.amvcpChart`) via `renderInto(el, spec)`:

| `type` | Required keys | Optional keys | Sibling module |
|---|---|---|---|
| `code` | `source` (string) | `lang` (string) | `amvcp-code-highlight.js` |
| `diagram` | `source` (string) | `notation` (string) | `amvcp-diagram.js` |
| `chart` | `chartType` (string) | `data` (object) | `amvcp-chart.js` |

If the sibling module is missing, the renderer THROWS with a clear message
naming the global it expected — never a blank placeholder.

The `diagram` block's `amvcp-diagram.js` renderer supports only the
**scene-graph JSON** model (`"notation": "scene-graph"` or `"json"`, the
default) and **ASCII** art (`"notation": "ascii"`); a `mermaid` / `graphviz`
/ `dot` notation fail-fasts ("no mermaid/graphviz parser"). For Mermaid or
Graphviz diagrams use the `/amvcp-generate-web-diagram` command (the
`amvcp-graph-diagrams` skill) — those are NOT available as slide delegated
blocks.

## Scaffold to emit

A minimal valid deck:

```jsonc
{
  "kind": "deck",
  "title": "Q3 Engineering Readout",
  "slides": [
    { "layout": "manifesto",
      "blocks": [
        { "type": "eyebrow", "text": "Q3 2026" },
        { "type": "heading", "text": "Latency dropped 38% after the cache rewrite shipped." },
        { "type": "text",    "text": "Every p99 path now clears 200ms." }
      ]
    }
  ]
}
```

A richer one with multiple slides, mixed layouts, delegated blocks:

```jsonc
{
  "kind": "deck",
  "title": "Q3 Engineering Readout",
  "aspect": "16:9",
  "fit": "letterbox",
  "mood": "editorial",
  "transition": "slide-left",
  "slides": [
    { "layout": "manifesto",
      "blocks": [
        { "type": "eyebrow", "text": "Q3 2026" },
        { "type": "heading", "text": "We cut p99 latency by 38% and shipped 14 features." }
      ]
    },
    { "layout": "metrics",
      "blocks": [
        { "type": "heading", "level": 2, "text": "By the numbers." },
        { "type": "metric", "value": "38%", "label": "p99 latency cut", "delta": "−128ms" },
        { "type": "metric", "value": "14",  "label": "features shipped" },
        { "type": "metric", "value": "247", "label": "PRs merged" }
      ]
    },
    { "layout": "comparison",
      "blocks": [
        { "type": "heading", "level": 2, "text": "Then vs Now." },
        { "type": "comparison",
          "left":  { "title": "Q2",  "items": ["p99 = 540 ms", "Cache hit 41%"] },
          "right": { "title": "Q3",  "items": ["p99 = 335 ms", "Cache hit 78%"] } }
      ]
    },
    { "layout": "code-focus",
      "blocks": [
        { "type": "heading", "level": 2, "text": "The hot-path rewrite." },
        { "type": "code",
          "lang": "rust",
          "source": "fn handle(req: Request) -> Response {\n    cache.get(req.key).unwrap_or_else(|| { … })\n}" }
      ]
    },
    { "layout": "closing",
      "blocks": [
        { "type": "heading", "text": "Q4: ship cross-region replication." }
      ]
    }
  ]
}
```

Embed it in the page:

```html
<script type="application/json" id="vsd-deck">
{"kind":"deck","title":"…",…}
</script>
```

The `<script type="application/json">` form is XSS-safe (the browser does
NOT execute it as JS — it's just text the slide module reads via
`document.getElementById('vsd-deck').textContent`).

## Lib functions called

- `parseDeck(input)` — accepts a JSON string OR an already-parsed object;
  validates every enum + every required key + every per-type field;
  throws with the offending JSON path (e.g.
  `slides[3].blocks[1]: unknown block type "mermaidd"`). Returns the
  normalised deck. Fail-fast — never invents defaults beyond the
  documented ones.
- `validateSlide(slide, i)` — internal; per-slide validation.
- `validateBlock(block, path)` — internal; per-block validation.
- `renderBlock(doc, block, ctx)` — the dispatcher. Reads `block.type`,
  builds the corresponding DOM, stamps `.vsd-block` for the entrance-mood
  CSS to find. Throws as defence-in-depth on unknown types (parseDeck
  already rejected them).
- `renderDelegated(doc, block, type)` — for `code` / `diagram` / `chart`;
  looks up `window[meta.global]`, calls `.renderInto(host, spec)`, throws
  with a clear "module missing" error if the global isn't there.

## DESIGN.md tokens used

Every block themes off the engine's tokens via its CSS class
(`.vsd-eyebrow`, `.vsd-heading`, `.vsd-text`, `.vsd-bullets`, etc.). See
the per-block references (#05 through #14) for the specific token
contracts.

The JSON itself carries NO theming — that's the point of the contract. A
single JSON deck themes correctly under any DESIGN.md (engine swaps the
`--vc-*` tokens; the same JSON renders to the same DOM with different
typography + colour).

## Selection / comment / decision-mini contract notes

Every SLIDE becomes a selectable atom (see ref #02). Individual BLOCKS
inside a slide do NOT carry `data-ve-id` by default — the comment-modal's
natural unit is the slide. If a future revision needs per-block
commenting, the renderer can stamp `data-ve-id="s<N>.b<M>"` on each
`.vsd-block` — the runtime's scanner already handles arbitrary `data-ve-id`
shapes.

## When to use this reference

Open this ref when:

- Authoring a new deck from scratch — the schema above is the contract.
- Adding a new block type — DON'T. The 13 types (10 owned + 3 delegated)
  are the closed set; adding a new type means adding a renderer + a
  validator branch + a per-block reference. Extend an existing type's
  options first.
- A `parseDeck` error mentions an unknown key — the path in the error
  message points at the offending field; cross-reference against the
  tables above.

## Don'ts

- Don't author HTML directly. The contract is JSON; HTML is the
  renderer's output, not the agent's. Hand-authored HTML bypasses the
  selection-wiring, the density guard, and the headline validator.
- Don't ship Markdown inside `text` / `heading` / `quote` strings — the
  renderer escapes everything via `createTextNode()` (XSS-safe by
  construction). Markdown will render as literal text.
- Don't put non-text inside `bullets.items` — the contract is `string` or
  `{text, sub}`. Nested arrays / objects fail validation.
- Don't omit `title` — the localStorage namespace breaks; two untitled
  decks on the same domain clobber each other's positions.

## Visual verification

After authoring a new deck, run the dev-browser screenshot path described
in `skills/amvcp-self-debug-rules/SKILL.md`:

1. Capture light + dark at 1280×720.
2. Open the browser console; confirm zero `parseDeck` errors.
3. Confirm `data-vsd-headline-warn` is absent on every heading (or
   acknowledge the warnings as intentional).
4. Confirm `data-vsd-overflow` is absent on every slide (or split the
   offending slide in two).
5. Tab through the deck; every slide should grow a `:focus-visible`
   selection ring.

## Source provenance

- The typed-block JSON contract is SL-11 in the master catalog
  (`reports/visualizing-triage/20260515_112406+0200-MASTER-CONSOLIDATED.md`)
  consolidated with the layout/preset/transition keys from SL-01 / SL-02 /
  SL-04 / SL-08 / SL-10.
- Schema enums (`MOODS`, `TRANSITIONS`, `LAYOUTS`, `BENTO_GRIDS`,
  `SLIDE_OWNED_BLOCKS`, `DELEGATED_BLOCKS`, `CALLOUT_VARIANTS`) are the
  literal arrays exported at the top of `scripts/amvcp-slide.js`.
- The "agent emits JSON, renderer owns HTML" separation is the
  scaffoldable-DESIGN.md-themed-HTML mandate from the consolidated plan.
