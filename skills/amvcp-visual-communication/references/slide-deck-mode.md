# Slide Deck Mode

## Table of contents

- [When to use slide deck mode](#when-to-use-slide-deck-mode)
- [Content completeness](#content-completeness)
- [Slide types and visual richness](#slide-types-and-visual-richness)
- [Compositional variety](#compositional-variety)
- [Curated presets](#curated-presets)
- [The --slides flag on existing prompts](#the---slides-flag-on-existing-prompts)

An alternative output format for presenting content as a magazine-quality slide presentation instead of a scrollable page. **Opt-in only** — the agent generates slides when the user invokes `/amvcp-generate-slides`, passes `--slides` to an existing prompt (e.g., `/amvcp-diff-review --slides`), or explicitly asks for a slide deck. Never auto-select slide format.

## When to use slide deck mode

**Before generating slides**, read [slide-patterns](./slide-patterns.md) (engine CSS, slide types, transitions, nav chrome, presets) and `templates/slide-deck.html` (reference template showing all 10 types). Also read [css-patterns](./css-patterns.md) for shared patterns and [libraries](./libraries.md) for Mermaid/Chart.js theming.

**Slides are not pages reformatted.** They're a different medium. Each slide is exactly one viewport tall (100dvh) with no scrolling. Typography is 2–3× larger. Compositions are bolder. The agent composes a narrative arc (impact → context → deep dive → resolution) rather than mechanically paginating the source.

## Content completeness

Changing the medium does not mean dropping content. Follow the "Planning a Deck from a Source Document" process in [slide-patterns](./slide-patterns.md) before writing any HTML: inventory the source, map every item to slides, verify coverage. Every section, decision, data point, specification, and collapsible detail from the source must appear in the deck. If a plan has 7 sections, the deck covers all 7. If there are 6 decisions, present all 6 — not the 2 that fit on one slide. Collapsible details in the source become their own slides. Add more slides rather than cutting content. A 22-slide deck that covers everything beats a 13-slide deck that looks polished but is missing 40% of the source.

## Slide types and visual richness

**Slide types (10):** Title, Section Divider, Content, Split, Diagram, Dashboard, Table, Code, Quote, Full-Bleed. Each has a defined layout in [slide-patterns](./slide-patterns.md). Content that exceeds a slide's density limit splits across multiple slides — never scrolls within a slide.

**Visual richness:** Check `which surf` at the start. If a `surf` CLI is available, generate 2–4 images (title slide background, full-bleed background, optional content illustrations) before writing HTML — see the Proactive Imagery section in [slide-patterns](./slide-patterns.md) for the workflow. Also use SVG decorative accents, per-slide background gradients, inline sparklines, and small Mermaid diagrams. Visual-first, text-second.

## Compositional variety

Consecutive slides must vary spatial approach — centered, left-heavy, right-heavy, split, edge-aligned, full-bleed. Three centered slides in a row means push one off-axis.

## Curated presets

Four slide-specific presets as starting points (Midnight Editorial, Warm Signal, Terminal Mono, Swiss Clean) plus the existing 8 aesthetic directions adapted for slides. Pick one and commit. See [slide-patterns](./slide-patterns.md) for preset CSS values.

## The --slides flag on existing prompts

When a user passes `--slides` to `/amvcp-diff-review`, `/amvcp-plan-review`, `/amvcp-project-recap`, or other prompts, the agent gathers data using the prompt's normal data-gathering instructions, then presents the content as a slide deck instead of a scrollable page. The slide version tells the same story with different structure and pacing — but the same breadth of coverage. Don't use the slide format as an excuse to summarize or skip sections that the scrollable version would have included.
