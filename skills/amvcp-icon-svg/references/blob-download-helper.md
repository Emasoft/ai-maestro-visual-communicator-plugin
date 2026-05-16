# Single-SVG download helper — 6-line Blob + `<a download>`

A standalone helper to export a single inline SVG as a downloadable
`.svg` file. Six lines, no dependencies. The pattern mined from the
`10-svg-illustrations.html` reference demo. Useful for "Download
this figure" buttons next to icon-svg scenes.

## The 6-line helper

```js
function downloadSvg(svgEl, filename) {
  var src = new XMLSerializer().serializeToString(svgEl);
  var blob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
```

The 7th line (`URL.revokeObjectURL(a.href)`) cleans up the blob URL
after the download fires. Most browsers handle this automatically,
but cleaning up is good practice.

## Usage

```html
<figure class="isvg-figure">
  <svg class="isvg-scene" ...>
    <!-- compiled scene -->
  </svg>
  <button onclick="downloadSvg(this.previousElementSibling, 'logo.svg')">
    Download SVG
  </button>
</figure>
```

Or, more declaratively:

```html
<button data-download-svg="my-scene"
        onclick="downloadSvg(document.querySelector('[data-ve-id=\"my-scene\"]'), 'my-scene.svg')">
  Download
</button>
```

## Combined with the inline-style block pattern

For a TRULY portable download (correct colors when opened
standalone), combine with the embedded-style pattern from
`references/inline-style-block-export.md`:

```js
function downloadStandaloneSvg(scene, filename) {
  // 1. Compile the scene to an SVG string
  var svgString = window.amvcpIconSvg.buildSceneSvg(scene);

  // 2. Parse + inject embedded <defs><style> with live tokens
  var doc = new DOMParser().parseFromString(svgString, 'image/svg+xml');
  var svg = doc.documentElement;
  var defs = makeEmbeddedStyleDefs(document);
  svg.insertBefore(defs, svg.firstChild);

  // 3. Serialize + download
  var src = new XMLSerializer().serializeToString(svg);
  var blob = new Blob([src], { type: 'image/svg+xml;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function makeEmbeddedStyleDefs(srcDoc) {
  var rs = getComputedStyle(srcDoc.documentElement);
  var tokens = ['content','content-muted','content-subtle','surface',
                'canvas','border','border-strong','accent','on-accent',
                'success','warning','danger','info'];
  var lines = [':root {'];
  for (var i = 0; i < tokens.length; i++) {
    var name = '--vc-color-' + tokens[i];
    var v = rs.getPropertyValue(name).trim();
    if (v) lines.push('  ' + name + ': ' + v + ';');
  }
  lines.push('}');
  var defs = srcDoc.createElementNS('http://www.w3.org/2000/svg', 'defs');
  var style = srcDoc.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = lines.join('\n');
  defs.appendChild(style);
  return defs;
}
```

## Why a Blob, not a data URI?

For a small SVG, a `data:image/svg+xml;base64,...` URI would also
work. But:

1. **Blob URLs handle long content better.** A 50KB SVG (heavy scene
   with embedded styles + many primitives) blows past some browser
   URL length caps as a data URI.
2. **Blob URLs are revokeable.** `URL.revokeObjectURL(href)` frees
   the underlying buffer; a data URI lingers in the page until GC.
3. **Blob URLs are obvious to the browser as files.** A `<a
   href="blob:..."  download="x.svg">` triggers download
   immediately; a data URI sometimes opens in-page first.

## The MIME type

`'image/svg+xml;charset=utf-8'` — important to include the charset.
A bare `image/svg+xml` defaults to ASCII; an SVG with Unicode labels
(e.g. ° / Greek letters / non-ASCII filenames) might render broken
characters when opened on Windows / older Linux distros.

## Browser compatibility

- `XMLSerializer` — universally supported.
- `Blob` — universally supported.
- `URL.createObjectURL` / `URL.revokeObjectURL` — supported in all
  modern browsers (IE 11 supported the basics).
- `<a download>` — supported in Chrome / Firefox / Safari / Edge;
  unsupported in older Safari (the link will open the SVG instead
  of downloading).

For an older-Safari fallback, detect `'download' in
HTMLAnchorElement.prototype` and use `window.open(href, '_blank')`
instead.

## Filename suggestions

- Match the scene's `id` or `ariaLabel`:
  `slug(svg.dataset.veLabel || svg.dataset.veId) + '.svg'`
- Include a timestamp for versioning:
  `slug(label) + '-' + Date.now() + '.svg'`
- Suggest the kind: `'icon-' + label + '.svg'` for an icon, `'logo-'
  + label + '.svg'` for a logo.

## What NOT to do

- Do NOT skip the cleanup (`URL.revokeObjectURL`) — long-running
  pages accumulate blob URLs.
- Do NOT serialize a DETACHED SVG (one that was never appended to a
  document) — the cascade hasn't resolved, so `var(--vc-…)` won't
  have values. Render the SVG first, then serialize.
- Do NOT export an SVG without the embedded-style block if the
  destination is token-less — the colors will be wrong (the
  fallback hexes only).

## Visual verification

1. Click the Download button on a themed icon-svg figure.
2. Open the downloaded file directly in the browser.
3. Confirm the colors match what was visible inside the page.
4. Confirm the SVG renders at a reasonable size (the `viewBox` is
   `0 0 1000 1000`; the browser will scale to fit the window).

If colors are wrong, the embedded-style block wasn't injected or the
SVG was serialized before the cascade resolved. If the file
doesn't download but opens instead, the browser doesn't support `<a
download>` — fall back to `window.open`.
