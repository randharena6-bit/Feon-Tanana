from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import dataset, detection, tts
from app.config import settings

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(detection.router)
app.include_router(dataset.router)
app.include_router(tts.router)


@app.get("/")
async def root() -> dict:
    return {"app": settings.app_name, "status": "running"}