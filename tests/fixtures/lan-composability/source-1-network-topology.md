# Source document 1 of 3 — LAN network topology (connections)

> SIMULATED INPUT. This is the kind of raw doc a user hands Claude: "here's how our
> network is wired." Claude reads this + source-2 (inventory) + source-3 (traffic) and
> composes ONE interactive HTML page combining three amvcp visual-element skills:
> graph (these connections) · icon-svg (a distinct icon per component) · charts
> (a per-component traffic pie). This file feeds the GRAPH part.

## Segments

- **Edge / WAN**: the internet uplink enters through the gateway, then the perimeter firewall.
- **Core**: a core switch is the hub; the UPS cabin powers the core rack (power link, not data).
- **DMZ / web tier**: load balancer fans out to the web-services servers.
- **App / data tier**: intranet app server, database, Elasticsearch, auth server.
- **Storage tier**: NAS, backup appliance, fast-storage array, media server.
- **Compute**: graphic rendering stations.
- **Access edge**: an access switch (relay) reaches workstations, a terminal, the print
  server (→ printers), and the Wi-Fi access point.

## Connections (adjacency — `from -> to [: link-type]`)

```
gw01        -> fw01
fw01        -> core-sw01
ups01       -> core-sw01        : power
core-sw01   -> lb01
lb01        -> web01
lb01        -> web02
core-sw01   -> app01
app01       -> db01
app01       -> es01
core-sw01   -> auth01
core-sw01   -> nas01
nas01       -> backup01
core-sw01   -> faststore01
core-sw01   -> media01
core-sw01   -> render01
core-sw01   -> render02
core-sw01   -> access-sw01
access-sw01 -> ws01
access-sw01 -> ws02
access-sw01 -> term01
access-sw01 -> printsrv01
printsrv01  -> printer01
printsrv01  -> printer02
access-sw01 -> wifi01
```

## Notes for the renderer

- `power` links should be visually distinct from data links (e.g. dashed / amber).
- The core switch (`core-sw01`) is the central hub — highest connection degree.
- This is a single-screen LAN, ~24 nodes; lay it out so no edges cross a node.
