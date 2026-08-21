from pathlib import Path

import numpy as np

try:
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.models import Sequential, load_model
except ImportError:
    LSTM = Dense = Dropout = Sequential = load_model = None

from app.config import settings
from app.utils.landmark_utils import flatten_landmarks


class DynamicClassifier:
    def __init__(self, num_classes: int = 30) -> None:
        if Sequential is None:
            raise RuntimeError("tensorflow n'est pas installé")
        self.model = Sequential(
            [
                LSTM(64, return_sequences=True, input_shape=(settings.sequence_length, 63)),
                Dropout(0.2),
                LSTM(32),
                Dropout(0.2),
                Dense(32, activation="relu"),
                Dense(num_classes, activation="softmax"),
            ]
        )
        self.model.compile(
            optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"]
        )

    def predict(self, sequence: np.ndarray) -> tuple[str, float]:
        proba = self.model.predict(sequence, verbose=0)[0]
        label = int(np.argmax(proba))
        return str(label), float(proba[label])

    def save(self, path: Path = Path(settings.models_dir) / "dynamic_model.keras") -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self.model.save(path)

    def load(self, path: Path = Path(settings.models_dir) / "dynamic_model.keras") -> None:
        if load_model is None:
            raise RuntimeError("tensorflow n'est pas installé")
        self.model = load_model(path)
