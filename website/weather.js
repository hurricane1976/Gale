/* GALE weather tracker — Woodbridge VA default, any location via search.
   Data: Open-Meteo forecast + geocoding + air quality (no key),
   NWS alerts (US only), RainViewer radar tiles on Leaflet.
   No build step, vanilla ES module. Units + location persist in localStorage. */
import { boot, refreshEffects, setStormIntensity, clamp, chartTooltip, whenNear } from "./shared.js";

boot();

/* the conditions sky (wxsky.js) — one lazy module handle shared by the
   live-conditions hook and the 7-day hover preview */
let wxskyMod = null;
const wxsky = () => (wxskyMod ||= import("./wxsky.js").catch(() => null));
const wxPreview = (day) => wxsky().then((m) => m && m.previewWxSky(day)).catch(() => {});

const WOODBRIDGE = { name: "Woodbridge, VA", lat: 38.6582, lon: -77.2497, admin: "Prince William County", country: "US" };
const PRESETS = [
  WOODBRIDGE,
  { name: "Washington, DC", lat: 38.8951, lon: -77.0364 },
  { name: "Richmond, VA", lat: 37.5407, lon: -77.436 },
  { name: "Norfolk, VA", lat: 36.8508, lon: -76.2859 },
  { name: "New York, NY", lat: 40.7128, lon: -74.006 },
  { name: "Chicago, IL", lat: 41.8781, lon: -87.6298 },
  { name: "Denver, CO", lat: 39.7392, lon: -104.9903 },
  { name: "Seattle, WA", lat: 47.6062, lon: -122.3321 },
  { name: "London, UK", lat: 51.5074, lon: -0.1278 },
  { name: "Tokyo, JP", lat: 35.6762, lon: 139.6503 },
];

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

let loc = store.get("gale-wx-loc", WOODBRIDGE);
let imperial = store.get("gale-wx-imperial", true);   // °F + mph
let windMph = store.get("gale-wx-windmph", true);
let radarFrames = [];
let radarHost = "https://tilecache.rainviewer.com";
let radarOverlay = null;
let radarTileErrors = 0;
let map = null, mapMarker = null, warningOverlay = null;
let radarSource = store.get("gale-wx-radar", "noaa"), radarRequest = 0, observationRequest = 0;
const NOAA_RADAR = "https://mapservices.weather.noaa.gov/eventdriven/rest/services/radar/radar_base_reflectivity_time/ImageServer";
const NOAA_WARNINGS = "https://mapservices.weather.noaa.gov/eventdriven/services/WWA/watch_warn_adv/MapServer/WMSServer";
let playTimer = null, frameIdx = 0, playDelay = 900;

function setMapState(message, ready = false) {
  const el = $("wx-map-state");
  if (!el) return;
  el.textContent = message;
  el.hidden = ready;
}

const WMO = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"], 48: ["Icy fog", "🌫️"], 51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"], 56: ["Freezing drizzle", "🌧️"], 57: ["Freezing drizzle", "🌧️"],
  61: ["Light rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "⛈️"],
  66: ["Freezing rain", "🌧️"], 67: ["Freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"], 73: ["Snow", "❄️"], 75: ["Heavy snow", "❄️"], 77: ["Snow grains", "❄️"],
  80: ["Light showers", "🌦️"], 81: ["Showers", "🌧️"], 82: ["Violent showers", "⛈️"],
  85: ["Light snow showers", "🌨️"], 86: ["Snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Storm + hail", "⛈️"], 99: ["Storm + hail", "⛈️"],
};
const wmo = (c) => WMO[c] || ["—", "🌡️"];
const t = (c) => imperial ? Math.round(c * 9 / 5 + 32) : Math.round(c);
const tUnit = () => imperial ? "°F" : "°C";
const wnd = (kmh) => windMph ? `${Math.round(kmh / 1.609)} mph` : `${Math.round(kmh)} km/h`;
const compass = (d) => ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"][Math.round(d / 22.5) % 16];
const fmtTime = (iso, opts) => {
  try { return new Date(iso).toLocaleTimeString([], opts || { hour: "numeric", minute: "2-digit" }); }
  catch { return "—"; }
};
const fmtDay = (iso) => new Date(iso + "T12:00:00").toLocaleDateString([], { weekday: "short" });

function showError(msg) {
  const box = $("wx-error");
  box.hidden = false;
  box.querySelector("p").textContent = msg;
}

