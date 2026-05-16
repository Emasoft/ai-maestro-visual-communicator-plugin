# Tailwind-shaped utility classes (DT-20 + DM-15)

One `.vc-*` utility class per `--vc-*` token, namespaced `vc-` so they
never collide with a host page's real Tailwind. LLM-emitted HTML can
use the familiar shapes (`.vc-bg-canvas`, `.vc-text-muted`,
`.vc-rounded-md`, `.vc-shadow-2`, `.vc-p-3`) and stay 100% token-driven
(zero raw hexes, zero raw pixels).

## What it does

`amvcp-tokens.css` (in `ve-component`) ships utility classes for
every common token. The Tailwind shape is intentional — LLMs have
seen millions of Tailwind class strings in training, so HTML they
emit reads more naturally with `.vc-bg-canvas vc-text vc-p-3` than
with `<div style="background: var(--vc-color-canvas); …">`.

The full shipped surface:

```css
/* Background colors */
.vc-bg-canvas, .vc-bg-surface, .vc-bg-surface-raised, .vc-bg-surface-sunken,
.vc-bg-accent, .vc-bg-success, .vc-bg-warning, .vc-bg-danger, .vc-bg-info

/* Text colors */
.vc-text, .vc-text-muted, .vc-text-subtle, .vc-text-accent,
.vc-text-on-accent, .vc-text-success, .vc-text-warning,
.vc-text-danger, .vc-text-info

/* Borders */
.vc-border, .vc-border-strong

/* Radius */
.vc-rounded-none, .vc-rounded-sm, .vc-rounded-md, .vc-rounded-lg,
.vc-rounded-xl, .vc-rounded-full

/* Elevation */
.vc-shadow-0, .vc-shadow-1, .vc-shadow-2, .vc-shadow-3, .vc-shadow-4,
.vc-shadow-border

/* Typography */
.vc-font-heading, .vc-font-body, .vc-font-mono
.vc-text-0 … .vc-text-6
.vc-weight-regular, .vc-weight-medium, .vc-weight-bold

/* Padding (the spacing scale) */
.vc-p-0 … .vc-p-7

/* Gap (the spacing scale) */
.vc-gap-1 … .vc-gap-4
```

NB the `.vc-bg-success` / `.vc-bg-warning` / `.vc-bg-danger` /
`.vc-bg-info` classes use the DERIVED `--vc-state-{role}-bg` (a 12%
mix against `--vc-color-surface`), not the raw role color — so a
`<div class="vc-bg-success">` is a pale-green chip in light and a
dark-green chip in dark, automatically.

## When to use

- in EVERY emitted artifact — these are the canonical building
  blocks;
- as the substrate for `class` attributes the agent emits — let the
  utilities do the work, write per-page CSS only for layout and
  one-off cases;
- as the OUTPUT format when consuming a host-page's tokens.json (the
  utilities are a stable, documented shape the host can rely on).

## When NOT to use

- when the artifact is being EMBEDDED in a page that uses real
  Tailwind: BOTH systems coexist (the `vc-` prefix prevents
  collision), so the utility classes are still safe — the warning
  is just about ATTRIBUTE CHURN (a host that already has `bg-white`
  doesn't need `vc-bg-canvas` added).

## Scaffold to emit

```html
<article class="vc-bg-surface vc-text vc-p-4 vc-rounded-lg vc-shadow-2">
  <h2 class="vc-text vc-font-heading vc-text-4 vc-weight-bold">Build status</h2>
  <p class="vc-text-muted vc-text-2">Last deployed 18 minutes ago.</p>
  <button class="vc-state vc-bg-accent vc-text-on-accent vc-p-2 vc-rounded-md">
    Deploy now
  </button>
</article>
```

## Lib functions used

- (no JS) — the utilities are pure CSS, defined in `amvcp-tokens.css`
- the engine's `applyTokens` mints the `--vc-*` values the utilities
  read

## DESIGN.md tokens used

- ALL — every utility reads one `--vc-*` token; collectively they
  cover every common token group

## Anti-slop interaction

The utilities are the structural fix for a class of slop: hand-coded
`style="background: #fff; color: #333; padding: 16px; border-radius: 8px;
box-shadow: 0 2px 4px rgba(0,0,0,0.1);"` blocks that every AI
artifact ships. Re-write as `vc-bg-surface vc-text vc-p-3 vc-rounded-md
vc-shadow-2` and the artifact is 100% token-driven — `lintHtml`
catches the original because every literal hex / px is a banned
value when one of these utilities exists.

## Tailwind v4 `@theme` export shape (DM-15)

Tailwind v4 reads CSS `@theme` declarations as token definitions. To
expose AMVCP tokens to a host page that uses Tailwind v4 (so the
host's `bg-canvas` Tailwind class becomes equivalent to AMVCP's
`vc-bg-canvas`), the agent emits:

```css
@theme {
  --color-canvas:         var(--vc-color-canvas);
  --color-surface:        var(--vc-color-surface);
  --color-accent:         var(--vc-color-accent);
  /* … etc … */
  --font-heading:         var(--vc-font-heading);
  --font-body:            var(--vc-font-body);
  --spacing-1:            var(--vc-space-0);
  --spacing-2:            var(--vc-space-1);
  /* etc */
}
```

Now Tailwind generates `.bg-canvas`, `.text-accent`, `.font-heading`,
`.p-2` utility classes that themselves resolve to AMVCP tokens. ONE
source of truth, host-agnostic.

## Selection / comment / decision-mini contract

The utilities don't change selection / comment behaviour — they're
just shortcuts for property assignment. A utility-class element
inside a comment thread carries the same `--vc-selection-bg` overlay
as a bare-styled element.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — render a sample
article using only `.vc-*` utility classes under `dev-browser`.
Screenshot in **both themes** (R1) and verify the article re-themes
correctly when the page DESIGN.md is hot-swapped. Audit the emitted
HTML's `style="…"` attributes — for a fully utility-driven artifact
there should be ZERO inline `background:` / `color:` /
`border-radius:` etc. declarations (only `width:` / `height:` /
positioning, if any).
