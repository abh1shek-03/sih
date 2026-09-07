#!/usr/bin/env python3
"""
Comprehensive backend test for MediConnect new features:
1. Personal staff sign-up + hospital list (auth.py)
2. Real hospital photo upload/fetch (hospital_photos.py)
3. Callback requests (callbacks.py)
"""

import requests
import io
import sys
from PIL import Image

# Backend base URL from frontend/.env
BASE_URL = "https://import-hub-143.preview.emergentagent.com/api"

# Test results tracking
test_results = []

def log_test(name, passed, expected, actual, details=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    test_results.append({
        "name": name,
        "passed": passed,
        "expected": expected,
        "actual": actual,
        "details": details
    })
    print(f"{status}: {name}")
    if not passed:
        print(f"  Expected: {expected}")
        print(f"  Actual: {actual}")
        if details:
            print(f"  Details: {details}")

def create_test_image(size_kb=1):
    """Create a small test JPEG image"""
    img = Image.new('RGB', (32, 32), color='red')
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    return buffer.getvalue()

def create_large_image():
    """Create a 4MB test image"""
    return bytearray(4 * 1024 * 1024)

print("=" * 80)
print("MEDICONNECT BACKEND TEST SUITE")
print("=" * 80)
print()

# ============================================================================
# 1. PERSONAL STAFF SIGN-UP + HOSPITAL LIST (auth.py)
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUITE 1: Personal Staff Sign-up + Hospital List")
print("=" * 80)

# Test 1.1: GET /api/auth/hospitals
print("\n[1.1] GET /api/auth/hospitals - List all hospitals")
try:
    resp = requests.get(f"{BASE_URL}/auth/hospitals")
    passed = resp.status_code == 200
    log_test(
        "GET /api/auth/hospitals returns 200",
        passed,
        "200",
        str(resp.status_code),
        resp.text if not passed else ""
    )
    
    if passed:
        hospitals = resp.json()
        has_12 = len(hospitals) == 12
        log_test(
            "Hospital list contains 12 hospitals",
            has_12,
            "12 hospitals",
            f"{len(hospitals)} hospitals"
        )
        
        required_ids = ["park-patiala", "manipal-patiala", "rajindra"]
        hospital_ids = [h["id"] for h in hospitals]
        has_required = all(hid in hospital_ids for hid in required_ids)
        log_test(
            "Hospital list includes park-patiala, manipal-patiala, rajindra",
            has_required,
            f"All of {required_ids}",
            f"Found: {[hid for hid in required_ids if hid in hospital_ids]}"
        )
except Exception as e:
    log_test("GET /api/auth/hospitals", False, "200", "Exception", str(e))

# Test 1.2: POST /api/auth/register - Valid registration
print("\n[1.2] POST /api/auth/register - Valid registration")
session_park = requests.Session()
try:
    register_data = {
        "email": "qa1@mediconnect.test",
        "password": "TestPass1234!",
        "hospitalId": "park-patiala"
    }
    resp = session_park.post(f"{BASE_URL}/auth/register", json=register_data)
    passed = resp.status_code == 200
    log_test(
        "POST /api/auth/register with valid data returns 200",
        passed,
        "200",
        str(resp.status_code),
        resp.text if not passed else ""
    )
    
    if passed:
        data = resp.json()
        has_fields = all(k in data for k in ["email", "hospitalId", "hospitalName"])
        log_test(
            "Register response contains email, hospitalId, hospitalName",
            has_fields,
            "All fields present",
            f"Fields: {list(data.keys())}"
        )
        
        has_cookie = "access_token" in session_park.cookies
        log_test(
            "Register sets access_token cookie",
            has_cookie,
            "Cookie set",
            "Cookie set" if has_cookie else "No cookie"
        )
except Exception as e:
    log_test("POST /api/auth/register valid", False, "200", "Exception", str(e))

# Test 1.3: Duplicate email registration
print("\n[1.3] POST /api/auth/register - Duplicate email")
try:
    resp = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    passed = resp.status_code == 409
    log_test(
        "POST /api/auth/register with duplicate email returns 409",
        passed,
        "409",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Duplicate email registration", False, "409", "Exception", str(e))

# Test 1.4: Bad hospitalId
print("\n[1.4] POST /api/auth/register - Invalid hospitalId")
try:
    bad_hospital_data = {
        "email": "qa2@mediconnect.test",
        "password": "TestPass1234!",
        "hospitalId": "not-a-real-hospital"
    }
    resp = requests.post(f"{BASE_URL}/auth/register", json=bad_hospital_data)
    passed = resp.status_code == 400
    log_test(
        "POST /api/auth/register with invalid hospitalId returns 400",
        passed,
        "400",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Invalid hospitalId registration", False, "400", "Exception", str(e))

# Test 1.5: Short password
print("\n[1.5] POST /api/auth/register - Short password")
try:
    short_pwd_data = {
        "email": "qa3@mediconnect.test",
        "password": "short",
        "hospitalId": "park-patiala"
    }
    resp = requests.post(f"{BASE_URL}/auth/register", json=short_pwd_data)
    passed = resp.status_code == 400
    log_test(
        "POST /api/auth/register with short password returns 400",
        passed,
        "400",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Short password registration", False, "400", "Exception", str(e))

# Test 1.6: Bad email
print("\n[1.6] POST /api/auth/register - Invalid email")
try:
    bad_email_data = {
        "email": "nope",
        "password": "TestPass1234!",
        "hospitalId": "park-patiala"
    }
    resp = requests.post(f"{BASE_URL}/auth/register", json=bad_email_data)
    passed = resp.status_code == 400
    log_test(
        "POST /api/auth/register with invalid email returns 400",
        passed,
        "400",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Invalid email registration", False, "400", "Exception", str(e))

# Test 1.7: GET /api/auth/me with cookie
print("\n[1.7] GET /api/auth/me - Authenticated user")
try:
    resp = session_park.get(f"{BASE_URL}/auth/me")
    passed = resp.status_code == 200
    log_test(
        "GET /api/auth/me with cookie returns 200",
        passed,
        "200",
        str(resp.status_code),
        resp.text if not passed else ""
    )
    
    if passed:
        data = resp.json()
        correct_email = data.get("email") == "qa1@mediconnect.test"
        log_test(
            "GET /api/auth/me returns correct user",
            correct_email,
            "qa1@mediconnect.test",
            data.get("email", "")
        )
except Exception as e:
    log_test("GET /api/auth/me", False, "200", "Exception", str(e))

# Test 1.8: POST /api/auth/login - Correct credentials
print("\n[1.8] POST /api/auth/login - Correct credentials")
session_login = requests.Session()
try:
    login_data = {
        "email": "qa1@mediconnect.test",
        "password": "TestPass1234!"
    }
    resp = session_login.post(f"{BASE_URL}/auth/login", json=login_data)
    passed = resp.status_code == 200
    log_test(
        "POST /api/auth/login with correct credentials returns 200",
        passed,
        "200",
        str(resp.status_code),
        resp.text if not passed else ""
    )
    
    if passed:
        has_cookie = "access_token" in session_login.cookies
        log_test(
            "Login sets access_token cookie",
            has_cookie,
            "Cookie set",
            "Cookie set" if has_cookie else "No cookie"
        )
except Exception as e:
    log_test("POST /api/auth/login correct", False, "200", "Exception", str(e))

# Test 1.9: POST /api/auth/login - Wrong password
print("\n[1.9] POST /api/auth/login - Wrong password")
try:
    wrong_pwd_data = {
        "email": "qa1@mediconnect.test",
        "password": "WrongPassword123!"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=wrong_pwd_data)
    passed = resp.status_code == 401
    log_test(
        "POST /api/auth/login with wrong password returns 401",
        passed,
        "401",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("POST /api/auth/login wrong password", False, "401", "Exception", str(e))

# Test 1.10: POST /api/auth/logout
print("\n[1.10] POST /api/auth/logout")
try:
    resp = session_park.post(f"{BASE_URL}/auth/logout")
    passed = resp.status_code == 200
    log_test(
        "POST /api/auth/logout returns 200",
        passed,
        "200",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("POST /api/auth/logout", False, "200", "Exception", str(e))

# ============================================================================
# 2. REAL HOSPITAL PHOTO UPLOAD/FETCH (hospital_photos.py)
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUITE 2: Real Hospital Photo Upload/Fetch")
print("=" * 80)

# Register two staff accounts for photo testing
print("\n[2.0] Setup - Register park-patiala and manipal-patiala staff")
session_park_photo = requests.Session()
session_manipal_photo = requests.Session()

try:
    # Park staff
    park_staff_data = {
        "email": "park.photo@mediconnect.test",
        "password": "ParkPhoto123!",
        "hospitalId": "park-patiala"
    }
    resp = session_park_photo.post(f"{BASE_URL}/auth/register", json=park_staff_data)
    park_registered = resp.status_code == 200
    log_test(
        "Register park-patiala staff for photo tests",
        park_registered,
        "200",
        str(resp.status_code)
    )
    
    # Manipal staff
    manipal_staff_data = {
        "email": "manipal.photo@mediconnect.test",
        "password": "ManipalPhoto123!",
        "hospitalId": "manipal-patiala"
    }
    resp = session_manipal_photo.post(f"{BASE_URL}/auth/register", json=manipal_staff_data)
    manipal_registered = resp.status_code == 200
    log_test(
        "Register manipal-patiala staff for photo tests",
        manipal_registered,
        "200",
        str(resp.status_code)
    )
except Exception as e:
    log_test("Setup photo test accounts", False, "200", "Exception", str(e))

# Test 2.1: POST /api/hospitals/park-patiala/photo - Valid upload
print("\n[2.1] POST /api/hospitals/park-patiala/photo - Valid multipart upload")
try:
    test_image = create_test_image()
    files = {'file': ('test.jpg', io.BytesIO(test_image), 'image/jpeg')}
    resp = session_park_photo.post(f"{BASE_URL}/hospitals/park-patiala/photo", files=files)
    passed = resp.status_code == 200
    log_test(
        "POST /api/hospitals/park-patiala/photo as park staff returns 200",
        passed,
        "200",
        str(resp.status_code),
        resp.text if not passed else ""
    )
    
    if passed:
        data = resp.json()
        has_data_url = "dataUrl" in data and data["dataUrl"].startswith("data:image/jpeg;base64,")
        log_test(
            "Photo upload response contains valid dataUrl",
            has_data_url,
            "dataUrl starts with data:image/jpeg;base64,",
            f"dataUrl present: {('dataUrl' in data)}, starts correctly: {data.get('dataUrl', '')[:30] if 'dataUrl' in data else 'N/A'}"
        )
        
        has_verified = data.get("verified") == True
        log_test(
            "Photo upload response has verified: true",
            has_verified,
            "verified: true",
            f"verified: {data.get('verified')}"
        )
except Exception as e:
    log_test("POST photo valid upload", False, "200", "Exception", str(e))

# Test 2.2: GET /api/hospitals/park-patiala/photo
print("\n[2.2] GET /api/hospitals/park-patiala/photo - Fetch uploaded photo")
try:
    resp = requests.get(f"{BASE_URL}/hospitals/park-patiala/photo")
    passed = resp.status_code == 200
    log_test(
        "GET /api/hospitals/park-patiala/photo returns 200",
        passed,
        "200",
        str(resp.status_code),
        resp.text if not passed else ""
    )
    
    if passed:
        data = resp.json()
        has_data_url = "dataUrl" in data and data["dataUrl"].startswith("data:image/jpeg;base64,")
        log_test(
            "GET photo returns same dataUrl",
            has_data_url,
            "dataUrl present and valid",
            f"dataUrl present: {('dataUrl' in data)}"
        )
except Exception as e:
    log_test("GET photo", False, "200", "Exception", str(e))

# Test 2.3: GET /api/hospitals/photos?ids=park-patiala,manipal-patiala
print("\n[2.3] GET /api/hospitals/photos?ids=park-patiala,manipal-patiala - Bulk fetch")
try:
    resp = requests.get(f"{BASE_URL}/hospitals/photos?ids=park-patiala,manipal-patiala")
    passed = resp.status_code == 200
    log_test(
        "GET /api/hospitals/photos with ids returns 200",
        passed,
        "200",
        str(resp.status_code),
        resp.text if not passed else ""
    )
    
    if passed:
        data = resp.json()
        has_park = "park-patiala" in data
        log_test(
            "Bulk photos includes park-patiala",
            has_park,
            "park-patiala present",
            f"park-patiala in response: {has_park}"
        )
        
        no_manipal = "manipal-patiala" not in data
        log_test(
            "Bulk photos does NOT include manipal-patiala (no upload yet)",
            no_manipal,
            "manipal-patiala absent",
            f"manipal-patiala in response: {not no_manipal}"
        )
except Exception as e:
    log_test("GET bulk photos", False, "200", "Exception", str(e))

# Test 2.4: Cross-hospital write - park staff tries to upload to manipal
print("\n[2.4] POST /api/hospitals/manipal-patiala/photo - Cross-hospital write")
try:
    test_image = create_test_image()
    files = {'file': ('test.jpg', io.BytesIO(test_image), 'image/jpeg')}
    resp = session_park_photo.post(f"{BASE_URL}/hospitals/manipal-patiala/photo", files=files)
    passed = resp.status_code == 403
    log_test(
        "POST photo to different hospital returns 403",
        passed,
        "403",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Cross-hospital photo upload", False, "403", "Exception", str(e))

# Test 2.5: Unknown hospital
print("\n[2.5] POST /api/hospitals/does-not-exist/photo - Unknown hospital")
try:
    test_image = create_test_image()
    files = {'file': ('test.jpg', io.BytesIO(test_image), 'image/jpeg')}
    resp = session_park_photo.post(f"{BASE_URL}/hospitals/does-not-exist/photo", files=files)
    passed = resp.status_code in [403, 404]
    log_test(
        "POST photo to unknown hospital returns 403 or 404",
        passed,
        "403 or 404",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Unknown hospital photo upload", False, "403 or 404", "Exception", str(e))

# Test 2.6: Content-type check - text/plain instead of image
print("\n[2.6] POST /api/hospitals/park-patiala/photo - Wrong content type")
try:
    files = {'file': ('test.txt', io.BytesIO(b'not an image'), 'text/plain')}
    resp = session_park_photo.post(f"{BASE_URL}/hospitals/park-patiala/photo", files=files)
    passed = resp.status_code == 400
    log_test(
        "POST photo with text/plain content-type returns 400",
        passed,
        "400",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Wrong content-type photo upload", False, "400", "Exception", str(e))

# Test 2.7: Oversize file - 4MB
print("\n[2.7] POST /api/hospitals/park-patiala/photo - Oversize file")
try:
    large_image = create_large_image()
    files = {'file': ('large.jpg', io.BytesIO(large_image), 'image/jpeg')}
    resp = session_park_photo.post(f"{BASE_URL}/hospitals/park-patiala/photo", files=files)
    passed = resp.status_code == 413
    log_test(
        "POST photo with 4MB file returns 413",
        passed,
        "413",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Oversize photo upload", False, "413", "Exception", str(e))

# Test 2.8: Empty file
print("\n[2.8] POST /api/hospitals/park-patiala/photo - Empty file")
try:
    files = {'file': ('empty.jpg', io.BytesIO(b''), 'image/jpeg')}
    resp = session_park_photo.post(f"{BASE_URL}/hospitals/park-patiala/photo", files=files)
    passed = resp.status_code == 400
    log_test(
        "POST photo with empty file returns 400",
        passed,
        "400",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Empty file photo upload", False, "400", "Exception", str(e))

# Test 2.9: No auth cookie
print("\n[2.9] POST /api/hospitals/park-patiala/photo - No authentication")
try:
    test_image = create_test_image()
    files = {'file': ('test.jpg', io.BytesIO(test_image), 'image/jpeg')}
    resp = requests.post(f"{BASE_URL}/hospitals/park-patiala/photo", files=files)
    passed = resp.status_code == 401
    log_test(
        "POST photo without auth returns 401",
        passed,
        "401",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("No auth photo upload", False, "401", "Exception", str(e))

# Test 2.10: DELETE /api/hospitals/park-patiala/photo as park staff
print("\n[2.10] DELETE /api/hospitals/park-patiala/photo - Own hospital")
try:
    resp = session_park_photo.delete(f"{BASE_URL}/hospitals/park-patiala/photo")
    passed = resp.status_code == 200
    log_test(
        "DELETE photo as own hospital staff returns 200",
        passed,
        "200",
        str(resp.status_code),
        resp.text if not passed else ""
    )
    
    # Verify photo is deleted
    if passed:
        resp = requests.get(f"{BASE_URL}/hospitals/park-patiala/photo")
        deleted = resp.status_code == 404
        log_test(
            "GET photo after DELETE returns 404",
            deleted,
            "404",
            str(resp.status_code)
        )
except Exception as e:
    log_test("DELETE photo own hospital", False, "200", "Exception", str(e))

# Test 2.11: Re-upload photo for next test
print("\n[2.11] Re-upload park-patiala photo for cross-hospital delete test")
try:
    test_image = create_test_image()
    files = {'file': ('test.jpg', io.BytesIO(test_image), 'image/jpeg')}
    resp = session_park_photo.post(f"{BASE_URL}/hospitals/park-patiala/photo", files=files)
    passed = resp.status_code == 200
    log_test(
        "Re-upload park-patiala photo",
        passed,
        "200",
        str(resp.status_code)
    )
except Exception as e:
    log_test("Re-upload photo", False, "200", "Exception", str(e))

# Test 2.12: DELETE as manipal staff on park photo
print("\n[2.12] DELETE /api/hospitals/park-patiala/photo - Cross-hospital delete")
try:
    resp = session_manipal_photo.delete(f"{BASE_URL}/hospitals/park-patiala/photo")
    passed = resp.status_code == 403
    log_test(
        "DELETE photo as different hospital staff returns 403",
        passed,
        "403",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Cross-hospital photo delete", False, "403", "Exception", str(e))

# ============================================================================
# 3. CALLBACK REQUESTS (callbacks.py)
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUITE 3: Callback Requests")
print("=" * 80)

# Test 3.1: POST /api/callbacks - Valid public request
print("\n[3.1] POST /api/callbacks - Valid public request")
callback_id = None
try:
    callback_data = {
        "hospitalId": "park-patiala",
        "doctorId": "park-patiala-d0",
        "doctorName": "Dr. Rajesh Kumar",
        "patientName": "Amit Singh",
        "phone": "+91 9812345678",
        "preferredTime": "Within 2 hours",
        "note": "chest pain"
    }
    resp = requests.post(f"{BASE_URL}/callbacks", json=callback_data)
    passed = resp.status_code == 200
    log_test(
        "POST /api/callbacks with valid data returns 200",
        passed,
        "200",
        str(resp.status_code),
        resp.text if not passed else ""
    )
    
    if passed:
        data = resp.json()
        required_fields = ["id", "message", "hospitalName", "patientName", "phone", "preferredTime", "createdAt"]
        has_fields = all(f in data for f in required_fields)
        log_test(
            "Callback response contains required fields",
            has_fields,
            f"All of {required_fields}",
            f"Fields: {list(data.keys())}"
        )
        callback_id = data.get("id")
except Exception as e:
    log_test("POST callback valid", False, "200", "Exception", str(e))

# Test 3.2: Invalid hospitalId
print("\n[3.2] POST /api/callbacks - Invalid hospitalId")
try:
    bad_hospital_callback = {
        "hospitalId": "not-a-real-hospital",
        "patientName": "Test Patient",
        "phone": "+91 9812345678"
    }
    resp = requests.post(f"{BASE_URL}/callbacks", json=bad_hospital_callback)
    passed = resp.status_code == 400
    log_test(
        "POST /api/callbacks with invalid hospitalId returns 400",
        passed,
        "400",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Invalid hospitalId callback", False, "400", "Exception", str(e))

# Test 3.3: Short patientName
print("\n[3.3] POST /api/callbacks - Short patientName")
try:
    short_name_callback = {
        "hospitalId": "park-patiala",
        "patientName": "A",
        "phone": "+91 9812345678"
    }
    resp = requests.post(f"{BASE_URL}/callbacks", json=short_name_callback)
    passed = resp.status_code == 400
    log_test(
        "POST /api/callbacks with short patientName returns 400",
        passed,
        "400",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Short patientName callback", False, "400", "Exception", str(e))

# Test 3.4: Short phone
print("\n[3.4] POST /api/callbacks - Short phone")
try:
    short_phone_callback = {
        "hospitalId": "park-patiala",
        "patientName": "Test Patient",
        "phone": "12"
    }
    resp = requests.post(f"{BASE_URL}/callbacks", json=short_phone_callback)
    passed = resp.status_code == 400
    log_test(
        "POST /api/callbacks with short phone returns 400",
        passed,
        "400",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("Short phone callback", False, "400", "Exception", str(e))

# Test 3.5: GET /api/callbacks without auth
print("\n[3.5] GET /api/callbacks - No authentication")
try:
    resp = requests.get(f"{BASE_URL}/callbacks")
    passed = resp.status_code == 401
    log_test(
        "GET /api/callbacks without auth returns 401",
        passed,
        "401",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("GET callbacks no auth", False, "401", "Exception", str(e))

# Test 3.6: GET /api/callbacks as park staff
print("\n[3.6] GET /api/callbacks - Park staff sees park callbacks")
try:
    resp = session_park_photo.get(f"{BASE_URL}/callbacks")
    passed = resp.status_code == 200
    log_test(
        "GET /api/callbacks as park staff returns 200",
        passed,
        "200",
        str(resp.status_code),
        resp.text if not passed else ""
    )
    
    if passed:
        callbacks = resp.json()
        is_list = isinstance(callbacks, list)
        log_test(
            "GET callbacks returns list",
            is_list,
            "list",
            f"type: {type(callbacks).__name__}"
        )
        
        if is_list and callback_id:
            has_callback = any(cb.get("id") == callback_id for cb in callbacks)
            log_test(
                "Park staff sees the park callback",
                has_callback,
                f"Callback {callback_id} in list",
                f"Found: {has_callback}"
            )
except Exception as e:
    log_test("GET callbacks park staff", False, "200", "Exception", str(e))

# Test 3.7: GET /api/callbacks as manipal staff
print("\n[3.7] GET /api/callbacks - Manipal staff does NOT see park callbacks")
try:
    resp = session_manipal_photo.get(f"{BASE_URL}/callbacks")
    passed = resp.status_code == 200
    log_test(
        "GET /api/callbacks as manipal staff returns 200",
        passed,
        "200",
        str(resp.status_code),
        resp.text if not passed else ""
    )
    
    if passed and callback_id:
        callbacks = resp.json()
        no_park_callback = not any(cb.get("id") == callback_id for cb in callbacks)
        log_test(
            "Manipal staff does NOT see park callback",
            no_park_callback,
            f"Callback {callback_id} NOT in list",
            f"Found: {not no_park_callback}"
        )
except Exception as e:
    log_test("GET callbacks manipal staff", False, "200", "Exception", str(e))

# Test 3.8: PATCH /api/callbacks/{id} as park staff
print("\n[3.8] PATCH /api/callbacks/{id} - Park staff resolves park callback")
if callback_id:
    try:
        resp = session_park_photo.patch(f"{BASE_URL}/callbacks/{callback_id}")
        passed = resp.status_code == 200
        log_test(
            "PATCH /api/callbacks/{id} as park staff returns 200",
            passed,
            "200",
            str(resp.status_code),
            resp.text if not passed else ""
        )
        
        if passed:
            data = resp.json()
            is_resolved = data.get("status") == "resolved"
            log_test(
                "PATCH callback sets status to resolved",
                is_resolved,
                "status: resolved",
                f"status: {data.get('status')}"
            )
    except Exception as e:
        log_test("PATCH callback park staff", False, "200", "Exception", str(e))
else:
    log_test("PATCH callback park staff", False, "200", "No callback_id", "Skipped - no callback created")

# Test 3.9: Create another callback for cross-hospital PATCH test
print("\n[3.9] Create another park callback for cross-hospital PATCH test")
callback_id_2 = None
try:
    callback_data_2 = {
        "hospitalId": "park-patiala",
        "doctorId": "park-patiala-d1",
        "doctorName": "Dr. Priya Sharma",
        "patientName": "Neha Verma",
        "phone": "+91 9876543210",
        "preferredTime": "Tomorrow morning",
        "note": "follow-up consultation"
    }
    resp = requests.post(f"{BASE_URL}/callbacks", json=callback_data_2)
    passed = resp.status_code == 200
    if passed:
        callback_id_2 = resp.json().get("id")
    log_test(
        "Create second park callback",
        passed,
        "200",
        str(resp.status_code)
    )
except Exception as e:
    log_test("Create second callback", False, "200", "Exception", str(e))

# Test 3.10: PATCH as manipal staff on park callback
print("\n[3.10] PATCH /api/callbacks/{id} - Cross-hospital PATCH")
if callback_id_2:
    try:
        resp = session_manipal_photo.patch(f"{BASE_URL}/callbacks/{callback_id_2}")
        passed = resp.status_code == 403
        log_test(
            "PATCH callback as different hospital staff returns 403",
            passed,
            "403",
            str(resp.status_code),
            resp.text if not passed else ""
        )
    except Exception as e:
        log_test("Cross-hospital PATCH callback", False, "403", "Exception", str(e))
else:
    log_test("Cross-hospital PATCH callback", False, "403", "No callback_id_2", "Skipped - no callback created")

# Test 3.11: PATCH non-existent callback
print("\n[3.11] PATCH /api/callbacks/does-not-exist - Non-existent callback")
try:
    resp = session_park_photo.patch(f"{BASE_URL}/callbacks/does-not-exist")
    passed = resp.status_code == 404
    log_test(
        "PATCH non-existent callback returns 404",
        passed,
        "404",
        str(resp.status_code),
        resp.text if not passed else ""
    )
except Exception as e:
    log_test("PATCH non-existent callback", False, "404", "Exception", str(e))

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)

passed_tests = [t for t in test_results if t["passed"]]
failed_tests = [t for t in test_results if not t["passed"]]

print(f"\nTotal Tests: {len(test_results)}")
print(f"Passed: {len(passed_tests)} ✅")
print(f"Failed: {len(failed_tests)} ❌")

if failed_tests:
    print("\n" + "=" * 80)
    print("FAILED TESTS DETAILS")
    print("=" * 80)
    for test in failed_tests:
        print(f"\n❌ {test['name']}")
        print(f"   Expected: {test['expected']}")
        print(f"   Actual: {test['actual']}")
        if test['details']:
            print(f"   Details: {test['details']}")

# Exit with appropriate code
sys.exit(0 if len(failed_tests) == 0 else 1)
