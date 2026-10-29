import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { ApiError } from '../api/client'
import { AuthLayout } from '../components/AuthLayout'
import { PasswordField, PasswordStrength, TextField } from '../components/AuthFields'
import { IconAlert, IconMail, IconUser } from '../components/Icons'
import { useAuth } from '../context/useAuth'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Register(): React.JSX.Element {
  const { register, user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirm: false
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  const usernameError =
    touched.username && username.trim().length < 3
      ? "Le nom d'utilisateur doit contenir au moins 3 caractères"
      : null
  const emailError =
    touched.email && !EMAIL_PATTERN.test(email.trim()) ? 'Adresse email invalide' : null
  const passwordError =
    touched.password && password.length < 6
      ? 'Le mot de passe doit contenir au moins 6 caractères'
      : null
  const confirmError =
    touched.confirm && confirm !== password ? 'Les mots de passe ne correspondent pas' : null

  const canSubmit =
    username.trim().length >= 3 &&
    EMAIL_PATTERN.test(email.trim()) &&
    password.length >= 6 &&
    confirm === password &&
    !submitting

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()
    setTouched({ username: true, email: true, password: true, confirm: true })
    setError(null)

    if (
      username.trim().length < 3 ||
      !EMAIL_PATTERN.test(email.trim()) ||
      password.length < 6 ||
      password !== confirm
    ) {
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
    <AuthLayout>
      <div className="auth-head">
        <h1>Créer un compte</h1>
        <p>Rejoignez Feon Tanana et commencez à traduire.</p>
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
          placeholder="3 caractères minimum"
          autoComplete="username"
          icon={<IconUser size={17} />}
          error={usernameError}
        />

        <TextField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          placeholder="vous@exemple.fr"
          autoComplete="email"
          icon={<IconMail size={17} />}
          error={emailError}
        />

        <PasswordField
          id="password"
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          placeholder="6 caractères minimum"
          autoComplete="new-password"
          error={passwordError}
        />

        <PasswordStrength password={password} />

        <PasswordField
          id="confirm"
          label="Confirmation du mot de passe"
          value={confirm}
          onChange={setConfirm}
          onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
          placeholder="Répétez le mot de passe"
          autoComplete="new-password"
          error={confirmError}
        />

        <button
          type="submit"
          className="btn btn-primary btn-block btn-loading"
          disabled={!canSubmit}
        >
          {submitting ? (
            <>
              <span className="btn-spinner" /> Création…
            </>
          ) : (
            'Créer mon compte'
          )}
        </button>
      </form>

      <p className="auth-switch">
        Déjà inscrit ? <Link to="/login">Se connecter</Link>
      </p>
    </AuthLayout>
  )
}
