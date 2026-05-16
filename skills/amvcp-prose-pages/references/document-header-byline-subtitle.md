# Document header — eyebrow + h1 + subtitle + byline

The four-element opening every report-doc page uses, in fixed order
and fixed visual hierarchy:

```
[eyebrow]    — small mono uppercase label classifying the page
[H1]         — the page title (one line, sentence case)
[subtitle]   — one-line context (optional, ≤80 chars)
[byline]     — author / date / version metadata (one line)
```

The header is the **single most-scanned region of any document** —
readers spend 3-5 seconds here and use it to decide whether to
continue. Every element is load-bearing; remove one and the document
becomes harder to place.

## When to add each element

| Element | Always | Skip when |
|---|---|---|
| Eyebrow | Always | Casual blog post (eyebrow reads as too formal) |
| H1 | Always (one per document) | Never — every doc has an h1 |
| Subtitle | When the title needs context (1 line, ≤80 chars) | Title is fully self-describing |
| Byline | When authorship / date matters | Internal scratch; pure agent output where the auto-pill replaces it |

Documents with a 2-line title ("This is the longest title in the
project, addressing the most contentious decision of the quarter")
have failed at title-writing — the second line belongs in the
subtitle.

## Scaffold

```html
<header class="vc-doc-header">
  <p class="vc-type-overline">
    Implementation plan · IMP-2026-0517
    <span class="vc-auto-pill">auto-generated</span>
  </p>
  <h1>Task comments — slice 1 (composer + thread + unread digest)</h1>
  <p class="vc-doc-subtitle">
    2 weeks · 3 packages · 2 new tables · flag <code>task_comments_v1</code>
  </p>
  <p class="vc-doc-byline">
    Authored by @alice (auth team) · 2026-05-16 · v1
  </p>
</header>
```

## CSS contract (already injected by the runtime)

```css
.vc-doc-header {
  margin-block-end: var(--vc-space-6, 48px);
  padding-block-end: var(--vc-space-4, 16px);
  border-block-end: 1px solid var(--vc-color-border, #e3dcc9);
}

.vc-type-overline {
  font-family: var(--vc-font-body, inherit);
  font-size: var(--vc-text-0, 11px);
  font-weight: var(--vc-weight-medium, 500);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.4;
  color: var(--vc-color-content-muted, #5b5343);
  margin-block: 0 var(--vc-space-3, 12px);
}

.vc-doc-header h1 {
  font-family: var(--vc-font-heading, Georgia, serif);
  font-size: var(--vc-text-6, 48px);
  font-weight: var(--vc-weight-bold, 700);
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin-block: 0 var(--vc-space-2, 8px);
  color: var(--vc-color-content, #1f1a14);
}

.vc-doc-subtitle {
  font-family: var(--vc-font-body, inherit);
  font-size: var(--vc-text-3, 20px);
  color: var(--vc-color-content-muted, #5b5343);
  margin-block: var(--vc-space-2, 8px);
}

.vc-doc-byline {
  font-family: var(--vc-font-body, inherit);
  font-size: var(--vc-text-1, 14px);
  color: var(--vc-color-content-subtle, #8a8170);
  margin: 0;
}
```

The hierarchy reads top-to-bottom in **descending typographic
weight**: the eyebrow is small and muted, the h1 is the largest, the
subtitle is half the h1 size, and the byline is body-text size and
even more muted. The reader's eye lands on the h1 and then resolves
the surrounding context.

## The eyebrow's job

The eyebrow is the document's **category marker**. It says what kind
of document this is, often combined with an identifier:

| Eyebrow | Identifies |
|---|---|
| `Implementation plan · IMP-2026-0517` | Document type + ID |
| `Incident postmortem · INC-2026-0412` | Document type + INC-id |
| `Weekly status · 2026-W19` | Document type + time window |
| `RFC · RFC-0231` | Document type + RFC number |
| `ADR-0042` | Just the ID (ADRs are short) |
| `PR review` | Document type only |
| `Visual exploration · onboarding screen` | Document type + topic |

The eyebrow lets a reader who lands on the page from a deep link
(no surrounding navigation) immediately know what they are looking
at. Combined with the h1, the page is self-locating.

The optional `vc-auto-pill` chip lives **inside the eyebrow line**,
not as a separate row. See `provenance-footer-and-autopill.md`.

## Title-writing discipline

| Good title | Bad title |
|---|---|
| "Task comments — slice 1 (composer + thread + unread digest)" | "Task comments implementation plan v1" |
| "Cache stampede during slot-fill rollout" | "Postmortem for INC-2026-0412" |
| "Sliding-window rate limiting at scale" | "How rate limiting works" |
| "Use UUIDv7 for primary keys" | "Primary key strategy" |
| "Three ways to debounce a search input" | "Debouncing comparison" |

The title is the **headline**, not the description. Verbs over nouns
("Use UUIDv7" not "Primary key strategy"); specific over generic
("Sliding-window rate limiting at scale" not "Rate limiting").

A title that describes the document's *type* (RFC, postmortem,
plan) wastes a slot — that's what the eyebrow is for. Strip
type-words from the title.

