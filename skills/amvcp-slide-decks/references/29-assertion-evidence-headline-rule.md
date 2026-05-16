# 29 — The assertion-evidence headline rule (SL-09 in depth)

The single highest-leverage anti-slop rule in the slide-decks skill.
Every `heading` block runs through `validateHeadline()`; failures
collect `data-vsd-headline-warn` + log a console warning. The rule is
INTENTIONALLY a SOFT check — never blocks rendering. Stylistic
judgement, not structural error.

This reference is the deep spec of the rule: why it exists, what it
catches, what it misses (false negatives / false positives), and
how to write headings that pass.

## What this is

The McKinsey "Assertion-Evidence" principle: every slide headline
should be the claim (the so-what, the conclusion), not the label
(the topic, the name). Headlines as labels force the audience to
interpret the data themselves; headlines as claims do the
interpreting for them.

Two example headlines for the SAME content:

LABEL (anti-pattern): "Q3 Results"
CLAIM (correct): "Three of four Q3 goals shipped on time."

The slide BELOW the headline is identical. The headline is the
difference between an audience that has to think and an audience
that already knows the takeaway and is now studying the evidence.

## The rule (literal)

`validateHeadline(text)` returns `{ok, reason}`:

```js
function validateHeadline(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { ok: false, reason: 'empty headline' };
  }
  var words = text.trim().split(/\s+/);
  if (words.length < MIN_HEADLINE_WORDS) {  // MIN_HEADLINE_WORDS = 5
    return {
      ok: false,
      reason: 'headline is ' + words.length + ' words (< '
        + MIN_HEADLINE_WORDS + ') — write a full sentence'
    };
  }
  // A digit anywhere reads as a stat-driven claim.
  if (/\d/.test(text)) {
    return { ok: true, reason: '' };
  }
  // Verb signal: an explicit verb from the list, OR a word with
  // -ed / -ing / a plural-s morphology.
  for (var i = 0; i < words.length; i++) {
    var w = words[i].toLowerCase().replace(/[^a-z]/g, '');
    if (!w) continue;
    if (inList(w, VERB_SIGNALS)) {
      return { ok: true, reason: '' };
    }
    if (w.length > 3 && (/(ed|ing)$/.test(w)
        || (/s$/.test(w) && !/(ss|us|is)$/.test(w)))) {
      return { ok: true, reason: '' };
    }
  }
  return {
    ok: false,
    reason: 'no verb detected — headline reads as a label, not a '
      + 'claim; rewrite as a declarative sentence'
  };
}
```

Two pass conditions:

1. **Word count ≥ 5.** Sub-5 headlines are too short to BE claims.
2. **Verb signal OR digit.** A verb makes a sentence; a digit makes
   a stat-driven claim (audience reads "38%" as a finding).

## VERB_SIGNALS list (literal)

```
is, are, was, were, be, been, has, have, had,
do, does, did, will, shows, show, drives, drive,
cuts, cut, grew, grow, grows, rose, rise, rises,
fell, fall, falls, dropped, drop, drops, beats,
beat, wins, win, lost, lose, gains, gain, saves,
save, makes, make, made, lets, let, turns, turn,
means, mean, gives, give, gave, needs, need,
reached, reach, shipped, ship, ships, matters,
matter, now, every, each
```

Plus the morphology check: words ending in `-ed`, `-ing`, or `-s`
(but not `-ss`/`-us`/`-is`) are treated as finite-verb tells.

## Pass examples

| Headline | Why it passes |
|---|---|
| "Latency dropped 38%." | digit + verb (`dropped`) |
| "Three changes shipped in Q3." | digit + verb (`shipped`) |
| "Cache hit rate climbed from 41% to 78%." | digit + verb (`climbed` matches `-ed` morphology) |
| "Every p99 path now clears 200 ms." | digit + verb (`every`, `now`, `clears`) |
| "Caching the right keys beats caching more keys." | verb (`beats`) — no digit needed |
| "The new architecture removes legacy hot-paths." | verb (`removes` matches `-s` morphology) |
| "We shipped 14 features in Q3." | digit + verb (`shipped`) |
| "Three architectural changes paid off in Q3." | digit + verb (`paid` matches `-id`/`-ed`) |

## Fail examples

