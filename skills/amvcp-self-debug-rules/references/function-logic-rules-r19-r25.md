# Function / logic rules (R19-R25)

R19-R26 encode the plugin's *function* contract — the design intent
of what the plugin DOES, not how it looks. Skills are display
*techniques* that render specific content types (graph → mermaid
SVG, colors → swatch gallery, latex → KaTeX, bug list →
3-state-radio report). The agent picks the right skill, or composes
several on one page. The user comments visually instead of
describing verbally. These rules make that contract enforceable.

### R19 — Skill output is structural, not text-only

Every skill that renders a specific content type MUST produce
structural DOM that matches that type. A "list of colors" skill
emits `<div class="ve-gallery">` with swatches — NOT a `<p>` of
hex codes. A "directed graph" skill emits `<svg>` with
`<g data-ve-id>` nodes — NOT a `<ul>` of edge descriptions. The
visual rendering IS the value proposition; falling back to plain
text defeats the purpose.

Verify:
```js
const r = await page.evaluate(() => {
  const skillHosts = document.querySelectorAll(
    '[data-ve-skill], .ve-scene-graph, .ve-chart, .ve-gallery, '
    + '.ve-icon-svg, .ve-wf-screen, .ve-math, .ve-tikz, '
    + '.ve-regex, .ve-slide-block, .ve-table-wrap, .ve-dirtree');
  return Array.from(skillHosts).map(h => {
    const hasStructure = !!h.querySelector(
      'svg, canvas, table, [data-ve-id], '
      + '.ve-gallery-item, .ve-card, .ve-swatch, '
      + '[role="alert"], .ve-scene-error, .ve-error');
    return { cls: (h.className || '').toString().slice(0, 40),
             hasStructure };
  }).filter(x => !x.hasStructure);
});
// r MUST be empty. A failed scene-graph rendering counts as
// structural because the alert box IS the structured content.
```

### R20 — Selection ≠ choice (universal commentability vs explicit decision)

Every atom (`<p>`, `<li>`, `<tr>`, `<blockquote>`, `.ve-code-line`,
diagram-node, gallery-item, etc.) MUST be selectable via the
comment-handle system (see R5). The 3-state choice pill
(`.ve-decision-mini`) MUST ONLY appear on atoms inside a host
whose `data-ve-mode` is a choice variant (`choice` / `single` /
`multi` / `max-N`). Free-form prose, view-only diagrams,
explanatory mermaid, illustration charts — none of these may show
decision pills.

The distinction matters because **comment = "I want to ask claude
about this"** while **decision = "claude is asking me to choose"**.
Conflating them sprinkles meaningless approve/deny buttons on
every paragraph of every report.

Verify:
```js
const violators = await page.evaluate(() => {
  const minis = Array.from(document.querySelectorAll(
    '.ve-decision-mini, .ve-decision-mini-cell'));
  return minis
    .map(m => {
      const host = m.closest('[data-ve-mode]');
      const mode = host && host.getAttribute('data-ve-mode');
      const ok = mode === 'choice' || mode === 'single'
        || mode === 'multi' || (mode || '').startsWith('max-');
      return ok ? null : {
        tag: m.tagName,
        parent: m.parentElement
          ? m.parentElement.tagName + '.'
            + (m.parentElement.className || '').toString().slice(0, 30)
          : '?',
        hostMode: mode || '(none)'
      };
    })
    .filter(Boolean);
});
// violators MUST be empty.
```

Today's `injectDecisionMinis` (`scripts/amvcp-runtime.js:10928`)
attaches a `.ve-decision-mini` to every `<p>`/`<li>`/`<tr>`/
`<blockquote>` that carries `data-ve-comment-id` — there is no
gate on host mode. That is a direct R20 violation and needs
fixing: the function must walk up via `closest('[data-ve-mode]')`
and only inject when the closest mode is a choice variant.

### R21 — Choice cardinality enforced

