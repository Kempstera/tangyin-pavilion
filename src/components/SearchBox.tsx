import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { TEXT, useI18n } from '../lib/i18n'

const SAMPLES = [
  { hans: '春江花月夜', hant: '春江花月夜' },
  { hans: '李白', hant: '李白' },
  { hans: '大漠孤烟直', hant: '大漠孤煙直' },
  { hans: '登鹳雀楼', hant: '登鸛雀樓' },
]

export function SearchBox({ initial = '', autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const [q, setQ] = useState(initial)
  const nav = useNavigate()
  const { t, lang } = useI18n()

  const go = (v: string) => {
    const kw = v.trim()
    if (!kw) return
    nav(`/search?q=${encodeURIComponent(kw)}`)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    go(q)
  }

  return (
    <div className="search-box">
      <form className="search-field" onSubmit={onSubmit} role="search">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(TEXT.searchPlaceholder)}
          aria-label={t(TEXT.searchBtn)}
          autoFocus={autoFocus}
          enterKeyHint="search"
        />
        <button className="search-btn" type="submit">
          {t(TEXT.searchBtn)}
        </button>
      </form>
      <div className="search-hints">
        <span style={{ opacity: 0.7 }}>{t(TEXT.tryLabel)}</span>
        {SAMPLES.map((s) => {
          const v = lang === 'hant' ? s.hant : s.hans
          return (
            <button key={v} type="button" className="chip" onClick={() => go(v)}>
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}
