# Metadata key/value pill strip

## Table of Contents

- [When to use](#when-to-use)
- [Scaffold](#scaffold)
- [CSS contract](#css-contract)
- [Status-variant catalog](#status-variant-catalog)
- [Severity-pill content discipline](#severity-pill-content-discipline)
- [Key/value content discipline](#keyvalue-content-discipline)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition with other shapes](#composition-with-other-shapes)
- [Selection / comment notes](#selection--comment-notes)
- [Decision-mini hook](#decision-mini-hook)
- [Anti-patterns](#anti-patterns)

The compact 1-line meta-row pattern: a horizontal flow of
`<span class="vc-pill">` chips, each carrying a label / value pair
(e.g. `Duration · 47 min`, `Detected · 14:18 UTC`). Lifted from
`html-effectiveness` demo #12 (incident report) where it serves as
the canonical replacement for a multi-row `<dl>` metadata block.

The key/value pill strip is the **cleanest compact-meta-row pattern**
in the whole reference corpus. Use whenever a document needs 3-6
short metadata facts in the header without consuming vertical space.

## When to use

| Use a pill strip | Use a `<dl>` metadata block |
|---|---|
| 3-6 short fact pairs | 7+ pairs OR pairs with multi-line values |
| Each value is ≤20 characters | Long values (paragraphs of context) |
| Document needs a compact header | Header has plenty of vertical space |
| Reader will scan the strip horizontally | Reader will read top-to-bottom |
| Mobile must be supported (the strip wraps gracefully) | Desktop-only document |

For 1-2 fact pairs, write them as inline byline text. For 7+ pairs,
the strip becomes a wall of pills and a `<dl>` is clearer.

## Scaffold

```html
<div class="vc-pill-row">
  <span class="vc-pill vc-pill--sev">SEV-2</span>
  <span class="vc-pill vc-pill--resolved">Resolved</span>
  <span class="vc-pill">
    <span class="vc-pill-k">Duration</span>
    <span class="vc-pill-v">47 min</span>
  </span>
  <span class="vc-pill">
    <span class="vc-pill-k">Detected</span>
    <span class="vc-pill-v">2026-05-15 14:18 UTC</span>
  </span>
  <span class="vc-pill">
    <span class="vc-pill-k">Mitigated</span>
    <span class="vc-pill-v">2026-05-15 15:05 UTC</span>
  </span>
</div>
```

Two species of pills coexist in the strip:

1. **Status pills** (`SEV-2`, `Resolved`, `Draft`) — solid background,
   white text, weight-bold. They carry semantic state.
2. **Key/value pills** (`Duration · 47 min`) — subtle background,
   muted text, value in mono. They carry data.

## CSS contract

```css
.vc-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--vc-space-2, 8px);
  margin-block: var(--vc-space-3, 12px);
  align-items: center;
}

/* Default key/value pill */
.vc-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--vc-color-surface-sunken, #f1ece0);
  color: var(--vc-color-content-muted, #5b5343);
  font-size: var(--vc-text-0, 11px);
  white-space: nowrap;
}
.vc-pill-k {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: var(--vc-weight-bold, 700);
}
.vc-pill-v {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  color: var(--vc-color-content, #1f1a14);
}

/* Status variants — solid bg, white text */
.vc-pill--sev,
.vc-pill--resolved,
.vc-pill--draft,
.vc-pill--accepted,
.vc-pill--rejected {
  font-weight: var(--vc-weight-bold, 700);
  color: var(--vc-color-on-accent, #faf6ee);
}
.vc-pill--sev      { background: var(--vc-color-danger,  #a84a32); }
.vc-pill--resolved { background: var(--vc-color-success, #3a6b5c); }
.vc-pill--draft    { background: var(--vc-color-info,    #3464a8); }
.vc-pill--accepted { background: var(--vc-color-success, #3a6b5c); }
.vc-pill--rejected { background: var(--vc-color-danger,  #a84a32); }
```

## Status-variant catalog

The status pills have stable semantics across the plugin:

| Modifier | Meaning | Background role |
|---|---|---|
| `--sev` / `--severity-high` | Severity / incident severity | `--vc-color-danger` |
| `--resolved` | Issue closed / resolved | `--vc-color-success` |
| `--draft` / `--proposed` | RFC / ADR draft | `--vc-color-info` |
| `--accepted` | RFC / ADR accepted | `--vc-color-success` |
| `--rejected` | RFC / ADR rejected | `--vc-color-danger` |
| `--withdrawn` | RFC / ADR withdrawn | `--vc-color-content-subtle` |
| `--superseded` | RFC / ADR replaced | `--vc-color-content-subtle` |
| `--new` (file-tour) | New file in PR | `--vc-color-success` |
| `--mod` | Modified file | `--vc-color-info` |
| `--del` (file-tour) | Deleted file | `--vc-color-danger` |
| `--blocked` (action-item) | Blocked task | `--vc-color-warning` |

Pick from the catalog. Inventing a new variant ad-hoc dilutes the
plugin-wide vocabulary.

## Severity-pill content discipline

Severity pills (`SEV-2`, `P0`, `Sev-Critical`) MUST carry the actual
severity level as their text — never just the word "High" or
"Severity". The level is recognizable across teams and tools; the
word "High" is not.

```html
<!-- GOOD -->
<span class="vc-pill vc-pill--sev">SEV-2</span>
<span class="vc-pill vc-pill--sev">P0 · CRITICAL</span>

<!-- BAD -->
<span class="vc-pill vc-pill--sev">High</span>
<span class="vc-pill vc-pill--sev">Severity</span>
```

## Key/value content discipline

| Field | Good value | Bad value |
|---|---|---|
| Duration | `47 min`, `2h 14m` | `47 minutes`, `0h 47m 0s` |
| Timestamp | `2026-05-15 14:18 UTC`, `2026-05-15 16:18 CEST` | `15/05/2026 16:18` (locale-ambiguous), `1715782680000` (epoch ms) |
| Date | `2026-05-15`, `May 15, 2026` | `15-05-2026` (ambiguous), `2026-W19-3` (cryptic) |
| Author | `@alice`, `@alice (auth team)` | `Alice Smith` (long), `<email>` (PII risk) |
| Version | `v2026.Q3`, `v1.4.2` | `Version 1.4.2`, `Release 2026 Q3` |
| Branch / sha | `feature/oidc · 4f8c1a3` | `4f8c1a395a8c1d…` (long), `branch=feature/oidc` (verbose) |

The pill's value MUST fit on one line; if it doesn't, the field
doesn't belong in the pill strip.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-surface-sunken` | Default pill background |
| `--vc-color-content-muted` | Default pill text + key |
| `--vc-color-content` | Default pill value (slightly darker) |
| `--vc-color-danger` | Sev / Rejected variants |
| `--vc-color-success` | Resolved / Accepted / New variants |
| `--vc-color-info` | Draft / Mod variants |
| `--vc-color-warning` | Blocked variant |
| `--vc-color-content-subtle` | Withdrawn / Superseded variants |
| `--vc-color-on-accent` | All status-variant text (white-on-color) |
| `--vc-font-mono` | Pill values |
| `--vc-text-0` | Pill text size (11px) |

The `--vc-color-on-accent` token is critical: it MUST be a high-
contrast neutral that reads against every status background. Most
DESIGN.md set it to ivory or pure white.

## Composition with other shapes

| Shape | Pill strip placement |
|---|---|
| `incident-postmortem-shape` | Header (the canonical use) |
| `rfc-shape` | Header (status + author + dates + target) |
| `adr-decision-log-shape` | Byline (status + date) |
| `pr-writeup-author-side-shape` | Byline (PR# + author + branch + +/− stat) |
| `pr-review-reviewer-side-shape` | Byline (review type + reviewer + sha) |
| `status-report-shape` | Header (cadence + window + auto-pill) |
| `feature-explainer-shape` | Optional in header (version + status) |
| `whitepaper-shape` | Header (DOI/identifier + version + date) |

## Selection / comment notes

- The pill row is selectable as a unit — useful for "this metadata
  is wrong / incomplete" comments.
- Each pill is selectable independently
  (`{type:"pill", k:"Duration", v:"47 min"}`) so a reviewer can
  comment "this duration is wrong".
- Status pills carry meaningful selection metadata
  (`{type:"pill", status:"sev"}`) — a reviewer can disagree with
  the severity level by name.

## Decision-mini hook

Status pills occasionally host a decision-mini for status changes:

```html
<span class="vc-pill vc-pill--draft">
  Draft
  <div class="ve-decision" data-decision-id="rfc-status-bump">
    <button data-choice="final-comment">Move to Final-comment</button>
    <button data-choice="accept">Accept now</button>
    <button data-choice="reject">Reject</button>
  </div>
</span>
```

(For RFCs / ADRs only; status pills on incidents do not host
decisions — incidents are linear.)

## Anti-patterns

- **6+ pills in one row** — wraps awkwardly on every viewport;
  reader cannot scan. Move overflow to a `<dl>` block.
- **Pills with multi-line values** — break the row visually. If a
  value needs two lines, it doesn't belong in a pill.
- **Custom status colors** — every status pill MUST use one of the
  catalog variants. Inventing colors fragments the vocabulary.
- **Pill text that lies about the underlying state** — a pill
  labelled "Resolved" on an open incident is a real-world bug.
- **A pill row as the only document header** — pills are byline
  decoration; the document still needs an `<h1>` and (usually) an
  eyebrow.
- **Putting the auto-pill in the pill row** — auto-pill belongs in
  the eyebrow line (`vc-type-overline`), not the pill strip. Mixing
  the two reads as a category error.
- **Pills inside body prose** — pills are header / byline / footer
  chrome. Inline pill-style chips inside paragraphs are a different
  primitive (see `amvcp-tables` chip).
- **Pill values longer than 20 characters** — see the discipline
  table above. Long values force horizontal scroll on mobile.
- **Pill keys in title-case (`Duration`, `Author`)** — keys MUST be
  uppercase eyebrow style for typographic distinction from values.
