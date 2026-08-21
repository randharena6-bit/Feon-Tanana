import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { ApiError } from '../api/client'
import { IconHand } from '../components/Icons'
import { useAuth } from '../context/useAuth'

export default function Register(): React.JSX.Element {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)

    if (username.trim().length < 3) {
      setError("Le nom d'utilisateur doit contenir au moins 3 caractères")
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setSubmitting(true)
    try {
      await register(username.trim(), email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-logo lg">
            <IconHand size={28} />
          </div>
          <h1>SignTranslate AI</h1>
          <p>Créez votre compte pour commencer</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <h2>Inscription</h2>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <div className="field">
            <label htmlFor="username">Nom d&apos;utilisateur</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3 caractères minimum"
              autoComplete="username"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
              autoComplete="email"
              required
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6 caractères minimum"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="confirm">Confirmation</label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Répétez le mot de passe"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="auth-switch">
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
