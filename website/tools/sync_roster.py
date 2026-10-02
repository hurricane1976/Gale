#!/usr/bin/env python3
"""sync_roster.py -- regenerate the fleet website's agent-derived content
from fleet-provision/roster.json, the single source of truth.

WHY THIS EXISTS
----------------
On 2026-09-27, Poniente and Levante -- onboarded and fully mesh-verified a
full day earlier -- were still invisible on every page of this site: absent
from fleet_api.py's AGENTS list (so their commits/backups/activity were
never even read), absent from sysmon.py's health targets, absent from the
topology SVG's nodes and mesh, and every "N agents" count on the site was
stale. All of it was hand-authored HTML/CSS/Python with no generator, so
onboarding an agent meant manually editing SVG coordinates, Python lists,
and a dozen scattered count strings -- exactly the kind of job that's easy
to do 90% of and never notice the last 10%. This script closes that gap.

SCOPE
-----
This regenerates:
  - fleet.html:  the GALE-HOST cluster of the topology SVG (nodes + full
                 mesh edges), the "Gale host" member-card group, and every
                 "N agents" / "<word> agents" count string on the page.
  - fleet_api.py:  the AGENTS list (local run/activity/backup source).
  - sysmon.py:     TARGETS (local gale agents + one remote hub-check per
                   other host), SERVICES (systemd unit names), and
                   PORT_LABELS.
  - index.html:    the fleet stat tile, "the fleet" section lede, the
                   Fleet dash-card subtitle, and gale's agent-chip list.
  - hosts.js:      gale's host-note agent count.
  - metrics.html, observability.html, ollama.html: "N co-located agents"
                   mentions.

It deliberately does NOT touch the Tidal/Beacon/Mountain clusters in the
topology diagram -- those are other hosts' rosters, informational from
here, and not gale's to maintain. It also does not touch per-pair
onboarding dates/rule numbers on mesh edges: those were hand-narrated
history that's exactly what went stale before, so this generator writes a
uniform, honest "two-way confirmed (local mesh)" for every gale-host edge
instead of pretending to know a future agent's onboarding story.

USAGE
-----
    ./tools/sync_roster.py            dry-run: prints a unified diff per file
    ./tools/sync_roster.py --write    applies the changes
    ./tools/sync_roster.py --write --deploy   also runs ./deploy.sh and
                                       restarts gale-fleet-api/gale-sysmon

Run this any time fleet-provision/roster.json's gale-host entries change.
"""
import argparse
import difflib
import json
import math
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # website/
FLEET_ROOT = os.path.dirname(ROOT)  # /home/agent/agent
ROSTER_PATH = os.path.join(FLEET_ROOT, "fleet-provision", "roster.json")

HUB_XY = (840.00, 695.00)
HOST_ORDER = ["tidal", "beacon", "mountain", "gale"]

MODEL_COLOR_VAR = {
    "claude": "var(--fleet-claude)", "glm": "var(--fleet-glm)",
    "gpt": "var(--fleet-openai)", "qwen": "var(--fleet-qwen)",
    "deepseek": "var(--fleet-deepseek)", "muse": "var(--fleet-muse)",
    "gemini": "var(--fleet-gemini)",
}

ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
        "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
        "sixteen", "seventeen", "eighteen", "nineteen", "twenty"]


def spell(n):
    return ONES[n] if 0 <= n < len(ONES) else str(n)


def esc(s):
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def load_roster():
    with open(ROSTER_PATH) as fh:
        data = json.load(fh)
    agents = data["agents"]
    by_host = {}
    for a in agents:
        by_host.setdefault(a["host"], []).append(a)
    return agents, by_host


def hub_of(host_agents, host):
    for a in host_agents:
        if a["name"].lower() == host.lower():
            return a
    return host_agents[0]


# --------------------------------------------------------------------------
# Gale topology: nodes + full mesh, laid out on a circle around the fixed hub
# --------------------------------------------------------------------------

