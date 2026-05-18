# Feature-explainer shape — sticky TOC + step-by-step + tabbed code + FAQ

## Table of Contents

- [When to choose this shape](#when-to-choose-this-shape)
- [Section order (fixed)](#section-order-fixed)
- [Markdown scaffold](#markdown-scaffold)
- [The "Files read" sidebar block](#the-files-read-sidebar-block)
- [The tabbed code panel](#the-tabbed-code-panel)
- [The star callout](#the-star-callout)
- [The FAQ `<dl>` block](#the-faq-dl-block)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition with other skills](#composition-with-other-skills)
- [Lib functions called](#lib-functions-called)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The document that answers "how does feature X work?" for engineers who
want both the concept and the configuration knobs in one page.
Canonical reference: `html-effectiveness` demo #14, "research-feature-
explainer".

This shape sits between the *teaching* `architecture-explainer-shape`
(which walks through the system from request to response) and the
*deliberative* `concept-explainer-shape` (which teaches a single
algorithm interactively). The feature-explainer is a **reference doc
with narrative bones** — readers can scan the TOC and jump, or read
top to bottom.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| You are documenting a specific feature for engineers who will configure it | Pure algorithm explanation → `concept-explainer-shape` |
| The feature has 4+ named sections and config knobs | Subsystem-wide flow → `architecture-explainer-shape` |
| You want a sticky TOC + tabbed code (yaml / route / response) + FAQ | Quick changelog entry → `change-log-document-shape` |
| Audience is engineers consuming the feature, not building it | Audience builds the feature → `pr-writeup-author-side-shape` |
| You will publish to internal docs / wiki | Customer-facing API docs → `design-system-doc-shape` |

## Section order (fixed)

```
1. STICKY TOC + FILES-READ FOOTER — left sidebar, scroll-spy
2. TL;DR CARD                    — clay-left-border, one-paragraph summary
3. STEP-BY-STEP REQUEST PATH     — 3-5 <details>, one open by default
4. TABBED CODE SAMPLES           — same change shown 3 ways (yaml / route / response)
5. CALLOUT (star)                — the one piece of news the reader must not miss
6. GOTCHAS                       — clay-bullet list of common mistakes
7. FAQ                           — <dl> with serif <dt> question / sans <dd> answer
```

## Markdown scaffold

```html
<article class="vc-doc vc-doc--technical-report" data-ve-prose>

<!-- 1. Sticky TOC sidebar — Files-read footer panel inside it -->
<nav class="vc-toc vc-toc--sticky-left" aria-label="Contents">
  <p class="vc-toc-title">Contents</p>
  <ol>
    <li><a href="#tldr">TL;DR</a></li>
    <li><a href="#request-path">Request path</a></li>
    <li><a href="#config">Configuration</a></li>
    <li><a href="#callout">What to know</a></li>
    <li><a href="#gotchas">Gotchas</a></li>
    <li><a href="#faq">FAQ</a></li>
  </ol>
  <div class="vc-files-read">
    <p class="vc-files-read-title">Files read</p>
    <ul>
      <li><code>src/limits/sliding-window.ts</code></li>
      <li><code>config/limits.yaml</code></li>
      <li><code>docs/rate-limiting.md</code></li>
    </ul>
  </div>
</nav>

<main class="vc-main">
  <header class="vc-doc-header">
    <p class="vc-type-overline">Feature explainer · rate limiting</p>
    <h1>How rate limiting works</h1>
  </header>

  <!-- 2. TL;DR -->
  <aside id="tldr" class="vc-tldr">
    <p class="vc-tldr-eyebrow">TL;DR</p>
    <p>Sliding window over Redis, 60-second resolution. Each route
       declares its own bucket; defaults from <code>limits.yaml</code>;
       overrides via per-route decorator. On limit, returns 429 with
       <code>Retry-After</code>.</p>
  </aside>

  <!-- 3. Step-by-step request path -->
  <section id="request-path">
    <h2>The request path</h2>

    <details open>
      <summary>
        <strong>01.</strong> Request hits the rate-limit middleware
        <span class="vc-where">src/middleware/limit.ts:14-42</span>
      </summary>
      <p>The middleware extracts the bucket key from
         <code>req.user.id || req.ip</code>…</p>
    </details>

    <details>
      <summary>
        <strong>02.</strong> Bucket is looked up in Redis
        <span class="vc-where">src/limits/sliding-window.ts:80-95</span>
      </summary>
      <p>A Lua script increments and reads the bucket atomically…</p>
    </details>

    <details>
      <summary>
        <strong>03.</strong> If under the limit, the request proceeds
        <span class="vc-where">src/middleware/limit.ts:44-62</span>
      </summary>
      <p>Otherwise a 429 is returned with the wall-clock
         retry-after…</p>
    </details>
  </section>

  <!-- 4. Tabbed code samples — yaml / route / response -->
  <section id="config">
    <h2>Configuration</h2>
    <div class="vc-tabs" data-vc-tabs>
      <div class="vc-tab-bar">
        <button class="vc-tab-btn vc-tab-btn--on" data-vc-tab="0">limits.yaml</button>
        <button class="vc-tab-btn"               data-vc-tab="1">route.ts</button>
        <button class="vc-tab-btn"               data-vc-tab="2">client response</button>
      </div>
      <pre class="vc-tab-panel vc-tab-panel--on" data-vc-panel="0"><code>routes:
  /api/messages/send:
    bucket_key: user
    capacity: 30
    window_seconds: 60
</code></pre>
      <pre class="vc-tab-panel" data-vc-panel="1"><code>@withLimit({ bucket: 'user', capacity: 30, windowSeconds: 60 })
async sendMessage(req: Request) { /* … */ }
</code></pre>
      <pre class="vc-tab-panel" data-vc-panel="2"><code>HTTP/1.1 429 Too Many Requests
Retry-After: 23
Content-Type: application/json

{"error": "rate_limited", "retry_after": 23}
</code></pre>
    </div>
  </section>

  <!-- 5. Star callout -->
  <aside id="callout" class="vc-callout vc-callout--star">
    <span class="vc-callout-glyph" aria-hidden="true">★</span>
    <div class="vc-callout-body">
      <p class="vc-callout-title">The clock matters</p>
      <p>The "window" is wall-clock seconds, not request count.
         A burst at the very end of one window plus another at the
         start of the next will exceed the per-window budget by 2×.</p>
    </div>
  </aside>

  <!-- 6. Gotchas -->
  <section id="gotchas">
    <h2>Gotchas</h2>
    <ul class="vc-highlights">
      <li>Buckets are case-sensitive — normalize the key before lookup.</li>
      <li>The Lua script does NOT handle Redis cluster shards — wrap
         your bucket key in <code>{}</code> to force same-slot.</li>
      <li>Default capacity is <strong>10/min</strong> if no config exists.
         This catches most teams by surprise.</li>
    </ul>
  </section>

  <!-- 7. FAQ — <dl> with serif <dt> -->
  <section id="faq">
    <h2>FAQ</h2>
    <dl class="vc-faq">
      <dt>How do I bypass the limit for an internal worker?</dt>
      <dd>Use the <code>@skipLimit</code> decorator OR set the
          <code>x-internal-token</code> header — both bypass the
          middleware entirely.</dd>

      <dt>Why a sliding window and not a token bucket?</dt>
      <dd>Token buckets need per-bucket state on the application side.
          Sliding windows over Redis are stateless on the app and
          survive restarts.</dd>

      <dt>How do I see who is being rate-limited?</dt>
      <dd>The <code>rate_limit_exceeded</code> metric carries the
          <code>route</code> + <code>bucket</code> labels. See the
          <a href="#">Rate Limiting dashboard</a>.</dd>
    </dl>
  </section>
</main>

</article>
```

## The "Files read" sidebar block

A bottom-of-sidebar provenance block. Lists the source files the
author actually read while writing the explainer — gives the reader
both confidence in the writeup and a starting point for their own
exploration.

```css
.vc-files-read {
  margin-block-start: var(--vc-space-5, 32px);
  padding-block-start: var(--vc-space-3, 12px);
  border-block-start: 1px solid var(--vc-color-border, #e3dcc9);
  font-size: var(--vc-text-1, 14px);
}
.vc-files-read-title {
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vc-color-content-muted, #5b5343);
  margin-block: 0 var(--vc-space-2, 8px);
}
.vc-files-read ul { list-style: none; padding: 0; margin: 0; }
.vc-files-read li {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  padding-block: var(--vc-space-1, 4px);
}
```

## The tabbed code panel

Three tabs, one panel visible at a time, ~6 lines of JS.

```js
document.querySelectorAll('[data-vc-tabs]').forEach(group => {
  const btns   = group.querySelectorAll('[data-vc-tab]');
  const panels = group.querySelectorAll('[data-vc-panel]');
  btns.forEach(btn => btn.addEventListener('click', () => {
    btns.forEach(b => b.classList.remove('vc-tab-btn--on'));
    btn.classList.add('vc-tab-btn--on');
    panels.forEach(p => p.classList.remove('vc-tab-panel--on'));
    const idx = btn.dataset.vcTab;
    group.querySelector('[data-vc-panel="' + idx + '"]')
      .classList.add('vc-tab-panel--on');
  }));
});
```

The tabbed panel is **not** a generalized tab widget — it is a
single-purpose "show the same change from 3 angles" affordance. Use
when the perspectives are functionally identical (a config file, the
code that consumes it, the client-side output). Do not use to switch
between unrelated topics.

## The star callout

A variant beyond the 5 built-in callouts (`tip/warning/info/note/danger`).
The star callout marks the ONE thing the reader must not miss in the
whole document — use exactly once per feature explainer.

```css
.vc-callout--star {
  background: color-mix(in srgb, var(--vc-color-surface-sunken, #f1ece0) 60%, transparent);
  border-inline-start: 4px solid var(--vc-color-accent, #b8861f);
}
.vc-callout--star .vc-callout-glyph {
  color: var(--vc-color-accent, #b8861f);
  font-size: var(--vc-text-3, 20px);
}
```

If you find yourself wanting two star callouts, you are using the
shape for something it is not — the feature is too complex and needs
to be split into two explainers.

## The FAQ `<dl>` block

A definition list, not a heading list. `<dt>` is a question (serif,
slightly heavier), `<dd>` is the answer (body sans). The semantic
markup means screen readers announce "Question:" / "Answer:" pairs.

```css
.vc-faq dt {
  font-family: var(--vc-font-heading, Georgia, serif);
  font-size: var(--vc-text-3, 20px);
  font-weight: var(--vc-weight-semibold, 600);
  margin-block: var(--vc-space-4, 16px) var(--vc-space-2, 8px);
}
.vc-faq dd {
  margin: 0 0 var(--vc-space-3, 12px);
  padding-inline-start: var(--vc-space-3, 12px);
  border-inline-start: 2px solid var(--vc-color-border, #e3dcc9);
}
```

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-accent` | TL;DR border, star callout border + glyph, TOC active |
| `--vc-color-content` | Body text, FAQ dt |
| `--vc-color-content-muted` | Step `vc-where`, files-read paths, TOC text |
| `--vc-color-surface-sunken` | Star-callout background, code panels |
| `--vc-color-border` | TOC border, files-read divider, FAQ dd border |
| `--vc-font-heading` | FAQ questions |
| `--vc-font-mono` | All file paths, code, where labels, files-read |
| `--vc-radius-md` | Callout, TOC |

## Composition with other skills

| Section | Embed from |
|---|---|
| Sticky TOC | `amvcp-prose-pages` (this skill) — `vc-toc--sticky-left` |
| TL;DR card | `amvcp-prose-pages` — `tldr-summary-card` |
| Step `<details>` | `amvcp-interactive-controls` (disclosure) |
| Tabbed code panel | `amvcp-interactive-controls` (tabs primitive) |
| Code inside tabs | `amvcp-code-highlight` |
| Star callout | `amvcp-prose-pages` (this skill) |
| Gotchas list | `amvcp-prose-pages` |
| FAQ dl | `amvcp-prose-pages` |
| Files-read sidebar block | `amvcp-prose-pages` |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);
window.amvcpReportDoc.init(document);   // scroll-spy on sticky TOC
const report = window.amvcpReportDoc.runGates(document, "feat-rate-limit");
```

## Selection / comment notes

- Each FAQ pair is selectable per `<dt>` — reader can comment "this
  answer is wrong" without highlighting the answer.
- Each step `<details>` is selectable while closed (the summary is
  the label).
- Each tab button is selectable
  (`{type:"tab", tabId:"limits.yaml"}`) — reader can comment "this
  yaml format is outdated".
- The star callout is selectable as a unit — reader can comment "this
  is not the most important thing".
- Files-read entries are selectable per `<li>` paragraph.

## Decision-mini hook

Gotchas frequently host a decision-mini for behavior changes:

```html
<div class="ve-decision" data-decision-id="rate-limit-default-capacity">
  <p>Default capacity is 10/min — should we change it?</p>
  <button data-choice="raise-100">Raise to 100/min</button>
  <button data-choice="keep-10">Keep 10/min (safer)</button>
  <button data-choice="require-config">Require explicit config (no default)</button>
</div>
```

## Anti-patterns

- **Two star callouts** — see above; one per document.
- **FAQ items the agent invented** — the FAQ MUST be real questions
  the team has been asked. Fictional questions waste the reader's time
  and erode trust.
- **Tabbed code with 4+ tabs** — beyond 3, tabs become a wall and the
  user picks the first one. Split into multiple sections.
- **Step `<details>` with all collapsed** — at least one MUST be
  `open` so a top-to-bottom reader sees an example.
- **Sticky TOC for a 2-section doc** — TOC pays off only at 4+
  sections. Below that it is clutter.
- **A "Glossary" section** — that belongs in
  `glossary-and-hover-linked-terms`, with hover-linked terms. Inline
  glossary in a feature explainer competes with the FAQ.
- **No "Files read" footer in the sidebar** — the provenance is part
  of the deliverable. Without it, the reader has to ask "what code
  did you actually look at?".
