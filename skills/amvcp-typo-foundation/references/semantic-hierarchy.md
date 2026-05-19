# Sub-technique B — Semantic hierarchy contract

## Table of Contents

- [B.1 The contract table](#b1-the-contract-table)
- [B.2 How it is delivered](#b2-how-it-is-delivered)
- [B.3 Why the hierarchy is *strict*](#b3-why-the-hierarchy-is-strict)
- [B.4 No-nested-scrollbars compliance](#b4-no-nested-scrollbars-compliance)
- [B.5 Light + dark — correct for free](#b5-light--dark--correct-for-free)
- [B.6 Runtime migration map (NOT this skill's build work)](#b6-runtime-migration-map-not-this-skills-build-work)
- [Tokens consumed](#tokens-consumed)

The role-to-token lookup is what makes the type scale *usable*: it tells
the renderer and the page author which token every semantic element
gets, so nobody ever writes a raw `font-size` again. Implements TY-09.

This contract is the **public API** that `report-doc`, `slide`, `table`
and `chart` build on — a consumer renders a heading by emitting `<h1>`
(it gets `--vc-text-6` automatically) or a `.vc-type-hero`; it never
picks a raw size.

## B.1 The contract table

| Semantic role | Size token | Weight token | Line-height | Tracking |
|---|---|---|---|---|
| Page Title / hero | `--vc-text-hero` | `--vc-weight-display` | 1.05 | −0.04em |
| Section Heading (H1) | `--vc-text-6` | `--vc-weight-bold` | 1.15 | −0.02em |
| Subsection (H2) | `--vc-text-5` | `--vc-weight-bold` | 1.20 | −0.01em |
| H3 | `--vc-text-4` | `--vc-weight-bold` | 1.30 | 0 |
| H4 | `--vc-text-3` | `--vc-weight-heading` | 1.35 | 0 |
| H5 | `--vc-text-2` | `--vc-weight-heading` | 1.40 | 0 |
| H6 | `--vc-text-1` | `--vc-weight-heading` | 1.40 | 0 |
| Body Large / lead | `--vc-text-3` | `--vc-weight-body` | 1.60 | 0 |
| Body | `--vc-text-2` | `--vc-weight-body` | `--vc-line-height` | 0 |
| Body Small | `--vc-text-1` | `--vc-weight-body` | 1.50 | 0 |
| Caption | `--vc-text-0` | `--vc-weight-body` | 1.40 | 0 |
| Badge / Label / overline | `--vc-text-0` | `--vc-weight-label` | 1.40 | +0.08em, uppercase |

Line-height bands: display 1.05–1.15, heading 1.20–1.40, body 1.50–1.80,
caption 1.30–1.50.

Every weight token has a fallback chain so a missing optional engine key
never breaks the page:
- `--vc-weight-display` → `--vc-weight-bold` → `700`
- `--vc-weight-heading` → `--vc-weight-medium` → `500`
- `--vc-weight-label` → `--vc-weight-medium` → `500`
- `--vc-weight-body` → `--vc-weight-regular` → `400`

## B.2 How it is delivered

`amvcp-typography.css` delivers the contract as **element-level
defaults** so even un-classed semantic HTML is correct, plus three
explicit utility classes for the roles HTML has no native element for:

- `<h1>`…`<h6>`, `<p>`, `<small>` — correct with **NO class**.
- `.vc-type-hero` — the page-title display tier.
- `.vc-type-lead` / `.vc-type-body-lg` — lead / large body paragraph.
- `.vc-type-body-sm` — small body paragraph.
- `.vc-type-label` / `.vc-type-overline` — badge / overline (uppercase,
  tracked +0.08em).
- `.vc-type-caption` — caption (alias of `<small>` styling).

The agent writes plain semantic HTML; the layer does the rest.

## B.3 Why the hierarchy is *strict*

The contract produces a strictly decreasing size cascade:

```
hero  >  H1  >  H2  >  H3  >=  body-lg  >  body  >  body-sm  >  caption
```

H3 and body-lg share `--vc-text-3` by design (a lead paragraph reads at
the H3 size but at body weight and looser leading) — hence `>=` at that
one rung. Every other rung is a strict `>`.

## B.4 No-nested-scrollbars compliance

The contract introduces **no `overflow` rule** of any kind. Text wraps
naturally — the one sanctioned exception in `no-nested-scrollbars.md`
(paragraph/list text MAY rely on natural wrapping). Headings that are
too wide **extend the page**, never become an inner scroller. Do **not**
put `white-space:nowrap` on a heading. No `overflow:auto` wrapper.

## B.5 Light + dark — correct for free

The contract sets only size / weight / font / leading / tracking — it
sets **no `color` property**. Text *color* comes from the runtime's
existing `--ve-control-fg` ← `--vc-color-content` binding. Because
`--vc-text-*` / weights / `line-height` / fonts resolve identically for
the light and dark themes (only `--vc-color-*` is themed), the contract
is automatically correct in both themes. **Never add a `color` rule to
the typography layer** — that would break theming.

## B.6 Runtime migration map (NOT this skill's build work)

The runtime (`amvcp-runtime.js`) has 25 hard-coded `font-size` literals
and inline `letter-spacing` values. Migrating them is a **separate
refactor task**. This skill **defines the destination tokens**; it does
not perform the migration. The mapping for the future task:

| Runtime hard-coded value | Destination token |
|---|---|
| Badge `font-size: 11px` | `--vc-text-0` |
| Table-handle `font: 600 11px` | `--vc-text-0` + `--vc-weight-label` |
| Pill label sizes (`11px`–`12px`) | `--vc-text-0` |
| Inline `letter-spacing: 0.02–0.08em` | the per-role tracking above |
| Inline `text-transform: uppercase` (8+ sites) | `.vc-type-label` / `.vc-type-overline` |

The runtime's existing prose typography CSS (the `[data-ve-prose]`
heading/body rules) already binds correctly to `--vc-*` tokens — the
typography CSS layer is **additive** on top and must NOT modify those
rules (risks a prose-subsystem regression).

## Tokens consumed

`--vc-text-0…6`, `--vc-text-hero`, `--vc-font-heading/body`,
`--vc-weight-bold/medium/regular` (engine) + `--vc-weight-display/
heading/label/body` (optional, sub-technique C), `--vc-line-height`
(engine).
