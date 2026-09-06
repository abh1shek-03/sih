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
- P0: Configure Firebase project credentials and implement real email/password staff authentication with admin-approved role mapping. (User deferred again this session — "skip for now")
- P0: Obtain verified hospital contacts, coordinates, ward totals, and staff-confirmed *live* availability before presenting real-time capacity/status (directory-level static data for 12 hospitals is now in place; live bed counts remain unverified/"Not reported").
- P1: IVR/voice agent (Vapi/Bolna) hook using `responseText` from /api/triage for TTS — superseded/partially delivered by the in-app OpenAI TTS/STT voice hook (mic input + Listen playback) added 2026-09-06.
- P1: Add Firestore listeners and trusted server/Cloud Function updates for wards, doctors, audit logs, and review aggregates.
- P1: Replace Maps search links with the Google Maps JavaScript rendering surface once a browser Maps key exists.
- P2: Doctor/specialty search synonym mapping (e.g. "Cardiac Sciences" ↔ "Cardiology") so cross-hospital searches surface all matching doctors — flagged by testing agent, not yet implemented.
- P2: Add patient name/phone profile flow, emergency triage ordering, reviews, disputes, and verified badges.

## Next tasks
1. Receive Firebase web configuration and enable Auth/Firestore (still blocked — user has no keys yet).
2. Receive Google Maps browser key and verified GeoPoints/geohashes.
3. Receive staff-approved ward totals and doctor status confirmations / live ICU-bed feed for the emergency screen.
4. Consider doctor-specialty synonym mapping for better search recall.