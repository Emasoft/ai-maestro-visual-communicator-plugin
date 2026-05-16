# Q1 product launch postmortem — Phoenix release

This page is the canonical *compose-everything* fixture for the
ai-maestro-visual-communicator-plugin. It walks the Phoenix launch
postmortem through every visualize-skill module in dependency order,
on a single rendered HTML page, to prove that the 13 module bundles
co-exist without z-index, event, or CSS-cascade conflict.

The page reads top-to-bottom as a real engineering postmortem.
Every block has substantive content — no lorem ipsum, no synthetic
placeholders. The visual variety is the point: it is the proof that
the runtime can host the full plugin surface in one document.

## 1. Executive summary

Phoenix shipped on **January 14, 2026** — three weeks behind the
originally-committed date and seventeen days after the internal
"hard no-slip" gate. The release **completed** every functional
acceptance criterion in the launch contract, but the *path to those
criteria* taught us something durable about how the team estimates,
how the architecture absorbs change, and how the production rollout
handles surprise.

This document is the structured artefact of that lesson. The
findings are ordered by *severity to future planning*, not by
chronology. Each section reads independently and ends with a
callable next action.

The supporting visuals — KPI charts, dependency diagram, before/after
wireframe, slide capsule, comparison tables — were all generated
from the underlying instrumentation; no figures were hand-fitted to
the narrative.

## 2. The headline numbers

The Phoenix release moved three operating metrics in clearly
measurable ways. The chart below shows the magnitude of each move
against the rolling 12-week baseline; the table after it lists the
exact pre-release / post-release values with the change expressed
both absolutely and as a percentage of baseline.

```chart:bar@1
{
  "title": "Phoenix release — operating metrics deltas vs 12-week baseline",
  "series": [{ "label": "delta %", "data": [
    {"x":"p99 latency","y":-38.4},
    {"x":"queue depth","y":-52.1},
    {"x":"deploy time","y":-71.8},
    {"x":"on-call pages","y":-27.6},
    {"x":"throughput","y":18.3}
  ] }],
  "options": { "sortDescending": false, "valueLabels": true }
}
```

The trend over the four weeks following the launch tells a slightly
different story. The latency win held steady; queue depth drifted
back upward as user adoption climbed; deploy time stayed flat. The
line chart below shows the four-week weekly average for the three
infrastructure metrics, indexed to the pre-launch baseline (= 100).

```chart:line@1
{
  "title": "Post-launch four-week trajectory (baseline = 100)",
  "series": [
    { "label": "p99 latency", "data": [
      {"x":"W+1","y":62},{"x":"W+2","y":64},
      {"x":"W+3","y":61},{"x":"W+4","y":63}] },
    { "label": "queue depth", "data": [
      {"x":"W+1","y":48},{"x":"W+2","y":55},
      {"x":"W+3","y":64},{"x":"W+4","y":71}] },
    { "label": "deploy time", "data": [
      {"x":"W+1","y":28},{"x":"W+2","y":29},
      {"x":"W+3","y":28},{"x":"W+4","y":31}] }
  ]
}
```

The full headline table is below. *Direction* records whether the
movement is in the desired direction (↓ for latency / queue / deploy /
pages; ↑ for throughput).

| Metric                        | Baseline | Post-launch | Δ absolute | Δ %       | Direction |
|-------------------------------|---------:|------------:|-----------:|----------:|-----------|
| p99 request latency (ms)      |      410 |         254 |       −156 |    −38.4% | ✓         |
| Average queue depth (msgs)    |      218 |         104 |       −114 |    −52.1% | ✓         |
| Median deploy time (minutes)  |       46 |          13 |        −33 |    −71.8% | ✓         |
| On-call pages per week        |     12.3 |         8.9 |       −3.4 |    −27.6% | ✓         |
| Sustained throughput (req/s)  |   3,200  |       3,786 |        586 |    +18.3% | ✓         |

## 3. What the architecture rewrite actually changed

The cache rewrite was the single largest behavioural shift between
the pre-launch system and Phoenix. The old write path went through
five hops; the new one goes through three. The reduction is not
just hop count — every removed hop was a place where a synchronous
TCP roundtrip could stall the request behind the slowest tail.

The flow below sketches the *post-launch* hot path. The dependency
diagram beneath it is rendered by the scene-graph module, which is
the technique we lean on for any flow with more than four nodes
where the ordering matters.

```js
// Phoenix-era request path — three hops, cache-first.
async function handle(request) {
  const cacheKey = makeKey(request);
  const hit = await cache.get(cacheKey);
  if (hit && !isStale(hit)) {
    return hit.payload;
  }
  // Miss path — single DB query, then async cache backfill.
  const fresh = await db.fetchOne(request.id);
  cache.setAsync(cacheKey, fresh);  // fire-and-forget
  return fresh;
}
```

Three subtle invariants make the code above safe under load: the
cache `setAsync` is fire-and-forget (a backfill that fails simply
re-runs on the next miss); `isStale` is a pure function of the
cached entry's TTL and the wall clock; and `makeKey` is byte-
deterministic, so two callers asking for the same logical record
hit the same cache slot. Together they turn what used to be a
five-hop sequential dependency into a *worst-case* two-hop path.

