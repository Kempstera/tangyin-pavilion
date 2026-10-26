import { useI18n } from '../lib/i18n'
import { TEXT } from '../lib/i18n'

export function Pager({
  page,
  total,
  size,
  onChange,
}: {
  page: number
  total: number
  size: number
  onChange: (p: number) => void
}) {
  const { t } = useI18n()
  const pages = Math.max(1, Math.ceil(total / size))
  if (pages <= 1) return null

  const nums: (number | '…')[] = []
  const push = (n: number | '…') => nums.push(n)
  const set = new Set<number>()
  set.add(1)
  set.add(pages)
  for (let i = page - 2; i <= page + 2; i++) if (i >= 1 && i <= pages) set.add(i)
  const sorted = [...set].sort((a, b) => a - b)
  let last = 0
  for (const n of sorted) {
    if (last && n - last > 1) push('…')
    push(n)
    last = n
  }

  return (
    <div className="pager">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} type="button">
        {t(TEXT.prev)}
      </button>
      {nums.map((n, i) =>
        n === '…' ? (
          <span key={`g${i}`} className="gap">
            …
          </span>
        ) : (
          <button
            key={n}
            className={n === page ? 'on' : ''}
            onClick={() => onChange(n)}
            type="button"
          >
            {n}
          </button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page >= pages} type="button">
        {t(TEXT.next)}
      </button>
    </div>
  )
}
