import { IconMonitor, IconMoon, IconSun } from './Icons'
import { useTheme } from '../context/useTheme'
import type { ThemeMode } from '../context/theme-context'

export function ThemeToggle({ compact = false }: { compact?: boolean }): React.JSX.Element {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const nextLabel = isDark ? 'Activer le thème clair' : 'Activer le thème sombre'

  return (
    <button
      type="button"
      className={`theme-toggle${compact ? ' compact' : ''}`}
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
    >
      <span className="theme-toggle-icon">{isDark ? <IconMoon size={16} /> : <IconSun size={16} />}</span>
      {!compact && <span>{isDark ? 'Thème sombre' : 'Thème clair'}</span>}
    </button>
  )
}

const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: typeof IconSun }> = [
  { value: 'light', label: 'Clair', icon: IconSun },
  { value: 'dark', label: 'Sombre', icon: IconMoon },
  { value: 'system', label: 'Système', icon: IconMonitor }
]

export function ThemeSelector(): React.JSX.Element {
  const { mode, setMode } = useTheme()

  return (
    <div className="theme-selector" role="radiogroup" aria-label="Choix du thème">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={mode === value}
          className={`theme-option${mode === value ? ' active' : ''}`}
          onClick={() => setMode(value)}
        >
          <Icon size={16} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
