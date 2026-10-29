import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import {
  IconClose,
  IconDatabase,
  IconHand,
  IconHome,
  IconLogout,
  IconMenu,
  IconUser
} from './Icons'
import { ThemeToggle } from './ThemeToggle'

const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord', icon: IconHome, end: true },
  { to: '/translate', label: 'Traduction', icon: IconHand, end: false },
  { to: '/dataset', label: 'Dataset', icon: IconDatabase, end: false },
  { to: '/profile', label: 'Profil', icon: IconUser, end: false }
]

export function Layout(): React.JSX.Element {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = (): void => setSidebarOpen(false)

  const handleLogout = (): void => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Ouvrir le menu"
        >
          <IconMenu size={20} />
        </button>
        <div className="mobile-brand">
          <div className="brand-logo sm">
            <IconHand size={18} />
          </div>
          <span>SignTranslate</span>
        </div>
        <ThemeToggle compact />
      </header>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fermer le menu"
          onClick={closeSidebar}
        />
      )}

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <IconHand size={22} />
          </div>
          <div className="sidebar-brand-text">
            <div className="brand-name">SignTranslate</div>
            <div className="brand-sub">AI</div>
          </div>
          <button
            type="button"
            className="icon-btn sidebar-close"
            onClick={closeSidebar}
            aria-label="Fermer le menu"
          >
            <IconClose size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navigation principale">
          <span className="sidebar-section">Navigation</span>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeSidebar}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle />
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
