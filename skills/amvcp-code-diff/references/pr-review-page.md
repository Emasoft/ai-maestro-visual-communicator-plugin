# Sub-technique E3 — PR review page composition

## Table of Contents

- [E3.1 The shape](#e31-the-shape)
- [E3.2 The header](#e32-the-header)
- [E3.3 The risk-map chips](#e33-the-risk-map-chips)
- [E3.3b The risk legend](#e33b-the-risk-legend)
- [E3.4 The per-file diff card](#e34-the-per-file-diff-card)
- [E3.4b The per-file risk-tag badge](#e34b-the-per-file-risk-tag-badge)
- [E3.5 The comment bubble — `::before` rotated-square trick](#e35-the-comment-bubble--before-rotated-square-trick)
- [E3.6 Anchoring comments to line numbers](#e36-anchoring-comments-to-line-numbers)
- [E3.7 Collapsed safe files](#e37-collapsed-safe-files)
- [E3.8 The next-steps checklist](#e38-the-next-steps-checklist)
- [E3.9 Cross-references](#e39-cross-references)
- [E3.10 Light + dark verification](#e310-light--dark-verification)
- [E3.11 Tokens consumed](#e311-tokens-consumed)
- [E3.12 Mined source attribution](#e312-mined-source-attribution)

The reviewer-facing pull-request review page. Mined verbatim from
`03-code-review-pr.html` (html-effectiveness catalog #3). The
canonical reviewer-side composition.

## E3.1 The shape

A reviewer-facing PR-review page has six sections, top to bottom:

1. **Header.** Author avatar + branch name + +N / −N stat (compact).
2. **What this PR does** (prose summary list — 3-5 bullets, ≤ 1 line
   each).
3. **Risk-map chips** (color-coded chips, one per file, clicking jumps
   to the file's card and pulses).
4. **Per-file diff cards** (a card per touched file: file-path label +
   diff + margin-anchored comment bubbles).
5. **Collapsed safe files** (`<details>` containing low-risk files
   — diff cards inside).
6. **Suggested next steps** (`<input type="checkbox">` checklist).

## E3.2 The header

```html
<header class="ve-pr-header">
  <img class="ve-pr-header__avatar" src="…author avatar…" alt="Author avatar">
  <div class="ve-pr-header__title">
    <h1>Migrate auth middleware to JWKS</h1>
    <div class="ve-pr-header__meta">
      <code class="inline">feature/jwks-auth</code>
      <span class="ve-pr-header__stat ve-pr-header__stat--add">+247</span>
      <span class="ve-pr-header__stat ve-pr-header__stat--del">−89</span>
    </div>
  </div>
</header>
```

Compact, scannable, mono-font for the branch name. The +/− stats use
the olive (add) / rust (del) semantic colors.

## E3.3 The risk-map chips

A horizontal row of chips, one per touched file. Each chip is:

```html
<a href="#file-auth-middleware" class="ve-pr-chip ve-pr-chip--attention"
   data-ve-link-to-card="file-auth-middleware">
  <span class="ve-pr-chip__name">middleware.ts</span>
  <span class="ve-pr-chip__risk">⚠ TRUST</span>
</a>
```

Three classes, each keyed to one risk role token (the SAME three the
legend in E3.3b and the per-file tags in E3.4b consume):
- `.ve-pr-chip--attention` (`--ve-accent`, clay) — high-risk, needs
  careful review (TRUST boundary, security-sensitive)
- `.ve-pr-chip--medium` (`--vc-color-warning`, amber) — meaningful
  change, routine review. A dedicated warning role, NOT a reuse of oat,
  so "worth a look" has its own hue
- `.ve-pr-chip--safe` (`--vc-color-success`, olive) — refactor,
  type-fix, comment-change

Click handler scrolls to the file card AND adds a 1.4s pulse outline:

```js
document.querySelectorAll('[data-ve-link-to-card]').forEach(function (chip) {
  chip.addEventListener('click', function (ev) {
    var id = chip.dataset.veLinkToCard;
    var target = document.getElementById(id);
    if (!target) return;
    ev.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--ve-accent) 35%, transparent)';
    setTimeout(function () { target.style.boxShadow = ''; }, 1400);
  });
});
```

Mined catalog quote: *"`target.style.boxShadow = '0 0 0 3px
rgba(217,119,87,0.35)'; setTimeout(…remove, 1400)` — draws the eye
after a smooth-scroll lands."* — adopted verbatim, just with the token
color.

## E3.3b The risk legend

The three chip colors are meaningless until the reader is told what
they decode to. Add a one-line legend immediately beneath the chip
row — a horizontal strip of swatch + label pairs, one per risk class,
in the SAME order and the SAME tokens as the chips:

```html
<div class="ve-pr-risk-legend" aria-label="Risk legend">
  <span class="ve-pr-risk-legend__item ve-pr-risk-legend__item--attention">
    <span class="ve-pr-risk-legend__dot"></span>needs attention
  </span>
  <span class="ve-pr-risk-legend__item ve-pr-risk-legend__item--medium">
    <span class="ve-pr-risk-legend__dot"></span>worth a look
  </span>
  <span class="ve-pr-risk-legend__item ve-pr-risk-legend__item--safe">
    <span class="ve-pr-risk-legend__dot"></span>safe
  </span>
</div>
```

```css
.ve-pr-risk-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--vc-space-3, 12px);
  margin-block: var(--vc-space-2, 8px) var(--vc-space-4, 16px);
  font-size: var(--vc-text-0, 11px);
  color: var(--vc-color-content-muted, #5b5343);
}
.ve-pr-risk-legend__item { display: inline-flex; align-items: center; gap: 6px; }
.ve-pr-risk-legend__dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--ve-risk-color);
}
/* One declaration per class — light/dark mirror automatically because
   the value is a role token, re-resolved per theme. Reuses the exact
   three risk roles the chips (E3.3) and risk-tags (E3.4b) key off, so
   the legend can never drift from what it decodes. */
.ve-pr-risk-legend__item--attention { --ve-risk-color: var(--ve-accent); }
.ve-pr-risk-legend__item--medium    { --ve-risk-color: var(--vc-color-warning, #a8791f); }
.ve-pr-risk-legend__item--safe      { --ve-risk-color: var(--vc-color-success, #3a6b5c); }
```

Keying every risk surface (chip, legend dot, per-file tag) off the
same three role tokens via one `--ve-risk-color` custom property means
a single DESIGN.md theme swap re-tints all of them in lockstep — the
legend is structurally incapable of disagreeing with the chips.

## E3.4 The per-file diff card

Each file gets a card:

```html
<article class="ve-pr-file-card" id="file-auth-middleware">
  <header class="ve-pr-file-card__head">
    <span class="ve-pr-file-card__icon">[icon]</span>
    <span class="ve-pr-file-card__path">src/auth/middleware.ts</span>
    <span class="ve-pr-file-card__stat ve-pr-file-card__stat--add">+47</span>
    <span class="ve-pr-file-card__stat ve-pr-file-card__stat--del">−12</span>
    <span class="ve-pr-file-card__badge ve-pr-file-card__badge--modified">modified</span>
  </header>

  <div class="ve-pr-file-card__diff">
    <div class="ve-code-block" data-ve-diff-gutter="twin">
      <pre><code class="language-diff">@@ -42,7 +42,8 @@ function authMiddleware …</code></pre>
    </div>
  </div>

  <aside class="ve-pr-file-card__comments">
    <div class="ve-pr-comment" data-ve-anchor-line="42">
      <div class="ve-pr-comment__head">
        <strong>@reviewer</strong>
        <span class="ve-pr-comment__time">2h ago</span>
      </div>
      <p>Should we cache the JWKS response? This will hit the network
         on every request.</p>
    </div>
  </aside>
</article>
```

The card is a grid with the diff on the left and comments on the
right (or stacked vertically on narrow viewports).

## E3.4b The per-file risk-tag badge

The chip-nav (E3.3) tells the reader a file's risk *before* they reach
it; the risk-tag repeats that signal *at* the card so the reader who
scrolled past the chips still sees it. It is OPTIONAL and distinct from
the new/mod/del **status** badge already on the header — status answers
"what kind of change", risk-tag answers "how much care this needs".

```html
<header class="ve-pr-file-card__head">
  <span class="ve-pr-file-card__icon">[icon]</span>
  <span class="ve-pr-file-card__path">src/auth/middleware.ts</span>
  <span class="ve-pr-file-card__stat ve-pr-file-card__stat--add">+47</span>
  <span class="ve-pr-file-card__stat ve-pr-file-card__stat--del">−12</span>
  <span class="ve-pr-file-card__badge ve-pr-file-card__badge--modified">modified</span>
  <span class="ve-pr-risk-tag ve-pr-risk-tag--attention">needs attention</span>
</header>
```

```css
.ve-pr-risk-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.02em;
  /* tag color comes from the shared risk role; the soft fill is a
     color-mix wash of the same token so it tints itself per theme. */
  color: var(--ve-risk-color);
  background: color-mix(in srgb, var(--ve-risk-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--ve-risk-color) 30%, transparent);
}
.ve-pr-risk-tag::before {
  content: "";
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--ve-risk-color);
}
/* Same three roles as the chips (E3.3) and the legend (E3.4b's dots) —
   one source of truth for "what attention/medium/safe look like". */
.ve-pr-risk-tag--attention { --ve-risk-color: var(--ve-accent); }
.ve-pr-risk-tag--medium    { --ve-risk-color: var(--vc-color-warning, #a8791f); }
.ve-pr-risk-tag--safe      { --ve-risk-color: var(--vc-color-success, #3a6b5c); }
```

The three labels (`needs attention` / `worth a look` / `safe`) match
the legend (E3.3b) verbatim so a reader cross-references chip → legend
→ tag without re-learning the vocabulary. Use the tag only on the
prominent (non-collapsed) cards; collapsed safe files (E3.7) already
carry their "purely additive" summary and do not need it repeated.

## E3.5 The comment bubble — `::before` rotated-square trick

```css
.ve-pr-comment {
  position: relative;
  background: var(--vc-color-neutral-50);
  border: 1px solid color-mix(in srgb, var(--ve-accent) 25%, transparent);
  border-radius: 8px;
  padding: 10px 12px;
  margin-left: 14px;
}
.ve-pr-comment::before {
  content: "";
  position: absolute;
  left: -7px;
  top: 14px;
  width: 12px; height: 12px;
  background: var(--vc-color-neutral-50);
  border-left: 1px solid color-mix(in srgb, var(--ve-accent) 25%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--ve-accent) 25%, transparent);
  transform: rotate(45deg);
}
```

The 12×12 rotated square renders as a triangular pointer at the
comment's left edge — pointing at the diff line. Mined directly from
`03-code-review-pr.html`.

## E3.6 Anchoring comments to line numbers

The comment carries `data-ve-anchor-line="42"`. JS positions the
comment vertically so its `::before` triangle aligns with line 42's
visual y-coordinate:

```js
function positionComments(card) {
  var diff = card.querySelector('.ve-pr-file-card__diff');
  var comments = card.querySelectorAll('.ve-pr-comment');
  comments.forEach(function (c) {
    var ln = c.dataset.veAnchorLine;
    var line = diff.querySelector('.ve-code-line[data-ve-line="' + ln + '"]');
    if (!line) return;
    var lineRect = line.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();
    c.style.position = 'absolute';
    c.style.top = (lineRect.top - cardRect.top) + 'px';
  });
}
```

Re-runs on:
- DOMContentLoaded
- Window resize (with debounce)
- Tab change (if PR is in a tabbed shell)

## E3.7 Collapsed safe files

Files with no risk or trivial changes get collapsed by default:

```html
<details class="ve-pr-collapsed-files">
  <summary>
    <span>4 low-risk files</span>
    <span class="ve-pr-collapsed-files__stat">+12 / −12</span>
  </summary>
  <article class="ve-pr-file-card" id="file-types">
    …diff card for src/types/index.ts…
  </article>
  …more cards…
</details>
```

Keeps the page short — the reader sees the risky files prominently,
the safe ones tucked away.

## E3.8 The next-steps checklist

```html
<section class="ve-pr-checklist">
  <h2>Suggested next steps</h2>
  <ul class="ve-pr-checklist__list">
    <li class="ve-pr-checklist__item">
      <input type="checkbox" id="step-cache">
      <label for="step-cache">Add JWKS response cache (24h TTL)</label>
    </li>
    <li class="ve-pr-checklist__item">
      <input type="checkbox" id="step-test">
      <label for="step-test">Add tests for the 401 path</label>
    </li>
    <li class="ve-pr-checklist__item">
      <input type="checkbox" id="step-docs">
      <label for="step-docs">Update README.md auth section</label>
    </li>
  </ul>
</section>
```

The checkbox state can persist via localStorage if the page is meant
to be revisited — see `amvcp-interactive-controls` for the state
plumbing.

## E3.9 Cross-references

This composition consumes:
- [diff-blocks-unified.md](./diff-blocks-unified.md) — per-line diff
  tints
- [diff-gutter-old-new.md](./diff-gutter-old-new.md) — twin gutter for
  the per-file cards
- [code-block-with-file-path.md](../../amvcp-code-syntax/references/code-block-with-file-path.md) — the
  file-path label on each card
- [collapsed-snippets-walkthrough.md](../../amvcp-code-snippets/references/collapsed-snippets-walkthrough.md)
  — if a file card hides additional context behind `<details>`

## E3.10 Light + dark verification

- [ ] Risk-map chips: all 3 risk colors (clay / oat / olive) read on
      both themes
- [ ] Risk legend: swatch dots + labels readable, colors match the
      chips on both themes
- [ ] Per-file risk-tag: tag text + soft fill + dot legible on both
      themes; color matches the file's chip
- [ ] Per-file diff card: file-path label readable on both themes
- [ ] Comment bubbles: bg / border / pointer visible on both themes
- [ ] Pulse outline: readable on both themes (color-mix uses accent)
- [ ] Collapsed files: `<summary>` chevron + stat read on both themes

## E3.11 Tokens consumed

- `--ve-accent` — pulse / focus / link colour; the `attention` risk role
- `--vc-color-success` / `--vc-color-danger` — +N / −N stat colours;
  `--vc-color-success` also = the `safe` risk role
- `--vc-color-warning` — the `medium` risk role (chip / legend / tag) —
  a dedicated role, NOT a reuse of oat, so "worth a look" has its own hue
- `--vc-color-content-muted` — risk-legend label text
- `--vc-color-neutral-50` / `-300` / `-500` / `-700` — neutrals
- `--vc-font-mono` — file paths, branch names, stat numbers
- `--vc-radius-md` / `-sm` — card / chip radii

The three risk roles (`--ve-accent` / `--vc-color-warning` /
`--vc-color-success`) are funnelled through one `--ve-risk-color`
custom property in the chip, legend, and tag CSS — a single point of
truth so the three risk surfaces can never visually disagree.
- All from [diff-blocks-unified.md](./diff-blocks-unified.md) +
  [diff-gutter-old-new.md](./diff-gutter-old-new.md)

## E3.12 Mined source attribution

Catalog quote from §3.7 code-highlight, source `03-code-review-pr.html`:

> *"PR review (reviewer-side) shape: Header (avatar + branch + +/−
> stat) + What-this-PR-does + Risk-map chips + per-file diffs with
> margin-anchored comment bubbles + collapsed safe files + Suggested-
> next-steps checklist."*

Listed in the §3.13 report-doc ⭐ canonical shapes — adopted as the
PR-review composition for AMVCP.
