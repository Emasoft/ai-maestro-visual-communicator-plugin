# Design-system doc shape — the living one-pager of a project's DESIGN.md

The document that *renders* a project's DESIGN.md token set as a
visual reference. Canonical reference: `html-effectiveness` demo #05,
"design-system" — one-page color swatches + type-scale rows + spacing
ruler + radius cards + elevation cards + live component examples.

Distinct from the `amvcp-design-tokens` skill (which authors and
applies tokens at runtime) — this is the *prose page that documents
the tokens* so a human reader can scan the entire system at a glance.
Every project that ships with a DESIGN.md should also ship this page.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| Project has a DESIGN.md and needs a human-facing reference | Authoring new tokens → `amvcp-design-tokens` skill directly |
| You want one URL that reskins automatically when the DESIGN.md changes | Token-tuning experiment → `visual-design-exploration-shape` |
| The reference will be linked from CLAUDE.md / README / wiki | Tokens are stable and undocumented → just publish the DESIGN.md raw |
| Reader will scan colors, type, spacing, components in a single page | Long-form design rationale → `whitepaper-shape` |
| Output needs to be living (re-renders on token edit) | Snapshot reference → `feature-explainer-shape` |

## Section order (fixed)

```
1. HEADER + COMMIT SHA      — the DESIGN.md version this page was rendered against
2. COLOR SWATCH GRID         — Primary / Neutral / Semantic groups
3. TYPE SCALE                — every step with a live specimen + meta column
4. SPACING RULER             — horizontal bars at the canonical steps
5. RADIUS CARDS              — 4 / 8 / 12 / 20 px corner samples
6. ELEVATION CARDS           — sm / md / lg shadow chips
7. COMPONENT EXAMPLES        — live <button>, <input>, <label>, <span class="badge"> etc.
8. DO'S AND DON'TS           — short list extracted from the DESIGN.md
9. CHANGE LOG                — every token edit in reverse chrono
```

## Markdown scaffold

