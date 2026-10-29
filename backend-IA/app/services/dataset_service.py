import json
from pathlib import Path

from app.config import settings


class DatasetService:
    def __init__(self) -> None:
        self.base_dir = Path(settings.data_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_recording(self, label: str, frames: list) -> dict:
        label_dir = self.base_dir / label
        label_dir.mkdir(parents=True, exist_ok=True)
        index = len(list(label_dir.glob("*.json")))
        path = label_dir / f"sample_{index:04d}.json"

        def _convert(obj):
            if hasattr(obj, "model_dump"):
                return _convert(obj.model_dump())
            if hasattr(obj, "dict"):
                return _convert(obj.dict())
            if isinstance(obj, (list, tuple)):
                return [_convert(item) for item in obj]
            if isinstance(obj, dict):
                return {k: _convert(v) for k, v in obj.items()}
            return obj

        payload = {"label": label, "frames": _convert(frames)}
        path.write_text(json.dumps(payload), encoding="utf-8")
        return {"label": label, "frames_saved": len(frames), "path": str(path)}

    def list_labels(self) -> list[str]:
        return sorted(d.name for d in self.base_dir.iterdir() if d.is_dir())

    def count_samples(self) -> dict[str, int]:
        return {
            d.name: len(list(d.glob("*.json")))
            for d in sorted(self.base_dir.iterdir())
            if d.is_dir()
        }