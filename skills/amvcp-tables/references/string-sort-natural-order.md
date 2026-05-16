# String sort — `localeCompare` natural order

How non-numeric columns sort in a `data` table. Uses
`String.prototype.localeCompare` with `{numeric: true,
sensitivity: 'base'}` for "natural" ordering that puts `item2`
before `item10` and treats accented characters as equivalent for
the purposes of sort.

## Table of contents

- [What "natural" means here](#what-natural-means-here)
- [The comparator](#the-comparator)
- [`numeric: true` — embedded numbers sort numerically](#numeric-true--embedded-numbers-sort-numerically)
- [`sensitivity: 'base'` — accents are equal](#sensitivity-base--accents-are-equal)
- [`undefined` locale — uses the runtime's locale](#undefined-locale--uses-the-runtimes-locale)
- [Case sensitivity — case is also ignored](#case-sensitivity--case-is-also-ignored)
- [Empty strings sort first in `asc`](#empty-strings-sort-first-in-asc)
- [Stability tie-break](#stability-tie-break)
- [Sample — version strings](#sample--version-strings)
- [Sample — file paths](#sample--file-paths)
- [Sample — mixed currency text](#sample--mixed-currency-text)
- [When `localeCompare` is wrong](#when-localecompare-is-wrong)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## What "natural" means here

A string-sorted column should match the reader's intuition:

| Without natural sort | With natural sort |
|---|---|
| `item1, item10, item11, item2` | `item1, item2, item10, item11` |
| `v1.10.0, v1.2.0, v1.9.1` | `v1.2.0, v1.9.1, v1.10.0` |
| `0001.txt, 002.txt, 1.txt, 11.txt` | `0001.txt, 1.txt, 002.txt, 11.txt` |
| `Acme A, Acme b, acme C` | `Acme A, Acme b, acme C` (or near-equivalent depending on locale) |

The naive `Array.prototype.sort()` uses lexical (codepoint) order
which produces the WRONG results: `"item10".charCodeAt(4) === 48`
(`'0'`) < `"item2".charCodeAt(4) === 50` (`'2'`). The reader expects
"2 < 10"; lexical sort gives "10 < 2".

`localeCompare` with `numeric: true` fixes this by recognising
embedded number runs and comparing them as integers.

## The comparator

```js
function makeComparator(isNumeric, dir, cellTextOf) {
  var sign = (dir === 'desc') ? -1 : 1;
  var textOf = cellTextOf || defaultCellText;
  return function (a, b) {
    var primary;
    if (isNumeric) {
      // numeric column path — see numeric-cell-parser.md
    } else {
      primary = textOf(a.row).localeCompare(
        textOf(b.row), undefined, { numeric: true, sensitivity: 'base' }
      );
    }
    if (primary !== 0) return sign * primary;
    return a.index - b.index;   // stable tie-break
  };
}
```

`localeCompare` returns `-1` / `0` / `1` (or a comparable negative /
zero / positive number). The `sign` multiplier flips the result for
`desc`. The tie-break on original index keeps the sort stable — see
[sort-cycle-3-state.md](./sort-cycle-3-state.md) for why.

## `numeric: true` — embedded numbers sort numerically

`numeric: true` tells `localeCompare` to detect substrings of
digits and treat them as integers:

| Strings | `numeric: false` (default) | `numeric: true` |
|---|---|---|
| `'item2'` vs `'item10'` | `'2'.charCodeAt(0)=50` < `'1'.charCodeAt(0)=49`, so `'item2' > 'item10'` | `2 < 10`, so `'item2' < 'item10'` |
| `'a01'` vs `'a1'` | `'01' < '1'` (lexically) | `1 === 1` (numerically equal); falls to next chars |
| `'v1.10'` vs `'v1.2'` | `'10' < '2'` (lexically) | `1.{10} > 1.{2}` (numerically) |

This is the "natural" ordering humans expect. The flag is on by
default for every string-sorted column in `amvcp-tables.js`.

## `sensitivity: 'base'` — accents are equal

The `sensitivity` option controls which character differences count:

| Value | What's equal |
|---|---|
| `'base'` | `a === A`, `a === á`, `A === Á` |
| `'accent'` | `a === A`, `a !== á` |
| `'case'` | `a !== A`, `a === á` |
| `'variant'` | default — all differences count |

`amvcp-tables.js` uses `'base'` — case AND accent insensitive. The
reasoning: in a report table, the reader cares about "the letter",
not "the letter form". `Café` and `cafe` belong together; `José` and
`Jose` belong together; `iPhone` and `IPHONE` belong together.

For most data this is exactly right. For text where case is
semantic (e.g. a column of language codes where `es` vs `ES`
matters), the author should normalise the column content to a single
case before authoring.

## `undefined` locale — uses the runtime's locale

The first argument to `localeCompare(b, locale, options)` is the
target locale. Passing `undefined` (NOT `null`, NOT empty string)
means "use the runtime's default locale" — `navigator.language` on
the browser, the OS locale on Node.

So a report viewed in a Japanese browser sorts `ローマ字` strings the
Japanese way; a report viewed in a German browser sorts `ö` after
`o`; a report viewed in en-US sorts the standard ASCII order. The
report's behaviour adapts to the reader's environment — which is
usually what the reader expects.

If the author needs a fixed locale (e.g. for reproducible reports
across reviewers), the comparator would need to be re-engineered to
pass a specific locale. That escalation is not in the module today.

## Case sensitivity — case is also ignored

`sensitivity: 'base'` collapses case. So:

```
ACME
Acme
acme   ← these three are equal to localeCompare
```

The stable tie-break (`a.index - b.index`) preserves the authored
order within the equal group: if the author wrote ACME first and
acme last, the sort keeps that order on ties. The reader sees
`ACME, Acme, acme` (asc) and `acme, Acme, ACME` (desc — same group,
reversed by `sign` of the primary which is 0 — but the tie-break is
NOT negated, so the order within the equal group is the same in both
directions).

Wait — the tie-break is `a.index - b.index`, NOT multiplied by
`sign`. That means in BOTH `asc` and `desc`, ties keep the authored
order. The reader sees `ACME, Acme, acme` in both directions if
those are the only three. That is correct stable-sort behaviour;
see [row-move-not-clone.md](./row-move-not-clone.md) for the
decorate-sort-undecorate technique.

## Empty strings sort first in `asc`

`''.localeCompare('anything', undefined, {numeric:true})` returns
`-1` — empty string compares less than any non-empty string. So in
`asc` direction, empty cells sort to the **top**.

This is a reasonable default — readers usually expect "blanks at
the top" so they can address the unfilled rows first. The opposite
("blanks at the bottom") would be a `desc` sort.

If the author wants empties at the bottom in `asc`, the workaround
is to populate empties with a placeholder ("-" or "(blank)") that
sorts in a known place. Don't expect to flip the empty-sort behaviour
through a configuration knob; the module ships exactly the
localeCompare default.

## Stability tie-break

The `a.index - b.index` line is the stable-sort guarantee. Equal
keys keep DOM order. The tie-break is NOT multiplied by `sign` — in
`desc`, equal keys still keep DOM order, not reversed DOM order.

This matters when the reader wants to "group by category, then keep
the rest of the order". A `compare` table is curated and uses no
sort; a `data` table with a natural-sort string column gives the
reader exactly this behavior: equal keys preserve authored order.

## Sample — version strings

```html
<table data-ve-table="data">
  <thead>
    <tr>
      <th scope="col">Package</th>
      <th scope="col">Latest version</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>plugin-a</td><td>v1.10.2</td></tr>
    <tr><td>plugin-b</td><td>v1.2.0</td></tr>
    <tr><td>plugin-c</td><td>v1.9.1</td></tr>
    <tr><td>plugin-d</td><td>v2.0.0</td></tr>
    <tr><td>plugin-e</td><td>v0.4.10</td></tr>
  </tbody>
</table>
```

Click "Latest version" header. Result (asc):

```
v0.4.10
v1.2.0
v1.9.1
v1.10.2
v2.0.0
```

The `numeric: true` comparison sees the version segments as integers
— exactly the semver-friendly order. A lexical sort would have
produced `v0.4.10, v1.10.2, v1.2.0, v1.9.1, v2.0.0` (wrong).

## Sample — file paths

```html
<table data-ve-table="data">
  <thead>
    <tr><th scope="col">File</th><th scope="col">LOC</th></tr>
  </thead>
  <tbody>
    <tr><td>src/runtime.js</td><td>4,890</td></tr>
    <tr><td>src/designmd.js</td><td>1,420</td></tr>
    <tr><td>src/tables.js</td><td>1,838</td></tr>
    <tr><td>src/skills/amvcp-tables/SKILL.md</td><td>67</td></tr>
    <tr><td>src/skills/amvcp-typography/SKILL.md</td><td>112</td></tr>
  </tbody>
</table>
```

Click "File" header. The deeply-nested paths sort under their parent
directories, alphabetical within each level. Natural-sort gives the
expected directory-tree-like ordering.

## Sample — mixed currency text

```html
<table data-ve-table="data">
  <thead>
    <tr><th scope="col">Region</th><th scope="col">Annual budget</th></tr>
  </thead>
  <tbody>
    <tr><td>EMEA</td><td>€1.2M</td></tr>
    <tr><td>APAC</td><td>¥180M</td></tr>
    <tr><td>Americas</td><td>$2.4M</td></tr>
    <tr><td>UK</td><td>£900K</td></tr>
  </tbody>
</table>
```

The "Annual budget" column has mixed currencies → the numeric parser
rejects (`€1.2M` is not a number after stripping `€` and `M`),
falls to string sort. Click the header; natural-sort orders the
strings: `$2.4M, £900K, ¥180M, €1.2M`. Not numerically meaningful
— but the author shouldn't have mixed currencies anyway. The fix:
present a single currency per column, or split into multiple columns
("EUR budget", "USD budget", …).

The fail-fast string-sort path makes the mistake visible to the
author: clicking the column shows a non-numeric ordering, the
author realises the column is mixed, and fixes the data.

## When `localeCompare` is wrong

A few edge cases where the natural-sort default is NOT what the
author wants:

| Scenario | Why default is wrong | Fix |
|---|---|---|
| Case-sensitive identifiers | `var_name` vs `VAR_NAME` are different things | normalise to one case before authoring |
| Accent-sensitive content (Spanish dictionary order) | `ñ` should sort AFTER `n`, not equal to it | this is locale `es`-specific; the module honors the runtime's locale |
| Hex strings | "FF" should sort with "ff" but "10" should sort after "0F" | this column is numeric in spirit; author the values as decimal |
| Mixed languages in one column | en/ja/de sort orders interact unpredictably | split into per-language columns |

These are content-shape problems, not module bugs. The module's
single sort algorithm is correct for the overwhelming majority of
report tables; the exceptions are escalations.

## DESIGN.md tokens consumed

None for the sort algorithm itself. The visual marks of a sorted
column (right-align for numeric columns; accent tint for the sorted
column) consume tokens; see [numeric-cell-parser.md](
./numeric-cell-parser.md) and [sort-cycle-3-state.md](
./sort-cycle-3-state.md).

## Selection / comment / decision-mini notes

A string sort moves rows just like a numeric sort. Selection,
comments, and the decision-mini pill all ride along with the
`<tr>` nodes. See [row-move-not-clone.md](./row-move-not-clone.md).

## CSV-export contract

The CSV exports the literal cell text — no normalisation, no
locale-specific transformation. `Café` exports as `Café`; `iPhone`
exports as `iPhone`. The receiving spreadsheet can apply its own
sort with its own locale.

If the author wants the CSV to encode "case-normalised" or
"accent-stripped" content for downstream tools, that should be a
data-preparation step before authoring the table — not a property
of the CSV export.