def gale_layout(gale_agents):
    hub = hub_of(gale_agents, "gale")
    spokes = [a for a in gale_agents if a is not hub]
    n = len(spokes)
    # Keep adjacent-neighbor spacing close to the site's existing ~90px
    # convention regardless of how many spokes there are.
    radius = 45.0 / math.sin(math.pi / n) if n else 0.0
    phase = -90.0 + (180.0 / n if n else 0.0)
    coords = {hub["name"]: HUB_XY}
    for i, a in enumerate(spokes):
        theta = math.radians(phase + i * (360.0 / n))
        x = HUB_XY[0] + radius * math.cos(theta)
        y = HUB_XY[1] + radius * math.sin(theta)
        coords[a["name"]] = (round(x, 2), round(y, 2))
    return hub, spokes, coords


def node_block(agent, xy, is_hub, index):
    x, y = xy
    model = (agent.get("model") or "").lower()
    color = MODEL_COLOR_VAR.get(model, "var(--text-dim)")
    name = agent["name"]
    role = esc(agent.get("role") or "")
    listener = f'{agent["addr"]}:{agent["port"]}'
    if is_hub:
        cls = "topo-node topo-node--hub"
        role_attr = ' data-role="hub"'
        state = "hub · this page’s vantage point"
        ring = "spin-cw"
    else:
        cls = "topo-node"
        role_attr = ""
        state = "two-way confirmed (local mesh)"
        # Deterministic (not hash(name), which is randomized per-process and
        # would make the "same input" produce spurious diffs on every run).
        ring = "cw" if index % 2 == 0 else "ccw"
    return (
        f'<g class="{cls}" style="--node-color:{color}" tabindex="0" role="button" '
        f'aria-pressed="false" aria-label="{name} • {role}"{role_attr} '
        f'data-name="{name}" data-host="Gale host" data-model="{esc(agent.get("model") or "")}" '
        f'data-role-desc="{role}" data-listener="{listener}" data-state="{state}">'
        f'<circle class="ping-halo" cx="{x:.2f}" cy="{y:.2f}" r="24" style="stroke:{color}" aria-hidden="true"></circle>'
        f'<circle class="scan-ring {ring}" cx="{x:.2f}" cy="{y:.2f}" r="31" style="stroke:{color}" aria-hidden="true"></circle>'
        f'<circle class="topo-node-bg" cx="{x:.2f}" cy="{y:.2f}" r="24"></circle>'
        f'<circle class="ping-dot" cx="{x:.2f}" cy="{y:.2f}" r="4.5" fill="{color}"></circle>'
        f'<text class="topo-node-label" x="{x:.2f}" y="{y+4:.2f}" font-size="11" text-anchor="middle">{name.upper()}</text></g>'
    )


def mesh_line(a_name, a_xy, b_name, b_xy):
    x1, y1 = a_xy
    x2, y2 = b_xy
    return (
        f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" class="pulse-line chan-live" '
        f'style="filter:drop-shadow(0 0 3px rgba(57,255,143,0.5))">'
        f'<title>{a_name} &amp;harr; {b_name}: two-way confirmed (local mesh)</title></line>'
    )


def member_card(agent, i, is_hub):
    model = agent.get("model") or ""
    color = MODEL_COLOR_VAR.get(model.lower(), "var(--text-dim)")
    role = agent.get("role") or ""
    listener = f'{agent["addr"]}:{agent["port"]}'
    state = "hub · this page’s vantage point" if is_hub else "two-way confirmed (local mesh)"
    return (
        f'<agent-card name="{esc(agent["name"])}" model="{esc(model)}" job="{esc(role)}" '
        f'listener="{esc(listener)}" state="{esc(state)}" color="{color}" index="{i}"></agent-card>'
    )


def build_gale_svg_and_cards(gale_agents):
    hub, spokes, coords = gale_layout(gale_agents)
    ordered = [hub] + spokes
    nodes_html = "\n".join(node_block(a, coords[a["name"]], a is hub, i) for i, a in enumerate(ordered))
    lines = []
    for i in range(len(ordered)):
        for j in range(i + 1, len(ordered)):
            a, b = ordered[i], ordered[j]
            lines.append(mesh_line(a["name"], coords[a["name"]], b["name"], coords[b["name"]]))
    lines_html = "\n".join(lines)
    cards_html = "".join(member_card(a, i, a is hub) for i, a in enumerate(ordered))
    return nodes_html, lines_html, cards_html, len(ordered)


# --------------------------------------------------------------------------
# File patchers -- each returns (new_text, changed: bool)
# --------------------------------------------------------------------------

