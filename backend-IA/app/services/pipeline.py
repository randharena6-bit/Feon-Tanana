from collections import deque

import cv2

from app.config import settings
from app.core.hand_tracker import HandTracker
from app.models.static_classifier import StaticClassifier
from app.models.dynamic_classifier import DynamicClassifier
from app.utils.landmark_utils import normalize_landmarks, sequence_to_tensor


class DetectionPipeline:
    def __init__(self) -> None:
        self.tracker = HandTracker()
        self.static_model = StaticClassifier()
        self.dynamic_model = DynamicClassifier()
        self.sequence: deque[list[tuple[float, float, float]]] = deque(
            maxlen=settings.sequence_length
        )

    def process_frame(self, frame_bgr: cv2.typing.MatLike) -> tuple[str, float, str]:
        hands = self.tracker.detect(frame_bgr)
        if not hands:
            self.sequence.clear()
            return "", 0.0, "static"

        hand = normalize_landmarks(hands[0])
        self.sequence.append(hand)

        label, proba = self.static_model.predict(hand)
        if proba >= settings.confidence_threshold:
            return label, proba, "static"

        if len(self.sequence) == settings.sequence_length:
            tensor = sequence_to_tensor(list(self.sequence), settings.sequence_length)
            label, proba = self.dynamic_model.predict(tensor)
            if proba >= settings.confidence_threshold:
                return label, proba, "dynamic"

        return "", 0.0, "static"

    def close(self) -> None:
        self.tracker.close()