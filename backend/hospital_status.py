import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user

router = APIRouter(prefix="/api/hospitals", tags=["hospital-status"])

WARD_TEMPLATE = [
    {"id": "general", "name": "General ward", "total": 40, "confirmed": False},
    {"id": "icu", "name": "ICU", "total": 8, "confirmed": False},
    {"id": "maternity", "name": "Maternity", "total": 12, "confirmed": False},
]

# Ward totals sourced from the hospital-supplied bed figures where known ("confirmed": True);
# every other ward keeps the same generic demo baseline staff can override via admit/discharge.
WARD_OVERRIDES: Dict[str, List[Dict]] = {
    "park-patiala": [
        {"id": "general", "name": "General ward", "total": 235, "confirmed": True},
        {"id": "icu", "name": "ICU", "total": 65, "confirmed": True},
        {"id": "maternity", "name": "Maternity", "total": 12, "confirmed": False},
    ],
    "rajindra": [
        {"id": "general", "name": "General ward", "total": 1009, "confirmed": True},
        {"id": "icu", "name": "ICU", "total": 8, "confirmed": False},
        {"id": "maternity", "name": "Maternity", "total": 12, "confirmed": False},
    ],
}


def _wards_for(hospital_id: str) -> List[Dict]:
    return WARD_OVERRIDES.get(hospital_id, WARD_TEMPLATE)


def _ward_status(available: int, total: int) -> str:
    if total <= 0 or available <= 0:
        return "full"
    if available / total <= 0.2:
        return "limited"
    return "available"


def _overall_status(wards: List[Dict]) -> str:
    statuses = [_ward_status(w["available"], w["total"]) for w in wards]
    if "full" in statuses:
        return "full"
    if "limited" in statuses:
        return "limited"
    return "available"


class DoctorStatusUpdate(BaseModel):
    status: str


