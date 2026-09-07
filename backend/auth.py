import os
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_HOURS = 8

# hospitalId -> hospitalName, used to seed one demo staff account per hospital
HOSPITAL_NAMES = {
    "gursharan": "Gursharan Hospital",
    "manipal-patiala": "Manipal Hospitals, Patiala",
    "park-patiala": "Park Hospital",
    "simran-ent": "Simran ENT Centre",
    "guru-eye": "Guru Teg Bahadur Eye Hospital",
    "sanjivni": "Sanjivni Multyspeciality Hospital",
    "gian-sagar": "Gian Sagar Medical College & Hospital",
    "rama-atray": "Rama Atray Memorial Eye Hospital",
    "bhatia": "Bhatia Hospital Neuro and Multispeciality",
    "rajindra": "Rajindra Hospital",
    "aas-medicare": "AAS Medicare",
    "patiala-heart-institute": "Patiala Heart Institute & Multispeciality Hospital",
}


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user: dict) -> str:
    payload = {
        "sub": user["email"], "hospitalId": user["hospitalId"], "hospitalName": user["hospitalName"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_HOURS),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])


async def seed_staff_accounts(db):
    password = os.environ["STAFF_DEMO_PASSWORD"]
    password_hash = hash_password(password)
    for hospital_id, hospital_name in HOSPITAL_NAMES.items():
        email = f"{hospital_id}@mediconnect.demo"
        existing = await db.staff_users.find_one({"email": email})
        if existing is None:
            await db.staff_users.insert_one({
                "email": email, "passwordHash": password_hash, "hospitalId": hospital_id,
                "hospitalName": hospital_name, "createdAt": datetime.now(timezone.utc).isoformat(),
            })


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    hospitalId: str


def build_router(db):
    @router.post("/login")
    async def login(body: LoginRequest, response: Response):
        email = body.email.strip().lower()
        user = await db.staff_users.find_one({"email": email})
        if not user or not verify_password(body.password, user["passwordHash"]):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        token = create_access_token(user)
        response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="lax",
                             max_age=ACCESS_TOKEN_HOURS * 3600, path="/")
        return {"email": user["email"], "hospitalId": user["hospitalId"], "hospitalName": user["hospitalName"]}

    @router.post("/register")
    async def register(body: RegisterRequest, response: Response):
        email = body.email.strip().lower()
        hospital_id = body.hospitalId.strip()
        if hospital_id not in HOSPITAL_NAMES:
            raise HTTPException(status_code=400, detail="Please pick a hospital from the list")
        if "@" not in email or "." not in email or len(email) < 5:
            raise HTTPException(status_code=400, detail="Enter a valid email address")
        if len(body.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        existing = await db.staff_users.find_one({"email": email})
        if existing is not None:
            raise HTTPException(status_code=409, detail="An account with this email already exists")
        user_doc = {
            "email": email,
            "passwordHash": hash_password(body.password),
            "hospitalId": hospital_id,
            "hospitalName": HOSPITAL_NAMES[hospital_id],
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "selfRegistered": True,
        }
        await db.staff_users.insert_one(user_doc)
        token = create_access_token(user_doc)
        response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="lax",
                             max_age=ACCESS_TOKEN_HOURS * 3600, path="/")
        return {"email": user_doc["email"], "hospitalId": user_doc["hospitalId"], "hospitalName": user_doc["hospitalName"]}

    @router.get("/hospitals")
    async def list_hospitals():
        # Public — used by the sign-up modal so staff can pick their hospital
        return [{"id": hid, "name": name} for hid, name in HOSPITAL_NAMES.items()]

    @router.post("/logout")
    async def logout(response: Response):
        response.delete_cookie("access_token", path="/")
        return {"ok": True}

    @router.get("/me")
    async def me(request: Request):
        return get_current_user(request)

    return router


def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_access_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired, please sign in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid session")
    return {"email": payload["sub"], "hospitalId": payload["hospitalId"], "hospitalName": payload["hospitalName"]}
