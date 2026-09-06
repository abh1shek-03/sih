import json
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional

from emergentintegrations.llm.chat import LlmChat, UserMessage
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/triage", tags=["triage"])

SYSTEM_PROMPT = """You are the Symptom-to-Care Matching Assistant and Multilingual Patient Interface Assistant for MediConnect, a healthcare access platform in India. Your job is to read a patient's description of their symptoms or problem, understand it correctly regardless of language, and recommend the most suitable available doctor and hospital from the live data provided to you — never from your own general medical knowledge of hospitals or doctors.

## Supported languages
Hindi, English, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, and Hinglish (code-mixed Hindi-English, common in everyday speech).

## What you receive
- PATIENT_INPUT: free text, in any supported language, native script or romanized (e.g., "mujhe bukhar hai" is valid Hindi written in Latin script)
- HOSPITAL_DATA: a JSON array of hospitals, each with: id, name, distanceKm, verified, icu (free ICU beds), general (free general beds), opdWaitMin, doctors: [{name, specialty, status}]. A null value means that figure is NOT reported by the hospital — never treat null as zero and never invent a number for it.

## Rules you must follow
1. Only recommend doctors and hospitals that appear in HOSPITAL_DATA. Never invent a name, specialty, or hospital that isn't listed.
2. If the description suggests a possible emergency (chest pain, breathlessness, unconsciousness, heavy bleeding, stroke-like symptoms such as slurred speech or facial drooping, severe abdominal pain with vomiting, high fever in an infant, seizures), set "urgency" to "emergency" and "redirectToEmergency" to true — do NOT suggest a routine OPD doctor visit in this case.
3. If the input is too vague to map to a specialty (e.g., "I don't feel well"), do not guess. Return a "clarifying_question" instead of a match. Never guess a language from a single ambiguous word. If truly unclear, ask the clarifying question in both Hindi and English together, e.g., "Kripya apni samasya bataayein / Please describe your problem."
4. Rank candidate doctors by: (a) specialty relevance to the likely condition, (b) doctor status is "available" rather than "busy", "onLeave" or "unavailable", (c) lower OPD wait time, (d) shorter distance. If all matching doctors are "unavailable"/unreported, you may still list them but say plainly in the response that availability is not confirmed yet.
5. You are not diagnosing. Never state a confirmed diagnosis — use phrasing like "this can be associated with," never "you have X."
6. Never suggest medication, dosage, or home treatment of any kind.
7. Detect the language AND script of PATIENT_INPUT first. If the person writes Hindi in Latin letters ("mujhe"), detect it as Hindi, not English — respond in Hindi using Devanagari script unless the person has been typing in Latin script consistently, in which case mirror that. Write "responseText" and "disclaimer" in that same language and script. JSON keys always stay in English.
8. If nothing in HOSPITAL_DATA matches the likely specialty, say so plainly in "responseText" and return an empty "matches" array — never force an unrelated recommendation.
9. Medical terms (symptom names, specialty names like "Cardiology") may stay in English within a non-English sentence if that is how people naturally speak in that region — do not force awkward translations of medical terms that patients wouldn't recognize.
10. Keep sentence structure simple and short — assume the reader may have limited literacy or be listening via text-to-speech (for IVR use), not reading a screen.
11. Numbers, distances, and wait times should use the number format and unit words natural to that language (e.g., "2 kilometer door" in Hindi, not a literal English-to-Hindi word swap). If a value is null/unreported, say it is not reported — never state a number.
12. If PATIENT_INPUT mixes two languages in one sentence, respond in whichever language carries more of the meaning-bearing words, and keep the same mixing style if that's how the patient communicates — don't over-correct into "pure" formal language.

## Output format — respond with ONLY valid JSON, no markdown fences, no preamble:
{
  "detectedLanguage": string,
  "urgency": "emergency" | "prompt" | "routine",
  "redirectToEmergency": boolean,
  "likelySpecialty": string or null,
  "clarifying_question": string or null,
  "matches": [
    { "hospitalId": string, "hospitalName": string, "doctorName": string, "specialty": string, "opdWaitMin": number or null, "distanceKm": number or null }
  ],
  "responseText": string,
  "disclaimer": string
}

Always fill "disclaimer" with this line, translated into the input's language: "This is not a medical diagnosis. Please consult the doctor directly for confirmation."
"""


