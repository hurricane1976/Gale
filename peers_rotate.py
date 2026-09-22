#!/usr/bin/env python3
"""Two-phase token rotation edits for keys/peers.env. Helper for rotate_peer.sh.

Never prints a token except via the explicit `get` subcommand (which rotate_peer.sh
captures into a shell variable, not the terminal). The new token is read from the
CYCLONE_NEW_TOKEN environment variable, never argv, so it stays out of `ps`.

  peers_rotate.py stage  <peers.env> <NAME>   insert a NEW block ABOVE the existing one(s)
  peers_rotate.py finish <peers.env> <NAME>   drop the old block(s), keep the new one
  peers_rotate.py get    <peers.env> <NAME> old|new|addr

Why "above": peer_server.py accepts EVERY token in the file (each block's token maps to
its name), so during the changeover both tokens are accepted inbound. send_to_peer.sh
lets the LAST matching block win for outbound, so with the new block above the old one,
This agent keeps sending with the OLD token (which the peer still accepts) until `finish`.
"""
import os
import sys
import time

MARK = "rotation-pending"


def load(path):
    with open(path) as fh:
        return fh.read().split("\n")


def is_filler(line):
    s = line.strip()
    return s == "" or s.startswith("#")


def segments(lines):
    """[(name, start, end)] -- a segment is a NAME= line, the ADDR/TOKEN lines after it,
    and the contiguous comment/blank run directly above the NAME= line."""
    name_idx = [i for i, l in enumerate(lines) if l.startswith("NAME=")]
    starts = []
    for i in name_idx:
        s = i
        while s - 1 >= 0 and is_filler(lines[s - 1]) and (not starts or s - 1 >= starts[-1][1]):
            s -= 1
        starts.append((lines[i][5:].strip(), s, i))
    segs = []
    for k, (name, s, _i) in enumerate(starts):
        end = starts[k + 1][1] if k + 1 < len(starts) else len(lines)
        segs.append((name, s, end))
    return segs


def field(lines, seg, key):
    _n, s, e = seg
    val = None
    for l in lines[s:e]:
        if l.startswith(key + "="):
            val = l.split("=", 1)[1].strip()
    return val


def pending(lines, seg):
    _n, s, e = seg
    return any(MARK in l for l in lines[s:e] if l.strip().startswith("#"))


def save(path, lines):
    tmp = path + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as fh:
        fh.write("\n".join(lines))
    os.replace(tmp, path)
    os.chmod(path, 0o600)


def die(msg):
    sys.exit("peers_rotate: " + msg)


def main():
    if len(sys.argv) < 4:
        die(__doc__)
    cmd, path, name = sys.argv[1], sys.argv[2], sys.argv[3]
    lines = load(path)
    mine = [s for s in segments(lines) if s[0] == name]
    if not mine:
        die(f"no NAME={name} block in {path}")
    pend = [s for s in mine if pending(lines, s)]
    old = [s for s in mine if not pending(lines, s)]

    if cmd == "stage":
        if pend:
            die(f"{name} already has a rotation pending -- run finish first")
        tok = os.environ.get("CYCLONE_NEW_TOKEN", "")
        if len(tok) != 64 or any(c not in "0123456789abcdef" for c in tok):
            die("CYCLONE_NEW_TOKEN must be 64 lowercase hex chars")
        addr = field(lines, mine[-1], "ADDR")
        if not addr:
            die(f"{name} block has no ADDR")
        new = ["",
               f"# {name} {MARK} -- minted {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())} "
               f"via rotate_peer.sh. Old block below stays until `rotate_peer.sh finish {name}`.",
               f"NAME={name}", f"ADDR={addr}", f"TOKEN={tok}"]
        first = mine[0][1]
        save(path, lines[:first] + new + lines[first:])
    elif cmd == "finish":
        if len(pend) != 1:
            die(f"{name}: expected exactly one pending rotation, found {len(pend)}")
        if not old:
            die(f"{name}: no old block to retire")
        stamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        for _n, s, e in sorted(old, key=lambda x: -x[1]):
            del lines[s:e]
        # relabel the surviving block's marker comment
        pend2 = [s for s in segments(lines) if s[0] == name]
        assert len(pend2) == 1
        _n, s, e = pend2[0]
        for i in range(s, e):
            if lines[i].strip().startswith("#") and MARK in lines[i]:
                lines[i] = f"# {name} token rotated {stamp} (rotate_peer.sh finish)."
        save(path, lines)
    elif cmd == "get":
        what = sys.argv[4] if len(sys.argv) > 4 else ""
        if what == "addr":
            print(field(lines, mine[-1], "ADDR"))
        elif what == "new":
            if len(pend) != 1:
                die("no pending rotation")
            print(field(lines, pend[0], "TOKEN"))
        elif what == "old":
            if not old:
                die("no old block")
            print(field(lines, old[-1], "TOKEN"))
        else:
            die("get needs old|new|addr")
    else:
        die(__doc__)


if __name__ == "__main__":
    main()
