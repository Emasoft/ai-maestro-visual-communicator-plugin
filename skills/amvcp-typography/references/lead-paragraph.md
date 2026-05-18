# Lead paragraph — the larger, looser opening body

## Table of Contents

- [What it is](#what-it-is)
- [The contract](#the-contract)
- [Scaffold](#scaffold)
- [Tokens consumed / extended](#tokens-consumed--extended)
- [Why size step 3, not step 4](#why-size-step-3-not-step-4)
- [Why line-height 1.60 (looser than body's 1.55)](#why-line-height-160-looser-than-bodys-155)
- [The first-letter drop cap — when to add it](#the-first-letter-drop-cap--when-to-add-it)
- [The clay/colour left-border — TL;DR card variant](#the-claycolour-left-border--tldr-card-variant)
- [Light + dark — correct for free](#light--dark--correct-for-free)
- [Selection-contract conformance](#selection-contract-conformance)
- [Why two aliases (`vc-type-lead` AND `vc-type-body-lg`)](#why-two-aliases-vc-type-lead-and-vc-type-body-lg)
- [When NOT to use a lead](#when-not-to-use-a-lead)
- [Lead + eyebrow + heading — the standard opener](#lead--eyebrow--heading--the-standard-opener)
- [No nested scrollbars](#no-nested-scrollbars)
- [Cross-references](#cross-references)

The lead (a.k.a. *standfirst*, *dek*, *intro*) is the paragraph that
introduces a section — set one body-step larger than ordinary body,
slightly lighter weight, and slightly looser leading. The reader's eye
recognises it as "this paragraph summarises what follows", and the
visual difference rewards skimming.

This is one of the three semantic-role-without-a-native-element cases
the typography skill provides a utility class for
(`.vc-type-lead` / `.vc-type-body-lg`).

## What it is

A lead paragraph is **structurally** a `<p>` — it lives in the
document outline as ordinary prose. Visually it is set:

- one step LARGER than body (`--vc-text-3` vs body's `--vc-text-2`);
- at the body weight (NOT bold — boldness is for emphasis, not
  introduction);
- with looser leading (`1.60` vs body's `--vc-line-height`);
- with the body face (NOT the heading face — leads belong to the
  prose flow, not the heading row).

The reader scans page → eyebrow → heading → lead → body. Each step is
smaller and tighter than the last; the lead is the *bridge* from
heading to body. A page without a lead reads as choppier — heading
slams directly into body, no decompression.

## The contract

`amvcp-typography.css`:

```css
.vc-type-lead {
  font-size: var(--vc-text-3);
  font-weight: var(--vc-weight-body, var(--vc-weight-regular, 400));
  font-family: var(--vc-font-body, inherit);
  line-height: 1.60;
}
.vc-type-body-lg {
  font-size: var(--vc-text-3);
  font-weight: var(--vc-weight-body, var(--vc-weight-regular, 400));
  font-family: var(--vc-font-body, inherit);
  line-height: 1.60;
}
```

`.vc-type-lead` and `.vc-type-body-lg` are aliases — pick the one that
reads better in the markup. By convention:

- Use `.vc-type-lead` for the **single** opening paragraph after a
  heading. It is the *introduction* to the section.
- Use `.vc-type-body-lg` for a *body* paragraph elsewhere in the
  document that wants the same visual weight (e.g. a pull-quote rendered
  as a paragraph, a callout's body text).

## Scaffold

```html
<section>
  <p class="vc-type-overline">Incident Report</p>
  <h1>Cache stampede during slot-fill rollout</h1>
  <p class="vc-type-lead">
    On 2026-04-12 at 14:32 UTC, the slot-fill rollout triggered a
    47-minute cache stampede that elevated the SEV-2 incident channel
    for 23 customers in the EU-WEST region.
  </p>
  <p>
    The root cause was a missing `Cache-Control: no-cache` header on
    the rollout endpoint, which caused the CDN to serve stale
    responses to fan-out clients for the duration of the slot-fill.
  </p>
  <p>
    Detection was driven by the synthetic monitoring suite, which …
  </p>
</section>
```

The lead is **immediately** after the heading. No empty line above
it (the heading's own margin-bottom handles spacing); the body
paragraphs follow with the normal `<p>`-to-`<p>` rhythm.

## Tokens consumed / extended

- **Consumes:** `--vc-text-3`, `--vc-weight-body`, `--vc-weight-regular`,
  `--vc-font-body`.
- **Extends:** nothing.

## Why size step 3, not step 4

Step 3 is `--vc-text-3` (~20 px @ base 16 with the Perfect Fourth
scale). Step 4 is `--vc-text-4` (~28 px) — that's a *subheading*
size. The lead must read as **prose**, not as a heading; a step-4
lead competes with the surrounding heading, breaking the cascade
hero > H1 > H2 > H3 ≥ lead > body.

The hierarchy contract (B.3 in [semantic-hierarchy.md](./semantic-hierarchy.md))
specifies `H3 >= lead` — they share `--vc-text-3` by design: the H3 is
bold and tight-leading, the lead is regular and loose-leading. Same
size, opposite typographic character.

## Why line-height 1.60 (looser than body's 1.55)

The lead is *meant to be skimmed*. Looser leading slows the reader's
eye, encouraging them to take in the whole sentence at once rather
than racing through it. The catalog's editorial pairings (Source Sans,
Fraunces) all recommend leading in the `1.55-1.65` band for prose;
`1.60` is the lead's sweet spot.

The body's leading is `--vc-line-height` (typically `1.55` in the
engine default). The 0.05 difference is small but visible — a 5-line
lead at `1.60` is one full line taller than the same text at `1.55`,
giving the reader the *air* signal.

## The first-letter drop cap — when to add it

A *drop cap* (the first letter of the lead rendered 3-5 lines tall and
visually dropped into the paragraph) is the editorial signature of a
lead. The typography skill DOES NOT bake this into `.vc-type-lead` by
default — drop caps are a per-section decision, not a per-paragraph
default. The opt-in utility:

```css
.vc-type-lead.vc-drop-cap::first-letter {
  float: left;
  font-size: 3.2em;
  line-height: 1;
  font-weight: var(--vc-weight-display, var(--vc-weight-bold, 700));
  font-family: var(--vc-font-heading, inherit);
  padding: 0.1em 0.1em 0 0;
}
```

Usage:
```html
<p class="vc-type-lead vc-drop-cap">
  On 2026-04-12 at 14:32 UTC, the …
</p>
```

The drop cap uses the **heading face** (not the body face) — this is
the only place in the entire prose flow where the heading face appears
inside body content. Editorial convention: the drop cap is a
*decorative* element borrowed from the heading register.

Drop caps are a per-page editorial decision. The agent picks them for:

- A long-form editorial article (single opening lead).
- A multi-chapter document (one drop cap per chapter opening).

The agent avoids them for:

- Reports, dashboards, technical content — adds editorial drama that
  conflicts with the page's tone.
- A page with many leads — drop caps lose their "this is the
  beginning" semantic when repeated.
- A page that may be rendered in compact viewports (mobile) — the
  drop cap eats horizontal space at small widths.

## The clay/colour left-border — TL;DR card variant

The Anthropic-Claude reference corpus uses a *clay-bordered* lead as
the "TL;DR" card pattern (from
`reports/visualizing-triage/20260516_005708+0200-extended-mining-html-effectiveness.md`
§3.16: "TL;DR card with clay left-border"). The variant:

```css
.vc-type-lead.vc-tldr {
  border-left: 4px solid var(--vc-color-accent, currentColor);
  padding-left: 1em;
}
```

Use the `.vc-tldr` modifier when the lead is **also** acting as a
summary card — typically near the top of a report, before the main
content. The clay (accent) border calls it out without screaming.

The typography skill is the home for the `.vc-type-lead` core; the
`.vc-tldr` modifier is opt-in and reuses the engine's `--vc-color-accent`
for the border. NO hardcoded colour in the typography CSS.

## Light + dark — correct for free

The lead contract sets only size / weight / font / leading — NO
`color`, NO `background`. Theme correctness is automatic.

The optional drop cap modifier also sets no colour — the
`::first-letter` inherits from the paragraph. Themed correctly.

The optional `.vc-tldr` modifier uses `var(--vc-color-accent,
currentColor)` for the border — themed correctly: the engine emits a
different accent per theme.

## Selection-contract conformance

Each `.vc-type-lead` paragraph is a typography atom — the
`markTypographyAtoms` walker stamps it as `data-ve-type="type-lead"`
(NOT `type-body`). This distinction matters: a comment "this lead is
too long" should be filed against the *lead atom*, not the
unspecified body of the section. The decision-mini-pill anchors to
the lead's top-right; the user can Skip / Approve / Deny the lead
independently of the surrounding paragraphs.

When a lead has `.vc-drop-cap` or `.vc-tldr` modifiers, the atom type
is still `type-lead` — the modifiers don't change the atom semantic.

## Why two aliases (`vc-type-lead` AND `vc-type-body-lg`)

The two classes resolve to **identical CSS**. The duplication is a
*semantic* affordance, not a visual one:

- `.vc-type-lead` is the **introduction** to a section. There is at
  most one per section.
- `.vc-type-body-lg` is a **large body paragraph** elsewhere — used
  for pull quotes, callout bodies, slide-deck subtitles, sidebar
  intros. There can be many per page.

Keeping them as aliases means a downstream tool (a doc auditor, a
diff tool, an editor plugin) can count "how many leads per section"
correctly without misclassifying every large body paragraph as a lead.

## When NOT to use a lead

- A section with no body paragraphs after it — the lead is meant to
  *introduce* something. A lonely lead reads as a misplaced subhead.
- Inside a heading hierarchy more than 2 deep — leads belong below
  H1 or H2, not below H4 / H5 / H6 (those subsections are short, and
  a lead steals visual attention from the next H-rung).
- Inside a list — leads are paragraph-level; list items should be
  ordinary body.
- For a single-paragraph callout — just use a `<p>` with the parent
  callout's surface styling; the lead is for *introducing* multi-paragraph
  content.

## Lead + eyebrow + heading — the standard opener

The three patterns compose into the canonical section opener:

```html
<section>
  <p class="vc-type-overline">Phase 1 · Discovery</p>
  <h1>Identifying the rollout regression</h1>
  <p class="vc-type-lead">
    We traced the regression to the slot-fill endpoint by replaying
    the CDN logs against the staging environment.
  </p>
  <p>
    The first body paragraph adds detail to the lead's claim.
  </p>
</section>
```

Eyebrow (smallest, mono-tracked) → heading (largest, bold) → lead
(large, regular, loose) → body (default). Four typographic registers
in four lines. Every AMVCP section-with-substance follows this
pattern.

## No nested scrollbars

The lead contract has no `overflow` rule. Long leads wrap naturally
(the sanctioned exception). Do not put `white-space: nowrap` on a
lead — the wrapping is correct.

## Cross-references

- [semantic-hierarchy.md](./semantic-hierarchy.md) — the role table
  where the lead sits (`Body Large / lead → --vc-text-3, body weight,
  1.60 line-height`).
- [eyebrow-overline-label.md](./eyebrow-overline-label.md) — the
  eyebrow that pairs with the heading above the lead.
- [hyphenation-and-justification.md](./hyphenation-and-justification.md)
  — how to handle wide leads in narrow columns.
- `design-tokens` skill — owns the `--vc-color-accent` the `.vc-tldr`
  modifier reads.