### 3.1 Three patterns we want to lift to the next service

Three patterns from the Phoenix rewrite are now ready to apply to
the search service, the recommendation service, and the analytics
ingest path. The order of adoption matters; the search service is
the easiest port and the highest reward, so it goes first.

1. **Read-through cache with async backfill** — every read path
   that has a hot key distribution wider than ~80% of all reads
   benefits. The recommendation service does not benefit (key
   distribution is too uniform); skip it.
2. **Fire-and-forget setAsync** — works whenever the freshest
   version is not load-bearing for correctness. The analytics
   path has a hard correctness gate (audit log), so it needs a
   different pattern.
3. **Byte-deterministic key derivation** — applicable everywhere.
   The two-step canonicalisation (lower-case → strip-tags → hash)
   we landed in `makeKey` is now extracted as a small library
   and ready for re-use.

## 4. Where the time went

The Phoenix project was committed at six weeks of engineering and
shipped in nine. The three-week slip is the *deliverable* the team
has to learn from — the codebase is fine, the architecture is fine,
the deploy story is fine; the *estimation* is what needs work.

The breakdown below pulls from the timesheet system and the issue
tracker; each line is a single causal category, not a workstream.
The sub-bullets are the concrete sub-causes that fed each category.

- **Underestimated cache eviction work (+9 days).** The eviction
  policy turned out to need a per-tenant override layer; that
  layer was not in the original spec.
  - The override layer surfaced when a single big-tenant migration
    triggered an eviction storm during staging load tests.
  - The fix required a small allocator change *and* an operational
    runbook — neither of which was scoped.
- **Under-tested deploy automation (+5 days).** The new deploy
  pipeline worked in the dev environment but the prod pipeline
  needed a manual approval step we had not budgeted for.
- **Late-discovered cross-service dependency (+4 days).** The
  search service had been relying on an undocumented quirk of the
  old cache; removing the quirk meant a coordinated cut-over.
- **Holiday season throughput drop (+3 days).** Two team members
  on planned PTO during the third week; estimable, but the
  buffer in the schedule did not cover it.

The fraction of the slip attributable to *unknown unknowns* is
the most useful number to remember. Of the 21 days, **9 days** are
fairly attributed to scope work that nobody on the team could have
known about at the start. The remaining 12 days are sub-estimates
of *known* tasks — that is what the post-mortem retros are
sharpening for the next launch.

## 5. The Phoenix dependency surface

The icon-svg block below sketches the Phoenix service dependency
graph at the architectural level. Five primitive node shapes carry
the meaning: `process` for stateful services, `database` for
persistent stores, `decision` for routing services, `external` for
third-party APIs, and `network` for shared edge infrastructure.

```icon-svg
{
  "viewBox": [0, 0, 1000, 1000],
  "ariaLabel": "Phoenix service dependency graph",
  "primitives": [
    { "type": "process",  "id": "api",     "x": 60,  "y": 60,  "w": 380, "h": 150, "label": "API gateway" },
    { "type": "process",  "id": "auth",    "x": 560, "y": 60,  "w": 380, "h": 150, "label": "Auth service" },
    { "type": "decision", "id": "router",  "x": 320, "y": 280, "w": 360, "h": 160, "label": "Tenant router", "variant": "warning" },
    { "type": "process",  "id": "cache",   "x": 60,  "y": 500, "w": 380, "h": 160, "label": "Cache cluster", "variant": "info" },
    { "type": "database", "id": "primary", "x": 560, "y": 500, "w": 380, "h": 200, "label": "Primary store" },
    { "type": "external", "id": "billing", "x": 60,  "y": 760, "w": 380, "h": 180, "label": "Billing API" },
    { "type": "network",  "id": "edge",    "x": 560, "y": 760, "w": 380, "h": 180, "label": "CDN edge", "variant": "success" }
  ]
}
```

Two observations the diagram makes obvious that the prose does not.
First, **the tenant router is the new single point of contention**
— every request flows through it, and it is the one new service
Phoenix introduced. Second, **the cache cluster and primary store
are siblings** under the router, which means a router outage takes
both reads and writes offline together. That coupling is the next
piece of architectural work we want to revisit.

## 6. Comparison — the before/after of the deploy pipeline

The deploy pipeline rewrite is the second-largest behaviour change
in Phoenix. The pre-Phoenix pipeline was eleven serial stages with
no parallelism; the Phoenix pipeline is six stages with three of
them parallel. The table below compares the two side-by-side; the
"After" column is the one we want to lift to the rest of the fleet.

| Stage / property          | Before (pre-Phoenix)            | After (Phoenix)                  |
|---------------------------|---------------------------------|----------------------------------|
| Stages total              | 11 serial                       | 6 (3 of them parallel)           |
| Median wall-clock time    | 46 min                          | 13 min                           |
| p95 wall-clock time       | 78 min                          | 21 min                           |
| Manual approval steps     | 2                               | 1 (production gate only)         |
| Rollback time             | 18 min                          | 90 seconds (canary auto-revert)  |
| Test parallelism          | None                            | 8-way per stage                  |
| Cache layer               | None                            | Per-PR Docker layer cache        |
| Failure-recovery story    | Re-run from start               | Re-run from last green stage     |

