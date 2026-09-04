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

### 2026-09-04
- Replaced starter screen with MediConnect clinical-calm interface using Fraunces and IBM Plex Sans, teal/navy palette, status language, responsive layouts, and meaningful motion.
- Added 10 supplied Patiala hospitals and the supplied doctor records, including specialties, experience, ratings where supplied, consultation fees, doctor counts, locations/areas, and OPD/opening hours.
- Added hospital search, hospital cards, safe detail expansion, doctor/specialty table search, and Google Maps search links.
- Added local Hospital Console preview with ward steppers, derived occupancy/availability math for preview wards, doctor status toggles, profile tab, and demo staff messaging.
- Added Firebase configuration boundary and Firebase dependency without pretending live authentication is active when credentials are absent.
- Passed production build and frontend end-to-end verification for desktop/mobile flows. MOCKED: local directory data, local staff session/ward state, and Google Maps search URLs.

## Prioritized backlog
- P0: Configure Firebase project credentials and implement real email/password staff authentication with admin-approved role mapping.
- P0: Obtain verified hospital contacts, coordinates, ward totals, and staff-confirmed availability before presenting live capacity/status.
- P1: Add the two remaining Patiala hospitals if the intended list is 12; only embed records supplied or verified by the user.
- P1: Add Firestore listeners and trusted server/Cloud Function updates for wards, doctors, audit logs, and review aggregates.
- P1: Replace Maps search links with the Google Maps JavaScript rendering surface once a browser Maps key exists.
- P2: Add patient name/phone profile flow, emergency triage ordering, reviews, disputes, and verified badges.

## Next tasks
1. Receive the remaining two hospital records or confirm that the supplied 10-record list is complete.
2. Receive Firebase web configuration and enable Auth/Firestore.
3. Receive Google Maps browser key and verified GeoPoints/geohashes.
4. Receive staff-approved ward totals and doctor status confirmations.