# 40 — Fail-fast errors, soft warnings, debugging

The slide module follows the fail-fast principle: STRUCTURAL errors
throw immediately with the offending JSON path; STYLISTIC issues
collect as soft warnings. This reference catalogues every error /
warning the module emits, what it means, and how to fix it.

## What this is

Two error / warning categories:

### Hard errors (throw immediately)

Raised by `parseDeck()` or `renderBlock()` when the JSON contract is
violated. The error message includes the offending JSON path so the
author can locate the issue immediately.

| Error | Trigger | Fix |
|---|---|---|
| `deck: not valid JSON — ${reason}` | JSON parse failure | Validate the JSON via `jq`. |
| `deck: must be a JSON string or an object` | Top-level is `null` / `array` / `number` | Wrap in `{}`. |
| `deck: top-level value must be a JSON object` | Same as above | Same. |
| `deck.kind: must be one of deck, poster (got "X")` | Unknown `kind` | Use `"deck"` or `"poster"`. |
| `deck.aspect: must be one of 16:9, 4:3, 3:2 (got "X")` | Unknown `aspect` | Use one of the three valid values. |
| `deck.fit: must be one of letterbox, responsive (got "X")` | Unknown `fit` | Use `"letterbox"` or `"responsive"`. |
| `deck.mood: must be one of minimal, editorial, dramatic, playful, techy (got "X")` | Unknown `mood` | Use one of the five valid values. |
| `deck.transition: must be one of crossfade, slide-left, zoom, page-turn (got "X")` | Unknown `transition` | Use one of the four valid values. |
| `deck.title: a non-empty string title is required` | Missing / empty `title` | Add a non-empty `title` field. |
| `deck.slides: a non-empty array of slides is required` | Missing / empty `slides` | Add at least one slide. |
| `slides[N]: each slide must be a JSON object` | Slide is `null` / `array` / `string` | Wrap in `{}`. |
| `slides[N].layout: a layout name is required` | Missing `layout` | Add a `layout` field from the 16-name catalog. |
| `slides[N].layout: unknown layout "X" — must be one of ...` | Unknown `layout` | Use one of the 16 valid names. |
| `slides[N].grid: unknown bento grid "X" — must be one of ...` | Bento slide with unknown `grid` | Use one of the 7 valid grid names. |
| `slides[N].blocks: a non-empty array of blocks is required` | Missing / empty `blocks` | Add at least one block. |
| `slides[N].blocks[M]: each block must be a JSON object` | Block is wrong type | Wrap in `{}`. |
| `slides[N].blocks[M].type: a block type is required` | Missing `type` | Add a `type` field from the 13-block catalog. |
| `slides[N].blocks[M]: unknown block type "X"` | Unknown `type` | Use one of the 10 owned or 3 delegated types. |
| `slides[N].blocks[M].text: block type "X" requires a string "text"` | Missing required `text` | Add a `text` field. |
| `slides[N].blocks[M].items: block type "bullets" requires a non-empty "items" array` | Missing `items` on bullets | Add `items: ["…"]`. |
| `slides[N].blocks[M]: block type "metric" requires "value" and "label"` | Missing metric fields | Add both. |
| `slides[N].blocks[M].variant: callout "variant" must be info, tip, warning, or danger` | Unknown variant | Use one of the four. |
| `slides[N].blocks[M]: block type "comparison" requires "left" and "right" objects` | Missing pane | Add both. |
| `slides[N].blocks[M].src: image block requires a string "src"` | Missing src | Add the image source. |
| `slides[N].blocks[M].source: code block requires "source"` | Missing source | Add the code text. |
| `slides[N].blocks[M].source: diagram block requires "source"` | Missing source | Add the diagram text. |
| `slides[N].blocks[M].chartType: chart block requires "chartType"` | Missing chartType | Add the chart type. |
| `amvcp-slide: block type "X" needs the Y renderer module, but window.amvcpZ.renderInto is not available. Include that module's <script> in the deck.` | Delegated block + missing sibling | Include the missing module. |
| `amvcp-slide: renderDeck needs a document` | Renderer called outside a browser context without a document | Pass a `document`-compatible object. |
| `amvcp-slide: renderBlock: unknown type "X"` | Defence-in-depth (parseDeck already rejected) | Should never fire; if it does, file a bug. |

### Soft warnings (console.warn + attribute)

Raised by render-time validators when content quality flags fire.
The deck STILL renders; the warning is informational.

| Warning | Trigger | Where it surfaces | Fix |
|---|---|---|---|
| `headline is N words (< 5) — write a full sentence` | Heading text < 5 words | `data-vsd-headline-warn` attr + `console.warn` | Rewrite as a declarative sentence. |
| `no verb detected — headline reads as a label, not a claim` | Heading has 5+ words but no verb/digit | Same | Rewrite as a declarative sentence. |
| `empty headline` | Heading text is empty / whitespace-only | Same | Add real text. |
| `${count} bullets (> 6)` | Slide has > 6 bullets across all bullets blocks | `data-vsd-overflow` attr | Split into two slides. |
| `${count} body words (> 40)` | Slide has > 40 words across all text blocks | Same | Split into two slides. |

## Scaffold — using the warnings programmatically

After rendering, the deck object exposes the warnings:

```js
var deck = parseDeck(jsonText);
var viewport = renderDeck(deck, mountEl);

console.log('Headline warnings:', deck._ctx.headlineWarnings);
// [{slide: 0, text: "Q3 Results", reason: "headline is 2 words (< 5)…"}, …]

console.log('Density warnings:', deck._ctx.densityWarnings);
// [{slide: 3, reason: "7 bullets"}, {slide: 5, reason: "52 body words"}, …]
```

A custom embed can surface these to the author via a toast / panel
/ inline indicator.

## Lib functions called

- `parseDeck(input)` — raises hard errors.
- `validateSlide(slide, i)` — internal hard-error validator.
- `validateBlock(block, path)` — internal per-block validator.
- `validateHeadline(text)` — soft-warning validator for headings.
- `deckError(path, message)` — internal error-throwing helper that
  prepends `amvcp-slide: ` and the JSON path.
- `renderSlide(doc, slide, i, deck)` — accumulates density warnings.

## When to use this reference

Open this ref when:

- A `console.error` or thrown exception mentions `amvcp-slide:`.
- A `console.warn` flags a slide.
- The deck doesn't render at all (the boot path threw).
- An automated test needs to assert on warning content.

## Debugging workflow

When the deck doesn't render:

1. Open DevTools → Console.
2. Look for `amvcp-slide: ${path}: ${message}` errors.
3. Find the offending JSON path in the deck source.
4. Fix the field.
5. Reload.

When the deck renders but looks wrong:

1. Open DevTools → Console.
2. Look for `console.warn` entries from the slide module.
3. Inspect `document.querySelectorAll('[data-vsd-headline-warn]')`
   for flagged headings.
4. Inspect `document.querySelectorAll('[data-vsd-overflow]')` for
   density-flagged slides.
5. Fix per the warning's reason.

When a delegated block fails:

1. The error names the missing module: `window.amvcpCodeBlock` /
   `window.amvcpDiagram` / `window.amvcpChart`.
2. Verify the corresponding script is loaded:
   `console.log(window.amvcpCodeBlock)`.
3. Verify the load order: sibling modules BEFORE `amvcp-slide.js`.
4. Verify the script src is correct (no 404 in the Network tab).

## Don'ts

- Don't catch the hard errors and silence them. The errors point
  to JSON contract violations — silencing them ships a broken
  deck.
- Don't add per-error retries. The errors are structural; retrying
  doesn't fix them.
- Don't ignore soft warnings. Each one points to a specific
  content-quality issue; address them.
- Don't disable the validators. They're the authoring quality
  gate; turning them off ships AI-slop decks.

## Visual verification

After every authoring pass:

1. Open the deck in dev-browser via
   `skills/amvcp-self-debug-rules/SKILL.md`.
2. Console MUST be free of `amvcp-slide:` errors.
3. Console MAY have `console.warn` entries — address each.
4. DOM should have zero `[data-vsd-headline-warn]` and
   `[data-vsd-overflow]` attributes (or the warnings are
   acknowledged as intentional).

## Programmatic linting

A custom CI step can lint the deck JSON before render by calling
`parseDeck()` directly:

```js
var deck = require('./amvcp-slide.js');   // Node import

try {
  var parsed = deck.parseDeck(jsonText);
  console.log('OK: ' + parsed.slides.length + ' slides');
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
```

This catches all the hard errors in CI before the deck ever ships to
the browser. The soft-warning path requires `renderDeck()` (which needs
a `document`); use jsdom or run the lint in a browser test harness.

## Worked examples — fix-by-message

### Example 1: empty heading

```jsonc
// BAD — empty heading text
{ "type": "heading", "text": "" }
```

Console:
```
console.warn: amvcp-slide: slide 0, heading: empty headline
```

Fix:
```jsonc
{ "type": "heading", "text": "Latency dropped 38%." }
```

### Example 2: 4-word heading

```jsonc
{ "type": "heading", "text": "The new architecture works" }
```

Console:
```
console.warn: amvcp-slide: slide 0, heading: headline is 4 words (< 5) — write a full sentence
```

Fix:
```jsonc
{ "type": "heading", "text": "The new architecture cuts p99 latency by 38%." }
```

### Example 3: 7 bullets

```jsonc
{ "type": "bullets",
  "items": ["A","B","C","D","E","F","G"] }
```

Slide DOM gets `data-vsd-overflow="7 bullets (> 6)"`.

Fix: split — see ref #28.

### Example 4: missing sibling module

```jsonc
{ "type": "code", "lang": "rust", "source": "fn x() {}" }
```

Console (if `amvcp-codeblock.js` isn't loaded):
```
amvcp-slide: block type "code" needs the code-block (amvcp-codeblock.js) renderer module, but window.amvcpCodeBlock.renderInto is not available. Include that module's <script> in the deck.
```

Fix: add `<script src="./amvcp-codeblock.js"></script>` BEFORE
`amvcp-slide.js`.

## Source provenance

- The fail-fast principle is the slide module's design choice
  documented in the source comments (`parseDeck` lines 703-781).
- The soft-warning vs hard-error split is the slide-spec.md
  philosophy: STRUCTURAL violations throw (the JSON is broken);
  STYLISTIC issues warn (the JSON is valid but the deck might
  look bad).
- Each error message's format ("amvcp-slide: ${path}: ${msg}") is
  the consistent diagnostic surface the module exposes.
- Soft warnings on attributes (`data-vsd-headline-warn`,
  `data-vsd-overflow`) are the authoring affordance — a custom
  embed can paint markers next to the flagged elements.