/* ---------- location controls ---------- */
function renderPresets() {
  const el = $("wx-presets");
  const recents = store.get("gale-wx-recent", []);
  const all = [...PRESETS, ...recents.filter((r) => !PRESETS.some((p) => p.name === r.name)).slice(0, 4)];
  el.innerHTML = "";
  for (const p of all.slice(0, 10)) {
    const b = document.createElement("button");
    b.className = "chip" + (Math.abs(p.lat - loc.lat) < 0.01 && Math.abs(p.lon - loc.lon) < 0.01 ? " on" : "");
    b.type = "button";
    b.textContent = p.name;
    b.setAttribute("aria-pressed", b.classList.contains("on") ? "true" : "false");
    b.addEventListener("click", () => setLocation(p));
    el.appendChild(b);
  }
}

function rememberRecent(p) {
  const recents = store.get("gale-wx-recent", []).filter((r) => r.name !== p.name);
  recents.unshift({ name: p.name, lat: p.lat, lon: p.lon });
  store.set("gale-wx-recent", recents.slice(0, 6));
}

function setLocation(p) {
  // strip angle brackets: name flows into a Leaflet tooltip (innerHTML sink)
  loc = { name: String(p.name).replace(/[<>]/g, ""), lat: +p.lat, lon: +p.lon };
  store.set("gale-wx-loc", loc);
  rememberRecent(loc);
  renderPresets();
  loadAll();
  if (map) loadRadarFrames();  // before the map exists, initMap() loads the frames
  if (map) { map.setView([loc.lat, loc.lon], 8); placeMarker(); }
  $("wx-nws-link").href = `https://radar.weather.gov/?settings=v1_${loc.lon}_${loc.lat}_8`;
}

let searchTimer = 0;
function initSearch() {
  const input = $("wx-search"), box = $("wx-results");
  input.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (q.length < 2) { box.hidden = true; return; }
    searchTimer = setTimeout(async () => {
      try {
        const r = await fetch(`api/fleet/weather/geocode?name=${encodeURIComponent(q)}&count=7&language=en&format=json`);
        const j = await r.json();
        const items = j.results || [];
        box.innerHTML = "";
        if (!items.length) {
          box.innerHTML = `<li class="wx-no-result">No matches for “${q.replace(/[<>&"]/g, "")}”</li>`;
        }
        for (const it of items) {
          const li = document.createElement("li");
          li.setAttribute("role", "option");
          li.tabIndex = 0;
          const sub = [it.admin1, it.country].filter(Boolean).join(" · ");
          li.innerHTML = `<strong></strong><span></span>`;
          li.querySelector("strong").textContent = it.name;
          li.querySelector("span").textContent = sub;
          const pick = () => {
            setLocation({ name: it.country === "United States" && it.admin1 ? `${it.name}, ${it.admin1}` : `${it.name}${it.country ? ", " + it.country : ""}`, lat: it.latitude, lon: it.longitude });
            box.hidden = true; input.value = ""; input.blur();
          };
          li.addEventListener("click", pick);
          li.addEventListener("keydown", (e) => { if (e.key === "Enter") pick(); });
          box.appendChild(li);
        }
        box.hidden = false;
      } catch { /* offline — ignore */ }
    }, 280);
  });
  document.addEventListener("click", (e) => {
    if (!box.hidden && !box.contains(e.target) && e.target !== input) box.hidden = true;
  });
  input.addEventListener("keydown", (e) => { if (e.key === "Escape") box.hidden = true; });
}

function initUnitToggles() {
  const bt = $("wx-unit-temp"), bw = $("wx-unit-wind");
  const paint = () => {
    bt.textContent = imperial ? "°F" : "°C";
    bt.setAttribute("aria-pressed", imperial ? "true" : "false");
    bw.textContent = windMph ? "mph" : "km/h";
    bw.setAttribute("aria-pressed", windMph ? "true" : "false");
  };
  bt.addEventListener("click", () => { imperial = !imperial; store.set("gale-wx-imperial", imperial); paint(); loadAll(true); });
  bw.addEventListener("click", () => { windMph = !windMph; store.set("gale-wx-windmph", windMph); paint(); loadAll(true); });
  paint();
}

