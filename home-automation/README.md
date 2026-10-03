# Gale Home integration

The Gale Home page is the monitoring frontend. Home Assistant owns device connections, history, native controls and automations. The page reports not connected until a real server and explicitly selected entities are configured.

## Installation choice

Gale has adequate resources but no installed container runtime. Choose either Home Assistant OS on a separate device/VM (includes apps), or Home Assistant Container on Gale (separate services must be managed for Eufy bridges; Container has no Home Assistant apps).

For Container, use compose.yaml after installing Docker Engine and Compose. Data belongs in /var/lib/gale-homeassistant/config, outside the website and agent backup/public directories. The version below is pinned; upgrade deliberately after backup. Launch with docker compose up -d, then create your own Home Assistant owner account at http://192.168.1.27:8123. Do not submit account passwords or tokens in chat.

## Device onboarding

- Lennox S40: install PeteRager/lennoxs30 as a custom integration. S40 supports local LAN connection only. Obtain the thermostat IP and reserve it in DHCP. Add Lennox S30/E30 in Home Assistant, choose Local, enter the thermostat IP. Existing Lennox app operation does not need to be replaced. Check actual device firmware against the integration's requirements before pairing.
- Rheem water heater: Settings > Devices & services > Add integration > Rheem EcoNet Products; sign in directly in Home Assistant. Supported entities include water-heater controls and available status/alerts. Current water temperature is not reported by this integration; do not fabricate it from the setpoint.
- Moen Flo: add Flo directly in Home Assistant; sign in there. Map flow, pressure, usage, alerts and valve state. Establish read-only monitoring before introducing valve actions.
- Eufy: obtain exact door-lock/camera/HomeBase model numbers. Built-in EufyHome is not the Eufy Security integration. Verify model support in fuatakgun/eufy_security; it requires eufy-security-ws. Container installations need a separately managed bridge. Prefer a separate shared-device account where supported; complete MFA/CAPTCHA in the integration setup. Video is model-dependent. Do not assume a lock has unlock support.
- Google Home: integrate actual underlying devices with Home Assistant. Google Assistant primarily exposes Home Assistant entities to Google Home; it does not bulk-import arbitrary third-party devices already linked in Google Home. Google Cast/Nest/Matter need their own appropriate integrations.

## Connect selected entities to Gale

Create /etc/gale/home-assistant.json outside the docroot with mode 0640, readable by the fleet API service's agent group. The trusted server configuration uses:

    {
      "url": "http://127.0.0.1:8123",
      "token_file": "/etc/gale/home-assistant.token",
      "dashboard_url": "http://192.168.1.27:8123",
      "entities": {
        "climate": ["climate.actual_thermostat_entity"],
        "water": ["water_heater.actual_rheem_entity", "sensor.actual_flo_flow_entity"],
        "security": ["lock.actual_lock_entity", "binary_sensor.actual_camera_motion_entity"]
      }
    }

Use actual entity IDs from Home Assistant rather than the examples. Store a Home Assistant bearer token in the token_file with mode 0640 and agent group. The bearer token can grant broad Home Assistant access; keep it server-side, never in the page or repository. Only explicitly allowlisted entities and a small attribute allowlist are returned by Gale. Home state reads require Gale's existing verified Tailscale operator identity; ordinary LAN readers can view setup information but must authenticate through Home Assistant for device controls. This does not grant unauthenticated LAN access to private home data.

Gale's Home page links to Home Assistant's own authenticated controls; it does not issue lock, water-valve or HVAC commands. A later control API should constrain entities/actions, validate ranges and require confirmation for lock/valve/security changes. The initial bridge does not expose camera streams or pictures.

References:
- https://www.home-assistant.io/installation/linux
- https://github.com/PeteRager/lennoxs30
- https://www.home-assistant.io/integrations/econet/
- https://www.home-assistant.io/integrations/flo/
- https://github.com/fuatakgun/eufy_security

## Installed on Gale — 2026-10-02
Docker Engine and Compose installed from Ubuntu repositories. Home Assistant 2026.9.4 container and Lennox custom integration 2026.8.0 installed. S40 IP 192.168.1.44 responds on port 443. Home Assistant onboarding still belongs to the user; Rheem/Flo/Eufy credentials are not collected by Gale. LAN/Tailscale firewall rules permit port 8123. The bridge config is present with empty entity allowlists; no token is created until the user connects an account.
