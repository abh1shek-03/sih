"""Light backend tests for /api/triage endpoint."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://care-finder-45.preview.emergentagent.com").rstrip("/")

HEADERS = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (compatible; PytestSDET/1.0)"}

SMALL_HOSPITALS = [
    {
        "id": "h1",
        "name": "Rajindra Hospital",
        "distanceKm": None,
        "verified": True,
        "icu": None,
        "general": None,
        "opdWaitMin": None,
        "doctors": [
            {"name": "Dr. Harsimran Singh", "specialty": "ENT", "status": "available"},
            {"name": "Dr. J P Goyal", "specialty": "General Medicine", "status": "available"},
        ],
    }
]


def test_triage_short_input_returns_422():
    r = requests.post(
        f"{BASE_URL}/api/triage",
        json={"patientInput": "a", "hospitals": SMALL_HOSPITALS},
        headers=HEADERS,
        timeout=30,
    )
    assert r.status_code == 422, f"Expected 422 got {r.status_code}: {r.text[:200]}"


def test_triage_punjabi_dentist_no_match():
    payload = {"patientInput": "ਮੇਰੇ ਦੰਦ ਵਿੱਚ ਦਰਦ ਹੈ", "hospitals": SMALL_HOSPITALS}
    r = requests.post(f"{BASE_URL}/api/triage", json=payload, headers=HEADERS, timeout=90)
    assert r.status_code == 200, f"Got {r.status_code}: {r.text[:300]}"
    data = r.json()
    assert data["matches"] == [], f"Expected empty matches, got {data['matches']}"
    assert data["responseText"], "responseText should not be empty"
    # response text should contain Gurmukhi characters
    assert any("\u0a00" <= c <= "\u0a7f" for c in data["responseText"]), \
        f"Expected Gurmukhi script in responseText: {data['responseText']}"