function initGeoButtons() {
  $("wx-home").addEventListener("click", () => setLocation(WOODBRIDGE));
  $("wx-geo").addEventListener("click", () => {
    if (!navigator.geolocation) return showError("Geolocation is not available in this browser.");
    const btn = $("wx-geo");
    btn.disabled = true; btn.textContent = "⌖ locating…";
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        btn.disabled = false; btn.textContent = "⌖ Use my location";
        const { latitude, longitude } = pos.coords;
        let name = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        try {
          const g = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`).then((x) => x.json());
          if (g.city || g.locality) name = [g.city || g.locality, g.principalSubdivision].filter(Boolean).join(", ");
        } catch { /* keep coords */ }
        setLocation({ name, lat: latitude, lon: longitude });
      },
      (err) => { btn.disabled = false; btn.textContent = "⌖ Use my location"; showError("Could not get your location: " + err.message); },
      { timeout: 12000 }
    );
  });
}

/* ---------- forecast + AQ ---------- */
let lastData = null, forecastRequest = 0, alertRequest = 0;
async function loadAll(soft) {
  const request=++forecastRequest;
  $("wx-updated").textContent = "updating…";
  loadObservations();
  renderAlerts();
  const { lat, lon } = loc;
  const fUrl = `api/fleet/weather/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
    `&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max,wind_speed_10m_max` +
    `&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto&forecast_days=7`;
  const aqUrl = `api/fleet/weather/airquality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide&timezone=auto`;
  try {
    const [f, aq] = await Promise.all([
      fetch(fUrl).then((r) => { if (!r.ok) throw new Error("forecast " + r.status); return r.json(); }),
      fetch(aqUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    if(request!==forecastRequest)return;
    lastData = { f, aq };
    renderCurrent(f);
    renderHourly(f);
    renderDaily(f);
    renderAQ(aq);
    update3D(f);
    const staleMin = f && f._gale && f._gale.stale_age_s ? Math.round(f._gale.stale_age_s / 60) : 0;
    $("wx-updated").textContent = "updated " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }) + (staleMin ? ` (cached, ${staleMin}min old)` : "");
    $("wx-error").hidden = true;
  } catch (e) {
    if(request!==forecastRequest)return;
    showError("Weather fetch failed (" + e.message + "). Check connection — retrying automatically.");
  }
}

/* ---------------- 3D forecast terrain (lazy; hidden where WebGL / motion isn't available) ---------------- */
let WX3D;   // undefined = not tried, null = unavailable
async function update3D(f) {
  try {
    const sec = document.getElementById("sec-wx3d");
    if (!sec || WX3D === null) return;
    if (WX3D === undefined) {
      WX3D = null;
      let gl = null;
      try { gl = document.createElement("canvas").getContext("webgl"); } catch {}
      const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!gl || reduced || document.documentElement.dataset.saver === "1") { sec.hidden = true; return; }
      await whenNear(sec);
      WX3D = (await import("./weather3d.js")).initWeather3D();
      if (!WX3D) { sec.hidden = true; return; }
    }
    WX3D.update(f, imperial);
  } catch { /* decoration only */ }
}

function renderCurrent(f) {
  const c = f.current, d = f.daily;
  const [desc, icon] = wmo(c.weather_code);
  $("wx-place").textContent = loc.name;
  $("wx-locline").firstChild.textContent = `📍 ${loc.name} · ${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)} · `;
  $("wx-icon").textContent = icon;
  $("wx-temp").textContent = `${t(c.temperature_2m)}${tUnit()}`;
  $("wx-desc").textContent = `${desc} · ${c.is_day ? "daytime" : "night"}`;
  $("wx-feels").textContent = `${t(c.apparent_temperature)}${tUnit()}`;
  $("wx-hilo").textContent = `H ${t(d.temperature_2m_max[0])}° / L ${t(d.temperature_2m_min[0])}°`;
  $("wx-time").textContent = new Date(c.time).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }) + ` · ${f.timezone || ""}`;
  $("wx-wind").textContent = `${wnd(c.wind_speed_10m)} ${compass(c.wind_direction_10m)}`;
  $("wx-hum").textContent = `${c.relative_humidity_2m}%`;
  $("wx-uv").textContent = d.uv_index_max?.[0] != null ? Number(d.uv_index_max[0]).toFixed(1) : "—";
  $("wx-precip").textContent = c.precipitation > 0 ? `${c.precipitation} mm now` : `${d.precipitation_probability_max?.[0] ?? 0}% today`;

  $("d-wind").textContent = `${wnd(c.wind_speed_10m)} (${Math.round(c.wind_speed_10m)} km/h)`;
  $("d-gust").textContent = wnd(c.wind_gusts_10m);
  $("d-dir").textContent = `${compass(c.wind_direction_10m)} · ${Math.round(c.wind_direction_10m)}°`;
  $("d-hum").textContent = `${c.relative_humidity_2m}%`;
  const dew = c.temperature_2m - (100 - c.relative_humidity_2m) / 5;
  $("d-dew").textContent = `${t(dew)}${tUnit()}`;
  $("d-press").textContent = `${Math.round(c.pressure_msl)} hPa`;
  $("d-vis").textContent = "—";
  $("d-cloud").textContent = `${c.cloud_cover}%`;
  $("d-sunrise").textContent = fmtTime(d.sunrise[0]);
  $("d-sunset").textContent = fmtTime(d.sunset[0]);

  /* weather-reactive storm (#3): live wind/precip/cloud drive the ambient
     canvas -- rain slant from wind, density from precip probability +
     cloud cover, bolt rate boosted by gusts and thunderstorm codes. */
  try {
    const precip = c.precipitation > 0 ? 1 : (d.precipitation_probability_max?.[0] ?? 0) / 100;
    const cloud = (c.cloud_cover ?? 0) / 100;
    const gustBoost = clamp(((c.wind_gusts_10m ?? 0) - 20) / 60, 0, 0.35);
    const stormCode = [65, 82, 95, 96, 99].includes(c.weather_code) ? 0.25 : 0;
    setStormIntensity(clamp(precip * 0.45 + cloud * 0.3 + gustBoost + stormCode + 0.08, 0.05, 1),
      { windKmh: c.wind_speed_10m ?? 0 });
  } catch {}
  // live conditions sky: the same payload drives the scenic canvas band
  wxsky().then((m) => m && m.updateWxSky(c, d)).catch(() => {});
}

function renderHourly(f) {
  const hrs = f.hourly.time.map((tm, i) => ({ tm, tmp: f.hourly.temperature_2m[i], pp: f.hourly.precipitation_probability?.[i] ?? 0, code: f.hourly.weather_code[i] }));
  const nowMs = Date.now();
  let start = hrs.findIndex((h) => new Date(h.tm).getTime() >= nowMs - 3600e3);
  if (start < 0) start = 0;
  const slice = hrs.slice(start, start + 48);
  const el = $("wx-hourly");
  el.innerHTML = "";
  const temps = slice.map((h) => imperial ? h.tmp * 9 / 5 + 32 : h.tmp);
  const lo = Math.min(...temps), hi = Math.max(...temps), span = Math.max(hi - lo, 1);

  // SVG temp curve
  const W = 960, H = 190, PT = 26, PB = 30;
  const X = (i) => (i / Math.max(slice.length - 1, 1)) * (W - 16) + 8;
  const Y = (v) => PT + (1 - (v - lo) / span) * (H - PT - PB);
  const pts = temps.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const area = `8,${H - PB} ${pts} ${(W - 8).toFixed(1)},${H - PB}`;
  $("wx-hourly-chart").innerHTML =
    `<defs><linearGradient id="wxg" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#e8482c" stop-opacity=".45"/><stop offset="1" stop-color="#e8482c" stop-opacity="0"/></linearGradient></defs>` +
    `<polygon points="${area}" fill="url(#wxg)"/>` +
    `<polyline points="${pts}" fill="none" stroke="#ff7a5c" stroke-width="2"/>` +
    temps.filter((_, i) => i % 6 === 0).map((v, k) => {
      const i = k * 6; if (i >= slice.length) return "";
      return `<circle cx="${X(i)}" cy="${Y(v)}" r="3" fill="#ffd23f"/>`;
    }).join("");

  chartTooltip($("wx-hourly-chart"),
    slice.map((h, i) => ({ x: X(i) })),
    (i) => {
      const h = slice[i];
      const dt = new Date(h.tm).toLocaleString([], { weekday: "short", hour: "numeric" });
      return `${dt} · ${Math.round(temps[i])}° · ${wmo(h.code)[0]} · 💧${h.pp}%`;
    });
  slice.forEach((h, i) => {
    const dt = new Date(h.tm);
    const cell = document.createElement("div");
    cell.className = "wx-hcell" + (i === 0 ? " now" : "");
    cell.innerHTML = `<span class="hh"></span><span class="hi"></span><span class="ht"></span><span class="hp"></span>`;
    cell.querySelector(".hh").textContent = i === 0 ? "Now" : dt.toLocaleTimeString([], { hour: "numeric" });
    cell.querySelector(".hi").textContent = wmo(h.code)[1];
    cell.querySelector(".ht").textContent = `${Math.round(temps[i])}°`;
    const pp = cell.querySelector(".hp");
    pp.textContent = h.pp >= 5 ? `${h.pp}%` : "";
    pp.style.color = h.pp >= 40 ? "var(--gust)" : h.pp >= 5 ? "var(--text-dim)" : "transparent";
    el.appendChild(cell);
  });
}

function renderDaily(f) {
  const el = $("wx-daily");
  el.innerHTML = "";
  f.daily.time.forEach((day, i) => {
    const [desc, icon] = wmo(f.daily.weather_code[i]);
    const card = document.createElement("div");
    card.className = "card wx-day" + (i === 0 ? " today" : "");
    card.setAttribute("data-glow", "");
    card.innerHTML =
      `<div class="wx-day-name">${i === 0 ? "Today" : fmtDay(day)}</div>` +
      `<div class="wx-day-icon">${icon}</div>` +
      `<div class="wx-day-t">${t(f.daily.temperature_2m_max[i])}° <span>/ ${t(f.daily.temperature_2m_min[i])}°</span></div>` +
      `<div class="wx-day-d">${desc}</div>` +
      `<div class="wx-day-meta">💧 ${f.daily.precipitation_probability_max?.[i] ?? 0}% · 💨 ${wnd(f.daily.wind_speed_10m_max?.[i] ?? 0)} · ☀️ UV ${Number(f.daily.uv_index_max?.[i] ?? 0).toFixed(0)}</div>` +
      `<div class="wx-range"><i style="width:${rangeW(f, i)}%;left:${rangeL(f, i)}%"></i></div>`;
    card.addEventListener("pointerenter", () => wxPreview({ code: f.daily.weather_code[i], windKmh: f.daily.wind_speed_10m_max?.[i] ?? 0 }), { passive: true });
    card.addEventListener("pointerleave", () => wxPreview(null), { passive: true });
    el.appendChild(card);
  });
  refreshEffects();
}
function rangeW(f, i) {
  const all = [...f.daily.temperature_2m_max, ...f.daily.temperature_2m_min];
  const lo = Math.min(...all), sp = Math.max(...all) - lo || 1;
  return Math.max(((f.daily.temperature_2m_max[i] - f.daily.temperature_2m_min[i]) / sp) * 100, 6).toFixed(1);
}
function rangeL(f, i) {
  const all = [...f.daily.temperature_2m_max, ...f.daily.temperature_2m_min];
  const lo = Math.min(...all), sp = Math.max(...all) - lo || 1;
  return (((f.daily.temperature_2m_min[i] - lo) / sp) * 100).toFixed(1);
}

function renderAQ(aq) {
  const c = aq?.current;
  if (!c || c.us_aqi == null) {
    $("wx-aqi").textContent = "—"; $("wx-aqi-label").innerHTML = "<strong>No AQI station nearby</strong>";
    ["pm25", "pm10", "o3", "no2"].forEach((k) => ($("d-" + k).textContent = "—"));
    return;
  }
  const v = Math.round(c.us_aqi);
  const band = v <= 50 ? ["Good", "var(--ok)"] : v <= 100 ? ["Moderate", "var(--bolt)"] :
    v <= 150 ? ["Unhealthy (sensitive)", "var(--warn)"] : v <= 200 ? ["Unhealthy", "var(--flag-soft)"] :
    v <= 300 ? ["Very unhealthy", "var(--storm-purple)"] : ["Hazardous", "var(--flag)"];
  $("wx-aqi").textContent = v;
  $("wx-aqi").style.color = band[1];
  $("wx-aqi-label").innerHTML = `<strong>${band[0]}</strong>`;
  $("wx-aqi-sub").textContent = `Open-Meteo modeled US AQI · ${new Date(c.time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  $("d-pm25").textContent = c.pm2_5 != null ? `${c.pm2_5} µg/m³` : "—";
  $("d-pm10").textContent = c.pm10 != null ? `${c.pm10} µg/m³` : "—";
  $("d-o3").textContent = c.ozone != null ? `${c.ozone} µg/m³` : "—";
  $("d-no2").textContent = c.nitrogen_dioxide != null ? `${c.nitrogen_dioxide} µg/m³` : "—";
}

/* ---------- NWS alerts (US only) ---------- */
async function renderAlerts() {
  const request=++alertRequest;
  const sec = $("wx-alerts-sec"), box = $("wx-alerts");
  box.innerHTML = ""; sec.hidden = true;
  if (Math.abs(loc.lat) > 90) return;
  try {
    const r = await fetch(`https://api.weather.gov/alerts/active?point=${loc.lat.toFixed(4)},${loc.lon.toFixed(4)}`, { headers: { Accept: "application/geo+json" } });
    if (!r.ok) return; // non-US or no alerts endpoint
    const j = await r.json();
    if(request!==alertRequest)return;
    const feats = j.features || [];
    if (!feats.length) return;
    sec.hidden = false;
    $("wx-alert-count").textContent = `· ${feats.length} active`;
    for (const a of feats.slice(0, 8)) {
      const p = a.properties;
      const d = document.createElement("details");
      d.className = "wx-alert-card";
      d.open = feats.length <= 2;
      d.innerHTML = `<summary><span class="pill" data-level="warn"></span><strong></strong><span class="mono-dim"></span></summary><p class="wx-alert-body"></p><p class="mono-dim"></p>`;
      d.querySelector(".pill").textContent = (p.severity || "Alert").toUpperCase();
      d.querySelector(".pill").dataset.level = /extreme|severe/i.test(p.severity || "") ? "crit" : "warn";
      d.querySelector("strong").textContent = p.event || "Weather alert";
      d.querySelector(".mono-dim").textContent = p.senderName || "";
      d.querySelector(".wx-alert-body").textContent = (p.description || "").slice(0, 1200);
      d.querySelectorAll("p")[1].textContent = `Effective ${p.effective ? new Date(p.effective).toLocaleString() : "—"} → expires ${p.expires ? new Date(p.expires).toLocaleString() : "—"}`;
      box.appendChild(d);
    }
  } catch { /* alerts are best-effort */ }
}

