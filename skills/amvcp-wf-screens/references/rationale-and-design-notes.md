# Rationale & design notes — why the kit is shaped this way

## Table of Contents

- [The "prototype + rationale + open questions" three-panel shape](#the-prototype--rationale--open-questions-three-panel-shape)
- [Inline design notes (the eyebrow panel)](#inline-design-notes-the-eyebrow-panel)
- [Before/after comparison (two states side-by-side)](#beforeafter-comparison-two-states-side-by-side)
- [Decision-card pattern (option A vs B vs C)](#decision-card-pattern-option-a-vs-b-vs-c)
- [Pros / cons table per option](#pros--cons-table-per-option)
- [Tradeoff matrix (cost × benefit per choice)](#tradeoff-matrix-cost--benefit-per-choice)
- [Open-questions panel — formal review questions](#open-questions-panel--formal-review-questions)
- [Risk register (per-screen risks + mitigations)](#risk-register-per-screen-risks--mitigations)
- [Source / inspiration provenance](#source--inspiration-provenance)
- [Reviewer worksheet](#reviewer-worksheet)

A wireframe deliverable becomes a CONVERSATION when it includes
WHY. Each design choice can be explained inline with rationale
panels, open-questions lists, before/after comparisons. This file
covers the patterns for shipping a wireframe THAT ARGUES FOR ITSELF.

## Table of contents

- [The "prototype + rationale + open questions" three-panel shape](#the-prototype--rationale--open-questions-three-panel-shape)
- [Inline design notes (the eyebrow panel)](#inline-design-notes-the-eyebrow-panel)
- [Before/after comparison (two states side-by-side)](#beforeafter-comparison-two-states-side-by-side)
- [Decision-card pattern (option A vs B vs C)](#decision-card-pattern-option-a-vs-b-vs-c)
- [Pros / cons table per option](#pros--cons-table-per-option)
- [Tradeoff matrix (cost × benefit per choice)](#tradeoff-matrix-cost--benefit-per-choice)
- [Open-questions panel — formal review questions](#open-questions-panel--formal-review-questions)
- [Risk register (per-screen risks + mitigations)](#risk-register-per-screen-risks--mitigations)
- [Source / inspiration provenance](#source--inspiration-provenance)
- [Reviewer worksheet](#reviewer-worksheet)

---

## The "prototype + rationale + open questions" three-panel shape

The canonical shape for a wireframe deliverable that ARGUES for
itself:

```html
<main class="wf-main">

  <!-- Panel 1: the prototype itself -->
  <section class="wf-card">
    <header class="wf-card__title">
      <span class="wf-text" data-wf-lines="1">Prototype</span>
    </header>
    <div class="wf-root" data-wf-root data-wf-fidelity="wireframe">
      <!-- the actual wireframe -->
    </div>
  </section>

  <!-- Panel 2: what you're feeling (the rationale) -->
  <section class="wf-card"
           style="border-left:3px solid var(--vc-color-info);">
    <header class="wf-card__title">
      <span class="wf-text" data-wf-lines="1"
            style="color:var(--vc-color-info);">
        WHAT YOU'RE FEELING
      </span>
    </header>

    <ul style="display:flex; flex-direction:column; gap:12px;
               padding-left:20px;">
      <li>
        <strong>Drop indicator snaps to the nearest gap, not raw
        cursor Y</strong> — feels more decisive than the cursor
        sliding around between rows.
      </li>
      <li>
        <strong>Dragged ghost stays at 35% opacity with a 2° tilt</strong>
        — communicates "this thing is in motion" without becoming a
        full ghost icon.
      </li>
      <li>
        <strong>Drop zone gets a 2px clay line, not a full
        highlight</strong> — keeps the visual focus on WHERE the
        drop will land, not on the destination's surrounding
        context.
      </li>
    </ul>
  </section>

  <!-- Panel 3: open questions (the asks) -->
  <section class="wf-card"
           style="border-left:3px solid var(--vc-color-warning);">
    <header class="wf-card__title">
      <span class="wf-text" data-wf-lines="1"
            style="color:var(--vc-color-warning);">
        OPEN QUESTIONS
      </span>
    </header>

    <ol style="display:flex; flex-direction:column; gap:12px;
               padding-left:20px;">
      <li>
        Should we support undo for the LAST drop only, or a full
        undo stack? Trade-off: simplicity vs power.
      </li>
      <li>
        Touch + mouse drag: ship both at v1 or stage touch later?
      </li>
      <li>
        What's the expected behavior when the user drags onto a
        DELETE zone — confirm modal, or instant?
      </li>
    </ol>
  </section>

</main>
```

### Why this shape

- **The prototype** answers WHAT the design is.
- **What you're feeling** answers WHY it's like that — preempts
  reviewer questions.
- **Open questions** answers what you ALREADY know is uncertain —
  forces deliberate decisions instead of accidental defaults.

This is a PROFESSIONAL shape. Don't ship a prototype that just
EXISTS; ship one that ARGUES FOR ITSELF and pre-empts review
feedback.

---

## Inline design notes (the eyebrow panel)

For inline rationale within a screen, use small annotation panels
positioned alongside the relevant element.

```html
<div style="display:grid; grid-template-columns:2fr 1fr; gap:16px;
            align-items:start;">

  <!-- the wireframe element -->
  <article class="wf-card">
    <header class="wf-card__title">
      <span class="wf-text" data-wf-lines="1">Filter sidebar</span>
    </header>
    <!-- filter controls -->
  </article>

  <!-- the inline note -->
  <aside style="background:var(--vc-color-surface-sunken);
                border-left:3px solid var(--vc-color-info);
                padding:12px 16px;
                font-size:12px;
                color:var(--vc-color-content-muted);">
    <strong style="color:var(--vc-color-info);">NOTE</strong>
    <p style="margin-top:4px;">Filters are PERSISTED in
    localStorage so the user's last selection survives a reload.
    Reset link is at the bottom of the panel.</p>
  </aside>

</div>
```

### Notes

- Use semantic color borders (`info` blue, `warning` amber,
  `success` green) to mark the note's type.
- Small font (12px) — doesn't compete with the main UI.
- Header is the note TYPE in colored text.
- Body is the explanation.

For a STACKED layout (note below the element, on narrow viewports):

```html
<article class="wf-card">…</article>
<aside style="background:var(--vc-color-surface-sunken);
              border-left:3px solid var(--vc-color-info);
              padding:8px 12px;
              font-size:12px;
              margin-top:8px;">
  …
</aside>
```

---

## Before/after comparison (two states side-by-side)

For redesigns: show the CURRENT state and the PROPOSED state
side-by-side.

```html
<div style="display:grid; grid-template-columns:1fr 1fr;
            gap:32px;">

  <figure>
    <figcaption style="font-size:12px;
                       color:var(--vc-color-content-subtle);
                       text-transform:uppercase;
                       margin-bottom:8px;">BEFORE</figcaption>
    <div class="wf-root" data-wf-root data-wf-fidelity="hi"
         style="opacity:0.6;">
      <!-- the current design -->
    </div>
  </figure>

  <figure>
    <figcaption style="font-size:12px;
                       color:var(--vc-color-accent);
                       text-transform:uppercase;
                       font-weight:600;
                       margin-bottom:8px;">AFTER</figcaption>
    <div class="wf-root" data-wf-root data-wf-fidelity="hi">
      <!-- the proposed design -->
    </div>
  </figure>

</div>
```

### Notes

- BEFORE is rendered at `opacity: 0.6` — visually "this is the
  past".
- AFTER is at full opacity + accent-tinted caption — "this is
  what's new".
- Both wireframes at the SAME fidelity (usually hi) — the
  comparison is about LAYOUT and BEHAVIOR, not styling level.

For a TRIPLE comparison (current / option A / option B):

```html
<div style="display:grid; grid-template-columns:1fr 1fr 1fr;
            gap:24px;">
  <figure>CURRENT</figure>
  <figure>OPTION A</figure>
  <figure>OPTION B</figure>
</div>
```

---

## Decision-card pattern (option A vs B vs C)

For design decisions where multiple options are viable, show each
option as a card with its title + preview + pros/cons.

```html
<h2 class="wf-text" data-wf-lines="1"
    style="font-size:24px;">Three options for the empty state</h2>

<div style="display:grid; grid-template-columns:repeat(3, 1fr);
            gap:16px;">

  <article class="wf-card">
    <header style="display:flex; gap:8px; align-items:baseline;">
      <span class="wf-chip"
            style="background:var(--vc-color-content);
                   color:var(--vc-color-canvas);">A</span>
      <h3 class="wf-text" data-wf-lines="1">Minimal</h3>
    </header>

    <figure class="wf-image" style="min-height:180px;"></figure>

    <p class="wf-text" data-wf-lines="2"
       style="font-size:12px;
              color:var(--vc-color-content-muted);"></p>

    <hr class="wf-divider">

    <div style="font-size:12px;">
      <strong style="color:var(--vc-color-success);">PRO</strong>
      <span> Fast to ship.</span>
    </div>
    <div style="font-size:12px;">
      <strong style="color:var(--vc-color-danger);">CON</strong>
      <span> Doesn't teach the user.</span>
    </div>
  </article>

  <article class="wf-card">
    <header style="display:flex; gap:8px; align-items:baseline;">
      <span class="wf-chip"
            style="background:var(--vc-color-content);
                   color:var(--vc-color-canvas);">B</span>
      <h3 class="wf-text" data-wf-lines="1">Illustrated</h3>
    </header>

    <figure class="wf-image" style="min-height:180px;"></figure>

    <p class="wf-text" data-wf-lines="2"></p>

    <hr class="wf-divider">

    <div style="font-size:12px;">
      <strong style="color:var(--vc-color-success);">PRO</strong>
      <span> Friendly, memorable.</span>
    </div>
    <div style="font-size:12px;">
      <strong style="color:var(--vc-color-danger);">CON</strong>
      <span> Needs custom illustration work.</span>
    </div>
  </article>

  <article class="wf-card"
           style="border:2px solid var(--vc-color-accent);">
    <header style="display:flex; gap:8px; align-items:baseline;">
      <span class="wf-chip"
            style="background:var(--vc-color-content);
                   color:var(--vc-color-canvas);">C</span>
      <h3 class="wf-text" data-wf-lines="1">Instructional</h3>
      <span class="wf-chip"
            style="background:var(--vc-color-accent);
                   color:var(--vc-color-on-accent);
                   margin-left:auto;">RECOMMENDED</span>
    </header>

    <figure class="wf-image" style="min-height:180px;"></figure>

    <p class="wf-text" data-wf-lines="2"></p>

    <hr class="wf-divider">

    <div style="font-size:12px;">
      <strong style="color:var(--vc-color-success);">PRO</strong>
      <span> Teaches and converts in one step.</span>
    </div>
    <div style="font-size:12px;">
      <strong style="color:var(--vc-color-danger);">CON</strong>
      <span> More copy to write.</span>
    </div>
  </article>

</div>
```

### Notes

- Each option has: letter chip + name + preview image + description
  + pro/con.
- The RECOMMENDED option has an accent outline + RECOMMENDED chip
  in the header.
- For 2 options, use `grid-template-columns: 1fr 1fr`. For 4,
  `repeat(4, 1fr)`.

---

## Pros / cons table per option

For more detailed pros/cons, use a table inside each option:

```html
<article class="wf-card">
  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1">Option A: Modal-based</span>
  </header>

  <table style="width:100%; border-collapse:collapse; font-size:12px;">
    <thead>
      <tr style="border-bottom:1px solid var(--vc-color-border);">
        <th style="text-align:left; padding:8px;
                   color:var(--vc-color-success);">PROS</th>
        <th style="text-align:left; padding:8px;
                   color:var(--vc-color-danger);">CONS</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid var(--vc-color-border);">
        <td style="padding:8px;">Doesn't navigate away</td>
        <td style="padding:8px;">Mobile keyboard overlaps</td>
      </tr>
      <tr style="border-bottom:1px solid var(--vc-color-border);">
        <td style="padding:8px;">Easier to cancel</td>
        <td style="padding:8px;">Limited screen space</td>
      </tr>
      <tr>
        <td style="padding:8px;">Reuse modal infrastructure</td>
        <td style="padding:8px;">Harder to deep-link to</td>
      </tr>
    </tbody>
  </table>
</article>
```

---

## Tradeoff matrix (cost × benefit per choice)

For multi-criteria decisions, a matrix:

```html
<article class="wf-card" style="padding:0;">
  <table style="width:100%; border-collapse:collapse;">

    <thead>
      <tr style="background:var(--vc-color-surface-sunken);">
        <th style="padding:12px; text-align:left;">Option</th>
        <th style="padding:12px;">Eng cost</th>
        <th style="padding:12px;">UX value</th>
        <th style="padding:12px;">Time to ship</th>
        <th style="padding:12px;">Risk</th>
      </tr>
    </thead>

    <tbody>
      <tr style="border-bottom:1px solid var(--vc-color-border);">
        <td style="padding:12px;">A. Modal</td>
        <td style="padding:12px; text-align:center;">
          <span class="wf-chip"
                style="background:var(--vc-color-success);
                       color:var(--vc-color-on-accent);">LOW</span>
        </td>
        <td style="padding:12px; text-align:center;">
          <span class="wf-chip"
                style="background:var(--vc-color-warning);
                       color:var(--vc-color-on-accent);">MED</span>
        </td>
        <td style="padding:12px; text-align:center;">2 days</td>
        <td style="padding:12px; text-align:center;">
          <span class="wf-chip"
                style="background:var(--vc-color-success);
                       color:var(--vc-color-on-accent);">LOW</span>
        </td>
      </tr>

      <tr style="border-bottom:1px solid var(--vc-color-border);">
        <td style="padding:12px;">B. Full page</td>
        <td style="padding:12px; text-align:center;">
          <span class="wf-chip"
                style="background:var(--vc-color-warning);
                       color:var(--vc-color-on-accent);">MED</span>
        </td>
        <td style="padding:12px; text-align:center;">
          <span class="wf-chip"
                style="background:var(--vc-color-success);
                       color:var(--vc-color-on-accent);">HIGH</span>
        </td>
        <td style="padding:12px; text-align:center;">5 days</td>
        <td style="padding:12px; text-align:center;">
          <span class="wf-chip"
                style="background:var(--vc-color-warning);
                       color:var(--vc-color-on-accent);">MED</span>
        </td>
      </tr>

      <tr>
        <td style="padding:12px;">C. Inline expand</td>
        <td style="padding:12px; text-align:center;">
          <span class="wf-chip"
                style="background:var(--vc-color-danger);
                       color:var(--vc-color-on-accent);">HIGH</span>
        </td>
        <td style="padding:12px; text-align:center;">
          <span class="wf-chip"
                style="background:var(--vc-color-success);
                       color:var(--vc-color-on-accent);">HIGH</span>
        </td>
        <td style="padding:12px; text-align:center;">12 days</td>
        <td style="padding:12px; text-align:center;">
          <span class="wf-chip"
                style="background:var(--vc-color-danger);
                       color:var(--vc-color-on-accent);">HIGH</span>
        </td>
      </tr>

    </tbody>
  </table>
</article>
```

### Notes

- LOW/MED/HIGH chips with semantic colors (green/amber/red).
- Time-to-ship is a CONCRETE number, not a chip.
- For risk, HIGH should usually scare you off; MED is the
  "interesting middle ground".

---

## Open-questions panel — formal review questions

Already shown above; recap:

```html
<aside style="background:var(--vc-color-surface-sunken);
              border:1px solid var(--vc-color-border);
              border-radius:8px;
              padding:16px;
              margin-top:48px;">

  <h3 style="font-size:14px;
             text-transform:uppercase;
             letter-spacing:0.05em;
             color:var(--vc-color-content-muted);">
    OPEN QUESTIONS FOR REVIEW
  </h3>

  <ol style="display:flex; flex-direction:column; gap:8px;
             margin-top:8px;
             padding-left:20px;">
    <li class="wf-text" data-wf-lines="1">Question 1?</li>
    <li class="wf-text" data-wf-lines="1">Question 2?</li>
    <li class="wf-text" data-wf-lines="1">Question 3?</li>
  </ol>

</aside>
```

Questions should be SPECIFIC and ANSWERABLE — not "what do you
think?" but "should the Cancel button be on the left or right?"

---

## Risk register (per-screen risks + mitigations)

For wireframes representing significant work, include a risk
register:

```html
<article class="wf-card">
  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1">Risks</span>
  </header>

  <table style="width:100%; border-collapse:collapse; font-size:14px;">
    <thead>
      <tr style="border-bottom:1px solid var(--vc-color-border);">
        <th style="text-align:left; padding:8px;">Risk</th>
        <th style="text-align:left; padding:8px;">Likelihood</th>
        <th style="text-align:left; padding:8px;">Impact</th>
        <th style="text-align:left; padding:8px;">Mitigation</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom:1px solid var(--vc-color-border);">
        <td style="padding:8px;">User can't find filter</td>
        <td style="padding:8px;"><span class="wf-chip">MED</span></td>
        <td style="padding:8px;"><span class="wf-chip"
              style="background:var(--vc-color-warning);
                     color:var(--vc-color-on-accent);">MED</span></td>
        <td style="padding:8px;">Onboarding tooltip on first visit.</td>
      </tr>
      <tr>
        <td style="padding:8px;">Composer overflows on mobile</td>
        <td style="padding:8px;"><span class="wf-chip"
              style="background:var(--vc-color-danger);
                     color:var(--vc-color-on-accent);">HIGH</span></td>
        <td style="padding:8px;"><span class="wf-chip"
              style="background:var(--vc-color-danger);
                     color:var(--vc-color-on-accent);">HIGH</span></td>
        <td style="padding:8px;">Test on iPhone SE before merging.</td>
      </tr>
    </tbody>
  </table>
</article>
```

---

## Source / inspiration provenance

Cite the sources for design decisions — competitive analysis,
research, internal pattern references.

```html
<aside style="background:var(--vc-color-surface-sunken);
              padding:12px 16px;
              margin-top:16px;
              font-size:12px;
              color:var(--vc-color-content-subtle);">
  <strong>Sources:</strong>
  Linear's inbox UI · GitHub's PR review threads ·
  Internal pattern in <code>amvcp-tables</code>
</aside>
```

For full bibliographies, use a list:

```html
<aside style="background:var(--vc-color-surface-sunken);
              padding:16px;
              margin-top:24px;">
  <h4 style="font-size:14px;
             text-transform:uppercase;
             color:var(--vc-color-content-muted);">SOURCES</h4>
  <ul style="font-size:12px;
             color:var(--vc-color-content-subtle);
             padding-left:20px;
             margin-top:8px;">
    <li>Linear inbox UI — <a href="https://linear.app">linear.app</a></li>
    <li>GitHub PR review threads</li>
    <li>Internal `amvcp-tables` skill (rows-as-atoms model)</li>
    <li>WCAG AA contrast guidance — section 1.4.3</li>
  </ul>
</aside>
```

---

## Reviewer worksheet

At the END of a wireframe deliverable, include a small worksheet
that prompts the reviewer for structured feedback.

```html
<article class="wf-card" style="background:var(--vc-color-surface-sunken);
                                  border:1px dashed var(--vc-color-border);">

  <header class="wf-card__title">
    <span class="wf-text" data-wf-lines="1">Reviewer worksheet</span>
  </header>

  <p class="wf-text" data-wf-lines="1"
     style="font-size:12px;
            color:var(--vc-color-content-muted);">
    Use the comment threads on each atom for in-context feedback.
    Use this worksheet for global / summary feedback.
  </p>

  <label class="wf-label">Overall: green-light, red-light, or revise?</label>
  <select class="wf-input">
    <option>— pick one —</option>
    <option>🟢 Green-light — ship as designed</option>
    <option>🟡 Revise — small changes needed</option>
    <option>🔴 Red-light — fundamental rethink needed</option>
  </select>

  <label class="wf-label">Top 3 concerns</label>
  <textarea class="wf-input" style="min-height:120px;"
            placeholder="1. …&#10;2. …&#10;3. …"></textarea>

  <label class="wf-label">Anything missing?</label>
  <textarea class="wf-input" style="min-height:60px;"
            placeholder="What flow / state / edge case wasn't addressed?"></textarea>

  <footer class="wf-card__actions">
    <button class="wf-button">Submit review</button>
  </footer>

</article>
```

### Notes

- Dashed border + sunken background — visually "this is meta, not
  part of the design".
- 3 fields: overall verdict (3-option select), specific concerns
  (textarea), missing items (textarea).
- Submit button — in production, sends the worksheet to the
  designer.

This worksheet is the SYNCHRONOUS summary; the comment threads on
individual atoms are the ASYNCHRONOUS details. Together they give
the designer everything needed for the next iteration.
