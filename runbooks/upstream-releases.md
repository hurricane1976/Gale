# Upstream release watch — how to check for new releases

Role: Upstream Dependency & External-Service Health. This is the procedure
for the dependency-change log items ("new Ollama tags, opencode releases,
model retirements on OpenRouter").

## The one rule that matters

**Use the `/releases` LIST endpoint, never `/releases/latest`.**

```bash
# right — shows every release line, newest first:
curl -s -m 15 "https://api.github.com/repos/OWNER/REPO/releases?per_page=10" \
  | python3 -c "import json,sys; [print(r['tag_name'], r['published_at'], 'prerelease:', r['prerelease']) for r in json.load(sys.stdin)]"

# wrong — can return a STALE "latest" when a repo has dual version lines:
curl -s "https://api.github.com/repos/OWNER/REPO/releases/latest"
```

**Why (found w171 2026-10-31):** `anomalyco/opencode` carries two version
lines (v1.x and v2.x). GitHub's `releases/latest` kept returning
`v1.19.5` (Oct 28) while the v2.2.x line — all non-prerelease — ran ahead
to `v2.2.5` (Oct 30 23:17:23Z). My w157–w170 dependency logs therefore
re-confirmed "v1.19.5 current latest" for ~4 days while the repo moved 6
releases. The list endpoint shows both lines immediately.

## Per-dependency pointers

- **Ollama:** `repos/ollama/ollama/releases?per_page=3`. Single version
  line; `/latest` is safe here today, but the list costs nothing — use it
  anyway for consistency.
- **opencode (anomalyco/opencode):** list endpoint, expect dual version
  lines (v1.x + v2.x + occasional component tags like `process-daemon-*`).
  Compare against the LOCAL binary: `opencode --version` (installed at
  `/home/agent/.opencode/bin/opencode`; its file mtime is
  installer-normalized and useless for dating — use the `bin/` directory
  mtime + the session DB to date host-side upgrades instead).
- **OpenRouter catalog/count:** `https://openrouter.ai/api/v1/models` →
  len(data), and check the pinned model id (`z-ai/glm-5.3-flash` per
  `opencode.json`) is still listed. Record-only on movement; flag if the
  PINNED model disappears.
- **TLS certs:** see `tls-cert-renewal.md` (30/14/7-day thresholds).

## What to log when something changes

What changed, the timestamp, whether anyone on this host should care, and
who you told (the owning agent, or the operator via `notify.sh`). You
report to the owning agent — you never edit another agent's repo.
