# Visual-design exploration shape — toolbar + N artboards + rationale

The document that explores N visual treatments of the same UI surface
side-by-side, with a light/dark switcher and per-artboard rationale.
Canonical reference: `html-effectiveness` demo #02,
"exploration-visual-designs". Use this shape when the user asked for
"some design options" and you want to ship a single deliverable that
shows the options + the reasoning + the trade-offs.

This shape is the **show-don't-tell** counterpart of
`compare-n-approaches-shape`: instead of asking the user "do you want
minimal or editorial?", you render 3-4 prototypes and let them point
at one. The rationale below each artboard turns the exploration into
a teaching document — the user learns *why* the option works as well
as *how it looks*.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| You have ≥2 visual treatments to compare | Single treatment to ship → `pr-writeup-author-side-shape` |
| The user said "let me see some options" | The user picked a direction → `design-system-doc-shape` |
| Each treatment is a working mini-prototype, not just a screenshot | Static screenshots → `feature-explainer-shape` |
| You want light/dark variants of every option | Light-only or dark-only → `compare-n-approaches-shape` |
| Each artboard has rationale prose underneath | No rationale needed → just attach mockups |

## Section order (fixed)

```
1. HEADER + PROMPT BOX            — the brief that produced these options
2. STICKY TOOLBAR                 — light/dark switcher + (optional) density slider
3. N-ARTBOARD GRID                — 2×2 or 3×1, each artboard a working preview
4. PER-ARTBOARD RATIONALE         — directly below each artboard, 2-4 bullets + a tag
5. CROSS-CUTTING TRADE-OFFS       — small comparison table or chip strip
6. NEXT STEPS                     — checkboxes for the user's pick + open questions
```

## Markdown scaffold

```html
<article class="vc-doc vc-doc--proposal" data-ve-prose>

<header class="vc-doc-header">
  <p class="vc-type-overline">Visual exploration · onboarding screen</p>
  <h1>Four directions for the onboarding hero</h1>
</header>

<aside class="vc-prompt">
  <p class="vc-prompt-label">PROMPT</p>
  <p>Reskin the onboarding hero. Must work in both light and dark; must
     not introduce a 4th typeface; should feel less generic-SaaS than
     the current rendering.</p>
</aside>

<!-- 2. Sticky toolbar with light/dark switcher -->
<nav class="vc-toolbar" aria-label="View controls">
  <fieldset class="vc-toolbar-group">
    <legend>Theme</legend>
    <label><input type="radio" name="theme" value="light" checked>Light</label>
    <label><input type="radio" name="theme" value="dark">Dark</label>
  </fieldset>
  <fieldset class="vc-toolbar-group">
    <legend>Density</legend>
    <label><input type="radio" name="density" value="comfortable" checked>Comfortable</label>
    <label><input type="radio" name="density" value="compact">Compact</label>
  </fieldset>
</nav>

<!-- 3 + 4. 2x2 artboard grid with rationale -->
<section id="artboards" class="vc-artboards">

  <article class="vc-artboard" data-variant="A">
    <header class="vc-artboard-head">
      <span class="vc-artboard-tag">A · Editorial</span>
      <h3>Serif headline, asymmetric two-column</h3>
    </header>
    <div class="vc-artboard-stage">
      <!-- the actual mini-prototype: a real hero, sized down -->
    </div>
    <div class="vc-artboard-rationale">
      <p>Why it works:</p>
      <ul>
        <li>Serif headline distinguishes us from the SaaS-default sans pile.</li>
        <li>Asymmetric grid creates a "reading direction" the eye follows.</li>
        <li>Pairs naturally with the existing body font (no 4th typeface).</li>
      </ul>
      <p class="vc-artboard-risk">Risk: the serif reads as "publication"
         more than "product" — may not match the marketing tone.</p>
    </div>
  </article>

  <article class="vc-artboard" data-variant="B">
    <header class="vc-artboard-head">
      <span class="vc-artboard-tag">B · Minimal</span>
      <h3>Single-column, single accent, oversized white-space</h3>
    </header>
    <div class="vc-artboard-stage">…</div>
    <div class="vc-artboard-rationale">
      <p>Why it works:</p>
      <ul>
        <li>Mobile and desktop converge to the same composition.</li>
        <li>The accent color does the heavy lifting; no decorative art.</li>
        <li>Fastest to ship — no new components.</li>
      </ul>
      <p class="vc-artboard-risk">Risk: minimal can feel under-resourced
         when the product is heavyweight.</p>
    </div>
  </article>

  <article class="vc-artboard" data-variant="C">
    <header class="vc-artboard-head">
      <span class="vc-artboard-tag">C · Data hero</span>
      <h3>Animated metric counter as the hero element</h3>
    </header>
    <div class="vc-artboard-stage">…</div>
    <div class="vc-artboard-rationale">
      <p>Why it works:</p>
      <ul>
        <li>Number-as-hero anchors the eye and tells the story in a glance.</li>
        <li>The counter animation provides a moment of motion without
            ambient animation everywhere.</li>
        <li>Works in dark mode; the number contrasts cleanly.</li>
      </ul>
      <p class="vc-artboard-risk">Risk: the number must be true and
         non-misleading; "10× faster" is harder to defend than "<200ms p99".</p>
    </div>
  </article>

  <article class="vc-artboard" data-variant="D">
    <header class="vc-artboard-head">
      <span class="vc-artboard-tag">D · Editorial-grid</span>
      <h3>Magazine-style grid with multiple entry points</h3>
    </header>
    <div class="vc-artboard-stage">…</div>
    <div class="vc-artboard-rationale">
      <p>Why it works:</p>
      <ul>
        <li>Acknowledges that the user did not necessarily come for the
            primary CTA — surfaces secondary paths immediately.</li>
        <li>Visual richness without single-hero responsibility.</li>
      </ul>
      <p class="vc-artboard-risk">Risk: most expensive to maintain;
         requires multiple secondary surfaces to look right.</p>
    </div>
  </article>

</section>

<!-- 5. Cross-cutting trade-offs -->
<section id="tradeoffs">
  <h2>At a glance</h2>
  <table>
    <thead>
      <tr><th>Variant</th><th>Risk profile</th><th>Effort</th><th>Mobile</th><th>Dark</th></tr>
    </thead>
    <tbody>
      <tr><td>A · Editorial</td>     <td>med</td><td>~1 wk</td><td>good</td><td>good</td></tr>
      <tr><td>B · Minimal</td>       <td>low</td><td>~3 d</td><td>great</td><td>great</td></tr>
      <tr><td>C · Data hero</td>     <td>med</td><td>~5 d</td><td>good</td><td>great</td></tr>
      <tr><td>D · Editorial-grid</td><td>high</td><td>~2 wk</td><td>complex</td><td>good</td></tr>
    </tbody>
  </table>
</section>

<!-- 6. Next steps -->
<section id="next-steps">
  <h2>Next steps</h2>
  <ul class="vc-action-list">
    <li><input type="checkbox"> Pick a variant (A / B / C / D).</li>
    <li><input type="checkbox"> Confirm constraints: typeface count, accent palette, motion budget.</li>
    <li><input type="checkbox"> Approve the metric claim for variant C if chosen.</li>
  </ul>
</section>

</article>
```