def patch_fleet_html(text, gale_agents, total_agents):
    nodes_html, lines_html, cards_html, n_gale = build_gale_svg_and_cards(gale_agents)

    # 0) ISLAND REPLACEMENT (ROADMAP #3): the generated region is fenced
    #    with <!-- island:gale-mesh start --> ... <!-- island:end -->, so
    #    when the marker exists we swap the whole island in one bounded
    #    operation instead of regex-scavenging the SVG for gale-shaped
    #    <g>/<line> fragments. The legacy node/line regexes below remain as
    #    the fallback path for pages that predate the markers.
    island_re = re.compile(
        r'(<!-- island:gale-mesh start -->\n).*?(<!-- island:end -->)',
        re.S,
    )
    island_body = nodes_html + "\n" + lines_html + "\n"
    if re.search(r'<!-- island:gale-mesh start -->', text):
        text, n_marker = island_re.subn(r'\g<1>' + nodes_html + "\n" + lines_html + "\n" + r'\2',
                                        text, count=1)
    else:
        n1 = n2 = None

    # 1) node block: from the Gale hub <g> through the last gale node <g>
    node_re = re.compile(
        r'<g class="topo-node topo-node--hub"[^>]*data-name="Gale".*?'
        r'(?:<g class="topo-node"[^>]*data-host="Gale host".*?</g>\s*)+',
        re.S,
    )
    text, n1 = node_re.subn(nodes_html + "\n", text, count=1)

    # 2) mesh lines: every <line> whose title mentions two Gale-host agent
    #    names (both endpoints inside the gale cluster) gets removed from
    #    wherever it sits, then the fresh full-mesh block is inserted right
    #    after the node block.
    gale_names = {a["name"] for a in gale_agents}
    line_re = re.compile(r'<line [^>]*>(?:<title>([^<]*)</title>)?</line>\n?')

    def is_gale_line(m):
        title = m.group(1) or ""
        parts = re.split(r"\s*&amp;(?:harr|amp;harr)\s*|\s*&\s*", title)
        # crude but effective: title format is always "A &harr; B: ..."
        first = title.split("&")[0].strip()
        rest = title.split(":", 1)[0]
        names_in_title = re.findall(r"[A-Za-z]+", rest)
        return names_in_title and all(nm in gale_names for nm in names_in_title if nm not in ("harr", "amp"))

    kept = []
    removed_any = False
    for m in line_re.finditer(text):
        if is_gale_line(m):
            removed_any = True
    text = line_re.sub(lambda m: "" if is_gale_line(m) else m.group(0), text)

    # insert fresh mesh block right after the (freshly inserted) node block
    text, n2 = re.subn(re.escape(nodes_html + "\n"), nodes_html + "\n" + lines_html + "\n", text, count=1)

    # 3) member-cards group for "Gale host". MARKER PATH (ROADMAP #3): when
    #    the island fence exists, swap everything between the markers in one
    #    bounded operation -- no lookahead on the next section heading. The
    #    legacy bounded regex below remains for pages predating markers.
    cards_island_re = re.compile(
        r'(<!-- island:gale-cards start -->\n).*?(<!-- island:end -->)',
        re.S,
    )
    new_group = (
        f'<div class="member-group reveal"><h3 class="member-group-h">Gale host '
        f'<span>{n_gale} agents · gale-agent</span></h3><div class="member-cards">{cards_html}</div></div>'
    )
    # 3) member-cards group for "Gale host". MARKER PATH (ROADMAP #3): when
    #    the island fence exists, swap everything between the markers in one
    #    bounded operation -- no lookahead on the next section heading. The
    #    legacy bounded regex below remains for pages predating markers.
    cards_island_re = re.compile(
        r'(<!-- island:gale-cards start -->\n).*?(<!-- island:end -->)',
        re.S,
    )
    new_group = (
        f'<div class="member-group reveal"><h3 class="member-group-h">Gale host '
        f'<span>{n_gale} agents · gale-agent</span></h3><div class="member-cards">{cards_html}</div></div>'
    )
    if re.search(r'<!-- island:gale-cards start -->', text):
        text, n3 = cards_island_re.subn(r'\g<1>' + new_group + "\n" + r'\2', text, count=1)
    else:
        mc_re = re.compile(
            r'<div class="member-group reveal"><h3 class="member-group-h">Gale host '
            r'<span>\d+ agents · gale-agent</span></h3><div class="member-cards">.*?</div></div>'
            r'(?=\s*<h2 class="section-h" id="hosts">)',
            re.S,
        )
        text, n3 = mc_re.subn(new_group, text, count=1)

    # 4) count strings
    text = re.sub(r'GALE HOST · gale-agent · \d+ agents',
                   f'GALE HOST · gale-agent · {n_gale} agents', text)
    text = re.sub(r'plus gale host with \w+ agents,',
                   f'plus gale host with {spell(n_gale)} agents,', text)
    text = re.sub(r'<span class="dot"></span>\d+ agents · 4 independent hosts live',
                   f'<span class="dot"></span>{total_agents} agents · 4 independent hosts live', text)
    text = re.sub(r'\d+ agents across 4 independent hosts', f'{total_agents} agents across 4 independent hosts', text)
    text = re.sub(r'\d+ agents total across four host clusters\.',
                   f'{total_agents} agents total across four host clusters.', text)

    return text, any([n1, n2, n3, removed_any])


