import os
import tempfile
import time
import urllib.request

import cv2
import numpy as np

try:
    import mediapipe as mp
except ImportError:
    mp = None

from app.config import settings

_HAND_MODEL_FILENAME = "hand_landmarker.task"
_HAND_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/1/hand_landmarker.task"
)
_MIN_DETECTION_CONFIDENCE = 0.5
_MIN_TRACKING_CONFIDENCE = 0.5


def _ensure_hand_model(model_path: str) -> None:
    if os.path.exists(model_path):
        return
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".task")
    try:
        with urllib.request.urlopen(_HAND_MODEL_URL, timeout=60) as response, os.fdopen(
            tmp_fd, "wb"
        ) as out_file:
            while chunk := response.read(1 << 16):
                out_file.write(chunk)
        os.replace(tmp_path, model_path)
    except Exception:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        raise


class HandTracker:
    def __init__(self) -> None:
        if mp is None:
            raise RuntimeError(
                "mediapipe n'est pas installé (incompatible avec cette version de Python)"
            )
        self._using_tasks = False
        self._hands = None
        self._hand_landmarker = None
        self._hand_connections: list[tuple[int, int]] = []
        self._last_timestamp_ms = 0
        self._last_error: str | None = None

        if hasattr(mp, "solutions") and hasattr(mp.solutions, "hands"):
            hands_module = mp.solutions.hands
            self._hands = hands_module.Hands(
                static_image_mode=False,
                max_num_hands=settings.num_hands,
                min_detection_confidence=_MIN_DETECTION_CONFIDENCE,
                min_tracking_confidence=_MIN_TRACKING_CONFIDENCE,
            )
            self._hand_connections = [
                tuple(conn)[:2] for conn in mp.solutions.hands.HAND_CONNECTIONS
            ]
            return

        if hasattr(mp, "tasks"):
            model_path = os.path.join(settings.models_dir, _HAND_MODEL_FILENAME)
            _ensure_hand_model(model_path)

            from mediapipe.tasks.python import BaseOptions
            from mediapipe.tasks.python.vision import RunningMode
            from mediapipe.tasks.python.vision.hand_landmarker import (
                HandLandmarker,
                HandLandmarkerOptions,
            )

            try:
                from mediapipe.tasks.python.vision.hand_landmarker import (
                    HandLandmarksConnections,
                )

                raw_connections = HandLandmarksConnections.HAND_CONNECTIONS
                self._hand_connections = [
                    (conn.start, conn.end) if hasattr(conn, "start") else tuple(conn)[:2]
                    for conn in raw_connections
                ]
            except Exception:
                self._hand_connections = [
                    (0, 1), (1, 2), (2, 3), (3, 4),
                    (0, 5), (5, 6), (6, 7), (7, 8),
                    (5, 9), (9, 10), (10, 11), (11, 12),
                    (9, 13), (13, 14), (14, 15), (15, 16),
                    (13, 17), (17, 18), (18, 19), (19, 20),
                    (0, 17),
                ]

            options = HandLandmarkerOptions(
                base_options=BaseOptions(model_asset_path=model_path),
                running_mode=RunningMode.VIDEO,
                num_hands=settings.num_hands,
                min_hand_detection_confidence=_MIN_DETECTION_CONFIDENCE,
                min_tracking_confidence=_MIN_TRACKING_CONFIDENCE,
            )
            # mediapipe >= 0.10.30 : passer par la factory, pas le constructeur direct
            if hasattr(HandLandmarker, "create_from_options"):
                self._hand_landmarker = HandLandmarker.create_from_options(options)
            else:
                self._hand_landmarker = HandLandmarker(options)
            self._using_tasks = True
            return

        raise RuntimeError(
            "Aucune API Mediapipe disponible. "
            "Installez une version de mediapipe avec mp.solutions "
            "(mediapipe<1.0) ou utilisez la version 1.0+ avec l'API tasks "
            "et un modèle .task."
        )

    def detect(
        self, frame_bgr: cv2.typing.MatLike
    ) -> list[list[tuple[float, float, float]]]:
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        if self._using_tasks and self._hand_landmarker is not None:
            try:
                mp_image = mp.Image(
                    image_format=mp.ImageFormat.SRGB,
                    data=np.ascontiguousarray(frame_rgb),
                )
                timestamp_ms = max(int(time.monotonic() * 1000), self._last_timestamp_ms + 1)
                results = self._hand_landmarker.detect_for_video(mp_image, timestamp_ms)
                self._last_timestamp_ms = timestamp_ms
                if not results.hand_landmarks:
                    return []
                return [
                    [(lm.x, lm.y, lm.z) for lm in hand]
                    for hand in results.hand_landmarks
                ]
            except Exception as exc:
                message = str(exc)
                if message != self._last_error:
                    self._last_error = message
                    print(f"[hand_tracker] Erreur de détection (tasks): {message}")
                return []
        elif self._hands is not None:
            try:
                results = self._hands.process(frame_rgb)
                if not results.multi_hand_landmarks:
                    return []
                return [
                    [(lm.x, lm.y, lm.z) for lm in hand.landmark]
                    for hand in results.multi_hand_landmarks
                ]
            except Exception as exc:
                message = str(exc)
                if message != self._last_error:
                    self._last_error = message
                    print(f"[hand_tracker] Erreur de détection (solutions): {message}")
                return []
        else:
            raise RuntimeError(
                "HandTracker non initialise. Vérifiez la configuration mediapipe."
            )

    def draw(
        self,
        frame: cv2.typing.MatLike,
        landmarks: list[list[tuple[float, float, float]]],
    ) -> cv2.typing.MatLike:
        h, w, _ = frame.shape
        for hand_landmarks in landmarks:
            points = [(int(x * w), int(y * h)) for x, y, _ in hand_landmarks]
            for point in points:
                cv2.circle(frame, point, 4, (0, 255, 0), -1)
            for start, end in self._hand_connections:
                if start < len(points) and end < len(points):
                    cv2.line(frame, points[start], points[end], (0, 255, 0), 2)
        return frame

    def close(self) -> None:
        if self._using_tasks and self._hand_landmarker is not None:
            try:
                self._hand_landmarker.close()
            except Exception:
                pass
        elif self._hands is not None:
            try:
                self._hands.close()
            except Exception:
                pass
