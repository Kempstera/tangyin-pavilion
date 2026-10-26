import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TEXT, useI18n } from '../lib/i18n'
import { getAuthorById, getPoem, getRelatedPoems } from '../lib/api'
import type { Author, Poem } from '../lib/types'
import { genreText, noteTerm, noteText, poemAuthor, poemLines, poemShortTitle, poemTitle, poemTranslation } from '../lib/text'
import { findVariants } from '../lib/variants'
import { poemRefs } from '../lib/refs'
import { PoemCard } from '../components/PoemCard'

export function PoemDetail() {
  const { id } = useParams()
  const { t, lang } = useI18n()
  const poemId = Number(id)

  const [poem, setPoem] = useState<Poem | null>(null)
  const [author, setAuthor] = useState<Author | null>(null)
  const [related, setRelated] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)
  const [vertical, setVertical] = useState(() => localStorage.getItem('tang-vertical') === '1')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setPoem(null)
    ;(async () => {
      try {
        const p = await getPoem(poemId)
        if (!alive) return
        setPoem(p)
        if (p) {
          getAuthorById(p.author_id).then((a) => alive && setAuthor(a)).catch(() => {})
          getRelatedPoems(p, 4).then((r) => alive && setRelated(r)).catch(() => {})
        }
      } catch { /* ignore */ }
      if (alive) setLoading(false)
    })()
    return () => { alive = false }
  }, [poemId])

  useEffect(() => {
    if (poem) {
      document.title = `${poemShortTitle(poem, lang)} · ${poemAuthor(poem, lang)} — ${t(TEXT.brand)}`
    }
    return () => { document.title = `${t(TEXT.brand)} · ${t(TEXT.brandSub)}` }
  }, [poem, lang, t])

  const variants = useMemo(() => (poem ? findVariants(poem.content) : []), [poem])
  const refs = useMemo(
    () => (poem ? poemRefs(poem.paragraphs[0] || poem.title, poemTitle(poem, lang)) : []),
    [poem, lang]
  )

  const toggleVertical = () => {
    const v = !vertical
    setVertical(v)
    localStorage.setItem('tang-vertical', v ? '1' : '0')
  }

  const copy = async () => {
    if (!poem) return
    const lines = poemLines(poem, lang)
    const txt = `${poemTitle(poem, lang)}\n${poemAuthor(poem, lang)}\n\n${lines.join('\n')}\n\n— ${t(TEXT.brand)}`
    try {
      await navigator.clipboard.writeText(txt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="wrap">
          <div className="poem-detail">
            <div className="skeleton loading-line" style={{ width: '46%', height: 26, margin: '30px auto' }} />
            <div className="skeleton loading-line" style={{ width: '26%', height: 13, margin: '0 auto 40px' }} />
            {[82, 74, 88, 70].map((w, i) => (
              <div key={i} className="skeleton loading-line" style={{ width: `${w}%`, height: 18, margin: '0 auto 18px' }} />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (!poem) {
    return (
      <main className="page">
        <div className="wrap">
          <div className="empty">
            <div className="empty-mark">佚</div>
            <p>{t(TEXT.notFound)}</p>
            <p style={{ marginTop: 8, fontSize: '0.84rem' }}>{t(TEXT.notFoundTip)}</p>
            <Link to="/" className="btn" style={{ marginTop: 22 }}>
              {t(TEXT.backHome)}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const lines = poemLines(poem, lang)
  const notes = poem.notes || []
  const trans = poemTranslation(poem, lang)
  const hasAny = notes.length > 0 || Boolean(trans)

  return (
    <main className="page">
      <div className="wrap">
        <div className="poem-detail">
          <div
            style={{
              fontSize: '0.76rem',
              letterSpacing: '0.1em',
              color: 'var(--ink-4)',
              marginBottom: 26,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <Link to="/">{t(TEXT.navHome)}</Link>
            <span style={{ opacity: 0.5 }}>/</span>
            <Link to={`/author/${encodeURIComponent(author?.slug || poem.author)}`}>
              {poemAuthor(poem, lang)}
            </Link>
          </div>

          {/* 标题 */}
          <div className="poem-detail-head">
            <h1 className="poem-title">{poemShortTitle(poem, lang)}</h1>
            {poemShortTitle(poem, lang) !== poemTitle(poem, lang) && (
              <div
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.1em',
                  color: 'var(--ink-4)',
                  marginTop: -6,
                  marginBottom: 14,
                }}
              >
                {lang === 'hant' ? '《全唐詩》原題：' : '《全唐诗》原题：'}
                {poemTitle(poem, lang)}
              </div>
            )}
            <div className="poem-meta">
              <Link
                to={`/author/${encodeURIComponent(author?.slug || poem.author)}`}
                className="author-link"
              >
                {poemAuthor(poem, lang)}
              </Link>
              <span>·</span>
              <span>{lang === 'hant' ? '唐' : '唐'}</span>
              {poem.genre && (
                <>
                  <span>·</span>
                  <span>{genreText(poem.genre, lang)}</span>
                </>
              )}
              <span>·</span>
              <span>{poem.char_count} {lang === 'hant' ? '字' : '字'}</span>
              {poem.is_tang300 && (
                <span className="tag tag-cinnabar" style={{ fontSize: '0.68rem' }}>
                  {lang === 'hant' ? '唐詩三百首' : '唐诗三百首'}
                </span>
              )}
            </div>
          </div>

          {/* 原文 */}
          <div className={`poem-body ${vertical ? 'vertical' : ''}`}>
            <div>
              {lines.map((l, i) => (
                <p key={i} className="poem-line">
                  {l}
                </p>
              ))}
            </div>
          </div>

          <div className="poem-actions">
            <button className="btn btn-sm" onClick={toggleVertical} type="button">
              {vertical ? t(TEXT.horizontal) : t(TEXT.vertical)}
            </button>
            <button className="btn btn-sm" onClick={copy} type="button">
              {copied ? t(TEXT.copied) : t(TEXT.copy)}
            </button>
            {author && (
              <Link className="btn btn-sm" to={`/author/${encodeURIComponent(author.slug)}`}>
                {lang === 'hant' ? '詩人小傳' : '诗人小传'}
              </Link>
            )}
          </div>

          {/* 异文 */}
          {variants.length > 0 && (
            <div className="block">
              <div className="block-head">
                <div className="block-title">{lang === 'hant' ? '異文' : '异文'}</div>
                <div className="block-note">
                  {lang === 'hant' ? '底本與通行本之別' : '底本与通行本之别'}
                </div>
              </div>
              {variants.map((v, i) => (
                <div key={i} className="pending-box" style={{ marginBottom: 10 }}>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: 'var(--ink)', letterSpacing: '0.06em' }}>{v.from}</span>
                    <span style={{ margin: '0 10px', color: 'var(--ink-4)' }}>／</span>
                    <span style={{ color: 'var(--ochre)' }}>{v.to}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--ink-3)' }}>
                    {lang === 'hant' ? v.note.hant : v.note.hans}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 注释 */}
          <div className="block">
            <div className="block-head">
              <div className="block-title">{t(TEXT.notes)}</div>
              <div className="block-note">
                {notes.length > 0 ? `${notes.length} ${lang === 'hant' ? '條' : '条'}` : ''}
              </div>
            </div>

            {notes.length > 0 ? (
              <>
                <ul className="note-list">
                  {notes.map((n, i) => (
                    <li key={i} className="note-item">
                      <span className="note-term">{noteTerm(n, lang)}</span>
                      <span className="note-text">{noteText(n, lang)}</span>
                    </li>
                  ))}
                </ul>
                <div className="source-line">
                  <b>{t(TEXT.source)}：</b>
                  <span>{t(TEXT.sourceNote)}</span>
                </div>
              </>
            ) : (
              <PendingBlock poem={poem} which="notes" refs={refs} />
            )}
          </div>

          {/* 译文 */}
          <div className="block">
            <div className="block-head">
              <div className="block-title">{t(TEXT.translation)}</div>
            </div>

            {trans ? (
              <>
                <div className="translation">
                  {trans.split(/\n+/).filter(Boolean).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <div className="source-line">
                  <b>{t(TEXT.source)}：</b>
                  <span>{t(TEXT.sourceNote)}</span>
                </div>
              </>
            ) : (
              <PendingBlock poem={poem} which="translation" refs={refs} />
            )}
          </div>

          {/* 外部检索 */}
          {!hasAny && (
            <div className="block">
              <div className="block-head">
                <div className="block-title">{t(TEXT.collation)}</div>
              </div>
              <div className="external-links">
                {refs.map((r) => (
                  <a key={r.url} className="ext-link" href={r.url} target="_blank" rel="noreferrer noopener">
                    {lang === 'hant' ? r.name.hant : r.name.hans}
                    {r.desc && (
                      <span style={{ color: 'var(--ink-4)', fontSize: '0.7rem' }}>
                        {lang === 'hant' ? r.desc.hant : r.desc.hans}
                      </span>
                    )}
                    <span className="arw">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 相关 */}
          {related.length > 0 && (
            <div className="block">
              <div className="block-head">
                <div className="block-title">{t(TEXT.sameAuthor)}</div>
                <Link
                  className="block-note"
                  to={`/author/${encodeURIComponent(author?.slug || poem.author)}`}
                  style={{ color: 'var(--ochre)' }}
                >
                  {t(TEXT.more)} →
                </Link>
              </div>
              <div className="poem-grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))' }}>
                {related.map((p) => (
                  <PoemCard key={p.id} poem={p} showLines={2} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function PendingBlock({
  which,
  refs,
}: {
  poem: Poem
  which: 'notes' | 'translation'
  refs: ReturnType<typeof poemRefs>
}) {
  const { t, lang } = useI18n()
  return (
    <div className="pending-box">
      <div className="pending-title">
        {which === 'notes' ? t(TEXT.notesPending) : t(TEXT.transPending)}
      </div>
      <div style={{ marginBottom: 4 }}>{t(TEXT.pendingTip)}</div>
      <div className="external-links">
        {refs.slice(0, 3).map((r) => (
          <a key={r.url} className="ext-link" href={r.url} target="_blank" rel="noreferrer noopener">
            {lang === 'hant' ? r.name.hant : r.name.hans}
            <span className="arw">↗</span>
          </a>
        ))}
      </div>
    </div>
  )
}
