"""Tailnet operator identity, target leases, idempotency, and control audit.

Only nginx's overwritten source-IP header is trusted, and only when its
socket peer is loopback. No bearer credentials or request bodies are logged.
"""
import fcntl
import functools
import hashlib
import io
import ipaddress
import json
import os
import re
import secrets
import subprocess
import time
from pathlib import Path
from urllib.parse import urlsplit

from fleet_monitor import timestamp

API_DIR = Path(os.environ.get('GALE_API_DIR', '/var/www/gale-api'))
OPERATORS_PATH = Path(os.environ.get('GALE_OPERATORS_PATH', '/etc/gale/operators.json'))
_WHOIS = {}


def client_ip(handler):
    peer = handler.client_address[0]
    return handler.headers.get('X-Real-IP', peer) if peer in ('127.0.0.1', '::1') else peer


def actor(handler):
    ip = client_ip(handler)
    try:
        addr = ipaddress.ip_address(ip)
        if not (addr in ipaddress.ip_network('100.64.0.0/10') or addr in ipaddress.ip_network('fd7a:115c:a1e0::/48')):
            return None
        cached = _WHOIS.get(ip)
        if not cached or time.monotonic() - cached[0] > 30:
            result = subprocess.run(['tailscale', 'whois', '--json', ip], capture_output=True, text=True, timeout=3)
            data = json.loads(result.stdout) if result.returncode == 0 else {}
            login = (data.get('UserProfile') or {}).get('LoginName')
            # Tagged/service nodes are not human operators.
            if (data.get('Node') or {}).get('Tags'):
                login = None
            _WHOIS[ip] = (time.monotonic(), login)
        login = _WHOIS[ip][1]
        operators = json.loads(OPERATORS_PATH.read_text()).get('operators', [])
        return login if login in operators else None
    except (OSError, ValueError, subprocess.SubprocessError):
        return None


def access(handler):
    name = actor(handler)
    return {'role': 'operator' if name else 'reader', 'can_write': bool(name),
            'actor': name, 'method': 'verified Tailscale user; tagged nodes are read-only'}


def reply(handler, code, body):
    method = getattr(handler, '_send', None) or getattr(handler, '_json', None)
    return method(code, body)


def append_audit(row):
    API_DIR.mkdir(parents=True, exist_ok=True)
    with (API_DIR / 'control-audit.jsonl').open('a') as stream:
        fcntl.flock(stream, fcntl.LOCK_EX)
        stream.write(json.dumps(row) + '\n')


def guarded(paths=None):
    def decorate(fn):
        @functools.wraps(fn)
        def wrapped(handler):
            path = urlsplit(handler.path).path
            if paths is not None and path not in paths:
                return fn(handler)
            name = actor(handler)
            request_id = handler.headers.get('Idempotency-Key') or secrets.token_hex(16)
            event = {'at': timestamp(time.time()), 'actor': name or 'unverified', 'request_id': request_id[:80],
                     'method': handler.command, 'path': path, 'source_ip': client_ip(handler)}
            origin = handler.headers.get('Origin')
            cross_origin = handler.headers.get('Sec-Fetch-Site') == 'cross-site' or (origin and urlsplit(origin).netloc != handler.headers.get('Host'))
            if not name or cross_origin:
                append_audit({**event, 'status': 403, 'outcome': 'denied'})
                return reply(handler, 403, {'error': 'Operator identity required; use an authorized untagged Tailscale device.'})
            if not re.fullmatch(r'[A-Za-z0-9_-]{8,80}', request_id):
                return reply(handler, 400, {'error': 'invalid idempotency key'})
            try:
                length = int(handler.headers.get('Content-Length') or 0)
            except ValueError:
                length = -1
            if not 0 <= length <= 4096:
                return reply(handler, 400, {'error': 'body exceeds control limit'})
            raw = handler.rfile.read(length) if length else b''
            handler.rfile = io.BytesIO(raw)
            try:
                payload = json.loads(raw) if raw else {}
            except ValueError:
                return reply(handler, 400, {'error': 'invalid JSON'})
            if not isinstance(payload, dict):
                return reply(handler, 400, {'error': 'JSON object required'})
            # Log only selected control metadata, never chat content, arbitrary text or credentials.
            action = payload.get('action') or path.rsplit('/', 1)[-1]
            target = payload.get('agent') or payload.get('model') or path
            if not isinstance(action, str) or not isinstance(target, str):
                return reply(handler, 400, {'error': 'invalid action target'})
            event.update(action=action[:96], target=target[:128])
            store = API_DIR / '.control-jobs'
            store.mkdir(exist_ok=True)
            key = hashlib.sha256((name + request_id).encode()).hexdigest()
            digest = hashlib.sha256(handler.command.encode() + path.encode() + raw).hexdigest()
            job = store / (key + '.json')
            # Administrative model changes share one lease; chat has its own per-request scope.
            scope = 'ollama-admin' if path == '/action' else ('wake:' + target if path == '/wake' else path)
            lock_key = hashlib.sha256(scope.encode()).hexdigest()
            with (store / (lock_key + '.lock')).open('a') as lease:
                try:
                    fcntl.flock(lease, fcntl.LOCK_EX | fcntl.LOCK_NB)
                except BlockingIOError:
                    return reply(handler, 409, {'error': 'target has an active control operation; retry with the same key'})
                if job.exists():
                    prior = json.loads(job.read_text())
                    if prior.get('digest') != digest:
                        return reply(handler, 409, {'error': 'idempotency key reused for a different action'})
                    if prior.get('state') != 'completed':
                        return reply(handler, 409, {'error': 'previous operation has uncertain outcome; inspect audit before retrying'})
                    append_audit({**event, 'status': prior['status'], 'outcome': 'replayed'})
                    return reply(handler, prior['status'], prior['response'])
                job.write_text(json.dumps({'digest': digest, 'state': 'running', 'at': event['at']}))
                append_audit({**event, 'outcome': 'started'})
                handler._control_actor = name
                handler._control_request_id = request_id
                method_name = '_send' if hasattr(handler, '_send') else '_json'
                original = getattr(handler, method_name)
                def capture(code, body):
                    # Chat results contain content; do not persist or replay them.
                    private = path in ('/chat', '/chat/stream')
                    response = {'error': 'Chat result cannot be replayed; submit a new request.'} if private else body
                    job.write_text(json.dumps({'digest': digest, 'state': 'completed', 'status': 409 if private else code,
                                               'response': response, 'at': timestamp(time.time())}))
                    append_audit({**event, 'status': code, 'outcome': 'completed' if code < 400 else 'failed'})
                    return original(code, body)
                setattr(handler, method_name, capture)
                started = time.monotonic()
                try:
                    return fn(handler)
                except Exception:
                    append_audit({**event, 'outcome': 'uncertain', 'status': 500})
                    raise
                finally:
                    setattr(handler, method_name, original)
                    # Streamed responses bypass _send. Record completion without storing content.
                    if path == '/chat/stream':
                        job.write_text(json.dumps({'digest': digest, 'state': 'completed', 'status': 409,
                            'response': {'error': 'Streaming result cannot be replayed.'}}))
                        append_audit({**event, 'outcome': 'stream_closed', 'duration_ms': round((time.monotonic()-started)*1000)})
                    import sys
                    sys.stderr.write('CONTROL ' + json.dumps({**event, 'duration_ms': round((time.monotonic()-started)*1000)}) + '\n')
        return wrapped
    return decorate
