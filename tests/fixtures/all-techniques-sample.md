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

The supporting visuals are written directly into the rendered HTML
(below this paragraph) rather than through the markdown source,
because the markdown renderer does not pass raw HTML through; that
is a known and deliberate limitation of the interactive-report
pipeline. The supporting blocks therefore live in the rendered
HTML between the `<!-- begin all-techniques injection -->` and
`<!-- end all-techniques injection -->` markers.
