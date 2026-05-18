# TL;DR summary card

## Table of Contents

- [When to add a TL;DR](#when-to-add-a-tldr)
- [Default scaffold (clay-border)](#default-scaffold-clay-border)
- [Slate-bg variant (postmortem / security advisory)](#slate-bg-variant-postmortem--security-advisory)
- [Word-count discipline](#word-count-discipline)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition](#composition)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The leading paragraph that summarises everything below. Standard
appearance: a clay-left-border `<aside>` directly under the document
header, with a small mono-uppercase "TL;DR" eyebrow followed by 1-3
sentences. A reader who reads only this card has the headline.

The TL;DR convention appeared in technical writing alongside the rise
of social-media-style summaries and quickly became universal: the
reader's first scan is the headline + the TL;DR; everything else is
read only if the headline earns it.

This skill ships two TL;DR variants. The **clay-border default** is
appropriate for most documents (PR writeup, feature explainer,
implementation plan). The **slate-bg variant** is reserved for cases
where the summary itself is the news (incident postmortem, security
advisory).

## When to add a TL;DR

| Add it | Skip it |
|---|---|
| Document is ≥3 screens long | Document is ≤1 screen (the whole thing is a TL;DR) |
| Most readers will not read end-to-end | Reference doc indexed by symbol (no narrative flow) |
| You can compress the conclusion to 1-3 sentences | The document is purely exploratory with no conclusion |
| Senior readers will skim the page top-down | Audience is required to read every section |
| The conclusion changes the reader's behaviour | Pure background reading |

For documents shorter than 3 screens, the TL;DR competes with the
prose immediately below it and dilutes both. If you cannot resist
writing one, it probably means the document is too long; tighten the
body instead.

## Default scaffold (clay-border)

```html
<aside class="vc-tldr">
  <p class="vc-tldr-eyebrow">TL;DR</p>
  <p>OIDC migration phase 2 ships next Tuesday. Flag default OFF in
     prod; 30-day rollback window via legacy mirror. p99 latency
     1.4s → 180ms.</p>
</aside>
```

CSS contract:

```css
.vc-tldr {
  margin-block: var(--vc-space-4, 16px) var(--vc-space-5, 32px);
  padding: var(--vc-space-3, 12px) var(--vc-space-4, 16px);
  border-inline-start: 4px solid var(--vc-color-accent, #b8861f);
  background: color-mix(in srgb, var(--vc-color-accent, #b8861f) 6%,
              transparent);
  border-radius: 0 var(--vc-radius-md, 8px) var(--vc-radius-md, 8px) 0;
}
.vc-tldr-eyebrow {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vc-color-accent, #b8861f);
  margin: 0 0 var(--vc-space-2, 8px);
}
.vc-tldr > p:not(.vc-tldr-eyebrow) {
  margin: 0;
  font-size: var(--vc-text-2, 16px);
  line-height: 1.5;
}
```

## Slate-bg variant (postmortem / security advisory)

```html
<aside class="vc-tldr vc-tldr--slate">
  <p class="vc-tldr-eyebrow">TL;DR</p>
  <p>Cache stampede during slot-fill rollout; SEV-2, 47 min, no data
     loss. Root cause: every node missed the same cache key
     simultaneously. Fix: TTL jitter (merged). 3 follow-up actions.</p>
</aside>
```

```css
.vc-tldr--slate {
  background: var(--vc-color-content, #1f1a14);
  color: var(--vc-color-canvas, #faf6ee);
  border-inline-start: none;
  border-radius: var(--vc-radius-md, 8px);
}
.vc-tldr--slate .vc-tldr-eyebrow {
  color: var(--vc-color-canvas, #faf6ee);
  opacity: 0.7;
}
```

The slate variant inverts foreground/background; the QA gate
(`wcag-contrast`) checks the inverted pair against WCAG normal-text
4.5:1.

## Word-count discipline

A TL;DR is **1-3 sentences, ≤60 words**. Beyond that, the card stops
being a summary and starts being a section. Hard-cap rules:

| Words | Verdict |
|---|---|
| ≤20 | Probably too short; missing context |
| 21-40 | Sweet spot |
| 41-60 | Acceptable; consider trimming |
| 61-100 | Too long; either trim or restructure into prose |
| 100+ | Not a TL;DR — convert to a "Summary" `<section>` |

The 60-word cap is the reason TL;DRs land: a reader can read them in
8 seconds and decide whether to commit to the rest of the page.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-accent` | Default border + eyebrow + background tint |
| `--vc-color-content` | Slate variant background |
| `--vc-color-canvas` | Slate variant text |
| `--vc-font-mono` | "TL;DR" eyebrow |
| `--vc-text-0` | Eyebrow size |
| `--vc-text-2` | Body size (one notch larger than normal body) |
| `--vc-radius-md` | Trailing-edge corner radius |

The default variant uses one color role (`--vc-color-accent`) for the
border AND the tinted background (via `color-mix(6%)`) — a single
theme change reskins both at once.

## Composition

TL;DRs are stand-alone primitives — they sit at the top of any
document shape:

| Shape | Variant |
|---|---|
| `implementation-plan-shape` | Default (clay border) |
| `pr-writeup-author-side-shape` | Default |
| `pr-review-reviewer-side-shape` | Default |
| `feature-explainer-shape` | Default |
| `incident-postmortem-shape` | **Slate** |
| `rfc-shape` | Abstract section (not a TL;DR — RFCs use the formal Abstract convention) |
| `adr-decision-log-shape` | Skip — ADRs are short enough |
| `status-report-shape` | Skip — the stat band IS the summary |

## Selection / comment notes

- The TL;DR card is selectable as a unit (`{type:"tldr"}`) so a
  reviewer can comment on the framing without highlighting the
  text.
- The eyebrow is decorative — `aria-hidden="true"` is not added,
  because the text content "TL;DR" carries useful meaning for
  screen-reader users.

## Decision-mini hook

TL;DRs occasionally host a decision-mini for the document's headline
question — but only when the document is short enough that the TL;DR
IS the conclusion:

```html
<aside class="vc-tldr">
  <p class="vc-tldr-eyebrow">TL;DR</p>
  <p>OIDC migration is ready to ship. Approve to merge.</p>
  <div class="ve-decision" data-decision-id="oidc-merge-approval">
    <button data-choice="approve">Approve merge</button>
    <button data-choice="block">Block — concerns below</button>
  </div>
</aside>
```

For longer documents, the decision-mini belongs further down, near
the Recommendation / Next Steps section.

## Anti-patterns

- **TL;DR that doesn't summarise anything below it** — e.g. a TL;DR
  that says "this document explains how OIDC works" without the
  conclusion. Useless. The TL;DR is the *result*, not the topic.
- **TL;DR with a heading instead of an eyebrow** — `<h2>TL;DR</h2>`
  pollutes the document outline (screen readers and TOC pick it up).
  Use the eyebrow.
- **Multiple TL;DRs in one document** — there is one headline. If you
  have two, the document is two documents.
- **TL;DR that copies the first paragraph of the body** — the body's
  first paragraph already serves as the opening. A redundant TL;DR
  wastes the reader's first 8 seconds.
- **Slate variant on a non-postmortem document** — the slate
  inversion is reserved for "the summary IS the news" cases. Used
  elsewhere, it screams without reason.
- **Bullet list inside the TL;DR** — TL;DRs are prose. Bullets make
  them scannable but defeat the "1-3 sentences" discipline.
- **A code block inside the TL;DR** — code belongs in the body.
  Inline `<code>` for token names is fine; fenced code blocks break
  the summary card visually.
- **A TL;DR longer than the first body section** — the TL;DR has
  become the article. Move it to the body and write a real summary.
