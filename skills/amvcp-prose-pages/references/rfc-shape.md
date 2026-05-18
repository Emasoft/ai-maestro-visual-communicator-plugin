# RFC (Request for Comments) shape — context + proposal + alternatives + decision

## Table of Contents

- [When to choose this shape](#when-to-choose-this-shape)
- [Section order (fixed)](#section-order-fixed)
- [Markdown scaffold](#markdown-scaffold)
- [The RFC status pill](#the-rfc-status-pill)
- [The Alternatives section](#the-alternatives-section)
- [The whitepaper template's auto-numbering](#the-whitepaper-templates-auto-numbering)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition with other skills](#composition-with-other-skills)
- [Lib functions called](#lib-functions-called)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The canonical document shape for surfacing a substantive design decision
before it is implemented. RFCs sit between a thought-piece (too informal
to drive a decision) and an implementation plan (commits to *how* before
the *whether* is settled). Used by engineering organizations, standards
bodies (IETF), and open-source projects.

The RFC's distinctive contribution is the **explicit Alternatives
section** — a working RFC enumerates the options it considered and
rejected. Without that, the reader has no way to evaluate whether the
recommendation is defensible.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| You are proposing a substantive technical decision needing peer input | The decision is already made → `adr-decision-log-shape` |
| Multiple alternatives exist and you want the trade-offs on record | One obvious path → `pr-writeup-author-side-shape` |
| The decision crosses team boundaries and needs broader review | Team-internal decision → `compare-n-approaches-shape` |
| The proposal will be a long-term reference document | One-off study → `compare-n-approaches-shape` |
| You expect ≥2 weeks of comment + revision cycles | Need to ship this week → `implementation-plan-shape` |

## Section order (fixed)

```
1. METADATA HEADER       — RFC-id, status, author, dates, target version
2. ABSTRACT              — one-paragraph "what is this RFC about"
3. CONTEXT / MOTIVATION  — why this problem matters now
4. PROPOSAL              — the recommended approach in detail
5. ALTERNATIVES          — N options considered + why each was rejected
6. UNRESOLVED QUESTIONS  — explicit list of things the RFC does NOT decide
7. SECURITY / PRIVACY    — threat model, attack surface, data exposure
8. ROLLOUT / MIGRATION   — how does this land for existing users
9. REFERENCES            — prior art, papers, RFCs, runbooks
10. CHANGE LOG           — every revision the document has been through
```

## Markdown scaffold

```html
<article class="vc-doc vc-doc--whitepaper" data-ve-prose>

<!-- 1. Metadata header -->
<header class="vc-doc-header vc-rfc-header">
  <p class="vc-type-overline">RFC · RFC-0231</p>
  <h1>OIDC for session authentication</h1>
  <dl class="vc-rfc-meta">
    <dt>Status</dt>     <dd><span class="vc-pill vc-pill--status-draft">Draft</span></dd>
    <dt>Author</dt>     <dd>@alice (auth team)</dd>
    <dt>Created</dt>    <dd>2026-04-22</dd>
    <dt>Last updated</dt><dd>2026-05-16</dd>
    <dt>Target</dt>     <dd>v2026.Q3</dd>
    <dt>Discussion</dt> <dd><a href="#">github.com/org/repo/discussions/521</a></dd>
  </dl>
</header>

<!-- 2. Abstract -->
<section id="abstract">
  <h2><span class="vc-num">01</span> Abstract</h2>
  <p>This RFC proposes migrating session authentication from the legacy
     database-backed session table to OpenID Connect (OIDC) token
     exchange…</p>
</section>

<!-- 3. Context / Motivation -->
<section id="context">
  <h2><span class="vc-num">02</span> Context</h2>
  <p>The current session implementation creates a row in
     <code>sessions</code> on every login…</p>
  <ul>
    <li><strong>Load:</strong> p99 session-create latency hits 1.4s at
        peak.</li>
    <li><strong>Operational cost:</strong> Postgres session table is the
        #1 row-count growth driver.</li>
    <li><strong>Security:</strong> session-token compromise requires a
        DB write to revoke, with replication lag.</li>
  </ul>
</section>

<!-- 4. Proposal -->
<section id="proposal">
  <h2><span class="vc-num">03</span> Proposal</h2>
  <p>Move session-token creation behind a thin OIDC-token-exchange
     adapter…</p>
  <h3>Architecture</h3>
  <figure class="vc-figure">
    <svg viewBox="0 0 700 240" role="img" aria-label="Proposed flow">
      <!-- inline SVG -->
    </svg>
    <figcaption>Proposed flow — OIDC verifier sits behind the gateway;
      session store becomes write-rarely.</figcaption>
  </figure>
  <h3>API changes</h3>
  <p>New endpoint <code>POST /auth/exchange</code>; deprecated
     <code>POST /auth/login-legacy</code> (kept for 90 days)…</p>
</section>

<!-- 5. Alternatives — N options + why each was rejected -->
<section id="alternatives">
  <h2><span class="vc-num">04</span> Alternatives considered</h2>

  <article class="vc-alternative vc-alternative--rejected">
    <header>
      <span class="vc-alt-num">A1</span>
      <h3>Status quo — keep DB-backed sessions</h3>
      <span class="vc-alt-verdict">rejected</span>
    </header>
    <p>Continue using the <code>sessions</code> table…</p>
    <p class="vc-alt-reason"><strong>Why rejected:</strong> does not
       address p99 latency or operational cost.</p>
  </article>

  <article class="vc-alternative vc-alternative--rejected">
    <header>
      <span class="vc-alt-num">A2</span>
      <h3>JWT signed locally, no OIDC</h3>
      <span class="vc-alt-verdict">rejected</span>
    </header>
    <p>Sign tokens with our own private key…</p>
    <p class="vc-alt-reason"><strong>Why rejected:</strong> requires
       us to operate key rotation, JWKS endpoint, and federation —
       work we get for free from an OIDC provider.</p>
  </article>

  <article class="vc-alternative">
    <header>
      <span class="vc-alt-num">A3</span>
      <h3>OIDC via Auth0 (managed)</h3>
      <span class="vc-alt-verdict">considered</span>
    </header>
    <p>Use Auth0 as the OIDC provider…</p>
    <p class="vc-alt-reason"><strong>Why not chosen (this RFC):</strong>
       vendor lock-in and per-MAU cost. Re-evaluate if our scale
       changes.</p>
  </article>
</section>

<!-- 6. Unresolved questions -->
<section id="unresolved">
  <h2><span class="vc-num">05</span> Unresolved questions</h2>
  <ul class="vc-unresolved-list">
    <li><strong>Q1.</strong> Token revocation across regions —
        synchronous or eventually-consistent?</li>
    <li><strong>Q2.</strong> Rollback strategy if OIDC provider becomes
        unavailable — do we accept downtime or run a hot-standby
        legacy path?</li>
  </ul>
</section>

<!-- 7. Security -->
<section id="security">
  <h2><span class="vc-num">06</span> Security &amp; privacy</h2>
  <h3>Threat model</h3>
  <p>Adversary classes: external attacker with stolen credentials;
     compromised internal service…</p>
  <h3>New attack surface</h3>
  <ul>
    <li>OIDC token exchange endpoint becomes the new credential-handling
        path.</li>
    <li>Token verification depends on the OIDC provider's JWKS being
        reachable; cache aggressively but bound TTL.</li>
  </ul>
  <h3>Data exposure</h3>
  <p>No PII leaves the tenant boundary; tokens carry only
     <code>sub</code> + role claims.</p>
</section>

<!-- 8. Rollout -->
<section id="rollout">
  <h2><span class="vc-num">07</span> Rollout</h2>
  <p>Phased: 0% internal → 10% canary → 100%. Legacy path kept for
     90 days behind <code>auth_v1_enabled</code> flag…</p>
</section>

<!-- 9. References -->
<section id="references">
  <h2><span class="vc-num">08</span> References</h2>
  <ol class="vc-references">
    <li>RFC 6749, "The OAuth 2.0 Authorization Framework", Hardt, 2012.</li>
    <li>RFC 7519, "JSON Web Token (JWT)", Jones et al., 2015.</li>
    <li>OpenID Connect Core 1.0, openid.net/specs/openid-connect-core-1_0.html.</li>
  </ol>
</section>

<!-- 10. Change log -->
<section id="change-log">
  <h2><span class="vc-num">09</span> Change log</h2>
  <dl class="vc-changelog">
    <dt>2026-05-16 v3 — @alice</dt>
      <dd>Added A3 (managed Auth0); removed assumption that vendor was
          out of scope.</dd>
    <dt>2026-05-02 v2 — @alice</dt>
      <dd>Reworked Security section after threat-modeling session.</dd>
    <dt>2026-04-22 v1 — @alice</dt>
      <dd>Initial draft.</dd>
  </dl>
</section>

</article>
```

## The RFC status pill

| Status | Pill class | Meaning |
|---|---|---|
| Draft | `vc-pill--status-draft` | In progress; comments welcome |
| Final-comment | `vc-pill--status-final` | Comments closing in N days |
| Accepted | `vc-pill--status-accepted` | Decision made; implementation starting |
| Rejected | `vc-pill--status-rejected` | Decision made; not proceeding |
| Withdrawn | `vc-pill--status-withdrawn` | Author retracted |
| Superseded | `vc-pill--status-superseded` | Replaced by another RFC (link to it in the abstract) |

```css
.vc-pill--status-draft     { background: var(--vc-color-info, #3464a8);   color: var(--vc-color-on-accent, #fff); }
.vc-pill--status-final     { background: var(--vc-color-warning, #a8791f);color: var(--vc-color-on-accent, #fff); }
.vc-pill--status-accepted  { background: var(--vc-color-success, #3a6b5c);color: var(--vc-color-on-accent, #fff); }
.vc-pill--status-rejected  { background: var(--vc-color-danger, #a84a32); color: var(--vc-color-on-accent, #fff); }
.vc-pill--status-withdrawn { background: var(--vc-color-content-subtle, #8a8170); color: var(--vc-color-on-accent, #fff); }
.vc-pill--status-superseded{ background: var(--vc-color-surface-sunken, #f1ece0); color: var(--vc-color-content-muted, #5b5343); }
```

## The Alternatives section

Each alternative is its own `<article class="vc-alternative">` with:

1. An ID (`A1`, `A2`, `A3`) so reviewers can reference them in
   comments ("re A2: …").
2. A heading.
3. A verdict pill (`considered` / `rejected` / `chosen`).
4. A "Why rejected:" / "Why not chosen (this RFC):" reason paragraph.

```css
.vc-alternative {
  margin-block: var(--vc-space-5, 32px);
  padding: var(--vc-space-3, 12px) var(--vc-space-4, 16px);
  border-inline-start: 3px solid var(--vc-color-border, #e3dcc9);
}
.vc-alternative--rejected {
  border-inline-start-color: var(--vc-color-content-subtle, #8a8170);
  opacity: 0.92;
}
.vc-alt-num {
  display: inline-block;
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: var(--vc-radius-sm, 4px);
  background: var(--vc-color-surface-sunken, #f1ece0);
  margin-inline-end: var(--vc-space-2, 8px);
}
.vc-alt-verdict {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vc-color-content-muted, #5b5343);
}
.vc-alt-reason {
  margin-block-start: var(--vc-space-2, 8px);
  padding-block-start: var(--vc-space-2, 8px);
  border-block-start: 1px dashed var(--vc-color-border, #e3dcc9);
  font-size: var(--vc-text-1, 14px);
  color: var(--vc-color-content-muted, #5b5343);
}
```

## The whitepaper template's auto-numbering

The RFC uses the `vc-doc--whitepaper` template because that template
provides decimal-leading-zero section numbering via CSS counter — RFC
sections are conventionally numbered (`01`, `02`, …) and the CSS
counter handles renumbering when sections are added or reordered.

Manual `<span class="vc-num">01</span>` markers in the scaffold above
are the explicit form; if you set `class="vc-doc--whitepaper"`, the
CSS counter (`counter(vc-sec, decimal-leading-zero)`) on `h2::before`
auto-generates them. Pick one approach per document; do not mix.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-info` | Draft status pill |
| `--vc-color-warning` | Final-comment status pill |
| `--vc-color-success` | Accepted status pill |
| `--vc-color-danger` | Rejected status pill |
| `--vc-color-content-subtle` | Withdrawn pill, rejected alternative border |
| `--vc-color-accent` | Section numbers (whitepaper counter), references list marker |
| `--vc-color-content-muted` | Metadata `<dd>`, alternative reason, change log dates |
| `--vc-color-border` | Alternative border, change log dividers |
| `--vc-font-mono` | RFC-id, alternative IDs, dates |

## Composition with other skills

| Section | Embed from |
|---|---|
| Metadata `<dl>` | `amvcp-prose-pages` (this skill) |
| Status pill | `amvcp-prose-pages` (this skill) — `metadata-keypill-strip` |
| Proposal architecture SVG | `amvcp-graph-diagrams` |
| Alternative cards | `amvcp-prose-pages` (this skill) |
| Change log `<dl>` | `amvcp-prose-pages` (this skill) — `change-log-document-shape` |
| References numbered list | `amvcp-prose-pages` (this skill) — `appendix-and-references-bibliography` |

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);
window.amvcpReportDoc.init(document);
const report = window.amvcpReportDoc.runGates(document, "RFC-0231");
// Whitepaper template auto-numbers via CSS — no JS for numbering.
```

## Selection / comment notes

- Each alternative card is selectable
  (`{type:"alternative", altId:"A2"}`) so reviewers can comment
  "A2 should be reconsidered".
- Each unresolved question is selectable per `<li>` —
  `{type:"unresolved", qId:"Q1"}`.
- Each change-log entry is selectable.
- Status pill is selectable as a unit so a reviewer can comment
  "status should be Final-comment, not Draft".
- Metadata `<dt>`/`<dd>` pairs are selectable — useful for
  "deadline is wrong" comments.

## Decision-mini hook

RFCs frequently host a decision-mini per unresolved question:

```html
<li>
  <strong>Q1.</strong> Token revocation across regions — synchronous
    or eventually-consistent?
  <div class="ve-decision" data-decision-id="rfc-0231-Q1-revocation">
    <button data-choice="sync">Synchronous (slower; safer)</button>
    <button data-choice="async">Eventually-consistent (faster; brief stale window)</button>
    <button data-choice="defer">Defer to follow-up RFC</button>
  </div>
</li>
```

## Anti-patterns

- **Alternatives section with no rejections** — every RFC has a
  status-quo alternative; rejecting it explicitly is part of the
  job. Omitting alternatives signals you did not consider any.
- **Verdict pill colored "considered" or worse on a chosen
  alternative** — pick a winner. If none is chosen, the RFC is not
  ready to ship.
- **Change log entries with no diff** — every change-log line MUST
  describe what changed (and ideally why). `"v3 — minor fixes"`
  forces every reader to diff manually.
- **No security section** — even RFCs about UI changes have a
  security section ("no new attack surface" is a valid contents).
- **No unresolved-questions section** — every RFC has them. Omitting
  the section means you have not surfaced them.
- **Inline images of architecture diagrams** — embed inline SVG so
  it scales, themes, and survives offline.
- **References as a flat link list** — use a numbered list with
  author + title + year + source, IETF-style.
- **Metadata in the header that lies** — "Last updated: 2026-04-22"
  on a document edited last week is dishonest. Update on every revision
  or omit the field.