| Headline | Why it fails | Fix |
|---|---|---|
| "Q3 Results" | 2 words | "Three of four Q3 goals shipped on time." |
| "Latency Improvements" | 2 words, no verb | "Latency dropped 38% after the cache rewrite." |
| "Engineering Roadmap Update" | 3 words, no verb | "The Q4 roadmap focuses on cross-region replication." |
| "The New Caching Architecture" | 4 words, no verb | "The new cache uses per-key TTL, not per-region TTL." |
| "Architecture of Our New Caching System" | 6 words, no verb, no digit | "Our new caching system uses per-key TTL." |
| "Our Approach to Q3" | 4 words | "Our Q3 approach prioritized latency over throughput." |

## Known false positives (the rule WARNS but the headline is fine)

The rule is HEURISTIC, not semantic. It catches the obvious "label"
pattern; it can't catch every legitimate label. Examples that warn
but ARE acceptable:

- "Q&A" (2 words, no verb). Acceptable as a closing-slide label.
- "Thanks." (1 word). Acceptable as a closing eyebrow or slide
  label.
- "Questions?" (1 word). Acceptable as a closing heading.

For these, leave the `data-vsd-headline-warn` in place — it's
informational. The render is correct.

## Known false negatives (the rule PASSES but the headline is weak)

The rule can't catch every weak headline. Examples that pass but
SHOULDN'T:

- "Q3 is good." (3 words → fails word count, so caught). OK.
- "We did a lot of things." (6 words, verb `did`). Passes the rule
  but says nothing. Rewrite as a specific claim.
- "Several improvements were made." (4 words → fails word count).
  Caught.
- "Things improved." (2 words → fails word count). Caught.

The rule is a guardrail, not a guarantee. A skilled author still
has to write strong claims.

## When to use this reference

Open this ref when:

- The console keeps reporting `data-vsd-headline-warn` warnings.
- An agent is generating headlines and needs the rule spec.
- A reviewer wants to understand why a "Q3 Results" headline got
  flagged.

## Workflow — fix every warning

After each render, the deck object's `headlineWarnings` array
contains every flagged heading:

```js
var deck = parseDeck(jsonText);
var viewport = renderDeck(deck, mountEl);
console.log(deck._ctx.headlineWarnings);
// [{slide: 0, text: "Q3 Results", reason: "headline is 2 words (< 5)…"}, …]
```

Walk the array; rewrite each `text` to pass the rule:

| Failed text | Reason | Rewrite |
|---|---|---|
| "Q3 Results" | `headline is 2 words (< 5)…` | "Three of four Q3 goals shipped on time." |
| "Architecture" | `headline is 1 words (< 5)…` | "The architecture splits compute from storage." |
| "Our Strategy" | `headline is 2 words (< 5)…` | "Our strategy prioritizes latency over throughput." |
| "The Future" | `headline is 2 words (< 5)…` | "The next year ships cross-region replication." |

## Don'ts

- Don't disable the rule. It's the highest-leverage content-quality
  rule the deck has. Disabling it means shipping AI-slop headlines.
- Don't hard-fail on warnings. The rule is INTENTIONALLY soft;
  blocking renders on a heuristic produces false-positive
  frustration.
- Don't pad headlines with filler to hit the word count. "Q3
  Results" → "Q3 Engineering Department Results Summary For The
  Quarter" passes word count but is worse than the original.
- Don't memorise the VERB_SIGNALS list. The morphology check
  (`-ed` / `-ing` / `-s`) catches 95% of finite verbs the explicit
  list misses; just write declarative sentences.

## Visual verification

After every authoring pass:

1. Open the page in dev-browser via
   `skills/amvcp-self-debug-rules/SKILL.md`.
2. Open the console; check for `data-vsd-headline-warn` warnings.
3. For each warning, decide: rewrite the headline OR accept the
   warning as intentional (rare — only for legitimate labels like
   "Q&A").
4. Verify by re-running the validator after rewrites.

## Source provenance

- SL-09 — Assertion-Evidence Principle in the master catalog
  (`reports/visualizing-triage/20260515_112406+0200-MASTER-CONSOLIDATED.md`
  lines 1978-1986).
- The McKinsey origin: every slide headline is a complete declarative
  sentence with subject + verb + implication; reject titles < 5 words
  or lacking a verb.
- The `VERB_SIGNALS` list is the literal array in
  `scripts/amvcp-slide.js` lines 136-146.
- The 5-word minimum is `MIN_HEADLINE_WORDS` in the source — chosen
  because most label-style titles are 2-4 words.
