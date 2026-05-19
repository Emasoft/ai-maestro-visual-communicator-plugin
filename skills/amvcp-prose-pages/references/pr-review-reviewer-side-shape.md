# PR-review (reviewer-side) shape — risk chips + diff cards + comment bubbles

## Table of Contents

- [When to choose this shape](#when-to-choose-this-shape)
- [Section order (fixed)](#section-order-fixed)
- [Markdown scaffold](#markdown-scaffold)
- [The risk-chip navigator](#the-risk-chip-navigator)
- [The 3-column diff subgrid + comment bubble](#the-3-column-diff-subgrid--comment-bubble)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition with other skills](#composition-with-other-skills)
- [Lib functions called](#lib-functions-called)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The reviewer-facing document for a pull-request review: not the PR
description, not the patch itself, but the *reviewer's writeup* of what
they think about it. Canonical reference: `html-effectiveness` demo
number 03, "code-review-pr".

This is a structured deliverable distinct from a normal GitHub PR
review (which is a list of inline comments) — it stands on its own
as a published reasoning trail. The reviewer hands the file back to
the author, who can read it offline, agree/disagree per-section, and
respond.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| You are reviewing a substantial PR (>5 files or architectural change) | One-line nit comment → just use GitHub's review UI |
| You want to publish your reasoning trail, not just leave inline comments | Author's own writeup of the PR → `pr-writeup-author-side-shape` |
| Risk varies file-by-file and you want a navigable "risk map" | Single-file change → comment on GitHub |
| You want to defer non-blocking suggestions to a checklist | Approving without changes → push the GitHub Approve button |
| The author asked for "a real review" (your reasoning, not your asks) | Quick LGTM → don't author a document for this |

## Section order (fixed)

```
1. HEADER             — author avatar, branch, +N/−N stat, link to PR
2. WHAT-THIS-PR-DOES  — 3-7 bullets summarizing the change
3. RISK-MAP CHIPS     — color-coded chips linked to file cards (smooth-scroll + pulse)
4. PER-FILE DIFFS     — diff cards with margin-anchored comment bubbles
5. COLLAPSED SAFE FILES — <details> with a one-line "trivial" summary each
6. SUGGESTED NEXT STEPS — checklist of nits / follow-ups
7. PROVENANCE         — branch sha, base sha, generated-at
```

## Markdown scaffold

```html
<article class="vc-doc vc-doc--technical-report" data-ve-prose>

<!-- 1. Header -->
<header class="vc-doc-header">
  <p class="vc-type-overline">PR review</p>
  <h1>OIDC migration — phase 2</h1>
  <p class="vc-doc-subtitle">
    by <span class="vc-author">@alice</span> ·
    <code>feature/oidc-phase-2 → main</code> ·
    <span class="vc-diffstat"><span class="vc-add">+412</span>
    <span class="vc-del">−87</span></span> ·
    <a href="https://github.com/org/repo/pull/4821">PR #4821</a>
  </p>
</header>

<!-- 2. What this PR does -->
<section id="summary">
  <h2>What this PR does</h2>
  <ul>
    <li>Switches session creation to OIDC token exchange.</li>
    <li>Adds a 30-day rollback window via <code>legacy_sessions</code> mirror.</li>
    <li>Deprecates 3 endpoints; new endpoints behind <code>auth_v2</code> flag.</li>
  </ul>
</section>

<!-- 3. Risk-map chips -->
<section id="risk-map">
  <h2>Risk map</h2>
  <div class="vc-risk-chips">
    <a class="vc-risk-chip vc-risk-chip--safe" href="#file-1">README.md</a>
    <a class="vc-risk-chip vc-risk-chip--safe" href="#file-2">docs/oidc.md</a>
    <a class="vc-risk-chip vc-risk-chip--medium" href="#file-3">src/auth/session.ts</a>
    <a class="vc-risk-chip vc-risk-chip--attention" href="#file-4">src/auth/oidc.ts</a>
    <a class="vc-risk-chip vc-risk-chip--attention" href="#file-5">src/migrate/legacy.ts</a>
    <a class="vc-risk-chip vc-risk-chip--medium" href="#file-6">tests/auth/oidc.test.ts</a>
  </div>
</section>

<!-- 4. Per-file diff cards (only the attention/medium ones) -->
<section id="file-4" class="vc-diff-card">
  <header class="vc-diff-card-head">
    <code class="vc-diff-path">src/auth/oidc.ts</code>
    <span class="vc-diffstat"><span class="vc-add">+187</span>
                              <span class="vc-del">−12</span></span>
    <span class="vc-risk-chip vc-risk-chip--attention">attention</span>
  </header>
  <pre class="vc-diff">
<span class="vc-diff-row vc-diff-row--hunk">@@ exchangeToken @@</span>
<span class="vc-diff-row vc-diff-row--add">+ const resp = await fetch(tokenEndpoint, {</span>
<span class="vc-diff-row vc-diff-row--add">+   method: 'POST', body: form(payload)</span>
<span class="vc-diff-row vc-diff-row--add">+ });</span>
<span class="vc-diff-row vc-diff-row--del">- const resp = await legacySession.exchange(payload);</span>
  </pre>
  <!-- comment bubble anchored to the added fetch line -->
  <aside class="vc-comment-bubble" data-anchor-line="L+1">
    <p>This call has no timeout — should be wrapped in
       <code>withTimeout(5000)</code> to match the rest of the auth path.</p>
  </aside>
</section>

<!-- 5. Collapsed safe files -->
<section id="safe-files">
  <h2>Other files (low risk)</h2>
  <details>
    <summary>README.md — 4 lines added (changelog entry)</summary>
    <pre class="vc-diff">… diff …</pre>
  </details>
  <details>
    <summary>docs/oidc.md — new file, 142 lines (matches RFC-0231)</summary>
    <pre class="vc-diff">… diff …</pre>
  </details>
</section>

<!-- 6. Suggested next steps checklist -->
<section id="next-steps">
  <h2>Suggested next steps</h2>
  <ul class="vc-action-list">
    <li><input type="checkbox"> Wrap token exchange in <code>withTimeout(5000)</code>.</li>
    <li><input type="checkbox"> Add a metric for token-exchange failure rate.</li>
    <li><input type="checkbox"> Document the 30-day rollback window in the runbook.</li>
    <li><input type="checkbox" checked> (DONE) Confirm <code>auth_v2</code> flag default is OFF in prod.</li>
  </ul>
</section>

<!-- 7. Provenance -->
<footer class="vc-doc-footer">
  Reviewed <code>4f8c1a3</code> against <code>main@2c5e9d0</code> ·
  generated 2026-05-17 10:14
</footer>

</article>
```

## The risk-chip navigator

Three risk classes, one chip per file, smooth-scroll + 1.4s outline
pulse on the target. The chips form a navigable "map" of the review so
the reader can jump to attention-grade files first.

```css
.vc-risk-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-block: var(--vc-space-4, 16px);
}
.vc-risk-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  text-decoration: none;
  border: 1px solid var(--vc-color-border, #e3dcc9);
  color: var(--vc-color-content, #1f1a14);
}
.vc-risk-chip--safe      { background: var(--vc-color-surface, #ffffff); }
.vc-risk-chip--medium    { background: color-mix(in srgb,
                                       var(--vc-color-warning, #a8791f) 16%,
                                       transparent); }
.vc-risk-chip--attention { background: color-mix(in srgb,
                                       var(--vc-color-danger, #a84a32) 16%,
                                       transparent);
                            border-color: var(--vc-color-danger, #a84a32); }
```

The smooth-scroll + outline-pulse is wired by the runtime's anchor
helper (a separate primitive lifted from `amvcp-interactive-controls`'s
"click-chip → smooth-scroll + 1.4s outline pulse" pattern). The
report-doc skill ships only the chip styling.

## The 3-column diff subgrid + comment bubble

A diff row is a 3-column subgrid: line-number / `+`-or-`−`-mark / code.
Comment bubbles are positioned `inset-inline-start: 100%` so they
appear in the right margin, with a CSS speech-bubble `::before` notch
pointing at the anchored line.

```css
.vc-diff-row {
  display: grid;
  grid-template-columns: 48px 18px 1fr;
  gap: var(--vc-space-2, 8px);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-1, 14px);
  line-height: 1.45;
}
.vc-diff-row--add { background: color-mix(in srgb,
                              var(--vc-color-success, #3a6b5c) 12%, transparent); }
.vc-diff-row--del { background: color-mix(in srgb,
                              var(--vc-color-danger,  #a84a32) 12%, transparent); }
.vc-diff-row--del code { text-decoration: line-through; opacity: 0.75; }
.vc-diff-row--hunk { color: var(--vc-color-content-muted, #5b5343);
                     font-style: italic; }
```

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-success` | "add" diff rows, safe chip |
| `--vc-color-danger` | "del" diff rows, attention chip border |
| `--vc-color-warning` | medium chip background |
| `--vc-color-accent` | risk-chip hover, comment-bubble border |
| `--vc-color-content-muted` | hunk headers, byline, provenance |
| `--vc-color-border` | chip border, diff-card border |
| `--vc-color-surface-sunken` | safe-file `<details>` background |
| `--vc-font-mono` | diff text, chip text, file path, diffstat |
| `--vc-radius-md` | diff card |

## Composition with other skills

| Section | Embed from |
|---|---|
| Risk chips | `amvcp-tables` (chip primitive) |
| Diff rows | `amvcp-code-highlight` (diff subgrid + row tinting) |
| Comment bubbles | `amvcp-prose-pages` (this skill) — `vc-comment-bubble` |
| Collapsed `<details>` | `amvcp-interactive-controls` (mutually-exclusive details optional) |
| Next-steps checklist | `amvcp-interactive-controls` (interactive checkboxes) |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);
// chip nav + outline-pulse is wired by amvcp-interactive-controls if loaded;
// without it, the chips still smooth-scroll via :target.
window.amvcpReportDoc.init(document);
const report = window.amvcpReportDoc.runGates(document, "pr-4821-review");
```

## Selection / comment notes

- Each diff row is selectable
  (`{type:"diff-row", file:"src/auth/oidc.ts", line:"+1"}`) so the
  author can reply to a specific row.
- Comment bubbles themselves are selectable as a unit — the author
  can reply to the bubble without highlighting its text.
- Risk chips are selectable — author can comment "this file is
  actually safe, not medium-risk".
- Collapsed safe-file `<details>` are selectable while closed
  (the summary is the selectable label).

## Decision-mini hook

The "Suggested next steps" checklist is a natural fit for decision-mini
blocks per nit:

```html
<li>
  <div class="ve-decision" data-decision-id="pr-4821-timeout">
    <p>Wrap token exchange in <code>withTimeout(5000)</code>?</p>
    <button data-choice="yes-this-pr">Yes, in this PR</button>
    <button data-choice="yes-followup">Yes, follow-up PR</button>
    <button data-choice="reject">Reject — has retries upstream</button>
  </div>
</li>
```

## Anti-patterns

- **Reviewing only the attention files** — every file gets a chip,
  even if it is `safe`. Omitting safe files leaves the reader
  wondering if you read them.
- **Comment bubbles with no anchor line** — every bubble MUST have
  `data-anchor-line` or it floats free of the code.
- **A general "this LGTM" section with no chips** — risk chips are
  the whole point of this shape. Use a GitHub Approve button if you
  do not need chips.
- **Risk classes other than the 3** — adding `low` / `critical` /
  `nitpick` dilutes the signal. `safe` / `medium` / `attention`
  cover all real cases.
- **Inline diff syntax highlighting via Prism/Highlight.js** — the
  diff highlighter is hand-wrapped `<span class="vc-add|vc-del|vc-ctx">`
  inside the row. No library dependency.
- **Mixing per-file diff cards with `<details>` collapse** — `<details>`
  is only for the *safe* files at the bottom. Attention/medium files
  are always visible at the top.
- **Linking to a different review of the same PR** — keep the review
  self-contained; if you reference another review, quote the relevant
  sentence inline.
