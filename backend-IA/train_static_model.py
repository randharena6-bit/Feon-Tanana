"""Entraîne le modèle statique (RandomForest) à partir des enregistrements de data/.

Usage :
    cd backend-IA
    .venv/bin/python train_static_model.py
"""

import json
from pathlib import Path

from app.config import settings
from app.models.static_classifier import StaticClassifier

EXCLUDED_LABELS = {"audio"}
VAL_RATIO = 0.2


def _extract_landmarks(hand: list) -> list[tuple[float, float, float]] | None:
    try:
        landmarks = [
            (float(point["x"]), float(point["y"]), float(point["z"])) for point in hand
        ]
    except (KeyError, TypeError, ValueError):
        return None
    if len(landmarks) != settings.num_landmarks:
        return None
    return landmarks


def load_dataset() -> tuple[
    list[list[tuple[float, float, float]]],
    list[str],
]:
    samples: list[list[tuple[float, float, float]]] = []
    labels: list[str] = []
    base = Path(settings.data_dir)

    label_dirs = sorted(p for p in base.iterdir() if p.is_dir())
    for label_dir in label_dirs:
        if label_dir.name in EXCLUDED_LABELS:
            continue
        found = False
        for path in sorted(label_dir.glob("*.json")):
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
                frames = payload["frames"]
            except Exception:
                print(f"[train] Fichier ignoré (illisible): {path}")
                continue
            for frame in frames:
                hands = frame if isinstance(frame, list) else []
                if not hands:
                    continue
                landmarks = _extract_landmarks(hands[0])
                if landmarks is None:
                    continue
                samples.append(landmarks)
                labels.append(label_dir.name)
                found = True
        if not found:
            print(f"[train] Label ignoré (aucune donnée valide): {label_dir.name}")
    return samples, labels


def main() -> None:
    samples, labels = load_dataset()
    classes = sorted(set(labels))
    counts = {c: labels.count(c) for c in classes}
    print(f"[train] {len(samples)} échantillons, {len(classes)} classes")
    for c in classes:
        print(f"  - {c}: {counts[c]}")

    if not classes or min(counts.values()) < 2:
        raise SystemExit(
            "[train] Pas assez de données (chaque classe doit avoir au moins 2 frames). "
            "Enregistrez davantage d'exemples avant d'entraîner."
        )

    # Split stratifié simple par classe (VAL_RATIO en validation)
    train_x: list[list[tuple[float, float, float]]] = []
    train_y: list[str] = []
    val_x: list[list[tuple[float, float, float]]] = []
    val_y: list[str] = []
    by_class: dict[str, list[int]] = {}
    for i, lab in enumerate(labels):
        by_class.setdefault(lab, []).append(i)
    for lab, idxs in by_class.items():
        cut = max(1, int(len(idxs) * (1 - VAL_RATIO)))
        for j, i in enumerate(idxs):
            if j < cut:
                train_x.append(samples[i])
                train_y.append(lab)
            else:
                val_x.append(samples[i])
                val_y.append(lab)

    print(f"[train] Entraînement: {len(train_y)} | Validation: {len(val_y)}")
    clf = StaticClassifier()
    clf.train(train_x, train_y)

    train_acc = (
        sum(clf.predict(s)[0] == y for s, y in zip(train_x, train_y)) / len(train_y)
        if train_y
        else 0.0
    )
    val_acc = (
        sum(clf.predict(s)[0] == y for s, y in zip(val_x, val_y)) / len(val_y)
        if val_y
        else 1.0
    )
    print(f"[train] Précision entraînement: {train_acc:.2%}")
    print(f"[train] Précision validation:   {val_acc:.2%}")

    clf.save()
    print(f"[train] Modèle sauvegardé: {Path(settings.models_dir) / 'static_model.pkl'}")


if __name__ == "__main__":
    main()
