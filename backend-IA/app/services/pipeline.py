from collections import deque

import cv2

from app.config import settings
from app.core.hand_tracker import HandTracker
from app.models.static_classifier import StaticClassifier
from app.models.dynamic_classifier import DynamicClassifier
from app.utils.landmark_utils import normalize_landmarks, sequence_to_tensor


class DetectionPipeline:
    def __init__(self) -> None:
        self.tracker: HandTracker | None = None
        self.static_model: StaticClassifier | None = None
        self.dynamic_model: DynamicClassifier | None = None
        self.sequence: deque[list[tuple[float, float, float]]] = deque(
            maxlen=settings.sequence_length
        )
        self._load()

    def _load(self) -> None:
        try:
            self.tracker = HandTracker()
        except Exception as exc:
            print(f"[pipeline] HandTracker indisponible: {exc}")
            return
        try:
            self.static_model = StaticClassifier()
            self.static_model.load()
        except Exception as exc:
            print(f"[pipeline] StaticClassifier indisponible: {exc}")
            self.static_model = None
        try:
            self.dynamic_model = DynamicClassifier()
            self.dynamic_model.load()
        except Exception as exc:
            print(f"[pipeline] DynamicClassifier indisponible: {exc}")
            self.dynamic_model = None

    @property
    def ready(self) -> bool:
        return self.tracker is not None

    def process_frame(
        self, frame_bgr: cv2.typing.MatLike
    ) -> tuple[str, float, str, list[dict] | None]:
        if self.tracker is None:
            return "", 0.0, "unavailable", None

        hands = self.tracker.detect(frame_bgr)
        if not hands:
            self.sequence.clear()
            return "", 0.0, "static", None

        hand = normalize_landmarks(hands[0])
        self.sequence.append(hand)

        # Retourne les landmarks normalisés de la main détectée
        landmarks: list[dict] = [
            {"x": float(lm[0]), "y": float(lm[1]), "z": float(lm[2])} for lm in hand
        ]

        if self.static_model is not None:
            label, proba = self.static_model.predict(hand)
            if proba >= settings.confidence_threshold:
                return label, proba, "static", landmarks

        if (
            self.dynamic_model is not None
            and len(self.sequence) == settings.sequence_length
        ):
            tensor = sequence_to_tensor(list(self.sequence), settings.sequence_length)
            label, proba = self.dynamic_model.predict(tensor)
            if proba >= settings.confidence_threshold:
                return label, proba, "dynamic", landmarks

        return "", 0.0, "static", landmarks

    def close(self) -> None:
        self.tracker.close()