def build_router(db):
    async def _get_or_seed(hospital_id: str) -> dict:
        doc = await db.hospital_status.find_one({"id": hospital_id}, {"_id": 0})
        canonical = _wards_for(hospital_id)
        if doc:
            existing_by_id = {w["id"]: w for w in doc.get("wards", [])}
            wards = []
            for cw in canonical:
                prior = existing_by_id.get(cw["id"], {})
                prior_available = prior.get("available", cw["total"])
                # Preserve confirmed=True once set: hospital-supplied real data OR staff has actively updated it.
                prior_confirmed = bool(prior.get("confirmed", False)) or bool(cw["confirmed"])
                wards.append({"id": cw["id"], "name": cw["name"], "total": cw["total"], "confirmed": prior_confirmed, "available": min(prior_available, cw["total"])})
            if wards != doc.get("wards"):
                await db.hospital_status.update_one({"id": hospital_id}, {"$set": {"wards": wards}})
            doc["wards"] = wards
            return doc
        wards = [{**w, "available": w["total"]} for w in canonical]
        doc = {"id": hospital_id, "wards": wards, "doctors": {}, "updatedAt": datetime.now(timezone.utc).isoformat()}
        await db.hospital_status.insert_one(doc)
        return {k: v for k, v in doc.items() if k != "_id"}

    def _serialize(doc: dict) -> dict:
        wards = doc["wards"]
        staff_confirmed_bed_count = any(bool(w.get("confirmed")) for w in wards)
        return {
            "id": doc["id"],
            "wards": [{**w, "status": _ward_status(w["available"], w["total"])} for w in wards],
            "overallStatus": _overall_status(wards),
            "doctors": doc.get("doctors", {}),
            "staffConfirmedBedCount": staff_confirmed_bed_count,
        }

    @router.get("/verified")
    async def verified_map(ids: Optional[str] = None):
        wanted = [i.strip() for i in ids.split(",") if i.strip()] if ids else []
        # 1) Which hospitals have a photo?
        photo_query = {"hospitalId": {"$in": wanted}} if wanted else {}
        photos = await db.hospital_photos.find(photo_query, {"_id": 0, "hospitalId": 1}).to_list(200)
        has_photo = {p["hospitalId"] for p in photos}
        # 2) Which hospitals have at least one staff-confirmed ward?
        status_query = {"id": {"$in": wanted}} if wanted else {}
        statuses = await db.hospital_status.find(status_query, {"_id": 0, "id": 1, "wards": 1}).to_list(200)
        bed_confirmed = {s["id"] for s in statuses if any(bool(w.get("confirmed")) for w in s.get("wards", []))}
        result = {}
        target_ids = wanted if wanted else list(has_photo | bed_confirmed)
        for hid in target_ids:
            hp = hid in has_photo
            bc = hid in bed_confirmed
            result[hid] = {"hasPhoto": hp, "staffConfirmedBedCount": bc, "verified": hp and bc}
        return result

    @router.get("/status")
    async def get_all_status(ids: Optional[str] = None):
        hospital_ids = ids.split(",") if ids else []
        docs = await db.hospital_status.find({}, {"_id": 0}).to_list(1000)
        by_id = {d["id"]: d for d in docs}
        for hid in hospital_ids:
            if hid not in by_id:
                by_id[hid] = await _get_or_seed(hid)
        return {hid: _serialize(doc) for hid, doc in by_id.items()}

    @router.get("/{hospital_id}/status")
    async def get_status(hospital_id: str):
        doc = await _get_or_seed(hospital_id)
        return _serialize(doc)

    @router.post("/{hospital_id}/wards/{ward_id}/admit")
    async def admit(hospital_id: str, ward_id: str, user: dict = Depends(get_current_user)):
        if user["hospitalId"] != hospital_id:
            raise HTTPException(status_code=403, detail="You can only update your own hospital")
        doc = await _get_or_seed(hospital_id)
        wards = doc["wards"]
        ward = next((w for w in wards if w["id"] == ward_id), None)
        if not ward:
            raise HTTPException(status_code=404, detail="Ward not found")
        ward["available"] = min(ward["total"], ward["available"] + 1)
        ward["confirmed"] = True
        await db.hospital_status.update_one({"id": hospital_id}, {"$set": {"wards": wards, "updatedAt": datetime.now(timezone.utc).isoformat()}})
        return _serialize(doc)

    @router.post("/{hospital_id}/wards/{ward_id}/discharge")
    async def discharge(hospital_id: str, ward_id: str, user: dict = Depends(get_current_user)):
        if user["hospitalId"] != hospital_id:
            raise HTTPException(status_code=403, detail="You can only update your own hospital")
        doc = await _get_or_seed(hospital_id)
        wards = doc["wards"]
        ward = next((w for w in wards if w["id"] == ward_id), None)
        if not ward:
            raise HTTPException(status_code=404, detail="Ward not found")
        ward["available"] = max(0, ward["available"] - 1)
        ward["confirmed"] = True
        await db.hospital_status.update_one({"id": hospital_id}, {"$set": {"wards": wards, "updatedAt": datetime.now(timezone.utc).isoformat()}})
        return _serialize(doc)

    @router.patch("/{hospital_id}/doctors/{doctor_id}")
    async def set_doctor_status(hospital_id: str, doctor_id: str, body: DoctorStatusUpdate, user: dict = Depends(get_current_user)):
        if user["hospitalId"] != hospital_id:
            raise HTTPException(status_code=403, detail="You can only update your own hospital")
        if body.status not in ("available", "unavailable"):
            raise HTTPException(status_code=422, detail="status must be 'available' or 'unavailable'")
        doc = await _get_or_seed(hospital_id)
        doctors = doc.get("doctors", {})
        doctors[doctor_id] = body.status
        await db.hospital_status.update_one({"id": hospital_id}, {"$set": {"doctors": doctors, "updatedAt": datetime.now(timezone.utc).isoformat()}})
        doc["doctors"] = doctors
        return _serialize(doc)

    return router
