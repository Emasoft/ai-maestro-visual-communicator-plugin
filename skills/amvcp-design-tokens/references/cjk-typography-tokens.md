# CJK design tokens (DT-25)

A Claude-orange-accent palette + a CJK-aware font stack + loosened
typography defaults (`line-height: 1.8`, `letter-spacing: 0.05em`)
for Chinese / Japanese / Korean body text. The "amvcp speaks CJK"
preset — handles the typographic differences that Latin-only presets
get visibly wrong.

## What it is

`amvcpTokens.PRESETS['cjk-claude']`. Distinguishing features:

| Token | Light | Dark |
|---|---|---|
| `accent` | `#ff6600` Claude orange | `#ff8533` brightened Claude orange |
| `canvas` | `#faf7f3` warm-tinted cream | `#15110d` warm-tinted near-black |

Typography (the CJK-specific part):

- `font-heading`: `Source Han Serif, Songti SC, serif` — CJK serif
  (Source Han Serif covers JP/CN/KR; Songti SC is the macOS Chinese
  fallback; `serif` is the universal fallback)
- `font-body`: `Source Han Sans, PingFang SC, sans-serif` — CJK sans
  (PingFang SC is macOS's high-quality Chinese sans)
- `font-mono`: `Source Han Mono, JetBrains Mono, monospace`

The preset itself doesn't set `line-height` or `letter-spacing` — those
go on the consumer's `lang`-attribute selectors:

```css
[lang="ja"], [lang="zh"], [lang="zh-CN"], [lang="zh-TW"],
[lang="ko"], [lang="zh-Hans"], [lang="zh-Hant"] {
  line-height: 1.8;     /* CJK body needs more leading than Latin */
  letter-spacing: 0.05em;
}
```

## When to pick

- when the artifact is PRIMARILY CJK content;
- when the artifact MIXES CJK and Latin and needs the right defaults
  for both (the font stack falls back to system Latin if the CJK font
  is missing for that locale);
- when the user explicitly says "Japanese" / "Chinese" / "Korean" /
  "CJK" / "Asian language" requirements.

DON'T pick for:

- pure Latin content (use Heritage or another non-CJK preset);
- artifacts where the Claude-orange accent would clash with the
  intended brand (re-tint accent via a personality delta);
- contexts where Source Han fonts aren't available — the fallback
  chain (Songti SC, PingFang SC) only works on macOS; on Windows /
  Linux, system CJK fonts will kick in, which may look different.

## Scaffold to emit

```html
<script type="text/design-md">
<!-- This is amvcpTokens.PRESETS['cjk-claude'] verbatim. -->
</script>

<style>
  [lang="ja"], [lang="zh"], [lang="zh-CN"], [lang="zh-TW"],
  [lang="ko"], [lang="zh-Hans"], [lang="zh-Hant"] {
    line-height: 1.8;
    letter-spacing: 0.05em;
  }
</style>

<article lang="ja">
  <h1>記事のタイトル</h1>
  <p>日本語の本文がここに入ります。</p>
</article>
```

The `lang` attribute is what activates the CJK typography rules — set
it on the artifact's root element (or per-section if the artifact is
mixed-language).

## Lib functions used

- `amvcpTokens.PRESETS['cjk-claude']` → complete DESIGN.md text
- (no specific JS — the CJK-aware typography is a CSS selector pattern
  the agent emits per artifact)

## DESIGN.md tokens used

- writes (via the preset's text): all 15 colors × 2 themes,
  typography (CJK font stacks), spacing, radius, elevation, motion,
  z-index, code
- NOT shipped in the preset itself: the `lang` selector typography
  overrides — those are emitted per-artifact

## Anti-slop interaction

The orange accent (`#ff6600`) is far from the banned indigo region
— passes the lint trivially. The CJK font stack's primary families
(`Source Han Serif`, `Source Han Sans`) are NOT in `BANNED_FONTS`
(which is the Latin-only Inter/Roboto/Open Sans/Lato/Nunito list) —
the gate's reconciliation rule applies only to Latin display fonts,
and Source Han is the CJK-specific equivalent of a high-quality
display family.

## Selection / comment / decision-mini contract

Selection on cjk-claude is a 20% Claude-orange mix — warm and
deliberate. Selecting across CJK text where the line-height is 1.8
still reads correctly (the selection mark wraps to the leading-
adjusted line boxes).

Comment threads work normally; the thread's prose inherits the
`lang` attribute's typography overrides if the thread is itself
inside a `lang="ja"` ancestor.

## Visual verification

Per `skills/amvcp-self-debug-rules/SKILL.md` — open a CJK sample
under `dev-browser`. Screenshot in **both themes** (R1) and verify:

1. CJK characters render in the right font family — `getComputedStyle(
   p).fontFamily` includes `Source Han Sans` / `PingFang SC` (or a
   system CJK fallback) BEFORE any Latin family;
2. line-height on CJK paragraphs is 1.8 (significantly more than
   the engine's default 1.55);
3. mixed-language paragraphs (Latin + CJK in the same `<p>`) read
   correctly — CSS doesn't allow font-stacks per language within
   one paragraph, so the font-family list determines which glyph
   set covers which char (CJK fonts cover Latin too at acceptable
   quality);
4. accent reads as Claude orange in both themes.