The single most-cited improvement in the retro was the **rollback
time** dropping from 18 minutes to 90 seconds. The canary auto-revert
is what makes the on-call experience qualitatively different: a
shipped regression is now an annoyance, not an incident.

## 7. Coverage matrix — what shipped, what slipped

The release scope was 17 deliverables; 14 shipped on the launch
day, 2 shipped in the patch release one week later, 1 slipped to
Q2. The matrix below lists every deliverable, what state it was in
at launch, and whether it cleared its acceptance test (light /
dark / RTL / a11y). A dash means the criterion did not apply.

| Deliverable             | Status     | Light | Dark  | RTL   | a11y  |
|-------------------------|------------|:-----:|:-----:|:-----:|:-----:|
| Cache rewrite           | Shipped    |   ✓   |   ✓   |   —   |   ✓   |
| Tenant router           | Shipped    |   ✓   |   ✓   |   —   |   ✓   |
| Deploy pipeline rewrite | Shipped    |   —   |   —   |   —   |   —   |
| Admin dashboard v2      | Shipped    |   ✓   |   ✓   |   ✓   |   ✓   |
| Billing webhook v3      | Shipped    |   ✓   |   ✓   |   ✓   |   ✓   |
| SSO provider expansion  | Shipped    |   ✓   |   ✓   |   ✓   |   ✓   |
| Audit log retention     | Shipped    |   —   |   —   |   —   |   ✓   |
| Cost dashboard rewrite  | Shipped    |   ✓   |   ✓   |   ✓   |   ◐   |
| Search relevance tweak  | Shipped    |   ✓   |   ✓   |   ✓   |   ✓   |
| Onboarding redesign     | Patch      |   ✓   |   ◐   |   ✗   |   ◐   |
| Mobile push polish      | Patch      |   ✓   |   ✓   |   —   |   ✓   |
| Document export refresh | Slipped Q2 |   —   |   —   |   —   |   —   |

The two **partial** dark-mode results are the items we want to
revisit first; the **RTL fail** on onboarding is already on the
hotfix list. The slipped Q2 item (document export) was a
deliberate descope, not a missed deadline — the scope expanded
mid-flight and we made the call to do it right next quarter.

## 8. Lessons we are committing to next quarter

Three concrete changes go into the Q2 plan as a direct result of
this postmortem. Each one names an owner, a target date, and the
specific instrumentation we want in place to know it worked. The
pattern matches the format the engineering kanban already
recognises, so these can be lifted straight in.

1. **Estimation buffer policy.** Every project ≥4 weeks adopts a
   *20% known-unknowns buffer* on top of the engineering estimate.
   Owner: planning lead. Target: applied to all Q2 projects.
2. **Architectural-review gate.** Any project introducing a new
   *routing-tier* service gets a one-hour cross-team architecture
   review before kickoff. Owner: principal engineer. Target:
   added to the project intake checklist by week 2.
3. **Deploy-pipeline parity sweep.** Lift the Phoenix six-stage
   pipeline to the remaining four services. Owner: platform
   team. Target: end of Q2.

> The single most important lesson is operational, not
> architectural: the **canary auto-revert** is what gave the team
> the confidence to ship into peak load. That pattern, more than
> any single line of code in the rewrite, is what we want to
> preserve and lift.

## 9. Open questions for the engineering review

The questions below are the ones we explicitly want the engineering
review to weigh in on. None of them are urgent; all of them are
load-bearing for the Q2 plan.

- Is the **tenant-router single-point-of-contention** worth
  splitting now (during Q2 plan) or after the next user-growth
  inflection?
- The **cache backfill** is fire-and-forget — is the lack of an
  audit trail acceptable for SOC-2 evidence, or should we ship a
  separate audit log path?
- The **deploy pipeline** uses an in-house orchestrator; the rest
  of the company is on the standard third-party tool. Is there
  enough leverage to migrate?

## 10. Appendix — the supporting visuals

The rest of this page (rendered alongside the prose above) carries
the full set of supporting visuals — design-token contact sheet,
layout shells, animation reveals, interactive tab/filter widget,
small slide capsule, low-fidelity wireframe of the dashboard
mock-up the design team produced. Each of those is a separate
*technique* shipped by the plugin's visualize layer; this page is
the proof that all 13 of them compose into one document without
runtime conflict.

The supporting visuals below are written directly into the markdown
via the `<!-- ve-raw-html-start -->` / `<!-- ve-raw-html-end -->`
pass-through markers added by Phase 4 (DEFECT-E fix). The renderer
emits the lines between the markers verbatim, no HTML escaping, so
the structured DOM that several visualize-skill techniques require
(scene-graph, wireframe, layout grids, interactive controls,
token-sheet, slide-deck JSON) survives intact.

