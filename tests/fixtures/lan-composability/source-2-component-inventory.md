# Source document 2 of 3 — component inventory (icons + LAN addresses)

> SIMULATED INPUT. The asset register. Each `id` matches a node in source-1; each
> `type` selects a distinct amvcp-icon-svg glyph; each `lan` is the address printed
> under the icon. Feeds the ICON-SVG part of the composed page.

| id          | type                | label                  | lan           | rack |
|-------------|---------------------|------------------------|---------------|------|
| gw01        | gateway             | Edge Gateway           | 10.0.0.1      | R1   |
| fw01        | firewall            | Perimeter Firewall     | 10.0.0.2      | R1   |
| core-sw01   | switch              | Core Switch            | 10.0.1.1      | R1   |
| ups01       | ups                 | UPS Cabin              | 10.0.1.250    | R1   |
| lb01        | load-balancer       | Load Balancer          | 10.0.2.10     | R2   |
| web01       | web-server          | Web Services 01        | 10.0.2.21     | R2   |
| web02       | web-server          | Web Services 02        | 10.0.2.22     | R2   |
| app01       | app-server          | Intranet App           | 10.0.3.10     | R2   |
| db01        | db-server           | PostgreSQL Primary     | 10.0.3.20     | R3   |
| es01        | elasticsearch       | Elasticsearch          | 10.0.3.30     | R3   |
| auth01      | auth-server         | Auth / SSO             | 10.0.3.40     | R3   |
| nas01       | nas                 | NAS Array              | 10.0.4.10     | R3   |
| backup01    | backup              | Backup Appliance       | 10.0.4.20     | R3   |
| faststore01 | fast-storage        | NVMe Fast-Storage      | 10.0.4.30     | R4   |
| media01     | media-server        | Media Server           | 10.0.4.40     | R4   |
| render01    | render-station      | Render Node 01         | 10.0.5.11     | R4   |
| render02    | render-station      | Render Node 02         | 10.0.5.12     | R4   |
| access-sw01 | relay               | Access Switch / Relay  | 10.0.6.1      | R5   |
| ws01        | workstation         | Workstation 01         | 10.0.6.21     | -    |
| ws02        | workstation         | Workstation 02         | 10.0.6.22     | -    |
| term01      | terminal            | Ops Terminal           | 10.0.6.30     | -    |
| printsrv01  | print-server        | Print Server           | 10.0.6.40     | R5   |
| printer01   | printer             | Printer — Floor 1      | 10.0.6.41     | -    |
| printer02   | printer             | Printer — Floor 2      | 10.0.6.42     | -    |
| wifi01      | wifi-ap             | Wi-Fi Access Point     | 10.0.6.50     | -    |

## Icon set required (24 nodes, 19 distinct types)

gateway · firewall · switch · ups · load-balancer · web-server · app-server ·
db-server · elasticsearch · auth-server · nas · backup · fast-storage · media-server ·
render-station · relay · workstation · terminal · print-server · printer · wifi-ap

Each type MUST render a small, **visually distinguishable** inline SVG (no two types look
alike), themed off DESIGN.md `--vc-*` tokens, legible in light AND dark.
