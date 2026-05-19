# Token spec table — `Role | Hex | System | Notes` design system tables

The canonical DESIGN.md token-specification table: rows are
semantic roles, columns are concrete values (hex, system color,
notes). The shape that bridges design specification and code
generation — the table EVERY DESIGN.md ships.

## Table of contents

- [The shape](#the-shape)
- [Why semantic roles, not descriptive names](#why-semantic-roles-not-descriptive-names)
- [4-column canonical layout](#4-column-canonical-layout)
- [Light + dark — two tables, not two columns](#light--dark--two-tables-not-two-columns)
- [The "System color" column](#the-system-color-column)
- [Inline hex with a swatch](#inline-hex-with-a-swatch)
- [Click-to-copy hex on hover](#click-to-copy-hex-on-hover)
- [Sample — color tokens (light)](#sample--color-tokens-light)
- [Sample — color tokens (dark) — same table, different values](#sample--color-tokens-dark--same-table-different-values)
- [Sample — typography tokens](#sample--typography-tokens)
- [Sample — spacing tokens](#sample--spacing-tokens)
- [DESIGN.md tokens consumed](#designmd-tokens-consumed)
- [Selection / comment / decision-mini notes](#selection--comment--decision-mini-notes)
- [CSV-export contract](#csv-export-contract)

---

## The shape

```
┌────────────────┬────────────┬─────────────┬─────────────────────────┐
│ Role           │ Hex        │ System      │ Notes                   │
├────────────────┼────────────┼─────────────┼─────────────────────────┤
│ Canvas         │ #FAF9F5    │ Ivory       │ page background         │
│ Surface        │ #FFFFFF    │ White       │ card / panel background │
│ Content        │ #141413    │ Slate       │ body text               │
│ Content muted  │ #5B5343    │ Warm gray   │ secondary text          │
│ Accent         │ #B8861F    │ Amber       │ primary CTA, sort tint  │
│ Success        │ #788C5D    │ Olive       │ pass, positive delta    │
│ Danger         │ #D97757    │ Clay        │ fail, severity high     │
│ Warning        │ #A8791F    │ Mustard     │ partial, severity med   │
└────────────────┴────────────┴─────────────┴─────────────────────────┘
```

A regular `data` table with 4 columns. Each row is a single token.
The table doubles as:
- A reference for designers reading the spec.
- A copy-paste source for engineers writing CSS (`var(--vc-color-
  canvas, #FAF9F5)`).
- An audit artifact (you can SEE the whole palette and check
  contrast / coherence).

The pattern is documented in `3.2` of the deep-batch-16 mining of
DESIGN.md formats from the wider design-system catalog.

## Why semantic roles, not descriptive names

`Canvas` not `Beige`. `Accent` not `Gold`. `Danger` not `Red`. The
role describes the USE; the hex describes the appearance.

| Bad role | Good role | Why |
|---|---|---|
| `Blue` | `Link` | the role is "link color"; the hex changes per theme but it's always the link |
| `Red` | `Danger` | the role is "negative outcome"; might be orange in dark theme |
| `Gold` | `Accent` | the role is "primary brand color"; might be amber in light, butter in dark |
| `Gray-500` | `Content muted` | the role is "secondary text"; specific gray varies per theme |

Semantic roles survive theme changes. Descriptive roles do not.

## 4-column canonical layout

| Column | Content |
|---|---|
| **Role** | Semantic name (e.g. "Canvas", "Surface", "Content") |
| **Hex** | Concrete hex value, often with a swatch |
| **System** | The "system color name" the design team uses internally ("Ivory", "Clay", "Olive") |
| **Notes** | One-line use-case description |

The 4-column layout is the established convention from Anthropic's
design-system docs (re-used across the plugin). Other variations:

- **3-column** (omit System): for engineering-focused docs where
  the system name doesn't add value.
- **5-column** (add Token name): when the docs need to spell out
  the CSS custom-property name explicitly:

```
| Role | Token | Hex | System | Notes |
| Canvas | --vc-color-canvas | #FAF9F5 | Ivory | page background |
```

The 5-column is more redundant but copy-pasteable into engineering
docs.

## Light + dark — two tables, not two columns

A single table with `Light hex` and `Dark hex` as separate columns
COMPRESSES the data but obscures the comparison:

```
| Role     | Light hex | Dark hex |  ← bad — 4 columns become 8 for a full spec
| Canvas   | #FAF9F5   | #1A1612  |
```

Better: TWO tables, one per theme, identical row structure:

```html
<h3>Color tokens — Light theme</h3>
<table data-ve-table="data">...</table>

<h3>Color tokens — Dark theme</h3>
<table data-ve-table="data">...</table>
```

The reader scans one theme at a time; the role-to-hex relationship
is clearer within each table.

## The "System color" column

The system column is the team's internal naming convention. It's
not strictly necessary but valuable when:
- The team uses memorable names ("Ivory" instead of "off-white") in
  conversation.
- The brand has named colors (e.g. "Anthropic Clay" is a specific
  shade).
- The same color appears in marketing materials, the website, the
  product UI — the system name is what ties them together.

For a token without a system name, leave the cell empty or write
"—". Don't make up a name.

## Inline hex with a swatch

```html
<td>
  <span class="swatch" style="background:#FAF9F5"></span>
  #FAF9F5
</td>
```

```css
.swatch {
  display: inline-block;
  width: 14px; height: 14px;
  border-radius: 3px;
  margin-right: 8px;
  vertical-align: -2px;
  border: 1px solid var(--vc-color-border, #e3dcc9);
}
```

A 14×14 colored square sits inline before the hex text. The reader
sees the COLOR and the HEX together — no need to scroll, no need
to imagine. The border on the swatch keeps light-color swatches
visible on a white background.

The `style="background:#FAF9F5"` is inline because each row's color
is unique — author-driven, not token-driven. The hex IS the
specification; it's literal, not a variable.

## Click-to-copy hex on hover

A nice enhancement: clicking the hex copies it to the clipboard,
like the project's other tokens. The author can add:

```html
<td>
  <span class="swatch" style="background:#FAF9F5"></span>
  <button class="copy-hex" type="button" data-hex="#FAF9F5">#FAF9F5</button>
</td>
```

```js
document.querySelectorAll('.copy-hex').forEach(btn => {
  btn.addEventListener('click', () => navigator.clipboard.writeText(btn.dataset.hex));
});
```

A small interaction; the tables module doesn't ship this — it's
content. The author writes the helper script if they want it.

## Sample — color tokens (light)

```html
<table data-ve-table="data" data-ve-table-csv="1"
       data-ve-label="Color tokens — Light theme">
  <thead>
    <tr>
      <th scope="col">Role</th>
      <th scope="col">Hex</th>
      <th scope="col">System</th>
      <th scope="col">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Canvas</th>
      <td><span class="swatch" style="background:#FAF9F5"></span> #FAF9F5</td>
      <td>Ivory</td>
      <td>page background</td>
    </tr>
    <tr>
      <th scope="row">Surface</th>
      <td><span class="swatch" style="background:#FFFFFF"></span> #FFFFFF</td>
      <td>White</td>
      <td>card / panel background</td>
    </tr>
    <tr>
      <th scope="row">Content</th>
      <td><span class="swatch" style="background:#141413"></span> #141413</td>
      <td>Slate</td>
      <td>body text — WCAG AA on #FFFFFF</td>
    </tr>
    <tr>
      <th scope="row">Accent</th>
      <td><span class="swatch" style="background:#B8861F"></span> #B8861F</td>
      <td>Amber</td>
      <td>primary CTA, sort tint, focus outline</td>
    </tr>
    <tr>
      <th scope="row">Success</th>
      <td><span class="swatch" style="background:#788C5D"></span> #788C5D</td>
      <td>Olive</td>
      <td>pass, positive delta, "good"</td>
    </tr>
    <tr>
      <th scope="row">Danger</th>
      <td><span class="swatch" style="background:#D97757"></span> #D97757</td>
      <td>Clay</td>
      <td>fail, severity high, "bad"</td>
    </tr>
  </tbody>
</table>
```

The reader sees the role, the swatch, the hex, the system name, and
the use case in one row. Sortable: clicking Role sorts
alphabetically; clicking Hex sorts by hex value (lexically, which
isn't perfect but is consistent). CSV-exportable for downstream
tooling.

## Sample — color tokens (dark) — same table, different values

```html
<table data-ve-table="data" data-ve-table-csv="1"
       data-ve-label="Color tokens — Dark theme">
  <thead>
    <tr>
      <th scope="col">Role</th>
      <th scope="col">Hex</th>
      <th scope="col">System</th>
      <th scope="col">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Canvas</th>
      <td><span class="swatch" style="background:#1A1612"></span> #1A1612</td>
      <td>Espresso</td>
      <td>page background</td>
    </tr>
    <tr>
      <th scope="row">Surface</th>
      <td><span class="swatch" style="background:#252019"></span> #252019</td>
      <td>Coffee</td>
      <td>card / panel background</td>
    </tr>
    <tr>
      <th scope="row">Content</th>
      <td><span class="swatch" style="background:#F0EAD8"></span> #F0EAD8</td>
      <td>Cream</td>
      <td>body text — WCAG AA on #1A1612</td>
    </tr>
    <tr>
      <th scope="row">Accent</th>
      <td><span class="swatch" style="background:#FFC04F"></span> #FFC04F</td>
      <td>Butter</td>
      <td>primary CTA, sort tint, focus outline</td>
    </tr>
    <tr>
      <th scope="row">Success</th>
      <td><span class="swatch" style="background:#A2B57A"></span> #A2B57A</td>
      <td>Sage</td>
      <td>pass, positive delta, "good"</td>
    </tr>
    <tr>
      <th scope="row">Danger</th>
      <td><span class="swatch" style="background:#FF8A6E"></span> #FF8A6E</td>
      <td>Coral</td>
      <td>fail, severity high, "bad"</td>
    </tr>
  </tbody>
</table>
```

Same Role column (Canvas, Surface, …); different Hex and System
columns. The Notes are stable across themes — the use case doesn't
change.

## Sample — typography tokens

The same shape extends to typography:

```html
<table data-ve-table="data">
  <thead>
    <tr>
      <th scope="col">Role</th>
      <th scope="col">Font</th>
      <th scope="col">Size</th>
      <th scope="col">Weight</th>
      <th scope="col">Line height</th>
      <th scope="col">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Page title</th>
      <td>Tiempos</td><td>32px</td><td>500</td><td>1.18</td>
      <td>Hero h1</td>
    </tr>
    <tr>
      <th scope="row">Heading 1</th>
      <td>Tiempos</td><td>24px</td><td>500</td><td>1.22</td>
      <td>Section h2</td>
    </tr>
    <tr>
      <th scope="row">Body</th>
      <td>Söhne</td><td>16px</td><td>400</td><td>1.5</td>
      <td>Prose body copy</td>
    </tr>
    <tr>
      <th scope="row">Caption</th>
      <td>Söhne</td><td>13px</td><td>400</td><td>1.4</td>
      <td>Image captions, table footnotes</td>
    </tr>
    <tr>
      <th scope="row">Code inline</th>
      <td>IBM Plex Mono</td><td>0.92em</td><td>400</td><td>1.4</td>
      <td><code>code</code> spans in prose</td>
    </tr>
    <tr>
      <th scope="row">Code block</th>
      <td>IBM Plex Mono</td><td>13px</td><td>400</td><td>1.5</td>
      <td><pre> blocks</td>
    </tr>
  </tbody>
</table>
```

6-column typography table. The Notes column captures use-case
specifics that wouldn't fit in the canonical 4-column shape.

## Sample — spacing tokens

```html
<table data-ve-table="data">
  <thead>
    <tr>
      <th scope="col">Role</th>
      <th scope="col">Px</th>
      <th scope="col">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr><th scope="row">Space 0</th><td>0px</td><td>flush</td></tr>
    <tr><th scope="row">Space 1</th><td>4px</td><td>inline gap inside a pill / chip</td></tr>
    <tr><th scope="row">Space 2</th><td>8px</td><td>inline gap between cells</td></tr>
    <tr><th scope="row">Space 3</th><td>12px</td><td>card padding (small)</td></tr>
    <tr><th scope="row">Space 4</th><td>16px</td><td>card padding (default)</td></tr>
    <tr><th scope="row">Space 5</th><td>24px</td><td>section spacing (small)</td></tr>
    <tr><th scope="row">Space 6</th><td>32px</td><td>section spacing (default)</td></tr>
    <tr><th scope="row">Space 7</th><td>48px</td><td>section break (large)</td></tr>
    <tr><th scope="row">Space 8</th><td>64px</td><td>page-level top/bottom padding</td></tr>
  </tbody>
</table>
```

A 9-row scale. The Notes column tells the designer when to reach
for which token. The Px column is sortable (numeric — clicking
sorts the rows by px value — useful for "show me only the spacing
values smaller than X").

## DESIGN.md tokens consumed

This table is META — it specifies tokens, doesn't consume them.
The runtime's table baseline (border, zebra, header divider) and
the module's sort + CSV (if opted in) consume the standard tokens.
The swatch backgrounds are inline-styled to the literal hex of
each token (specifying the token's own value).

## Selection / comment / decision-mini notes

Each row is a selectable atom — the reader can comment on "this
specific token's value" or attach a decision-mini ("approve this
hex" / "deny this hex"). Particularly useful during a design-review
phase where the team is arguing over specific values.

## CSV-export contract

The token table exports as a regular CSV. The swatch is invisible
in the CSV (no text); the hex IS the text. So:

```csv
Role,Hex,System,Notes
Canvas,#FAF9F5,Ivory,page background
Surface,#FFFFFF,White,card / panel background
Content,#141413,Slate,body text — WCAG AA on #FFFFFF
Accent,#B8861F,Amber,"primary CTA, sort tint, focus outline"
Success,#788C5D,Olive,"pass, positive delta, ""good"""
Danger,#D97757,Clay,"fail, severity high, ""bad"""
```

The Notes column with commas gets RFC-4180 quoted. Quotes inside
quoted fields get doubled (`""good""`). The receiving spreadsheet
parses correctly.

The CSV is a copy-paste-friendly format for engineers — paste into
a CSS preprocessor, into a design-token JSON, into a Figma plugin.
The token spec table is one of the most-CSV-exported tables in a
DESIGN.md.
