# Abstract + keywords block — formal-document opener

The structured opener that scientific papers, RFCs, and formal
whitepapers use instead of (or alongside) a TL;DR card. An
**Abstract** section presents the document's purpose, methodology,
and findings in a single dense paragraph (150-250 words); a **Keywords**
line lists 4-8 indexable terms.

Abstracts and TL;DRs serve overlapping purposes but with different
registers. TL;DRs are casual, agent-friendly, and conversational;
Abstracts are formal, peer-reviewed, and indexable. Pick by audience:
external-academic / standards-body / regulatory readers expect
Abstracts; internal-engineering / product readers expect TL;DRs.

## When to use which

| Use Abstract + Keywords | Use TL;DR |
|---|---|
| Academic / scientific paper | Engineering blog post |
| Standards-body RFC (IETF style) | Internal RFC |
| Regulatory submission | Sprint plan |
| Audience expects citation indexing | Audience reads inline |
| Document is published to a journal / archive | Document lives in the wiki |
| Length is constrained by venue (≤8 pages) | Length is whatever's needed |

When in doubt for a hybrid audience, write BOTH: a TL;DR card
immediately under the header for casual readers, and an Abstract
section as `02 Abstract` for formal use. The TL;DR is shorter (1-3
sentences); the Abstract is longer (a paragraph) and more structured.

## Scaffold

```html
<header class="vc-doc-header">
  <p class="vc-type-overline">Whitepaper · WP-2026-04</p>
  <h1>Sliding-window rate limiting at scale</h1>
  <p class="vc-doc-byline">@alice (auth team) · 2026-05-16 · v1.0</p>
</header>

<!-- 1. Abstract — dense paragraph, 150-250 words -->
<section id="abstract" class="vc-abstract">
  <h2>Abstract</h2>
  <p>This paper describes a sliding-window rate-limiting implementation
     that operates at 47k req/s on a single Redis instance with p99
     latency under 4ms. We compare three implementation strategies
     (fixed-window with reset, sliding-window with sub-bucket counters,
     and sliding-window with weighted average) against four workload
     profiles (uniform, bursty, periodic, and adversarial). Results
     show that sub-bucket counters dominate at scale, but the
     weighted-average approach is preferable when the rate limit
     budget is small (≤10 req/s per bucket). We provide a reference
     implementation in 240 lines of TypeScript plus a 60-line Lua
     script for the atomic Redis operations. The code is open-sourced
     under MIT and ships with property-based tests covering the
     interesting edge cases.</p>
</section>

<!-- 2. Keywords — short indexable terms -->
<aside class="vc-keywords">
  <span class="vc-keywords-label">Keywords</span>
  <ul>
    <li>rate limiting</li>
    <li>sliding window</li>
    <li>Redis Lua</li>
    <li>back-pressure</li>
    <li>distributed systems</li>
    <li>p99 latency</li>
  </ul>
</aside>
```

## CSS contract

```css
.vc-abstract {
  margin-block-end: var(--vc-space-6, 48px);
}
.vc-abstract h2 {
  font-size: var(--vc-text-2, 16px);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vc-color-content-muted, #5b5343);
  margin-block: 0 var(--vc-space-2, 8px);
}
.vc-abstract p {
  font-size: var(--vc-text-1, 14px);
  line-height: 1.6;
  text-align: justify;
  hyphens: auto;
  margin: 0;
  max-width: 60ch;
}

.vc-keywords {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--vc-space-2, 8px);
  margin-block: var(--vc-space-4, 16px);
  padding-block-start: var(--vc-space-3, 12px);
  border-block-start: 1px solid var(--vc-color-border, #e3dcc9);
}
.vc-keywords-label {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vc-color-content-muted, #5b5343);
  margin-inline-end: var(--vc-space-2, 8px);
}
.vc-keywords ul {
  display: contents;
  list-style: none;
  margin: 0;
  padding: 0;
}
.vc-keywords li::after {
  content: " · ";
  color: var(--vc-color-content-subtle, #8a8170);
}
.vc-keywords li:last-child::after { content: ""; }
.vc-keywords li {
  font-size: var(--vc-text-1, 14px);
  color: var(--vc-color-content-muted, #5b5343);
}
```

The justify + hyphens treatment on the abstract paragraph mimics
academic typesetting. The middle-dot separator between keywords is
the IEEE / ACM convention.

## The IMRAD-like structure inside an abstract

A well-structured abstract is divided into four implicit sentences
(or sentence-groups), even though it reads as a single paragraph:

