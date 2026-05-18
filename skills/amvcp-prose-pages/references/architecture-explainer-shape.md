# Architecture-explainer shape — SVG flow + numbered callstack walkthrough + sticky sidebar

## Table of Contents

- [When to choose this shape](#when-to-choose-this-shape)
- [Section order (fixed)](#section-order-fixed)
- [Layout — 2-column grid with sticky sidebar](#layout--2-column-grid-with-sticky-sidebar)
- [Markdown scaffold](#markdown-scaffold)
- [The hot-step modifier (`.vc-step--hot`)](#the-hot-step-modifier-vc-step--hot)
- [The Gotchas panel (clay-bordered sidebar block)](#the-gotchas-panel-clay-bordered-sidebar-block)
- [Mutually-exclusive `<details>` (optional)](#mutually-exclusive-details-optional)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition with other skills](#composition-with-other-skills)
- [Lib functions called](#lib-functions-called)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The document that explains how a codebase works to a reader who has
never seen it. Canonical reference: `html-effectiveness` demo #04,
"code-understanding". The shape exists because reading the code in
file-tree order is the wrong way to learn an architecture; this
document leads the reader through the *flow* (request → handler →
worker → side-effect), not the *files*.

Use this shape when onboarding a new engineer, explaining a subsystem
to a sister team, or documenting an existing system before changing
it. The format is *teaching* — every step costs the reader two seconds
of attention, so every step earns it.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| You are explaining how an existing system works | You are proposing a change → `implementation-plan-shape` |
| The system has a clear request → response or input → output flow | Pure design doc / RFC → `rfc-shape` |
| The reader will read top to bottom and the order matters | Reference doc indexed by symbol → `design-system-doc-shape` |
| You can name the hot path / trust boundary / critical step | Pure overview ("here are the modules") → `feature-explainer-shape` |
| The diagram is the navigation, not just decoration | Algorithm explanation → `concept-explainer-shape` |

## Section order (fixed)

```
1. HEADER + SUMMARY        — h1 + 1-paragraph "what this subsystem does"
2. SVG FLOW DIAGRAM        — box-and-arrow, hot path tinted, trust boundary marked
3. NUMBERED CALLSTACK      — 5-7 steps with [badge] + [file:line] + prose + collapsible code
4. KEY FILES PANEL         — sticky sidebar, mono path → 1-line description
5. GOTCHAS PANEL           — sticky sidebar, clay-bordered, 3-5 traps for the unwary
6. RELATED READING         — links to RFCs, postmortems, runbooks
```

## Layout — 2-column grid with sticky sidebar

```css
.vc-doc--architecture {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: var(--vc-space-6, 48px);
  max-width: 1200px;
}
@media (max-width: 920px) {
  .vc-doc--architecture { grid-template-columns: 1fr; }
  .vc-doc--architecture .vc-sidebar { display: none; }
}
.vc-doc--architecture .vc-sidebar {
  position: sticky;
  top: var(--vc-space-5, 32px);
  align-self: start;
}
```

The sidebar is the **standard sticky-left-sidebar pattern** (see
`responsive-nav.md` for the scroll-spy variant). For this shape, the
sidebar carries TWO panels: Key files (always visible) and Gotchas
(always visible). They scroll together.

## Markdown scaffold

```html
<article class="vc-doc vc-doc--architecture" data-ve-prose>

<main class="vc-main">
  <header class="vc-doc-header">
    <p class="vc-type-overline">Architecture · auth subsystem</p>
    <h1>How authentication flows through the codebase</h1>
    <p class="vc-doc-subtitle">
      A login request hits 3 services and writes to 2 stores. The hot
      path is the session-token lookup; the trust boundary is between
      the gateway and the OIDC verifier.
    </p>
  </header>

  <!-- 2. SVG flow diagram -->
  <section id="flow">
    <h2>The flow</h2>
    <figure class="vc-figure">
      <svg viewBox="0 0 800 400" role="img"
           aria-label="Authentication flow diagram">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 z"
                  fill="var(--vc-color-content-muted, #5b5343)"/>
          </marker>
        </defs>

        <!-- Boxes: client → gateway → oidc → session-store -->
        <rect class="vc-flow-box" x="40" y="160" width="120" height="60"/>
        <text x="100" y="195" text-anchor="middle">Client</text>

        <rect class="vc-flow-box vc-flow-box--hot"
              x="220" y="160" width="120" height="60"/>
        <text x="280" y="195" text-anchor="middle">Gateway</text>

        <!-- Trust boundary annotation -->
        <line x1="370" y1="60" x2="370" y2="320"
              stroke="var(--vc-color-danger)" stroke-dasharray="4 4"/>
        <text x="376" y="80" fill="var(--vc-color-danger)"
              font-family="var(--vc-font-mono)" font-size="10">TRUST
              BOUNDARY</text>

        <rect class="vc-flow-box" x="400" y="160" width="120" height="60"/>
        <text x="460" y="195" text-anchor="middle">OIDC verifier</text>

        <rect class="vc-flow-box" x="580" y="160" width="180" height="60"/>
        <text x="670" y="195" text-anchor="middle">Session store</text>

        <line x1="160" y1="190" x2="220" y2="190" stroke-width="1.5"
              stroke="var(--vc-color-content-muted)" marker-end="url(#arrow)"/>
        <line x1="340" y1="190" x2="400" y2="190" stroke-width="1.5"
              stroke="var(--vc-color-content-muted)" marker-end="url(#arrow)"/>
        <line x1="520" y1="190" x2="580" y2="190" stroke-width="1.5"
              stroke="var(--vc-color-content-muted)" marker-end="url(#arrow)"/>
      </svg>
      <figcaption>The trust boundary sits at the OIDC verifier — every
        request crossing it MUST carry a valid token.</figcaption>
    </figure>
  </section>

  <!-- 3. Numbered callstack walkthrough -->
  <section id="walkthrough">
    <h2>Step by step</h2>

    <article class="vc-step">
      <span class="vc-step-badge">01</span>
      <header>
        <h3>Client sends credentials</h3>
        <code class="vc-step-where">src/client/auth.ts:42-58</code>
      </header>
      <p>The client serializes a username+password into the
         <code>auth-form</code> POST body…</p>
      <details>
        <summary>Show source</summary>
        <pre><code>… code …</code></pre>
      </details>
    </article>

    <article class="vc-step vc-step--hot">
      <span class="vc-step-badge">02</span>
      <header>
        <h3>Gateway authenticates against OIDC</h3>
        <code class="vc-step-where">src/gateway/auth.ts:100-145</code>
      </header>
      <p>Hot path. The gateway exchanges the credentials for an OIDC
         token; this is the trust boundary…</p>
      <details>
        <summary>Show source</summary>
        <pre><code>… code …</code></pre>
      </details>
    </article>

    <article class="vc-step">
      <span class="vc-step-badge">03</span>
      <header>
        <h3>Session token is written to Redis</h3>
        <code class="vc-step-where">src/session/store.ts:80-95</code>
      </header>
      <p>The session token is stored with a 30-day TTL…</p>
      <details>
        <summary>Show source</summary>
        <pre><code>… code …</code></pre>
      </details>
    </article>
  </section>
</main>

<!-- 4 + 5. Sticky sidebar — Key files + Gotchas -->
<aside class="vc-sidebar">
  <section class="vc-sidebar-panel">
    <h3 class="vc-sidebar-title">Key files</h3>
    <dl class="vc-keyfiles">
      <dt><code>src/gateway/auth.ts</code></dt>
        <dd>The entry point; everything starts here.</dd>
      <dt><code>src/auth/oidc.ts</code></dt>
        <dd>Token exchange (the trust boundary).</dd>
      <dt><code>src/session/store.ts</code></dt>
        <dd>Persistent session lookup against Redis.</dd>
    </dl>
  </section>

  <section class="vc-sidebar-panel vc-sidebar-panel--gotchas">
    <h3 class="vc-sidebar-title">Gotchas</h3>
    <ul>
      <li>OIDC tokens are case-sensitive — lowercase before lookup.</li>
      <li>Redis TTL is set at write time; refresh does NOT extend it.</li>
      <li>Trust boundary check is on by default; do not bypass for tests.</li>
    </ul>
  </section>
</aside>

</article>
```

## The hot-step modifier (`.vc-step--hot`)

A single step in the walkthrough can be marked the hot path / critical
step / trust boundary by adding `--hot`. The badge gets a clay tint
and the step border thickens to clay. Reader's eye lands on it first
in the scan.

```css
.vc-step {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: var(--vc-space-3, 12px);
  margin-block: var(--vc-space-5, 32px);
  padding-block: var(--vc-space-3, 12px);
  border-inline-start: 4px solid transparent;
  padding-inline-start: var(--vc-space-3, 12px);
}
.vc-step-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--vc-color-surface-sunken, #f1ece0);
  color: var(--vc-color-content-muted, #5b5343);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-weight: var(--vc-weight-bold, 700);
}
.vc-step--hot {
  border-inline-start-color: var(--vc-color-accent, #b8861f);
  background: color-mix(in srgb, var(--vc-color-accent, #b8861f) 6%, transparent);
}
.vc-step--hot .vc-step-badge {
  background: color-mix(in srgb, var(--vc-color-accent, #b8861f) 18%, transparent);
  color: var(--vc-color-accent, #b8861f);
}
.vc-step-where {
  display: block;
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-1, 14px);
  color: var(--vc-color-content-muted, #5b5343);
}
```

## The Gotchas panel (clay-bordered sidebar block)

```css
.vc-sidebar-panel--gotchas {
  border-inline-start: 3px solid var(--vc-color-warning, #a8791f);
  padding-inline-start: var(--vc-space-3, 12px);
  background: color-mix(in srgb, var(--vc-color-warning, #a8791f) 6%, transparent);
}
.vc-sidebar-panel--gotchas ul li::marker {
  color: var(--vc-color-warning, #a8791f);
}
```

A clay border + tint distinguishes the Gotchas panel from the neutral
Key Files panel without competing with the main column.

## Mutually-exclusive `<details>` (optional)

When the walkthrough has 5+ steps with code snippets, opening multiple
at once makes the page hard to scan. The
`amvcp-interactive-controls` skill ships a tiny `toggle`-event
handler that closes other `<details>` in the same scope when one
opens:

```js
document.querySelectorAll('.vc-step').forEach(step => {
  const details = step.querySelector('details');
  if (!details) return;
  details.addEventListener('toggle', () => {
    if (!details.open) return;
    document.querySelectorAll('.vc-step details[open]').forEach(d => {
      if (d !== details) d.open = false;
    });
  });
});
```

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-accent` | Hot-step border + badge, trust-boundary annotation |
| `--vc-color-warning` | Gotchas panel border + tint, gotcha-bullet marker |
| `--vc-color-danger` | Trust-boundary line in SVG flow (dashed) |
| `--vc-color-content-muted` | Step-where path, sidebar text, arrow color |
| `--vc-color-surface-sunken` | Step badge default background |
| `--vc-font-mono` | All file paths, badge numbers |
| `--vc-radius-md` | Standard card corners |

## Composition with other skills

| Section | Embed from |
|---|---|
| SVG flow diagram | `amvcp-graph-diagrams` or `amvcp-diagram` |
| Step badges + walkthrough | `amvcp-prose-pages` (this skill) |
| Collapsible code snippets | `amvcp-interactive-controls` (mutually-exclusive details) |
| Code inside snippets | `amvcp-code-highlight` |
| Sticky sidebar layout | `amvcp-layout` (2-col grid + sticky) |
| Key Files dl/dt/dd list | `amvcp-prose-pages` |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);
window.amvcpReportDoc.init(document);
const report = window.amvcpReportDoc.runGates(document, "arch-auth-2026");
```

The architecture-explainer is a *teaching* document — the
`semantic-html` gate (P2) matters extra. Use real `<article>`,
`<section>`, `<header>`, `<dl>` / `<dt>` / `<dd>`; not div-soup.

## Selection / comment notes

- Each walkthrough step is selectable
  (`{type:"step", stepNum:"02"}`) so a reader can comment "this is
  not where the trust boundary actually sits".
- The flow diagram is selectable per-box if you add `data-ve-id` to
  each `<rect>` — readers can comment on a specific node.
- Key Files entries are selectable per `<dt>` paragraph.
- Gotchas are selectable per `<li>`.
- The hot-step modifier is meaningful selection metadata —
  `{type:"step", stepNum:"02", hot:true}`.

## Decision-mini hook

Walkthrough steps can host a decision-mini for architectural questions:

```html
<div class="ve-decision" data-decision-id="arch-trust-boundary-position">
  <p>Should the trust boundary be at the gateway or at the OIDC verifier?</p>
  <button data-choice="gateway">At the gateway</button>
  <button data-choice="oidc">At the OIDC verifier (current)</button>
  <button data-choice="both">Both (defense in depth)</button>
</div>
```

## Anti-patterns

- **A files-tree section** — file trees are a navigation tool, not a
  teaching tool. The architecture-explainer teaches the *flow*, not
  the directory.
- **More than one hot step** — the hot path is one path. If you have
  two equally-critical steps, the architecture has a problem; document
  that as a gotcha.
- **Sidebar panels that link out to other documents** — sidebar
  content must be self-contained. Use the Related Reading section at
  the bottom for external links.
- **Walkthrough with >7 steps** — readers stop following after 5-7.
  Split into a parent flow + per-flow detail pages.
- **SVG flow with no trust boundary mark** — every backend
  architecture has one. If there is no trust boundary, say so
  explicitly in the figcaption.
- **A "future work" section** — that belongs in an
  `implementation-plan-shape` document. Architecture explainers
  describe the present, not the future.
- **Inline `<style>` blocks per SVG node** — fine for one SVG, breaks
  theme-swap when the doc has 4+ SVGs. Use `.vc-flow-box` class on
  the rect and define styling in the injected stylesheet.
