# Sub-technique D — Font loading + pairing presets

## Table of Contents

- [D.1 DT-09 banned-font reconciliation](#d1-dt-09-banned-font-reconciliation)
- [D.2 The five pairings](#d2-the-five-pairings)
- [D.3 Loading discipline](#d3-loading-discipline)
- [D.4 The offline / System pairing](#d4-the-offline--system-pairing)
- [D.5 CJK — cross-reference to `design-tokens` DT-25](#d5-cjk--cross-reference-to-design-tokens-dt-25)
- [Tokens consumed](#tokens-consumed)

Five curated, named font pairings, the correct Google Fonts loading
discipline, and an offline / system-font fallback set so a scaffolded
page works with no network. Implements TY-03.

## D.1 DT-09 banned-font reconciliation

The `design-tokens` skill's anti-AI-slop gate (DT-09) bans **Inter,
Roboto, Open Sans, Lato, Nunito** as *primary* fonts. The catalog's
original pairing #2 was "Space Grotesk + Inter" and the runtime's
`DEFAULT_DESIGNMD` ships `font-body: "Inter, system-ui, sans-serif"`.

**Resolution adopted by this skill:**

- **Inter is dropped from the pairing list entirely.** Pairing #2's body
  face is **IBM Plex Sans** — a clean, freely-available technical sans,
  a strict upgrade over Inter for the anti-slop gate.
- The runtime's `DEFAULT_DESIGNMD` `font-body: "Inter, …"` is itself a
  DT-09 violation, but changing it is the `design-tokens` skill's / the
  engine's call — a **cross-skill follow-up**, NOT this skill's build
  work. Do not edit `amvcp-runtime.js`.
- **Net rule: the typography skill never recommends a banned font as a
  primary face.** All five pairings are banned-font-free.

## D.2 The five pairings

| # | Heading | Body | Character |
|---|---|---|---|
| 1 | Playfair Display | Source Sans 3 | editorial |
| 2 | Space Grotesk | IBM Plex Sans | tech |
| 3 | Fraunces | DM Sans | warm modern |
| 4 | IBM Plex Serif | IBM Plex Sans | structured |
| 5 | Libre Baskerville | Libre Franklin | newspaper |

Each pairing uses `font-mono: "JetBrains Mono, ui-monospace, monospace"`
(matches the engine default).

## D.3 Loading discipline

Put in the page `<head>`, **before** any stylesheet:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
```

- **`display=swap` is mandatory** — FOUT over FOIT: text shows in the
  fallback face immediately and swaps when the web font arrives, so the
  page never renders blank text.
- **`preconnect`** to both `fonts.googleapis.com` (the CSS) and
  `fonts.gstatic.com` (the font binaries) — the second `crossorigin`.
- For a *display* font used only in one big headline, use the `&text=`
  subset trick (`…&family=Playfair+Display&text=ProjectTitle`) so only
  the needed glyphs download.

Then write the pairing into the DESIGN.md frontmatter:

```yaml
typography:
  font-heading: "Space Grotesk, Georgia, serif"
  font-body:    "IBM Plex Sans, system-ui, sans-serif"
  font-mono:    "JetBrains Mono, ui-monospace, monospace"
```

**Every `font-*` value MUST end in a system fallback** (`system-ui`,
`Georgia`, `ui-monospace`) — that IS the offline fallback (D.4).

## D.4 The offline / System pairing

A 6th "pairing" — **System** — zero network, zero CDN:

```yaml
typography:
  font-heading: "ui-serif, Georgia, 'Times New Roman', serif"
  font-body:    "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
  font-mono:    "ui-monospace, 'JetBrains Mono', Menlo, monospace"
```

> `Roboto` appears here only as a **deep fallback** inside a stack headed
> by `system-ui` — it is never the *primary* face, so this does not trip
> the DT-09 banned-*primary*-font rule. Stated explicitly so a future
> audit does not flag it.

If the page must work offline, pick the System pairing **or** ensure
every Google-Font stack has a real system fallback after the comma.
Because `display=swap` + a system fallback is always present, **a page
never renders blank text even if the CDN is unreachable** — fail-soft by
construction.

## D.5 CJK — cross-reference to `design-tokens` DT-25

CJK typography (TY-05) is **NOT built by this skill**. It is a
cross-cutting token concern owned by the `design-tokens` skill's DT-25
entry, which defines the CJK token home (`--cjk-leading` /
`--cjk-tracking`).

For CJK content the agent should:

- pick a CJK font stack as the DESIGN.md `font-body` —
  `"Hiragino Sans", "Noto Sans CJK JP", "Source Han Sans", system-ui`;
- set `--vc-line-height` to ~**1.8** (CJK body runs looser than Latin);
- apply `letter-spacing: 0.05em` to CJK body text.

The typography skill ships **no** CJK-specific token or CSS — DT-25 owns
that. **Note for the `design-tokens` build agent:** TY-05's typographic
values — 1.8 leading, 0.05em tracking, the `"Hiragino Sans", …` font
stack — are the values DT-25 should encode.

## Tokens consumed

`--vc-font-heading/body/mono` (engine) — this sub-technique only chooses
their *values*; it adds no new token.
