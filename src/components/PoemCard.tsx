import { Link } from 'react-router-dom'
import type { Poem } from '../lib/types'
import { useI18n } from '../lib/i18n'
import { genreText, poemAuthor, poemLines, poemShortTitle } from '../lib/text'

export function PoemCard({ poem, showLines = 3 }: { poem: Poem; showLines?: number }) {
  const { lang } = useI18n()
  const lines = poemLines(poem, lang).slice(0, showLines)

  return (
    <Link to={`/poem/${poem.id}`} className="poem-card">
      <div className="poem-card-title">{poemShortTitle(poem, lang)}</div>
      <div className="poem-card-author">
        {poemAuthor(poem, lang)}
        {poem.dynasty ? ` · ${lang === 'hant' ? '唐' : '唐'}` : ''}
      </div>
      <div className="poem-card-lines">
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      <div className="poem-card-foot">
        {poem.genre ? <span className="tag">{genreText(poem.genre, lang)}</span> : null}
        {poem.is_tang300 ? (
          <span className="tag tag-cinnabar">{lang === 'hant' ? '三百首' : '三百首'}</span>
        ) : null}
        <span style={{ marginLeft: 'auto' }}>{poem.char_count} 字</span>
      </div>
    </Link>
  )
}