Any host whose `data-ve-mode` is a choice variant MUST declare
its cardinality:

| `data-ve-mode`  | Approved atoms allowed         |
|-----------------|--------------------------------|
| `single`        | exactly 1 — radio semantics    |
| `multi`         | unbounded                      |
| `max-N` (N ≥ 1) | up to N                        |
| `choice`        | alias for `multi` (back-compat)|

When the limit would be exceeded, the runtime MUST either:
(a) reject the offending toggle, OR
(b) demote the oldest-approved sibling to `skip` (or `deny`,
    configurable via `data-ve-overflow="demote-skip|demote-deny|
    reject"`, default `demote-skip`).

`skip` = "undecided / procrastinate" and is always allowed.

Verify:
```js
const r = await page.evaluate(() => {
  const hosts = document.querySelectorAll(
    '[data-ve-mode="single"], [data-ve-mode="multi"], '
    + '[data-ve-mode^="max-"]');
  return Array.from(hosts).map(h => {
    const mode = h.getAttribute('data-ve-mode');
    const max = mode === 'single' ? 1
      : mode === 'multi' ? Infinity
      : parseInt(mode.replace('max-', ''), 10);
    const approved = h.querySelectorAll(
      '.ve-decision-mini-approve[aria-checked="true"]').length;
    return { mode, max, approved, withinLimit: approved <= max };
  });
});
// every entry.withinLimit MUST be true.
```

Today's runtime supports `single`/`multi` only on
`data-ve-type="table-form"`; generalising to any host (and adding
`max-N` + `data-ve-overflow`) is a separate follow-up.

### R22 — Skill composability — same page, zero interference

Multiple skills' outputs MUST coexist on one page without
mutating each other's surfaces. Each skill MUST:

- Scope its CSS to its own root class prefix (`.ve-<skill>-*` for
  runtime atoms; `.vc-<skill>-*` for DESIGN.md tokenised styles).
- Namespace its `data-ve-*` attributes — two skills must not race
  on the same attribute on the same element.
- Define an idempotent `init(root)` that ignores hosts not
  carrying its own root class / `data-ve-type` value.

Verify on a composite fixture (e.g. `all-techniques-sample.html`):
```js
const r = await page.evaluate(() => {
  function snapshot() {
    return {
      scenes: document.querySelectorAll(
        '.ve-scene-graph svg g[data-ve-id]').length,
      chartBars: document.querySelectorAll(
        '.ve-chart [data-ve-id]').length,
      formInputs: document.querySelectorAll(
        '.ve-form-input').length,
      codeLines: document.querySelectorAll('.ve-code-line').length,
      galleryItems: document.querySelectorAll(
        '.ve-gallery-item, .ve-card-picker [data-ve-card]').length
    };
  }
  const before = snapshot();
  ['amvcpRuntime','amvcpDiagram','amvcpChart','amvcpFormInputs',
   'amvcpCodeHighlight','amvcpTables','amvcpWireframe',
   'amvcpAnimation','amvcpIconSvg','amvcpLayout','amvcpSlide',
   'amvcpTokenSheet','amvcpDesignMd'].forEach(name => {
    const m = window[name];
    if (m && typeof m.init === 'function') {
      try { m.init(document); } catch (e) {}
    }
  });
  const after = snapshot();
  return { before, after,
    stable: JSON.stringify(before) === JSON.stringify(after) };
});
// r.stable MUST be true.
```

### R23 — Mode declared explicitly; default is read-only

Every host element rendered by a skill MUST declare its mode via
`data-ve-mode`:

- `readonly` — explanatory / view-only. Comment-handle on
  selection, NO decision pill. (Safe default.)
- `choice` / `single` / `multi` / `max-N` — the agent is asking
  the user to decide. Decision pills attach per atom.
- `overlay` — overlay-mode runtime on an arbitrary deployed page
  (see R24).

