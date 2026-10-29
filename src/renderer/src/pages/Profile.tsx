import { ThemeSelector } from '../components/ThemeToggle'
import { IconCheck, IconMail, IconShield, IconUser } from '../components/Icons'
import { useAuth } from '../context/useAuth'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return iso
  }
}

export default function Profile(): React.JSX.Element {
  const { user } = useAuth()

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Profil</h1>
          <p className="page-subtitle">Informations de votre compte et préférences</p>
        </div>
      </header>

      <div className="profile-grid">
        <section className="card profile-card">
          <div className="profile-header">
            <div className="avatar xl">{user?.username.charAt(0).toUpperCase()}</div>
            <div>
              <h2>{user?.username}</h2>
              <p className="hint">Membre depuis le {user ? formatDate(user.created_at) : '—'}</p>
            </div>
          </div>

          <ul className="profile-fields">
            <li>
              <span className="field-label">Identifiant</span>
              <span className="field-value">
                <IconUser size={16} />
                {user?.username}
              </span>
            </li>
            <li>
              <span className="field-label">Email</span>
              <span className="field-value">
                <IconMail size={16} />
                {user?.email}
              </span>
            </li>
            <li>
              <span className="field-label">ID utilisateur</span>
              <span className="field-value mono">#{user?.id}</span>
            </li>
          </ul>

          <div className="alert alert-success">
            <IconShield size={16} />
            Session authentifiée via JWT — vos données sont stockées dans PostgreSQL
          </div>
        </section>

        <section className="card preferences-card">
          <h2 className="card-title">Apparence</h2>
          <p className="hint">
            Choisissez le thème de l&apos;interface. Le mode système suit les préférences de votre
            ordinateur.
          </p>
          <ThemeSelector />
          <ul className="preferences-list">
            <li>
              <IconCheck size={16} />
              Le choix est enregistré sur cet appareil
            </li>
            <li>
              <IconCheck size={16} />
              Appliqué instantanément à toutes les pages
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
