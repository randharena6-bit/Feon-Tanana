import base64

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.schemas.detection import DetectionResult
from app.services.pipeline import DetectionPipeline

router = APIRouter(prefix="/detect", tags=["detection"])

pipeline = DetectionPipeline()


class DetectRequest(BaseModel):
    image: str


@router.post("", response_model=DetectionResult)
async def detect_frame(request: DetectRequest) -> DetectionResult:
    try:
        raw = base64.b64decode(request.image.split(",")[-1])
        np_arr = np.frombuffer(raw, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Image invalide") from exc

    if frame is None:
        raise HTTPException(status_code=400, detail="Image invalide")

    if not pipeline.ready:
        raise HTTPException(
            status_code=503,
            detail="Moteur de détection indisponible (mediapipe non installé)",
        )

    sign, confidence, mode = pipeline.process_frame(frame)
    return DetectionResult(sign=sign, confidence=confidence, mode=mode)


@router.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok", "model_loaded": pipeline.ready})
