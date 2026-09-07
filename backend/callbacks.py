import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from auth import HOSPITAL_NAMES, get_current_user

router = APIRouter(prefix="/api/callbacks", tags=["callbacks"])


class CallbackRequestIn(BaseModel):
    hospitalId: str
    doctorId: Optional[str] = None
    doctorName: Optional[str] = None
    patientName: str
    phone: str
    preferredTime: Optional[str] = None
    note: Optional[str] = None


def _validate_phone(raw: str) -> str:
    digits = "".join(ch for ch in raw if ch.isdigit() or ch == "+")
    if len(digits) < 7 or len(digits) > 20:
        raise HTTPException(status_code=400, detail="Enter a valid phone number")
    return digits


def build_router(db):
    @router.post("")
    async def create_callback(body: CallbackRequestIn):
        if body.hospitalId not in HOSPITAL_NAMES:
            raise HTTPException(status_code=400, detail="Unknown hospital")
        if not body.patientName.strip() or len(body.patientName.strip()) < 2:
            raise HTTPException(status_code=400, detail="Please enter your full name")
        phone = _validate_phone(body.phone)
        doc = {
            "id": str(uuid.uuid4()),
            "hospitalId": body.hospitalId,
            "hospitalName": HOSPITAL_NAMES[body.hospitalId],
            "doctorId": body.doctorId,
            "doctorName": body.doctorName,
            "patientName": body.patientName.strip(),
            "phone": phone,
            "preferredTime": (body.preferredTime or "As soon as possible").strip(),
            "note": (body.note or "").strip(),
            "status": "pending",
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }
        await db.callback_requests.insert_one(doc)
        return {
            "id": doc["id"],
            "hospitalName": doc["hospitalName"],
            "doctorName": doc["doctorName"],
            "patientName": doc["patientName"],
            "phone": doc["phone"],
            "preferredTime": doc["preferredTime"],
            "createdAt": doc["createdAt"],
            "message": f"Callback request received. {doc['hospitalName']} will reach you at {phone} — usually within a few hours.",
        }

    @router.get("")
    async def list_callbacks(request: Request):
        user = get_current_user(request)
        cursor = db.callback_requests.find({"hospitalId": user["hospitalId"]}, {"_id": 0}).sort("createdAt", -1).limit(200)
        return await cursor.to_list(length=200)

    @router.patch("/{callback_id}")
    async def update_callback(callback_id: str, request: Request):
        user = get_current_user(request)
        existing = await db.callback_requests.find_one({"id": callback_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Callback request not found")
        if existing["hospitalId"] != user["hospitalId"]:
            raise HTTPException(status_code=403, detail="Not allowed to update another hospital's callback")
        await db.callback_requests.update_one({"id": callback_id}, {"$set": {"status": "resolved"}})
        return {"id": callback_id, "status": "resolved"}

    return router
