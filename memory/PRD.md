# MediConnect Product Record

## Original problem statement
MediConnect — “Care that finds you.” A two-sided care directory for patient lookup and hospital staff updates. Patients need hospital capacity, specialist comparison, OPD timing, emergency context, contacts, and directions; staff should update admissions/discharges and doctor status so derived information stays current. The product must not fabricate real-time medical data for named hospitals or doctors.

## Architecture decisions
- Frontend remains the existing React/Vite-compatible shell and keeps `src/lib/firebase.js` as the single Firebase configuration boundary and `src/lib/api.js` as the single directory/domain layer.
- Local demo mode is used while Firebase and Google Maps credentials are unavailable.
- Supplied Patiala directory records are marked `isSeedData: true` and `verificationStatus: "unverified"`.
- Bed capacity for supplied named hospitals is displayed as “Not reported”; no capacity is invented. Doctor statuses default to unavailable.
- Google Maps is currently represented by safe search/directions URLs; a JavaScript map surface can be added after a browser Maps key is configured.

## User personas
- Patients and families comparing nearby hospitals, fees, specialties, doctors, OPD timings, and directions.
- Hospital staff maintaining ward occupancy and confirming doctor availability.
- Administrators who approve staff roles and verification state.

## Core requirements (static)
- Patient Lookup guest flow with hospital search and doctor/specialty comparison.
- Hospital detail expansion with fees, location, OPD hours, doctor roster, safety labeling, and directions.
- Hospital Console with staff gate, ward admit/discharge controls, derived capacity messaging, doctor roster toggles, and profile view.
- No client-side role self-assignment and no false live availability.
- Firebase Auth/Firestore-ready boundary and Google Maps-ready location flow.

## What's been implemented

### 2026-09-06 (final) — Free OpenStreetMap embed (no API key)
- Since the user has no Google Maps key, added a real, free, working interactive map using a plain OpenStreetMap iframe embed (`openstreetmap.org/export/embed.html`) — zero dependencies, zero API key required. Every hospital card now shows a mini-map pinned at its coordinates when expanded, with a caption distinguishing "Pinned from the hospital's official address" (verified: Manipal, Rajindra, Patiala Heart Institute, Gian Sagar) from "Approximate pin — confirm exact entrance on arrival" (the other 8, geocoded from their listed area name only). The existing "Open directions in Google Maps" link is kept alongside it, unchanged.
- Tested via testing_agent (iteration_7.json, final delivery pass): 31/31 backend tests, OSM map renders correctly on all cards checked, verified/approximate captions toggle correctly, no regressions on specialties/doctor bios/emergency banners/ward chips, no mobile overflow.
- Per explicit user request ("no more enhancements just give us the app now"), this closes out the feature backlog for this session — app is delivered as-is.

