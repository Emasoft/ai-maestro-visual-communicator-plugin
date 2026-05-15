# Anti-AI-slop token gate

ONE consolidated lint that runs over (a) a generated / authored token
set AND (b) emitted HTML, flagging banned colors, banned primary fonts,
and banned visual patterns. It protects every artifact the plugin emits.

## API

```
amvcpTokens.lintTokenSet(designmdOrTokenMap) -> { ok, violations:[{kind,token,value,reason}] }
amvcpTokens.lintHtml(htmlString)             -> { ok, violations:[…] }
amvcpTokens.lintLiveDocument(rootEl)         -> { ok, violations:[…] }
```

`lintTokenSet` accepts a parsed designmd, a flat `{ '--vc-*': value }`
map, or a raw DESIGN.md text string. For a parsed designmd it resolves
BOTH themes and lints them merged — so a slop color hiding only in the
dark theme is still caught.

`lintLiveDocument` is the in-browser variant: it walks
`rootEl.querySelectorAll('*')`, reads `getComputedStyle`, and stamps
`data-vc-slop-alert="<reason>"` on each offender (the
`amvcp-tokens.css` `[data-vc-slop-alert]` rule gives them a dashed
outline so a reviewer sees them without the page restyling).

## Banned colors

Exposed as `amvcpTokens.BANNED_COLORS`.

1. **Near-match set** — the purple/violet/indigo AI family plus a bright
   blue: `#8B5CF6 #A855F7 #6366F1 #7C3AED #9333EA #C4B5FD #3B82F6`. The
   check is **near-match, not exact**: the candidate and each banned hex
   are converted to OKLab and the gate flags when the OKLab ΔE is below
   a small threshold (≈0.05). Near-match is what catches `#8c5cf7` — a
   one-digit-off AI purple.
2. **Exact set** — pure `#000000` and `#ffffff`, flagged **exact only**.
   An off-black `#0a0a0a` or an off-white `#faf6ee` is *correct*; only
   the literal pure values are slop. Real surfaces and on-accent text
   should use a near-white like `#fefefe`, not pure white.

## Banned primary fonts

Exposed as `amvcpTokens.BANNED_FONTS`:
`Inter, Roboto, Open Sans, Lato, Nunito`.

**Reconciliation rule — first family only.** These are flagged ONLY as
the *primary* (first) family of a `--vc-font-heading` / `--vc-font-body`
stack. As a fallback later in a stack they are fine — `"Georgia, Inter,
serif"` passes, `"Inter, system-ui"` is flagged. This is the gate's
resolution of the DT-09 ↔ typography conflict: the gate owns the rule.

## Banned patterns

Exposed as `amvcpTokens.BANNED_PATTERNS`. The HTML / CSS scanners flag:

- `linear-gradient(…)` used as a page / section background — an AI-slop
  visual; a `linear-gradient(135deg, …)` purple→blue pair specifically.
- glassmorphism — `backdrop-filter: blur()` layered on a background.
- "gradient text" — `background-clip:text` on a heading.
- `lintLiveDocument` additionally counts distinct text colors in use and
  flags an over-large count — a coherent palette uses few accents.

## Output discipline — fail-fast, report-only

- The gate **reports**; it never silently rewrites. The agent fixes the
  source.
- A non-`ok` result on a generated preset is a HARD ERROR — a preset
  library that ships slop must not ship. The build's
  `every_preset_passes_gate` test enforces this in CI.
- `lintHtml` on a finished report surfaces violations to the agent; the
  agent removes the raw hex / gradient before delivering.

## Where it runs

- **Build time** — over every `PRESETS` blob and the contact sheet's own
  HTML (CI test).
- **Author time** — the SKILL.md recipe instructs the agent to run
  `lintHtml` on the final emitted HTML before delivery.
- **Downstream** — `report-doc`'s QA-pipeline calls `lintHtml` and
  references `BANNED_COLORS` / `BANNED_FONTS` / `BANNED_PATTERNS` as data
  without re-deriving them. design-tokens *owns* the lists; other
  techniques *invoke* the gate.
