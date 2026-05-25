# Source document 3 of 3 — traffic breakdown by project / team

> SIMULATED INPUT. Per-component share of traffic across the five teams. Each `id`
> matches source-1/2; each row sums to 100. Feeds the CHARTS part — one small pie/donut
> UNDER each component's icon. Teams: Platform · DataSci · Web · Design · Ops.

| id          | Platform | DataSci | Web | Design | Ops |
|-------------|---------:|--------:|----:|-------:|----:|
| gw01        |       20 |      20 |  25 |     15 |  20 |
| fw01        |       22 |      18 |  25 |     15 |  20 |
| core-sw01   |       20 |      20 |  20 |     20 |  20 |
| ups01       |        0 |       0 |   0 |      0 | 100 |
| lb01        |       10 |       5 |  75 |      5 |   5 |
| web01       |        8 |       4 |  80 |      4 |   4 |
| web02       |        8 |       4 |  80 |      4 |   4 |
| app01       |       45 |      15 |  20 |     10 |  10 |
| db01        |       25 |      55 |  10 |      5 |   5 |
| es01        |       15 |      65 |  12 |      3 |   5 |
| auth01      |       40 |      10 |  20 |     10 |  20 |
| nas01       |       15 |      25 |  10 |     40 |  10 |
| backup01    |       10 |      15 |   5 |     10 |  60 |
| faststore01 |       10 |      30 |  10 |     45 |   5 |
| media01     |        5 |       5 |  10 |     75 |   5 |
| render01    |        2 |       3 |   5 |     88 |   2 |
| render02    |        2 |       3 |   5 |     88 |   2 |
| access-sw01 |       18 |      12 |  20 |     30 |  20 |
| ws01        |       30 |      20 |  20 |     20 |  10 |
| ws02        |       10 |      10 |  15 |     60 |   5 |
| term01      |       20 |      10 |  10 |      5 |  55 |
| printsrv01  |       15 |      10 |  15 |     30 |  30 |
| printer01   |       20 |      15 |  20 |     25 |  20 |
| printer02   |       18 |      12 |  18 |     32 |  20 |
| wifi01      |       25 |      18 |  22 |     20 |  15 |

## Chart requirement

One compact **pie (or donut)** per component, rendered directly beneath that
component's icon, using the five team colors consistently across ALL pies (so a color
means the same team everywhere). amvcp-chart, themed off DESIGN.md, legible light + dark,
each pie a `data-ve-id` selection atom.
