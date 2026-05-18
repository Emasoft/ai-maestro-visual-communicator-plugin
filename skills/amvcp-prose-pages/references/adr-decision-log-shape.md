# ADR (Architecture Decision Record) shape — context, decision, consequences

## Table of Contents

- [When to choose this shape](#when-to-choose-this-shape)
- [Section order (fixed — Nygard 2011 contract)](#section-order-fixed--nygard-2011-contract)
- [Markdown scaffold](#markdown-scaffold)
- [The `.vc-adr` modifier](#the-vc-adr-modifier)
- [The Status pill — special behaviour](#the-status-pill--special-behaviour)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition with other skills](#composition-with-other-skills)
- [Lib functions called](#lib-functions-called)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The minimal decision-record format that captures what was decided, why,
and what happens next — separate from the longer-form RFC. ADRs are
short (one screen), terminal (the decision is made), and append-only
(a decision is updated by superseding it with a new ADR, not by editing
the old one).

The shape is canonical: Michael Nygard's "Documenting Architecture
Decisions" (2011) standardized the four-section structure of Title /
Status / Context / Decision / Consequences. Every major engineering
organization that adopts ADRs uses some variant of this layout, and
deviating from it loses the cross-organization recognizability.

## When to choose this shape

| Use this shape | Use a different shape |
|---|---|
| Decision is already made and you want a permanent record | Decision is still open → `rfc-shape` |
| Single short artifact (≤1 screen, ~300 words) | Multi-page document → `rfc-shape` |
| Append-only log; existing ADRs are immutable | Document that will be edited as the design evolves → `feature-explainer-shape` |
| Decision has clear consequences (positive AND negative) | Pure announcement with no trade-offs → use a Slack message |
| You will write many ADRs over time and want them to read uniformly | One-off decision → embed in a `pr-writeup-author-side-shape` |

## Section order (fixed — Nygard 2011 contract)

```
1. TITLE              — short, neutral, sentence-cased
2. STATUS             — Proposed / Accepted / Deprecated / Superseded by ADR-NNN
3. CONTEXT            — what is the problem, what forces are at play
4. DECISION           — what is the change being made (active voice)
5. CONSEQUENCES       — what becomes easier AND what becomes harder
```

Optional appended sections:

```
6. ALTERNATIVES       — short bullets of options considered (full analysis → RFC)
7. RELATED ADRS       — links to ADRs this one builds on or supersedes
```

## Markdown scaffold

```html
<article class="vc-doc vc-doc--technical-report vc-adr" data-ve-prose>

<header class="vc-doc-header">
  <p class="vc-type-overline">ADR-0042</p>
  <h1>Use UUIDv7 for primary keys</h1>
  <p class="vc-doc-byline">
    <span class="vc-pill vc-pill--status-accepted">Accepted</span>
    · 2026-05-12 · @alice (data team)
  </p>
</header>

<section id="context">
  <h2>Context</h2>
  <p>Our new tables need primary keys. UUIDv4 is random and breaks
     B-tree locality on insert (every insert lands in a random page);
     auto-increment integers expose row counts to API consumers and
     leak business metrics. UUIDv7 is time-ordered (millisecond
     precision in the high bits) with a random tail, giving both
     opaqueness and insert locality.</p>
</section>

<section id="decision">
  <h2>Decision</h2>
  <p>All new tables MUST use <code>UUIDv7</code> for primary keys.
     The application layer generates the UUID before insert; the
     database is responsible for uniqueness only.</p>
  <p>Generation library: <code>uuidv7-rs</code> on the backend,
     <code>@oslojs/crypto/uuid</code> on the frontend. Both produce
     RFC 9562-compliant UUIDv7s.</p>
</section>

<section id="consequences">
  <h2>Consequences</h2>
  <h3>Positive</h3>
  <ul>
    <li>B-tree inserts cluster — fewer page splits, faster bulk insert.</li>
    <li>IDs are sort-orderable by creation time without a separate
        timestamp column.</li>
    <li>Row counts are not leaked through APIs.</li>
  </ul>
  <h3>Negative</h3>
  <ul>
    <li>Application now owns ID generation — clock-skew can produce
        non-monotonic IDs across replicas (acceptable; UUIDv7's
        ms-precision swamps practical skew).</li>
    <li>UUIDs are 36-char strings — 4× the size of int64. Index size
        grows accordingly.</li>
    <li>Migrating existing tables is out of scope; this ADR applies
        only to new tables.</li>
  </ul>
</section>

<section id="alternatives">
  <h2>Alternatives considered</h2>
  <ul>
    <li><strong>UUIDv4 (random):</strong> opaque, but breaks insert
        locality.</li>
    <li><strong>Auto-increment int64:</strong> compact, locality-friendly,
        but leaks row counts via APIs.</li>
    <li><strong>Snowflake IDs:</strong> require centralized ID server;
        operational burden not justified at our scale.</li>
    <li><strong>ULID:</strong> functionally similar to UUIDv7 but less
        widely-supported in client libraries; UUIDv7 is now the
        IETF-blessed standard.</li>
  </ul>
</section>

<section id="related">
  <h2>Related ADRs</h2>
  <ul>
    <li><a href="#">ADR-0033 — API ID exposure conventions</a></li>
    <li><a href="#">ADR-0021 — Database migration policy</a> (superseded
        the auto-increment default)</li>
  </ul>
</section>

</article>
```

## The `.vc-adr` modifier

ADRs use a narrower reading measure than other docs (the canonical
"one screen" length needs comfortable line-length). Override the
template measure:

```css
.vc-adr {
  --vc-doc-measure: 56ch;
}
.vc-adr h1 { font-size: var(--vc-text-5, 32px); }
.vc-adr h2 { font-size: var(--vc-text-3, 20px);
             margin-block-start: var(--vc-space-5, 32px); }
.vc-adr h3 { font-size: var(--vc-text-2, 16px);
             text-transform: uppercase;
             letter-spacing: 0.06em;
             color: var(--vc-color-content-muted, #5b5343);
             margin-block-start: var(--vc-space-3, 12px); }
```

The smaller h2 + uppercase-mono h3 visually distinguishes ADRs from
longer-form documents at first glance.

## The Status pill — special behaviour

Unlike RFC status (which evolves while the document is live), ADR
status has only 4 values, and changing from "Accepted" to anything else
requires a NEW ADR:

| Status | When | Pill |
|---|---|---|
| Proposed | Author is gathering feedback | `vc-pill--status-draft` (info-blue) |
| Accepted | Decision is in effect | `vc-pill--status-accepted` (success-olive) |
| Deprecated | Decision is being phased out (but not yet replaced) | `vc-pill--status-superseded` (gray) |
| Superseded | Replaced by another ADR; pill text MUST include the new ADR number | `vc-pill--status-superseded` |

```html
<span class="vc-pill vc-pill--status-superseded">
  Superseded by <a href="#">ADR-0067</a>
</span>
```

ADRs are **append-only**: once accepted, the content is immutable. To
change a decision, write a new ADR that supersedes the old one, then
edit the old ADR's status pill to "Superseded by ADR-NNN" (this is the
only sanctioned edit to a published ADR).

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-success` | Accepted status pill |
| `--vc-color-info` | Proposed status pill |
| `--vc-color-content-subtle` | Superseded / Deprecated status pill |
| `--vc-color-content-muted` | h3 (Positive / Negative), byline |
| `--vc-color-accent` | (rarely used — ADRs are deliberately monochrome) |
| `--vc-font-mono` | ADR number, related-ADR references |

ADRs are visually plain by design — accent colors and decorative
elements distract from the decision itself. The status pill is the
only chromatic element.

## Composition with other skills

| Section | Embed from |
|---|---|
| Status pill | `amvcp-prose-pages` (this skill) |
| Body prose | `amvcp-prose-pages` (this skill) |
| Code blocks (rare; usually 1-line inline `<code>`) | `amvcp-code-highlight` |
| Diagrams (avoid — keep it text-only) | — |
| Tables (occasionally for trade-off comparison) | `amvcp-tables` |

ADRs deliberately do NOT embed diagrams, charts, or interactive
elements. The Nygard contract is that ADRs are *prose decisions*; if
your decision requires a diagram, it deserves an RFC, not an ADR.

## Lib functions called

```js
window.amvcpReportDoc.injectReportDocCSS(document);
window.amvcpReportDoc.init(document);
const report = window.amvcpReportDoc.runGates(document, "ADR-0042");
```

## Selection / comment notes

- The Decision section is selectable as a unit
  (`{type:"section", sectionId:"decision"}`) so a reader can comment
  "this decision is no longer in effect".
- Each Consequence bullet is selectable per `<li>` — readers can
  flag "this negative is overstated" or "another consequence
  missing".
- Alternative bullets are selectable individually — useful for
  "this alternative should be reconsidered".
- Status pill is selectable — useful for "this ADR should be marked
  Deprecated".

## Decision-mini hook

ADRs are by definition past-tense decisions, so they rarely host
decision-minis. The one exception is the *supersession-trigger*: if
a reader is reconsidering the ADR, the comment thread might host:

```html
<div class="ve-decision" data-decision-id="adr-0042-reconsider">
  <p>Should ADR-0042 be reconsidered?</p>
  <button data-choice="keep">Keep as-is</button>
  <button data-choice="supersede">Write a superseding ADR</button>
  <button data-choice="deprecate">Mark deprecated, no replacement yet</button>
</div>
```

…but this happens in the *comment thread* attached to the ADR, not
inside the ADR document itself (which is immutable).

## Anti-patterns

- **Editing an accepted ADR's content** — breaks the append-only
  contract. Write a superseding ADR instead.
- **An ADR longer than one screen** — that is an RFC. ADRs are short
  by design.
- **A "Recommendation" section** — ADRs *are* the decision; no
  recommendation needed. (RFCs have recommendations; ADRs are the
  outcome.)
- **Status of "Implemented"** — Accepted means "in effect"; whether
  it has been implemented is a separate concern tracked elsewhere
  (in PRs).
- **A Consequences section with only positives** — every decision has
  trade-offs. Listing only positives signals you have not thought it
  through.
- **A diagram or chart in the ADR** — if the decision needs a
  diagram, write an RFC and reference it from the ADR.
- **An ADR without an ADR-id** — the id is how other ADRs reference
  it. ADRs without ids cannot be superseded.
- **Reordering ADRs by number** — ADRs are sequential. An ADR's
  number is its identity, even after it is superseded.
- **Decision in passive voice** — "It was decided that we should…"
  obscures ownership. Use active voice: "All new tables MUST use…".