<!-- ve-raw-html-start -->
  <hr>

  <h2>Appendix A — Layout shells (technique #2 — amvcp-layout)</h2>

  <!-- la-grid--2-1 — asymmetric content + sidebar grid -->
  <div class="la-grid la-grid--2-1" data-ve-id="phoenix-grid"
       data-ve-type="layout"
       style="background:var(--vc-color-surface,#fff);
              border:1px solid var(--vc-color-border,#e3dcc9);
              border-radius:var(--vc-radius-md,8px);
              padding:var(--vc-space-4,16px);
              gap:var(--vc-space-4,16px);">
    <div class="la-region" data-ve-id="phoenix-grid-main"
         style="padding:var(--vc-space-3,12px)">
      <strong>Main column.</strong> The cache rewrite is the single
      highest-leverage change in Phoenix. It removed two synchronous
      hops from the request path and made the worst-case behaviour
      cache-first.
    </div>
    <aside class="la-region" data-ve-id="phoenix-grid-side"
           style="padding:var(--vc-space-3,12px);
                  background:var(--vc-color-surface-sunken,#f1ece0);
                  border-radius:var(--vc-radius-sm,4px)">
      <strong>Sidebar.</strong> p99 dropped 38%. Queue depth dropped
      52%. Throughput up 18%.
    </aside>
  </div>

  <!-- la-cardrow + la-card — equal-width subgrid card row -->
  <div class="la-cardrow" data-ve-id="phoenix-cards"
       style="margin-block:var(--vc-space-4,16px);
              gap:var(--vc-space-3,12px)">
    <article class="la-card" data-ve-id="card-cache" data-ve-type="card"
             style="background:var(--vc-color-surface,#fff);
                    border:1px solid var(--vc-color-border,#e3dcc9);
                    border-radius:var(--vc-radius-md,8px);
                    padding:var(--vc-space-3,12px);
                    display:flex;flex-direction:column;
                    gap:var(--vc-space-2,8px)">
      <h3 class="la-card__title"
          style="margin:0;font-size:var(--vc-text-3,18px)">
        Cache rewrite
      </h3>
      <div class="la-card__body">Three hops down to two. Read-through
        with async backfill, fire-and-forget setAsync, byte-deterministic
        keys.</div>
      <footer class="la-card__footer"
              style="font-size:var(--vc-text-1,13px);
                     color:var(--vc-color-content-muted,#5b5343)">
        Owner: platform · landed W-3
      </footer>
    </article>
    <article class="la-card" data-ve-id="card-pipeline" data-ve-type="card"
             style="background:var(--vc-color-surface,#fff);
                    border:1px solid var(--vc-color-border,#e3dcc9);
                    border-radius:var(--vc-radius-md,8px);
                    padding:var(--vc-space-3,12px);
                    display:flex;flex-direction:column;
                    gap:var(--vc-space-2,8px)">
      <h3 class="la-card__title"
          style="margin:0;font-size:var(--vc-text-3,18px)">
        Deploy pipeline
      </h3>
      <div class="la-card__body">11 serial stages reduced to 6 stages,
        3 of them parallel. Wall-clock time 46m → 13m.</div>
      <footer class="la-card__footer"
              style="font-size:var(--vc-text-1,13px);
                     color:var(--vc-color-content-muted,#5b5343)">
        Owner: release eng · landed W-2
      </footer>
    </article>
    <article class="la-card" data-ve-id="card-router" data-ve-type="card"
             style="background:var(--vc-color-surface,#fff);
                    border:1px solid var(--vc-color-border,#e3dcc9);
                    border-radius:var(--vc-radius-md,8px);
                    padding:var(--vc-space-3,12px);
                    display:flex;flex-direction:column;
                    gap:var(--vc-space-2,8px)">
      <h3 class="la-card__title"
          style="margin:0;font-size:var(--vc-text-3,18px)">
        Tenant router
      </h3>
      <div class="la-card__body">New routing tier. Single point of
        contention; next architectural review item for Q2.</div>
      <footer class="la-card__footer"
              style="font-size:var(--vc-text-1,13px);
                     color:var(--vc-color-content-muted,#5b5343)">
        Owner: platform · landed W-1
      </footer>
    </article>
  </div>

  <h2>Appendix B — Animation reveal (technique #4 — amvcp-animation)</h2>

  <!-- data-va-reveal=fade — fires once on first scroll-into-view -->
  <div data-va-reveal="fade" data-ve-id="phoenix-reveal"
       style="background:var(--vc-color-surface-raised,#fffdf8);
              border:1px solid var(--vc-color-border,#e3dcc9);
              border-radius:var(--vc-radius-md,8px);
              padding:var(--vc-space-4,16px);
              margin-block:var(--vc-space-3,12px)">
    <p><strong>Reveal-on-scroll.</strong> This block fades in the first
       time it crosses the viewport (IntersectionObserver, fire-once,
       <code>prefers-reduced-motion</code> safe — when the OS flag is on
       the block is rendered immediately at full opacity instead of
       fading).</p>
    <ul data-va-reveal="stagger" data-va-stagger="80"
        style="margin:var(--vc-space-2,8px) 0;padding-left:1.4em">
      <li class="va-stagger-item" style="--va-index:0">First takeaway —
        the cache pattern lifts to the search service first.</li>
      <li class="va-stagger-item" style="--va-index:1">Second takeaway —
        canary auto-revert is the operational win to preserve.</li>
      <li class="va-stagger-item" style="--va-index:2">Third takeaway —
        every project ≥4 weeks gets a 20% known-unknowns buffer.</li>
    </ul>
  </div>

  <h2>Appendix C — Interactive controls (technique #5 — amvcp-interactive)</h2>

  <!-- The interactive module needs an embedded JSON model + structured
       widget HTML. This is the tabset + filter-pill demo. -->
  <script type="application/json" id="ic-data">
  {
    "tabs": [
      { "id": "tab-summary",   "label": "Summary"   },
      { "id": "tab-causes",    "label": "Causes"    },
      { "id": "tab-followups", "label": "Follow-ups" }
    ],
    "filters": [
      { "id": "flt-all",  "label": "All",  "tag": "*" },
      { "id": "flt-arch", "label": "Architecture", "tag": "arch" },
      { "id": "flt-ops",  "label": "Ops",  "tag": "ops" }
    ]
  }
  </script>

  <style>
    /* Page-local rules so the CSS-only baseline of the interactive
       widget works; the JS layer adds ARIA + persistence on top. */
    #tab-summary:checked ~ .ic-tabpanels .ic-tabpanel[data-tab="tab-summary"],
    #tab-causes:checked ~ .ic-tabpanels .ic-tabpanel[data-tab="tab-causes"],
    #tab-followups:checked ~ .ic-tabpanels .ic-tabpanel[data-tab="tab-followups"] {
      display: block;
    }
    #tab-summary:checked ~ .ic-tablist .ic-tab[for="tab-summary"],
    #tab-causes:checked ~ .ic-tablist .ic-tab[for="tab-causes"],
    #tab-followups:checked ~ .ic-tablist .ic-tab[for="tab-followups"] {
      color: var(--ve-control-fg, #14110b);
      border-bottom-color: var(--vc-color-accent, #b8861f);
    }
    #flt-all:checked ~ .ic-filtered { display: block; }
    #flt-arch:checked ~ .ic-filtered { display: none; }
    #flt-arch:checked ~ .ic-filtered[data-filter-tag="arch"] { display: block; }
    #flt-ops:checked  ~ .ic-filtered { display: none; }
    #flt-ops:checked  ~ .ic-filtered[data-filter-tag="ops"] { display: block; }
  </style>

  <div class="ic-tabs" data-ic-persist data-id="phoenix-tabs"
       data-ve-id="phoenix-tabset" data-ve-type="widget">
    <input class="ic-tab-radio" type="radio" name="phoenix-tabs"
           id="tab-summary" checked>
    <input class="ic-tab-radio" type="radio" name="phoenix-tabs"
           id="tab-causes">
    <input class="ic-tab-radio" type="radio" name="phoenix-tabs"
           id="tab-followups">
    <div class="ic-tablist">
      <label class="ic-tab" for="tab-summary">Summary</label>
      <label class="ic-tab" for="tab-causes">Causes</label>
      <label class="ic-tab" for="tab-followups">Follow-ups</label>
    </div>
    <div class="ic-tabpanels">
      <section class="ic-tabpanel" data-tab="tab-summary">
        <p><strong>Summary panel.</strong> Phoenix shipped on January
           14, 2026; three weeks late; 14/17 deliverables on the launch
           day. The architecture rewrite is durable and the deploy
           pipeline rewrite is the operational win we want to lift.</p>
      </section>
      <section class="ic-tabpanel" data-tab="tab-causes">
        <p><strong>Causes panel.</strong> 9 days unknown-unknowns
           (eviction-policy override layer surfaced in load test).
           12 days sub-estimates of known tasks. Holiday throughput
           drop accounted for, but the schedule buffer was thin.</p>
      </section>
      <section class="ic-tabpanel" data-tab="tab-followups">
        <p><strong>Follow-ups panel.</strong> 20% known-unknowns
           buffer policy; routing-tier architectural-review gate;
           lift the six-stage pipeline to the remaining four
           services by end-of-Q2.</p>
      </section>
    </div>
  </div>

  <p style="margin-top:var(--vc-space-4,16px)">
    <strong>Filter the issue list.</strong> Click a pill to narrow
    the list to one category.
  </p>
  <div class="ic-filterbar" data-ic-persist data-id="phoenix-filters"
       role="radiogroup" aria-label="Filter Phoenix issues">
    <span class="ic-pill-group">
      <input class="ic-pill-radio" type="radio" name="phoenix-filters"
             id="flt-all" value="*" checked>
      <label class="ic-pill" for="flt-all">All
        <span class="ic-pill-count"></span></label>
      <input class="ic-pill-radio" type="radio" name="phoenix-filters"
             id="flt-arch" value="arch">
      <label class="ic-pill" for="flt-arch">Architecture
        <span class="ic-pill-count"></span></label>
      <input class="ic-pill-radio" type="radio" name="phoenix-filters"
             id="flt-ops" value="ops">
      <label class="ic-pill" for="flt-ops">Ops
        <span class="ic-pill-count"></span></label>
    </span>
  </div>
  <div class="ic-filtered" data-filter-tag="arch"
       style="padding:var(--vc-space-2,8px);
              border-left:3px solid var(--vc-color-accent,#b8861f);
              margin-block:var(--vc-space-1,4px)">
    Cache cluster + primary store coupled under tenant router (arch).
  </div>
  <div class="ic-filtered" data-filter-tag="ops"
       style="padding:var(--vc-space-2,8px);
              border-left:3px solid var(--vc-color-accent,#b8861f);
              margin-block:var(--vc-space-1,4px)">
    Canary auto-revert latency &lt; 90s — keep this; lift to other services (ops).
  </div>
  <div class="ic-filtered" data-filter-tag="arch"
       style="padding:var(--vc-space-2,8px);
              border-left:3px solid var(--vc-color-accent,#b8861f);
              margin-block:var(--vc-space-1,4px)">
    Tenant-router single point of contention — Q2 review (arch).
  </div>
  <div class="ic-filtered" data-filter-tag="ops"
       style="padding:var(--vc-space-2,8px);
              border-left:3px solid var(--vc-color-accent,#b8861f);
              margin-block:var(--vc-space-1,4px)">
    Manual approval steps reduced 2 → 1 — production gate only (ops).
  </div>

  <h2>Appendix D — Scene-graph diagram (technique #9 — amvcp-diagram)</h2>

  <!-- .ve-scene-graph + embedded JSON — the diagram module renders
       this into a themed SVG flow chart. -->
  <div class="ve-scene-graph" id="phoenix-flow"
       data-ve-scene-preset="process-flow"
       data-ve-id="phoenix-flow" data-ve-type="diagram"
       style="background:var(--vc-color-surface,#fff);
              border:1px solid var(--vc-color-border,#e3dcc9);
              border-radius:var(--vc-radius-md,8px);
              padding:var(--vc-space-3,12px)">
    <script type="application/json">
    {
      "version": 1,
      "preset": "process-flow",
      "grid": 4,
      "width": 1040,
      "height": 240,
      "nodes": [
        { "id": "in",      "type": "start",      "label": "Request" },
        { "id": "router",  "type": "process",    "label": "Tenant router",
          "role": "service" },
        { "id": "lookup",  "type": "decision",   "label": "Cache hit?" },
        { "id": "respond", "type": "subprocess", "label": "Reply",
          "role": "service" },
        { "id": "fetch",   "type": "process",    "label": "Primary fetch",
          "role": "data" },
        { "id": "out",     "type": "end",        "label": "Done" }
      ],
      "edges": [
        { "from": "in",      "to": "router" },
        { "from": "router",  "to": "lookup" },
        { "from": "lookup",  "to": "respond", "label": "yes" },
        { "from": "lookup",  "to": "fetch",   "label": "no" },
        { "from": "fetch",   "to": "respond", "style": "dashed" },
        { "from": "respond", "to": "out" }
      ]
    }
    </script>
  </div>

  <!-- ASCII fallback diagram — a second diagram primitive the module
       owns: <pre class="ve-ascii"> styled with monospace + token
       colors. The runtime's gutter wraps every <pre>; the diagram
       module's own ascii-class CSS overrides take precedence. -->
  <p>The cache backfill happens off the request path; the loop
     below sketches it (ASCII fallback for the diagram module's
     <code>.ve-ascii</code> primitive):</p>
  <pre class="ve-ascii" data-ve-no-gutter
       data-ve-id="phoenix-ascii" data-ve-type="diagram"
       style="background:var(--vc-color-surface-sunken,#f1ece0);
              border:1px solid var(--vc-color-border,#e3dcc9);
              border-radius:var(--vc-radius-md,8px);
              padding:var(--vc-space-3,12px);
              font:13px/1.55 var(--vc-font-mono,ui-monospace,Menlo,monospace);
              overflow:visible">
   request --> router --> lookup --(hit)--> reply --> done
                            |
                          (miss)
                            |
                            v
                          fetch --(value)--> reply
                            |
                            +--> setAsync(cache)   // fire-and-forget
  </pre>

  <h2>Appendix E — Wireframe (technique #11 — amvcp-wireframe)</h2>

  <!-- .wf-root with data-wf-fidelity — the wireframe module
       desaturates colors + applies a wireframe grain to the children. -->
  <div class="wf-root wf-archetype--web"
       data-wf-root data-wf-fidelity="wireframe" id="phoenix-wf-root"
       data-ve-id="phoenix-wf" data-ve-type="wireframe"
       style="background:var(--vc-color-surface,#fff);
              border:1px solid var(--vc-color-border,#e3dcc9);
              border-radius:var(--vc-radius-md,8px);
              padding:var(--vc-space-3,12px)">
    <section class="wf-screen" id="wf-screen-dash"
             data-ve-id="wf-screen-dash" data-ve-type="wireframe-screen">
      <div class="wf-header">
        <div class="wf-text" data-wf-lines="1" style="width:120px"></div>
        <div class="wf-nav">
          <div class="wf-nav-item">Dashboard</div>
          <div class="wf-nav-item">Services</div>
          <div class="wf-nav-item">Reports</div>
        </div>
      </div>
      <div class="wf-main">
        <div class="wf-card" data-ve-id="wf-card-kpi"
             data-ve-type="wireframe-block">
          <div class="wf-card__title wf-text" data-wf-lines="1">
            KPI strip
          </div>
          <div class="wf-text" data-wf-lines="2"></div>
          <div class="wf-image" style="height:80px"></div>
          <div class="wf-card__actions">
            <a class="wf-button" href="#">Drill in</a>
            <a class="wf-button wf-button--ghost" href="#">Export</a>
          </div>
        </div>
        <div class="wf-card" data-ve-id="wf-card-list"
             data-ve-type="wireframe-block">
          <div class="wf-card__title wf-text" data-wf-lines="1">
            Issue list
          </div>
          <div class="wf-text" data-wf-lines="4"></div>
          <div class="wf-card__actions">
            <button class="wf-button">Filter</button>
            <a class="wf-button wf-button--ghost" href="#">Reset</a>
          </div>
        </div>
      </div>
    </section>
  </div>

  <h2>Appendix F — Token contact-sheet (technique #1 — amvcp-token-sheet)</h2>

  <!-- The token-sheet module mounts a contact-sheet inside a host
       element when called — it does NOT auto-scan. We wire a small
       boot script that runs after the engine resolves the embedded
       DESIGN.md. -->
  <div id="phoenix-token-sheet" class="vc-sheet" data-ve-id="phoenix-tokens"
       data-ve-type="design-tokens"
       style="background:var(--vc-color-surface,#fff);
              border:1px solid var(--vc-color-border,#e3dcc9);
              border-radius:var(--vc-radius-md,8px);
              padding:var(--vc-space-3,12px);
              min-height:80px">
    <div class="vc-sheet-loading"
         style="color:var(--vc-color-content-muted,#5b5343);
                font-size:var(--vc-text-1,13px)">
      Token contact sheet — waits for the DESIGN.md engine to mount.
      Click any swatch to copy the token name.
    </div>
  </div>

  <h2>Appendix G — Slide capsule (technique #12 — amvcp-slide)</h2>

  <p>The slide module renders a deck as a <code>position:fixed;
     inset:0</code> letterbox viewport — by design. On a single page
     hosting twelve other techniques, an auto-mounted deck would
     obscure the entire document. The deck JSON is therefore embedded
     deferred (the head sets <code>__vsdManualInit = true</code>);
     pressing the launch button below mounts the deck full-screen.
     Click any slide background to dismiss.</p>

  <button id="phoenix-deck-launch" type="button"
          style="font:var(--vc-weight-medium,500) var(--vc-text-2,15px)/1.2
                 var(--vc-font-body,system-ui,sans-serif);
                 padding:10px 16px;
                 background:var(--vc-color-accent,#b8861f);
                 color:var(--vc-color-on-accent,#fff);
                 border:none;
                 border-radius:var(--vc-radius-md,8px);
                 cursor:pointer">
    Launch Phoenix slide deck
  </button>

  <!-- vsd-deck-template — the slide deck JSON, parked under a non-vsd
       id so neither the slide module's own auto-boot guard NOR the
       runtime's bootEverything() pass (which calls amvcpSlideDeck.boot()
       unconditionally on bootEverything regardless of __vsdManualInit
       — confirmed defect, see report) discovers it on page load.
       The launch button below promotes this to id="vsd-deck" and then
       calls boot() so the deck mounts only on demand. -->
  <script type="application/json" id="phoenix-deck-template">
  {
    "kind": "deck",
    "title": "Phoenix Postmortem — capsule",
    "id": "phoenix-deck-capsule",
    "aspect": "16:9",
    "fit": "letterbox",
    "mood": "editorial",
    "transition": "crossfade",
    "loop": false,
    "slides": [
      {
        "layout": "manifesto",
        "blocks": [
          { "type": "eyebrow", "text": "Q1 2026 — engineering" },
          { "type": "heading", "text": "Latency dropped 38% after the cache rewrite shipped." },
          { "type": "text",    "text": "Every p99 path now clears 200ms — a margin we have not held since the platform launched." }
        ]
      },
      {
        "layout": "metrics",
        "blocks": [
          { "type": "heading", "text": "Three numbers tell the whole quarter." },
          { "type": "metric", "value": "38%",  "label": "p99 latency drop", "delta": "+12pts vs Q4" },
          { "type": "metric", "value": "13m",  "label": "median deploy time", "delta": "-71% vs baseline" },
          { "type": "metric", "value": "90s",  "label": "rollback time",      "delta": "-96% vs baseline" }
        ]
      },
      {
        "layout": "closing",
        "blocks": [
          { "type": "heading", "text": "Three follow-ups carry into Q2." },
          { "type": "text",    "text": "Buffer policy, architectural-review gate, deploy-pipeline parity sweep." },
          { "type": "quote",   "text": "Cache it once, serve it everywhere.", "cite": "Platform team motto" }
        ]
      }
    ]
  }
  </script>

  <h2>Appendix H — Page is a report-doc (technique #13 — amvcp-report-doc)</h2>

  <p>The whole page IS a report-doc. The runtime's QA pipeline applies
     to it: <code>window.amvcpReportDoc.runGates(document)</code> in
     the browser console produces a per-gate verdict
     (<code>no-nested-scrollbars</code>, <code>wcag-contrast</code>,
     <code>reduced-motion</code>, <code>print-css</code>,
     <code>semantic-html</code>, <code>banned-color</code>,
     <code>banned-font</code>) for the assembled document. The runtime
     auto-injects the report-doc CSS so callouts / metrics / pull-quotes
     all theme off the same <code>--vc-*</code> tokens.</p>

  <!-- Boot script: mount the token sheet + wire the slide-launch
       button. Runs after the runtime has booted so window.amvcpDesignMd /
       window.amvcpTokenSheet / window.amvcpSlideDeck are all installed. -->
  <script>
    (function () {
      'use strict';
      function boot() {
        // Mount the token contact sheet into its host now that
        // the DESIGN.md engine has applied tokens to :root.
        try {
          if (window.amvcpDesignMd && window.amvcpTokenSheet) {
            var raw = document.getElementById('ve-designmd');
            if (raw) {
              var src = (raw.textContent || '').replace(/^\s+/, '')
                                                 .replace(/\s+$/, '');
              var parsed = window.amvcpDesignMd.parseDesignMd(src);
              if (parsed && parsed.ok) {
                var host = document.getElementById('phoenix-token-sheet');
                if (host) {
                  host.innerHTML = '';
                  window.amvcpTokenSheet.mountContactSheet(
                    parsed.designmd, host);
                }
              }
            }
          }
        } catch (e) {
          if (window.console && console.warn) {
            console.warn('phoenix: token-sheet mount failed — '
              + (e && e.message || e));
          }
        }

        // Apply per-line syntax highlighting to every .ve-code-block.
        // The code-highlight module is a PURE utility — it ships no
        // auto-scan; a host page or renderer must call highlightBlock()
        // per block. The runtime's initCodeGutter has already wrapped
        // each line as <span class="ve-code-content">…</span>; we
        // tokenize that text in place. Documented integration gap
        // between amvcp-runtime.js and amvcp-code-highlight.js.
        try {
          if (window.amvcpCodeHighlight) {
            var blocks = document.querySelectorAll('.ve-code-block');
            for (var bi = 0; bi < blocks.length; bi++) {
              var block = blocks[bi];
              if (block.__vcCodeHighlighted) continue;
              if (block.closest('.vc-sheet-panel')) continue;
              var pre = block.querySelector('pre');
              if (!pre) continue;
              var codeEl = pre.querySelector('code');
              if (!codeEl) continue;
              var lang = window.amvcpCodeHighlight.detectLanguage(pre);
              if (!lang) continue;
              var contentSpans = block.querySelectorAll(
                '.ve-code-content');
              if (contentSpans.length === 0) continue;
              var lines = [];
              for (var li = 0; li < contentSpans.length; li++) {
                lines.push(contentSpans[li].textContent || '');
              }
              var rendered = window.amvcpCodeHighlight.highlightBlock(
                lines, lang);
              if (rendered && rendered.length === contentSpans.length) {
                for (var ri = 0; ri < contentSpans.length; ri++) {
                  contentSpans[ri].innerHTML = rendered[ri];
                }
                block.__vcCodeHighlighted = true;
              }
            }
          }
        } catch (e) {
          if (window.console && console.warn) {
            console.warn('phoenix: code-highlight pass failed — '
              + (e && e.message || e));
          }
        }

        // Wire the deferred slide-launch button. The launch flow:
        //   1. Promote the parked deck-template script to id="vsd-deck"
        //      so the slide module's boot() can find it.
        //   2. Call window.amvcpSlideDeck.boot(document) — that mounts
        //      the position:fixed inset:0 letterbox viewport.
        // The slide module's own auto-init was already deferred via
        // window.__vsdManualInit, AND the runtime's bootEverything pass
        // skipped the deck because it was parked under a non-vsd id.
        var btn = document.getElementById('phoenix-deck-launch');
        if (btn && window.amvcpSlideDeck) {
          btn.addEventListener('click', function () {
            try {
              var template = document.getElementById('phoenix-deck-template');
              if (template && !document.getElementById('vsd-deck')) {
                template.setAttribute('id', 'vsd-deck');
              }
              window.amvcpSlideDeck.boot(document);
            } catch (e) {
              if (window.console && console.error) {
                console.error('phoenix: slide-deck boot failed — '
                  + (e && e.message || e));
              }
            }
          });
        }
      }
      // The runtime boots on DOMContentLoaded; defer one frame so
      // every module has installed its globals.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
          setTimeout(boot, 0);
        });
      } else {
        setTimeout(boot, 0);
      }
    })();
  </script>

<!-- ve-raw-html-end -->
