import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { TEXT, useI18n } from '../lib/i18n'
import { useAuth } from '../lib/auth'
import { addMessage, getSiteStats, listMessages } from '../lib/api'
import type { GuestMessage, SiteStats } from '../lib/types'
import { relTime } from '../lib/text'

export function Guestbook() {
  const { t, lang } = useI18n()
  const { user, nickname } = useAuth()
  const [msgs, setMsgs] = useState<GuestMessage[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [content, setContent] = useState('')
  const [name, setName] = useState(nickname)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    listMessages(1, 50)
      .then((r) => {
        setMsgs(r.messages)
        setTotal(r.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    getSiteStats().then(setStats).catch(() => {})
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setName((n) => n || nickname)
  }, [nickname])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    setOk('')
    if (!content.trim()) {
      setErr(lang === 'hant' ? '請寫點什麼。' : '请写点什么。')
      return
    }
    setBusy(true)
    const r = await addMessage(content.trim(), name.trim() || nickname || '无名氏')
    setBusy(false)
    if (!r.ok) {
      setErr(
        r.error === 'auth'
          ? t(TEXT.authRequired)
          : lang === 'hant'
            ? '題壁失敗，請稍後再試。'
            : '题壁失败，请稍后再试。'
      )
      return
    }
    setContent('')
    setOk(lang === 'hant' ? '已題上壁。' : '已题上壁。')
    load()
  }

  return (
    <main className="page">
      <div className="wrap wrap-narrow">
        <div className="section-head" style={{ marginBottom: 8 }}>
          <h1 className="section-title" style={{ fontSize: '1.5rem' }}>
            {t(TEXT.guestbookTitle)}
          </h1>
          <span className="section-sub">{t(TEXT.guestbookSub)}</span>
        </div>

        {stats && (
          <div
            style={{
              display: 'flex',
              gap: 26,
              flexWrap: 'wrap',
              fontSize: '0.76rem',
              color: 'var(--ink-4)',
              letterSpacing: '0.1em',
              padding: '14px 0 20px',
              borderBottom: '1px solid var(--line-soft)',
              marginBottom: 26,
            }}
          >
            <span>
              {t(TEXT.viewsTotal)} <b style={{ color: 'var(--ochre)' }}>{stats.total_views.toLocaleString('en-US')}</b>
            </span>
            <span>
              {t(TEXT.viewsToday)} <b style={{ color: 'var(--ochre)' }}>{stats.today_views.toLocaleString('en-US')}</b>
            </span>
            <span>
              {t(TEXT.visitors)} <b style={{ color: 'var(--ochre)' }}>{stats.total_visitors.toLocaleString('en-US')}</b>
            </span>
            <span>
              {t(TEXT.messages)} <b style={{ color: 'var(--ochre)' }}>{total.toLocaleString('en-US')}</b>
            </span>
          </div>
        )}

        {/* 表单 */}
        {user ? (
          <form onSubmit={submit} style={{ marginBottom: 34 }}>
            {err && <div className="alert alert-error">{err}</div>}
            {ok && <div className="alert alert-ok">{ok}</div>}
            <div className="field">
              <label htmlFor="gb-name">{t(TEXT.nickname)}</label>
              <input
                id="gb-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder={nickname}
              />
            </div>
            <div className="field">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t(TEXT.msgPlaceholder)}
                maxLength={2000}
                rows={5}
              />
              <div className="form-tip" style={{ textAlign: 'right', marginTop: 6 }}>
                {content.length} / 2000
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? t(TEXT.loading) : t(TEXT.msgSubmit)}
            </button>
          </form>
        ) : (
          <div
            className="pending-box"
            style={{ marginBottom: 34, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
          >
            <span style={{ flex: 1 }}>{t(TEXT.msgLoginTip)}</span>
            <Link to="/login" className="btn btn-sm btn-primary">
              {t(TEXT.login)}
            </Link>
            <Link to="/register" className="btn btn-sm">
              {t(TEXT.register)}
            </Link>
          </div>
        )}

        {/* 列表 */}
        <div className="msg-list">
          {loading ? (
            <div className="empty">{t(TEXT.loading)}</div>
          ) : msgs.length === 0 ? (
            <div className="empty">
              <div className="empty-mark">壁</div>
              <p>{t(TEXT.msgEmpty)}</p>
            </div>
          ) : (
            msgs.map((m) => (
              <div key={m.id} className="msg">
                <div className="msg-seal">{[...(m.nickname || '客')][0]}</div>
                <div className="msg-body">
                  <div className="msg-head">
                    <span className="msg-name">{m.nickname || (lang === 'hant' ? '無名氏' : '无名氏')}</span>
                    <span className="msg-time">{relTime(m.created_at, lang)}</span>
                  </div>
                  <div className="msg-text">{m.content}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
