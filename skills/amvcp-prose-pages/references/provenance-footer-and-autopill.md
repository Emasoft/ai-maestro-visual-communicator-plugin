# Provenance footer + auto-pill — marking AI-produced documents

## Table of Contents

- [When to add provenance markers](#when-to-add-provenance-markers)
- [The auto-pill](#the-auto-pill)
- [The provenance footer](#the-provenance-footer)
- [Files-read sidebar variant](#files-read-sidebar-variant)
- [The prompt box (provenance for one-shots)](#the-prompt-box-provenance-for-one-shots)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition](#composition)
- [Selection / comment notes](#selection--comment-notes)
- [Anti-patterns](#anti-patterns)

Two conventions for marking a document as agent-produced and
documenting what the agent read while producing it. The
`auto-pill` is a small mono-uppercase chip in the document header;
the **provenance footer** is a one-line list of sources at the bottom
of the page. Together they discharge the *show your work* duty
without theatre.

The conventions emerged from the operational realities of
agent-produced reports: readers want to know (a) is this
auto-generated or hand-written? (b) what did the agent actually
look at? Without these markers, every reader has to ask the same
two questions, and trust in the document drains.

## When to add provenance markers

| Add them | Skip them |
|---|---|
| The document was authored by an agent | The document was authored by a human |
| The document is published to a wider audience than the prompter | Personal scratch / internal notes |
| The reader will rely on the document to make decisions | One-off summary in a chat message |
| You want to be honest about the document's authorship | You want to obscure the document's authorship (don't — be honest) |

If the document was *substantially* edited by a human after the agent
produced the first draft, change the auto-pill to `co-authored` (or
omit it) and update the byline accordingly. Lying about authorship
breaks reader trust irrecoverably.

## The auto-pill

A small monospace rounded chip with the text "auto-generated", placed
**inside the header eyebrow line**. It tells the reader at a glance
"this was emitted by an agent".

```html
<header class="vc-doc-header">
  <p class="vc-type-overline">
    Weekly status · 2026-W19
    <span class="vc-auto-pill">auto-generated</span>
  </p>
  <h1>…</h1>
</header>
```

```css
.vc-auto-pill {
  display: inline-flex;
  align-items: center;
  margin-inline-start: var(--vc-space-2, 8px);
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--vc-color-surface-sunken, #f1ece0);
  color: var(--vc-color-content-muted, #5b5343);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.04em;
  text-transform: lowercase;
}
```

The pill MUST use the surface-sunken / content-muted pair so it stays
low-key — making it accent-colored would steal attention from the
actual content. The lowercase text is intentional; uppercase reads as
shouting.

### Pill text variants

| Text | When |
|---|---|
| `auto-generated` | First-draft was agent-produced; no significant human edits |
| `co-authored` | Agent + human iteratively edited the document |
| `agent-assisted` | Human authored; agent did fact-checking / restructuring |
| `agent-translated` | Original was in another language; agent translated |
| `template-generated` | Agent filled in a fixed template; the structure is canonical |

## The provenance footer

A single mono line at the bottom of the page listing what the agent
read while producing the document, plus the generated-at timestamp.

```html
<footer class="vc-doc-footer">
  <span class="vc-auto-pill">auto-generated</span>
  Sources: <code>git log main..HEAD</code> · CI dashboard · deploy log
  <span class="vc-generated">generated 2026-05-18 17:02 UTC+02</span>
</footer>
```

```css
.vc-doc-footer {
  margin-block-start: var(--vc-space-7, 64px);
  padding-block-start: var(--vc-space-3, 12px);
  border-block-start: 1px solid var(--vc-color-border, #e3dcc9);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  color: var(--vc-color-content-muted, #5b5343);
  display: flex;
  flex-wrap: wrap;
  gap: var(--vc-space-3, 12px);
  align-items: center;
}
.vc-doc-footer code {
  background: var(--vc-color-surface-sunken, #f1ece0);
  padding: 1px 5px;
  border-radius: var(--vc-radius-sm, 4px);
}
.vc-generated { margin-inline-start: auto; }
```

The `margin-inline-start: auto` on `.vc-generated` pushes the
timestamp to the right edge while the sources list flows naturally
on the left.

## Files-read sidebar variant

For documents with a sticky sidebar (feature-explainer, architecture-
explainer), the provenance can move into the sidebar as a "Files
read" panel:

```html
<aside class="vc-sidebar">
  <!-- TOC + other panels -->
  <div class="vc-files-read">
    <p class="vc-files-read-title">Files read</p>
    <ul>
      <li><code>src/limits/sliding-window.ts</code></li>
      <li><code>config/limits.yaml</code></li>
      <li><code>docs/rate-limiting.md</code></li>
    </ul>
  </div>
</aside>
```

```css
.vc-files-read {
  margin-block-start: var(--vc-space-5, 32px);
  padding-block-start: var(--vc-space-3, 12px);
  border-block-start: 1px solid var(--vc-color-border, #e3dcc9);
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

Pick **one** location for the provenance — sidebar OR footer, not
both. Duplication signals the agent does not know which is canonical.

## The prompt box (provenance for one-shots)

For comparison and exploration shapes, the *prompt* itself is the
provenance — it says what the agent was asked to produce.

```html
<aside class="vc-prompt">
  <p class="vc-prompt-label">PROMPT</p>
  <p>Pick a debounce strategy for the global search input. Constraints:
     no new runtime deps, must work under React 18, must be testable
     without faking timers, must support cancel-on-unmount.</p>
</aside>
```

```css
.vc-prompt {
  margin-block: var(--vc-space-4, 16px);
  padding: var(--vc-space-3, 12px) var(--vc-space-4, 16px);
  background: var(--vc-color-surface-sunken, #f1ece0);
  border: 1px solid var(--vc-color-border, #e3dcc9);
  border-radius: var(--vc-radius-md, 8px);
}
.vc-prompt-label {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-0, 11px);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vc-color-content-muted, #5b5343);
  margin: 0 0 var(--vc-space-2, 8px);
}
.vc-prompt > p:not(.vc-prompt-label) {
  margin: 0;
  font-style: italic;
}
```

Use the prompt box for `compare-n-approaches-shape`,
`visual-design-exploration-shape`, and any other "here's what was
asked, here are the answers" deliverable.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-surface-sunken` | Pill background, prompt-box background, code chip |
| `--vc-color-content-muted` | Pill text, footer text, label text |
| `--vc-color-border` | Footer top-border, prompt-box border |
| `--vc-font-mono` | All text (the whole convention is mono) |
| `--vc-text-0` | All sizes (small) |

Provenance markers are deliberately monochrome and small — they MUST
NOT compete with the document's content for attention.

## Composition

Provenance markers are stand-alone primitives that ship inside every
report-doc shape:

| Shape | Footer | Auto-pill | Files-read | Prompt-box |
|---|---|---|---|---|
| `status-report-shape` | yes | yes | optional | no |
| `implementation-plan-shape` | yes | yes | no | no |
| `pr-writeup-author-side-shape` | yes (issue/RFC links) | optional | no | no |
| `pr-review-reviewer-side-shape` | yes (sha refs) | optional | no | no |
| `feature-explainer-shape` | optional | optional | YES (sidebar) | no |
| `architecture-explainer-shape` | yes | optional | yes (sidebar) | no |
| `concept-explainer-shape` | yes | optional | optional | no |
| `compare-n-approaches-shape` | yes | yes | no | YES |
| `visual-design-exploration-shape` | yes | yes | no | YES |
| `incident-postmortem-shape` | yes (runbook links) | no (humans wrote it) | no | no |
| `rfc-shape` | yes (References section serves) | no | no | no |
| `adr-decision-log-shape` | minimal | no | no | no |
| `retrospective-shape` | yes (attendees) | no (humans wrote it) | no | no |

## Selection / comment notes

- The auto-pill is selectable as a unit so a reader can comment "this
  document was substantially edited; the pill is misleading".
- Prompt boxes are selectable as a unit so a reviewer can comment
  "the prompt missed constraint X".
- Files-read entries are selectable individually — useful for
  "you missed file X" comments.
- The footer's source list is selectable per source.
- The generated-at timestamp is selectable — useful for "this is
  stale" comments.

## Anti-patterns

- **Auto-pill on a hand-written document** — the pill MEANS
  "auto-generated"; using it as decoration breaks the convention.
- **Provenance footer with no actual sources** — `Sources: …`
  with empty brackets is worse than no footer; signals the agent
  did not check.
- **Both a footer AND a sidebar Files-read block** — duplication.
  Pick one.
- **Pill in accent color** — steals attention. Always
  surface-sunken / content-muted.
- **Pill inside the heading** — it should be inside the eyebrow
  line `<p class="vc-type-overline">`, not the `<h1>`. Putting it
  in the heading pollutes the document outline.
- **Provenance footer above the body** — provenance is metadata, it
  belongs at the bottom. Top placement competes with the headline.
- **A "Generated by" line that names a specific model** — outdates
  fast and does not actually inform the reader. `auto-generated` is
  enough; the model used is provenance for the prompter, not the
  reader.
- **Falsely human-attributed bylines on an agent-produced document**
  — the byline says who, the auto-pill says how. Never write
  `by @alice` on a document an agent produced; write `template by
  @alice · auto-generated` or similar.
- **Prompt-box text that has been cleaned up / paraphrased** — the
  point is to record the *actual* prompt verbatim. Cleaning it up
  loses the constraint information.
