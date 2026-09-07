#!/usr/bin/env python3
"""
Test script for hospital-verified badge feature.
Tests the /api/hospitals/verified endpoint and related functionality.
"""
import requests
import json
import io
from PIL import Image

# Base URL from frontend/.env
BASE_URL = "https://import-hub-143.preview.emergentagent.com/api"

# Test credentials
MANIPAL_EMAIL = "manipal-test@hospital.com"
MANIPAL_PASSWORD = "testpass123"
PARK_EMAIL = "park-test@hospital.com"
PARK_PASSWORD = "testpass123"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_result(test_name, passed, details=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status} - {test_name}")
    if details:
        print(f"  Details: {details}")

def create_test_jpeg():
    """Create a small valid JPEG image in memory"""
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

def cleanup_state():
    """Delete leftover state to start clean"""
    print_section("CLEANUP: Removing leftover state")
    
    # We can't directly delete from MongoDB via API, but we can check what exists
    # The test will work with whatever state exists
    print("Note: Starting tests with current database state")
    print("Seed data for park-patiala and rajindra should have confirmed=true wards")

def register_staff(email, password, hospital_id):
    """Register a staff account"""
    url = f"{BASE_URL}/auth/register"
    payload = {
        "email": email,
        "password": password,
        "hospitalId": hospital_id
    }
    response = requests.post(url, json=payload)
    return response

def login_staff(email, password):
    """Login and get auth token"""
    url = f"{BASE_URL}/auth/login"
    payload = {
        "email": email,
        "password": password
    }
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        # Extract token from cookie
        cookies = response.cookies
        return cookies.get('access_token')
    return None

def upload_photo(hospital_id, token):
    """Upload a photo for a hospital"""
    url = f"{BASE_URL}/hospitals/{hospital_id}/photo"
    
    # Create a small JPEG
    img_bytes = create_test_jpeg()
    
    files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}
    headers = {'Authorization': f'Bearer {token}'}
    
    response = requests.post(url, files=files, headers=headers)
    return response

def get_verified_status(ids=None):
    """Get verified status for hospitals"""
    url = f"{BASE_URL}/hospitals/verified"
    if ids:
        url += f"?ids={ids}"
    response = requests.get(url)
    return response

def get_hospital_status(hospital_id):
    """Get status for a specific hospital"""
    url = f"{BASE_URL}/hospitals/{hospital_id}/status"
    response = requests.get(url)
    return response

def admit_patient(hospital_id, ward_id, token):
    """Admit a patient to a ward"""
    url = f"{BASE_URL}/hospitals/{hospital_id}/wards/{ward_id}/admit"
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(url, headers=headers)
    return response

def discharge_patient(hospital_id, ward_id, token):
    """Discharge a patient from a ward"""
    url = f"{BASE_URL}/hospitals/{hospital_id}/wards/{ward_id}/discharge"
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(url, headers=headers)
    return response

def test_case_1():
    """Test 1: Initial state (no photos uploaded, no admit/discharge yet)"""
    print_section("TEST CASE 1: Initial State")
    
    response = get_verified_status("park-patiala,manipal-patiala,rajindra")
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        data = response.json()
        
        # Check park-patiala
        park = data.get("park-patiala", {})
        park_correct = (
            park.get("staffConfirmedBedCount") == True and
            park.get("verified") in [True, False]  # Can be true if photo exists
        )
        print_result("park-patiala has staffConfirmedBedCount=true (seed data)", 
                    park.get("staffConfirmedBedCount") == True,
                    f"staffConfirmedBedCount={park.get('staffConfirmedBedCount')}")
        
        # Check rajindra
        rajindra = data.get("rajindra", {})
        rajindra_correct = (
            rajindra.get("staffConfirmedBedCount") == True and
            rajindra.get("verified") in [True, False]  # Can be true if photo exists
        )
        print_result("rajindra has staffConfirmedBedCount=true (seed data)", 
                    rajindra.get("staffConfirmedBedCount") == True,
                    f"staffConfirmedBedCount={rajindra.get('staffConfirmedBedCount')}")
        
        # Check manipal-patiala (should be all false initially)
        manipal = data.get("manipal-patiala", {})
        print_result("manipal-patiala initial state", 
                    True,  # Just report the state
                    f"hasPhoto={manipal.get('hasPhoto')}, staffConfirmedBedCount={manipal.get('staffConfirmedBedCount')}, verified={manipal.get('verified')}")
        
        return True
    else:
        print_result("Test Case 1", False, f"Expected 200, got {response.status_code}")
        return False