```html
<article class="vc-doc vc-doc--design-system-doc" data-ve-prose>

<header class="vc-doc-header">
  <p class="vc-type-overline">Design system · acme-app</p>
  <h1>Tokens, type, spacing &amp; components</h1>
  <p class="vc-doc-byline">
    Rendered against <code class="vc-sha">DESIGN.md@4f8c1a3</code> ·
    2026-05-16 17:42 ·
    <span class="vc-auto-pill">auto-generated</span>
  </p>
</header>

<!-- 2. Color swatches grouped by role -->
<section id="colors">
  <h2>Color</h2>

  <h3>Primary</h3>
  <ul class="vc-swatch-grid">
    <li class="vc-swatch">
      <span class="vc-swatch-chip" style="background: var(--vc-color-accent)"></span>
      <code class="vc-swatch-token">--vc-color-accent</code>
      <code class="vc-swatch-hex" data-vc-hex-of="--vc-color-accent">#b8861f</code>
    </li>
    <!-- one li per primary token -->
  </ul>

  <h3>Neutral</h3>
  <ul class="vc-swatch-grid">
    <li class="vc-swatch">
      <span class="vc-swatch-chip" style="background: var(--vc-color-canvas)"></span>
      <code class="vc-swatch-token">--vc-color-canvas</code>
      <code class="vc-swatch-hex" data-vc-hex-of="--vc-color-canvas">#faf6ee</code>
    </li>
    <!-- … --vc-color-surface, --vc-color-surface-raised, --vc-color-surface-sunken,
          --vc-color-content, --vc-color-content-muted, --vc-color-content-subtle,
          --vc-color-border, --vc-color-border-strong … -->
  </ul>

  <h3>Semantic</h3>
  <ul class="vc-swatch-grid">
    <li class="vc-swatch">
      <span class="vc-swatch-chip" style="background: var(--vc-color-success)"></span>
      <code class="vc-swatch-token">--vc-color-success</code>
      <code class="vc-swatch-hex" data-vc-hex-of="--vc-color-success">#3a6b5c</code>
    </li>
    <!-- … --vc-color-warning, --vc-color-danger, --vc-color-info … -->
  </ul>
</section>

<!-- 3. Type scale -->
<section id="type">
  <h2>Type scale</h2>
  <div class="vc-type-scale">
    <div class="vc-type-row">
      <div class="vc-type-specimen" style="font-size: var(--vc-text-6)">Display</div>
      <dl class="vc-type-meta">
        <dt>Token</dt><dd>--vc-text-6</dd>
        <dt>Size</dt><dd>48 px</dd>
        <dt>Line</dt><dd>1.1</dd>
        <dt>Weight</dt><dd>500</dd>
      </dl>
    </div>
    <div class="vc-type-row">
      <div class="vc-type-specimen" style="font-size: var(--vc-text-5)">Heading 1</div>
      <dl class="vc-type-meta">
        <dt>Token</dt><dd>--vc-text-5</dd>
        <dt>Size</dt><dd>32 px</dd>
        <dt>Line</dt><dd>1.2</dd>
        <dt>Weight</dt><dd>600</dd>
      </dl>
    </div>
    <!-- … one row per --vc-text-* step … -->
  </div>
</section>

<!-- 4. Spacing ruler -->
<section id="spacing">
  <h2>Spacing</h2>
  <ul class="vc-spacing-ruler">
    <li><span class="vc-spacing-bar" style="width:  4px"></span><code>--vc-space-0  ·  4px</code></li>
    <li><span class="vc-spacing-bar" style="width:  8px"></span><code>--vc-space-1  ·  8px</code></li>
    <li><span class="vc-spacing-bar" style="width: 12px"></span><code>--vc-space-2  · 12px</code></li>
    <li><span class="vc-spacing-bar" style="width: 16px"></span><code>--vc-space-3  · 16px</code></li>
    <li><span class="vc-spacing-bar" style="width: 24px"></span><code>--vc-space-4  · 24px</code></li>
    <li><span class="vc-spacing-bar" style="width: 32px"></span><code>--vc-space-5  · 32px</code></li>
    <li><span class="vc-spacing-bar" style="width: 48px"></span><code>--vc-space-6  · 48px</code></li>
    <li><span class="vc-spacing-bar" style="width: 64px"></span><code>--vc-space-7  · 64px</code></li>
  </ul>
</section>

<!-- 5. Radius cards -->
<section id="radius">
  <h2>Radius</h2>
  <ul class="vc-radius-cards">
    <li><div class="vc-radius-sample" style="border-radius: var(--vc-radius-sm)"></div><code>--vc-radius-sm · 4px</code></li>
    <li><div class="vc-radius-sample" style="border-radius: var(--vc-radius-md)"></div><code>--vc-radius-md · 8px</code></li>
    <li><div class="vc-radius-sample" style="border-radius: var(--vc-radius-lg)"></div><code>--vc-radius-lg · 12px</code></li>
    <li><div class="vc-radius-sample" style="border-radius: var(--vc-radius-xl)"></div><code>--vc-radius-xl · 20px</code></li>
  </ul>
</section>

<!-- 6. Elevation cards -->
<section id="elevation">
  <h2>Elevation</h2>
  <!-- one card per --vc-shadow-* level -->
</section>

<!-- 7. Component examples (live) -->
<section id="components">
  <h2>Components</h2>
  <div class="vc-component-stage">
    <button class="vc-btn vc-btn--primary">Primary action</button>
    <button class="vc-btn">Secondary</button>
    <button class="vc-btn vc-btn--danger">Destructive</button>
    <input class="vc-input" placeholder="Text input…">
    <label class="vc-checkbox"><input type="checkbox"> Checkbox</label>
    <span class="vc-badge">badge</span>
  </div>
</section>

<!-- 8. Do's and Don'ts -->
<section id="rules">
  <h2>Do &amp; Don't</h2>
  <div class="vc-rules">
    <div class="vc-rules-do">
      <h3>Do</h3>
      <ul>
        <li>Use <code>--vc-color-accent</code> for the primary CTA and
            nothing else.</li>
        <li>Use display type sparingly; one Display per page maximum.</li>
        <li>Pair body sans with mono labels for stats and data.</li>
      </ul>
    </div>
    <div class="vc-rules-dont">
      <h3>Don't</h3>
      <ul>
        <li>Don't introduce a 4th typeface — heading, body, mono is the
            whole stack.</li>
        <li>Don't use the purple/violet family — banned in this DESIGN.md.</li>
        <li>Don't hardcode hex values; reach for the closest
            <code>--vc-color-*</code> token.</li>
      </ul>
    </div>
  </div>
</section>

<!-- 9. Change log -->
<section id="change-log">
  <h2>Change log</h2>
  <dl class="vc-changelog">
    <dt>2026-05-16 · 4f8c1a3 — @alice</dt>
      <dd>Renamed <code>--vc-color-brand</code> to
          <code>--vc-color-accent</code> for clarity.</dd>
    <dt>2026-05-02 · 2c5e9d0 — @bob</dt>
      <dd>Added semantic tokens: <code>--vc-color-success</code>,
          <code>--vc-color-warning</code>, <code>--vc-color-danger</code>,
          <code>--vc-color-info</code>.</dd>
  </dl>
</section>

</article>
```

