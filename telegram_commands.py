#!/usr/bin/env python3
"""Gale fleet Telegram command handler -- canonical, one copy per agent.

Agent-agnostic: the agent name comes from this script's own directory and
monitored units are discovered from systemd, so every agent runs the SAME
file with zero per-agent edits. Single consumer of the bot's getUpdates
stream (cron via telegram_commands.sh).

  * "/<cmd> ..."  -> leading token exact-matched against HANDLERS. Matched:
    run the mapped handler, send its output back. Unmatched: reply with
    /help. Message text is NEVER passed to a shell -- handlers run fixed
    argv lists or urllib GETs with a strict api/ path allowlist.
  * inline keyboards (help/status replies and callback taps) route through
    the same closed command set.
  * plain "ack" / "ack all" marks queued Telegram items handled in ASK.md.
  * anything else -> appended to .telegram_incoming (surfaced next waking by
    check_replies.sh) and to ASK.md '## Open' until acked/resolved.

Security boundary:
  - hard chat-id gate: msg.chat.id AND msg.from.id must both equal
    TELEGRAM_CHAT_ID (callback queries: msg.from.id), else ignored.
  - the command set is a closed dict; first whitespace token matched
    literally (after stripping '/' and any '@botname' suffix).
  - no eval, no shell=True, no interpolation of inbound text into commands.
    /stop's pgrep pattern is built from this script's own directory only.

Env (exported by telegram_commands.sh): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
"""
import json
import os
import re
import shutil
import subprocess
import time
import urllib.parse
import urllib.request

DIR = os.path.dirname(os.path.abspath(__file__))
OFFSET_FILE = os.path.join(DIR, ".telegram_offset")
INCOMING_FILE = os.path.join(DIR, ".telegram_incoming")
ASK_FILE = os.path.join(DIR, "ASK.md")

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")

API = f"https://api.telegram.org/bot{TOKEN}"
MAX_MSG = 3800          # keep well under Telegram's 4096 hard limit
SITE = "http://127.0.0.1:8090"   # gale nginx: site + fleet API, same host


# --------------------------------------------------------------------------
# small helpers
# --------------------------------------------------------------------------
def run(argv, timeout=20):
    """Run a fixed argv list, return stripped stdout (stderr folded in)."""
    try:
        p = subprocess.run(argv, cwd=DIR, capture_output=True, text=True,
                           timeout=timeout)
        return (p.stdout + p.stderr).strip()
    except subprocess.TimeoutExpired:
        return f"(timed out after {timeout}s)"
    except Exception as e:  # noqa: BLE001 - report, don't crash the poller
        return f"(error: {e})"


def tg_get(method, params=None):
    url = f"{API}/{method}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def tg_post(method, payload):
    data = urllib.parse.urlencode(payload).encode()
    with urllib.request.urlopen(f"{API}/{method}", data=data, timeout=30) as r:
        return json.load(r)


def send(text, keyboard=None):
    """Reply to the operator. [AGENT] prefix names the sending agent."""
    text = text.strip() or "(no output)"
    if len(text) > MAX_MSG:
        text = text[:MAX_MSG] + "\n… (truncated)"
    payload = {"chat_id": CHAT_ID, "text": f"[{AGENT}] {text}"}
    if keyboard:
        payload["reply_markup"] = json.dumps(keyboard)
    try:
        with urllib.request.urlopen(f"{API}/sendMessage",
                                    data=urllib.parse.urlencode(payload).encode(),
                                    timeout=30):
            pass
    except Exception as e:  # noqa: BLE001
        print(f"send failed: {e}")


def read_offset():
    try:
        with open(OFFSET_FILE) as f:
            return int(f.read().strip() or 0)
    except (FileNotFoundError, ValueError):
        return 0


def write_offset(n):
    with open(OFFSET_FILE, "w") as f:
        f.write(str(n))


