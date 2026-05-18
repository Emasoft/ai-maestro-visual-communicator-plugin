# CSS / interaction rules (R1-R18)

Universal CSS, layout, and direct-interaction rules every visualization MUST satisfy. Each rule includes the why, the contract, and a dev-browser snippet you can paste into `page.evaluate(...)` to verify conformance.

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

