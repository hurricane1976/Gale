"""Shared registry, provenance, cost coverage and reliability calculations.

No remote writes. Missing observations remain unknown. Display and alert
targets live in monitoring/policy.json, not independent browser constants.
"""
import json
import math
import os
import subprocess
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
POLICY_PATH = HERE / 'monitoring/policy.json'
REGISTRY_PATH = HERE.parent / 'fleet-provision/roster.json'


def policy():
    return json.loads(POLICY_PATH.read_text())


def epoch(value):
    try:
        return datetime.fromisoformat(str(value).replace('Z', '+00:00')).timestamp()
    except (ValueError, TypeError):
        return None


def timestamp(value):
    return datetime.fromtimestamp(value, timezone.utc).isoformat().replace('+00:00', 'Z')


def field_values(field, lo, hi):
    """Lists, ranges, stars and steps; reject unsupported expressions."""
    values = set()
    for part in field.split(','):
        base, _, step = part.partition('/')
        step = int(step or 1)
        if step < 1:
            raise ValueError('invalid cron step')
        if base == '*':
            start, end = lo, hi
        elif '-' in base:
            start, end = map(int, base.split('-'))
        else:
            start = int(base)
            end = hi if '/' in part else start
        if not lo <= start <= end <= hi:
            raise ValueError('cron field outside range')
        values.update(range(start, end + 1, step))
    return sorted(values)


def local_schedules(raw=None):
    if raw is None:
        result = subprocess.run(['crontab', '-l'], capture_output=True, text=True, timeout=5)
        if result.returncode:
            raise ValueError('scheduler unreadable')
        raw = result.stdout
    schedules = {}
    import re
    for line in raw.splitlines():
        parts = line.strip().split()
        if not parts or parts[0].startswith('#') or len(parts) < 6:
            continue
        match = re.search(r'/home/agent/([\w-]+)/wake\.sh', line)
        if not match:
            continue
        name = 'gale' if match[1] == 'agent' else match[1]
        if parts[2:5] != ['*', '*', '*']:
            schedules[name] = {'state': 'unknown', 'reason': 'non-daily schedule', 'cron': ' '.join(parts[:5])}
            continue
        minutes, hours = field_values(parts[0], 0, 59), field_values(parts[1], 0, 23)
        schedules[name] = {'state': 'ok', 'timezone': 'UTC', 'cron': ' '.join(parts[:5]),
                           'seconds': sorted(h * 3600 + m * 60 for h in hours for m in minutes)}
    return schedules


def registry():
    data = json.loads(REGISTRY_PATH.read_text())
    try:
        snapshot = read_json(Path(os.environ.get('GALE_API_DIR', '/var/www/gale-api')) / 'schedules.json')
        schedules = snapshot.get('schedules', {}) if feed_state(snapshot, max_age_s=180)['state'] == 'ok' else local_schedules()
    except (OSError, ValueError, subprocess.SubprocessError):
        schedules = {}
    now = time.time()
    midnight = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
    agents = []
    for item in data['agents']:
        name = item['name'].lower()
        schedule = schedules.get(name) if item['host'] == 'gale' else item.get('schedule')
        if schedule and schedule.get('seconds'):
            next_run = min(midnight + day * 86400 + sec for day in (0, 1)
                           for sec in schedule['seconds'] if midnight + day * 86400 + sec > now)
            schedule = {**schedule, 'next_at': timestamp(next_run)}
        agents.append({**item, 'id': item['host'] + ':' + name, 'name': name,
                       'owner': item.get('owner', item['host']), 'lifecycle': item.get('lifecycle', 'active'),
                       'schedule': schedule or {'state': 'unknown', 'reason': 'host schedule not reported'}})
    return {'schema': 'fleet-registry/v1', 'agents': agents, 'generated_at': timestamp(now)}


def run_id(row):
    import hashlib
    return hashlib.sha256('|'.join(str(row.get(k) or '') for k in ('host', 'agent', 'ts')).encode()).hexdigest()[:24]


def decorate_run(row):
    row = dict(row)
    row['run_id'] = run_id(row)
    row['task_id'] = row.get('task_id') or row['run_id']
    row['failure_class'] = failure_class(row)
    # Historical artifacts cannot prove that the task achieved its objective.
    row.setdefault('verification', 'unknown')
    return row


def failure_class(row):
    if not row.get('is_error'):
        return None
    reason = str(row.get('terminal_reason') or '').lower()
    for words, kind in [('quota rate_limit', 'quota'), ('auth permission', 'authentication'),
                        ('timeout timed_out', 'timeout'), ('tool', 'tool'), ('parse malformed', 'malformed_output')]:
        if any(word in reason for word in words.split()):
            return kind
    return 'execution'