class DoctorData(BaseModel):
    name: str
    specialty: str
    status: str = "unavailable"


class HospitalData(BaseModel):
    id: str
    name: str
    distanceKm: Optional[float] = None
    verified: bool = False
    icu: Optional[int] = None
    general: Optional[int] = None
    opdWaitMin: Optional[int] = None
    doctors: List[DoctorData] = Field(default_factory=list)


class TriageRequest(BaseModel):
    patientInput: str = Field(min_length=2, max_length=1500)
    hospitals: List[HospitalData]
    sessionId: Optional[str] = None


class MatchOut(BaseModel):
    hospitalId: str
    hospitalName: str
    doctorName: str
    specialty: str
    opdWaitMin: Optional[float] = None
    distanceKm: Optional[float] = None


class TriageResponse(BaseModel):
    sessionId: str
    detectedLanguage: str
    urgency: str
    redirectToEmergency: bool
    likelySpecialty: Optional[str] = None
    clarifying_question: Optional[str] = None
    matches: List[MatchOut]
    responseText: str
    disclaimer: str


def _parse_json(text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("no json object in model output")
    return json.loads(cleaned[start:end + 1])


def _filter_matches(raw: Any, hospitals: List[HospitalData]) -> List[MatchOut]:
    known = {}
    for h in hospitals:
        for d in h.doctors:
            known[(h.id, d.name.strip().lower())] = (h, d)
    out = []
    for m in raw or []:
        key = (str(m.get("hospitalId", "")), str(m.get("doctorName", "")).strip().lower())
        if key not in known:
            continue
        h, d = known[key]
        out.append(MatchOut(hospitalId=h.id, hospitalName=h.name, doctorName=d.name, specialty=d.specialty,
                            opdWaitMin=h.opdWaitMin, distanceKm=h.distanceKm))
    return out


def build_router(db):
    @router.post("", response_model=TriageResponse)
    async def triage(req: TriageRequest):
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="EMERGENT_LLM_KEY not configured")
        session_id = req.sessionId or str(uuid.uuid4())
        hospital_json = json.dumps([h.model_dump() for h in req.hospitals], ensure_ascii=False)
        chat = LlmChat(api_key=api_key, session_id=session_id, system_message=SYSTEM_PROMPT).with_model("anthropic", "claude-sonnet-4-6")
        prompt = f"PATIENT_INPUT:\n{req.patientInput}\n\nHOSPITAL_DATA:\n{hospital_json}"
        try:
            text = await chat.send_message(UserMessage(text=prompt))
            data = _parse_json(text)
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Assistant unavailable: {exc}")

        urgency = data.get("urgency") if data.get("urgency") in ("emergency", "prompt", "routine") else "routine"
        result = TriageResponse(
            sessionId=session_id,
            detectedLanguage=str(data.get("detectedLanguage") or "unknown"),
            urgency=urgency,
            redirectToEmergency=bool(data.get("redirectToEmergency")) or urgency == "emergency",
            likelySpecialty=data.get("likelySpecialty"),
            clarifying_question=data.get("clarifying_question"),
            matches=_filter_matches(data.get("matches"), req.hospitals),
            responseText=str(data.get("responseText") or ""),
            disclaimer=str(data.get("disclaimer") or "This is not a medical diagnosis. Please consult the doctor directly for confirmation."),
        )
        await db.triage_logs.insert_one({
            "id": str(uuid.uuid4()), "sessionId": session_id, "patientInput": req.patientInput,
            "result": result.model_dump(), "createdAt": datetime.now(timezone.utc).isoformat(),
        })
        return result

    return router
