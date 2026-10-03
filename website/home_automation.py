"""Read-only Home Assistant bridge. Config and bearer token stay outside webroot."""
import json
import time
import threading
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

CONFIG = Path('/etc/gale/home-assistant.json')
ATTRIBUTES = ('friendly_name','unit_of_measurement','device_class','temperature','current_temperature',
              'target_temp_high','target_temp_low','hvac_action','hvac_modes','current_humidity',
              'operation_mode','min_temp','max_temp','battery_level')
_cache = {}
_lock = threading.Lock()

def settings():
    if not CONFIG.exists():
        return None
    d = json.loads(CONFIG.read_text())
    url = urlsplit(d['url'])
    if url.scheme not in ('http','https') or not url.hostname or url.username or url.password or url.query or url.fragment:
        raise ValueError('Invalid Home Assistant URL')
    ids = {group: [str(x) for x in values] for group, values in d.get('entities', {}).items() if group in ('climate','water','security')}
    if any(not isinstance(v,list) for v in d.get('entities',{}).values()) or sum(map(len,ids.values()))>100:
        raise ValueError('Invalid entity allowlist')
    return {**d,'entities':ids}

def snapshot(config):
    now = time.time()
    # Configuration changes must not replay data from a previous allowlist/server.
    key = json.dumps(config, sort_keys=True)
    with _lock:
        if _cache.get('key') == key and now-_cache.get('at',0)<20:
            return _cache['payload']
        token = Path(config['token_file']).read_text().strip()
        req = urllib.request.Request(config['url'].rstrip('/')+'/api/states', headers={'Authorization':'Bearer '+token})
        with urllib.request.urlopen(req, timeout=10) as response:
            raw = response.read(2_000_001)
        if len(raw)>2_000_000:
            raise ValueError('Oversized state response')
        states = json.loads(raw)
        if not isinstance(states,list):
            raise ValueError('Invalid state response')
        by_id = {s['entity_id']:s for s in states if isinstance(s,dict) and 'entity_id' in s}
        groups = {}
        for group, ids in config['entities'].items():
            groups[group] = []
            for ident in ids:
                state = by_id.get(ident,{})
                attrs = state.get('attributes') or {}
                groups[group].append({'entity_id':ident,'state':state.get('state','unavailable'),
                                     'last_updated':state.get('last_updated'),
                                     'attributes':{k:attrs[k] for k in ATTRIBUTES if k in attrs}})
        payload = {'state':'connected','collected_at':datetime.now(timezone.utc).isoformat(),
                   'groups':groups,'dashboard_url':safe_dashboard(config.get('dashboard_url'))}
        _cache.update(key=key,at=now,payload=payload)
        return payload

def safe_dashboard(url):
    parsed = urlsplit(url or '')
    return url if parsed.scheme in ('http','https') and parsed.hostname and not parsed.username and not parsed.password else None

def status(handler, access):
    try:
        config = settings()
        if config is None:
            return 200, {'state':'not_configured','groups':{},'dashboard_url':None}
        if not Path(config.get('token_file','/etc/gale/home-assistant.token')).is_file():
            return 200, {'state':'pairing_required','groups':{},'dashboard_url':safe_dashboard(config.get('dashboard_url'))}
        if not access(handler)['can_write']:
            return 403, {'state':'authentication_required','groups':{},'dashboard_url':safe_dashboard(config.get('dashboard_url'))}
        return 200,snapshot(config)
    except (OSError,ValueError,KeyError,TypeError):
        # No credentials, private state, upstream error bodies or config paths in responses.
        return 200, {'state':'unavailable','groups':{},'dashboard_url':None}
