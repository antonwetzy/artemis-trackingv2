/**
 * ============================================================
 * ARTEMIS II LIVE TRACKER — API SERVICE LAYER
 * ============================================================
 * Drop-in adapter for real NASA/mission telemetry APIs.
 * Swap endpoints via environment variables.
 * All functions are async-safe and include fallback handling.
 * ============================================================
 */

// ── ENVIRONMENT CONFIGURATION ──
// Set these as real env vars (Vite: VITE_*, Next.js: NEXT_PUBLIC_*)
const ENV = {
  NASA_API_KEY:         import.meta?.env?.VITE_NASA_API_KEY          || 'DEMO_KEY',
  ARTEMIS_BASE_URL:     import.meta?.env?.VITE_ARTEMIS_BASE_URL       || 'https://api.nasa.gov/artemis',
  MISSION_STATUS_URL:   import.meta?.env?.VITE_MISSION_STATUS_URL     || null,
  TELEMETRY_WS_URL:     import.meta?.env?.VITE_TELEMETRY_WS_URL       || null,  // WebSocket endpoint
  NEWS_RSS_URL:         import.meta?.env?.VITE_NEWS_RSS_URL           || 'https://www.nasa.gov/rss/dyn/Artemis.rss',
  REFRESH_INTERVAL_MS:  5000,
  USE_MOCK_DATA:        true,   // ← set false when live APIs are available
};

// ── TELEMETRY TYPES ──
/**
 * @typedef {Object} TelemetrySnapshot
 * @property {number}  altitude_km        - Spacecraft altitude above Earth center (km)
 * @property {number}  velocity_kmh       - Velocity relative to Earth center (km/h)
 * @property {number}  distance_earth_km  - Distance from Earth center (km)
 * @property {number}  distance_moon_km   - Distance from Moon center (km)
 * @property {number}  crew_g             - Crew experienced G-force
 * @property {number}  cabin_pressure_kpa - Cabin atmospheric pressure (kPa)
 * @property {number}  power_kw           - Solar array output (kW)
 * @property {string}  mission_phase      - Current mission phase label
 * @property {string}  status             - Overall mission status string
 * @property {string}  timestamp_utc      - ISO 8601 UTC timestamp of snapshot
 */

// ═══════════════════════════════════════════
// SECTION 1: LIVE TELEMETRY SERVICE
// ═══════════════════════════════════════════

export const telemetryAPI = {

  /**
   * Fetch the latest telemetry snapshot.
   * Falls back to simulator if live API unavailable.
   * @returns {Promise<TelemetrySnapshot>}
   */
  async getLatest() {
    if (ENV.USE_MOCK_DATA) return mockTelemetry.generate();

    try {
      const url = `${ENV.ARTEMIS_BASE_URL}/telemetry/latest?api_key=${ENV.NASA_API_KEY}`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      return telemetryAPI._normalize(raw);
    } catch (err) {
      console.warn('[telemetryAPI] Live fetch failed, using mock:', err.message);
      return mockTelemetry.generate();
    }
  },

  /**
   * Normalize raw API response → standard TelemetrySnapshot shape.
   * Adjust field mappings here as API schema becomes known.
   * @param {Object} raw
   * @returns {TelemetrySnapshot}
   */
  _normalize(raw) {
    return {
      altitude_km:        raw.altitude       ?? raw.alt_km        ?? 0,
      velocity_kmh:       raw.velocity       ?? raw.speed_kmh     ?? 0,
      distance_earth_km:  raw.distance_earth ?? raw.range_km      ?? 0,
      distance_moon_km:   raw.distance_moon  ?? null,
      crew_g:             raw.g_force        ?? raw.crew_g        ?? 0,
      cabin_pressure_kpa: raw.pressure_kpa   ?? raw.cabin_press   ?? 101.3,
      power_kw:           raw.power_kw       ?? raw.solar_output  ?? 0,
      mission_phase:      raw.phase          ?? raw.mission_phase ?? 'Unknown',
      status:             raw.status         ?? 'Nominal',
      timestamp_utc:      raw.timestamp      ?? new Date().toISOString(),
    };
  },

  /**
   * Subscribe to WebSocket telemetry stream (when available).
   * @param {function(TelemetrySnapshot): void} onData
   * @param {function(Error): void} onError
   * @returns {{ close: function }} subscription handle
   */
  subscribe(onData, onError) {
    if (!ENV.TELEMETRY_WS_URL || ENV.USE_MOCK_DATA) {
      // Polyfill WebSocket with polling when WS not available
      console.info('[telemetryAPI] WebSocket unavailable — using polling');
      const interval = setInterval(async () => {
        try { onData(await telemetryAPI.getLatest()); }
        catch (e) { onError(e); }
      }, ENV.REFRESH_INTERVAL_MS);
      return { close: () => clearInterval(interval) };
    }

    const ws = new WebSocket(ENV.TELEMETRY_WS_URL);
    ws.onmessage = (evt) => {
      try { onData(telemetryAPI._normalize(JSON.parse(evt.data))); }
      catch (e) { onError(e); }
    };
    ws.onerror = onError;
    ws.onclose = () => console.info('[telemetryAPI] WebSocket closed');
    return { close: () => ws.close() };
  },
};


// ═══════════════════════════════════════════
// SECTION 2: MISSION STATUS SERVICE
// ═══════════════════════════════════════════

