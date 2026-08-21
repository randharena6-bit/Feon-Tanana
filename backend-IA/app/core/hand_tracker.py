import cv2

try:
    import mediapipe as mp
except ImportError:
    mp = None

from app.config import settings


class HandTracker:
    def __init__(self) -> None:
        if mp is None:
            raise RuntimeError(
                "mediapipe n'est pas installé (incompatible avec cette version de Python)"
            )
        if not hasattr(mp, "solutions"):
            raise RuntimeError(
                "Version de mediapipe incompatible : l'API 'solutions' est absente "
                "(mediapipe>=1.0 utilise l'API 'tasks'). "
                "Installez une version compatible (mediapipe<1.0 avec mp.solutions) ou "
                "adaptez HandTracker à l'API tasks."
            )
        hands_module = mp.solutions.hands
        self._hands = hands_module.Hands(
            static_image_mode=False,
            max_num_hands=settings.num_hands,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def detect(self, frame_bgr: cv2.typing.MatLike) -> list[list[tuple[float, float, float]]]:
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self._hands.process(frame_rgb)
        if not results.multi_hand_landmarks:
            return []
        return [
            [(lm.x, lm.y, lm.z) for lm in hand.landmark]
            for hand in results.multi_hand_landmarks
        ]

    def draw(
        self, frame: cv2.typing.MatLike, landmarks: list[list[tuple[float, float, float]]]
    ) -> cv2.typing.MatLike:
        h, w, _ = frame.shape
        for hand in landmarks:
            for x, y, _ in hand:
                cv2.circle(frame, (int(x * w), int(y * h)), 4, (0, 255, 0), -1)
        return frame

    def close(self) -> None:
        self._hands.close()
