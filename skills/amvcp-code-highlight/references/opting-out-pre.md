# Sub-technique H2 — Opting a `<pre>` out of the runtime (`data-ve-no-gutter`)

The escape hatch: when a `<pre>` should NOT receive the gutter, copy
button, selection, or tokenizer treatment. Mostly for special-purpose
elements (overlay snippets, regex graph) that have their own renderers.

## H2.1 The attribute

```html
<pre data-ve-no-gutter><code>…this stays plain…</code></pre>
```

OR on any ancestor:

```html
<div data-ve-no-gutter>
  <pre><code>…all <pre>s under this div stay plain…</code></pre>
</div>
```

The runtime's `initCodeGutter` checks BOTH the `<pre>` itself AND
`closest('[data-ve-no-gutter]')` — opt-out propagates from any
ancestor.

## H2.2 When to opt out

| Reason to opt out | Why the runtime would otherwise misbehave |
|---|---|
| The `<pre>` is INSIDE the regex graph (`.ve-regex`) | The regex skill has its own per-token renderer — the runtime's tokenizer would double-render |
| The `<pre>` is in an overlay popup (a snippet preview in a comment bubble) | Overlay popups should be minimal; the gutter / copy button add visual noise |
| The author is using the 4-class inline hand-wrap (see [inline-4class-handwrap.md](./inline-4class-handwrap.md)) | `<code>.children.length > 0` would make the runtime skip anyway, but the explicit opt-out is clearer |
| The `<pre>` is data (CSV / TSV) not code, and the file-path / language-tag conventions don't apply | Treats the `<pre>` as a quoted data block instead of source code |
| The `<pre>` is generated content (e.g. test output, log lines) | No need for syntax color or copy button |
| The `<pre>` is a tiny inline figure (a single ASCII-art diagram) | Gutter overlay would crowd a small block |

## H2.3 What opting out preserves

- The `<pre>`'s default browser styling (`white-space: pre`, monospace).
- Native browser text-selection (drag to select).
- Native browser copy (Ctrl+C, ⌘C).

## H2.4 What opting out loses

- The CSS-counter line-number gutter
- The floating SVG copy button
- The per-line atom selection model
- The 3-state hover/select visual
- The wrap-marker stripe
- Syntax color (the tokenizer is never called)
- Hanging-indent wrap behaviour
- The runtime's selection-yield CSS

In short: the `<pre>` becomes a plain HTML `<pre>` with no plugin
treatment.

## H2.5 The runtime's check

From `scripts/amvcp-runtime.js → initCodeGutter`:

```js
function initCodeGutter(pre) {
  if (pre.__veGutterInit) return;
  if (pre.matches('[data-ve-no-gutter]')) return;
  if (pre.closest('[data-ve-no-gutter]')) return;
  if (pre.closest('.ve-regex')) return; // regex graph never gets a gutter
  if (pre.closest('[data-ve-overlay], [data-ve-snippet-popup]')) return;
  // … rest of init …
}
```

Five conditions trigger opt-out:
1. Already initialized (`pre.__veGutterInit`).
2. `data-ve-no-gutter` on the `<pre>` itself.
3. `data-ve-no-gutter` on any ancestor.
4. Inside a `.ve-regex` (the regex graph skill).
5. Inside `[data-ve-overlay]` or `[data-ve-snippet-popup]` (overlay
   surfaces).

(4) and (5) are HARDCODED opt-outs for specific composition contexts.
The author doesn't need to add `data-ve-no-gutter` to a `<pre>` inside
the regex graph — it's automatic.

## H2.6 Opt-out and `data-ve-snippet-popup`

The runtime's snippet-popup (a small floating preview shown when
hovering certain link targets) renders a `<pre>` in a minimal style.
The popup is small (~200×60px), can't accommodate the gutter +
copy button without crowding. The hardcoded opt-out keeps it minimal.

Authors writing a custom popup of their own (a different floating
preview surface) should add `data-ve-snippet-popup="1"` on the popup
container — the runtime's check picks it up automatically.

## H2.7 The opt-out vs the data-block discipline

For a `<pre>` containing CSV / TSV / JSON-as-text data:

| Pattern | Use when… |
|---|---|
| `<pre data-ve-no-gutter>` | The data is INLINE, illustrative, ≤ 10 lines |
| `<pre><code class="language-json">` (NO opt-out) | The data IS source-of-truth, the reader should copy it as JSON, syntax-color helps |
| `<pre><code class="language-csv">` | CSV: not currently a registered language → block renders plain; gutter / copy still work. The opt-out is unnecessary; the language stays null and the block degrades safely. |

The default (don't opt out) is correct for most data blocks. Use
opt-out only when the runtime treatment IS the problem.

## H2.8 The author's mental model

Default: `<pre><code class="language-x">…</code></pre>` — the runtime
takes over.

Opt out: `<pre data-ve-no-gutter>…</pre>` — the runtime stays away.

That's the whole decision tree. There is NO middle ground — partial
runtime treatment (e.g. "give me the gutter but not the copy button")
is NOT supported by design. The runtime's chrome ships as one unit.

If a fixture genuinely needs partial treatment (rare), the right path
is opt-out + manual addition of the wanted pieces. But this is almost
never the right answer; usually the right answer is "use the runtime
fully" or "use it not at all".

## H2.9 Selection / commenting on opt-out blocks

An opted-out `<pre>` has NO comment pill, NO per-line selection. The
user can drag-select text via the browser's native selection; copy via
the browser's native shortcut.

For commenting: the prose CONTAINING the opt-out block should anchor
the comment ("see the example above"). The opt-out block IS NOT a
comment target itself.

## H2.10 Re-opting-in

A `<pre>` that initially opted out can be re-opted-in by:
1. Removing `data-ve-no-gutter`.
2. Running `initCodeGutter(pre)` manually (or letting the next
   page-scan pick it up).

This is rare — opt-out is usually a permanent decision. But the
runtime's idempotence + the dynamic re-init dance (see
[click-step-to-code-panel.md](./click-step-to-code-panel.md) §G1.5)
make re-opt-in possible for fixtures that need it.

## H2.11 The opt-out hierarchy

If a `<pre>` is opt-out via ancestor `data-ve-no-gutter`, NO `<pre>`
under that ancestor receives runtime treatment. This means: opt-out is
COARSE-grained (whole subtrees, not selective).

For SELECTIVE opt-out (one `<pre>` in a subtree opted out, others
opted in), put the attribute on the SPECIFIC `<pre>` you want to opt
out.

## H2.12 No tokens consumed

`data-ve-no-gutter` is a behavioural opt-out, no theming surface.

## H2.13 Author rules

| Rule | Why |
|---|---|
| Use `data-ve-no-gutter` ONLY when the runtime treatment is the problem | Default treatment is correct for ~95% of blocks |
| Don't opt out to "save space" | Wrap is the right answer for narrow viewports, not opt-out |
| Don't opt out to "avoid the copy button" | The button is opacity:0.4 at rest — barely visible until hover. Not crowding. |
| Don't opt out and then re-implement gutter manually | One of: trust the runtime fully, or stay out of the way. Don't recreate it. |
| Do opt out for overlay snippets, regex graphs, ASCII figures | These have specialized renderers / minimal-chrome needs |