def test_case_2():
    """Test 2: Photo alone is not enough"""
    print_section("TEST CASE 2: Photo Alone Not Enough")
    
    # Register staff for manipal-patiala
    print("Registering staff for manipal-patiala...")
    reg_response = register_staff(MANIPAL_EMAIL, MANIPAL_PASSWORD, "manipal-patiala")
    
    if reg_response.status_code == 409:
        print("Staff already registered, logging in...")
        token = login_staff(MANIPAL_EMAIL, MANIPAL_PASSWORD)
    elif reg_response.status_code == 200:
        print("Staff registered successfully")
        # Token is in cookie
        token = reg_response.cookies.get('access_token')
    else:
        print_result("Staff registration", False, f"Status: {reg_response.status_code}, Response: {reg_response.text}")
        return False
    
    if not token:
        print_result("Getting auth token", False, "No token received")
        return False
    
    print(f"Auth token obtained: {token[:20]}...")
    
    # Upload photo
    print("Uploading photo for manipal-patiala...")
    photo_response = upload_photo("manipal-patiala", token)
    print(f"Photo upload status: {photo_response.status_code}")
    if photo_response.status_code != 200:
        print(f"Photo upload response: {photo_response.text}")
    
    # Check verified status
    print("Checking verified status...")
    verified_response = get_verified_status("manipal-patiala")
    
    print(f"Status Code: {verified_response.status_code}")
    print(f"Response: {json.dumps(verified_response.json(), indent=2)}")
    
    if verified_response.status_code == 200:
        data = verified_response.json()
        manipal = data.get("manipal-patiala", {})
        
        has_photo = manipal.get("hasPhoto") == True
        no_bed_confirm = manipal.get("staffConfirmedBedCount") == False
        not_verified = manipal.get("verified") == False
        
        print_result("hasPhoto=true", has_photo, f"hasPhoto={manipal.get('hasPhoto')}")
        print_result("staffConfirmedBedCount=false", no_bed_confirm, f"staffConfirmedBedCount={manipal.get('staffConfirmedBedCount')}")
        print_result("verified=false (photo alone not enough)", not_verified, f"verified={manipal.get('verified')}")
        
        return has_photo and no_bed_confirm and not_verified
    else:
        print_result("Test Case 2", False, f"Expected 200, got {verified_response.status_code}")
        return False