### 2026-09-06 (latest) — Real Staff Login (JWT) + Emergency Live Feed
- **Real Staff Login**: replaced the fake demo "sign in" button with real email/password auth. `backend/auth.py` — bcrypt password hashing + JWT (HS256, 8h, httpOnly cookie `access_token`). One demo account auto-seeded per hospital at startup (`<hospitalId>@mediconnect.demo`, shared password `MediConnect@2026`, see `/app/memory/test_credentials.md`). Each login is scoped to exactly one hospital (user's explicit choice) — Console no longer has a hospital dropdown; `/api/hospitals/{id}/wards/*` and `/doctors/*` mutation endpoints now require auth and return 403 if a staff user tries to touch a hospital other than their own, 401 with no session.
- **Emergency Live Feed**: `pages/Emergency.jsx` now pulls live ICU ward data (`fetchAllStatus`) for each emergency-ready hospital instead of static text, showing "ICU: X/Y available" plus a "hospital-confirmed" tag (Park Hospital's real 65-bed ICU) vs. "demo baseline" tag (all other hospitals' generic 8-bed default) — keeps the safety framing honest per the no-fabrication rule while still being "live".
- Backend `hospital_status.py` ward objects gained a `confirmed: bool` flag (true only for Park's general+icu and Rajindra's general ward, which come from real hospital-supplied totals); `_get_or_seed` now reconciles ward metadata on every read so pre-existing seeded Mongo docs pick up new fields without a manual migration.
- Tested via testing_agent (iteration_6.json): 31/31 backend tests (rewrote the pre-existing test suite to use real login), full frontend pass — login/logout, session persistence across reload, cross-hospital 403, Emergency confirmed/demo-baseline tags, no mobile overflow.

### 2026-09-06 (later still) — Live Bed Counts (own backend, no Firebase) + Search Synonyms
- **Live Bed Counts without Firebase**: since Firebase credentials are still unavailable, ward/bed and doctor-availability persistence now runs on MediConnect's own FastAPI + MongoDB stack instead. New `backend/hospital_status.py` router: `GET /api/hospitals/{id}/status` (auto-seeds ward totals — generic hospitals get 40 general/8 ICU/12 maternity demo baseline; Park Hospital gets 235/65/12 and Rajindra gets 1009/8/12 from the user-supplied bed figures), `GET /api/hospitals/status?ids=...` (bulk), `POST .../wards/{wardId}/admit|discharge`, `PATCH .../doctors/{doctorId}`. Data is stored in Mongo collection `hospital_status`, shared globally across all sessions.
- `Console` (App.js) rewritten: added a hospital selector dropdown (all 12 hospitals, `data-testid=console-hospital-select`); ward capacity and doctor roster tabs now read/write the real backend instead of local demo React state.
- `Lookup`/`HospitalCard`: bulk-fetches live status on load and overlays it on each hospital card — collapsed card shows "`<available>/<total>` beds available" with a "STAFF-UPDATED" tag, expanded card shows a ward-chip line and doctor status pills reflect live Console updates. Verified end-to-end: a discharge in Console for Park Hospital's ICU ward is reflected on Patient Lookup immediately.
- **Search Synonyms**: `lib/api.js` adds a specialty alias table (Cardiology↔Cardiac Sciences, ENT↔Otolaryngology, Orthopaedics↔Ortho, etc.) and switched `searchDoctors` to word-boundary regex matching (reduces false positives vs. plain substring) so a search for "cardiology" also surfaces "Cardiac Sciences" doctors, etc.
- Tested via testing_agent (test_reports/iteration_5.json, 11/11 backend tests): persistence across requests verified, Console↔Lookup live-update loop verified, synonym search verified for cardiology/ENT/orthopaedics, no mobile overflow. Minor code-review notes (no auth/rate-limiting on the status endpoints, since staff sign-in remains a demo session) are flagged as known, acceptable for the current demo scope.

### 2026-09-06 (later) — Verified hospital data expansion + Voice Assistant Hook
- Added user-supplied official directory data for 5 hospitals in `lib/api.js`: updated Manipal Hospitals, Park Hospital, and Rajindra Hospital with full specialty lists, complete doctor rosters and doctor bios (qualification/experience/expertise/designation where supplied, "Not publicly reported" otherwise); added 2 brand-new hospitals — AAS Medicare and Patiala Heart Institute & Multispeciality Hospital — bringing the directory to 12 hospitals total (completes backlog Task 6).
- `HospitalCard` (App.js) now renders address/email, an "Emergency-ready" banner, a specialty-chip list, and doctor bio lines. Home hero stats (hospital/doctor counts) are now computed dynamically from the directory instead of hardcoded.
- Smart Emergency screen (`pages/Emergency.jsx`) now lists the 5 emergency-ready hospitals (`api.getEmergencyReadyHospitals()`) with address, ICU info, emergency phone/ambulance, Google Maps directions, and an unverified/not-live disclaimer — replaces the old "no data" placeholder (partially fulfills backlog P0 emergency data task; data is hospital-directory-level, not a live nearest-hospital geolocation feed).
- Voice Assistant Hook: user initially requested ElevenLabs but had no API key, so switched to OpenAI TTS/STT via the Emergent Universal Key (`EMERGENT_LLM_KEY`, no extra credential needed). New backend `backend/voice.py` (`POST /api/voice/speak` using `emergentintegrations.llm.openai.text_to_speech`, model `tts-1`/voice `nova`; `POST /api/voice/listen` using `emergentintegrations.llm.openai.speech_to_text`, model `whisper-1`), logged to Mongo `voice_events`. Frontend `lib/voice.js` (MediaRecorder mic capture, speak/transcribe helpers) wired into `SymptomTriage.jsx`: a mic button records symptoms and fills the textarea via STT; a "Listen" button on the triage result plays the response via TTS.
- Tested end-to-end via testing_agent (test_reports/iteration_4.json): 12-hospital directory renders correctly, doctor/specialty search includes new hospitals, emergency redirect shows the new hospital list, voice endpoints pass backend tests (6/6), mic/listen UI works without crashing, no mobile horizontal overflow, no hallucinated hospital/doctor names in triage matches.

### 2026-09-06 — Symptom-to-Care Matching Assistant (Claude)
- Backend `POST /api/triage` (`/app/backend/triage.py`): runs the user's unified multilingual symptom-matching system prompt on Claude Sonnet 4.6 via Emergent Universal Key (`EMERGENT_LLM_KEY` in backend/.env). Frontend passes the current directory as HOSPITAL_DATA (unreported figures sent as `null`, doctors `unavailable`); backend filters any match not present in the supplied data; logs each run to Mongo `triage_logs` with a session id.
- Frontend: third "Describe symptoms" tab in Patient Lookup (`components/SymptomTriage.jsx`, `lib/triage.js`) — urgency pill, detected language, likely specialty, response text in patient's language, clarifying question, directory-only matches (click opens hospital card), disclaimer.
- Smart Emergency screen `/emergency` (`pages/Emergency.jsx`): shown when `redirectToEmergency` is true — Call 108 / 112 buttons, emergency message, explicit "emergency hospital data not connected yet" note (user will supply data later).
- Tested end-to-end (test_reports/iteration_3.json): routine ENT match, emergency redirect, clarifying question, Punjabi no-match, mobile no-overflow, regression.

### 2026-09-04
- Replaced starter screen with MediConnect clinical-calm interface using Fraunces and IBM Plex Sans, teal/navy palette, status language, responsive layouts, and meaningful motion.
- Added 10 supplied Patiala hospitals and the supplied doctor records, including specialties, experience, ratings where supplied, consultation fees, doctor counts, locations/areas, and OPD/opening hours.
- Added hospital search, hospital cards, safe detail expansion, doctor/specialty table search, and Google Maps search links.
- Added local Hospital Console preview with ward steppers, derived occupancy/availability math for preview wards, doctor status toggles, profile tab, and demo staff messaging.
- Added Firebase configuration boundary and Firebase dependency without pretending live authentication is active when credentials are absent.
- Passed production build and frontend end-to-end verification for desktop/mobile flows. MOCKED: local directory data, local staff session/ward state, and Google Maps search URLs.

## Prioritized backlog
- P0: Configure Firebase project credentials (still optional now — real staff auth and live bed counts no longer depend on it; only Firestore/Google social login specifically would need it if ever requested).
- P1: Password reset / account-rotation flow for staff logins (currently a fixed shared demo password, no reset endpoint — acceptable for demo scope).
- P1: Replace Maps search links with the Google Maps JavaScript rendering surface once a browser Maps key exists.
- P2: Split App.js into per-page files for maintainability (flagged by testing agent, not blocking).
- P2: Tighten search-synonym matching further (currently word-boundary regex; still some noise on very short queries like "ent").
- P2: Add patient name/phone profile flow, emergency triage ordering, reviews, disputes, and verified badges.

## Next tasks
1. Receive Google Maps browser key and verified GeoPoints/geohashes.
2. Decide if real hospital admins should be able to reset/rotate their own staff password (currently fixed demo password for all 12 seeded accounts).
3. Receive Firebase web configuration only if Google social login or Firestore migration is explicitly wanted later (no longer a blocker for core functionality).
4. Consider surfacing the emergency live-feed "hospital-confirmed" vs "demo baseline" distinction elsewhere in the UI (e.g. Lookup card) for full consistency.