import { Link, NavLink } from 'react-router-dom'
import { Seal } from './Seal'
import { TEXT, useI18n } from '../lib/i18n'
import { useAuth } from '../lib/auth'

export function Header() {
  const { t, lang, setLang } = useI18n()
  const { user, nickname, signOut } = useAuth()

  const links = [
    { to: '/', label: TEXT.navHome, end: true },
    { to: '/search', label: TEXT.navSearch },
    { to: '/authors', label: TEXT.navAuthors },
    { to: '/featured', label: TEXT.navFeatured },
    { to: '/guestbook', label: TEXT.navGuestbook },
    { to: '/about', label: TEXT.navAbout },
  ]

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Link to="/" className="brand" aria-label={t(TEXT.brand)}>
          <Seal text={lang === 'hant' ? '唐音' : '唐音'} size="sm" />
          <span className="brand-text">
            <span className="brand-name">{t(TEXT.brand)}</span>
            <span className="brand-sub">{t(TEXT.brandSub)}</span>
          </span>
        </Link>

        <nav className="nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {t(l.label)}
            </NavLink>
          ))}
        </nav>

        <div className="header-tools">
          <div className="lang-toggle" role="group" aria-label="语言 / 語言">
            <button
              className={lang === 'hans' ? 'on' : ''}
              onClick={() => setLang('hans')}
              type="button"
            >
              简
            </button>
            <button
              className={lang === 'hant' ? 'on' : ''}
              onClick={() => setLang('hant')}
              type="button"
            >
              繁
            </button>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link
                to="/guestbook"
                style={{ fontSize: '0.82rem', color: 'var(--ink-3)', letterSpacing: '0.08em' }}
                title={nickname}
              >
                {nickname.length > 8 ? nickname.slice(0, 8) + '…' : nickname}
              </Link>
              <button className="btn btn-sm btn-ghost" onClick={() => void signOut()} type="button">
                {t(TEXT.logout)}
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-sm">
              {t(TEXT.login)}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export function MobileNav() {
  const { t, lang } = useI18n()
  const hant = lang === 'hant'
  const items = [
    { to: '/', label: TEXT.navHome, mark: hant ? '閣' : '阁' },
    { to: '/search', label: TEXT.navSearch, mark: hant ? '檢' : '检' },
    { to: '/authors', label: TEXT.navAuthors, mark: '人' },
    { to: '/guestbook', label: TEXT.navGuestbook, mark: hant ? '題' : '题' },
    { to: '/about', label: TEXT.navAbout, mark: '例' },
  ]
  return (
    <nav className="mobile-nav">
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.to === '/'}
          className={({ isActive }) => (isActive ? 'on' : '')}
        >
          <span className="mn-mark">{i.mark}</span>
          <span>{t(i.label)}</span>
        </NavLink>
      ))}
    </nav>
  )
}
