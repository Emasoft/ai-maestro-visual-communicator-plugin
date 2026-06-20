# Sub-technique H1 — Author vs runtime authoring boundary

## Table of Contents

- [H1.1 The principle](#h11-the-principle)
- [H1.2 The author's input contract](#h12-the-authors-input-contract)
- [H1.3 The runtime's output contract](#h13-the-runtimes-output-contract)
- [H1.4 The contract enforces fail-soft](#h14-the-contract-enforces-fail-soft)
- [H1.5 The integrity-probe-friendly authoring rules](#h15-the-integrity-probe-friendly-authoring-rules)
- [H1.6 The runtime's responsibility surface](#h16-the-runtimes-responsibility-surface)
- [H1.7 What the author CAN customise](#h17-what-the-author-can-customise)
- [H1.8 What the author CANNOT customise](#h18-what-the-author-cannot-customise)
- [H1.9 The "post-render injection" escape hatch](#h19-the-post-render-injection-escape-hatch)
- [H1.10 The architectural reason for this discipline](#h110-the-architectural-reason-for-this-discipline)
- [H1.11 The author's authoring checklist](#h111-the-authors-authoring-checklist)
- [H1.12 No tokens consumed (this is a discipline reference)](#h112-no-tokens-consumed-this-is-a-discipline-reference)
- [H1.13 Cross-references](#h113-cross-references)

What the AUTHOR writes vs what the RUNTIME injects. The single most
important contract in this skill — get it wrong, and the integrity
probe, gutter, copy button, or selection model breaks silently.

## H1.1 The principle

> **The author writes plain semantic HTML. The runtime owns every
> visual decoration, every interaction marker, every per-line atom.**

The author MUST NOT hand-author:
- Any `<span class="ve-tok-*">` token span
- Any `<span class="ve-code-line">` per-line atom
- Any `<span class="ve-code-linenum">` gutter cell
- Any `<button class="ve-code-copy-btn">` copy button
- Any `data-ve-pressed` / `data-ve-preview` selection marker
- Any `--ve-code-indent` inline style
- Any `data-ve-block-id` auto-assignment

The runtime injects ALL of these. Hand-authoring them DEFEATS the
runtime's `initCodeGutter` guard (which refuses to re-wrap a `<code>`
whose children > 0) and causes silent visual / interaction breakage.

## H1.2 The author's input contract

For a CODE block, the author writes EXACTLY:

```html
<pre><code class="language-<id>">…plain source text…</code></pre>
```

That's it. Optional modifiers:
- `class="language-<id>"` OR `class="lang-<id>"` (CommonMark
  convention)
- `data-ve-lang="<id>"` (plugin-native, takes precedence)
- A wrapping `<div class="ve-code-panel-slate">…</div>` for the
  slate visual variant
- A wrapping `<div class="ve-blueprint">…</div>` for the blueprint
  variant
- `data-ve-no-gutter` to OPT OUT of runtime treatment

NOTHING ELSE is the author's input.

## H1.3 The runtime's output contract

After `initCodeGutter` runs, the DOM looks like:

```html
<div class="ve-code-block" data-ve-block-id="veblock-3" data-ve-line-count="7">
  <pre><code class="language-typescript">
    <span class="ve-code-line" data-ve-block-id="veblock-3" data-ve-line="1" style="--ve-code-indent: 2;">
      <span class="ve-code-linenum"></span>
      <span class="ve-code-content">
        <span class="ve-tok-keyword">function</span>
        <span class="ve-tok-function">hello</span>
        <span class="ve-tok-punctuation">(</span>
        name
        <span class="ve-tok-punctuation">)</span>
        <span class="ve-tok-punctuation">{</span>
      </span>
    </span>
    …
  </code></pre>
  <button type="button" class="ve-code-copy-btn" …>…SVG glyph…</button>
</div>
```

Every `<span>`, every `data-ve-*` attribute, every `style="--ve-code-
indent"` is runtime-injected. The author wrote ONLY the inner plain-
text source.

## H1.4 The contract enforces fail-soft

This contract makes the entire chain fail-soft:

- Author writes `<pre><code class="language-rust">…</code></pre>`.
  Rust is not registered. The tokenizer returns `null`. The runtime's
  `initCodeGutter` still runs: gutter + selection + copy button work
  on plain Rust source. NO ERROR — just no syntax color.

- Author hand-authors `<span class="ve-tok-keyword">function</span>`
  inside the `<code>`. The runtime detects `.children.length > 0` and
  SKIPS `initCodeGutter`. No gutter, no copy button, no selection —
  but no crash. The block renders the author's hand-wrapped spans
  as-is. (This is the failure path; the author should use the JS
  tokenizer instead.)

- Author writes a class name typo: `class="languag-js"` (missing the
  final `e`). `langFromClassName` returns null. The runtime's gutter
  still works; the tokenizer returns plain text. Block is plain.

Three different failure modes, three different degradations, ALL safe.

## H1.5 The integrity-probe-friendly authoring rules

The probe asserts source-fidelity AFTER tokenization. For the author
to never trigger a probe failure:

| Author rule | Why |
|---|---|
| Write plain text, NEVER token spans | Probe runs against the runtime+tokenizer's render; hand-author render not protected |
| Don't use HTML entities in the source (`&lt;` as a literal symbol) — write `<` directly | The runtime's text-content extraction sees the unescaped char; hand-entities would round-trip differently |
| Don't insert non-source whitespace (e.g. align tabs) — write what the file ACTUALLY contains | The probe asserts byte-match; "pretty" alignment that wasn't in source = probe failure |
| Trailing whitespace on a line: include it if the source has it; omit if not | Probe is strict |
| Trailing newline on the whole block: optional — `initCodeGutter` trims one trailing newline before splitting | Both conventions work |

## H1.6 The runtime's responsibility surface

The runtime ships:

- `initCodeGutter(pre)` — per-`<pre>` initializer, idempotent, owns
  the per-line wrap + gutter + copy button injection.
- `initAllCodeGutters()` — page-scan helper, runs on DOMContentLoaded.
- `injectStyles()` — emits all `.ve-code-*` and `.ve-tok-*` CSS into
  a single `<style>` tag.
- The tokenizer (`amvcp-code-highlight.js`) — called per-line from
  inside `initCodeGutter`.
- The selection model — drag-paint, multi-click ladder, comment-pill
  emission.
- The 3-state hover/select visual.

ALL OF THIS is hands-off for the author.

## H1.7 What the author CAN customise

- **The host page's CSS variables** — define `--ve-accent`,
  `--ve-slate-panel`, etc. on `:root` to re-theme.
- **DESIGN.md** — the canonical re-theming path; the engine writes
  `--vc-code-*` tokens that the bridge `--ve-code-*` consume.
- **Page-stylesheet rules that target the runtime's classes** — for
  example, adding a custom `.ve-blueprint > pre` rule, or styling the
  copy button differently. Discouraged; usually a token override is
  the right path.
- **Composition-level layout** — putting code blocks inside a 2-col
  grid, side-by-side with a sidebar, etc. The composition is the
  author's; the code block's internal layout is the runtime's.
- **The choice of language tag** (`data-ve-lang` vs class), the
  optional decorators (`ve-blueprint`, `ve-code-panel-slate`).

## H1.8 What the author CANNOT customise

- The per-line atom shape (`<span class="ve-code-line">`).
- The gutter cell shape (`<span class="ve-code-linenum">`).
- The wrap-marker stripe (managed by CSS background-image gradient).
- The 3-state hover/select visual (managed by `:has()` selectors).
- The selection drag-paint behaviour.
- The copy button position / glyph (without overriding the runtime's
  CSS — and even then, the SVG is the runtime's choice).
- The tokenizer's grammar (extensible only via `registerLanguage` in
  `amvcp-code-highlight.js`, not at the author level).

If a fixture needs a behaviour the runtime doesn't ship, the FIX is
to ADD it to the runtime (cleanly, after consultation), not to
override it locally.

## H1.9 The "post-render injection" escape hatch

In rare cases, a fixture needs to add a SECONDARY class to a
runtime-rendered token (e.g. mark one keyword as `ve-hl-focus` —
see [keyword-arrow-highlight.md](./keyword-arrow-highlight.md)).

The pattern: run a JS post-pass AFTER the runtime's `initAllCode
Gutters()` has run. The post-pass walks the rendered `.ve-tok-*`
spans and adds modifier classes:

```js
document.addEventListener('DOMContentLoaded', function () {
  // Wait for the runtime
  if (window.amvcpRuntime) window.amvcpRuntime.initAllCodeGutters();
  // Run our post-pass
  document.querySelectorAll('[data-ve-focus-token]').forEach(function (codeBlock) {
    var target = codeBlock.dataset.veFocusToken;
    codeBlock.querySelectorAll('.ve-tok-function').forEach(function (span) {
      if (span.textContent === target) span.classList.add('ve-hl-focus');
    });
  });
});
```

This is OPT-IN per code block (`data-ve-focus-token` attribute) and
ADDS a class to existing spans — it does NOT replace the runtime's
markup. The probe is unaffected (we're adding a class, not changing
text content). Safe.

## H1.10 The architectural reason for this discipline

The runtime is a SINGLE CONTRACT for every code block on every page.
Authors who hand-author markup create N-PAGE-specific contracts —
each one a maintenance liability, each one a surface for divergence.

By forbidding author-side markup customization, the runtime can be
upgraded (new tokens, new selection behaviour, new copy semantics)
WITHOUT breaking every page in the plugin. The cost is a small
loss of per-page flexibility; the gain is enormous: a single
runtime upgrade re-themes / re-features every code block on every
page.

This is the same architectural pattern as `--vc-*` tokens (one
source of truth for color/space/typography), `data-ve-table` (one
runtime for table modes), `data-ve-id` (one selection model). The
code-highlight category honours the pattern.

## H1.11 The author's authoring checklist

Before publishing a fixture with code blocks, verify:

- [ ] Every `<pre>` has a plain-text `<code>` child (no per-line
      spans, no inline highlights)
- [ ] Every `<code>` declares a language (or explicitly leaves it
      undeclared for plain text)
- [ ] No `<span class="ve-tok-*">` or `<span class="ve-code-line">`
      anywhere in author markup
- [ ] No `data-ve-pressed` or `data-ve-preview` attributes — these
      are runtime state
- [ ] No `style="--ve-code-indent"` inline — runtime computes it
- [ ] No `<button class="ve-code-copy-btn">` — runtime injects it
- [ ] Page loads the three scripts in order: `amvcp-designmd.js` →
      `amvcp-runtime.js` → `amvcp-code-highlight.js` (+ CSS)

If all check out, the runtime will do the right thing.

## H1.12 No tokens consumed (this is a discipline reference)

This reference defines the AUTHORING CONTRACT — no theming surface
of its own.

## H1.13 Cross-references

- [tokenizer-contract.md](../../amvcp-code-syntax-engine/references/tokenizer-contract.md) — what the tokenizer
  promises
- [gutter-anatomy.md](../../amvcp-code-syntax-engine/references/gutter-anatomy.md) — what the gutter looks like
- [integrity-probe.md](../../amvcp-code-syntax-engine/references/integrity-probe.md) — the source-fidelity
  guarantee
- [opting-out-pre.md](../../amvcp-code-fences/references/opting-out-pre.md) — when to escape the
  runtime entirely
