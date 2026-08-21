import base64

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.schemas.detection import RecordingRequest, RecordingResponse
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/dataset", tags=["dataset"])

service = DatasetService()
_tracker = None


def _get_tracker():
    global _tracker
    if _tracker is None:
        from app.core.hand_tracker import HandTracker

        _tracker = HandTracker()
    return _tracker


class RecordImagesRequest(BaseModel):
    label: str
    images: list[str]


@router.post("/record", response_model=RecordingResponse)
async def record(request: RecordingRequest) -> RecordingResponse:
    return RecordingResponse(**service.save_recording(request.label, request.frames))


@router.post("/record_images", response_model=RecordingResponse)
async def record_images(request: RecordImagesRequest) -> RecordingResponse:
    try:
        tracker = _get_tracker()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    frames: list[list] = []
    for image_b64 in request.images:
        try:
            raw = base64.b64decode(image_b64.split(",")[-1])
            np_arr = np.frombuffer(raw, np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Image invalide") from exc
        if frame is None:
            continue
        hands = tracker.detect(frame)
        if hands:
            frames.append(
                [
                    [
                        {"x": float(lm[0]), "y": float(lm[1]), "z": float(lm[2])}
                        for lm in hand
                    ]
                    for hand in hands
                ]
            )
    if not frames:
        raise HTTPException(status_code=422, detail="Aucune main détectée dans les images")
    return RecordingResponse(**service.save_recording(request.label, frames))


@router.get("/labels")
async def labels() -> list[str]:
    return service.list_labels()


@router.get("/stats")
async def stats() -> dict[str, int]:
    return service.count_samples()