def patch_python_agents_list(text, gale_agents, dirname_of):
    hub, spokes, _ = gale_layout(gale_agents)
    ordered = [hub] + spokes
    lines = []
    for a in ordered:
        dn = dirname_of(a["name"])
        lines.append(f'    ("{a["name"].lower()}", "{dn}"),')
    body = "\n".join(lines)
    pat = re.compile(r'AGENTS = \[\n(?:.*\n)*?\]\n', re.M)
    new_block = f'AGENTS = [\n{body}\n]\n'
    return pat.subn(new_block, text, count=1)


def patch_sysmon(text, gale_agents, non_gale_hosts):
    hub, spokes, _ = gale_layout(gale_agents)
    ordered = [hub] + spokes

    targets_local = "\n".join(
        f'    {{"name": "{a["name"]}", "kind": "local", "addr": "{a["addr"]}:{a["port"]}"}},'
        for a in ordered
    )
    targets_remote = "\n".join(
        f'    {{"name": "{h["name"]}", "kind": "remote", "addr": "{h["addr"]}:{h["port"]}"}},'
        for h in non_gale_hosts
    )
    targets_block = f'TARGETS = [\n{targets_local}\n{targets_remote}\n]\n'
    text, n1 = re.subn(r'TARGETS = \[\n(?:.*\n)*?\]\n', targets_block, text, count=1)

    services_gale = ", ".join(f'"{a["name"].lower()}-peer"' for a in ordered)
    text, n2 = re.subn(
        r'SERVICES = \[\n(?:.*\n)*?\]\n',
        'SERVICES = [\n    ' + services_gale + ',\n    "nginx", "tailscaled", "cron",\n]\n',
        text, count=1,
    )

    port_entries = ", ".join(f'{a["port"]}: "{a["name"].lower()}-peer"' for a in ordered)
    text, n3 = re.subn(
        r'_PORT_LABELS = \{\n(?:.*\n)*?\}\n',
        '_PORT_LABELS = {\n    ' + port_entries + ',\n'
        '    8090: "nginx (gale site)", 22: "ssh", 53: "dns",\n}\n',
        text, count=1,
    )
    return text, any([n1, n2, n3])


def patch_index_html(text, gale_agents, total_agents):
    hub, spokes, _ = gale_layout(gale_agents)
    ordered = [hub] + spokes
    chips = "\n".join(
        f'                <a class="agent" data-model="{(a.get("model") or "").lower()}" href="fleet.html?agent={a["name"]}">{a["name"]}</a>'
        for a in ordered
    )
    chip_re = re.compile(
        r'(<article class="host-card">\s*<h3 class="host-name">gale</h3>\s*<div class="host-agents">\n)'
        r'(?:.*\n)*?(\s*</div>\s*</article>)',
    )
    text, n1 = chip_re.subn(lambda m: m.group(1) + chips + "\n" + m.group(2), text, count=1)

    text, n2 = re.subn(r'\d+ agents across 4 hosts\. Same duty roster',
                        f'{total_agents} agents across 4 hosts. Same duty roster', text)
    text, n3 = re.subn(r'<div class="stat-num">\d+</div>\n              <div class="stat-lab">agents</div>',
                        f'<div class="stat-num">{total_agents}</div>\n              <div class="stat-lab">agents</div>', text)
    text, n4 = re.subn(r'<span class="dash-sub">\d+ agents, 4 hosts, live status</span>',
                        f'<span class="dash-sub">{total_agents} agents, 4 hosts, live status</span>', text)
    return text, any([n1, n2, n3, n4])


