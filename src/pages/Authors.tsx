import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TEXT, useI18n } from '../lib/i18n'
import { listAuthors } from '../lib/api'
import type { Author } from '../lib/types'
import { authorName } from '../lib/text'
import { Pager } from '../components/Pager'

const SIZE = 60

export function Authors() {
  const { t, lang } = useI18n()
  const [list, setList] = useState<Author[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    listAuthors(page, SIZE)
      .then((r) => {
        if (!alive) return
        setList(r.authors)
        setTotal(r.total)
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [page])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  return (
    <main className="page">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: 12 }}>
          <h1 className="section-title" style={{ fontSize: '1.5rem' }}>
            {t(TEXT.authorsTitle)}
          </h1>
          <span className="section-sub">{t(TEXT.authorsSub)}</span>
        </div>
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--ink-4)',
            letterSpacing: '0.1em',
            marginBottom: 26,
          }}
        >
          {lang === 'hant' ? '共' : '共'}{' '}
          <b style={{ color: 'var(--ochre)' }}>{total.toLocaleString('en-US')}</b>{' '}
          {lang === 'hant' ? '家' : '家'}
        </div>

        <div className="author-grid">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="author-card">
                  <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton loading-line" style={{ width: '60%', height: 14 }} />
                    <div className="skeleton loading-line" style={{ width: '38%', height: 10 }} />
                  </div>
                </div>
              ))
            : list.map((a) => (
                <Link
                  key={a.id}
                  to={`/author/${encodeURIComponent(a.slug)}`}
                  className="author-card"
                >
                  <span className="author-avatar">{[...authorName(a, lang)][0]}</span>
                  <span style={{ minWidth: 0 }}>
                    <div className="author-name">{authorName(a, lang)}</div>
                    <div className="author-count">
                      {a.poem_count} {t(TEXT.authorPoems)}
                    </div>
                  </span>
                </Link>
              ))}
        </div>

        <Pager page={page} total={total} size={SIZE} onChange={setPage} />
      </div>
    </main>
  )
}
