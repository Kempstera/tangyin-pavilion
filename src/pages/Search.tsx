import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Pager } from '../components/Pager'
import { TEXT, useI18n, type Pair } from '../lib/i18n'
import { genreText } from '../lib/text'
import { searchPoems, getMeta } from '../lib/api'
import type { SearchHit } from '../lib/types'

const PAGE = 20

type Field = 'all' | 'title' | 'author' | 'content'

export function Search() {
  const { t, lang } = useI18n()
  const [sp, setSp] = useSearchParams()

  const q = sp.get('q') || ''
  const field = (sp.get('field') as Field) || 'all'
  const genre = sp.get('genre') || ''
  const only300 = sp.get('only300') === '1'
  const authorId = Number(sp.get('author') || 0) || undefined
  const page = Math.max(1, Number(sp.get('page') || 1) || 1)

  const [input, setInput] = useState(q)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'db' | 'static'>('db')
  const [err, setErr] = useState('')

  const genres = useMemo(
    () => [
      '五言绝句', '七言绝句', '五言律诗', '七言律诗', '五言排律', '七言排律',
      '五言古体', '七言古体', '乐府', '杂言',
    ],
    []
  )

  useEffect(() => setInput(q), [q])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setErr('')
    searchPoems({ q, field, page, genre: genre || undefined, authorId, onlyTang300: only300 })
      .then((r) => {
        if (!alive) return
        setHits(r.hits)
        setTotal(r.total)
        setMode(r.mode)
      })
      .catch((e) => alive && setErr(String(e?.message || e)))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [q, field, page, genre, authorId, only300])

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    if (!('page' in patch)) next.delete('page')
    setSp(next, { replace: true })
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    update({ q: input.trim() || null })
  }

  const tabs: { key: Field; label: Pair }[] = [
    { key: 'all', label: TEXT.tabAll },
    { key: 'title', label: TEXT.tabTitle },
    { key: 'author', label: TEXT.tabAuthor },
    { key: 'content', label: TEXT.tabContent },
  ]

  const genreLabel = genre ? genreText(genre, lang) : ''

  return (
    <main className="page">
      <div className="wrap">
        <div className="search-page-head">
          <div className="section-title" style={{ marginBottom: 22 }}>
            {t(TEXT.searchTitle)}
          </div>

          <form className="search-field" onSubmit={onSubmit} role="search">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t(TEXT.searchPlaceholder)}
              aria-label={t(TEXT.searchBtn)}
              enterKeyHint="search"
            />
            <button className="search-btn" type="submit">
              {t(TEXT.searchBtn)}
            </button>
          </form>

          <div className="tabs">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                type="button"
                className={`tab ${field === tb.key ? 'on' : ''}`}
                onClick={() => update({ field: tb.key === 'all' ? null : tb.key })}
              >
                {t(tb.label)}
              </button>
            ))}
          </div>
        </div>

        {/* 体裁筛选 */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            padding: '14px 0 4px',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: 'var(--ink-4)', letterSpacing: '0.12em' }}>
            {lang === 'hant' ? '體裁' : '体裁'}
          </span>
          <button
            type="button"
            className={`chip ${!genre ? 'on' : ''}`}
            onClick={() => update({ genre: null })}
            style={chipStyle(!genre)}
          >
            {lang === 'hant' ? '全部' : '全部'}
          </button>
          {genres.map((g) => {
            const gLabel = genreText(g, lang)
            return (
              <button
                key={g}
                type="button"
                className="chip"
                onClick={() => update({ genre: genre === g ? null : g })}
                style={chipStyle(genre === g)}
              >
                {gLabel}
              </button>
            )
          })}
          <span style={{ width: 1, height: 16, background: 'var(--line)', margin: '0 4px' }} />
          <button
            type="button"
            className="chip"
            onClick={() => update({ only300: only300 ? null : '1' })}
            style={chipStyle(only300)}
          >
            {t(TEXT.portal300)}
          </button>
        </div>

        <div className="result-bar">
          {loading ? (
            <span>{t(TEXT.loading)}</span>
          ) : (
            <>
              <span>
                {t(TEXT.found)} <b>{total.toLocaleString('en-US')}</b> {t(TEXT.items)}
              </span>
              {q && (
                <span style={{ color: 'var(--ink-4)' }}>
                  「{q}」
                </span>
              )}
              {genreLabel && <span className="tag tag-ochre">{genreLabel}</span>}
              {mode === 'static' && (
                <span className="tag" style={{ marginLeft: 'auto' }}>
                  {lang === 'hant' ? '離線模式' : '离线模式'}
                </span>
              )}
            </>
          )}
        </div>

        {err && <div className="alert alert-error">{err}</div>}

        {!loading && mode === 'static' && field === 'content' && (
          <div className="alert alert-error">
            {lang === 'hant'
              ? '離線模式暫不支持按詩句檢索，請改用「詩題」或「詩人」。'
              : '离线模式暂不支持按诗句检索，请改用「诗题」或「诗人」。'}
          </div>
        )}

        <div className="result-list">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="result-item">
                  <div className="skeleton loading-line" style={{ width: '38%', height: 16 }} />
                  <div className="skeleton loading-line" style={{ width: '20%', height: 11 }} />
                  <div className="skeleton loading-line" style={{ width: '86%' }} />
                </div>
              ))
            : hits.map((h) => <ResultRow key={h.id} hit={h} q={q} />)}
        </div>

        {!loading && !hits.length && (
          <div className="empty">
            <div className="empty-mark">空</div>
            <p>{t(TEXT.noResult)}</p>
            <p style={{ marginTop: 8, fontSize: '0.82rem', opacity: 0.8 }}>{t(TEXT.noResultTip)}</p>
          </div>
        )}

        <Pager
          page={page}
          total={total}
          size={PAGE}
          onChange={(p) => update({ page: String(p) })}
        />
      </div>
    </main>
  )
}

