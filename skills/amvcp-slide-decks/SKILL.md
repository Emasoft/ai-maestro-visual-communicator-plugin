---
name: amvcp-slide-decks
description: "Author magazine-quality slide decks as self-contained interactive HTML — opt-in 100dvh viewport, no scroll, larger typography, 10 slide types (cover/section/text/two-column/full-image/data/code/quote/timeline/end), cinematic transitions, curated presets (Midnight Editorial, Warm Signal, Terminal Mono, Swiss Clean). Use when the user asks for a presentation, slide deck, talk slides, conference talk, pitch deck, or attaches a plan and asks to turn it into slides. Trigger: 'slide deck', 'presentation', 'talk slides', 'pitch deck', 'turn this into slides', '/amvcp-generate-slides', '--slides' flag."
license: MIT
compatibility: "Browser + Python 3.12+ via amvcp-select.py. SlideEngine JS (vendored in scripts/amvcp-runtime.js). Optional surf CLI for AI-generated illustrations per slide."
metadata:
  author: Emasoft
---

# Slide Decks

Magazine-quality presentations as a single interactive HTML file.

## When this skill loads

**Opt-in only.** Activate on explicit request: `/amvcp-generate-slides`, `--slides` on an existing prompt (`/amvcp-diff-review --slides`, `/amvcp-plan-review --slides`, `/amvcp-project-recap --slides`), or natural language ("slide deck", "presentation", "talk slides", "pitch deck", "turn this into slides"). **Never auto-select** — pages stay scrollable by default; slides are a deliberate medium switch.

## Content density philosophy

Changing the medium does **not** mean dropping content. A 22-slide deck that covers everything beats a 13-slide deck that drops 40% of the source. Inventory the source, then map every section, decision, data point, row, spec, and collapsible to a slide. If a plan has 7 sections and 6 decisions, all 13 are represented — not the subset that fits a "nice" 10-slide arc. Add slides rather than cut. Test: a reader who has never seen the source reconstructs every major point from the slides alone.

## How to author

1. Read `./references/slide-deck-mode.md` (when to switch, completeness) and `./references/slide-patterns.md` (engine, 10 types, transitions, nav chrome, presets, density limits, breakpoints).
2. Inventory the source — every section, card, row, decision, spec, collapsible. Map each to one or more slides before writing HTML.
3. Pick a preset and commit (one per deck).
4. Author from `templates/slide-deck.html`. Vary spatial composition (centered, left-heavy, right-heavy, split, edge-aligned, full-bleed) across consecutive slides. Each slide fits exactly `100dvh`; overflow paginates.
5. Open with `python3 "$CLAUDE_PLUGIN_ROOT/scripts/amvcp-select.py" <deck>.html`. Decks are interactive — clicking any element returns its label.

## Curated presets

Pick ONE per deck. Mixing breaks the feel. Full CSS in `./references/slide-patterns.md`.

| Preset | When to use |
|--------|-------------|
| **Midnight Editorial** | Premium / refined — dark navy + warm gold, serif. Investor decks, keynotes. |
| **Warm Signal** | Workshops, internal talks — terracotta + sage on cream, paper/ink. |
| **Terminal Mono** | Technical deep-dives, retro / dev-native — green/amber on near-black, mono. |
| **Swiss Clean** | Design / architecture / data — high-contrast B/W, geometric sans, asymmetric grids. |

## Mandatory wiring

Start from `templates/slide-deck.html`. Every `<section class="slide">` carries `data-ve-id`, `data-ve-type="slide"`, `data-ve-label`. Inner `[data-ve-id]` (Mermaid nodes, KPI cards, rows) take precedence — clicking them returns the inner element. Add `<script src="amvcp-runtime.js"></script>` at end of `<body>`. Set `--ve-accent` on `:root`. On `DOMContentLoaded` (after Mermaid/Chart.js render): `autoFit()` then `new SlideEngine()`.

## Resources

- `./references/slide-deck-mode.md` — when to switch, completeness, `--slides` flag.
- `./references/slide-patterns.md` — engine, 10 types, transitions, nav chrome, SlideEngine JS, auto-fit, decorative SVG, imagery, density limits, breakpoints, preset CSS.
- `${CLAUDE_PLUGIN_ROOT}/references/interactive-selection-base.md` — selection wire format.
- `${CLAUDE_PLUGIN_ROOT}/references/styling-guide.md` — palette + typography.
- `${CLAUDE_PLUGIN_ROOT}/references/css-patterns.md` — Mermaid, overflow protection.
- `${CLAUDE_PLUGIN_ROOT}/references/libraries.md` — Mermaid theming, Chart.js, anime.js.
- `${CLAUDE_PLUGIN_ROOT}/references/anti-patterns.md` — slop test.

## Anti-patterns

- **13-slide deck that drops 40% of the source.** Completeness is the rule. Add slides, don't cut sections.
- **Mixing 3+ presets.** Pick ONE — switching mid-deck reads as indecision.
- **`vh` not `dvh`.** Mobile address bars resize the viewport — always `100dvh`.
- **Cinematic transitions on every slide.** Earn it — 1–2 emphasis slides max. The default fade-in is enough; reserve anime.js for the title and the moment that needs it.