1. **What** — the problem / what the paper is about (1-2 sentences).
2. **How** — the methodology / approach (1-2 sentences).
3. **What we found** — the results (1-2 sentences).
4. **Why it matters** — the implication / contribution (1 sentence).

Walking the abstract above through this lens:

| Sentence | Role |
|---|---|
| "This paper describes a sliding-window rate-limiting implementation that operates at 47k req/s…" | What |
| "We compare three implementation strategies… against four workload profiles…" | How |
| "Results show that sub-bucket counters dominate at scale, but the weighted-average approach is preferable…" | What we found |
| "We provide a reference implementation in 240 lines of TypeScript…" | Why it matters |

Following the WHHW order makes the abstract scannable; the reader
knows where each piece of information lives.

## Word-count discipline

| Length | Verdict |
|---|---|
| ≤100 words | Too thin; missing methodology or results |
| 100-150 | Short but acceptable for short papers |
| 150-250 | Sweet spot |
| 250-350 | Acceptable for long whitepapers |
| 350+ | Too long; likely incorporates body content |

The 250-word soft cap exists because abstracts are commonly indexed
by databases that truncate after 250 words. Anything beyond that may
be lost.

## Keyword discipline

| Count | Verdict |
|---|---|
| ≤3 | Too few to index; pick more specific terms |
| 4-6 | Sweet spot |
| 7-8 | Acceptable for cross-domain papers |
| 9+ | Too many; the index loses meaning |

Choose keywords that:

- Appear in the body (so a search-and-find works).
- Are recognized terms in the field (no neologisms unless you
  define them).
- Range from general (`rate limiting`) to specific
  (`Redis Lua`) — both kinds help different searchers.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-content-muted` | Abstract h2, keywords label, keywords text |
| `--vc-color-content-subtle` | Keyword separator dots |
| `--vc-color-border` | Keywords top border |
| `--vc-text-2` | Abstract h2 |
| `--vc-text-1` | Abstract body, keywords text |
| `--vc-text-0` | Keywords label |
| `--vc-font-mono` | Keywords label |

## Composition

| Containing shape | Abstract + Keywords? |
|---|---|
| `whitepaper-shape` | Yes (formal venue) |
| `rfc-shape` | Yes (Abstract is formal RFC convention; Keywords optional) |
| `feature-explainer-shape` | No (TL;DR instead) |
| `architecture-explainer-shape` | No (1-paragraph summary instead) |
| `case-study-shape` | Optional (replaces TL;DR for academic case studies) |
| `pr-writeup-author-side-shape` | No |
| `incident-postmortem-shape` | No |

When the same shape supports both, the convention is:

- TL;DR card right after the header (1-3 sentences for casual readers).
- Abstract section as `01 Abstract` (full paragraph for formal readers).

The two complement each other; one is not a replacement for the
other in formal documents.

## Selection / comment notes

- The abstract is selectable as a unit
  (`{type:"abstract"}`) so a reviewer can comment on the framing.
- Keywords are selectable individually
  (`{type:"keyword", text:"rate limiting"}`) — useful for "missing
  keyword" or "this keyword is not actually in the paper" comments.
- The abstract paragraph IS selectable per-sentence via the normal
  `data-ve-prose` paragraph numbering — reviewers can comment on
  individual sentences (the IMRAD structure makes this useful).

## Anti-patterns

- **Abstract that copies the introduction verbatim** — defeats the
  point. The abstract is a self-contained summary; the introduction
  expands.
- **Abstract that uses citations** — abstracts MUST stand alone.
  Every fact in the abstract must be in the body, but no `[1]`
  references inside the abstract.
- **Future-tense abstract** ("This paper will describe…") — past
  tense is the convention. The paper exists; describe what it does,
  not what it intends.
- **Keywords identical to title words** — wastes index slots.
  Pick keywords that complement the title.
- **Keyword count outside 4-8** — see the discipline table.
- **Abstract longer than 350 words** — see the discipline table.
- **Both Abstract AND TL;DR labelled identically** — pick distinct
  labels (Abstract / TL;DR) or omit one.
- **Abstract that promises results not delivered in the body** —
  the abstract becomes marketing. Be honest.
- **Keywords in title-case (`Rate Limiting`, `Sliding Window`)** —
  lowercase is the convention, except for proper nouns.
- **Abstract section under `<section id="01">`** — use a meaningful
  id (`abstract`); the auto-counter handles the displayed number.