## The light/dark toolbar switcher

The toolbar is **sticky-to-top** with an ivory background — the
standard pattern across the reference corpus. Clicking a theme radio
flips `data-theme` on the document root, and every artboard's tokens
swap via CSS custom properties.

```css
.vc-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  gap: var(--vc-space-4, 16px);
  padding: var(--vc-space-3, 12px) var(--vc-space-4, 16px);
  background: var(--vc-color-canvas, #faf6ee);
  border-block-end: 1px solid var(--vc-color-border, #e3dcc9);
}
.vc-toolbar-group {
  display: inline-flex;
  align-items: center;
  gap: var(--vc-space-2, 8px);
  border: none;
  padding: 0;
  font-size: var(--vc-text-1, 14px);
}
.vc-toolbar-group legend {
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vc-color-content-muted, #5b5343);
  padding-inline-end: var(--vc-space-2, 8px);
}
```

```js
document.querySelectorAll('input[name="theme"]').forEach(r => {
  r.addEventListener('change', e => {
    document.documentElement.dataset.theme = e.target.value;
  });
});
```

Pair with the DESIGN.md engine — the engine swaps `--vc-color-*`
values whenever `data-theme` changes. No re-render, no JS framework.

## The 2×2 artboard grid

```css
.vc-artboards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--vc-space-5, 32px);
  margin-block: var(--vc-space-5, 32px);
}
@media (max-width: 980px) {
  .vc-artboards { grid-template-columns: 1fr; }
}
.vc-artboard {
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: var(--vc-space-4, 16px);
  background: var(--vc-color-surface, #ffffff);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
}
.vc-artboard-tag {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vc-color-accent, #b8861f);
}
.vc-artboard-stage {
  margin-block: var(--vc-space-3, 12px);
  padding: var(--vc-space-4, 16px);
  background: var(--vc-color-canvas, #faf6ee);
  border-radius: var(--vc-radius-sm, 4px);
  min-height: 240px;
}
.vc-artboard-rationale {
  margin-block-start: var(--vc-space-3, 12px);
  font-size: var(--vc-text-1, 14px);
}
.vc-artboard-risk {
  color: var(--vc-color-content-muted, #5b5343);
  font-style: italic;
}
```

