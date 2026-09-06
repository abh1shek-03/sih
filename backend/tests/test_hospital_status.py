"""Backend tests for auth + hospital-status (auth-scoped) endpoints."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
HEADERS = {"Content-Type": "application/json"}
DEMO_PASSWORD = "MediConnect@2026"


def _rand_id(prefix="test"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def _login(email, password=DEMO_PASSWORD):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, headers=HEADERS, timeout=30)
    return s, r


# ---------------- AUTH ----------------
class TestAuth:
    def test_login_success_sets_cookie(self):
        s, r = _login("park-patiala@mediconnect.demo")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == "park-patiala@mediconnect.demo"
        assert data["hospitalId"] == "park-patiala"
        assert data["hospitalName"] == "Park Hospital"
        assert "access_token" in s.cookies

    def test_login_wrong_password(self):
        _, r = _login("park-patiala@mediconnect.demo", password="wrong")
        assert r.status_code == 401

    def test_login_unknown_email(self):
        _, r = _login("does-not-exist@mediconnect.demo")
        assert r.status_code == 401

    def test_me_without_cookie(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=HEADERS, timeout=30)
        assert r.status_code == 401

    def test_me_with_cookie(self):
        s, _ = _login("manipal-patiala@mediconnect.demo")
        r = s.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r.status_code == 200
        assert r.json()["hospitalId"] == "manipal-patiala"

    def test_logout_clears_cookie(self):
        s, _ = _login("manipal-patiala@mediconnect.demo")
        r = s.post(f"{BASE_URL}/api/auth/logout", timeout=30)
        assert r.status_code == 200
        r2 = s.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r2.status_code == 401

    @pytest.mark.parametrize("hospital_id", [
        "gursharan", "manipal-patiala", "park-patiala", "simran-ent", "guru-eye",
        "sanjivni", "gian-sagar", "rama-atray", "bhatia", "rajindra",
        "aas-medicare", "patiala-heart-institute",
    ])
    def test_all_12_seeded_accounts_login(self, hospital_id):
        _, r = _login(f"{hospital_id}@mediconnect.demo")
        assert r.status_code == 200, f"{hospital_id}: {r.text}"


# ---------------- GET status + confirmed flag ----------------
class TestGetStatus:
    def test_generic_hospital_autoseeds(self):
        hid = _rand_id("generic")
        r = requests.get(f"{BASE_URL}/api/hospitals/{hid}/status", timeout=30)
        assert r.status_code == 200
        wards = {w["id"]: w for w in r.json()["wards"]}
        assert wards["general"]["total"] == 40
        assert wards["icu"]["total"] == 8
        assert wards["general"]["confirmed"] is False
        assert wards["icu"]["confirmed"] is False

    def test_park_confirmed_flags(self):
        r = requests.get(f"{BASE_URL}/api/hospitals/park-patiala/status", timeout=30)
        wards = {w["id"]: w for w in r.json()["wards"]}
        assert wards["general"]["total"] == 235 and wards["general"]["confirmed"] is True
        assert wards["icu"]["total"] == 65 and wards["icu"]["confirmed"] is True
        assert wards["maternity"]["confirmed"] is False

    def test_rajindra_confirmed_flags(self):
        r = requests.get(f"{BASE_URL}/api/hospitals/rajindra/status", timeout=30)
        wards = {w["id"]: w for w in r.json()["wards"]}
        assert wards["general"]["total"] == 1009 and wards["general"]["confirmed"] is True
        assert wards["icu"]["total"] == 8 and wards["icu"]["confirmed"] is False


# ---------------- Authorization scoping ----------------
class TestAuthorization:
    def test_admit_no_auth_returns_401(self):
        r = requests.post(f"{BASE_URL}/api/hospitals/park-patiala/wards/icu/admit", timeout=30)
        assert r.status_code == 401

    def test_discharge_no_auth_returns_401(self):
        r = requests.post(f"{BASE_URL}/api/hospitals/park-patiala/wards/icu/discharge", timeout=30)
        assert r.status_code == 401

    def test_doctor_patch_no_auth_returns_401(self):
        r = requests.patch(f"{BASE_URL}/api/hospitals/park-patiala/doctors/xyz",
                            json={"status": "available"}, headers=HEADERS, timeout=30)
        assert r.status_code == 401

    def test_admit_cross_hospital_returns_403(self):
        s, _ = _login("manipal-patiala@mediconnect.demo")
        r = s.post(f"{BASE_URL}/api/hospitals/park-patiala/wards/icu/admit", timeout=30)
        assert r.status_code == 403

    def test_discharge_cross_hospital_returns_403(self):
        s, _ = _login("manipal-patiala@mediconnect.demo")
        r = s.post(f"{BASE_URL}/api/hospitals/park-patiala/wards/icu/discharge", timeout=30)
        assert r.status_code == 403

    def test_doctor_patch_cross_hospital_returns_403(self):
        s, _ = _login("manipal-patiala@mediconnect.demo")
        r = s.patch(f"{BASE_URL}/api/hospitals/park-patiala/doctors/xyz",
                     json={"status": "available"}, timeout=30)
        assert r.status_code == 403

    def test_admit_own_hospital_succeeds(self):
        s, _ = _login("park-patiala@mediconnect.demo")
        r = s.post(f"{BASE_URL}/api/hospitals/park-patiala/wards/icu/admit", timeout=30)
        assert r.status_code == 200

    def test_discharge_own_and_persist(self):
        s, _ = _login("park-patiala@mediconnect.demo")
        before = requests.get(f"{BASE_URL}/api/hospitals/park-patiala/status", timeout=30).json()
        before_avail = next(w for w in before["wards"] if w["id"] == "icu")["available"]
        r = s.post(f"{BASE_URL}/api/hospitals/park-patiala/wards/icu/discharge", timeout=30)
        assert r.status_code == 200
        after_avail = next(w for w in r.json()["wards"] if w["id"] == "icu")["available"]
        assert after_avail == max(0, before_avail - 1)
        # persistence via unauthenticated GET
        r2 = requests.get(f"{BASE_URL}/api/hospitals/park-patiala/status", timeout=30)
        avail2 = next(w for w in r2.json()["wards"] if w["id"] == "icu")["available"]
        assert avail2 == after_avail
        # restore
        s.post(f"{BASE_URL}/api/hospitals/park-patiala/wards/icu/admit", timeout=30)

    def test_doctor_patch_own_hospital_succeeds(self):
        s, _ = _login("gursharan@mediconnect.demo")
        r = s.patch(f"{BASE_URL}/api/hospitals/gursharan/doctors/test-doc-id",
                     json={"status": "available"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["doctors"]["test-doc-id"] == "available"

    def test_doctor_patch_invalid_status_422(self):
        s, _ = _login("gursharan@mediconnect.demo")
        r = s.patch(f"{BASE_URL}/api/hospitals/gursharan/doctors/x",
                     json={"status": "sleeping"}, timeout=30)
        assert r.status_code == 422
