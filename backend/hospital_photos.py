import base64
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, Request, UploadFile, File
from pydantic import BaseModel

from auth import HOSPITAL_NAMES, get_current_user

router = APIRouter(prefix="/api/hospitals", tags=["hospital-photos"])

# 3 MB limit — enough for a real hospital-supplied photo, small enough to keep the DB healthy.
MAX_PHOTO_BYTES = 3 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}


class Base64PhotoIn(BaseModel):
    contentType: str
    dataBase64: str  # raw base64 (no data URL prefix)


def _to_data_url(content_type: str, raw_bytes: bytes) -> str:
    b64 = base64.b64encode(raw_bytes).decode("ascii")
    return f"data:{content_type};base64,{b64}"


def build_router(db):
    @router.post("/{hospital_id}/photo")
    async def upload_photo(hospital_id: str, request: Request, file: Optional[UploadFile] = File(None)):
        user = get_current_user(request)
        if user["hospitalId"] != hospital_id:
            raise HTTPException(status_code=403, detail="You can only upload a photo for your own hospital")
        if hospital_id not in HOSPITAL_NAMES:
            raise HTTPException(status_code=404, detail="Unknown hospital")

        content_type: Optional[str] = None
        raw: Optional[bytes] = None

        if file is not None:
            content_type = (file.content_type or "").lower()
            raw = await file.read()
        else:
            # Fall back to JSON body { contentType, dataBase64 }
            body = await request.json()
            payload = Base64PhotoIn(**body)
            content_type = payload.contentType.lower()
            try:
                raw = base64.b64decode(payload.dataBase64, validate=True)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid base64 image data")

        if not content_type or content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=400, detail="Only JPEG, PNG or WebP images are accepted")
        if not raw or len(raw) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        if len(raw) > MAX_PHOTO_BYTES:
            raise HTTPException(status_code=413, detail="Image is larger than 3 MB — please compress and try again")

        data_url = _to_data_url(content_type, raw)
        doc = {
            "hospitalId": hospital_id,
            "hospitalName": HOSPITAL_NAMES[hospital_id],
            "contentType": content_type,
            "bytes": len(raw),
            "dataUrl": data_url,
            "uploadedByEmail": user["email"],
            "uploadedAt": datetime.now(timezone.utc).isoformat(),
        }
        await db.hospital_photos.update_one(
            {"hospitalId": hospital_id},
            {"$set": doc},
            upsert=True,
        )
        return {
            "hospitalId": hospital_id,
            "dataUrl": data_url,
            "bytes": len(raw),
            "uploadedAt": doc["uploadedAt"],
            "verified": True,
        }

    @router.delete("/{hospital_id}/photo")
    async def delete_photo(hospital_id: str, request: Request):
        user = get_current_user(request)
        if user["hospitalId"] != hospital_id:
            raise HTTPException(status_code=403, detail="You can only remove a photo for your own hospital")
        result = await db.hospital_photos.delete_one({"hospitalId": hospital_id})
        return {"hospitalId": hospital_id, "removed": result.deleted_count == 1}

    @router.get("/{hospital_id}/photo")
    async def get_photo(hospital_id: str):
        record = await db.hospital_photos.find_one({"hospitalId": hospital_id}, {"_id": 0})
        if not record:
            raise HTTPException(status_code=404, detail="No photo uploaded yet")
        return {
            "hospitalId": hospital_id,
            "dataUrl": record["dataUrl"],
            "uploadedAt": record.get("uploadedAt"),
            "verified": True,
        }

    @router.get("/photos")
    async def list_photos(ids: str = Query("", description="Comma-separated hospital ids")):
        wanted = [i.strip() for i in ids.split(",") if i.strip()] if ids else []
        query = {"hospitalId": {"$in": wanted}} if wanted else {}
        cursor = db.hospital_photos.find(query, {"_id": 0, "hospitalId": 1, "dataUrl": 1, "uploadedAt": 1})
        rows = await cursor.to_list(length=200)
        return {row["hospitalId"]: {"dataUrl": row["dataUrl"], "uploadedAt": row.get("uploadedAt"), "verified": True} for row in rows}

    return router
