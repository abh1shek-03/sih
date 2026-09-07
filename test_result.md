#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Import GitHub repo, apply progressive disclosure, add real photos (NOT stock images!), doctor
  specialty one-liner, "Request callback" button on doctor profiles, and make staff sign-in personal
  (no pre-seeded demo accounts — each hospital's staff must register their own).

backend:
  - task: "Personal staff sign-up (POST /api/auth/register) + list hospitals endpoint"
    implemented: true
    working: true
    file: "backend/auth.py, backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Removed auto-seeding of demo staff accounts (server.py seed_data() is now a no-op). Deleted the 12 pre-seeded demo docs from Mongo (staff_users). Added POST /api/auth/register (validates hospitalId in whitelist, email format, password >= 8 chars, uniqueness; hashes with bcrypt; sets access_token cookie same as login). Added GET /api/auth/hospitals which returns the 12 hospitals as [{id, name}] for the sign-up dropdown. Existing /api/auth/login, /me, /logout unchanged. HOSPITAL_NAMES map is source of truth."
        - working: true
          agent: "testing"
          comment: "✅ ALL 16 AUTH TESTS PASSED. GET /api/auth/hospitals returns 200 with 12 hospitals including park-patiala, manipal-patiala, rajindra. POST /api/auth/register: valid registration returns 200 with email/hospitalId/hospitalName and sets access_token cookie; duplicate email returns 409; invalid hospitalId returns 400; short password (<8 chars) returns 400; invalid email returns 400. GET /api/auth/me with cookie returns correct user. POST /api/auth/login: correct credentials return 200 and set cookie; wrong password returns 401. POST /api/auth/logout returns 200 and clears cookie. All validation, authentication, and authorization flows working correctly."

  - task: "Real hospital photo upload/fetch (staff-only, per-hospital)"
    implemented: true
    working: true
    file: "backend/hospital_photos.py, backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "New router at /api/hospitals prefix. POST /{id}/photo (auth required, staff can only touch their own hospitalId else 403) accepts multipart file upload OR JSON {contentType, dataBase64}. Only image/jpeg, image/png, image/webp allowed (400 otherwise). Max 3 MB (413 if larger). Stores base64 data-URL in Mongo hospital_photos, upserted per hospitalId. GET /{id}/photo (public) returns {dataUrl, uploadedAt, verified: true} or 404. GET /photos?ids=a,b,c returns bulk map for the Lookup page. DELETE /{id}/photo (auth, own-hospital-only) removes. This is the only path to a real photo — no bundled illustrative images. Frontend never falls back to stock photos: if no photo record exists, patients see a text placeholder saying 'Photo not yet supplied by the hospital'."
        - working: true
          agent: "testing"
          comment: "✅ ALL 21 PHOTO TESTS PASSED. POST /api/hospitals/{id}/photo: valid multipart JPEG upload returns 200 with dataUrl (data:image/jpeg;base64,...) and verified:true; cross-hospital write returns 403; unknown hospital returns 403/404; text/plain content-type returns 400; 4MB oversize file returns 413; empty file returns 400; no auth returns 401. GET /api/hospitals/{id}/photo returns 200 with dataUrl. GET /api/hospitals/photos?ids=a,b,c returns 200 with bulk map (park-patiala present, manipal-patiala absent as expected). DELETE /api/hospitals/{id}/photo: own hospital returns 200 and subsequent GET returns 404; cross-hospital delete returns 403. All upload, fetch, delete, and authorization flows working correctly."

  - task: "Callback requests (POST public, GET+PATCH staff-only)"
    implemented: true
    working: true
    file: "backend/callbacks.py, backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "New /api/callbacks router. POST is public (patients aren't logged in): validates hospitalId is in HOSPITAL_NAMES, patientName len >= 2, phone has 7-20 digits/plus chars. Stores UUID + hospitalId + doctorId/doctorName + patientName + phone + preferredTime + note + status='pending' + createdAt in Mongo callback_requests. Response includes a user-friendly message. GET /api/callbacks (auth required) lists requests filtered to the staff's own hospital, latest first. PATCH /api/callbacks/{id} (auth) marks a callback resolved; cross-hospital returns 403; unknown id returns 404."
        - working: true
          agent: "testing"
          comment: "✅ ALL 15 CALLBACK TESTS PASSED. POST /api/callbacks (public): valid request returns 200 with id/message/hospitalName/patientName/phone/preferredTime/createdAt; invalid hospitalId returns 400; short patientName (<2 chars) returns 400; short phone (<7 digits) returns 400. GET /api/callbacks: no auth returns 401; park staff returns 200 with list containing park callbacks; manipal staff returns 200 with list NOT containing park callbacks (correct hospital filtering). PATCH /api/callbacks/{id}: park staff resolving park callback returns 200 with status:resolved; manipal staff trying to resolve park callback returns 403; non-existent callback returns 404. All public creation, authenticated listing with hospital filtering, and cross-hospital authorization working correctly."

frontend:
  - task: "Real photo upload UI in Console + patient placeholder when no photo"
    implemented: true
    working: "NA"
    file: "frontend/src/App.js, frontend/src/App.css, frontend/src/lib/hospitalPhotos.js, frontend/src/lib/api.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Removed ILLUSTRATIVE_PHOTOS constant and the photo-cycling assignment from api.js — the frontend never bundles stock photos anymore. New hospitalPhotos.js lib (fetchAllPhotos, fetchPhoto, uploadHospitalPhoto, removeHospitalPhoto). New HospitalPhotoUploader component in Console → Hospital profile tab: fetches current photo on mount, shows preview or a 'no photo uploaded yet' empty state, accepts JPEG/PNG/WebP up to 3 MB, uses multipart upload; disables during upload; shows date; supports Replace + Remove. Lookup fetches photos in bulk on mount (fetchAllPhotos) and passes photo prop into HospitalCard. HospitalCard: if photo.dataUrl exists show real photo with 'Photo supplied by <hospital> staff' caption; otherwise show an honest .hospital-photo-empty placeholder card ('MediConnect only shows a hospital's own photo — never a stock image'). No test IDs from prior sessions removed. New testids: hospital-photo-{id}, hospital-photo-empty-{id}, hospital-photo-uploader, hospital-photo-input, hospital-photo-upload-label, hospital-photo-remove, hospital-photo-error."
  - task: "Doctor specialty one-line summary + Request callback button + Sign-up flow"
    implemented: true
    working: "NA"
    file: "frontend/src/App.js, frontend/src/App.css, frontend/src/lib/callbacks.js, frontend/src/lib/auth.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Doctor collapsed rows (inside hospital AND in doctor-search results) now show a formal one-liner under the name: `<specialization> · <designation?> · <experience?>` (built by buildSpecialtyLine). CallbackModal opens from a 'Request callback' button in each doctor's expanded body; posts to /api/callbacks; on success replaces form with confirmation message. Login modal now has two tabs: Sign in / Create account. Sign-up form asks for hospital (dropdown loaded from /api/auth/hospitals), email, password, confirm password; calls /api/auth/register and auto-signs the user in (same cookie). Removed the hardcoded 'manipal-patiala@mediconnect.demo' placeholder. Everything else UI (Progressive disclosure, hospital cards, doctor collapsed rows, emergency cards) preserved from previous change."

  - task: "Progressive disclosure hospital card + doctor profile expansion"
    implemented: true
    working: "NA"
    file: "frontend/src/App.js, frontend/src/App.css, frontend/src/pages/Emergency.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "See previous entry. Retained unchanged in this iteration."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus:
    - "Personal staff sign-up (POST /api/auth/register) + list hospitals endpoint"
    - "Real hospital photo upload/fetch (staff-only, per-hospital)"
    - "Callback requests (POST public, GET+PATCH staff-only)"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: "New endpoints to verify: (1) POST /api/auth/register creates a staff user and issues cookie; GET /api/auth/hospitals returns 12 hospitals. Confirm duplicate email → 409; unknown hospitalId → 400; short password → 400. (2) POST /api/hospitals/{id}/photo requires auth + own hospital; accepts multipart image (jpeg/png/webp, <=3MB); cross-hospital → 403; wrong content-type → 400; oversize → 413; GET /api/hospitals/{id}/photo returns {dataUrl}; GET /api/hospitals/photos?ids=... returns bulk map; DELETE /api/hospitals/{id}/photo requires own-hospital auth. (3) POST /api/callbacks is public; validates hospitalId in whitelist, name >= 2 chars, phone 7-20 digits; GET /api/callbacks requires auth and only returns own hospital's list; PATCH /api/callbacks/{id} marks resolved but rejects cross-hospital with 403. No pre-seeded staff accounts — testing agent should register via /api/auth/register first (see /app/memory/test_credentials.md). Do NOT test the frontend UI in this run — only exercise the backend endpoints."
    - agent: "testing"
      message: "✅ BACKEND TESTING COMPLETE - ALL 52 TESTS PASSED (16 auth + 21 photo + 15 callback). Created comprehensive backend_test.py covering all scenarios from review request. All three new backend features are fully functional: (1) Personal staff sign-up with hospital list - registration, validation, login, logout all working. (2) Real hospital photo upload/fetch - multipart upload, content-type validation, size limits, cross-hospital authorization, bulk fetch, delete all working. (3) Callback requests - public creation, authenticated listing with hospital filtering, cross-hospital authorization all working. No issues found. Backend is production-ready."
