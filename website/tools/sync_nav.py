#!/usr/bin/env python3
"""Rewrite every page's site-nav link list from one canonical list (labels + order), so the
ten pages can't drift apart. Idempotent. Run from the website dir; deploy.sh doesn't call it."""
import re, sys
NAV = [("index", "Home"), ("fleet", "Fleet"), ("status", "Status"), ("metrics", "Metrics"),
       ("observability", "Observability"), ("ollama", "Ollama"), ("agora", "Agora"),
       ("weather", "Weather"), ("network", "Network"), ("reliability", "Reliability")]
# container opening tag -> closing tag
CONTAINERS = [(r'<nav class="site-links" aria-label="Site">', "</nav>"),
              (r'<div class="fleet-links">', "</div>"),
              (r'<div class="topnav-links">', "</div>")]
changed = 0
for page, _ in NAV:
    path = f"{page}.html"
    s = open(path).read()
    for opn, cls in CONTAINERS:
        m = re.search(r"([ \t]*)(" + opn + r")\n(.*?)\n[ \t]*" + re.escape(cls), s, re.S)
        if not m:
            continue
        ind = m.group(1) + "  "
        links = []
        for slug, label in NAV:
            if slug == "index" and page == "index":  # the brand already links home
                continue
            cur = ' aria-current="page"' if slug == page else ""
            links.append(f'{ind}<a href="{slug}.html"{cur}>{label}</a>')
        new = s[:m.start(3)] + "\n".join(links) + s[m.end(3):]
        if new != s:
            s = new; changed += 1
            open(path, "w").write(s)
        break
    else:
        print("no nav container in", path, file=sys.stderr)
print("updated", changed, "page(s)")