def newest(pattern_dir, suffix):
    try:
        names = sorted(n for n in os.listdir(pattern_dir) if n.endswith(suffix))
        return names[-1] if names else None
    except FileNotFoundError:
        return None


def discover_units():
    """Units to monitor: parse sysmon.py's SERVICES literal -- the fleet's
    single source of truth for what this host runs -- so every agent stays
    in sync with the collector without per-agent edits. Fallback covers a
    missing/unreadable sysmon.py."""
    fallback = ["gale-peer", "nginx", "tailscaled", "cron"]
    try:
        with open(os.path.join(SITE_ROOT, "sysmon.py"), errors="replace") as f:
            src = f.read()
        m = re.search(r"^SERVICES = \[(.*?)^\]", src, re.S | re.M)
        if not m:
            return fallback
        units = re.findall(r'"([a-z0-9.-]+)"', m.group(1))
        return [u for u in units if u] or fallback
    except Exception:  # noqa: BLE001
        return fallback


AGENT = os.path.basename(DIR)
SITE_ROOT = os.path.join(os.path.dirname(DIR), "agent", "website")
UNITS = discover_units()

KEYBOARD = {"inline_keyboard": [
    [{"text": "Status", "callback_data": "/status"},
     {"text": "Wake", "callback_data": "/wake"},
     {"text": "Logs", "callback_data": "/logs"}],
    [{"text": "Ask", "callback_data": "/ask"},
     {"text": "Notes", "callback_data": "/notes"},
     {"text": "Stop", "callback_data": "/stop"}],
]}


# --------------------------------------------------------------------------
# command handlers -- each takes the raw arg string, returns text
# --------------------------------------------------------------------------
def cmd_help(_arg):
    return (
        f"{AGENT} commands (operator only):\n"
        "/status    services, disk, uptime, tailnet IP, last backup, last wake\n"
        "/health    alias for /status\n"
        "/services  per-unit active state + restart counts\n"
        "/notes     the latest NOTES.md entry\n"
        "/ask       the open items in ASK.md\n"
        "/logs [n]  tail of the latest waking log (default 40 lines)\n"
        "/spend     cost/tokens from the fleet observability feed\n"
        "/curl api/...  GET a site API path, read-only\n"
        "/wake      trigger a wake.sh session now (flock no-ops a rerun)\n"
        "/stop      kill this agent's running opencode wake (hung session)\n"
        "/ack [all] mark the oldest open Telegram item acked in ASK.md\n"
        "/help      this list\n"
        "Anything that isn't a command is queued for the next waking and "
        "added to ASK.md."
    )


def cmd_status(_arg):
    lines = []

    head = run(["git", "log", "-1", "--format=%h %cr"])
    dirty = run(["git", "status", "--porcelain"])
    lines.append(f"git: {head}" + ("" if not dirty else f"; {len(dirty.splitlines())} uncommitted"))

    svc_bad = [s for s in UNITS if run(["systemctl", "is-active", s], timeout=20) != "active"]
    lines.append("services: all active" if not svc_bad
                 else "services DOWN: " + ", ".join(svc_bad))

    ts_ip = run(["tailscale", "ip", "-4"], timeout=20)
    lines.append(f"tailnet: {ts_ip}")

    try:
        du = shutil.disk_usage("/")
        lines.append(f"disk: {round(du.used / du.total * 100)}% used, "
                     f"{round(du.free / 1e9)}G free")
    except Exception:  # noqa: BLE001
        pass

    try:
        with open("/proc/uptime") as f:
            up = float(f.read().split()[0])
        d, rem = divmod(int(up), 86400)
        with open("/proc/loadavg") as f:
            load = f.read().split()[0]
        lines.append(f"uptime: {d}d {rem // 3600}h, load {load}")
    except Exception:  # noqa: BLE001
        pass

    if os.path.exists("/var/run/reboot-required"):
        lines.append("reboot-required: SET")

    snap = newest(os.path.join(DIR, "backups"), ".tar.gz")
    lines.append(f"last backup: {snap or 'none yet'}")
    wake = newest(os.path.join(DIR, "logs"), ".json")
    lines.append(f"last wake: {wake[:-5] if wake else 'none yet'}")

    return f"{AGENT} status\n" + "\n".join(lines)


