# Examples — code-syntax authoring snippets

## Table of Contents

- [Example 1 — basic syntax highlight](#example-1--basic-syntax-highlight)
- [Example 2 — code block with a file-path header](#example-2--code-block-with-a-file-path-header)
- [Example 3 — inline code chip in prose](#example-3--inline-code-chip-in-prose)

## Example 1 — basic syntax highlight

```html
<pre data-ve-code="auto" data-ve-lang="js"><code>
const greet = (name) => `Hello, ${name}!`;
</code></pre>
```

Loads `amvcp-code-highlight.js` which tokenises on `DOMContentLoaded` and
stamps `.ve-tok-keyword`, `.ve-tok-string`, `.ve-tok-fn` spans. Gutter,
copy button and wrap-marker are added automatically.

## Example 2 — code block with a file-path header

```html
<pre data-ve-code="auto" data-ve-lang="yaml"><code><span class="path">infra/config/workers.yaml</span>
queue:
  name: jobs
  visibility_timeout_seconds: 30
</code></pre>
```

The `<span class="path">` header pattern marks the file provenance; see
[code-block-with-file-path](code-block-with-file-path.md).

## Example 3 — inline code chip in prose

```html
<p>Run <code class="inline">npm test</code> to verify.</p>
```

A short mono chip with bg + 4px radius; see
[inline-code-chip](inline-code-chip.md).
