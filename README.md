# 🚀 Artemis II Live Tracker

A cinematic, real-time 3D mission tracking website for the NASA Artemis II crewed lunar mission.

**Mission Status: LIVE — Launched April 1, 2026 · Splashdown ~April 10, 2026**

---

## 🌐 Deploy to GitHub Pages (Free Hosting)

### Step 1 — Create a GitHub repository
1. Go to [github.com](https://github.com) and sign in (or create a free account)
2. Click the **+** button → **New repository**
3. Name it: `artemis-ii-tracker`
4. Set it to **Public**
5. Click **Create repository**

### Step 2 — Upload the files
1. On your new repo page, click **uploading an existing file**
2. Drag and drop ALL these files into the upload area:
   - `index.html` ← the main website
   - `api-service.js`
   - `mock-telemetry.json`
   - `README.md`
3. Click **Commit changes**

### Step 3 — Enable GitHub Pages
1. Go to your repo → **Settings** tab
2. Click **Pages** in the left sidebar
3. Under **Source**, select **Deploy from a branch**
4. Under **Branch**, select `main` → folder `/root`
5. Click **Save**

### Step 4 — Your site is live!
After ~60 seconds your site will be live at:
```
https://YOUR-USERNAME.github.io/artemis-ii-tracker/
```

---

## 📁 Files

| File | Description |
|------|-------------|
| `index.html` | Complete website — open directly in any browser, zero dependencies |
| `api-service.js` | Modular API adapter for live NASA telemetry (ES module) |
| `mock-telemetry.json` | Sample telemetry JSON schema |
| `README.md` | This file |

---

## ✨ Features

- 🌍 **3D photorealistic Earth** — NASA Blue Marble texture, clouds, night lights, atmosphere glow
- 🌙 **3D Moon** — real NASA lunar surface texture
- 🚀 **Live rocket tracking** — moves along the real free-return trajectory
- 🛰️ **Live telemetry** — altitude, speed, distance from Earth/Moon (artemis.cdnspace.ca + JPL Horizons)
- ⏱️ **Splashdown countdown** — live ticking timer to Apr 10 splashdown
- 🗺️ **3D map controls** — left-drag rotate, right-drag pan, scroll zoom, focus on Orion
- 🎯 **Splashdown marker** — pulsing red dot on the Pacific Ocean landing zone
- 📡 **NASA YouTube livestream** embedded
- 🎧 **Audio guide** — NASA+ and SPACE RoIP links for astronaut comms
- 📋 **Mission timeline** — all 12 milestones with real dates
- 👨‍🚀 **Crew profiles** — all 4 astronauts
- 📰 **Live news** — real Artemis II headlines
- ❓ **FAQ** — 6 common questions answered

---

## 🔴 Live Data Sources

| Source | Data | Update Rate |
|--------|------|-------------|
| `artemis.cdnspace.ca/api/orbit` | Speed, altitude, distance (JPL Horizons) | Every 5 min |
| `artemis.cdnspace.ca/api/arow` | NASA AROW spacecraft attitude | ~1 sec (SSE) |
| `artemis.cdnspace.ca/api/dsn` | Deep Space Network tracking | Every 10 sec |
| `eyes.nasa.gov/dsn/data/dsn.xml` | Official NASA DSN feed (fallback) | Every 60 sec |

---

## ⚠️ Disclaimer

Independent fan/educational tracker. Not affiliated with NASA. Telemetry is estimated from public data sources. For official data: [nasa.gov/artemis](https://www.nasa.gov/artemis)
