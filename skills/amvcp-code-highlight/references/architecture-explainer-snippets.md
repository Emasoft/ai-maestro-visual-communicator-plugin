# Sub-technique E6 — Architecture explainer with numbered callstack snippets

## Table of Contents

- [E6.1 The shape](#e61-the-shape)
- [E6.2 The composition with collapsed-snippets-walkthrough](#e62-the-composition-with-collapsed-snippets-walkthrough)
- [E6.3 The leading SVG diagram](#e63-the-leading-svg-diagram)
- [E6.4 The hot-step modifier](#e64-the-hot-step-modifier)
- [E6.5 The sticky right sidebar](#e65-the-sticky-right-sidebar)
- [E6.6 Composition with the diagram skill](#e66-composition-with-the-diagram-skill)
- [E6.7 Selection / commenting flow](#e67-selection--commenting-flow)
- [E6.8 Light + dark verification](#e68-light--dark-verification)
- [E6.9 Tokens consumed](#e69-tokens-consumed)
- [E6.10 Mined source attribution](#e610-mined-source-attribution)

The numbered callstack walkthrough — `[circular badge] [file:line
range] [prose] [<details> source]` per step, with the hot/critical
step using a clay-tinted badge. Mined from `04-code-understanding.html`
(html-effectiveness catalog #4).

## E6.1 The shape

An architecture explainer page describes how a feature flows through
the codebase. The page has these sections:

1. **Hand-drawn SVG box-and-arrow diagram** (the architecture overview
   — owned by `amvcp-diagram` skill).
2. **Numbered walkthrough** (the callstack as ordered steps — this
   reference).
3. **Sticky right sidebar** with "Key files" (path → 1-line-desc) and
   "Gotchas" (clay-bordered, clay-bullet items).

The walkthrough is sandwiched between the diagram (the visual
overview) and the sidebar (the metadata).

## E6.2 The composition with collapsed-snippets-walkthrough

This composition IS [collapsed-snippets-walkthrough.md](./collapsed-snippets-walkthrough.md) — that reference is the GENERIC walkthrough
machinery. THIS reference is the ARCHITECTURE-EXPLAINER use case with
two specific extras:

1. **The leading SVG diagram** (not in the generic walkthrough).
2. **The sticky sidebar with Key Files + Gotchas** (not in the generic
   walkthrough).

If you want just the walkthrough, see the generic ref. This ref is
for the full architecture-explainer page.

## E6.3 The leading SVG diagram

A hand-drawn SVG box-and-arrow architecture diagram appears as the
page's HERO. It shows the high-level data flow that the walkthrough
will then trace step-by-step.

Mined catalog quote: *"a numbered 5-step walkthrough where each step
is `[circular badge]` + `[file:line range]` + prose + `<details>` with
the actual source."*

The diagram is OWNED by `amvcp-diagram` (the diagram skill). The
walkthrough is owned by THIS skill. The two compose:

```html
<main class="ve-arch-explainer">
  <header>
    <h1>How authentication flows through the auth subsystem</h1>
    <p class="ve-lead">Reads → middleware → JWT verifier → JWKS loader → user object</p>
  </header>

  <section class="ve-arch-explainer__diagram">
    <svg class="ve-diagram-svg" viewBox="0 0 800 240">
      <!-- 5 boxes, 4 arrows, one box (the hot one) clay-tinted -->
    </svg>
  </section>

  <section class="ve-arch-explainer__walkthrough">
    <h2>Step-by-step</h2>
    <ol class="ve-code-walkthrough">
      …5 steps per [collapsed-snippets-walkthrough.md](./collapsed-snippets-walkthrough.md)…
    </ol>
  </section>

  <aside class="ve-arch-explainer__sidebar">
    <!-- sticky right sidebar — see E6.5 -->
  </aside>
</main>
```

CSS for the page-level layout:

```css
.ve-arch-explainer {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 32px;
}
.ve-arch-explainer__diagram,
.ve-arch-explainer__walkthrough,
.ve-arch-explainer header {
  grid-column: 1;
}
.ve-arch-explainer__sidebar {
  grid-column: 2;
  position: sticky;
  top: 24px;
  align-self: start;
}
@media (max-width: 900px) {
  .ve-arch-explainer { grid-template-columns: 1fr; }
  .ve-arch-explainer__sidebar { position: static; }
}
```

## E6.4 The hot-step modifier

The CRITICAL step (typically the trust boundary, the algorithm core,
the place where the bug would be most damaging) gets `ve-code-step--hot`:

```html
<li class="ve-code-step ve-code-step--hot">
  <div class="ve-code-step__head">
    <span class="ve-code-step__badge">3</span>     <!-- this badge is clay-filled, not tinted -->
    <span class="ve-code-step__path">src/auth/jwt.ts</span>
    <span class="ve-code-step__lines">L15-L38</span>
  </div>
  <p class="ve-code-step__prose">
    <strong>This is the trust boundary.</strong> The JWT verifier
    validates the signature using the JWKS endpoint. A failure here
    is the difference between authenticated and rejected requests.
  </p>
  …<details>…</details>
</li>
```

Plus the matching box in the SVG diagram gets `class="hot"` so the
visual hierarchy is consistent:

```css
.ve-diagram-svg .box.hot {
  fill: color-mix(in srgb, var(--ve-accent) 10%, transparent);
  stroke: var(--ve-accent);
  stroke-width: 2.5;
}
```

Mined catalog quote: *"the hot/critical step has a clay-tinted badge
so the eye lands on the trust boundary first."*

## E6.5 The sticky right sidebar

```html
<aside class="ve-arch-explainer__sidebar">
  <section class="ve-sidebar-panel">
    <h3>Key files</h3>
    <ul class="ve-sidebar-panel__list">
      <li>
        <code class="inline">src/auth/middleware.ts</code>
        Entry: reads the header, dispatches to the verifier
      </li>
      <li>
        <code class="inline">src/auth/jwt.ts</code>
        Verifier: validates JWT signature, returns user
      </li>
      <li>
        <code class="inline">src/auth/jwks-loader.ts</code>
        Cache: fetches and caches the JWKS keys
      </li>
    </ul>
  </section>

  <section class="ve-sidebar-panel ve-sidebar-panel--gotchas">
    <h3>Gotchas</h3>
    <ul class="ve-sidebar-panel__list">
      <li>The JWKS cache TTL is 24h — key rotations within 24h are silent failures.</li>
      <li>The middleware does NOT log auth failures by design (rate-limited audit log).</li>
      <li><code class="inline">verifyJwt</code> is async — never call it synchronously.</li>
    </ul>
  </section>
</aside>
```

CSS:

```css
.ve-sidebar-panel {
  margin-bottom: 24px;
  padding: 14px 16px;
  border: 1px solid var(--vc-color-neutral-300);
  border-radius: 10px;
}
.ve-sidebar-panel h3 {
  margin: 0 0 8px;
  font-size: var(--vc-text-small);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vc-color-neutral-700);
}
.ve-sidebar-panel--gotchas {
  border-color: var(--ve-accent);
}
.ve-sidebar-panel--gotchas li::marker {
  color: var(--ve-accent);
}
```

The Gotchas panel uses a CLAY-BORDERED visual to mark it as "things
you might miss" — matches the catalog's exact treatment.

## E6.6 Composition with the diagram skill

This composition CROSSES skill boundaries:
- The SVG diagram is `amvcp-diagram`'s domain.
- The walkthrough + sidebar are `amvcp-code-highlight`'s.

The PAGE-level glue (the `<main class="ve-arch-explainer">` grid)
lives in the host page's stylesheet, not in either skill — it's a
COMPOSITION, and composition-level layout is a page-stylesheet
responsibility.

For convenience, the architecture-explainer pattern can be wrapped
in a higher-level "doc shape" skill (`amvcp-report-doc`'s
architecture-explainer template) that emits the full markup for an
agent. This reference documents the code-highlight-side responsibility.

## E6.7 Selection / commenting flow

Reader expands step 3 (the hot one), selects the line that uses
`jwks.getKey(kid)`, and clicks the comment pill. Payload includes:
- Step number (3)
- File path (`src/auth/jwt.ts`)
- Line range (15-38)
- Selected line content
- Whether this is the hot step (yes)

The agent receiving the comment has full context: "the reader is
asking about the hot/critical step in the auth callstack". Can
respond with security-relevant context, propose tests, etc.

## E6.8 Light + dark verification

- [ ] SVG diagram boxes readable on both themes (the hot box's clay
      fill should be subtle on dark, slightly stronger on light)
- [ ] Step badges: regular (14%-tinted) AND hot (full accent) both
      visible on both themes
- [ ] Sticky sidebar background and border on both themes
- [ ] Gotcha panel's clay border distinct from regular panels on both
      themes
- [ ] Expanded `<details>` shows the code block correctly on both themes

## E6.9 Tokens consumed

- All from [collapsed-snippets-walkthrough.md](./collapsed-snippets-walkthrough.md)
- `--ve-accent` — hot badge, Gotchas border, hot SVG box
- `--vc-color-neutral-300` / `-700` — sidebar borders / headings

## E6.10 Mined source attribution

Catalog quote from §3.13 report-doc shapes, source `04-code-
understanding.html`:

> *"Architecture explainer shape: h1 + summary + SVG flow diagram +
> numbered callstack walkthrough (with hot-step modifier) + sticky
> sidebar (Key files + Gotchas in clay-bordered panel)."*

Listed in the canonical shapes — adopted verbatim.
