# Each SVG carries its own `<defs><style>` block — standalone export

## Table of Contents

- [The pattern](#the-pattern)
- [Why this matters for icon-svg](#why-this-matters-for-icon-svg)
- [How to inject the embedded style at export time](#how-to-inject-the-embedded-style-at-export-time)
- [When this pattern is overkill](#when-this-pattern-is-overkill)
- [When to use this pattern](#when-to-use-this-pattern)
- [Cross-skill seam — chart skill also adopts this](#cross-skill-seam--chart-skill-also-adopts-this)
- [Visual verification](#visual-verification)
- [What NOT to do](#what-not-to-do)

A best practice mined from the `10-svg-illustrations.html` reference
demo: every authored SVG carries its own EMBEDDED `<defs><style>`
block so the SVG stands alone when downloaded or copied out of the
page. The `var(--vc-*)` tokens it references would otherwise resolve
to nothing outside the original page's stylesheet — embedding
fallback styles inline makes the SVG portable.

## The pattern

```html
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 1000 1000"
     class="isvg-scene">
  <defs>
    <style>
      /* Standalone fallback — applies ONLY when --vc-* tokens are
         unresolved (the embedding page hasn't loaded DESIGN.md). */
      :root {
        --vc-color-content: #1f1a14;
        --vc-color-accent:  #b8861f;
        --vc-color-surface: #ffffff;
        /* ... the 13 canonical tokens with their fallback hexes */
      }
    </style>
  </defs>
  <!-- The actual scene content -->
  <rect ... fill="var(--vc-color-accent, #b8861f)" ... />
</svg>
```

When the SVG is in the original page, the embedded `<style>` is
inert (the page's own stylesheet supplies the `--vc-*` tokens at the
root). When the SVG is DOWNLOADED or pasted into another context,
the embedded `<style>` becomes the authoritative source of the
tokens — and the SVG renders with the same theme as in the original
page.

## Why this matters for icon-svg

The icon-svg module's compiled SVG uses `var(--vc-color-*, <hex>)`
expressions with BAKED FALLBACK HEXES. So a downloaded SVG is
ALREADY portable — every fill / stroke has its fallback. But:

1. **The fallback hexes are the LIGHT theme defaults.** A DARK-theme
   SVG, when exported and dropped into a token-less page, falls back
   to LIGHT colors.
2. **The embedded `<style>` lets the export carry the ACTIVE theme.**
   At export time, inject a `<defs><style>:root{ ... }</style></defs>`
   that captures the CURRENTLY RESOLVED `--vc-*` values.

## How to inject the embedded style at export time

```js
function makeStandaloneSvg(scene) {
  var svgString = window.amvcpIconSvg.buildSceneSvg(scene);
  var doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  var svg = doc.documentElement;

  // Read the resolved tokens from the live document
  var rootStyle = getComputedStyle(document.documentElement);
  var tokens = [
    'content', 'content-muted', 'content-subtle',
    'surface', 'canvas', 'border', 'border-strong',
    'accent', 'on-accent', 'success', 'warning', 'danger', 'info'
  ];
  var lines = [':root {'];
  for (var i = 0; i < tokens.length; i++) {
    var name = '--vc-color-' + tokens[i];
    var val = rootStyle.getPropertyValue(name).trim();
    if (val) {
      lines.push('  ' + name + ': ' + val + ';');
    }
  }
  lines.push('}');

  // Build the <defs><style> and prepend
  var defs = doc.createElementNS('http://www.w3.org/2000/svg', 'defs');
  var style = doc.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = lines.join('\n');
  defs.appendChild(style);
  svg.insertBefore(defs, svg.firstChild);

  return new XMLSerializer().serializeToString(svg);
}
```

This produces an SVG with the live theme tokens BAKED IN — drop it
into any context and the colors stay correct.

## When this pattern is overkill

- If the icon-svg compiled SVG's BAKED HEX FALLBACKS are good
  enough for your export use case — they're the light-theme palette,
  which is the conventional default — skip the embedded style.
- If your export target is the SAME page (e.g. inline screenshot) —
  the tokens are already resolved.
- If your export target is a token-aware design tool that supports
  `--vc-*` custom properties (none currently do, but might) — skip.

## When to use this pattern

- Exporting an SVG to a different page (a blog post, a marketing
  doc, a slide deck).
- Generating a PNG / PDF via headless Chromium where the embedded
  style ensures correct colors.
- Downloading the SVG for the user (their browser, their OS) — see
  `references/blob-download-helper.md` for the 6-line export.
- Sharing the SVG via email / chat — the recipient sees the
  designed colors.

## Cross-skill seam — chart skill also adopts this

The chart skill (sibling skill in this plugin) also adopts the
embedded-style pattern for chart SVG exports. The HTML-effectiveness
mining flagged this as a HIGH-VALUE pattern for "each `.svg` carries
its own style block so download stands alone".

## Visual verification

Generate a standalone SVG via the export helper above. Open the SVG
file directly in a browser (NOT inside the original page). Confirm:

- Colors are present (not "currentColor only", not raw `#ccc`).
- Colors match the theme that was active at export time.
- The SVG renders identically to the inline version.

If colors are missing, the embedded `<style>` wasn't injected (or
the `var()` fallbacks weren't preserved).

## What NOT to do

- Do NOT manually edit the embedded `<style>` — generate it from the
  live `--vc-*` resolution.
- Do NOT include EVERY DESIGN.md token — only the ones the SVG
  actually uses. (The injected block above lists the 13 colors;
  add `--vc-font-*` / `--vc-radius-*` only if your SVG references
  them.)
- Do NOT skip the `:root` selector — the tokens MUST be defined on
  `:root` so they cascade to every element.
