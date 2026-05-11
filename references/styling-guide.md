# Styling Guide

## Table of contents

- [Aesthetic directions](#aesthetic-directions)
- [Typography & Color](#typography--color)
- [Surfaces, Hierarchy & Animation](#surfaces-hierarchy--animation)
- [Engines & Illustrations](#engines--illustrations)

Apply these principles to every diagram. They sit on top of the patterns documented in [css-patterns](./css-patterns.md) and [libraries](./libraries.md).

## Aesthetic directions

Pick one direction and commit. The constrained aesthetics (Blueprint, Editorial, Paper/ink) are safer — they have specific requirements that prevent generic output. The flexible ones (IDE-inspired) require more discipline.

**Constrained aesthetics (prefer these):**
- Blueprint (technical drawing feel, subtle grid background, deep slate/blue palette, monospace labels, precise borders) — see `websocket-implementation-plan.html` for reference
- Editorial (serif headlines like Instrument Serif or Crimson Pro, generous whitespace, muted earth tones or deep navy + gold)
- Paper/ink (warm cream `#faf7f5` background, terracotta/sage accents, informal feel)
- Monochrome terminal (green/amber on near-black, monospace everything, CRT glow optional)

**Flexible aesthetics (use with caution):**
- IDE-inspired (borrow a real, named color scheme: Dracula, Nord, Catppuccin Mocha/Latte, Solarized Dark/Light, Gruvbox, One Dark, Rosé Pine) — commit to the actual palette, don't approximate
- Data-dense (small type, tight spacing, maximum information, muted colors)

**Explicitly forbidden:**
- Neon dashboard (cyan + magenta + purple on dark) — always produces AI slop
- Gradient mesh (pink/purple/cyan blobs) — too generic
- Any combination of Inter font + violet/indigo accents + gradient text

Vary the choice each time. If the last diagram was dark and technical, make the next one light and editorial. The swap test: if you replaced your styling with a generic dark theme and nobody would notice the difference, you haven't designed anything.

## Typography & Color

### Typography

**Typography is the diagram.** Pick a distinctive font pairing from the list in [libraries](./libraries.md). Every page should use a different pairing from recent generations.

**Forbidden as `--font-body`:** Inter, Roboto, Arial, Helvetica, system-ui alone. These are AI slop signals.

**Good pairings (use these):**
- DM Sans + Fira Code (technical, precise)
- Instrument Serif + JetBrains Mono (editorial, refined)
- IBM Plex Sans + IBM Plex Mono (reliable, readable)
- Bricolage Grotesque + Fragment Mono (bold, characterful)
- Plus Jakarta Sans + Azeret Mono (rounded, approachable)

Load via `<link>` in `<head>`. Include a system font fallback in the `font-family` stack for offline resilience.

### Color and palette

**Color tells a story.** Use CSS custom properties for the full palette. Define at minimum: `--bg`, `--surface`, `--border`, `--text`, `--text-dim`, and 3-5 accent colors. Each accent should have a full and a dim variant (for backgrounds). Name variables semantically when possible (`--pipeline-step` not `--blue-3`). Support both themes.

**Forbidden accent colors:** `#8b5cf6` `#7c3aed` `#a78bfa` (indigo/violet), `#d946ef` (fuchsia), the cyan-magenta-pink combination. These are Tailwind defaults that signal zero design intent.

**Good accent palettes (use these):**
- Terracotta + sage (`#c2410c`, `#65a30d`) — warm, earthy
- Teal + slate (`#0891b2`, `#0369a1`) — technical, precise
- Rose + cranberry (`#be123c`, `#881337`) — editorial, refined
- Amber + emerald (`#d97706`, `#059669`) — data-focused
- Deep blue + gold (`#1e3a5f`, `#d4a73a`) — premium, sophisticated

Put your primary aesthetic in `:root` and the alternate in the media query:

```css
/* Light-first (editorial, paper/ink, blueprint): */
:root { /* light values */ }
@media (prefers-color-scheme: dark) { :root { /* dark values */ } }

/* Dark-first (neon, IDE-inspired, terminal): */
:root { /* dark values */ }
@media (prefers-color-scheme: light) { :root { /* light values */ } }
```

## Surfaces, Hierarchy & Animation

### Surfaces and depth

**Surfaces whisper, they don't shout.** Build depth through subtle lightness shifts (2-4% between levels), not dramatic color changes. Borders should be low-opacity rgba (`rgba(255,255,255,0.08)` in dark mode, `rgba(0,0,0,0.08)` in light) — visible when you look, invisible when you don't.

**Surface depth creates hierarchy.** Vary card depth to signal what matters. Hero sections get elevated shadows and accent-tinted backgrounds (`ve-card--hero` pattern). Body content stays flat (default `.ve-card`). Code blocks and secondary content feel recessed (`ve-card--recessed`). See the depth tiers in [css-patterns](./css-patterns.md). Don't make everything elevated — when everything pops, nothing does.

### Background atmosphere

**Backgrounds create atmosphere.** Don't use flat solid colors for the page background. Subtle gradients, faint grid patterns via CSS, or gentle radial glows behind focal areas. The background should feel like a space, not a void.

### Visual weight and hierarchy

**Visual weight signals importance.** Not every section deserves equal visual treatment. Executive summaries and key metrics should dominate the viewport on load (larger type, more padding, subtle accent-tinted background zone). Reference sections (file maps, dependency lists, decision logs) should be compact and stay out of the way. Use `<details>/<summary>` for sections that are useful but not primary — the collapsible pattern is in [css-patterns](./css-patterns.md).

### Animation rules

**Animation earns its place.** Staggered fade-ins on page load are almost always worth it — they guide the eye through the diagram's hierarchy. Mix animation types by role: `fadeUp` for cards, `fadeScale` for KPIs and badges, `drawIn` for SVG connectors, `countUp` for hero numbers. Hover transitions on interactive-feeling elements make the diagram feel alive. Always respect `prefers-reduced-motion`. CSS transitions and keyframes handle most cases. For orchestrated multi-element sequences, anime.js via CDN is available (see [libraries](./libraries.md)).

**Forbidden animations:**
- Animated glowing box-shadows (`@keyframes glow { box-shadow: 0 0 20px... }`) — this is AI slop
- Pulsing/breathing effects on static content
- Continuous animations that run after page load (except for progress indicators)

Keep animations purposeful: entrance reveals, hover feedback, and user-initiated interactions. Nothing should glow or pulse on its own.

## Engines & Illustrations

### Mermaid theming and containers

**Mermaid theming:** Always use `theme: 'base'` with custom `themeVariables` so colors match your page palette. Use `layout: 'elk'` for complex graphs (requires the `@mermaid-js/layout-elk` package — see [libraries](./libraries.md) for the CDN import). Override Mermaid's SVG classes with CSS for pixel-perfect control.

**Mermaid containers:** Always center Mermaid diagrams with `display: flex; justify-content: center;`. Add zoom controls (+/−/reset/expand) to every `.mermaid-wrap` container. Include the click-to-expand JavaScript so clicking the diagram (or the ⛶ button) opens it full-size in a new tab.

**Never use bare `<pre class="mermaid">`.** It renders but has no zoom/pan controls — diagrams become tiny and unusable. Always use the full `diagram-shell` pattern from `templates/mermaid-flowchart.html`: the HTML structure (`.diagram-shell` > `.mermaid-wrap` > `.zoom-controls` + `.mermaid-viewport` > `.mermaid-canvas`), the CSS, and the ~200-line JS module for zoom/pan/fit. Copy it wholesale.

**Mermaid scaling:** Diagrams with 10+ nodes render too small by default. For 10-12 nodes, increase `fontSize` in themeVariables to 18-20px and set `INITIAL_ZOOM` to 1.5-1.6. For 15+ elements, don't try to scale — use the hybrid pattern instead (simple Mermaid overview + CSS Grid cards). See [diagram-types](./diagram-types.md) "Architecture / System Diagrams".

**Mermaid layout direction:** Prefer `flowchart TD` (top-down) over `flowchart LR` (left-to-right) for complex diagrams. LR spreads horizontally and makes labels unreadable when there are many nodes. Use LR only for simple 3-4 node linear flows. See [libraries](./libraries.md) "Layout Direction: TD vs LR".

**Mermaid line breaks in flowchart labels:** Use `<br/>` inside quoted labels. Never use escaped newlines like `\n` (Mermaid renders them as literal text in HTML output). Example: `A["Copilot Backend<br/>/api + /api/voicebot"]`.

**Mermaid CSS class collision constraint:** Never define `.node` as a page-level CSS class. Mermaid.js uses `.node` internally on SVG `<g>` elements with `transform: translate(x, y)` for positioning. Page-level `.node` styles (hover transforms, box-shadows) leak into diagrams and break layout. Use the namespaced `.ve-card` class for card components instead. The only safe way to style Mermaid's `.node` is scoped under `.mermaid` (e.g., `.mermaid .node rect`).

### AI-generated illustrations (optional)

If a `surf` CLI tool is available, you can generate images via Gemini and embed them in the page for creative, illustrative, explanatory, educational, or decorative purposes. Check availability with `which surf`. If available:

```bash
# Generate to a temp file (use --aspect-ratio for control)
surf gemini "descriptive prompt" --generate-image /tmp/ve-img.png --aspect-ratio 16:9

# Base64 encode for self-containment (macOS)
IMG=$(base64 -i /tmp/ve-img.png)
# Linux: IMG=$(base64 -w 0 /tmp/ve-img.png)

# Embed in HTML and clean up
# <img src="data:image/png;base64,${IMG}" alt="descriptive alt text">
rm /tmp/ve-img.png
```

See [css-patterns](./css-patterns.md) for image container styles (hero banners, inline illustrations, captions).

**When to use:** Hero banners that establish the page's visual tone. Conceptual illustrations for abstract systems that Mermaid can't express (physical infrastructure, user journeys, mental models). Educational diagrams that benefit from artistic or photorealistic rendering. Decorative accents that reinforce the aesthetic.

**When to skip:** Anything Mermaid or CSS handles well. Generic decoration that doesn't convey meaning. Data-heavy pages where images would distract. Always degrade gracefully — if surf isn't available, skip images without erroring. The page should stand on its own with CSS and typography alone.

**Prompt craft:** Match the image to the page's palette and aesthetic direction. Specify the style (3D render, technical illustration, watercolor, isometric, flat vector, etc.) and mention dominant colors from your CSS variables. Use `--aspect-ratio 16:9` for hero banners, `--aspect-ratio 1:1` for inline illustrations. Keep prompts specific — "isometric illustration of a message queue with cyan nodes on dark navy background" beats "a diagram of a queue."