## Subtitle discipline

The subtitle is one line, ≤80 characters, providing the context the
title cannot fit. Examples:

| Title | Subtitle |
|---|---|
| "Task comments — slice 1 …" | "2 weeks · 3 packages · 2 new tables · flag task_comments_v1" |
| "Cache stampede during slot-fill rollout" | "May 12 – May 18, 2026 · 6 engineers · 1 incident" |
| "Sliding-window rate limiting at scale" | "47k req/s on a single Redis instance, p99 < 4ms" |
| "Use UUIDv7 for primary keys" | (none — ADR is short, no subtitle needed) |
| "Three ways to debounce a search input" | (none — comparison docs lead with the prompt box) |

If the subtitle would just rephrase the title, omit it. If it would
exceed 80 characters, it has too much information — pull half into
the byline or a TL;DR.

## Byline discipline

The byline carries metadata: who wrote it, when, what version.
Format conventions:

```
Authored by @alice (auth team) · 2026-05-16 · v1
```

Three fields, separated by middle dots (` · `, U+00B7 with surrounding
spaces). Order matters: author first, then date, then version.

For agent-produced documents:

```
auto-generated · 2026-05-16 17:42 · template by @alice
```

…OR move the auto-pill to the eyebrow and make the byline
human-author-only. Pick one convention per project.

For multi-author documents:

```
@alice + @bob (with input from @carol) · 2026-05-16 · v3
```

Avoid more than 3 names in the byline; a longer author list belongs
in an "Authors" section near the bottom.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-content` | h1 |
| `--vc-color-content-muted` | Eyebrow, subtitle |
| `--vc-color-content-subtle` | Byline |
| `--vc-color-border` | Header bottom divider |
| `--vc-font-heading` | h1 |
| `--vc-font-body` | Eyebrow, subtitle, byline |
| `--vc-text-0` | Eyebrow |
| `--vc-text-1` | Byline |
| `--vc-text-3` | Subtitle |
| `--vc-text-6` | h1 |
| `--vc-space-2` / `--vc-space-3` / `--vc-space-4` / `--vc-space-6` | Margins |
| `--vc-weight-bold` | h1 |
| `--vc-weight-medium` | Eyebrow |

## Composition

The header is the same shape across all document shapes — only the
*content* of the eyebrow / title / subtitle / byline varies.

Some shapes ADD elements to the header (postmortem adds a pill row;
RFC adds a metadata `<dl>`; design-system-doc adds a commit sha).
These additions sit BELOW the byline, never above:

```html
<header class="vc-doc-header">
  <p class="vc-type-overline">…</p>
  <h1>…</h1>
  <p class="vc-doc-subtitle">…</p>
  <p class="vc-doc-byline">…</p>
  <!-- Additional shape-specific header content goes here -->
  <div class="vc-pill-row">…</div>
</header>
```

## Selection / comment notes

- The header as a whole is selectable
  (`{type:"doc-header"}`) — useful for "the framing is wrong"
  comments.
- The eyebrow, h1, subtitle, and byline are each selectable
  independently.
- The h1 is the document's accessible name (per `aria-labelledby`
  on the `<article>`). Selection metadata for the h1 includes the
  full text.

## Anti-patterns

- **H1 in the eyebrow** (`<h2>` inside `vc-type-overline`) —
  pollutes the document outline. Eyebrow is `<p>`, not a heading.
- **Multiple H1s** — exactly one per document.
- **Subtitle longer than 80 characters** — see the discipline
  table.
- **Byline missing the date** — readers cannot tell if the document
  is current.
- **Byline missing the author** — anonymous documents lose
  accountability. Even auto-generated documents have a "template
  by" or similar field.
- **An h1 styled by something other than the `vc-doc-header h1`
  rule** — every doc h1 reads the same token surface. Custom h1
  styling fragments the visual identity.
- **Title in title-case** ("Three Ways to Debounce a Search Input")
  — sentence case is the convention. Title-case looks like
  marketing.
- **Header without the bottom divider** — visually the header
  bleeds into the body and the reader cannot find where the body
  starts.
- **Eyebrow text matching the h1 verbatim** — "Implementation plan
  · Implementation plan for task comments". Strip duplication.
- **Trailing punctuation in the title** ("Use UUIDv7 for primary
  keys.") — titles do not end in periods. (Question marks and
  exclamations are sometimes acceptable but rarely improve a
  title.)