export const missionStatusAPI = {

  /**
   * Fetch overall mission status (phase, alerts, crew health).
   * @returns {Promise<Object>}
   */
  async getStatus() {
    if (ENV.USE_MOCK_DATA) return mockMissionStatus;

    try {
      const url = ENV.MISSION_STATUS_URL || `${ENV.ARTEMIS_BASE_URL}/status`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      console.warn('[missionStatusAPI] Using mock status:', err.message);
      return mockMissionStatus;
    }
  },
};


// ═══════════════════════════════════════════
// SECTION 3: NEWS / RSS SERVICE
// ═══════════════════════════════════════════

export const newsAPI = {

  /**
   * Fetch latest NASA Artemis news items.
   * Parses RSS or JSON news feed.
   * @returns {Promise<Array>}
   */
  async getLatestNews() {
    if (ENV.USE_MOCK_DATA) return mockNews;

    try {
      // Use a CORS-safe RSS proxy if needed:
      // const proxyURL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(ENV.NEWS_RSS_URL)}`;
      const res = await fetch(ENV.NEWS_RSS_URL, { signal: AbortSignal.timeout(10000) });
      const text = await res.text();
      return newsAPI._parseRSS(text);
    } catch (err) {
      console.warn('[newsAPI] Using mock news:', err.message);
      return mockNews;
    }
  },

  _parseRSS(xmlStr) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, 'application/xml');
    return Array.from(doc.querySelectorAll('item')).slice(0, 6).map(item => ({
      title:     item.querySelector('title')?.textContent   ?? '',
      excerpt:   item.querySelector('description')?.textContent?.slice(0, 200) ?? '',
      link:      item.querySelector('link')?.textContent    ?? '#',
      pubDate:   item.querySelector('pubDate')?.textContent ?? '',
      source:    'NASA',
    }));
  },
};


// ═══════════════════════════════════════════
// SECTION 4: MOCK DATA (Simulator)
// ═══════════════════════════════════════════

let _mockT = 0;

export const mockTelemetry = {
  generate() {
    _mockT += 1;
    const phase = _mockT / 120;
    return {
      altitude_km:        Math.round(45000 + Math.sin(phase * 0.3) * 8000 + _mockT * 80),
      velocity_kmh:       Math.round(28000 + Math.cos(phase * 0.2) * 400 + _mockT * 1.8),
      distance_earth_km:  Math.round(8000 + _mockT * 280),
      distance_moon_km:   Math.round(380000 - _mockT * 280),
      crew_g:             parseFloat((0.0001 + Math.random() * 0.0003).toFixed(5)),
      cabin_pressure_kpa: parseFloat((101.3 + (Math.random() - 0.5) * 0.2).toFixed(2)),
      power_kw:           parseFloat((12.2 + (Math.random() - 0.5) * 0.4).toFixed(2)),
      mission_phase:      'Translunar Coast',
      status:             'Nominal — All Systems Go',
      timestamp_utc:      new Date().toISOString(),
    };
  }
};

export const mockMissionStatus = {
  phase: 'Translunar Coast',
  subphase: 'Mid-course correction window',
  status: 'Nominal',
  alerts: [],
  crew_health: 'All four crew members healthy and alert',
  next_milestone: { name: 'Translunar Injection', eta_hours: 4.37 },
};

export const mockNews = [
  {
    title: 'Artemis II TLI Burn Confirmed Nominal',
    excerpt: 'Mission Control confirms TLI burn executed flawlessly. Orion on free-return trajectory.',
    link: 'https://blogs.nasa.gov/artemis/',
    pubDate: new Date(Date.now() - 2 * 3600000).toUTCString(),
    source: 'NASA',
  },
  {
    title: 'Deep Space Network Tracking Active',
    excerpt: 'Goldstone and Madrid DSN stations providing continuous contact with Orion crew.',
    link: 'https://www.nasa.gov/artemis',
    pubDate: new Date(Date.now() - 4 * 3600000).toUTCString(),
    source: 'NASA JPL',
  },
  {
    title: 'European Service Module Performing Flawlessly',
    excerpt: 'ESA confirms all European Service Module systems nominal. Solar arrays generating full power.',
    link: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Orion',
    pubDate: new Date(Date.now() - 6 * 3600000).toUTCString(),
    source: 'ESA',
  },
];


// ═══════════════════════════════════════════
// SECTION 5: MOCK TELEMETRY JSON EXAMPLE
// (Save this as mock-telemetry.json for dev)
// ═══════════════════════════════════════════

export const MOCK_TELEMETRY_JSON_EXAMPLE = {
  "$schema": "Artemis II Telemetry v1.0",
  "$note": "Example JSON structure — map real API fields in telemetryAPI._normalize()",
  "altitude_km": 52840,
  "velocity_kmh": 28412,
  "distance_earth_km": 89340,
  "distance_moon_km": 291440,
  "crew_g": 0.00018,
  "cabin_pressure_kpa": 101.3,
  "power_kw": 12.4,
  "mission_phase": "Translunar Coast",
  "status": "Nominal — All Systems Go",
  "timestamp_utc": "2025-04-07T18:34:00.000Z",
  "crew": [
    { "name": "Reid Wiseman",   "role": "CDR", "health": "Nominal" },
    { "name": "Victor Glover",  "role": "PLT", "health": "Nominal" },
    { "name": "Christina Koch", "role": "MS1", "health": "Nominal" },
    { "name": "Jeremy Hansen",  "role": "MS2", "health": "Nominal" }
  ],
  "systems": {
    "eclss":     "Nominal",
    "gn&c":      "Nominal",
    "comms":     "Nominal",
    "power":     "Nominal",
    "thermal":   "Nominal",
    "propulsion":"Nominal"
  }
};
