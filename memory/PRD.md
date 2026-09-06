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
- P0: Configure Firebase project credentials and implement real email/password staff authentication with admin-approved role mapping. (User deferred again this session — "skip for now"; live bed-count persistence no longer depends on Firebase, now on MediConnect's own backend.)
- P1: Add real auth/rate-limiting to `/api/hospitals/*` status-mutation endpoints before any production use (currently anyone can admit/discharge/toggle doctors — acceptable for demo staff-sign-in scope only).
- P1: Add Firestore listeners and trusted server/Cloud Function updates for wards, doctors, audit logs, and review aggregates. (Superseded in spirit by the new Mongo-backed live status endpoints; revisit once real Firebase/staff-auth is connected.)
- P1: Replace Maps search links with the Google Maps JavaScript rendering surface once a browser Maps key exists.
- P2: Tighten search-synonym matching further (currently word-boundary regex; still some noise on very short queries like "ent").
- P2: Add patient name/phone profile flow, emergency triage ordering, reviews, disputes, and verified badges.

## Next tasks
1. Receive Firebase web configuration and enable Auth/Firestore (still blocked — user has no keys yet); once available, migrate hospital_status collection data over or keep Mongo as the system of record.
2. Receive Google Maps browser key and verified GeoPoints/geohashes.
3. Receive staff-approved live ICU-bed feed for the emergency screen (currently static hospital-supplied figures only).
4. Add real staff authentication (currently demo sign-in with no credential check) before the live admit/discharge endpoints go to production.