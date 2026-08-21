import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getStats } from '../api/dataset'
import { checkHealth } from '../api/detection'
import { IconActivity, IconCheck, IconDatabase, IconHand } from '../components/Icons'
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

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Bonjour, {user?.username} 👋</h1>
          <p className="page-subtitle">Bienvenue sur votre tableau de bord</p>
        </div>
        <span
          className={`badge ${backendOk === null ? 'badge-muted' : backendOk ? 'badge-success' : 'badge-danger'}`}
        >
          <IconActivity size={14} />
          Backend {backendOk === null ? '…' : backendOk ? 'en ligne' : 'hors ligne'}
        </span>
      </header>

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
        <h2 className="card-title">Accès rapide</h2>
        <div className="quick-grid">
          <Link to="/translate" className="quick-card">
            <IconHand size={26} />
            <div>
              <strong>Traduire en direct</strong>
              <span>Utilisez la caméra pour traduire les signes</span>
            </div>
          </Link>
          <Link to="/dataset" className="quick-card">
            <IconDatabase size={26} />
            <div>
              <strong>Entraîner le modèle</strong>
              <span>Enregistrez de nouveaux signes dans le dataset</span>
            </div>
          </Link>
        </div>
      </section>

      {labels.length > 0 && (
        <section className="card">
          <h2 className="card-title">Répartition du dataset</h2>
          <ul className="label-list">
            {labels.map((label) => (
              <li key={label}>
                <span className="label-name">{label}</span>
                <div className="label-bar">
                  <div
                    className="label-bar-fill"
                    style={{
                      width: `${Math.min(100, (stats[label] / Math.max(...Object.values(stats))) * 100)}%`
                    }}
                  />
                </div>
                <span className="label-count">{stats[label]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
