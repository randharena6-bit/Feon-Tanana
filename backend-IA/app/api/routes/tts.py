from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.schemas.detection import TTSRequest, TTSResponse
from app.services.tts_service import TTSService

router = APIRouter(prefix="/tts", tags=["tts"])

service = TTSService()


@router.post("", response_model=TTSResponse)
async def synthesize(request: TTSRequest) -> TTSResponse:
    path = service.synthesize(request.text, request.lang)
    return TTSResponse(audio_path=path)


@router.get("/audio")
async def get_audio() -> FileResponse:
    return FileResponse("data/audio/tts_output.mp3", media_type="audio/mpeg")