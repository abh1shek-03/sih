import os
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.openai.speech_to_text import OpenAISpeechToText
from emergentintegrations.llm.openai.text_to_speech import OpenAITextToSpeech
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/voice", tags=["voice"])

ALLOWED_AUDIO_EXTENSIONS = ("mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm")


class SpeakRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4096)


def build_router(db):
    @router.post("/speak")
    async def speak(req: SpeakRequest):
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="EMERGENT_LLM_KEY not configured")
        tts = OpenAITextToSpeech(api_key=api_key)
        try:
            audio_bytes = await tts.generate_speech(text=req.text, model="tts-1", voice="nova")
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Speech generation failed: {exc}")
        await db.voice_events.insert_one({
            "id": str(uuid.uuid4()), "kind": "tts", "text": req.text,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        })
        return Response(content=audio_bytes, media_type="audio/mpeg")

    @router.post("/listen")
    async def listen(file: UploadFile = File(...)):
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=503, detail="EMERGENT_LLM_KEY not configured")
        extension = (file.filename or "recording.webm").rsplit(".", 1)[-1].lower()
        if extension not in ALLOWED_AUDIO_EXTENSIONS:
            extension = "webm"
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Empty audio file")
        stt = OpenAISpeechToText(api_key=api_key)
        tmp_name = f"/tmp/{uuid.uuid4()}.{extension}"
        with open(tmp_name, "wb") as f:
            f.write(data)
        try:
            with open(tmp_name, "rb") as f:
                result = await stt.transcribe(file=f, response_format="json")
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Transcription failed: {exc}")
        finally:
            os.remove(tmp_name)
        text = getattr(result, "text", None) or str(result)
        await db.voice_events.insert_one({
            "id": str(uuid.uuid4()), "kind": "stt", "text": text,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        })
        return {"text": text}

    return router