def cmd_services(_arg):
    rows = []
    for unit in UNITS:
        state = run(["systemctl", "is-active", unit], timeout=20) or "unknown"
        nrest = run(["systemctl", "show", unit, "--property=NRestarts",
                     "--value"], timeout=20)
        rows.append(f"{unit}: {state} (restarts {nrest or '?'})")
    return f"{AGENT} services\n" + ("\n".join(rows) or "(none)")


def cmd_notes(_arg):
    with open(os.path.join(DIR, "NOTES.md")) as f:
        text = f.read()
    idx = text.rfind("\n## ")
    entry = text[idx:].strip() if idx != -1 else text[-MAX_MSG:]
    if len(entry) > MAX_MSG:
        entry = entry[:MAX_MSG] + "\n… (entry truncated)"
    return entry


def cmd_ask(_arg):
    with open(ASK_FILE) as f:
        text = f.read()
    start = text.find("## Open")
    if start == -1:
        return "(no '## Open' section in ASK.md)"
    nxt = text.find("\n## ", start + 1)
    return text[start:nxt].strip() if nxt != -1 else text[start:].strip()


def cmd_logs(arg):
    try:
        n = max(1, min(int(arg or 40), 200))
    except ValueError:
        n = 40
    name = newest(os.path.join(DIR, "logs"), ".log")
    if not name:
        return "(no waking logs yet)"
    try:
        with open(os.path.join(DIR, "logs", name), errors="replace") as f:
            body = "".join(f.readlines()[-n:])
    except OSError as e:
        return f"(could not read {name}: {e})"
    body = body.strip() or "(empty log)"
    if len(body) > MAX_MSG:
        body = body[-MAX_MSG:]
    return f"tail -{n} {name}\n{body}"


def cmd_spend(_arg):
    try:
        with urllib.request.urlopen(f"{SITE}/api/fleet/observability",
                                    timeout=30) as r:
            d = json.load(r)
    except Exception as e:  # noqa: BLE001
        return f"(observability feed unreachable: {e})"
    t = d.get("totals") or {}
    rows = [f"runs: {d.get('count', '?')}",
            f"total cost: ${float(t.get('cost_usd') or 0):.4f}",
            f"mean cost/run: ${float(t.get('mean_cost_usd') or 0):.4f}"]
    if t.get("total_tokens") is not None:
        rows.append(f"tokens: {int(t['total_tokens']):,}")
    for a in t.get("agents") or []:
        if isinstance(a, dict) and str(a.get("agent", "")).lower() == AGENT:
            rows.append(f"{AGENT} cost 24h: ${float(a.get('cost_24h') or 0):.4f} "
                        f"({a.get('runs_24h', '?')} runs)")
    return "\n".join(rows)


def cmd_curl(arg):
    """Read-only GET against the site's own API. Allowlist: must match
    api/<path>, no '..', no query strings. GET only, urllib only."""
    path = (arg or "").strip().strip("/").split("?")[0]
    if not re.fullmatch(r"api/[A-Za-z0-9_\-./]*", path) or ".." in path:
        return "usage: /curl api/<path>  (site API GET only; no query strings)"
    try:
        with urllib.request.urlopen(f"{SITE}/{path}", timeout=30) as r:
            body = r.read(6000).decode(errors="replace")
    except Exception as e:  # noqa: BLE001
        return f"(fetch failed: {e})"
    if len(body) > MAX_MSG - 200:
        body = body[:MAX_MSG - 200] + "\n… (truncated)"
    return f"GET /{path}\n{body or '(empty body)'}"


