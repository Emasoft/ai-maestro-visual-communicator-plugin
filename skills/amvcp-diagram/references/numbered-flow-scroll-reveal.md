# Numbered flow with scroll-reveal

A vertical numbered flow whose connecting line draws on as the
reader scrolls. Lifted from DG-15 in the visualizing-triage
backlog. Each step is a card with a numeric badge; an
`IntersectionObserver` widens or draws the connecting line as the
step enters the viewport.

## When to choose this pattern

Use a numbered flow when:

- You have **5-15 steps** of a process described in detail (more
  than the step-strip can hold).
- The reader will scroll through them top-to-bottom — they read
  one step at a time.
- The diagram is part of a **long document** (a tutorial, a
  walkthrough, a release plan) where pacing matters.

Do NOT use a numbered flow when:

- The steps are 1-3 lines each (use `step-strip-pattern.md`).
- The flow has branching (use `process-flow-preset.md`).
- The reader will see the diagram in one viewport without
  scrolling (use the step strip).

## Scaffold

```html
<div class="ve-numbered-flow" data-ve-block="numbered-flow"
     data-ve-reveal="scroll">
  <ol>
    <li class="ve-flow-step" data-ve-id="vc-step-01" style="--ve-step:1">
      <div class="ve-flow-step__num">01</div>
      <div class="ve-flow-step__title">Branch &amp; PR</div>
      <div class="ve-flow-step__body">
        Open a PR off main with a description that includes the
        TRDD UUID.  Tag reviewers.
      </div>
    </li>
    <li class="ve-flow-step" data-ve-id="vc-step-02" style="--ve-step:2">
      <div class="ve-flow-step__num">02</div>
      <div class="ve-flow-step__title">CI gates</div>
      <div class="ve-flow-step__body">
        Tests + lint + type-check pass on every commit; failed
        runs block merge.
      </div>
    </li>
    <!-- ... -->
  </ol>
</div>
```

The CSS:

```css
.ve-numbered-flow ol {
  list-style: none;
  padding: 0;
  margin: 0;
  position: relative;
}
.ve-flow-step {
  display: grid;
  grid-template-columns: 48px 1fr;
  column-gap: 20px;
  row-gap: 4px;
  padding: 24px 0;
  position: relative;
}
.ve-flow-step__num {
  grid-row: 1 / -1;
  align-self: start;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--vc-color-accent);
  color: var(--vc-color-on-accent);
  font: var(--vc-weight-bold) var(--vc-text-2) / 40px var(--vc-font-mono);
  text-align: center;
  z-index: 2;
}
.ve-flow-step__title {
  font: var(--vc-weight-medium) var(--vc-text-2) / 1.2 var(--vc-font-body);
  color: var(--vc-color-content);
}
.ve-flow-step__body {
  font: var(--vc-text-1) / 1.5 var(--vc-font-body);
  color: var(--vc-color-content-muted);
}
/* the connecting line — a vertical strip behind the numbers */
.ve-flow-step::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 64px;
  bottom: -24px;
  width: 0;             /* widens on reveal */
  border-left: 0 solid var(--vc-color-border-strong);
  transition: width var(--vc-duration-slow) var(--vc-easing-decel),
              border-left-width var(--vc-duration-slow) var(--vc-easing-decel);
}
.ve-flow-step:last-child::before { display: none; }
.ve-flow-step.is-revealed::before {
  border-left-width: 2px;
}
```

The JS:

```js
function armNumberedFlow(root) {
  if (!('IntersectionObserver' in window)) {
    // Fail safe — show everything if the API is missing.
    Array.from(root.querySelectorAll('.ve-flow-step'))
      .forEach(function (el) { el.classList.add('is-revealed'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) {
        entries[i].target.classList.add('is-revealed');
        io.unobserve(entries[i].target);
      }
    }
  }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });
  Array.from(root.querySelectorAll('.ve-flow-step'))
    .forEach(function (el) { io.observe(el); });
}
```

