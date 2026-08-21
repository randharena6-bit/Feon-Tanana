# backend-IA

Backend Python (FastAPI) du traducteur de langue des signes en temps réel.

## Structure

```
backend-IA/
├── app/
│   ├── main.py                 # Point d'entrée FastAPI
│   ├── config.py               # Configuration (pydantic-settings)
│   ├── api/routes/             # Endpoints REST
│   │   ├── detection.py        # POST /detect (frame base64 → signe)
│   │   ├── dataset.py          # Collecte de données (POST /dataset/record)
│   │   └── tts.py              # Synthèse vocale (POST /tts)
│   ├── core/hand_tracker.py    # Tracking MediaPipe (21 landmarks)
│   ├── models/                 # Classifieurs IA
│   │   ├── static_classifier.py   # Alphabet/signes fixes (Random Forest)
│   │   └── dynamic_classifier.py  # Mots/expressions (LSTM)
│   ├── schemas/detection.py    # Modèles Pydantic
│   ├── services/               # Logique métier
│   │   ├── pipeline.py         # Pipeline temps réel (statique + dynamique)
│   │   ├── dataset_service.py  # Sauvegarde des échantillons
│   │   └── tts_service.py      # pyttsx3 / gTTS
│   └── utils/landmark_utils.py # Normalisation poignet + tenseurs
├── tests/                      # Tests pytest
├── data/                       # Enregistrements vidéo/audio
├── models_store/               # Modèles entraînés (.pkl, .keras)
├── requirements.txt
└── .env.example
```

## Installation

```bash
cd backend-IA
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Lancement

```bash
uvicorn app.main:app --reload
```

API disponible sur http://127.0.0.1:8000 (docs Swagger : /docs).

## Flux temps réel

1. L'application Electron envoie chaque frame (base64) à `POST /detect`.
2. MediaPipe extrait les 21 landmarks 3D, normalisés par rapport au poignet.
3. Mode statique : Random Forest sur une frame → alphabet/signes fixes.
4. Mode dynamique : séquence de 30 frames → LSTM → mots/expressions.
5. Si confiance ≥ 80 % (seuil `CONFIDENCE_THRESHOLD`), le signe est validé et envoyé au TTS.

## Collecte de données

`POST /dataset/record` avec `{ "label": "bonjour", "frames": [...] }` enregistre
chaque échantillon dans `data/<label>/sample_XXXX.json`.