def patch_hosts_js(text, n_gale):
    return re.subn(r'fleet lead · \d+ agents', f'fleet lead · {n_gale} agents', text)


def patch_coagent_count(text, n_gale, patterns):
    changed = False
    for pat, repl in patterns:
        text, n = re.subn(pat, repl(n_gale), text)
        changed = changed or bool(n)
    return text, changed


# --------------------------------------------------------------------------

def dirname_of(name):
    """gale's own repo dirname is 'agent'; every sibling's dirname is its
    lowercase name (matches the existing convention in fleet_api.py)."""
    return "agent" if name.lower() == "gale" else name.lower()


def show_diff(path, old, new):
    if old == new:
        print(f"  (no change)  {os.path.relpath(path, FLEET_ROOT)}")
        return
    diff = difflib.unified_diff(
        old.splitlines(keepends=True), new.splitlines(keepends=True),
        fromfile=path, tofile=path, n=1,
    )
    sys.stdout.writelines(diff)


def process(path, patch_fn, write):
    with open(path) as fh:
        old = fh.read()
    new, changed = patch_fn(old)
    show_diff(path, old, new)
    if write and changed:
        with open(path, "w") as fh:
            fh.write(new)
    return changed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--deploy", action="store_true", help="also run deploy.sh + restart services")
    args = ap.parse_args()

    agents, by_host = load_roster()
    gale_agents = by_host.get("gale", [])
    if not gale_agents:
        sys.exit("no gale-host agents found in roster.json")
    total_agents = len(agents)
    non_gale_hosts = [hub_of(by_host[h], h) for h in HOST_ORDER if h != "gale" and by_host.get(h)]

    any_changed = False
    any_changed |= process(os.path.join(ROOT, "fleet.html"),
                            lambda t: patch_fleet_html(t, gale_agents, total_agents), args.write)
    any_changed |= process(os.path.join(ROOT, "fleet_api.py"),
                            lambda t: patch_python_agents_list(t, gale_agents, dirname_of), args.write)
    any_changed |= process(os.path.join(ROOT, "sysmon.py"),
                            lambda t: patch_sysmon(t, gale_agents, non_gale_hosts), args.write)
    any_changed |= process(os.path.join(ROOT, "index.html"),
                            lambda t: patch_index_html(t, gale_agents, total_agents), args.write)
    any_changed |= process(os.path.join(ROOT, "hosts.js"),
                            lambda t: patch_hosts_js(t, len(gale_agents)), args.write)
    any_changed |= process(os.path.join(ROOT, "metrics.html"),
                            lambda t: patch_coagent_count(t, len(gale_agents), [
                                (r'the \w+ co-located agents', lambda n: f'the {spell(n)} co-located agents'),
                            ]), args.write)
    any_changed |= process(os.path.join(ROOT, "observability.html"),
                            lambda t: patch_coagent_count(t, len(gale_agents), [
                                (r'all \w+ co-located agents', lambda n: f'all {spell(n)} co-located agents'),
                            ]), args.write)
    any_changed |= process(os.path.join(ROOT, "ollama.html"),
                            lambda t: patch_coagent_count(t, len(gale_agents), [
                                (r'\w+ agents on this host run through it',
                                 lambda n: f'{spell(n).capitalize()} agents on this host run through it'),
                            ]), args.write)

    if not args.write:
        print("\n(dry run -- pass --write to apply)")
        return
    if not any_changed:
        print("everything already matches roster.json")
        return
    print("applied.")
    if args.deploy:
        subprocess.run(["./deploy.sh"], cwd=ROOT, check=True)
        subprocess.run(["sudo", "systemctl", "restart", "gale-fleet-api", "gale-sysmon"], check=True)
        print("deployed + restarted services.")


if __name__ == "__main__":
    main()
