# Sub-technique E4 — PR writeup page composition (author-side)

## Table of Contents

- [E4.1 The shape](#e41-the-shape)
- [E4.2 The TL;DR card](#e42-the-tldr-card)
- [E4.3 The Why section — Before/After panels](#e43-the-why-section--beforeafter-panels)
- [E4.4 The file-by-file tour — ordered FOR READING](#e44-the-file-by-file-tour--ordered-for-reading)
- [E4.5 The badges](#e45-the-badges)
- [E4.6 The "Where to focus" numbered cards](#e46-the-where-to-focus-numbered-cards)
- [E4.7 The test plan checklist](#e47-the-test-plan-checklist)
- [E4.8 The rollout strip](#e48-the-rollout-strip)
- [E4.9 The narrow-viewport stack](#e49-the-narrow-viewport-stack)
- [E4.10 Cross-references](#e410-cross-references)
- [E4.11 Tokens consumed](#e411-tokens-consumed)
- [E4.12 Mined source attribution](#e412-mined-source-attribution)

The author-facing pull-request writeup page. Mined verbatim from
`17-pr-writeup.html` (html-effectiveness catalog #17). The canonical
author-side composition — the document the PR author writes to argue
for their change.

## E4.1 The shape

Six sections, top to bottom:

1. **TL;DR card** (clay-left-border, the punchline summary).
2. **Why** (before/after panels side-by-side with bullet lists; "Pro"-
   dotted bullets vs olive-bordered "after").
3. **File-by-file tour** (ordered "for reading, not alphabetically" —
   worker → call-site → plumbing). Each file `<details>` has a chevron,
   path, badge, and +N/−N stat in the summary.
4. **Where to focus** (numbered cards highlighting the 2-3 sections
   reviewers should pay attention to).
5. **Test plan checklist** (test cases as `<input type="checkbox">`
   items).
6. **Rollout strip** (3-step horizontal pipeline: dev → staging → prod
   with shared-border step cards).

## E4.2 The TL;DR card

```html
<aside class="ve-tldr-card">
  <h2 class="ve-tldr-card__label">TL;DR</h2>
  <p class="ve-tldr-card__body">
    Migrating from a single shared HMAC secret to per-key JWKS-validated
    JWTs. The change is mechanical at the call-sites; the real work is
    in <code class="inline">jwks-loader.ts</code>. <strong>Watch the
    cache eviction policy</strong> — that's the load-bearing part.
  </p>
  <p class="ve-tldr-card__metric">
    Before <code class="inline">p99: 1.4s</code> → After <code class="inline">p99: 180ms</code>
  </p>
</aside>
```

The clay-left-border + warmer interior visually marks the TL;DR as a
load-bearing summary:

```css
.ve-tldr-card {
  border-left: 4px solid var(--ve-accent);
  background: color-mix(in srgb, var(--ve-accent) 4%, transparent);
  border-radius: 0 8px 8px 0;
  padding: 16px 20px;
  margin-bottom: 24px;
}
```

The reader who only reads ONE thing should read the TL;DR.

## E4.3 The Why section — Before/After panels

```html
<section class="ve-pr-why">
  <h2>Why this change</h2>
  <div class="ve-pr-why__panels">
    <div class="ve-pr-why__panel ve-pr-why__panel--before">
      <h3 class="ve-pr-why__title">Before</h3>
      <ul>
        <li>Single shared HMAC secret — rotation blocks all services</li>
        <li>No way to revoke a single token</li>
        <li>p99 hit by per-request secret-load</li>
      </ul>
    </div>
    <div class="ve-pr-why__panel ve-pr-why__panel--after">
      <h3 class="ve-pr-why__title">After</h3>
      <ul>
        <li>Per-key JWTs — rotate individually</li>
        <li>Tokens revocable via JWKS endpoint</li>
        <li>Cached JWKS = p99 in single-digit ms</li>
      </ul>
    </div>
  </div>
</section>
```

CSS uses bullet dots — gray for "Before" entries, olive for "After":

```css
.ve-pr-why__panel--before li::marker { color: var(--vc-color-neutral-400); }
.ve-pr-why__panel--after  li::marker { color: var(--vc-color-success); }
.ve-pr-why__panel--after {
  border: 1px solid color-mix(in srgb, var(--vc-color-success) 30%, transparent);
  background: color-mix(in srgb, var(--vc-color-success) 4%, transparent);
  border-radius: 8px;
  padding: 14px 18px;
}
.ve-pr-why__panel--before {
  background: var(--vc-color-neutral-50);
  border-radius: 8px;
  padding: 14px 18px;
}
```

The metric difference in the TL;DR is the punchline.

## E4.4 The file-by-file tour — ordered FOR READING

```html
<section class="ve-pr-tour">
  <h2>File-by-file tour</h2>

  <details class="ve-pr-tour__file" open>
    <summary class="ve-pr-tour__summary">
      <span class="ve-pr-tour__chevron">▸</span>
      <span class="ve-pr-tour__path">src/auth/jwks-loader.ts</span>
      <span class="ve-pr-tour__badge ve-pr-tour__badge--new">new</span>
      <span class="ve-pr-tour__stat ve-pr-tour__stat--add">+128</span>
    </summary>
    <div class="ve-pr-tour__body">
      <p>This is the worker — the new module. Reads <code class="inline">JWKS_URL</code>,
         caches responses, returns a key by <code class="inline">kid</code>.</p>
      <div class="ve-code-block ve-code-panel-slate">
        <pre><code class="language-typescript">…</code></pre>
      </div>
    </div>
  </details>

  <details class="ve-pr-tour__file">
    <summary class="ve-pr-tour__summary">
      <span class="ve-pr-tour__chevron">▸</span>
      <span class="ve-pr-tour__path">src/auth/middleware.ts</span>
      <span class="ve-pr-tour__badge ve-pr-tour__badge--modified">mod</span>
      <span class="ve-pr-tour__stat ve-pr-tour__stat--add">+47</span>
      <span class="ve-pr-tour__stat ve-pr-tour__stat--del">−12</span>
    </summary>
    <div class="ve-pr-tour__body">
      <p>The call-site — uses the new <code class="inline">jwks-loader</code>.</p>
      <!-- diff block here -->
    </div>
  </details>

  <details class="ve-pr-tour__file">
    <summary class="ve-pr-tour__summary">
      <span class="ve-pr-tour__chevron">▸</span>
      <span class="ve-pr-tour__path">src/config.ts</span>
      <span class="ve-pr-tour__badge ve-pr-tour__badge--modified">mod</span>
      <span class="ve-pr-tour__stat ve-pr-tour__stat--add">+3</span>
    </summary>
    <div class="ve-pr-tour__body">
      <p>Plumbing — adds the <code class="inline">JWKS_URL</code> env var.</p>
      <!-- diff block here -->
    </div>
  </details>
</section>
```

**The "ordered for reading" discipline:**
- First: the WORKER (the new logic / the heart of the change).
- Second: the CALL-SITES (what uses the worker).
- Last: the PLUMBING (config, types, supporting changes).

Alphabetical ordering of files would put `config.ts` first — useless
to the reader. Reading order matches the AUTHOR's narrative: "here's
what I made, here's where it's used, here's the glue."

The first file is `open` by default — the reader doesn't have to
click to start reading. Others are collapsed but easy to expand.

## E4.5 The badges

| Badge | Class | Color |
|---|---|---|
| `new` | `--new` | olive (success) — a new file |
| `mod` | `--modified` | accent gold — modified file |
| `del` | `--deleted` | rust (danger) — deleted file |

These match the standard +N/−N visual semantics. Don't invent custom
badges; reuse these three.

## E4.6 The "Where to focus" numbered cards

```html
<section class="ve-pr-focus">
  <h2>Where to focus your review</h2>
  <div class="ve-pr-focus__cards">
    <article class="ve-pr-focus__card">
      <span class="ve-pr-focus__num">01</span>
      <h3>Cache eviction policy</h3>
      <p>The JWKS cache uses a 24h TTL by default. If a key is rotated
         in less than 24h, requests will fail until the cache misses.
         Is 24h the right TTL for our key-rotation cadence?</p>
      <a href="#file-jwks-loader" class="ve-pr-focus__link">
        → src/auth/jwks-loader.ts L78
      </a>
    </article>
    <article class="ve-pr-focus__card">
      <span class="ve-pr-focus__num">02</span>
      <h3>401 vs 403 semantics</h3>
      <p>The new middleware returns 401 for ALL token failures (invalid,
         expired, missing). Should expired tokens return 403 instead?
         The OWASP guidance is split.</p>
      <a href="#file-middleware" class="ve-pr-focus__link">
        → src/auth/middleware.ts L42
      </a>
    </article>
  </div>
</section>
```

Each card calls out ONE specific question the author wants reviewer
input on. 2-3 cards max — the goal is to direct review attention,
not to enumerate every change.

## E4.7 The test plan checklist

```html
<section class="ve-pr-tests">
  <h2>Test plan</h2>
  <ul class="ve-pr-tests__list">
    <li>
      <input type="checkbox" id="test-1" checked disabled>
      <label for="test-1">Valid JWT → 200 (existing test, still passes)</label>
    </li>
    <li>
      <input type="checkbox" id="test-2" checked disabled>
      <label for="test-2">Expired JWT → 401 (new test)</label>
    </li>
    <li>
      <input type="checkbox" id="test-3" checked disabled>
      <label for="test-3">JWKS endpoint unreachable → 503 with cached key (new test)</label>
    </li>
    <li>
      <input type="checkbox" id="test-4">
      <label for="test-4">JWKS endpoint returns 500 → fallback to last cached (TODO — open question 1)</label>
    </li>
  </ul>
</section>
```

Checkboxes already-checked (with `disabled`) show "what's been
tested"; unchecked ones (without disabled) are open TODOs the
reviewer / author can interact with.

## E4.8 The rollout strip

A 3-card horizontal strip showing the deploy pipeline:

```html
<section class="ve-pr-rollout">
  <h2>Rollout plan</h2>
  <div class="ve-pr-rollout__strip">
    <div class="ve-pr-rollout__step ve-pr-rollout__step--done">
      <span class="ve-pr-rollout__num">1</span>
      <h3>Dev</h3>
      <p>Merged into <code class="inline">dev</code> branch · running 5 days · 0 regressions</p>
    </div>
    <div class="ve-pr-rollout__step ve-pr-rollout__step--current">
      <span class="ve-pr-rollout__num">2</span>
      <h3>Staging</h3>
      <p>Awaiting review approval · roll on merge</p>
    </div>
    <div class="ve-pr-rollout__step">
      <span class="ve-pr-rollout__num">3</span>
      <h3>Prod</h3>
      <p>10% canary 24h → 50% 48h → 100% 7d</p>
    </div>
  </div>
</section>
```

CSS uses shared borders to read as a connected pipeline:

```css
.ve-pr-rollout__strip {
  display: flex;
  gap: 0;
}
.ve-pr-rollout__step {
  flex: 1 1 0;
  padding: 16px 18px;
  border: 1px solid var(--vc-color-neutral-300);
  border-radius: 0;
}
.ve-pr-rollout__step:first-child {
  border-radius: 12px 0 0 12px;
}
.ve-pr-rollout__step:last-child {
  border-radius: 0 12px 12px 0;
}
.ve-pr-rollout__step + .ve-pr-rollout__step {
  border-left: none;
}
.ve-pr-rollout__step--done {
  background: color-mix(in srgb, var(--vc-color-success) 6%, transparent);
}
.ve-pr-rollout__step--current {
  background: color-mix(in srgb, var(--ve-accent) 6%, transparent);
  border-color: var(--ve-accent);
}
```

Mined from `17-pr-writeup`'s rollout strip (catalog quote: *"3
horizontal step cards with shared borders … Reads as a connected
pipeline without arrows. Brilliant compact alternative to a flowchart
for linear processes."*).

## E4.9 The narrow-viewport stack

On viewports below 720px, the Before/After panels stack vertically,
the rollout strip wraps to vertical, the Focus cards stack to one
column. All via CSS — no JS.

## E4.10 Cross-references

Consumes:
- [diff-blocks-unified.md](./diff-blocks-unified.md) — diffs inside
  the file-by-file tour
- [slate-bg-code-panel.md](../../amvcp-code-syntax/references/slate-bg-code-panel.md) — code panels for
  inlined code samples
- [inline-code-chip.md](../../amvcp-code-syntax/references/inline-code-chip.md) — for inline
  identifier mentions
- [diff-blocks-unified.md](./diff-blocks-unified.md) §D1.6 — the
  line-through-on-del strike-through variant for "historical removal"

## E4.11 Tokens consumed

- `--ve-accent` — TL;DR border, focus pulse, current rollout step
- `--vc-color-success` / `--vc-color-danger` — Before/After bullet
  marks, +N/−N stats, badges
- `--vc-color-neutral-50` / `--vc-color-neutral-300` / `--vc-color-neutral-400` / `--vc-color-neutral-500` — neutrals
- `--vc-font-mono` — branch names, file paths, stat numbers
- `--vc-radius-md` / `--vc-radius-sm` — card / pill radii

## E4.12 Mined source attribution

Catalog quote from §3.13 report-doc shapes, source `17-pr-writeup.html`:

> *"PR writeup (author-side) shape: TL;DR + Why (before/after panels) +
> ordered file tour + 'Where to focus' numbered cards + Test plan
> checklist + Rollout strip."*

Listed in the canonical shapes — adopted verbatim for AMVCP's
PR-writeup composition.
