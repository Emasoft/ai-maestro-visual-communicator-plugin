---
name: amvcp-self-debug-rules
description: "Self-debugging checklist for visual-communicator pages. Use when verifying that a rendered HTML/SVG visualization (report, slide, diagram, math, code block, table, regex panel, etc.) adheres to the universal rules collected from prior debug sessions. Trigger when the user says 'verify the visualization', 'self-debug', 'check the rendered page', 'audit the visualization', 'why does X look wrong'. Run via dev-browser headless — every rule below maps to a concrete CDP / page.evaluate measurement."
license: MIT
metadata:
  author: Emasoft
---

# Self-debug rules — visual-communicator

## Overview

Every visualization the plugin emits MUST satisfy a fixed set of universal rules. This skill is the canonical checklist + the exact dev-browser snippets to verify each rule. Use it BEFORE telling the user "wrap is fixed", "selection works", "the chip is sized right" — measure, don't claim.

## How to debug

1. Open the page via `dev-browser` so the headless Chromium can be inspected from JS — this is faster than the iTerm preview pane and gives byte-level measurements.
2. For EVERY change that touches CSS / DOM / runtime behaviour, walk the relevant section of the checklist and run the embedded snippets. If any check fails, fix the code, then re-run from the top.
3. Take a screenshot AFTER each fix using `page.screenshot({clip: ...})` and read it back with the `Read` tool to do a visual sanity check too — measurements alone miss layout regressions.
4. For interactions that need real mouse paths (hover-bridge, drag-paint, snippet handle), use `page.mouse.move(x, y, {steps: N})` not `el.click()`. Programmatic clicks bypass the move/leave/over event sequence and hide hover-state bugs.

## Universal rules

### R1 — Light + dark themes

