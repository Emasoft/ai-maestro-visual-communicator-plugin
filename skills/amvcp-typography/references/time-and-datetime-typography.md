# Time and datetime — `<time>`, formatting, and tabular dates

The `<time>` element marks dates, durations, and absolute times in a
machine-readable form. The typography skill ships the `<time>`
element-level default plus a `.vc-datetime-tabular` modifier for
columns of dates / timestamps.

A page that displays many dates (a changelog, a status timeline, an
incident timeline) benefits enormously from the tabular treatment —
the dates align vertically column-for-column, the eye scans them
fast.

## What it is

The HTML `<time>` element:

```html
<time datetime="2026-04-12T14:32:00Z">2026-04-12 14:32 UTC</time>
```

The `datetime` attribute is the machine-readable form (ISO 8601);
the visible text is the human form. Screen readers may announce the
human form; assistive technology, search engines, and scrapers may
read the `datetime`.

The typography contract sets `<time>` to use tabular numerics by
default — most date / time strings are numeric-heavy, and tabular
digits align them naturally.

## The contract

```css
time {
  /* Tabular numerics — every digit is the same width. */
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  /* No font-family override — inherits from context (body or mono
     depending on placement). */
}

/* For columns of dates, force the mono face for stronger column
   alignment. */
.vc-datetime-tabular {
  font-family: var(--vc-font-mono, ui-monospace, monospace);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```

## Scaffold

### Inline date

```html
<p>The incident started at <time datetime="2026-04-12T14:32:00Z">14:32
   UTC</time> on <time datetime="2026-04-12">April 12, 2026</time>.</p>
```

The `datetime` attribute holds the parseable ISO form; the visible
text is reader-friendly. Tabular numerics on `<time>` mean the digits
inside don't wobble even when the value updates.

### Date column

```html
<table>
  <thead>
    <tr><th>Date</th><th>Event</th></tr>
  </thead>
  <tbody>
    <tr>
      <td class="vc-datetime-tabular">2026-04-12 14:32</td>
      <td>Incident started</td>
    </tr>
    <tr>
      <td class="vc-datetime-tabular">2026-04-12 14:47</td>
      <td>Mitigation deployed</td>
    </tr>
    <tr>
      <td class="vc-datetime-tabular">2026-04-12 15:19</td>
      <td>Service restored</td>
    </tr>
  </tbody>
</table>
```

The dates column aligns vertically perfectly — each `2026-04-12` row
sits exactly on the rows above and below. Mono face + tabular = the
spreadsheet aesthetic for dates.

### Duration

```html
<p>The incident lasted <time datetime="PT47M">47 minutes</time>.</p>
```

The ISO 8601 duration format (`PT47M` = "period of time, 47 minutes")
is the machine-readable form; the human form is "47 minutes".

### Relative time

```html
<p>The incident was reported <time datetime="2026-04-12T14:32:00Z">
   3 days ago</time>.</p>
```

The `datetime` is absolute; the visible text is relative. This is the
canonical pattern for "X ago" timestamps in feeds, status pages, and
activity logs.

## Tokens consumed / extended

- **Consumes:** `--vc-font-mono`.
- **Extends:** nothing.

## Why tabular numerics by default for `<time>`

A typical date is `2026-04-12` — eight digits. In a proportional
font:

- The "1" is narrow (~0.4em).
- The "2" is medium (~0.55em).
- The "0" is wide (~0.6em).
- The "4" is wide (~0.65em).

A column of dates with `2026-04-12`, `2026-05-15`, `2026-10-30`
visually shifts horizontally because the digit-width sum varies per
row. The reader's eye can't lock onto a column.

Tabular numerics fix this — every digit is `0.6em` wide, so every
date is exactly the same horizontal width, and the column aligns
perfectly.

## ISO 8601 — the universal datetime form

The `datetime` attribute MUST be ISO 8601:

| Form | Meaning |
|---|---|
| `2026-04-12` | Date |
| `2026-04-12T14:32:00Z` | Date + UTC time |
| `2026-04-12T14:32:00+02:00` | Date + time + timezone offset |
| `14:32:00` | Time of day |
| `2026-W15` | ISO week |
| `2026-04` | Year-month |
| `PT47M` | Duration: 47 minutes |
| `PT1H30M` | Duration: 1 hour 30 minutes |
| `P3D` | Duration: 3 days |
| `2026` | Year only |

The browser doesn't *render* the `datetime` form — it's metadata.
Tools, screen readers, and search engines parse it.

## Why `.vc-datetime-tabular` switches to mono

`<time>` inherits from context — in a body paragraph, it's body face;
in a `<pre>`, it's mono.

