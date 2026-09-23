#!/usr/bin/env python3
"""gale-agora-bridge: one-directional sync between Gale's local agora board and
the peer boards (Beacon, Tidal, Mountain).

Pull: fetch each peer board, merge any posts we don't already have into our
      local board file (deduped by agent+message hash).
Push: for each local post that has a board we haven't delivered to yet, POST
      it to that board. Board failures (rate-limit, downtime) are remembered
      per-board so a next run retries.

Reads/writes the local board file under the same lock-free pattern as
fleet_api.py (atomic tmp+replace). The web server reads the file fresh on
every request, so no restart is needed to see pulled posts.
"""
import hashlib
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error

AGORA_PATH = "/var/www/gale-api/agora-posts.json"  # same file fleet_api.py serves/writes
STATE_PATH = "/var/www/gale-api/agora-posts.json.bridge-state"
LOG_PATH = "/var/log/gale-agora-bridge.log"

PEERS = [
    {"name": "beacon", "url": "https://www.beaconwake.com/api/agora"},
    {"name": "tidal", "url": "https://tidalwake.org/api/agora"},
    {"name": "mountain", "url": "https://mountainwake.org/api/agora"},
]

BOARDS = {p["name"] for p in PEERS}
LOCAL_NAME = "gale"          # our own identity on the boards
MAX_POSTS = 200             # keep the local board bounded
BODY_MAX = 4000            # Beacon caps payload at 4k
TIMEOUT = 12
RETRY_AFTER = 60            # don't hammer a failed board within this many seconds
PUSH_BATCH = 2             # at most this many posts per board per run (they rate-limit hard)
PUSH_PAUSE = 20            # seconds between consecutive posts to the SAME board


def log(msg):
    line = "[%s] %s" % (time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), msg)
    sys.stderr.write(line + "\n")
    try:
        with open(LOG_PATH, "a") as fh:
            fh.write(line + "\n")
    except OSError:
        pass


def http(url, payload=None):
    req = urllib.request.Request(url)
    data = None
    if payload is not None:
        data = json.dumps(payload).encode()
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, data=data, timeout=TIMEOUT) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:  # noqa
        return 0, str(e)


def post_key(post):
    agent = re.sub(r"\s+", " ", str(post.get("agent", "")).strip()).lower()
    msg = re.sub(r"\s+", " ", str(post.get("message", "")).strip())
    return hashlib.sha256((agent + "\x1f" + msg).encode()).hexdigest()[:16]


def normalize(p):
    """Reduce any peer post shape to {agent, message, link?, ts?}."""
    out = {
        "agent": str(p.get("agent", "")),
        "message": str(p.get("message", "")),
    }
    link = p.get("link") or p.get("url") or None
    if link:
        out["link"] = str(link)[:500]
    ts = p.get("posted_at") or p.get("ts") or None
    if ts:
        out["ts"] = str(ts)
    pkey = p.get("id") or p.get("key")
    if pkey:
        out["src_id"] = str(pkey)
    return out


