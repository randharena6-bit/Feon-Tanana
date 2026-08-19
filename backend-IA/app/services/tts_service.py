from pathlib import Path

from app.config import settings


class TTSService:
    def __init__(self) -> None:
        self.engine = settings.tts_engine

    def synthesize(self, text: str, lang: str = "fr") -> str:
        out_dir = Path("data/audio")
        out_dir.mkdir(parents=True, exist_ok=True)
        path = out_dir / "tts_output.mp3"
        if self.engine == "pyttsx3":
            import pyttsx3

            engine = pyttsx3.init()
            engine.setProperty("rate", 160)
            engine.save_to_file(text, str(path))
            engine.runAndWait()
        else:
            from gtts import gTTS

            gTTS(text, lang=lang).save(str(path))
        return str(path)