import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SearchBox } from '../components/SearchBox'
import { PoemCard } from '../components/PoemCard'
import { Seal } from '../components/Seal'
import { TEXT, useI18n } from '../lib/i18n'
import { getDailyPoem, getFeaturedPoems, getMeta, listAuthors, randomPoemId } from '../lib/api'
import type { Author, MetaInfo, Poem } from '../lib/types'
import { authorName, poemAuthor, poemLines, poemShortTitle } from '../lib/text'

export function Home() {
  const { t, lang } = useI18n()
  const nav = useNavigate()
  const [meta, setMeta] = useState<MetaInfo | null>(null)
  const [featured, setFeatured] = useState<Poem[]>([])
  const [daily, setDaily] = useState<Poem | null>(null)
  const [poets, setPoets] = useState<Author[]>([])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const m = await getMeta()
        if (alive) setMeta(m)
      } catch { /* ignore */ }
      getFeaturedPoems(8).then((p) => alive && setFeatured(p)).catch(() => {})
      getDailyPoem().then((p) => alive && setDaily(p)).catch(() => {})
      listAuthors(1, 8).then((r) => alive && setPoets(r.authors)).catch(() => {})
    })()
    return () => { alive = false }
  }, [])

  const goRandom = async () => {
    const id = await randomPoemId()
    nav(`/poem/${id}`)
  }

  const totalText =
    lang === 'hant'
      ? (meta ? meta.total_poems.toLocaleString('en-US') : '57,418')
      : (meta ? meta.total_poems.toLocaleString('en-US') : '57,418')

  const portals = [
    { to: '/authors', mark: lang === 'hant' ? '人' : '人', name: TEXT.portalAuthor, desc: TEXT.portalAuthorDesc },
    { to: '/search?genre=' + encodeURIComponent(lang === 'hant' ? '五言律詩' : '五言律诗'), mark: lang === 'hant' ? '律' : '律', name: TEXT.portalGenre, desc: TEXT.portalGenreDesc },
    { to: '/search?only300=1', mark: lang === 'hant' ? '選' : '选', name: TEXT.portal300, desc: TEXT.portal300Desc },
    { to: '#random', mark: lang === 'hant' ? '卷' : '卷', name: TEXT.portalRandom, desc: TEXT.portalRandomDesc },
  ]

  return (
    <main>
      {/* ---------------- 卷首 ---------------- */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-couplet left">
            {lang === 'hant' ? '行到水窮處　坐看雲起時' : '行到水穷处　坐看云起时'}
          </div>
          <div className="hero-couplet right">
            {lang === 'hant' ? '江流天地外　山色有無中' : '江流天地外　山色有无中'}
          </div>

          <div className="hero-eyebrow fade-up">
            <span className="line" />
            <span>{lang === 'hant' ? '全唐詩' : '全唐诗'}</span>
            <span className="line" />
          </div>

          <h1 className="hero-title fade-up">
            {lang === 'hant' ? (
              <>唐<span className="accent">音</span>閣</>
            ) : (
              <>唐<span className="accent">音</span>阁</>
            )}
          </h1>

          <div className="hero-sub fade-up">{t(TEXT.heroSub)}</div>
          <div className="hero-count fade-up">
            {lang === 'hant' ? '收錄' : '收录'} <b>{totalText}</b>{' '}
            {lang === 'hant' ? '首，詩人' : '首，诗人'} <b>{meta ? meta.total_authors.toLocaleString('en-US') : '3,663'}</b>{' '}
            {lang === 'hant' ? '家' : '家'}
          </div>

          <div className="fade-up" style={{ animationDelay: '0.1s' }}>
            <SearchBox />
          </div>

          <div className="portals fade-up" style={{ animationDelay: '0.18s' }}>
            {portals.map((p) => (
              <div
                key={p.to}
                className="portal"
                role="link"
                tabIndex={0}
                onClick={() => (p.to === '#random' ? void goRandom() : nav(p.to))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') p.to === '#random' ? void goRandom() : nav(p.to)
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="portal-mark">{p.mark}</div>
                <div className="portal-name">{t(p.name)}</div>
                <div className="portal-desc">{t(p.desc)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- 数据 ---------------- */}
      <div className="wrap">
        <div className="stats-ribbon">
          <div className="stat-item">
            <div className="stat-num">{meta ? meta.total_poems.toLocaleString('en-US') : '—'}</div>
            <div className="stat-label">{t(TEXT.statPoems)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">{meta ? meta.total_authors.toLocaleString('en-US') : '—'}</div>
            <div className="stat-label">{t(TEXT.statPoets)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">{meta ? (meta.total_chars / 10000).toFixed(1) + ' 万' : '—'}</div>
            <div className="stat-label">{t(TEXT.statChars)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">289</div>
            <div className="stat-label">{t(TEXT.statYears)}</div>
          </div>
        </div>
      </div>

      {/* ---------------- 今日一诗 ---------------- */}
      {daily && (
        <div className="wrap">
          <section className="section">
            <div className="section-head">
              <h2 className="section-title">{lang === 'hant' ? '今日一詩' : '今日一诗'}</h2>
              <span className="section-sub">
                {new Date().toLocaleDateString(lang === 'hant' ? 'zh-TW' : 'zh-CN', {
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <Link to={`/poem/${daily.id}`} className="section-more">
                {t(TEXT.more)} →
              </Link>
            </div>

            <Link
              to={`/poem/${daily.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.15fr)',
                gap: 0,
                border: '1px solid var(--line-soft)',
                borderRadius: 3,
                overflow: 'hidden',
                background: 'var(--paper-raise)',
              }}
              className="daily-card"
            >
              <div
                style={{
                  padding: '44px 34px',
                  textAlign: 'center',
                  borderRight: '1px solid var(--line-soft)',
                  background:
                    'linear-gradient(160deg, rgba(243,231,217,0.5), rgba(251,248,241,0.2))',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '1.14rem',
                    letterSpacing: '0.14em',
                    marginBottom: 10,
                    color: 'var(--ink)',
                  }}
                >
                  {poemShortTitle(daily, lang)}
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    letterSpacing: '0.16em',
                    color: 'var(--ochre)',
                    marginBottom: 22,
                  }}
                >
                  {poemAuthor(daily, lang)}
                </div>
                <div style={{ fontSize: '1.02rem', lineHeight: 2.3, letterSpacing: '0.12em' }}>
                  {poemLines(daily, lang).map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
              </div>

              <div style={{ padding: '38px 34px', display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    fontSize: '0.72rem',
                    letterSpacing: '0.22em',
                    color: 'var(--ink-4)',
                    marginBottom: 14,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {daily.translation
                    ? t(TEXT.translation).toUpperCase()
                    : lang === 'hant'
                      ? '題解'
                      : '题解'}
                </div>
                <div
                  style={{
                    fontSize: '0.94rem',
                    lineHeight: 2.1,
                    color: 'var(--ink-2)',
                    textAlign: 'justify',
                    flex: 1,
                  }}
                >
                  {dailyTranslationPreview(daily, lang)}
                </div>
                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: '1px dashed var(--line-soft)',
                    fontSize: '0.72rem',
                    color: 'var(--ink-4)',
                    letterSpacing: '0.08em',
                  }}
                >
                  {daily.is_tang300
                    ? lang === 'hant'
                      ? '《唐詩三百首》所收'
                      : '《唐诗三百首》所收'
                    : daily.genre}
                  {' · '}
                  {lang === 'hant' ? '共' : '共'} {daily.char_count} {lang === 'hant' ? '字' : '字'}
                </div>
              </div>
            </Link>
          </section>
        </div>
      )}

      {/* ---------------- 名篇 ---------------- */}
      <div className="wrap">
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">{t(TEXT.featured)}</h2>
            <span className="section-sub">{t(TEXT.featuredSub)}</span>
            <Link to="/featured" className="section-more">
              {t(TEXT.more)} →
            </Link>
          </div>
          <div className="poem-grid">
            {featured.length
              ? featured.map((p) => <PoemCard key={p.id} poem={p} />)
              : Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="poem-card">
                    <div className="skeleton loading-line" style={{ width: '62%' }} />
                    <div className="skeleton loading-line" style={{ width: '32%' }} />
                    <div className="skeleton loading-line" style={{ width: '90%' }} />
                    <div className="skeleton loading-line" style={{ width: '78%' }} />
                  </div>
                ))}
          </div>
        </section>
      </div>

      {/* ---------------- 诗人 ---------------- */}
      <div className="wrap">
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">{t(TEXT.poetsSection)}</h2>
            <span className="section-sub">{t(TEXT.poetsSectionSub)}</span>
            <Link to="/authors" className="section-more">
              {t(TEXT.more)} →
            </Link>
          </div>
          <div className="author-grid">
            {poets.map((a) => (
              <Link key={a.id} to={`/author/${encodeURIComponent(a.slug)}`} className="author-card">
                <span className="author-avatar">{[...authorName(a, lang)][0]}</span>
                <span>
                  <div className="author-name">{authorName(a, lang)}</div>
                  <div className="author-count">
                    {a.poem_count} {t(TEXT.authorPoems)}
                  </div>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* ---------------- 题记 ---------------- */}
      <div className="wrap">
        <section className="section" style={{ textAlign: 'center', paddingBottom: 20 }}>
          <Seal text={lang === 'hant' ? '詩心' : '诗心'} size="md" />
          <p
            style={{
              marginTop: 24,
              fontSize: '0.94rem',
              lineHeight: 2.2,
              color: 'var(--ink-3)',
              letterSpacing: '0.14em',
              maxWidth: 620,
              margin: '24px auto 0',
            }}
          >
            {t(TEXT.heroLine)}
          </p>
        </section>
      </div>
    </main>
  )
}

function dailyTranslationPreview(p: Poem, lang: 'hans' | 'hant') {
  const tr = lang === 'hant' ? p.translation : p.translation_s || p.translation
  if (tr) return tr
  return lang === 'hant'
    ? '此篇譯註尚在整理中。全唐詩五萬七千餘首，非旦夕可竟；今先以原文與詩人小傳呈覽，並於篇末附權威檢索系統，以備對校。'
    : '此篇译注尚在整理中。全唐诗五万七千余首，非旦夕可竟；今先以原文与诗人小传呈览，并于篇末附权威检索系统，以备对校。'
}
