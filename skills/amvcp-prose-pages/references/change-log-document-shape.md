# Change-log document — versioned-document edits in reverse chrono

## Table of Contents

- [When to add a change log](#when-to-add-a-change-log)
- [Scaffold (canonical)](#scaffold-canonical)
- [CSS contract](#css-contract)
- [Reverse chronological order](#reverse-chronological-order)
- [Entry-content discipline](#entry-content-discipline)
- [Initial-draft entry](#initial-draft-entry)
- [When to roll a new version](#when-to-roll-a-new-version)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Composition](#composition)
- [Selection / comment notes](#selection--comment-notes)
- [Anti-patterns](#anti-patterns)

The append-only `<dl>` of date / version / author / summary entries
that documents how a long-lived document has evolved. Distinct from a
software CHANGELOG (which logs releases of code) — this is the
*editorial* change log for the document itself.

Every long-lived document (RFC, design-system doc, runbook,
whitepaper) needs a change log so readers can:

1. See *when* the document last changed (relevance check).
2. See *what* changed (what to re-read).
3. See *who* made the change (whom to ask about it).

The change-log is the **only legitimate write to a published
document**. Everything else (RFC supersession, ADR replacement) goes
through writing a NEW document.

## When to add a change log

| Add it | Skip it |
|---|---|
| Document is long-lived (RFC, design-system doc, runbook) | One-off (status report, postmortem) |
| Multiple authors will edit over time | Single-author single-version document |
| Readers will return repeatedly and need to know what's new | Reader will read once and never return |
| You expect ≥3 revisions over the document's life | First and only revision |

Documents that DO NOT use a change log instead use:

- Postmortems → action-items checklist instead (forward-looking)
- Status reports → date in the title is the version
- ADRs → append-only; new ADR supersedes old (no in-place edits)
- PR reviews → GitHub commit history is the change log

## Scaffold (canonical)

```html
<section id="change-log">
  <h2>Change log</h2>
  <dl class="vc-changelog">

    <dt>2026-05-16  ·  v3  ·  @alice</dt>
      <dd>Added A3 (managed Auth0) to Alternatives; removed assumption
          that vendor was out of scope.</dd>

    <dt>2026-05-02  ·  v2  ·  @alice</dt>
      <dd>Reworked Security section after threat-modeling session;
          added explicit threat model.</dd>

    <dt>2026-04-22  ·  v1  ·  @alice</dt>
      <dd>Initial draft.</dd>

  </dl>
</section>
```

Three required fields per entry, in order:

1. **Date** — ISO format (`2026-05-16`), local time, no timezone (the
   document is text, not an event log).
2. **Version** — `v1`, `v2`, …; OR a commit sha (`4f8c1a3`).
3. **Author** — `@handle` for an individual; `@team` for a team-owned
   change (rare).

Followed by a one-paragraph `<dd>` describing what changed. Aim for
20-50 words per entry; longer entries belong in their own follow-up
document.

## CSS contract

```css
.vc-changelog {
  margin-block: var(--vc-space-3, 12px);
  padding: 0;
}
.vc-changelog dt {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: var(--vc-text-1, 14px);
  font-weight: var(--vc-weight-bold, 700);
  color: var(--vc-color-content, #1f1a14);
  margin-block: var(--vc-space-3, 12px) var(--vc-space-1, 4px);
}
.vc-changelog dd {
  margin: 0 0 var(--vc-space-2, 8px) var(--vc-space-3, 12px);
  padding-inline-start: var(--vc-space-3, 12px);
  border-inline-start: 2px solid var(--vc-color-border, #e3dcc9);
  font-size: var(--vc-text-1, 14px);
  color: var(--vc-color-content-muted, #5b5343);
}

/* Latest entry gets a subtle accent — the reader's eye lands here first */
.vc-changelog dt:first-of-type {
  color: var(--vc-color-accent, #b8861f);
}
.vc-changelog dt:first-of-type + dd {
  border-inline-start-color: var(--vc-color-accent, #b8861f);
}
```

The accent on the latest entry is one of the rare places the accent
color is used purely for emphasis (rather than action). The point is
that a reader returning to the document immediately sees "what's
new since I was last here".

## Reverse chronological order

The latest entry is at the **top** of the list. This matches reader
intent (most-recent-first) and the convention of every RSS feed,
git log, and journal article.

```html
<!-- GOOD — newest at top -->
<dt>2026-05-16  ·  v3  ·  @alice</dt><dd>Latest change.</dd>
<dt>2026-05-02  ·  v2  ·  @alice</dt><dd>Earlier change.</dd>
<dt>2026-04-22  ·  v1  ·  @alice</dt><dd>Initial draft.</dd>

<!-- BAD — oldest at top -->
<dt>2026-04-22  ·  v1  ·  @alice</dt><dd>Initial draft.</dd>
<dt>2026-05-02  ·  v2  ·  @alice</dt><dd>Earlier change.</dd>
<dt>2026-05-16  ·  v3  ·  @alice</dt><dd>Latest change.</dd>
```

(Software CHANGELOG.md files conventionally use the same reverse-chrono
order via Keep-a-Changelog.)

## Entry-content discipline

| Good entry | Bad entry |
|---|---|
| `Added A3 (managed Auth0) to Alternatives; removed the vendor-out-of-scope assumption.` | `Various improvements.` |
| `Fix typo in the Risks section.` | `Cleanup.` |
| `Reworked Security section after threat-modeling; added explicit threat model.` | `Updated.` |
| `Renamed --vc-color-brand to --vc-color-accent for clarity.` | `Token rename.` |

Every change-log entry MUST describe what changed. `Cleanup.` /
`Updated.` / `Various.` force readers to diff the document
themselves — the change log has failed its job.

## Initial-draft entry

The first entry is conventionally `v1 — Initial draft.`. Some authors
expand to `v1 — Initial draft based on @bob's whiteboard sketch.` to
record provenance. Either form works.

## When to roll a new version

| Promote to a new version | Do NOT promote |
|---|---|
| Substantive content change (added/removed section, recommendation changed) | Typo fix |
| Recommendation changed | Punctuation cleanup |
| Numbered alternative renumbered | Citation URL fixed (use `v3.1` instead) |
| Status changed (Draft → Final-comment) | Whitespace |

For trivial fixes, append to the latest entry's `<dd>` with a
parenthetical: `Initial draft. (typo fix 2026-05-23.)`. For non-trivial
fixes, roll a new version.

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-content` | Default `<dt>` text |
| `--vc-color-content-muted` | `<dd>` text |
| `--vc-color-accent` | Latest-entry `<dt>` + border |
| `--vc-color-border` | Default border-inline-start on `<dd>` |
| `--vc-font-mono` | All `<dt>` text (date / version / author are data) |
| `--vc-text-1` | All sizes |

## Composition

| Containing shape | Change log? |
|---|---|
| `rfc-shape` | Yes (canonical placement at the foot, after References) |
| `whitepaper-shape` | Yes (revision history is expected) |
| `design-system-doc-shape` | Yes (token edits accumulate) |
| `feature-explainer-shape` | Optional (long-lived feature docs) |
| `concept-explainer-shape` | Optional (concept evolves) |
| `adr-decision-log-shape` | No (ADRs are append-only; no edits) |
| `pr-writeup-author-side-shape` | No (one-shot, no revisions) |
| `pr-review-reviewer-side-shape` | No (one-shot) |
| `incident-postmortem-shape` | No (postmortems are immutable after publication) |
| `status-report-shape` | No (each status is a new document) |
| `retrospective-shape` | No (each retro is a new document) |
| `compare-n-approaches-shape` | Optional (long-lived comparison docs) |
| `visual-design-exploration-shape` | No (one-shot exploration) |

## Selection / comment notes

- Each `<dt>` + `<dd>` pair is selectable
  (`{type:"changelog-entry", version:"v3"}`) — useful for "this
  description is misleading" comments.
- The change log section as a whole is selectable.
- The latest entry's accent treatment is purely visual — selection
  metadata is the same as for any entry.

## Anti-patterns

- **Reverse-chrono violated** — older entries at the top defeats
  reader intent.
- **Vague entries** (`Cleanup.`, `Various improvements.`) — see the
  discipline table.
- **Date in locale format** (`05/16/2026` vs `16/05/2026`) — ISO
  format is unambiguous.
- **Author missing** — every change has an owner. Even bot-generated
  changes get an `@bot-name` handle.
- **Editing an older entry's `<dd>`** — change-log entries are
  immutable. If a description is wrong, add a new entry that
  corrects: `Corrected v2's description (was misleading; security
  rework was the actual change).`.
- **Skipping a version number** (`v1, v2, v4`) — readers will
  notice. Always sequential.
- **Change-log at the top of the document** — wrong placement;
  readers want the body first. At the bottom (after References) is
  canonical.
- **Per-section change logs** — distributed change logs become
  impossible to reconcile. One change-log per document.
- **Mixing pre-publication drafts (`v0.1`, `v0.5`) into the public
  change log** — the published change log starts at `v1`. Drafts
  are private to the author.
- **A change log on an ADR** — ADRs are append-only by definition.
  The "change" is writing a new ADR that supersedes the old.