function chipStyle(on: boolean): React.CSSProperties {
  return {
    padding: '3px 11px',
    border: `1px solid ${on ? 'var(--ochre)' : 'var(--line-soft)'}`,
    borderRadius: 999,
    background: on ? 'var(--ochre-wash)' : 'var(--paper-raise)',
    color: on ? 'var(--ochre)' : 'var(--ink-3)',
    fontSize: '0.75rem',
    letterSpacing: '0.06em',
    cursor: 'pointer',
  }
}

/** 体裁简繁对照 */
const TAB_CONV: Record<string, { hans: string; hant: string }> = {
  五言绝句: { hans: '五言绝句', hant: '五言絕句' },
  七言绝句: { hans: '七言绝句', hant: '七言絕句' },
  五言律诗: { hans: '五言律诗', hant: '五言律詩' },
  七言律诗: { hans: '七言律诗', hant: '七言律詩' },
  五言排律: { hans: '五言排律', hant: '五言排律' },
  七言排律: { hans: '七言排律', hant: '七言排律' },
  五言古体: { hans: '五言古体', hant: '五言古體' },
  七言古体: { hans: '七言古体', hant: '七言古體' },
  乐府: { hans: '乐府', hant: '樂府' },
  杂言: { hans: '杂言', hant: '雜言' },
}

function ResultRow({ hit, q }: { hit: SearchHit; q: string }) {
  const { lang, t } = useI18n()
  const title = lang === 'hant' ? hit.short_title || hit.title : hit.short_title_s || hit.title_s || hit.title
  const author = lang === 'hant' ? hit.author : hit.author_s || hit.author
  const snippet = lang === 'hant' ? hit.snippet : hit.snippet_s || hit.snippet

  return (
    <Link to={`/poem/${hit.id}`} className="result-item">
      <div className="result-title">
        <Highlight text={title} kw={q} />
      </div>
      <div className="result-meta">
        <span className="who">
          <Highlight text={author} kw={q} />
        </span>
        {hit.genre && <span>{genreText(hit.genre, lang)}</span>}
        {hit.is_tang300 && (
          <span className="tag tag-cinnabar" style={{ fontSize: '0.66rem' }}>
            {lang === 'hant' ? '三百首' : '三百首'}
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: 'var(--ink-4)' }}>{t(TEXT.navSearch) === '检索' ? '' : ''}</span>
      </div>
      {snippet && (
        <div className="result-snippet">
          <Highlight text={snippet} kw={q} />
        </div>
      )}
    </Link>
  )
}

function Highlight({ text, kw }: { text: string; kw: string }) {
  if (!kw || !text.includes(kw)) return <>{text}</>
  const parts = text.split(kw)
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <em>{kw}</em>}
        </span>
      ))}
    </>
  )
}
