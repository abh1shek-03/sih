"""Backend tests for the new live bed count endpoints under /api/hospitals."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://care-finder-45.preview.emergentagent.com").rstrip("/")
HEADERS = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (compatible; PytestSDET/1.0)"}


def _rand_id(prefix="test"):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


# ---------------- GET status + auto-seed ----------------
class TestGetStatus:
    def test_generic_hospital_autoseeds_with_template(self):
        hid = _rand_id("generic")
        r = requests.get(f"{BASE_URL}/api/hospitals/{hid}/status", headers=HEADERS, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["id"] == hid
        wards = {w["id"]: w for w in data["wards"]}
        assert wards["general"]["total"] == 40 and wards["general"]["available"] == 40
        assert wards["icu"]["total"] == 8 and wards["icu"]["available"] == 8
        assert wards["maternity"]["total"] == 12 and wards["maternity"]["available"] == 12
        assert data["overallStatus"] == "available"
        assert data["doctors"] == {}

    def test_park_patiala_has_override_totals(self):
        r = requests.get(f"{BASE_URL}/api/hospitals/park-patiala/status", headers=HEADERS, timeout=30)
        assert r.status_code == 200
        wards = {w["id"]: w for w in r.json()["wards"]}
        assert wards["general"]["total"] == 235
        assert wards["icu"]["total"] == 65
        assert wards["maternity"]["total"] == 12

    def test_rajindra_has_override_totals(self):
        r = requests.get(f"{BASE_URL}/api/hospitals/rajindra/status", headers=HEADERS, timeout=30)
        assert r.status_code == 200
        wards = {w["id"]: w for w in r.json()["wards"]}
        assert wards["general"]["total"] == 1009
        assert wards["icu"]["total"] == 8

    def test_bulk_status_returns_map(self):
        ids = [_rand_id("bulk1"), _rand_id("bulk2")]
        r = requests.get(f"{BASE_URL}/api/hospitals/status", params={"ids": ",".join(ids)}, headers=HEADERS, timeout=30)
        assert r.status_code == 200
        data = r.json()
        for hid in ids:
            assert hid in data
            assert "wards" in data[hid] and "overallStatus" in data[hid]


# ---------------- Admit / Discharge persistence ----------------
class TestAdmitDischarge:
    def test_discharge_decreases_and_persists(self):
        hid = _rand_id("disch")
        # seed
        requests.get(f"{BASE_URL}/api/hospitals/{hid}/status", headers=HEADERS, timeout=30)
        r = requests.post(f"{BASE_URL}/api/hospitals/{hid}/wards/icu/discharge", headers=HEADERS, timeout=30)
        assert r.status_code == 200
        icu = next(w for w in r.json()["wards"] if w["id"] == "icu")
        assert icu["available"] == 7  # 8 - 1
        # verify persistence
        r2 = requests.get(f"{BASE_URL}/api/hospitals/{hid}/status", headers=HEADERS, timeout=30)
        icu2 = next(w for w in r2.json()["wards"] if w["id"] == "icu")
        assert icu2["available"] == 7

    def test_admit_increases_capped_at_total(self):
        hid = _rand_id("admit")
        requests.get(f"{BASE_URL}/api/hospitals/{hid}/status", headers=HEADERS, timeout=30)
        # already at max; admit shouldn't exceed
        r = requests.post(f"{BASE_URL}/api/hospitals/{hid}/wards/icu/admit", headers=HEADERS, timeout=30)
        assert r.status_code == 200
        icu = next(w for w in r.json()["wards"] if w["id"] == "icu")
        assert icu["available"] == 8  # capped

    def test_discharge_floored_at_zero(self):
        hid = _rand_id("floor")
        requests.get(f"{BASE_URL}/api/hospitals/{hid}/status", headers=HEADERS, timeout=30)
        # icu total = 8; discharge 10 times
        for _ in range(10):
            requests.post(f"{BASE_URL}/api/hospitals/{hid}/wards/icu/discharge", headers=HEADERS, timeout=30)
        r = requests.get(f"{BASE_URL}/api/hospitals/{hid}/status", headers=HEADERS, timeout=30)
        icu = next(w for w in r.json()["wards"] if w["id"] == "icu")
        assert icu["available"] == 0
        assert icu["status"] == "full"

    def test_unknown_ward_returns_404(self):
        hid = _rand_id("nowhere")
        requests.get(f"{BASE_URL}/api/hospitals/{hid}/status", headers=HEADERS, timeout=30)
        r = requests.post(f"{BASE_URL}/api/hospitals/{hid}/wards/nonexistent/discharge", headers=HEADERS, timeout=30)
        assert r.status_code == 404


# ---------------- Doctor status patch ----------------
class TestDoctorStatus:
    def test_set_doctor_available_persists(self):
        hid = _rand_id("doc")
        did = "some-doctor-id"
        r = requests.patch(
            f"{BASE_URL}/api/hospitals/{hid}/doctors/{did}",
            json={"status": "available"}, headers=HEADERS, timeout=30,
        )
        assert r.status_code == 200, r.text
        assert r.json()["doctors"][did] == "available"
        # persist
        r2 = requests.get(f"{BASE_URL}/api/hospitals/{hid}/status", headers=HEADERS, timeout=30)
        assert r2.json()["doctors"][did] == "available"

    def test_invalid_status_returns_422(self):
        hid = _rand_id("badstatus")
        r = requests.patch(
            f"{BASE_URL}/api/hospitals/{hid}/doctors/x",
            json={"status": "sleeping"}, headers=HEADERS, timeout=30,
        )
        assert r.status_code == 422


# ---------------- End-to-end Park Hospital ICU flow ----------------
def test_end_to_end_park_icu_flow():
    """Snapshot Park ICU, discharge once, ensure decrement, then restore."""
    r = requests.get(f"{BASE_URL}/api/hospitals/park-patiala/status", headers=HEADERS, timeout=30)
    before = next(w for w in r.json()["wards"] if w["id"] == "icu")["available"]
    r2 = requests.post(f"{BASE_URL}/api/hospitals/park-patiala/wards/icu/discharge", headers=HEADERS, timeout=30)
    after = next(w for w in r2.json()["wards"] if w["id"] == "icu")["available"]
    assert after == max(0, before - 1)
    # restore
    requests.post(f"{BASE_URL}/api/hospitals/park-patiala/wards/icu/admit", headers=HEADERS, timeout=30)
