import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { getStats, listLabels, recordImages } from '../api/dataset'
import { IconAlert, IconCheck, IconRecord } from '../components/Icons'

const FRAMES_TO_CAPTURE = 30
const CAPTURE_INTERVAL_MS = 120

export default function Dataset(): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [stats, setStats] = useState<Record<string, number>>({})
  const [labels, setLabels] = useState<string[]>([])
  const [labelInput, setLabelInput] = useState('')
  const [recording, setRecording] = useState(false)
  const [previewOn, setPreviewOn] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const refresh = useCallback((): void => {
    getStats()
      .then(setStats)
      .catch(() => setStats({}))
    listLabels()
      .then(setLabels)
      .catch(() => setLabels([]))
  }, [])

  useEffect(() => {
    refresh()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [refresh])

  const startPreview = useCallback(async (): Promise<void> => {
    if (streamRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setPreviewOn(true)
    } catch {
      setMessage({ type: 'err', text: "Impossible d'accéder à la caméra" })
    }
  }, [])

  const handleRecord = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    const label = labelInput.trim()
    if (!label) {
      setMessage({ type: 'err', text: 'Choisissez un nom de signe' })
      return
    }

    setMessage(null)
    setRecording(true)
    setProgress(0)

    try {
      await startPreview()
      // petite pause pour stabiliser le flux vidéo
      await new Promise((r) => setTimeout(r, 500))

      const images: string[] = []
      for (let i = 0; i < FRAMES_TO_CAPTURE; i++) {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (video && canvas && video.readyState >= 2) {
          canvas.width = video.videoWidth || 640
          canvas.height = video.videoHeight || 480
          canvas.getContext('2d')?.drawImage(video, 0, 0)
          images.push(canvas.toDataURL('image/jpeg', 0.8))
        }
        setProgress(i + 1)
        await new Promise((r) => setTimeout(r, CAPTURE_INTERVAL_MS))
      }

      const res = await recordImages(label, images)
      setMessage({
        type: 'ok',
        text: `${res.frames_saved} échantillons enregistrés pour « ${label} »`
      })
      setLabelInput('')
      refresh()
    } catch (err) {
      setMessage({
        type: 'err',
        text: err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      })
    } finally {
      setRecording(false)
      setProgress(0)
    }
  }

  const totalSamples = Object.values(stats).reduce((a, b) => a + b, 0)

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dataset</h1>
          <p className="page-subtitle">
            {labels.length} signe(s) · {totalSamples} échantillon(s)
          </p>
        </div>
      </header>

      <div className="dataset-grid">
        <section className="card">
          <h2 className="card-title">Enregistrer un nouveau signe</h2>

          {message && (
            <div className={`alert ${message.type === 'ok' ? 'alert-success' : 'alert-error'}`}>
              {message.type === 'ok' ? <IconCheck size={16} /> : <IconAlert size={16} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleRecord}>
            <div className="field">
              <label htmlFor="label">Nom du signe</label>
              <input
                id="label"
                type="text"
                list="existing-labels"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="ex: bonjour, merci, oui…"
                disabled={recording}
              />
              <datalist id="existing-labels">
                {labels.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>

            <div className="record-preview">
              <video ref={videoRef} muted playsInline className="camera-video small" />
              <canvas ref={canvasRef} hidden />
              {!previewOn && !recording && (
                <button type="button" className="btn btn-ghost preview-btn" onClick={startPreview}>
                  Aperçu caméra
                </button>
              )}
              {recording && (
                <div className="record-overlay">
                  <span className="rec-dot" />
                  Capture {progress}/{FRAMES_TO_CAPTURE}
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(progress / FRAMES_TO_CAPTURE) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={recording}>
              <IconRecord size={14} />
              {recording ? 'Enregistrement…' : `Capturer ${FRAMES_TO_CAPTURE} images`}
            </button>
          </form>
        </section>

        <section className="card">
          <h2 className="card-title">Signes existants</h2>
          {labels.length === 0 ? (
            <p className="hint">
              Aucun signe enregistré. Commencez par capturer votre premier signe.
            </p>
          ) : (
            <ul className="stats-list">
              {labels.map((label) => (
                <li key={label}>
                  <span className="label-name">{label}</span>
                  <span className="badge badge-violet">{stats[label] ?? 0} échantillons</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
