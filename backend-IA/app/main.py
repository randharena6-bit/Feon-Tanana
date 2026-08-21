from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, dataset, detection, tts
from app.config import settings
from app.database import Base, engine
from app.models_db import user  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(detection.router)
app.include_router(dataset.router)
app.include_router(tts.router)


# --- Initialisation des signes par défaut ---
DEFAULT_SIGNS = [
    "bonjour", "merci", "oui", "non", "je t'aime", "s'il te plaît",
    "merci beaucoup", "ami", "pardon", "pourquoi", "maison",
    "moi", "toi", "amour", "au revoir"
]


def _init_default_signs(): -> None:
    import os
    from pathlib import Path
    base = Path(settings.data_dir)
    base.mkdir(parents=True, exist_ok=True)
    for sign in DEFAULT_SIGNS:
        (base / sign).mkdir(parents=True, exist_ok=True)


_init_default_signs()


@app.get("/")
async def root() -> dict:
    return {"app": settings.app_name, "status": "running"}