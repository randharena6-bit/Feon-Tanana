import numpy as np


def normalize_landmarks(
    landmarks: list[tuple[float, float, float]],
) -> list[tuple[float, float, float]]:
    if not landmarks:
        return []
    wrist = landmarks[0]
    normalized = [
        (x - wrist[0], y - wrist[1], z - wrist[2]) for x, y, z in landmarks
    ]
    scale = max(
        np.linalg.norm([x, y]) for x, y, _ in normalized
    ) or 1.0
    return [(x / scale, y / scale, z / scale) for x, y, z in normalized]


def flatten_landmarks(
    landmarks: list[tuple[float, float, float]],
) -> list[float]:
    return [coord for point in normalize_landmarks(landmarks) for coord in point]


def sequence_to_tensor(
    sequence: list[list[tuple[float, float, float]]],
    max_len: int,
) -> np.ndarray:
    flat = [flatten_landmarks(hand) for hand in sequence]
    tensor = np.zeros((max_len, 63))
    for i, vec in enumerate(flat[:max_len]):
        tensor[i, : len(vec)] = vec
    return tensor.reshape(1, max_len, 63)