Every visual element MUST ship a light AND a dark variant. Single-theme is a correctness defect (browsers expose `prefers-color-scheme`; flashing the wrong theme hurts the user's eyes physically).

The runtime's MutationObserver on `[data-ve-theme]` (see runtime.js `bindThemeAttributeObserver`) re-emits `--vc-*` tokens whenever the attribute changes — so any path (pod button, devtools, test harness, agent code) that toggles the attribute triggers a real theme swap. **R1 verification is gated on `amvcp-runtime.js` being loaded** because the observer lives there. Standalone-skill fixtures that load only one module (e.g. `amvcp-designmd.js` + `amvcp-typography.js` without the runtime) are exempt — they exercise the module in isolation, not the full theme-swap UX.

Verify (gated on runtime):
```js
const r = await page.evaluate(async () => {
  if (typeof window.amvcpRuntime !== 'object') {
    return { applicable: false, reason: 'runtime not loaded' };
  }
  const html = document.documentElement;
  const orig = html.getAttribute('data-ve-theme');
  async function snap(t) {
    html.setAttribute('data-ve-theme', t);
    await new Promise(r => setTimeout(r, 250));   // wait observer
    return {
      bg: getComputedStyle(document.body).backgroundColor,
      text: getComputedStyle(document.body).color,
      accent: getComputedStyle(html).getPropertyValue('--vc-color-accent').trim(),
      canvas: getComputedStyle(html).getPropertyValue('--vc-color-canvas').trim(),
    };
  }
  const light = await snap('light');
  const dark = await snap('dark');
  html.setAttribute('data-ve-theme', orig || 'light');
  return {
    applicable: true,
    distinct: light.canvas !== dark.canvas
      || light.accent !== dark.accent
      || light.bg !== dark.bg,
    light, dark,
  };
});
// When applicable: distinct MUST be true.
```

The mechanical tricks: switch BORDERS ↔ BACKGROUNDS between themes (light: dark border on light bg → dark: light border on dark bg). Switch TEXT ↔ BG colors. Selection emphasis is SUBTRACTIVE in light (push toward black) vs ADDITIVE in dark (push toward white).

### R2 — No nested scrollbars

Never create `overflow:auto` / `overflow:scroll` boxes inside the page. Wide content (tables, code, diagrams) MUST extend the document width — the reader gets ONE outer scrollbar pair, never inner ones. Text content (`<p>`, `<li>`, prose) may rely on natural wrapping.

Verify:
```js
const innerScrollers = await page.evaluate(() => {
  const all = document.querySelectorAll('*');
  return Array.from(all).filter(el => {
    const cs = getComputedStyle(el);
    return el !== document.body && el !== document.documentElement
      && (cs.overflowX === 'auto' || cs.overflowX === 'scroll'
       || cs.overflowY === 'auto' || cs.overflowY === 'scroll');
  }).map(el => ({tag: el.tagName, cls: el.className, style: el.style.cssText}));
});
// Should be EMPTY (or only intentional editor/widget surfaces).
```

### R3 — 3-state visual model (normal · selected ±Δ · hover ±Δ + glow)

Every interactive atom (paragraph, row, list-item, code line, code block, chart bar, etc.) has THREE visually distinct states:

| State | Visual delta | Glow |
|---|---|---|
| Normal | base | no glow |
| Selected | clear ±Δ (bg tint + outline) | NO glow |
| Hover (over normal) | small ±Δ + glow | YES |
| Hover (over selected) | strongest ±Δ + outline + glow | YES |

Glow ALWAYS means "you're hovering me right now". Outline ALWAYS means "I'm selected". The bg-delta increases monotonically across states.

Verify by reading computed styles after `page.mouse.move(x, y)` on each kind of atom and checking that `boxShadow` is non-`none` only on hover, `outline-style` is non-`none` only on selected.

### R4 — Atom selection model (only the right things are selectable)

Selectable atoms:
- `<p data-ve-comment-id>`, `<li data-ve-comment-id>`, `<tr data-ve-comment-id>`, `<blockquote data-ve-comment-id>`, `.ve-code-line`, gallery items, file/dir nodes, prose snippets, diagram parts.

NOT selectable as wholes:
- `<table>` (only its `<tr>` are), `<ul>` / `<ol>` (only their `<li>` are), `<pre>` / `.ve-code-block` (only `.ve-code-line`), `<h1>`-`<h6>`, `<button>` / `<input>` / `<select>`.

Markdown "fake heading" detection — `<p>` whose entire visible content is a single emphasis element (`<strong>` / `<b>` / `<em>` / `<i>` only, plus optional whitespace text nodes) is treated as a heading and is NOT selectable.

**CRITICAL**: filtering fake headings ONLY in `findCommentAnchor()` / `isSelectableAtom()` / `injectDecisionMinis()` is INSUFFICIENT. The CSS selector `p[data-ve-comment-id]` still applies `cursor: pointer` and the hover bg/glow rules to fake-heading paragraphs because they technically still have the attribute. The robust fix is to **strip `data-ve-comment-id` from fake-heading paragraphs at boot** via `stripFakeHeadingCommentIds()` — that way the attribute-selector CSS rules don't match at all, and the fake heading becomes truly inert (cursor:auto, no hover paint, no comment thread can ever open). Snippet text-drag selection still works inside fake-heading paragraphs because it's range-based, not anchor-attribute-based.

Verify (post-strip):
```js
const fake = await page.evaluate(() => Array.from(document.querySelectorAll('p'))
  .filter(p => {
    const kids = Array.from(p.childNodes).filter(n => n.nodeType !== 3 || n.textContent.trim() !== '');
    return kids.length === 1 && /^(STRONG|B|EM|I)$/i.test(kids[0].nodeName);
  })
  .map(p => ({
    text: p.textContent.trim().slice(0, 40),
    hasCommentId: !!p.getAttribute('data-ve-comment-id'),  // MUST be false
    cursor: getComputedStyle(p).cursor,                     // MUST be 'auto'
  })));
```

### R5 — Two independent bubble handles, distinct colors

Two parallel selection systems coexist:
1. **Element selection** (atom click → bubble handle on left edge). Bubble handle = gold (`--ve-accent`).
2. **Text selection** (drag-select inside any text → snippet bubble handle floats above the selection). Bubble handle = teal (`--ve-snippet-handle-bg`).

Both open the SAME comment modal but with DIFFERENT thread keys (`group:…` vs `snippet:…`).

Verify:
```js
const r = await page.evaluate(() => {
  const ge = getComputedStyle(document.querySelector('.ve-comment-handle') || document.body).backgroundColor;
  // Trigger a snippet by dispatching a Range over a paragraph
  const p = document.querySelector('p[data-ve-comment-id]');
  if (p) {
    const range = document.createRange();
    range.selectNodeContents(p);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
  return { handle_color: ge };
});
```

### R6 — Snippet selection survives the modal

Drag-selecting text → opening the snippet bubble handle → modal opens → modal closes → ORIGINAL TEXT SELECTION must still be visible AND restored. The user must not have to re-drag.

Implementation:
- Save the `Range.cloneRange()` before opening the modal (modal's textarea focus normally clears `window.getSelection()`).
- Apply `CSS.highlights.set('ve-snippet-active', new Highlight(range))` so the visual band survives focus changes (the `::highlight()` overlay is independent of the document's text selection).
- On modal close, clear the `::highlight()` overlay AND `selection.addRange(savedRange)` so `::selection` paint comes back.

Verify by checking that `window.getSelection().toString()` returns the same text BEFORE opening the modal AND AFTER closing it.

### R7 — One bubble handle per shell (iTerm pane)

The `open_preview.applescript` MUST close any existing preview pane (Web Browser session = no `tty`) in the caller's tab BEFORE splitting again. Multiple `open_preview` calls from the same shell must NEVER stack panes side-by-side.

Caller MUST pass `${ITERM_SESSION_ID##*:}` as the second argument so the AppleScript walks every iTerm window/tab and finds the EXACT calling session — never falling back to "current session" (which is whatever the user happens to have focused at the moment of dispatch).

Verify: run `open_preview` 3 times in a row from the same shell, then count Web Browser sessions in the caller's tab — should be exactly 1.

### R8 — Atom selection vs text selection: disambiguation

Within a code-block / report / table:
- Plain CLICK (no drag, no text selected on mouseup) → toggle atom selection (or code-line selection).
- Plain DRAG (mouse moved while button held) → browser-native text selection (snippet bubble handle appears on mouseup if the drag actually selected text).
- Shift+drag → multi-atom paint (legacy code-line / row range selection).

Critical: do NOT call `ev.preventDefault()` on the atom-mousedown — that kills text selection for the user. Defer the atom toggle to mouseup, gated on `!moved && !sel.toString()`.

### R9 — Code-block soft-wrap rules

Long code lines that overflow the viewport MUST wrap inside the block — never trigger horizontal scroll. CSS-only:
- `<pre>` has `white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere`.
- Each `.ve-code-line` carries `style="--ve-code-indent:N"` where N = (source-leading-whitespace + 2).
- `.ve-code-line { padding-left: calc(4.2ch + var(--ve-code-indent) * 1ch); text-indent: calc(var(--ve-code-indent) * -1ch); }`.
- Wrap continuations land at `gutter + source-indent + 2ch` — always 2ch right of where the first row's text begins.
- Empty lines: `min-height: 1.55em` so they don't collapse and break drag-paint.
- Line numbers via `::before` counter — NOT inserted into source text.
- Wrap-marker stripe: `background-image: linear-gradient(...)` painting a darker 2ch column starting at y=1.55em (so it shows ONLY on continuation rows, not the first visual row).

Verify:
```js
await page.evaluate(() => {
  const s = document.createElement('style');
  s.textContent = '.ve-code-block { max-width: 400px !important; }';
  document.head.appendChild(s);
});
const wrap = await page.evaluate(() => {
  const lines = Array.from(document.querySelectorAll('.ve-code-line'));
  const wrapped = lines.find(l => l.getBoundingClientRect().height > 30);
  if (!wrapped) return null;
  const content = wrapped.querySelector('.ve-code-content');
  const gutterEnd = wrapped.querySelector('.ve-code-linenum').getBoundingClientRect().right;
  const rects = Array.from(content.getClientRects());
  return rects.map(r => (r.x - gutterEnd).toFixed(1));
});
// Two distinct x-from-gutter values: first row text start, wrap row start.
// The difference MUST be ≥ ~14px (≈2ch at 13px monospace).
```

### R10 — Code block: copy contract

Every `.ve-code-block` MUST have a floating copy button (top-right corner). Click → `navigator.clipboard.writeText(originalSource)`. The clipboard payload is BYTE-IDENTICAL to the source text the renderer received — no line numbers (those are CSS `::before` counters), no wrap markers (those are CSS gradients), no extra `\n` from soft-wrap (wrap is purely visual).

**CRITICAL — icon glyph rendering**: do NOT use uncommon unicode glyphs like `⧉` (U+29C9 TWO JOINED SQUARES) or `⧖` (U+29D6) for the icon. These fall through the system font stack on iTerm's WebKit and render as a missing-glyph gray box. Use **inline SVG** (with `currentColor` stroke so the icon picks up the button's text color and adapts to both themes). The success state ALSO swaps via SVG (e.g. checkmark path) — never via text glyph swap.

Verify:
```js
const r = await page.evaluate(() => {
  // R10 applies ONLY when amvcp-runtime.js is loaded — the runtime
  // is the copy-button attacher. Standalone code-highlight fixtures
  // (loaded WITHOUT the runtime, to test the tokenizer in isolation)
  // legitimately have no copy button and are exempt.
  if (typeof window.amvcpRuntime === 'undefined') {
    return { applicable: false };
  }
  const block = document.querySelector('.ve-code-block');
  if (!block) return { applicable: false };
  const stash = block.__veSourceText;  // the original raw text
  const range = document.createRange();
  range.selectNodeContents(block.querySelector('pre'));
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);
  const btn = block.querySelector('.ve-code-copy-btn');
  return {
    applicable: true,
    stash,
    selectedText: window.getSelection().toString(),
    hasCopyBtn: !!btn,
    iconIsSvg: btn ? !!btn.querySelector('svg') : false,  // MUST be true — see "icon glyph rendering" warning
  };
});
// when applicable: stash and selectedText must match (modulo trailing
// newline); hasCopyBtn AND iconIsSvg must be true.
```

### R11 — Line numbers are NOT selectable

`.ve-code-linenum` MUST have `user-select: none; -webkit-user-select: none; -webkit-touch-callout: none`. Drag-selecting a region that includes the gutter must NOT include the line number text.

Verify:
```js
const cs = await page.evaluate(() => {
  const ln = document.querySelector('.ve-code-linenum');
  return getComputedStyle(ln).userSelect;
});
// Must be 'none'.
```

### R12 — Tables: responsive, decision column

Every `<table>` rendered by the runtime MUST:
- Have `width:100%` and `overflow-wrap:anywhere; word-break:break-word` on cells so it fits the viewport and long path-like text wraps mid-token.
- Have an injected "Your choice" column at the right (with `width:1%` so the column shrinks to its content), with the per-row 3-segment mini chip (✘ ﹅ ✔︎).
- Have a permanent (not selection-conditional) outer outline — the table is NOT a selectable atom (only its rows are).

Mini chip:
- 3 segments, EQUAL size (1.4em × 1.4em each).
- Unselected segments have a visible button-frame (faint bg + 1px inset stroke) so the chip reads as 3 equal cells regardless of selection state.
- Selected segment uses semantic color: ﹅ skip = blue (`--ve-decision-skip-symbol`), ✔︎ approve = green (`--ve-decision-approve-symbol`), ✘ deny = red (`--ve-decision-deny-symbol`).

### R13 — LaTeX / math / TikZ embedded elements

KaTeX and TikZJax can be embedded in ANY visualization (report, slide, diagram). Rules:

1. **KaTeX (`.ve-math`)**:
   - Inline: `<span class="ve-math">…</span>`. Block: `<span class="ve-math ve-math--block">`. Chemistry: add `ve-math--chem`.
   - Tag sub-elements with `\vecell`, `\veidx`, `\vebound`, `\veterm`, `\veop` macros for selectable atoms.
   - DO NOT override `color:` — the runtime forces `color: inherit` so the formula adapts to both themes.
   - The runtime auto-loads KaTeX with mhchem on first `.ve-math` element.

2. **TikZJax (`.ve-tikz`)**:
   - `<div class="ve-tikz" data-ve-tikz-source="…LaTeX…" data-ve-tikz-regions='[{"id":"r1","label":"…"}]'>`.
   - **CRITICAL**: ONE TikZ error crashes EVERY later diagram on the page (WASM panics on first LaTeX error, silently blanks the rest). Always test diagrams in isolation FIRST.
   - Unsupported packages: `pgfplots`, `chemfig`, `circuitikz`, `automata`, `tikz-feynman`, mhchem-in-TikZ. Stick to base TikZ + node trees + geometric primitives.
   - TikZ source MUST be ASCII only — unicode goes in the surrounding HTML, never inside `\node {…}`.

3. **Coexistence**:
   - KaTeX, TikZ, regex-vis, charts, code blocks, prose, tables, galleries can ALL appear on the same page. The runtime initializes them lazily in `bootEverything()` — no init-order dependency between subsystems.
   - When HTML is not enough for layout, remember `<svg>` is a superset: `<foreignObject>` inside SVG can host arbitrary HTML (including `.ve-math`, `.ve-code-block`, etc.). Use this for figure-with-callout, math-on-graph, code-on-diagram patterns.

4. **Visual rules apply uniformly**: 3-state model (R3), light+dark themes (R1), no inner scrollbars (R2), bubble handles for comments (R5).

Verify:
```js
const r = await page.evaluate(() => ({
  math_loaded: !!window.katex,
  tikz_loaded: !!window.tikzjax,
  math_count: document.querySelectorAll('.ve-math').length,
  tikz_count: document.querySelectorAll('.ve-tikz').length,
  math_overrides_color: Array.from(document.querySelectorAll('.ve-math'))
    .filter(el => el.style.color).length,  // MUST be 0
  tikz_unicode_in_source: Array.from(document.querySelectorAll('.ve-tikz[data-ve-tikz-source]'))
    .filter(el => /[^\x00-\x7f]/.test(el.getAttribute('data-ve-tikz-source'))).length,  // MUST be 0
}));
```

### R14 — Regex-vis embedded as inline interactive div

The regex visualizer (`.ve-regex`) can be embedded as an inline interactive div inside any other visualization. Same compatibility rules as math/TikZ above.

Verify:
```js
const r = await page.evaluate(() => ({
  regex_count: document.querySelectorAll('.ve-regex').length,
  regex_loaded: !!document.querySelector('script[src*="ve-regex"]'),
}));
```

### R15 — Comment-modal connector line

Opening the comment modal from ANY anchor (element handle, snippet handle, programmatic `__veOpenCommentModal(anchor)`) MUST draw a wedge-shaped connector line from the anchor's bbox center to the modal's center.

For SNIPPET anchors specifically: the snippet popup chip cannot be the anchor (it's hidden on modal open → 0×0 bbox → line draws to nowhere). Instead, `showSnippetPopup` creates a transient `<div data-ve-snippet-anchor="1">` positioned over the selected text bbox, passes that to `openCommentModal(anchorDiv)`, and removes it on `closeCommentModal`.

Verify the connector line geometry:
```js
const line = await page.evaluate(() => {
  const svgLine = document.querySelector('svg line');
  if (!svgLine) return null;
  return {
    x1: svgLine.getAttribute('x1'),
    y1: svgLine.getAttribute('y1'),
    x2: svgLine.getAttribute('x2'),
    y2: svgLine.getAttribute('y2'),
    strokeWidth: svgLine.getAttribute('stroke-width'),
  };
});
// All 4 coords MUST be non-zero. strokeWidth MUST equal the modal header height (clamped 8-44px).
```

### R16 — Page left-padding for handles

The body MUST have `padding-left ≥ 48px` so the floating element bubble handle (28px wide at `left:-40px` from its parent atom) is never clipped against the viewport edge.

Verify:
```js
const pad = await page.evaluate(() => parseInt(getComputedStyle(document.body).paddingLeft, 10));
// pad MUST be >= 48.
```

### R18 — Dispatched-event vs real-mouse-path

When verifying interactive features (snippet-handle popup, hover-bridge, drag-paint), do NOT use `document.dispatchEvent(new MouseEvent(...))` to simulate user gestures. The dispatched event has `event.target === document`, and `document` is a Document not an Element so `document.closest(...)` throws / returns null. Many runtime handlers gate on `ev.target.closest(...)` and silently bail out under dispatched events.

Always use **real mouse paths** via `page.mouse.move(x, y, {steps: N})` followed by `page.mouse.down() / page.mouse.up()` — those produce events with proper Element targets and reliably trigger the same handlers a real user would.

If a feature MUST be tested via JS (no real mouse available, e.g. headless verification of internal state), call the runtime function directly via the test hook (`window.__veOpenCommentModal(anchor)`, see R5/R15) — bypass the input pipeline entirely.

Verify:
```js
// WRONG — silent no-op:
//   document.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
// RIGHT — proper element target:
const para = await page.evaluate(() => {
  const p = document.querySelector('p[data-ve-comment-id]');
  if (!p) return null;
  const r = p.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
});
await page.mouse.move(para.x, para.y);
await page.mouse.down();
await page.mouse.move(para.x + 80, para.y);
await page.mouse.up();
```

### R17 — Mini decision chip is responsive

The 3-segment mini chip uses RELATIVE units (`em`, `1%`) — NOT hardcoded pixels. It scales with font-size and adapts to the chip's container width.

Verify:
```js
const seg = await page.evaluate(() => {
  const s = document.querySelector('.ve-decision-mini-seg');
  if (!s) return null;
  const cs = getComputedStyle(s);
  // Width must be em-based (1.4em → ~24px at 17px font).
  return { width: cs.width, height: cs.height };
});
```

## Function / logic rules — plugin design contract

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

### R27 — DESIGN.md style controller pod always MOUNTED (but hidden by default)

The pod (the floating DESIGN.md style controller — `#ve-designmd-handle` for the wake button, `.ve-designmd-pad` for the panel) MUST be present in the DOM on EVERY page the runtime renders, so the activation gesture (R39) can summon it. On pages whose HTML does not explicitly load `amvcp-designmd.js`, the runtime MUST auto-inject it via dynamic `<script>` injection and then call `_ensureDesignMdHandle()` unconditionally.

The pod chrome is INVISIBLE by default — both the panel AND the wake handle are `visibility:hidden` and not reachable by pointer until the user invokes the summoning gesture defined in R39. The handle is just the visible drag-and-collapse affordance of the pod ITSELF once summoned; it is not a permanent always-visible button.

Verify:
```js
const r = await page.evaluate(() => {
  const handle = document.getElementById('ve-designmd-handle');
  const pad = document.querySelector(
    '.ve-designmd-pad, [data-ve-designmd-pad]');
  const handleCs = handle ? getComputedStyle(handle) : null;
  const padCs = pad ? getComputedStyle(pad) : null;
  return {
    handleMounted: !!handle,
    padMounted: !!pad,
    hasEngine: typeof window.amvcpDesignMd === 'object',
    handleHiddenByDefault: handleCs
      ? handleCs.visibility === 'hidden'
        || handleCs.display === 'none' : null,
    padHiddenByDefault: padCs
      ? padCs.visibility === 'hidden'
        || padCs.display === 'none' : null
  };
});
// handleMounted AND padMounted AND hasEngine MUST be true.
// handleHiddenByDefault AND padHiddenByDefault MUST be true.
```

### R28 — Pod library: save / rename / delete user presets

The pod's library drawer MUST expose three actions on top of the import / export / hot-swap already shipped:

- **Save as…** — a name input + Save button that snapshots the CURRENT tokens (via `serializeDesignMd`) into a localStorage-backed user preset bucket and appends a new row to the library list with a "user" badge.
- **Rename** (per user-preset row) — built-in presets are read-only; user presets accept a new name without losing their content or position in the list.
- **Delete** (per user-preset row) — irreversible local-only removal; built-in presets cannot be deleted.

Persistence key: `localStorage["ve-designmd-pad-user-presets"]` = JSON map `{ name: designMdText }`. A future Python helper will mirror this to `$CLAUDE_PLUGIN_DATA/design-md-presets/<name>.md` for cross-page + cross-version persistence (see the [Claude Code persistent-data-directory docs](https://code.claude.com/docs/en/plugins-reference#persistent-data-directory)).

Verify:
```js
const r = await page.evaluate(() => {
  const api = window.amvcpDesignMd;
  if (!api?.saveUserPreset) return { applicable: false };
  api.saveUserPreset('test-preset-r28');
  const after = JSON.parse(
    localStorage.getItem('ve-designmd-pad-user-presets') || '{}');
  const hasIt = !!after['test-preset-r28'];
  api.renameUserPreset('test-preset-r28', 'renamed');
  const renamed = JSON.parse(
    localStorage.getItem('ve-designmd-pad-user-presets') || '{}');
  const wasRenamed = !renamed['test-preset-r28']
    && !!renamed['renamed'];
  api.deleteUserPreset('renamed');
  const final = JSON.parse(
    localStorage.getItem('ve-designmd-pad-user-presets') || '{}');
  const wasDeleted = !final['renamed'];
  return { applicable: true, hasIt, wasRenamed, wasDeleted };
});
// when applicable: hasIt AND wasRenamed AND wasDeleted MUST be true.
```

### R29 — 3-state selection ALWAYS overrides DESIGN.md palette

The user must see a clear visual delta on every selectable atom **regardless** of which DESIGN.md preset is active:

| State                | Light theme                              | Dark theme                                 |
|----------------------|------------------------------------------|--------------------------------------------|
| Normal               | base                                     | base                                       |
| Hover                | slight darker bg + soft warm glow        | slight brighter bg + soft warm glow        |
| Selected             | clear darker bg + outline                | clear brighter bg + outline                |
| Hover + Selected     | strongest darker + outline + glow        | strongest brighter + outline + glow        |

The palette can be swapped (R3 / DESIGN.md), but the brightness DIRECTION (darker in light theme, brighter in dark theme) and the glow on hover are non-negotiable. The runtime CSS for `[data-ve-comment-id]:hover` and `[data-ve-comment-id][data-ve-selected="1"]` MUST use a specificity high enough that no DESIGN.md preset can mask the delta. The SVG side already enforces this with `!important` (runtime.js:660); the HTML-atom side MUST do the same.

Verify (per preset):
```js
const r = await page.evaluate(() => {
  const atom = document.querySelector('p[data-ve-comment-id]')
    || document.querySelector('li[data-ve-comment-id]');
  if (!atom) return { applicable: false };
  function lightnessOf(rgb) {
    const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
    if (!m) return 0;
    const [r, g, b] = [+m[1], +m[2], +m[3]];
    return (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
  }
  const base = lightnessOf(getComputedStyle(atom).backgroundColor);
  atom.setAttribute('data-ve-selected', '1');
  const sel = lightnessOf(getComputedStyle(atom).backgroundColor);
  atom.removeAttribute('data-ve-selected');
  return { applicable: true, base, sel,
           deltaPct: Math.abs(sel - base) * 100,
           changes: Math.abs(sel - base) > 0.02 };
});
// when applicable: changes MUST be true (≥ 2 percentage points
// lightness delta) for EVERY built-in preset.
```

### R30 — Touch parity on mobile

Every interaction that works with mouse MUST also work with touch on a mobile browser. Specifically:
- Bubble handle hover-bridge: `touchstart` on the atom shows the handle; `touchstart` on the handle opens the modal.
- Drag-paint (code-line / row range): touch-drag works.
- Modal close: tap on the backdrop closes.
- Diagram pan / zoom: drag-pan works on touch; pinch works for zoom.
- Pod: drag-to-move works with touch.

Verify (under mobile UA emulation):
```js
const r = await page.evaluate(() => {
  // The runtime should have registered touch listeners on the
  // document or on the relevant atom containers.
  const hasTouch = 'ontouchstart' in window;
  // Quick sanity probe: synthetic touchstart on a bubble handle.
  const handle = document.querySelector('.ve-comment-handle')
    || document.getElementById('ve-designmd-handle');
  if (!handle) return { hasTouch, modalOpenedByTouch: 'n/a' };
  const t = new TouchEvent('touchstart',
    { bubbles: true, cancelable: true });
  handle.dispatchEvent(t);
  // Whether modal opens is checked elsewhere (real touch path
  // required); this snippet just confirms the listener exists.
  return { hasTouch };
});
```

### R31 — Responsive at all common viewport widths

Pages MUST render correctly at the canonical widths: 320, 375, 414, 768, 1024, 1280, 1920, 2560. "Correctly" =
- no horizontal scroll on the document (R2 still holds for chrome; intentional wide-content scroll is fine).
- no text clipped at the right edge (R35).
- no selectable atom unreachable (clipped past the viewport edge).
- no overlap between page-level surfaces (R34).
- corner buttons (R33) remain visible.

Verify by sweeping viewport widths and re-running the audit at each.

### R32 — Retina (2× / 3×) bitmap density

Bitmap images (PNG / JPEG via `<img>` or `background-image`) MUST be authored at 2× the display size (3× where possible) so they stay crisp on Retina / high-DPI screens. The renderer MUST emit `srcset="… 2x, … 3x"` when the higher-density assets exist; for inline embedded images set `width` / `height` equal to half the natural pixel size.

Verify:
```js
const r = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img'));
  const offenders = imgs.filter(img => {
    if (img.hasAttribute('srcset')) return false;
    return img.naturalWidth < img.width * 2;
  });
  return { total: imgs.length, offenders: offenders.length };
});
// offenders MUST be 0. Pure-vector (SVG, canvas) is exempt.
```

### R33 — Corner action buttons always present (even in slides / animations / video)

The runtime's corner ACTION buttons (`.ve-action-btn--top`, `.ve-action-btn--bottom`, e.g. Submit / Done) MUST be visible regardless of what surface fills the page. Slide decks, fullscreen animations, embedded video, scene-graphs in full-viewport mode MUST NOT mask them. They live on a fixed-position layer with the highest z-index (`2147483646` — one below INT32_MAX).

NOTE — the DESIGN.md pod wake handle (`#ve-designmd-handle`) is explicitly NOT covered by this rule; per R27 + R39 the pod is hidden by default and only revealed via the summon gesture. R33 applies only to action buttons that the user must always be able to reach (commit a decision, close, etc.).

Verify:
```js
const r = await page.evaluate(() => {
  const probes = ['.ve-action-btn--top', '.ve-action-btn--bottom'];
  return probes.map(sel => {
    const el = document.querySelector(sel);
    if (!el) return { sel, applicable: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const elAtPoint = document.elementFromPoint(
      r.x + r.width / 2, r.y + r.height / 2);
    return { sel, applicable: true,
             visible: r.width > 0 && r.height > 0
                      && cs.visibility !== 'hidden'
                      && cs.display !== 'none',
             zIndex: cs.zIndex,
             topMost: el === elAtPoint || el.contains(elAtPoint) };
  });
});
// every applicable probe MUST have visible: true AND topMost: true.
// (Probes are applicable only when the rendered page intentionally
// mounted the corner action button — e.g. interactive reports,
// choice-tables, form-input pages. A pure read-only typography
// specimen has no action button and that's fine.)
```

### R34 — No overlap between scaffolded elements

Scaffolded surfaces (multiple skills composed on one page) MUST NOT overlap. The page is a single-document scroll (R2). Each surface is a block-level container laid out below the previous one. The only exception is the floating-overlay z-layer (pod, corner buttons, modal, snippet popup, decision modal) — these have known small footprints and live on z > 100.

Verify:
```js
const r = await page.evaluate(() => {
  const surfaces = Array.from(document.querySelectorAll(
    '.ve-scene-graph, .ve-chart, .ve-table-wrap, .ve-code-block, '
    + '.ve-finding, .ve-wf-screen, .ve-icon-svg, '
    + '.ve-layout-grid, .ve-slide-block, .ve-form-input, '
    + '.ve-gallery, .ve-dirtree'));
  const overlaps = [];
  for (let i = 0; i < surfaces.length; i++) {
    for (let j = i + 1; j < surfaces.length; j++) {
      const a = surfaces[i].getBoundingClientRect();
      const b = surfaces[j].getBoundingClientRect();
      // Skip ancestor / descendant pairs (intentional containment).
      if (surfaces[i].contains(surfaces[j])
          || surfaces[j].contains(surfaces[i])) continue;
      const overlap = !(a.right <= b.left || b.right <= a.left
        || a.bottom <= b.top || b.bottom <= a.top);
      if (overlap) overlaps.push({
        i, j, a: surfaces[i].className.toString().slice(0, 30),
        b: surfaces[j].className.toString().slice(0, 30) });
    }
  }
  return overlaps;
});
// overlaps MUST be empty.
```

### R35 — No text hidden or truncated at the viewport edge

Every paragraph / list-item / code-line / heading MUST be fully readable. Specifically:
- No `text-overflow: ellipsis` on prose (only on intentionally narrow chips / badges).
- No prose `<p>` is masked by a floating overlay (the overlays have small footprints in known corners).
- No prose extends past the body's `padding-right` (i.e. the viewport's right edge minus the body's right padding).
- No prose is positioned at `position: fixed` with off-screen coordinates.

Verify:
```js
const r = await page.evaluate(() => {
  const viewportW = window.innerWidth;
  const bodyPadR = parseFloat(
    getComputedStyle(document.body).paddingRight);
  const proseTags = ['p', 'li', 'h1', 'h2', 'h3', 'h4'];
  const offenders = [];
  document.querySelectorAll(proseTags.join(','))
    .forEach(el => {
      const r = el.getBoundingClientRect();
      // Skip elements inside floating overlays (intentional).
      if (el.closest('[data-ve-overlay]')) return;
      if (r.right > viewportW - bodyPadR + 1) {
        offenders.push({
          tag: el.tagName,
          right: r.right,
          textPreview: el.textContent.trim().slice(0, 30)
        });
      }
      // Ellipsis-on-prose check.
      const cs = getComputedStyle(el);
      if (cs.textOverflow === 'ellipsis'
          && (cs.overflow === 'hidden')
          && /^(P|LI|H[1-6])$/.test(el.tagName)) {
        offenders.push({
          tag: el.tagName, reason: 'ellipsis on prose',
          textPreview: el.textContent.trim().slice(0, 30)
        });
      }
    });
  return offenders;
});
// offenders MUST be empty.
```

### R36 — Diagrams: zoom / pan + draggable mini-map

Every `.ve-scene-graph` whose intrinsic size exceeds the viewport MUST mount:
- a zoom toolbar (zoom-in / zoom-out / fit-all / 1:1) — already shipped via `diagram.js:_buildToolbar`.
- a mini-map at bottom-right showing the full diagram with a draggable rectangle representing the current viewport — already shipped via `diagram.js:_buildMinimap`.
- drag-to-pan on the stage; wheel-to-zoom; pinch-to-zoom on touch (R30).

Verify:
```js
const r = await page.evaluate(() => {
  const hosts = document.querySelectorAll('.ve-scene-graph');
  return Array.from(hosts).map(h => ({
    hasToolbar: !!h.querySelector('.ve-scene-toolbar'),
    hasMinimap: !!h.querySelector('.ve-scene-minimap'),
    hasFrame: !!h.querySelector(
      '.ve-scene-minimap .ve-scene-minimap-frame'),
    hasStage: !!h.querySelector('.ve-scene-stage')
  }));
});
// each host MUST report all four true (when the diagram is in
// viewport mode; small inline diagrams are exempt).
```

### R37 — Font size readable (≥ 14 px body, ≥ 12 px chips)

**Body prose** MUST resolve to a computed `font-size` ≥ 14 px on the default viewport (1280 px width). **Mini chips** (decision-mini segments, badges, tag pills) MUST be ≥ 12 px. Fluid scales (`clamp(...)`) MUST clamp ≥ 14 px at the smallest defined viewport (320 px).

**Exemptions** — these classes are intentionally compact and NOT counted as body prose: `.vc-type-body-sm` (type-specimen example), `.ve-chart-legend-item` (chart legend labels), `.ve-badge`, `.ve-chip`, `.ve-footnote`, `.ve-caption`, `.ve-pnum`, plus any element with `data-ve-allow-small="1"`. Skills that need a sub-14 px UI label MUST use one of these classes (and document the intent) — never set `font-size: 12px` on a bare `<p>` or `<li>`.

Verify:
```js
const r = await page.evaluate(() => {
  const exemptSel =
    '.vc-type-body-sm, .ve-chart-legend-item, .ve-badge, '
    + '.ve-chip, .ve-footnote, .ve-caption, .ve-pnum, '
    + '[data-ve-allow-small="1"]';
  const proseSizes = [];
  document.querySelectorAll('p, li').forEach(el => {
    if (el.matches(exemptSel) || el.closest(exemptSel)) return;
    proseSizes.push(parseFloat(getComputedStyle(el).fontSize));
  });
  const minProse = proseSizes.length ? Math.min(...proseSizes) : 14;
  const chipSizes = [];
  document.querySelectorAll(
    '.ve-decision-mini-seg, .ve-badge, .ve-chip').forEach(el => {
    chipSizes.push(parseFloat(getComputedStyle(el).fontSize));
  });
  const minChip = chipSizes.length ? Math.min(...chipSizes) : 12;
  return { minProse, minChip,
           proseOk: minProse >= 14, chipOk: minChip >= 12 };
});
// proseOk AND chipOk MUST both be true.
```

### R38 — Live-page overlay: select TRUE HTML elements

When the runtime is loaded in overlay mode on a user's deployed website (per R24), the selection target MUST be the **actual HTML elements** of the page — every `<div>`, `<button>`, `<input>`, `<a>`, `<img>`, React/Vue component root, form control — NOT the plugin's `[data-ve-comment-id]` atoms (which don't exist on a third-party page). The overlay treats the whole DOM tree as a giant selectable surface and lets the user click any visible element to comment on it.

Specifically the overlay layer MUST:
- Highlight the element under the cursor with a dashed outline overlay (separate DOM, not mutating the host element).
- On click: add the element to the selection set (multi-click = multiple selections).
- The same comment-modal opens; same Done / Submit contract as report mode.
- The submission payload identifies each selected element by a stable best-effort selector that `document.querySelector(selector)` can round-trip back to the SAME element: tag + id + classes + nth-of-type + textContent prefix.

Verify (gated on `armOverlay` being shipped):
```js
const r = await page.evaluate(async () => {
  if (typeof window.amvcpOverlay?.armOverlay !== 'function') {
    return { applicable: false };
  }
  await window.amvcpOverlay.armOverlay();
  // Pick an arbitrary <div> on the host page.
  const target = document.querySelector('main div')
    || document.querySelector('body > div')
    || document.body.firstElementChild;
  if (!target) return { applicable: true, error: 'no target' };
  // Simulate hover → click via the overlay's API.
  window.amvcpOverlay._addSelectionForTest(target);
  const payload = window.amvcpOverlay.collectSubmission();
  await window.amvcpOverlay.disarmOverlay();
  // Round-trip the selector back to the same element.
  const roundTrip = payload.selections[0]
    && document.querySelector(payload.selections[0].selector);
  return {
    applicable: true,
    payloadCount: payload.selections.length,
    roundTripsToSameNode: roundTrip === target
  };
});
// when applicable: payloadCount >= 1 AND roundTripsToSameNode true.
```

### R39 — Pod summon gesture (desktop key combo + mobile 3-finger tap)

The pod (R27) is HIDDEN by default and MUST only become visible when the user invokes the summoning gesture. Invoking the gesture again hides it. The gesture MUST satisfy two constraints:

1. **Universal** — works on every supported platform: desktop (macOS + Windows + Linux), iOS mobile browsers (Safari, Chrome), Android mobile browsers (Chrome, Firefox).
2. **Non-conflicting** — never fires while the user is typing prose or code in any focusable input (`<input>`, `<textarea>`, `contenteditable`), and is not bound to any common browser shortcut.

**The chosen gesture** (cross-platform, non-conflicting):

- **Desktop keyboard**: `Ctrl+Shift+\` (or `Cmd+Shift+\` on macOS).
  - All three modifiers required → impossible to trigger by accident while typing.
  - Backslash is unbound in standard browser shortcut tables (Chrome / Firefox / Safari) and is rarely typed mid-prose.
  - Gated on `event.target` NOT being inside an `<input>` / `<textarea>` / `contenteditable` element, so the combo never preempts a code editor's own binding.
- **Mobile / tablet (no physical keyboard)**: **3-finger tap** on any non-input area of the viewport.
  - `touchstart` with `touches.length === 3` and `touchend` within 250 ms → toggle.
  - 1-finger = normal interaction, 2-finger = scroll / pinch, 3-finger = pod summon. No platform reserves 3-finger tap for typing or system gestures inside the viewport.
  - Gated on `event.target` NOT being inside any input / textarea / contenteditable.

The runtime exposes this gesture via a single handler `bindPodSummonGesture()` registered once on `window`. The handler is the SOLE way the pod becomes visible — there is no permanent always-visible UI affordance for it.

Verify:
```js
const r = await page.evaluate(() => {
  const handle = document.getElementById('ve-designmd-handle');
  if (!handle) return { error: 'pod not mounted' };
  // Pod starts hidden.
  const before = getComputedStyle(handle).visibility;
  // Synthesize the desktop combo (Ctrl+Shift+Backslash).
  const ev = new KeyboardEvent('keydown', { key: '\\',
    code: 'Backslash', ctrlKey: true, shiftKey: true,
    bubbles: true, cancelable: true });
  document.dispatchEvent(ev);
  // Re-check visibility.
  const after = getComputedStyle(handle).visibility;
  // Re-dispatch to hide.
  document.dispatchEvent(new KeyboardEvent('keydown', { key: '\\',
    code: 'Backslash', ctrlKey: true, shiftKey: true,
    bubbles: true, cancelable: true }));
  const final = getComputedStyle(handle).visibility;
  return { before, after, final,
           summonedShown: before === 'hidden' && after === 'visible',
           toggledHidden: after === 'visible' && final === 'hidden' };
});
// summonedShown AND toggledHidden MUST be true.
```

For mobile: the same `bindPodSummonGesture` handler registers `touchstart`/`touchend` listeners. Verification under mobile UA emulation dispatches a synthetic `TouchEvent` with 3 touches.

### R26 — Skill discoverability — SKILL.md declares modes + composability

Every `skills/<skill>/SKILL.md` MUST declare in its body:

- `description` (frontmatter) — the agent-facing trigger string
  (already required by the Anthropic plugin spec).
- A `## Modes` section listing which `data-ve-mode` values the
  skill supports. Example: the table skill supports `readonly` /
  `single` / `multi`; the gallery skill supports `readonly` /
  `single` / `multi` / `max-N`; an explanatory-diagram skill
  supports `readonly` only.
- A `## Composability` section noting whether the skill can
  coexist on a page with other skills (almost always YES; the
  one exception is the `overlay` runtime, which is exclusive
  because it owns the click layer).

These two sections let the agent (and a future planner skill)
discover what each skill is capable of WITHOUT reading every
runtime file. Missing either section = R26 violation.

Verify:
```bash
for f in skills/amvcp-*/SKILL.md; do
  grep -q '^## Modes' "$f" || echo "R26 missing Modes in $f"
  grep -q '^## Composability' "$f" \
    || echo "R26 missing Composability in $f"
done
```

## Verification protocol — run before claiming "fixed"

For ANY change that touches the runtime, the renderer, or a visualization skill, run this sequence:

1. **Tests**: `cd tests && python3 run-tests.py` — full suite must pass (current baseline 358/358; periodic flakes: animation IO timing + icon-svg hotspot positioning are known unrelated).
2. **CSS sanity**: walk R1-R17 above; run the embedded snippets; record results.
3. **Function / logic sanity**: walk R19-R26; run the embedded snippets. Pay special attention to R20 + R23 (decision pills appear ONLY on `data-ve-mode=choice*` hosts).
4. **Pod + UX sanity**: walk R27-R39; run the embedded snippets. Pay special attention to R27/R39 (pod mounted but hidden until the `Ctrl+Shift+\` / 3-finger-tap gesture summons it), R29 (3-state selection always overrides palette), R33 (corner action buttons remain on top of every surface), R34/R35 (no overlap / no truncation).
5. **Screenshot per area**: take a screenshot of the changed surface AND read it back. Don't trust "the diff looks right" — visual layout regressions hide in correct-looking diffs.
6. **Narrow viewport**: force `.ve-code-block { max-width: 400px }` (or similar narrowing for the relevant element) and verify wrap/responsive behavior. Also test the canonical R31 width matrix (320 / 375 / 414 / 768 / 1024 / 1280 / 1920 / 2560) for any page-level change.
7. **Both themes**: flip `data-ve-theme` between `light` and `dark`, screenshot both. For per-preset coverage (R29), iterate `amvcpTokens.PRESETS` and screenshot each.
8. **Interaction sequences**: for hover/click/drag features, use real mouse paths (`page.mouse.move(x, y, {steps: 8})`) — `el.click()` hides hover-state bugs. For touch (R30), use `page.emulate({mobile: true, hasTouch: true})`.
9. **Composability**: when a runtime change touches a skill that ships alongside others, re-run R22's composite-fixture check (`all-techniques-sample.html`) to confirm zero interference with other skills.
10. **iTerm pane**: if you opened a preview pane during testing, run `open_preview` again with `${ITERM_SESSION_ID##*:}` (the safeguard auto-closes the previous pane).

## Anti-patterns (NEVER do)

- Claim "fixed" without running the verify snippet for the affected rule.
- Use `el.click()` instead of real mouse paths for hover-bridge features.
- Add `overflow:auto` / `overflow:scroll` to any inner element (see R2).
- Hardcode pixel widths/heights for chips, segments, cells (use em / % / max-content — see R17).
- Use `data-ve-accent-dark` (low-contrast brown) for outlines on dark theme — use `--ve-accent` (warm gold) so the selection reads.
- Define a single set of color values "and the dark mode will figure it out" — the dark equivalent of a teal is brighter+desaturated, not just a brightness shift (see R1).
- Ship a snippet popup chip that uses `display:none` and pass it to `openCommentModal` as the anchor — connector line draws to (0,0). Use a transient anchor div instead (see R15).
- Add a hover-pill duplicate of the bubble handle. The bubble handle is the SOLE comment-entry affordance for atoms; tests use `window.__veOpenCommentModal(anchor)` directly.
- Open multiple iTerm preview panes from the same shell. The safeguard in `open_preview.applescript` closes any existing preview pane in the caller's tab before splitting again — bypassing it stacks panes.
- **Ship a page that loads `amvcp-runtime.js` but lacks the DESIGN.md pod** (see R27). The runtime MUST auto-mount the pod if `amvcp-designmd.js` is absent — never let a page render without it.
- **Show the pod by default** (see R27/R39). The pod is hidden until the user summons it with `Ctrl+Shift+\` (or `Cmd+Shift+\` on macOS) on desktop or a 3-finger tap on mobile. No permanent always-visible pod affordance is allowed.
- **Bind the pod summon gesture to a single modifier or to a letter that conflicts with text writing** (see R39). The combo must require all of Ctrl + Shift + non-letter (or Cmd + Shift + non-letter on macOS) so it can never fire while the user is typing prose / code. On mobile, the gesture must require exactly 3 simultaneous touches so it does not collide with text selection (1-2 touches).
- **Build a DESIGN.md preset that overrides the 3-state hover / selected delta** (see R29). The palette is yours to change; the brightness DIRECTION (darker in light, brighter in dark) and the hover glow are non-negotiable. Use `:where()` for DESIGN.md selectors to keep specificity 0,0,0 — the runtime's selection CSS must always win.
- **Mask the corner action buttons with a fullscreen slide / animation / video** (see R33). Pin those buttons at the top z-layer (`z-index: 2147483646`). The pod handle is exempt because it lives behind the summon gesture (R39).
- **Render a bitmap `<img>` without a 2× `srcset` descriptor** on a page that may be viewed on a Retina screen (see R32). For pure-vector content (SVG / canvas) this doesn't apply.
- **Lay out two skill surfaces so their bounding rects overlap** (see R34). The page is a single document scroll; each surface stacks below the previous. Only floating overlays (pod, modal, snippet popup, corner buttons) live on a separate z-layer with known small footprints.
- **Truncate prose with `text-overflow: ellipsis` or let a paragraph extend past the body's right padding** (see R35). Chips and badges can ellipsis; prose cannot.
- **Skip touch-event listeners on interactive surfaces** (see R30). Every `mousedown` / `mousemove` / `mouseup` handler that drives selection / panning / drag-paint must also register `touchstart` / `touchmove` / `touchend` counterparts.
- **Use `font-size` smaller than 14 px for body prose, or smaller than 12 px for chips** (see R37). Fluid scales must clamp ≥ 14 px at 320 px viewport.
- **Attach `.ve-decision-mini` on a host whose `data-ve-mode` is not a choice variant** (see R20/R23). The default is `readonly` — decision pills are an OPT-IN by the agent, not the runtime's default.
- **Render a skill's output as plain `<p>` text** when the skill's content type warrants structural DOM (see R19). A "colors" skill emits swatches, a "graph" skill emits `<svg>` nodes, etc.
- **Declare a choice host without a cardinality** (see R21). `data-ve-mode="choice"` alone is acceptable as a back-compat alias for `multi`, but new code SHOULD say `single`, `multi`, or `max-N` explicitly.
- **Race two skills on the same `data-ve-id` namespace** (see R22). Use per-skill prefixes (`scene-foo-1`, `chart-bar-2`, `gallery-baz-3`); never let two skills both assign `data-ve-id="3"`.
- **Mutate the host page's DOM in overlay mode** (see R24). Inject ONE overlay-root sibling; arm/disarm cleanly; never touch existing elements' classes or inline styles.
- **Submit a selection payload missing `id` + `text/label` + `kind`** (see R25). The agent cannot map the user's choice back to the source if any of these is missing.
- **Add a new skill without `## Modes` and `## Composability` sections in its SKILL.md** (see R26). Future planner skills need to discover what each skill can do without grepping runtime files.

## Modes

Not applicable — this is a rules/spec document, not a visual skill. It defines R1-R26 for the OTHER skills to follow. It does NOT emit DOM.

## Composability

Not applicable — this document is loaded by the developer/agent context, not by the runtime.

## See also

- `amvcp-iterm2-preview/SKILL.md` — pane lifecycle (open/close/screenshot)
- `amvcp-modal-comments/SKILL.md` — modal comment thread architecture
- `amvcp-math-and-latex/SKILL.md` — KaTeX + TikZJax usage details
- `amvcp-regex-vis/SKILL.md` — regex visualizer
- `amvcp-prose-pages/SKILL.md` — multi-click text selection chain
- `amvcp-graph-diagrams/SKILL.md` — Graphviz / Mermaid embedding
- Memory: `feedback_light_dark_themes.md` — the always-light-and-dark-themes rule
- Rule: `~/.claude/rules/no-nested-scrollbars.md` — the universal scroll rule
- Rule: `~/.claude/rules/browser-ui-test-techniques.md` — real-mouse-path testing patterns