A missing `data-ve-mode` is treated as `readonly`. The runtime
MUST refuse to attach a decision pill on a host whose mode is not
a choice variant. This is the structural enforcement of R20.

Verify:
```js
const offenders = await page.evaluate(() => {
  const hosts = document.querySelectorAll(
    '.ve-scene-graph, .ve-chart, .ve-form-input, '
    + '.ve-code-block, .ve-wf-screen, .ve-icon-svg, '
    + '.ve-layout-grid, .ve-slide-block, .ve-finding, '
    + '.ve-table-wrap, .ve-gallery, .ve-dirtree');
  const bad = [];
  hosts.forEach(h => {
    const mode = h.getAttribute('data-ve-mode');
    const minisInside = h.querySelectorAll(
      '.ve-decision-mini').length;
    if (!mode && minisInside > 0) {
      bad.push({
        tag: h.tagName,
        cls: (h.className || '').toString().slice(0, 60),
        minis: minisInside
      });
    }
  });
  return bad;
});
// offenders MUST be empty.
```

### R24 — Overlay-mode runtime — non-destructive contract

When the runtime is loaded on a non-plugin page (a deployed
website) in overlay mode, it MUST:

- Inject ONE root overlay element (e.g.,
  `<div data-ve-mode="overlay" data-ve-overlay-root="1">`) and
  nothing else into the original DOM.
- Capture clicks via a transparent fixed-position layer that the
  user toggles on / off via a toolbar inside the overlay root.
- Expose the same Done / Submit contract as report mode
  (collected selections → submission payload).
- Remove itself cleanly on disarm: zero residual classes / inline
  styles / extra DOM nodes on the host page's original elements.

Verify (round-trip; gated on overlay-mode entry being shipped —
today this rule is `applicable: false` until the entry exists):
```js
const r = await page.evaluate(async () => {
  if (typeof window.amvcpRuntime?.armOverlay !== 'function') {
    return { applicable: false };
  }
  const before = document.body.outerHTML;
  await window.amvcpRuntime.armOverlay();
  const armed = document.body.outerHTML;
  await window.amvcpRuntime.disarmOverlay();
  const after = document.body.outerHTML;
  return {
    applicable: true,
    armedHasOverlayRoot: armed.includes(
      'data-ve-overlay-root="1"'),
    afterMatchesBefore: before === after
  };
});
// when applicable: armedHasOverlayRoot AND afterMatchesBefore
// MUST both be true.
```

### R25 — Submission payload identifies atoms unambiguously

The selection-submit payload (POSTed when the user clicks Done /
Submit) MUST include, for every selected atom:

- `data-ve-id` — stable across re-renders.
- `text` or `label` — a short human-readable snippet so the agent
  can map the selection back to its source MD / HTML.
- `kind` — atom kind (`paragraph` / `row` / `li` /
  `diagram-node` / `gallery-item` / `code-line` /
  `finding-reply` / etc.).
- Skill-specific metadata where applicable (e.g., `data-ve-pnum`
  for paragraphs; `lineNumber` for code lines; `decision:
  skip|approve|deny` for choice atoms; `value` for form inputs).

The point: claude reads the payload back and must unambiguously
identify what the user touched. Selecting "the third paragraph"
is meaningless without an id; a numeric id without text is
meaningless if the source markdown has been edited; both together
make visual disambiguation work.

Verify:
```js
const payload = await page.evaluate(() => {
  if (typeof window.__vcCollectSubmission === 'function')
    return window.__vcCollectSubmission();
  return null;
});
if (payload && Array.isArray(payload.selections)) {
  for (const sel of payload.selections) {
    if (!sel.id) throw new Error('R25: selection missing id: '
      + JSON.stringify(sel));
    if (!(sel.text || sel.label))
      throw new Error('R25: selection missing text/label: '
        + JSON.stringify(sel));
    if (!sel.kind) throw new Error('R25: selection missing kind: '
      + JSON.stringify(sel));
  }
}
```