def cmd_wake(_arg):
    try:
        subprocess.Popen(["./wake.sh"], cwd=DIR,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                         start_new_session=True)
        return ("wake.sh triggered. It holds a flock, so if a session is "
                "already running this call is a no-op (logged to "
                "logs/wake-skipped.log).")
    except Exception as e:  # noqa: BLE001
        return f"(failed to start wake.sh: {e})"


def cmd_stop(_arg):
    """Operator escape hatch for a hung waking. The pgrep pattern embeds only
    this agent's own directory -- never anything typed in the message."""
    pattern = f"opencode run.*--dir {DIR}"
    try:
        p = subprocess.run(["pgrep", "-f", pattern], capture_output=True,
                           text=True, timeout=20)
        pids = [int(x) for x in p.stdout.split() if x.strip().isdigit()]
    except Exception as e:  # noqa: BLE001
        return f"(pgrep failed: {e})"
    if not pids:
        return f"no running opencode wake found for {AGENT}"
    killed = []
    for pid in pids:
        try:
            pgid = int(run(["ps", "-o", "pgid=", "-p", str(pid)],
                           timeout=15) or 0)
            if pgid > 1:
                os.killpg(pgid, 15)
                killed.append(pgid)
        except (ValueError, ProcessLookupError, PermissionError):
            continue
    return (f"stopped {AGENT}'s wake: killed pgid(s) {', '.join(map(str, killed))}"
            if killed else f"found pids {pids} but could not signal them")


def cmd_ack(arg):
    """Mark queued Telegram items handled: 'ack' does the oldest, 'ack all'
    does every unacked one. Pure ASK.md edit -- no shell, no git."""
    try:
        with open(ASK_FILE) as f:
            doc = f.read()
        marker = "\n## Open\n"
        i = doc.find(marker)
        if i == -1:
            return "(no '## Open' section in ASK.md)"
        j = doc.find("\n## ", i + len(marker))
        if j == -1:
            j = len(doc)
        section = doc[i + len(marker):j]
        stamp = time.strftime("%Y-%m-%d %H:%MZ", time.gmtime())
        want_all = arg.strip().lower() == "all"
        out, count = [], 0
        for line in section.splitlines():
            s = line.strip()
            if (s.startswith("- **Telegram (") and "~~" not in s
                    and (count == 0 or want_all)):
                out.append(f"~~{s}~~ _(acked {stamp}Z)_")
                count += 1
            else:
                out.append(line)
        if not count:
            return "(no unacked Telegram items under '## Open')"
        with open(ASK_FILE, "w") as f:
            f.write(doc[:i + len(marker)] + "\n".join(out) + "\n" + doc[j:].lstrip("\n"))
        return f"acked {count} item(s)."
    except Exception as e:  # noqa: BLE001
        return f"(ack failed: {e})"


HANDLERS = {
    "help": cmd_help,
    "status": cmd_status,
    "health": cmd_status,
    "services": cmd_services,
    "notes": cmd_notes,
    "ask": cmd_ask,
    "logs": cmd_logs,
    "spend": cmd_spend,
    "curl": cmd_curl,
    "wake": cmd_wake,
    "stop": cmd_stop,
    "ack": cmd_ack,
}


# --------------------------------------------------------------------------
def log_incoming(date_epoch, text):
    with open(INCOMING_FILE, "a") as f:
        f.write(f"[{date_epoch}] {text}\n")


