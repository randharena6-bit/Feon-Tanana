import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getStats } from '../api/dataset'
import { checkHealth } from '../api/detection'
import { IconActivity, IconCheck, IconDatabase, IconHand, IconSparkles } from '../components/Icons'
import { useAuth } from '../context/useAuth'

export default function Dashboard(): React.JSX.Element {
  const { user } = useAuth()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [backendOk, setBackendOk] = useState<boolean | null>(null)

  useEffect(() => {
    checkHealth().then(setBackendOk)
    getStats()
      .then(setStats)
      .catch(() => setStats({}))
  }, [])

  const labels = Object.keys(stats)
  const totalSamples = Object.values(stats).reduce((a, b) => a + b, 0)
  const maxSamples = labels.length > 0 ? Math.max(1, ...Object.values(stats)) : 1

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p className="page-subtitle">Bonjour {user?.username}, voici votre activité</p>
        </div>
        <span
          className={`badge ${backendOk === null ? 'badge-muted' : backendOk ? 'badge-success' : 'badge-danger'}`}
        >
          <IconActivity size={14} />
          Backend {backendOk === null ? '…' : backendOk ? 'en ligne' : 'hors ligne'}
        </span>
      </header>

      <section className="hero-card">
        <div className="hero-body">
          <span className="auth-pill">
            <IconSparkles size={14} /> Traduction en temps réel
          </span>
          <h2>Prêt à traduire la langue des signes ?</h2>
          <p>
            Activez votre caméra et laissez l&apos;IA convertir vos gestes en texte et en parole,
            instantanément.
          </p>
          <div className="hero-actions">
            <Link to="/translate" className="btn btn-primary">
              <IconHand size={16} />
              Lancer la traduction
            </Link>
            <Link to="/dataset" className="btn btn-ghost">
              <IconDatabase size={16} />
              Gérer le dataset
            </Link>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <IconHand size={120} />
        </div>
      </section>

      <section className="stat-grid">
        <div className="card stat-card">
          <div className="stat-icon accent-violet">
            <IconDatabase size={22} />
          </div>
          <div>
            <div className="stat-value">{labels.length}</div>
            <div className="stat-label">Signes enregistrés</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon accent-blue">
            <IconHand size={22} />
          </div>
          <div>
            <div className="stat-value">{totalSamples}</div>
            <div className="stat-label">Échantillons collectés</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className={`stat-icon ${backendOk ? 'accent-green' : 'accent-red'}`}>
            <IconActivity size={22} />
          </div>
          <div>
            <div className="stat-value">
              {backendOk === null ? '—' : backendOk ? <IconCheck size={20} /> : '!'}
            </div>
            <div className="stat-label">Moteur de détection</div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Répartition du dataset</h2>
          <span className="badge badge-muted">{labels.length} signe(s)</span>
        </div>
        {labels.length === 0 ? (
          <p className="empty-state">
            Aucun signe enregistré pour le moment. Rendez-vous dans{' '}
            <Link to="/dataset">Dataset</Link> pour capturer vos premiers signes.
          </p>
        ) : (
          <ul className="label-list">
            {labels.map((label) => (
              <li key={label}>
                <span className="label-name">{label}</span>
                <div className="label-bar">
                  <div
                    className="label-bar-fill"
                    style={{ width: `${Math.min(100, (stats[label] / maxSamples) * 100)}%` }}
                  />
                </div>
                <span className="label-count">{stats[label]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
