from app.utils.landmark_utils import flatten_landmarks, normalize_landmarks


def test_normalize_landmarks_wrist_origin():
    landmarks = [(0.5, 0.5, 0.0), (0.6, 0.5, 0.1)]
    normalized = normalize_landmarks(landmarks)
    assert normalized[0] == (0.0, 0.0, 0.0)


def test_flatten_landmarks_shape():
    landmarks = [(0.1, 0.2, 0.3)] * 21
    flat = flatten_landmarks(landmarks)
    assert len(flat) == 63