import pickle
from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier

from app.config import settings
from app.utils.landmark_utils import flatten_landmarks


class StaticClassifier:
    def __init__(self) -> None:
        self.model = RandomForestClassifier(n_estimators=200, random_state=42)

    def train(self, samples: list[list[tuple[float, float, float]]], labels: list[str]) -> None:
        x = [flatten_landmarks(sample) for sample in samples]
        self.model.fit(x, labels)

    def predict(self, landmarks: list[tuple[float, float, float]]) -> tuple[str, float]:
        x = [flatten_landmarks(landmarks)]
        label = self.model.predict(x)[0]
        proba = float(max(self.model.predict_proba(x)[0]))
        return label, proba

    def save(self, path: Path = Path(settings.models_dir) / "static_model.pkl") -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("wb") as f:
            pickle.dump(self.model, f)

    def load(self, path: Path = Path(settings.models_dir) / "static_model.pkl") -> None:
        with path.open("rb") as f:
            self.model = pickle.load(f)