def cost_summary(rows):
    known = [r for r in rows if isinstance(r.get('cost_usd'), (float, int))
             and not isinstance(r.get('cost_usd'), bool) and math.isfinite(r['cost_usd']) and r['cost_usd'] >= 0]
    total = sum(r['cost_usd'] for r in known)
    return {'known_usd': round(total, 6), 'estimated_usd': round(sum(r['cost_usd'] for r in known if r.get('cost_estimated')), 6),
            'priced_runs': len(known), 'unknown_runs': len(rows) - len(known),
            'coverage_pct': round(100 * len(known) / len(rows), 2) if rows else None,
            'mean_known_usd': round(total / len(known), 6) if known else None,
            'pricing_basis': 'reported marginal API spend; local compute and subscriptions excluded'}


def feed_state(data, ts_key='generated_at', max_age_s=120, now=None):
    now = time.time() if now is None else now
    if not isinstance(data, dict):
        return {'state': 'unknown', 'age_s': None, 'reason': 'feed unavailable'}
    ts = epoch(data.get(ts_key))
    if ts is None or ts > now + 60:
        return {'state': 'unknown', 'age_s': None, 'reason': 'missing or invalid collection timestamp'}
    age = max(0, now - ts)
    return {'state': 'stale' if age > max_age_s else 'ok', 'age_s': round(age),
            'collected_at': data[ts_key], 'max_age_s': max_age_s}


def coverage(rows, statuses):
    reported = {(r.get('host'), r.get('agent')) for r in rows}
    agents = registry()['agents']
    missing = [{ 'agent': a['name'], 'host': a['host'], 'owner': a['owner'],
                 'listener_state': statuses.get(a['name'].title(), {}).get('state', 'unknown'),
                 'lifecycle': a['lifecycle']} for a in agents
               if (a['host'], a['name']) not in reported and a['lifecycle'] == 'active']
    active = [a for a in agents if a['lifecycle'] == 'active']
    return {'expected': len(active), 'reporting': len(active) - len(missing), 'missing': missing,
            'reachable': sum(str(v.get('state', '')).startswith('up') for v in statuses.values())}


def slo(name, target, good, total, detail, state='ok'):
    actual = 100 * good / total if total else None
    allowed = total * (1 - target / 100)
    budget = 100 * (allowed - (total - good)) / allowed if allowed and total else None
    return {'name': name, 'target': target, 'actual': round(actual, 4) if actual is not None else None,
            'good': good, 'total': total, 'budget_remaining_pct': round(budget, 2) if budget is not None else None,
            'state': state if actual is not None else 'unknown', 'detail': detail}


def wake_slo(rows, schedule, now=None):
    now = time.time() if now is None else now
    cfg = policy()
    seconds = (schedule or {}).get('seconds')
    if not seconds:
        return slo('Wake start on time', cfg['wake_target_pct'], 0, 0, 'schedule unavailable')
    stamps = sorted(t for r in rows if (t := epoch(r.get('ts'))) is not None and t <= now)
    if not stamps:
        return slo('Wake start on time', cfg['wake_target_pct'], 0, 0, 'no start observations')
    grace = cfg['wake_grace_s']
    start = max(now - cfg['window_days'] * 86400, stamps[0])
    day = datetime.fromtimestamp(start, timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).timestamp()
    slots = []
    while day <= now:
        slots.extend(day + sec for sec in seconds if start <= day + sec and day + sec + grace <= now)
        day += 86400
    good = sum(any(slot <= t <= slot + grace for t in stamps) for slot in slots)
    return slo('Wake start on time', cfg['wake_target_pct'], good, len(slots),
               f'{good}/{len(slots)} scheduled Gale starts within {grace // 60}m; artifact start timestamps; since first observation, up to {cfg["window_days"]}d')


def prom_query(expr):
    url = 'http://127.0.0.1:9090/api/v1/query?' + urllib.parse.urlencode({'query': expr})
    with urllib.request.urlopen(url, timeout=3) as response:
        data = json.load(response)
    rows = data.get('data', {}).get('result', [])
    if data.get('status') != 'success' or not rows:
        return None
    value = float(rows[0]['value'][1])
    return value if math.isfinite(value) else None


def read_json(path):
    try:
        return json.loads(Path(path).read_text())
    except (OSError, ValueError):
        return None


def task_events(api_dir, ident=None, limit=100):
    """Bounded metadata-only lifecycle tail; never read prompts or arguments."""
    path = Path(api_dir) / 'task-events.jsonl'
    try:
        with path.open('rb') as stream:
            stream.seek(0, 2)
            stream.seek(max(0, stream.tell() - 512_000))
            lines = stream.read().decode('utf-8', 'replace').splitlines()
    except OSError:
        return []
    rows = []
    for line in lines:
        try:
            row = json.loads(line)
            if ident is None or row.get('run_id') == ident:
                rows.append(row)
        except ValueError:
            pass
    return rows[-limit:]


