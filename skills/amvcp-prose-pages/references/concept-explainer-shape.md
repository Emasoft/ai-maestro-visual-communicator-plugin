# Concept-explainer shape — interactive demo + comparison + glossary

## Table of Contents

- [When to choose this shape](#when-to-choose-this-shape)
- [Section order (fixed)](#section-order-fixed)
- [Layout — main column + sticky right glossary](#layout--main-column--sticky-right-glossary)
- [Markdown scaffold](#markdown-scaffold)
- [The interactive demo — slider → recompute → re-render](#the-interactive-demo--slider--recompute--re-render)
- [The hover-linked glossary](#the-hover-linked-glossary)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition with other skills](#composition-with-other-skills)
- [Lib functions called](#lib-functions-called)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The document that teaches a *single concept* (algorithm, data
structure, design pattern) interactively. Canonical reference:
`html-effectiveness` demo #15, "research-concept-explainer" — teaches
consistent hashing with a live SVG ring the user can manipulate.

This is the *highest-leverage* document shape for teaching content: a
live demo where the learner can perturb the parameters and immediately
see both the visual change and the numerical consequence. Static
diagrams of the same content educate a fraction as well; the same
words next to a static figure produce shallow understanding.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| You are teaching ONE algorithm / data structure / pattern | Multi-feature subsystem → `architecture-explainer-shape` |
| The reader can manipulate parameters and see results | No interactive demo possible → `feature-explainer-shape` |
| There are known alternatives to compare against | No comparison needed → `architecture-explainer-shape` |
| You have ≥5 specialized terms a glossary helps with | No new vocabulary → omit the glossary |
| The reader will use the demo more than they read the prose | The prose carries the teaching → `architecture-explainer-shape` |

## Section order (fixed)

```
1. HERO + ONE-LINE FRAMING       — h1 + the question this concept answers
2. CONCEPT SETUP                  — prose: the constraint, the goal, the naive baseline
3. INTERACTIVE DEMO              — sliders + buttons + live SVG (the heart)
4. NUMERIC READOUT               — "N items moved on last change · X% of total"
5. COMPARISON TABLE              — this approach vs alternatives (.good / .bad cells)
6. WHERE YOU'LL MEET IT          — 3-5 places in the codebase / industry this appears
7. STICKY GLOSSARY               — hover-linked terms, right sidebar
```

## Layout — main column + sticky right glossary

```css
.vc-doc--concept {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: var(--vc-space-6, 48px);
  max-width: 1100px;
}
@media (max-width: 920px) {
  .vc-doc--concept { grid-template-columns: 1fr; }
  .vc-doc--concept .vc-glossary { position: static; max-height: none; }
}
.vc-doc--concept .vc-glossary {
  position: sticky;
  top: var(--vc-space-5, 32px);
  align-self: start;
  max-height: calc(100dvh - 64px);
  overflow-y: auto;
  font-size: var(--vc-text-1, 14px);
}
```

## Markdown scaffold

```html
<article class="vc-doc vc-doc--concept" data-ve-prose>

<main class="vc-main">
  <header class="vc-doc-header">
    <p class="vc-type-overline">Concept · consistent hashing</p>
    <h1>How consistent hashing keeps caches stable as nodes change</h1>
    <p class="vc-doc-subtitle">A learnable demo. Move a slider; watch
       which keys re-home.</p>
  </header>

  <!-- 2. Concept setup -->
  <section id="setup">
    <h2>The problem</h2>
    <p>When N caches share a workload using <code>hash(key) % N</code>,
       adding or removing a single node re-assigns roughly <strong>all
       keys</strong>. For an in-memory cache this means a cold-start
       stampede on the backing store…</p>
    <p>Consistent hashing limits the damage. When a node is added or
       removed, only the keys "near" that node re-home — usually
       1/N of the total.</p>
  </section>

  <!-- 3. Interactive demo (the heart) -->
  <section id="demo">
    <h2>Try it</h2>
    <div class="vc-demo">
      <div class="vc-demo-controls">
        <label>
          Nodes <input type="range" id="nodes" min="2" max="8" value="4">
          <span class="vc-num" id="nodes-out">4</span>
        </label>
        <label>
          Keys  <input type="range" id="keys" min="10" max="60" value="32">
          <span class="vc-num" id="keys-out">32</span>
        </label>
        <button data-vc-action="add">Add node</button>
        <button data-vc-action="remove">Remove node</button>
      </div>

      <svg class="vc-demo-stage" viewBox="0 0 400 400"
           role="img" aria-label="Consistent hashing ring with N nodes and K keys">
        <!-- 4 colored arcs for each node's segment; key dots positioned around -->
      </svg>

      <!-- 4. Numeric readout -->
      <p class="vc-demo-readout">
        <strong id="readout-nodes">4</strong> nodes ·
        <strong id="readout-keys">32</strong> keys ·
        <strong id="readout-moved">6 (19%)</strong> moved on last change
      </p>
    </div>
  </section>

  <!-- 5. Comparison table -->
  <section id="comparison">
    <h2>vs. naive <code>hash % N</code></h2>
    <table>
      <thead>
        <tr><th>Property</th><th><code>hash % N</code></th><th>Consistent hashing</th></tr>
      </thead>
      <tbody>
        <tr><td>Keys re-homed when N→N+1</td>
            <td class="vc-cmp-bad">~100%</td>
            <td class="vc-cmp-good">~1/N (5-25%)</td></tr>
        <tr><td>Lookup cost</td>
            <td class="vc-cmp-good">O(1)</td>
            <td class="vc-cmp-good">O(log N)</td></tr>
        <tr><td>Memory per node</td>
            <td class="vc-cmp-good">O(1)</td>
            <td class="vc-cmp-bad">O(V) — V virtual nodes</td></tr>
        <tr><td>Load balance under uneven traffic</td>
            <td class="vc-cmp-bad">poor</td>
            <td class="vc-cmp-good">good with virtual nodes</td></tr>
      </tbody>
    </table>
  </section>

  <!-- 6. Where you'll meet it -->
  <section id="in-the-wild">
    <h2>Where you'll meet it</h2>
    <ul>
      <li><span class="vc-term" data-term="dynamo-ring">DynamoDB</span> uses
        consistent hashing for partitioning.</li>
      <li><span class="vc-term" data-term="memcached-ketama">Ketama</span>
        (the original libketama) was the first public implementation
        used by memcached clients.</li>
      <li>Service meshes (<code>Envoy</code>, <code>Linkerd</code>) use
        consistent hashing for sticky routing.</li>
      <li>Our own <code>src/cache/sharded.ts</code> uses a 100-virtual-node
        ring per physical cache instance.</li>
    </ul>
  </section>
</main>

<!-- 7. Sticky glossary — hover-linked from .vc-term spans -->
<aside class="vc-glossary">
  <h3 class="vc-glossary-title">Glossary</h3>
  <dl>
    <dt data-g="virtual-node">Virtual node</dt>
    <dd>A logical node placed on the ring multiple times to even out
        the load when one physical node leaves.</dd>

    <dt data-g="dynamo-ring">Dynamo ring</dt>
    <dd>The consistent-hash ring used by Amazon's DynamoDB / the
        original Dynamo paper.</dd>

    <dt data-g="memcached-ketama">Ketama</dt>
    <dd>The first widely-used consistent-hashing implementation for
        memcached clients (Last.fm, 2007).</dd>

    <dt data-g="hot-key">Hot key</dt>
    <dd>A key whose request rate exceeds what one node can handle;
        not solved by consistent hashing alone.</dd>
  </dl>
</aside>

</article>
```

## The interactive demo — slider → recompute → re-render

The demo is *the* feature. It needs:

1. **Controls** — sliders, buttons, optional dropdowns. Plain `<input
   type="range">` is fine.
2. **A stage** — usually an inline SVG, sometimes a Canvas.
3. **A readout** — numerical, plain text, always visible. The point
   is to surface the *consequence* of the user's action numerically.

Wiring (~30 lines of JS, no library):

```js
const state = { nodes: 4, keys: 32, lastMoved: 0 };
const $nodes = document.getElementById('nodes');
const $keys  = document.getElementById('keys');

function recompute() {
  const previousOwnership = state.ownership;
  state.ownership = computeOwnership(state.nodes, state.keys);
  if (previousOwnership) {
    state.lastMoved = countDiff(previousOwnership, state.ownership);
  }
  render(state);
}

$nodes.addEventListener('input', () => {
  state.nodes = Number($nodes.value);
  recompute();
});
$keys.addEventListener('input', () => {
  state.keys = Number($keys.value);
  recompute();
});
recompute();
```

`computeOwnership`, `countDiff`, `render` are concept-specific. The
render function MUST use a smooth 300ms transition between states so
the user *sees* the change happen, not just notices the after-state.

## The hover-linked glossary

Terms in body prose are wrapped in `<span class="vc-term"
data-term="x">`; a matching `<dt data-g="x">` lives in the glossary.
Hovering the term highlights the glossary entry (and vice-versa).

```js
document.querySelectorAll('.vc-term').forEach(term => {
  const g = term.dataset.term;
  if (!g) return;
  const dt = document.querySelector('dt[data-g="' + g + '"]');
  if (!dt) return;
  term.addEventListener('mouseenter', () => {
    dt.classList.add('vc-glossary-hl');
    term.classList.add('vc-term-hl');
  });
  term.addEventListener('mouseleave', () => {
    dt.classList.remove('vc-glossary-hl');
    term.classList.remove('vc-term-hl');
  });
});
```

```css
.vc-term {
  border-bottom: 1px dotted var(--vc-color-accent, #b8861f);
  cursor: help;
}
.vc-term-hl,
.vc-glossary-hl {
  background: color-mix(in srgb, var(--vc-color-accent, #b8861f) 20%, transparent);
  border-radius: var(--vc-radius-sm, 4px);
}
```

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-accent` | Term underline, glossary highlight |
| `--vc-color-success` | `.vc-cmp-good` table cell |
| `--vc-color-danger` | `.vc-cmp-bad` table cell |
| `--vc-color-surface-sunken` | Demo stage background |
| `--vc-color-border` | Demo controls border, table border |
| `--vc-color-content-muted` | Glossary `<dd>` |
| `--vc-font-mono` | Numeric readouts (the demo numbers), code identifiers |

## Composition with other skills

| Section | Embed from |
|---|---|
| Interactive demo controls | `amvcp-interactive-controls` |
| Demo stage SVG | `amvcp-diagram` or `amvcp-graph-diagrams` |
| Demo state-change animation | `amvcp-animation` (300ms transitions) |
| Comparison table | `amvcp-tables` (`vc-cmp-good` / `vc-cmp-bad` cells) |
| Glossary `<dl>` | `amvcp-prose-pages` (this skill) |
| Hover-linked terms | `amvcp-prose-pages` (this skill) |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);
window.amvcpReportDoc.init(document);
const report = window.amvcpReportDoc.runGates(document, "concept-hashing");
```

The concept-explainer touches `prefers-reduced-motion` via the
300ms demo transitions — Gate 3 of the QA pipeline checks that you
have a `@media (prefers-reduced-motion: reduce)` block:

```css
@media (prefers-reduced-motion: reduce) {
  .vc-demo-stage *,
  .vc-glossary-hl { transition: none !important; }
}
```

## Selection / comment notes

- The demo SVG is selectable as a unit
  (`{type:"demo", concept:"consistent-hashing"}`).
- Each demo control is selectable
  (`{type:"control", controlId:"nodes"}`) so a reader can comment
  "the maximum should be 16, not 8".
- The numeric readout is selectable — readers can comment "this
  number is wrong" without highlighting it.
- Comparison-table cells are selectable per-cell
  (`{type:"table-cell", row:"Memory per node", col:"Consistent
  hashing"}`).
- Glossary terms in prose are selectable
  (`{type:"term", term:"virtual-node"}`) — useful for "this
  definition is wrong" comments.
- Glossary `<dt>` entries are selectable independently.

## Decision-mini hook

The comparison section is a natural fit for a "which option do we
pick" decision-mini:

```html
<div class="ve-decision" data-decision-id="cache-shard-pattern">
  <p>For our shard router, which pattern?</p>
  <button data-choice="modulo">hash % N (simple, full re-home on resize)</button>
  <button data-choice="consistent">Consistent hashing (1/N re-home)</button>
  <button data-choice="rendezvous">Rendezvous hashing (no virtual nodes)</button>
</div>
```

## Anti-patterns

- **A static figure where a slider belongs** — defeats the whole
  shape. If you cannot offer interaction, use
  `feature-explainer-shape` instead.
- **A demo with no numeric readout** — without the readout, the user
  has not learned the consequence quantitatively.
- **>3 sliders in the controls** — beyond 3, the user gets lost in
  the parameter space.
- **A glossary with 1-2 terms** — at that count, define inline. The
  glossary pays off at 5+ terms.
- **Hover-linked terms with no glossary entry** — every `.vc-term`
  MUST match a `<dt data-g>` or the term is broken; the runtime can
  validate this in a custom QA check.
- **Comparison cells with neither `.vc-cmp-good` nor `.vc-cmp-bad`** —
  the whole point of the comparison is the semantic-color rubric. If
  a cell is neutral, ask whether the row belongs in the table.
- **Auto-running the demo without user action** — the user must
  perturb the parameters themselves; that is where the learning
  happens. Auto-running is decoration.
- **Demo without a reduced-motion fallback** — Gate 3 fails; users
  with vestibular sensitivities cannot use the demo.
