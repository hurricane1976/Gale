#!/usr/bin/env python3
"""Single source for site navigation. Rewrites (1) every page's nav link list, (2) the grouped
desktop dropdowns and the phone More list in shared.js, and (3) hoists the search overlay out of
the <nav>. Idempotent. Run from the website dir after editing GROUPS; deploy.sh doesn't call it."""
import re, sys

# group label -> [(page slug, label)]. Order here is the order everywhere.
GROUPS = [
    ("Overview", [("index", "Home"), ("operations", "Operations"), ("status", "Status"), ("notifications", "Notifications")]),
    ("Fleet", [("fleet", "Fleet"), ("galaxy", "Galaxy"), ("network", "Network"), ("maintenance", "Maintenance")]),
    ("Insights", [("metrics", "Metrics"), ("observability", "Observability"), ("reliability", "Reliability")]),
    ("Services", [("ollama", "freetoken"), ("agora", "Agora"), ("weather", "Weather"), ("runbooks", "Runbooks")]),
    ("Smart home", [("energy", "Energy"), ("energy-costs", "Energy costs"), ("cameras", "Cameras"), ("presence", "Presence"),
              ("routines", "Routines"), ("guest-mode", "Guest mode")]),
]
NAV = [pl for _, pages in GROUPS for pl in pages]
PAGES = [slug for slug, _ in NAV] + ["404", "offline"]
# phone bottom bar = first four, icon keys read by shared.js; everything else lands in More
TABS = {"index": ("Overview", "home"), "status": ("Status", "status"), "fleet": ("Fleet", "fleet"), "operations": ("Operations", "ops")}
CONTAINERS = [(r'<nav class="site-links" aria-label="Site">', "nav"), (r'<div class="fleet-links">', "div"), (r'<div class="topnav-links">', "div")]
OVERLAY = re.compile(r"(?:[ \t]*<!-- Site-wide search[^\n]*-->\n)?(?P<i>[ \t]*)<div id=\"gale-search-overlay\".*?\n(?P=i)</div>\n\n?", re.S)

changed = 0
for page in PAGES:
    path = f"{page}.html"
    s = open(path).read()
    orig = s
    # hoist the overlay: capture it, drop it from inside the nav, re-insert after </nav>
    m = OVERLAY.search(s)
    overlay = None
    if m:
        overlay = m.group(0)
        s = s[:m.start()] + s[m.end():]
    for opn, _ in CONTAINERS:
        m = re.search(r"([ \t]*)(" + opn + r")\n(.*?<a id=\"nav-pulse\".*?</a>)", s, re.S) or \
            re.search(r"([ \t]*)(" + opn + r")\n(.*?)(?=\n[ \t]*</(?:div|nav)>)", s, re.S)
        if not m:
            continue
        ind = m.group(1) + "  "
        links = []
        for slug, label in NAV:
            if slug == "index" and page == "index":  # the brand already links home
                continue
            cur = ' aria-current="page"' if slug == page else ""
            links.append(f'{ind}<a href="{slug}.html"{cur}>{label}</a>')
        links.append(f'{ind}<a id="nav-pulse" class="nav-pulse" href="status.html" data-level="unknown" '
                     f'aria-label="Fleet health: checking"><span class="nav-pulse-dot" aria-hidden="true"></span>'
                     f'<span class="nav-pulse-txt" aria-live="polite">&hellip;</span></a>')
        s = s[:m.start(3)] + "\n".join(links) + s[m.end(3):]
        break
    else:
        print("no nav container in", path, file=sys.stderr)
    if overlay:
        i = s.find("</nav>", s.find("nav-pulse"))
        j = i + len("</nav>")
        s = s[:j] + "\n\n  <!-- Site-wide search: Ctrl/⌘+K -->\n" + re.sub(r"^<!--.*?-->\n\s*", "", overlay.lstrip(), flags=re.S).rstrip("\n") + s[j:]
    if s != orig:
        open(path, "w").write(s); changed += 1

# shared.js generated regions
js = open("shared.js").read()
defs = "  const definitions = [\n" + "".join(
    f'    [{label!r}, [{", ".join(chr(34)+slug+".html"+chr(34) for slug, _ in pages)}]],\n'.replace("'", '"') for label, pages in GROUPS) + "  ];\n"
js = re.sub(r"(  /\* nav:groups begin[^\n]*\*/\n).*?(  /\* nav:groups end \*/)", lambda m: m.group(1) + defs + m.group(2), js, flags=re.S)
tabs = [(TABS[k][0], f"{k}.html", TABS[k][1]) for k in TABS]
rest = [(label, f"{slug}.html") for slug, label in NAV if slug not in TABS]
mob = "const MOBILE_PAGES = Object.freeze([\n" + "".join(f'  ["{l}", "{h}", "{i}"],\n' for l, h, i in tabs) + "".join(f'  ["{l}", "{h}"],\n' for l, h in rest) + "]);\n"
js = re.sub(r"(/\* nav:mobile begin[^\n]*\*/\n).*?(/\* nav:mobile end \*/)", lambda m: m.group(1) + mob + m.group(2), js, flags=re.S)
open("shared.js", "w").write(js)
print("updated", changed, "page(s)")