def reliability(rows, statuses, sources, api_dir):
    cfg = policy()
    now = time.time()
    status = read_json(Path(api_dir) / 'status.json')
    synth = read_json(Path(api_dir) / 'synthetics.json')
    status_state = feed_state(status, max_age_s=cfg['status_max_age_s'])
    synth_state = feed_state(synth, 'checked_at', cfg['synthetic_max_age_s'])
    reg = registry()
    gale = next((a for a in reg['agents'] if a['name'] == 'gale'), {})
    local = [r for r in rows if r.get('host') == 'gale']
    slos = [wake_slo([r for r in local if r.get('agent') == 'gale'], gale.get('schedule'), now)]
    # Historical probe-time availability; current batch/freshness is separate.
    avg = samples = None
    if synth_state['state'] == 'ok':
        try:
            avg = prom_query(f'avg_over_time(gale_synth_green_ratio[{cfg["window_days"]}d])')
            samples = prom_query(f'count_over_time(gale_synth_green_ratio[{cfg["window_days"]}d])')
        except (OSError, ValueError, KeyError):
            pass
    historical = slo('HTTPS synthetic availability', cfg['synthetic_target_pct'],
                     round(avg * samples, 2) if avg is not None and samples else 0,
                     int(samples or 0), f'{cfg["window_days"]}d probe-time window; {int(samples or 0)} scrape observations',
                     synth_state['state'])
    historical['coverage_pct'] = round(min(100, (samples or 0) * cfg['scrape_interval_s'] / (cfg['window_days'] * 86400) * 100), 2)
    if historical['state'] == 'ok' and historical['coverage_pct'] < 95:
        historical['state'] = 'degraded'
        historical['detail'] += '; partial history'
    slos.append(historical)
    recent = [r for r in rows if (epoch(r.get('ts')) or 0) >= now - cfg['window_days'] * 86400]
    slos.append(slo('Run execution success', cfg['execution_target_pct'],
                    sum(not r.get('is_error') for r in recent), len(recent),
                    f'{cfg["window_days"]}d terminal outcomes; task verification tracked separately',
                    'degraded' if any(s['state'] != 'ok' for s in sources.values()) else 'ok'))
    priced = cost_summary(recent)
    completed_days = [(datetime.fromtimestamp(now, timezone.utc) - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(1, 8)]
    totals = [sum(r.get('cost_usd') or 0 for r in recent if str(r.get('ts', '')).startswith(d)) for d in completed_days]
    average = sum(totals) / 7
    hygiene = (status or {}).get('hygiene') or {}
    collector = slo('Collector freshness', cfg['collector_target_pct'], 0, 0, 'historical collection samples unavailable')
    try:
        avg = prom_query(f'avg_over_time(gale_monitor_collector_fresh[{cfg["window_days"]}d])')
        count = prom_query(f'count_over_time(gale_monitor_collector_fresh[{cfg["window_days"]}d])')
        if avg is not None and count and status_state['state'] == 'ok':
            collector = slo('Collector freshness', cfg['collector_target_pct'], round(avg * count, 2), int(count), 'status collection within configured maximum age')
            collector['coverage_pct'] = round(min(100, count * cfg['scrape_interval_s'] / (cfg['window_days'] * 86400) * 100), 2)
            if collector['state'] == 'ok' and collector['coverage_pct'] < 95:
                collector['state'] = 'degraded'
                collector['detail'] += '; partial history'
    except (OSError, ValueError, KeyError):
        pass
    slos.append(collector)
    return {'schema': 'fleet-reliability/v1', 'generated_at': timestamp(now), 'policy': cfg, 'slos': slos,
            'coverage': coverage(rows, statuses), 'sources': sources, 'registry': reg,
            'feeds': {'status': status_state, 'synthetics': synth_state},
            'backup_inventory': read_json(Path(api_dir) / "backup-proof.json"),
            'synthetics': synth, 'backup': {**hygiene, 'collector': status_state},
            'cost': {**priced, 'known_daily_average_usd': round(average, 2),
                     'known_projection_30d_usd': round(average * 30, 2), 'daily_limit_usd': cfg['fleet_daily_limit_usd'],
                     'limit_basis': 'known marginal API spend; complete days only'},
            'outcomes': {'verified_runs': sum(r.get('verification') == 'passed' for r in recent),
                         'verification_unknown_runs': sum(r.get('verification') not in ('passed', 'failed') for r in recent)}}