## The swatch grid

```css
.vc-swatch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--vc-space-3, 12px);
  list-style: none;
  padding: 0;
  margin-block: var(--vc-space-3, 12px);
}
.vc-swatch {
  display: grid;
  grid-template-columns: 56px 1fr;
  align-items: center;
  gap: var(--vc-space-3, 12px);
  padding: var(--vc-space-2, 8px);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
  background: var(--vc-color-surface, #ffffff);
}
.vc-swatch-chip {
  display: block;
  width: 56px; height: 56px;
  border-radius: var(--vc-radius-sm, 4px);
  border: 1px solid color-mix(in srgb, var(--vc-color-content) 12%, transparent);
}
.vc-swatch-token { display: block; font-size: var(--vc-text-1, 14px); }
.vc-swatch-hex  { display: block; color: var(--vc-color-content-muted, #5b5343);
                   font-size: var(--vc-text-0, 11px); }
```

The hex value is rendered by the runtime: `data-vc-hex-of` carries the
token name; a small script reads the computed value at load time and
substitutes the resolved hex. This way the page never lies about the
current value of the token, even after a hot-swap.

## The type-scale row atom

Reusable atom for the typography section. A specimen on the left + a
meta `<dl>` on the right.

```css
.vc-type-row {
  display: flex;
  align-items: baseline;
  gap: var(--vc-space-4, 16px);
  padding-block: var(--vc-space-3, 12px);
  border-block-end: 1px solid var(--vc-color-border, #e3dcc9);
}
.vc-type-row:last-child { border: none; }
.vc-type-specimen {
  flex: 1;
  font-family: var(--vc-font-heading, Georgia, serif);
  font-weight: var(--vc-weight-medium, 500);
  line-height: 1.1;
  letter-spacing: -0.01em;
}
.vc-type-meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px var(--vc-space-2, 8px);
  margin: 0;
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  color: var(--vc-color-content-muted, #5b5343);
  min-width: 140px;
}
.vc-type-meta dt { font-weight: var(--vc-weight-bold, 700); }
.vc-type-meta dd { margin: 0; }
```

## The spacing ruler atom

```css
.vc-spacing-ruler { list-style: none; padding: 0; margin: 0; }
.vc-spacing-ruler li {
  display: flex;
  align-items: center;
  gap: var(--vc-space-3, 12px);
  padding-block: 6px;
}
.vc-spacing-bar {
  display: inline-block;
  height: 10px;
  background: var(--vc-color-accent, #b8861f);
  border-radius: 2px;
}
```

