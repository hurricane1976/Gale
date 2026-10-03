#!/usr/bin/env python3
"""Headless fleet coverage and source health; run from a one-minute timer."""
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from fleet_monitor import feed_state, policy, task_events, epoch


def main():
    lines = []
    try:
        with urllib.request.urlopen('http://127.0.0.1:8793/reliability', timeout=35) as response:
            data = json.load(response)
        lines.append('gale_monitor_api_up 1')
        lines.append(f'gale_monitor_collector_fresh {1 if data["feeds"]["status"]["state"] == "ok" else 0}')
        lines.append(f'gale_monitor_reporting_agents {data["coverage"]["reporting"]}')
        lines.append(f'gale_monitor_expected_agents {data["coverage"]["expected"]}')
        lines.append(f'gale_monitor_cost_coverage_ratio {(data["cost"]["coverage_pct"] or 0)/100}')
        for source, state in data['sources'].items():
            lines.append(f'gale_monitor_source_fresh{{source="{source}"}} {1 if state["state"] == "ok" else 0}')
        for agent in data['coverage']['missing']:
            lines.append(f'gale_monitor_agent_reporting{{agent="{agent["agent"]}",fleet_host="{agent["host"]}"}} 0')
        for agent in data['registry']['agents']:
            if agent['lifecycle'] != 'active':
                continue
            if not any(a['agent'] == agent['name'] and a['host'] == agent['host'] for a in data['coverage']['missing']):
                lines.append(f'gale_monitor_agent_reporting{{agent="{agent["name"]}",fleet_host="{agent["host"]}"}} 1')
        for name, state in data['feeds'].items():
            if state.get('collected_at'):
                lines.append(f'gale_monitor_collection_unixtime{{feed="{name}"}} {epoch(state["collected_at"])}')
    except (OSError, ValueError, KeyError) as exc:
        print(f'fleet_bridge: API read failed: {type(exc).__name__}', file=sys.stderr)
        lines += ['gale_monitor_api_up 0', 'gale_monitor_collector_fresh 0']
    # Task progress is different from process heartbeat; idle agents emit no stalled alert.
    last = {}
    for event in task_events('/var/www/gale-api', limit=2000):
        last[event['run_id']] = event
    for event in last.values():
        if event.get('event') in ('started', 'heartbeat', 'tool_started', 'tool_finished', 'model_usage'):
            age = time.time() - (epoch(event.get('last_progress_at') or event.get('at')) or time.time())
            lines.append(f'gale_monitor_active_progress_age_seconds{{agent="{event["agent"]}"}} {age:.0f}')
    lines.append(f'gale_monitor_bridge_unixtime {time.time():.0f}')
    out = Path(os.environ.get('FLEET_TEXTFILE', '/var/snap/node-exporter/common/gale_monitor.prom'))
    temp = out.with_suffix('.prom.tmp')
    temp.write_text('\n'.join(lines) + '\n')
    os.replace(temp, out)
    out.chmod(0o644)


if __name__ == '__main__':
    main()
