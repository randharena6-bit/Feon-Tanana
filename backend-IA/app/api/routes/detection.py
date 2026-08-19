import base64
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.schemas.detection import DetectionResult, Landmarks
from app.services.pipeline import DetectionPipeline

router = APIRouter(prefix="/detect", tags=["detection"])

pipeline = DetectionPipeline()


@router.post("", response_model=DetectionResult)
async def detect_frame(image_b64: str) -> DetectionResult:
    try:
        raw = base64.b64decode(image_b64.split(",")[-1])
        np_arr = np.frombuffer(raw, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Image invalide") from exc

    sign, confidence, mode = pipeline.process_frame(frame)
    return DetectionResult(sign=sign, confidence=confidence, mode=mode)


@router.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"status": "ok", "model_loaded": True})