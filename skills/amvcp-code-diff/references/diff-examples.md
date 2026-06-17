# Code Diff — worked examples

Concrete copy-paste starting points for the two most common diff shapes.

## Table of Contents

- [Example 1 — unified diff](#example-1--unified-diff)
- [Example 2 — split diff with PR comment bubble](#example-2--split-diff-with-pr-comment-bubble)

## Example 1 — unified diff

```html
<pre data-ve-code="auto" data-ve-lang="diff"><code>
@@ -10,3 +10,3 @@
-const max = 100;
+const max = 200;
 console.log(max);
</code></pre>
```

The `language-diff` tokenizer colors the leading `+ / − / @@` markers;
per-line `data-ve-diff` is inferred from those markers.

## Example 2 — split diff with PR comment bubble

```html
<div data-ve-diff="split" data-ve-base="server.py@HEAD~1" data-ve-head="server.py">
  <pre data-ve-code="auto" data-ve-lang="py" data-ve-side="base"><code>...</code></pre>
  <pre data-ve-code="auto" data-ve-lang="py" data-ve-side="head"><code>...</code></pre>
</div>
<div class="ve-pr-bubble" data-ve-anchor-line="42">
  <strong>@reviewer</strong> please verify the new max isn't beyond the API quota.
</div>
```

The bubble's `::before` rotates-square anchor lands on line 42 of the
head side.
