# CivicSetu — From one photo to action

> Your AI agent for civic problems. A bridge (*setu*) between citizens and civic authorities.

CivicSetu turns **one photo of a messy street** into multiple correctly-routed civic
complaints, predicts which issues will worsen, detects street-level patterns, and
**follows up with authorities autonomously** — escalating with an AI voicemail and an
RTI draft when an issue is ignored.

Built for the **Vibe2Ship** hackathon (Coding Ninjas × Google for Developers),
problem statement *Community Hero — Hyperlocal Problem Solver*.

- **Live demo (GCP / Cloud Run):** _add your deployed URL here_
- **Stack:** React + TypeScript + Vite, Tailwind CSS v4, Gemini 2.0, Leaflet, Recharts

---

## The magic moment

A citizen takes one photo. Within seconds the AI:

1. **Detects every visible issue** in the frame (pothole + garbage + dead streetlight) with bounding boxes — *EC1*.
2. **Files a separate ticket per issue**, each auto-routed to the right department (PWD, BBMP, BESCOM…) — *FN1*.
3. **Drafts a formal complaint letter** for each (English / Hindi, with RTI clause) — *AP4*.
4. **Predicts how each issue will worsen**, with specific, monsoon- and traffic-aware reasoning — *EC2*.
5. **Spots patterns across reports** ("5 potholes on 100 Feet Road in 28 days → suspected drainage failure") and surfaces the root cause to the authority — *EC3*.
6. **Escalates ignored reports** after the SLA breaks: generates a TTS voicemail, "calls" the officer, and drafts an RTI — *EC5*.

One citizen action → many autonomous agent actions, all surfaced in a visible **AI Activity Log**.

---

## Features

### Core
- 📷 **Photo / gallery / video-frame issue reporting** (real `getUserMedia` capture)
- 🧠 **AI categorization** — category, severity, and reasoning per issue
- 🗺️ **Geolocation + mapping** — real GPS, reverse-geocoding, Leaflet map with status-coded markers
- 👥 **Community verification** — neighbours confirm/flag; verified after 3 confirmations
- 🔄 **Real-time tracking** — live status timeline, notifications, citizen ↔ authority sync
- 📊 **Impact dashboards** — personal, ward, and authority analytics (Recharts)
- 🔮 **Predictive insights** — per-issue worsening + ward hotspot heatmap
- 🏅 **Gamification** — reputation points + badges with celebratory toasts

### Eye-catchers (innovation)
- **EC1 — Multi-issue detection** from a single photo, with bounding-box overlays
- **EC2 — Worsening prediction** with visible, specific reasoning that streams in
- **EC3 — Cluster root-cause analysis** surfaced on the authority dashboard
- **EC4 — Multilingual voice reporting** (Web Speech API + Gemini translate/extract; Hindi + English)
- **EC5 — AI advocate with TTS escalation** (real `SpeechSynthesis` voicemail + RTI)
- **Bonus — Impact storytelling** with an AI narrative and a shareable canvas card

### Agentic tools (function calling)
The AI takes actions, visible in the **AI Activity Log**:
`dispatchToAuthority` (FN1) · `escalateAfterDays` (FN2) · `verifyClusterPattern` (FN3) · `generateImpactReport` (FN4).

---

## Google technologies used

- **Gemini 2.0** — vision (multi-issue detection), structured JSON output, reasoning (worsening, root cause), translation/extraction, complaint letters, narratives, escalation scripts
- **Google AI Studio** — prompt design (system / user / assistant trios)
- **Google Cloud Run** — deployment target
- **Web Speech API** — voice input + TTS escalation
- Function-calling-style agentic orchestration; OpenStreetMap/Leaflet for maps

---

## Demo-safe by design

Every Gemini call is wrapped in `try/catch` and falls back to **curated cached responses**
(`src/data/mockData/cachedResponses.ts`). The app is **fully functional with no API key** —
ideal for a reliable live demo. Add a key to switch to live Gemini:

```bash
cp .env.example .env
# set VITE_GEMINI_API_KEY=your_key   (https://aistudio.google.com/apikey)
```

**Demo Mode** (top-bar toggle) forces cached responses for speed and speeds up the
7-day escalation SLA so EC5 is demoable in seconds.

---

## Local setup

```bash
npm install
npm run dev          # http://localhost:5173
```

Build & serve the production bundle:

```bash
npm run build
npm start            # static server on $PORT (default 8080)
```

---

## Deploy to Google Cloud Run

The repo ships a multi-stage `Dockerfile` and a dependency-free static server
(`server.js`) that honors Cloud Run's `$PORT`.

```bash
# From the project root, with gcloud configured:
gcloud run deploy civicsetu \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated

# To enable live Gemini, build with the key baked in (VITE_ vars are build-time):
gcloud run deploy civicsetu \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --build-env-vars VITE_GEMINI_API_KEY=YOUR_KEY
```

Verify the deployed URL in an incognito window. (HashRouter is used, so no special
SPA routing config is required on the host.)

---

## Architecture

Three-tier, fully client-side (no backend; state persisted to LocalStorage under
`civicsetu_state_v1`).

```
src/
  types.ts                 # all enums + interfaces
  context/                 # AppContext (Context + useReducer) + ToastContext
  services/                # geminiService (AP1–AP8), cluster, impact, routing,
                           # tts, voiceInput, geolocation, storage, gamification
  data/                    # seedState + mockData (authorities, citizens, 80 issues,
                           # ward, demo photo, cached responses)
  components/              # shared UI, map (Leaflet), camera, voice, charts,
                           # agent activity log, escalation call screen
  screens/citizen/         # CS1–CS10
  screens/authority/       # AU1–AU5
  utils/                   # format, labels, geometry, shareCard, rng
  i18n/                    # en + hi
```

- **Tier 1 (UI):** Citizen view (mobile-first, bottom nav) + Authority view (desktop, sidebar), toggled in the top bar.
- **Tier 2 (AI):** `geminiService.ts` — one typed function per capability, structured prompts, cached fallback.
- **Tier 3 (foundation):** mock data, browser APIs (camera/geo/mic/speech), Leaflet map.

---

## Credits

- **Gemini 2.0** & **Google AI Studio** — AI capabilities
- [React](https://react.dev), [Vite](https://vite.dev), [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Leaflet](https://leafletjs.com) + [React-Leaflet](https://react-leaflet.js.org) and [OpenStreetMap](https://www.openstreetmap.org) (map tiles & reverse geocoding via Nominatim)
- [Recharts](https://recharts.org) — charts
- [Lucide](https://lucide.dev) — icons

Made for **#Vibe2Ship** · Coding Ninjas × Google for Developers.