For 3 variants use a 3×1 layout (`repeat(3, minmax(0, 1fr))` with
the breakpoint at 1100px). For 5+ variants the shape is wrong — you
have too many options for a single document; split into themed groups
or remove the lower-tier candidates.

## The per-artboard "Risk:" line

Every artboard MUST end with one italic `Risk:` line. This forces the
agent to write *honest* rationale — every option has a trade-off; the
risk line surfaces it. Reviewers learn to scan the risk lines first.

```css
.vc-artboard-risk {
  color: var(--vc-color-content-muted, #5b5343);
  font-style: italic;
  margin-block-start: var(--vc-space-2, 8px);
}
.vc-artboard-risk::before {
  content: "Risk: ";
  font-weight: var(--vc-weight-bold, 700);
  font-style: normal;
  color: var(--vc-color-warning, #a8791f);
}
```

(Or write `Risk:` literally in the prose, as in the scaffold above —
either pattern is fine; the CSS variant lets a renderer enforce the
prefix without polluting the input markdown.)

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-canvas` | Toolbar background, artboard stage background |
| `--vc-color-surface` | Artboard card background |
| `--vc-color-accent` | Artboard tag |
| `--vc-color-warning` | "Risk:" prefix |
| `--vc-color-content-muted` | Risk line, toolbar legend |
| `--vc-color-border` | Artboard border, toolbar divider |
| `--vc-font-mono` | Artboard tag, toolbar labels |
| `--vc-radius-md` | Artboard cards |
| `--vc-radius-sm` | Stage inner |

Light/dark works because the engine swaps the values of these tokens
on `data-theme` change. The visual-design exploration shape is one of
the most demanding theme tests in the plugin — every artboard's stage
must be readable in both modes.

## Composition with other skills

| Section | Embed from |
|---|---|
| Prompt box | `amvcp-prose-pages` (this skill) |
| Sticky toolbar | `amvcp-interactive-controls` (radio-group + sticky) |
| Light/dark switch wiring | `amvcp-design-tokens` (the `applyTokens` engine) |
| Artboard stages | Whichever skill builds the prototype inside (wireframe / chart / typography / etc.) |
| Tradeoff table | `amvcp-tables` |
| Next-steps checklist | `amvcp-interactive-controls` |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);
window.amvcpReportDoc.init(document);
const report = window.amvcpReportDoc.runGates(document, "explore-onboarding");

// Important: run QA in BOTH themes to catch contrast issues in one mode
document.documentElement.dataset.theme = 'light';
const light = window.amvcpReportDoc.runGates(document, "explore-light");
document.documentElement.dataset.theme = 'dark';
const dark  = window.amvcpReportDoc.runGates(document, "explore-dark");
console.assert(light.ok && dark.ok, "QA failed in one theme");
```

## Selection / comment notes

- Each artboard is selectable as a unit
  (`{type:"artboard", variant:"A"}`) so a reviewer can comment "I
  like A" without highlighting any prose.
- Artboard tags are selectable independently — useful for "rename
  this direction" comments.
- Risk lines are selectable individually so a reviewer can rebut a
  risk ("this is overstated").
- Tradeoff-table cells are selectable per-cell so a reviewer can
  comment "this effort estimate is wrong".

## Decision-mini hook

The Next-steps section is the natural home of the picker:

```html
<div class="ve-decision" data-decision-id="onboarding-direction">
  <p>Which direction do we ship?</p>
  <button data-choice="A">A — Editorial</button>
  <button data-choice="B">B — Minimal</button>
  <button data-choice="C">C — Data hero</button>
  <button data-choice="D">D — Editorial-grid</button>
  <button data-choice="none">None — keep exploring</button>
</div>
```

## Anti-patterns

- **Artboards without rationale** — the rationale is what
  distinguishes this shape from a Figma export. Without it, the
  reviewer cannot meaningfully respond.
- **All artboards in light mode only** — defeats the toolbar's
  purpose; the reviewer wants to see both themes.
- **A "winner" artboard pre-highlighted** — biases the pick. Use the
  Next-steps decision-mini instead.
- **5+ artboards** — see above; split into themed sub-groups.
- **Artboards drawn as static `<img>`** — the artboards must be
  working HTML so the toolbar's theme switch actually re-skins them.
  Images defeat the entire shape.
- **A trade-off table that does not include every artboard** —
  missing an artboard signals you have written it off; do that in
  the prose, not by omission.
- **No "Risk:" line on at least one artboard** — every option has a
  trade-off. An artboard with no risk is over-sold.
- **A toolbar that floats over the artboards on mobile** — collapse
  to a static bar above the artboards below the 980px breakpoint;
  sticky-overlap with the first artboard hides content.
