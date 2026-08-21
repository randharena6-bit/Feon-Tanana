import { useCallback, useEffect, useRef, useState } from 'react'

import { detectFrame } from '../api/detection'
import type { DetectionResult } from '../api/detection'
import type { Landmarks } from '../api/detection'
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
  const [showLandmarks, setShowLandmarks] = useState(false)

  const stopCamera = useCallback((): void => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
    setResult(null)
    setShowLandmarks(false)
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
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Pas de contexte 2D')
      ctx.drawImage(video, 0, 0)

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

  // Dessiner les landmarks sur le canvas
  const drawLandmarks = useCallback(
    (landmarks: Landmarks[] | undefined, videoW: number, videoH: number): void => {
      if (!landmarks || !showLandmarks) return
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return

      ctx.save()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#00ffcc'

      // Dessiner les connexions entre les points de landmarks (MediaPipe hand landmarks)
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // pouce
        [0, 5], [5, 6], [6, 7], [7, 8], // index
        [0, 9], [9, 10], [10, 11], [11, 12], // majeur
        [0, 13], [13, 14], [14, 15], [15, 16], // annulaire
        [0, 17], [17, 18], [18, 20], [20, 22], // auriculaire
        [5, 9], [9, 13], [13, 17], // connexions palmaire
      ]

      ctx.beginPath()
      connections.forEach(([a, b]) => {
        const pa = landmarks[a]
        const pb = landmarks[b]
        if (pa && pb) {
          const x1 = (pa.x * videoW) / 1
          const y1 = (pa.y * videoH) / 1
          const x2 = (pb.x * videoW) / 1
          const y2 = (pb.y * videoH) / 1
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
        }
      })
      ctx.stroke()

      // Dessiner les points des landmarks
      landmarks.forEach((lm) => {
        if (lm) {
          const x = lm.x * videoW
          const y = lm.y * videoH
          ctx.beginPath()
          ctx.arc(x, y, 5, 0, Math.PI * 2)
          ctx.fillStyle = '#ff6b6b'
          ctx.fill()
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })

      ctx.restore()
    },
    [showLandmarks]
  )

  useEffect(() => {
    // Redessiner à chaque changement de résultat si showLandmarks est actif
    const handle = setInterval(() => {
      const video = videoRef.current
      const res = result
      if (video && res?.sign && showLandmarks) {
        drawLandmarks(res.landmarks ?? [], video.videoWidth, video.videoHeight)
      }
    }, 100)
    return () => clearInterval(handle)
  }, [showLandmarks, result])

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
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowLandmarks((s) => !s)}
          style={{ marginLeft: 8, fontSize: 12 }}
        >
          <IconCamera size={12} /> Landmarks
        </button>
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
            <video
              ref={videoRef}
              muted
              playsInline
              className="camera-video"
              style={{ width: '100%', borderRadius: 12 }}
            />
            <canvas
              ref={canvasRef}
              hidden
              style={{ width: '100%', borderRadius: 12 }}
            />
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
                <span className={`badge ${result.mode === 'dynamic' ? 'badge-blue' : 'badge-violet'}`}>
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