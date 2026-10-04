#!/usr/bin/env python3
"""Failure-oriented checks for fleet evidence and administrative controls."""
import io
import json
import subprocess
import sys
import tempfile
import time
import unittest
from contextlib import ExitStack
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import fleet_monitor as monitor
import control_access as controls
import fleet_api as fleet
import ollama_api
import yaml


class MonitoringTests(unittest.TestCase):
    def test_absent_and_stale_are_not_healthy(self):
        self.assertEqual(monitor.feed_state(None)['state'], 'unknown')
        self.assertEqual(monitor.feed_state({'generated_at': 'bogus'})['state'], 'unknown')
        self.assertEqual(monitor.feed_state({'generated_at': monitor.timestamp(10)}, now=200)['state'], 'stale')
        self.assertEqual(monitor.feed_state({'generated_at': monitor.timestamp(1000)}, now=200)['state'], 'unknown')

    def test_unknown_spend_is_not_free_or_in_mean(self):
        data = monitor.cost_summary([{'cost_usd': 2}, {'cost_usd': None}, {'cost_usd': 0}])
        self.assertEqual(data['known_usd'], 2)
        self.assertEqual(data['unknown_runs'], 1)
        self.assertEqual(data['mean_known_usd'], 1)
        self.assertIsNone(monitor.cost_summary([{'cost_usd': None}])['mean_known_usd'])
        self.assertEqual(monitor.cost_summary([{'cost_usd': float('nan')}])['unknown_runs'], 1)

    def test_actual_scheduler_steps_and_offsets(self):
        raw = '24 */4 * * * /home/agent/bora/wake.sh\n0 0,6,12,18 * * * /home/agent/agent/wake.sh\n'
        schedules = monitor.local_schedules(raw)
        self.assertEqual(schedules['bora']['seconds'], [h * 3600 + 24 * 60 for h in range(0, 24, 4)])
        self.assertEqual(schedules['gale']['seconds'], [0, 21600, 43200, 64800])

    def test_late_wake_does_not_count_as_on_time(self):
        now = 4 * 86400 + 14 * 3600
        rows = [{'ts': monitor.timestamp(4 * 86400)}, {'ts': monitor.timestamp(4 * 86400 + 6 * 3600 + 1200)}]
        result = monitor.wake_slo(rows, {'seconds': [0, 21600, 43200, 64800]}, now)
        self.assertEqual(result['total'], 3)
        self.assertEqual(result['good'], 1)
        self.assertLess(result['budget_remaining_pct'], 0)

    def test_missing_synthetic_feed_has_no_percentage(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(monitor, 'registry', return_value={'agents': []}), patch.object(monitor, 'prom_query', return_value=None):
            result = monitor.reliability([], {}, {}, directory)
        synth = next(s for s in result['slos'] if s['name'] == 'HTTPS synthetic availability')
        self.assertIsNone(synth['actual'])
        self.assertEqual(synth['state'], 'unknown')
        self.assertEqual(result['backup']['collector']['state'], 'unknown')

    def test_direct_and_relay_are_reconciled_once(self):
        relay = {'runs': [{'host': 'tidal', 'agent': 'river', 'ts': '2026-10-01T12:00:00Z', 'cost_usd': None}]}
        direct = [dict(relay['runs'][0], cost_usd=2), {'host': 'tidal', 'agent': 'brook', 'ts': '2026-10-01T13:00:00Z', 'cost_usd': 1}]
        with tempfile.TemporaryDirectory() as directory, patch.object(fleet, '_SOURCE_CACHE_PATH', str(Path(directory)/'cache')), patch.object(fleet, 'local_runs_full', return_value=[]), patch.object(fleet, 'remote_envelope', return_value=relay), patch.object(fleet, 'DIRECT_FEEDS', {'tidal': 'unused'}), patch.object(fleet, '_DIRECT', {'tidal': {}}), patch.object(fleet, 'direct_feed_rows', return_value=direct), patch.dict(fleet._FLEET_CACHE, {'ts': 0}):
            _, rows, _ = fleet.merged_runs()
        self.assertEqual(len(rows), 2)
        self.assertEqual(next(r['cost_usd'] for r in rows if r['agent'] == 'river'), 2)
        self.assertEqual(len({r['run_id'] for r in rows}), 2)

    def test_alert_vocabulary_and_shared_slo_target(self):
        root = Path(__file__).resolve().parent.parent / 'monitoring'
        rules = []
        for path in list(root.glob('*.rules.yml')) + [root / 'gale.rules.yml']:
            rules.extend(r for g in yaml.safe_load(path.read_text())['groups'] for r in g['rules'] if 'alert' in r)
        self.assertTrue(all(r['labels']['severity'] in ('critical', 'warning', 'info') for r in rules))
        target_error = f'{1 - monitor.policy()["synthetic_target_pct"] / 100:.6f}'
        burns = [r for r in rules if r['alert'] in ('GaleSynthFastBurn', 'GaleSynthSlowBurn')]
        self.assertEqual(len(burns), 2)
        self.assertTrue(all(target_error in r['expr'] for r in burns))
        config = yaml.safe_load((root/'alertmanager.yml').read_text())
        self.assertIn('severity="critical"', config['route']['routes'][0]['matchers'])
        self.assertTrue(all(r.get('equal') for r in config['inhibit_rules']))


class ControlTests(unittest.TestCase):
    def handler(self, raw=b'{"agent":"gale"}', ip='127.0.0.1', headers=None):
        replies = []
        return SimpleNamespace(path='/wake', command='POST', client_address=(ip, 1),
            headers={'Content-Length': str(len(raw)), 'Host': 'gale.test', **(headers or {})},
            rfile=io.BytesIO(raw), _send=lambda status, body: replies.append((status, body)), replies=replies)

    def test_source_header_cannot_override_external_socket(self):
        h = self.handler(ip='192.168.1.9', headers={'X-Real-IP':'100.66.39.59'})
        self.assertEqual(controls.client_ip(h), '192.168.1.9')

    def test_unverified_writer_denied(self):
        touched = []
        fn = controls.guarded()(lambda h: touched.append(True))
        with patch.object(controls, 'actor', return_value=None), patch.object(controls, 'append_audit'):
            h = self.handler(); fn(h)
        self.assertFalse(touched)
        self.assertEqual(h.replies[0][0], 403)

    def test_cross_origin_operator_denied(self):
        with patch.object(controls, 'actor', return_value='operator'), patch.object(controls, 'append_audit'):
            h = self.handler(headers={'Origin':'https://other.test'})
            controls.guarded()(lambda h: self.fail('mutation must not run'))(h)
        self.assertEqual(h.replies[0][0], 403)

    def test_duplicate_control_executes_once_and_body_is_not_logged(self):
        touched = []
        def action(h):
            touched.append(True); h._send(200, {'ok':True})
        fn = controls.guarded()(action)
        with tempfile.TemporaryDirectory() as directory, patch.object(controls, 'API_DIR', Path(directory)), patch.object(controls, 'actor', return_value='operator'):
            for _ in range(2):
                h = self.handler(headers={'Idempotency-Key':'request-test-123'}); fn(h)
                self.assertEqual(h.replies[0][0], 200)
            audit = (Path(directory)/'control-audit.jsonl').read_text()
            self.assertIn('replayed', audit)
            self.assertNotIn('Content-Length', audit)
            h = self.handler(b'{"agent":"zephyr"}', headers={'Idempotency-Key':'request-test-123'}); fn(h)
            self.assertEqual(h.replies[0][0], 409)
        self.assertEqual(len(touched), 1)


class WakeTests(unittest.TestCase):
    def test_display_name_resolves_to_dir_for_gale(self):
        proc = SimpleNamespace(pid=1234)
        with tempfile.TemporaryDirectory() as directory:
            with ExitStack() as stack:
                stack.enter_context(patch.object(fleet, '_wake_live_seconds', return_value=0))
                stack.enter_context(patch.object(fleet, '_wake_flock_held', return_value=False))
                stack.enter_context(patch.object(fleet.subprocess, 'Popen', return_value=proc))
                stack.enter_context(patch.object(fleet, 'WAKE_LOG_PATH', str(Path(directory) / 'wake.jsonl')))
                # "gale" is display-only; its dir is "agent" (previously 400 unknown agent)
                self.assertEqual(fleet.wake_post({'agent': 'gale'})[0], 202)
                # a dir-name still resolves too
                self.assertEqual(fleet.wake_post({'agent': 'zephyr'})[0], 202)
                # an unknown name is still rejected
                self.assertEqual(fleet.wake_post({'agent': 'definitely-not-an-agent'})[0], 400)


class LifecycleTests(unittest.TestCase):
    def _patch_store(self, directory):
        return patch.object(fleet, 'LIFECYCLE_PATH', str(Path(directory) / 'incident-lifecycle.json'))

    def test_transitions_forward_and_terminal_is_immutable(self):
        with tempfile.TemporaryDirectory() as directory:
            with self._patch_store(directory):
                self.assertEqual(fleet.lifecycle_post({'incident_id': 'ix', 'stage': 'investigating'})[0], 200)
                self.assertEqual(fleet.lifecycle_post({'incident_id': 'ix', 'stage': 'root-caused'})[0], 200)
                code, resp = fleet.lifecycle_post({'incident_id': 'ix', 'stage': 'verified'})
                self.assertEqual(code, 200)
                self.assertTrue(resp['muted'])
                code, err = fleet.lifecycle_post({'incident_id': 'ix', 'stage': 'investigating'})
                self.assertEqual(code, 409)

    def test_invalid_stage_and_id_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            with self._patch_store(directory):
                self.assertEqual(fleet.lifecycle_post({'incident_id': 'ix', 'stage': 'nope'})[0], 400)
                self.assertEqual(fleet.lifecycle_post({'incident_id': '', 'stage': 'verified'})[0], 400)

    def test_reset_clears_even_from_terminal(self):
        with tempfile.TemporaryDirectory() as directory:
            with self._patch_store(directory):
                self.assertEqual(fleet.lifecycle_post({'incident_id': 'ix', 'stage': 'verified'})[0], 200)
                code, resp = fleet.lifecycle_post({'incident_id': 'ix', 'stage': 'reset'})
                self.assertEqual(code, 200)
                self.assertTrue(resp['reset'])
                # after reset an incident is open again: forward transition allowed
                self.assertEqual(fleet.lifecycle_post({'incident_id': 'ix', 'stage': 'investigating'})[0], 200)
                self.assertEqual(fleet.lifecycle_read()['lifecycle']['ix']['stage'], 'investigating')

    def test_expired_entry_prunes_on_read(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'incident-lifecycle.json'
            path.write_text(json.dumps({'incidents': {'stale': {'stage': 'verified', 'until': 1.0, 'since': 0.0, 'updated': 0.0}}}))
            with self._patch_store(directory):
                self.assertEqual(fleet.lifecycle_read()['lifecycle'], {})
                self.assertEqual(json.loads(path.read_text()), {'incidents': {}})

    def test_read_reflects_prior_write(self):
        with tempfile.TemporaryDirectory() as directory:
            with self._patch_store(directory):
                fleet.lifecycle_post({'incident_id': 'ix', 'stage': 'investigating'})
                got = fleet.lifecycle_read()['lifecycle']['ix']
                self.assertEqual(got['stage'], 'investigating')



class RunnerTests(unittest.TestCase):
    def test_stream_preserves_result_and_excludes_tool_arguments(self):
        runtime = "import json; print(json.dumps({'type':'assistant','message':{'content':[{'type':'tool_use','id':'one','name':'Bash','input':{'command':'PRIVATE_TEST_VALUE'}}]}})); print(json.dumps({'type':'user','message':{'content':[{'type':'tool_result','tool_use_id':'one','content':'PRIVATE_TEST_VALUE'}]}})); print(json.dumps({'type':'result','result':'PRIVATE_TEST_VALUE','is_error':False,'total_cost_usd':0.2,'usage':{'input_tokens':10,'output_tokens':5}}))"
        with tempfile.TemporaryDirectory() as directory:
            args = [sys.executable, str(Path(__file__).parent/'run_observed.py'), '--agent','gale','--runtime','claude','--model','test-model','--ts','20261002T120000Z','--artifact',str(Path(directory)/'20261002T120000Z.json'),'--events',str(Path(directory)/'events.jsonl'),'--',sys.executable,'-c',runtime]
            result = subprocess.run(args, capture_output=True, text=True, timeout=10)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(result.stdout)['total_cost_usd'], .2)
            events = (Path(directory)/'events.jsonl').read_text()
            self.assertNotIn('PRIVATE_TEST_VALUE', events)
            self.assertIn('tool_started', events)
            self.assertIn('tool_finished', events)
            self.assertIn('model_usage', events)
            meta = json.loads((Path(directory)/'20261002T120000Z.meta.json').read_text())
            self.assertEqual(meta['verification'], 'unknown')
            self.assertEqual(meta['ts'], '2026-10-02T12:00:00Z')


class OllamaAlertsTests(unittest.TestCase):
    # 1_800_000_000 == 2027-01-15T08:00:00Z
    NOW = 1_800_000_000

    def _feed(self, stack, lines):
        directory = stack.enter_context(tempfile.TemporaryDirectory())
        path = Path(directory) / 'ollama-history.jsonl'
        path.write_text(''.join(json.dumps(line) + '\n' for line in lines))
        stack.enter_context(patch.object(fleet, 'OLLAMA_HISTORY_PATH', str(path)))
        return path

    def _sample(self, ts, reachable, gpu=None, **extra):
        rec = {'ts': ts, 'reachable': reachable}
        if gpu is not None:
            rec['gpu'] = gpu
        rec.update(extra)
        return rec

    def test_healthy_latest_sample_raises_nothing(self):
        gpu = {'ok': True, 'stale': False, 'generated_at': '2027-01-15T08:00:00Z'}
        with ExitStack() as stack:
            self._feed(stack, [
                {'ts': '2027-01-15T06:00:00Z', 'type': 'server_down'},
                {'ts': '2027-01-15T06:05:00Z', 'type': 'server_up'},
                self._sample('2027-01-15T07:59:30Z', True, gpu),
                self._sample('2027-01-15T08:00:00Z', True, gpu),
            ])
            self.assertEqual(fleet.ollama_alerts(now=self.NOW), [])

    def test_fresh_down_sample_raises_crit_with_quantized_duration(self):
        gpu = {'ok': True, 'stale': False, 'generated_at': '2027-01-15T07:47:00Z'}
        with ExitStack() as stack:
            self._feed(stack, [
                self._sample('2027-01-15T07:45:00Z', True, gpu),
                self._sample('2027-01-15T07:47:00Z', False, gpu),
                self._sample('2027-01-15T07:59:30Z', False, gpu),
                self._sample('2027-01-15T08:00:00Z', False, gpu),
            ])
            alerts = fleet.ollama_alerts(now=self.NOW)
        self.assertEqual([(a['sev'], a['kind']) for a in alerts], [('crit', 'inference-down')])
        self.assertIn('down ~10m', alerts[0]['text'])

    def test_stale_evidence_never_claims_outage(self):
        gpu = {'ok': True, 'stale': False, 'generated_at': '2027-01-15T07:50:00Z'}
        with ExitStack() as stack:
            self._feed(stack, [
                self._sample('2027-01-15T07:49:00Z', False, gpu),
                self._sample('2027-01-15T07:50:00Z', False, gpu),
            ])
            alerts = fleet.ollama_alerts(now=self.NOW)
        self.assertEqual([a['kind'] for a in alerts], ['inference-monitor-stale'])

    def test_missing_or_empty_history_is_monitor_stale(self):
        with ExitStack() as stack:
            stack.enter_context(patch.object(fleet, 'OLLAMA_HISTORY_PATH', '/nonexistent/ollama-history.jsonl'))
            self.assertEqual([a['kind'] for a in fleet.ollama_alerts(now=self.NOW)], ['inference-monitor-stale'])
        with ExitStack() as stack:
            self._feed(stack, [{'ts': '2027-01-15T07:00:00Z', 'type': 'server_up'}])
            self.assertEqual([a['kind'] for a in fleet.ollama_alerts(now=self.NOW)], ['inference-monitor-stale'])

    def test_gpu_collector_staleness_raises_warn(self):
        with ExitStack() as stack:
            self._feed(stack, [
                self._sample('2027-01-15T08:00:00Z', True,
                             {'ok': True, 'stale': True, 'generated_at': '2027-01-15T05:37:00Z'}),
            ])
            alerts = fleet.ollama_alerts(now=self.NOW)
        self.assertEqual([(a['sev'], a['kind']) for a in alerts], [('warn', 'inference-collector-stale')])
        self.assertIn('stale ~3h', alerts[0]['text'])

    def test_event_lines_and_torn_tail_are_ignored(self):
        gpu = {'ok': True, 'stale': False, 'generated_at': '2027-01-15T08:00:00Z'}
        with ExitStack() as stack:
            path = self._feed(stack, [
                self._sample('2027-01-15T08:00:00Z', True, gpu),
            ])
            with open(path, 'a') as fh:
                fh.write('{"ts": "2027-01-15T08:00:30Z", "type": "serv')  # torn final line
                fh.write('\n' + json.dumps({'ts': '2027-01-15T08:00:30Z', 'type': 'server_down'}) + '\n')
            self.assertEqual(fleet.ollama_alerts(now=self.NOW), [])

    def test_three_crashes_in_24h_warns_flapping(self):
        gpu = {'ok': True, 'stale': False, 'generated_at': '2027-01-15T08:00:00Z'}
        with ExitStack() as stack:
            self._feed(stack, [
                {'ts': '2027-01-14T07:00:00Z', 'type': 'server_down'},   # >24h old: not counted
                {'ts': '2027-01-15T02:00:00Z', 'type': 'server_down'},
                {'ts': '2027-01-15T02:10:00Z', 'type': 'server_up'},
                {'ts': '2027-01-15T05:00:00Z', 'type': 'server_down'},
                {'ts': '2027-01-15T05:20:00Z', 'type': 'server_up'},
                {'ts': '2027-01-15T07:00:00Z', 'type': 'server_down'},
                {'ts': '2027-01-15T07:30:00Z', 'type': 'server_up'},
                self._sample('2027-01-15T08:00:00Z', True, gpu),
            ])
            alerts = fleet.ollama_alerts(now=self.NOW)
        self.assertEqual([a['kind'] for a in alerts], ['inference-flapping'])
        self.assertIn('crashed 3x in 24h', alerts[0]['text'])

    def test_fresh_generation_failure_raises_crit_degraded(self):
        gpu = {'ok': True, 'stale': False, 'generated_at': '2027-01-15T08:00:00Z'}
        with ExitStack() as stack:
            self._feed(stack, [
                self._sample('2027-01-15T08:00:00Z', True, gpu,
                             gen_ok=False, gen_ms=5020, gen_err='llama runner terminated'),
            ])
            alerts = fleet.ollama_alerts(now=self.NOW)
        self.assertEqual([(a['sev'], a['kind']) for a in alerts], [('crit', 'inference-degraded')])
        self.assertIn('generation failing', alerts[0]['text'])

    def test_inconclusive_gen_or_absent_field_raises_nothing(self):
        gpu = {'ok': True, 'stale': False, 'generated_at': '2027-01-15T08:00:00Z'}
        with ExitStack() as stack:
            self._feed(stack, [
                self._sample('2027-01-15T08:00:00Z', True, gpu, gen_ok=None, gen_ms=25100),
            ])
            self.assertEqual(fleet.ollama_alerts(now=self.NOW), [])
        with ExitStack() as stack:
            self._feed(stack, [   # pre-probe sample format: no gen keys at all
                self._sample('2027-01-15T08:00:00Z', True, gpu),
            ])
            self.assertEqual(fleet.ollama_alerts(now=self.NOW), [])

    def test_stale_generation_failure_not_claimed(self):
        gpu = {'ok': True, 'stale': False, 'generated_at': '2027-01-15T08:00:00Z'}
        with ExitStack() as stack:
            self._feed(stack, [
                self._sample('2027-01-15T07:49:00Z', True, gpu, gen_ok=False, gen_ms=8000),
            ])
            alerts = fleet.ollama_alerts(now=self.NOW)
        self.assertEqual([a['kind'] for a in alerts], ['inference-monitor-stale'])

    def test_unreachable_sample_never_claims_degraded(self):
        gpu = {'ok': True, 'stale': False, 'generated_at': '2027-01-15T08:00:00Z'}
        with ExitStack() as stack:
            self._feed(stack, [
                self._sample('2027-01-15T08:00:00Z', False, gpu, gen_ok=False, gen_ms=0),
            ])
            alerts = fleet.ollama_alerts(now=self.NOW)
        self.assertEqual([a['kind'] for a in alerts], ['inference-down'])


class GenProbeTests(unittest.TestCase):
    def test_classification_matrix(self):
        classify = ollama_api._classify_gen
        self.assertIs(classify(200, {'done': True}), True)
        self.assertIs(classify(200, {'done': True, 'response': ''}), True)
        self.assertIs(classify(500, {'error': 'CUDA error: unspecified launch failure'}), False)
        self.assertIs(classify(503, {'error': 'llama runner process has terminated'}), False)
        self.assertIs(classify(0, {'error': 'URLError: timeout'}), None)          # transport
        self.assertIs(classify(200, {'done': False}), None)                        # partial/odd 200
        self.assertIs(classify(404, {'error': 'model not found'}), None)           # race, not hardware
        self.assertIs(classify(200, None), None)

    def test_probe_fragment_shapes(self):
        with patch.object(ollama_api, 'fetch_json', return_value=(200, {'done': True})):
            frag = ollama_api._gen_probe('qwen3.8:27b')
        self.assertIs(frag['gen_ok'], True)
        self.assertNotIn('gen_err', frag)
        self.assertGreaterEqual(frag['gen_ms'], 0)

        with patch.object(ollama_api, 'fetch_json', return_value=(500, {'error': 'CUDA error: unspecified launch failure'})):
            frag = ollama_api._gen_probe('qwen3.8:27b')
        self.assertIs(frag['gen_ok'], False)
        self.assertIn('CUDA error', frag['gen_err'])

        with patch.object(ollama_api, 'fetch_json', return_value=(0, {'error': 'URLError: timed out'})):
            frag = ollama_api._gen_probe('qwen3.8:27b')
        self.assertIsNone(frag['gen_ok'])
        self.assertNotIn('gen_err', frag)


if __name__ == '__main__':
    unittest.main(verbosity=2)