/* ---------- radar map ---------- */
function initMap() {
  if (typeof L === "undefined") {
    setMapState("Map library unavailable. Use the official radar link below or try again when online.");
    return;
  }
  map = L.map("wx-map", { scrollWheelZoom: true }).setView([loc.lat, loc.lon], 8);
  // NOTE: CARTO basemaps (basemaps.cartocdn.com) now gate tiles behind an
  // API key ("Zoom Level Not Supported / API KEY REQUIRED" error tiles), so
  // we use Esri's keyless dark-gray canvas + imagery instead.
  const dark = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Basemap &copy; Esri", maxNativeZoom: 16, maxZoom: 18 }
  );
  const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Imagery &copy; Esri", maxNativeZoom: 18, maxZoom: 18 }
  );
  dark.addTo(map);
  map._wxDark = dark;
  map._wxSat = satellite;
  dark.once("tileload", () => setMapState("", true));
  satellite.once("tileload", () => setMapState("", true));
  dark.on("tileerror", () => {
    $("wx-frame-label").textContent = "basemap tiles failing — try Satellite view";
    const state = $("wx-map-state");
    if (state && !state.hidden) setMapState("Map tiles are taking too long. Try Satellite view or open the official radar link below.");
  });
  placeMarker();
  warningOverlay = L.tileLayer.wms(NOAA_WARNINGS, {layers:"0", format:"image/png", transparent:true, version:"1.3.0", attribution:"Warnings: NOAA / NWS", zIndex:20, opacity:0.7});
  if ($("wx-warnings").checked) warningOverlay.addTo(map);
  warningOverlay.on("tileerror",()=>$("wx-radar-status").textContent="NWS warning layer unavailable; check the alert list separately.");
  $("wx-warnings").addEventListener("change",e=>e.target.checked?warningOverlay.addTo(map):warningOverlay.remove());
  L.control.layers({"Dark":dark,"Satellite":satellite}).addTo(map);
  $("wx-radar-source").value=radarSource;
  $("wx-radar-source").addEventListener("change",e=>{radarSource=e.target.value;store.set("gale-wx-radar",radarSource);loadRadarFrames();});
  loadRadarFrames();
  // Re-assert size once layout/fonts settle (fixes grey 0-size init).
  setTimeout(() => map && map.invalidateSize(), 400);
  window.addEventListener("load", () => map && map.invalidateSize());
  $("wx-opacity").addEventListener("input", (e) => {
    $("wx-opacity-value").textContent = `${e.target.value}%`;
    radarOverlay && radarOverlay.setOpacity(e.target.value / 100);
  });
  $("wx-radar-retry").addEventListener("click", () => {
    if (!radarOverlay) return;
    radarTileErrors = 0;
    $("wx-radar-retry").hidden = true;
    $("wx-radar-status").textContent = "Retrying radar tiles…";
    radarOverlay.redraw();
  });
  $("wx-play").addEventListener("click", togglePlay);
  $("wx-frame").addEventListener("input", (e) => { stopPlay(); showFrame(+e.target.value); });
}