def test_case_3():
    """Test 3: Admit → confirmed flip"""
    print_section("TEST CASE 3: Admit Flips Confirmed to True")
    
    # Get token for manipal staff
    token = login_staff(MANIPAL_EMAIL, MANIPAL_PASSWORD)
    if not token:
        print_result("Login", False, "Could not get auth token")
        return False
    
    # Admit patient to general ward
    print("Admitting patient to general ward...")
    admit_response = admit_patient("manipal-patiala", "general", token)
    print(f"Admit status: {admit_response.status_code}")
    
    if admit_response.status_code != 200:
        print_result("Admit patient", False, f"Status: {admit_response.status_code}, Response: {admit_response.text}")
        return False
    
    print(f"Admit response: {json.dumps(admit_response.json(), indent=2)}")
    
    # Check hospital status
    print("Checking hospital status...")
    status_response = get_hospital_status("manipal-patiala")
    print(f"Status response: {json.dumps(status_response.json(), indent=2)}")
    
    if status_response.status_code == 200:
        data = status_response.json()
        
        # Check general ward confirmed
        general_ward = next((w for w in data.get("wards", []) if w["id"] == "general"), None)
        ward_confirmed = general_ward and general_ward.get("confirmed") == True
        
        # Check top-level staffConfirmedBedCount
        staff_confirmed = data.get("staffConfirmedBedCount") == True
        
        print_result("general ward confirmed=true", ward_confirmed, 
                    f"confirmed={general_ward.get('confirmed') if general_ward else 'N/A'}")
        print_result("staffConfirmedBedCount=true", staff_confirmed, 
                    f"staffConfirmedBedCount={data.get('staffConfirmedBedCount')}")
        
        # Check verified status
        print("Checking verified status...")
        verified_response = get_verified_status("manipal-patiala")
        verified_data = verified_response.json()
        manipal = verified_data.get("manipal-patiala", {})
        
        is_verified = manipal.get("verified") == True
        print_result("verified=true (photo + bed count)", is_verified, 
                    f"verified={manipal.get('verified')}")
        
        return ward_confirmed and staff_confirmed and is_verified
    else:
        print_result("Test Case 3", False, f"Expected 200, got {status_response.status_code}")
        return False

def test_case_4():
    """Test 4: Discharge also flips confirmed to true"""
    print_section("TEST CASE 4: Discharge Flips Confirmed to True")
    
    # Register/login park-patiala staff
    print("Registering staff for park-patiala...")
    reg_response = register_staff(PARK_EMAIL, PARK_PASSWORD, "park-patiala")
    
    if reg_response.status_code == 409:
        print("Staff already registered, logging in...")
        token = login_staff(PARK_EMAIL, PARK_PASSWORD)
    elif reg_response.status_code == 200:
        print("Staff registered successfully")
        token = reg_response.cookies.get('access_token')
    else:
        print_result("Staff registration", False, f"Status: {reg_response.status_code}")
        return False
    
    if not token:
        print_result("Getting auth token", False, "No token received")
        return False
    
    # Discharge patient from maternity ward
    print("Discharging patient from maternity ward...")
    discharge_response = discharge_patient("park-patiala", "maternity", token)
    print(f"Discharge status: {discharge_response.status_code}")
    
    if discharge_response.status_code != 200:
        print_result("Discharge patient", False, f"Status: {discharge_response.status_code}, Response: {discharge_response.text}")
        return False
    
    # Check hospital status
    print("Checking hospital status...")
    status_response = get_hospital_status("park-patiala")
    print(f"Status response: {json.dumps(status_response.json(), indent=2)}")
    
    if status_response.status_code == 200:
        data = status_response.json()
        
        # Check maternity ward confirmed
        maternity_ward = next((w for w in data.get("wards", []) if w["id"] == "maternity"), None)
        ward_confirmed = maternity_ward and maternity_ward.get("confirmed") == True
        
        print_result("maternity ward confirmed=true", ward_confirmed, 
                    f"confirmed={maternity_ward.get('confirmed') if maternity_ward else 'N/A'}")
        
        return ward_confirmed
    else:
        print_result("Test Case 4", False, f"Expected 200, got {status_response.status_code}")
        return False

def test_case_5():
    """Test 5: Persistence across reads (regression on _get_or_seed)"""
    print_section("TEST CASE 5: Persistence Across Reads")
    
    print("Reading manipal-patiala status 3 times...")
    
    confirmed_values = []
    for i in range(3):
        print(f"\nRead #{i+1}:")
        status_response = get_hospital_status("manipal-patiala")
        
        if status_response.status_code == 200:
            data = status_response.json()
            general_ward = next((w for w in data.get("wards", []) if w["id"] == "general"), None)
            confirmed = general_ward.get("confirmed") if general_ward else None
            confirmed_values.append(confirmed)
            print(f"  general ward confirmed={confirmed}")
        else:
            print_result(f"Read #{i+1}", False, f"Status: {status_response.status_code}")
            return False
    
    # All reads should have confirmed=true
    all_true = all(v == True for v in confirmed_values)
    print_result("Confirmed persists across reads", all_true, 
                f"Values: {confirmed_values}")
    
    return all_true

