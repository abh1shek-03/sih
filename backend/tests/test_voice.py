"""Backend tests for /api/voice/speak and /api/voice/listen endpoints."""
import io
import os
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://care-finder-45.preview.emergentagent.com"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; PytestSDET/1.0)"}


def test_voice_speak_returns_mp3():
    r = requests.post(
        f"{BASE_URL}/api/voice/speak",
        json={"text": "Hello from MediConnect test"},
        headers={**HEADERS, "Content-Type": "application/json"},
        timeout=60,
    )
    assert r.status_code == 200, f"Got {r.status_code}: {r.text[:300]}"
    assert r.headers.get("content-type", "").startswith("audio/mpeg"), r.headers
    # MP3 magic: "ID3" or 0xFF 0xFB/0xF3
    body = r.content
    assert len(body) > 500, f"Audio body too small: {len(body)}"
    assert body[:3] == b"ID3" or body[0] == 0xFF, f"Not a valid MP3 header: {body[:4].hex()}"


def test_voice_speak_empty_text_returns_422():
    r = requests.post(
        f"{BASE_URL}/api/voice/speak",
        json={"text": ""},
        headers={**HEADERS, "Content-Type": "application/json"},
        timeout=30,
    )
    assert r.status_code == 422, f"Expected 422 got {r.status_code}"


def test_voice_listen_roundtrip():
    # First generate real audio via /speak, then transcribe it
    speak = requests.post(
        f"{BASE_URL}/api/voice/speak",
        json={"text": "Testing one two three"},
        headers={**HEADERS, "Content-Type": "application/json"},
        timeout=60,
    )
    assert speak.status_code == 200
    audio_bytes = speak.content

    files = {"file": ("recording.mp3", io.BytesIO(audio_bytes), "audio/mpeg")}
    r = requests.post(f"{BASE_URL}/api/voice/listen", files=files, headers=HEADERS, timeout=90)
    assert r.status_code == 200, f"Got {r.status_code}: {r.text[:300]}"
    data = r.json()
    assert "text" in data
    assert isinstance(data["text"], str)
    assert len(data["text"].strip()) > 0
    # Loose check: should contain at least one of the spoken words
    lowered = data["text"].lower()
    assert any(w in lowered for w in ["test", "one", "two", "three"]), f"Unexpected transcript: {data['text']}"


def test_voice_listen_empty_file_returns_400():
    files = {"file": ("recording.webm", io.BytesIO(b""), "audio/webm")}
    r = requests.post(f"{BASE_URL}/api/voice/listen", files=files, headers=HEADERS, timeout=30)
    assert r.status_code == 400, f"Expected 400 got {r.status_code}: {r.text[:200]}"
