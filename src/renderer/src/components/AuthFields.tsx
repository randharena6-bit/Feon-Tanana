import { useState } from 'react'
import type { ReactNode } from 'react'

import { IconEye, IconEyeOff, IconLock } from './Icons'

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  type?: 'text' | 'email'
  placeholder?: string
  autoComplete?: string
  icon?: ReactNode
  error?: string | null
}

export function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  autoComplete,
  icon,
  error
}: TextFieldProps): React.JSX.Element {
  return (
    <div className={`field${error ? ' invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={icon ? 'has-icon' : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          required
        />
      </div>
      {error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  )
}

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  autoComplete?: string
  error?: string | null
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  error
}: PasswordFieldProps): React.JSX.Element {
  const [visible, setVisible] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  const syncCapsLock = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    setCapsLock(event.getModifierState('CapsLock'))
  }

  return (
    <div className={`field${error ? ' invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <span className="input-icon">
          <IconLock size={17} />
        </span>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            setCapsLock(false)
            onBlur?.()
          }}
          onKeyDown={syncCapsLock}
          onKeyUp={syncCapsLock}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="has-icon has-toggle"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          required
        />
        <button
          type="button"
          className="input-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          tabIndex={-1}
        >
          {visible ? <IconEyeOff size={18} /> : <IconEye size={18} />}
        </button>
      </div>
      {error ? (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      ) : (
        capsLock && <span className="field-hint warn">Verr. Maj activée</span>
      )}
    </div>
  )
}

interface PasswordStrengthProps {
  password: string
}

function scorePassword(password: string): number {
  if (!password) return 0
  let score = 0
  if (password.length >= 6) score += 1
  if (password.length >= 10) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return Math.min(score, 5)
}

export function PasswordStrength({ password }: PasswordStrengthProps): React.JSX.Element | null {
  if (!password) return null

  const score = scorePassword(password)
  const level = score <= 1 ? 1 : score <= 3 ? 2 : 3
  const labels = ['', 'Faible', 'Moyen', 'Fort']
  const classes = ['', 'weak', 'medium', 'strong']

  return (
    <div className={`strength ${classes[level]}`}>
      <div className="strength-bars">
        {[1, 2, 3].map((bar) => (
          <span key={bar} className={`strength-bar${bar <= level ? ' on' : ''}`} />
        ))}
      </div>
      <span className="strength-label">Robustesse : {labels[level]}</span>
    </div>
  )
}
