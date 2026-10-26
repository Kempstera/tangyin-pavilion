import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TEXT, useI18n } from '../lib/i18n'
import { getAuthor, searchPoems } from '../lib/api'
import type { Author, SearchHit } from '../lib/types'
import { authorBio, authorName, genreText } from '../lib/text'
import { Seal } from '../components/Seal'
import { Pager } from '../components/Pager'

const SIZE = 20

export function AuthorDetail() {
  const { slug = '' } = useParams()
  const { t, lang } = useI18n()
  const [author, setAuthor] = useState<Author | null>(null)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getAuthor(slug)
      .then((a) => {
        if (!alive) return
        setAuthor(a)
        if (a) {
          searchPoems({ q: '', authorId: a.id, page, genre: undefined })
            .then((r) => {
              if (!alive) return
              setHits(r.hits)
              setTotal(r.total)
            })
            .catch(() => {})
        }
      })
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [slug, page])

  useEffect(() => {
    if (author) document.title = `${authorName(author, lang)} — ${t(TEXT.brand)}`
  }, [author, lang, t])

  if (!loading && !author) {
    return (
      <main className="page">
        <div className="wrap">
          <div className="empty">
            <div className="empty-mark">佚</div>
            <p>{lang === 'hant' ? '此詩人不存' : '此诗人不存'}</p>
            <Link to="/authors" className="btn" style={{ marginTop: 22 }}>
              {t(TEXT.authorsTitle)}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const name = author ? authorName(author, lang) : ''

  return (
    <main className="page">
      <div className="wrap">
        <div
          style={{
            fontSize: '0.76rem',
            letterSpacing: '0.1em',
            color: 'var(--ink-4)',
            marginBottom: 26,
            display: 'flex',
            gap: 8,
          }}
        >
          <Link to="/">{t(TEXT.navHome)}</Link>
          <span style={{ opacity: 0.5 }}>/</span>
          <Link to="/authors">{t(TEXT.navAuthors)}</Link>
        </div>

        {loading ? (
          <div>
            <div className="skeleton loading-line" style={{ width: '30%', height: 34 }} />
            <div className="skeleton loading-line" style={{ width: '80%', height: 14, marginTop: 24 }} />
            <div className="skeleton loading-line" style={{ width: '92%', height: 14 }} />
          </div>
        ) : (
          author && (
            <>
              <div className="author-hero">
                <Seal text={name.slice(0, 2)} size="lg" title={name} />
                <div style={{ minWidth: 0 }}>
                  <h1 className="author-hero-name">{name}</h1>
                  <div className="author-hero-sub">
                    {lang === 'hant' ? '唐' : '唐'} ·{' '}
                    {author.poem_count} {lang === 'hant' ? '首' : '首'}
                  </div>
                </div>
              </div>

              <div className="author-profile">
                <div>
                  {author.description ? (
                    <>
                      <div className="author-bio">{authorBio(author, lang)}</div>
                      <div className="author-bio-source">{t(TEXT.bioSource)}</div>
                    </>
                  ) : (
                    <div className="pending-box">
                      {lang === 'hant' ? '此詩人小傳闕如。' : '此诗人小传阙如。'}
                    </div>
                  )}
                </div>

                <aside className="side-panel">
                  <div className="side-title">{lang === 'hant' ? '小統計' : '小统计'}</div>
                  <div className="side-row">
                    <span>{lang === 'hant' ? '存詩' : '存诗'}</span>
                    <b>{author.poem_count}</b>
                  </div>
                  <div className="side-row">
                    <span>{lang === 'hant' ? '入選三百首' : '入选三百首'}</span>
                    <b>{hits.filter((h) => h.is_tang300).length}</b>
                  </div>
                  <div className="side-row">
                    <span>{lang === 'hant' ? '本頁所見' : '本页所见'}</span>
                    <b>{hits.length}</b>
                  </div>
                  <div
                    style={{
                      marginTop: 16,
                      paddingTop: 14,
                      borderTop: '1px solid var(--line-soft)',
                    }}
                  >
                    <Link
                      to={`/search?q=${encodeURIComponent(name)}&field=author`}
                      className="btn btn-sm"
                      style={{ width: '100%' }}
                    >
                      {lang === 'hant' ? '檢索全部' : '检索全部'}
                    </Link>
                  </div>
                </aside>
              </div>

              <div className="section" style={{ marginTop: 52 }}>
                <div className="section-head">
                  <h2 className="section-title">{lang === 'hant' ? '詩作' : '诗作'}</h2>
                  <span className="section-sub">
                    {total.toLocaleString('en-US')} {lang === 'hant' ? '首' : '首'}
                  </span>
                </div>

                <div className="result-list">
                  {hits.map((h) => (
                    <Link key={h.id} to={`/poem/${h.id}`} className="result-item">
                      <div className="result-title">
                        {lang === 'hant' ? h.short_title || h.title : h.short_title_s || h.title_s || h.title}
                      </div>
                      <div className="result-meta">
                        {h.genre && <span>{genreText(h.genre, lang)}</span>}
                        {h.is_tang300 && (
                          <span className="tag tag-cinnabar" style={{ fontSize: '0.66rem' }}>
                            {lang === 'hant' ? '三百首' : '三百首'}
                          </span>
                        )}
                      </div>
                      {h.snippet && <div className="result-snippet">{h.snippet}</div>}
                    </Link>
                  ))}
                </div>

                <Pager page={page} total={total} size={SIZE} onChange={setPage} />
              </div>
            </>
          )
        )}
      </div>
    </main>
  )
}
