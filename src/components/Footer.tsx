import { Link } from 'react-router-dom'
import { Seal } from './Seal'
import { TEXT, useI18n } from '../lib/i18n'

const REFS = [
  { name: 'chinese-poetry', url: 'https://github.com/chinese-poetry/chinese-poetry' },
  { name: '中國哲學書電子化計劃', url: 'https://ctext.org/zhs' },
  { name: '寒泉古典文獻全文檢索資料庫', url: 'http://skqs.lib.ntnu.edu.tw/dragon/' },
  { name: '臺灣大學全唐詩檢索系統', url: 'http://tssc.ntu.edu.tw/' },
]

export function Footer() {
  const { t, lang } = useI18n()
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <Seal text="唐音" size="sm" />
              <span className="brand-name" style={{ fontSize: '1.05rem' }}>
                {t(TEXT.brand)}
              </span>
            </div>
            <p className="footer-desc">{t(TEXT.footerDesc)}</p>
          </div>

          <div>
            <div className="footer-h">{t(TEXT.footerNav)}</div>
            <div className="footer-links">
              <Link to="/search">{t(TEXT.navSearch)}</Link>
              <Link to="/authors">{t(TEXT.navAuthors)}</Link>
              <Link to="/featured">{t(TEXT.navFeatured)}</Link>
              <Link to="/guestbook">{t(TEXT.navGuestbook)}</Link>
              <Link to="/about">{t(TEXT.navAbout)}</Link>
            </div>
          </div>

          <div>
            <div className="footer-h">{t(TEXT.footerData)}</div>
            <div className="footer-links">
              {REFS.map((r) => (
                <a key={r.url} href={r.url} target="_blank" rel="noreferrer noopener">
                  {r.name}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div className="footer-h">{lang === 'hant' ? '館中' : '馆中'}</div>
            <div className="footer-links">
              <Link to="/login">{t(TEXT.login)}</Link>
              <Link to="/register">{t(TEXT.register)}</Link>
              <a href={`mailto:hello@signupeverywhere.cc`}>hello@signupeverywhere.cc</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {t(TEXT.brand)} · poem.signupeverywhere.cc
          </span>
          <span>{t(TEXT.rights)}</span>
        </div>
      </div>
    </footer>
  )
}
