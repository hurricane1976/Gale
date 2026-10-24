/* GALE — guest-mode.js: Guest mode page — one-tap guest Wi-Fi, camera view, log. */

import {boot,esc,setHTML,setText,tracedFetch,skeleton} from "./shared.js";
boot();

const $ = (id) => document.getElementById(id);

// Toggle guest mode on/off
async function toggleGuestMode(enabled) {
  try {
    await tracedFetch("/api/fleet/home/toggle", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        entity_id: "input_boolean.guest_mode",
        state: enabled ? "on" : "off"
      })
    });
  } catch {}
}

// Log guest arrival/departure
async function logGuestEvent(event) {
  const logs = JSON.parse(localStorage.getItem('gale-guest-logs') || '[]');
  logs.push({
    event, // "checkin" or "checkout"
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem('gale-guest-logs', JSON.stringify(logs));
}

// Render guest mode status
async function renderGuestStatus() {
  const statusEl = $("guest-status");
  const logEl = $("guest-log");
  const cameraEl = $("guest-cameras");

  try {
    const r = await tracedFetch("/api/fleet/home/status", { cache: "no-store" });
    if (r.ok) {
      const d = await r.json();
      const all = d.groups?.all_devices || [];
      const guestMode = all.find(d => d.entity_id === 'input_boolean.guest_mode');
      const guestWifi = all.find(d => d.entity_id === 'switch.guest_wifi');

      if (guestMode) {
        const enabled = guestMode.state === 'on';
        setHTML(statusEl, `
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <span class="pill" data-level="${enabled ? 'ok' : 'unknown'}">${enabled ? 'guest mode active' : 'guest mode inactive'}</span>
            <button type="button" class="btn ${enabled ? '' : 'primary'}" id="guest-toggle">${enabled ? 'Disable guest mode' : 'Enable guest mode'}</button>
            ${guestWifi ? `<span style="font-size:0.82rem;color:var(--text-dim)">Guest Wi-Fi: <strong style="color:var(--text)">${guestWifi.state}</strong></span>` : ''}
          </div>
        `);

        $("guest-toggle")?.addEventListener('click', async () => {
          const btn = $("guest-toggle");
          if (btn) {
            const enabled = btn.textContent.includes('Enable');
            btn.textContent = enabled ? 'Disable guest mode' : 'Enable guest mode';
            btn.className = enabled ? 'btn primary' : 'btn';
            await toggleGuestMode(enabled);
            logGuestEvent(enabled ? 'checkin' : 'checkout');

            // Update guest wifi toggle if available
            try {
              await tracedFetch("/api/fleet/home/toggle", {
                method: "POST", headers: {"Content-Type": "application/json"},
                body: JSON.stringify({entity_id: "switch.guest_wifi", state: enabled ? "on" : "off"})
              });
            } catch {}

            // Re-render after toggle
            renderGuestStatus();
          }
        });
      }
    }
  } catch {
    // If API fails, show basic toggle
    setHTML(statusEl,
      '<button type="button" class="btn primary" id="guest-toggle">Enable guest mode</button>'
    );

    $("guest-toggle")?.addEventListener('click', async () => {
      const btn = $("guest-toggle");
      if (btn) {
        const enabled = btn.textContent.includes('Enable');
        btn.textContent = enabled ? 'Disable guest mode' : 'Enable guest mode';
        btn.className = enabled ? 'btn primary' : 'btn';
        await toggleGuestMode(enabled);
        logGuestEvent(enabled ? 'checkin' : 'checkout');
      }
    });
  }

  // Show guest log
  const logs = JSON.parse(localStorage.getItem('gale-guest-logs') || '[]');
  if (logEl) {
    if (logs.length) {
      setHTML(logEl, logs.map(l =>
        `<div style="display:flex;gap:8px;align-items:center;padding:6px 0;border-bottom:1px solid var(--line)">
          <span style="color:var(--ok)">${l.event === 'checkin' ? '✓' : '↗'}</span>
          <span style="flex:1">${esc(l.event)} at ${new Date(l.timestamp).toLocaleString()}</span>
        </div>`
      ).join(''));
    } else {
      setText(logEl, 'No guest activity yet.');
    }
  }

  // Show guest camera view (cameras that aren't in privacy areas)
  if (cameraEl) {
    try {
      const r = await tracedFetch("/api/fleet/home/status", { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        const all = d.groups?.all_devices || [];
        const cameras = all.filter(d => d.domain === 'camera');
        if (cameras.length) {
          setHTML(cameraEl, cameras.map(c =>
            `<div class="target-card" data-level="info" style="cursor:pointer">
              <div class="target-top">
                <span>📹 ${esc(c.friendly_name || c.entity_id)}</span>
                <span class="pill" data-level="ok">${esc(c.state)}</span>
              </div>
            </div>`
          ).join(''));

          // Open camera stream in HA dashboard
          cameraEl.querySelectorAll('.target-card').forEach(card => {
            card.addEventListener('click', () => {
              const eid = card.dataset.entity_id || '';
              // Try to open camera entity page in HA
              window.open(`/api/fleet/home/dashboard/entity/${eid}`, '_blank');
            });
          });
        } else {
          setText(cameraEl, 'No cameras discovered yet.');
        }
      }
    } catch {
      setText(cameraEl, 'Could not load camera status.');
    }
  }
}

renderGuestStatus();
