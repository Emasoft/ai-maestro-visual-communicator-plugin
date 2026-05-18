# Sub-technique E2 — Collapsed-snippets step walkthrough

## Table of Contents

- [E2.1 The pattern](#e21-the-pattern)
- [E2.2 The markup](#e22-the-markup)
- [E2.3 The CSS](#e23-the-css)
- [E2.4 The mutually-exclusive disclosure pattern](#e24-the-mutually-exclusive-disclosure-pattern)
- [E2.5 The hot-step modifier](#e25-the-hot-step-modifier)
- [E2.6 The composition with the runtime's code block](#e26-the-composition-with-the-runtimes-code-block)
- [E2.7 The walkthrough's role in larger compositions](#e27-the-walkthroughs-role-in-larger-compositions)
- [E2.8 Selection / commenting within an expanded step](#e28-selection--commenting-within-an-expanded-step)
- [E2.9 Accessibility](#e29-accessibility)
- [E2.10 The shape variation: numbered prose without `<details>`](#e210-the-shape-variation-numbered-prose-without-details)
- [E2.11 Tokens consumed](#e211-tokens-consumed)
- [E2.12 Author rules](#e212-author-rules)

The numbered `<details>` walkthrough where each step is `[badge] [file:
line] [prose] [<details> source]`. Mined from `04-code-understanding`
(architecture explainer) — the canonical "explain a flow step by
step" composition.

## E2.1 The pattern

A `<ol>` of steps. Each `<li>`:
1. Numbered badge (circular, accent gold).
2. File path + optional line range, mono font.
3. Prose explaining what this step does in context.
4. `<details>` containing the actual source code — collapsed by
   default, click to expand.

The reader reads the prose top-to-bottom. When they want to see the
code for a specific step, they expand it. The walk-through reads
linearly without overwhelming the page with code.

## E2.2 The markup

```html
<ol class="ve-code-walkthrough">
  <li class="ve-code-step">
    <div class="ve-code-step__head">
      <span class="ve-code-step__badge">1</span>
      <span class="ve-code-step__path">src/auth/middleware.ts</span>
      <span class="ve-code-step__lines">L42-L67</span>
    </div>
    <p class="ve-code-step__prose">
      The middleware reads the <code class="inline">Authorization</code>
      header and forwards it to the JWT verifier. If the header is
      missing, it returns a <code class="inline">401</code> immediately
      without invoking the verifier.
    </p>
    <details class="ve-code-step__details">
      <summary>Show source</summary>
      <div class="ve-code-block">
        <pre><code class="language-typescript">export async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'no_auth' });
  try {
    req.user = await verifyJwt(auth.replace(/^Bearer /, ''));
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}</code></pre>
      </div>
    </details>
  </li>

  <li class="ve-code-step ve-code-step--hot">
    <div class="ve-code-step__head">
      <span class="ve-code-step__badge">2</span>
      <span class="ve-code-step__path">src/auth/jwt.ts</span>
      <span class="ve-code-step__lines">L15-L38</span>
    </div>
    <p class="ve-code-step__prose">
      <strong>This is the trust boundary.</strong> The JWT verifier
      validates the signature using the JWKS endpoint. A failure here
      is the difference between authenticated and rejected requests.
    </p>
    <details class="ve-code-step__details" open>
      <summary>Show source</summary>
      <div class="ve-code-block">…</div>
    </details>
  </li>
</ol>
```

The `ve-code-step--hot` modifier on step 2 marks the critical/trust-
boundary step — the reader's eye lands there first.

## E2.3 The CSS

```css
.ve-code-walkthrough {
  counter-reset: ve-step;
  list-style: none;
  padding: 0;
  margin: 0;
}
.ve-code-step {
  counter-increment: ve-step;
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid color-mix(in srgb, currentColor 8%, transparent);
}
.ve-code-step:last-child { border-bottom: none; }
.ve-code-step__head {
  grid-column: 1 / -1;
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 4px;
}
.ve-code-step__badge {
  flex: 0 0 28px;
  width: 28px; height: 28px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--ve-accent) 14%, transparent);
  color: var(--ve-accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--vc-font-mono);
  font-weight: 600;
}
.ve-code-step--hot .ve-code-step__badge {
  background: var(--ve-accent);
  color: var(--ve-sel-text, #14110b);
}
.ve-code-step__path {
  font-family: var(--vc-font-mono);
  color: var(--vc-color-neutral-700);
}
.ve-code-step__lines {
  font-family: var(--vc-font-mono);
  font-size: var(--vc-text-small);
  color: var(--vc-color-neutral-500);
}
.ve-code-step__prose {
  grid-column: 2 / -1;
  margin: 0 0 8px;
}
.ve-code-step__details {
  grid-column: 2 / -1;
}
.ve-code-step__details > summary {
  cursor: pointer;
  font-size: var(--vc-text-small);
  color: var(--vc-color-neutral-500);
  padding: 4px 0;
  user-select: none;
}
.ve-code-step__details[open] > summary { margin-bottom: 8px; }
```

## E2.4 The mutually-exclusive disclosure pattern

Optional: when one `<details>` opens, all others close (so the reader
sees only ONE code block at a time, keeping the walkthrough
scannable). 6-line JS:

```js
document.querySelectorAll('.ve-code-walkthrough').forEach(function (list) {
  var details = list.querySelectorAll('.ve-code-step__details');
  details.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      details.forEach(function (other) { if (other !== d) other.open = false; });
    });
  });
});
```

This is the catalog's `04-code-understanding` pattern — mined and
adopted directly.

To OPT OUT (let multiple details be open simultaneously), the author
simply doesn't add the JS. The default `<details>` semantics work
fine without it; only the mutually-exclusive variant needs JS.

## E2.5 The hot-step modifier

A walk-through usually has one or two CRITICAL steps — the trust
boundary, the algorithm core, the race-condition window. The `ve-code-
step--hot` modifier marks them:

- The badge fills with full accent (vs the 14%-tint default).
- The step's prose may use `<strong>` for the leading sentence ("This
  is the trust boundary.").

The CSS is opt-in — only the marked step gets the visual emphasis.
Don't mark more than 1-2 steps per walkthrough (every emphasis dilutes
the others).

## E2.6 The composition with the runtime's code block

Each `<details>` contains a normal `.ve-code-block` with a `<pre>
<code class="language-x">…</code></pre>`. The runtime's
`initCodeGutter` runs on these as normal — the closed `<details>`
hides them initially, but they're in the DOM, so the runtime
initializes them once and the gutter / copy button / selection all
work on first expand.

## E2.7 The walkthrough's role in larger compositions

Walkthroughs appear inside:
- **Architecture explainer pages** (`04-code-understanding`) — the
  page's main content
- **PR review pages** (`03-code-review-pr`) — the per-file walkthrough
  inside each file card
- **Feature explainer pages** (`14-research-feature-explainer`) — the
  step-by-step "request path"
- **Postmortem pages** (`12-incident-report`) — the "timeline of the
  incident" sometimes uses this shape for the code-change phase

In all cases the walkthrough IS the page's narrative spine — readers
follow it sequentially.

## E2.8 Selection / commenting within an expanded step

When a step's `<details>` is OPEN, the embedded `.ve-code-block` is
visible and fully interactive. Line selection, drag-paint, copy, all
work normally. The comment pill (if used) anchors to the step's code
block, with the comment payload including:

- The step number / badge.
- The file path + line range.
- The selected lines.

This lets the receiving agent know the comment is about "step 2 of
the walkthrough at lines 15-38 in src/auth/jwt.ts" — high-precision
context.

## E2.9 Accessibility

- `<ol>` + `<li>` is correct semantic (steps are ordered).
- The badge's number IS in the DOM (text content), not just visual.
- The `<details>` / `<summary>` is native HTML and announces the
  open/close state to screen readers.
- The mutually-exclusive JS doesn't break keyboard nav — tab order
  is `summary` → `summary` → `summary`; expanding via Space/Enter
  works.

## E2.10 The shape variation: numbered prose without `<details>`

When every step is SHORT enough that the code fits inline, drop the
`<details>` and just render each step's code inline:

```html
<ol class="ve-code-walkthrough ve-code-walkthrough--inline">
  <li class="ve-code-step">
    <div class="ve-code-step__head"><span class="ve-code-step__badge">1</span> Read the header</div>
    <p>The middleware reads <code class="inline">req.headers.authorization</code>.</p>
  </li>
  <li class="ve-code-step">
    <div class="ve-code-step__head"><span class="ve-code-step__badge">2</span> Verify the JWT</div>
    <p>…</p>
  </li>
</ol>
```

This is the "lightweight walkthrough" — when the page already has
plenty of code blocks elsewhere and the walkthrough is just the
narrative.

## E2.11 Tokens consumed

- `--ve-accent` / `--ve-sel-text` — badge colours
- `--vc-font-mono` / `--vc-text-small` — mono typography
- `--vc-color-neutral-500` / `-700` — path / line-range colours
- `currentColor` for the inter-step separator (8%-mix)

## E2.12 Author rules

| Rule | Why |
|---|---|
| Steps are ORDERED — use `<ol>`, not `<ul>` | Semantic correctness; screen reader behaviour |
| Each step has a path + line range header | Provenance is load-bearing |
| 1-2 hot steps per walkthrough, max | Visual emphasis only works when sparse |
| Use mutually-exclusive disclosure for long walkthroughs (> 4 steps) | Keeps the page scannable |
| Don't nest walkthroughs | Use a single flat sequence; nested walkthroughs are unreadable |