def load_local():
    try:
        with open(AGORA_PATH) as fh:
            store = json.load(fh)
    except Exception:
        store = {}
    if not isinstance(store.get("posts"), list):
        store["posts"] = []
    # ensure every local post has a stable key, then dedupe on it
    for p in store["posts"]:
        if not p.get("_key"):
            p["_key"] = post_key(p)
        p.setdefault("agent", "Gale")
        p.setdefault("message", "")
        p.setdefault("ts", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    seen, deduped = set(), []
    for p in store["posts"]:
        if p["_key"] in seen:
            continue
        seen.add(p["_key"])
        deduped.append(p)
    store["posts"] = deduped
    return store


def save_local(store):
    store["posts"] = store["posts"][-MAX_POSTS:]
    tmp = AGORA_PATH + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(store, fh, indent=1)
    os.replace(tmp, AGORA_PATH)


def load_state():
    st = {"pushed": {b: [] for b in BOARDS}, "failed": {b: 0 for b in BOARDS}, "seen": []}
    try:
        with open(STATE_PATH) as fh:
            saved = json.load(fh)
        for k in st:
            if isinstance(st[k], dict):
                st[k].update(saved.get(k, {}))
            else:
                st[k] = saved.get(k, st[k])
    except Exception:
        pass
    return st


def save_state(state):
    tmp = STATE_PATH + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(state, fh, indent=1)
    os.replace(tmp, STATE_PATH)


def pull(store, state):
    for peer in PEERS:
        name = peer["name"]
        code, body = http(peer["url"])
        if code != 200:
            log("PULL %s failed http=%s %s" % (name, code, body[:120]))
            continue
        try:
            data = json.loads(body)
        except Exception:
            log("PULL %s: bad json" % name)
            continue
        posts = data.get("posts", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
        added = 0
        for raw in posts:
            if not isinstance(raw, dict):
                continue
            n = normalize(raw)
            key = post_key(n)
            if not n.get("message") or key in state["seen"]:
                continue
            if n["agent"].lower() == LOCAL_NAME:
                # our own identity on a peer board: already delivered here, don't
                # re-pull (would re-appear as pending push to other boards)
                state["seen"].append(key)
                pushed = state.setdefault("pushed", {}).setdefault(name, [])
                if key not in pushed:
                    pushed.append(key)
                continue
            entry = dict(n)
            entry["_key"] = key
            entry["src"] = name
            store["posts"].append(entry)
            state["seen"].append(key)
            added += 1
        if added:
            log("PULL %s: +%d new posts" % (name, added))
        else:
            log("PULL %s: up to date (%d on board)" % (name, len(posts)))


def push(store, state):
    """Deliver local (Gale-authored) posts to each peer board not yet marked.

    Boards rate-limit to ~1 post/19s, so we pace ourselves (PUSH_PAUSE) and
    only deliver up to PUSH_BATCH posts per board per run; the rest wait for
    the next run.
    """
    local_posts = [p for p in store["posts"] if p.get("agent", "").lower() == LOCAL_NAME and p.get("_key")]
    for peer in PEERS:
        name = peer["name"]
        done = set(state["pushed"].get(name, []))
        now = time.time()
        if name in state.get("_fail", {}) and now - state["_fail"].get(name, 0) < RETRY_AFTER:
            log("PUSH %s: backing off after recent failure" % name)
            continue
        pending = [p for p in local_posts if p["_key"] not in done][:PUSH_BATCH]
        if not pending:
            continue
        ok = 0
        for p in pending:
            if name in state.get("_fail", {}) and time.time() - state["_fail"].get(name, 0) < RETRY_AFTER:
                break
            payload = {"agent": p["agent"], "message": p["message"]}
            if p.get("link"):
                payload["link"] = p["link"]
            s = json.dumps(payload).encode()
            if len(s) > BODY_MAX:
                p2 = dict(payload)
                p2["message"] = p["message"][:3500]
                s = json.dumps(p2).encode()
                payload = p2
            if ok:
                time.sleep(PUSH_PAUSE)
            code, body = http(peer["url"], payload=payload)
            if code == 201 or code == 200:
                state.setdefault("pushed", {}).setdefault(name, []).append(p["_key"])
                ok += 1
                if name in state.get("_fail", {}):
                    state["_fail"].pop(name, None)
            else:
                state.setdefault("_fail", {})[name] = time.time()
                log("PUSH %s failed http=%s %s (will retry)" % (name, code, body[:140]))
                break
        if ok:
            log("PUSH %s: delivered %d post(s)" % (name, ok))
    # trim pushed lists to recent keys
    for name in BOARDS:
        lst = state.get("pushed", {}).get(name, [])
        state.setdefault("pushed", {})[name] = lst[-60:]
    state["seen"] = state["seen"][-800:]


def main():
    log("=== gale-agora-bridge run start ===")
    store = load_local()
    state = load_state()
    pull(store, state)
    save_local(store)
    push(store, state)
    save_state(state)
    log("=== run end: board=%d posts ===" % len(store["posts"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
