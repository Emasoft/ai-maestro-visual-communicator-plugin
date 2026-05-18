# Contact-sheet typography panel — specimens + stacks

## Table of Contents

- [What it does](#what-it-does)
- [Why one specimen text repeated](#why-one-specimen-text-repeated)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions used](#lib-functions-used)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Anti-slop interaction](#anti-slop-interaction)
- [Selection / comment / decision-mini contract](#selection--comment--decision-mini-contract)
- [Visual verification](#visual-verification)

The `typography` panel of the token contact sheet renders one
specimen line per type-scale step at its TRUE pixel size + the three
font stacks (heading / body / mono) shown as themselves. The
specimen-row format `(specimen | name + size/lh/weight)` is the
canonical unit Anthropic's `05-design-system` demo established.

## What it does

`buildTypographyPanel(designmd)`:

1. reads `designmd.tokens.typography.scale` — the array of pixel ints;
2. reads `designmd.tokens.typography.{font-heading, font-body, font-mono}`;
3. for each scale step, emits a row with the SAME specimen text
   ("Lo, Sicilia mosse guai a Minòs… ") rendered at that step's
   pixel size, in the heading font;
4. for each font stack, emits a row with the stack name (mono) and
   a sample line in that stack.

The trick: every row has TWO columns — the specimen (left) and the
META (right, mono): `size/lh/weight` in a small monospace block. The
reader sees BOTH the visual rendering and the underlying numeric
spec.

## Why one specimen text repeated

Using the SAME text at every scale step makes the steps compare
fairly. A different sentence per step would let line-length /
character-set bias the comparison. The standard specimen is a
multilingual sentence that exercises Latin diacritics + a few
common ligatures.

## Scaffold to emit

The panel is rendered as part of the full contact sheet. The shape:

```html
<section data-vc-panel="typography" class="vc-sheet-panel">
  <h2>Typography scale</h2>

  <div class="vc-sheet-type-scale">
    <div class="vc-sheet-type-row">
      <span class="vc-sheet-type-specimen"
            style="font-size: 48px; line-height: 1.2; font-weight: 700;
                   font-family: var(--vc-font-heading);">
        Lo, Sicilia mosse guai a Minòs…
      </span>
      <span class="vc-sheet-type-meta">
        <code>48 / 1.2 / 700</code> <br>
        <code>var(--vc-text-6)</code>
      </span>
    </div>
    <!-- … repeat per scale step … -->
  </div>

  <h3>Font stacks</h3>
  <div class="vc-sheet-type-stacks">
    <div class="vc-sheet-type-stack-row">
      <span class="vc-sheet-type-stack-label">heading</span>
      <span style="font-family: var(--vc-font-heading);">The quick brown fox…</span>
      <code>var(--vc-font-heading)</code>
    </div>
    <!-- … body, mono … -->
  </div>
</section>
```

## Lib functions used

- `amvcpTokenSheet.renderContactSheet(designmd)` → includes the
  typography panel
- (internal) `buildTypographyPanel(designmd)` — not exported

## DESIGN.md tokens used

- reads: `typography.scale: number[]`,
  `typography.{font-heading, font-body, font-mono}: string`,
  `typography.{weight-regular, weight-medium, weight-bold}: number`,
  `typography.line-height: number`
- emits (via the engine): `--vc-text-0` … `--vc-text-N`,
  `--vc-font-heading`, `--vc-font-body`, `--vc-font-mono`,
  `--vc-weight-{regular, medium, bold}`, `--vc-line-height`

## Anti-slop interaction

The font stacks are LINTED — a `--vc-font-heading: "Inter, …"` (a
banned primary font as the first family) gets flagged via
`lintTokenSet`. The panel itself reveals it visually: the heading
specimens render in Inter, which is what the user sees and (per the
slop convention) should not see in a heritage / parchment / editorial
artifact.

The reconciliation rule applies: `font-family: "Georgia, Inter,
serif"` PASSES (Inter is a fallback, fine); `font-family: "Inter,
system-ui"` FAILS (Inter is the primary, slop).

## Selection / comment / decision-mini contract

Each specimen is a `<span>` so it's selectable normal text. The
meta-column codes are click-to-copy (the CSS var name or the
literal value, depending on the affordance).

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open the contact
sheet under `dev-browser`. Screenshot the typography panel in **both
themes** (R1) and verify:

1. each specimen renders at its labelled px size — measure with
   `getBoundingClientRect().height` and verify ≈ `pxSize *
   line-height` (within 2px of rounding);
2. the heading specimens render in the heading font (verify
   `getComputedStyle(specimen).fontFamily` includes the heading
   stack's primary family if available, or the documented fallback
   otherwise);
3. NO banned primary font appears in any of the three font-stack
   rows (audit the rendered `<code>` text);
4. mono-font row uses an actual monospace font (verify `getComputedStyle
   (...).fontFamily` includes a known monospace family).

Per the no-nested-scrollbars rule: very-wide specimens (e.g. at the
`var(--vc-text-6)` step) MAY exceed the panel width — that's
expected; they extend the document's horizontal scroll axis. The
panel itself never gets `overflow: auto` / `overflow-x: scroll`.
