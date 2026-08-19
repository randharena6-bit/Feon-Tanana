from pydantic import BaseModel, Field


class Landmarks(BaseModel):
    x: float
    y: float
    z: float


class HandFrame(BaseModel):
    hands: list[list[Landmarks]] = Field(default_factory=list)


class DetectionResult(BaseModel):
    sign: str
    confidence: float
    mode: str


class RecordingRequest(BaseModel):
    label: str
    frames: list[HandFrame]


class RecordingResponse(BaseModel):
    label: str
    frames_saved: int
    path: str


class TTSRequest(BaseModel):
    text: str
    lang: str = "fr"


class TTSResponse(BaseModel):
    audio_path: str