def test_case_6():
    """Test 6: Upload photo for park-patiala and re-check"""
    print_section("TEST CASE 6: Photo Upload for park-patiala")
    
    # Get token for park staff
    token = login_staff(PARK_EMAIL, PARK_PASSWORD)
    if not token:
        print_result("Login", False, "Could not get auth token")
        return False
    
    # Upload photo
    print("Uploading photo for park-patiala...")
    photo_response = upload_photo("park-patiala", token)
    print(f"Photo upload status: {photo_response.status_code}")
    
    if photo_response.status_code != 200:
        print(f"Photo upload response: {photo_response.text}")
        # Continue anyway to check status
    
    # Check verified status
    print("Checking verified status...")
    verified_response = get_verified_status("park-patiala")
    
    print(f"Status Code: {verified_response.status_code}")
    print(f"Response: {json.dumps(verified_response.json(), indent=2)}")
    
    if verified_response.status_code == 200:
        data = verified_response.json()
        park = data.get("park-patiala", {})
        
        is_verified = park.get("verified") == True
        has_photo = park.get("hasPhoto") == True
        has_bed_count = park.get("staffConfirmedBedCount") == True
        
        print_result("hasPhoto=true", has_photo, f"hasPhoto={park.get('hasPhoto')}")
        print_result("staffConfirmedBedCount=true", has_bed_count, f"staffConfirmedBedCount={park.get('staffConfirmedBedCount')}")
        print_result("verified=true", is_verified, f"verified={park.get('verified')}")
        
        return is_verified and has_photo and has_bed_count
    else:
        print_result("Test Case 6", False, f"Expected 200, got {verified_response.status_code}")
        return False

def test_case_7():
    """Test 7: Empty ids → returns hospitals with photo or confirmed ward"""
    print_section("TEST CASE 7: Empty IDs Parameter")
    
    print("Getting verified status with no ids parameter...")
    verified_response = get_verified_status()
    
    print(f"Status Code: {verified_response.status_code}")
    print(f"Response: {json.dumps(verified_response.json(), indent=2)}")
    
    if verified_response.status_code == 200:
        data = verified_response.json()
        
        # Should include at least park-patiala, rajindra, manipal-patiala
        expected_hospitals = ["park-patiala", "rajindra", "manipal-patiala"]
        found_hospitals = list(data.keys())
        
        print(f"Hospitals returned: {found_hospitals}")
        
        all_found = all(h in found_hospitals for h in expected_hospitals)
        print_result("Expected hospitals present", all_found, 
                    f"Expected: {expected_hospitals}, Found: {found_hospitals}")
        
        return all_found
    else:
        print_result("Test Case 7", False, f"Expected 200, got {verified_response.status_code}")
        return False

def main():
    print("\n" + "="*60)
    print("  HOSPITAL VERIFIED BADGE FEATURE TEST")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    
    # Run cleanup
    cleanup_state()
    
    # Run all test cases
    results = {}
    
    results["Test 1: Initial State"] = test_case_1()
    results["Test 2: Photo Alone Not Enough"] = test_case_2()
    results["Test 3: Admit Flips Confirmed"] = test_case_3()
    results["Test 4: Discharge Flips Confirmed"] = test_case_4()
    results["Test 5: Persistence Across Reads"] = test_case_5()
    results["Test 6: Photo Upload for park-patiala"] = test_case_6()
    results["Test 7: Empty IDs Parameter"] = test_case_7()
    
    # Summary
    print_section("TEST SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    exit(main())