For a *column* of dates in a table, the body face produces a column
that aligns by digit-width but uses proportional non-digit chars (the
"T", the "Z", the "-"). The visual rhythm is broken.

Switching to the mono face produces TRUE column alignment — every
character is fixed-width. Date columns become spreadsheet-grade.

The cost is a font-family change inside the table cell. Worth it for
columns of dates; not worth it for single inline dates.

## ISO-week and Year-month

For a status timeline that groups events by ISO week or month:

```html
<h3><time datetime="2026-W15">Week 15</time></h3>
<ul>…events…</ul>

<h3><time datetime="2026-04">April 2026</time></h3>
<ul>…events…</ul>
```

The `<time>` element accepts these forms; the typography contract
applies tabular numerics to them too (the digits inside "Week 15"
align across multiple `<h3>` headings).

## Light + dark — orthogonal

`<time>` and `.vc-datetime-tabular` set NO `color` rule. Theme-correct
trivially via inheritance.

## Tabular numerics composition with other numeric features

`font-variant-numeric` can take multiple values:

```css
.vc-datetime-tabular {
  font-variant-numeric: tabular-nums slashed-zero;
  /* Tabular widths PLUS slashed zero — for unambiguous dates. */
}
```

The typography skill's default `<time>` rule uses just `tabular-nums`
(slashed zero is a per-page decision); the agent adds `slashed-zero`
when the dates appear in a context where 0 and O could be confused
(e.g. `2024-01-O5` instead of `2024-01-05` — a font's O collision).

## Inline date format conventions

The typography skill does NOT enforce a particular human-form
convention — `April 12, 2026` (US), `12 April 2026` (UK / EU), `2026-04-12`
(ISO), `2026年4月12日` (Japan) are all valid. The agent picks the
convention per audience and per locale.

The `lang` attribute on the document or element drives screen-reader
pronunciation:

```html
<time datetime="2026-04-12" lang="en-US">April 12, 2026</time>
<time datetime="2026-04-12" lang="en-GB">12 April 2026</time>
<time datetime="2026-04-12" lang="ja">2026年4月12日</time>
```

## Timezone display

For times that span timezones, show the timezone abbreviation:

```html
<time datetime="2026-04-12T14:32:00Z">14:32 UTC</time>
<time datetime="2026-04-12T16:32:00+02:00">16:32 CEST</time>
```

The reader sees "14:32 UTC" and "16:32 CEST" — visually distinct,
unambiguous. The `datetime` attribute carries the offset for tools to
re-parse if needed.

For a column of times across timezones, the typography skill's mono
face on `.vc-datetime-tabular` aligns even the timezone abbreviation
column.

## Selection-contract conformance

A `<time>` inline in prose is NOT a typography atom — it lives inside
a parent paragraph atom.

A `<time>` standalone (in a table cell, in a list item, in a heading)
is part of the parent atom. The decision-mini-pill anchors to the
parent.

## The runtime's date use

The runtime emits dates in several places:

- Footer ("Generated at 2026-04-12 14:32 UTC").
- Auto-pill ("auto-generated at …").
- Changelog entries.
- Status pill values ("Duration · 47 min").

Each of these should be wrapped in `<time>` for semantic correctness
and to inherit the tabular-numerics default. The typography skill
ships the contract; the runtime adoption is a refactor.

## When NOT to wrap text in `<time>`

- Text that contains a date but is not *about* the date — "On April
  12th, we shipped …" — the `<time>` would wrap "April 12th" but the
  surrounding context is the story, not the date.
- Years embedded in prose — "in the late 1990s" — the year is not a
  precise date.
- Vague dates — "around mid-April" — no ISO form to put in `datetime`.

For all the above, plain prose is correct; `<time>` is for
*marketable* dates (the reader could click "add to calendar").

## Verification

Per `skills/amvcp-self-debug-rules/SKILL.md`:

1. Render a specimen page with multiple `<time>` elements (inline)
   and a `.vc-datetime-tabular` column.
2. Confirm tabular numerics: copy a date column to a fixed-width
   editor — verify alignment.
3. Confirm `datetime` attributes are valid ISO 8601 (validate
   programmatically or with a tool).
4. Confirm screen-reader announcement reads correctly per `lang`.
5. Repeat in light and dark themes; confirm rendering unchanged.

## Cross-references

- [tabular-numerics.md](./tabular-numerics.md) — the underlying
  digit-width contract.
- [code-and-mono.md](./code-and-mono.md) — the mono face the
  `.vc-datetime-tabular` switches to.
- [language-and-locale.md](./language-and-locale.md) — `<html lang>`
  drives date-format conventions.
- [badge-pill-chip-typography.md](./badge-pill-chip-typography.md)
  — pills sometimes show dates as their `.v`.
