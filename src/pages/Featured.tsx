import { useEffect, useState } from 'react'
import { TEXT, useI18n } from '../lib/i18n'
import { getFeaturedPoems } from '../lib/api'
import type { Poem } from '../lib/types'
import { PoemCard } from '../components/PoemCard'

export function Featured() {
  const { t, lang } = useI18n()
  const [poems, setPoems] = useState<Poem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getFeaturedPoems(80)
      .then((p) => alive && setPoems(p))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  return (
    <main className="page">
      <div className="wrap">
        <div className="section-head" style={{ marginBottom: 10 }}>
          <h1 className="section-title" style={{ fontSize: '1.5rem' }}>
            {t(TEXT.featured)}
          </h1>
          <span className="section-sub">
            {lang === 'hant' ? '五萬七千餘首中，擇其尤者' : '五万七千余首中，择其尤者'}
          </span>
        </div>
        <p
          style={{
            fontSize: '0.82rem',
            color: 'var(--ink-4)',
            letterSpacing: '0.08em',
            marginBottom: 30,
            lineHeight: 1.9,
          }}
        >
          {lang === 'hant'
            ? '下列諸篇，皆家弦戶誦之作。原文依《全唐詩》底本，與今通行選本偶有異文，已於各篇之下標出。'
            : '下列诸篇，皆家弦户诵之作。原文依《全唐诗》底本，与今通行选本偶有异文，已于各篇之下标出。'}
        </p>

        <div className="poem-grid">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="poem-card">
                  <div className="skeleton loading-line" style={{ width: '56%' }} />
                  <div className="skeleton loading-line" style={{ width: '28%' }} />
                  <div className="skeleton loading-line" style={{ width: '90%' }} />
                </div>
              ))
            : poems.map((p) => <PoemCard key={p.id} poem={p} showLines={2} />)}
        </div>
      </div>
    </main>
  )
}
