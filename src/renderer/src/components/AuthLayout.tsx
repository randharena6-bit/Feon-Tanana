import { IconCamera, IconHand, IconShield, IconSparkles } from './Icons'

export function AuthLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <div className="auth-aside-brand">
            <div className="brand-logo lg">
              <IconHand size={26} />
            </div>
            <div>
              <div className="brand-name">SignTranslate AI</div>
              <div className="brand-sub">FEON TANANA</div>
            </div>
          </div>

          <div className="auth-aside-body">
            <span className="auth-pill">
              <IconSparkles size={14} /> Traduction en temps réel
            </span>
            <h2>Brisez la barrière de la langue des signes.</h2>
            <p>
              Convertissez vos gestes en texte et en parole instantanément, directement depuis votre
              caméra.
            </p>

            <ul className="auth-features">
              <li>
                <span className="auth-feature-icon accent-violet">
                  <IconCamera size={16} />
                </span>
                Reconnaissance des signes en direct
              </li>
              <li>
                <span className="auth-feature-icon accent-green">
                  <IconShield size={16} />
                </span>
                Données et compte protégés
              </li>
              <li>
                <span className="auth-feature-icon accent-blue">
                  <IconSparkles size={16} />
                </span>
                Synthèse vocale intégrée
              </li>
            </ul>
          </div>

          <p className="auth-aside-foot">Propulsé par un modèle de vision par ordinateur.</p>
        </aside>

        <main className="auth-main">{children}</main>
      </div>
    </div>
  )
}
