# Sub-technique G1 — Click SVG step → side-panel with code excerpt

## Table of Contents

- [G1.1 The pattern](#g11-the-pattern)
- [G1.2 The detail map](#g12-the-detail-map)
- [G1.3 The SVG markup](#g13-the-svg-markup)
- [G1.4 The right panel markup](#g14-the-right-panel-markup)
- [G1.5 The click handler](#g15-the-click-handler)
- [G1.6 The `.active` SVG style](#g16-the-active-svg-style)
- [G1.7 The 3-marker edge approach (diagram-side)](#g17-the-3-marker-edge-approach-diagram-side)
- [G1.8 Selection / commenting on the right-panel code](#g18-selection--commenting-on-the-right-panel-code)
- [G1.9 Default state (no node selected)](#g19-default-state-no-node-selected)
- [G1.10 Light + dark verification](#g110-light--dark-verification)
- [G1.11 Tokens consumed](#g111-tokens-consumed)
- [G1.12 Author rules](#g112-author-rules)
- [G1.13 Mined source attribution](#g113-mined-source-attribution)

The diagram-adjacent code pattern: click any node in an SVG flowchart
→ populate a sticky right-side detail panel with title + meta + prose
+ `<pre>` code excerpt. Mined from `13-flowchart-diagram.html` (html-
effectiveness catalog #13).

Mined catalog quote: *"The 'click SVG node → detail panel + code
snippet' is a much better UX for a flowchart than a static image. Our
`amvcp-diagram` runtime should support this pattern."*

## G1.1 The pattern

The page has TWO panes:

1. **Left:** an SVG flowchart with N nodes (rectangles for processes,
   diamonds for decisions, paths for edges). Each node carries a
   `data-k` attribute keying into a JS detail map.
2. **Right:** a sticky-positioned `<aside>` showing the currently
   selected step's: title, meta (`github actions · ~2 min`), prose
   body, and a `<pre>` code excerpt of the YAML / manifest / shell
   script that runs at that step.

Clicking a node:
- Marks the node `.active` (thickens its stroke to 2px clay).
- Looks up the node's `data-k` in the detail map.
- Re-renders the right panel.

## G1.2 The detail map

```js
var DETAIL = {
  push: {
    title: 'git push',
    meta: 'developer · 1 sec',
    body: 'Developer pushes to a feature branch. GitHub fires the push event.',
    code: {
      lang: 'bash',
      text: 'git push origin feature/jwks-auth'
    }
  },
  ci: {
    title: 'CI pipeline',
    meta: 'github actions · ~2 min',
    body: 'GitHub Actions runs the test matrix and the lint pass. Failures block the merge.',
    code: {
      lang: 'yaml',
      text: 'name: CI\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm ci\n      - run: npm test'
    }
  },
  // … more steps …
};
```

Keys (`push`, `ci`) match the `data-k` attribute on each SVG node.

## G1.3 The SVG markup

The SVG is OWNED by `amvcp-diagram`. The code-highlight skill's
responsibility is the RIGHT PANEL and the detail-map machinery; the
SVG is a separate concern.

But the integration point is:

```html
<svg class="ve-flowchart">
  <rect data-k="push" x="20" y="40" width="120" height="50" rx="10" />
  <text x="80" y="70" text-anchor="middle">git push</text>
  …
  <rect data-k="ci"   x="200" y="40" width="120" height="50" rx="10" class="active" />
  <text x="260" y="70" text-anchor="middle">CI pipeline</text>
  …
</svg>
```

The `data-k` matches the detail-map keys.

## G1.4 The right panel markup

```html
<aside class="ve-side-detail">
  <h3 class="ve-side-detail__title" id="detail-title">git push</h3>
  <p class="ve-side-detail__meta" id="detail-meta">developer · 1 sec</p>
  <div class="ve-side-detail__body" id="detail-body">
    <p>Developer pushes to a feature branch. GitHub fires the push event.</p>
  </div>
  <div class="ve-side-detail__code">
    <div class="ve-code-block">
      <pre><code class="language-bash" id="detail-code">git push origin feature/jwks-auth</code></pre>
    </div>
  </div>
</aside>
```

CSS:

```css
.ve-side-detail {
  position: sticky;
  top: 24px;
  align-self: start;
  width: 320px;
  padding: 16px 18px;
  border: 1px solid var(--vc-color-neutral-300);
  border-radius: 12px;
  background: var(--vc-color-neutral-50);
}
.ve-side-detail__title {
  margin: 0 0 4px;
  font-size: var(--vc-text-lg);
}
.ve-side-detail__meta {
  color: var(--vc-color-neutral-500);
  font-family: var(--vc-font-mono);
  font-size: var(--vc-text-small);
  margin: 0 0 12px;
}
.ve-side-detail__body { margin-bottom: 12px; }
```

## G1.5 The click handler

```js
document.querySelectorAll('.ve-flowchart [data-k]').forEach(function (node) {
  node.style.cursor = 'pointer';
  node.addEventListener('click', function () {
    var k = node.dataset.k;
    var d = DETAIL[k];
    if (!d) return;
    // Mark active
    document.querySelectorAll('.ve-flowchart .active').forEach(function (el) {
      el.classList.remove('active');
    });
    node.classList.add('active');
    // Populate panel
    document.getElementById('detail-title').textContent = d.title;
    document.getElementById('detail-meta').textContent  = d.meta;
    document.getElementById('detail-body').innerHTML    = d.body;   // d.body is HTML
    var codeEl = document.getElementById('detail-code');
    codeEl.textContent = d.code.text;
    codeEl.className   = 'language-' + d.code.lang;
    // Re-run the runtime's gutter + tokenizer on the updated <code>
    var pre = codeEl.parentElement;
    pre.__veGutterInit = false;   // force re-init
    pre.innerHTML = pre.innerHTML;  // shake the DOM to re-parent
    if (window.amvcpRuntime && window.amvcpRuntime.initCodeGutter) {
      window.amvcpRuntime.initCodeGutter(pre);
    }
  });
});
```

The re-init dance (`pre.__veGutterInit = false`, etc.) is needed
because `initCodeGutter` is normally one-shot per `<pre>` — to swap
the code content and re-tokenize, we have to RESET the init flag.

A future runtime API might expose a cleaner `reInitCodeBlock(pre,
{ source, lang })` helper. For now, this dance is the integration
contract.

## G1.6 The `.active` SVG style

```css
.ve-flowchart [data-k] {
  fill: var(--vc-color-neutral-50);
  stroke: var(--vc-color-neutral-500);
  stroke-width: 1.2;
  transition: stroke 120ms ease, stroke-width 120ms ease;
}
.ve-flowchart [data-k].active {
  stroke: var(--ve-accent);
  stroke-width: 2.5;
}
```

Subtle visual difference — the active node's stroke thickens + tints
clay. Reader's eye easily tracks "which step am I reading about now?"

## G1.7 The 3-marker edge approach (diagram-side)

The diagram skill ships THREE arrowhead `<marker>` definitions:

- `#arrow` — default gray edges
- `#arrow-olive` — success path edges
- `#arrow-rust` — failure path edges

Edge labels are mono-text. Mined from the catalog — the 3-marker
approach lets edges be color-coded per-semantic without per-edge
inline marker-end strings.

## G1.8 Selection / commenting on the right-panel code

The right panel's `<pre>` is a normal runtime-managed `.ve-code-
block`. Lines are selectable, copy button works, comment pill anchors.

Comment payload includes the active step's `data-k` so the agent
knows the reader is asking about "step `ci`'s code excerpt".

## G1.9 Default state (no node selected)

On page load, an INITIAL step should be selected — typically the FIRST
node (the start of the flow). The detail map's first entry populates
the panel.

```js
// At init
(function () {
  var firstNode = document.querySelector('.ve-flowchart [data-k]');
  if (firstNode) firstNode.click();    // simulate click on the first node
})();
```

Don't render "no step selected" as the initial state — empty panel is
confusing.

## G1.10 Light + dark verification

- [ ] SVG nodes (rectangles, diamonds) readable on both themes
- [ ] Active state (clay stroke + thicker) visible on both themes
- [ ] Side panel border + bg distinct from page on both themes
- [ ] Code excerpt readable on both themes
- [ ] Click → re-render → tokenize works on both themes (verify the
      tokenization survives the DOM shake)

## G1.11 Tokens consumed

- `--ve-accent` — active state colour
- `--vc-color-neutral-50` / `-300` / `-500` — panel bg / border /
  meta text
- `--vc-text-lg` / `--vc-text-small` / `--vc-font-mono` — typography
- All from runtime's code-block CSS for the embedded code excerpt

## G1.12 Author rules

| Rule | Why |
|---|---|
| The detail map MUST contain every node the SVG has a `data-k` for | Click on an unmapped node = silent no-op = bug |
| The right panel MUST be sticky (`position: sticky; top: 24px`) | The user scrolls through the diagram; the panel stays in view |
| Pre-select the FIRST node on init | Avoid empty-panel UX |
| Use the runtime's gutter on the right panel's `<pre>` | Selection / copy / commenting come for free |
| Pair with the diagram skill's 3-marker arrow approach | Visual semantics for success / failure / default paths |
| For very long diagrams, narrow the SVG viewBox so the diagram fits the viewport AND make panel responsive | Always honour no-nested-scrollbars |

## G1.13 Mined source attribution

Catalog quote, source `13-flowchart-diagram.html`:

> *"A deploy pipeline drawn as a real SVG flowchart … Clicking any
> node populates a sticky right-side detail panel with: title, meta
> (`github actions · ~2 min`), prose body, and a `<pre>` code snippet
> (excerpt of the YAML/manifest that runs at that step). The clicked
> node gets a `.active` class that thickens its stroke to 2px clay."*

Adopted as a code-highlight composition with diagram dependencies.