function placeMarker() {
  if (!map) return;
  if (mapMarker) mapMarker.remove();
  mapMarker = L.marker([loc.lat, loc.lon]).addTo(map).bindTooltip(loc.name);
}

async function jsonFetch(url) {
  const r=await fetch(url,{signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  const data=await r.json();if(data.error)throw new Error("Provider unavailable");return data;
}
async function loadRadarFrames() {
  const request=++radarRequest, selected=radarSource;
  stopPlay();radarFrames=[];radarTileErrors=0;
  $("wx-radar-retry").hidden=true;
  if(radarOverlay){radarOverlay.remove();radarOverlay=null;}
  $("wx-play").disabled=true;$("wx-frame").disabled=true;
  $("wx-frame-label").textContent="Loading radar…";
  const mapState = $("wx-map-state");
  if (map && mapState && !mapState.hidden) setMapState("Loading map tiles and observed radar…");
  try {
    let frames;
    if(selected==="noaa") {
      const query=new URLSearchParams({f:"json",where:"1=1",geometry:`${loc.lon},${loc.lat}`,geometryType:"esriGeometryPoint",inSR:"4326",spatialRel:"esriSpatialRelIntersects",outFields:"objectid,idp_validtime",returnGeometry:"false",orderByFields:"idp_validtime DESC",resultRecordCount:"12"});
      const j=await jsonFetch(`${NOAA_RADAR}/query?${query}`);
      frames=(j.features||[]).map(f=>({time:f.attributes.idp_validtime/1000,id:f.attributes.objectid})).reverse();
    }else{
      const j=await jsonFetch("https://api.rainviewer.com/public/weather-maps.json");
      radarHost=j.host||radarHost;frames=(j.radar?.past||[]).slice(-12);
    }
    if(request!==radarRequest)return;
    if(!frames.length){$("wx-frame-label").textContent="No radar coverage here — try RainViewer.";$("wx-radar-status").textContent=`${selected==="noaa"?"NOAA / NWS":"RainViewer"}: no observed frames`;return;}
    radarFrames=frames;
    if(!map)return;
    if(selected==="noaa"){
      const NoaaTiles=L.TileLayer.extend({getTileUrl(coords){
        const size=this.getTileSize(),nw=map.options.crs.project(map.unproject(L.point(coords.x*size.x,coords.y*size.y),coords.z)),se=map.options.crs.project(map.unproject(L.point((coords.x+1)*size.x,(coords.y+1)*size.y),coords.z));
        const q=new URLSearchParams({f:"image",bbox:[nw.x,se.y,se.x,nw.y].join(","),bboxSR:"3857",imageSR:"3857",size:"256,256",format:"png32",transparent:"true",mosaicRule:JSON.stringify({mosaicMethod:"esriMosaicLockRaster",lockRasterIds:[this.options.rasterId]})});
        return `${NOAA_RADAR}/exportImage?${q}`;
      }});
      radarOverlay=new NoaaTiles("",{rasterId:frames.at(-1).id,opacity:$("wx-opacity").value/100,zIndex:10,maxZoom:18,attribution:"Radar: NOAA / NWS"});
    }else radarOverlay=L.tileLayer(`${radarHost}${frames.at(-1).path}/256/{z}/{x}/{y}/2/1_1.png`,{opacity:$("wx-opacity").value/100,zIndex:10,maxNativeZoom:7,maxZoom:18,attribution:"Radar: RainViewer"});
    radarOverlay.on("tileerror", () => {
      radarTileErrors++;
      $("wx-radar-status").textContent = `Radar imagery unavailable · ${radarTileErrors} tile error${radarTileErrors === 1 ? "" : "s"}`;
      $("wx-radar-retry").hidden = false;
    });
    radarOverlay.addTo(map);
    $("wx-play").disabled=frames.length<2;$("wx-frame").disabled=false;
    $("wx-frame").max=frames.length-1;showFrame(frames.length-1);
    $("wx-radar-status").textContent=`${selected==="noaa"?"NOAA / NWS":"RainViewer"} · observed radar · frames collected ${new Date().toLocaleTimeString()} · warning polygons: current NWS feed`;
  }catch(e){if(request===radarRequest){$("wx-frame-label").textContent="Radar unavailable — try the other source.";$("wx-radar-status").textContent=`${selected}: ${e.message}`;}}
}
function showFrame(i) {
  if(!map||!radarFrames.length||!radarOverlay)return;
  frameIdx=Math.max(0,Math.min(i,radarFrames.length-1));const f=radarFrames[frameIdx];
  radarTileErrors=0;
  $("wx-radar-retry").hidden=true;
  if(radarSource==="noaa"){radarOverlay.options.rasterId=f.id;radarOverlay.redraw();}
  else radarOverlay.setUrl(`${radarHost}${f.path}/256/{z}/{x}/{y}/2/1_1.png`);
  $("wx-frame").value=frameIdx;
  const age=Math.round((Date.now()/1000-f.time)/60);
  const frameText = new Date(f.time*1000).toLocaleString() + " · " + (frameIdx+1) + "/" + radarFrames.length + " · " + age + " min old" + (age>30 ? " · STALE" : "");
  $("wx-frame").setAttribute("aria-valuetext", frameText);
  $("wx-frame-label").textContent=frameText;
}
async function loadObservations(){
  const request=++observationRequest,{lat,lon}=loc;
  $("wx-station").textContent="Loading measured conditions…";$("wx-airnow").textContent="Loading observed AQI…";
  async function station(){
    try{
      const point=await jsonFetch(`https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`);
      const stations=await jsonFetch(point.properties.observationStations);
      const nearby=(stations.features||[]).slice(0,3);
      const observations=await Promise.allSettled(nearby.map(async s=>({station:s.properties,observation:(await jsonFetch(`https://api.weather.gov/stations/${encodeURIComponent(s.properties.stationIdentifier)}/observations/latest`)).properties})));
      const valid=observations.filter(x=>x.status==="fulfilled"&&x.value.observation.timestamp&&x.value.observation.temperature?.value!=null).map(x=>x.value).sort((a,b)=>Date.parse(b.observation.timestamp)-Date.parse(a.observation.timestamp));
      if(!valid.length)throw new Error("No recent station reading");
      const {station,observation:o}=valid[0],age=(Date.now()-Date.parse(o.timestamp))/60000;
      if(request===observationRequest)$("wx-station").textContent=`${station.name} (${station.stationIdentifier}) · ${t(o.temperature.value)}${tUnit()} · ${o.textDescription||""} · observed ${new Date(o.timestamp).toLocaleString()}${age>120?" · STALE":""}`;
    }catch(e){if(request===observationRequest)$("wx-station").textContent="NWS station observations unavailable here. Global model forecast remains above.";}
  }
  async function air(){
    try{
      const d=await jsonFetch(`api/fleet/weather/airnow?lat=${lat}&lon=${lon}`);
      if(request!==observationRequest)return;
      $("wx-airnow").textContent=d.readings.length?d.readings.map(r=>`${r.area}, ${r.state} · ${r.distance_km} km away · ${r.pollutant} AQI ${r.aqi} (${r.category}) · observed ${new Date(r.observed_at).toLocaleString()}${r.stale||d.state==="stale"?" · STALE":""}`).join("; "):"No AirNow observation within 100 km, or provider unavailable. Model air quality remains above.";
    }catch(e){if(request===observationRequest)$("wx-airnow").textContent="AirNow observations unavailable. Model air quality remains above.";}
  }
  await Promise.allSettled([station(),air()]);
}

function togglePlay() {
  if (playTimer) return stopPlay();
  if (!radarFrames.length) return;
  $("wx-play").textContent = "⏸ Pause";
  $("wx-play").setAttribute("aria-pressed", "true");
  $("wx-play").setAttribute("aria-label", "Pause radar animation");
  let i = 0;
  showFrame(i);
  playTimer = setInterval(() => { i = (i + 1) % radarFrames.length; showFrame(i); }, playDelay);
}
function stopPlay() {
  clearInterval(playTimer); playTimer = null;
  $("wx-play").textContent = "▶ Play loop";
  $("wx-play").setAttribute("aria-pressed", "false");
  $("wx-play").setAttribute("aria-label", "Play recent radar frames");
}
$("wx-play-speed").addEventListener("change", (e) => {
  const next = Number(e.currentTarget.value);
  if (![500, 900, 1400].includes(next)) return;
  playDelay = next;
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = setInterval(() => showFrame((frameIdx + 1) % radarFrames.length), playDelay);
  }
});

/* ---------- boot ---------- */
renderPresets();
initSearch();
initUnitToggles();
initGeoButtons();
// the map + NOAA radar frames are ~600 KB: start them only when the radar section nears the viewport
whenNear($("wx-map"), "300px 0px").then(initMap).catch(() => {});
loadAll();
setInterval(() => loadAll(true), 10 * 60 * 1000);
setInterval(() => { if (map) loadRadarFrames(); }, 10 * 60 * 1000);
