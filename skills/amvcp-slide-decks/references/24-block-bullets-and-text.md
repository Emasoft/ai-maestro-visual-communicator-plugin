# 24 — Blocks: `bullets` + `text` (the body family)

## Table of Contents

- [What this is](#what-this-is)
- [Density limits](#density-limits)
- [Scaffold to emit](#scaffold-to-emit)
- [Lib functions called](#lib-functions-called)
- [DESIGN.md tokens used](#designmd-tokens-used)
- [Selection / comment / decision-mini contract notes](#selection--comment--decision-mini-contract-notes)
- [When to use this reference](#when-to-use-this-reference)
- [Bullets vs text](#bullets-vs-text)
- [Don'ts](#donts)
- [Visual verification](#visual-verification)
- [Source provenance](#source-provenance)

`bullets` is the bulleted-list block; `text` is the paragraph block.
Together they form the body of any `content` or `two-column` slide.

`bullets` items can be plain strings OR `{text, sub}` objects (a
title + sub-line). The renderer accepts both shapes per item — you
can mix.

## What this is

### `bullets` block

```jsonc
{ "type": "bullets",
  "items": [
    "Per-key TTL replaced per-region TTL.",
    "Cache warmup runs at deploy time.",
    { "text": "Eviction now prefers stale-while-revalidate.",
      "sub": "Serve stale, refetch in background." }
  ]
}
```

Required: `items` (non-empty array of strings or `{text, sub}` objects).

Renders as: `<ul class="vsd-bullets">` with one `<li class="vsd-
bullet">` per item. `{text, sub}` items render as the bullet text +
a `<span class="vsd-bullet-sub">` for the sub-line.

Styling:
- Body typeface (`--vc-font-body`).
- Body tier size (`--vc-text-3 = 40 px`) for bullet text.
- Sub-tier size (`--vc-text-2 = 28 px`) for sub-text.
- Default content colour (`--vc-color-content`).
- Muted colour (`--vc-color-content-muted`) for sub.
- Inter-bullet gap `--vc-space-3 = 24 px`.
- Bullet marker: an accent-coloured dot via `::before` pseudo-
  element, sized `--vc-space-2 = 12 px`.

### `text` block

```jsonc
{ "type": "text",
  "text": "The cache rewrite landed in three steps." }
```

Required: `text` (string).

Renders as: `<p class="vsd-text">`.

Styling:
- Body typeface (`--vc-font-body`).
- Body tier size (`--vc-text-3 = 40 px`).
- Muted content colour (`--vc-color-content-muted`).
- Margin-bottom `--vc-space-3 = 24 px`.

## Density limits

The renderer enforces:
- `MAX_BULLETS = 6` bullets per slide (across ALL `bullets` blocks).
- `MAX_BODY_WORDS = 40` words per slide (across ALL `text` blocks).

Either limit fires `data-vsd-overflow="…"` on the slide + a
`densityWarnings` entry. The slide still renders (no scrollbar) — the
warning is the signal to split.

The two limits are *additive* per slide:
- A slide with 4 bullets + a 20-word text block → 4 bullets / 20
  body words → BOTH under limit. OK.
- A slide with 7 bullets + a 5-word text block → 7 bullets / 5
  body words → bullets EXCEEDS. Warning fires for bullets only.
- A slide with 3 bullets + a 50-word text block → 3 bullets / 50
  body words → text EXCEEDS. Warning fires for body words only.

## Scaffold to emit

Plain bullets (most common):

```jsonc
{ "type": "bullets",
  "items": [
    "Per-key TTL.",
    "Deploy-time warmup.",
    "Stale-while-revalidate eviction."
  ]
}
```

Bullets with sub-text:

```jsonc
{ "type": "bullets",
  "items": [
    { "text": "Per-key TTL replaced per-region TTL.",
      "sub": "Each key picks its own freshness window." },
    { "text": "Cache warmup runs at deploy time.",
      "sub": "First request hits a warm cache." },
    { "text": "Eviction prefers stale-while-revalidate.",
      "sub": "Serve stale, refetch in background." }
  ]
}
```

Mixed (string + object):

```jsonc
{ "type": "bullets",
  "items": [
    "Per-key TTL.",     // string — no sub-text
    { "text": "Stale-while-revalidate eviction.",
      "sub": "Serve stale, refetch in background." }
  ]
}
```

Text block (rare on its own — usually paired with a heading + chart):

```jsonc
{ "type": "text",
  "text": "All three rolled out behind a single feature flag, gated to 10% of traffic for the first week." }
```

## Lib functions called

- `renderBlock(doc, block, ctx)` — dispatches.
- `renderBulletItem(doc, item)` — internal; handles each item
  (string OR `{text, sub}`). Detects via `isPlainObject(item)`.
- `ctx.bulletCount` accumulates the items count across all
  `bullets` blocks on the slide; the density guard reads it.
- `ctx.bodyWords` accumulates the word count across all `text`
  blocks on the slide; the density guard reads it.

## DESIGN.md tokens used

### `bullets`

| Token | Default |
|---|---|
| `--vc-font-body` | `system-ui, sans-serif` |
| `--vc-text-3` | `40 px` (bullet text) |
| `--vc-text-2` | `28 px` (sub-text) |
| `--vc-color-content` | `#1f1a14` / `#e8eaef` |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` (sub) |
| `--vc-color-accent` | `#b8861f` / `#d4a73a` (marker) |
| `--vc-space-2` | `12 px` (marker size) |
| `--vc-space-3` | `24 px` (inter-bullet gap) |
| `--vc-space-4` | `40 px` (bullet padding-left) |
| `--vc-radius-full` | `9999 px` (marker shape) |

### `text`

| Token | Default |
|---|---|
| `--vc-font-body` | `system-ui, sans-serif` |
| `--vc-text-3` | `40 px` |
| `--vc-color-content-muted` | `#5b5343` / `#9a9484` |
| `--vc-line-height` | `1.3` |
| `--vc-space-3` | `24 px` |

## Selection / comment / decision-mini contract notes

Neither block carries its own `data-ve-id`. They're part of the
slide's selectable atom. A reviewer commenting on one bullet says
"the third bullet" in the text.

## When to use this reference

Open this ref when:

- Authoring the body of a `content` slide.
- Density warnings fire — see the "Splitting overflowing content"
  section in ref #08.
- Deciding between bullets and text — see "Bullets vs text" below.

## Bullets vs text

| Need | Pick |
|---|---|
| List of 2-6 things | `bullets` |
| One sentence of connective tissue | `text` |
| Paragraph of explanation | (split — should be 2 slides) |
| Single bold claim | (use `heading`, not `text`) |
| List of 1 thing | `text` (one-thing-as-a-list reads weird) |
| List of 7+ things | (split — should be 2 slides) |

## Don'ts

- Don't author markdown / HTML in items or text fields. The
  renderer escapes everything; markdown shows as literal
  characters.
- Don't nest more than ONE level of sub-text. The `sub` field is the
  only nesting; deeper structures fail visually at projection
  scale.
- Don't pack a bullet with a 30-word sentence. Each bullet should
  fit on ONE line at projection scale (~ 60 characters at 40 px).
- Don't omit punctuation. Bullets that don't end in periods read as
  "list of fragments"; bullets that end in periods read as "list of
  claims". Pick claims.

## Visual verification

After authoring bullets or text on a slide, capture light + dark at
1280×720 via the dev-browser path in
`skills/amvcp-self-debug-rules/SKILL.md`:

1. Each bullet has an accent-coloured dot at its left edge.
2. Inter-bullet gap matches `--vc-space-3` (24 px).
3. Sub-text (if used) is smaller + muted; appears below the bullet
   text.
4. `data-vsd-overflow` is absent (or the slide has been split).
5. No bullet text wraps to more than 2 lines at the stage scale.

## Source provenance

- The bullet dot styling is the converged pattern from five
  catalogue sources (the `width: 6-12px; height: 6-12px; border-
  radius: 50%; background: var(--accent)` pattern in
  `slide-patterns.md` lines 290-295).
- The `{text, sub}` item shape is from SL-11's typed-block schema —
  the canonical "labeled bullet with explanation" shape.
- `MAX_BULLETS = 6` and `MAX_BODY_WORDS = 40` are the renderer's
  density-guard values, themselves from slide-spec.md §10.2.