The bar's `width` is the actual token value in `px`. A reader can see
the ratio between steps at a glance — that visual rhythm is what
distinguishes a thoughtful spacing scale from a random one.

## DESIGN.md tokens consumed

Every `--vc-*` token in the DESIGN.md is consumed by its own card in
this document — the page is the complete visual index of the token
set. The document also consumes the same tokens for its own chrome
(headings, body, callouts), so it serves as a real-world test of the
DESIGN.md.

## Composition with other skills

| Section | Embed from |
|---|---|
| Swatch grid | `amvcp-design-tokens` (token-sheet primitive) |
| Type-scale rows | `amvcp-typography` (semantic-hierarchy ref) |
| Spacing ruler | `amvcp-layout` (spatial-token-ladder ref) |
| Radius / Elevation cards | `amvcp-design-tokens` |
| Live component examples | `amvcp-interactive-controls` |
| Do/Don't rules list | `amvcp-prose-pages` (this skill) |
| Change log dl | `amvcp-prose-pages` (this skill) — `change-log-document-shape` |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);
window.amvcpReportDoc.init(document);
// Resolve hex values for swatches that carry data-vc-hex-of
document.querySelectorAll('[data-vc-hex-of]').forEach(el => {
  const token = el.dataset.vcHexOf;
  const value = getComputedStyle(document.documentElement)
                  .getPropertyValue(token).trim();
  if (value) el.textContent = value;
});
const report = window.amvcpReportDoc.runGates(document, "design-system-acme");
```

If the page is hot-swap reload-able (the DESIGN.md is edited and the
page re-renders), wire the hex resolution to re-fire on `vc:tokens-
applied` (a custom event emitted by `amvcp-designmd.js`).

## Selection / comment notes

- Every swatch is selectable individually
  (`{type:"swatch", token:"--vc-color-accent"}`) so a reviewer can
  comment "this hue is too saturated".
- Each type-scale row is selectable
  (`{type:"type-step", step:"--vc-text-5"}`).
- Each spacing ruler entry is selectable.
- Each component example is selectable as a unit — useful for "the
  button hover state needs more contrast".
- Each Do/Don't bullet is selectable per `<li>`.

## Decision-mini hook

Do/Don't items frequently host decision-minis for rule changes:

```html
<li>
  <div class="ve-decision" data-decision-id="ds-allow-4th-font">
    <p>Allow a 4th typeface (decorative display)?</p>
    <button data-choice="no">No, keep 3-font discipline</button>
    <button data-choice="yes-marketing">Yes, marketing pages only</button>
    <button data-choice="yes-everywhere">Yes, everywhere</button>
  </div>
</li>
```

## Anti-patterns

- **Static screenshots instead of live components** — defeats the
  whole point. The page is a *living* reference; screenshots go stale.
- **Hex values hand-typed next to a swatch** — they will fall out of
  sync with the token. Use `data-vc-hex-of` and let the runtime
  resolve.
- **A "Sample colors" section** showing colors not in the DESIGN.md
  — every color in this document MUST be a `--vc-*` token. Stray hex
  values violate the discipline the document is teaching.
- **Skipping the change-log** — without it, readers cannot tell when
  a token was renamed or removed and code stops working.
- **Multiple "Display" rows in the type scale** — one specimen per
  step. Display is one step (`--vc-text-6`).
- **No semantic-color group** — even projects without explicit
  semantic tokens have implicit ones; render them in the swatch grid
  with a note.
- **No commit-sha in the header** — the document is rendered against
  a specific DESIGN.md version. Without the sha, readers cannot tell
  if the document is stale.
- **Component examples in only light or only dark theme** — both
  themes MUST work; this is the project's most demanding contrast
  test (see also `style-discovery-show-dont-tell`).
