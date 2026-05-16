# Appendix + References / bibliography

The two formal-document blocks that sit at the end of long-form
documents: an **Appendix** holds material that would interrupt the
main flow if inline (extended derivations, full-test-plan tables,
configuration dumps); a **References** section lists external sources
the document draws on (RFCs, papers, runbooks, prior ADRs).

The two blocks are siblings in placement (both at the document's
foot) but distinct in semantics: Appendices are *content the
document author wrote* but that doesn't fit in the body; References
are *content other authors wrote* that the document cites.

## When to add each

| Add an Appendix | Skip it |
|---|---|
| You have ≥3 pages of supporting detail | Detail fits in body |
| The detail is consulted, not read | Detail is part of the narrative |
| You want to cite "see Appendix A" from the body | Reference is a footnote-length aside |
| Audience expects the formal Appendix convention (academic / regulatory) | Casual audience |

| Add References | Skip it |
|---|---|
| You cite ≥3 external sources | ≤2 sources (use inline links) |
| Audience expects citation conventions | Reader will follow inline links |
| Document will be archived (sources may move) | Ephemeral document |
| You want a sources discipline (one source per claim) | Sources are part of provenance footer |

## Appendix scaffold

Multiple appendices use letter-numbering (`A`, `B`, `C`) — distinct
from the body's `01`, `02`, `03` numbering. Reset the counter
explicitly to a letter sequence.

```html
<section id="appendix-a" class="vc-appendix">
  <h2><span class="vc-appendix-letter">A</span> Full configuration dump</h2>
  <p>The complete configuration used during the load tests…</p>
  <pre><code>… 80 lines of yaml …</code></pre>
</section>

<section id="appendix-b" class="vc-appendix">
  <h2><span class="vc-appendix-letter">B</span> Property-based test plan</h2>
  <p>The complete table of property-based tests…</p>
  <table>… 40 rows …</table>
</section>
```

## CSS for appendices

```css
.vc-appendix {
  margin-block-start: var(--vc-space-7, 64px);
  padding-block-start: var(--vc-space-5, 32px);
  border-block-start: 2px solid var(--vc-color-border, #e3dcc9);
}
.vc-appendix h2 {
  font-family: var(--vc-font-heading, Georgia, serif);
  font-size: var(--vc-text-3, 20px);
  margin-block: 0 var(--vc-space-3, 12px);
}
.vc-appendix-letter {
  display: inline-block;
  margin-inline-end: var(--vc-space-3, 12px);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: 0.85em;
  color: var(--vc-color-accent, #b8861f);
  letter-spacing: 0.04em;
}
```

