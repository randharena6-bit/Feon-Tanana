import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { ApiError } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField, TextField } from '../components/AuthFields'
import { IconAlert, IconUser } from '../components/Icons'
import { useAuth } from '../context/useAuth'

export default function Login(): React.JSX.Element {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({ username: false, password: false })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  const usernameError =
    touched.username && !username.trim() ? "Le nom d'utilisateur est requis" : null
  const passwordError = touched.password && !password ? 'Le mot de passe est requis' : null
  const canSubmit = Boolean(username.trim() && password) && !submitting

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setTouched({ username: true, password: true })
    setError(null)

    if (!username.trim() || !password) {
      return
    }

    setSubmitting(true)
    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-head">
        <h1>Bon retour</h1>
        <p>Connectez-vous pour reprendre vos traductions.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="alert alert-error" role="alert">
            <IconAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        <TextField
          id="username"
          label="Nom d'utilisateur"
          value={username}
          onChange={setUsername}
          onBlur={() => setTouched((t) => ({ ...t, username: true }))}
          placeholder="Votre nom d'utilisateur"
          autoComplete="username"
          icon={<IconUser size={17} />}
          error={usernameError}
        />

        <PasswordField
          id="password"
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          placeholder="••••••••"
          autoComplete="current-password"
          error={passwordError}
        />

        <button
          type="submit"
          className="btn btn-primary btn-block btn-loading"
          disabled={!canSubmit}
        >
          {submitting ? (
            <>
              <span className="btn-spinner" /> Connexion…
            </>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      <p className="auth-switch">
        Pas encore de compte ? <Link to="/register">Créer un compte</Link>
      </p>
    </AuthLayout>
  )
}
