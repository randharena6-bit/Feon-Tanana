import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import {
  IconDatabase,
  IconHand,
  IconHome,
  IconLogout,
  IconUser
} from './Icons'

const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord', icon: IconHome, end: true },
  { to: '/translate', label: 'Traduction', icon: IconHand, end: false },
  { to: '/dataset', label: 'Dataset', icon: IconDatabase, end: false },
  { to: '/profile', label: 'Profil', icon: IconUser, end: false }
]

export function Layout(): React.JSX.Element {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = (): void => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <IconHand size={22} />
          </div>
          <div>
            <div className="brand-name">SignTranslate</div>
            <div className="brand-sub">AI</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{user?.username.charAt(0).toUpperCase()}</div>
            <div className="user-chip-info">
              <span className="user-chip-name">{user?.username}</span>
              <span className="user-chip-mail">{user?.email}</span>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-block" onClick={handleLogout}>
            <IconLogout size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