`threshold: 0.4` means a step is "revealed" when 40% of it is in
the viewport — past the threshold, the line connecting it to the
NEXT step draws on. `rootMargin: '0px 0px -10% 0px'` shaves 10%
off the bottom so the reveal fires just before a step would fall
off the bottom edge of the viewport (more natural cadence).

## Accessibility gate

Wrap the transition in a `prefers-reduced-motion` guard:

```css
@media (prefers-reduced-motion: reduce) {
  .ve-flow-step::before {
    transition: none;
    border-left-width: 2px;          /* draw immediately, no animation */
  }
}
```

Under reduce, the connecting line is fully drawn from the start —
the reader sees the same diagram, just without the draw-on motion.

## Hot-step modifier

The catalog's #4 trick (mark the trust boundary or hot path):
add a `.hot` modifier to one step. The hot step's number badge
gets the accent tint at full saturation; other badges stay at the
neutral accent:

```css
.ve-flow-step.hot .ve-flow-step__num {
  background: var(--vc-color-danger);
  color: var(--vc-color-on-accent);
}
```

Use sparingly — one hot step per flow. The "look here" loses
power if you tint three.

## DESIGN.md tokens consumed

| Group | Tokens |
|---|---|
| color | `--vc-color-accent`, `--vc-color-on-accent`, `--vc-color-border-strong`, `--vc-color-content`, `--vc-color-content-muted`, `--vc-color-danger` (hot step) |
| typography | `--vc-font-body`, `--vc-font-mono`, `--vc-weight-medium`, `--vc-weight-bold`, `--vc-text-1`, `--vc-text-2` |
| motion | `--vc-duration-slow`, `--vc-easing-decel` (the draw-on transition) |

## Selection atoms

Each `<li class="ve-flow-step">` carries `data-ve-id`. Click
data:

```json
{ "kind": "step", "index": 1, "title": "Branch & PR",
  "body": "Open a PR off main with..." }
```

The agent can act on a per-step basis (open the related file,
expand the description, attach a comment thread).

## Variations

### With code snippets per step

Many tutorial flows benefit from a code panel per step:

```html
<li class="ve-flow-step">
  <div class="ve-flow-step__num">01</div>
  <div class="ve-flow-step__title">Install</div>
  <div class="ve-flow-step__body">
    Add the dependency to your project.
    <pre class="ve-code-block"><code>npm install foo</code></pre>
  </div>
</li>
```

The `ve-code-block` is themed by the `code-highlight` skill.
Don't try to wire syntax highlighting in this skill — pass
through.

### With sub-steps (collapsible)

Use `<details>` for sub-steps:

```html
<li class="ve-flow-step">
  <div class="ve-flow-step__num">02</div>
  <div class="ve-flow-step__title">CI gates</div>
  <div class="ve-flow-step__body">
    Tests + lint + type-check pass on every commit.
    <details>
      <summary>What each gate checks</summary>
      <ul>
        <li>Tests — Jest under <code>tests/</code>.</li>
        <li>Lint — eslint --quiet, zero warnings.</li>
        <li>Type-check — npx tsc --noEmit.</li>
      </ul>
    </details>
  </div>
</li>
```

A `<details>` that opens on click is no-JS, accessible, and
participates in the reveal naturally (its open state survives
the reveal transition).

## Anti-patterns

- 20+ steps: the page becomes a tape. Either consolidate or split
  into multiple flows (one per phase, with the phase as a
  heading).
- Bodies that are 8 paragraphs each: the flow becomes invisible
  between giant text blocks. Move body content to a sidebar
  detail panel (per `click-step-detail-panel.md`).
- Lines that don't actually draw (broken `IntersectionObserver`
  wiring): the reader sees disconnected badges. Always test in
  dev-browser with scroll.
- Inconsistent badge styles between steps (one circular, one
  square, one hexagonal): noise. Pick one shape.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md`: dev-browser
screenshot light + dark, then SCROLL and capture again to verify
the draw-on reveal fires correctly. The most common bug is the
reveal firing once for the WHOLE flow on initial load (because
all steps are above the fold) — verify by scrolling past a step
and checking its line is drawn AFTER the scroll, not before.
