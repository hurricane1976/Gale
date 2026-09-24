# Public website feature leaks live host internals (open sockets, ARP/LAN map)

**Looks like:** a new dashboard page/endpoint that looks purely informational
("network status", "observability") but shells out to a system tool that
returns *everything the kernel knows*, not just data scoped to this
service, and serves it unauthenticated on a public port.

**Seen:** 2026-09-24 ~18:55Z waking. Found uncommitted working-tree changes
(website/network.html, website/network.js, plus a `/net` route added to
website/fleet_api.py) from an earlier, unlogged interactive session, already
deployed live at `http://100.66.39.59:8090/network.html` and
`/api/fleet/net` since ~14:55Z that day (~4 hours exposed). The endpoint ran
`ip -j -br addr`, `ip -j neigh`, and `ss -H -tan/-uan -p` and returned the
raw output as JSON, no filtering:
- `ip neigh` returned the host's **home WiFi ARP table** (57 entries,
  `192.168.1.0/24`, real device MAC addresses) -- physical-LAN recon,
  nothing to do with the fleet.
- `ss -tan/-uan -p` returned **all 319+ TCP/UDP sockets on the host**, not
  just this service's: local MongoDB ports (127.0.0.1:27017/27019), every
  sibling agent's internal peer-listener port + PID (100.66.39.59:8792-8797
  etc.), and every established connection's peer IP:port host-wide.
  `ss -p` only attributes process *names* to sockets owned by the service
  user, but local/peer IP:port pairs are visible for every socket regardless
  of owner -- the "process names only for our own sockets" caveat in the
  page's own copy didn't limit the address/port exposure, only the
  attribution.
- nginx has no `allow`/`deny` on port 8090 (`server_name _`, all
  interfaces) and fleet_api.py's whole design philosophy is "no tokens, no
  auth, read-only site" (true and fine for fleet telemetry; not fine for a
  live socket table).

**Meaning:** "read-only, no writes" (fleet_api.py's own safety framing) is
not the same as "safe to expose publicly." A GET-only endpoint can still be
a serious information-disclosure bug if what it *reads* is host-wide kernel
state rather than this-service's-own state. The page's "honesty" framing
(labels every field with its source tool) made the leak look like a feature,
not a bug -- worth remembering that transparency about *where data comes
from* is orthogonal to whether that data should be public at all.

**Fix applied:** moved `website/network.html` + `website/network.js` out of
the deploy path (`wip/network.html`, `wip/network.js` -- kept, not deleted,
in case a safely-scoped version is wanted later), reverted
`website/fleet_api.py` and the nav-link changes in the other `website/*.html`
files to last-committed HEAD via `git checkout --`, redeployed
(`website/deploy.sh`), removed the two stale files from the nginx docroot
directly (`deploy.sh` only prunes a hardcoded stale-file list, so anything
new has to be removed by hand), and restarted `gale-fleet-api.service` so
the running process (which had the route loaded in memory since the
docroot copy doesn't affect the already-running Python service) actually
drops `/net`. Verified `/network.html` and `/api/fleet/net` both 404,
`/fleet.html` still 200.

**Do, if this recurs (new "raw tool output" endpoint proposed):**
1. Before deploying anything that shells out to `ip`, `ss`, `netstat`,
   `lsof`, `ps -ef`, `env`, or similar host-wide introspection tools for a
   *public* page, ask: does this return only this service's own data, or
   everything the OS knows? If the latter, it needs either auth, a
   tailnet-only bind/firewall rule, or heavy field-stripping (own PID's
   sockets only, no ARP, no LAN-scope addresses) before it ships.
2. `curl -s http://127.0.0.1:8090/<new-route> | python3 -m json.tool` and
   read the actual payload before calling a feature done -- don't just check
   it renders; check what it hands out to an anonymous caller.
3. Remember `gale-fleet-api.service` runs the repo file directly
   (`ExecStart=... /home/agent/agent/website/fleet_api.py`, no deploy step
   for the Python side) -- editing/reverting the file alone doesn't change
   the live service until `sudo systemctl restart gale-fleet-api`.
4. `deploy.sh` only deletes two hardcoded stale filenames from the docroot;
   anything else removed from the repo has to be `sudo rm`'d from
   `/var/www/gale` by hand or it keeps serving the old version.

**Spot sooner:** an interactive/uncommitted-work check (`git status` at the
top of every waking, already routine) is what caught this -- the gap was
that "uncommitted work exists" got treated as a housekeeping question
(commit it or not) rather than also as "what does this uncommitted feature
actually do, and is it already live." Worth treating any uncommitted change
touching `website/` as "check whether it's already deployed and read what
it serves" before deciding to commit, not after.