def append_to_ask(text):
    """Add a freeform Telegram message as a dated bullet under ASK.md '## Open'.

    Durable counterpart to the .telegram_incoming queue (which check_replies.sh
    prints once and clears). Best-effort -- any failure is swallowed so the
    poller/ack path still runs.
    """
    try:
        one_line = " ".join(text.split())
        if len(one_line) > 500:
            one_line = one_line[:500] + " …"
        stamp = time.strftime("%Y-%m-%d", time.gmtime())
        bullet = f"- **Telegram ({stamp}, via /commands):** {one_line}\n"

        with open(ASK_FILE) as f:
            doc = f.read()
        marker = "\n## Open\n"
        i = doc.find(marker)
        if i == -1:
            return
        j = doc.find("\n## ", i + len(marker))
        if j == -1:
            j = len(doc)
        head, section, tail = doc[:i + len(marker)], doc[i + len(marker):j], doc[j:]
        if "_(nothing open)_" in section:
            section = "\n" + bullet
        else:
            section = section.rstrip("\n") + "\n" + bullet
        with open(ASK_FILE, "w") as f:
            f.write(head + section + "\n" + tail.lstrip("\n"))
    except Exception as e:  # noqa: BLE001 - never let this wedge message handling
        print(f"append_to_ask failed: {e}")


def dispatch(text):
    """Run a '/cmd arg' string through the handler table (shared by typed
    messages and inline-keyboard taps)."""
    token = text.split()[0][1:].split("@")[0].lower()
    arg = text[len(text.split()[0]):].strip()
    handler = HANDLERS.get(token)
    if handler:
        print(f"cmd: /{token}")
        return handler(arg)
    return f"unknown command '/{token}'.\n\n" + cmd_help("")


def handle_message(msg):
    frm = msg.get("from", {}) or {}
    if str(msg.get("chat", {}).get("id")) != str(CHAT_ID):
        return
    if str(frm.get("id")) != str(CHAT_ID):
        return  # chat id right but sender isn't the operator -- ignore
    text = (msg.get("text") or "").strip()
    if not text:
        return

    if text.startswith("/"):
        token = text.split()[0][1:].split("@")[0].lower()
        if token in HANDLERS:
            send(dispatch(text), KEYBOARD if token in ("help", "status") else None)
        else:
            send(dispatch(text))  # unknown -> help text
        return

    # not a command: "ack" resolves open items, anything else is queued for
    # the next waking + dropped as a durable ASK.md bullet.
    low = text.lower()
    if low == "ack" or low.startswith("ack all"):
        send(cmd_ack(text))
        return
    log_incoming(msg.get("date", int(time.time())), text)
    append_to_ask(text)
    send("Logged for the next waking (queued + added to ASK.md). "
         "Reply 'ack' to mark open items handled, /help for commands.")


def handle_callback(upd):
    """Inline keyboard taps route through the same closed command set."""
    cb = upd.get("callback_query") or {}
    if str((cb.get("from") or {}).get("id")) != str(CHAT_ID):
        return
    try:
        tg_post("answerCallbackQuery", {"callback_query_id": cb["id"]})
    except Exception:  # noqa: BLE001 - answering is best-effort
        pass
    data = cb.get("data") or ""
    if not data.startswith("/"):
        return
    token = data.split()[0][1:].split("@")[0].lower()
    print(f"callback: {data}")
    try:
        send(dispatch(data), KEYBOARD if token in ("help", "status") else None)
    except Exception as e:  # noqa: BLE001
        print(f"callback error: {e}")


def main():
    if not TOKEN or not CHAT_ID:
        print("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set")
        return
    offset = read_offset()
    try:
        data = tg_get("getUpdates", {"offset": offset + 1, "timeout": 0})
    except Exception as e:  # noqa: BLE001
        print(f"getUpdates failed: {e}")
        return
    if not data.get("ok"):
        print(f"getUpdates not ok: {data}")
        return

    max_id = None
    for upd in data.get("result", []):
        max_id = upd["update_id"]
        msg = upd.get("message") or upd.get("edited_message")
        if msg:
            try:
                handle_message(msg)
            except Exception as e:  # noqa: BLE001 - one bad msg shouldn't wedge the loop
                print(f"handle_message error: {e}")
        if upd.get("callback_query"):
            try:
                handle_callback(upd)
            except Exception as e:  # noqa: BLE001
                print(f"callback error: {e}")
    if max_id is not None:
        write_offset(max_id)


if __name__ == "__main__":
    main()
