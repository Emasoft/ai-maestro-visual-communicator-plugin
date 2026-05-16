# Status pill key/value — the meta-row pattern

The compact "Duration: 47 min" / "Severity: SEV-2" / "Owner: jdoe"
pill set used in report headers, ticket-style meta rows, and any
1-line metadata strip. Not strictly a table — but the single-row
"horizontal table of facts" rendered as inline `<span>`s is part of
the per-row decoration vocabulary.

## Table of contents

- [The shape](#the-shape)
- [When to use a meta-pill row vs an inline mini-table](#when-to-use-a-meta-pill-row-vs-an-inline-mini-table)
- [Anatomy — pill, key, value](#anatomy--pill-key-value)
- [Variants — neutral / semantic-colored](#variants--neutral--semantic-colored)
- [The key/value spacing trick](#the-keyvalue-spacing-trick)
- [`font-family: mono` on the value](#font-family-mono-on-the-value)
- [Wrap behavior](#wrap-behavior)
- [Inside a table — alongside another pattern](#inside-a-table--alongside-another-pattern)
- [Sample — incident header meta row](#sample--incident-header-meta-row)
- [Sample — release/version meta row](#sample--releaseversion-meta-row)
- [Sample — table row prefix](#sample--table-row-prefix)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)

---

## The shape

```
[SEV-2]  [Resolved]  [Duration: 47 min]  [Region: EMEA]  [Owner: jdoe]
```

A horizontal row of compact pills. Each pill carries either:
- A standalone label (`SEV-2`, `Resolved`) for status / category, OR
- A key+value pair (`Duration: 47 min`) for a fact.

Pills are rounded, padded, sit on a low-contrast background, and
read top-to-bottom-left-to-right as a one-line "header bio" for the
content below.

This is NOT a table in the `<table>` sense — but it pairs naturally
with tables (often as a header decoration above the table) and
shares the project's pill / badge vocabulary. The pattern is from
`12-incident-report` in the HTML-effectiveness catalog (the
"cleanest compact meta-row pattern I've seen").

## When to use a meta-pill row vs an inline mini-table

| Use a pill row | Use a mini-table |
|---|---|
| 3–6 facts | 4–8 facts |
| Each fact fits in one line | Some facts need 2 lines |
| Horizontal layout (one line above content) | Vertical layout (2-col panel beside content) |
| Visual feels "this is the badge / classification" | Visual feels "here are the numbers" |
| Mix of standalone status + key/value | All key/value pairs |

The pill row is faster to scan; the mini-table is more
information-dense. The report's `12-incident-report` model uses BOTH:
a pill row at the top (sev / status / duration / owner) and a
mini-table in the Impact section (users / sessions / region /
revenue).

## Anatomy — pill, key, value

```html
<span class="pill neutral">
  <span class="k">Duration</span>
  <span class="v">47 min</span>
</span>
```

Three nested `<span>`s:
- `.pill` — the outer container (background, border-radius, padding).
- `.pill .k` — the key label, low-contrast color.
- `.pill .v` — the value, monospace, high-contrast color.

For a standalone label (no key+value):

```html
<span class="pill sev">SEV-2</span>
```

The outer `.pill` carries a semantic class (`.sev`, `.resolved`) that
sets background + text color. No `.k` / `.v` inside; the label is
the only child.

## Variants — neutral / semantic-colored

```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.85em;
  line-height: 1.4;
}
.pill.neutral {
  background: var(--vc-color-surface-2, #f3eee0);
  color: var(--vc-color-content-muted, #5b5343);
  border: 1px solid var(--vc-color-border, #e3dcc9);
}
.pill.sev {     /* SEV-N */
  background: var(--vc-color-danger, #a84a32);
  color: var(--vc-color-on-danger, #ffffff);
}
.pill.resolved {
  background: var(--vc-color-success, #3a6b5c);
  color: var(--vc-color-on-success, #ffffff);
}
.pill.warning {
  background: var(--vc-color-warning, #a8791f);
  color: var(--vc-color-on-warning, #ffffff);
}
```

Semantic pills (`.sev`, `.resolved`, `.warning`) use the project's
status tokens with solid backgrounds and contrasting text. The
neutral pill uses a soft surface background with low-contrast text
— it carries the key/value pair without competing with the
semantic pills for attention.

The "on-X" colors (`--vc-color-on-danger`, `--vc-color-on-success`)
are usually white in light theme and a near-black in dark theme —
calculated for AA contrast against the colored background. The
DESIGN.md engine emits them; the fallback `#ffffff` is the
canonical light default.

## The key/value spacing trick

The `.k` and `.v` spans are children of a flex container:

```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;          /* space between k and v */
}
.pill .k {
  color: var(--vc-color-content-muted, #5b5343);
  font-weight: 400;
}
.pill .v {
  color: var(--vc-color-content, #1f1a14);
  font-family: var(--vc-font-mono, monospace);
  font-weight: 600;
}
```

The `gap: 6px` puts space between key and value WITHOUT requiring
a comma or colon in the markup. The visual is "key value" with a
gap that says "these are related" but distinct.

If the author prefers a colon separator:

```html
<span class="k">Duration:</span>
```

That's fine too — but the gap-only approach reads cleaner because
the contrasting font + color already separates them.

## `font-family: mono` on the value

The value cell uses monospace so different values still align
visually within the pill (consistent character width). For
non-numeric values (`Region: EMEA`, `Owner: jdoe`), monospace gives
a "this is data" feel that the proportional key complements.

It also stops the `<span>` from re-flowing on viewport resize — the
pill width is stable based on the value's character count.

For values that are purely numeric (`Duration: 47 min`),
`font-variant-numeric: tabular-nums` on a proportional font is an
alternative; the monospace approach is simpler.

## Wrap behavior

A row of pills wraps naturally on a narrow viewport — each pill is
inline-block, the container is `flex-wrap: wrap`:

```css
.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
```

Pills sit on row 1 until the viewport runs out of width, then wrap
to row 2. No horizontal scroll; the page extends downward instead.
Always preferable to a `white-space: nowrap` row that would force
horizontal page scroll.

## Inside a table — alongside another pattern

A row in a `data` table might use pills as its content:

```html
<tr>
  <td>#1184</td>
  <td>
    <span class="pill sev">SEV-2</span>
    <span class="pill resolved">Resolved</span>
  </td>
  <td>jdoe</td>
</tr>
```

The pills sit inside a `<td>`. They wrap if the cell is narrow. The
row is still selectable as an atom; the pills are content, not
chrome.

## Sample — incident header meta row

```html
<div class="meta-row">
  <span class="pill sev">SEV-2</span>
  <span class="pill resolved">Resolved</span>
  <span class="pill neutral">
    <span class="k">Duration</span>
    <span class="v">47 min</span>
  </span>
  <span class="pill neutral">
    <span class="k">Region</span>
    <span class="v">EMEA</span>
  </span>
  <span class="pill neutral">
    <span class="k">Owner</span>
    <span class="v">@jdoe</span>
  </span>
  <span class="pill neutral">
    <span class="k">Ticket</span>
    <span class="v">INC-2026-0412</span>
  </span>
</div>
```

Two status pills (severity + status), then four key/value pairs.
Reads as the incident's "by-the-numbers / by-the-roles" header.

## Sample — release/version meta row

```html
<div class="meta-row">
  <span class="pill neutral">
    <span class="k">Version</span>
    <span class="v">v1.4.2</span>
  </span>
  <span class="pill neutral">
    <span class="k">Released</span>
    <span class="v">2026-04-24</span>
  </span>
  <span class="pill neutral">
    <span class="k">Bundle</span>
    <span class="v">+12 KB</span>
  </span>
  <span class="pill warning">Breaking change</span>
  <span class="pill neutral">
    <span class="k">PRs</span>
    <span class="v">14</span>
  </span>
</div>
```

A release header — version + date + bundle + warning + PR count in
one row. The `Breaking change` pill is the loud signal; the rest
are neutral key/value.

## Sample — table row prefix

```html
<table data-ve-table="data">
  <thead>
    <tr>
      <th scope="col">PR</th>
      <th scope="col">Status</th>
      <th scope="col">Author</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>#1184</td>
      <td>
        <span class="pill resolved">Merged</span>
        <span class="pill neutral">
          <span class="k">+/−</span>
          <span class="v">340/120</span>
        </span>
      </td>
      <td>jdoe</td>
    </tr>
    <tr>
      <td>#1192</td>
      <td>
        <span class="pill warning">Awaiting review</span>
      </td>
      <td>asmith</td>
    </tr>
  </tbody>
</table>
```

Pills inside table cells — the "Status" column reads as a row of
pills per row, each pill carrying the verdict + an optional metric.
Sorting on Status is by text content (`localeCompare`) — the pills
sort as their text.

## DESIGN.md tokens consumed

| Token | Used by |
|---|---|
| `--vc-color-surface-2` | neutral pill background |
| `--vc-color-content-muted` | neutral pill key text; neutral pill text |
| `--vc-color-content` | neutral pill value text |
| `--vc-color-border` | neutral pill border |
| `--vc-color-danger` | sev pill background |
| `--vc-color-success` | resolved pill background |
| `--vc-color-warning` | warning pill background |
| `--vc-color-on-danger`, `-on-success`, `-on-warning` | high-contrast text colors on colored pills |
| `--vc-font-mono` | value text font family |

A theme toggle re-paints every pill via these tokens. The
high-contrast text on colored pills stays high-contrast in both
themes because the "on-X" tokens are computed against the
background tokens by the DESIGN.md engine.

## Selection / comment / decision-mini notes

A pill row outside a table is just inline content — no atom
contract. A pill INSIDE a `<td>` rides along with the cell's atom
contract. The reader's selection / comment / decision-mini is at
the cell level, not the pill level.

For a per-pill comment (rare), wrap each pill in its own selectable
atom: `<span data-ve-id="pill-12">…</span>`. The runtime's
atom-paint contract picks it up.
