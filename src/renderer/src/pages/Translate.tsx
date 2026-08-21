import { useCallback, useEffect, useRef, useState } from 'react'

import { detectFrame } from '../api/detection'
import type { DetectionResult } from '../api/detection'
import { audioUrl, synthesize } from '../api/tts'
import { IconAlert, IconCamera, IconTrash, IconVolume } from '../components/Icons'

const CAPTURE_INTERVAL_MS = 900
const DUPLICATE_TIMEOUT_MS = 2500

export default function Translate(): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSignRef = useRef<{ sign: string; at: number }>({ sign: '', at: 0 })
  const busyRef = useRef(false)

  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [sentence, setSentence] = useState<string[]>([])
  const [speaking, setSpeaking] = useState(false)

  const stopCamera = useCallback((): void => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
    setResult(null)
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  const captureAndDetect = useCallback(async (): Promise<void> => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || busyRef.current || video.readyState < 2) return

    busyRef.current = true
    try {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      const image = canvas.toDataURL('image/jpeg', 0.8)

      const res = await detectFrame(image)
      setResult(res)

      if (res.sign) {
        const now = Date.now()
        const last = lastSignRef.current
        if (last.sign !== res.sign || now - last.at > DUPLICATE_TIMEOUT_MS) {
          lastSignRef.current = { sign: res.sign, at: now }
          setSentence((prev) => [...prev, res.sign])
        }
      }
    } catch {
      setResult(null)
    } finally {
      busyRef.current = false
    }
  }, [])

  const startCamera = useCallback(async (): Promise<void> => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOn(true)
      timerRef.current = setInterval(captureAndDetect, CAPTURE_INTERVAL_MS)
    } catch (err) {
      setCameraError(
        err instanceof Error && err.name === 'NotAllowedError'
          ? "Accès à la caméra refusé. Autorisez la caméra dans les paramètres de l'application."
          : 'Impossible d’accéder à la caméra.'
      )
    }
  }, [captureAndDetect])

  const speak = useCallback(async (): Promise<void> => {
    const text = sentence.join(' ')
    if (!text.trim()) return
    setSpeaking(true)
    try {
      await synthesize(text, 'fr')
      const audio = audioRef.current
      if (audio) {
        audio.src = `${audioUrl()}?t=${Date.now()}`
        await audio.play()
      }
    } catch {
      /* lecture impossible */
    } finally {
      setSpeaking(false)
    }
  }, [sentence])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Traduction en direct</h1>
          <p className="page-subtitle">
            Montrez vos signes à la caméra — la traduction s&apos;affiche automatiquement
          </p>
        </div>
        {!cameraOn ? (
          <button type="button" className="btn btn-primary" onClick={startCamera}>
            <IconCamera size={16} />
            Activer la caméra
          </button>
        ) : (
          <button type="button" className="btn btn-danger" onClick={stopCamera}>
            Arrêter
          </button>
        )}
      </header>

      {cameraError && (
        <div className="alert alert-error" role="alert">
          <IconAlert size={16} />
          {cameraError}
        </div>
      )}

      <div className="translate-grid">
        <section className="card camera-card">
          <div className="camera-frame">
            <video ref={videoRef} muted playsInline className="camera-video" />
            <canvas ref={canvasRef} hidden />
            {!cameraOn && (
              <div className="camera-placeholder">
                <IconCamera size={40} />
                <p>Caméra désactivée</p>
              </div>
            )}
            {cameraOn && result?.sign && (
              <div className="camera-detection">
                <span className="detection-sign">{result.sign}</span>
                <span className="detection-conf">{Math.round(result.confidence * 100)}%</span>
                <span
                  className={`badge ${result.mode === 'dynamic' ? 'badge-blue' : 'badge-violet'}`}
                >
                  {result.mode === 'dynamic' ? 'Dynamique' : 'Statique'}
                </span>
              </div>
            )}
          </div>
        </section>

        <section className="card sentence-card">
          <h2 className="card-title">Phrase traduite</h2>

          <div className="sentence-box">
            {sentence.length === 0 ? (
              <span className="sentence-empty">Aucun signe détecté pour le moment…</span>
            ) : (
              sentence.map((word, i) => (
                <span key={`${word}-${i}`} className="sentence-word">
                  {word}
                </span>
              ))
            )}
          </div>

          <div className="sentence-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={speak}
              disabled={sentence.length === 0 || speaking}
            >
              <IconVolume size={16} />
              {speaking ? 'Lecture…' : 'Écouter'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setSentence([])}
              disabled={sentence.length === 0}
            >
              <IconTrash size={16} />
              Effacer
            </button>
          </div>

          <p className="hint">
            La détection analyse une image toutes les {(CAPTURE_INTERVAL_MS / 1000).toFixed(1)}s.
            Les signes identiques rapprochés sont fusionnés.
          </p>
        </section>
      </div>

      <audio ref={audioRef} hidden />
    </div>
  )
}
