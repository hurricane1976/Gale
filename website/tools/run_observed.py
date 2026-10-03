#!/usr/bin/env python3
"""Run a bounded agent session and export metadata-only lifecycle events.

Claude streaming output is reduced to the original terminal result envelope
on stdout. Tool arguments, prompts and results never enter shared telemetry.
"""
import argparse
import hashlib
import json
import os
import re
import selectors
import signal
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from fleet_monitor import run_id, timestamp


def atomic(path, data):
    path = Path(path)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(data))
    os.replace(temp, path)


def execute(args):
    if re.fullmatch(r"\d{8}T\d{6}Z", args.ts):
        from datetime import datetime, timezone
        args.ts = timestamp(datetime.strptime(args.ts, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc).timestamp())
    started = time.time()
    ident = run_id({'host': 'gale', 'agent': args.agent, 'ts': args.ts})
    trace = hashlib.sha256(ident.encode()).hexdigest()[:32]
    meta = {'run_id': ident, 'task_id': ident, 'trace_id': trace, 'agent': args.agent, 'host': 'gale',
            'runtime': args.runtime, 'model': args.model, 'started_at': timestamp(started),
            'ts': args.ts, 'verification': 'unknown', 'attempt': 1}
    event_path = Path(args.events)
    event_path.parent.mkdir(parents=True, exist_ok=True)
    def emit(kind, **fields):
        # One bounded append per event, shared by independent agent processes.
        row = {**meta, 'event': kind, 'at': timestamp(time.time()), **fields}
        line = (json.dumps(row) + '\n').encode()
        import fcntl
        with event_path.open('ab') as stream:
            fcntl.flock(stream, fcntl.LOCK_EX)
            stream.write(line)
    sidecar = Path(args.artifact).with_suffix('.meta.json')
    atomic(sidecar, meta)
    emit('started')
    result = None
    process = subprocess.Popen(args.command, stdout=subprocess.PIPE, start_new_session=True,
                               env={**os.environ, 'GALE_RUN_ID': ident, 'TRACEPARENT': f'00-{trace}-0000000000000001-01'})
    selector = selectors.DefaultSelector()
    selector.register(process.stdout, selectors.EVENT_READ)
    buffer = b''
    last_progress = time.time()
    timed_out = False
    tools = {}
    def observe(line):
        nonlocal result, last_progress
        last_progress = time.time()
        try:
            event = json.loads(line)
        except ValueError:
            return
        if args.runtime == 'claude' and event.get('type') == 'result':
            result = event
        if args.runtime != 'claude':
            sys.stdout.buffer.write(line + b'\n'); sys.stdout.buffer.flush()
        message = event.get('message') or {}
        for block in message.get('content') or []:
            if not isinstance(block, dict):
                continue
            if block.get('type') == 'tool_use':
                tool = re.sub(r'[^A-Za-z0-9_.-]', '_', str(block.get('name') or 'unknown'))[:64]
                token = hashlib.sha256(str(block.get('id')).encode()).hexdigest()[:16]
                tools[block.get('id')] = (tool, token, time.time())
                emit('tool_started', tool=tool, span_id=token)
            elif block.get('type') == 'tool_result':
                tool, token, at = tools.pop(block.get('tool_use_id'), ('unknown', '', time.time()))
                emit('tool_finished', tool=tool, span_id=token, is_error=bool(block.get('is_error')),
                     duration_ms=round((time.time() - at) * 1000))
        if event.get('type') == 'tool_use' and args.runtime != 'claude':
            part = event.get('part') or {}
            tool = re.sub(r'[^A-Za-z0-9_.-]', '_', str(part.get('tool') or 'unknown'))[:64]
            state = part.get('state') or {}
            emit('tool_' + ('finished' if state.get('status') in ('completed', 'error') else 'started'),
                 tool=tool, is_error=state.get('status') == 'error')
    next_heartbeat = started + 30
    try:
        while selector.get_map():
            now = time.time()
            if now - started > args.timeout and not timed_out:
                os.killpg(process.pid, signal.SIGTERM); timed_out = True
            if timed_out and now - started > args.timeout + 60 and process.poll() is None:
                os.killpg(process.pid, signal.SIGKILL)
            for key, _ in selector.select(timeout=1):
                chunk = os.read(key.fd, 65536)
                if not chunk:
                    selector.unregister(key.fileobj)
                    continue
                buffer += chunk
                while b'\n' in buffer:
                    line, buffer = buffer.split(b'\n', 1)
                    observe(line)
                if len(buffer) > 8_000_000:
                    os.killpg(process.pid, signal.SIGTERM)
                    raise ValueError('runtime event exceeds size cap')
            if now >= next_heartbeat:
                emit('heartbeat', last_progress_at=timestamp(last_progress), elapsed_s=round(now-started))
                next_heartbeat = now + 30
        if buffer:
            observe(buffer)
        code = process.wait()
    except BaseException:
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL); process.wait()
        meta.update(is_error=True, terminal_reason='runner_error', finished_at=timestamp(time.time()))
        atomic(sidecar, meta); emit('failed', failure_class='execution')
        raise
    finally:
        selector.close()
    if args.runtime == 'claude' and result is not None:
        print(json.dumps(result))
        usage = result.get('usage') or {}
        emit('model_usage', input_tokens=usage.get('input_tokens'), output_tokens=usage.get('output_tokens'),
             cost_usd=result.get('total_cost_usd'))
    failed = bool(code or timed_out or (result or {}).get('is_error') or (args.runtime == 'claude' and result is None))
    reason = 'timeout' if timed_out else 'execution_error' if failed else 'completed'
    meta.update(finished_at=timestamp(time.time()), is_error=failed, terminal_reason=reason,
                duration_ms=round((time.time() - started) * 1000), last_progress_at=timestamp(last_progress), exit_code=code)
    atomic(sidecar, meta)
    emit('failed' if failed else 'finished', failure_class='timeout' if timed_out else 'execution' if failed else None)
    return 124 if timed_out else code or (1 if failed else 0)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--agent', required=True)
    parser.add_argument('--runtime', choices=['claude', 'opencode'], required=True)
    parser.add_argument('--model', required=True)
    parser.add_argument('--ts', required=True)
    parser.add_argument('--artifact', required=True)
    parser.add_argument('--events', default='/var/www/gale-api/task-events.jsonl')
    parser.add_argument('--timeout', type=int, default=2700)
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if args.command and args.command[0] == '--':
        args.command = args.command[1:]
    if not args.command:
        parser.error('runtime command required')
    sys.exit(execute(args))


if __name__ == '__main__':
    main()
