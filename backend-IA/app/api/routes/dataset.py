from fastapi import APIRouter

from app.schemas.detection import RecordingRequest, RecordingResponse
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/dataset", tags=["dataset"])

service = DatasetService()


@router.post("/record", response_model=RecordingResponse)
async def record(request: RecordingRequest) -> RecordingResponse:
    return RecordingResponse(**service.save_recording(request.label, request.frames))


@router.get("/labels")
async def labels() -> list[str]:
    return service.list_labels()


@router.get("/stats")
async def stats() -> dict[str, int]:
    return service.count_samples()