For auto-letter-numbering via CSS counter (analogous to the
whitepaper's section counter):

```css
.vc-doc { counter-reset: vc-appendix; }  /* outside the appendix block */
.vc-appendix h2 {
  counter-increment: vc-appendix;
}
.vc-appendix h2::before {
  content: counter(vc-appendix, upper-alpha) ".  ";
  color: var(--vc-color-accent, #b8861f);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
}
```

(`upper-alpha` produces `A`, `B`, `C`, …`Z`, then `AA`, `AB`, …)

## References scaffold

Two acceptable formats:

### Numbered list (IEEE / ACM style)

Each reference has an integer ID; the body cites with `[1]`, `[2]`.

```html
<section id="references">
  <h2>References</h2>
  <ol class="vc-references">
    <li id="ref-1">
      Hardt, D. <em>The OAuth 2.0 Authorization Framework.</em>
      RFC 6749, October 2012.
      <a href="https://www.rfc-editor.org/rfc/rfc6749">rfc6749</a>
    </li>
    <li id="ref-2">
      Jones, M., Bradley, J., Sakimura, N. <em>JSON Web Token (JWT).</em>
      RFC 7519, May 2015.
      <a href="https://www.rfc-editor.org/rfc/rfc7519">rfc7519</a>
    </li>
    <li id="ref-3">
      Karger, D., Lehman, E., Leighton, T., et al. <em>Consistent
      Hashing and Random Trees.</em> STOC, 1997.
    </li>
  </ol>
</section>
```

Body citation:

```html
<p>The OAuth 2.0 framework <a href="#ref-1">[1]</a> defines the token
   exchange mechanism this document builds on…</p>
```

### Author-year list (APA style)

Each reference is keyed by `(Author, Year)`; the body cites with
`(Hardt, 2012)`.

```html
<ol class="vc-references vc-references--apa">
  <li id="ref-hardt2012">Hardt, D. (2012). <em>The OAuth 2.0
      Authorization Framework</em>. RFC 6749. Internet Engineering
      Task Force.</li>
</ol>
```

Body citation: `<a href="#ref-hardt2012">(Hardt, 2012)</a>`.

Pick **one style per document**; do not mix.

## CSS for references

```css
.vc-references {
  margin-block: var(--vc-space-5, 32px) 0;
  padding-inline-start: var(--vc-space-5, 32px);
  font-size: var(--vc-text-1, 14px);
  font-family: var(--vc-font-body, Georgia, serif);
  list-style: decimal;
}
.vc-references li {
  margin-block: var(--vc-space-2, 8px);
  padding-inline-start: var(--vc-space-2, 8px);
}
.vc-references li::marker {
  color: var(--vc-color-accent, #b8861f);
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: 0.85em;
}
.vc-references em { font-style: italic; }
.vc-references a {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-size: 0.9em;
  color: var(--vc-color-content-muted, #5b5343);
}

.vc-references--apa { list-style: none; padding-inline-start: 0; }
.vc-references--apa li { padding-inline-start: var(--vc-space-5, 32px);
                         text-indent: calc(-1 * var(--vc-space-5, 32px)); }
```

## Citation discipline

Every reference MUST follow a consistent format. The minimum useful
contents are:

| Field | Required? | Notes |
|---|---|---|
| Author(s) | Yes | "Last, F." or "Last, F. and Last, F." or "Last, F. et al." |
| Year | Yes | In parens for APA; trailing for IEEE |
| Title | Yes | In `<em>` italics |
| Venue | Yes | Journal / conference / RFC number |
| URL | Optional | Always include for online sources |
| Accessed-date | Yes for online sources | "(accessed 2026-05-15)" |

For RFCs and standards documents, the venue IS the identifier
(`RFC 6749`, `OpenID Connect Core 1.0`). For papers, include the
conference / journal.

For runbooks / internal documents, link to the canonical version-
controlled location, NOT a Confluence URL that will rot:

```html
<li>Internal runbook: <code>docs/auth/runbook-rollback.md@4f8c1a3</code>
    (commit pinned for archival).</li>
```

## DESIGN.md tokens consumed

| Token | Used in |
|---|---|
| `--vc-color-accent` | Appendix letter, references list-marker |
| `--vc-color-content-muted` | Reference URL color |
| `--vc-color-border` | Appendix top divider |
| `--vc-font-heading` | Appendix h2 |
| `--vc-font-body` | References body |
| `--vc-font-mono` | Appendix letter, list markers, URLs |
| `--vc-text-1` / `--vc-text-3` | Sizes |

## Composition

| Containing shape | Appendix? | References? |
|---|---|---|
| `whitepaper-shape` | Yes (typical) | Yes |
| `rfc-shape` | Optional | Yes (References section is the convention) |
| `concept-explainer-shape` | Optional | Optional (5+ external sources) |
| `feature-explainer-shape` | No (Files-read sidebar serves) | Optional |
| `architecture-explainer-shape` | No | Optional (Related Reading section) |
| `case-study-shape` | Yes (raw data, full transcripts) | Optional |
| `pr-writeup-author-side-shape` | No | Footer link list serves |
| `incident-postmortem-shape` | No (Appendix section is for runbook links) | Yes |
| `adr-decision-log-shape` | No | "Related ADRs" section serves |

## Selection / comment notes

- Each appendix is selectable as a unit
  (`{type:"appendix", letter:"A"}`) so a reviewer can comment on a
  whole appendix.
- Each reference is selectable per `<li>`
  (`{type:"reference", refId:"ref-1"}`) — useful for "this citation
  is wrong" comments.
- The References section as a whole is selectable.
- Body citations are selectable per `<a>` — useful for "wrong
  citation here" comments without highlighting the prose.

## Anti-patterns

- **An Appendix in a 2-page document** — appendices pay off at 6+
  pages. Below that, inline the content.
- **A References section with 1-2 entries** — use inline links
  instead. References pay off at 3+ entries.
- **Mixing IEEE numbered + APA author-year citations in the same
  document** — pick one style.
- **Citation links to URLs that rot** — for online sources,
  include an accessed-date AND prefer canonical permalinks
  (DOIs, RFC editor URLs, archived snapshots).
- **An appendix that references body content** — appendices are
  consulted out of context. They MUST be self-contained or
  explicitly say "(see §03 Proposal)".
- **Appendix numbered as `1`, `2`, `3` instead of `A`, `B`, `C`** —
  collides with the body section counter. Use letters.
- **References without accessed-dates for online sources** — the
  source might have changed since you read it; the accessed-date
  pins your reading.
- **A bibliography labelled "Sources"** — bibliographies are
  formal; if the document is informal enough to use "Sources",
  use the provenance-footer pattern instead.
- **Citing the document's own commit** — that's metadata, not a
  reference. Put it in the header byline or provenance footer.
- **Reference list not in alphabetical (APA) or document-order
  (IEEE) sort** — readers expect one of these orders. Random sorts
  signal carelessness.
