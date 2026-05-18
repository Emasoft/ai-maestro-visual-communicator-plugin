# Spacing & typography in wireframes

## Table of Contents

- [The `--vc-space-*` scale](#the---vc-space--scale)
- [The `--vc-text-*` scale](#the---vc-text--scale)
- [Spacing application rules](#spacing-application-rules)
- [Vertical rhythm — the consistent gap pattern](#vertical-rhythm--the-consistent-gap-pattern)
- [Heading hierarchy](#heading-hierarchy)
- [Text utility classes (wf-text + custom)](#text-utility-classes-wf-text--custom)
- [Font family contract — serif / sans / mono](#font-family-contract--serif--sans--mono)
- [Line length (measure) — 65-75 characters](#line-length-measure--65-75-characters)
- [Letter spacing for tracked uppercase](#letter-spacing-for-tracked-uppercase)
- [Numerals — tabular vs proportional](#numerals--tabular-vs-proportional)
- [Common spacing + type bugs](#common-spacing--type-bugs)

Two of the four foundational systems (alongside color + layout)
that make a wireframe READ correctly. The wireframe kit consumes
the DESIGN.md engine's spacing + type scales; this file documents
how to use them effectively.

## Table of contents

- [The `--vc-space-*` scale](#the---vc-space--scale)
- [The `--vc-text-*` scale](#the---vc-text--scale)
- [Spacing application rules](#spacing-application-rules)
- [Vertical rhythm — the consistent gap pattern](#vertical-rhythm--the-consistent-gap-pattern)
- [Heading hierarchy](#heading-hierarchy)
- [Text utility classes (wf-text + custom)](#text-utility-classes-wf-text--custom)
- [Font family contract — serif / sans / mono](#font-family-contract--serif--sans--mono)
- [Line length (measure) — 65-75 characters](#line-length-measure--65-75-characters)
- [Letter spacing for tracked uppercase](#letter-spacing-for-tracked-uppercase)
- [Numerals — tabular vs proportional](#numerals--tabular-vs-proportional)

---

## The `--vc-space-*` scale

The DESIGN.md engine ships an 8-step spacing scale:

| Token | Default value | Use for |
|---|---|---|
| `--vc-space-0` | 4px | Hairlines, very tight gaps |
| `--vc-space-1` | 8px | Tight gaps (icon + label, chip padding) |
| `--vc-space-2` | 12px | Standard tight (between input + label) |
| `--vc-space-3` | 16px | Standard medium (between siblings) |
| `--vc-space-4` | 24px | Standard wide (between sections) |
| `--vc-space-5` | 32px | Section margins |
| `--vc-space-6` | 48px | Major section breaks |
| `--vc-space-7` | 64px | Page-level breathing room |
| `--vc-space-8` | 96px | Hero-scale breaks |

The wireframe kit reads these for ALL padding + margins + gaps. To
make the wireframe DENSER across the board, override at root:

```html
<html style="--vc-space-3: 12px; --vc-space-4: 16px;">
  <!-- denser wireframe -->
</html>
```

To make it MORE breathable, increase the values.

---

## The `--vc-text-*` scale

The DESIGN.md engine ships an 8-step type scale:

| Token | Default value | Use for |
|---|---|---|
| `--vc-text-0` | 12px | Captions, helper text, eyebrow labels |
| `--vc-text-1` | 14px | Body text in dense UIs (tables, sidebars) |
| `--vc-text-2` | 16px | Body text (web), default for most copy |
| `--vc-text-3` | 18px | Lead paragraphs, large body |
| `--vc-text-4` | 20px | h4 — small section headers |
| `--vc-text-5` | 24px | h3 — sub-section titles |
| `--vc-text-6` | 32px | h2 — major section titles |
| `--vc-text-7` | 48px | h1 — page titles |
| `--vc-text-hero` | 64px+ | Hero displays |

The wireframe kit reads `--vc-text-0` (12px), `--vc-text-1` (14px),
and `--vc-text-2` (16px) for body, label, and helper text. Override
to bump everything up:

```html
<html style="--vc-text-2: 17px; --vc-text-6: 36px;">
  <!-- larger type wireframe -->
</html>
```

---

## Spacing application rules

### Rule 1: Use tokens, never raw px

```css
/* WRONG */
.my-card { padding: 16px; margin-bottom: 24px; }

/* RIGHT */
.my-card {
  padding: var(--vc-space-3, 16px);
  margin-bottom: var(--vc-space-4, 24px);
}
```

The fallback (`16px`) is the engine-absent path.

### Rule 2: Pick from the scale; don't interpolate

```css
/* WRONG — interpolating between tokens */
.my-card { padding: 20px; }     /* between space-3 and space-4 */

/* RIGHT — snap to the nearest token */
.my-card { padding: var(--vc-space-3, 16px); }     /* or space-4 */
```

Consistent spacing creates RHYTHM. Off-scale values break it.

### Rule 3: Bigger gaps for higher-level groupings

| Level | Gap |
|---|---|
| Inside a chip / button (label + icon) | `--vc-space-1` (8px) |
| Between siblings in a card | `--vc-space-2` (12px) |
| Between sub-sections | `--vc-space-3` (16px) |
| Between cards in a stack | `--vc-space-4` (24px) |
| Between major sections | `--vc-space-5` (32px) |
| Between header + body of a page | `--vc-space-6` (48px) |

### Rule 4: Use logical properties

```css
/* WRONG — breaks RTL */
.card { padding-left: 16px; margin-right: 24px; }

/* RIGHT — works in LTR and RTL */
.card {
  padding-inline-start: var(--vc-space-3);
  margin-inline-end: var(--vc-space-4);
}
```

For TOP/BOTTOM, use `padding-block-start` / `margin-block-end`.

---

## Vertical rhythm — the consistent gap pattern

A page has good RHYTHM when its vertical gaps follow a consistent
scale. Random gaps (sometimes 16, sometimes 19, sometimes 24)
disrupt rhythm.

### Pattern: stack with gap

```html
<main style="display:flex; flex-direction:column;
             gap:var(--vc-space-4, 24px);">
  <article class="wf-card">…</article>
  <article class="wf-card">…</article>
  <article class="wf-card">…</article>
</main>
```

All siblings get the same gap (24px) — perfect rhythm.

### Pattern: stack with mixed gap

```html
<main style="display:flex; flex-direction:column;">
  <header>…</header>
  <article class="wf-card"
           style="margin-block-start: var(--vc-space-5, 32px);">…</article>
  <article class="wf-card"
           style="margin-block-start: var(--vc-space-3, 16px);">…</article>
  <article class="wf-card"
           style="margin-block-start: var(--vc-space-3, 16px);">…</article>
</main>
```

For finer control — header gets 32px below; cards within the body
get 16px between. Two scales of rhythm.

### Pattern: padding pulses

A card with `padding: 16px` and an internal gap of `12px` creates
ONE visual unit. A page with multiple of these — separated by
24px — creates RHYTHMIC SPACES BETWEEN UNITS.

The key: pick PADDING and GAP from the same scale, but use a
LARGER step for inter-unit space.

---

## Heading hierarchy

| Tag | Default size | Margin top | Use for |
|---|---|---|---|
| h1 | `--vc-text-7` (48px) | 0 (first on page) | Page title |
| h2 | `--vc-text-6` (32px) | `--vc-space-6` (48px) | Major section |
| h3 | `--vc-text-5` (24px) | `--vc-space-5` (32px) | Sub-section / card title |
| h4 | `--vc-text-4` (20px) | `--vc-space-4` (24px) | Inline group |
| h5 | `--vc-text-3` (18px) | `--vc-space-3` (16px) | Rare — small group |
| h6 | `--vc-text-2` (16px) | `--vc-space-3` (16px) | Rare — inline label |

### Hierarchy rules

1. **No h1 jump.** Every page has ONE h1. Skipping to h3 without
   h2 confuses screen readers and visual flow.
2. **No h2 → h4 skip.** If you use h2, the next sub-section is h3.
3. **Card titles are h3 (or h2 if cards are first-class).** Don't
   put h1 inside cards — that's reserved for the page.
4. **Eyebrow text is NOT a heading.** Don't tag "CATEGORY" labels
   as `<h3>`; use `<span class="wf-label">`.

### Wireframe heading example

```html
<main class="wf-main">

  <h1 class="wf-text" data-wf-lines="1"
      style="font-size:var(--vc-text-7, 48px);">Page title</h1>

  <h2 class="wf-text" data-wf-lines="1"
      style="font-size:var(--vc-text-6, 32px);
             margin-block-start:var(--vc-space-6, 48px);">Major section</h2>

  <article class="wf-card">
    <header class="wf-card__title">
      <h3 class="wf-text" data-wf-lines="1"
          style="font-size:var(--vc-text-5, 24px);">Card title</h3>
    </header>
    <p class="wf-text" data-wf-lines="4"></p>
  </article>

</main>
```

---

## Text utility classes (wf-text + custom)

The `wf-text` class is the kit's DEFAULT body text. It paints a
configurable number of placeholder bars (`data-wf-lines="N"`).

### Common modifiers

```html
<!-- standard body -->
<p class="wf-text" data-wf-lines="3"></p>

<!-- single-line, no ragged tail -->
<p class="wf-text" data-wf-lines="1"></p>

<!-- bold -->
<span class="wf-text" data-wf-lines="1" style="font-weight:600;">Important text</span>

<!-- italic -->
<span class="wf-text" data-wf-lines="1" style="font-style:italic;">Side note</span>

<!-- small caption -->
<span class="wf-text" data-wf-lines="1"
      style="font-size:var(--vc-text-0, 12px);
             color:var(--vc-color-content-subtle);">Caption</span>

<!-- center-aligned -->
<p class="wf-text" data-wf-lines="2" style="text-align:center;"></p>

<!-- right-aligned -->
<p class="wf-text" data-wf-lines="1" style="text-align:right;"></p>

<!-- monospace (for IDs, codes) -->
<span class="wf-text" data-wf-lines="1" style="font-family:monospace;">#ABC1234</span>

<!-- uppercase tracked label -->
<span class="wf-text" data-wf-lines="1"
      style="text-transform:uppercase;
             letter-spacing:0.08em;
             font-size:var(--vc-text-0, 12px);">EYEBROW</span>
```

For text-heavy wireframes, define helper classes:

```css
.text-caption {
  font-size: var(--vc-text-0, 12px);
  color: var(--vc-color-content-subtle, #8a8170);
}

.text-eyebrow {
  font-size: var(--vc-text-0, 12px);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vc-color-content-muted, #5b5343);
}

.text-mono {
  font-family: var(--vc-font-mono, monospace);
}

.text-strong {
  font-weight: 600;
}
```

---

## Font family contract — serif / sans / mono

The wireframe inherits the DESIGN.md's font stack:

```css
.wf-root {
  font-family: var(--vc-font-body, system-ui, sans-serif);
}
```

The DESIGN.md may define:

| Token | Use for |
|---|---|
| `--vc-font-display` | Hero headlines, brand-y h1s |
| `--vc-font-body` | All body text |
| `--vc-font-mono` | Code, IDs, file paths |

A common stack (the Anthropic-Claude trio):

```css
:root {
  --vc-font-display: ui-serif, Georgia, "Times New Roman", serif;
  --vc-font-body: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --vc-font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}
```

For wireframes, the EXACT font matters less than the FAMILY (serif
vs sans vs mono). At wireframe fidelity, the type shape is the
signal — readers feel "this is a serif page" vs "this is a sans
page".

---

## Line length (measure) — 65-75 characters

The `wf-archetype--web` caps `wf-main` at `--wf-measure: 72ch` —
a readability sweet spot.

| Width (in `ch`) | Where to use |
|---|---|
| 45-65 ch | Mobile body text (narrower for tap-target rhythm) |
| 65-75 ch | Desktop body text (the canonical measure) |
| 75-90 ch | Code blocks (wider tolerance for long lines) |
| 100+ ch | Dashboards / tables (data, not prose) |

### Why 72ch?

- A `ch` is the width of the "0" character in the current font.
- 72 chars per line averages ~10-12 words.
- Reading research: 10-12 words per line is optimal for sustained
  reading (faster scanning, less eye fatigue).
- Long-form articles → 65ch; technical docs → 75ch; both fit
  within the 72ch default.

To override per-section:

```html
<main class="wf-main" style="--wf-measure: 90ch;">
  <!-- wider column for code-heavy content -->
</main>
```

---

## Letter spacing for tracked uppercase

UPPERCASE TEXT needs LETTER SPACING (tracking) to stay readable.
Letters that are normally close in lowercase become cramped in
uppercase.

| Style | Letter spacing |
|---|---|
| body text (lowercase) | normal (0) |
| TRACKED LABEL (UPPERCASE, 12px) | 0.08-0.12em |
| TRACKED HEADING (UPPERCASE, 24px+) | 0.05em |
| Display heading (mixed case, large) | -0.02em (negative for visual tightness) |

```css
.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: var(--vc-text-0, 12px);
  font-family: var(--vc-font-mono, monospace);
}

.hero-headline {
  font-size: clamp(48px, 7.2vw, 96px);
  letter-spacing: -0.02em;
  line-height: 1.05;
}
```

The mono font often suits the eyebrow — gives the uppercase label
a technical / category feel.

---

## Numerals — tabular vs proportional

By default, fonts use PROPORTIONAL numerals — each digit gets the
width it visually needs. "1" is narrower than "8".

For data tables, KPI cards, anywhere numbers stack vertically, use
TABULAR numerals — every digit gets the same width, so numbers
align visually:

```css
.kpi-number {
  font-variant-numeric: tabular-nums;
  font-size: 32px;
  font-weight: 600;
}
```

Without tabular-nums, a column of:
```
$1,234.56
$987.65
$12,345.67
```
has misaligned decimal points. With tabular-nums:
```
$ 1,234.56
$   987.65
$12,345.67
```
The decimal points line up.

Apply to:
- Currency in tables / lists
- KPI numbers
- Time displays (12:34:56)
- Page numbers
- Vote counts

Don't apply to:
- Body prose (proportional reads more natural)
- Display headlines

---

## Common spacing + type bugs

### Bug 1: tight cards next to breathy cards

Two cards on the same page; one has `padding: 8px`, the other
`padding: 24px`. Looks inconsistent.

**Fix**: Pick ONE padding for ALL cards on the page (typically
`--vc-space-3` or `--vc-space-4`).

### Bug 2: heading too close to following body

```html
<h2>Section title</h2>
<p>Body...</p>
```

No vertical space. Body text fights the heading.

**Fix**: Add explicit `margin-block-start` to the body, or rely
on the parent's `gap`:

```html
<section style="display:flex; flex-direction:column;
                gap:var(--vc-space-2, 12px);">
  <h2>Section title</h2>
  <p>Body...</p>
</section>
```

### Bug 3: oversized buttons next to underwhelming buttons

A page with `<button style="padding:8px;">` next to `<button
style="padding:20px;">`. Visual hierarchy unclear.

**Fix**: Pick ONE button size per page; differentiate by primary
vs ghost VARIANT, not by SIZE.

### Bug 4: heading hierarchy skipped

```html
<h1>Page</h1>
<h3>Section</h3>     <!-- skipped h2! -->
```

Screen readers report the broken hierarchy as a navigation issue.

**Fix**:

```html
<h1>Page</h1>
<h2>Section</h2>
<h3>Sub-section</h3>
```

### Bug 5: line length too wide on big screens

```css
.text { max-width: none; }     /* spans the full 1920px viewport */
```

Reading 200ch wide lines is painful.

**Fix**:

```css
.text {
  max-width: var(--wf-measure, 72ch);
  margin-inline: auto;
}
```
